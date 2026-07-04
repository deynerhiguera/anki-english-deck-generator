import { exec } from 'node:child_process';
import { promisify } from 'node:util';
import { clipboard } from 'electron';

const execAsync = promisify(exec);

const MAX_TEXT_LEN = 500;
const COPY_SETTLE_MS = 220;

const SENTINEL_PREFIX = '__ANKIBUILDER_SELECTION_PROBE_';

function makeSentinel(): string {
  return `${SENTINEL_PREFIX}${Date.now()}_${Math.random().toString(36).slice(2, 10)}__`;
}

function isSentinel(text: string): boolean {
  return text.startsWith(SENTINEL_PREFIX);
}

export type CaptureMethod = 'accessibility' | 'keystroke' | 'keycode';

export interface CaptureResult {
  text: string | null;
  reason?: 'empty' | 'no-selection' | 'permission' | 'unsupported' | 'error';
  message?: string;
  method?: CaptureMethod;
}

function isUnsupportedPlatform(): boolean {
  return process.platform !== 'darwin';
}

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function isPermissionError(message: string): boolean {
  return /not allowed|assistive|accessibility|-1743|-1000|-1002/i.test(message);
}

async function runOsascript(script: string): Promise<string> {
  const command = `osascript <<'ANKISCRIPT'\n${script}\nANKISCRIPT`;
  try {
    const { stdout } = await execAsync(command, {
      timeout: 2000,
      shell: '/bin/bash',
    });
    return stdout;
  } catch (err) {
    const message = (err as Error).message ?? '';
    if (isPermissionError(message)) {
      throw new Error('accessibility_permission_denied');
    }
    throw err;
  }
}

async function tryReadSelectedTextViaAX(): Promise<string | null> {
  const script = `tell application "System Events"
  try
    set frontApp to (first application process whose frontmost is true)
    tell frontApp
      try
        return value of attribute "AXSelectedText" of focused UI element
      on error
        return ""
      end try
    end tell
  on error
    return ""
  end try
end tell`;

  try {
    const result = await runOsascript(script);
    const trimmed = result.trim();
    return trimmed.length > 0 ? trimmed : null;
  } catch (err) {
    if ((err as Error).message === 'accessibility_permission_denied') {
      throw err;
    }
    return null;
  }
}

async function triggerCopyViaKeystroke(): Promise<void> {
  await runOsascript(`tell application "System Events" to keystroke "c" using {command down}`);
}

async function triggerCopyViaKeyCode(): Promise<void> {
  await runOsascript(`tell application "System Events" to key code 8 using {command down}`);
}

function normalizeText(raw: string): string {
  const firstLine = raw.split(/\r?\n/)[0]?.trim() ?? raw.trim();
  return firstLine.length > MAX_TEXT_LEN ? firstLine.slice(0, MAX_TEXT_LEN) : firstLine;
}

function permissionDeniedResult(): CaptureResult {
  return {
    text: null,
    reason: 'permission',
    message:
      'macOS Accessibility permission is required to capture selected text. Grant it in System Settings → Privacy & Security → Accessibility, then try again.',
  };
}

export async function captureSelectedText(): Promise<CaptureResult> {
  if (isUnsupportedPlatform()) {
    return {
      text: null,
      reason: 'unsupported',
      message: 'Selection capture is only supported on macOS.',
    };
  }

  try {
    const axText = await tryReadSelectedTextViaAX();
    if (axText) {
      const normalized = normalizeText(axText);
      if (normalized) {
        return { text: normalized, method: 'accessibility' };
      }
    }
  } catch (err) {
    if ((err as Error).message === 'accessibility_permission_denied') {
      return permissionDeniedResult();
    }
  }

  const previous = clipboard.readText();
  const sentinel = makeSentinel();
  clipboard.writeText(sentinel);

  let captured: string | null = null;
  let method: CaptureMethod | null = null;

  const tryCopy = async (attempt: () => Promise<void>, m: CaptureMethod): Promise<void> => {
    try {
      await attempt();
    } catch (err) {
      if ((err as Error).message === 'accessibility_permission_denied') {
        throw err;
      }
      return;
    }
    await delay(COPY_SETTLE_MS);
    const after = clipboard.readText().trim();
    if (after.length === 0 || isSentinel(after)) {
      return;
    }
    captured = after;
    method = m;
  };

  try {
    await tryCopy(triggerCopyViaKeystroke, 'keystroke');
    if (!captured) {
      await tryCopy(triggerCopyViaKeyCode, 'keycode');
    }
  } catch (err) {
    if ((err as Error).message === 'accessibility_permission_denied') {
      if (previous) clipboard.writeText(previous);
      else clipboard.clear();
      return permissionDeniedResult();
    }
  }

  if (previous) clipboard.writeText(previous);
  else clipboard.clear();

  if (!captured) {
    if (previous) {
      return {
        text: null,
        reason: 'no-selection',
        message:
          'Could not detect a new selection. Make sure text is highlighted in the focused app, then try again.',
      };
    }
    return {
      text: null,
      reason: 'empty',
      message: 'No text selected. Highlight something first, then press the shortcut.',
    };
  }

  const normalized = normalizeText(captured);
  if (!normalized) {
    return {
      text: null,
      reason: 'empty',
      message: 'No text selected. Highlight something first, then press the shortcut.',
    };
  }

  return { text: normalized, method: method ?? 'keystroke' };
}

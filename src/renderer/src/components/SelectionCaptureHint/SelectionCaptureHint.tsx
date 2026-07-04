import { useState } from 'react';
import { SELECTION_CAPTURE_SHORTCUT } from '@shared/constants';
import './SelectionCaptureHint.css';

function formatShortcut(acc: string): string {
  return acc
    .replace('CommandOrControl', '⌘')
    .replace('Shift', '⇧')
    .replace('Alt', '⌥')
    .replace('Option', '⌥')
    .replace('Command', '⌘')
    .replace('Control', '⌃')
    .replace(/\+/g, '');
}

function platformSupported(): boolean {
  if (typeof navigator === 'undefined') return false;
  return /Mac|iPod|iPhone|iPad/.test(navigator.platform);
}

export function SelectionCaptureHint(): JSX.Element | null {
  const [isMac] = useState<boolean>(platformSupported);
  const [shortcut] = useState<string>(formatShortcut(SELECTION_CAPTURE_SHORTCUT));

  if (!isMac) {
    return (
      <div className="selection-hint selection-hint-unsupported">
        Selection capture shortcut is only available on macOS.
      </div>
    );
  }

  return (
    <div className="selection-hint">
      <span className="selection-hint-kbd">{shortcut}</span>
      <span className="selection-hint-text">
        Highlight any text anywhere on your Mac and press {shortcut} — a card is built and saved to Anki silently in the background. A native macOS notification confirms the result.
      </span>
    </div>
  );
}

import { useEffect, useState } from 'react';
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
  const [needsPermission, setNeedsPermission] = useState(false);

  useEffect(() => {
    const off = window.ankiBuilder.card.onSelectionCaptureError((evt) => {
      if (evt.reason === 'permission') {
        setNeedsPermission(true);
      }
    });
    return off;
  }, []);

  if (!isMac) {
    return (
      <div className="selection-hint selection-hint-unsupported">
        Selection capture shortcut is only available on macOS.
      </div>
    );
  }

  return (
    <div
      className={`selection-hint${needsPermission ? ' selection-hint-warn' : ''}`}
    >
      <span className="selection-hint-kbd">{shortcut}</span>
      <span className="selection-hint-text">
        Highlight any text on your Mac and press {shortcut} to start building a card.
      </span>
      {needsPermission && (
        <span className="selection-hint-perm">
          macOS Accessibility permission is required. Grant it in
          System Settings → Privacy & Security → Accessibility, then retry.
        </span>
      )}
    </div>
  );
}

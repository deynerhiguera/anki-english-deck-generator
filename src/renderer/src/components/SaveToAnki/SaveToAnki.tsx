import type { Card } from '@shared/domain/Card';
import { useAppConfig } from '@renderer/hooks/useAppConfig';
import './SaveToAnki.css';

export interface SaveToAnkiProps {
  card: Card;
  onSave(): void;
  busy: boolean;
}

export function SaveToAnki({ onSave, busy }: SaveToAnkiProps): JSX.Element {
  const { config } = useAppConfig();
  const deckName = config?.ankiDeckName ?? '...';

  return (
    <div className="save-to-anki">
      <button
        className="save-to-anki-button"
        disabled={busy}
        onClick={onSave}
      >
        {busy ? 'Saving…' : 'Save to Anki'}
      </button>
      <span className="save-to-anki-hint">
        Adds to deck <code>{deckName}</code>.
      </span>
    </div>
  );
}

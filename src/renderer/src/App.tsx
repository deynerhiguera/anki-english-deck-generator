import { useEffect, useState } from 'react';
import type { AppReadyResponse } from '@shared/types/ipc';
import { ConnectionStatus } from '@renderer/components/ConnectionStatus/ConnectionStatus';
import { ModelFields } from '@renderer/components/ConnectionStatus/ModelFields';
import { WordInput } from '@renderer/components/WordInput/WordInput';
import { CardPreview } from '@renderer/components/CardPreview/CardPreview';
import { Toast, type ToastState } from '@renderer/components/Toast/Toast';
import { SelectionCaptureHint } from '@renderer/components/SelectionCaptureHint/SelectionCaptureHint';
import { useCardBuilder, type BuildSlot } from '@renderer/hooks/useCardBuilder';
import './styles/globals.css';

function truncateError(msg: string, max = 140): string {
  if (msg.length <= max) return msg;
  return msg.slice(0, max - 1) + '…';
}

function App(): JSX.Element {
  const [appInfo, setAppInfo] = useState<AppReadyResponse | null>(null);
  const [toast, setToast] = useState<ToastState | null>(null);
  const builder = useCardBuilder();

  useEffect(() => {
    let cancelled = false;
    void window.ankiBuilder.app.ready().then((info) => {
      if (!cancelled) setAppInfo(info);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    const okCount = builder.queue.filter((s) => s.status === 'done' && s.noteId !== undefined).length;
    const failCount = builder.queue.filter((s) => s.status === 'failed').length;
    if (okCount + failCount === builder.queue.length && builder.queue.length > 0 && !builder.busy) {
      if (okCount > 0 && failCount === 0) {
        setToast({
          kind: 'success',
          message: `Auto-saved ${okCount} card${okCount === 1 ? '' : 's'} to Anki.`,
        });
        return;
      }

      const firstFail = builder.queue.find((s) => s.status === 'failed');
      const reason = truncateError(firstFail?.error ?? 'unknown error');

      if (okCount > 0 && failCount > 0) {
        setToast({
          kind: 'error',
          message: `${okCount} saved, ${failCount} failed. Reason: ${reason}`,
        });
      } else if (failCount > 0) {
        setToast({
          kind: 'error',
          message: `All ${failCount} card${failCount === 1 ? '' : 's'} failed: ${reason}`,
        });
      }
    }
  }, [builder.queue, builder.busy]);

  const doneSlots = builder.queue.filter((s) => s.status === 'done' && s.card);

  return (
    <div className="app-shell">
      <header>
        <h1>Personal AI Anki Builder</h1>
        <p>Local-first vocabulary assistant · cards auto-save to Anki</p>
      </header>
      <main>
        <div className="status-row">
          <span className={`status-dot ${appInfo ? 'ok' : ''}`} />
          <span>
            {appInfo
              ? `${appInfo.appName} v${appInfo.version} — ready`
              : 'Initializing…'}
          </span>
        </div>

        <section>
          <h2 className="section-title">Anki</h2>
          <ConnectionStatus />
          <ModelFields />
        </section>

        <section>
          <h2 className="section-title">Generate cards</h2>
          <WordInput
            onGenerate={(words) => builder.start(words)}
            busy={builder.busy}
          />
          <SelectionCaptureHint />
        </section>

        {builder.queue.length > 0 && (
          <section>
            <h2 className="section-title">Progress</h2>
            <ul className="progress-list">
              {builder.queue.map((slot) => (
                <li key={slot.word} className={`progress-row progress-${slot.status}`}>
                  <span className="progress-word">{slot.word}</span>
                  <span className="progress-stage">
                    {slot.status === 'pending' && 'queued'}
                    {slot.status === 'building' && describeStage(slot.stage)}
                    {slot.status === 'done' && (slot.noteId !== undefined ? `saved ✓ (id ${slot.noteId})` : 'done')}
                    {slot.status === 'failed' && (slot.error ?? 'failed')}
                  </span>
                </li>
              ))}
            </ul>
          </section>
        )}

        {doneSlots.length > 0 && (
          <section>
            <h2 className="section-title">Cards</h2>
            {doneSlots.map((slot) => (
              <CardRow
                key={slot.word}
                slot={slot}
                onRetry={() => void builder.retrySave(slot.word)}
              />
            ))}
          </section>
        )}

        <div className="phase-banner">
          <strong>Phase 4 — Background selection capture.</strong> Highlight any text anywhere on macOS and press <kbd>⌘⇧A</kbd>. A card is built and saved to Anki silently — no window focus, no UI changes, just a native macOS notification on the result. Audio generated with nova voice, mirrored in <code>./media/</code>, copied to Anki's <code>collection.media/</code>.
        </div>
      </main>
      <Toast toast={toast} onDismiss={() => setToast(null)} />
    </div>
  );
}

function describeStage(stage: BuildSlot['stage']): string {
  switch (stage) {
    case 'prompt':
    case 'content':
      return 'generating content…';
    case 'audio:word':
    case 'audio:example':
      return 'generating audio…';
    case 'storage':
    case 'media-sync':
      return 'saving audio…';
    case 'anki-add':
      return 'saving to Anki…';
    case 'failed':
      return 'failed';
    default:
      return 'building…';
  }
}

interface CardRowProps {
  slot: BuildSlot;
  onRetry(): void;
}

function CardRow({ slot, onRetry }: CardRowProps): JSX.Element | null {
  if (!slot.card) return null;
  const isSaved = slot.noteId !== undefined;
  return (
    <div className="card-row">
      <CardPreview card={slot.card} />
      <div className="card-row-actions">
        {isSaved ? (
          <span className="saved-badge">✓ Saved to Anki (note id {slot.noteId})</span>
        ) : (
          <button
            className="retry-save-button"
            onClick={onRetry}
          >
            Retry save
          </button>
        )}
      </div>
    </div>
  );
}

export default App;

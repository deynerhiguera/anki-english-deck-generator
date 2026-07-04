import { useAnkiConnection } from '@renderer/hooks/useAnkiConnection';
import './ConnectionStatus.css';

export function ConnectionStatus(): JSX.Element {
  const { state, retest } = useAnkiConnection(true);

  if (state.status === 'idle' || state.status === 'checking') {
    return (
      <div className="conn-row">
        <span className="status-dot" />
        <span className="conn-label">Checking Anki connection…</span>
      </div>
    );
  }

  if (state.status === 'ok') {
    return (
      <div className="conn-row">
        <span className="status-dot ok" />
        <span className="conn-label">
          Anki connected{state.version !== undefined ? ` · AnkiConnect v${state.version}` : ''}
        </span>
        <button className="conn-button" onClick={() => void retest()}>
          Re-test
        </button>
      </div>
    );
  }

  return (
    <div className="conn-row error">
      <span className="status-dot error" />
      <span className="conn-label">
        {state.error ?? 'Could not reach Anki.'}
      </span>
      <button className="conn-button" onClick={() => void retest()}>
        Retry
      </button>
    </div>
  );
}

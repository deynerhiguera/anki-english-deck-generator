import { useCallback, useEffect, useState } from 'react';

export interface AnkiConnectionState {
  status: 'idle' | 'checking' | 'ok' | 'error';
  version?: number;
  error?: string;
}

export interface UseAnkiConnection {
  state: AnkiConnectionState;
  retest: () => Promise<void>;
}

export function useAnkiConnection(autoStart = true): UseAnkiConnection {
  const [state, setState] = useState<AnkiConnectionState>({ status: 'idle' });

  const retest = useCallback(async (): Promise<void> => {
    setState({ status: 'checking' });
    const result = await window.ankiBuilder.anki.testConnection();
    if (result.ok) {
      setState({ status: 'ok', version: result.version });
    } else {
      setState({ status: 'error', error: result.error });
    }
  }, []);

  useEffect(() => {
    if (autoStart) {
      void retest();
    }
  }, [autoStart, retest]);

  return { state, retest };
}

import { useEffect, useState } from 'react';
import type { AppConfig } from '@shared/types/ipc';

export interface UseAppConfig {
  config: AppConfig | null;
  loading: boolean;
  refresh(): Promise<void>;
}

export function useAppConfig(): UseAppConfig {
  const [config, setConfig] = useState<AppConfig | null>(null);
  const [loading, setLoading] = useState(false);

  const refresh = async (): Promise<void> => {
    setLoading(true);
    try {
      const c = await window.ankiBuilder.app.getConfig();
      setConfig(c);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void refresh();
  }, []);

  return { config, loading, refresh };
}

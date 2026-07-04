import { useEffect, useState } from 'react';
import { useAnkiConnection } from '@renderer/hooks/useAnkiConnection';
import { useAppConfig } from '@renderer/hooks/useAppConfig';
import './ModelFields.css';

export function ModelFields(): JSX.Element | null {
  const { state: anki } = useAnkiConnection(true);
  const { config } = useAppConfig();
  const [fields, setFields] = useState<string[] | null>(null);
  const [error, setError] = useState<string | undefined>();
  const [loading, setLoading] = useState(false);

  const modelName = config?.ankiModelName;

  useEffect(() => {
    if (anki.status !== 'ok' || !modelName) {
      setFields(null);
      return;
    }
    let cancelled = false;
    setLoading(true);
    setError(undefined);
    void window.ankiBuilder.anki
      .getModelFields({ modelName })
      .then((res) => {
        if (cancelled) return;
        if (res.ok) {
          setFields(res.fieldNames ?? []);
          setError(undefined);
        } else {
          setFields(null);
          setError(res.error);
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [anki.status, modelName]);

  if (anki.status !== 'ok' || !modelName) return null;

  return (
    <div className="model-fields">
      <div className="model-fields-header">
        <strong>Model:</strong> <code>{modelName}</code>
      </div>
      {loading && <div className="model-fields-loading">Loading fields…</div>}
      {error && <div className="model-fields-error">{error}</div>}
      {fields && (
        <ul className="model-fields-list">
          {fields.map((f) => (
            <li key={f}>
              <code>{f}</code>
            </li>
          ))}
        </ul>
      )}
      {fields && fields.length === 0 && <div className="model-fields-empty">No fields returned.</div>}
    </div>
  );
}

import { useCallback, useEffect, useState } from 'react';
import type { Card } from '@shared/domain/Card';
import type { ProgressEvent } from '@shared/types/progress';

export interface BuildSlot {
  word: string;
  status: 'pending' | 'building' | 'done' | 'failed';
  card?: Card;
  noteId?: number;
  error?: string;
  stage?: ProgressEvent['stage'];
}

export interface UseCardBuilder {
  queue: BuildSlot[];
  busy: boolean;
  start(words: string[]): void;
  addWord(word: string): void;
  reset(): void;
  retrySave(word: string): Promise<void>;
}

const MAX_CONCURRENCY = 1;

export function useCardBuilder(): UseCardBuilder {
  const [queue, setQueue] = useState<BuildSlot[]>([]);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    const off = window.ankiBuilder.card.onProgress((evt) => {
      setQueue((prev) =>
        prev.map((slot) =>
          slot.word === evt.word
            ? {
                ...slot,
                stage: evt.stage,
                status: evt.ok && evt.stage === 'done' ? 'done' : 'building',
              }
            : slot,
        ),
      );
    });
    return off;
  }, []);

  const runOne = useCallback(async (word: string) => {
    setQueue((prev) =>
      prev.map((slot) => (slot.word === word ? { ...slot, status: 'building' } : slot)),
    );
    const result = await window.ankiBuilder.card.generate({ word });
    setQueue((prev) =>
      prev.map((slot) =>
        slot.word === word
          ? result.ok
            ? {
                ...slot,
                status: 'done',
                card: result.card,
                noteId: result.card?.noteId,
                error: undefined,
              }
            : { ...slot, status: 'failed', error: result.error }
          : slot,
      ),
    );
  }, []);

  const start = useCallback(
    (words: string[]) => {
      const initial: BuildSlot[] = words.map((w) => ({ word: w, status: 'pending' }));
      setQueue(initial);
      setBusy(true);

      void (async () => {
        const pool = [...words];
        const workers: Promise<void>[] = [];
        for (let i = 0; i < MAX_CONCURRENCY; i++) {
          workers.push(
            (async () => {
              while (pool.length > 0) {
                const next = pool.shift();
                if (!next) return;
                await runOne(next);
              }
            })(),
          );
        }
        await Promise.all(workers);
        setBusy(false);
      })();
    },
    [runOne],
  );

  const addWord = useCallback(
    (word: string) => {
      const trimmed = word.trim();
      if (!trimmed) return;
      start([trimmed]);
    },
    [start],
  );

  const retrySave = useCallback(async (word: string): Promise<void> => {
    const slot = queue.find((s) => s.word === word);
    if (!slot?.card) return;
    setQueue((prev) =>
      prev.map((s) =>
        s.word === word ? { ...s, status: 'building', stage: 'anki-add', error: undefined } : s,
      ),
    );
    const result = await window.ankiBuilder.anki.addNote({ card: slot.card });
    setQueue((prev) =>
      prev.map((s) =>
        s.word === word
          ? result.ok
            ? {
                ...s,
                status: 'done',
                noteId: result.noteId,
                card: { ...(s.card as Card), noteId: result.noteId },
                error: undefined,
              }
            : { ...s, status: 'failed', error: result.error }
          : s,
      ),
    );
  }, [queue]);

  const reset = useCallback(() => {
    setQueue([]);
    setBusy(false);
  }, []);

  return { queue, busy, start, addWord, reset, retrySave };
}

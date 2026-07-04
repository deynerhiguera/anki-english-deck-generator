import { useState } from 'react';
import './WordInput.css';

export interface WordInputProps {
  onGenerate(words: string[]): void;
  busy: boolean;
}

export function WordInput({ onGenerate, busy }: WordInputProps): JSX.Element {
  const [text, setText] = useState('');

  const words = text
    .split(/[\n,]/)
    .map((w) => w.trim())
    .filter((w) => w.length > 0);

  const canSubmit = words.length > 0 && !busy;

  return (
    <div className="word-input">
      <label className="word-input-label" htmlFor="word-input-area">
        Words or expressions
      </label>
      <textarea
        id="word-input-area"
        className="word-input-textarea"
        placeholder="One per line, e.g.&#10;to stick to&#10;forge&#10;auto-renewal&#10;occupy"
        value={text}
        onChange={(e) => setText(e.target.value)}
        rows={6}
        disabled={busy}
      />
      <div className="word-input-row">
        <span className="word-input-count">
          {words.length} {words.length === 1 ? 'word' : 'words'} ready
        </span>
        <button
          className="word-input-submit"
          disabled={!canSubmit}
          onClick={() => onGenerate(words)}
        >
          {busy ? 'Generating…' : 'Generate card'}
        </button>
      </div>
    </div>
  );
}

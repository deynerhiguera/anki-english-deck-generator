import type { Card } from '@shared/domain/Card';
import './CardPreview.css';

export interface CardPreviewProps {
  card: Card;
}

export function CardPreview({ card }: CardPreviewProps): JSX.Element {
  return (
    <div className="card-preview">
      <div className="card-preview-row">
        <span className="card-preview-label">Word</span>
        <span className="card-preview-value">{card.word}</span>
      </div>
      <div className="card-preview-row">
        <span className="card-preview-label">IPA</span>
        <span className="card-preview-value mono">{card.ipa}</span>
      </div>
      <div className="card-preview-row">
        <span className="card-preview-label">Meaning</span>
        <span className="card-preview-value">{card.meaning}</span>
      </div>
      <div className="card-preview-row">
        <span className="card-preview-label">Example</span>
        <span className="card-preview-value">{card.example}</span>
      </div>
      <div className="card-preview-row">
        <span className="card-preview-label">Cloze</span>
        <span className="card-preview-value mono" dangerouslySetInnerHTML={{ __html: renderCloze(card.cloze) }} />
      </div>
      <div className="card-preview-row">
        <span className="card-preview-label">Audio</span>
        <span className="card-preview-value mono">{card.soundFilename}</span>
      </div>
    </div>
  );
}

function renderCloze(cloze: string): string {
  const escaped = cloze.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  return escaped.replace(/_{3,}/g, '<span class="cloze-blank">______</span>');
}

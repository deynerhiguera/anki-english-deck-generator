export interface Card {
  word: string;
  ipa: string;
  meaning: string;
  example: string;
  cloze: string;
  soundFilename: string;
  /** Audio of the word alone (Anki 'Sound' field). Optional for older cards. */
  wordSoundFilename?: string;
  noteId?: number;
}

export type CardField = keyof Card;

export const CARD_FIELDS: readonly CardField[] = [
  'word',
  'ipa',
  'meaning',
  'example',
  'cloze',
  'soundFilename',
  'wordSoundFilename',
  'noteId',
] as const;

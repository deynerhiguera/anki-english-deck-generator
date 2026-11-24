import type { Card } from '@shared/domain/Card';

export interface AnkiFieldMapperOptions {
  modelFieldNames: string[];
}

export interface MappedFields {
  fields: Record<string, string>;
  missing: string[];
}

const FIELD_ALIASES: Record<string, string[]> = {
  Word: ['Word', 'word', 'Term'],
  Sound: ['Sound', 'sound'],
  Sound_Example: ['Sound_Example', 'Sound Example', 'Sound example', 'sound_example'],
  Meaning: ['Meaning', 'meaning', 'Definition'],
  Example: ['Example', 'example', 'Sentence'],
  IPA: ['IPA', 'ipa', 'Pronunciation'],
  Cloze: ['Cloze', 'cloze', 'Cloze Sentence'],
};

export class AnkiFieldMapper {
  buildFields(card: Card, opts: AnkiFieldMapperOptions): MappedFields {
    const available = new Set(opts.modelFieldNames);
    const fields: Record<string, string> = {};
    const missing: string[] = [];

    const setIfPresent = (logicalName: keyof typeof FIELD_ALIASES, value: string) => {
      const aliases = FIELD_ALIASES[logicalName];
      const matched = aliases.find((a) => available.has(a));
      if (matched) {
        fields[matched] = value;
      } else {
        missing.push(logicalName);
      }
    };

    setIfPresent('Word', card.word);
    setIfPresent('Sound', card.wordSoundFilename ? `[sound:${card.wordSoundFilename}]` : '');
    setIfPresent('Sound_Example', `[sound:${card.soundFilename}]`);
    setIfPresent('Meaning', card.meaning);
    setIfPresent('Example', card.example);
    setIfPresent('IPA', card.ipa);
    setIfPresent('Cloze', card.cloze);

    return { fields, missing };
  }
}

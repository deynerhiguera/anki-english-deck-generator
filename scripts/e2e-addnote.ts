import { config } from 'dotenv';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { OpenAIClient } from '../src/main/infrastructure/openai/OpenAIClient';
import { AnkiClient } from '../src/main/infrastructure/anki/AnkiClient';
import { AudioStorage } from '../src/main/infrastructure/storage/AudioStorage';
import { AnkiMediaSync } from '../src/main/infrastructure/storage/AnkiMediaSync';
import { PromptBuilder } from '../src/main/services/PromptBuilder';
import { CardBuilder } from '../src/main/services/CardBuilder';
import { AnkiFieldMapper } from '../src/main/services/AnkiFieldMapper';
import { DefaultCardValidator } from '../src/shared/domain/CardValidator';

const __dirname = fileURLToPath(new URL('.', import.meta.url));
config({ path: resolve(__dirname, '../.env') });

const log = (...args: unknown[]) => console.log('[e2e]', ...args);

const anki = new AnkiClient({ baseUrl: process.env.ANKI_CONNECT_URL! });
const openai = new OpenAIClient({ apiKey: process.env.OPENAI_API_KEY!, model: process.env.OPENAI_MODEL! });
const cardBuilder = new CardBuilder({
  openai,
  promptBuilder: new PromptBuilder(),
  audioStorage: new AudioStorage({ mediaDir: resolve(__dirname, '../media') }),
  mediaSync: new AnkiMediaSync(),
  validator: new DefaultCardValidator('lenient'),
  tts: { voice: process.env.OPENAI_TTS_VOICE!, model: process.env.OPENAI_TTS_MODEL! },
});

(async () => {
  const word = 'to ship';
  log('Building card for:', word);
  const card = await cardBuilder.build(word, (stage, ok, msg) => {
    log(`  [${stage}]`, ok ? 'ok' : 'fail', msg ?? '');
  });
  log('Card built:');
  log('  Word:    ', card.word);
  log('  Meaning: ', card.meaning);
  log('  Example: ', card.example);

  const fieldNames = await anki.modelFieldNames(process.env.ANKI_MODEL_NAME!);
  const mapped = new AnkiFieldMapper().buildFields(card, { modelFieldNames: fieldNames });
  log('Mapped fields:', Object.keys(mapped.fields).join(', '));

  log('Calling AnkiConnect addNote...');
  const noteId = await anki.addNote({
    deckName: process.env.ANKI_DECK_NAME!,
    modelName: process.env.ANKI_MODEL_NAME!,
    fields: mapped.fields,
    tags: ['auto-generated', 'smoke-test'],
    options: { allowDuplicate: false, duplicateScope: 'deck' },
  });

  if (noteId === null) {
    log('FAILED: AnkiConnect returned null (probably duplicate).');
    process.exit(2);
  }
  log('SUCCESS! Note id:', noteId);
  log('Open Anki and search for "to nail" in deck "English Automatic".');
})().catch((err) => {
  console.error('[e2e] FAILED:', err);
  process.exit(1);
});

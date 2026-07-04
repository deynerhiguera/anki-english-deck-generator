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

const log = (...args: unknown[]) => console.log('[smoke]', ...args);

async function runSmoke(): Promise<void> {
  log('1. Loading env...');
  const env = {
    OPENAI_API_KEY: process.env.OPENAI_API_KEY ?? '',
    OPENAI_MODEL: process.env.OPENAI_MODEL ?? 'gpt-4o',
    OPENAI_TTS_VOICE: process.env.OPENAI_TTS_VOICE ?? 'nova',
    OPENAI_TTS_MODEL: process.env.OPENAI_TTS_MODEL ?? 'tts-1',
    ANKI_CONNECT_URL: process.env.ANKI_CONNECT_URL ?? 'http://127.0.0.1:8765',
    ANKI_DECK_NAME: process.env.ANKI_DECK_NAME ?? 'English Automatic',
    ANKI_MODEL_NAME: process.env.ANKI_MODEL_NAME ?? 'English Automatic',
  };
  if (!env.OPENAI_API_KEY) throw new Error('OPENAI_API_KEY not set in .env');
  log('  env loaded, model:', env.OPENAI_MODEL);

  log('2. AnkiConnect ping...');
  const anki = new AnkiClient({ baseUrl: env.ANKI_CONNECT_URL });
  const version = await anki.version();
  log('  AnkiConnect version:', version);

  log('3. Fetch model fields for', env.ANKI_MODEL_NAME);
  const fieldNames = await anki.modelFieldNames(env.ANKI_MODEL_NAME);
  log('  fields:', fieldNames.join(', '));

  log('4. Build card for word "to debug" (text pipeline only)...');
  const openai = new OpenAIClient({ apiKey: env.OPENAI_API_KEY, model: env.OPENAI_MODEL });
  const promptBuilder = new PromptBuilder();
  const validator = new DefaultCardValidator('lenient');
  const audioStorage = new AudioStorage({ mediaDir: resolve(__dirname, '../media') });
  const mediaSync = new AnkiMediaSync();

  const cardBuilder = new CardBuilder({
    openai,
    promptBuilder,
    audioStorage,
    mediaSync,
    validator,
    tts: { voice: env.OPENAI_TTS_VOICE, model: env.OPENAI_TTS_MODEL },
  });

  const card = await cardBuilder.build('to debug', (stage, ok, msg) => {
    log(`  [${stage}]`, ok ? 'ok' : 'fail', msg ?? '');
  });

  log('5. Generated card:');
  log('   word:    ', card.word);
  log('   ipa:     ', card.ipa);
  log('   meaning: ', card.meaning);
  log('   example: ', card.example);
  log('   cloze:   ', card.cloze);
  log('   audio:   ', card.soundFilename);

  log('6. Map to Anki fields...');
  const mapper = new AnkiFieldMapper();
  const mapped = mapper.buildFields(card, { modelFieldNames: fieldNames });
  log('  fields:', Object.keys(mapped.fields).join(', '));
  if (mapped.missing.length) log('  missing:', mapped.missing.join(', '));
  log('  Sound_Example content:', mapped.fields['Sound_Example']);

  log('7. Smoke ok. Card ready for addNote.');
  log('   (Not calling addNote because this is a read-only smoke test.)');
}

runSmoke().catch((err) => {
  console.error('[smoke] FAILED:', err);
  process.exit(1);
});

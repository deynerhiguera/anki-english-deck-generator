import { config } from 'dotenv';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { OpenAIClient } from '../src/main/infrastructure/openai/OpenAIClient';
import { AnkiClient } from '../src/main/infrastructure/anki/AnkiClient';
import { AudioStorage } from '../src/main/infrastructure/storage/AudioStorage';
import { AnkiMediaSync } from '../src/main/infrastructure/storage/AnkiMediaSync';
import { PromptBuilder } from '../src/main/services/PromptBuilder';
import { CardBuilder } from '../src/main/services/CardBuilder';
import { DefaultCardValidator } from '../src/shared/domain/CardValidator';

const __dirname = fileURLToPath(new URL('.', import.meta.url));
config({ path: resolve(__dirname, '../.env') });

const log = (...args: unknown[]) => console.log('[e2e-autosave]', ...args);
const WORDS = ['to deploy', 'for the long haul'];
const DECK = 'English Automatic';
const MODEL = 'English Active Recall';

(async () => {
  const anki = new AnkiClient({ baseUrl: process.env.ANKI_CONNECT_URL! });
  const openai = new OpenAIClient({ apiKey: process.env.OPENAI_API_KEY!, model: process.env.OPENAI_MODEL! });
  const builder = new CardBuilder({
    openai,
    promptBuilder: new PromptBuilder(),
    audioStorage: new AudioStorage({ mediaDir: resolve(__dirname, '../media') }),
    mediaSync: new AnkiMediaSync(),
    validator: new DefaultCardValidator('lenient'),
    tts: { voice: process.env.OPENAI_TTS_VOICE!, model: process.env.OPENAI_TTS_MODEL! },
    ankiClient: anki,
    deckName: DECK,
    modelName: MODEL,
  });

  for (const word of WORDS) {
    log(`--- Building + auto-saving "${word}" ---`);
    const card = await builder.build(word, (stage, ok, msg) => {
      log(`  [${stage}]`, ok ? 'ok' : 'fail', msg ?? '');
    });
    log('  Word:    ', card.word);
    log('  Example: ', card.example);
    log('  Cloze:   ', card.cloze);
    log('  noteId:  ', card.noteId);
    if (card.noteId === undefined) {
      log('  FAIL: card did not get saved to Anki');
      process.exit(2);
    }
    log(`  ✓ Saved to Anki as note id ${card.noteId}`);
  }
  log('--- All cards auto-saved ---');
})().catch((err) => {
  console.error('[e2e-autosave] FAILED:', err);
  process.exit(1);
});

import { z } from 'zod';

const TTS_VOICES = ['alloy', 'echo', 'fable', 'onyx', 'nova', 'shimmer'] as const;

const EnvSchema = z.object({
  OPENAI_API_KEY: z
    .string()
    .min(20, 'OPENAI_API_KEY must be set. Copy .env.example to .env and fill it in.'),
  ANKI_CONNECT_URL: z
    .string()
    .url()
    .default('http://127.0.0.1:8765'),
  OPENAI_MODEL: z.string().default('gpt-4o'),
  OPENAI_TTS_VOICE: z.enum(TTS_VOICES).default('nova'),
  OPENAI_TTS_MODEL: z.string().default('tts-1'),
  ANKI_DECK_NAME: z.string().default('English Automatic'),
  ANKI_MODEL_NAME: z.string().default('English Automatic'),
  PROMPT_FILE_PATH: z.string().optional(),
});

export type Env = z.infer<typeof EnvSchema>;

let cached: Env | null = null;

export function loadEnv(): Env {
  if (cached) return cached;

  const raw: NodeJS.ProcessEnv = process.env;

  const parsed = EnvSchema.safeParse({
    OPENAI_API_KEY: raw.OPENAI_API_KEY,
    ANKI_CONNECT_URL: raw.ANKI_CONNECT_URL ?? undefined,
    OPENAI_MODEL: raw.OPENAI_MODEL ?? undefined,
    OPENAI_TTS_VOICE: raw.OPENAI_TTS_VOICE ?? undefined,
    OPENAI_TTS_MODEL: raw.OPENAI_TTS_MODEL ?? undefined,
    ANKI_DECK_NAME: raw.ANKI_DECK_NAME ?? undefined,
    ANKI_MODEL_NAME: raw.ANKI_MODEL_NAME ?? undefined,
    PROMPT_FILE_PATH: raw.PROMPT_FILE_PATH ?? undefined,
  });

  if (!parsed.success) {
    const issues = parsed.error.issues
      .map((issue) => `  • ${issue.path.join('.') || '(root)'}: ${issue.message}`)
      .join('\n');
    throw new Error(`Invalid environment configuration:\n${issues}`);
  }

  cached = parsed.data;
  return cached;
}

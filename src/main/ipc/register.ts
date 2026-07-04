import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { ipcMain, BrowserWindow } from 'electron';

const __dirname = fileURLToPath(new URL('.', import.meta.url));
import {
  IPC,
  type AnkiAddNoteRequest,
  type AnkiAddNoteResponse,
  type AnkiGetModelFieldsResponse,
  type AnkiTestConnectionResponse,
  type AppConfig,
  type AppReadyResponse,
  type CardGenerateRequest,
  type CardGenerateResponse,
} from '@shared/types/ipc';
import type { ProgressEvent } from '@shared/types/progress';
import { APP_NAME, APP_VERSION } from '@shared/constants';
import { loadEnv } from '../config/env';
import { AnkiClient } from '../infrastructure/anki/AnkiClient';
import { OpenAIClient } from '../infrastructure/openai/OpenAIClient';
import { AudioStorage } from '../infrastructure/storage/AudioStorage';
import { AnkiMediaSync } from '../infrastructure/storage/AnkiMediaSync';
import { PromptBuilder } from '../services/PromptBuilder';
import { CardBuilder } from '../services/CardBuilder';
import { AnkiFieldMapper } from '../services/AnkiFieldMapper';
import {
  AnkiAddNoteError,
  AnkiModelNotFoundError,
  AnkiNotRunningError,
  ConfigError,
  OpenAIAuthError,
  OpenAINetworkError,
  OpenAIRateLimitError,
  OpenAISchemaError,
  ValidationError,
  serializeError,
} from '@shared/domain/errors';
import { logger } from '../utils/logger';

let cachedAnkiClient: { url: string; client: AnkiClient } | null = null;
let cachedOpenAIClient: OpenAIClient | null = null;
let cachedPromptBuilder: PromptBuilder | null = null;
let cachedCardBuilder: CardBuilder | null = null;

function projectRoot(): string {
  return process.env.PROJECT_ROOT ?? resolve(__dirname, '../../..');
}

function getAnkiClient(): AnkiClient {
  const env = loadEnv();
  if (!cachedAnkiClient || cachedAnkiClient.url !== env.ANKI_CONNECT_URL) {
    cachedAnkiClient = { url: env.ANKI_CONNECT_URL, client: new AnkiClient({ baseUrl: env.ANKI_CONNECT_URL }) };
  }
  return cachedAnkiClient.client;
}

function getOpenAIClient(): OpenAIClient {
  if (cachedOpenAIClient) return cachedOpenAIClient;
  const env = loadEnv();
  cachedOpenAIClient = new OpenAIClient({ apiKey: env.OPENAI_API_KEY, model: env.OPENAI_MODEL });
  return cachedOpenAIClient;
}

function getPromptBuilder(): PromptBuilder {
  if (!cachedPromptBuilder) cachedPromptBuilder = new PromptBuilder();
  return cachedPromptBuilder;
}

function getCardBuilder(): CardBuilder {
  if (cachedCardBuilder) return cachedCardBuilder;
  const env = loadEnv();
  cachedCardBuilder = new CardBuilder({
    openai: getOpenAIClient(),
    promptBuilder: getPromptBuilder(),
    audioStorage: new AudioStorage({ mediaDir: resolve(projectRoot(), 'media') }),
    mediaSync: new AnkiMediaSync(),
    ankiClient: getAnkiClient(),
    deckName: env.ANKI_DECK_NAME,
    modelName: env.ANKI_MODEL_NAME,
    tts: { voice: env.OPENAI_TTS_VOICE, model: env.OPENAI_TTS_MODEL },
  });
  return cachedCardBuilder;
}

function sendProgress(win: BrowserWindow, event: ProgressEvent): void {
  if (!win.isDestroyed()) {
    win.webContents.send(IPC.CARD_GENERATE_PROGRESS, event);
  }
}

export function registerIpcHandlers(win: BrowserWindow): void {
  ipcMain.handle(IPC.APP_READY, async (): Promise<AppReadyResponse> => {
    try {
      loadEnv();
    } catch {
      // ignore
    }
    return { ok: true, appName: APP_NAME, version: APP_VERSION };
  });

  ipcMain.handle(IPC.APP_GET_CONFIG, async (): Promise<AppConfig> => {
    const env = loadEnv();
    return {
      ankiConnectUrl: env.ANKI_CONNECT_URL,
      ankiDeckName: env.ANKI_DECK_NAME,
      ankiModelName: env.ANKI_MODEL_NAME,
      openaiModel: env.OPENAI_MODEL,
      openaiTtsVoice: env.OPENAI_TTS_VOICE,
      openaiTtsModel: env.OPENAI_TTS_MODEL,
    };
  });

  ipcMain.handle(
    IPC.ANKI_TEST_CONNECTION,
    async (): Promise<AnkiTestConnectionResponse> => {
      try {
        const client = getAnkiClient();
        const version = await client.version();
        logger.info('AnkiConnect reachable, version', version);
        return { ok: true, version };
      } catch (err) {
        logger.warn('AnkiConnect unreachable:', (err as Error).message);
        const message = err instanceof Error ? err.message : String(err);
        return { ok: false, error: message };
      }
    },
  );

  ipcMain.handle(
    IPC.ANKI_GET_MODEL_FIELDS,
    async (_e, payload: { modelName: string }): Promise<AnkiGetModelFieldsResponse> => {
      try {
        const client = getAnkiClient();
        const fieldNames = await client.modelFieldNames(payload.modelName);
        return { ok: true, fieldNames };
      } catch (err) {
        if (err instanceof AnkiModelNotFoundError) {
          return { ok: false, error: err.message };
        }
        if (err instanceof AnkiNotRunningError) {
          return { ok: false, error: err.message };
        }
        const message = err instanceof Error ? err.message : String(err);
        return { ok: false, error: message };
      }
    },
  );

  ipcMain.handle(
    IPC.CARD_GENERATE,
    async (_e, payload: CardGenerateRequest): Promise<CardGenerateResponse> => {
      const word = (payload?.word ?? '').trim();
      if (!word) {
        return { ok: false, error: 'Word is empty.' };
      }
      try {
        const builder = getCardBuilder();
        const card = await builder.build(word, (stage, ok, message) => {
          sendProgress(win, { word, stage, ok, message });
        });
        return { ok: true, card };
      } catch (err) {
        logger.warn('CARD_GENERATE failed for', word, ':', (err as Error).message);
        const friendly = humanizeError(err);
        return { ok: false, error: friendly };
      }
    },
  );

  ipcMain.handle(
    IPC.ANKI_ADD_NOTE,
    async (_e, payload: AnkiAddNoteRequest): Promise<AnkiAddNoteResponse> => {
      const env = loadEnv();
      const deckName = payload.deckName ?? env.ANKI_DECK_NAME;
      const modelName = payload.modelName ?? env.ANKI_MODEL_NAME;
      try {
        const anki = getAnkiClient();
        const fieldNames = await anki.modelFieldNames(modelName);
        const mapper = new AnkiFieldMapper();
        const mapped = mapper.buildFields(payload.card, { modelFieldNames: fieldNames });

        if (mapped.missing.length > 0) {
          logger.warn('Some Anki fields are missing in the model:', mapped.missing.join(', '));
        }

        const noteId = await anki.addNote({
          deckName,
          modelName,
          fields: mapped.fields,
          tags: payload.tags ?? ['auto-generated'],
          options: { allowDuplicate: false, duplicateScope: 'deck' },
        });

        if (noteId === null) {
          throw new AnkiAddNoteError(
            'AnkiConnect rejected the note (returned null). A duplicate may already exist in this deck.',
          );
        }
        return { ok: true, noteId };
      } catch (err) {
        if (err instanceof AnkiModelNotFoundError) {
          return { ok: false, error: err.message };
        }
        if (err instanceof AnkiNotRunningError) {
          return { ok: false, error: err.message };
        }
        if (err instanceof AnkiAddNoteError) {
          return { ok: false, error: err.message };
        }
        const message = err instanceof Error ? err.message : String(err);
        return { ok: false, error: message };
      }
    },
  );
}

function humanizeError(err: unknown): string {
  if (err instanceof OpenAIAuthError) {
    return 'OpenAI rejected the API key. Check OPENAI_API_KEY in .env.';
  }
  if (err instanceof OpenAIRateLimitError) {
    return 'OpenAI rate limit hit. Wait a moment and try again.';
  }
  if (err instanceof OpenAISchemaError) {
    return `OpenAI returned a malformed response: ${err.message}`;
  }
  if (err instanceof OpenAINetworkError) {
    return `OpenAI network error: ${err.message}`;
  }
  if (err instanceof ValidationError) {
    return `Validation failed: ${err.failedRules.join(', ')}`;
  }
  if (err instanceof AnkiModelNotFoundError) {
    return err.message;
  }
  if (err instanceof ConfigError) {
    return `Configuration error: ${err.message}`;
  }
  const payload = serializeError(err);
  return payload.message;
}

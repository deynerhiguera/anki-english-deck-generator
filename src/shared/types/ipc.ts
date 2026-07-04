import type { Card } from '../domain/Card';
import type { ProgressEvent } from './progress';

export const IPC = {
  APP_READY: 'app:ready',
  APP_GET_CONFIG: 'app:getConfig',
  ANKI_TEST_CONNECTION: 'anki:testConnection',
  ANKI_GET_MODEL_FIELDS: 'anki:getModelFields',
  ANKI_ADD_NOTE: 'anki:addNote',
  CARD_GENERATE: 'card:generate',
  CARD_GENERATE_PROGRESS: 'card:generate:progress',
} as const;

export type IpcChannel = (typeof IPC)[keyof typeof IPC];

export interface AppReadyResponse {
  ok: true;
  appName: string;
  version: string;
}

export interface AppConfig {
  ankiConnectUrl: string;
  ankiDeckName: string;
  ankiModelName: string;
  openaiModel: string;
  openaiTtsVoice: string;
  openaiTtsModel: string;
}

export interface AnkiTestConnectionRequest {
  url?: string;
}

export interface AnkiTestConnectionResponse {
  ok: boolean;
  version?: number;
  error?: string;
}

export interface AnkiGetModelFieldsRequest {
  modelName: string;
}

export interface AnkiGetModelFieldsResponse {
  ok: boolean;
  fieldNames?: string[];
  error?: string;
}

export interface AnkiAddNoteRequest {
  card: Card;
  deckName?: string;
  modelName?: string;
  tags?: string[];
}

export interface AnkiAddNoteResponse {
  ok: boolean;
  noteId?: number;
  error?: string;
}

export interface CardGenerateRequest {
  word: string;
}

export interface CardGenerateResponse {
  ok: boolean;
  card?: Card;
  error?: string;
}

export interface RendererApi {
  app: {
    ready(): Promise<AppReadyResponse>;
    getConfig(): Promise<AppConfig>;
  };
  anki: {
    testConnection(req?: AnkiTestConnectionRequest): Promise<AnkiTestConnectionResponse>;
    getModelFields(req: AnkiGetModelFieldsRequest): Promise<AnkiGetModelFieldsResponse>;
    addNote(req: AnkiAddNoteRequest): Promise<AnkiAddNoteResponse>;
  };
  card: {
    generate(req: CardGenerateRequest): Promise<CardGenerateResponse>;
    onProgress(cb: (event: ProgressEvent) => void): () => void;
  };
}

import { contextBridge, ipcRenderer } from 'electron';
import {
  IPC,
  type AnkiAddNoteRequest,
  type AnkiAddNoteResponse,
  type AnkiGetModelFieldsRequest,
  type AnkiGetModelFieldsResponse,
  type AnkiTestConnectionRequest,
  type AnkiTestConnectionResponse,
  type AppConfig,
  type AppReadyResponse,
  type CardGenerateRequest,
  type CardGenerateResponse,
  type RendererApi,
  type SelectionCaptureError,
  type SelectionCaptureEvent,
} from '@shared/types/ipc';
import type { ProgressEvent } from '@shared/types/progress';

const api: RendererApi = {
  app: {
    ready: () => ipcRenderer.invoke(IPC.APP_READY) as Promise<AppReadyResponse>,
    getConfig: () => ipcRenderer.invoke(IPC.APP_GET_CONFIG) as Promise<AppConfig>,
  },
  anki: {
    testConnection: (req?: AnkiTestConnectionRequest) =>
      ipcRenderer.invoke(IPC.ANKI_TEST_CONNECTION, req ?? {}) as Promise<AnkiTestConnectionResponse>,
    getModelFields: (req: AnkiGetModelFieldsRequest) =>
      ipcRenderer.invoke(IPC.ANKI_GET_MODEL_FIELDS, req) as Promise<AnkiGetModelFieldsResponse>,
    addNote: (req: AnkiAddNoteRequest) =>
      ipcRenderer.invoke(IPC.ANKI_ADD_NOTE, req) as Promise<AnkiAddNoteResponse>,
  },
  card: {
    generate: (req: CardGenerateRequest) =>
      ipcRenderer.invoke(IPC.CARD_GENERATE, req) as Promise<CardGenerateResponse>,
    onProgress: (cb: (event: ProgressEvent) => void) => {
      const listener = (_e: Electron.IpcRendererEvent, payload: ProgressEvent): void => cb(payload);
      ipcRenderer.on(IPC.CARD_GENERATE_PROGRESS, listener);
      return () => ipcRenderer.removeListener(IPC.CARD_GENERATE_PROGRESS, listener);
    },
    onGenerateFromSelection: (cb: (event: SelectionCaptureEvent) => void) => {
      const listener = (_e: Electron.IpcRendererEvent, payload: SelectionCaptureEvent): void =>
        cb(payload);
      ipcRenderer.on(IPC.CARD_GENERATE_FROM_SELECTION, listener);
      return () => ipcRenderer.removeListener(IPC.CARD_GENERATE_FROM_SELECTION, listener);
    },
    onSelectionCaptureError: (cb: (event: SelectionCaptureError) => void) => {
      const listener = (_e: Electron.IpcRendererEvent, payload: SelectionCaptureError): void =>
        cb(payload);
      ipcRenderer.on(IPC.SELECTION_CAPTURE_ERROR, listener);
      return () => ipcRenderer.removeListener(IPC.SELECTION_CAPTURE_ERROR, listener);
    },
  },
};

contextBridge.exposeInMainWorld('ankiBuilder', api);

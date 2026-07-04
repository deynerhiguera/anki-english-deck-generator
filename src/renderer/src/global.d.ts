import type { RendererApi } from '@shared/types/ipc';

declare global {
  interface Window {
    ankiBuilder: RendererApi;
  }
}

export {};

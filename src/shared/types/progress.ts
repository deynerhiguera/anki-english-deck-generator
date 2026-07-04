export type ProgressStage =
  | 'queued'
  | 'prompt'
  | 'content'
  | 'audio:word'
  | 'audio:example'
  | 'storage'
  | 'media-sync'
  | 'anki-add'
  | 'done'
  | 'failed';

export interface ProgressEvent {
  word: string;
  stage: ProgressStage;
  ok: boolean;
  message?: string;
}

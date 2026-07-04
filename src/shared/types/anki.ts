export interface AnkiConnectRequest<TParams> {
  action: string;
  version: 6;
  params?: TParams;
}

export interface AnkiConnectResponse<TResult> {
  result: TResult;
  error: string | null;
}

export interface AddNoteParams {
  note: {
    deckName: string;
    modelName: string;
    fields: Record<string, string>;
    tags?: string[];
    options?: {
      allowDuplicate?: boolean;
      duplicateScope?: 'deck' | 'collection';
    };
  };
}

export interface AnkiNote {
  noteId: number;
  fields: Record<string, { value: string; order: number }>;
}

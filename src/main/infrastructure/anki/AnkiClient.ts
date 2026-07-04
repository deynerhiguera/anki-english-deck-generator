export interface AnkiConnectRequest<TParams = unknown> {
  action: string;
  version: 6;
  params?: TParams;
}

export interface AnkiConnectResponse<TResult = unknown> {
  result: TResult;
  error: string | null;
}

export interface AnkiClientOptions {
  baseUrl: string;
  fetchImpl?: typeof fetch;
}

export class AnkiRequestError extends Error {
  public readonly ankiMessage: string;

  constructor(ankiMessage: string) {
    super(`AnkiConnect returned error: ${ankiMessage}`);
    this.name = 'AnkiRequestError';
    this.ankiMessage = ankiMessage;
  }
}

export class AnkiNetworkError extends Error {
  public override readonly cause: unknown;

  constructor(message: string, cause?: unknown) {
    super(message);
    this.name = 'AnkiNetworkError';
    this.cause = cause;
  }
}

const DEFAULT_TIMEOUT_MS = 5_000;

export class AnkiClient {
  private readonly baseUrl: string;
  private readonly fetchImpl: typeof fetch;

  constructor(opts: AnkiClientOptions) {
    this.baseUrl = opts.baseUrl.replace(/\/$/, '');
    this.fetchImpl = opts.fetchImpl ?? fetch;
  }

  private async request<TParams, TResult>(
    action: string,
    params?: TParams,
  ): Promise<TResult> {
    const body: AnkiConnectRequest<TParams> = {
      action,
      version: 6,
      params,
    };

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), DEFAULT_TIMEOUT_MS);

    let res: Response;
    try {
      res = await this.fetchImpl(this.baseUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
        signal: controller.signal,
      });
    } catch (err) {
      throw new AnkiNetworkError(
        `Could not reach AnkiConnect at ${this.baseUrl}. Is Anki running with the AnkiConnect plugin enabled?`,
        err,
      );
    } finally {
      clearTimeout(timeoutId);
    }

    if (!res.ok) {
      throw new AnkiNetworkError(
        `AnkiConnect HTTP ${res.status} ${res.statusText} from ${this.baseUrl}`,
      );
    }

    let json: AnkiConnectResponse<TResult>;
    try {
      json = (await res.json()) as AnkiConnectResponse<TResult>;
    } catch (err) {
      throw new AnkiNetworkError('AnkiConnect returned a non-JSON response.', err);
    }

    if (json.error) {
      throw new AnkiRequestError(json.error);
    }

    return json.result;
  }

  async version(): Promise<number> {
    return this.request<undefined, number>('version');
  }

  async deckNames(): Promise<string[]> {
    return this.request<undefined, string[]>('deckNames');
  }

  async modelNames(): Promise<string[]> {
    return this.request<undefined, string[]>('modelNames');
  }

  async modelFieldNames(modelName: string): Promise<string[]> {
    return this.request<{ modelName: string }, string[]>('modelFieldNames', { modelName });
  }

  async addNote(note: {
    deckName: string;
    modelName: string;
    fields: Record<string, string>;
    tags?: string[];
    options?: {
      allowDuplicate?: boolean;
      duplicateScope?: 'deck' | 'collection';
    };
  }): Promise<number | null> {
    return this.request<{ note: typeof note }, number | null>('addNote', { note });
  }
}

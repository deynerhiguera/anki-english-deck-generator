export type AppErrorCode =
  | 'CONFIG_ERROR'
  | 'ANKI_NOT_RUNNING'
  | 'ANKI_MODEL_NOT_FOUND'
  | 'ANKI_ADD_NOTE_FAILED'
  | 'OPENAI_AUTH'
  | 'OPENAI_RATE_LIMIT'
  | 'OPENAI_SCHEMA'
  | 'OPENAI_NETWORK'
  | 'VALIDATION_FAILED'
  | 'STORAGE_ERROR';

export interface AppErrorPayload {
  code: AppErrorCode;
  message: string;
  retryable: boolean;
  details?: Record<string, unknown>;
}

export class AppError extends Error {
  public readonly code: AppErrorCode;
  public readonly retryable: boolean;
  public readonly details?: Record<string, unknown>;

  constructor(payload: AppErrorPayload) {
    super(payload.message);
    this.name = 'AppError';
    this.code = payload.code;
    this.retryable = payload.retryable;
    this.details = payload.details;
  }

  toJSON(): AppErrorPayload {
    return {
      code: this.code,
      message: this.message,
      retryable: this.retryable,
      details: this.details,
    };
  }
}

export class ConfigError extends AppError {
  constructor(message: string, details?: Record<string, unknown>) {
    super({ code: 'CONFIG_ERROR', message, retryable: false, details });
    this.name = 'ConfigError';
  }
}

export class AnkiNotRunningError extends AppError {
  constructor(message = 'Anki is not running or AnkiConnect is unreachable.') {
    super({ code: 'ANKI_NOT_RUNNING', message, retryable: false });
    this.name = 'AnkiNotRunningError';
  }
}

export class AnkiModelNotFoundError extends AppError {
  constructor(modelName: string) {
    super({
      code: 'ANKI_MODEL_NOT_FOUND',
      message: `Anki note type "${modelName}" was not found. Create it in Anki or update ANKI_MODEL_NAME in .env.`,
      retryable: false,
      details: { modelName },
    });
    this.name = 'AnkiModelNotFoundError';
  }
}

export class AnkiAddNoteError extends AppError {
  constructor(message: string, details?: Record<string, unknown>) {
    super({ code: 'ANKI_ADD_NOTE_FAILED', message, retryable: true, details });
    this.name = 'AnkiAddNoteError';
  }
}

export class OpenAIAuthError extends AppError {
  constructor(message = 'OpenAI rejected the API key.') {
    super({ code: 'OPENAI_AUTH', message, retryable: false });
    this.name = 'OpenAIAuthError';
  }
}

export class OpenAIRateLimitError extends AppError {
  constructor(message = 'OpenAI rate limit hit.') {
    super({ code: 'OPENAI_RATE_LIMIT', message, retryable: true });
    this.name = 'OpenAIRateLimitError';
  }
}

export class OpenAISchemaError extends AppError {
  constructor(message: string, details?: Record<string, unknown>) {
    super({ code: 'OPENAI_SCHEMA', message, retryable: true, details });
    this.name = 'OpenAISchemaError';
  }
}

export class OpenAINetworkError extends AppError {
  constructor(message: string) {
    super({ code: 'OPENAI_NETWORK', message, retryable: true });
    this.name = 'OpenAINetworkError';
  }
}

export class ValidationError extends AppError {
  public readonly failedRules: string[];

  constructor(message: string, failedRules: string[], details?: Record<string, unknown>) {
    super({
      code: 'VALIDATION_FAILED',
      message,
      retryable: true,
      details: { ...details, failedRules },
    });
    this.name = 'ValidationError';
    this.failedRules = failedRules;
  }
}

export class StorageError extends AppError {
  constructor(message: string, details?: Record<string, unknown>) {
    super({ code: 'STORAGE_ERROR', message, retryable: false, details });
    this.name = 'StorageError';
  }
}

export function serializeError(err: unknown): AppErrorPayload {
  if (err instanceof AppError) {
    return err.toJSON();
  }
  if (err instanceof Error) {
    return {
      code: 'VALIDATION_FAILED',
      message: err.message,
      retryable: false,
    };
  }
  return {
    code: 'VALIDATION_FAILED',
    message: String(err),
    retryable: false,
  };
}

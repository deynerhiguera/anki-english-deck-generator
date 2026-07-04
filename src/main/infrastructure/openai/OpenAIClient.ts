import OpenAI from 'openai';
import type { ChatCompletionMessageParam } from 'openai/resources/chat/completions/completions';
import {
  OpenAIAuthError,
  OpenAINetworkError,
  OpenAIRateLimitError,
  OpenAISchemaError,
} from '@shared/domain/errors';

export interface OpenAIChatOptions {
  apiKey: string;
  model?: string;
  maxRetries?: number;
}

export interface CardContentDraft {
  ipa: string;
  meaning: string;
  example: string;
  cloze: string;
}

export interface GenerateCardContentOptions {
  word: string;
  systemPrompt: string;
  feedback?: string;
}

const CARD_CONTENT_SCHEMA = {
  type: 'object',
  properties: {
    ipa: {
      type: 'string',
      description: 'American IPA transcription for the Word including any leading "to " exactly as it appears.',
    },
    meaning: {
      type: 'string',
      description: 'Short English functional meaning, 4-18 words, no dictionary definitions.',
    },
    example: {
      type: 'string',
      description: 'A natural, present-tense or past-tense sentence that uses the target word in its natural form (e.g. conjugated if needed). 6-20 words.',
    },
    cloze: {
      type: 'string',
      description: 'The exact same sentence as example, but with the target word or expression replaced by exactly five underscores: _____. DO NOT use Anki cloze syntax like {{c1::target}}. The Cloze field is plain text fill-in-the-blank.',
    },
  },
  required: ['ipa', 'meaning', 'example', 'cloze'],
  additionalProperties: false,
} as const;

const CARD_CONTENT_JSON_SCHEMA = {
  name: 'card_content',
  strict: true,
  schema: CARD_CONTENT_SCHEMA,
} as const;

export class OpenAIClient {
  private readonly client: OpenAI;
  private readonly model: string;
  private readonly maxRetries: number;

  constructor(opts: OpenAIChatOptions) {
    if (!opts.apiKey || opts.apiKey.length < 10) {
      throw new OpenAIAuthError('OpenAI API key missing or too short.');
    }
    this.client = new OpenAI({ apiKey: opts.apiKey });
    this.model = opts.model ?? 'gpt-4o';
    this.maxRetries = opts.maxRetries ?? 2;
  }

  async generateCardContent(opts: GenerateCardContentOptions): Promise<CardContentDraft> {
    const userPrompt = this.buildUserPrompt(opts.word, opts.feedback);

    const messages: ChatCompletionMessageParam[] = [
      { role: 'system', content: opts.systemPrompt },
      { role: 'user', content: userPrompt },
    ];

    let lastError: Error | null = null;
    for (let attempt = 0; attempt <= this.maxRetries; attempt++) {
      try {
        const completion = await this.client.chat.completions.create({
          model: this.model,
          messages,
          response_format: {
            type: 'json_schema',
            json_schema: CARD_CONTENT_JSON_SCHEMA,
          },
          temperature: 0.7,
        });

        const content = completion.choices[0]?.message?.content;
        if (!content) {
          throw new OpenAISchemaError('OpenAI returned an empty message.');
        }

        const parsed = JSON.parse(content) as unknown;
        if (!this.isCardContentDraft(parsed)) {
          throw new OpenAISchemaError('OpenAI response did not match CardContentDraft shape.', { parsed });
        }
        return parsed;
      } catch (err) {
        lastError = this.normalizeError(err);
        if (!lastError || !(lastError instanceof OpenAIRateLimitError)) {
          break;
        }
        await this.delay(500 * Math.pow(2, attempt));
      }
    }

    if (lastError) throw lastError;
    throw new OpenAINetworkError('Unknown error in generateCardContent.');
  }

  async generateSpeech(
    text: string,
    opts: { voice?: string; model?: string } = {},
  ): Promise<Uint8Array> {
    const voice = opts.voice ?? 'nova';
    const model = opts.model ?? 'tts-1';

    let lastError: Error | null = null;
    for (let attempt = 0; attempt <= this.maxRetries; attempt++) {
      try {
        const response = await this.client.audio.speech.create({
          model,
          voice,
          input: text,
          response_format: 'mp3',
        });

        const arrayBuffer = await response.arrayBuffer();
        return new Uint8Array(arrayBuffer);
      } catch (err) {
        lastError = this.normalizeError(err);
        if (!lastError || !(lastError instanceof OpenAIRateLimitError)) {
          break;
        }
        await this.delay(500 * Math.pow(2, attempt));
      }
    }

    if (lastError) throw lastError;
    throw new OpenAINetworkError('Unknown error in generateSpeech.');
  }

  private buildUserPrompt(word: string, feedback?: string): string {
    const base = `Word: "${word}"\n\nGenerate the card fields. Return JSON only.`;
    if (!feedback) return base;
    return `${base}\n\nFeedback on previous attempt — please correct:\n${feedback}`;
  }

  private isCardContentDraft(v: unknown): v is CardContentDraft {
    if (typeof v !== 'object' || v === null) return false;
    const o = v as Record<string, unknown>;
    return (
      typeof o.ipa === 'string' &&
      typeof o.meaning === 'string' &&
      typeof o.example === 'string' &&
      typeof o.cloze === 'string'
    );
  }

  private normalizeError(err: unknown): Error {
    if (err instanceof OpenAIAuthError) return err;
    if (err instanceof OpenAIRateLimitError) return err;
    if (err instanceof OpenAISchemaError) return err;
    if (err instanceof OpenAINetworkError) return err;

    if (err instanceof OpenAI.APIError) {
      if (err.status === 401) return new OpenAIAuthError();
      if (err.status === 429) return new OpenAIRateLimitError();
      if (err.status >= 500) return new OpenAINetworkError(`OpenAI server error: ${err.message}`);
    }
    if (err instanceof Error) {
      if (err.name === 'AbortError') {
        return new OpenAINetworkError('OpenAI request aborted.');
      }
      return new OpenAINetworkError(err.message);
    }
    return new OpenAINetworkError(String(err));
  }

  private delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}

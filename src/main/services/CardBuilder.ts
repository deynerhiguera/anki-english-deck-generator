import { resolve } from 'node:path';
import type { Card } from '@shared/domain/Card';
import { DefaultCardValidator, type CardValidator } from '@shared/domain/CardValidator';
import {
  AnkiAddNoteError,
  AppError,
  ValidationError,
} from '@shared/domain/errors';
import { OpenAIClient } from '../infrastructure/openai/OpenAIClient';
import { AudioStorage } from '../infrastructure/storage/AudioStorage';
import { AnkiMediaSync } from '../infrastructure/storage/AnkiMediaSync';
import type { AnkiClient } from '../infrastructure/anki/AnkiClient';
import { AnkiFieldMapper } from './AnkiFieldMapper';
import { PromptBuilder } from './PromptBuilder';

export type CardBuildStage =
  | 'prompt'
  | 'content'
  | 'audio:word'
  | 'audio:example'
  | 'storage'
  | 'media-sync'
  | 'anki-add'
  | 'done'
  | 'failed';

export interface CardBuildProgress {
  (stage: CardBuildStage, ok: boolean, message?: string): void;
}

export interface CardBuilderDeps {
  openai: OpenAIClient;
  promptBuilder: PromptBuilder;
  audioStorage: AudioStorage;
  mediaSync: AnkiMediaSync;
  validator?: CardValidator;
  maxRetries?: number;
  tts?: { voice: string; model: string };
  ankiClient?: AnkiClient;
  deckName?: string;
  modelName?: string;
}

export class CardBuilder {
  private readonly openai: OpenAIClient;
  private readonly promptBuilder: PromptBuilder;
  private readonly validator: CardValidator;
  private readonly maxRetries: number;
  private readonly audioStorage: AudioStorage;
  private readonly mediaSync: AnkiMediaSync;
  private readonly tts: { voice: string; model: string };
  private readonly ankiClient: AnkiClient | undefined;
  private readonly deckName: string | undefined;
  private readonly modelName: string | undefined;
  private readonly fieldMapper: AnkiFieldMapper;

  constructor(deps: CardBuilderDeps) {
    this.openai = deps.openai;
    this.promptBuilder = deps.promptBuilder;
    this.audioStorage = deps.audioStorage;
    this.mediaSync = deps.mediaSync;
    this.tts = deps.tts ?? { voice: 'nova', model: 'tts-1' };
    this.ankiClient = deps.ankiClient;
    this.deckName = deps.deckName;
    this.modelName = deps.modelName;
    this.fieldMapper = new AnkiFieldMapper();
    this.validator = deps.validator ?? new DefaultCardValidator('lenient');
    this.maxRetries = deps.maxRetries ?? 2;
  }

  async build(word: string, onProgress?: CardBuildProgress): Promise<Card> {
    onProgress?.('prompt', true);
    const systemPrompt = this.promptBuilder.build();

    onProgress?.('content', true);
    const normalized = this.normalizeWord(word);
    const stamp = Date.now();
    const soundFilename = this.buildFilename(normalized, stamp);

    let lastResult: { ipa: string; meaning: string; example: string; cloze: string } | null = null;
    let lastFeedback: string | undefined;

    for (let attempt = 0; attempt <= this.maxRetries; attempt++) {
      try {
        const draft = await this.openai.generateCardContent({
          word: normalized,
          systemPrompt,
          feedback: lastFeedback,
        });
        lastResult = draft;

        const clozen = this.ensureCloze(draft.example, normalized, draft.cloze);
        const card: Card = {
          word: normalized,
          ipa: draft.ipa,
          meaning: draft.meaning,
          example: draft.example,
          cloze: clozen,
          soundFilename,
        };

        const validation = this.validator.validate(card);
        if (validation.ok || validation.hardFails.length === 0) {
          const finalized = await this.runAudioAndStorage(card, onProgress);
          return await this.runAnkiSave(finalized, onProgress);
        }

        lastFeedback = this.buildFeedback(validation.hardFails);
      } catch (err) {
        const e = err as AppError;
        onProgress?.('failed', false, e.message);
        throw err;
      }
    }

    if (lastResult) {
      const card: Card = {
        word: normalized,
        ipa: lastResult.ipa,
        meaning: lastResult.meaning,
        example: lastResult.example,
        cloze: this.ensureCloze(lastResult.example, normalized, lastResult.cloze),
        soundFilename,
      };
      try {
        const finalized = await this.runAudioAndStorage(card, onProgress);
        return await this.runAnkiSave(finalized, onProgress);
      } catch (err) {
        if (err instanceof AppError) {
          throw err;
        }
        throw new ValidationError(
          `Card accepted with warnings but post-processing failed: ${(err as Error).message}`,
          ['Q-RETRIES-EXHAUSTED'],
        );
      }
    }

    throw new ValidationError('No content generated.', []);
  }

  async retryAddNote(card: Card, onProgress?: CardBuildProgress): Promise<Card> {
    return this.runAnkiSave(card, onProgress);
  }

  private async runAudioAndStorage(card: Card, onProgress?: CardBuildProgress): Promise<Card> {
    onProgress?.('audio:word', true);
    await this.openai.generateSpeech(card.word, this.tts);

    onProgress?.('audio:example', true);
    const exampleAudio = await this.openai.generateSpeech(card.example, this.tts);

    onProgress?.('storage', true);
    await this.audioStorage.save(card.soundFilename, exampleAudio);

    onProgress?.('media-sync', true);
    const exists = await this.mediaSync.exists(card.soundFilename);
    if (!exists) {
      const localPath = resolve(this.audioStorage.pathFor(card.soundFilename));
      await this.mediaSync.copyFrom(localPath, card.soundFilename);
    }

    return card;
  }

  private async runAnkiSave(card: Card, onProgress?: CardBuildProgress): Promise<Card> {
    if (!this.ankiClient || !this.deckName || !this.modelName) {
      onProgress?.('done', true);
      return card;
    }

    try {
      onProgress?.('anki-add', true);
      const fieldNames = await this.ankiClient.modelFieldNames(this.modelName);
      const mapped = this.fieldMapper.buildFields(card, { modelFieldNames: fieldNames });
      const noteId = await this.ankiClient.addNote({
        deckName: this.deckName,
        modelName: this.modelName,
        fields: mapped.fields,
        tags: ['auto-generated'],
        options: { allowDuplicate: false, duplicateScope: 'deck' },
      });

      if (noteId === null) {
        throw new AnkiAddNoteError(
          'Anki rejected the note (returned null). A note with this word may already exist in the deck.',
        );
      }

      const saved: Card = { ...card, noteId };
      onProgress?.('done', true);
      return saved;
    } catch (err) {
      onProgress?.('failed', false, (err as Error).message);
      throw err;
    }
  }

  private normalizeWord(raw: string): string {
    return raw.trim().toLowerCase();
  }

  private buildFilename(word: string, stamp: number): string {
    return `${word}-${stamp}.mp3`;
  }

  private ensureCloze(example: string, word: string, providedCloze: string): string {
    const BLANK = '_____';

    if (/_{3,}/.test(providedCloze)) {
      return providedCloze;
    }

    const clozeMatch = providedCloze.match(/\{\{c1::(.+?)\}\}/);
    if (clozeMatch) {
      const target = clozeMatch[1];
      const escape = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      const rx = new RegExp(`\\b${escape(target)}\\b`, 'i');
      if (rx.test(example)) {
        return example.replace(rx, BLANK);
      }
    }

    const root = word.replace(/^to\s+/, '').trim();
    if (root) {
      const escape = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      const conjugationRx = new RegExp(`\\b${escape(root)}(s|ed|ing|d|r|er|est)?\\b`, 'i');
      const m = example.match(conjugationRx);
      if (m) {
        return example.replace(conjugationRx, BLANK);
      }
    }

    return example;
  }

  private buildFeedback(fails: Array<{ id: string; message?: string }>): string {
    return fails.map((f) => `- ${f.id}: ${f.message ?? 'validation failed'}`).join('\n');
  }
}

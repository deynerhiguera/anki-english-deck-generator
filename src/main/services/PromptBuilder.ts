import { readFileSync, existsSync } from 'node:fs';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { loadEnv } from '../config/env';

const __dirname = fileURLToPath(new URL('.', import.meta.url));

const FALLBACK_INSTRUCTIONS = `
You generate Anki vocabulary cards. Output JSON only.

Required fields: ipa, meaning, example, cloze.

ipa: American IPA for the entire Word (including any leading "to ").
meaning: short English explanation, 4-18 words, no dictionary definitions.
example: 6-20 words, present or past simple, natural conversation, ideally about tech or software engineering.
cloze: same sentence as example, with the entire target word or expression replaced by exactly five underscores: _____.

Cloze format rules:
- exactly five underscores "_____" in the cloze field, no more, no less
- hide the complete target unit, never part of it
- cloze text outside the blank must equal example exactly
- DO NOT use Anki cloze syntax ({{c1::target}}). The target model is a regular Q/A template, so the field is plain text.

Example pronouns: prefer "I" (~60%), "we" (~20%), "you" (~10%), other (~10%).
`.trim();

export class PromptBuilder {
  private cached: string | null = null;

  build(): string {
    if (this.cached) return this.cached;

    const env = loadEnv();
    let philosophy = '';
    let styleGuide = '';

    const candidates = [
      process.env.PROJECT_ROOT,
      resolve(__dirname, '../../../..'),
      resolve(process.cwd(), '../../../..'),
      resolve(process.cwd()),
    ].filter(Boolean) as string[];

    let projectRoot = candidates[0];
    for (const candidate of candidates) {
      if (existsSync(resolve(candidate, 'docs/card-philosophy.md'))) {
        projectRoot = candidate;
        break;
      }
    }

    const philosophyPath = resolve(projectRoot, 'docs/card-philosophy.md');
    const stylePath = resolve(projectRoot, 'docs/style-guide.md');

    try {
      philosophy = readFileSync(philosophyPath, 'utf8').trim();
    } catch {
      // ignore
    }
    try {
      styleGuide = readFileSync(stylePath, 'utf8').trim();
    } catch {
      // ignore
    }

    if (!philosophy && !styleGuide) {
      this.cached = FALLBACK_INSTRUCTIONS;
      return FALLBACK_INSTRUCTIONS;
    }

    const parts: string[] = [];
    parts.push('You generate Anki vocabulary cards following a strict personal learning methodology.');
    parts.push('Output JSON only — no prose, no markdown fences, no explanations.');
    parts.push('');
    if (philosophy) {
      parts.push('=== CARD PHILOSOPHY (source of truth) ===');
      parts.push(philosophy);
      parts.push('');
    }
    if (styleGuide) {
      parts.push('=== STYLE GUIDE (format conventions) ===');
      parts.push(styleGuide);
      parts.push('');
    }
    parts.push('Required output JSON shape:');
    parts.push('{');
    parts.push('  "ipa": string,            // American IPA including the leading "to " if Word starts with it');
    parts.push('  "meaning": string,        // 4-18 words, no dictionary, English only');
    parts.push('  "example": string,        // 6-20 words, single sentence');
    parts.push('  "cloze": string           // example with the target word replaced by exactly "_____" (5 underscores)');
    parts.push('}');

    void env; // Reserved for future env-driven prompt knobs.
    this.cached = parts.join('\n');
    return this.cached;
  }

  invalidate(): void {
    this.cached = null;
  }
}

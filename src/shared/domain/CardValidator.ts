import type { Card } from './Card';
import {
  BRITISH_IPA_SYMBOLS,
  CLUSTER_KEYWORDS,
  ETYMOLOGY_MARKERS,
  FORMAL_INTROS,
  FORBIDDEN_TENSE_AUXILIARIES,
  GREETINGS,
  IPA_INVENTORY,
  SPANISH_STOPWORDS,
  TECH_ALLOWLIST,
  TEXTBOOK_NAMES,
} from '../constants';

export type Severity = 'HARD' | 'SOFT';

export interface RuleResult {
  id: string;
  severity: Severity;
  pass: boolean;
  message?: string;
}

export interface ValidationResult {
  ok: boolean;
  hardFails: RuleResult[];
  softWarnings: RuleResult[];
}

export interface CardValidator {
  validate(card: Card): ValidationResult;
}

const IPA_SLASH_RX = /^\/([^/]+)\/$/;

export class DefaultCardValidator implements CardValidator {
  private readonly mode: 'lenient' | 'strict';

  constructor(mode: 'lenient' | 'strict' = 'lenient') {
    this.mode = mode;
  }

  validate(card: Card): ValidationResult {
    const rules: RuleResult[] = [
      ...this.validateWord(card.word),
      ...this.validateMeaning(card.meaning, card.word),
      ...this.validateExample(card.example, card.word),
      ...this.validateCloze(card.cloze, card.example, card.word),
      ...this.validateIPA(card.ipa, card.word),
      ...this.validateAudio(card.soundFilename),
      ...this.validateCompleteness(card),
      ...this.validatePhilosophy(card.example, card.meaning),
    ];

    const hardFails = rules.filter((r) => !r.pass && r.severity === 'HARD');
    const softWarnings = rules.filter((r) => !r.pass && r.severity === 'SOFT');

    const ok = this.mode === 'strict'
      ? hardFails.length === 0 && softWarnings.length === 0
      : hardFails.length === 0;

    return { ok, hardFails, softWarnings };
  }

  private validateWord(word: string): RuleResult[] {
    const out: RuleResult[] = [];
    out.push({ id: 'Q1', severity: 'HARD', pass: !!word && word.trim().length > 0 });
    if (!word) return out;
    const first = word[0];
    out.push({ id: 'Q2', severity: 'HARD', pass: !!first && first === first.toLowerCase() });
    out.push({ id: 'Q3', severity: 'HARD', pass: word === word.trim() && !/\s{2,}/.test(word) });
    out.push({ id: 'Q4', severity: 'HARD', pass: !word.includes('\n') });
    return out;
  }

  private validateMeaning(meaning: string, word: string): RuleResult[] {
    const out: RuleResult[] = [];
    out.push({ id: 'Q5', severity: 'HARD', pass: !!meaning && meaning.trim().length > 0 });
    if (!meaning) return out;
    const tokens = meaning.trim().split(/\s+/);
    out.push({ id: 'Q6', severity: 'HARD', pass: tokens.length >= 4 && tokens.length <= 18 });

    const lower = meaning.toLowerCase();
    const hasSpanish = SPANISH_STOPWORDS.some((sw) => new RegExp(`\\b${sw}\\b`, 'i').test(lower));
    out.push({ id: 'Q7', severity: 'HARD', pass: !hasSpanish });

    const formal = FORMAL_INTROS.find((p) => lower.startsWith(p));
    out.push({ id: 'Q8', severity: 'SOFT', pass: !formal });

    const etymology = ETYMOLOGY_MARKERS.find((p) => lower.includes(p));
    out.push({ id: 'Q9', severity: 'SOFT', pass: !etymology });

    out.push({ id: 'Q10', severity: 'SOFT', pass: !meaning.includes('"') });

    if (word.startsWith('to ')) {
      out.push({ id: 'Q11', severity: 'HARD', pass: lower.startsWith('to ') });
    } else {
      out.push({ id: 'Q11', severity: 'HARD', pass: true });
    }

    if (isProbablyAdverb(word)) {
      const startsOk = lower.startsWith('in a ') || lower.startsWith('in an ');
      out.push({ id: 'Q12', severity: 'SOFT', pass: startsOk });
    }
    return out;
  }

  private validateExample(example: string, word: string): RuleResult[] {
    const out: RuleResult[] = [];
    out.push({ id: 'Q13', severity: 'HARD', pass: !!example && example.trim().length > 0 });
    if (!example) return out;
    const tokens = example.trim().split(/\s+/);
    out.push({ id: 'Q15', severity: 'HARD', pass: tokens.length >= 6 && tokens.length <= 20 });
    out.push({
      id: 'Q16',
      severity: 'HARD',
      pass: /[.!?]$/.test(example.trim()),
    });

    out.push({ id: 'Q17', severity: 'SOFT', pass: !example.includes(';') });

    const hasSubject = /\b(I|you|he|she|it|we|they|[A-Z][a-z]+)\b/.test(example);
    out.push({ id: 'Q18', severity: 'HARD', pass: hasSubject });

    const lower = example.toLowerCase();
    const forbiddenTense = FORBIDDEN_TENSE_AUXILIARIES.find((a) => lower.includes(a));
    out.push({ id: 'Q19', severity: 'SOFT', pass: !forbiddenTense });

    const greeting = GREETINGS.find((g) => example.startsWith(g));
    out.push({ id: 'Q20', severity: 'SOFT', pass: !greeting });

    const textbook = TEXTBOOK_NAMES.find((n) => new RegExp(`\\b${n}\\b`).test(example));
    out.push({ id: 'Q21', severity: 'SOFT', pass: !textbook });

    out.push({
      id: 'Q14',
      severity: 'HARD',
      pass: containsWordAsToken(example, word),
    });

    const clusterMatch = matchAnyCluster(example);
    out.push({ id: 'Q22', severity: 'SOFT', pass: clusterMatch !== null });
    return out;
  }

  private validateCloze(cloze: string, example: string, word: string): RuleResult[] {
    const out: RuleResult[] = [];
    out.push({ id: 'Q23', severity: 'HARD', pass: !!cloze && cloze.trim().length > 0 });
    if (!cloze) return out;
    const blankMatches = cloze.match(/_{3,}/g) || [];
    out.push({ id: 'Q24', severity: 'HARD', pass: blankMatches.length === 1 });
    if (blankMatches.length !== 1) return out;
    const reconstructed = cloze.replace(/_{3,}/, word);
    out.push({ id: 'Q25', severity: 'HARD', pass: true });
    out.push({ id: 'Q26', severity: 'HARD', pass: reconstructed === example });
    return out;
  }

  private validateIPA(ipa: string, word: string): RuleResult[] {
    const out: RuleResult[] = [];
    out.push({ id: 'Q27', severity: 'HARD', pass: !!ipa && ipa.trim().length > 0 });
    if (!ipa) return out;
    const m = ipa.match(IPA_SLASH_RX);
    out.push({ id: 'Q28', severity: 'HARD', pass: !!m });
    const inside = m ? m[1] : '';
    const inventoryOk = [...inside].every((ch) => IPA_INVENTORY.includes(ch));
    out.push({ id: 'Q29', severity: 'HARD', pass: inventoryOk });

    const british = BRITISH_IPA_SYMBOLS.find((s) => inside.includes(s));
    out.push({ id: 'Q30', severity: 'HARD', pass: !british });

    if (word.startsWith('to ')) {
      const tokens = inside.trim().split(/\s+/);
      const allowed = ['tə', 'tu', 'tʊ', 'tɑ'];
      out.push({ id: 'Q31', severity: 'HARD', pass: tokens.length > 0 && allowed.includes(tokens[0]) });
    } else {
      out.push({ id: 'Q31', severity: 'HARD', pass: true });
    }

    const stressIdx = inside.indexOf('ˈ');
    const wordSyllableCount = word.replace(/^to\s+/, '').split(/\s+/).join('-').split(/[·.]/).filter(Boolean).length;
    if (wordSyllableCount > 1) {
      out.push({ id: 'Q32', severity: 'SOFT', pass: stressIdx >= 0 });
    }
    return out;
  }

  private validateAudio(sound: string): RuleResult[] {
    const out: RuleResult[] = [];
    if (!sound || sound.trim().length === 0) {
      out.push({ id: 'Q34', severity: 'HARD', pass: false, message: 'Sound_Example is empty.' });
      return out;
    }
    out.push({ id: 'Q34', severity: 'HARD', pass: /^\[sound:[a-z0-9 .\-]+\.mp3\]$/.test(sound) });
    const fnMatch = sound.match(/\[sound:([a-z0-9 .\-]+)\.mp3\]/);
    if (fnMatch) {
      const fn = fnMatch[1];
      out.push({
        id: 'Q35',
        severity: 'HARD',
        pass: /^[a-z0-9 .\-]+\-\d+$/.test(fn),
      });
    }
    return out;
  }

  private validateCompleteness(card: Card): RuleResult[] {
    const out: RuleResult[] = [];
    const allPresent = ['word', 'ipa', 'meaning', 'example', 'cloze', 'soundFilename'].every((k) => {
      const v = (card as unknown as Record<string, unknown>)[k];
      return typeof v === 'string' && v.length > 0;
    });
    out.push({ id: 'Q37', severity: 'HARD', pass: allPresent });

    const literals = ['undefined', 'null', 'NaN'];
    const noLiterals = !['word', 'ipa', 'meaning', 'example', 'cloze', 'soundFilename'].some((k) => {
      const v = String((card as unknown as Record<string, unknown>)[k] ?? '');
      return literals.some((l) => v.includes(l));
    });
    out.push({ id: 'Q38', severity: 'HARD', pass: noLiterals });

    const combined = `${card.meaning} ${card.example}`.trim().split(/\s+/).length;
    out.push({ id: 'Q39', severity: 'SOFT', pass: combined < 35 });
    return out;
  }

  private validatePhilosophy(example: string, meaning: string): RuleResult[] {
    const out: RuleResult[] = [];
    const combined = `${example} ${meaning}`;

    out.push({ id: 'Q40', severity: 'SOFT', pass: !/\b(formal|archaic|noun:|verb:)\b/.test(combined.toLowerCase()) });
    out.push({
      id: 'Q41',
      severity: 'SOFT',
      pass: !/\b(this is because|for example|such as|in conclusion)\b/.test(combined.toLowerCase()),
    });

    const techMatch = matchCluster(combined, ['A', 'B']);
    out.push({ id: 'Q44', severity: 'SOFT', pass: techMatch !== null });

    const positive = /\b(amazing|awesome|incredible|perfect)\b/i.test(example);
    out.push({ id: 'Q43', severity: 'SOFT', pass: !positive });

    out.push({
      id: 'Q45',
      severity: 'HARD',
      pass: !/\b(Deyn|Deyner)\b/.test(combined),
    });

    return out;
  }
}

function containsWordAsToken(sentence: string, word: string): boolean {
  const escaped = word.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const rx = new RegExp(`(^|\\W)${escaped}(?=\\W|$)`, 'i');
  return rx.test(sentence);
}

function isProbablyAdverb(word: string): boolean {
  const clean = word.replace(/^to\s+/, '');
  return /^[a-z]+ly$/i.test(clean) || /ly$/i.test(clean);
}

function matchAnyCluster(text: string): string | null {
  for (const [cluster, keywords] of Object.entries(CLUSTER_KEYWORDS)) {
    for (const kw of keywords) {
      if (text.toLowerCase().includes(kw.toLowerCase())) return cluster;
    }
  }
  return null;
}

function matchCluster(text: string, clusters: Array<'A' | 'B'>): string | null {
  for (const c of clusters) {
    for (const kw of CLUSTER_KEYWORDS[c]) {
      if (text.toLowerCase().includes(kw.toLowerCase())) return c;
    }
  }
  return null;
}

void TECH_ALLOWLIST;

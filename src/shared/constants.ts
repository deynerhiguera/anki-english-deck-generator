export const APP_NAME = 'Personal AI Anki Builder';
export const APP_VERSION = '0.1.0';

export const SPANISH_STOPWORDS: readonly string[] = [
  'el', 'la', 'lo', 'los', 'las', 'de', 'del', 'que', 'con', 'para',
  'por', 'sin', 'una', 'uno', 'es', 'son', 'está', 'están',
  'ser', 'tener', 'hacer',
];

export const BRITISH_IPA_SYMBOLS: readonly string[] = ['ɒ'];

export const TEXTBOOK_NAMES: readonly string[] = [
  'John', 'Mary', 'Peter', 'Anna',
];

export const GREETINGS: readonly string[] = [
  'Hello', 'Hi', 'Hey there', 'Dear ', 'Greetings',
];

export const FORMAL_INTROS: readonly string[] = [
  'the act of', 'used to', 'refers to', 'means', 'is when', 'this word',
];

export const ETYMOLOGY_MARKERS: readonly string[] = [
  'from latin', 'from old english', 'from greek', 'etymology',
];

export const FORBIDDEN_TENSE_AUXILIARIES: readonly string[] = [
  'will', 'would', 'have been', 'has been', 'had been',
  'might', 'could', 'should', 'going to', 'was going to', 'were going to',
];

export const IPA_INVENTORY: readonly string[] = [
  'ˈ', 'ˌ', 'a', 'æ', 'ɑ', 'ɔ', 'ɛ', 'e', 'ɜ', 'ɪ', 'i',
  'ʊ', 'u', 'ʌ', 'ə', 'ɝ',
  'aɪ', 'aʊ', 'oʊ', 'ɔɪ', 'ɛɪ', 'ʊə', 'ɪə', 'eɪ', 'əʊ',
  'p', 'b', 't', 'd', 'k', 'g', 'f', 'v', 'θ', 'ð',
  's', 'z', 'ʃ', 'ʒ', 'h',
  'm', 'n', 'ŋ', 'l', 'r', 'w', 'j', 'ʍ',
  'tʃ', 'dʒ', 'ɹ', 'ɾ', 'ʔ', '˞', 'ɫ', 'ɚ',
  ' ', '.', 'ː',
];

export const TECH_ALLOWLIST: readonly string[] = [
  'debug', 'deploy', 'build', 'ship', 'test', 'code',
  'commit', 'push', 'review', 'refactor', 'branch',
  'merge', 'rollback', 'monitor', 'log',
  'token', 'prompt', 'model', 'agent', 'retrieval',
];

export const CLUSTER_KEYWORDS = {
  A: ['debug', 'commit', 'deploy', 'refactor', 'ship', 'review', 'merge', 'build', 'test', 'hotfix', 'rollback', 'log', 'monitor', 'incident', 'postmortem'],
  B: ['model', 'prompt', 'token', 'context', 'hallucinate', 'fine-tune', 'inference', 'agent', 'retrieval', 'embedding', 'evaluation'],
  C: ['vocabulary', 'pronunciation', 'grammar', 'sentence', 'structure', 'intonation', 'fluency', 'accent', 'idiom', 'phrasal verb', 'native speaker'],
  D: ['personal project', 'side project', 'prototype', 'experiment', 'weekend', 'scratch', 'rewrite'],
  E: ['routine', 'habit', 'consistency', 'keep going', 'show up', 'give up', 'momentum', 'plateau', 'breakthrough'],
  F: ['workout', 'set', 'rep', 'PR', 'recovery', 'sleep', 'hydration', 'soreness', 'warmup', 'cooldown'],
  G: ['morning', 'coffee', 'commute', 'deadline', 'calendar', 'inbox', 'meeting', 'message', 'call'],
} as const;

export type ClusterId = keyof typeof CLUSTER_KEYWORDS;

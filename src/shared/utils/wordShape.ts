export type RejectReason =
  | 'empty'
  | 'file-path'
  | 'url-or-email'
  | 'code'
  | 'numbers-only'
  | 'too-long'
  | 'no-letters'
  | 'too-special'
  | 'unbalanced-brackets';

export interface ShapeCheck {
  ok: boolean;
  reason?: RejectReason;
  message?: string;
}

const CODE_KEYWORDS = [
  'function', 'class', 'return', 'const', 'let', 'var', 'if', 'else',
  'import', 'export', 'require', 'module', 'async', 'await', 'for',
  'while', 'switch', 'case', 'break', 'continue', 'new', 'this',
  'typeof', 'instanceof', 'true', 'false', 'null', 'undefined', '=>',
];

const MAX_WORD_LEN = 80;
const MAX_SPECIAL_RATIO = 0.4;

export function looksLikeWord(text: string): ShapeCheck {
  const trimmed = text.trim();

  if (!trimmed) {
    return { ok: false, reason: 'empty', message: 'Selection is empty.' };
  }

  if (/^[/~]/.test(trimmed) && /[/\\]/.test(trimmed)) {
    return {
      ok: false,
      reason: 'file-path',
      message: 'That looks like a file path. Highlight a single word or short phrase instead.',
    };
  }

  if (/^[a-z]+:\/\//i.test(trimmed) || /^\S+@\S+\.\S+$/.test(trimmed)) {
    return {
      ok: false,
      reason: 'url-or-email',
      message: 'That looks like a URL or email. Highlight a single word or short phrase instead.',
    };
  }

  if (/^[\d\s.,+\-*/%()]+$/.test(trimmed)) {
    return {
      ok: false,
      reason: 'numbers-only',
      message: 'That looks like a number or formula, not a word.',
    };
  }

  if (trimmed.length > MAX_WORD_LEN) {
    return {
      ok: false,
      reason: 'too-long',
      message: `Selection is too long (${trimmed.length} chars). Highlight a single word or short phrase (under ${MAX_WORD_LEN} chars).`,
    };
  }

  if (!/[a-zA-Z]/.test(trimmed)) {
    return {
      ok: false,
      reason: 'no-letters',
      message: 'Selection has no letters.',
    };
  }

  const codeRx = new RegExp(`\\b(${CODE_KEYWORDS.join('|')})\\b`);
  if (codeRx.test(trimmed)) {
    return {
      ok: false,
      reason: 'code',
      message: 'That looks like code. Highlight a single word or short phrase instead.',
    };
  }

  const allowedMatches = trimmed.match(/[a-zA-Z\s'-]/g)?.length ?? 0;
  const specialRatio = 1 - allowedMatches / trimmed.length;
  if (specialRatio > MAX_SPECIAL_RATIO) {
    return {
      ok: false,
      reason: 'too-special',
      message: 'Selection has too many special characters to be a word.',
    };
  }

  const open = (trimmed.match(/[([{]/g) ?? []).length;
  const close = (trimmed.match(/[)\]}]/g) ?? []).length;
  if (open !== close) {
    return {
      ok: false,
      reason: 'unbalanced-brackets',
      message: 'Selection has unbalanced brackets — that is not a word.',
    };
  }

  return { ok: true };
}
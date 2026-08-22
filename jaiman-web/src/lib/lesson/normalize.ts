import { seededShuffle, tokenize } from './grade';

/**
 * Maps the 21 question types in the content files onto 10 render kinds.
 *
 * Before this existed, every non-grammar session went to CastleBuilder, which
 * understood exactly two shapes: an array of string options, or a text input.
 * `matching` (whose `options` is an object) fell through to a bare textbox with
 * nothing to grade against; `sentence_build`, `word_gender` and `dictation` all
 * rendered as the same anonymous input. The variety was already in the data —
 * it was being discarded at render time.
 */

export type Kind =
  | 'choice'
  | 'listen_choice'
  | 'match'
  | 'wordbank'
  | 'fill_blank'
  | 'gender'
  | 'dictation'
  | 'error_spot'
  | 'speak'
  | 'free_write';

export interface RawExercise {
  id?: string;
  _id?: string;
  type?: string;
  prompt?: string;
  questionText?: string;
  question_text?: string;
  options?: string[] | Record<string, string> | null;
  correctAnswer?: string;
  correct_answer?: string;
  audioUrl?: string;
  audio_url?: string;
  reference_audio?: string;
  prompt_hint?: string;
  template_hint?: string;
  points?: number;
  xpValue?: number;
  xp_value?: number;
}

export interface Exercise {
  id: string;
  kind: Kind;
  rawType: string;
  /** The instruction shown above the exercise. */
  prompt: string;
  /** German text this exercise is "about" — spoken by the audio button. */
  target: string;
  /** Canonical correct answer, '' for open-ended kinds. */
  answer: string;
  choices?: string[];
  pairs?: { left: string; right: string }[];
  tiles?: string[];
  /** Text around the blank, e.g. ['', '! Wie geht\'s?'] for '___! Wie geht\'s?' */
  segments?: string[];
  words?: string[];
  fix?: { wrong: string; right: string };
  hint?: string;
  audioUrl?: string;
  xp: number;
}

const CHOICE_TYPES = ['mcq', 'reverse_mcq', 'comprehension_mcq', 'vocab_in_context', 'flashcard_recall', 'vocab', 'reading'];
const LISTEN_TYPES = ['listening_mcq', 'listening_match', 'true_false_audio', 'listening'];
const SPEAK_TYPES = ['shadowing', 'pronunciation_focus', 'speaking'];
const FREE_TYPES = ['open_response', 'guided_paragraph', 'sentence_construction', 'roleplay', 'boss_test'];
const BUILD_TYPES = ['sentence_build', 'grammar', 'translate'];

/**
 * Pull the quoted phrase out of an instruction.
 * Handles the apostrophe inside "Wie geht's" by allowing an internal quote
 * that is immediately followed by one or two letters.
 */
function quoted(text: string): string {
  const re = /'([^']*(?:'[a-zäöüß]{1,2}\b[^']*)*)'|"([^"]+)"|„([^“”]+)[“”]/g;
  const found: string[] = [];
  let m: RegExpExecArray | null;
  while ((m = re.exec(text))) {
    const v = (m[1] ?? m[2] ?? m[3] ?? '').trim();
    if (v) found.push(v);
  }
  if (!found.length) return '';
  return found.reduce((a, b) => (b.length > a.length ? b : a));
}

/** Pull word tiles out of "In sahi order lagao: [heiße / ich / Preeti]". */
function bracketTiles(text: string): string[] {
  const m = text.match(/\[([^\]]+)\]/);
  if (!m) return [];
  return m[1]
    .split(/[/,|]/)
    .map((s) => s.trim())
    .filter(Boolean);
}

function stripBracket(text: string): string {
  return text.replace(/\s*\[[^\]]+\]\s*/, ' ').replace(/\s*:\s*$/, '').trim();
}

function raw(x: RawExercise, ...keys: (keyof RawExercise)[]): string {
  for (const k of keys) {
    const v = x[k];
    if (typeof v === 'string' && v.trim()) return v.trim();
  }
  return '';
}

/**
 * Words that mark a string as German. Without this the distractor pool mixes
 * English MCQ options into German word banks — a tile tray of
 * ["Ich", "heiße", "Preeti", "live", "Yes", "old"] gives the answer away,
 * because the wrong tiles are obviously not part of a German sentence.
 */
const GERMAN_CHARS = /[äöüßÄÖÜ]/;
const GERMAN_WORDS = new Set([
  'ich', 'du', 'er', 'sie', 'es', 'wir', 'ihr', 'bin', 'bist', 'ist', 'sind', 'seid', 'war',
  'und', 'oder', 'aber', 'aus', 'in', 'an', 'auf', 'mit', 'von', 'zu', 'für', 'nach',
  'der', 'die', 'das', 'den', 'dem', 'ein', 'eine', 'einen', 'nicht', 'kein',
  'wie', 'wo', 'was', 'wer', 'wann', 'warum', 'woher',
  'heiße', 'heisse', 'heißt', 'heisst', 'komme', 'kommst', 'kommt', 'wohne', 'wohnst', 'wohnt',
  'spreche', 'sprichst', 'spricht', 'lerne', 'lernst', 'geht', 'gehts',
  'guten', 'gute', 'morgen', 'tag', 'abend', 'nacht', 'danke', 'bitte', 'hallo', 'tschüss',
  'ja', 'nein', 'mein', 'meine', 'dein', 'sehr', 'auch', 'hier', 'jetzt', 'stadt', 'name',
  'deutsch', 'deutschland', 'schön', 'gut',
]);

function looksGerman(s: string): boolean {
  if (GERMAN_CHARS.test(s)) return true;
  return tokenize(s).some((t) => GERMAN_WORDS.has(t.toLowerCase()));
}

export interface WordPool {
  /** Words drawn only from strings that read as German. */
  german: string[];
  /** Everything, used when the German pool is too thin to fill a tray. */
  all: string[];
}

/**
 * Build plausible wrong tiles for a word bank. Real distractors come from other
 * exercises in the same session, which keeps them thematically close — the whole
 * point of a word bank is that the wrong words are tempting.
 */
function distractors(answerWords: string[], pool: string[], want: number, seed: string): string[] {
  const taken = new Set(answerWords.map((w) => w.toLowerCase()));
  const candidates = seededShuffle(
    pool.filter((w) => w.length > 1 && !taken.has(w.toLowerCase())),
    seed
  );
  const out: string[] = [];
  for (const c of candidates) {
    if (out.length >= want) break;
    if (out.some((o) => o.toLowerCase() === c.toLowerCase())) continue;
    out.push(c);
  }
  return out;
}

/** Every word appearing in a session, split by whether its source looked German. */
export function buildWordPool(list: RawExercise[]): WordPool {
  const german = new Set<string>();
  const all = new Set<string>();

  const add = (source: string) => {
    if (!source) return;
    const isDe = looksGerman(source);
    for (const w of tokenize(source)) {
      all.add(w);
      if (isDe) german.add(w);
    }
  };

  for (const x of list) {
    add(raw(x, 'correctAnswer', 'correct_answer'));
    const opts = x.options;
    if (Array.isArray(opts)) opts.forEach((o) => typeof o === 'string' && add(o));
    // For matching, the keys are the German side by convention.
    else if (opts && typeof opts === 'object') Object.keys(opts).forEach(add);
  }
  return { german: Array.from(german), all: Array.from(all) };
}

/** Prefer German distractors; fall back to the full pool only if it's too thin. */
function poolFor(pool: WordPool, answer: string): string[] {
  if (looksGerman(answer) && pool.german.length >= 4) return pool.german;
  return pool.all;
}

export function normalizeExercise(x: RawExercise, index: number, pool: WordPool): Exercise {
  const rawType = (x.type || 'mcq').toLowerCase();
  const id = x.id || x._id || `ex_${index}`;
  let text = raw(x, 'prompt', 'questionText', 'question_text') || 'Answer the question';
  const answer = raw(x, 'correctAnswer', 'correct_answer');
  const audioUrl = raw(x, 'audioUrl', 'audio_url', 'reference_audio') || undefined;

  // Generated content carries writing hints inline as "\nHint: …" (the Question
  // schema has no hint column). Lift it out so it renders as scaffolding, not prompt.
  let inlineHint: string | undefined;
  const hintAt = text.search(/\nHint:\s*/);
  if (hintAt >= 0) {
    inlineHint = text.slice(hintAt).replace(/^\nHint:\s*/, '').trim();
    text = text.slice(0, hintAt).trim();
  }
  const hint = raw(x, 'prompt_hint', 'template_hint') || inlineHint || undefined;
  const xp = x.points ?? x.xpValue ?? x.xp_value ?? 5;
  const opts = x.options;
  const distractorPool = poolFor(pool, answer);
  const optionList = Array.isArray(opts) ? opts.filter((o): o is string => typeof o === 'string') : [];

  const base = { id, rawType, prompt: text, answer, audioUrl, hint, xp, target: answer || quoted(text) };

  // ── matching: options is an object { German: English } ──────────────
  if (rawType === 'matching' && opts && !Array.isArray(opts) && typeof opts === 'object') {
    const pairs = Object.entries(opts).map(([left, right]) => ({ left, right: String(right) }));
    return { ...base, kind: 'match', pairs, answer: '', target: pairs[0]?.left || '' };
  }

  // ── word_gender: der / die / das ────────────────────────────────────
  if (rawType === 'word_gender') {
    const word = quoted(text) || answer;
    return {
      ...base,
      kind: 'gender',
      choices: optionList.length ? optionList : ['der', 'die', 'das'],
      target: word,
    };
  }

  // ── error_spot: "Galti dhoondo: 'Ich bist Preeti.'" → tap the bad word
  if (rawType === 'error_spot') {
    const sentence = quoted(text);
    const arrow = answer.split(/→|->/).map((s) => s.trim());
    const words = sentence ? sentence.split(/\s+/).filter(Boolean) : [];
    if (words.length && arrow.length === 2) {
      return {
        ...base,
        kind: 'error_spot',
        words,
        fix: { wrong: arrow[0], right: arrow[1] },
        target: sentence,
        prompt: text.split(':')[0].trim() || 'Find the mistake',
      };
    }
    return { ...base, kind: 'free_write' };
  }

  // ── dictation: hear it, type it ─────────────────────────────────────
  if (rawType === 'dictation') {
    return { ...base, kind: 'dictation', target: answer };
  }

  // ── fill_blank: '___! Wie geht's?' ──────────────────────────────────
  if (rawType === 'fill_blank' || rawType === 'writing') {
    const segments = text.includes('___') ? text.split('___') : [text, ''];
    const tiles = seededShuffle(
      [answer, ...distractors(tokenize(answer), distractorPool, 3, id)],
      id + 'fb'
    );
    return { ...base, kind: 'fill_blank', segments, tiles, target: answer };
  }

  // ── sentence building / translation → word bank ─────────────────────
  if (BUILD_TYPES.includes(rawType)) {
    const fromBracket = bracketTiles(text);
    const answerWords = tokenize(answer);
    const core = fromBracket.length ? fromBracket : answerWords;
    // Only pad with distractors when the tiles are exactly the answer —
    // a bracketed set is already the intended tile list.
    const extra = fromBracket.length ? [] : distractors(answerWords, distractorPool, Math.min(3, Math.max(1, Math.floor(answerWords.length / 2))), id);
    const tiles = seededShuffle([...core, ...extra], id + 'wb');
    return {
      ...base,
      kind: 'wordbank',
      tiles,
      prompt: fromBracket.length ? stripBracket(text) : text,
      target: answer,
    };
  }

  // ── listening variants ──────────────────────────────────────────────
  if (LISTEN_TYPES.includes(rawType)) {
    let choices = optionList;
    if (!choices.length && rawType === 'true_false_audio') choices = ['True', 'False'];
    if (!choices.length && answer) {
      choices = seededShuffle([answer, ...distractors(tokenize(answer), distractorPool, 2, id)], id + 'lc');
    }
    return { ...base, kind: 'listen_choice', choices, target: answer || quoted(text) };
  }

  // ── speaking ────────────────────────────────────────────────────────
  if (SPEAK_TYPES.includes(rawType)) {
    const say = quoted(text) || answer;
    return { ...base, kind: 'speak', target: say, answer: say };
  }

  // ── open-ended writing / roleplay ───────────────────────────────────
  if (FREE_TYPES.includes(rawType)) {
    return { ...base, kind: 'free_write', answer: '', target: hint || '' };
  }

  // ── default: multiple choice ────────────────────────────────────────
  if (CHOICE_TYPES.includes(rawType) || optionList.length) {
    const choices = optionList.length
      ? optionList
      : seededShuffle([answer, ...distractors(tokenize(answer), distractorPool, 3, id)], id + 'mc');
    return { ...base, kind: 'choice', choices, target: quoted(text) || answer };
  }

  // Nothing matched and there are no options — the only honest fallback is typing.
  return { ...base, kind: 'dictation', target: answer };
}

export function normalizeSession(list: RawExercise[]): Exercise[] {
  const pool = buildWordPool(list);
  return list.map((x, i) => normalizeExercise(x, i, pool));
}

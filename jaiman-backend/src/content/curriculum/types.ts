/**
 * Curriculum source format.
 *
 * The question bank is not written by hand — it is GENERATED from this curated
 * data. Each vocab entry expands into ~6 exercises (recognition, production,
 * gender, cloze, listening, matching) and each grammar pattern into 2–3 more,
 * so 25 curated words per stage become ~150 correct questions per stage.
 * Write the German once, carefully; let the generator do the multiplication.
 */

export type Gender = 'der' | 'die' | 'das';

export interface VocabEntry {
  /** The German headword, without article: 'Bahnhof', 'trinken', 'teuer'. */
  de: string;
  /** Article for nouns; omit for verbs/adjectives/phrases. */
  g?: Gender;
  en: string;
  /** Example sentence that CONTAINS the exact headword — the generator blanks it for cloze. */
  ex: string;
  exEn: string;
}

export interface GrammarPattern {
  en: string;
  de: string;
}

export interface ErrorItem {
  /** Full sentence containing exactly one wrong word. */
  bad: string;
  wrong: string;
  right: string;
}

export interface ReadingQ {
  q: string;
  options: string[];
  a: string;
}

export interface WritingPrompt {
  prompt: string;
  hint: string;
}

export interface StageData {
  cityName: string;
  cityNameDe: string;
  emoji: string;
  theme: string;
  grammarNote: string;
  vocab: VocabEntry[];
  grammar: GrammarPattern[];
  errors: ErrorItem[];
  reading: { passage: string; qs: ReadingQ[] };
  speaking: string[];
  writing: WritingPrompt[];
}

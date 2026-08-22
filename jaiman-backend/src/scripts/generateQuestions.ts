import type { StageData, VocabEntry } from '../content/curriculum/types';

/**
 * Expands the curated curriculum into the full question bank.
 *
 * One vocab entry becomes up to six exercises across different sessions
 * (recognise, produce, gender, cloze, listen, match); one grammar pattern
 * becomes two (build the sentence, translate it). This is how ~200 curated
 * entries turn into 1,200+ questions whose German is guaranteed correct —
 * every sentence was written once, by hand, in the curriculum file.
 */

export interface GeneratedQuestion {
  questionId: string;
  sessionNumber: number;
  skillType: 'vocab' | 'grammar' | 'listening' | 'speaking' | 'reading' | 'writing';
  questionType: string;
  questionText: string;
  options?: string[] | Record<string, string>;
  correctAnswer?: string;
  xpValue: number;
  orderInSession: number;
}

export interface GeneratedStage {
  sessions: { sessionNumber: number; title: string; skillType: string }[];
  questions: GeneratedQuestion[];
  bossTest: { type: string; prompt: string; options?: string[]; correctAnswer?: string; points: number }[];
  totalXp: number;
}

/** Deterministic shuffle so re-seeding produces the same bank (stable question ids). */
function seededShuffle<T>(arr: T[], seed: string): T[] {
  let h = 2166136261;
  for (let i = 0; i < seed.length; i++) {
    h ^= seed.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  const out = [...arr];
  for (let i = out.length - 1; i > 0; i--) {
    h = Math.imul(h ^ (h >>> 15), 2246822507);
    h = Math.imul(h ^ (h >>> 13), 3266489909);
    const j = Math.abs(h) % (i + 1);
    const tmp = out[i] as T;
    out[i] = out[j] as T;
    out[j] = tmp;
  }
  return out;
}

/** The correct answer plus n wrong ones from the pool, shuffled. */
function withDistractors(correct: string, pool: string[], n: number, seed: string): string[] {
  const wrong = seededShuffle(
    pool.filter((p) => p !== correct),
    seed
  ).slice(0, n);
  return seededShuffle([correct, ...wrong], seed + 'x');
}

function blank(sentence: string, word: string): string | null {
  if (!sentence.includes(word)) return null;
  return sentence.replace(word, '___');
}

const slugify = (s: string) =>
  s.toLowerCase().replace(/ä/g, 'ae').replace(/ö/g, 'oe').replace(/ü/g, 'ue').replace(/ß/g, 'ss').replace(/[^a-z0-9]/g, '');

export function generateForStage(stage: StageData, stageNumber: number): GeneratedStage {
  const slug = slugify(stage.cityNameDe);
  const questions: GeneratedQuestion[] = [];
  let counter = 0;

  const enPool = stage.vocab.map((v) => v.en);
  const dePool = stage.vocab.map((v) => v.de);
  const nouns = stage.vocab.filter((v) => v.g);

  const push = (
    sessionNumber: number,
    skillType: GeneratedQuestion['skillType'],
    questionType: string,
    questionText: string,
    extra: Partial<GeneratedQuestion> = {},
    xpValue = 5
  ) => {
    counter += 1;
    questions.push({
      questionId: `${slug}_${String(counter).padStart(3, '0')}`,
      sessionNumber,
      skillType,
      questionType,
      questionText,
      xpValue,
      orderInSession: questions.filter((q) => q.sessionNumber === sessionNumber).length + 1,
      ...extra,
    });
  };

  // ── Bite-sized sessions ─────────────────────────────────────────────
  // Duolingo lessons run 10–15 questions; our first cut packed up to 35 into
  // one session, which with 5 hearts was a wall, not a lesson. Same question
  // bank, now dealt into ~13 short sessions per stage.

  const half = Math.ceil(stage.vocab.length / 2);
  const firstHalf = stage.vocab.slice(0, half);
  const secondHalf = stage.vocab.slice(half);

  // S1–S2: recognise German → English
  for (const v of firstHalf) {
    push(1, 'vocab', 'mcq', `What does '${v.de}' mean?`, {
      options: withDistractors(v.en, enPool, 3, v.de),
      correctAnswer: v.en,
    });
  }
  for (const v of secondHalf) {
    push(2, 'vocab', 'mcq', `What does '${v.de}' mean?`, {
      options: withDistractors(v.en, enPool, 3, v.de),
      correctAnswer: v.en,
    });
  }

  // S3–S4: produce English → German
  for (const v of firstHalf) {
    push(3, 'vocab', 'reverse_mcq', `How do you say '${v.en}' in German?`, {
      options: withDistractors(v.de, dePool, 3, v.en),
      correctAnswer: v.de,
    });
  }
  for (const v of secondHalf) {
    push(4, 'vocab', 'reverse_mcq', `How do you say '${v.en}' in German?`, {
      options: withDistractors(v.de, dePool, 3, v.en),
      correctAnswer: v.de,
    });
  }

  // S5: der/die/das + matching
  for (const v of seededShuffle(nouns, slug + 'g').slice(0, 8)) {
    push(5, 'vocab', 'word_gender', `Which article does '${v.de}' take?`, {
      options: ['der', 'die', 'das'],
      correctAnswer: v.g as string,
    });
  }
  const matchable = seededShuffle(stage.vocab, slug + 'm');
  for (let i = 0; i + 4 <= Math.min(matchable.length, 12); i += 4) {
    const four = matchable.slice(i, i + 4);
    const pairs: Record<string, string> = {};
    four.forEach((v) => (pairs[v.de] = v.en));
    push(5, 'vocab', 'matching', 'Match the German words to their meanings', { options: pairs });
  }

  // S6: build sentences + spot errors
  for (const g of stage.grammar) {
    const tiles = g.de.replace(/[?.!,]/g, '').split(/\s+/).join(' / ');
    push(6, 'grammar', 'sentence_build', `Arrange the words: '${g.en}' [${tiles}]`, {
      correctAnswer: g.de,
    });
  }
  for (const e of stage.errors) {
    push(6, 'grammar', 'error_spot', `Find the mistake: '${e.bad}'`, {
      correctAnswer: `${e.wrong} → ${e.right}`,
    });
  }

  // S7–S8: translation, then cloze on the vocab's example sentences
  for (const g of stage.grammar) {
    push(7, 'grammar', 'translate', `Translate: '${g.en}'`, { correctAnswer: g.de }, 6);
  }
  const blanks = stage.vocab
    .map((v) => ({ v, b: blank(v.ex, v.de) }))
    .filter((x): x is { v: VocabEntry; b: string } => !!x.b);
  for (const { v, b } of blanks.slice(0, 4)) {
    push(7, 'grammar', 'fill_blank', `${b} (${v.exEn})`, { correctAnswer: v.de });
  }
  for (const { v, b } of blanks.slice(4, 16)) {
    push(8, 'grammar', 'fill_blank', `${b} (${v.exEn})`, { correctAnswer: v.de });
  }

  // S9: listening (TTS speaks the answer — no audio files needed)
  for (const v of seededShuffle(stage.vocab, slug + 'l').slice(0, 10)) {
    push(9, 'listening', 'listening_mcq', 'Listen and choose what you hear', {
      options: withDistractors(v.de, dePool, 2, v.de + 'l'),
      correctAnswer: v.de,
    });
  }

  // S10: dictation — the hard listening format gets its own short session
  for (const g of seededShuffle(stage.grammar, slug + 'd').slice(0, 5)) {
    push(10, 'listening', 'dictation', 'Listen and type what you hear', { correctAnswer: g.de }, 8);
  }

  // S11: speaking
  for (const sPhrase of stage.speaking) {
    push(11, 'speaking', 'shadowing', `Say this aloud: '${sPhrase}'`, { correctAnswer: sPhrase }, 8);
  }
  const hard = stage.vocab.filter((v) => /[äöüß]/.test(v.de)).slice(0, 2);
  for (const v of hard) {
    push(11, 'speaking', 'pronunciation_focus', `Practise the sound: say '${v.de}'`, { correctAnswer: v.de }, 8);
  }

  // S12: reading
  for (const rq of stage.reading.qs) {
    push(
      12,
      'reading',
      'comprehension_mcq',
      `${stage.reading.passage}\n\n${rq.q}`,
      { options: rq.options, correctAnswer: rq.a },
      6
    );
  }
  for (const v of seededShuffle(stage.vocab.filter((x) => stage.reading.passage.includes(x.de)), slug + 'r').slice(0, 3)) {
    push(12, 'reading', 'vocab_in_context', `In the passage, what does '${v.de}' mean?`, {
      options: withDistractors(v.en, enPool, 2, v.de + 'r'),
      correctAnswer: v.en,
    }, 6);
  }

  // S13: writing
  for (const w of stage.writing) {
    push(13, 'writing', 'guided_paragraph', `${w.prompt}\nHint: ${w.hint}`, {}, 7);
  }
  for (const g of seededShuffle(stage.grammar, slug + 'w').slice(0, 4)) {
    const words = g.de.replace(/[?.!,]/g, '').split(/\s+/);
    if (words.length < 3) continue;
    const missing = words[Math.abs(slug.length + words.length) % (words.length - 1) + 1] ?? words[1];
    if (!missing) continue;
    push(13, 'writing', 'fill_blank', `${g.de.replace(missing, '___')} (${g.en})`, { correctAnswer: missing }, 6);
  }

  // ── Boss test: the hardest formats, embedded on the Stage doc ───────
  const bossTest: GeneratedStage['bossTest'] = [];
  for (const g of seededShuffle(stage.grammar, slug + 'b').slice(0, 3)) {
    bossTest.push({ type: 'translate', prompt: `Translate: '${g.en}'`, correctAnswer: g.de, points: 10 });
  }
  for (const g of seededShuffle(stage.grammar, slug + 'b2').slice(3, 6)) {
    const tiles = g.de.replace(/[?.!,]/g, '').split(/\s+/).join(' / ');
    bossTest.push({ type: 'sentence_build', prompt: `Arrange: '${g.en}' [${tiles}]`, correctAnswer: g.de, points: 10 });
  }
  for (const v of seededShuffle(stage.vocab, slug + 'b3').slice(0, 2)) {
    bossTest.push({
      type: 'mcq',
      prompt: `What does '${v.de}' mean?`,
      options: withDistractors(v.en, enPool, 3, v.de + 'b'),
      correctAnswer: v.en,
      points: 10,
    });
  }
  for (const e of stage.errors.slice(0, 2)) {
    bossTest.push({ type: 'error_spot', prompt: `Find the mistake: '${e.bad}'`, correctAnswer: `${e.wrong} → ${e.right}`, points: 10 });
  }

  const totalXp =
    questions.reduce((a, q) => a + q.xpValue, 0) + bossTest.reduce((a, b) => a + b.points, 0);

  return {
    sessions: [
      { sessionNumber: 1, title: 'New Words I', skillType: 'vocab' },
      { sessionNumber: 2, title: 'New Words II', skillType: 'vocab' },
      { sessionNumber: 3, title: 'Say It in German I', skillType: 'vocab' },
      { sessionNumber: 4, title: 'Say It in German II', skillType: 'vocab' },
      { sessionNumber: 5, title: 'der, die, das & Match', skillType: 'vocab' },
      { sessionNumber: 6, title: 'Build Sentences', skillType: 'grammar' },
      { sessionNumber: 7, title: 'Translate', skillType: 'grammar' },
      { sessionNumber: 8, title: 'Fill the Blanks', skillType: 'grammar' },
      { sessionNumber: 9, title: 'Listening', skillType: 'listening' },
      { sessionNumber: 10, title: 'Dictation', skillType: 'listening' },
      { sessionNumber: 11, title: 'Speaking', skillType: 'speaking' },
      { sessionNumber: 12, title: 'Reading', skillType: 'reading' },
      { sessionNumber: 13, title: 'Writing', skillType: 'writing' },
    ],
    questions,
    bossTest,
    totalXp,
  };
}

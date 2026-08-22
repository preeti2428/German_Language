/**
 * Answer matching for German.
 *
 * The old checker was `provided.trim().toLowerCase() === correct.trim().toLowerCase()`,
 * which fails a learner who types "Ich heisse Preeti" instead of "Ich heiße Preeti"
 * — or who omits the final period. That is the fastest way to make a language app
 * feel hostile. These helpers fold the differences that don't mean anything.
 */

/** ä→a, ö→o, ü→u, ß→ss, and the "ae/oe/ue" spellings people type on a QWERTY keyboard. */
export function foldGerman(s: string): string {
  return s
    .toLowerCase()
    .replace(/ä/g, 'a')
    .replace(/ö/g, 'o')
    .replace(/ü/g, 'u')
    .replace(/ß/g, 'ss')
    .replace(/ae/g, 'a')
    .replace(/oe/g, 'o')
    .replace(/ue/g, 'u');
}

/** Strip punctuation and collapse whitespace, keeping letters and digits. */
export function normalizeText(s: string): string {
  return foldGerman(s || '')
    .replace(/[.,!?;:"'„“”…\-–—()\[\]]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

export function tokenize(s: string): string[] {
  return (s || '')
    .replace(/[.,!?;:"'„“”…]/g, '')
    .split(/\s+/)
    .filter(Boolean);
}

/** Levenshtein distance, used to forgive a single typo in longer answers. */
export function editDistance(a: string, b: string): number {
  if (a === b) return 0;
  if (!a.length) return b.length;
  if (!b.length) return a.length;
  let prev = Array.from({ length: b.length + 1 }, (_, i) => i);
  for (let i = 1; i <= a.length; i++) {
    const curr = [i];
    for (let j = 1; j <= b.length; j++) {
      curr[j] = Math.min(
        prev[j] + 1,
        curr[j - 1] + 1,
        prev[j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1)
      );
    }
    prev = curr;
  }
  return prev[b.length];
}

export type Grade = {
  correct: boolean;
  /** True when the answer was accepted but the spelling drifted — worth showing. */
  typo: boolean;
};

/**
 * Grade a typed answer. Exact after normalization is correct; one edit per
 * ~8 characters is accepted as a typo (capped at 2) so long sentences stay fair
 * without letting a wrong word through on a short one.
 */
export function gradeText(input: string, expected: string, opts?: { strict?: boolean }): Grade {
  const a = normalizeText(input);
  const b = normalizeText(expected);
  if (!b) return { correct: !!a, typo: false };
  if (a === b) return { correct: true, typo: false };
  if (opts?.strict) return { correct: false, typo: false };

  const budget = Math.min(2, Math.floor(b.length / 8));
  if (budget > 0 && editDistance(a, b) <= budget) return { correct: true, typo: true };
  return { correct: false, typo: false };
}

/** Word-order-insensitive check, for exercises that only care about content words. */
export function gradeKeywords(input: string, keywords: string[]): number {
  const hay = normalizeText(input);
  if (!hay) return 0;
  const hits = keywords.filter((k) => hay.includes(normalizeText(k)));
  return keywords.length ? hits.length / keywords.length : 0;
}

/** Deterministic shuffle so the same exercise doesn't reshuffle on every re-render. */
export function seededShuffle<T>(arr: T[], seed: string): T[] {
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
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
}

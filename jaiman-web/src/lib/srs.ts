'use client';

import { today } from './streak';

/**
 * Spaced repetition (Leitner boxes) for flashcards.
 *
 * "Got it" moves a card up a box; each box waits longer before the card is
 * due again (1 → 3 → 7 → 14 → 30 days). "Later" drops the card back to box 0
 * and keeps it due today, so it returns before the session ends. This replaces
 * the old mastered-once-forever set, which never resurfaced anything —
 * the opposite of how memory works.
 */

const KEY = 'jaiman.srs';
const LEGACY_KEY = 'jaiman.decks';

const INTERVALS = [1, 3, 7, 14, 30]; // days until due, by box (after promotion)

export interface CardState {
  box: number; // 0 = new/forgotten … 5 = fully mastered
  due: string; // YYYY-MM-DD
}

type Store = Record<string, Record<string, CardState>>;

function addDays(base: string, days: number): string {
  const [y, m, d] = base.split('-').map(Number);
  const dt = new Date(y, m - 1, d + days);
  return today(dt);
}

export function readSrs(): Store {
  if (typeof window === 'undefined') return {};
  try {
    const store = JSON.parse(window.localStorage.getItem(KEY) || '{}') as Store;
    // One-time migration from the old "mastered fronts" format.
    const legacy = window.localStorage.getItem(LEGACY_KEY);
    if (legacy) {
      const old = JSON.parse(legacy) as Record<string, string[]>;
      for (const [deck, fronts] of Object.entries(old)) {
        store[deck] = store[deck] ?? {};
        for (const f of fronts) {
          if (!store[deck][f]) store[deck][f] = { box: 2, due: addDays(today(), 3) };
        }
      }
      window.localStorage.removeItem(LEGACY_KEY);
      window.localStorage.setItem(KEY, JSON.stringify(store));
    }
    return store;
  } catch {
    return {};
  }
}

function write(store: Store) {
  try {
    window.localStorage.setItem(KEY, JSON.stringify(store));
  } catch {
    /* per-device convenience */
  }
}

/** Grade one card. Returns the updated store. */
export function gradeCard(deckId: string, front: string, gotIt: boolean): Store {
  const store = readSrs();
  const deck = (store[deckId] = store[deckId] ?? {});
  const cur = deck[front] ?? { box: 0, due: today() };
  if (gotIt) {
    const box = Math.min(cur.box + 1, INTERVALS.length);
    deck[front] = { box, due: addDays(today(), INTERVALS[box - 1] ?? 30) };
  } else {
    deck[front] = { box: 0, due: today() };
  }
  write(store);
  return store;
}

export interface DeckStats {
  /** % of cards answered "Got it" at least once — drives sequential unlock. */
  seenPct: number;
  /** % of cards in box ≥ 2 — remembered across a gap, shown on the ring. */
  masteredPct: number;
  /** Cards due for review today (includes new cards). */
  due: number;
}

export function deckStats(store: Store, deckId: string, fronts: string[]): DeckStats {
  const deck = store[deckId] ?? {};
  const t = today();
  let seen = 0;
  let mastered = 0;
  let due = 0;
  for (const f of fronts) {
    const st = deck[f];
    if (st && st.box >= 1) seen++;
    if (st && st.box >= 2) mastered++;
    if (!st || st.due <= t) due++;
  }
  const n = fronts.length || 1;
  return {
    seenPct: Math.round((seen / n) * 100),
    masteredPct: Math.round((mastered / n) * 100),
    due,
  };
}

/** Study order: due cards first (new before lapsed), then future-due for extra review. */
export function studyQueue(store: Store, deckId: string, fronts: string[]): string[] {
  const deck = store[deckId] ?? {};
  const t = today();
  const isNew = (f: string) => !deck[f];
  const isDue = (f: string) => deck[f] !== undefined && deck[f]!.due <= t;
  return [
    ...fronts.filter(isNew),
    ...fronts.filter(isDue),
    ...fronts.filter((f) => !isNew(f) && !isDue(f)),
  ];
}

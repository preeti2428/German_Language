'use client';

/**
 * Daily streak.
 *
 * The User schema already has `streak.current`, `streak.longest` and
 * `activityHistory` — none of it was ever written to. This keeps the streak on
 * the device so it works immediately (including for signed-out learners), and
 * `syncPayload()` hands the backend everything it needs once the server route
 * exists. Local is the source of truth for display; the server wins on conflict
 * after login.
 */

const KEY = 'jaiman.streak';

export interface StreakState {
  current: number;
  longest: number;
  lastActiveDate: string; // YYYY-MM-DD, local time
  history: Record<string, number>; // date -> xp earned
}

const EMPTY: StreakState = { current: 0, longest: 0, lastActiveDate: '', history: {} };

/** Local calendar date — not UTC, or the streak breaks for anyone east of London. */
export function today(d = new Date()): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

function daysBetween(a: string, b: string): number {
  const [ay, am, ad] = a.split('-').map(Number);
  const [by, bm, bd] = b.split('-').map(Number);
  const ms = Date.UTC(by, bm - 1, bd) - Date.UTC(ay, am - 1, ad);
  return Math.round(ms / 86400000);
}

export function readStreak(): StreakState {
  if (typeof window === 'undefined') return { ...EMPTY };
  try {
    const raw = window.localStorage.getItem(KEY);
    if (!raw) return { ...EMPTY };
    return { ...EMPTY, ...(JSON.parse(raw) as StreakState) };
  } catch {
    return { ...EMPTY };
  }
}

function write(s: StreakState) {
  try {
    window.localStorage.setItem(KEY, JSON.stringify(s));
  } catch {
    /* storage unavailable — the streak just won't persist */
  }
}

export interface StreakResult extends StreakState {
  /** True when this session started a new day on the streak. */
  extended: boolean;
  /** True when a gap reset the count to 1. */
  broken: boolean;
}

/** Call once per completed lesson. Idempotent within the same day. */
export function recordActivity(xpEarned: number, now = new Date()): StreakResult {
  const state = readStreak();
  const day = today(now);

  let extended = false;
  let broken = false;

  if (state.lastActiveDate === day) {
    // Already counted today; just add the XP.
  } else if (!state.lastActiveDate) {
    state.current = 1;
    extended = true;
  } else {
    const gap = daysBetween(state.lastActiveDate, day);
    if (gap === 1) {
      state.current += 1;
      extended = true;
    } else if (gap > 1) {
      state.current = 1;
      broken = true;
    }
  }

  state.lastActiveDate = day;
  state.longest = Math.max(state.longest, state.current);
  state.history[day] = (state.history[day] ?? 0) + Math.max(0, xpEarned);

  // Keep roughly a year of history so the calendar heatmap has something to draw.
  const keys = Object.keys(state.history).sort();
  if (keys.length > 400) {
    for (const k of keys.slice(0, keys.length - 400)) delete state.history[k];
  }

  write(state);
  return { ...state, extended, broken };
}

/** Shape to POST once a server route accepts it. */
export function syncPayload(): Pick<StreakState, 'current' | 'longest' | 'lastActiveDate'> & {
  activityHistory: { date: string; xpEarned: number }[];
} {
  const s = readStreak();
  return {
    current: s.current,
    longest: s.longest,
    lastActiveDate: s.lastActiveDate,
    activityHistory: Object.entries(s.history).map(([date, xpEarned]) => ({ date, xpEarned })),
  };
}

/** Days since the last activity — 0 today, 1 yesterday. */
export function daysSinceActive(now = new Date()): number | null {
  const s = readStreak();
  if (!s.lastActiveDate) return null;
  return daysBetween(s.lastActiveDate, today(now));
}

/* ── Server sync ───────────────────────────────────────────────────────
 * The account is now the source of truth: the backend records streak and
 * daily XP on every completed session. This merges what the server knows
 * into the local store (used by every header chip and the dashboard), taking
 * the best of both so an offline lesson is never lost.
 */

export interface ServerActivity {
  streak?: { current?: number; longest?: number; lastActiveDate?: string | Date };
  activityHistory?: { date: string; xpEarned: number }[];
}

export function syncStreakFromServer(server: ServerActivity | null | undefined): void {
  if (!server || typeof window === 'undefined') return;
  const local = readStreak();

  const serverLast = server.streak?.lastActiveDate ? today(new Date(server.streak.lastActiveDate)) : '';
  const serverCurrent = server.streak?.current ?? 0;

  // Whichever side has practised more recently owns the current streak.
  if (serverLast >= (local.lastActiveDate || '')) {
    local.current = serverCurrent;
    local.lastActiveDate = serverLast || local.lastActiveDate;
  }
  local.longest = Math.max(local.longest, server.streak?.longest ?? 0, local.current);

  for (const a of server.activityHistory ?? []) {
    local.history[a.date] = Math.max(local.history[a.date] ?? 0, a.xpEarned);
  }

  try {
    window.localStorage.setItem(KEY, JSON.stringify(local));
  } catch {
    /* storage unavailable */
  }
}

/* ── Tutor usage, for the daily quest and the Speaker badge ──────────── */

const TUTOR_KEY = 'jaiman.tutor';

export function recordTutorTurn(): void {
  try {
    const raw = JSON.parse(window.localStorage.getItem(TUTOR_KEY) || '{}');
    const day = today();
    window.localStorage.setItem(
      TUTOR_KEY,
      JSON.stringify({
        total: (raw.total ?? 0) + 1,
        today: raw.date === day ? (raw.today ?? 0) + 1 : 1,
        date: day,
      })
    );
  } catch {
    /* per-device convenience only */
  }
}

export function readTutorTurns(): { total: number; today: number } {
  try {
    const raw = JSON.parse(window.localStorage.getItem(TUTOR_KEY) || '{}');
    return { total: raw.total ?? 0, today: raw.date === today() ? raw.today ?? 0 : 0 };
  } catch {
    return { total: 0, today: 0 };
  }
}

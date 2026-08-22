'use client';

import { useEffect, useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Check, ChevronLeft, Layers, Volume2, X } from 'lucide-react';
import api from '@/lib/api';
import PageShell from '@/components/layout/PageShell';
import { speakGerman } from '@/lib/speech';

/**
 * Flashcards, rebuilt to the design canvas — and now REAL: decks are the
 * seeded A1 cities and cards come from each stage's vocabSet, so this reviews
 * the same words the lessons teach (the old page used three hardcoded decks).
 * "Got it" progress persists per deck in localStorage.
 */

const DECK_COLORS = [
  { color: '#4361EE', bg: '#EEF2FF', shadow: '#3046B2' },
  { color: '#FF9F43', bg: '#FFF4E6', shadow: '#D97F27' },
  { color: '#20BF6B', bg: '#E8FBF0', shadow: '#178B4E' },
  { color: '#CE82FF', bg: '#F7EDFF', shadow: '#A85FD6' },
  { color: '#FF4757', bg: '#FFF0F0', shadow: '#CC3946' },
  { color: '#4CC9F0', bg: '#E8F8FE', shadow: '#2FA3C9' },
];

interface Card {
  front: string;
  back: string;
  gender?: string;
}

interface Deck {
  id: string;
  title: string;
  city: string;
  cards: Card[];
  color: string;
  bg: string;
  shadow: string;
}

const KEY = 'jaiman.decks';

function readMastery(): Record<string, string[]> {
  try {
    return JSON.parse(window.localStorage.getItem(KEY) || '{}');
  } catch {
    return {};
  }
}

function writeMastery(m: Record<string, string[]>) {
  try {
    window.localStorage.setItem(KEY, JSON.stringify(m));
  } catch {
    /* per-device convenience only */
  }
}

export default function FlashcardsPage() {
  const [decks, setDecks] = useState<Deck[]>([]);
  const [loading, setLoading] = useState(true);
  const [mastery, setMastery] = useState<Record<string, string[]>>({});
  const [openDeck, setOpenDeck] = useState<Deck | null>(null);
  const [cardIdx, setCardIdx] = useState(0);
  const [flipped, setFlipped] = useState(false);

  useEffect(() => {
    setMastery(readMastery());
    api
      .get('/stages/section/A1')
      .then((res) => {
        /* eslint-disable @typescript-eslint/no-explicit-any */
        const mapped: Deck[] = (res.data as any[])
          .filter((s) => s.vocabSet?.length)
          .map((s, i) => ({
            id: s._id,
            title: s.theme,
            city: s.cityNameDe,
            cards: s.vocabSet.map((v: any) => ({
              front: v.word,
              back: v.translation,
              gender: v.gender !== 'none' ? v.gender : undefined,
            })),
            ...DECK_COLORS[i % DECK_COLORS.length],
          }));
        /* eslint-enable @typescript-eslint/no-explicit-any */
        setDecks(mapped);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const deckPct = (d: Deck) => {
    const done = mastery[d.id]?.length ?? 0;
    return d.cards.length ? Math.round((done / d.cards.length) * 100) : 0;
  };

  /** Cards not yet mastered come first, so studying always shows what's left. */
  const studyCards = useMemo(() => {
    if (!openDeck) return [];
    const done = new Set(mastery[openDeck.id] ?? []);
    return [...openDeck.cards.filter((c) => !done.has(c.front)), ...openDeck.cards.filter((c) => done.has(c.front))];
  }, [openDeck, mastery]);

  const card = studyCards[cardIdx];

  function advance(gotIt: boolean) {
    if (!openDeck || !card) return;
    if (gotIt) {
      const next = { ...mastery };
      const list = new Set(next[openDeck.id] ?? []);
      list.add(card.front);
      next[openDeck.id] = Array.from(list);
      setMastery(next);
      writeMastery(next);
    }
    setFlipped(false);
    setCardIdx((i) => (i + 1) % studyCards.length);
  }

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-[#E8ECEF]">
        <div className="h-9 w-9 animate-spin rounded-full border-4 border-[#4361EE] border-t-transparent" />
      </div>
    );
  }

  return (
    <PageShell crumb="Review" title="Flashcards 🃏">
      {!openDeck ? (
        <>
          <div className="mb-6 flex flex-wrap items-end justify-between gap-5">
            <p className="max-w-[460px] text-base font-semibold text-[#8A94A2]">
              Review vocabulary from every city you&apos;ve visited. Tap a card to hear it spoken.
            </p>
            <div className="dj-chip dj-chip-streak">
              <Layers size={17} />
              <span className="text-[11px] uppercase tracking-[0.08em]">{decks.length} decks</span>
            </div>
          </div>

          {!decks.length && (
            <div className="duo-card p-10 text-center font-bold text-[#8A94A2]">
              No decks yet — seed the course on the backend first.
            </div>
          )}

          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {decks.map((d) => {
              const pct = deckPct(d);
              const dash = 113 - (113 * pct) / 100;
              return (
                <button
                  key={d.id}
                  type="button"
                  onClick={() => {
                    setOpenDeck(d);
                    setCardIdx(0);
                    setFlipped(false);
                  }}
                  className="flex cursor-pointer flex-col gap-5 rounded-[30px] border-2 border-b-[5px] border-[#e5e5e5] bg-white p-6 text-left transition-transform hover:-translate-y-1"
                  style={{ borderTop: `8px solid ${d.color}` }}
                >
                  <div className="flex items-start justify-between">
                    <div
                      className="flex h-14 w-14 items-center justify-center rounded-[20px] text-white"
                      style={{ background: d.color, boxShadow: '0 4px 0 rgba(0,0,0,0.14)' }}
                    >
                      <Layers size={25} />
                    </div>
                    <div className="relative flex h-14 w-14 items-center justify-center">
                      <svg width="56" height="56" viewBox="0 0 56 56" className="absolute -rotate-90">
                        <circle cx="28" cy="28" r="18" fill="none" stroke="#EEF1F5" strokeWidth="7" />
                        <circle cx="28" cy="28" r="18" fill="none" stroke={d.color} strokeWidth="7" strokeLinecap="round" strokeDasharray="113" strokeDashoffset={dash} />
                      </svg>
                      <span className="text-[11px] font-black" style={{ color: d.color }}>{pct}%</span>
                    </div>
                  </div>
                  <div>
                    <p className="text-[10px] font-black uppercase tracking-[0.14em]" style={{ color: d.color }}>{d.city}</p>
                    <h3 className="mt-1 text-xl font-black tracking-[-0.02em] text-[#1F2328]">{d.title}</h3>
                  </div>
                  <div className="mt-auto flex items-center justify-between">
                    <span className="rounded-xl px-3 py-1.5 text-xs font-black" style={{ background: d.bg, color: d.color }}>
                      {d.cards.length} cards
                    </span>
                    {pct === 100 && (
                      <span className="flex items-center gap-1.5 text-[10px] font-black uppercase tracking-[0.1em] text-[#20BF6B]">
                        <Check size={14} strokeWidth={4} /> Mastered
                      </span>
                    )}
                  </div>
                </button>
              );
            })}
          </div>
        </>
      ) : (
        <div className="mx-auto flex max-w-[720px] flex-col gap-5">
          <div className="flex items-center justify-between gap-4">
            <button
              type="button"
              onClick={() => setOpenDeck(null)}
              className="flex items-center gap-2 text-[11px] font-black uppercase tracking-[0.12em] text-[#8A94A2] transition-colors hover:text-[#1F2328]"
            >
              <ChevronLeft size={17} strokeWidth={3.2} /> All decks
            </button>
            <div className="flex items-center gap-3">
              <span className="text-lg font-black text-[#1F2328]">{openDeck.city}</span>
              <span className="rounded-[11px] px-3 py-1 text-xs font-black" style={{ background: openDeck.bg, color: openDeck.color }}>
                {cardIdx + 1} / {studyCards.length}
              </span>
            </div>
          </div>

          <div className="h-3 overflow-hidden rounded-full bg-[#DDE3E9]">
            <div
              className="h-full rounded-full transition-[width] duration-500"
              style={{ width: `${((cardIdx + 1) / Math.max(1, studyCards.length)) * 100}%`, background: openDeck.color }}
            />
          </div>

          <AnimatePresence mode="wait">
            <motion.button
              key={`${cardIdx}-${flipped}`}
              type="button"
              initial={{ opacity: 0, rotateY: flipped ? -90 : 0 }}
              animate={{ opacity: 1, rotateY: 0 }}
              transition={{ duration: 0.2 }}
              onClick={() => {
                if (!flipped && card) void speakGerman(card.front.replace(/^(der|die|das)\s/, ''));
                setFlipped((f) => !f);
              }}
              className="relative flex h-[380px] cursor-pointer flex-col items-center justify-center rounded-[36px] p-10 text-center"
              style={
                flipped
                  ? { background: openDeck.color, border: '2px solid rgba(0,0,0,0.12)', borderBottomWidth: 8, color: '#fff' }
                  : { background: '#fff', border: '2px solid #e5e5e5', borderBottomWidth: 8 }
              }
            >
              {!flipped ? (
                <>
                  <span className="absolute left-6 top-6 rounded-xl bg-[#F4F6F8] px-3 py-1.5 text-[10px] font-black uppercase tracking-[0.14em] text-[#A8B2BE]">
                    German{card?.gender ? ` · ${card.gender}` : ''}
                  </span>
                  <h2 className="text-[clamp(34px,6vw,54px)] font-black tracking-[-0.04em] text-[#1F2328]">{card?.front}</h2>
                  <span className="absolute bottom-6 flex items-center gap-2 rounded-xl border-2 border-[#EEF1F5] bg-[#F8FAFB] px-4 py-2 text-[10px] font-black uppercase tracking-[0.12em] text-[#A8B2BE]">
                    <Volume2 size={13} /> Tap to flip
                  </span>
                </>
              ) : (
                <>
                  <span className="absolute left-6 top-6 rounded-xl bg-black/15 px-3 py-1.5 text-[10px] font-black uppercase tracking-[0.14em]">
                    English
                  </span>
                  <h2 className="text-[clamp(26px,4.5vw,40px)] font-black tracking-[-0.03em]">{card?.back}</h2>
                </>
              )}
            </motion.button>
          </AnimatePresence>

          <div className="flex justify-center gap-3.5">
            <button
              type="button"
              onClick={() => advance(false)}
              className="flex items-center gap-2.5 rounded-2xl border-2 border-[#E4E9EF] bg-white px-8 py-4 text-xs font-black uppercase tracking-[0.08em] text-[#FF4757] shadow-[0_4px_0_#E2E7EC] transition-transform active:translate-y-1 active:shadow-none"
            >
              <X size={17} strokeWidth={3.4} /> Later
            </button>
            <button
              type="button"
              onClick={() => advance(true)}
              className="flex items-center gap-2.5 rounded-2xl bg-[#20BF6B] px-8 py-4 text-xs font-black uppercase tracking-[0.08em] text-white shadow-[0_4px_0_#178B4E] transition-transform active:translate-y-1 active:shadow-none"
            >
              <Check size={17} strokeWidth={3.4} /> Got it
            </button>
          </div>
        </div>
      )}
    </PageShell>
  );
}

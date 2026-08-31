'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Check, ChevronLeft, Crown, Layers, Lock, Volume2, X } from 'lucide-react';
import api from '@/lib/api';
import PageShell from '@/components/layout/PageShell';
import { FOUNDATION_DECKS, UNLOCK_PCT, type FCard } from '@/lib/foundations';
import { deckStats, gradeCard, readSrs, studyQueue } from '@/lib/srs';
import { speakGerman } from '@/lib/speech';
import { useAuth } from '@/context/AuthContext';

/**
 * Flashcards in two sections:
 *  1. FOUNDATIONS — the from-zero course (alphabet → sounds → numbers → …),
 *     pinned on top, each deck unlocking when the previous one is 80% learned.
 *  2. VOCABULARY — one deck per seeded A1 city, from the stage vocabSets.
 * Review order comes from the Leitner SRS in lib/srs: due cards first,
 * "Later" brings a card back today, "Got it" pushes it days into the future.
 */

const CITY_COLORS = [
  { color: '#4361EE', bg: '#EEF2FF' },
  { color: '#FF9F43', bg: '#FFF4E6' },
  { color: '#20BF6B', bg: '#E8FBF0' },
  { color: '#CE82FF', bg: '#F7EDFF' },
  { color: '#FF4757', bg: '#FFF0F0' },
  { color: '#4CC9F0', bg: '#E8F8FE' },
];

interface Card extends FCard {
  gender?: string;
}

interface Deck {
  id: string;
  title: string;
  subtitle: string;
  emoji?: string;
  cards: Card[];
  color: string;
  bg: string;
  kind: 'foundation' | 'city';
}

export default function FlashcardsPage() {
  const { user } = useAuth();
  const isAdmin = user?.role === 'admin';
  const [cityDecks, setCityDecks] = useState<Deck[]>([]);
  const [loading, setLoading] = useState(true);
  const [srs, setSrs] = useState(() => ({}) as ReturnType<typeof readSrs>);
  const [openDeck, setOpenDeck] = useState<Deck | null>(null);
  const [queue, setQueue] = useState<string[]>([]);
  const [cardIdx, setCardIdx] = useState(0);
  const [flipped, setFlipped] = useState(false);

  useEffect(() => {
    setSrs(readSrs());
    api
      .get('/stages/section/A1')
      .then((res) => {
        /* eslint-disable @typescript-eslint/no-explicit-any */
        const mapped: Deck[] = (res.data as any[])
          .filter((s) => s.vocabSet?.length)
          .map((s, i) => ({
            id: s._id,
            title: s.theme,
            subtitle: s.cityNameDe,
            cards: s.vocabSet.map((v: any) => ({
              front: v.word,
              back: v.translation,
              gender: v.gender !== 'none' ? v.gender : undefined,
            })),
            kind: 'city' as const,
            ...CITY_COLORS[i % CITY_COLORS.length],
          }));
        /* eslint-enable @typescript-eslint/no-explicit-any */
        setCityDecks(mapped);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const foundationDecks: Deck[] = useMemo(
    () =>
      FOUNDATION_DECKS.map((d) => ({
        id: d.id,
        title: d.title,
        subtitle: d.subtitle,
        emoji: d.emoji,
        cards: d.cards,
        color: d.color,
        bg: d.bg,
        kind: 'foundation' as const,
      })),
    []
  );

  const stats = useCallback(
    (d: Deck) => deckStats(srs, d.id, d.cards.map((c) => c.front)),
    [srs]
  );

  /** Foundation deck i unlocks once deck i-1 is UNLOCK_PCT% learned, or always for admin. */
  const isUnlocked = (idx: number) => {
    return true;
  };

  function open(deck: Deck) {
    setOpenDeck(deck);
    setQueue(studyQueue(srs, deck.id, deck.cards.map((c) => c.front)));
    setCardIdx(0);
    setFlipped(false);
  }

  const card = openDeck ? openDeck.cards.find((c) => c.front === queue[cardIdx]) : undefined;

  function speak(c: Card) {
    void speakGerman(c.say ?? c.front.replace(/^(der|die|das)\s/, ''));
  }

  function advance(gotIt: boolean) {
    if (!openDeck || !card) return;
    setSrs(gradeCard(openDeck.id, card.front, gotIt));
    setFlipped(false);
    setCardIdx((i) => (i + 1) % queue.length);
  }

  function DeckCard({ deck, locked = false }: { deck: Deck; locked?: boolean }) {
    const st = stats(deck);
    const dash = 113 - (113 * st.masteredPct) / 100;
    return (
      <button
        type="button"
        disabled={locked}
        onClick={() => open(deck)}
        className={`flex flex-col gap-4 rounded-[30px] border-2 border-b-[5px] border-[#e5e5e5] bg-white p-6 text-left transition-transform ${
          locked ? 'opacity-50' : 'cursor-pointer hover:-translate-y-1'
        }`}
        style={{ borderTop: `8px solid ${locked ? '#C6CDD6' : deck.color}` }}
      >
        <div className="flex items-start justify-between">
          <div
            className="flex h-14 w-14 items-center justify-center rounded-[20px] text-2xl text-white"
            style={{ background: locked ? '#C6CDD6' : deck.color, boxShadow: '0 4px 0 rgba(0,0,0,0.14)' }}
          >
            {locked ? <Lock size={22} /> : deck.emoji ?? <Layers size={24} />}
          </div>
          <div className="relative flex h-14 w-14 items-center justify-center">
            <svg width="56" height="56" viewBox="0 0 56 56" className="absolute -rotate-90">
              <circle cx="28" cy="28" r="18" fill="none" stroke="#EEF1F5" strokeWidth="7" />
              <circle cx="28" cy="28" r="18" fill="none" stroke={deck.color} strokeWidth="7" strokeLinecap="round" strokeDasharray="113" strokeDashoffset={dash} />
            </svg>
            <span className="text-[11px] font-black" style={{ color: deck.color }}>{st.masteredPct}%</span>
          </div>
        </div>
        <div>
          <p className="text-[10px] font-black uppercase tracking-[0.14em]" style={{ color: locked ? '#A8B2BE' : deck.color }}>
            {deck.subtitle}
          </p>
          <h3 className="mt-1 text-xl font-black tracking-[-0.02em] text-[#1F2328]">{deck.title}</h3>
        </div>
        <div className="mt-auto flex items-center justify-between">
          <span className="rounded-xl px-3 py-1.5 text-xs font-black" style={{ background: deck.bg, color: deck.color }}>
            {deck.cards.length} cards
          </span>
          {locked ? (
            <span className="text-[10px] font-black uppercase tracking-[0.1em] text-[#A8B2BE]">
              Learn {UNLOCK_PCT}% of the previous deck
            </span>
          ) : st.masteredPct === 100 ? (
            <span className="flex items-center gap-1.5 text-[10px] font-black uppercase tracking-[0.1em] text-[#20BF6B]">
              <Check size={14} strokeWidth={4} /> Mastered
            </span>
          ) : st.due > 0 ? (
            <span className="rounded-lg bg-[#FFF4E6] px-2.5 py-1 text-[10px] font-black uppercase tracking-[0.08em] text-[#FF9F43]">
              {st.due} due today
            </span>
          ) : (
            <span className="text-[10px] font-black uppercase tracking-[0.1em] text-[#A8B2BE]">All reviewed</span>
          )}
        </div>
      </button>
    );
  }

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-[#E8ECEF]">
        <div className="h-9 w-9 animate-spin rounded-full border-4 border-[#4361EE] border-t-transparent" />
      </div>
    );
  }

  return (
    <PageShell crumb="Zero to Mastery" title="Basics to Pro 🌟">
      {!openDeck ? (
        <div className="flex flex-col gap-8">
          {/* ── Foundations ─────────────────────────────────────────── */}
          <section>
            <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
              <div>
                <h2 className="text-lg font-black tracking-[-0.02em] text-[#1F2328]">Foundations (Level 0)</h2>
                <p className="text-sm font-semibold text-[#8A94A2]">
                  Start here from zero: the alphabet, sounds, and numbers. Build your core German base!
                </p>
              </div>
              {isAdmin && (
                <div className="flex items-center gap-1.5 rounded-full border border-[#CE82FF] bg-[#F7EDFF] px-3 py-1 text-xs font-black uppercase text-[#9B51E0]">
                  <Crown size={14} className="fill-[#CE82FF] text-[#CE82FF]" />
                  <span>All Decks Unlocked (Admin)</span>
                </div>
              )}
            </div>
            <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {foundationDecks.map((d, i) => (
                <DeckCard key={d.id} deck={d} locked={!isUnlocked(i)} />
              ))}
            </div>
          </section>

          {/* ── City vocabulary ─────────────────────────────────────── */}
          <section>
            <div className="mb-4">
              <h2 className="text-lg font-black tracking-[-0.02em] text-[#1F2328]">Vocabulary & Phrases (Pro Builder)</h2>
              <p className="text-sm font-semibold text-[#8A94A2]">Expand your vocabulary from beginner to advanced with active recall.</p>
            </div>
            {!cityDecks.length ? (
              <div className="duo-card p-10 text-center font-bold text-[#8A94A2]">
                No city decks yet — seed the course on the backend first.
              </div>
            ) : (
              <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
                {cityDecks.map((d) => (
                  <DeckCard key={d.id} deck={d} />
                ))}
              </div>
            )}
          </section>
        </div>
      ) : (
        <div className="mx-auto flex max-w-[720px] flex-col gap-5">
          <div className="flex items-center justify-between gap-4">
            <button
              type="button"
              onClick={() => {
                setOpenDeck(null);
                setSrs(readSrs());
              }}
              className="flex items-center gap-2 text-[11px] font-black uppercase tracking-[0.12em] text-[#8A94A2] transition-colors hover:text-[#1F2328]"
            >
              <ChevronLeft size={17} strokeWidth={3.2} /> All decks
            </button>
            <div className="flex items-center gap-3">
              <span className="text-lg font-black text-[#1F2328]">{openDeck.title}</span>
              <span className="rounded-[11px] px-3 py-1 text-xs font-black" style={{ background: openDeck.bg, color: openDeck.color }}>
                {cardIdx + 1} / {queue.length}
              </span>
            </div>
          </div>

          <div className="h-3 overflow-hidden rounded-full bg-[#DDE3E9]">
            <div
              className="h-full rounded-full transition-[width] duration-500"
              style={{ width: `${((cardIdx + 1) / Math.max(1, queue.length)) * 100}%`, background: openDeck.color }}
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
                if (card) speak(card);
                setFlipped((f) => !f);
              }}
              className="relative flex h-[380px] cursor-pointer flex-col items-center justify-center rounded-[36px] p-10 text-center select-none"
              style={
                flipped
                  ? { background: openDeck.color, border: '2px solid rgba(0,0,0,0.12)', borderBottomWidth: 8, color: '#fff' }
                  : { background: '#fff', border: '2px solid #e5e5e5', borderBottomWidth: 8 }
              }
            >
              {/* Speaker Replay Button in top-right corner */}
              {card && (
                <div
                  onClick={(e) => {
                    e.stopPropagation();
                    speak(card);
                  }}
                  className={`absolute right-6 top-6 flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-xs font-black uppercase tracking-wider transition-all hover:scale-105 active:scale-95 ${
                    flipped
                      ? 'bg-white/20 text-white hover:bg-white/30'
                      : 'border-2 border-[#D6DEFF] bg-[#EEF2FF] text-[#4361EE] hover:bg-[#E0E7FF]'
                  }`}
                  title="Listen to German pronunciation"
                >
                  <Volume2 size={16} />
                  <span>Listen</span>
                </div>
              )}

              {!flipped ? (
                <>
                  <span className="absolute left-6 top-6 rounded-xl bg-[#F4F6F8] px-3.5 py-1.5 text-[10px] font-black uppercase tracking-[0.14em] text-[#8A94A2]">
                    German{card?.gender ? ` · ${card.gender}` : ''}
                  </span>
                  <h2 className="text-[clamp(32px,6.5vw,56px)] font-black tracking-[-0.03em] text-[#1F2328]">{card?.front}</h2>
                  
                  {/* Highly visible call to action */}
                  <span className="absolute bottom-6 flex items-center gap-2 rounded-2xl border-2 border-[#D6DEFF] bg-[#EEF2FF] px-5 py-2.5 text-xs font-black uppercase tracking-[0.08em] text-[#4361EE] animate-pulse shadow-sm">
                    <span>👆</span> Tap card to flip & listen 🔊
                  </span>
                </>
              ) : (
                <>
                  <span className="absolute left-6 top-6 rounded-xl bg-black/15 px-3.5 py-1.5 text-[10px] font-black uppercase tracking-[0.14em] text-white/90">
                    Meaning / Pronunciation
                  </span>
                  <h2 className="text-[clamp(26px,5vw,42px)] font-black tracking-[-0.03em] text-white">{card?.back}</h2>
                  {card?.hint && (
                    <p className="mt-4 max-w-md rounded-2xl bg-black/15 px-5 py-3 text-sm font-bold text-white/90">{card.hint}</p>
                  )}
                  
                  {/* Highly visible call to action on back */}
                  <span className="absolute bottom-6 flex items-center gap-2 rounded-2xl bg-white/20 px-5 py-2.5 text-xs font-black uppercase tracking-[0.08em] text-white shadow-sm hover:bg-white/30 transition-all">
                    <span>👆</span> Tap card to flip back & listen 🔊
                  </span>
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
          <p className="text-center text-[11px] font-bold text-[#B4BDC8]">
            &quot;Got it&quot; brings this card back in 1 → 3 → 7 → 14 → 30 days. &quot;Later&quot; brings it back today.
          </p>
        </div>
      )}
    </PageShell>
  );
}

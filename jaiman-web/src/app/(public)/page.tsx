'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';

/**
 * Landing page, ported from the "German with Jai · Landing" design canvas.
 * The phone mockup is a live, self-playing reel: a 4-second story timer
 * advances through German phrases while XP and the learner counter tick up.
 * Below it, the taste-test quiz lets a visitor answer one real question and
 * feel the XP hit before ever signing up.
 */

const REELS = [
  { level: 'A1 BEGINNER', de: 'Ich hätte gerne einen Kaffee.', en: 'I would like a coffee.' },
  { level: 'A1 BEGINNER', de: 'Wie komme ich zum Bahnhof?', en: 'How do I get to the station?' },
  { level: 'A2 EVERYDAY', de: 'Das ist mir zu teuer, ehrlich.', en: "That's too expensive for me, honestly." },
  { level: 'A2 EVERYDAY', de: 'Ich habe keine Ahnung.', en: 'I have no idea.' },
  { level: 'B1 FLUENT-ISH', de: 'Kannst du das kurz erklären?', en: 'Can you explain that briefly?' },
];

const OPTIONS = [
  { id: 0, label: 'Where is the train?' },
  { id: 1, label: 'I would like a coffee.' },
  { id: 2, label: 'The coffee is cold.' },
];

const TICKER = [
  'bite-sized lessons', 'daily streaks', 'native pronunciation', 'live classes with Jai',
  'AI tutor in any language', 'A1 → B2 paths', 'quizzes that stick', 'flashcards from zero',
];

export default function LandingPage() {
  const [reelIdx, setReelIdx] = useState(0);
  const [sec, setSec] = useState(4);
  const [xp, setXp] = useState(120);
  const [learners, setLearners] = useState(12480);
  const [picked, setPicked] = useState<number | null>(null);
  const timer = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    timer.current = setInterval(() => {
      setSec((s) => {
        if (s > 0) return s - 1;
        setReelIdx((i) => (i + 1) % REELS.length);
        setXp((x) => x + 10);
        setLearners((l) => l + 1);
        return 4;
      });
    }, 1000);
    return () => {
      if (timer.current) clearInterval(timer.current);
    };
  }, []);

  const reel = REELS[reelIdx];
  const correct = picked === 1;

  return (
    <div
      className="min-h-screen text-[#12131A]"
      style={{
        background:
          'radial-gradient(900px 520px at 78% -8%, rgba(43,68,212,.10), transparent 60%), radial-gradient(700px 460px at 4% 105%, rgba(232,169,58,.14), transparent 62%), #FAF8F5',
      }}
    >
      <style>{`
        @keyframes jaiPulse { 0%,100% { opacity: 1; transform: scale(1); } 50% { opacity: .35; transform: scale(.82); } }
        @keyframes jaiRise { from { opacity: 0; transform: translateY(14px); } to { opacity: 1; transform: none; } }
        @keyframes jaiTick { from { transform: translateX(0); } to { transform: translateX(-50%); } }
        @keyframes jaiFloat { 0%,100% { transform: translateY(0); } 50% { transform: translateY(-10px); } }
      `}</style>

      {/* ── Header ─────────────────────────────────────────────────── */}
      <header className="mx-auto flex w-full max-w-[1680px] items-center justify-between gap-6 px-6 py-5 sm:px-10 lg:px-16 xl:px-20">
        <div className="flex items-center gap-3">
          <div className="h-20 w-20 rounded-xl overflow-hidden shadow-sm border border-gray-100 bg-white">
            <img src="/logo.jpeg" alt="Logo" className="w-full h-full object-cover" />
          </div>
          <span className="text-[21px] font-bold tracking-[-0.02em]">German with Jai</span>
        </div>
        <nav className="hidden gap-8 text-base font-medium text-[#4A4C57] md:flex">
          <a href="#taste" className="text-[#4A4C57] hover:text-[#12131A]">Try it</a>
          <a href="#taste" className="text-[#4A4C57] hover:text-[#12131A]">Methodology</a>
          <Link href="/auth/signup" className="text-[#4A4C57] hover:text-[#12131A]">Live Classes</Link>
        </nav>
        <div className="flex items-center gap-4">
          <Link href="/auth/login" className="text-base font-semibold text-[#12131A]">Log In</Link>
          <Link
            href="/auth/signup"
            className="rounded-xl bg-[#E8A93A] px-5 py-3 text-base font-bold text-[#12131A] shadow-[0_6px_0_rgba(180,124,20,0.35)] transition-transform active:translate-y-1 active:shadow-[0_2px_0_rgba(180,124,20,0.35)]"
          >
            Start Learning
          </Link>
        </div>
      </header>

      {/* ── Hero ───────────────────────────────────────────────────── */}
      <section className="mx-auto grid w-full max-w-[1680px] items-center gap-12 px-6 pb-16 pt-7 sm:px-10 lg:grid-cols-[1.2fr_0.8fr] lg:gap-16 lg:px-16 xl:px-20">
        <div style={{ animation: 'jaiRise .5s ease both' }}>
          <div className="inline-flex items-center gap-2.5 rounded-full border border-[#D6D2FF] bg-[#EDEBFF] py-2 pl-3 pr-4 text-sm font-semibold text-[#2B44D4]">
            <span className="h-2 w-2 rounded-full bg-[#22A06B]" style={{ animation: 'jaiPulse 1.6s ease-in-out infinite' }} />
            <span>{learners.toLocaleString('en-US')} people are learning German right now</span>
          </div>

          <h1 className="mt-6 max-w-[16ch] text-[clamp(44px,5.2vw,74px)] font-extrabold leading-[1.02] tracking-[-0.035em] text-balance">
            Learn German in the time you&apos;d <span className="text-[#2B44D4]">waste scrolling.</span>
          </h1>

          <p className="mt-5 max-w-[620px] text-xl leading-normal text-[#55575F]">
            Same thumb, same 10 minutes — except you come out speaking. Bite-sized lessons, XP streaks
            you won&apos;t want to break, an AI tutor that talks back, and live classes with Jai.
          </p>

          <div className="mt-8 flex flex-wrap items-center gap-3.5">
            <Link
              href="/auth/signup"
              className="rounded-[14px] bg-[#2B44D4] px-8 py-4 text-lg font-bold text-white shadow-[0_8px_0_#1B2FA8] transition-transform active:translate-y-1 active:shadow-[0_4px_0_#1B2FA8]"
            >
              Start free — first lesson now
            </Link>
            <a
              href="#taste"
              className="rounded-[14px] border-[1.5px] border-[#DCD8D1] bg-white px-7 py-4 text-lg font-semibold text-[#12131A] transition-colors hover:border-[#12131A]"
            >
              How it works
            </a>
          </div>
          <div className="mt-3.5 text-sm font-medium text-[#83858E]">
            No card. No textbook. 30 seconds to your first German sentence.
          </div>

          <div className="mt-9 flex flex-wrap gap-8">
            {[
              { big: learners.toLocaleString('en-US'), small: 'learners on a streak' },
              { big: 'A1 → B2', small: 'structured lesson paths' },
              { big: '4 min', small: 'average daily session' },
            ].map((s, i) => (
              <div key={i} className="flex gap-8">
                {i > 0 && <div className="w-px bg-[#E3DFD8]" />}
                <div>
                  <div className="text-3xl font-extrabold tracking-[-0.02em] tabular-nums">{s.big}</div>
                  <div className="text-sm font-medium text-[#83858E]">{s.small}</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* ── Phone mockup ─────────────────────────────────────────── */}
        <div className="relative flex flex-col items-center gap-5">
          <div className="absolute inset-x-[12%] inset-y-[8%] rounded-full bg-[#2B44D4] opacity-15 blur-[80px]" />

          <div
            className="relative h-[716px] w-[352px] max-w-full rounded-[52px] bg-[#12131A] p-[11px] shadow-[0_40px_80px_-30px_rgba(18,19,26,0.55)]"
            style={{ animation: 'jaiFloat 7s ease-in-out infinite' }}
          >
            <div className="absolute left-1/2 top-6 z-[4] h-7 w-[104px] -translate-x-1/2 rounded-full bg-[#12131A]" />
            <div
              className="absolute -left-16 top-[104px] z-[5] hidden rounded-2xl border border-[#EAE6DF] bg-white px-4 py-3 shadow-[0_18px_34px_-18px_rgba(18,19,26,0.35)] lg:block"
              style={{ animation: 'jaiFloat 8s ease-in-out infinite' }}
            >
              <div className="text-xs font-bold tracking-[0.06em] text-[#83858E]">XP EARNED</div>
              <div className="mt-0.5 text-[22px] font-extrabold text-[#2B44D4] tabular-nums">+{xp}</div>
            </div>

            <div className="relative flex h-full w-full flex-col overflow-hidden rounded-[42px] bg-[#0E0F16]">
              <div className="absolute inset-0 bg-gradient-to-b from-[#2B44D4] via-[#1B2FA8] to-[#12131A]" style={{ backgroundImage: 'linear-gradient(168deg,#2B44D4 0%,#1B2FA8 46%,#12131A 100%)' }} />
              <div className="absolute inset-0" style={{ background: 'repeating-linear-gradient(115deg,rgba(255,255,255,.05) 0 2px,transparent 2px 13px)' }} />

              {/* story progress bars */}
              <div className="relative flex gap-1.5 px-5 pt-14">
                {REELS.map((_, n) => (
                  <div key={n} className="h-[3px] flex-1 overflow-hidden rounded-sm bg-white/30">
                    <div
                      className="h-full bg-white transition-[width] duration-300"
                      style={{ width: n < reelIdx ? '100%' : n === reelIdx ? `${100 - sec * 25}%` : '0%' }}
                    />
                  </div>
                ))}
              </div>

              <div className="relative flex items-center justify-between px-5 pt-4">
                <div className="flex items-center gap-2">
                  <div className="relative h-7 w-7 flex-none overflow-hidden rounded-full border-[1.5px] border-[#E8A93A] bg-[#1B2FA8]">
                    <Image
                      src="/teacher.png"
                      alt="Teacher Jai"
                      fill
                      sizes="28px"
                      className="object-cover object-top scale-105"
                    />
                  </div>
                  <span className="text-[13px] font-semibold text-white">@germanwithjai</span>
                </div>
                <div className="flex items-center gap-1.5 rounded-full bg-white/15 px-2.5 py-1">
                  <span className="h-1.5 w-1.5 rounded-full bg-[#E8A93A]" />
                  <span className="text-xs font-bold text-white">14 day streak</span>
                </div>
              </div>

              <div className="relative flex flex-1 flex-col items-center justify-center px-6 text-center">
                <div className="rounded-full bg-[#E8A93A] px-3 py-1 text-[11px] font-extrabold tracking-[0.09em] text-[#12131A]">
                  {reel?.level}
                </div>
                <div className="mt-4 text-3xl font-bold leading-tight tracking-[-0.02em] text-white">{reel?.de}</div>
                <div className="mt-2.5 text-base font-medium italic text-white/70">{reel?.en}</div>
                <div className="mt-5 flex justify-center">
                  <div className="flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-4 py-2 text-[13px] font-semibold text-white">
                    <span className="font-mono text-xs text-[#E8A93A] tabular-nums">0:0{sec}</span>
                    <span>tap to hear Jai say it</span>
                  </div>
                </div>
              </div>

              <div className="relative flex items-end justify-between px-5 pb-6">
                <div className="max-w-[200px] rounded-[14px] border border-white/20 bg-white/15 px-3.5 py-3">
                  <div className="text-[11px] font-bold tracking-[0.08em] text-white/60">TODAY&apos;S GOAL</div>
                  <div className="mt-1 text-sm font-semibold text-white">3 of 5 lessons · +40 XP</div>
                  <div className="mt-2 h-[5px] overflow-hidden rounded-[3px] bg-white/25">
                    <div className="h-full w-[60%] bg-[#E8A93A]" />
                  </div>
                </div>
                <div className="flex flex-col items-center gap-3.5">
                  {['❤️', '💬', '🔖'].map((e) => (
                    <div key={e} className="grid h-11 w-11 place-items-center rounded-full bg-white/15 text-lg">{e}</div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Mentor card */}
          <div className="relative flex max-w-[352px] items-center gap-4 rounded-[20px] border border-[#EAE6DF] bg-white py-3.5 pl-3.5 pr-5 shadow-[0_22px_44px_-26px_rgba(18,19,26,0.4)]">
            <div className="relative flex-none">
              <div className="relative h-[68px] w-[68px] overflow-hidden rounded-[18px] border border-[#EAE6DF] bg-[#2B44D4] shadow-inner">
                <Image
                  src="/teacher.png"
                  alt="Teacher Jai"
                  fill
                  sizes="68px"
                  className="object-cover object-top scale-105"
                  priority
                />
              </div>
              <span className="absolute -bottom-1 -right-1 h-4 w-4 rounded-full border-[2.5px] border-white bg-[#22A06B] shadow-sm" />
            </div>
            <div className="min-w-0">
              <div className="text-xs font-bold tracking-[0.08em] text-[#83858E]">YOUR MENTOR</div>
              <div className="mt-0.5 text-lg font-bold tracking-[-0.015em]">Jai</div>
              <div className="mt-0.5 text-sm font-medium text-[#55575F]">Live classes · AI tutor · Akkusativ, painlessly</div>
              <div className="mt-2 flex flex-wrap gap-1.5">
                {['Live classes', 'AI tutor 24/7', '1,100+ questions'].map((c) => (
                  <span key={c} className="rounded-full bg-[#EDEBFF] px-2.5 py-1 text-xs font-semibold text-[#2B44D4]">{c}</span>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Taste test ─────────────────────────────────────────────── */}
      <section id="taste" className="mx-auto w-full max-w-[1680px] px-6 pb-6 sm:px-10 lg:px-16 xl:px-20">
        <div className="grid items-center gap-11 rounded-[28px] bg-[#12131A] p-8 text-white md:p-10 lg:grid-cols-2">
          <div>
            <div className="inline-flex items-center gap-2 text-[13px] font-bold tracking-[0.1em] text-[#E8A93A]">
              <span className="h-[7px] w-[7px] rounded-full bg-[#E8A93A]" style={{ animation: 'jaiPulse 1.6s ease-in-out infinite' }} />
              10-SECOND TASTE TEST
            </div>
            <h2 className="mt-3 text-[clamp(26px,3vw,34px)] font-extrabold leading-[1.1] tracking-[-0.025em]">
              Answer one question.<br />Feel the hook.
            </h2>
            <p className="mt-3 max-w-[380px] text-base leading-relaxed text-white/60">
              This is exactly how a lesson feels. Get it right and the app hands you XP before you can look away.
            </p>
          </div>

          <div className="rounded-[20px] border border-white/10 bg-white/5 px-7 py-6">
            <div className="text-[13px] font-bold tracking-[0.08em] text-white/50">WHAT DOES THIS MEAN?</div>
            <div className="mt-2 text-[clamp(20px,2.2vw,28px)] font-bold tracking-[-0.02em]">„Ich hätte gerne einen Kaffee."</div>
            <div className="mt-5 grid gap-3 sm:grid-cols-3">
              {OPTIONS.map((o) => {
                const on = picked === o.id;
                const right = o.id === 1;
                return (
                  <button
                    key={o.id}
                    type="button"
                    onClick={() => setPicked(o.id)}
                    className="rounded-[14px] border-[1.5px] px-4 py-3.5 text-left text-[15px] font-semibold leading-[1.35] text-white transition-transform hover:-translate-y-0.5"
                    style={{
                      background: on ? (right ? 'rgba(34,160,107,.18)' : 'rgba(226,84,74,.16)') : 'rgba(255,255,255,.05)',
                      borderColor: on ? (right ? '#22A06B' : '#E2544A') : 'rgba(255,255,255,.16)',
                    }}
                  >
                    {o.label}
                  </button>
                );
              })}
            </div>
            <div className="mt-4 flex flex-wrap items-center justify-between gap-4">
              <div
                className="text-[15px] font-semibold"
                style={{ color: picked === null ? 'rgba(255,255,255,.55)' : correct ? '#5BD9A4' : '#FF9A92' }}
              >
                {picked === null
                  ? 'Pick one — takes two seconds.'
                  : correct
                    ? "Richtig! +10 XP. That felt good, didn't it?"
                    : "Nah — one more try, you're close."}
              </div>
              <Link href="/auth/signup" className="rounded-xl bg-[#E8A93A] px-5 py-3 text-[15px] font-bold text-[#12131A]">
                Claim your XP →
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ── Ticker ─────────────────────────────────────────────────── */}
      <div className="overflow-hidden pb-12 pt-6">
        <div className="flex w-max gap-11" style={{ animation: 'jaiTick 34s linear infinite' }}>
          {[...TICKER, ...TICKER].map((t, i) => (
            <div key={i} className="flex items-center gap-11 whitespace-nowrap text-base font-semibold text-[#9A9BA2]">
              <span>{t}</span>
              <span className="text-[#E8A93A]">✦</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

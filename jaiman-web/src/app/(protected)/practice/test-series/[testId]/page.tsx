'use client';

import { useState, useEffect, useRef, use } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ChevronLeft, ChevronRight, Clock, Volume2, Loader,
  Check, X, PenLine, Headphones, BookOpen, FileText
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import api from '@/lib/api';

interface TestQuestion {
  questionNumber: number;
  type: string;
  prompt: string;
  audioText?: string;
  options?: string[];
  points: number;
}

interface TestSection {
  sectionType: string;
  title: string;
  instructions: string;
  questions: TestQuestion[];
}

interface TestPaper {
  _id: string;
  title: string;
  level: string;
  totalTime: number;
  totalMarks: number;
  passingMarks: number;
  sections: TestSection[];
}

const SECTION_ICONS: Record<string, any> = {
  listening: Headphones,
  reading: BookOpen,
  writing: PenLine,
  speaking: ChevronRight,
};

const LEVEL_COLORS: Record<string, { color: string; shadow: string }> = {
  A1: { color: '#20BF6B', shadow: '#178B4E' },
  A2: { color: '#4361EE', shadow: '#3046B2' },
  B1: { color: '#FF9F43', shadow: '#D97F27' },
  B2: { color: '#CE82FF', shadow: '#A85FD6' },
};

export default function TestPaperPage({ params }: { params: Promise<{ testId: string }> }) {
  const { testId } = use(params);
  const router = useRouter();
  const [paper, setPaper] = useState<TestPaper | null>(null);
  const [loading, setLoading] = useState(true);
  const [phase, setPhase] = useState<'intro' | 'test' | 'submitting'>('intro');
  const [currentSection, setCurrentSection] = useState(0);
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [writingInputs, setWritingInputs] = useState<Record<string, string>>({});
  const [timeLeft, setTimeLeft] = useState(0);
  const [audioLoading, setAudioLoading] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    api.get(`/tests/${testId}`).then(({ data }) => {
      setPaper(data);
      setTimeLeft(data.totalTime * 60);
    }).catch(() => {}).finally(() => setLoading(false));
  }, [testId]);

  // Timer countdown
  useEffect(() => {
    if (phase !== 'test' || timeLeft <= 0) return;
    timerRef.current = setInterval(() => {
      setTimeLeft((t) => {
        if (t <= 1) { handleSubmit(); return 0; }
        return t - 1;
      });
    }, 1000);
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [phase, timeLeft]);

  const formatTime = (s: number) => {
    const m = Math.floor(s / 60);
    const sec = s % 60;
    return `${m}:${sec.toString().padStart(2, '0')}`;
  };

  const playAudio = async (text: string) => {
    setAudioLoading(true);
    try {
      const res = await api.post('/chat/tts', { text, lang: 'de', rate: 0.8 }, { responseType: 'blob' });
      const url = URL.createObjectURL(res.data as Blob);
      if (audioRef.current) { audioRef.current.src = url; audioRef.current.play(); }
    } catch {
      const utter = new SpeechSynthesisUtterance(text);
      utter.lang = 'de-DE'; utter.rate = 0.8;
      speechSynthesis.speak(utter);
    } finally { setAudioLoading(false); }
  };

  const handleAnswer = (qNum: number, answer: string) => {
    setAnswers((prev) => ({ ...prev, [String(qNum)]: answer }));
  };

  const handleWriting = (qNum: number, text: string) => {
    setWritingInputs((prev) => ({ ...prev, [String(qNum)]: text }));
    setAnswers((prev) => ({ ...prev, [String(qNum)]: text }));
  };

  const handleSubmit = async () => {
    if (!paper) return;
    if (timerRef.current) clearInterval(timerRef.current);
    setPhase('submitting');
    const timeTaken = paper.totalTime - Math.floor(timeLeft / 60);
    try {
      const { data } = await api.post(`/tests/${paper._id}/submit`, { answers, timeTaken });
      router.push(`/practice/test-series/${paper._id}/results?score=${data.totalEarned}&max=${data.totalMarks}&passed=${data.passed}&pct=${data.percentage}`);
    } catch {
      router.push(`/practice/test-series`);
    }
  };

  const section = paper?.sections[currentSection];
  const question = section?.questions[currentQuestion];
  const lvl = LEVEL_COLORS[paper?.level ?? 'A1'] ?? LEVEL_COLORS.A1;
  const timePct = paper ? (timeLeft / (paper.totalTime * 60)) * 100 : 100;
  const timeColor = timePct > 30 ? lvl.color : '#FF4757';

  // ── Loading ───────────────────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="min-h-screen bg-[#F5F6FA] flex items-center justify-center">
        <Loader className="animate-spin text-[#4361EE]" size={32} />
      </div>
    );
  }

  if (!paper) {
    return (
      <div className="min-h-screen bg-[#F5F6FA] flex items-center justify-center flex-col gap-3">
        <p className="text-2xl">😕</p>
        <p className="font-bold text-[#757575]">Test not found.</p>
        <button onClick={() => router.back()} className="text-sm text-[#4361EE] font-bold">← Go back</button>
      </div>
    );
  }

  // ── Intro ─────────────────────────────────────────────────────────────────
  if (phase === 'intro') {
    return (
      <div className="min-h-screen bg-[#F5F6FA] flex items-center justify-center p-6 relative">
        <audio ref={audioRef} className="hidden" />

        {/* Floating Top Left Back Button */}
        <button
          onClick={() => router.push('/practice/test-series')}
          className="absolute top-6 left-6 flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-white border-2 border-[#EAEAEA] text-[#1A1A2E] text-xs font-black shadow-sm hover:border-[#1A1A2E] hover:scale-105 transition-all cursor-pointer"
        >
          <ChevronLeft size={18} />
          <span>Back to Test Series</span>
        </button>

        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-white rounded-3xl p-8 max-w-lg w-full shadow-[0_8px_40px_rgba(0,0,0,0.10)] relative border-2 border-[#EAEAEA]"
        >
          {/* Card Top Left Back Arrow */}
          <button
            onClick={() => router.push('/practice/test-series')}
            className="absolute top-6 left-6 p-2 rounded-xl border border-[#EAEAEA] bg-white text-[#757575] hover:text-[#1A1A2E] hover:border-[#1A1A2E] transition-all flex items-center justify-center cursor-pointer"
            title="Back to Test Series"
          >
            <ChevronLeft size={18} />
          </button>

          <div className="flex items-center gap-3 mb-5 pl-10">
            <div className="w-14 h-14 rounded-2xl flex items-center justify-center text-3xl"
              style={{ background: lvl.color + '22' }}>📋</div>
            <div>
              <h1 className="text-[15px] font-black text-[#1A1A2E] leading-tight">{paper.title}</h1>
              <span className="text-[11px] font-black px-2 py-0.5 rounded-full text-white mt-1 inline-block"
                style={{ background: lvl.color }}>{paper.level}</span>
            </div>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-3 gap-3 mb-5">
            {[
              { label: 'Total Time', value: `${paper.totalTime} min` },
              { label: 'Total Marks', value: `${paper.totalMarks}` },
              { label: 'Pass Marks', value: `${paper.passingMarks}` },
            ].map((s) => (
              <div key={s.label} className="bg-[#F8F9FF] rounded-2xl p-3 text-center border border-[#EAEAEA]">
                <p className="text-lg font-black" style={{ color: lvl.color }}>{s.value}</p>
                <p className="text-[9px] font-bold text-[#BDBDBD] uppercase tracking-wide">{s.label}</p>
              </div>
            ))}
          </div>

          {/* Sections */}
          <div className="space-y-2 mb-6">
            {paper.sections.map((sec, i) => {
              const Icon = SECTION_ICONS[sec.sectionType] ?? FileText;
              return (
                <div key={i} className="flex items-center gap-3 p-3 rounded-xl bg-[#F8F9FF] border border-[#EAEAEA]">
                  <Icon size={16} className="text-[#BDBDBD]" />
                  <div className="flex-1">
                    <p className="text-[12px] font-black text-[#1A1A2E]">{sec.title}</p>
                    <p className="text-[10px] text-[#9E9E9E] font-medium">{sec.questions.length} questions</p>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="bg-[#FFF9E6] border border-[#FFE082] rounded-2xl p-3 mb-5">
            <p className="text-[11px] font-bold text-[#F57F17]">
              ⏱️ The timer starts when you click Start. You have {paper.totalTime} minutes total.
              The test auto-submits when time runs out.
            </p>
          </div>

          <button
            onClick={() => setPhase('test')}
            className="w-full py-3.5 rounded-2xl font-black text-sm text-white transition-all cursor-pointer shadow-[0_4px_0_rgba(0,0,0,0.12)] hover:translate-y-[2px]"
            style={{ background: lvl.color, boxShadow: `0 4px 0 ${lvl.shadow}` }}
          >
            Start Test →
          </button>
          <button
            onClick={() => router.push('/practice/test-series')}
            className="w-full mt-3 text-xs font-bold text-[#9E9E9E] hover:text-[#1A1A2E] py-2 transition-colors cursor-pointer block text-center"
          >
            ← Back to Test Series
          </button>
        </motion.div>
      </div>
    );
  }

  // ── Submitting ────────────────────────────────────────────────────────────
  if (phase === 'submitting') {
    return (
      <div className="min-h-screen bg-[#F5F6FA] flex items-center justify-center flex-col gap-4">
        <Loader className="animate-spin" size={36} style={{ color: lvl.color }} />
        <p className="font-black text-[#1A1A2E]">Grading your test...</p>
      </div>
    );
  }

  // ── Test ──────────────────────────────────────────────────────────────────
  const totalQuestions = paper.sections.reduce((a, s) => a + s.questions.length, 0);
  const answeredCount = Object.keys(answers).length;

  return (
    <div className="min-h-screen bg-[#F5F6FA] flex flex-col">
      <audio ref={audioRef} className="hidden" />

      {/* Top bar with Exit / Back Button */}
      <div className="bg-white border-b border-[#F0F0F0] px-4 py-3 flex items-center gap-3 sticky top-0 z-20 shadow-sm">
        <button
          onClick={() => {
            if (answeredCount > 0) {
              if (confirm('Are you sure you want to exit? Your current test progress will be lost.')) {
                router.push('/practice/test-series');
              }
            } else {
              router.push('/practice/test-series');
            }
          }}
          className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-[#F8F9FA] border border-[#EAEAEA] text-[#757575] hover:text-[#1A1A2E] hover:border-[#1A1A2E] text-xs font-black transition-all cursor-pointer flex-shrink-0"
          title="Exit Test and return to Test Series"
        >
          <ChevronLeft size={16} />
          <span className="hidden sm:inline">Exit Test</span>
        </button>

        <div className="flex-1">
          <div className="flex items-center justify-between text-[11px] font-bold text-[#9E9E9E] mb-1">
            <span>{answeredCount}/{totalQuestions} answered</span>
            <span className="font-black" style={{ color: timeColor }}>⏱️ {formatTime(timeLeft)}</span>
          </div>
          <div className="h-2 bg-[#F0F0F0] rounded-full overflow-hidden">
            <div className="h-full rounded-full transition-all" style={{ width: `${timePct}%`, background: timeColor }} />
          </div>
        </div>

        <button
          onClick={handleSubmit}
          className="px-4 py-2 rounded-xl text-xs font-black text-white transition-all flex-shrink-0 shadow-sm hover:opacity-90 cursor-pointer"
          style={{ background: lvl.color }}
        >
          Submit Test 🎯
        </button>
      </div>

      {/* Section tabs */}
      <div className="bg-white border-b border-[#F0F0F0] px-4 py-2 flex gap-2 overflow-x-auto">
        {paper.sections.map((sec, i) => {
          const Icon = SECTION_ICONS[sec.sectionType] ?? ChevronRight;
          const isActive = i === currentSection;
          return (
            <button
              key={i}
              onClick={() => { setCurrentSection(i); setCurrentQuestion(0); }}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[11px] font-black whitespace-nowrap transition-all"
              style={isActive
                ? { background: lvl.color, color: 'white' }
                : { background: '#F5F6FA', color: '#9E9E9E' }
              }
            >
              <Icon size={12} /> {sec.title.split('—')[0].trim()}
            </button>
          );
        })}
      </div>

      {/* Question area */}
      {section && question && (
        <div className="flex-1 p-4 md:p-6 max-w-2xl mx-auto w-full">
          {/* Section instructions */}
          <div className="bg-[#F8F9FF] rounded-2xl p-4 mb-4 border border-[#E8EEFF]">
            <p className="text-[11px] font-bold text-[#4361EE] mb-0.5">📖 Instructions</p>
            <p className="text-[12px] text-[#757575] font-medium">{section.instructions}</p>
          </div>

          <AnimatePresence mode="wait">
            <motion.div
              key={`${currentSection}-${currentQuestion}`}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="bg-white rounded-2xl p-5 shadow-[0_2px_12px_rgba(0,0,0,0.06)]"
            >
              <div className="flex items-center gap-2 mb-3">
                <span className="text-[10px] font-black text-[#BDBDBD]">Q{question.questionNumber}</span>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-lg" style={{ background: lvl.color + '22', color: lvl.color }}>
                  {question.points} pt{question.points > 1 ? 's' : ''}
                </span>
              </div>

              {/* Audio button for listening */}
              {section.sectionType === 'listening' && question.audioText && (
                <button
                  onClick={() => playAudio(question.audioText!)}
                  disabled={audioLoading}
                  className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-black text-white mb-4"
                  style={{ background: lvl.color }}
                >
                  {audioLoading ? <Loader size={14} className="animate-spin" /> : <Volume2 size={14} />}
                  {audioLoading ? 'Loading audio...' : '▶ Play Audio'}
                </button>
              )}

              <p className="text-[13px] font-bold text-[#1A1A2E] mb-4 whitespace-pre-line leading-relaxed">
                {question.prompt}
              </p>

              {/* MCQ / True-False */}
              {(question.type === 'mcq' || question.type === 'true_false' || question.type === 'fill_blank') &&
                question.options && question.options.length > 0 && (
                  <div className="flex flex-col gap-2.5">
                    {question.options.map((opt) => {
                      const isSelected = answers[String(question.questionNumber)] === opt;
                      return (
                        <button
                          key={opt}
                          onClick={() => handleAnswer(question.questionNumber, opt)}
                          className="w-full text-left px-4 py-3 rounded-xl border-2 text-[12px] font-bold transition-all"
                          style={isSelected
                            ? { borderColor: lvl.color, background: lvl.color + '18', color: lvl.color }
                            : { borderColor: '#F0F0F0', background: 'white', color: '#1A1A2E' }
                          }
                        >
                          {opt}
                        </button>
                      );
                    })}
                  </div>
                )}

              {/* Writing textarea */}
              {question.type === 'writing' && (
                <div>
                  <textarea
                    value={writingInputs[String(question.questionNumber)] ?? ''}
                    onChange={(e) => handleWriting(question.questionNumber, e.target.value)}
                    placeholder="Write your answer here in German..."
                    rows={8}
                    className="w-full p-4 rounded-xl border-2 border-[#F0F0F0] text-[13px] font-medium text-[#1A1A2E] resize-none focus:outline-none focus:border-[#4361EE] transition-colors"
                  />
                  <p className="text-[10px] font-bold text-[#BDBDBD] mt-1 text-right">
                    {(writingInputs[String(question.questionNumber)] ?? '').split(/\s+/).filter(Boolean).length} words
                  </p>
                </div>
              )}
            </motion.div>
          </AnimatePresence>

          {/* Navigation */}
          <div className="flex items-center justify-between mt-4">
            <button
              onClick={() => {
                if (currentQuestion > 0) setCurrentQuestion((c) => c - 1);
                else if (currentSection > 0) { setCurrentSection((s) => s - 1); setCurrentQuestion(paper.sections[currentSection - 1].questions.length - 1); }
              }}
              className="px-4 py-2.5 rounded-xl text-xs font-black text-[#757575] bg-white border border-[#F0F0F0] hover:bg-[#F5F6FA] transition-all"
            >
              ← Prev
            </button>
            <span className="text-[11px] font-bold text-[#BDBDBD]">
              {currentQuestion + 1} / {section.questions.length}
            </span>
            <button
              onClick={() => {
                if (currentQuestion + 1 < section.questions.length) setCurrentQuestion((c) => c + 1);
                else if (currentSection + 1 < paper.sections.length) { setCurrentSection((s) => s + 1); setCurrentQuestion(0); }
              }}
              className="px-4 py-2.5 rounded-xl text-xs font-black text-white transition-all"
              style={{ background: lvl.color }}
            >
              Next →
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

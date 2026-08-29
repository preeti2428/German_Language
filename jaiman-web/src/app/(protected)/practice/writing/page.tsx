'use client';

import React, { useState, useEffect, useRef, Suspense } from 'react';
import { motion } from 'framer-motion';
import {
  ChevronLeft, PenLine, MessageSquare, Mail, FileText,
  Sparkles, Loader, Check, X, AlertCircle, BookOpen, RefreshCw,
  Globe, CheckCircle2, XCircle, AlertTriangle, Lightbulb, Copy,
  ArrowRight, Award, RotateCcw,
  BookCheck, Compass, Layers, Volume2, Bookmark, Zap
} from 'lucide-react';
import { useRouter, useSearchParams } from 'next/navigation';
import api from '@/lib/api';
import PageShell from '@/components/layout/PageShell';
import { speakGerman } from '@/lib/speech';

// ── Types ────────────────────────────────────────────────────────────────────
interface WritingTask {
  _id: string;
  title: string;
  level: string;
  taskType: string;
  scenario: string;
  prompt: string;
  threePoints: string[];
  wordMin: number;
  wordMax: number;
  requiredConnectors: string[];
  totalPoints: number;
}

interface ConnectorInfo {
  connector: string;
  found: boolean;
  meaning: string;
  type: string;
  wordOrder: string;
  example: string;
  exampleTranslation: string;
  tip: string;
}

interface GrammarError {
  original: string;
  correction: string;
  type: string;
  explanation: string;
}

interface SentencePair {
  german: string;
  english: string;
}

interface PracticeQuestion {
  id: string;
  question: string;
  options: string[];
  correctIndex: number;
  explanation: string;
  category: string;
}

interface RequirementItem {
  label: string;
  status: 'completed' | 'partial' | 'missing';
  detail: string;
}

interface AIFeedback {
  wordCount: number;
  charCount?: number;
  wordMin: number;
  wordMax: number;
  wordCountOk: boolean;
  // Connectors
  connectorCheck: ConnectorInfo[];
  connectorsFound: number;
  requiredConnectors: string[];
  usedConnectors?: string[];
  missingConnectors?: string[];
  // Scores
  scores?: {
    task: number;
    coherence: number;
    vocabulary: number;
    grammar: number;
    total: number;
    maxTotal: number;
    deductions?: { category: string; reason: string }[];
  };
  taskCompletion: number | null;
  coherence: number | null;
  vocabulary: number | null;
  grammar: number | null;
  totalScore: number | null;
  totalPoints: number;
  // Level estimation
  cefrLevel?: {
    estimated: string;
    summary: string;
    breakdown?: {
      grammar?: string;
      vocabulary?: string;
      structure?: string;
      accuracy?: string;
      connectors?: string;
    };
  };
  requirements?: RequirementItem[];
  // Feedback & Lists
  strengths?: string[];
  improvements?: string[];
  errors?: GrammarError[];
  corrections: string[];
  // Translation & Polish
  translation?: {
    full: string;
    sentencePairs: SentencePair[];
  };
  improvedVersion?: {
    text: string;
    whyBetter: string;
    keyChanges?: string[];
  };
  // Practice
  practiceQuestions?: PracticeQuestion[];
  // Summary texts
  feedback: string;
  germanFeedback?: string;
  modelAnswer?: string | null;
  gradingRubric?: Record<string, string> | null;
}

// ── Helpers & Constants ──────────────────────────────────────────────────────
const TASK_TYPE_ICONS: Record<string, any> = {
  sms: MessageSquare,
  email: Mail,
  letter: FileText,
  forum_post: BookOpen,
  note: PenLine,
};

const TASK_TYPE_LABELS: Record<string, string> = {
  sms: 'SMS',
  email: 'E-Mail',
  letter: 'Brief (Letter)',
  forum_post: 'Forum Post',
  note: 'Notiz (Note)',
};

const LEVEL_COLORS: Record<string, { bg: string; color: string; shadow: string; lightBg: string; border: string }> = {
  A1: { bg: '#E8FBF0', color: '#20BF6B', shadow: '#178B4E', lightBg: '#F2FCF6', border: '#A5D6A7' },
  A2: { bg: '#EEF2FF', color: '#4361EE', shadow: '#3046B2', lightBg: '#F6F8FF', border: '#90CAF9' },
  B1: { bg: '#FFF4E6', color: '#FF9F43', shadow: '#D97F27', lightBg: '#FFF9F0', border: '#FFE082' },
  B2: { bg: '#F7EDFF', color: '#CE82FF', shadow: '#A85FD6', lightBg: '#FBF5FF', border: '#E1BEE7' },
};

const GERMAN_CHARACTERS = ['ä', 'ö', 'ü', 'ß', 'Ä', 'Ö', 'Ü', '«', '»'];

const GERMAN_CONNECTORS_LIST = [
  { word: 'weil', meaning: 'because', rule: 'Verb at end' },
  { word: 'dass', meaning: 'that', rule: 'Verb at end' },
  { word: 'obwohl', meaning: 'although', rule: 'Verb at end' },
  { word: 'deshalb', meaning: 'therefore', rule: 'Verb pos 2' },
  { word: 'denn', meaning: 'because/for', rule: 'Normal order' },
  { word: 'aber', meaning: 'but', rule: 'Normal order' },
  { word: 'wenn', meaning: 'when/if', rule: 'Verb at end' },
  { word: 'außerdem', meaning: 'furthermore', rule: 'Verb pos 2' },
  { word: 'trotzdem', meaning: 'nevertheless', rule: 'Verb pos 2' },
];

const GERMAN_STARTERS = [
  { label: '👋 Informal Salutation', text: 'Liebe(r) ..., \n' },
  { label: '✉️ Formal Opening', text: 'Sehr geehrte Damen und Herren, \n' },
  { label: '🙏 Thank You', text: 'Vielen Dank für Ihre Einladung. ' },
  { label: '🎯 Reason for Writing', text: 'Ich schreibe Ihnen, weil ' },
  { label: '💡 Opinion / Thoughts', text: 'Meiner Meinung nach ist ' },
  { label: '❓ Polite Request', text: 'Könnten Sie mir bitte mitteilen, ob ' },
  { label: '📝 Apology', text: 'Es tut mir leid, aber ich kann leider nicht kommen, weil ' },
  { label: '🤝 Formal Closing', text: '\nMit freundlichen Grüßen,\n[Dein Name]' },
  { label: '💖 Informal Closing', text: '\nViele Grüße,\n[Dein Name]' },
];

// ── Main Content Component ───────────────────────────────────────────────────
function WritingLabContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const mode = searchParams.get('mode'); // 'free' or 'task'

  const [tasks, setTasks] = useState<WritingTask[]>([]);
  const [loading, setLoading] = useState(true);
  const [seeding, setSeeding] = useState(false);
  const [filterLevel, setFilterLevel] = useState('all');
  const [filterType, setFilterType] = useState('all');
  const [selectedTask, setSelectedTask] = useState<WritingTask | null>(null);

  // Custom Topic & Text State
  const [customTopic, setCustomTopic] = useState('Mein Alltag');
  const [customInstruction, setCustomInstruction] = useState('Schreibe 40–50 Wörter über deinen Alltag.');
  const [customMinWords, setCustomMinWords] = useState(40);
  const [customMaxWords, setCustomMaxWords] = useState(50);
  const [customLevel, setCustomLevel] = useState('A1');

  const [userText, setUserText] = useState('');
  const [checking, setChecking] = useState(false);
  const [feedback, setFeedback] = useState<AIFeedback | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Active sub-tab in results view
  const [activeResultTab, setActiveResultTab] = useState<'overview' | 'corrections' | 'translation' | 'improved' | 'practice'>('overview');
  const [selectedConnector, setSelectedConnector] = useState<ConnectorInfo | null>(null);
  const [showModelAnswer, setShowModelAnswer] = useState(false);
  const [copiedText, setCopiedText] = useState(false);

  // Quiz state for practice section
  const [userAnswers, setUserAnswers] = useState<Record<string, number>>({});

  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const resultsRef = useRef<HTMLDivElement>(null);

  const loadTasks = async () => {
    setLoading(true);
    try {
      const url = filterLevel !== 'all' ? `/writing/tasks?level=${filterLevel}` : '/writing/tasks';
      const { data } = await api.get(url);
      setTasks(data);
    } catch {
      setTasks([]);
    } finally {
      setLoading(false);
    }
  };

  const handleSeed = async () => {
    setSeeding(true);
    try {
      await api.post('/writing/tasks/seed');
      await loadTasks();
    } catch {
      alert('Could not seed sample tasks.');
    } finally {
      setSeeding(false);
    }
  };

  useEffect(() => {
    loadTasks();
  }, [filterLevel]);

  // Insert German character at cursor position
  const insertChar = (char: string) => {
    if (!textareaRef.current) {
      setUserText((prev) => prev + char);
      return;
    }
    const start = textareaRef.current.selectionStart;
    const end = textareaRef.current.selectionEnd;
    const newText = userText.substring(0, start) + char + userText.substring(end);
    setUserText(newText);
    setTimeout(() => {
      if (textareaRef.current) {
        textareaRef.current.selectionStart = textareaRef.current.selectionEnd = start + char.length;
        textareaRef.current.focus();
      }
    }, 0);
  };

  // Submit writing for AI evaluation
  const handleCheckWriting = async () => {
    if (!userText.trim()) {
      setErrorMessage('Bitte schreibe zuerst deinen deutschen Text.');
      return;
    }
    setChecking(true);
    setErrorMessage(null);
    setFeedback(null);
    setUserAnswers({});

    try {
      const payload: Record<string, any> = {
        userText: userText.trim(),
      };
      if (selectedTask) {
        payload.taskId = selectedTask._id;
      } else {
        payload.topic = customTopic;
        payload.instruction = customInstruction;
        payload.targetLevel = customLevel;
      }

      const { data } = await api.post('/writing/check', payload);
      setFeedback(data);
      setActiveResultTab('overview');

      // Scroll smoothly to results
      setTimeout(() => {
        resultsRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }, 100);
    } catch (err: any) {
      console.error('AI check failed:', err);
      setErrorMessage(
        err.response?.data?.message || '⚠️ We couldn’t analyze your writing right now. Please try again in a moment.'
      );
    } finally {
      setChecking(false);
    }
  };

  // Try another exercise (reset submission, pick next prompt/topic, and focus editor)
  const handleTryAnotherExercise = () => {
    setFeedback(null);
    setUserText('');
    setUserAnswers({});
    setErrorMessage(null);
    setSelectedConnector(null);
    setShowModelAnswer(false);

    if (tasks.length > 0) {
      if (selectedTask) {
        const currentIndex = tasks.findIndex((t) => t._id === selectedTask._id);
        const nextIndex = (currentIndex + 1) % tasks.length;
        setSelectedTask(tasks[nextIndex]);
      } else {
        setSelectedTask(tasks[0]);
      }
    } else {
      const sampleTopics = [
        'Mein Lieblingstag am Wochenende',
        'Eine Einladung zum Geburtstag',
        'Mein Urlaub in Deutschland',
        'Meine Hobbys und Freizeit',
        'Ein Tag im Restaurant',
      ];
      const nextTopic = sampleTopics[Math.floor(Math.random() * sampleTopics.length)];
      setCustomTopic(nextTopic);
    }

    window.scrollTo({ top: 0, behavior: 'smooth' });
    setTimeout(() => {
      textareaRef.current?.focus();
    }, 250);
  };

  const wordCount = userText.trim().split(/\s+/).filter(Boolean).length;
  const charCount = userText.length;

  const targetMin = selectedTask ? selectedTask.wordMin : customMinWords;
  const targetMax = selectedTask ? selectedTask.wordMax : customMaxWords;
  const isWordCountValid = wordCount >= targetMin && wordCount <= targetMax;
  const isTooShort = wordCount < targetMin;
  const isTooLong = wordCount > targetMax;

  const wordProgressPct = Math.min(Math.round((wordCount / targetMax) * 100), 100);

  // Sentence & Connector metrics
  const sentenceCount = userText.split(/[.!?]+/).filter((s) => s.trim().length > 0).length;
  const detectedConnectors = GERMAN_CONNECTORS_LIST.filter((c) => {
    const regex = new RegExp(`\\b${c.word}\\b`, 'i');
    return regex.test(userText);
  });

  const [speakingText, setSpeakingText] = useState(false);
  const [showStarters, setShowStarters] = useState(true);

  const handleSpeak = async (text: string) => {
    if (!text.trim()) return;
    setSpeakingText(true);
    try {
      await speakGerman(text);
    } finally {
      setSpeakingText(false);
    }
  };

  const insertStarter = (starterText: string) => {
    if (!textareaRef.current) {
      setUserText((prev) => (prev ? `${prev} ${starterText}` : starterText));
      return;
    }
    const start = textareaRef.current.selectionStart;
    const end = textareaRef.current.selectionEnd;
    const newText = userText.substring(0, start) + starterText + userText.substring(end);
    setUserText(newText);
    setTimeout(() => {
      if (textareaRef.current) {
        textareaRef.current.selectionStart = textareaRef.current.selectionEnd = start + starterText.length;
        textareaRef.current.focus();
      }
    }, 0);
  };

  const handleInsertTemplate = () => {
    const template =
      selectedTask?.taskType === 'sms'
        ? 'Hallo [Name]!\n\nDanke für deine Nachricht. Ich habe Zeit und möchte mich gerne mit dir treffen.\n\nWann und wo treffen wir uns?\n\nBis bald,\n[Dein Name]'
        : selectedTask?.taskType === 'letter' || selectedTask?.level === 'B1'
        ? 'Sehr geehrte Damen und Herren,\n\nich schreibe Ihnen bezüglich Ihrer Mitteilung. Meiner Meinung nach ist das ein wichtiges Thema, weil viele Menschen davon betroffen sind.\n\nAußerdem möchte ich vorschlagen, dass wir eine gemeinsame Lösung finden.\n\nIch freue mich auf Ihre Rückmeldung.\n\nMit freundlichen Grüßen,\n[Dein Name]'
        : 'Liebe(r) [Name],\n\nich hoffe, es geht dir gut. Ich schreibe dir, weil ich dir von meiner neuen Wohnung erzählen möchte.\n\nSie ist sehr schön und liegt in der Nähe vom Park. Hast du am Wochenende Zeit, mich zu besuchen?\n\nViele Grüße,\n[Dein Name]';
    setUserText(template);
    setTimeout(() => textareaRef.current?.focus(), 50);
  };

  const filteredTasks: WritingTask[] = tasks.filter(
    (t) =>
      (filterLevel === 'all' || t.level === filterLevel) &&
      (filterType === 'all' || t.taskType === filterType)
  );

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedText(true);
    setTimeout(() => setCopiedText(false), 2000);
  };

  return (
    <PageShell
      crumb="Writing Lab"
      title="German AI Writing Tutor ✍️"
      backHref="/practice"
      onBack={
        selectedTask
          ? () => {
              setSelectedTask(null);
              setFeedback(null);
            }
          : undefined
      }
      actions={
        <div className="flex items-center gap-2">
          {!selectedTask && mode !== 'free' && (
            <button
              onClick={() => router.push('/practice/writing?mode=free')}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-black text-[#E53935] bg-[#FFF5F5] border-2 border-[#FFCDD2] hover:bg-[#FFEBEB] transition-all cursor-pointer"
            >
              <Sparkles size={14} /> Free Writing Mode
            </button>
          )}
          {mode === 'free' && (
            <button
              onClick={() => router.push('/practice/writing')}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-black text-[#1A1A2E] bg-white border-2 border-[#EAEAEA] hover:border-[#1A1A2E] transition-all cursor-pointer"
            >
              <BookOpen size={14} /> Goethe Exam Tasks
            </button>
          )}
        </div>
      }
    >
      <div className="space-y-8 max-w-[1200px] mx-auto pb-12">

        {/* ═══ TASK SELECTOR OR ACTIVE TOPIC HEADER ═══════════════════════════ */}
        {selectedTask ? (
          /* Active Guided Task Banner with Audio */
          <div className="bg-white rounded-3xl border-2 border-[#EAEAEA] border-b-[5px] border-b-[#D8D8D8] p-6 shadow-sm relative overflow-hidden">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="flex items-start gap-4">
                <button
                  onClick={() => {
                    setSelectedTask(null);
                    setFeedback(null);
                  }}
                  className="w-10 h-10 rounded-2xl bg-[#F5F6FA] border-2 border-[#EAEAEA] hover:border-[#1A1A2E] flex items-center justify-center text-[#1A1A2E] transition-all flex-shrink-0 mt-0.5 cursor-pointer"
                  title="Back to all tasks"
                >
                  <ChevronLeft size={20} />
                </button>
                <div>
                  <div className="flex items-center gap-2 flex-wrap mb-1">
                    <span className="text-[11px] font-black uppercase px-2.5 py-0.5 rounded-full bg-[#E8FBF0] text-[#20BF6B] border border-[#A5D6A7]">
                      🌱 {selectedTask.level} Goethe Task
                    </span>
                    <span className="text-[11px] font-bold text-[#757575] bg-[#F5F6FA] px-2.5 py-0.5 rounded-full border border-[#EAEAEA]">
                      {TASK_TYPE_LABELS[selectedTask.taskType]}
                    </span>
                    <span className="text-[11px] font-bold text-[#9E9E9E]">
                      🎯 Target: {selectedTask.wordMin}–{selectedTask.wordMax} words
                    </span>
                  </div>
                  <h2 className="text-lg md:text-xl font-black text-[#1A1A2E] leading-snug">
                    {selectedTask.title}
                  </h2>
                  <p className="text-xs md:text-sm text-[#757575] font-medium mt-1">
                    {selectedTask.scenario}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2 self-end md:self-auto flex-shrink-0">
                <button
                  type="button"
                  onClick={() => handleSpeak(selectedTask.prompt)}
                  disabled={speakingText}
                  className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-black text-[#4361EE] bg-[#EEF2FF] border border-[#90CAF9] hover:bg-[#E3F2FD] transition-all cursor-pointer"
                  title="Listen to German prompt"
                >
                  <Volume2 size={15} className={speakingText ? 'animate-pulse text-[#E53935]' : ''} />
                  <span>{speakingText ? 'Speaking...' : 'Listen Prompt'}</span>
                </button>
                <span className="text-xs font-black text-[#E53935] bg-[#FFF5F5] border border-[#FFCDD2] px-3 py-2 rounded-xl">
                  Max: {selectedTask.totalPoints} pts
                </span>
              </div>
            </div>

            {/* 3 Points to cover in Goethe Exam */}
            {selectedTask.threePoints?.length > 0 && (
              <div className="mt-5 pt-4 border-t border-[#F0F0F0] grid grid-cols-1 sm:grid-cols-3 gap-3">
                {selectedTask.threePoints.map((pt, i) => (
                  <div
                    key={i}
                    className="flex items-center gap-2.5 p-3 rounded-2xl bg-[#F8F9FA] border border-[#EAEAEA] hover:border-[#CBD5E1] transition-all"
                  >
                    <span className="w-6 h-6 rounded-full bg-[#E53935] text-white text-[11px] font-black flex items-center justify-center flex-shrink-0 shadow-sm">
                      {i + 1}
                    </span>
                    <span className="text-xs font-bold text-[#1A1A2E] leading-snug">{pt}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        ) : mode === 'free' ? (
          /* Free Writing Topic Configuration */
          <div className="bg-white rounded-3xl border-2 border-[#EAEAEA] border-b-[5px] border-b-[#D8D8D8] p-6 shadow-sm space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Sparkles className="text-[#E53935]" size={22} />
                <h2 className="text-base md:text-lg font-black text-[#1A1A2E]">
                  Free Practice & Custom Topic
                </h2>
              </div>
              <span className="text-xs font-bold text-[#9E9E9E]">Write any German paragraph</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="sm:col-span-2">
                <label className="text-xs font-bold text-[#555] block mb-1">Topic / Title:</label>
                <input
                  type="text"
                  value={customTopic}
                  onChange={(e) => setCustomTopic(e.target.value)}
                  placeholder="e.g. Mein Alltag / Ein Brief an einen Freund"
                  className="w-full px-4 py-2.5 rounded-2xl border-2 border-[#EAEAEA] text-xs md:text-sm font-semibold text-[#1A1A2E] focus:outline-none focus:border-[#E53935]"
                />
              </div>
              <div>
                <label className="text-xs font-bold text-[#555] block mb-1">Target Level:</label>
                <select
                  value={customLevel}
                  onChange={(e) => setCustomLevel(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-2xl border-2 border-[#EAEAEA] text-xs md:text-sm font-semibold text-[#1A1A2E] focus:outline-none focus:border-[#E53935]"
                >
                  <option value="A1">A1 (Beginner)</option>
                  <option value="A2">A2 (Elementary)</option>
                  <option value="B1">B1 (Intermediate)</option>
                  <option value="B2">B2 (Upper Intermediate)</option>
                </select>
              </div>
            </div>

            <div>
              <label className="text-xs font-bold text-[#555] block mb-1">Writing Instruction / Prompt:</label>
              <input
                type="text"
                value={customInstruction}
                onChange={(e) => setCustomInstruction(e.target.value)}
                placeholder="e.g. Schreibe 40–50 Wörter über deinen Alltag."
                className="w-full px-4 py-2.5 rounded-2xl border-2 border-[#EAEAEA] text-xs md:text-sm font-semibold text-[#1A1A2E] focus:outline-none focus:border-[#E53935]"
              />
            </div>
          </div>
        ) : (
          /* Task Library Showcase */
          <div className="space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h2 className="text-lg font-black text-[#1A1A2E] flex items-center gap-2">
                  <PenLine size={20} className="text-[#E53935]" />
                  Goethe Exam Writing Prompts
                </h2>
                <p className="text-xs text-[#757575] font-medium mt-0.5">
                  Select a structured exam scenario (SMS, Email, Letter) or use Free Writing Mode.
                </p>
              </div>

              <div className="flex items-center gap-2 flex-wrap">
                {/* Level Pills */}
                {['all', 'A1', 'A2', 'B1', 'B2'].map((lvl) => {
                  const isActive = filterLevel === lvl;
                  const count = lvl === 'all' ? tasks.length : tasks.filter((t) => t.level === lvl).length;
                  return (
                    <button
                      key={lvl}
                      onClick={() => setFilterLevel(lvl)}
                      className={`px-3 py-1.5 rounded-xl text-xs font-black transition-all flex items-center gap-1.5 cursor-pointer ${
                        isActive
                          ? 'bg-[#1A1A2E] text-white shadow-sm scale-105'
                          : 'bg-white text-[#757575] border-2 border-[#EAEAEA] hover:border-[#1A1A2E]'
                      }`}
                    >
                      <span>{lvl === 'all' ? 'All Levels' : lvl}</span>
                      {count > 0 && (
                        <span className={`text-[10px] px-1.5 py-0.2 rounded-full ${isActive ? 'bg-white/20 text-white' : 'bg-gray-100 text-gray-600'}`}>
                          {count}
                        </span>
                      )}
                    </button>
                  );
                })}

                <button
                  onClick={handleSeed}
                  disabled={seeding}
                  className="p-2 rounded-xl text-[#757575] bg-white border-2 border-[#EAEAEA] hover:text-[#1A1A2E] hover:border-[#1A1A2E] transition-all disabled:opacity-50 cursor-pointer"
                  title="Reload sample tasks"
                >
                  <RefreshCw size={14} className={seeding ? 'animate-spin' : ''} />
                </button>
              </div>
            </div>

            {loading ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 animate-pulse">
                {[1, 2, 3, 4].map((n) => (
                  <div key={n} className="h-36 bg-white rounded-3xl border border-gray-200" />
                ))}
              </div>
            ) : filteredTasks.length === 0 ? (
              <div className="bg-white rounded-3xl border-2 border-[#EAEAEA] p-8 text-center space-y-3">
                <p className="text-3xl">📭</p>
                <p className="text-sm font-black text-[#1A1A2E]">No writing tasks found.</p>
                <button
                  onClick={handleSeed}
                  className="duo-btn duo-btn-red px-5 py-2.5 text-xs inline-flex items-center gap-2 cursor-pointer"
                >
                  <RefreshCw size={14} /> Load Goethe Writing Prompts
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {filteredTasks.map((task: any) => {
                  const lvl = LEVEL_COLORS[task.level] || LEVEL_COLORS.A1;
                  const isSelected = (selectedTask as any)?._id === task._id;
                  return (
                    <motion.div
                      key={task._id}
                      whileHover={{ y: -3, scale: 1.01 }}
                      onClick={() => {
                        setSelectedTask(task);
                        setUserText('');
                        setFeedback(null);
                      }}
                      className={`bg-white rounded-3xl border-2 p-5 cursor-pointer transition-all flex flex-col justify-between relative shadow-sm ${
                        isSelected
                          ? 'border-[#E53935] ring-4 ring-[#FFCDD2]/50 border-b-[5px] border-b-[#B71C1C]'
                          : 'border-[#EAEAEA] border-b-[4px] border-b-[#D8D8D8] hover:border-[#1A1A2E]'
                      }`}
                    >
                      <div>
                        <div className="flex items-center justify-between mb-2.5">
                          <div className="flex items-center gap-2">
                            <span
                              className="text-[10px] font-black uppercase px-2.5 py-0.5 rounded-full border"
                              style={{ background: lvl.bg, color: lvl.color, borderColor: lvl.border }}
                            >
                              {task.level}
                            </span>
                            <span className="text-[10px] font-bold text-[#757575] bg-[#F5F6FA] px-2 py-0.5 rounded-full border border-[#EAEAEA]">
                              {TASK_TYPE_LABELS[task.taskType]}
                            </span>
                          </div>
                          <span className="text-[10px] font-bold text-[#9E9E9E] bg-[#FAFAFA] px-2 py-0.5 rounded-lg border border-[#F0F0F0]">
                            ⏱️ {task.wordMin}–{task.wordMax} words
                          </span>
                        </div>

                        <h3 className="text-sm md:text-base font-black text-[#1A1A2E] leading-snug mb-1">
                          {task.title}
                        </h3>
                        <p className="text-xs text-[#757575] font-medium line-clamp-2 leading-relaxed">
                          {task.scenario}
                        </p>
                      </div>

                      <div className="flex items-center justify-between pt-3 mt-3 border-t border-[#F5F6FA]">
                        <span className="text-[10px] font-black text-[#E53935] bg-[#FFF5F5] px-2 py-1 rounded-lg border border-[#FFCDD2]">
                          /{task.totalPoints} points
                        </span>
                        <span className="text-xs font-black text-[#1A1A2E] inline-flex items-center gap-1 group-hover:translate-x-1 transition-transform">
                          {isSelected ? 'Selected ✓' : 'Start Writing →'}
                        </span>
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* ═══ SECTION 1: INTERACTIVE WRITING EDITOR & LIVE METRICS ═══════════ */}
        <div className="bg-white rounded-3xl border-2 border-[#EAEAEA] border-b-[5px] border-b-[#D8D8D8] p-6 shadow-sm space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-[#F0F0F0] pb-3">
            <div>
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-[#E53935] animate-pulse" />
                <p className="text-[11px] font-black uppercase tracking-wider text-[#E53935]">
                  German AI Writing Studio
                </p>
              </div>
              <h3 className="text-base font-black text-[#1A1A2E] mt-0.5">
                {selectedTask ? selectedTask.prompt : customInstruction}
              </h3>
            </div>

            {/* German Special Characters Toolbar */}
            <div className="flex items-center gap-1.5 flex-wrap">
              <span className="text-[10px] font-black text-[#9E9E9E] mr-1 hidden sm:inline uppercase tracking-wider">Umlaute:</span>
              {GERMAN_CHARACTERS.map((char) => (
                <button
                  key={char}
                  type="button"
                  onClick={() => insertChar(char)}
                  className="w-8 h-8 rounded-xl bg-[#F5F6FA] border-2 border-[#EAEAEA] hover:border-[#E53935] hover:bg-white text-xs font-black text-[#1A1A2E] transition-all active:scale-90 flex items-center justify-center cursor-pointer shadow-xs"
                  title={`Click to insert ${char}`}
                >
                  {char}
                </button>
              ))}
            </div>
          </div>

          {/* 💡 Interactive German Sentence Starters Tray */}
          <div className="bg-[#F8F9FF] border border-[#E8EEFF] rounded-2xl p-3 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-black text-[#4361EE] flex items-center gap-1.5">
                <Lightbulb size={13} /> Quick Exam Openers & Starters (Click to insert):
              </span>
              <button
                type="button"
                onClick={() => setShowStarters(!showStarters)}
                className="text-[10px] font-bold text-[#4361EE] hover:underline cursor-pointer"
              >
                {showStarters ? 'Hide Starters' : 'Show Starters'}
              </button>
            </div>

            {showStarters && (
              <div className="flex flex-wrap gap-1.5 pt-1">
                {GERMAN_STARTERS.map((s, i) => (
                  <button
                    key={i}
                    type="button"
                    onClick={() => insertStarter(s.text)}
                    className="px-2.5 py-1 rounded-xl bg-white border border-[#D0DBFF] hover:border-[#4361EE] hover:bg-[#EEF2FF] text-[11px] font-bold text-[#1A1A2E] transition-all active:scale-95 cursor-pointer shadow-2xs flex items-center gap-1"
                    title={`Insert: "${s.text.trim()}"`}
                  >
                    <span>{s.label}</span>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* 🔗 Interactive German Connectors Detector Bar (Konnektoren) */}
          <div className="bg-[#FDFBF7] border border-[#F5E6CC] rounded-2xl p-3 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-black text-[#B45309] flex items-center gap-1.5">
                <Zap size={13} className="text-[#FF9F43]" /> Key German Connectors (Konnektoren):
              </span>
              <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-[#FFF4E6] text-[#B45309] border border-[#FFE082]">
                {detectedConnectors.length} / {GERMAN_CONNECTORS_LIST.length} Used
              </span>
            </div>

            <div className="flex flex-wrap gap-1.5">
              {GERMAN_CONNECTORS_LIST.map((c) => {
                const isUsed = detectedConnectors.some((dc) => dc.word === c.word);
                return (
                  <button
                    key={c.word}
                    type="button"
                    onClick={() => insertStarter(`${c.word} `)}
                    className={`px-2.5 py-1 rounded-xl text-[11px] font-black border transition-all active:scale-95 cursor-pointer flex items-center gap-1 ${
                      isUsed
                        ? 'bg-[#E8FBF0] border-[#A5D6A7] text-[#20BF6B] shadow-2xs'
                        : 'bg-white border-[#EAEAEA] text-[#757575] hover:border-[#FF9F43] hover:text-[#B45309]'
                    }`}
                    title={`Meaning: "${c.meaning}" (${c.rule}) — Click to insert`}
                  >
                    <span>{c.word}</span>
                    {isUsed ? (
                      <Check size={11} className="stroke-[3]" />
                    ) : (
                      <span className="text-[9px] font-normal text-[#BDBDBD] opacity-75">({c.rule.split(' ')[0]})</span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Textarea */}
          <div className="relative">
            <textarea
              ref={textareaRef}
              value={userText}
              onChange={(e) => setUserText(e.target.value)}
              placeholder="Schreibe deinen deutschen Text hier... (z.B. Liebe Anna, vielen Dank für deine Einladung...)"
              rows={8}
              className="w-full p-4 rounded-2xl border-2 border-[#EAEAEA] text-sm md:text-base font-medium text-[#1A1A2E] leading-relaxed resize-none focus:outline-none focus:border-[#E53935] transition-colors bg-white shadow-inner"
            />
          </div>

          {/* Live Dynamic HUD Metrics */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1">
            <div className="p-2.5 rounded-xl bg-[#F8F9FA] border border-[#EAEAEA] text-center">
              <span className="text-[10px] font-black uppercase text-[#9E9E9E] block">Words</span>
              <span className={`text-sm font-black ${isWordCountValid ? 'text-[#20BF6B]' : wordCount > targetMax ? 'text-[#E53935]' : 'text-[#FF9F43]'}`}>
                {wordCount} <span className="text-[10px] text-[#9E9E9E]">/ {targetMin}–{targetMax}</span>
              </span>
            </div>
            <div className="p-2.5 rounded-xl bg-[#F8F9FA] border border-[#EAEAEA] text-center">
              <span className="text-[10px] font-black uppercase text-[#9E9E9E] block">Characters</span>
              <span className="text-sm font-black text-[#1A1A2E]">{charCount}</span>
            </div>
            <div className="p-2.5 rounded-xl bg-[#F8F9FA] border border-[#EAEAEA] text-center">
              <span className="text-[10px] font-black uppercase text-[#9E9E9E] block">Sentences</span>
              <span className="text-sm font-black text-[#4361EE]">{sentenceCount}</span>
            </div>
            <div className="p-2.5 rounded-xl bg-[#F8F9FA] border border-[#EAEAEA] text-center">
              <span className="text-[10px] font-black uppercase text-[#9E9E9E] block">Connectors</span>
              <span className="text-sm font-black text-[#20BF6B]">{detectedConnectors.length} detected</span>
            </div>
          </div>

          {/* Live Word Count Progress Bar */}
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <div className="h-2.5 bg-gray-100 rounded-full flex-1 overflow-hidden">
                <div
                  className="h-full rounded-full transition-all duration-300"
                  style={{
                    width: `${wordProgressPct}%`,
                    backgroundColor: isWordCountValid
                      ? '#20BF6B'
                      : isTooLong
                      ? '#E53935'
                      : '#FF9F43',
                  }}
                />
              </div>
              <span className="text-[10px] font-black text-[#9E9E9E]">{wordProgressPct}%</span>
            </div>

            {/* Helpful non-blocking warning banner if exceeded or too short */}
            {wordCount > 0 && !isWordCountValid && (
              <div
                className={`p-3 rounded-2xl text-xs font-bold flex items-start gap-2.5 ${
                  isTooLong
                    ? 'bg-[#FFF5F5] text-[#C62828] border border-[#FFCDD2]'
                    : 'bg-[#FFF9E6] text-[#B78103] border border-[#FFE082]'
                }`}
              >
                <AlertTriangle size={16} className="flex-shrink-0 mt-0.5" />
                <div>
                  {isTooLong ? (
                    <p>
                      ⚠️ Du hast <strong>{wordCount} Wörter</strong> geschrieben. Versuche, zwischen{' '}
                      <strong>{targetMin} und {targetMax} Wörtern</strong> zu bleiben, um Punktabzüge in der Goethe-Prüfung zu vermeiden.
                    </p>
                  ) : (
                    <p>
                      💡 Du hast erst <strong>{wordCount} Wörter</strong> geschrieben. Ergänze noch etwas, um mindestens{' '}
                      <strong>{targetMin} Wörter</strong> zu erreichen.
                    </p>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Interactive Action Bar */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-3 border-t border-[#F0F0F0]">
            <div className="flex items-center gap-2 flex-wrap self-start sm:self-auto">
              <button
                type="button"
                onClick={() => handleSpeak(userText)}
                disabled={!userText || speakingText}
                className="px-3 py-2 rounded-xl border-2 border-[#EAEAEA] bg-white hover:border-[#4361EE] text-xs font-black text-[#4361EE] transition-all flex items-center gap-1.5 disabled:opacity-40 cursor-pointer shadow-2xs"
                title="Listen to your text spoken in German"
              >
                <Volume2 size={14} className={speakingText ? 'animate-bounce text-[#E53935]' : ''} />
                <span>{speakingText ? 'Playing...' : 'Listen to Draft'}</span>
              </button>

              <button
                type="button"
                onClick={handleInsertTemplate}
                className="px-3 py-2 rounded-xl border-2 border-[#EAEAEA] bg-white hover:border-[#FF9F43] text-xs font-black text-[#B45309] transition-all flex items-center gap-1.5 cursor-pointer shadow-2xs"
                title="Load a pre-made German exam template skeleton"
              >
                <Bookmark size={14} />
                <span>Insert Template</span>
              </button>

              <button
                type="button"
                onClick={() => copyToClipboard(userText)}
                disabled={!userText}
                className="px-3 py-2 rounded-xl border-2 border-[#EAEAEA] bg-white hover:border-[#1A1A2E] text-xs font-black text-[#757575] transition-all flex items-center gap-1.5 disabled:opacity-40 cursor-pointer shadow-2xs"
              >
                {copiedText ? <Check size={14} className="text-[#20BF6B]" /> : <Copy size={14} />}
                <span>{copiedText ? 'Copied!' : 'Copy'}</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  if (userText && confirm('Möchtest du deinen Text wirklich löschen?')) {
                    setUserText('');
                  } else if (!userText) {
                    setUserText('');
                  }
                }}
                disabled={!userText || checking}
                className="px-3 py-2 rounded-xl border-2 border-[#EAEAEA] bg-white hover:border-[#E53935] hover:text-[#E53935] text-xs font-black text-[#757575] transition-all flex items-center gap-1.5 disabled:opacity-40 cursor-pointer shadow-2xs"
              >
                <RotateCcw size={14} />
                <span>Reset</span>
              </button>
            </div>

            <button
              onClick={handleCheckWriting}
              disabled={checking || !userText.trim()}
              className="w-full sm:w-auto px-7 py-3 rounded-2xl text-xs md:text-sm font-black text-white flex items-center justify-center gap-2 disabled:opacity-40 transition-all cursor-pointer shadow-[0_4px_0_#B71C1C] hover:translate-y-[2px] active:translate-y-[4px]"
              style={{ background: '#E53935' }}
            >
              {checking ? (
                <>
                  <Loader size={16} className="animate-spin" /> Analyzing with German AI Tutor...
                </>
              ) : (
                <>
                  <Sparkles size={16} className="text-yellow-200 animate-spin" /> Check with AI Tutor ✨
                </>
              )}
            </button>
          </div>

          {errorMessage && (
            <div className="p-4 rounded-2xl bg-[#FFF5F5] border-2 border-[#FFCDD2] text-[#C62828] text-xs font-bold flex items-center gap-2.5 animate-pulse">
              <AlertCircle size={18} className="flex-shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}
        </div>

        {/* ═══ SECTION 2: AI FEEDBACK & TUTOR DASHBOARD ══════════════════════ */}
        {feedback && (
          <div ref={resultsRef} className="space-y-6">

            {/* Top Navigation Tabs */}
            <div className="bg-white rounded-2xl border-2 border-[#EAEAEA] p-1.5 flex items-center gap-1 overflow-x-auto">
              {[
                { id: 'overview', label: '📊 Overview & Score' },
                { id: 'corrections', label: `✏️ Grammar & Errors (${feedback.errors?.length ?? feedback.corrections?.length ?? 0})` },
                { id: 'translation', label: '🌐 English Translation' },
                { id: 'improved', label: '✨ Improved Version' },
                { id: 'practice', label: `📚 Practice Mistakes (${feedback.practiceQuestions?.length ?? 0})` },
              ].map((tab) => {
                const isActive = activeResultTab === tab.id;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveResultTab(tab.id as any)}
                    className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-black transition-all whitespace-nowrap ${
                      isActive
                        ? 'bg-[#E53935] text-white shadow-sm'
                        : 'text-[#757575] hover:text-[#1A1A2E] hover:bg-[#F5F6FA]'
                    }`}
                  >
                    <span>{tab.label}</span>
                  </button>
                );
              })}
            </div>

            {/* TAB 1: OVERVIEW & SCORE */}
            {activeResultTab === 'overview' && (
              <div className="space-y-6">

                {/* Score & CEFR Level Card */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                  {/* Total Score Gauge */}
                  <div className="bg-white rounded-3xl border-2 border-[#EAEAEA] border-b-[5px] border-b-[#D8D8D8] p-6 flex flex-col justify-between">
                    <div>
                      <p className="text-[11px] font-black text-[#9E9E9E] uppercase tracking-wider">
                        Total Score
                      </p>
                      <div className="flex items-baseline gap-2 mt-2">
                        <span className="text-4xl font-black text-[#1A1A2E]">
                          {feedback.totalScore ?? 0}
                        </span>
                        <span className="text-base font-bold text-[#9E9E9E]">
                          / {feedback.totalPoints} pts
                        </span>
                      </div>
                      <p className="text-xs font-bold text-[#757575] mt-1">
                        Goethe Standard Evaluation
                      </p>
                    </div>

                    {/* 4 Criterion Score Badges */}
                    <div className="grid grid-cols-2 gap-2 mt-4 pt-4 border-t border-[#F0F0F0]">
                      <div className="p-2.5 rounded-2xl bg-[#F8F9FA] text-center">
                        <p className="text-sm font-black text-[#1A1A2E]">{feedback.taskCompletion ?? feedback.scores?.task ?? '—'}/4</p>
                        <p className="text-[10px] font-bold text-[#757575]">Task</p>
                      </div>
                      <div className="p-2.5 rounded-2xl bg-[#F8F9FA] text-center">
                        <p className="text-sm font-black text-[#1A1A2E]">{feedback.coherence ?? feedback.scores?.coherence ?? '—'}/4</p>
                        <p className="text-[10px] font-bold text-[#757575]">Coherence</p>
                      </div>
                      <div className="p-2.5 rounded-2xl bg-[#F8F9FA] text-center">
                        <p className="text-sm font-black text-[#1A1A2E]">{feedback.vocabulary ?? feedback.scores?.vocabulary ?? '—'}/2</p>
                        <p className="text-[10px] font-bold text-[#757575]">Vocabulary</p>
                      </div>
                      <div className="p-2.5 rounded-2xl bg-[#F8F9FA] text-center">
                        <p className="text-sm font-black text-[#1A1A2E]">{feedback.grammar ?? feedback.scores?.grammar ?? '—'}/2</p>
                        <p className="text-[10px] font-bold text-[#757575]">Grammar</p>
                      </div>
                    </div>
                  </div>

                  {/* CEFR Level Estimation */}
                  <div className="bg-white rounded-3xl border-2 border-[#EAEAEA] border-b-[5px] border-b-[#D8D8D8] p-6 flex flex-col justify-between">
                    <div>
                      <div className="flex items-center justify-between">
                        <p className="text-[11px] font-black text-[#9E9E9E] uppercase tracking-wider">
                          Estimated CEFR Level
                        </p>
                        <span className="text-lg font-black text-[#20BF6B] bg-[#E8FBF0] border border-[#A5D6A7] px-3 py-0.5 rounded-full">
                          🇩🇪 {feedback.cefrLevel?.estimated || 'A1'}
                        </span>
                      </div>

                      <p className="text-xs font-bold text-[#1A1A2E] mt-3 leading-relaxed">
                        {feedback.cefrLevel?.summary || 'Good foundational German writing with clear everyday sentence structures.'}
                      </p>
                    </div>

                    {/* CEFR Breakdown aspects */}
                    <div className="space-y-1.5 text-[11px] font-medium text-[#757575] mt-4 pt-4 border-t border-[#F0F0F0]">
                      <div className="flex items-center justify-between">
                        <span>Grammar:</span>
                        <span className="font-bold text-[#1A1A2E] text-right truncate ml-2 max-w-[160px]">
                          {feedback.cefrLevel?.breakdown?.grammar || 'Solid present tense'}
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span>Connectors:</span>
                        <span className="font-bold text-[#1A1A2E] text-right truncate ml-2 max-w-[160px]">
                          {feedback.cefrLevel?.breakdown?.connectors || `${feedback.connectorsFound} connectors used`}
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span>Vocabulary:</span>
                        <span className="font-bold text-[#1A1A2E] text-right truncate ml-2 max-w-[160px]">
                          {feedback.cefrLevel?.breakdown?.vocabulary || 'Everyday routine vocabulary'}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Summary Feedback */}
                  <div className="bg-[#FFF5F5] rounded-3xl border-2 border-[#FFCDD2] p-6 flex flex-col justify-between">
                    <div>
                      <p className="text-[11px] font-black text-[#C62828] uppercase tracking-wider flex items-center gap-1.5">
                        <Lightbulb size={14} /> Tutor Feedback
                      </p>
                      <p className="text-xs md:text-sm text-[#1A1A2E] font-semibold leading-relaxed mt-2">
                        {feedback.feedback}
                      </p>
                    </div>

                    {feedback.germanFeedback && (
                      <p className="text-xs text-[#757575] italic font-medium mt-3 pt-3 border-t border-[#FFCDD2]/60">
                        🇩🇪 "{feedback.germanFeedback}"
                      </p>
                    )}
                  </div>
                </div>

                {/* Score Deductions Note (if any) */}
                {feedback.scores?.deductions && feedback.scores.deductions.length > 0 && (
                  <div className="p-4 rounded-2xl bg-[#FFF9E6] border-2 border-[#FFE082] text-xs font-bold text-[#B78103] space-y-1">
                    <p className="font-black flex items-center gap-1.5 text-sm">
                      <AlertTriangle size={15} /> Score Breakdown Explanation:
                    </p>
                    {feedback.scores.deductions.map((d, i) => (
                      <p key={i} className="pl-5">• <strong>{d.category}</strong>: {d.reason}</p>
                    ))}
                  </div>
                )}

                {/* ═══ SECTION 2: REQUIREMENTS CHECKLIST ════════════════════ */}
                <div className="bg-white rounded-3xl border-2 border-[#EAEAEA] border-b-[5px] border-b-[#D8D8D8] p-6 shadow-sm space-y-4">
                  <h3 className="text-base font-black text-[#1A1A2E] flex items-center gap-2">
                    <CheckCircle2 className="text-[#20BF6B]" size={20} />
                    Writing Requirements Checklist
                  </h3>

                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
                    {/* Word count check */}
                    <div
                      className={`p-3.5 rounded-2xl border-2 flex items-start gap-2.5 ${
                        feedback.wordCountOk
                          ? 'bg-[#E8FBF0] border-[#A5D6A7] text-[#2E7D32]'
                          : 'bg-[#FFF5F5] border-[#FFCDD2] text-[#C62828]'
                      }`}
                    >
                      {feedback.wordCountOk ? <CheckCircle2 size={18} /> : <XCircle size={18} />}
                      <div>
                        <p className="text-xs font-black">Word Count</p>
                        <p className="text-[11px] font-medium mt-0.5">
                          {feedback.wordCount} / {feedback.wordMin}–{feedback.wordMax} words
                        </p>
                      </div>
                    </div>

                    {/* Topic check */}
                    <div className="p-3.5 rounded-2xl border-2 bg-[#E8FBF0] border-[#A5D6A7] text-[#2E7D32] flex items-start gap-2.5">
                      <CheckCircle2 size={18} />
                      <div>
                        <p className="text-xs font-black">Topic Completion</p>
                        <p className="text-[11px] font-medium mt-0.5">Addressed core scenario</p>
                      </div>
                    </div>

                    {/* Connectors check */}
                    <div
                      className={`p-3.5 rounded-2xl border-2 flex items-start gap-2.5 ${
                        feedback.connectorsFound >= 2
                          ? 'bg-[#E8FBF0] border-[#A5D6A7] text-[#2E7D32]'
                          : 'bg-[#FFF9E6] border-[#FFE082] text-[#B78103]'
                      }`}
                    >
                      {feedback.connectorsFound >= 2 ? <CheckCircle2 size={18} /> : <AlertTriangle size={18} />}
                      <div>
                        <p className="text-xs font-black">Connectors</p>
                        <p className="text-[11px] font-medium mt-0.5">
                          {feedback.connectorsFound} of {feedback.requiredConnectors?.length || 5} used
                        </p>
                      </div>
                    </div>

                    {/* Sentence Structure */}
                    <div className="p-3.5 rounded-2xl border-2 bg-[#E8FBF0] border-[#A5D6A7] text-[#2E7D32] flex items-start gap-2.5">
                      <CheckCircle2 size={18} />
                      <div>
                        <p className="text-xs font-black">Basic Structure</p>
                        <p className="text-[11px] font-medium mt-0.5">Clear German sentence order</p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* ═══ SECTION 3: EDUCATIONAL CONNECTOR CHECK ════════════════ */}
                <div className="bg-white rounded-3xl border-2 border-[#EAEAEA] border-b-[5px] border-b-[#D8D8D8] p-6 shadow-sm space-y-4">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div>
                      <h3 className="text-base font-black text-[#1A1A2E] flex items-center gap-2">
                        <Compass className="text-[#E53935]" size={20} />
                        Connector Check & Learning Guide
                      </h3>
                      <p className="text-xs text-[#757575] font-medium mt-0.5">
                        Click any connector to view its meaning, word-order rule, and sample sentences.
                      </p>
                    </div>
                    <span className="text-xs font-bold text-[#9E9E9E]">
                      {feedback.connectorsFound} Used · {(feedback.requiredConnectors?.length || 0) - feedback.connectorsFound} Missing
                    </span>
                  </div>

                  {/* Connector Badges Grid */}
                  <div className="flex flex-wrap gap-2">
                    {feedback.connectorCheck?.map((item) => (
                      <button
                        key={item.connector}
                        onClick={() => setSelectedConnector(item)}
                        className={`flex items-center gap-1.5 px-3.5 py-2 rounded-2xl text-xs font-black border-2 transition-all hover:scale-105 active:scale-95 ${
                          item.found
                            ? 'bg-[#E8FBF0] text-[#2E7D32] border-[#A5D6A7]'
                            : 'bg-[#FFF5F5] text-[#C62828] border-[#FFCDD2]'
                        }`}
                      >
                        {item.found ? <Check size={14} /> : <X size={14} />}
                        <span>{item.connector}</span>
                      </button>
                    ))}
                  </div>

                  {/* Interactive Connector Learning Detail Box */}
                  {selectedConnector && (
                    <motion.div
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="p-5 rounded-2xl bg-[#F8F9FA] border-2 border-[#EAEAEA] space-y-3"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-black text-[#1A1A2E] bg-white border border-[#EAEAEA] px-3 py-1 rounded-xl">
                            {selectedConnector.connector}
                          </span>
                          <span className="text-xs font-bold text-[#757575]">
                            English: <strong>{selectedConnector.meaning}</strong>
                          </span>
                        </div>
                        <button
                          onClick={() => setSelectedConnector(null)}
                          className="text-xs text-[#9E9E9E] hover:text-[#1A1A2E]"
                        >
                          ✕ Close
                        </button>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs font-medium">
                        <div className="p-3 bg-white rounded-xl border border-[#EAEAEA]">
                          <p className="font-bold text-[#E53935] mb-1">📐 Word Order Rule:</p>
                          <p className="text-[#1A1A2E]">{selectedConnector.wordOrder}</p>
                          <p className="text-[11px] text-[#757575] mt-1">{selectedConnector.tip}</p>
                        </div>

                        <div className="p-3 bg-white rounded-xl border border-[#EAEAEA]">
                          <p className="font-bold text-[#20BF6B] mb-1">💬 Example German Sentence:</p>
                          <p className="text-[#1A1A2E] font-semibold">"{selectedConnector.example}"</p>
                          <p className="text-[11px] text-[#757575] mt-1">({selectedConnector.exampleTranslation})</p>
                        </div>
                      </div>
                    </motion.div>
                  )}
                </div>

                {/* ═══ SECTION 4: WHAT YOU DID WELL & WHAT TO IMPROVE ════════ */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  {/* Strengths */}
                  <div className="bg-white rounded-3xl border-2 border-[#EAEAEA] border-b-[5px] border-b-[#D8D8D8] p-6 space-y-3">
                    <h3 className="text-base font-black text-[#2E7D32] flex items-center gap-2">
                      <Sparkles size={18} />
                      🌟 What You Did Well
                    </h3>
                    <ul className="space-y-2 text-xs font-bold text-[#1A1A2E]">
                      {(feedback.strengths || [
                        'Clear description of your daily routine',
                        'Good basic German vocabulary and verb usage',
                      ]).map((st, i) => (
                        <li key={i} className="flex items-start gap-2.5 p-2 rounded-xl bg-[#E8FBF0]/60">
                          <CheckCircle2 size={15} className="text-[#20BF6B] flex-shrink-0 mt-0.5" />
                          <span>{st}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  {/* Areas for Improvement */}
                  <div className="bg-white rounded-3xl border-2 border-[#EAEAEA] border-b-[5px] border-b-[#D8D8D8] p-6 space-y-3">
                    <h3 className="text-base font-black text-[#E53935] flex items-center gap-2">
                      <Compass size={18} />
                      🎯 What to Improve
                    </h3>
                    <ul className="space-y-2 text-xs font-bold text-[#1A1A2E]">
                      {(feedback.improvements || [
                        'Practice German articles: der / die / das',
                        'Use more subordinate connectors like "weil" or "obwohl"',
                      ]).map((imp, i) => (
                        <li key={i} className="flex items-start gap-2.5 p-2 rounded-xl bg-[#FFF5F5]/60">
                          <AlertCircle size={15} className="text-[#E53935] flex-shrink-0 mt-0.5" />
                          <span>{imp}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>

              </div>
            )}

            {/* TAB 2: GRAMMAR & DETAILED ERROR CORRECTIONS */}
            {activeResultTab === 'corrections' && (
              <div className="bg-white rounded-3xl border-2 border-[#EAEAEA] border-b-[5px] border-b-[#D8D8D8] p-6 shadow-sm space-y-5">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-[#F0F0F0] pb-4">
                  <div>
                    <h3 className="text-base md:text-lg font-black text-[#1A1A2E] flex items-center gap-2">
                      <BookCheck className="text-[#E53935]" size={22} />
                      Grammar & Detailed Error Analysis
                    </h3>
                    <p className="text-xs text-[#757575] font-medium mt-0.5">
                      Clear visual breakdown of every mistake with explanations on why and how to fix it.
                    </p>
                  </div>

                  {feedback.corrections?.length > 0 && (
                    <button
                      onClick={() => copyToClipboard(feedback.corrections.join('\n'))}
                      className="px-3.5 py-2 rounded-xl border-2 border-[#EAEAEA] bg-white hover:border-[#1A1A2E] text-xs font-black text-[#1A1A2E] transition-all flex items-center gap-1.5"
                    >
                      <Copy size={13} /> {copiedText ? 'Copied!' : 'Copy Corrected Text'}
                    </button>
                  )}
                </div>

                {/* Structured Error Cards */}
                {feedback.errors && feedback.errors.length > 0 ? (
                  <div className="space-y-4">
                    {feedback.errors.map((err, i) => (
                      <div
                        key={i}
                        className="p-5 rounded-2xl border-2 border-[#EAEAEA] bg-[#F8F9FA] space-y-3"
                      >
                        <div className="flex items-center justify-between">
                          <span className="text-[10px] font-black uppercase px-2.5 py-0.5 rounded-full bg-[#E53935] text-white">
                            {err.type || 'Grammar'}
                          </span>
                          <span className="text-[11px] font-bold text-[#9E9E9E]">Point #{i + 1}</span>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs font-medium">
                          {/* Original */}
                          <div className="p-3 rounded-xl bg-[#FFF5F5] border border-[#FFCDD2] text-[#C62828]">
                            <p className="text-[10px] font-black uppercase tracking-wider mb-1">❌ Original:</p>
                            <p className="font-semibold">"{err.original}"</p>
                          </div>

                          {/* Correction */}
                          <div className="p-3 rounded-xl bg-[#E8FBF0] border border-[#A5D6A7] text-[#2E7D32]">
                            <p className="text-[10px] font-black uppercase tracking-wider mb-1">✅ Correction:</p>
                            <p className="font-semibold">"{err.correction}"</p>
                          </div>
                        </div>

                        {/* Explanation */}
                        {err.explanation && (
                          <div className="p-3 rounded-xl bg-white border border-[#EAEAEA] text-xs">
                            <p className="font-bold text-[#E53935] mb-0.5 flex items-center gap-1">
                              <Lightbulb size={13} /> Why?
                            </p>
                            <p className="text-[#555] font-medium leading-relaxed">{err.explanation}</p>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  /* Zero Errors Celebration */
                  <div className="p-8 rounded-2xl bg-[#E8FBF0] border-2 border-[#A5D6A7] text-center space-y-2">
                    <p className="text-3xl">🎉</p>
                    <h4 className="text-base font-black text-[#2E7D32]">Perfekt! Keine Grammatik- oder Rechtschreibfehler!</h4>
                    <p className="text-xs text-[#2E7D32] font-medium max-w-md mx-auto">
                      Your German text has excellent grammar, accurate verb conjugations, correct articles, and proper spelling! The only feedback for this exercise is word count / length.
                    </p>
                  </div>
                )}
              </div>
            )}

            {/* TAB 3: ENGLISH TRANSLATION */}
            {activeResultTab === 'translation' && (
              <div className="bg-white rounded-3xl border-2 border-[#EAEAEA] border-b-[5px] border-b-[#D8D8D8] p-6 shadow-sm space-y-5">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-[#F0F0F0] pb-4">
                  <div>
                    <h3 className="text-base md:text-lg font-black text-[#1A1A2E] flex items-center gap-2">
                      <Globe className="text-[#4361EE]" size={22} />
                      🌐 English Translation of Your Writing
                    </h3>
                    <p className="text-xs text-[#757575] font-medium mt-0.5">
                      Compare your original German sentences with their accurate English translations.
                    </p>
                  </div>
                </div>

                {/* Sentence by Sentence Alignment */}
                {feedback.translation?.sentencePairs && feedback.translation.sentencePairs.length > 0 ? (
                  <div className="space-y-3">
                    {feedback.translation.sentencePairs.map((pair, idx) => (
                      <div
                        key={idx}
                        className="p-4 rounded-2xl border-2 border-[#EAEAEA] bg-[#F8F9FA] hover:border-[#4361EE] transition-all grid grid-cols-1 md:grid-cols-2 gap-3 text-xs md:text-sm font-medium"
                      >
                        <div className="border-b md:border-b-0 md:border-r border-[#EAEAEA] pb-2 md:pb-0 md:pr-3">
                          <p className="text-[10px] font-black text-[#E53935] uppercase mb-1">🇩🇪 Original German</p>
                          <p className="font-bold text-[#1A1A2E] leading-relaxed">{pair.german}</p>
                        </div>
                        <div className="md:pl-2">
                          <p className="text-[10px] font-black text-[#4361EE] uppercase mb-1">🇬🇧 English Meaning</p>
                          <p className="font-semibold text-[#555] leading-relaxed">{pair.english}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  /* Full Paragraph Translation */
                  <div className="p-5 rounded-2xl bg-[#EEF2FF] border-2 border-[#C5D0FF] space-y-2">
                    <p className="text-[11px] font-black uppercase text-[#4361EE]">Full English Translation</p>
                    <p className="text-sm font-medium text-[#1A1A2E] leading-relaxed">
                      {feedback.translation?.full || 'No translation available.'}
                    </p>
                  </div>
                )}
              </div>
            )}

            {/* TAB 4: IMPROVED VERSION */}
            {activeResultTab === 'improved' && (
              <div className="bg-white rounded-3xl border-2 border-[#EAEAEA] border-b-[5px] border-b-[#D8D8D8] p-6 shadow-sm space-y-5">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-[#F0F0F0] pb-4">
                  <div>
                    <h3 className="text-base md:text-lg font-black text-[#1A1A2E] flex items-center gap-2">
                      <Sparkles className="text-[#E53935]" size={22} />
                      ✨ Improved German Version
                    </h3>
                    <p className="text-xs text-[#757575] font-medium mt-0.5">
                      A polished, natural rewrite maintaining your authentic voice at an appropriate CEFR level.
                    </p>
                  </div>

                  <button
                    onClick={() => copyToClipboard(feedback.improvedVersion?.text || userText)}
                    className="px-3.5 py-2 rounded-xl border-2 border-[#EAEAEA] bg-white hover:border-[#1A1A2E] text-xs font-black text-[#1A1A2E] transition-all flex items-center gap-1.5"
                  >
                    <Copy size={13} /> {copiedText ? 'Copied!' : 'Copy Improved Text'}
                  </button>
                </div>

                {/* Side by Side Comparison */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="p-5 rounded-2xl bg-[#F8F9FA] border-2 border-[#EAEAEA] space-y-2">
                    <p className="text-[11px] font-black uppercase text-[#757575]">Original Submission</p>
                    <p className="text-xs md:text-sm font-medium text-[#1A1A2E] leading-relaxed whitespace-pre-line">
                      {userText}
                    </p>
                  </div>

                  <div className="p-5 rounded-2xl bg-[#E8FBF0] border-2 border-[#A5D6A7] space-y-2">
                    <p className="text-[11px] font-black uppercase text-[#2E7D32]">✨ Polished German Version</p>
                    <p className="text-xs md:text-sm font-bold text-[#1A1A2E] leading-relaxed whitespace-pre-line">
                      {feedback.improvedVersion?.text || userText}
                    </p>
                  </div>
                </div>

                {/* Why is this better? */}
                {feedback.improvedVersion?.whyBetter && (
                  <div className="p-5 rounded-2xl bg-[#FFF9E6] border-2 border-[#FFE082] space-y-2.5">
                    <p className="text-xs font-black text-[#B78103] flex items-center gap-1.5">
                      <Lightbulb size={15} /> Why is this version better?
                    </p>
                    <p className="text-xs md:text-sm font-semibold text-[#1A1A2E] leading-relaxed">
                      {feedback.improvedVersion.whyBetter}
                    </p>

                    {feedback.improvedVersion.keyChanges && feedback.improvedVersion.keyChanges.length > 0 && (
                      <div className="pt-2 border-t border-[#FFE082]/60 space-y-1.5">
                        <p className="text-[11px] font-black uppercase text-[#B78103]">Key Improvements Made:</p>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                          {feedback.improvedVersion.keyChanges.map((change, i) => (
                            <div key={i} className="flex items-center gap-2 text-xs font-bold text-[#555] bg-white/70 p-2 rounded-xl border border-[#FFE082]/50">
                              <CheckCircle2 size={13} className="text-[#20BF6B] flex-shrink-0" />
                              <span>{change}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* Official Model Answer (if task mode) */}
                {feedback.modelAnswer && (
                  <div className="pt-4 border-t border-[#F0F0F0]">
                    {!showModelAnswer ? (
                      <button
                        onClick={() => setShowModelAnswer(true)}
                        className="w-full py-3 rounded-2xl border-2 border-[#EAEAEA] bg-white hover:border-[#1A1A2E] text-xs font-black text-[#1A1A2E] transition-all"
                      >
                        👁 View Official Goethe Model Answer
                      </button>
                    ) : (
                      <div className="p-5 rounded-2xl bg-[#EEF2FF] border-2 border-[#C5D0FF] space-y-2">
                        <p className="text-[11px] font-black uppercase text-[#4361EE]">Official Goethe Model Answer</p>
                        <p className="text-xs md:text-sm font-medium text-[#1A1A2E] leading-relaxed whitespace-pre-line">
                          {feedback.modelAnswer}
                        </p>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* TAB 5: PRACTICE THESE MISTAKES */}
            {activeResultTab === 'practice' && (
              <div className="bg-white rounded-3xl border-2 border-[#EAEAEA] border-b-[5px] border-b-[#D8D8D8] p-6 shadow-sm space-y-5">
                <div className="border-b border-[#F0F0F0] pb-4">
                  <h3 className="text-base md:text-lg font-black text-[#1A1A2E] flex items-center gap-2">
                    <Layers className="text-[#E53935]" size={22} />
                    📚 Practice These Mistakes (Targeted Mini-Quiz)
                  </h3>
                  <p className="text-xs text-[#757575] font-medium mt-0.5">
                    Reinforce the grammar, articles, and word-order rules from your writing submission.
                  </p>
                </div>

                {feedback.practiceQuestions && feedback.practiceQuestions.length > 0 ? (
                  <div className="space-y-5">
                    {feedback.practiceQuestions.map((q, qIndex) => {
                      const selected = userAnswers[q.id];
                      const hasAnswered = selected !== undefined;
                      const isCorrect = selected === q.correctIndex;

                      return (
                        <div
                          key={q.id}
                          className="p-5 rounded-2xl border-2 border-[#EAEAEA] bg-[#F8F9FA] space-y-3.5"
                        >
                          <div className="flex items-center justify-between">
                            <span className="text-[10px] font-black uppercase px-2.5 py-0.5 rounded-full bg-[#1A1A2E] text-white">
                              Question {qIndex + 1}
                            </span>
                            <span className="text-[11px] font-bold text-[#757575]">{q.category}</span>
                          </div>

                          <p className="text-sm font-black text-[#1A1A2E]">{q.question}</p>

                          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                            {q.options.map((opt, optIndex) => {
                              const isThisSelected = selected === optIndex;
                              let btnStyle = 'bg-white border-[#EAEAEA] text-[#1A1A2E] hover:border-[#1A1A2E]';

                              if (hasAnswered) {
                                if (optIndex === q.correctIndex) {
                                  btnStyle = 'bg-[#E8FBF0] border-[#A5D6A7] text-[#2E7D32]';
                                } else if (isThisSelected) {
                                  btnStyle = 'bg-[#FFF5F5] border-[#FFCDD2] text-[#C62828]';
                                }
                              }

                              return (
                                <button
                                  key={optIndex}
                                  type="button"
                                  onClick={() =>
                                    setUserAnswers((prev) => ({ ...prev, [q.id]: optIndex }))
                                  }
                                  className={`p-3 rounded-xl border-2 text-xs font-bold text-left transition-all ${btnStyle}`}
                                >
                                  {opt}
                                </button>
                              );
                            })}
                          </div>

                          {/* Explanation banner upon answering */}
                          {hasAnswered && (
                            <div
                              className={`p-3 rounded-xl text-xs font-medium ${
                                isCorrect
                                  ? 'bg-[#E8FBF0] text-[#2E7D32] border border-[#A5D6A7]'
                                  : 'bg-[#FFF5F5] text-[#C62828] border border-[#FFCDD2]'
                              }`}
                            >
                              <p className="font-bold mb-0.5">
                                {isCorrect ? '✅ Richtig! (Correct!)' : '❌ Nicht ganz! (Not quite!)'}
                              </p>
                              <p>{q.explanation}</p>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="text-center py-8 text-[#757575]">
                    <p>No practice questions generated.</p>
                  </div>
                )}
              </div>
            )}

            {/* Bottom Actions Bar */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2">
              <button
                onClick={handleTryAnotherExercise}
                className="duo-btn duo-btn-red px-6 py-3 text-xs font-black w-full sm:w-auto inline-flex items-center justify-center gap-2"
              >
                <RotateCcw size={14} /> Try Another Writing Exercise
              </button>

              <button
                onClick={() => {
                  textareaRef.current?.focus();
                  window.scrollTo({ top: 200, behavior: 'smooth' });
                }}
                className="px-5 py-3 rounded-2xl border-2 border-[#EAEAEA] bg-white hover:border-[#1A1A2E] text-xs font-black text-[#1A1A2E] transition-all w-full sm:w-auto"
              >
                ✏️ Edit & Re-check Text
              </button>
            </div>

          </div>
        )}

      </div>
    </PageShell>
  );
}

// ── Root Page Export with Suspense ───────────────────────────────────────────
export default function WritingPracticePage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-[#F5F6FA] flex items-center justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#E53935]" />
        </div>
      }
    >
      <WritingLabContent />
    </Suspense>
  );
}

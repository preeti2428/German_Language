'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { ChevronLeft, Clock, FileText, Headphones, PenLine, BookOpen, RefreshCw, Loader } from 'lucide-react';
import { useRouter } from 'next/navigation';
import api from '@/lib/api';

interface TestPaperSummary {
  _id: string;
  title: string;
  level: string;
  source: string;
  year?: number;
  totalTime: number;
  totalMarks: number;
  passingMarks: number;
  tags: string[];
  sectionCount: number;
  questionCount: number;
}

const LEVEL_COLORS: Record<string, { bg: string; color: string; shadow: string; emoji: string }> = {
  A1: { bg: '#E8FBF0', color: '#20BF6B', shadow: '#178B4E', emoji: '🌱' },
  A2: { bg: '#EEF2FF', color: '#4361EE', shadow: '#3046B2', emoji: '🌿' },
  B1: { bg: '#FFF4E6', color: '#FF9F43', shadow: '#D97F27', emoji: '🌳' },
  B2: { bg: '#F7EDFF', color: '#CE82FF', shadow: '#A85FD6', emoji: '🌲' },
};

const SECTION_ICONS = {
  listening: Headphones,
  reading: BookOpen,
  writing: PenLine,
  speaking: FileText,
};

export default function TestSeriesPage() {
  const router = useRouter();
  const [papers, setPapers] = useState<TestPaperSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [seeding, setSeeding] = useState(false);
  const [filterLevel, setFilterLevel] = useState<string>('all');

  const loadPapers = async () => {
    setLoading(true);
    try {
      const url = filterLevel !== 'all' ? `/tests?level=${filterLevel}` : '/tests';
      const { data } = await api.get(url);
      setPapers(data);
    } catch {
      setPapers([]);
    } finally {
      setLoading(false);
    }
  };

  const handleSeed = async () => {
    setSeeding(true);
    try {
      await api.post('/tests/seed');
      await loadPapers();
    } catch {
      alert('Seed failed. Make sure you are logged in.');
    } finally {
      setSeeding(false);
    }
  };

  useEffect(() => { loadPapers(); }, [filterLevel]);

  const filtered = papers.filter((p) => filterLevel === 'all' || p.level === filterLevel);

  return (
    <div className="min-h-screen bg-[#F5F6FA] p-4 md:p-8">
      <div className="max-w-3xl mx-auto">
        {/* Header */}
        <div className="flex items-center gap-3 mb-6">
          <button onClick={() => router.back()} className="text-[#BDBDBD] hover:text-[#757575]">
            <ChevronLeft size={20} />
          </button>
          <div className="flex-1">
            <h1 className="text-xl font-black text-[#1A1A2E]">📋 Test Series</h1>
            <p className="text-xs text-[#9E9E9E] font-medium">Goethe-style practice papers with all 4 skills</p>
          </div>
          <button
            onClick={handleSeed}
            disabled={seeding}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-black text-[#20BF6B] bg-[#E8FBF0] border border-[#B7EDD3] hover:bg-[#D0F5E5] transition-all disabled:opacity-50"
          >
            {seeding ? <Loader size={12} className="animate-spin" /> : <RefreshCw size={12} />}
            {seeding ? 'Seeding...' : 'Load Sample Papers'}
          </button>
        </div>

        {/* Downloadable Practice Test Papers (PDFs) Section */}
        <div className="bg-white rounded-3xl p-5 md:p-6 mb-6 border-2 border-[#EAEAEA] shadow-[0_4px_20px_rgba(0,0,0,0.05)] space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-[#F0F0F0]">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-[#EEF2FF] border border-[#C5D0FF] flex items-center justify-center text-xl">
                📄
              </div>
              <div>
                <h2 className="text-base font-black text-[#1A1A2E]">A1 Printable PDF Test Papers</h2>
                <p className="text-xs text-[#757575] font-medium">10 Multiple-Choice Practice Papers (150 MCQs + Keys)</p>
              </div>
            </div>

            <a
              href="/downloads/test-papers/A1_German_Complete_10_Test_Papers_Booklet.pdf"
              download
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl text-xs font-black text-white bg-[#4361EE] shadow-[0_3px_0_#3046B2] hover:shadow-[0_1px_0_#3046B2] hover:translate-y-[2px] transition-all cursor-pointer flex-shrink-0"
            >
              📥 Download Complete Booklet (10-in-1 PDF)
            </a>
          </div>

          {/* Quick PDF Links Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {[
              { id: 1, title: 'Greetings & Introductions', file: 'A1_German_Test_Paper_1_Greetings_and_Introductions.pdf' },
              { id: 2, title: 'Numbers 0–100', file: 'A1_German_Test_Paper_2_Numbers_0–100.pdf' },
              { id: 3, title: 'Personal Pronouns & Verbs', file: 'A1_German_Test_Paper_3_Personal_Pronouns_and_Essential_Verbs.pdf' },
              { id: 4, title: 'Articles & Nouns (der/die/das)', file: 'A1_German_Test_Paper_4_Articles_and_Nouns_—_der___die___das.pdf' },
              { id: 5, title: 'Family Members', file: 'A1_German_Test_Paper_5_Family_Members.pdf' },
              { id: 6, title: 'Colors & Basic Adjectives', file: 'A1_German_Test_Paper_6_Colors_and_Basic_Adjectives.pdf' },
              { id: 7, title: 'Days, Months & Time', file: 'A1_German_Test_Paper_7_Days,_Months_and_Time.pdf' },
              { id: 8, title: 'Food & Drinks', file: 'A1_German_Test_Paper_8_Food_and_Drinks.pdf' },
              { id: 9, title: 'Question Words & Phrases', file: 'A1_German_Test_Paper_9_Question_Words_and_Survival_Phrases.pdf' },
              { id: 10, title: 'Comprehensive Mixed Review', file: 'A1_German_Test_Paper_10_Comprehensive_Mixed_Review.pdf' },
            ].map((p) => (
              <a
                key={p.id}
                href={`/downloads/test-papers/${p.file}`}
                download
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-between p-2.5 rounded-xl border border-[#EAEAEA] bg-[#F8F9FA] hover:bg-[#EEF2FF] hover:border-[#4361EE] text-xs font-bold text-[#1A1A2E] hover:text-[#4361EE] transition-all cursor-pointer group"
              >
                <div className="flex items-center gap-2 truncate">
                  <span className="w-5 h-5 rounded-md bg-white border border-[#EAEAEA] flex items-center justify-center text-[10px] font-black text-[#4361EE] flex-shrink-0">
                    {p.id}
                  </span>
                  <span className="truncate">{p.title}</span>
                </div>
                <span className="text-[11px] font-black text-[#4361EE] opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0 ml-2">
                  PDF ⬇
                </span>
              </a>
            ))}
          </div>
        </div>

        {/* Level filter */}
        <div className="flex gap-2 mb-6 flex-wrap">
          {['all', 'A1', 'A2', 'B1', 'B2'].map((lvl) => {
            const style = lvl !== 'all' ? LEVEL_COLORS[lvl] : { bg: '#F0F0F0', color: '#757575', shadow: '#D0D0D0', emoji: '' };
            const isActive = filterLevel === lvl;
            return (
              <button
                key={lvl}
                onClick={() => setFilterLevel(lvl)}
                className="px-4 py-2 rounded-xl text-xs font-black transition-all cursor-pointer"
                style={isActive
                  ? { background: style.color, color: 'white', boxShadow: `0 3px 0 ${style.shadow}` }
                  : { background: 'white', color: '#9E9E9E', border: '2px solid #F0F0F0' }
                }
              >
                {lvl === 'all' ? 'All Levels' : `${style.emoji} ${lvl}`}
              </button>
            );
          })}
        </div>

        {/* Loading */}
        {loading && (
          <div className="flex flex-col items-center py-16 gap-3">
            <Loader className="animate-spin text-[#20BF6B]" size={28} />
            <p className="text-sm font-bold text-[#9E9E9E]">Loading test papers...</p>
          </div>
        )}

        {/* Empty state */}
        {!loading && filtered.length === 0 && (
          <div className="bg-white rounded-3xl p-12 text-center shadow-[0_2px_12px_rgba(0,0,0,0.06)]">
            <p className="text-4xl mb-3">📭</p>
            <p className="text-sm font-bold text-[#757575] mb-2">No test papers found.</p>
            <p className="text-xs text-[#BDBDBD] mb-4">Click "Load Sample Papers" above to seed A1, A2, and B1 Goethe-style papers.</p>
          </div>
        )}

        {/* Paper cards */}
        <div className="flex flex-col gap-4">
          {filtered.map((paper, i) => {
            const lvl = LEVEL_COLORS[paper.level] ?? LEVEL_COLORS.A1;
            return (
              <motion.div
                key={paper._id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.06 }}
                className="bg-white rounded-2xl p-5 border border-[#F0F0F0] shadow-[0_2px_12px_rgba(0,0,0,0.05)] hover:shadow-[0_6px_20px_rgba(0,0,0,0.09)] transition-all"
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-2xl flex items-center justify-center text-2xl"
                      style={{ background: lvl.bg }}>
                      {lvl.emoji}
                    </div>
                    <div>
                      <h3 className="text-[14px] font-black text-[#1A1A2E] leading-tight">{paper.title}</h3>
                      <div className="flex items-center gap-2 mt-0.5">
                        <span className="text-[10px] font-black px-2 py-0.5 rounded-full"
                          style={{ background: lvl.bg, color: lvl.color }}>
                          {paper.level}
                        </span>
                        <span className="text-[10px] font-bold text-[#BDBDBD] capitalize">{paper.source}</span>
                        {paper.year && <span className="text-[10px] font-bold text-[#BDBDBD]">{paper.year}</span>}
                      </div>
                    </div>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <div className="flex items-center gap-1 text-[11px] font-bold text-[#757575]">
                      <Clock size={11} />
                      {paper.totalTime} min
                    </div>
                    <p className="text-[10px] text-[#BDBDBD] font-bold mt-0.5">{paper.totalMarks} marks</p>
                  </div>
                </div>

                {/* Stats row */}
                <div className="flex items-center gap-3 mb-4">
                  <span className="text-[11px] font-bold text-[#9E9E9E]">
                    {paper.sectionCount} sections · {paper.questionCount} questions
                  </span>
                  <span className="text-[11px] font-bold text-[#9E9E9E]">
                    Pass: {paper.passingMarks}/{paper.totalMarks}
                  </span>
                </div>

                {/* Tags */}
                {paper.tags.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 mb-4">
                    {paper.tags.slice(0, 4).map((tag) => (
                      <span key={tag} className="text-[10px] font-bold px-2 py-0.5 rounded-lg bg-[#F5F6FA] text-[#9E9E9E]">
                        #{tag}
                      </span>
                    ))}
                  </div>
                )}

                <button
                  onClick={() => router.push(`/practice/test-series/${paper._id}`)}
                  className="w-full py-3 rounded-2xl font-black text-sm text-white transition-all"
                  style={{
                    background: lvl.color,
                    boxShadow: `0 3px 0 ${lvl.shadow}`,
                  }}
                >
                  Start Test →
                </button>
              </motion.div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

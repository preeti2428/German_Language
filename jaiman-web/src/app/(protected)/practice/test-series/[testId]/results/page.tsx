'use client';

import { motion } from 'framer-motion';
import { useRouter, useSearchParams } from 'next/navigation';
import { Check, X, RotateCcw, Home, Trophy, ChevronDown, ChevronUp } from 'lucide-react';
import { use, Suspense, useEffect, useState } from 'react';
import api from '@/lib/api';

interface QuestionResult {
  questionNumber: number;
  userAnswer: string;
  correctAnswer: string;
  isCorrect: boolean;
  pointsEarned: number;
  maxPoints: number;
  explanation?: string;
}

interface SectionResult {
  sectionType: string;
  score: number;
  maxScore: number;
  questionResults: QuestionResult[];
}

interface TestResultData {
  _id: string;
  score: number;
  maxScore: number;
  percentage: number;
  passed: boolean;
  sectionResults: SectionResult[];
}

function ResultsContent({ testId }: { testId: string }) {
  const router = useRouter();
  const params = useSearchParams();
  const score = Number(params.get('score') ?? 0);
  const max = Number(params.get('max') ?? 100);
  const passed = params.get('passed') === 'true';
  const pct = Number(params.get('pct') ?? 0);
  const resultId = params.get('resultId');

  const [detailedResult, setDetailedResult] = useState<TestResultData | null>(null);
  const [expandedSection, setExpandedSection] = useState<number | null>(0);

  useEffect(() => {
    if (resultId) {
      api.get(`/tests/result/${resultId}`)
        .then(res => setDetailedResult(res.data))
        .catch(err => console.error(err));
    }
  }, [resultId]);

  const passColor = passed ? '#20BF6B' : '#FF4757';
  const passShadow = passed ? '#178B4E' : '#CC3946';
  const passEmoji = passed ? '🏆' : '📚';
  const passLabel = passed ? 'Passed!' : 'Keep Practicing';

  return (
    <div className="min-h-screen bg-[#F5F6FA] flex flex-col items-center py-12 px-4 relative">
      {/* Floating Top Left Back Button */}
      <button
        onClick={() => router.push('/practice/test-series')}
        className="absolute top-6 left-6 flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-white border-2 border-[#EAEAEA] text-[#1A1A2E] text-xs font-black shadow-sm hover:border-[#1A1A2E] hover:scale-105 transition-all cursor-pointer"
      >
        <span>← Back to Test Series</span>
      </button>

      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="bg-white rounded-3xl p-6 md:p-8 max-w-2xl w-full shadow-[0_8px_40px_rgba(0,0,0,0.10)] border-2 border-[#EAEAEA] mb-8 text-center"
      >
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ delay: 0.2, type: 'spring' }}
          className="w-24 h-24 mx-auto mb-5 rounded-3xl flex items-center justify-center text-5xl shadow-[0_4px_0_rgba(0,0,0,0.1)]"
          style={{ background: passColor + '22' }}
        >
          {passEmoji}
        </motion.div>

        <p className="text-[11px] font-black uppercase tracking-widest text-[#BDBDBD] mb-1">Test Result</p>
        <h2 className="text-3xl font-black mb-1" style={{ color: passColor }}>{passLabel}</h2>
        <p className="text-sm font-bold text-[#757575] mb-5">
          Score: {Number.isNaN(score) ? '?' : score} / {Number.isNaN(max) ? '?' : max} ({Number.isNaN(pct) ? '0' : pct}%)
        </p>

        {/* Score bar */}
        <div className="h-4 bg-[#F0F0F0] rounded-full overflow-hidden mb-2">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${Number.isNaN(pct) ? 0 : pct}%` }}
            transition={{ duration: 1.2, delay: 0.3 }}
            className="h-full rounded-full"
            style={{ background: passColor }}
          />
        </div>
        <p className="text-[10px] font-bold text-[#BDBDBD] mb-6">{Number.isNaN(pct) ? '0' : pct}% of marks</p>

        {/* Pass/Fail badge */}
        <div
          className="flex items-center justify-center gap-2 py-3 rounded-2xl mb-6 mx-auto max-w-md"
          style={{ background: passColor + '18' }}
        >
          {passed
            ? <Check size={18} style={{ color: passColor }} />
            : <X size={18} style={{ color: passColor }} />
          }
          <span className="text-[13px] font-black" style={{ color: passColor }}>
            {passed
              ? 'Congratulations! You passed this test.'
              : 'Not passed this time. Review and try again.'
            }
          </span>
        </div>

        {/* CTA buttons */}
        <div className="flex flex-col sm:flex-row gap-3 max-w-md mx-auto">
          <button
            onClick={() => router.push(`/practice/test-series/${testId}`)}
            className="flex-1 py-3.5 rounded-2xl font-black text-sm text-white transition-all flex items-center justify-center gap-2 hover:translate-y-[1px]"
            style={{ background: passColor, boxShadow: `0 3px 0 ${passShadow}` }}
          >
            <RotateCcw size={14} /> {passed ? 'Try Another Test' : 'Retry Test'}
          </button>
          <button
            onClick={() => router.push('/practice')}
            className="flex-1 py-3.5 rounded-2xl font-black text-sm bg-[#F5F6FA] text-[#757575] border-2 border-[#EAEAEA] hover:bg-[#EBEBEB] transition-all flex items-center justify-center gap-2"
          >
            <Home size={14} /> Practice Hub
          </button>
        </div>
      </motion.div>

      {/* Detailed Answers Section */}
      {detailedResult && detailedResult.sectionResults?.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="w-full max-w-2xl flex flex-col gap-4"
        >
          <h3 className="text-xl font-black text-[#1A1A2E] mb-2 px-2">Detailed Answers</h3>
          
          {detailedResult.sectionResults.map((sec, i) => (
            <div key={i} className="bg-white rounded-2xl border-2 border-[#EAEAEA] shadow-sm overflow-hidden">
              <button
                onClick={() => setExpandedSection(expandedSection === i ? null : i)}
                className="w-full px-5 py-4 flex items-center justify-between bg-[#F8F9FA] hover:bg-[#F0F2F5] transition-colors"
              >
                <div className="flex flex-col items-start">
                  <span className="text-sm font-black text-[#1A1A2E] uppercase tracking-wide">{sec.sectionType} Section</span>
                  <span className="text-xs font-bold text-[#757575] mt-0.5">Score: {sec.score} / {sec.maxScore}</span>
                </div>
                {expandedSection === i ? <ChevronUp size={20} className="text-[#9E9E9E]" /> : <ChevronDown size={20} className="text-[#9E9E9E]" />}
              </button>

              {expandedSection === i && (
                <div className="p-5 border-t-2 border-[#EAEAEA] flex flex-col gap-4 bg-[#FAFAFA]">
                  {sec.questionResults.map((qr, j) => (
                    <div key={j} className="bg-white rounded-xl p-4 border border-[#F0F0F0] shadow-[0_2px_8px_rgba(0,0,0,0.03)]">
                      <div className="flex items-start justify-between gap-4 mb-3">
                        <span className="text-[11px] font-black text-[#BDBDBD] whitespace-nowrap">Question {qr.questionNumber}</span>
                        <div className={`px-2 py-0.5 rounded-lg text-[10px] font-bold ${qr.isCorrect ? 'bg-[#E8FBF0] text-[#20BF6B]' : 'bg-[#FFF5F5] text-[#FF4757]'}`}>
                          {qr.pointsEarned} / {qr.maxPoints} pts
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-3">
                        <div className="p-3 rounded-xl bg-[#F8F9FA] border border-[#EAEAEA]">
                          <span className="block text-[10px] font-black uppercase text-[#9E9E9E] mb-1">Your Answer</span>
                          <span className={`text-sm font-semibold ${qr.isCorrect ? 'text-[#20BF6B]' : 'text-[#FF4757]'}`}>
                            {qr.userAnswer || <span className="italic text-[#BDBDBD]">No answer</span>}
                          </span>
                        </div>
                        <div className="p-3 rounded-xl bg-[#E8FBF0] border border-[#A5D6A7]">
                          <span className="block text-[10px] font-black uppercase text-[#2E7D32] mb-1">Correct Answer</span>
                          <span className="text-sm font-semibold text-[#1B5E20]">{qr.correctAnswer}</span>
                        </div>
                      </div>

                      {qr.explanation && (
                        <div className="mt-3 text-xs font-medium text-[#757575] bg-[#FFF9E6] p-3 rounded-xl border border-[#FFE082]">
                          <span className="font-bold text-[#F57F17]">💡 Explanation: </span>
                          {qr.explanation}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}
        </motion.div>
      )}
    </div>
  );
}

export default function ResultsPage({ params }: { params: Promise<{ testId: string }> }) {
  const { testId } = use(params);
  return (
    <Suspense fallback={<div className="min-h-screen bg-[#F5F6FA] flex items-center justify-center"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#4361EE]" /></div>}>
      <ResultsContent testId={testId} />
    </Suspense>
  );
}

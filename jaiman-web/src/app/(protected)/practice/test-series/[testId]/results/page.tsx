'use client';

import { motion } from 'framer-motion';
import { useRouter, useSearchParams } from 'next/navigation';
import { Check, X, RotateCcw, Home, Trophy } from 'lucide-react';
import { use, Suspense } from 'react';

function ResultsContent({ testId }: { testId: string }) {
  const router = useRouter();
  const params = useSearchParams();
  const score = Number(params.get('score') ?? 0);
  const max = Number(params.get('max') ?? 100);
  const passed = params.get('passed') === 'true';
  const pct = Number(params.get('pct') ?? 0);

  const passColor = passed ? '#20BF6B' : '#FF4757';
  const passShadow = passed ? '#178B4E' : '#CC3946';
  const passEmoji = passed ? '🏆' : '📚';
  const passLabel = passed ? 'Passed!' : 'Keep Practicing';

  return (
    <div className="min-h-screen bg-[#F5F6FA] flex items-center justify-center p-6 relative">
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
        className="bg-white rounded-3xl p-8 max-w-md w-full shadow-[0_8px_40px_rgba(0,0,0,0.10)] text-center border-2 border-[#EAEAEA]"
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
          Score: {score} / {max} ({pct}%)
        </p>

        {/* Score bar */}
        <div className="h-4 bg-[#F0F0F0] rounded-full overflow-hidden mb-2">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${pct}%` }}
            transition={{ duration: 1.2, delay: 0.3 }}
            className="h-full rounded-full"
            style={{ background: passColor }}
          />
        </div>
        <p className="text-[10px] font-bold text-[#BDBDBD] mb-6">{pct}% of marks</p>

        {/* Pass/Fail badge */}
        <div
          className="flex items-center justify-center gap-2 py-3 rounded-2xl mb-6"
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
        <div className="flex flex-col gap-2">
          <button
            onClick={() => router.push(`/practice/test-series/${testId}`)}
            className="w-full py-3 rounded-2xl font-black text-sm text-white transition-all flex items-center justify-center gap-2"
            style={{ background: passColor, boxShadow: `0 3px 0 ${passShadow}` }}
          >
            <RotateCcw size={14} /> {passed ? 'Try Another Test' : 'Retry Test'}
          </button>
          <button
            onClick={() => router.push('/practice/writing')}
            className="w-full py-3 rounded-2xl font-black text-sm bg-[#F8F9FF] text-[#4361EE] hover:bg-[#EEF2FF] transition-all"
          >
            ✍️ Practice Writing Section
          </button>
          <button
            onClick={() => router.push('/practice')}
            className="w-full py-3 rounded-2xl font-black text-sm bg-[#F5F6FA] text-[#757575] hover:bg-[#EBEBEB] transition-all flex items-center justify-center gap-2"
          >
            <Home size={14} /> Practice Hub
          </button>
        </div>
      </motion.div>
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

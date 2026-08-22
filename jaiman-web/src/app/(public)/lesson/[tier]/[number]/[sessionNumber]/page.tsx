'use client';

import { useCallback, useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import api from '@/lib/api';
import LessonRunner, { type LessonSummary } from '@/components/lesson/LessonRunner';
import type { RawExercise } from '@/lib/lesson/normalize';
import { recordActivity } from '@/lib/streak';

interface SessionData {
  stageId: string;
  title: string;
  skillType?: string;
  sessionNumber?: number;
  exercises: RawExercise[];
}

export default function LessonPage() {
  const { tier, number, sessionNumber } = useParams<{
    tier: string;
    number: string;
    sessionNumber: string;
  }>();
  const router = useRouter();

  const [session, setSession] = useState<SessionData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await api.get(`/stages/${tier}/${number}/${sessionNumber}`);
        if (!cancelled) setSession(res.data);
      } catch {
        if (!cancelled) setError('We could not load this session. Check that the backend is running and seeded.');
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [tier, number, sessionNumber]);

  /**
   * Save on finish, not on exit. The old flow only wrote progress when the
   * learner clicked through the end screen, so closing the tab on the victory
   * screen threw the whole lesson away.
   */
  const handleFinish = useCallback(
    async (summary: LessonSummary) => {
      recordActivity(summary.xp);
      if (summary.failed || !session) return;
      try {
        const path =
          sessionNumber === 'boss'
            ? `/progress/stage/${session.stageId}/complete`
            : `/progress/stage/${session.stageId}/session/${sessionNumber}/complete`;
        await api.post(path, { xpEarned: summary.xp });
      } catch {
        // Not signed in, or offline. The local streak still counted; don't
        // interrupt the celebration with an error the learner can't act on.
      }
    },
    [session, sessionNumber]
  );

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#F7F9FC]">
        <div className="h-9 w-9 animate-spin rounded-full border-4 border-[#4361EE] border-t-transparent" />
      </div>
    );
  }

  if (error || !session) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-5 bg-[#F7F9FC] p-6 text-center">
        <p className="text-5xl">🧭</p>
        <h1 className="text-2xl font-black text-gray-900">Session not found</h1>
        <p className="max-w-sm font-bold text-gray-400">{error}</p>
        <button type="button" onClick={() => router.push('/learn')} className="duo-btn duo-btn-blue px-6 py-3 text-sm">
          Back to the map
        </button>
      </div>
    );
  }

  return (
    <LessonRunner
      exercises={session.exercises ?? []}
      title={session.title}
      onExit={() => router.push('/learn')}
      onFinish={handleFinish}
    />
  );
}

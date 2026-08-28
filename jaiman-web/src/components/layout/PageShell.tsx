'use client';

import { useEffect, useState } from 'react';
import { ChevronLeft, Flame, Zap } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { daysSinceActive, readStreak } from '@/lib/streak';

/**
 * The design canvas's page chrome: a sticky header with crumb, 900-weight
 * title, back button (optional), and the streak/XP stat chips, over a max-width content column.
 * Every standard page renders inside this so the app reads as one system.
 */
export default function PageShell({
  crumb,
  title,
  actions,
  children,
  wide = false,
  backHref,
  onBack,
}: {
  crumb: string;
  title: React.ReactNode;
  actions?: React.ReactNode;
  children: React.ReactNode;
  wide?: boolean;
  backHref?: string;
  onBack?: () => void;
}) {
  const router = useRouter();
  const { user } = useAuth();
  const [streak, setStreak] = useState(0);
  const [atRisk, setAtRisk] = useState(false);

  useEffect(() => {
    setStreak(readStreak().current);
    setAtRisk(daysSinceActive() === 1);
  }, []);

  const handleBack = () => {
    if (onBack) {
      onBack();
    } else if (backHref) {
      router.push(backHref);
    } else {
      router.back();
    }
  };

  return (
    <div className="min-h-full px-4 sm:px-6 pb-16 pt-4">
      <header className="sticky top-0 z-40 mx-auto flex max-w-[1360px] items-center justify-between gap-4 bg-gradient-to-b from-[#F5F6FA] via-[#F5F6FA]/95 to-transparent px-1 pb-5 pt-2">
        <div className="flex items-center gap-3">
          {(backHref || onBack) && (
            <button
              onClick={handleBack}
              className="flex items-center justify-center p-2.5 rounded-2xl bg-white border-2 border-[#EAEAEA] text-[#757575] hover:text-[#1A1A2E] hover:border-[#1A1A2E] hover:scale-105 shadow-sm transition-all cursor-pointer flex-shrink-0"
              title="Go Back"
            >
              <ChevronLeft size={20} className="stroke-[2.5]" />
            </button>
          )}
          <div>
            <p className="dj-crumb">{crumb}</p>
            <h1 className="dj-title">{title}</h1>
          </div>
        </div>
        <div className="flex items-center gap-3">
          {actions}
          <div
            className="dj-chip dj-chip-streak"
            title={atRisk ? 'Practise today to keep your streak' : `${streak}-day streak`}
          >
            <Flame size={19} className={streak > 0 ? 'fill-[#FF9F43] text-[#FF9F43]' : 'text-gray-300'} />
            <span>{streak}</span>
          </div>
          <div className="dj-chip dj-chip-xp" title="Total XP">
            <Zap size={18} className="fill-[#E53935] text-[#E53935]" />
            <span>{user?.xp ?? 0}</span>
          </div>
        </div>
      </header>
      <div className={`mx-auto ${wide ? 'max-w-none' : 'max-w-[1360px]'}`}>{children}</div>
    </div>
  );
}


'use client';

import { useEffect, useState } from 'react';
import { Flame, Zap } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { daysSinceActive, readStreak } from '@/lib/streak';

/**
 * The design canvas's page chrome: a sticky header with crumb, 900-weight
 * title, and the streak/XP stat chips, over a max-width content column.
 * Every standard page renders inside this so the app reads as one system.
 */
export default function PageShell({
  crumb,
  title,
  actions,
  children,
  wide = false,
}: {
  crumb: string;
  title: React.ReactNode;
  actions?: React.ReactNode;
  children: React.ReactNode;
  wide?: boolean;
}) {
  const { user } = useAuth();
  const [streak, setStreak] = useState(0);
  const [atRisk, setAtRisk] = useState(false);

  useEffect(() => {
    setStreak(readStreak().current);
    setAtRisk(daysSinceActive() === 1);
  }, []);

  return (
    <div className="min-h-full px-4 sm:px-6 pb-16 pt-4">
      <header className="sticky top-0 z-40 mx-auto flex max-w-[1360px] items-center justify-between gap-4 bg-gradient-to-b from-[#E8ECEF] via-[#E8ECEF]/95 to-transparent px-1 pb-5 pt-2">
        <div>
          <p className="dj-crumb">{crumb}</p>
          <h1 className="dj-title">{title}</h1>
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
            <Zap size={18} className="fill-[#4361EE] text-[#4361EE]" />
            <span>{user?.xp ?? 0}</span>
          </div>
        </div>
      </header>
      <div className={`mx-auto ${wide ? 'max-w-none' : 'max-w-[1360px]'}`}>{children}</div>
    </div>
  );
}

/**
 * Standardized Level & Gamification System for Jaiman German.
 *
 * Provides realistic, smooth progression:
 * - Level 1: 0 - 100 XP
 * - Level 2: 100 - 300 XP (+200)
 * - Level 3: 300 - 600 XP (+300)
 * - Level 4: 600 - 1000 XP (+400)
 * - Level 5: 1000 - 1500 XP (+500)
 * ...
 */

export interface LevelInfo {
  level: number;
  xpInCurrentLevel: number;
  xpNeededForLevel: number;
  toNext: number;
  progressPercent: number;
  tierLabel: string;
}

export function getTierFromLevel(level: number, userTier?: string): string {
  if (userTier && ['A1', 'A2', 'B1', 'B2', 'C1', 'C2'].includes(userTier)) {
    const tierMap: Record<string, string> = {
      A1: 'A1 Beginner',
      A2: 'A2 Elementary',
      B1: 'B1 Intermediate',
      B2: 'B2 Upper Intermediate',
      C1: 'C1 Advanced',
      C2: 'C2 Master',
    };
    return tierMap[userTier] || `${userTier} Learner`;
  }

  if (level <= 5) return 'A1 Beginner';
  if (level <= 10) return 'A2 Elementary';
  if (level <= 18) return 'B1 Intermediate';
  if (level <= 25) return 'B2 Upper Intermediate';
  if (level <= 35) return 'C1 Advanced';
  return 'C2 Master';
}

export function calculateLevelInfo(totalXp = 0, userTier?: string): LevelInfo {
  const safeXp = Math.max(0, Number(totalXp) || 0);

  let level = 1;
  let currentLevelBaseXp = 0;
  let nextLevelXp = 100;

  // Progressive curve where level N requires N * 100 XP to pass
  while (safeXp >= nextLevelXp) {
    level++;
    currentLevelBaseXp = nextLevelXp;
    nextLevelXp = currentLevelBaseXp + level * 100;
  }

  const xpInCurrentLevel = safeXp - currentLevelBaseXp;
  const xpNeededForLevel = nextLevelXp - currentLevelBaseXp;
  const toNext = Math.max(0, nextLevelXp - safeXp);
  const progressPercent = Math.min(100, Math.max(0, Math.round((xpInCurrentLevel / xpNeededForLevel) * 100)));
  const tierLabel = getTierFromLevel(level, userTier);

  return {
    level,
    xpInCurrentLevel,
    xpNeededForLevel,
    toNext,
    progressPercent,
    tierLabel,
  };
}

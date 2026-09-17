import { DayEntry, HeatMapModel, HeatMapStats } from '../types/heatmap';
import { formatDateKey, parseDateKey } from './dateUtils';

// Helper to get streak level based on streak length (1 to 4)
export function getStreakIntensityLevel(streakLength: number): 0 | 1 | 2 | 3 | 4 {
  if (streakLength <= 0) return 0;
  if (streakLength <= 2) return 1;
  if (streakLength <= 6) return 2;
  if (streakLength <= 14) return 3;
  return 4;
}

export function calculateStats(map: HeatMapModel): { stats: HeatMapStats; streakMap: Record<string, number> } {
  const entries = map.entries || {};
  const activeDates = Object.keys(entries)
    .filter((k) => entries[k] && entries[k].completed)
    .sort();

  const streakMap: Record<string, number> = {};

  if (activeDates.length === 0) {
    return {
      stats: { currentStreak: 0, longestStreak: 0, totalActiveDays: 0, completionRate: 0 },
      streakMap,
    };
  }

  const activeDateSet = new Set(activeDates);
  const totalActiveDays = activeDates.length;

  let longestStreak = 0;
  let runningStreak = 0;
  let prevDate: Date | null = null;

  for (const dateKey of activeDates) {
    const curDate = parseDateKey(dateKey);
    if (!prevDate) {
      runningStreak = 1;
    } else {
      const diffTime = curDate.getTime() - prevDate.getTime();
      const diffDays = Math.round(diffTime / (1000 * 3600 * 24));
      if (diffDays === 1) {
        runningStreak++;
      } else if (diffDays > 1) {
        runningStreak = 1;
      }
    }
    prevDate = curDate;
    streakMap[dateKey] = runningStreak;
    if (runningStreak > longestStreak) {
      longestStreak = runningStreak;
    }
  }

  // Calculate current streak from today or yesterday
  let currentStreak = 0;
  const today = new Date();
  const todayKey = formatDateKey(today);

  const yesterday = new Date(today);
  yesterday.setDate(today.getDate() - 1);
  const yesterdayKey = formatDateKey(yesterday);

  let checkDate = new Date(today);
  if (!activeDateSet.has(todayKey)) {
    if (activeDateSet.has(yesterdayKey)) {
      checkDate = yesterday;
    } else {
      checkDate = today; 
    }
  }

  if (activeDateSet.has(formatDateKey(checkDate))) {
    while (activeDateSet.has(formatDateKey(checkDate))) {
      currentStreak++;
      checkDate.setDate(checkDate.getDate() - 1);
    }
  }

  // 90d completion rate
  const windowDays = 90;
  let activeInWindow = 0;
  const cursor = new Date(today);

  for (let i = 0; i < windowDays; i++) {
    if (activeDateSet.has(formatDateKey(cursor))) {
      activeInWindow++;
    }
    cursor.setDate(cursor.getDate() - 1);
  }

  const completionRate = Math.round((activeInWindow / windowDays) * 100);

  return {
    stats: {
      currentStreak,
      longestStreak: Math.max(longestStreak, currentStreak),
      totalActiveDays,
      completionRate,
    },
    streakMap,
  };
}

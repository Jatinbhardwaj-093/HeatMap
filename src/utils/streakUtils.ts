import { DayEntry, HeatMapModel, HeatMapStats } from '../types/heatmap';
import { formatDateKey, parseDateKey } from './dateUtils';

export function calculateStats(map: HeatMapModel): HeatMapStats {
  const entries = map.entries || {};
  const activeDates = Object.keys(entries)
    .filter((k) => entries[k] && entries[k].value > 0)
    .sort();

  if (activeDates.length === 0) {
    return {
      currentStreak: 0,
      longestStreak: 0,
      totalActiveDays: 0,
      completionRate: 0,
      totalValue: 0,
    };
  }

  const activeDateSet = new Set(activeDates);
  const totalActiveDays = activeDates.length;
  let totalValue = 0;
  for (const dateKey of activeDates) {
    totalValue += entries[dateKey].value || 0;
  }

  // Calculate current streak
  let currentStreak = 0;
  const today = new Date();
  const todayKey = formatDateKey(today);

  const yesterday = new Date(today);
  yesterday.setDate(today.getDate() - 1);
  const yesterdayKey = formatDateKey(yesterday);

  let checkDate = new Date(today);
  if (!activeDateSet.has(todayKey)) {
    // If today is not logged yet, check from yesterday
    if (activeDateSet.has(yesterdayKey)) {
      checkDate = yesterday;
    } else {
      checkDate = today; // streak broken or 0
    }
  }

  if (activeDateSet.has(formatDateKey(checkDate))) {
    while (activeDateSet.has(formatDateKey(checkDate))) {
      currentStreak++;
      checkDate.setDate(checkDate.getDate() - 1);
    }
  }

  // Calculate longest streak
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
    if (runningStreak > longestStreak) {
      longestStreak = runningStreak;
    }
  }

  // Completion rate over the last 90 days or since creation
  const windowDays = 90;
  let daysInWindow = 0;
  let activeInWindow = 0;
  const cursor = new Date(today);

  for (let i = 0; i < windowDays; i++) {
    daysInWindow++;
    if (activeDateSet.has(formatDateKey(cursor))) {
      activeInWindow++;
    }
    cursor.setDate(cursor.getDate() - 1);
  }

  const completionRate = Math.round((activeInWindow / daysInWindow) * 100);

  return {
    currentStreak,
    longestStreak: Math.max(longestStreak, currentStreak),
    totalActiveDays,
    completionRate,
    totalValue,
  };
}

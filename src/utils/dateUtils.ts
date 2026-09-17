export function formatDateKey(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function parseDateKey(key: string): Date {
  const [year, month, day] = key.split('-').map(Number);
  return new Date(year, month - 1, day);
}

export function getTodayKey(): string {
  return formatDateKey(new Date());
}

export function getMonthNames(): string[] {
  return ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
}

export function getDayNamesShort(): string[] {
  return ['M', 'T', 'W', 'T', 'F', 'S', 'S'];
}

export function getIntensityLevel(value: number, target: number = 1): 0 | 1 | 2 | 3 | 4 {
  if (!value || value <= 0) return 0;
  if (target <= 1) {
    return value >= 1 ? 4 : 0;
  }
  const ratio = value / target;
  if (ratio <= 0.25) return 1;
  if (ratio <= 0.6) return 2;
  if (ratio < 1.0) return 3;
  return 4;
}

// Generate the 52-week matrix for Yearly view
// Columns = weeks (approx 52), Rows = 7 days (Mon=0 through Sun=6)
export interface YearGridData {
  weeks: Array<Array<{ dateKey: string; inYear: boolean }>>;
  monthHeaders: Array<{ name: string; weekIndex: number }>;
}

export function getYearlyGrid(year: number): YearGridData {
  const startDate = new Date(year, 0, 1);
  const endDate = new Date(year, 11, 31);

  // Align start to Monday (0=Sunday in JS, so convert to Mon=0...Sun=6)
  const startDayOfWeek = (startDate.getDay() + 6) % 7;
  const current = new Date(startDate);
  current.setDate(current.getDate() - startDayOfWeek);

  const weeks: Array<Array<{ dateKey: string; inYear: boolean }>> = [];
  const monthHeaders: Array<{ name: string; weekIndex: number }> = [];
  const monthNames = getMonthNames();
  let lastSeenMonth = -1;

  let currentWeek: Array<{ dateKey: string; inYear: boolean }> = [];

  while (current <= endDate || currentWeek.length > 0) {
    const key = formatDateKey(current);
    const inYear = current.getFullYear() === year;

    if (inYear && current.getDate() <= 7 && current.getMonth() !== lastSeenMonth) {
      lastSeenMonth = current.getMonth();
      monthHeaders.push({
        name: monthNames[lastSeenMonth],
        weekIndex: weeks.length,
      });
    }

    currentWeek.push({ dateKey: key, inYear });

    if (currentWeek.length === 7) {
      weeks.push(currentWeek);
      currentWeek = [];
      if (current > endDate) break;
    }

    current.setDate(current.getDate() + 1);
  }

  return { weeks, monthHeaders };
}

// Generate monthly calendar grid (6 rows of 7 days, Monday to Sunday)
export interface MonthGridData {
  year: number;
  month: number; // 0-indexed
  days: Array<{
    dateKey: string;
    dayNumber: number;
    isCurrentMonth: boolean;
    isToday: boolean;
  }>;
}

export function getMonthlyGrid(year: number, month: number): MonthGridData {
  const firstDay = new Date(year, month, 1);
  const lastDay = new Date(year, month + 1, 0);

  const startDayOfWeek = (firstDay.getDay() + 6) % 7; // Mon = 0
  const days: MonthGridData['days'] = [];

  // Previous month padding
  const prevMonthLastDay = new Date(year, month, 0).getDate();
  for (let i = startDayOfWeek - 1; i >= 0; i--) {
    const d = prevMonthLastDay - i;
    const date = new Date(year, month - 1, d);
    days.push({
      dateKey: formatDateKey(date),
      dayNumber: d,
      isCurrentMonth: false,
      isToday: formatDateKey(date) === getTodayKey(),
    });
  }

  // Current month days
  for (let d = 1; d <= lastDay.getDate(); d++) {
    const date = new Date(year, month, d);
    days.push({
      dateKey: formatDateKey(date),
      dayNumber: d,
      isCurrentMonth: true,
      isToday: formatDateKey(date) === getTodayKey(),
    });
  }

  // Next month padding to complete row/grid
  const remaining = (7 - (days.length % 7)) % 7;
  for (let d = 1; d <= remaining; d++) {
    const date = new Date(year, month + 1, d);
    days.push({
      dateKey: formatDateKey(date),
      dayNumber: d,
      isCurrentMonth: false,
      isToday: formatDateKey(date) === getTodayKey(),
    });
  }

  return { year, month, days };
}

// Generate past N weeks for Weekly view (default 12 weeks)
export interface WeeklyGridData {
  weeks: Array<{
    weekLabel: string;
    days: Array<{
      dateKey: string;
      dayName: string;
      dayNumber: number;
      isToday: boolean;
    }>;
  }>;
}

export function getWeeklyGrid(numWeeks: number = 10): WeeklyGridData {
  const today = new Date();
  const todayKey = getTodayKey();
  const currentDayOfWeek = (today.getDay() + 6) % 7; // Mon = 0

  // End of current week (Sunday)
  const currentWeekEnd = new Date(today);
  currentWeekEnd.setDate(today.getDate() + (6 - currentDayOfWeek));

  const weeks: WeeklyGridData['weeks'] = [];
  const dayNames = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

  for (let w = numWeeks - 1; w >= 0; w--) {
    const weekStart = new Date(currentWeekEnd);
    weekStart.setDate(currentWeekEnd.getDate() - (w * 7 + 6));

    const days: WeeklyGridData['weeks'][0]['days'] = [];
    for (let d = 0; d < 7; d++) {
      const dayDate = new Date(weekStart);
      dayDate.setDate(weekStart.getDate() + d);
      const dateKey = formatDateKey(dayDate);
      days.push({
        dateKey,
        dayName: dayNames[d],
        dayNumber: dayDate.getDate(),
        isToday: dateKey === todayKey,
      });
    }

    const startMonth = getMonthNames()[days[0].dayNumber ? parseDateKey(days[0].dateKey).getMonth() : 0];
    const endMonth = getMonthNames()[days[6].dayNumber ? parseDateKey(days[6].dateKey).getMonth() : 0];
    const weekLabel =
      startMonth === endMonth
        ? `${startMonth} ${days[0].dayNumber}-${days[6].dayNumber}`
        : `${startMonth} ${days[0].dayNumber} - ${endMonth} ${days[6].dayNumber}`;

    weeks.push({ weekLabel, days });
  }

  return { weeks };
}

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

// Generate the 52-week matrix for Yearly view
export interface YearGridData {
  weeks: Array<Array<{ dateKey: string; inYear: boolean }>>;
  monthHeaders: Array<{ name: string; weekIndex: number }>;
}

export function getYearlyGrid(year: number): YearGridData {
  const startDate = new Date(year, 0, 1);
  const endDate = new Date(year, 11, 31);

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

// Generate monthly calendar grid
export interface MonthGridData {
  year: number;
  month: number;
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

  const startDayOfWeek = (firstDay.getDay() + 6) % 7; 
  const days: MonthGridData['days'] = [];

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

  for (let d = 1; d <= lastDay.getDate(); d++) {
    const date = new Date(year, month, d);
    days.push({
      dateKey: formatDateKey(date),
      dayNumber: d,
      isCurrentMonth: true,
      isToday: formatDateKey(date) === getTodayKey(),
    });
  }

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

// Generate ONLY the current week (Mon-Sun)
export interface WeeklyGridData {
  weekLabel: string;
  days: Array<{
    dateKey: string;
    dayName: string;
    dayNumber: number;
    isToday: boolean;
  }>;
}

export function getCurrentWeeklyGrid(): WeeklyGridData {
  const today = new Date();
  const todayKey = getTodayKey();
  const currentDayOfWeek = (today.getDay() + 6) % 7;

  const currentWeekEnd = new Date(today);
  currentWeekEnd.setDate(today.getDate() + (6 - currentDayOfWeek));

  const weekStart = new Date(currentWeekEnd);
  weekStart.setDate(currentWeekEnd.getDate() - 6);

  const days: WeeklyGridData['days'] = [];
  const dayNames = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

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

  const startMonth = getMonthNames()[parseDateKey(days[0].dateKey).getMonth()];
  const endMonth = getMonthNames()[parseDateKey(days[6].dateKey).getMonth()];
  const weekLabel =
    startMonth === endMonth
      ? `${startMonth} ${days[0].dayNumber}-${days[6].dayNumber}`
      : `${startMonth} ${days[0].dayNumber} - ${endMonth} ${days[6].dayNumber}`;

  return { weekLabel, days };
}

export type ViewMode = 'monthly' | 'yearly';
export type ThemeMode = 'light' | 'dark' | 'system';
export type PaletteId = 'emerald' | 'amber' | 'obsidian' | 'cyan' | 'crimson';

export interface ColorTheme {
  background: string;
  surface: string;
  surfaceHighlight: string;
  border: string;
  borderSubtle: string;
  text: string;
  textSecondary: string;
  textMuted: string;
  success: string;
  error: string;
  isDark: boolean;
}

export interface ColorPalette {
  id: PaletteId;
  name: string;
  levels: [string, string, string, string, string]; // 0 (empty), 1-4 based on streak (dark mode)
  lightLevels?: [string, string, string, string, string]; // light mode levels
  accent: string;
}

export interface DayEntry {
  date: string; // YYYY-MM-DD
  completed: boolean;
  notes?: string;
}

export interface HeatMapModel {
  id: string;
  title: string;
  description?: string;
  category: string;
  paletteId: PaletteId;
  createdAt: string;
  defaultView?: ViewMode;
  entries: Record<string, DayEntry>; // key: YYYY-MM-DD
}

export interface HeatMapStats {
  currentStreak: number;
  longestStreak: number;
  totalActiveDays: number;
  completionRate: number; // 0 to 100 percentage
}

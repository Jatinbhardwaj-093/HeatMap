export type ViewMode = 'weekly' | 'monthly' | 'yearly';
export type ThemeMode = 'light' | 'dark' | 'system';
export type PaletteId = 'emerald' | 'amber' | 'obsidian' | 'cyan' | 'crimson';

export interface ColorPalette {
  id: PaletteId;
  name: string;
  levels: [string, string, string, string, string]; // 0 (empty), 1-4 based on streak
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
  entries: Record<string, DayEntry>; // key: YYYY-MM-DD
}

export interface HeatMapStats {
  currentStreak: number;
  longestStreak: number;
  totalActiveDays: number;
  completionRate: number; // 0 to 100 percentage
}

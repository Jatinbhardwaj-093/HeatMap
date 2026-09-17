export type ViewMode = 'weekly' | 'monthly' | 'yearly';

export type UnitType = 'boolean' | 'count' | 'duration';

export type PaletteId = 'emerald' | 'amber' | 'obsidian' | 'cyan' | 'crimson';

export interface ColorPalette {
  id: PaletteId;
  name: string;
  levels: [string, string, string, string, string]; // 0 (empty), 1 (low), 2 (medium), 3 (high), 4 (max)
  accent: string;
}

export interface DayEntry {
  date: string; // YYYY-MM-DD
  value: number; // 0 for empty, > 0 for completed/amount
  target?: number;
  notes?: string;
}

export interface HeatMapModel {
  id: string;
  title: string;
  description?: string;
  category: string;
  unitType: UnitType;
  unitLabel?: string; // e.g., "reps", "mins", "glasses"
  targetValue: number; // default daily goal, e.g. 1
  paletteId: PaletteId;
  createdAt: string;
  entries: Record<string, DayEntry>; // key: YYYY-MM-DD
}

export interface HeatMapStats {
  currentStreak: number;
  longestStreak: number;
  totalActiveDays: number;
  completionRate: number; // 0 to 100 percentage
  totalValue: number;
}

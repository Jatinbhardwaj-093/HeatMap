import AsyncStorage from '@react-native-async-storage/async-storage';
import { HeatMapModel, PaletteId } from '../types/heatmap';
import { syncHabitsToCloud } from '../utils/storage';

export interface WidgetConfig {
  habitId: string;
  customName?: string;
  theme?: 'system' | 'dark' | 'light';
  paletteId?: PaletteId;
}

export interface ResolvedWidgetData {
  habit?: HeatMapModel;
  config?: WidgetConfig;
}

export async function getWidgetHabits(): Promise<HeatMapModel[]> {
  try {
    const allKeys = await AsyncStorage.getAllKeys();

    // Check active user habits first
    const userKey = allKeys.find((k) => k.startsWith('@trackheat_maps_') && k !== '@trackheat_maps_guest');
    if (userKey) {
      const data = await AsyncStorage.getItem(userKey);
      if (data) {
        const parsed = JSON.parse(data);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    }

    // Check guest habits
    const guestData = await AsyncStorage.getItem('@trackheat_maps_guest');
    if (guestData) {
      const parsed = JSON.parse(guestData);
      if (Array.isArray(parsed) && parsed.length > 0) return parsed;
    }

    // Check legacy user habits
    const legacyUserKey = allKeys.find((k) => k.startsWith('@habitheat_maps_') && k !== '@habitheat_maps_guest');
    if (legacyUserKey) {
      const data = await AsyncStorage.getItem(legacyUserKey);
      if (data) {
        const parsed = JSON.parse(data);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    }

    // Check legacy guest habits
    const legacyGuest = await AsyncStorage.getItem('@habitheat_maps_guest');
    if (legacyGuest) {
      const parsed = JSON.parse(legacyGuest);
      if (Array.isArray(parsed) && parsed.length > 0) return parsed;
    }
  } catch (err) {
    console.warn('Error reading habits for widget:', err);
  }
  return [];
}

export async function getWidgetConfig(widgetId?: number): Promise<WidgetConfig | undefined> {
  if (widgetId !== undefined) {
    try {
      const raw = await AsyncStorage.getItem(`@trackheat_widget_config_${widgetId}`);
      if (raw) {
        return JSON.parse(raw);
      }
      const legacyHabitId = await AsyncStorage.getItem(`@trackheat_widget_habit_${widgetId}`);
      if (legacyHabitId) {
        return { habitId: legacyHabitId };
      }
    } catch {
      // Ignore
    }
  }

  try {
    const rawActive = await AsyncStorage.getItem('@trackheat_active_widget_config');
    if (rawActive) {
      return JSON.parse(rawActive);
    }
    const activeHabitId = await AsyncStorage.getItem('@trackheat_active_widget_habit_id');
    if (activeHabitId) {
      return { habitId: activeHabitId };
    }
  } catch {
    // Ignore
  }

  return undefined;
}

export async function setWidgetConfig(widgetId: number, config: WidgetConfig): Promise<void> {
  await AsyncStorage.setItem(`@trackheat_widget_config_${widgetId}`, JSON.stringify(config));
  await AsyncStorage.setItem(`@trackheat_widget_habit_${widgetId}`, config.habitId);
}

export async function setActiveWidgetConfig(config: WidgetConfig): Promise<void> {
  await AsyncStorage.setItem('@trackheat_active_widget_config', JSON.stringify(config));
  await AsyncStorage.setItem('@trackheat_active_widget_habit_id', config.habitId);
}

export async function getResolvedWidgetData(widgetId?: number): Promise<ResolvedWidgetData> {
  const habits = await getWidgetHabits();
  if (habits.length === 0) return {};

  const config = await getWidgetConfig(widgetId);
  if (config) {
    const found = habits.find((h) => h.id === config.habitId);
    if (found) {
      return { habit: found, config };
    }
  }

  return { habit: habits[0], config: { habitId: habits[0].id } };
}

export async function getHabitForWidget(widgetId?: number): Promise<HeatMapModel | undefined> {
  const { habit } = await getResolvedWidgetData(widgetId);
  return habit;
}

export async function setHabitForWidget(widgetId: number, habitId: string): Promise<void> {
  await setWidgetConfig(widgetId, { habitId });
}

export async function setActiveWidgetHabit(habitId: string): Promise<void> {
  await setActiveWidgetConfig({ habitId });
}

export async function getActiveWidgetHabitId(): Promise<string | null> {
  return AsyncStorage.getItem('@trackheat_active_widget_habit_id');
}

export async function toggleHabitToday(habitId: string): Promise<HeatMapModel | undefined> {
  try {
    const allKeys = await AsyncStorage.getAllKeys();
    let targetKey = allKeys.find((k) => k.startsWith('@trackheat_maps_') && k !== '@trackheat_maps_guest');
    if (!targetKey) {
      targetKey = '@trackheat_maps_guest';
    }

    let habits: HeatMapModel[] = [];
    const raw = await AsyncStorage.getItem(targetKey);
    if (raw) {
      habits = JSON.parse(raw);
    } else {
      const legacyRaw = await AsyncStorage.getItem('@habitheat_maps_guest');
      if (legacyRaw) habits = JSON.parse(legacyRaw);
    }

    const today = new Date();
    const todayKey = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
    let updatedHabit: HeatMapModel | undefined;

    const updatedHabits = habits.map((h) => {
      if (h.id === habitId) {
        const currentlyDone = Boolean(h.entries?.[todayKey]?.completed);
        const entries = {
          ...h.entries,
          [todayKey]: {
            date: todayKey,
            completed: !currentlyDone,
            notes: h.entries?.[todayKey]?.notes,
          },
        };
        updatedHabit = { ...h, entries };
        return updatedHabit;
      }
      return h;
    });

    if (updatedHabit) {
      await AsyncStorage.setItem(targetKey, JSON.stringify(updatedHabits));
      syncHabitsToCloud(updatedHabits).catch(() => {});
    }

    return updatedHabit;
  } catch (err) {
    console.error('Error toggling habit today from widget:', err);
    return undefined;
  }
}

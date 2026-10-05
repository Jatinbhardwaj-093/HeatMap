import AsyncStorage from '@react-native-async-storage/async-storage';
import { HeatMapModel } from '../types/heatmap';

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

export async function getHabitForWidget(widgetId?: number): Promise<HeatMapModel | undefined> {
  const habits = await getWidgetHabits();
  if (habits.length === 0) return undefined;

  // 1. Check if this specific widget instance has an assigned habit
  if (widgetId !== undefined) {
    try {
      const specificHabitId = await AsyncStorage.getItem(`@trackheat_widget_habit_${widgetId}`);
      if (specificHabitId) {
        const found = habits.find((h) => h.id === specificHabitId);
        if (found) return found;
      }
    } catch {
      // Ignore reading error
    }
  }

  // 2. Check global active widget habit selection from Widget Studio
  try {
    const activeHabitId = await AsyncStorage.getItem('@trackheat_active_widget_habit_id');
    if (activeHabitId) {
      const found = habits.find((h) => h.id === activeHabitId);
      if (found) return found;
    }
  } catch {
    // Ignore reading error
  }

  // 3. Fallback to first habit
  return habits[0];
}

export async function setHabitForWidget(widgetId: number, habitId: string): Promise<void> {
  await AsyncStorage.setItem(`@trackheat_widget_habit_${widgetId}`, habitId);
}

export async function setActiveWidgetHabit(habitId: string): Promise<void> {
  await AsyncStorage.setItem('@trackheat_active_widget_habit_id', habitId);
}

export async function getActiveWidgetHabitId(): Promise<string | null> {
  return AsyncStorage.getItem('@trackheat_active_widget_habit_id');
}

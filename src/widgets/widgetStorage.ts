import AsyncStorage from '@react-native-async-storage/async-storage';
import { HeatMapModel } from '../types/heatmap';

export async function getWidgetHabits(): Promise<HeatMapModel[]> {
  try {
    const allKeys = await AsyncStorage.getAllKeys();

    // Check current active user habits first
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

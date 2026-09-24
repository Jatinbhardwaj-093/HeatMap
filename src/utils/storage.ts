import AsyncStorage from '@react-native-async-storage/async-storage';
import { HeatMapModel } from '../types/heatmap';

function getStorageKey(userId?: string): string {
  if (userId) {
    return `@habitheat_maps_${userId}`;
  }
  return '@habitheat_maps_guest';
}

export async function loadHeatMaps(userId?: string): Promise<HeatMapModel[]> {
  try {
    const key = getStorageKey(userId);
    const raw = await AsyncStorage.getItem(key);
    if (!raw) {
      return [];
    }
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed)) {
      return parsed;
    }
    return [];
  } catch (err) {
    console.warn('Storage read error:', err);
    return [];
  }
}

export async function saveHeatMaps(maps: HeatMapModel[], userId?: string): Promise<void> {
  try {
    const key = getStorageKey(userId);
    const payload = JSON.stringify(maps);
    await AsyncStorage.setItem(key, payload);
  } catch (err) {
    console.error('Storage write error:', err);
  }
}

export async function exportDataJSON(userId?: string): Promise<string> {
  const maps = await loadHeatMaps(userId);
  return JSON.stringify(maps, null, 2);
}

export async function importDataJSON(jsonStr: string, userId?: string): Promise<HeatMapModel[]> {
  const parsed = JSON.parse(jsonStr);
  if (!Array.isArray(parsed)) {
    throw new Error('Invalid format: root must be an array of HeatMaps');
  }
  await saveHeatMaps(parsed, userId);
  return parsed;
}

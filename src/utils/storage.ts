import AsyncStorage from '@react-native-async-storage/async-storage';
import { HeatMapModel } from '../types/heatmap';
import { SAMPLE_HEATMAPS } from '../constants/sampleData';

const STORAGE_KEY = '@trace_heatmaps_v1';

export async function loadHeatMaps(): Promise<HeatMapModel[]> {
  try {
    const raw = await AsyncStorage.getItem(STORAGE_KEY);
    if (!raw) {
      // First run: save sample data and return it
      await saveHeatMaps(SAMPLE_HEATMAPS);
      return SAMPLE_HEATMAPS;
    }
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed) && parsed.length > 0) {
      return parsed;
    }
    return SAMPLE_HEATMAPS;
  } catch (err) {
    console.warn('Storage read error, falling back to sample data:', err);
    return SAMPLE_HEATMAPS;
  }
}

export async function saveHeatMaps(maps: HeatMapModel[]): Promise<void> {
  try {
    const payload = JSON.stringify(maps);
    await AsyncStorage.setItem(STORAGE_KEY, payload);
  } catch (err) {
    console.error('Storage write error:', err);
  }
}

export async function exportDataJSON(): Promise<string> {
  const maps = await loadHeatMaps();
  return JSON.stringify(maps, null, 2);
}

export async function importDataJSON(jsonStr: string): Promise<HeatMapModel[]> {
  const parsed = JSON.parse(jsonStr);
  if (!Array.isArray(parsed)) {
    throw new Error('Invalid format: root must be an array of HeatMaps');
  }
  await saveHeatMaps(parsed);
  return parsed;
}

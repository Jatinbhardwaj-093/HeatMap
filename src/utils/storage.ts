import AsyncStorage from '@react-native-async-storage/async-storage';
import { HeatMapModel } from '../types/heatmap';
import { supabase } from './supabase';

function getStorageKey(userId?: string): string {
  if (userId) {
    return `@trackheat_maps_${userId}`;
  }
  return '@trackheat_maps_guest';
}

function getLegacyStorageKey(userId?: string): string {
  if (userId) {
    return `@habitheat_maps_${userId}`;
  }
  return '@habitheat_maps_guest';
}

export async function loadHeatMaps(userId?: string): Promise<HeatMapModel[]> {
  const key = getStorageKey(userId);
  let localMaps: HeatMapModel[] = [];

  try {
    let raw = await AsyncStorage.getItem(key);
    if (!raw) {
      raw = await AsyncStorage.getItem(getLegacyStorageKey(userId));
    }
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) {
        localMaps = parsed;
      }
    }
  } catch (err) {
    console.warn('Local storage read error:', err);
  }

  // If user is authenticated, sync with Supabase cloud user_metadata
  if (userId) {
    // If local user storage is empty, check if guest data exists that can be migrated
    if (localMaps.length === 0) {
      try {
        let guestRaw = await AsyncStorage.getItem('@trackheat_maps_guest');
        if (!guestRaw) {
          guestRaw = await AsyncStorage.getItem('@habitheat_maps_guest');
        }
        if (guestRaw) {
          const guestParsed = JSON.parse(guestRaw);
          if (Array.isArray(guestParsed) && guestParsed.length > 0) {
            localMaps = guestParsed;
            await AsyncStorage.setItem(key, JSON.stringify(localMaps));
          }
        }
      } catch {
        // Ignore guest migration errors
      }
    }

    try {
      const { data: { user } } = await supabase.auth.getUser();
      const cloudHabits = user?.user_metadata?.habits;

      if (Array.isArray(cloudHabits) && cloudHabits.length > 0) {
        if (localMaps.length === 0) {
          localMaps = cloudHabits;
          await AsyncStorage.setItem(key, JSON.stringify(cloudHabits));
        } else {
          // Merge local and cloud habits
          const mapById: Record<string, HeatMapModel> = {};
          cloudHabits.forEach((m) => {
            mapById[m.id] = m;
          });
          localMaps.forEach((m) => {
            if (mapById[m.id]) {
              mapById[m.id] = {
                ...mapById[m.id],
                ...m,
                entries: { ...mapById[m.id].entries, ...m.entries },
              };
            } else {
              mapById[m.id] = m;
            }
          });
          localMaps = Object.values(mapById);
          await AsyncStorage.setItem(key, JSON.stringify(localMaps));
        }
      } else if (localMaps.length > 0) {
        // Cloud has no habits yet, sync local habits to cloud
        supabase.auth.updateUser({ data: { habits: localMaps } }).catch(() => {});
      }
    } catch {
      // Offline / network failure: fallback smoothly to local storage
    }
  }

  return localMaps;
}

export async function saveHeatMaps(maps: HeatMapModel[], userId?: string): Promise<void> {
  try {
    const key = getStorageKey(userId);
    const payload = JSON.stringify(maps);
    await AsyncStorage.setItem(key, payload);

    // Sync to Supabase user_metadata if logged in
    if (userId) {
      supabase.auth.updateUser({ data: { habits: maps } }).catch((err) => {
        console.warn('Cloud sync error:', err);
      });
    }
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

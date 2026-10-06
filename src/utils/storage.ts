import AsyncStorage from '@react-native-async-storage/async-storage';
import { HeatMapModel } from '../types/heatmap';
import { supabase } from './supabase';
import { updateAndroidWidgets } from '../widgets/widgetSync';

export async function getResolvedUserId(explicitUserId?: string): Promise<string | undefined> {
  if (explicitUserId) return explicitUserId;

  try {
    const { data: { session } } = await supabase.auth.getSession();
    if (session?.user?.id) return session.user.id;
  } catch {}

  try {
    const rawCached = await AsyncStorage.getItem('@trackheat_saved_user');
    if (rawCached) {
      const parsed = JSON.parse(rawCached);
      if (parsed?.id) return parsed.id;
    }
  } catch {}

  return undefined;
}

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

/**
 * Pushes habit data to Supabase user_metadata with session refresh and retry support.
 */
export async function syncHabitsToCloud(maps: HeatMapModel[], userId?: string): Promise<boolean> {
  const resolvedId = userId || (await getResolvedUserId());
  if (!resolvedId) return false;

  try {
    let { data: { session } } = await supabase.auth.getSession();
    if (!session?.user) {
      const { data: refreshed } = await supabase.auth.refreshSession();
      session = refreshed?.session;
    }
    if (!session?.user) return false;

    const { error } = await supabase.auth.updateUser({
      data: {
        habits: maps,
        habits_updated_at: new Date().toISOString(),
      },
    });

    if (error) {
      console.warn('Supabase updateUser error:', error.message);
      await AsyncStorage.setItem(`@trackheat_pending_sync_${resolvedId}`, 'true');
      return false;
    }

    const nowIso = new Date().toISOString();
    await AsyncStorage.setItem(`@trackheat_last_synced_${resolvedId}`, nowIso);
    await AsyncStorage.removeItem(`@trackheat_pending_sync_${resolvedId}`);
    return true;
  } catch (err) {
    console.warn('syncHabitsToCloud exception:', err);
    if (resolvedId) {
      await AsyncStorage.setItem(`@trackheat_pending_sync_${resolvedId}`, 'true');
    }
    return false;
  }
}

/**
 * Loads habits from local storage and hydrates / synchronizes with Supabase cloud storage.
 */
export async function loadHeatMaps(userId?: string): Promise<HeatMapModel[]> {
  const resolvedId = userId || (await getResolvedUserId());
  const key = getStorageKey(resolvedId);
  let localMaps: HeatMapModel[] = [];

  try {
    let raw = await AsyncStorage.getItem(key);
    if (!raw && resolvedId) {
      raw = await AsyncStorage.getItem(getLegacyStorageKey(resolvedId));
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
  if (resolvedId) {
    try {
      let { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        const { data: { session } } = await supabase.auth.getSession();
        user = session?.user || null;
      }

      const cloudHabits = user?.user_metadata?.habits;

      if (Array.isArray(cloudHabits) && cloudHabits.length > 0) {
        // Cloud has habits: authoritative source of truth.
        const pendingSync = await AsyncStorage.getItem(`@trackheat_pending_sync_${resolvedId}`);

        if (pendingSync === 'true' && localMaps.length > 0) {
          // Merge pending offline changes with cloud changes
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
          await syncHabitsToCloud(localMaps, resolvedId);
        } else {
          // Normal case: adopt cloud habits directly
          localMaps = cloudHabits;
          await AsyncStorage.setItem(key, JSON.stringify(cloudHabits));
          await AsyncStorage.setItem(`@trackheat_last_synced_${resolvedId}`, new Date().toISOString());
          await AsyncStorage.removeItem(`@trackheat_pending_sync_${resolvedId}`);
        }
      } else if (localMaps.length > 0) {
        // Cloud has no habits yet: push local habits to cloud
        await syncHabitsToCloud(localMaps, resolvedId);
      } else {
        // Brand new account AND empty local storage: check for guest data to migrate
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
              await syncHabitsToCloud(localMaps, resolvedId);
            }
          }
        } catch {}
      }
    } catch (err) {
      console.warn('Cloud sync error in loadHeatMaps:', err);
    }
  }

  return localMaps;
}

/**
 * Saves habits to local device storage and automatically triggers cloud sync.
 */
export async function saveHeatMaps(maps: HeatMapModel[], userId?: string): Promise<void> {
  try {
    const resolvedId = userId || (await getResolvedUserId());
    const key = getStorageKey(resolvedId);
    const payload = JSON.stringify(maps);
    await AsyncStorage.setItem(key, payload);

    if (resolvedId) {
      syncHabitsToCloud(maps, resolvedId).catch((err) => {
        console.warn('saveHeatMaps cloud sync error:', err);
      });
    }

    // Refresh native Android home screen widgets
    updateAndroidWidgets().catch(() => {});
  } catch (err) {
    console.error('Storage write error:', err);
  }
}

/**
 * Explicitly forces a fresh pull from Supabase cloud storage.
 */
export async function forceSyncFromCloud(userId?: string): Promise<HeatMapModel[] | null> {
  const resolvedId = userId || (await getResolvedUserId());
  if (!resolvedId) return null;

  try {
    let { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      const { data: { session } } = await supabase.auth.getSession();
      user = session?.user || null;
    }

    const cloudHabits = user?.user_metadata?.habits;
    if (Array.isArray(cloudHabits) && cloudHabits.length > 0) {
      const key = getStorageKey(resolvedId);
      await AsyncStorage.setItem(key, JSON.stringify(cloudHabits));
      await AsyncStorage.setItem(`@trackheat_last_synced_${resolvedId}`, new Date().toISOString());
      await AsyncStorage.removeItem(`@trackheat_pending_sync_${resolvedId}`);
      updateAndroidWidgets().catch(() => {});
      return cloudHabits;
    }
  } catch (err) {
    console.warn('forceSyncFromCloud error:', err);
  }
  return null;
}

export async function getLastSyncedTime(userId?: string): Promise<string | null> {
  const resolvedId = userId || (await getResolvedUserId());
  if (!resolvedId) return null;
  return AsyncStorage.getItem(`@trackheat_last_synced_${resolvedId}`);
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

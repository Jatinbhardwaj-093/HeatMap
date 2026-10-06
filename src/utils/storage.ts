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

const DELETED_MAPS_KEY_PREFIX = '@trackheat_deleted_maps_';

/**
 * Retrieves the set of deleted habit IDs for the given user (tombstones).
 */
export async function getDeletedMapIds(userId?: string): Promise<Set<string>> {
  const resolvedId = userId || (await getResolvedUserId());
  const key = `${DELETED_MAPS_KEY_PREFIX}${resolvedId || 'guest'}`;
  try {
    const raw = await AsyncStorage.getItem(key);
    if (raw) {
      const list = JSON.parse(raw);
      if (Array.isArray(list)) return new Set(list);
    }
  } catch {}
  return new Set();
}

/**
 * Records a deleted habit ID so it can never be resurrected by sync.
 */
export async function recordDeletedMapId(mapId: string, userId?: string): Promise<Set<string>> {
  const resolvedId = userId || (await getResolvedUserId());
  const deletedSet = await getDeletedMapIds(resolvedId);
  deletedSet.add(mapId);
  const key = `${DELETED_MAPS_KEY_PREFIX}${resolvedId || 'guest'}`;
  try {
    await AsyncStorage.setItem(key, JSON.stringify(Array.from(deletedSet)));
  } catch {}
  return deletedSet;
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

    const deletedIds = await getDeletedMapIds(resolvedId);
    const cleanMaps = maps.filter((m) => m && m.id && !deletedIds.has(m.id));

    const { error } = await supabase.auth.updateUser({
      data: {
        habits: cleanMaps,
        habits_updated_at: new Date().toISOString(),
        deleted_habit_ids: Array.from(deletedIds),
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

  const deletedIds = await getDeletedMapIds(resolvedId);

  try {
    let raw = await AsyncStorage.getItem(key);
    if (!raw && resolvedId) {
      raw = await AsyncStorage.getItem(getLegacyStorageKey(resolvedId));
    }
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) {
        localMaps = parsed.filter((m) => m && m.id && !deletedIds.has(m.id));
      }
    }
  } catch (err) {
    console.warn('Local storage read error:', err);
  }

  // If user is authenticated, sync with Supabase cloud user_metadata
  if (resolvedId) {
    try {
      let { data: { session } } = await supabase.auth.getSession();
      let user = session?.user || null;
      if (!user) {
        const { data: userData } = await supabase.auth.getUser();
        user = userData?.user || null;
      }

      // Ingest any cloud deleted_habit_ids from metadata into local tombstones
      const cloudDeletedIds = user?.user_metadata?.deleted_habit_ids;
      if (Array.isArray(cloudDeletedIds)) {
        let changed = false;
        for (const did of cloudDeletedIds) {
          if (!deletedIds.has(did)) {
            deletedIds.add(did);
            changed = true;
          }
        }
        if (changed) {
          const dKey = `${DELETED_MAPS_KEY_PREFIX}${resolvedId}`;
          await AsyncStorage.setItem(dKey, JSON.stringify(Array.from(deletedIds)));
        }
      }

      // Filter cloud habits by deleted IDs
      const rawCloudHabits = user?.user_metadata?.habits;
      const cloudHabits = Array.isArray(rawCloudHabits)
        ? rawCloudHabits.filter((m: HeatMapModel) => m && m.id && !deletedIds.has(m.id))
        : null;

      // Re-filter local maps in case cloud had new tombstones
      localMaps = localMaps.filter((m) => m && m.id && !deletedIds.has(m.id));

      const pendingSync = await AsyncStorage.getItem(`@trackheat_pending_sync_${resolvedId}`);
      const rawLocalUpdated = await AsyncStorage.getItem(`@trackheat_local_updated_at_${resolvedId}`);
      const localUpdatedAt = rawLocalUpdated ? parseInt(rawLocalUpdated, 10) : 0;
      const cloudUpdatedAtStr = user?.user_metadata?.habits_updated_at;
      const cloudUpdatedAt = cloudUpdatedAtStr ? new Date(cloudUpdatedAtStr).getTime() : 0;

      if (cloudHabits !== null) {
        if (pendingSync === 'true' || localUpdatedAt > cloudUpdatedAt) {
          // Local has newer changes or pending offline sync:
          // Merge local entries into cloud habits, respecting deletions
          const mapById: Record<string, HeatMapModel> = {};
          cloudHabits.forEach((m) => {
            if (!deletedIds.has(m.id)) {
              mapById[m.id] = m;
            }
          });
          localMaps.forEach((m) => {
            if (!deletedIds.has(m.id)) {
              if (mapById[m.id]) {
                mapById[m.id] = {
                  ...mapById[m.id],
                  ...m,
                  entries: { ...mapById[m.id].entries, ...m.entries },
                };
              } else {
                mapById[m.id] = m;
              }
            }
          });
          localMaps = Object.values(mapById);
          await AsyncStorage.setItem(key, JSON.stringify(localMaps));
          await syncHabitsToCloud(localMaps, resolvedId);
        } else {
          // Cloud has newer authoritative habits
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
              localMaps = guestParsed.filter((m) => m && m.id && !deletedIds.has(m.id));
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

    // Ensure deleted maps are stripped
    const deletedIds = await getDeletedMapIds(resolvedId);
    const cleanMaps = maps.filter((m) => m && m.id && !deletedIds.has(m.id));

    const payload = JSON.stringify(cleanMaps);
    await AsyncStorage.setItem(key, payload);
    await AsyncStorage.setItem(`@trackheat_local_updated_at_${resolvedId || 'guest'}`, Date.now().toString());

    if (resolvedId) {
      syncHabitsToCloud(cleanMaps, resolvedId).catch((err) => {
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
 * Permanently deletes a habit tracker, records tombstone, updates storage and cloud metadata.
 */
export async function deleteHeatMap(mapId: string, userId?: string): Promise<HeatMapModel[]> {
  const resolvedId = userId || (await getResolvedUserId());

  // 1. Record the tombstone so it can never be resurrected
  const deletedIds = await recordDeletedMapId(mapId, resolvedId);

  // 2. Load current local maps and filter out the deleted ID
  const key = getStorageKey(resolvedId);
  let localMaps: HeatMapModel[] = [];
  try {
    const raw = await AsyncStorage.getItem(key);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) {
        localMaps = parsed;
      }
    }
  } catch {}

  const updatedMaps = localMaps.filter((m) => m && m.id !== mapId && !deletedIds.has(m.id));

  // 3. Save to local storage with updated timestamp
  await AsyncStorage.setItem(key, JSON.stringify(updatedMaps));
  await AsyncStorage.setItem(`@trackheat_local_updated_at_${resolvedId || 'guest'}`, Date.now().toString());

  // 4. Immediately sync to cloud with deleted_habit_ids
  if (resolvedId) {
    syncHabitsToCloud(updatedMaps, resolvedId).catch((err) => {
      console.warn('deleteHeatMap cloud sync error:', err);
    });
  }

  // 5. Refresh native Android home screen widgets
  updateAndroidWidgets().catch(() => {});

  return updatedMaps;
}

/**
 * Explicitly forces a fresh pull from Supabase cloud storage.
 */
export async function forceSyncFromCloud(userId?: string): Promise<HeatMapModel[] | null> {
  const resolvedId = userId || (await getResolvedUserId());
  if (!resolvedId) return null;

  try {
    let { data: { session } } = await supabase.auth.getSession();
    let user = session?.user || null;
    if (!user) {
      const { data: userData } = await supabase.auth.getUser();
      user = userData?.user || null;
    }

    const deletedIds = await getDeletedMapIds(resolvedId);

    // Ingest cloud deleted IDs
    const cloudDeletedIds = user?.user_metadata?.deleted_habit_ids;
    if (Array.isArray(cloudDeletedIds)) {
      let changed = false;
      for (const did of cloudDeletedIds) {
        if (!deletedIds.has(did)) {
          deletedIds.add(did);
          changed = true;
        }
      }
      if (changed) {
        const dKey = `${DELETED_MAPS_KEY_PREFIX}${resolvedId}`;
        await AsyncStorage.setItem(dKey, JSON.stringify(Array.from(deletedIds)));
      }
    }

    const rawCloudHabits = user?.user_metadata?.habits;
    if (Array.isArray(rawCloudHabits)) {
      const cleanHabits = rawCloudHabits.filter((m: HeatMapModel) => m && m.id && !deletedIds.has(m.id));
      const key = getStorageKey(resolvedId);
      await AsyncStorage.setItem(key, JSON.stringify(cleanHabits));
      await AsyncStorage.setItem(`@trackheat_last_synced_${resolvedId}`, new Date().toISOString());
      await AsyncStorage.removeItem(`@trackheat_pending_sync_${resolvedId}`);
      updateAndroidWidgets().catch(() => {});
      return cleanHabits;
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

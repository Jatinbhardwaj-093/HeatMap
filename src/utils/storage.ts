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
    const { data: userData } = await supabase.auth.getUser();
    if (userData?.user?.id) return userData.user.id;
  } catch {}

  try {
    const rawCached = await AsyncStorage.getItem('@trackheat_saved_user');
    if (rawCached) {
      const parsed = JSON.parse(rawCached);
      if (parsed?.id) return parsed.id;
    }
  } catch {}

  try {
    const rawLegacy = await AsyncStorage.getItem('@habitheat_saved_user');
    if (rawLegacy) {
      const parsed = JSON.parse(rawLegacy);
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

export const DUMMY_SHOWCASE_HABIT_IDS = new Set([
  'hm-deep-work',
  'hm-strength-training',
  'hm-reading-research',
  'hm-clean-nutrition',
  'hm-evening-reflection',
  'hm-fitness-strength',
  'hm-diet-clean',
]);

export const CLIENT_INSTANCE_ID = Math.random().toString(36).substring(2, 10);

let syncChannel: ReturnType<typeof supabase.channel> | null = null;

export function getSyncChannel() {
  if (!syncChannel) {
    syncChannel = supabase.channel('trackheat_sync_hub', {
      config: {
        broadcast: { ack: false },
      },
    });
    syncChannel.subscribe();
  }
  return syncChannel;
}

export async function broadcastHabitsChanged(sourceUserId?: string, habitsPayload?: HeatMapModel[]) {
  try {
    const ch = getSyncChannel();
    await ch.send({
      type: 'broadcast',
      event: 'habits_changed',
      payload: {
        sourceClientId: CLIENT_INSTANCE_ID,
        userId: sourceUserId,
        habits: habitsPayload ? compactHabitsForCloud(habitsPayload) : undefined,
        timestamp: Date.now(),
      },
    });
  } catch {}
}

/**
 * Retrieves the set of deleted habit IDs for the given user (tombstones).
 */
export async function getDeletedMapIds(userId?: string): Promise<Set<string>> {
  const resolvedId = userId || (await getResolvedUserId());
  const key = `${DELETED_MAPS_KEY_PREFIX}${resolvedId || 'guest'}`;
  const deletedSet = new Set<string>(DUMMY_SHOWCASE_HABIT_IDS);
  try {
    const raw = await AsyncStorage.getItem(key);
    if (raw) {
      const list = JSON.parse(raw);
      if (Array.isArray(list)) {
        for (const id of list) deletedSet.add(id);
      }
    }
  } catch {}
  return deletedSet;
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
 * Compacts habits for minimal cloud payload footprint (< 2KB total).
 * Strips redundant nested keys and empty days, ensuring JWT tokens remain tiny.
 */
export function compactHabitsForCloud(habits: HeatMapModel[]): any[] {
  return habits.map((h) => {
    const compactEntries: Record<string, any> = {};
    if (h.entries) {
      for (const [dateKey, entry] of Object.entries(h.entries)) {
        if (!entry) continue;
        if (entry.completed && !entry.notes) {
          compactEntries[dateKey] = true;
        } else if (entry.completed || entry.notes) {
          compactEntries[dateKey] = {
            c: entry.completed ? 1 : 0,
            ...(entry.notes ? { n: entry.notes } : {}),
          };
        }
      }
    }
    return {
      id: h.id,
      title: h.title,
      category: h.category,
      paletteId: h.paletteId,
      defaultView: h.defaultView,
      createdAt: h.createdAt,
      entries: compactEntries,
    };
  });
}

/**
 * Unpacks cloud habits back into full client HeatMapModel instances.
 */
export function unpackCloudHabits(rawList: any[]): HeatMapModel[] {
  if (!Array.isArray(rawList)) return [];
  return rawList.map((item) => {
    const unpackedEntries: Record<string, any> = {};
    if (item.entries && typeof item.entries === 'object') {
      for (const [dateKey, val] of Object.entries(item.entries)) {
        if (val === true || val === 1) {
          unpackedEntries[dateKey] = { date: dateKey, completed: true };
        } else if (typeof val === 'object' && val !== null) {
          unpackedEntries[dateKey] = {
            date: dateKey,
            completed: Boolean((val as any).c ?? (val as any).completed),
            notes: (val as any).n || (val as any).notes,
          };
        }
      }
    }
    return {
      id: item.id || `hm-${Date.now()}`,
      title: item.title || 'Untitled Tracker',
      category: item.category || 'HABIT',
      paletteId: item.paletteId || 'github',
      defaultView: item.defaultView || 'YEAR',
      createdAt: item.createdAt || new Date().toISOString(),
      entries: unpackedEntries,
    };
  });
}

/**
 * Retrieves the authoritative user object from Supabase, refreshing session tokens if expired.
 * Guarded with a strict 3.5s timeout so network latency never blocks the app.
 */
export async function getFreshAuthenticatedUser(): Promise<any | null> {
  const timeoutPromise = new Promise<null>((resolve) => setTimeout(() => resolve(null), 3500));

  const fetchPromise = (async () => {
    try {
      let { data: { session } } = await supabase.auth.getSession();
      const nowSec = Math.floor(Date.now() / 1000);

      // If session is missing or expiring within 60 seconds, refresh it
      if (!session || !session.expires_at || session.expires_at < nowSec + 60) {
        const { data: refreshed, error: refErr } = await supabase.auth.refreshSession();
        if (!refErr && refreshed?.session) {
          session = refreshed.session;
        }
      }

      if (!session?.access_token) {
        return null;
      }

      // Fetch fresh metadata from server
      const { data: userData, error: userErr } = await supabase.auth.getUser();
      if (!userErr && userData?.user) {
        return userData.user;
      }

      return session?.user || null;
    } catch {
      return null;
    }
  })();

  return Promise.race([fetchPromise, timeoutPromise]);
}

/**
 * Pushes habit data to Supabase user_metadata with session refresh and retry support.
 * Automatically compacts data to prevent oversized auth headers.
 */
export async function syncHabitsToCloud(maps: HeatMapModel[], userId?: string): Promise<boolean> {
  const resolvedId = userId || (await getResolvedUserId());
  if (!resolvedId) return false;

  try {
    const timeoutPromise = new Promise<boolean>((resolve) => setTimeout(() => resolve(false), 4000));

    const syncPromise = (async () => {
      let user = await getFreshAuthenticatedUser();
      if (!user) return false;

      const deletedIds = await getDeletedMapIds(resolvedId);
      const cleanMaps = maps.filter((m) => m && m.id && !deletedIds.has(m.id));
      const compactMaps = compactHabitsForCloud(cleanMaps);

      let { error } = await supabase.auth.updateUser({
        data: {
          habits: compactMaps,
          habits_updated_at: new Date().toISOString(),
          deleted_habit_ids: Array.from(deletedIds),
        },
      });

      if (error) {
        await supabase.auth.refreshSession();
        const retryResult = await supabase.auth.updateUser({
          data: {
            habits: compactMaps,
            habits_updated_at: new Date().toISOString(),
            deleted_habit_ids: Array.from(deletedIds),
          },
        });
        error = retryResult.error;
      }

      if (error) {
        await AsyncStorage.setItem(`@trackheat_pending_sync_${resolvedId}`, 'true');
        return false;
      }

      const nowIso = new Date().toISOString();
      await AsyncStorage.setItem(`@trackheat_last_synced_${resolvedId}`, nowIso);
      await AsyncStorage.removeItem(`@trackheat_pending_sync_${resolvedId}`);
      return true;
    })();

    return Promise.race([syncPromise, timeoutPromise]);
  } catch (err) {
    if (resolvedId) {
      await AsyncStorage.setItem(`@trackheat_pending_sync_${resolvedId}`, 'true');
    }
    return false;
  }
}

/**
 * Merges two habit collections, reconciling entries by dateKey (union).
 * Respects deleted habit tombstones and preserves completed days.
 */
export function mergeHabitLists(
  localHabits: HeatMapModel[],
  cloudHabits: HeatMapModel[],
  deletedIds: Set<string>
): HeatMapModel[] {
  const mapById: Record<string, HeatMapModel> = {};

  // 1. Ingest cloud habits first
  for (const ch of cloudHabits) {
    if (ch && ch.id && !deletedIds.has(ch.id)) {
      mapById[ch.id] = { ...ch, entries: { ...(ch.entries || {}) } };
    }
  }

  // 2. Merge local habits with union of entries
  for (const lh of localHabits) {
    if (!lh || !lh.id || deletedIds.has(lh.id)) continue;

    if (!mapById[lh.id]) {
      mapById[lh.id] = { ...lh, entries: { ...(lh.entries || {}) } };
    } else {
      const existing = mapById[lh.id];
      const mergedEntries = { ...(existing.entries || {}) };
      if (lh.entries) {
        for (const [dateKey, entry] of Object.entries(lh.entries)) {
          if (!mergedEntries[dateKey]) {
            mergedEntries[dateKey] = entry;
          } else {
            // Keep completed: true if marked done on either device
            mergedEntries[dateKey] = {
              ...mergedEntries[dateKey],
              ...entry,
              completed: Boolean(mergedEntries[dateKey].completed || entry.completed),
              notes: entry.notes || mergedEntries[dateKey].notes,
            };
          }
        }
      }
      mapById[lh.id] = {
        ...existing,
        ...lh,
        entries: mergedEntries,
      };
    }
  }

  return Object.values(mapById);
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
    // 1. Check for any guest habits on this device and migrate them automatically
    try {
      let guestRaw = await AsyncStorage.getItem('@trackheat_maps_guest');
      if (!guestRaw) {
        guestRaw = await AsyncStorage.getItem('@habitheat_maps_guest');
      }
      if (guestRaw) {
        const guestParsed = JSON.parse(guestRaw);
        if (Array.isArray(guestParsed) && guestParsed.length > 0) {
          const guestClean = guestParsed.filter((m) => m && m.id && !deletedIds.has(m.id));
          if (guestClean.length > 0) {
            localMaps = mergeHabitLists(localMaps, guestClean, deletedIds);
            await AsyncStorage.setItem(key, JSON.stringify(localMaps));
            // Push migrated habits to cloud
            await syncHabitsToCloud(localMaps, resolvedId);
          }
          // Clear guest keys now that they are securely attached to the account
          await AsyncStorage.removeItem('@trackheat_maps_guest');
          await AsyncStorage.removeItem('@habitheat_maps_guest');
        }
      }
    } catch (migErr) {
      console.warn('Guest migration error in loadHeatMaps:', migErr);
    }

    // 2. Hydrate & merge with Supabase cloud user_metadata
    try {
      const user = await getFreshAuthenticatedUser();

      if (user) {
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

        // Unpack and filter cloud habits by deleted IDs
        const rawCloudHabits = user?.user_metadata?.habits;
        const unpackedCloud = unpackCloudHabits(rawCloudHabits);
        const cloudHabits = unpackedCloud.filter((m: HeatMapModel) => m && m.id && !deletedIds.has(m.id));

        const hasPendingSync = await AsyncStorage.getItem(`@trackheat_pending_sync_${resolvedId}`);
        let finalMaps: HeatMapModel[];

        if (hasPendingSync === 'true') {
          finalMaps = mergeHabitLists(localMaps, cloudHabits, deletedIds);
          if (JSON.stringify(finalMaps) !== JSON.stringify(cloudHabits)) {
            syncHabitsToCloud(finalMaps, resolvedId).catch(() => {});
          }
        } else {
          // Cloud is authoritative when there are no uncommitted local changes
          if (cloudHabits.length > 0) {
            finalMaps = cloudHabits;
          } else if (localMaps.length > 0) {
            finalMaps = localMaps;
            syncHabitsToCloud(finalMaps, resolvedId).catch(() => {});
          } else {
            finalMaps = [];
          }
        }

        const finalJson = JSON.stringify(finalMaps);
        if (finalJson !== JSON.stringify(localMaps)) {
          localMaps = finalMaps;
          await AsyncStorage.setItem(key, finalJson);
          await AsyncStorage.setItem(`@trackheat_last_synced_${resolvedId}`, new Date().toISOString());
        }
        await AsyncStorage.removeItem(`@trackheat_pending_sync_${resolvedId}`);
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
      broadcastHabitsChanged(resolvedId, cleanMaps).catch(() => {});
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

  // 4. Immediately sync to cloud with deleted_habit_ids and broadcast to open clients
  if (resolvedId) {
    broadcastHabitsChanged(resolvedId, updatedMaps).catch(() => {});
    syncHabitsToCloud(updatedMaps, resolvedId).catch((err) => {
      console.warn('deleteHeatMap cloud sync error:', err);
    });
  }

  // 5. Refresh native Android home screen widgets
  updateAndroidWidgets().catch(() => {});

  return updatedMaps;
}

/**
 * Explicitly forces a fresh pull from Supabase cloud storage, merging with local data.
 */
export async function forceSyncFromCloud(userId?: string): Promise<HeatMapModel[] | null> {
  const resolvedId = userId || (await getResolvedUserId());
  if (!resolvedId) return null;

  try {
    const user = await getFreshAuthenticatedUser();
    if (!user) return null;

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
    const unpackedCloud = unpackCloudHabits(rawCloudHabits);
    const cloudHabits = unpackedCloud.filter((m: HeatMapModel) => m && m.id && !deletedIds.has(m.id));

    const key = getStorageKey(resolvedId);
    let localMaps: HeatMapModel[] = [];
    try {
      const raw = await AsyncStorage.getItem(key);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) {
          localMaps = parsed.filter((m: HeatMapModel) => m && m.id && !deletedIds.has(m.id));
        }
      }
    } catch {}

    const hasPendingSync = await AsyncStorage.getItem(`@trackheat_pending_sync_${resolvedId}`);
    let finalMaps: HeatMapModel[];

    if (hasPendingSync === 'true') {
      finalMaps = mergeHabitLists(localMaps, cloudHabits, deletedIds);
      if (JSON.stringify(finalMaps) !== JSON.stringify(cloudHabits)) {
        syncHabitsToCloud(finalMaps, resolvedId).catch(() => {});
      }
    } else {
      // Cloud is authoritative when there are no uncommitted local mutations
      if (cloudHabits.length > 0) {
        finalMaps = cloudHabits;
      } else if (localMaps.length > 0) {
        finalMaps = localMaps;
        syncHabitsToCloud(finalMaps, resolvedId).catch(() => {});
      } else {
        finalMaps = [];
      }
    }

    await AsyncStorage.setItem(key, JSON.stringify(finalMaps));
    await AsyncStorage.setItem(`@trackheat_last_synced_${resolvedId}`, new Date().toISOString());
    await AsyncStorage.removeItem(`@trackheat_pending_sync_${resolvedId}`);
    updateAndroidWidgets().catch(() => {});
    return finalMaps;
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

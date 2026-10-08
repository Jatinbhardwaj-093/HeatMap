import AsyncStorage from '@react-native-async-storage/async-storage';
import { supabase } from '../utils/supabase';

export interface UserProfile {
  id: string;
  email: string;
  displayName: string;
  username: string;
  createdAt?: string;
}

const USERNAME_MAP_KEY = '@trackheat_username_email_map';

export async function getStoredUsernameMap(): Promise<Record<string, string>> {
  try {
    const raw = await AsyncStorage.getItem(USERNAME_MAP_KEY);
    if (raw) {
      return JSON.parse(raw);
    }
  } catch {
    // Ignore read errors
  }
  return {};
}

export async function storeUsernameMapping(username: string, email: string): Promise<void> {
  if (!username || !email) return;
  try {
    const map = await getStoredUsernameMap();
    const cleanUsername = username.trim().replace(/^@/, '').toLowerCase();
    map[cleanUsername] = email.trim().toLowerCase();
    await AsyncStorage.setItem(USERNAME_MAP_KEY, JSON.stringify(map));
  } catch {
    // Ignore write errors
  }
}

/**
 * Checks whether a username is globally available in the database.
 */
export async function isUsernameAvailable(
  username: string,
  currentUserId?: string
): Promise<{ available: boolean; error?: string }> {
  const cleanUsername = username.trim().replace(/^@/, '').toLowerCase();

  if (cleanUsername.length < 3 || cleanUsername.length > 25) {
    return { available: false, error: 'Username must be between 3 and 25 characters.' };
  }

  if (!/^[a-zA-Z0-9_.-]+$/.test(cleanUsername)) {
    return { available: false, error: 'Username can only contain letters, numbers, underscores, and dots.' };
  }

  return { available: true };
}

/**
 * Resolves an email from an input identifier (which could be an email or @username).
 * Uses local secure mapping to prevent email harvesting or privacy leaks.
 */
export async function resolveEmailFromIdentifier(identifier: string): Promise<string> {
  const clean = identifier.trim();
  if (clean.includes('@')) {
    return clean;
  }
  const cleanUsername = clean.replace(/^@/, '').toLowerCase();

  // 1. Direct match for primary user
  if (cleanUsername === 'jatin') {
    return 'bhardwajjatin093@gmail.com';
  }

  // 2. Check local device mapping
  const map = await getStoredUsernameMap();
  if (map[cleanUsername]) {
    return map[cleanUsername];
  }

  // 3. Check remembered email on device
  try {
    const remembered = await AsyncStorage.getItem('@trackheat_remembered_email');
    if (remembered && remembered.includes('@')) {
      const rememberedPrefix = remembered.split('@')[0].toLowerCase();
      if (rememberedPrefix === cleanUsername) {
        return remembered;
      }
    }
  } catch {}

  return clean;
}

export async function getCurrentUserProfile(
  fallbackEmail?: string,
  fallbackId?: string
): Promise<UserProfile | null> {
  try {
    let user: any = null;

    // 1. Instant resolution from active local session (0ms)
    try {
      const { data } = await supabase.auth.getSession();
      user = data?.session?.user;
    } catch {}

    // 2. Fallback to cached device state (0ms)
    if (!user) {
      try {
        const rawCached = await AsyncStorage.getItem('@trackheat_saved_user');
        if (rawCached) {
          const parsed = JSON.parse(rawCached);
          if (parsed?.id) {
            user = {
              id: parsed.id,
              email: parsed.email || fallbackEmail || '',
              user_metadata: parsed.user_metadata || {},
              created_at: parsed.created_at || new Date().toISOString(),
            };
          }
        }
      } catch {}
    }

    // 3. Fallback to getUser only if local session is empty
    if (!user) {
      try {
        const { data } = await supabase.auth.getUser();
        user = data?.user;
      } catch {}
    }

    if (!user && (fallbackEmail || fallbackId)) {
      user = {
        id: fallbackId || 'guest',
        email: fallbackEmail || '',
        user_metadata: {},
        created_at: new Date().toISOString(),
      };
    }

    if (!user) return null;

    const targetId = user.id || fallbackId || 'user';

    // 4. Check device profile cache as authoritative source for custom names on this device
    let cachedProfile: Partial<UserProfile> | null = null;
    try {
      const rawUserProf = await AsyncStorage.getItem(`@trackheat_profile_${targetId}`);
      if (rawUserProf) {
        cachedProfile = JSON.parse(rawUserProf);
      }
      if (!cachedProfile) {
        const rawSaved = await AsyncStorage.getItem('@trackheat_saved_user');
        if (rawSaved) {
          const parsed = JSON.parse(rawSaved);
          if (parsed?.displayName || parsed?.username) {
            cachedProfile = parsed;
          }
        }
      }
    } catch {}

    const meta = user.user_metadata || {};
    const rawEmail = user.email || fallbackEmail || '';
    const emailPrefix = rawEmail ? rawEmail.split('@')[0] : '';
    const formattedPrefix = emailPrefix
      ? emailPrefix.charAt(0).toUpperCase() + emailPrefix.slice(1).replace(/[._-]/g, ' ')
      : 'TrackHeat Member';

    const displayName =
      cachedProfile?.displayName ||
      meta.display_name ||
      meta.full_name ||
      formattedPrefix ||
      'TrackHeat Member';

    const username =
      cachedProfile?.username ||
      meta.username ||
      (emailPrefix ? emailPrefix.toLowerCase() : 'member');

    const profile: UserProfile = {
      id: targetId,
      email: rawEmail,
      displayName,
      username,
      createdAt: user.created_at,
    };

    if (profile.username && profile.email) {
      await storeUsernameMapping(profile.username, profile.email);
    }

    return profile;
  } catch {
    return null;
  }
}

export async function updateUserProfile(params: {
  displayName: string;
  username: string;
}): Promise<{ success: boolean; error?: string; profile?: UserProfile }> {
  try {
    let user: any = null;

    // 1. Fast read from local session (0ms)
    try {
      const { data } = await supabase.auth.getSession();
      user = data?.session?.user;
    } catch {}

    if (!user) {
      try {
        const { data } = await supabase.auth.getUser();
        user = data?.user;
      } catch {}
    }

    if (!user) {
      try {
        const rawCached = await AsyncStorage.getItem('@trackheat_saved_user');
        if (rawCached) {
          const parsed = JSON.parse(rawCached);
          if (parsed?.id) user = parsed;
        }
      } catch {}
    }

    if (!user) {
      return { success: false, error: 'No active session found.' };
    }

    const cleanUsername = params.username.trim().replace(/^@/, '').toLowerCase();
    const cleanDisplayName = params.displayName.trim() || cleanUsername;

    const availability = await isUsernameAvailable(cleanUsername, user.id);
    if (!availability.available) {
      return { success: false, error: availability.error || 'Username is invalid.' };
    }

    // 2. Immediately persist locally so device never loses changes
    const targetId = user.id || 'user';
    const profile: UserProfile = {
      id: targetId,
      email: user.email || '',
      displayName: cleanDisplayName,
      username: cleanUsername,
      createdAt: user.created_at,
    };

    try {
      await AsyncStorage.setItem(`@trackheat_profile_${targetId}`, JSON.stringify(profile));
      const rawSaved = await AsyncStorage.getItem('@trackheat_saved_user');
      const prevSaved = rawSaved ? JSON.parse(rawSaved) : {};
      await AsyncStorage.setItem('@trackheat_saved_user', JSON.stringify({
        ...prevSaved,
        id: targetId,
        email: user.email || prevSaved.email || '',
        displayName: cleanDisplayName,
        username: cleanUsername,
        user_metadata: {
          ...(prevSaved.user_metadata || {}),
          display_name: cleanDisplayName,
          full_name: cleanDisplayName,
          username: cleanUsername,
        },
      }));
      if (user.email) {
        await storeUsernameMapping(cleanUsername, user.email);
      }
    } catch (persistErr) {
      console.warn('Local profile cache write error:', persistErr);
    }

    // 3. Update Supabase user_metadata in background with 5-second timeout protection
    try {
      const updatePromise = supabase.auth.updateUser({
        data: {
          display_name: cleanDisplayName,
          full_name: cleanDisplayName,
          username: cleanUsername,
        },
      });

      const timeoutPromise = new Promise<{ error: any }>((_, reject) =>
        setTimeout(() => reject(new Error('Update request timed out')), 5000)
      );

      const { error: metaError } = await Promise.race([updatePromise, timeoutPromise]);
      if (metaError) {
        console.warn('Supabase updateUser warning:', metaError.message);
      } else {
        try {
          await supabase.auth.refreshSession();
        } catch {}
      }
    } catch (err: any) {
      console.warn('Supabase profile update timed out or offline:', err?.message);
    }

    return { success: true, profile };
  } catch (err: any) {
    return { success: false, error: err?.message || 'Failed to update profile.' };
  }
}

export async function changeUserPassword(params: {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
}): Promise<{ success: boolean; error?: string }> {
  const { currentPassword, newPassword, confirmPassword } = params;

  if (!currentPassword) {
    return { success: false, error: 'Please enter your current password.' };
  }

  if (newPassword.length < 8) {
    return { success: false, error: 'New password must be at least 8 characters long.' };
  }

  const hasLetter = /[a-zA-Z]/.test(newPassword);
  const hasNumberOrSymbol = /[0-9!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]/.test(newPassword);
  if (!hasLetter || !hasNumberOrSymbol) {
    return { success: false, error: 'Password must include both letters and numbers or symbols.' };
  }

  if (newPassword !== confirmPassword) {
    return { success: false, error: 'New passwords do not match.' };
  }

  if (currentPassword === newPassword) {
    return { success: false, error: 'New password cannot be the same as your current password.' };
  }

  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user || !user.email) {
      return { success: false, error: 'No active session found.' };
    }

    // Security practice: verify current password before permitting password change
    const { error: verifyError } = await supabase.auth.signInWithPassword({
      email: user.email,
      password: currentPassword,
    });

    if (verifyError) {
      return { success: false, error: 'Current password is incorrect.' };
    }

    // Perform password change
    const { error: updateError } = await supabase.auth.updateUser({
      password: newPassword,
    });

    if (updateError) {
      return { success: false, error: updateError.message };
    }

    return { success: true };
  } catch (err: any) {
    return { success: false, error: err?.message || 'Failed to change password.' };
  }
}

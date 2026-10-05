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

  try {
    const { data, error } = await supabase
      .from('profiles')
      .select('id, username')
      .ilike('username', cleanUsername);

    if (error) {
      // If table doesn't exist yet (PGRST205), allow fallback
      return { available: true };
    }

    if (data && data.length > 0) {
      const match = data[0];
      if (currentUserId && match.id === currentUserId) {
        return { available: true };
      }
      return { available: false, error: `@${cleanUsername} is already taken by another account.` };
    }

    return { available: true };
  } catch {
    return { available: true };
  }
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

  // Check local device mapping
  const map = await getStoredUsernameMap();
  if (map[cleanUsername]) {
    return map[cleanUsername];
  }
  return clean;
}

export async function getCurrentUserProfile(): Promise<UserProfile | null> {
  try {
    const { data: { user }, error } = await supabase.auth.getUser();
    if (error || !user) return null;

    // Check database profiles table first
    let dbProfile: any = null;
    try {
      const { data } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .maybeSingle();
      dbProfile = data;
    } catch {
      // Table may not exist yet
    }

    const meta = user.user_metadata || {};
    const displayName = dbProfile?.display_name || meta.full_name || meta.display_name || user.email?.split('@')[0] || 'User';
    const username = dbProfile?.username || meta.username || user.email?.split('@')[0] || 'user';

    const profile: UserProfile = {
      id: user.id,
      email: user.email || '',
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
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return { success: false, error: 'No active session found.' };
    }

    const cleanUsername = params.username.trim().replace(/^@/, '').toLowerCase();
    const cleanDisplayName = params.displayName.trim() || cleanUsername;

    // Check database uniqueness
    const availability = await isUsernameAvailable(cleanUsername, user.id);
    if (!availability.available) {
      return { success: false, error: availability.error || 'Username is already taken.' };
    }

    // Enforce in PostgreSQL profiles table
    try {
      const { error: dbError } = await supabase.from('profiles').upsert({
        id: user.id,
        username: cleanUsername,
        display_name: cleanDisplayName,
        updated_at: new Date().toISOString(),
      });

      if (dbError) {
        if (dbError.code === '23505' || dbError.message?.toLowerCase().includes('unique')) {
          return { success: false, error: `@${cleanUsername} is already taken by another account.` };
        }
      }
    } catch {
      // Fallback if table not yet configured
    }

    // Save to auth user_metadata
    const { error: metaError } = await supabase.auth.updateUser({
      data: {
        ...user.user_metadata,
        display_name: cleanDisplayName,
        full_name: cleanDisplayName,
        username: cleanUsername,
      },
    });

    if (metaError) {
      return { success: false, error: metaError.message };
    }

    if (user.email) {
      await storeUsernameMapping(cleanUsername, user.email);
    }

    const profile: UserProfile = {
      id: user.id,
      email: user.email || '',
      displayName: cleanDisplayName,
      username: cleanUsername,
      createdAt: user.created_at,
    };

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

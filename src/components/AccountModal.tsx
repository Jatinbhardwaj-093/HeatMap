import React, { useState, useEffect } from 'react';
import {
  Modal,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Platform,
  ActivityIndicator,
  ScrollView,
} from 'react-native';
import { X, User, Lock, Mail, Shield, Check, Eye, EyeOff, LogOut, RefreshCw } from 'lucide-react-native';
import { useAppTheme, useIsDark } from '../theme/theme';
import {
  getCurrentUserProfile,
  updateUserProfile,
  changeUserPassword,
  UserProfile,
} from '../services/accountService';
import { getLastSyncedTime } from '../utils/storage';

interface AccountModalProps {
  visible: boolean;
  onClose: () => void;
  onLogout: () => void;
  onProfileUpdated?: (profile: UserProfile) => void;
  userEmail?: string;
  userId?: string;
  userProfile?: UserProfile | null;
  onSync?: () => void;
  syncStatus?: 'idle' | 'syncing' | 'synced' | 'offline';
}

const fontStack = Platform.select({
  web: '"SF Pro Rounded", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
  ios: 'System',
  default: 'sans-serif',
});

export const AccountModal: React.FC<AccountModalProps> = ({
  visible,
  onClose,
  onLogout,
  onProfileUpdated,
  userEmail,
  userId,
  userProfile,
  onSync,
  syncStatus = 'idle',
}) => {
  const theme = useAppTheme();
  const isDark = useIsDark();

  const [activeTab, setActiveTab] = useState<'profile' | 'security'>('profile');
  const [profile, setProfile] = useState<UserProfile | null>(userProfile || null);
  const [loadingProfile, setLoadingProfile] = useState(false);
  const [lastSyncStr, setLastSyncStr] = useState<string>('Just now');

  useEffect(() => {
    if (visible && userId) {
      getLastSyncedTime(userId).then((t) => {
        if (t) {
          try {
            const date = new Date(t);
            setLastSyncStr(date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }));
          } catch {
            setLastSyncStr('Recently');
          }
        }
      });
    }
  }, [visible, userId, syncStatus]);

  // Profile form defaults
  const initialEmail = userEmail || userProfile?.email || '';
  const initialPrefix = initialEmail ? initialEmail.split('@')[0] : '';
  const initialDisplayName =
    userProfile?.displayName ||
    (initialPrefix ? initialPrefix.charAt(0).toUpperCase() + initialPrefix.slice(1).replace(/[._-]/g, ' ') : 'Member');
  const initialUsername =
    userProfile?.username ||
    (initialPrefix ? initialPrefix.toLowerCase() : 'member');

  const [displayName, setDisplayName] = useState(initialDisplayName);
  const [username, setUsername] = useState(initialUsername);
  const [savingProfile, setSavingProfile] = useState(false);
  const [profileStatus, setProfileStatus] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Security / Password form
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [savingPassword, setSavingPassword] = useState(false);
  const [passwordStatus, setPasswordStatus] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  useEffect(() => {
    if (visible) {
      setProfileStatus(null);
      setPasswordStatus(null);
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');

      // Instantly populate default values from props so fields are NEVER blank
      const activeEmail = userEmail || userProfile?.email || '';
      const prefix = activeEmail ? activeEmail.split('@')[0] : '';
      const defaultName =
        userProfile?.displayName ||
        (prefix ? prefix.charAt(0).toUpperCase() + prefix.slice(1).replace(/[._-]/g, ' ') : 'Member');
      const defaultUser =
        userProfile?.username ||
        (prefix ? prefix.toLowerCase() : 'member');

      setDisplayName(defaultName);
      setUsername(defaultUser);
      if (userProfile) {
        setProfile(userProfile);
      }

      getCurrentUserProfile(userEmail, userId).then((p) => {
        if (p) {
          setProfile(p);
          if (p.displayName) setDisplayName(p.displayName);
          if (p.username) setUsername(p.username);
        }
        setLoadingProfile(false);
      });
    }
  }, [visible, userEmail, userId, userProfile]);

  const handleSaveProfile = async () => {
    setSavingProfile(true);
    setProfileStatus(null);

    const result = await updateUserProfile({
      displayName,
      username,
    });

    setSavingProfile(false);

    if (result.success && result.profile) {
      setProfile(result.profile);
      setProfileStatus({ type: 'success', text: 'Profile updated successfully.' });
      if (onProfileUpdated) {
        onProfileUpdated(result.profile);
      }
      setTimeout(() => setProfileStatus(null), 3000);
    } else {
      setProfileStatus({ type: 'error', text: result.error || 'Failed to update profile.' });
    }
  };

  const handleChangePassword = async () => {
    setSavingPassword(true);
    setPasswordStatus(null);

    const result = await changeUserPassword({
      currentPassword,
      newPassword,
      confirmPassword,
    });

    setSavingPassword(false);

    if (result.success) {
      setPasswordStatus({ type: 'success', text: 'Password changed successfully.' });
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      setTimeout(() => setPasswordStatus(null), 3500);
    } else {
      setPasswordStatus({ type: 'error', text: result.error || 'Failed to change password.' });
    }
  };

  if (!visible) return null;

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={[styles.modalBox, { backgroundColor: theme.surface, borderColor: theme.borderSubtle }]}>
          {/* Header */}
          <View style={[styles.header, { borderBottomColor: theme.borderSubtle }]}>
            <View>
              <Text style={[styles.subtitle, { color: theme.textMuted }]}>ACCOUNT MANAGEMENT</Text>
              <Text style={[styles.title, { color: theme.text }]}>Settings & Profile</Text>
            </View>
            <TouchableOpacity
              onPress={onClose}
              style={[styles.closeBtn, { backgroundColor: theme.surfaceHighlight, borderColor: theme.borderSubtle }]}
              accessibilityLabel="Close"
            >
              <X size={16} color={theme.textSecondary} />
            </TouchableOpacity>
          </View>

          {/* Segmented Tabs */}
          <View style={[styles.tabBar, { backgroundColor: theme.surfaceHighlight, borderColor: theme.borderSubtle }]}>
            <TouchableOpacity
              style={[
                styles.tabBtn,
                activeTab === 'profile' && [
                  styles.tabBtnActive,
                  { backgroundColor: theme.surface, borderColor: theme.borderSubtle },
                ],
              ]}
              onPress={() => setActiveTab('profile')}
              activeOpacity={0.7}
            >
              <User size={13} color={activeTab === 'profile' ? theme.text : theme.textSecondary} />
              <Text
                style={[
                  styles.tabBtnText,
                  { color: activeTab === 'profile' ? theme.text : theme.textSecondary },
                ]}
              >
                Profile & Name
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.tabBtn,
                activeTab === 'security' && [
                  styles.tabBtnActive,
                  { backgroundColor: theme.surface, borderColor: theme.borderSubtle },
                ],
              ]}
              onPress={() => setActiveTab('security')}
              activeOpacity={0.7}
            >
              <Shield size={13} color={activeTab === 'security' ? theme.text : theme.textSecondary} />
              <Text
                style={[
                  styles.tabBtnText,
                  { color: activeTab === 'security' ? theme.text : theme.textSecondary },
                ]}
              >
                Security & Password
              </Text>
            </TouchableOpacity>
          </View>

          {/* Content Area */}
          <ScrollView style={styles.bodyScroll} contentContainerStyle={styles.bodyContent} showsVerticalScrollIndicator={false}>
            {loadingProfile ? (
              <View style={styles.loaderWrap}>
                <ActivityIndicator size="small" color={isDark ? '#39D353' : '#1A7F37'} />
                <Text style={[styles.loaderText, { color: theme.textSecondary }]}>Loading account details...</Text>
              </View>
            ) : activeTab === 'profile' ? (
              <View style={styles.sectionWrap}>
                {profileStatus && (
                  <View
                    style={[
                      styles.alertBadge,
                      {
                        backgroundColor: profileStatus.type === 'success' ? 'rgba(57, 211, 83, 0.12)' : 'rgba(239, 68, 68, 0.12)',
                        borderColor: profileStatus.type === 'success' ? '#39D353' : '#EF4444',
                      },
                    ]}
                  >
                    <Text
                      style={[
                        styles.alertText,
                        { color: profileStatus.type === 'success' ? '#39D353' : '#EF4444' },
                      ]}
                    >
                      {profileStatus.text}
                    </Text>
                  </View>
                )}

                {/* Display Name */}
                <View style={styles.inputGroup}>
                  <Text style={[styles.inputLabel, { color: theme.textSecondary }]}>DISPLAY NAME</Text>
                  <TextInput
                    style={[
                      styles.textInput,
                      {
                        backgroundColor: theme.surfaceHighlight,
                        borderColor: theme.borderSubtle,
                        color: theme.text,
                      },
                    ]}
                    value={displayName}
                    onChangeText={setDisplayName}
                    placeholder="e.g. Alex Rivera"
                    placeholderTextColor={theme.textMuted}
                    autoCapitalize="words"
                  />
                  <Text style={[styles.inputHint, { color: theme.textMuted }]}>
                    Your full name displayed on your dashboard and habit cards.
                  </Text>
                </View>

                {/* Username */}
                <View style={styles.inputGroup}>
                  <Text style={[styles.inputLabel, { color: theme.textSecondary }]}>ACCOUNT USERNAME</Text>
                  <View
                    style={[
                      styles.usernameRow,
                      {
                        backgroundColor: theme.surfaceHighlight,
                        borderColor: theme.borderSubtle,
                      },
                    ]}
                  >
                    <Text style={[styles.atPrefix, { color: theme.textMuted }]}>@</Text>
                    <TextInput
                      style={[styles.usernameInput, { color: theme.text }]}
                      value={username}
                      onChangeText={(t) => setUsername(t.replace(/[^a-zA-Z0-9_.-]/g, ''))}
                      placeholder="username"
                      placeholderTextColor={theme.textMuted}
                      autoCapitalize="none"
                      autoCorrect={false}
                    />
                  </View>
                  <Text style={[styles.inputHint, { color: theme.textMuted }]}>
                    Allows logging in using <Text style={{ color: theme.text, fontWeight: '700' }}>@{username || 'username'}</Text> instead of typing your email.
                  </Text>
                </View>

                {/* Email (Readonly) */}
                <View style={styles.inputGroup}>
                  <Text style={[styles.inputLabel, { color: theme.textSecondary }]}>EMAIL ADDRESS</Text>
                  <View
                    style={[
                      styles.readonlyRow,
                      {
                        backgroundColor: theme.surfaceHighlight,
                        borderColor: theme.borderSubtle,
                      },
                    ]}
                  >
                    <Mail size={14} color={theme.textMuted} />
                    <Text style={[styles.readonlyText, { color: theme.textSecondary }]}>
                      {profile?.email || userEmail || 'Offline Local Mode'}
                    </Text>
                    {(profile?.email || userEmail) ? (
                      <View style={styles.verifiedTag}>
                        <Check size={11} color="#39D353" strokeWidth={3} />
                        <Text style={styles.verifiedText}>Active</Text>
                      </View>
                    ) : (
                      <View style={[styles.verifiedTag, { borderColor: theme.borderSubtle, backgroundColor: theme.surfaceHighlight }]}>
                        <Text style={[styles.verifiedText, { color: theme.textSecondary }]}>Guest</Text>
                      </View>
                    )}
                  </View>
                </View>

                {/* Save Profile Button */}
                <TouchableOpacity
                  style={[
                    styles.primaryBtn,
                    { backgroundColor: isDark ? '#39D353' : '#1A7F37' },
                  ]}
                  onPress={handleSaveProfile}
                  disabled={savingProfile}
                  activeOpacity={0.85}
                >
                  {savingProfile ? (
                    <ActivityIndicator size="small" color="#FFFFFF" />
                  ) : (
                    <>
                      <Check size={15} color="#FFFFFF" strokeWidth={2.5} />
                      <Text style={styles.primaryBtnText}>Save Profile Changes</Text>
                    </>
                  )}
                </TouchableOpacity>

                {/* Cloud Synchronization Card */}
                {userEmail ? (
                  <View
                    style={[
                      styles.syncCard,
                      {
                        backgroundColor: theme.surfaceHighlight,
                        borderColor: theme.borderSubtle,
                      },
                    ]}
                  >
                    <View style={styles.syncCardHeader}>
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 7 }}>
                        <RefreshCw
                          size={13}
                          color={syncStatus === 'synced' ? '#39D353' : theme.textSecondary}
                          strokeWidth={syncStatus === 'syncing' ? 2.5 : 2}
                        />
                        <Text style={[styles.syncCardTitle, { color: theme.text }]}>Cloud Synchronization</Text>
                      </View>
                      {onSync ? (
                        <TouchableOpacity
                          style={[
                            styles.syncNowBtn,
                            {
                              backgroundColor: isDark ? '#21262D' : '#FFFFFF',
                              borderColor: theme.borderSubtle,
                            },
                          ]}
                          onPress={onSync}
                          disabled={syncStatus === 'syncing'}
                          activeOpacity={0.7}
                        >
                          {syncStatus === 'syncing' ? (
                            <ActivityIndicator size="small" color={theme.text} />
                          ) : (
                            <Text style={[styles.syncNowText, { color: theme.text }]}>
                              {syncStatus === 'synced' ? 'Synced ✓' : 'Sync Now'}
                            </Text>
                          )}
                        </TouchableOpacity>
                      ) : null}
                    </View>
                    <Text style={[styles.syncCardDesc, { color: theme.textMuted }]}>
                      Your habits, logs, and streaks are backed up to Supabase and synchronized across Web, Mobile, and macOS. Last synced: {lastSyncStr}.
                    </Text>
                  </View>
                ) : null}
              </View>
            ) : (
              <View style={styles.sectionWrap}>
                {passwordStatus && (
                  <View
                    style={[
                      styles.alertBadge,
                      {
                        backgroundColor: passwordStatus.type === 'success' ? 'rgba(57, 211, 83, 0.12)' : 'rgba(239, 68, 68, 0.12)',
                        borderColor: passwordStatus.type === 'success' ? '#39D353' : '#EF4444',
                      },
                    ]}
                  >
                    <Text
                      style={[
                        styles.alertText,
                        { color: passwordStatus.type === 'success' ? '#39D353' : '#EF4444' },
                      ]}
                    >
                      {passwordStatus.text}
                    </Text>
                  </View>
                )}

                {/* Current Password */}
                <View style={styles.inputGroup}>
                  <Text style={[styles.inputLabel, { color: theme.textSecondary }]}>CURRENT PASSWORD</Text>
                  <View
                    style={[
                      styles.passwordInputRow,
                      {
                        backgroundColor: theme.surfaceHighlight,
                        borderColor: theme.borderSubtle,
                      },
                    ]}
                  >
                    <TextInput
                      style={[styles.passwordField, { color: theme.text }]}
                      value={currentPassword}
                      onChangeText={setCurrentPassword}
                      placeholder="Enter your current password"
                      placeholderTextColor={theme.textMuted}
                      secureTextEntry={!showCurrentPassword}
                      autoCapitalize="none"
                    />
                    <TouchableOpacity
                      onPress={() => setShowCurrentPassword(!showCurrentPassword)}
                      style={styles.eyeBtn}
                    >
                      {showCurrentPassword ? (
                        <EyeOff size={15} color={theme.textMuted} />
                      ) : (
                        <Eye size={15} color={theme.textMuted} />
                      )}
                    </TouchableOpacity>
                  </View>
                  <Text style={[styles.inputHint, { color: theme.textMuted }]}>
                    Required for security verification before updating.
                  </Text>
                </View>

                {/* New Password */}
                <View style={styles.inputGroup}>
                  <Text style={[styles.inputLabel, { color: theme.textSecondary }]}>NEW PASSWORD</Text>
                  <View
                    style={[
                      styles.passwordInputRow,
                      {
                        backgroundColor: theme.surfaceHighlight,
                        borderColor: theme.borderSubtle,
                      },
                    ]}
                  >
                    <TextInput
                      style={[styles.passwordField, { color: theme.text }]}
                      value={newPassword}
                      onChangeText={setNewPassword}
                      placeholder="Minimum 8 characters"
                      placeholderTextColor={theme.textMuted}
                      secureTextEntry={!showNewPassword}
                      autoCapitalize="none"
                    />
                    <TouchableOpacity
                      onPress={() => setShowNewPassword(!showNewPassword)}
                      style={styles.eyeBtn}
                    >
                      {showNewPassword ? (
                        <EyeOff size={15} color={theme.textMuted} />
                      ) : (
                        <Eye size={15} color={theme.textMuted} />
                      )}
                    </TouchableOpacity>
                  </View>
                  <Text style={[styles.inputHint, { color: theme.textMuted }]}>
                    Must be 8+ characters and contain both letters and numbers/symbols.
                  </Text>
                </View>

                {/* Confirm Password */}
                <View style={styles.inputGroup}>
                  <Text style={[styles.inputLabel, { color: theme.textSecondary }]}>CONFIRM NEW PASSWORD</Text>
                  <View
                    style={[
                      styles.passwordInputRow,
                      {
                        backgroundColor: theme.surfaceHighlight,
                        borderColor: theme.borderSubtle,
                      },
                    ]}
                  >
                    <TextInput
                      style={[styles.passwordField, { color: theme.text }]}
                      value={confirmPassword}
                      onChangeText={setConfirmPassword}
                      placeholder="Re-enter new password"
                      placeholderTextColor={theme.textMuted}
                      secureTextEntry={!showNewPassword}
                      autoCapitalize="none"
                    />
                  </View>
                </View>

                {/* Submit Change Password */}
                <TouchableOpacity
                  style={[
                    styles.primaryBtn,
                    { backgroundColor: isDark ? '#39D353' : '#1A7F37' },
                  ]}
                  onPress={handleChangePassword}
                  disabled={savingPassword}
                  activeOpacity={0.85}
                >
                  {savingPassword ? (
                    <ActivityIndicator size="small" color="#FFFFFF" />
                  ) : (
                    <>
                      <Lock size={15} color="#FFFFFF" strokeWidth={2.5} />
                      <Text style={styles.primaryBtnText}>Update Password</Text>
                    </>
                  )}
                </TouchableOpacity>
              </View>
            )}

            {/* Logout Row */}
            <View style={[styles.logoutSection, { borderTopColor: theme.borderSubtle }]}>
              <TouchableOpacity
                style={[
                  styles.logoutBtn,
                  {
                    borderColor: isDark ? 'rgba(239, 68, 68, 0.25)' : 'rgba(239, 68, 68, 0.2)',
                    backgroundColor: isDark ? 'rgba(239, 68, 68, 0.08)' : 'rgba(239, 68, 68, 0.05)',
                  },
                ]}
                onPress={() => {
                  onClose();
                  onLogout();
                }}
                activeOpacity={0.7}
                accessibilityLabel="Log out"
              >
                <LogOut size={14} color="#EF4444" strokeWidth={2} />
                <Text style={styles.logoutBtnText}>Log Out</Text>
              </TouchableOpacity>
            </View>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.72)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  modalBox: {
    width: '100%',
    maxWidth: 480,
    maxHeight: '90%',
    borderRadius: 14,
    borderWidth: 1,
    overflow: 'hidden',
    ...(Platform.OS === 'web'
      ? {
          boxShadow: '0 20px 48px -12px rgba(0, 0, 0, 0.8), 0 0 0 1px rgba(255, 255, 255, 0.08)',
        }
      : {
          elevation: 12,
        }),
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
  },
  subtitle: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 1,
    fontFamily: fontStack,
    marginBottom: 2,
  },
  title: {
    fontSize: 17,
    fontWeight: '800',
    letterSpacing: -0.2,
    fontFamily: fontStack,
  },
  closeBtn: {
    width: 30,
    height: 30,
    borderRadius: 7,
    borderWidth: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  tabBar: {
    flexDirection: 'row',
    padding: 4,
    marginHorizontal: 20,
    marginTop: 14,
    borderRadius: 8,
    borderWidth: 1,
    gap: 4,
  },
  tabBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 8,
    borderRadius: 6,
  },
  tabBtnActive: {
    borderWidth: 1,
    ...(Platform.OS === 'web'
      ? {
          boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
        }
      : {}),
  },
  tabBtnText: {
    fontSize: 12,
    fontWeight: '700',
    fontFamily: fontStack,
  },
  bodyScroll: {
    flexGrow: 0,
  },
  bodyContent: {
    padding: 20,
  },
  loaderWrap: {
    paddingVertical: 36,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
  },
  loaderText: {
    fontSize: 12,
    fontFamily: fontStack,
  },
  sectionWrap: {
    gap: 16,
  },
  alertBadge: {
    paddingHorizontal: 12,
    paddingVertical: 9,
    borderRadius: 7,
    borderWidth: 1,
  },
  alertText: {
    fontSize: 12,
    fontWeight: '600',
    fontFamily: fontStack,
  },
  inputGroup: {
    gap: 6,
  },
  inputLabel: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.8,
    fontFamily: fontStack,
  },
  inputHint: {
    fontSize: 11,
    lineHeight: 15,
    fontFamily: fontStack,
  },
  textInput: {
    height: 40,
    borderRadius: 8,
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 0,
    textAlignVertical: 'center',
    fontSize: 13,
    fontFamily: fontStack,
    ...(Platform.OS === 'android' ? { includeFontPadding: false } : {}),
    ...(Platform.OS === 'web' ? ({ outlineStyle: 'none' } as any) : {}),
  },
  usernameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 40,
    borderRadius: 8,
    borderWidth: 1,
    paddingHorizontal: 12,
  },
  atPrefix: {
    fontSize: 14,
    fontWeight: '700',
    marginRight: 4,
    fontFamily: fontStack,
  },
  usernameInput: {
    flex: 1,
    fontSize: 13,
    fontFamily: fontStack,
    paddingVertical: 0,
    textAlignVertical: 'center',
    ...(Platform.OS === 'android' ? { includeFontPadding: false } : {}),
    ...(Platform.OS === 'web' ? ({ outlineStyle: 'none' } as any) : {}),
  },
  readonlyRow: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 40,
    borderRadius: 8,
    borderWidth: 1,
    paddingHorizontal: 12,
    gap: 8,
  },
  readonlyText: {
    flex: 1,
    fontSize: 13,
    fontFamily: fontStack,
  },
  verifiedTag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(57, 211, 83, 0.15)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  verifiedText: {
    color: '#39D353',
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.5,
    fontFamily: fontStack,
  },
  passwordInputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 40,
    borderRadius: 8,
    borderWidth: 1,
    paddingHorizontal: 12,
  },
  passwordField: {
    flex: 1,
    fontSize: 13,
    fontFamily: fontStack,
    paddingVertical: 0,
    textAlignVertical: 'center',
    ...(Platform.OS === 'android' ? { includeFontPadding: false } : {}),
    ...(Platform.OS === 'web' ? ({ outlineStyle: 'none' } as any) : {}),
  },
  eyeBtn: {
    padding: 6,
  },
  primaryBtn: {
    height: 38,
    borderRadius: 8,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginTop: 6,
  },
  primaryBtnText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '700',
    fontFamily: fontStack,
  },
  syncCard: {
    marginTop: 14,
    borderRadius: 8,
    borderWidth: 1,
    padding: 12,
    gap: 6,
  },
  syncCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  syncCardTitle: {
    fontSize: 12,
    fontWeight: '700',
    fontFamily: fontStack,
  },
  syncNowBtn: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
    borderWidth: 1,
  },
  syncNowText: {
    fontSize: 11,
    fontWeight: '700',
    fontFamily: fontStack,
  },
  syncCardDesc: {
    fontSize: 11,
    fontFamily: fontStack,
    lineHeight: 15,
  },
  logoutSection: {
    marginTop: 22,
    paddingTop: 16,
    borderTopWidth: 1,
  },
  logoutBtn: {
    height: 40,
    borderRadius: 8,
    borderWidth: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  logoutBtnText: {
    color: '#EF4444',
    fontSize: 13,
    fontWeight: '700',
    fontFamily: fontStack,
  },
});

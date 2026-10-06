import React, { useState, useEffect, useRef } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Platform,
  ActivityIndicator,
  Image,
  KeyboardAvoidingView,
  ScrollView,
  Keyboard,
} from 'react-native';
import { ArrowLeft, Lock, Mail, Eye, EyeOff, Check, User, AtSign, ArrowRight, ShieldCheck } from 'lucide-react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { supabase } from '../utils/supabase';
import { useAppTheme, useIsDark } from '../theme/theme';
import { isMacDesktop, shouldSkipLanding, dragRegion, noDragRegion } from '../utils/platform';
import { resolveEmailFromIdentifier, storeUsernameMapping, isUsernameAvailable } from '../services/accountService';

interface LoginScreenProps {
  onBack?: () => void;
  onLoginSuccess: () => void;
  onContinueAsGuest?: () => void;
}

const fontStack = Platform.select({
  web: '"SF Pro Rounded", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
  ios: 'System',
  default: 'sans-serif',
});

export const LoginScreen: React.FC<LoginScreenProps> = ({
  onBack,
  onLoginSuccess,
  onContinueAsGuest,
}) => {
  const theme = useAppTheme();
  const isDark = useIsDark();

  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [username, setUsername] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [focusedField, setFocusedField] = useState<'identifier' | 'password' | 'name' | 'username' | null>(null);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [infoMsg, setInfoMsg] = useState('');
  const [isSignUp, setIsSignUp] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);

  useEffect(() => {
    AsyncStorage.getItem('@trackheat_remembered_email').then((saved) => {
      if (saved) {
        setIdentifier(saved);
      } else {
        AsyncStorage.getItem('@habitheat_remembered_email').then((legacy) => {
          if (legacy) setIdentifier(legacy);
        });
      }
    });
  }, []);

  const [keyboardVisible, setKeyboardVisible] = useState(false);
  const [keyboardHeight, setKeyboardHeight] = useState(0);
  const scrollViewRef = useRef<ScrollView>(null);

  useEffect(() => {
    const showEvent = Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow';
    const hideEvent = Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide';

    const showSub = Keyboard.addListener(showEvent, (e) => {
      setKeyboardVisible(true);
      setKeyboardHeight(e.endCoordinates?.height || 280);
    });
    const hideSub = Keyboard.addListener(hideEvent, () => {
      setKeyboardVisible(false);
      setKeyboardHeight(0);
    });

    return () => {
      showSub.remove();
      hideSub.remove();
    };
  }, []);

  const handleAuth = async () => {
    if (!identifier.trim() || !password) {
      setErrorMsg('Please enter both your login identifier and password.');
      return;
    }
    setLoading(true);
    setErrorMsg('');
    setInfoMsg('');

    try {
      if (isSignUp) {
        const cleanEmail = identifier.trim().toLowerCase();
        if (!cleanEmail.includes('@')) {
          setErrorMsg('Please enter a valid email address for account registration.');
          setLoading(false);
          return;
        }

        if (password.length < 8) {
          setErrorMsg('Password must be at least 8 characters.');
          setLoading(false);
          return;
        }

        const cleanUsername = username.trim().replace(/^@/, '').toLowerCase();
        if (cleanUsername) {
          const check = await isUsernameAvailable(cleanUsername);
          if (!check.available) {
            setErrorMsg(check.error || `@${cleanUsername} is already taken by another account.`);
            setLoading(false);
            return;
          }
        }

        const cleanName = displayName.trim() || cleanUsername;

        const { data, error } = await supabase.auth.signUp({
          email: cleanEmail,
          password,
          options: {
            data: {
              full_name: cleanName,
              display_name: cleanName,
              username: cleanUsername,
            },
          },
        });
        if (error) throw error;

        if (cleanUsername) {
          await storeUsernameMapping(cleanUsername, cleanEmail);
          if (data.session?.user?.id) {
            try {
              await supabase.from('profiles').upsert({
                id: data.session.user.id,
                username: cleanUsername,
                display_name: cleanName,
                email: cleanEmail,
                updated_at: new Date().toISOString(),
              });
            } catch {
              // Fallback if profiles table is not yet created
            }
          }
        }

        if (data.session) {
          if (rememberMe) {
            await AsyncStorage.setItem('@trackheat_remembered_email', cleanEmail);
          } else {
            await AsyncStorage.removeItem('@trackheat_remembered_email');
          }
          onLoginSuccess();
        } else {
          setInfoMsg('Account created. Check your inbox for confirmation link, or log in.');
        }
      } else {
        // Sign In: support either email or username
        const resolvedEmail = await resolveEmailFromIdentifier(identifier);

        if (!resolvedEmail.includes('@')) {
          setErrorMsg(`No account found for username "${identifier}" on this device. Please sign in with your email address once to link your username.`);
          setLoading(false);
          return;
        }

        const { data, error } = await supabase.auth.signInWithPassword({
          email: resolvedEmail,
          password,
        });
        if (error) throw error;

        if (data.session) {
          if (rememberMe) {
            await AsyncStorage.setItem('@trackheat_remembered_email', resolvedEmail);
          } else {
            await AsyncStorage.removeItem('@trackheat_remembered_email');
          }

          const metaUsername = data.session.user?.user_metadata?.username;
          if (metaUsername && resolvedEmail) {
            await storeUsernameMapping(metaUsername, resolvedEmail);
          }
          if (resolvedEmail.includes('@')) {
            const prefix = resolvedEmail.split('@')[0].toLowerCase();
            await storeUsernameMapping(prefix, resolvedEmail);
          }

          onLoginSuccess();
        }
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Authentication failed. Please check credentials.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={[styles.container, { backgroundColor: theme.background }, dragRegion]}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 25}
    >
      <ScrollView
        ref={scrollViewRef}
        style={styles.scrollView}
        contentContainerStyle={[
          styles.scrollContent,
          keyboardVisible && styles.scrollContentKeyboard,
          {
            paddingTop: isMacDesktop ? 44 : Platform.OS === 'web' ? 36 : 48,
            paddingBottom: keyboardVisible ? (Platform.OS === 'android' ? 220 : 140) : 48,
          },
        ]}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
        bounces={true}
      >
        {/* Back Button (Only rendered when landing page exists, i.e. on web browser) */}
        {!shouldSkipLanding && onBack && (
          <TouchableOpacity
            style={[
              styles.backBtn,
              noDragRegion,
              {
                top: isMacDesktop ? 40 : 24,
                left: 24,
                backgroundColor: isDark ? '#161B22' : '#FFFFFF',
                borderColor: isDark ? '#30363D' : '#D0D7DE',
                ...(Platform.OS === 'web'
                  ? {
                      boxShadow: isDark
                        ? '0 2px 8px rgba(0, 0, 0, 0.4)'
                        : '0 2px 8px rgba(0, 0, 0, 0.05)',
                    }
                  : {}),
              },
            ]}
            onPress={onBack}
            activeOpacity={0.7}
            accessibilityLabel="Go back to landing page"
          >
            <ArrowLeft color={theme.textSecondary} size={18} />
          </TouchableOpacity>
        )}

        <View style={[styles.cardWrapper, noDragRegion]}>
          {/* Header Brand */}
          <View style={styles.header}>
            <View
              style={[
                styles.logoBadge,
                {
                  backgroundColor: isDark ? '#161B22' : '#FFFFFF',
                  borderColor: isDark ? '#30363D' : '#D0D7DE',
                  ...(Platform.OS === 'web'
                    ? {
                        boxShadow: isDark
                          ? '0 4px 16px rgba(0, 0, 0, 0.4)'
                          : '0 4px 16px rgba(0, 0, 0, 0.06)',
                      }
                    : {}),
                },
              ]}
            >
              <Image
                source={require('../../assets/icon.png')}
                style={styles.logoImage}
                resizeMode="contain"
              />
            </View>

            <Text style={[styles.title, { color: theme.text }]}>TrackHeat</Text>
            <Text style={[styles.subtitle, { color: theme.textSecondary }]}>
              {isSignUp
                ? 'Create your account to sync habit matrices across all devices.'
                : 'Sign in to continue your daily consistency momentum.'}
            </Text>
          </View>

          {/* Clean Segmented Mode Pill */}
          <View style={[styles.modeSegmentTrack, { backgroundColor: theme.surfaceHighlight, borderColor: theme.borderSubtle }]}>
            <TouchableOpacity
              style={[
                styles.modeSegmentBtn,
                !isSignUp && [
                  styles.modeSegmentBtnActive,
                  { backgroundColor: theme.surface, borderColor: theme.borderSubtle },
                ],
              ]}
              onPress={() => {
                setIsSignUp(false);
                setErrorMsg('');
                setInfoMsg('');
              }}
              activeOpacity={0.7}
            >
              <Text
                style={[
                  styles.modeSegmentText,
                  { color: !isSignUp ? theme.text : theme.textSecondary },
                  !isSignUp && styles.modeSegmentTextActive,
                ]}
              >
                Sign In
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.modeSegmentBtn,
                isSignUp && [
                  styles.modeSegmentBtnActive,
                  { backgroundColor: theme.surface, borderColor: theme.borderSubtle },
                ],
              ]}
              onPress={() => {
                setIsSignUp(true);
                setErrorMsg('');
                setInfoMsg('');
              }}
              activeOpacity={0.7}
            >
              <Text
                style={[
                  styles.modeSegmentText,
                  { color: isSignUp ? theme.text : theme.textSecondary },
                  isSignUp && styles.modeSegmentTextActive,
                ]}
              >
                Create Account
              </Text>
            </TouchableOpacity>
          </View>

          {/* Form Card */}
          <View
            style={[
              styles.card,
              {
                backgroundColor: isDark ? '#161B22' : '#FFFFFF',
                borderColor: isDark ? '#30363D' : '#D0D7DE',
                ...(Platform.OS === 'web'
                  ? {
                      boxShadow: isDark
                        ? '0 0 0 1px rgba(255, 255, 255, 0.05), 0 8px 24px -4px rgba(0, 0, 0, 0.6), 0 20px 48px -12px rgba(0, 0, 0, 0.8)'
                        : '0 0 0 1px rgba(0, 0, 0, 0.04), 0 1px 3px rgba(0, 0, 0, 0.05), 0 12px 32px -4px rgba(0, 0, 0, 0.08), 0 4px 12px -2px rgba(0, 0, 0, 0.03)',
                    }
                  : {
                      shadowColor: '#000000',
                      shadowOffset: { width: 0, height: 8 },
                      shadowOpacity: isDark ? 0.4 : 0.08,
                      shadowRadius: 24,
                      elevation: 6,
                    }),
              },
            ]}
          >
            {errorMsg ? (
              <View style={[styles.alertBox, { backgroundColor: 'rgba(248, 81, 73, 0.1)', borderColor: theme.error }]}>
                <Text style={[styles.alertText, { color: theme.error }]}>{errorMsg}</Text>
              </View>
            ) : null}

            {infoMsg ? (
              <View style={[styles.alertBox, { backgroundColor: 'rgba(57, 211, 83, 0.1)', borderColor: theme.success }]}>
                <Text style={[styles.alertText, { color: theme.success }]}>{infoMsg}</Text>
              </View>
            ) : null}

            {/* Optional Name & Username in Sign Up Mode */}
            {isSignUp && (
              <>
                <View style={styles.inputGroup}>
                  <Text style={[styles.label, { color: theme.textSecondary }]}>Your Name (Optional)</Text>
                  <View
                    style={[
                      styles.inputWrapper,
                      {
                        backgroundColor: isDark ? '#0D1117' : '#FFFFFF',
                        borderColor:
                          focusedField === 'name'
                            ? isDark
                              ? '#39D353'
                              : '#1A7F37'
                            : isDark
                            ? '#30363D'
                            : '#D0D7DE',
                      },
                    ]}
                  >
                    <User
                      size={15}
                      color={focusedField === 'name' ? (isDark ? '#39D353' : '#1A7F37') : theme.textMuted}
                      style={styles.inputIcon}
                    />
                    <TextInput
                      style={[styles.input, { color: theme.text }]}
                      placeholder="e.g. Alex Rivera"
                      placeholderTextColor={theme.textMuted}
                      autoCapitalize="words"
                      value={displayName}
                      onFocus={() => setFocusedField('name')}
                      onBlur={() => setFocusedField(null)}
                      onChangeText={setDisplayName}
                    />
                  </View>
                </View>

                <View style={styles.inputGroup}>
                  <Text style={[styles.label, { color: theme.textSecondary }]}>Username (Optional Handle)</Text>
                  <View
                    style={[
                      styles.inputWrapper,
                      {
                        backgroundColor: isDark ? '#0D1117' : '#FFFFFF',
                        borderColor:
                          focusedField === 'username'
                            ? isDark
                              ? '#39D353'
                              : '#1A7F37'
                            : isDark
                            ? '#30363D'
                            : '#D0D7DE',
                      },
                    ]}
                  >
                    <AtSign
                      size={15}
                      color={focusedField === 'username' ? (isDark ? '#39D353' : '#1A7F37') : theme.textMuted}
                      style={styles.inputIcon}
                    />
                    <TextInput
                      style={[styles.input, { color: theme.text }]}
                      placeholder="username (for instant 1-word login)"
                      placeholderTextColor={theme.textMuted}
                      autoCapitalize="none"
                      autoCorrect={false}
                      value={username}
                      onFocus={() => setFocusedField('username')}
                      onBlur={() => setFocusedField(null)}
                      onChangeText={(t) => setUsername(t.replace(/[^a-zA-Z0-9_.-]/g, ''))}
                    />
                  </View>
                </View>
              </>
            )}

            {/* Email / Identifier */}
            <View style={styles.inputGroup}>
              <Text style={[styles.label, { color: theme.textSecondary }]}>
                {isSignUp ? 'Email Address' : 'Username or Email'}
              </Text>
              <View
                style={[
                  styles.inputWrapper,
                  {
                    backgroundColor: isDark ? '#0D1117' : '#FFFFFF',
                    borderColor:
                      focusedField === 'identifier'
                        ? isDark
                          ? '#39D353'
                          : '#1A7F37'
                        : isDark
                        ? '#30363D'
                        : '#D0D7DE',
                    ...(Platform.OS === 'web' && focusedField === 'identifier'
                      ? {
                          boxShadow: isDark
                            ? '0 0 0 3px rgba(57, 211, 83, 0.25)'
                            : '0 0 0 3px rgba(26, 127, 55, 0.15)',
                        }
                      : {}),
                  },
                ]}
              >
                <Mail
                  size={15}
                  color={focusedField === 'identifier' ? (isDark ? '#39D353' : '#1A7F37') : theme.textMuted}
                  style={styles.inputIcon}
                />
                <TextInput
                  style={[styles.input, { color: theme.text }]}
                  placeholder={isSignUp ? 'name@example.com' : 'name@example.com or @username'}
                  placeholderTextColor={theme.textMuted}
                  keyboardType={isSignUp ? 'email-address' : 'default'}
                  autoCapitalize="none"
                  autoCorrect={false}
                  value={identifier}
                  onFocus={() => {
                    setFocusedField('identifier');
                    setTimeout(() => {
                      scrollViewRef.current?.scrollTo({ y: 40, animated: true });
                    }, 120);
                  }}
                  onBlur={() => setFocusedField(null)}
                  onChangeText={(t) => {
                    setIdentifier(t);
                    setErrorMsg('');
                  }}
                />
              </View>
            </View>

            {/* Password */}
            <View style={styles.inputGroup}>
              <Text style={[styles.label, { color: theme.textSecondary }]}>Password</Text>
              <View
                style={[
                  styles.inputWrapper,
                  {
                    backgroundColor: isDark ? '#0D1117' : '#FFFFFF',
                    borderColor:
                      focusedField === 'password'
                        ? isDark
                          ? '#39D353'
                          : '#1A7F37'
                        : isDark
                        ? '#30363D'
                        : '#D0D7DE',
                    ...(Platform.OS === 'web' && focusedField === 'password'
                      ? {
                          boxShadow: isDark
                            ? '0 0 0 3px rgba(57, 211, 83, 0.25)'
                            : '0 0 0 3px rgba(26, 127, 55, 0.15)',
                        }
                      : {}),
                  },
                ]}
              >
                <Lock
                  size={15}
                  color={focusedField === 'password' ? (isDark ? '#39D353' : '#1A7F37') : theme.textMuted}
                  style={styles.inputIcon}
                />
                <TextInput
                  style={[styles.input, { color: theme.text }]}
                  placeholder={isSignUp ? 'Minimum 8 characters' : 'Enter your password'}
                  placeholderTextColor={theme.textMuted}
                  secureTextEntry={!showPassword}
                  value={password}
                  onFocus={() => {
                    setFocusedField('password');
                    setTimeout(() => {
                      scrollViewRef.current?.scrollTo({ y: 160, animated: true });
                    }, 120);
                  }}
                  onBlur={() => setFocusedField(null)}
                  onChangeText={(t) => {
                    setPassword(t);
                    setErrorMsg('');
                  }}
                />
                <TouchableOpacity
                  style={styles.eyeBtn}
                  onPress={() => setShowPassword((prev) => !prev)}
                  activeOpacity={0.6}
                  accessibilityLabel={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? (
                    <EyeOff size={15} color={theme.textMuted} />
                  ) : (
                    <Eye size={15} color={theme.textMuted} />
                  )}
                </TouchableOpacity>
              </View>
            </View>

            {/* Remember Me */}
            <TouchableOpacity
              style={styles.rememberRow}
              onPress={() => setRememberMe(!rememberMe)}
              activeOpacity={0.7}
            >
              <View
                style={[
                  styles.checkbox,
                  {
                    borderColor: rememberMe
                      ? isDark
                        ? '#39D353'
                        : '#1A7F37'
                      : isDark
                      ? '#30363D'
                      : '#D0D7DE',
                    backgroundColor: rememberMe
                      ? isDark
                        ? '#39D353'
                        : '#1A7F37'
                      : theme.surfaceHighlight,
                  },
                ]}
              >
                {rememberMe && <Check size={11} color="#FFFFFF" strokeWidth={3} />}
              </View>
              <Text style={[styles.rememberText, { color: theme.textSecondary }]}>
                Remember session on this device
              </Text>
            </TouchableOpacity>

            {/* Primary Submit */}
            <TouchableOpacity
              style={[styles.submitBtn, { backgroundColor: isDark ? '#39D353' : '#1A7F37' }]}
              onPress={handleAuth}
              activeOpacity={0.85}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color="#FFFFFF" />
              ) : (
                <Text style={styles.submitBtnText}>
                  {isSignUp ? 'Create Free Account' : 'Sign In'}
                </Text>
              )}
            </TouchableOpacity>
          </View>

          {/* Continue as Guest / Offline Mode Option */}
          {onContinueAsGuest && (
            <View style={styles.guestSection}>
              <TouchableOpacity
                style={[styles.guestBtn, { backgroundColor: theme.surfaceHighlight, borderColor: theme.borderSubtle }]}
                onPress={onContinueAsGuest}
                activeOpacity={0.7}
              >
                <Text style={[styles.guestBtnText, { color: theme.textSecondary }]}>
                  Continue as Guest <Text style={{ color: theme.textMuted }}>· Local Storage Only</Text>
                </Text>
                <ArrowRight size={13} color={theme.textSecondary} />
              </TouchableOpacity>
            </View>
          )}

          {/* Security & Encryption Micro Badge */}
          <View style={styles.securityBadge}>
            <ShieldCheck size={12} color={theme.textMuted} />
            <Text style={[styles.securityBadgeText, { color: theme.textMuted }]}>
              Encrypted auth with Supabase · Offline-first local backup
            </Text>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    paddingBottom: 48,
  },
  scrollContentKeyboard: {
    justifyContent: 'flex-start',
    paddingTop: Platform.OS === 'web' ? 24 : 32,
  },
  backBtn: {
    position: 'absolute',
    width: 36,
    height: 36,
    borderRadius: 9,
    borderWidth: 1,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 30,
  },
  cardWrapper: {
    width: '100%',
    maxWidth: 410,
  },
  header: {
    alignItems: 'center',
    marginBottom: 20,
  },
  logoBadge: {
    width: 48,
    height: 48,
    borderRadius: 13,
    borderWidth: 1,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
    overflow: 'hidden',
  },
  logoImage: {
    width: 30,
    height: 30,
  },
  title: {
    fontSize: 22,
    fontWeight: '800',
    fontFamily: fontStack,
    marginBottom: 4,
    letterSpacing: -0.3,
  },
  subtitle: {
    fontSize: 12.5,
    fontFamily: fontStack,
    textAlign: 'center',
    lineHeight: 17,
    maxWidth: 320,
  },
  modeSegmentTrack: {
    flexDirection: 'row',
    padding: 4,
    borderRadius: 10,
    borderWidth: 1,
    marginBottom: 16,
    gap: 4,
  },
  modeSegmentBtn: {
    flex: 1,
    paddingVertical: 7,
    borderRadius: 7,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modeSegmentBtnActive: {
    borderWidth: 1,
    ...(Platform.OS === 'web'
      ? {
          boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
        }
      : {
          elevation: 2,
        }),
  },
  modeSegmentText: {
    fontSize: 12.5,
    fontWeight: '600',
    fontFamily: fontStack,
  },
  modeSegmentTextActive: {
    fontWeight: '800',
  },
  card: {
    padding: 22,
    borderRadius: 14,
    borderWidth: 1,
  },
  alertBox: {
    padding: 10,
    borderRadius: 7,
    borderWidth: 1,
    marginBottom: 14,
  },
  alertText: {
    fontSize: 12,
    fontFamily: fontStack,
    lineHeight: 16,
  },
  inputGroup: {
    marginBottom: 14,
  },
  label: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.8,
    fontFamily: fontStack,
    marginBottom: 5,
    textTransform: 'uppercase',
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: 8,
    height: 40,
    paddingHorizontal: 12,
  },
  inputIcon: {
    marginRight: 9,
  },
  input: {
    flex: 1,
    fontSize: 13.5,
    fontFamily: fontStack,
    paddingVertical: 0,
    textAlignVertical: 'center',
    ...(Platform.OS === 'android' ? { includeFontPadding: false } : {}),
    ...(Platform.OS === 'web' ? ({ outlineStyle: 'none' } as any) : {}),
  },
  eyeBtn: {
    padding: 5,
  },
  rememberRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 18,
    marginTop: 2,
    gap: 8,
  },
  checkbox: {
    width: 17,
    height: 17,
    borderRadius: 4.5,
    borderWidth: 1.5,
    justifyContent: 'center',
    alignItems: 'center',
  },
  rememberText: {
    fontSize: 11.5,
    fontFamily: fontStack,
  },
  submitBtn: {
    height: 40,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  submitBtnText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '800',
    letterSpacing: 0.3,
    fontFamily: fontStack,
  },
  guestSection: {
    marginTop: 14,
  },
  guestBtn: {
    height: 38,
    borderRadius: 8,
    borderWidth: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingHorizontal: 14,
  },
  guestBtnText: {
    fontSize: 12,
    fontWeight: '600',
    fontFamily: fontStack,
  },
  securityBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 5,
    marginTop: 16,
  },
  securityBadgeText: {
    fontSize: 10.5,
    fontFamily: fontStack,
  },
});

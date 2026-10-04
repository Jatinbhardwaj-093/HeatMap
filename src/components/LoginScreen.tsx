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
import { ArrowLeft, Lock, Mail, Eye, EyeOff, Check } from 'lucide-react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { supabase } from '../utils/supabase';
import { useAppTheme, useIsDark } from '../theme/theme';

interface LoginScreenProps {
  onBack: () => void;
  onLoginSuccess: () => void;
}

const fontStack = Platform.select({
  web: '"SF Pro Rounded", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
  ios: 'System',
  default: 'sans-serif',
});

export const LoginScreen: React.FC<LoginScreenProps> = ({ onBack, onLoginSuccess }) => {
  const theme = useAppTheme();
  const isDark = useIsDark();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [focusedField, setFocusedField] = useState<'email' | 'password' | null>(null);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [infoMsg, setInfoMsg] = useState('');
  const [isSignUp, setIsSignUp] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);

  useEffect(() => {
    AsyncStorage.getItem('@habitheat_remembered_email').then((saved) => {
      if (saved) {
        setEmail(saved);
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
    if (!email || !password) {
      setErrorMsg('Please enter both email and password.');
      return;
    }
    setLoading(true);
    setErrorMsg('');
    setInfoMsg('');
    
    try {
      if (isSignUp) {
        const { data, error } = await supabase.auth.signUp({ email, password });
        if (error) throw error;
        
        if (data.session) {
          if (rememberMe) {
            await AsyncStorage.setItem('@habitheat_remembered_email', email);
          } else {
            await AsyncStorage.removeItem('@habitheat_remembered_email');
          }
          onLoginSuccess();
        } else {
          setInfoMsg('Account created. Check your inbox for confirmation link, or log in.');
        }
      } else {
        const { data, error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        if (data.session) {
          if (rememberMe) {
            await AsyncStorage.setItem('@habitheat_remembered_email', email);
          } else {
            await AsyncStorage.removeItem('@habitheat_remembered_email');
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
      style={[styles.container, { backgroundColor: theme.background }]}
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
            paddingBottom: keyboardVisible ? (Platform.OS === 'android' ? 220 : 140) : 48,
          },
        ]}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
        bounces={true}
      >
        <TouchableOpacity
          style={[
            styles.backBtn,
            {
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
          accessibilityLabel="Go back"
        >
          <ArrowLeft color={theme.textSecondary} size={18} />
        </TouchableOpacity>

        <View style={styles.cardWrapper}>
          <View style={styles.header}>
            {/* HabitHeat App Icon Badge */}
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

          <Text style={[styles.title, { color: theme.text }]}>
            {isSignUp ? 'Create your account' : 'Welcome back'}
          </Text>
          <Text style={[styles.subtitle, { color: theme.textSecondary }]}>
            {isSignUp
              ? 'Start building unbreakable habits with HabitHeat.'
              : 'Sign in to continue your daily momentum.'}
          </Text>
        </View>

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

          <View style={styles.inputGroup}>
            <Text style={[styles.label, { color: theme.text }]}>Email</Text>
            <View
              style={[
                styles.inputWrapper,
                {
                  backgroundColor: isDark ? '#0D1117' : '#FFFFFF',
                  borderColor:
                    focusedField === 'email'
                      ? isDark
                        ? '#39D353'
                        : '#1A7F37'
                      : isDark
                      ? '#30363D'
                      : '#D0D7DE',
                  ...(Platform.OS === 'web' && focusedField === 'email'
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
                size={16}
                color={focusedField === 'email' ? (isDark ? '#39D353' : '#1A7F37') : theme.textMuted}
                style={styles.inputIcon}
              />
              <TextInput
                style={[styles.input, { color: theme.text }]}
                placeholder="you@example.com"
                placeholderTextColor={theme.textMuted}
                keyboardType="email-address"
                autoCapitalize="none"
                value={email}
                onFocus={() => {
                  setFocusedField('email');
                  setTimeout(() => {
                    scrollViewRef.current?.scrollTo({ y: 40, animated: true });
                  }, 120);
                }}
                onBlur={() => setFocusedField(null)}
                onChangeText={(t) => {
                  setEmail(t);
                  setErrorMsg('');
                }}
              />
            </View>
          </View>

          <View style={styles.inputGroup}>
            <Text style={[styles.label, { color: theme.text }]}>Password</Text>
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
                size={16}
                color={focusedField === 'password' ? (isDark ? '#39D353' : '#1A7F37') : theme.textMuted}
                style={styles.inputIcon}
              />
              <TextInput
                style={[styles.input, { color: theme.text }]}
                placeholder="Enter your password"
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
                  <EyeOff size={16} color={theme.textMuted} />
                ) : (
                  <Eye size={16} color={theme.textMuted} />
                )}
              </TouchableOpacity>
            </View>
          </View>

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
              Remember login on this device
            </Text>
          </TouchableOpacity>

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

        <View style={styles.toggleFooter}>
          <Text style={[styles.footerText, { color: theme.textSecondary }]}>
            {isSignUp ? 'Already have an account? ' : "Don't have an account? "}
            <Text
              style={[styles.toggleLink, { color: isDark ? '#39D353' : '#1A7F37' }]}
              onPress={() => {
                setIsSignUp(!isSignUp);
                setErrorMsg('');
                setInfoMsg('');
              }}
            >
              {isSignUp ? 'Sign in' : 'Create account'}
            </Text>
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
    width: '100%',
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
    paddingTop: Platform.OS === 'web' ? 40 : 64,
    paddingBottom: 48,
  },
  scrollContentKeyboard: {
    justifyContent: 'flex-start',
    paddingTop: Platform.OS === 'web' ? 24 : 32,
  },
  backBtn: {
    position: 'absolute',
    top: Platform.OS === 'web' ? 24 : 16,
    left: Platform.OS === 'web' ? 24 : 16,
    width: 38,
    height: 38,
    borderRadius: 10,
    borderWidth: 1,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 30,
  },
  cardWrapper: {
    width: '100%',
    maxWidth: 400,
  },
  header: {
    alignItems: 'center',
    marginBottom: 24,
  },
  logoBadge: {
    width: 52,
    height: 52,
    borderRadius: 14,
    borderWidth: 1,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
    overflow: 'hidden',
  },
  logoImage: {
    width: 34,
    height: 34,
  },
  title: {
    fontSize: 22,
    fontWeight: '800',
    fontFamily: fontStack,
    marginBottom: 6,
    letterSpacing: -0.3,
  },
  subtitle: {
    fontSize: 13,
    textAlign: 'center',
    lineHeight: 18,
    fontFamily: fontStack,
    maxWidth: 300,
  },
  card: {
    borderWidth: 1,
    borderRadius: 16,
    padding: 26,
    gap: 18,
  },
  alertBox: {
    borderWidth: 1,
    borderRadius: 8,
    padding: 10,
  },
  alertText: {
    fontSize: 12,
    lineHeight: 16,
    fontFamily: fontStack,
    fontWeight: '500',
  },
  inputGroup: {
    gap: 7,
  },
  label: {
    fontSize: 12,
    fontWeight: '600',
    fontFamily: fontStack,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 12,
    height: 44,
  },
  inputIcon: {
    marginRight: 10,
  },
  input: {
    flex: 1,
    fontSize: 14,
    fontFamily: fontStack,
    height: '100%',
    paddingVertical: 0,
    ...(Platform.OS === 'web' ? ({ outlineStyle: 'none' } as any) : {}),
  },
  eyeBtn: {
    padding: 4,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 6,
  },
  rememberRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginTop: -4,
    marginBottom: 4,
  },
  checkbox: {
    width: 18,
    height: 18,
    borderRadius: 5,
    borderWidth: 1.5,
    justifyContent: 'center',
    alignItems: 'center',
  },
  rememberText: {
    fontSize: 12.5,
    fontWeight: '500',
    fontFamily: fontStack,
  },
  submitBtn: {
    height: 46,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 4,
  },
  submitBtnText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
    fontFamily: fontStack,
  },
  toggleFooter: {
    marginTop: 20,
    alignItems: 'center',
  },
  footerText: {
    fontSize: 13,
    fontFamily: fontStack,
  },
  toggleLink: {
    fontWeight: '700',
  },
});

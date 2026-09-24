import React, { useState } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Platform,
  ActivityIndicator,
  Image,
} from 'react-native';
import { ArrowLeft, Lock, Mail } from 'lucide-react-native';
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
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [infoMsg, setInfoMsg] = useState('');
  const [isSignUp, setIsSignUp] = useState(false);

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
          onLoginSuccess();
        } else {
          setInfoMsg('Account created. Check your inbox for confirmation link, or log in.');
        }
      } else {
        const { data, error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        if (data.session) {
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
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <TouchableOpacity
        style={[styles.backBtn, { backgroundColor: theme.surface, borderColor: theme.borderSubtle }]}
        onPress={onBack}
        activeOpacity={0.7}
        accessibilityLabel="Go back"
      >
        <ArrowLeft color={theme.textSecondary} size={18} />
      </TouchableOpacity>

      <View style={styles.cardWrapper}>
        <View style={styles.header}>
          {/* Flame Icon */}
          <View style={[styles.logoBadge, { backgroundColor: theme.surface, borderColor: theme.borderSubtle }]}>
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

        <View style={[styles.card, { backgroundColor: theme.surface, borderColor: theme.borderSubtle }]}>
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
            <View style={[styles.inputWrapper, { backgroundColor: theme.surfaceHighlight, borderColor: theme.borderSubtle }]}>
              <Mail size={16} color={theme.textMuted} style={styles.inputIcon} />
              <TextInput
                style={[styles.input, { color: theme.text }]}
                placeholder="you@example.com"
                placeholderTextColor={theme.textMuted}
                keyboardType="email-address"
                autoCapitalize="none"
                value={email}
                onChangeText={(t) => {
                  setEmail(t);
                  setErrorMsg('');
                }}
              />
            </View>
          </View>

          <View style={styles.inputGroup}>
            <Text style={[styles.label, { color: theme.text }]}>Password</Text>
            <View style={[styles.inputWrapper, { backgroundColor: theme.surfaceHighlight, borderColor: theme.borderSubtle }]}>
              <Lock size={16} color={theme.textMuted} style={styles.inputIcon} />
              <TextInput
                style={[styles.input, { color: theme.text }]}
                placeholder="••••••••"
                placeholderTextColor={theme.textMuted}
                secureTextEntry
                value={password}
                onChangeText={(t) => {
                  setPassword(t);
                  setErrorMsg('');
                }}
              />
            </View>
          </View>

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
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  backBtn: {
    position: 'absolute',
    top: 32,
    left: 32,
    width: 38,
    height: 38,
    borderRadius: 10,
    borderWidth: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  cardWrapper: {
    width: '100%',
    maxWidth: 380,
  },
  header: {
    alignItems: 'center',
    marginBottom: 28,
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
    padding: 24,
    gap: 16,
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
  },
  submitBtn: {
    height: 44,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 6,
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

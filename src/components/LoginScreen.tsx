import React, { useState } from 'react';
import { StyleSheet, View, Text, TextInput, TouchableOpacity, Platform, ActivityIndicator } from 'react-native';
import { Activity, ArrowLeft } from 'lucide-react-native';
import { supabase } from '../utils/supabase';

interface LoginScreenProps {
  onBack: () => void;
  onLoginSuccess: () => void;
}

export const LoginScreen: React.FC<LoginScreenProps> = ({ onBack, onLoginSuccess }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [isSignUp, setIsSignUp] = useState(false);

  const handleAuth = async () => {
    if (!email || !password) {
      setErrorMsg('Email and password required.');
      return;
    }
    setLoading(true);
    setErrorMsg('');
    
    try {
      if (isSignUp) {
        const { error } = await supabase.auth.signUp({ email, password });
        if (error) throw error;
        // Depending on confirm email settings, they might be logged in instantly or need to check email.
        onLoginSuccess();
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        onLoginSuccess();
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Authentication failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <TouchableOpacity style={styles.backBtn} onPress={onBack} activeOpacity={0.7}>
        <ArrowLeft color="#8B949E" size={20} />
      </TouchableOpacity>

      <View style={styles.box}>
        <View style={styles.header}>
          <Activity color="#58A6FF" size={32} style={{ marginBottom: 16 }} />
          <Text style={styles.title}>{isSignUp ? 'Create an account' : 'Sign in to HeatMap'}</Text>
          <Text style={styles.subtitle}>
            {isSignUp ? 'Start tracking your habits.' : 'Welcome back. Continue building your streak.'}
          </Text>
        </View>

        <View style={styles.form}>
          {errorMsg ? (
            <View style={styles.errorBox}>
              <Text style={styles.errorText}>{errorMsg}</Text>
            </View>
          ) : null}

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Email address</Text>
            <TextInput
              style={styles.input}
              placeholder="you@example.com"
              placeholderTextColor="#484F58"
              keyboardType="email-address"
              autoCapitalize="none"
              value={email}
              onChangeText={(t) => {
                setEmail(t);
                setErrorMsg('');
              }}
            />
          </View>

          <View style={styles.inputGroup}>
            <View style={styles.labelRow}>
              <Text style={styles.label}>Password</Text>
              {!isSignUp && <Text style={styles.forgot}>Forgot password?</Text>}
            </View>
            <TextInput
              style={styles.input}
              placeholder="••••••••"
              placeholderTextColor="#484F58"
              secureTextEntry
              value={password}
              onChangeText={(t) => {
                setPassword(t);
                setErrorMsg('');
              }}
            />
          </View>

          <TouchableOpacity
            style={styles.loginBtn}
            onPress={handleAuth}
            activeOpacity={0.8}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#090A0C" />
            ) : (
              <Text style={styles.loginBtnText}>{isSignUp ? 'Sign up' : 'Sign in'}</Text>
            )}
          </TouchableOpacity>
        </View>

        <View style={styles.footer}>
          <Text style={styles.footerText}>
            {isSignUp ? 'Already have an account? ' : 'New to HeatMap? '}
            <Text style={styles.link} onPress={() => setIsSignUp(!isSignUp)}>
              {isSignUp ? 'Sign in.' : 'Create an account.'}
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
    backgroundColor: '#090A0C',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  backBtn: {
    position: 'absolute',
    top: 40,
    left: 40,
    padding: 8,
  },
  box: {
    width: '100%',
    maxWidth: 360,
  },
  header: {
    alignItems: 'center',
    marginBottom: 32,
  },
  title: {
    color: '#F0F6FC',
    fontSize: 24,
    fontWeight: '600',
    fontFamily: Platform.OS === 'ios' ? 'System' : 'sans-serif',
    marginBottom: 8,
  },
  subtitle: {
    color: '#8B949E',
    fontSize: 14,
    fontFamily: Platform.OS === 'ios' ? 'System' : 'sans-serif',
  },
  form: {
    backgroundColor: '#0D1117',
    borderWidth: 1,
    borderColor: '#21262D',
    borderRadius: 6,
    padding: 20,
    gap: 16,
  },
  errorBox: {
    backgroundColor: '#381014',
    borderColor: '#7F1D1D',
    borderWidth: 1,
    borderRadius: 4,
    padding: 10,
  },
  errorText: {
    color: '#F85149',
    fontSize: 12,
    fontFamily: Platform.OS === 'ios' ? 'System' : 'sans-serif',
  },
  inputGroup: {
    gap: 8,
  },
  labelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  label: {
    color: '#F0F6FC',
    fontSize: 13,
    fontWeight: '500',
    fontFamily: Platform.OS === 'ios' ? 'System' : 'sans-serif',
  },
  forgot: {
    color: '#58A6FF',
    fontSize: 12,
    fontFamily: Platform.OS === 'ios' ? 'System' : 'sans-serif',
  },
  input: {
    backgroundColor: '#090A0C',
    borderWidth: 1,
    borderColor: '#30363D',
    borderRadius: 4,
    color: '#F0F6FC',
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
    fontFamily: Platform.OS === 'ios' ? 'System' : 'sans-serif',
  },
  loginBtn: {
    backgroundColor: '#238636',
    paddingVertical: 10,
    borderRadius: 4,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 8,
  },
  loginBtnText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
    fontFamily: Platform.OS === 'ios' ? 'System' : 'sans-serif',
  },
  footer: {
    marginTop: 32,
    alignItems: 'center',
    padding: 16,
    borderWidth: 1,
    borderColor: '#21262D',
    borderRadius: 6,
  },
  footerText: {
    color: '#8B949E',
    fontSize: 13,
    fontFamily: Platform.OS === 'ios' ? 'System' : 'sans-serif',
  },
  link: {
    color: '#58A6FF',
  },
});

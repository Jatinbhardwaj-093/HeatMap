import 'react-native-url-polyfill/auto';
import { createClient } from '@supabase/supabase-js';
import AsyncStorage from '@react-native-async-storage/async-storage';

// User provided keys
const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL || 'https://mugbodgfkhdsrwfjgrhn.supabase.co';
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im11Z2JvZGdma2hkc3J3ZmpncmhuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODk2NDI1NzIsImV4cCI6MjEwNTIxODU3Mn0.qTSzjjjmi_gyGavSwOX2CaRsR-U7FEafNuQkSLApNIM';


export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: AsyncStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});

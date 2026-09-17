import React, { createContext, useContext, useState, useEffect } from 'react';
import { useColorScheme as useSystemColorScheme } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { ColorTheme } from '../types/heatmap';

export const lightTheme: ColorTheme = {
  background: '#FFFFFF',
  surface: '#F6F8FA',
  surfaceHighlight: '#EAECEF',
  border: '#D0D7DE',
  borderSubtle: '#d8dee4',
  text: '#1F2328',
  textSecondary: '#656D76',
  textMuted: '#57606A',
  success: '#1A7F37',
  error: '#CF222E',
  isDark: false,
};

export const darkTheme: ColorTheme = {
  background: '#090A0C',
  surface: '#0D1117',
  surfaceHighlight: '#161B22',
  border: '#30363D',
  borderSubtle: '#21262D',
  text: '#F0F6FC',
  textSecondary: '#8B949E',
  textMuted: '#6E7681',
  success: '#238636',
  error: '#F85149',
  isDark: true,
};

type ThemeMode = 'system' | 'light' | 'dark';

interface ThemeContextType {
  theme: ColorTheme;
  themeMode: ThemeMode;
  setThemeMode: (mode: ThemeMode) => void;
  isDark: boolean;
}

const ThemeContext = createContext<ThemeContextType>({
  theme: darkTheme,
  themeMode: 'system',
  setThemeMode: () => {},
  isDark: true,
});

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const systemScheme = useSystemColorScheme();
  const [themeMode, setThemeModeState] = useState<ThemeMode>('system');
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    AsyncStorage.getItem('theme_preference').then((savedMode) => {
      if (savedMode === 'light' || savedMode === 'dark' || savedMode === 'system') {
        setThemeModeState(savedMode);
      }
      setIsReady(true);
    });
  }, []);

  const setThemeMode = (mode: ThemeMode) => {
    setThemeModeState(mode);
    AsyncStorage.setItem('theme_preference', mode);
  };

  if (!isReady) return null; // Wait for async storage

  const effectiveIsDark = 
    themeMode === 'system' ? systemScheme === 'dark' : themeMode === 'dark';
    
  const theme = effectiveIsDark ? darkTheme : lightTheme;

  return React.createElement(ThemeContext.Provider, {
    value: { theme, themeMode, setThemeMode, isDark: effectiveIsDark }
  }, children);
};

export const useAppTheme = () => useContext(ThemeContext).theme;
export const useIsDark = () => useContext(ThemeContext).isDark;
export const useThemeMode = () => useContext(ThemeContext);

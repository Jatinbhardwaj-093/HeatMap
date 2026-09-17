import { useColorScheme } from 'react-native';

export const DarkTheme = {
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
  errorBg: '#381014',
};

export const LightTheme = {
  background: '#FFFFFF',
  surface: '#F6F8FA',
  surfaceHighlight: '#EAECEF',
  border: '#D0D7DE',
  borderSubtle: '#EBEEF1',
  text: '#24292F',
  textSecondary: '#57606A',
  textMuted: '#8C959F',
  success: '#2DA44E',
  error: '#CF222E',
  errorBg: '#FFEBE9',
};

export function useAppTheme() {
  const scheme = useColorScheme();
  return scheme === 'dark' ? DarkTheme : LightTheme;
}

export function useIsDark() {
  return useColorScheme() === 'dark';
}

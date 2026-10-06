import { Platform } from 'react-native';

export const isWeb = Platform.OS === 'web';

export const isMacPlatform = (): boolean => {
  if (Platform.OS === 'ios' || Platform.OS === 'android') return false;
  if (typeof navigator !== 'undefined') {
    const isMacAgent = /Macintosh|MacIntel|MacPPC|Mac68K/i.test(navigator.userAgent);
    const isMacPlatform = Boolean(navigator.platform && navigator.platform.toLowerCase().includes('mac'));
    return isMacAgent || isMacPlatform;
  }
  return false;
};

export const isElectronApp = (): boolean => {
  if (typeof navigator !== 'undefined') {
    return /Electron/i.test(navigator.userAgent);
  }
  return false;
};

export const isMacDesktop = isElectronApp() && isMacPlatform();

// Native applications (Android, iOS, and macOS Electron desktop app) skip marketing landing page
// Regular web visitors on browsers keep the landing page
export const shouldSkipLanding = Platform.OS !== 'web' || isElectronApp();

// Electron / macOS drag and click styles for window title bars
export const dragRegion = isWeb
  ? ({
      WebkitAppRegion: 'drag',
      userSelect: 'none',
    } as any)
  : {};

export const noDragRegion = isWeb
  ? ({
      WebkitAppRegion: 'no-drag',
    } as any)
  : {};

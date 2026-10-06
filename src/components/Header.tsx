import React from 'react';
import { StyleSheet, View, Text, TouchableOpacity, Platform, Image } from 'react-native';
import { Smartphone, Sun, Moon, Monitor, User, RefreshCw } from 'lucide-react-native';
import { useAppTheme, useThemeMode } from '../theme/theme';
import { isMacDesktop, dragRegion, noDragRegion } from '../utils/platform';

interface HeaderProps {
  onOpenWidgetStudio: () => void;
  onOpenAccountModal: () => void;
  onLogout?: () => void;
  userEmail?: string;
  userName?: string;
  userHandle?: string;
  onSync?: () => void;
  syncStatus?: 'idle' | 'syncing' | 'synced' | 'offline';
}

export const Header: React.FC<HeaderProps> = ({
  onOpenWidgetStudio,
  onOpenAccountModal,
  onLogout,
  userEmail,
  userName,
  userHandle,
  onSync,
  syncStatus = 'idle',
}) => {
  const theme = useAppTheme();
  const { themeMode, setThemeMode } = useThemeMode();

  const cycleTheme = () => {
    if (themeMode === 'system') setThemeMode('light');
    else if (themeMode === 'light') setThemeMode('dark');
    else setThemeMode('system');
  };

  const getThemeIcon = () => {
    if (themeMode === 'light') return <Sun size={15} color={theme.textSecondary} />;
    if (themeMode === 'dark') return <Moon size={15} color={theme.textSecondary} />;
    return <Monitor size={15} color={theme.textSecondary} />;
  };

  const displayName = userName || (userHandle ? `@${userHandle}` : userEmail);

  return (
    <View
      style={[
        styles.header,
        {
          backgroundColor: theme.surface,
          borderBottomColor: theme.borderSubtle,
          paddingTop: isMacDesktop ? 38 : 12,
        },
        dragRegion,
      ]}
    >
      <View style={styles.headerContainer}>
        {/* Brand Group */}
        <View style={[styles.brandGroup, noDragRegion]}>
          <View style={[styles.logoFrame, { backgroundColor: theme.surfaceHighlight, borderColor: theme.borderSubtle }]}>
            <Image
              source={require('../../assets/icon.png')}
              style={styles.logoImage}
              resizeMode="contain"
            />
          </View>
          <View style={styles.brandTextGroup}>
            <Text style={[styles.brandName, { color: theme.text }]}>TrackHeat</Text>
            {displayName ? (
              <Text style={[styles.brandEmail, { color: theme.textSecondary }]} numberOfLines={1}>
                {displayName}
              </Text>
            ) : null}
          </View>
        </View>

        {/* Right Actions */}
        <View style={[styles.actionButtons, noDragRegion]}>
          {/* Cloud Sync Button */}
          {userEmail && onSync && (
            <TouchableOpacity
              style={[
                styles.actionBtn,
                {
                  backgroundColor: theme.surfaceHighlight,
                  borderColor: syncStatus === 'synced' ? '#39D353' : theme.borderSubtle,
                },
              ]}
              onPress={onSync}
              activeOpacity={0.7}
              accessibilityLabel="Sync habits across devices"
            >
              <RefreshCw
                size={14}
                color={syncStatus === 'synced' ? '#39D353' : theme.textSecondary}
                strokeWidth={syncStatus === 'syncing' ? 2.5 : 2}
              />
            </TouchableOpacity>
          )}

          {/* Theme Switcher */}
          <TouchableOpacity
            style={[styles.actionBtn, { backgroundColor: theme.surfaceHighlight, borderColor: theme.borderSubtle }]}
            onPress={cycleTheme}
            activeOpacity={0.7}
            accessibilityLabel="Toggle Theme"
          >
            {getThemeIcon()}
          </TouchableOpacity>

          {/* Widget Studio (Mobile only: clean icon-only button) */}
          {Platform.OS !== 'web' && (
            <TouchableOpacity
              style={[styles.actionBtn, { backgroundColor: theme.surfaceHighlight, borderColor: theme.borderSubtle }]}
              onPress={onOpenWidgetStudio}
              activeOpacity={0.7}
              accessibilityLabel="Open Widgets"
            >
              <Smartphone size={15} color={theme.text} strokeWidth={2} />
            </TouchableOpacity>
          )}

          {/* Account Management (Icon only on mobile, text on web) */}
          <TouchableOpacity
            style={[
              styles.actionBtn,
              Platform.OS === 'web' && styles.accountBtn,
              { backgroundColor: theme.surfaceHighlight, borderColor: theme.borderSubtle },
            ]}
            onPress={onOpenAccountModal}
            activeOpacity={0.7}
            accessibilityLabel="Manage Account"
          >
            <User size={15} color={theme.text} strokeWidth={2} />
            {Platform.OS === 'web' && (
              <Text style={[styles.widgetBtnText, { color: theme.text }]}>Account</Text>
            )}
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
};

const fontStack = Platform.select({
  web: '"SF Pro Rounded", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
  ios: 'System',
  default: 'sans-serif',
});

const styles = StyleSheet.create({
  header: {
    borderBottomWidth: 1,
    paddingBottom: 12,
    paddingHorizontal: 16,
  },
  headerContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    maxWidth: 1080,
    width: '100%',
    alignSelf: 'center',
  },
  brandGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  logoFrame: {
    width: 32,
    height: 32,
    borderRadius: 8,
    borderWidth: 1,
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
  },
  logoImage: {
    width: 22,
    height: 22,
  },
  brandTextGroup: {
    justifyContent: 'center',
  },
  brandName: {
    fontSize: 16,
    fontWeight: '800',
    fontFamily: fontStack,
    letterSpacing: 0.3,
  },
  brandEmail: {
    fontSize: 11,
    fontFamily: fontStack,
    maxWidth: 180,
  },
  actionButtons: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  actionBtn: {
    width: 34,
    height: 34,
    borderRadius: 8,
    borderWidth: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  widgetBtn: {
    width: 'auto',
    flexDirection: 'row',
    paddingHorizontal: 10,
    gap: 6,
  },
  accountBtn: {
    width: 'auto',
    flexDirection: 'row',
    paddingHorizontal: 10,
    gap: 6,
  },
  widgetBtnText: {
    fontSize: 12,
    fontWeight: '600',
    fontFamily: fontStack,
  },
});

import React from 'react';
import { StyleSheet, View, Text, TouchableOpacity, Platform, Image } from 'react-native';
import { LogOut, Smartphone, Sun, Moon, Monitor } from 'lucide-react-native';
import { useAppTheme, useThemeMode } from '../theme/theme';

interface HeaderProps {
  onOpenWidgetStudio: () => void;
  onLogout: () => void;
  userEmail?: string;
}

export const Header: React.FC<HeaderProps> = ({
  onOpenWidgetStudio,
  onLogout,
  userEmail,
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

  return (
    <View style={[styles.header, { backgroundColor: theme.surface, borderBottomColor: theme.borderSubtle }]}>
      <View style={styles.headerContainer}>
        {/* Brand Group */}
        <View style={styles.brandGroup}>
          <View style={[styles.logoFrame, { backgroundColor: theme.surfaceHighlight, borderColor: theme.borderSubtle }]}>
            <Image
              source={require('../../assets/icon.png')}
              style={styles.logoImage}
              resizeMode="contain"
            />
          </View>
          <View style={styles.brandTextGroup}>
            <Text style={[styles.brandName, { color: theme.text }]}>HabitHeat</Text>
            {userEmail ? (
              <Text style={[styles.brandEmail, { color: theme.textSecondary }]} numberOfLines={1}>
                {userEmail}
              </Text>
            ) : null}
          </View>
        </View>

        {/* Right Actions */}
        <View style={styles.actionButtons}>
          <TouchableOpacity
            style={[styles.actionBtn, { backgroundColor: theme.surfaceHighlight, borderColor: theme.borderSubtle }]}
            onPress={cycleTheme}
            activeOpacity={0.7}
            accessibilityLabel="Toggle Theme"
          >
            {getThemeIcon()}
          </TouchableOpacity>

          {Platform.OS !== 'web' && (
            <TouchableOpacity
              style={[styles.actionBtn, styles.widgetBtn, { backgroundColor: theme.surfaceHighlight, borderColor: theme.borderSubtle }]}
              onPress={onOpenWidgetStudio}
              activeOpacity={0.7}
              accessibilityLabel="Open Widgets"
            >
              <Smartphone size={14} color={theme.text} strokeWidth={2} />
              <Text style={[styles.widgetBtnText, { color: theme.text }]}>Widgets</Text>
            </TouchableOpacity>
          )}

          <TouchableOpacity
            style={[styles.actionBtn, { backgroundColor: theme.surfaceHighlight, borderColor: theme.borderSubtle }]}
            onPress={onLogout}
            activeOpacity={0.7}
            accessibilityLabel="Sign out"
          >
            <LogOut size={15} color={theme.textSecondary} />
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
    paddingVertical: 10,
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
    maxWidth: 160,
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
  widgetBtnText: {
    fontSize: 12,
    fontWeight: '600',
    fontFamily: fontStack,
  },
});

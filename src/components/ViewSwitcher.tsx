import React from 'react';
import { StyleSheet, View, Text, TouchableOpacity, Platform } from 'react-native';
import { ViewMode } from '../types/heatmap';
import { useAppTheme, useIsDark } from '../theme/theme';

interface ViewSwitcherProps {
  currentView: ViewMode;
  onViewChange: (mode: ViewMode) => void;
  size?: 'small' | 'default';
}

export const ViewSwitcher: React.FC<ViewSwitcherProps> = ({
  currentView,
  onViewChange,
  size = 'default',
}) => {
  const theme = useAppTheme();
  const isDark = useIsDark();
  const modes: ViewMode[] = ['monthly', 'yearly'];
  const isSmall = size === 'small';

  const trackBg = isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.05)';
  const activeBg = isDark ? '#21262D' : '#FFFFFF';

  return (
    <View
      style={[
        styles.container,
        isSmall && styles.containerSmall,
        { backgroundColor: trackBg },
      ]}
    >
      {modes.map((mode) => {
        const isActive = currentView === mode;
        const label = isSmall
          ? mode === 'monthly'
            ? 'Month'
            : 'Year'
          : mode === 'monthly'
          ? 'Monthly'
          : 'Yearly';

        return (
          <TouchableOpacity
            key={mode}
            activeOpacity={0.7}
            style={[
              styles.segment,
              isSmall && styles.segmentSmall,
              isActive && [
                styles.segmentActive,
                { backgroundColor: activeBg },
                Platform.select({
                  web: {
                    boxShadow: isDark
                      ? '0 1px 3px rgba(0, 0, 0, 0.35)'
                      : '0 1px 3px rgba(0, 0, 0, 0.1), 0 1px 2px rgba(0, 0, 0, 0.06)',
                  } as any,
                  default: {
                    shadowColor: '#000000',
                    shadowOffset: { width: 0, height: 1 },
                    shadowOpacity: 0.12,
                    shadowRadius: 2,
                    elevation: 1,
                  },
                }),
              ],
            ]}
            onPress={() => onViewChange(mode)}
          >
            <Text
              style={[
                styles.segmentText,
                isSmall && styles.segmentTextSmall,
                { color: isActive ? theme.text : theme.textSecondary },
                isActive && { fontWeight: '700' },
              ]}
            >
              {label}
            </Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
};

const fontStack = Platform.select({
  web: '"SF Pro Rounded", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
  ios: 'System',
  default: 'sans-serif',
});

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    borderRadius: 20,
    padding: 2.5,
    alignSelf: 'flex-start',
  },
  containerSmall: {
    borderRadius: 16,
    padding: 2,
  },
  segment: {
    paddingHorizontal: 13,
    paddingVertical: 4.5,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  segmentSmall: {
    paddingHorizontal: 9,
    paddingVertical: 3,
    borderRadius: 13,
    alignItems: 'center',
    justifyContent: 'center',
  },
  segmentActive: {},
  segmentText: {
    fontSize: 12,
    fontWeight: '500',
    fontFamily: fontStack,
    letterSpacing: 0.2,
  },
  segmentTextSmall: {
    fontSize: 10.5,
    fontWeight: '600',
    fontFamily: fontStack,
    letterSpacing: 0.1,
  },
});

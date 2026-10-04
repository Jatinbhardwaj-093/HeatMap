import React from 'react';
import { StyleSheet, View, Text, TouchableOpacity, Platform } from 'react-native';
import { ViewMode } from '../types/heatmap';
import { useAppTheme } from '../theme/theme';

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
  const modes: ViewMode[] = ['monthly', 'yearly'];
  const isSmall = size === 'small';

  return (
    <View
      style={[
        styles.container,
        isSmall && styles.containerSmall,
        { backgroundColor: theme.surfaceHighlight, borderColor: theme.borderSubtle },
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
              isActive && { backgroundColor: theme.surface, borderColor: theme.border },
              !isActive && { borderColor: 'transparent' },
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
    borderWidth: 1,
    borderRadius: 8,
    padding: 3,
    alignSelf: 'flex-start',
  },
  containerSmall: {
    borderRadius: 7,
    padding: 2,
  },
  segment: {
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 6,
    borderWidth: 1,
  },
  segmentSmall: {
    paddingHorizontal: 8,
    paddingVertical: 3.5,
    borderRadius: 5,
  },
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

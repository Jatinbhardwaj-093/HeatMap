import React from 'react';
import { StyleSheet, View, Text, TouchableOpacity, Platform } from 'react-native';
import { ViewMode } from '../types/heatmap';
import { useAppTheme } from '../theme/theme';

interface ViewSwitcherProps {
  currentView: ViewMode;
  onViewChange: (mode: ViewMode) => void;
}

export const ViewSwitcher: React.FC<ViewSwitcherProps> = ({ currentView, onViewChange }) => {
  const theme = useAppTheme();
  
  const modes: ViewMode[] = ['monthly', 'yearly'];

  return (
    <View style={[styles.container, { backgroundColor: theme.surfaceHighlight, borderColor: theme.borderSubtle }]}>
      {modes.map((mode) => {
        const isActive = currentView === mode;
        return (
          <TouchableOpacity
            key={mode}
            activeOpacity={0.7}
            style={[
              styles.segment,
              isActive && { backgroundColor: theme.surface, borderColor: theme.border },
              !isActive && { borderColor: 'transparent' }
            ]}
            onPress={() => onViewChange(mode)}
          >
            <Text
              style={[
                styles.segmentText,
                { color: isActive ? theme.text : theme.textSecondary },
                isActive && { fontWeight: '700' },
              ]}
            >
              {mode === 'monthly' ? 'Monthly' : 'Yearly'}
            </Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    borderWidth: 1,
    borderRadius: 8,
    padding: 3,
    alignSelf: 'flex-start',
  },
  segment: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 6,
    borderWidth: 1,
  },
  segmentText: {
    fontSize: 12,
    fontWeight: '500',
    fontFamily: Platform.select({
      web: '"SF Pro Rounded", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
      ios: 'System',
      default: 'sans-serif',
    }),
    letterSpacing: 0.2,
  },
});

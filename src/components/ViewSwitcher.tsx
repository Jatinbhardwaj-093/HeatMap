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
  
  const modes: ViewMode[] = ['weekly', 'monthly', 'yearly'];

  return (
    <View style={[styles.container, { backgroundColor: theme.surfaceHighlight, borderColor: theme.border }]}>
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
                { color: isActive ? theme.text : theme.textSecondary }
              ]}
            >
              {mode.toUpperCase()}
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
    borderRadius: 6,
    padding: 2,
    alignSelf: 'flex-start',
  },
  segment: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 4,
    borderWidth: 1,
  },
  segmentText: {
    fontSize: 10,
    fontWeight: '600',
    fontFamily: Platform.OS === 'ios' ? 'System' : 'sans-serif',
    letterSpacing: 0.5,
  },
});

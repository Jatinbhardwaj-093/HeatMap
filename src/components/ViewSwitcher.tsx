import React from 'react';
import { StyleSheet, View, Text, TouchableOpacity } from 'react-native';
import { ViewMode } from '../types/heatmap';
import { Calendar, LayoutGrid, Columns3 } from 'lucide-react-native';

interface ViewSwitcherProps {
  currentView: ViewMode;
  onViewChange: (mode: ViewMode) => void;
}

export const ViewSwitcher: React.FC<ViewSwitcherProps> = ({ currentView, onViewChange }) => {
  const options: Array<{ mode: ViewMode; label: string; icon: any }> = [
    { mode: 'weekly', label: 'WEEKLY', icon: Columns3 },
    { mode: 'monthly', label: 'MONTHLY', icon: Calendar },
    { mode: 'yearly', label: 'YEARLY', icon: LayoutGrid },
  ];

  return (
    <View style={styles.container}>
      {options.map((opt) => {
        const isActive = currentView === opt.mode;
        const IconComponent = opt.icon;
        return (
          <TouchableOpacity
            key={opt.mode}
            activeOpacity={0.8}
            onPress={() => onViewChange(opt.mode)}
            style={[styles.segment, isActive && styles.activeSegment]}
          >
            <IconComponent
              size={13}
              color={isActive ? '#FFFFFF' : '#8B949E'}
              strokeWidth={1.8}
            />
            <Text style={[styles.label, isActive && styles.activeLabel]}>
              {opt.label}
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
    backgroundColor: '#0D1117',
    borderColor: '#30363D',
    borderWidth: 1,
    borderRadius: 4,
    padding: 2,
    alignSelf: 'flex-start',
  },
  segment: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 3,
  },
  activeSegment: {
    backgroundColor: '#21262D',
    borderColor: '#484F58',
    borderWidth: 1,
  },
  label: {
    color: '#8B949E',
    fontSize: 11,
    fontWeight: '600',
    
    letterSpacing: 0.5,
  },
  activeLabel: {
    color: '#F0F6FC',
  },
});

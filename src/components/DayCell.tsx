import React from 'react';
import { StyleSheet, TouchableOpacity, View, Text, Platform } from 'react-native';
import { PALETTES } from '../constants/palettes';
import { PaletteId } from '../types/heatmap';
import { useAppTheme, useIsDark } from '../theme/theme';

interface DayCellProps {
  dateKey: string;
  level: 0 | 1 | 2 | 3 | 4;
  paletteId: PaletteId;
  size?: number;
  isToday?: boolean;
  disabled?: boolean;
  onPress?: (dateKey: string) => void;
  showDayNumber?: boolean;
  dayNumber?: number;
  dimmed?: boolean;
}

export const DayCell: React.FC<DayCellProps> = ({
  dateKey,
  level,
  paletteId,
  size = 13,
  isToday = false,
  disabled = false,
  onPress,
  showDayNumber = false,
  dayNumber,
  dimmed = false,
}) => {
  const palette = PALETTES[paletteId] || PALETTES.emerald;
  const theme = useAppTheme();
  const isDark = useIsDark();
  
  const levels = !isDark && palette.lightLevels ? palette.lightLevels : palette.levels;
  const cellColor = levels[level] || palette.accent;

  let borderColor = 'transparent';
  let borderWidth = 0;

  if (isToday) {
    borderColor = isDark ? '#FFFFFF' : '#090A0C';
    borderWidth = 1.5;
  } else if (level === 0) {
    // Ultra-light, whisper-quiet boundary for empty cells so the grid structure is preserved without high shade
    borderColor = isDark ? 'rgba(255, 255, 255, 0.06)' : 'rgba(0, 0, 0, 0.05)';
    borderWidth = size < 8 ? 0.5 : 1;
  }

  const handlePress = () => {
    if (!disabled && onPress) {
      onPress(dateKey);
    }
  };

  return (
    <TouchableOpacity
      activeOpacity={0.7}
      disabled={disabled || !onPress}
      onPress={handlePress}
      style={[
        styles.cell,
        {
          width: size,
          height: size,
          borderRadius: size >= 30 ? 8 : (size >= 12 ? 3 : 1.5),
          backgroundColor: cellColor,
          opacity: dimmed ? 0.35 : 1,
          borderColor: borderColor,
          borderWidth: borderWidth,
        },
      ]}
    >
      {showDayNumber && dayNumber !== undefined && (
        <Text
          style={[
            styles.dayText,
            {
              color: level >= 2 ? '#FFFFFF' : (isDark ? '#8B949E' : '#57606A'),
              fontSize: size * 0.36,
            },
          ]}
        >
          {dayNumber}
        </Text>
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  cell: {
    borderRadius: 3,
    justifyContent: 'center',
    alignItems: 'center',
  },
  dayText: {
    fontFamily: Platform.OS === 'ios' ? 'System' : 'sans-serif',
    fontWeight: '600',
  },
});

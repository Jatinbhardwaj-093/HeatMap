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
  isDark?: boolean;
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
  isDark: propIsDark,
}) => {
  const palette = PALETTES[paletteId] || PALETTES.emerald;
  const theme = useAppTheme();
  const contextIsDark = useIsDark();
  const isDark = propIsDark !== undefined ? propIsDark : contextIsDark;
  
  const levels = !isDark && palette.lightLevels ? palette.lightLevels : palette.levels;
  const cellColor = levels[level] || palette.accent;

  let borderColor = 'transparent';
  let borderWidth = 0;

  if (isToday) {
    borderColor = isDark ? '#FFFFFF' : '#090A0C';
    borderWidth = 1.5;
  } else if (level === 0) {
    // Subtle boundary for empty cells
    borderColor = isDark ? 'rgba(255, 255, 255, 0.06)' : 'rgba(0, 0, 0, 0.06)';
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
            },
          ]}
        >
          {dayNumber}
        </Text>
      )}
    </TouchableOpacity>
  );
};

const fontStack = Platform.select({
  web: '"SF Pro Rounded", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
  ios: 'System',
  default: 'sans-serif',
});

const styles = StyleSheet.create({
  cell: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  dayText: {
    fontSize: 11,
    fontWeight: '700',
    fontFamily: fontStack,
  },
});

import React from 'react';
import { StyleSheet, TouchableOpacity, View, Text } from 'react-native';
import { PALETTES } from '../constants/palettes';
import { PaletteId } from '../types/heatmap';
import { getIntensityLevel } from '../utils/dateUtils';

interface DayCellProps {
  dateKey: string;
  value?: number;
  target?: number;
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
  value = 0,
  target = 1,
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
  const level = getIntensityLevel(value, target);
  const cellColor = palette.levels[level];

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
          backgroundColor: cellColor,
          opacity: dimmed ? 0.35 : 1,
          borderColor: isToday ? '#FFFFFF' : '#22272E',
          borderWidth: isToday ? 1.5 : 1,
        },
      ]}
    >
      {showDayNumber && dayNumber !== undefined && (
        <Text
          style={[
            styles.dayText,
            {
              color: level >= 2 ? '#FFFFFF' : '#8B949E',
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
    fontFamily: 'Courier',
    fontWeight: '600',
  },
});

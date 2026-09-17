import React from 'react';
import { StyleSheet, View, Text, Platform } from 'react-native';
import { HeatMapModel } from '../types/heatmap';
import { getCurrentWeeklyGrid } from '../utils/dateUtils';
import { getStreakIntensityLevel } from '../utils/streakUtils';
import { DayCell } from './DayCell';
import { useAppTheme } from '../theme/theme';

interface WeeklyViewProps {
  heatmap: HeatMapModel;
  streakMap: Record<string, number>;
  onSelectDate: (dateKey: string) => void;
}

export const WeeklyView: React.FC<WeeklyViewProps> = ({ heatmap, streakMap, onSelectDate }) => {
  const grid = getCurrentWeeklyGrid();
  const theme = useAppTheme();

  return (
    <View style={styles.container}>
      <Text style={[styles.title, { color: theme.textMuted }]}>THIS WEEK</Text>
      
      <View style={styles.grid}>
        {grid.days.map((day) => {
          const entry = heatmap.entries[day.dateKey];
          const level = entry?.completed ? getStreakIntensityLevel(streakMap[day.dateKey] || 1) : 0;
          
          return (
            <View key={day.dateKey} style={styles.dayColumn}>
              <Text style={[styles.dayName, { color: day.isToday ? theme.text : theme.textSecondary }]}>
                {day.dayName}
              </Text>
              
              <DayCell
                dateKey={day.dateKey}
                level={level}
                paletteId={heatmap.paletteId}
                size={34}
                isToday={day.isToday}
                onPress={onSelectDate}
              />
              
              <Text style={[styles.dateText, { color: day.isToday ? theme.text : theme.textMuted }]}>
                {day.dateKey.split('-')[2]}
              </Text>
            </View>
          );
        })}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { paddingVertical: 12 },
  title: { fontSize: 10, fontWeight: '700', fontFamily: Platform.OS === 'ios' ? 'System' : 'sans-serif', letterSpacing: 1, marginBottom: 16 },
  grid: { flexDirection: 'row', justifyContent: 'space-between' },
  dayColumn: { alignItems: 'center', gap: 8 },
  dayName: { fontSize: 11, fontWeight: '600', fontFamily: Platform.OS === 'ios' ? 'System' : 'sans-serif' },
  dateText: { fontSize: 10, fontFamily: Platform.OS === 'ios' ? 'System' : 'sans-serif' },
});

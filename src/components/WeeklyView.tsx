import React from 'react';
import { StyleSheet, View, Text, Platform } from 'react-native';
import { HeatMapModel } from '../types/heatmap';
import { getCurrentWeeklyGrid } from '../utils/dateUtils';
import { getStreakIntensityLevel } from '../utils/streakUtils';
import { DayCell } from './DayCell';

interface WeeklyViewProps {
  heatmap: HeatMapModel;
  streakMap: Record<string, number>;
  onSelectDate: (dateKey: string) => void;
}

export const WeeklyView: React.FC<WeeklyViewProps> = ({ heatmap, streakMap, onSelectDate }) => {
  const week = getCurrentWeeklyGrid();

  let completedCount = 0;
  for (const day of week.days) {
    if (heatmap.entries[day.dateKey]?.completed) {
      completedCount++;
    }
  }
  const pct = Math.round((completedCount / 7) * 100);

  return (
    <View style={styles.container}>
      <View style={styles.weekCard}>
        <View style={styles.weekHeader}>
          <Text style={styles.weekLabel}>THIS WEEK: {week.weekLabel}</Text>
          <Text style={styles.weekStats}>
            {completedCount}/7 active | {pct}%
          </Text>
        </View>

        <View style={styles.daysRow}>
          {week.days.map((day) => {
            const entry = heatmap.entries[day.dateKey];
            const level = entry?.completed ? getStreakIntensityLevel(streakMap[day.dateKey] || 1) : 0;
            return (
              <View key={day.dateKey} style={styles.dayCol}>
                <Text style={[styles.dayHeaderLabel, day.isToday && styles.todayLabel]}>
                  {day.dayName[0]}
                </Text>
                <DayCell
                  dateKey={day.dateKey}
                  level={level}
                  paletteId={heatmap.paletteId}
                  size={32}
                  isToday={day.isToday}
                  showDayNumber={true}
                  dayNumber={day.dayNumber}
                  onPress={onSelectDate}
                />
              </View>
            );
          })}
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingVertical: 8,
  },
  weekCard: {
    backgroundColor: '#0E1116',
    borderColor: '#21262D',
    borderWidth: 1,
    borderRadius: 4,
    padding: 10,
  },
  weekHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  weekLabel: {
    color: '#F0F6FC',
    fontSize: 11,
    fontWeight: '600',
    fontFamily: Platform.OS === 'ios' ? 'System' : 'sans-serif',
  },
  weekStats: {
    color: '#8B949E',
    fontSize: 10,
    fontFamily: Platform.OS === 'ios' ? 'System' : 'sans-serif',
  },
  daysRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  dayCol: {
    alignItems: 'center',
    gap: 6,
  },
  dayHeaderLabel: {
    color: '#6E7681',
    fontSize: 10,
    fontFamily: Platform.OS === 'ios' ? 'System' : 'sans-serif',
  },
  todayLabel: {
    color: '#F0F6FC',
    fontWeight: '700',
  },
});

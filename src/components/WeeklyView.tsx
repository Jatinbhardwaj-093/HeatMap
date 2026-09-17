import React from 'react';
import { StyleSheet, View, Text, TouchableOpacity } from 'react-native';
import { HeatMapModel } from '../types/heatmap';
import { getWeeklyGrid } from '../utils/dateUtils';
import { DayCell } from './DayCell';

interface WeeklyViewProps {
  heatmap: HeatMapModel;
  onSelectDate: (dateKey: string) => void;
}

export const WeeklyView: React.FC<WeeklyViewProps> = ({ heatmap, onSelectDate }) => {
  const { weeks } = getWeeklyGrid(8);

  return (
    <View style={styles.container}>
      {weeks.map((week, wIdx) => {
        let completedCount = 0;
        for (const day of week.days) {
          const entry = heatmap.entries[day.dateKey];
          if (entry && entry.value > 0) {
            completedCount++;
          }
        }
        const pct = Math.round((completedCount / 7) * 100);

        return (
          <View key={`week-${wIdx}`} style={styles.weekCard}>
            <View style={styles.weekHeader}>
              <Text style={styles.weekLabel}>{week.weekLabel}</Text>
              <Text style={styles.weekStats}>
                {completedCount}/7 active | {pct}%
              </Text>
            </View>

            <View style={styles.daysRow}>
              {week.days.map((day) => {
                const entry = heatmap.entries[day.dateKey];
                const val = entry ? entry.value : 0;
                return (
                  <View key={day.dateKey} style={styles.dayCol}>
                    <Text style={[styles.dayHeaderLabel, day.isToday && styles.todayLabel]}>
                      {day.dayName[0]}
                    </Text>
                    <DayCell
                      dateKey={day.dateKey}
                      value={val}
                      target={heatmap.targetValue}
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
        );
      })}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingVertical: 8,
    gap: 8,
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
    marginBottom: 8,
  },
  weekLabel: {
    color: '#F0F6FC',
    fontSize: 11,
    fontWeight: '600',
    fontFamily: 'Courier',
  },
  weekStats: {
    color: '#8B949E',
    fontSize: 10,
    fontFamily: 'Courier',
  },
  daysRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  dayCol: {
    alignItems: 'center',
    gap: 4,
  },
  dayHeaderLabel: {
    color: '#6E7681',
    fontSize: 9,
    fontFamily: 'Courier',
  },
  todayLabel: {
    color: '#F0F6FC',
    fontWeight: '700',
  },
});

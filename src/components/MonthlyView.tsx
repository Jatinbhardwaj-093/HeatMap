import React, { useState } from 'react';
import { StyleSheet, View, Text, TouchableOpacity, Platform } from 'react-native';
import { HeatMapModel } from '../types/heatmap';
import { getMonthlyGrid, getMonthNames } from '../utils/dateUtils';
import { getStreakIntensityLevel } from '../utils/streakUtils';
import { DayCell } from './DayCell';
import { ChevronLeft, ChevronRight } from 'lucide-react-native';

interface MonthlyViewProps {
  heatmap: HeatMapModel;
  streakMap: Record<string, number>;
  onSelectDate: (dateKey: string) => void;
}

export const MonthlyView: React.FC<MonthlyViewProps> = ({ heatmap, streakMap, onSelectDate }) => {
  const today = new Date();
  const [currentYear, setCurrentYear] = useState<number>(today.getFullYear());
  const [currentMonth, setCurrentMonth] = useState<number>(today.getMonth());

  const monthGrid = getMonthlyGrid(currentYear, currentMonth);
  const monthNames = getMonthNames();
  const dayNames = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

  const handlePrevMonth = () => {
    if (currentMonth === 0) {
      setCurrentMonth(11);
      setCurrentYear((y) => y - 1);
    } else {
      setCurrentMonth((m) => m - 1);
    }
  };

  const handleNextMonth = () => {
    if (currentMonth === 11) {
      setCurrentMonth(0);
      setCurrentYear((y) => y + 1);
    } else {
      setCurrentMonth((m) => m + 1);
    }
  };

  const handleTodayJump = () => {
    setCurrentYear(today.getFullYear());
    setCurrentMonth(today.getMonth());
  };

  return (
    <View style={styles.container}>
      <View style={styles.headerRow}>
        <View style={styles.navGroup}>
          <TouchableOpacity
            style={styles.navButton}
            onPress={handlePrevMonth}
            activeOpacity={0.7}
          >
            <ChevronLeft size={16} color="#8B949E" />
          </TouchableOpacity>
          <Text style={styles.monthTitle}>
            {monthNames[currentMonth]} {currentYear}
          </Text>
          <TouchableOpacity
            style={styles.navButton}
            onPress={handleNextMonth}
            activeOpacity={0.7}
          >
            <ChevronRight size={16} color="#8B949E" />
          </TouchableOpacity>
        </View>

        <TouchableOpacity
          style={styles.todayButton}
          onPress={handleTodayJump}
          activeOpacity={0.7}
        >
          <Text style={styles.todayButtonText}>Current</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.weekdaysRow}>
        {dayNames.map((name, i) => (
          <View key={`th-${i}`} style={styles.weekdayCol}>
            <Text style={styles.weekdayText}>{name}</Text>
          </View>
        ))}
      </View>

      <View style={styles.gridContainer}>
        {monthGrid.days.map((day) => {
          const entry = heatmap.entries[day.dateKey];
          const level = entry?.completed ? getStreakIntensityLevel(streakMap[day.dateKey] || 1) : 0;
          return (
            <View key={day.dateKey} style={styles.cellWrapper}>
              <DayCell
                dateKey={day.dateKey}
                level={level}
                paletteId={heatmap.paletteId}
                size={38}
                isToday={day.isToday}
                dimmed={!day.isCurrentMonth}
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
};

const styles = StyleSheet.create({
  container: {
    paddingVertical: 12,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 14,
  },
  navGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#161B22',
    borderColor: '#30363D',
    borderWidth: 1,
    borderRadius: 4,
    paddingHorizontal: 6,
    paddingVertical: 3,
  },
  navButton: {
    padding: 3,
  },
  monthTitle: {
    color: '#F0F6FC',
    fontSize: 13,
    fontWeight: '600',
    fontFamily: Platform.OS === 'ios' ? 'System' : 'sans-serif',
    marginHorizontal: 8,
  },
  todayButton: {
    backgroundColor: '#161B22',
    borderColor: '#30363D',
    borderWidth: 1,
    borderRadius: 4,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  todayButtonText: {
    color: '#8B949E',
    fontSize: 11,
    fontWeight: '500',
    fontFamily: Platform.OS === 'ios' ? 'System' : 'sans-serif',
  },
  weekdaysRow: {
    flexDirection: 'row',
    marginBottom: 6,
  },
  weekdayCol: {
    flex: 1,
    alignItems: 'center',
  },
  weekdayText: {
    color: '#6E7681',
    fontSize: 10,
    fontWeight: '500',
    fontFamily: Platform.OS === 'ios' ? 'System' : 'sans-serif',
  },
  gridContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  cellWrapper: {
    width: `${100 / 7}%`,
    alignItems: 'center',
    paddingVertical: 3,
  },
});

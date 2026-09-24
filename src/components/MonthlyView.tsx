import React, { useState } from 'react';
import { StyleSheet, View, Text, TouchableOpacity, Platform } from 'react-native';
import { HeatMapModel } from '../types/heatmap';
import { getMonthlyGrid, getMonthNames } from '../utils/dateUtils';
import { getStreakIntensityLevel } from '../utils/streakUtils';
import { DayCell } from './DayCell';
import { ChevronLeft, ChevronRight } from 'lucide-react-native';
import { useAppTheme } from '../theme/theme';

interface MonthlyViewProps {
  heatmap: HeatMapModel;
  streakMap: Record<string, number>;
  onSelectDate: (dateKey: string) => void;
}

export const MonthlyView: React.FC<MonthlyViewProps> = ({ heatmap, streakMap, onSelectDate }) => {
  const today = new Date();
  const [currentYear, setCurrentYear] = useState<number>(today.getFullYear());
  const [currentMonth, setCurrentMonth] = useState<number>(today.getMonth());
  const theme = useAppTheme();

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
        <View style={[styles.navGroup, { backgroundColor: theme.surfaceHighlight, borderColor: theme.border }]}>
          <TouchableOpacity style={styles.navButton} onPress={handlePrevMonth}>
            <ChevronLeft size={16} color={theme.textSecondary} />
          </TouchableOpacity>
          <Text style={[styles.monthTitle, { color: theme.text }]}>
            {monthNames[currentMonth]} {currentYear}
          </Text>
          <TouchableOpacity style={styles.navButton} onPress={handleNextMonth}>
            <ChevronRight size={16} color={theme.textSecondary} />
          </TouchableOpacity>
        </View>

        <TouchableOpacity style={[styles.todayButton, { backgroundColor: theme.surfaceHighlight, borderColor: theme.border }]} onPress={handleTodayJump}>
          <Text style={[styles.todayButtonText, { color: theme.textSecondary }]}>Current</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.weekdaysRow}>
        {dayNames.map((name, i) => (
          <View key={`th-${i}`} style={styles.weekdayCol}>
            <Text style={[styles.weekdayText, { color: theme.textMuted }]}>{name}</Text>
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

const fontStack = Platform.select({
  web: '"SF Pro Rounded", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
  ios: 'System',
  default: 'sans-serif',
});

const styles = StyleSheet.create({
  container: { paddingVertical: 10 },
  headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 },
  navGroup: { flexDirection: 'row', alignItems: 'center', borderWidth: 1, borderRadius: 8, paddingHorizontal: 8, paddingVertical: 4 },
  navButton: { padding: 3 },
  monthTitle: { fontSize: 13, fontWeight: '700', fontFamily: fontStack, marginHorizontal: 8 },
  todayButton: { borderWidth: 1, borderRadius: 8, paddingHorizontal: 12, paddingVertical: 5 },
  todayButtonText: { fontSize: 11, fontWeight: '600', fontFamily: fontStack },
  weekdaysRow: { flexDirection: 'row', marginBottom: 8 },
  weekdayCol: { flex: 1, alignItems: 'center' },
  weekdayText: { fontSize: 10, fontWeight: '600', fontFamily: fontStack },
  gridContainer: { flexDirection: 'row', flexWrap: 'wrap' },
  cellWrapper: { width: `${100 / 7}%`, alignItems: 'center', paddingVertical: 3 },
});

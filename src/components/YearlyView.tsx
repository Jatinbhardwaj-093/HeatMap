import React, { useState } from 'react';
import { StyleSheet, View, Text, ScrollView, TouchableOpacity, Platform } from 'react-native';
import { HeatMapModel } from '../types/heatmap';
import { getYearlyGrid } from '../utils/dateUtils';
import { PALETTES } from '../constants/palettes';
import { getStreakIntensityLevel } from '../utils/streakUtils';
import { DayCell } from './DayCell';
import { ChevronLeft, ChevronRight } from 'lucide-react-native';

interface YearlyViewProps {
  heatmap: HeatMapModel;
  streakMap: Record<string, number>;
  onSelectDate: (dateKey: string) => void;
}

export const YearlyView: React.FC<YearlyViewProps> = ({ heatmap, streakMap, onSelectDate }) => {
  const currentYear = new Date().getFullYear();
  const [selectedYear, setSelectedYear] = useState<number>(currentYear);
  const [hoveredDate, setHoveredDate] = useState<{ date: string; streak: number } | null>(null);

  const { weeks, monthHeaders } = getYearlyGrid(selectedYear);
  const palette = PALETTES[heatmap.paletteId] || PALETTES.emerald;

  const handleCellPress = (dateKey: string) => {
    const entry = heatmap.entries[dateKey];
    setHoveredDate({ date: dateKey, streak: streakMap[dateKey] || 0 });
    onSelectDate(dateKey);
  };

  return (
    <View style={styles.container}>
      <View style={styles.headerRow}>
        <View style={styles.yearSelector}>
          <TouchableOpacity
            style={styles.navButton}
            onPress={() => setSelectedYear((y) => y - 1)}
            activeOpacity={0.7}
          >
            <ChevronLeft size={16} color="#8B949E" />
          </TouchableOpacity>
          <Text style={styles.yearText}>{selectedYear}</Text>
          <TouchableOpacity
            style={styles.navButton}
            onPress={() => setSelectedYear((y) => y + 1)}
            activeOpacity={0.7}
          >
            <ChevronRight size={16} color="#8B949E" />
          </TouchableOpacity>
        </View>

        {hoveredDate && (
          <View style={styles.hoverInfo}>
            <Text style={styles.hoverText}>
              {hoveredDate.date}: {hoveredDate.streak > 0 ? `${hoveredDate.streak}d streak` : 'Not done'}
            </Text>
          </View>
        )}
      </View>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        <View>
          <View style={styles.monthsRow}>
            <View style={{ width: 24 }} />
            {monthHeaders.map((m, idx) => (
              <Text
                key={`${m.name}-${idx}`}
                style={[
                  styles.monthText,
                  {
                    left: m.weekIndex * 15 + 24,
                  },
                ]}
              >
                {m.name}
              </Text>
            ))}
          </View>

          <View style={styles.matrixWrapper}>
            <View style={styles.dayLabelsCol}>
              <Text style={styles.dayLabelText}>Mon</Text>
              <View style={{ height: 13 }} />
              <Text style={styles.dayLabelText}>Wed</Text>
              <View style={{ height: 13 }} />
              <Text style={styles.dayLabelText}>Fri</Text>
              <View style={{ height: 13 }} />
            </View>

            <View style={styles.weeksContainer}>
              {weeks.map((week, weekIdx) => (
                <View key={`w-${weekIdx}`} style={styles.weekColumn}>
                  {week.map((day) => {
                    const entry = heatmap.entries[day.dateKey];
                    const level = entry?.completed ? getStreakIntensityLevel(streakMap[day.dateKey] || 1) : 0;
                    return (
                      <DayCell
                        key={day.dateKey}
                        dateKey={day.dateKey}
                        level={level}
                        paletteId={heatmap.paletteId}
                        size={12}
                        dimmed={!day.inYear}
                        disabled={!day.inYear}
                        onPress={handleCellPress}
                      />
                    );
                  })}
                </View>
              ))}
            </View>
          </View>
        </View>
      </ScrollView>

      <View style={styles.legendRow}>
        <Text style={styles.legendLabel}>Less</Text>
        <View style={styles.legendSwatches}>
          {palette.levels.map((color, idx) => (
            <View
              key={`legend-${idx}`}
              style={[styles.legendSwatch, { backgroundColor: color }]}
            />
          ))}
        </View>
        <Text style={styles.legendLabel}>More</Text>
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
    marginBottom: 10,
  },
  yearSelector: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#161B22',
    borderWidth: 1,
    borderColor: '#30363D',
    borderRadius: 4,
    paddingHorizontal: 6,
    paddingVertical: 3,
  },
  navButton: {
    padding: 3,
  },
  yearText: {
    color: '#F0F6FC',
    fontSize: 13,
    fontWeight: '600',
    fontFamily: Platform.OS === 'ios' ? 'System' : 'sans-serif',
    marginHorizontal: 8,
  },
  hoverInfo: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    backgroundColor: '#161B22',
    borderColor: '#30363D',
    borderWidth: 1,
    borderRadius: 4,
  },
  hoverText: {
    color: '#8B949E',
    fontSize: 11,
    fontFamily: Platform.OS === 'ios' ? 'System' : 'sans-serif',
  },
  scrollContent: {
    paddingRight: 16,
  },
  monthsRow: {
    height: 16,
    marginBottom: 6,
    position: 'relative',
  },
  monthText: {
    position: 'absolute',
    color: '#8B949E',
    fontSize: 10,
    fontWeight: '500',
    fontFamily: Platform.OS === 'ios' ? 'System' : 'sans-serif',
  },
  matrixWrapper: {
    flexDirection: 'row',
  },
  dayLabelsCol: {
    width: 24,
    justifyContent: 'space-between',
    paddingVertical: 2,
    marginRight: 4,
  },
  dayLabelText: {
    color: '#6E7681',
    fontSize: 9,
    fontFamily: Platform.OS === 'ios' ? 'System' : 'sans-serif',
    lineHeight: 12,
  },
  weeksContainer: {
    flexDirection: 'row',
    gap: 3,
  },
  weekColumn: {
    flexDirection: 'column',
    gap: 3,
  },
  legendRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    marginTop: 10,
    gap: 6,
  },
  legendLabel: {
    color: '#6E7681',
    fontSize: 10,
    fontFamily: Platform.OS === 'ios' ? 'System' : 'sans-serif',
  },
  legendSwatches: {
    flexDirection: 'row',
    gap: 3,
  },
  legendSwatch: {
    width: 10,
    height: 10,
    borderRadius: 2,
    borderWidth: 1,
    borderColor: '#22272E',
  },
});

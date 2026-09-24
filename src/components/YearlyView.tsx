import React, { useState } from 'react';
import { StyleSheet, View, Text, ScrollView, TouchableOpacity, Platform } from 'react-native';
import { HeatMapModel } from '../types/heatmap';
import { getYearlyGrid } from '../utils/dateUtils';
import { PALETTES } from '../constants/palettes';
import { getStreakIntensityLevel } from '../utils/streakUtils';
import { DayCell } from './DayCell';
import { ChevronLeft, ChevronRight } from 'lucide-react-native';
import { useAppTheme, useIsDark } from '../theme/theme';

interface YearlyViewProps {
  heatmap: HeatMapModel;
  streakMap: Record<string, number>;
  onSelectDate: (dateKey: string) => void;
}

const CELL_SIZE = 14;
const CELL_GAP = 4;
const COLUMN_STEP = CELL_SIZE + CELL_GAP; // 18px per week
const DAY_LABELS_WIDTH = 32;

const fontStack = Platform.select({
  web: '"SF Pro Rounded", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
  ios: 'System',
  default: 'sans-serif',
});

export const YearlyView: React.FC<YearlyViewProps> = ({ heatmap, streakMap, onSelectDate }) => {
  const currentYear = new Date().getFullYear();
  const [selectedYear, setSelectedYear] = useState<number>(currentYear);
  const [hoveredDate, setHoveredDate] = useState<{ date: string; streak: number } | null>(null);

  const { weeks, monthHeaders } = getYearlyGrid(selectedYear);
  const palette = PALETTES[heatmap.paletteId] || PALETTES.emerald;
  const theme = useAppTheme();
  const isDark = useIsDark();

  const handleCellPress = (dateKey: string) => {
    setHoveredDate({ date: dateKey, streak: streakMap[dateKey] || 0 });
    onSelectDate(dateKey);
  };

  return (
    <View style={styles.container}>
      {/* Year Selector & Hover Info Header */}
      <View style={styles.headerRow}>
        <View style={[styles.yearSelector, { backgroundColor: theme.surfaceHighlight, borderColor: theme.borderSubtle }]}>
          <TouchableOpacity style={styles.navButton} onPress={() => setSelectedYear((y) => y - 1)} activeOpacity={0.7} accessibilityLabel="Previous year">
            <ChevronLeft size={16} color={theme.textSecondary} />
          </TouchableOpacity>
          <Text style={[styles.yearText, { color: theme.text }]}>{selectedYear}</Text>
          <TouchableOpacity style={styles.navButton} onPress={() => setSelectedYear((y) => y + 1)} activeOpacity={0.7} accessibilityLabel="Next year">
            <ChevronRight size={16} color={theme.textSecondary} />
          </TouchableOpacity>
        </View>

        {hoveredDate ? (
          <View style={[styles.hoverInfo, { backgroundColor: theme.surfaceHighlight, borderColor: theme.borderSubtle }]}>
            <Text style={[styles.hoverText, { color: theme.textSecondary }]}>
              {hoveredDate.date}: {hoveredDate.streak > 0 ? `${hoveredDate.streak}d streak` : 'Not done'}
            </Text>
          </View>
        ) : null}
      </View>

      {/* Horizontally scrollable on small screens, centered on large screens */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        <View style={styles.centeredMatrixBlock}>
          {/* Month Headers */}
          <View style={styles.monthsRow}>
            {monthHeaders.map((m, idx) => (
              <Text
                key={`${m.name}-${idx}`}
                style={[
                  styles.monthText,
                  {
                    left: m.weekIndex * COLUMN_STEP + DAY_LABELS_WIDTH,
                    color: theme.textMuted,
                  },
                ]}
              >
                {m.name}
              </Text>
            ))}
          </View>

          {/* Matrix Body: Day labels + 53 week columns */}
          <View style={styles.matrixWrapper}>
            <View style={[styles.dayLabelsCol, { width: DAY_LABELS_WIDTH }]}>
              <Text style={[styles.dayLabelText, { color: theme.textMuted, top: 0 }]}>Mon</Text>
              <Text style={[styles.dayLabelText, { color: theme.textMuted, top: COLUMN_STEP * 2 }]}>Wed</Text>
              <Text style={[styles.dayLabelText, { color: theme.textMuted, top: COLUMN_STEP * 4 }]}>Fri</Text>
            </View>

            <View style={[styles.weeksContainer, { gap: CELL_GAP }]}>
              {weeks.map((week, weekIdx) => (
                <View key={`w-${weekIdx}`} style={[styles.weekColumn, { gap: CELL_GAP }]}>
                  {week.map((day) => {
                    const entry = heatmap.entries[day.dateKey];
                    const level = entry?.completed ? getStreakIntensityLevel(streakMap[day.dateKey] || 1) : 0;
                    return (
                      <DayCell
                        key={day.dateKey}
                        dateKey={day.dateKey}
                        level={level}
                        paletteId={heatmap.paletteId}
                        size={CELL_SIZE}
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

          {/* Legend aligned with matrix */}
          <View style={styles.legendRow}>
            <Text style={[styles.legendLabel, { color: theme.textMuted }]}>Less</Text>
            <View style={styles.legendSwatches}>
              {palette.levels.map((color, idx) => (
                <View
                  key={`legend-${idx}`}
                  style={[
                    styles.legendSwatch,
                    {
                      backgroundColor: !isDark && idx === 0 ? theme.surfaceHighlight : color,
                      borderColor: isDark ? '#22272E' : theme.borderSubtle,
                    },
                  ]}
                />
              ))}
            </View>
            <Text style={[styles.legendLabel, { color: theme.textMuted }]}>More</Text>
          </View>
        </View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingVertical: 6,
    width: '100%',
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 14,
  },
  yearSelector: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  navButton: {
    padding: 3,
  },
  yearText: {
    fontSize: 13,
    fontWeight: '700',
    fontFamily: fontStack,
    marginHorizontal: 8,
  },
  hoverInfo: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderWidth: 1,
    borderRadius: 8,
  },
  hoverText: {
    fontSize: 11,
    fontFamily: fontStack,
  },
  scrollContent: {
    minWidth: '100%',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 4,
  },
  centeredMatrixBlock: {
    alignSelf: 'center',
  },
  monthsRow: {
    height: 18,
    marginBottom: 6,
    position: 'relative',
  },
  monthText: {
    position: 'absolute',
    fontSize: 10,
    fontWeight: '600',
    fontFamily: fontStack,
  },
  matrixWrapper: {
    flexDirection: 'row',
  },
  dayLabelsCol: {
    position: 'relative',
    height: COLUMN_STEP * 7,
  },
  dayLabelText: {
    position: 'absolute',
    fontSize: 9,
    fontFamily: fontStack,
    lineHeight: CELL_SIZE,
  },
  weeksContainer: {
    flexDirection: 'row',
  },
  weekColumn: {
    flexDirection: 'column',
  },
  legendRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    marginTop: 12,
    gap: 6,
  },
  legendLabel: {
    fontSize: 10,
    fontFamily: fontStack,
  },
  legendSwatches: {
    flexDirection: 'row',
    gap: 3,
  },
  legendSwatch: {
    width: 11,
    height: 11,
    borderRadius: 2.5,
    borderWidth: 1,
  },
});

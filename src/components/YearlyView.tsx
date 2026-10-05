import React, { useState } from 'react';
import { StyleSheet, View, Text, ScrollView, TouchableOpacity, Platform, useWindowDimensions } from 'react-native';
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

const DESKTOP_CELL_SIZE = 14;
const DESKTOP_CELL_GAP = 4;
const DESKTOP_COLUMN_STEP = DESKTOP_CELL_SIZE + DESKTOP_CELL_GAP; // 18px per week
const DESKTOP_DAY_LABELS_WIDTH = 32;

const MOBILE_MONTH_HEADERS = [
  { label: 'Jan', week: 0 },
  { label: 'Mar', week: 9 },
  { label: 'May', week: 17 },
  { label: 'Jul', week: 26 },
  { label: 'Sep', week: 35 },
  { label: 'Nov', week: 44 },
];

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
  const { width } = useWindowDimensions();
  const isMobile = width < 768;

  // Responsive mobile micro-matrix calculation (zero horizontal cutoff)
  const mobileCardPadding = 32; // 16px card padding each side
  const mobileAvailableWidth = Math.max(260, width - 40 - mobileCardPadding);
  const mobileDayLabelWidth = 14;
  const mobileCellGap = 1.5;
  const numWeeks = weeks.length || 52;
  const mobileCellSize = Math.max(3.2, Math.min(6.5, (mobileAvailableWidth - mobileDayLabelWidth - ((numWeeks - 1) * mobileCellGap)) / numWeeks));
  const mobileStep = mobileCellSize + mobileCellGap;

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
            <ChevronLeft size={15} color={theme.textSecondary} />
          </TouchableOpacity>
          <Text style={[styles.yearText, { color: theme.text }]}>{selectedYear}</Text>
          <TouchableOpacity style={styles.navButton} onPress={() => setSelectedYear((y) => y + 1)} activeOpacity={0.7} accessibilityLabel="Next year">
            <ChevronRight size={15} color={theme.textSecondary} />
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

      {/* Matrix Body: Mobile fits 100% cleanly without scroll; Desktop centers */}
      {isMobile ? (
        <View style={styles.mobileMatrixContainer}>
          {/* Mobile Month Headers (clean non-overlapping markers) */}
          <View style={[styles.mobileMonthsRow, { height: 16 }]}>
            <View style={{ width: mobileDayLabelWidth }} />
            <View style={[styles.mobileMonthsRelative, { width: numWeeks * mobileStep }]}>
              {MOBILE_MONTH_HEADERS.map((m) => (
                <Text
                  key={m.label}
                  style={[
                    styles.mobileMonthText,
                    {
                      left: m.week * mobileStep,
                      color: theme.textMuted,
                    },
                  ]}
                >
                  {m.label}
                </Text>
              ))}
            </View>
          </View>

          {/* Mobile Grid: Day Labels + Columns */}
          <View style={styles.mobileMatrixBody}>
            {/* Day labels column */}
            <View style={[styles.mobileDayLabelsCol, { width: mobileDayLabelWidth }]}>
              <Text style={[styles.mobileDayLabelText, { color: theme.textMuted, height: mobileStep * 2 }]}>M</Text>
              <Text style={[styles.mobileDayLabelText, { color: theme.textMuted, height: mobileStep * 2 }]}>W</Text>
              <Text style={[styles.mobileDayLabelText, { color: theme.textMuted, height: mobileStep * 2 }]}>F</Text>
              <Text style={[styles.mobileDayLabelText, { color: theme.textMuted, height: mobileStep }]}>S</Text>
            </View>

            {/* 52 Columns fitted to card */}
            <View style={styles.mobileWeeksRow}>
              {weeks.map((week, weekIdx) => (
                <View key={`w-${weekIdx}`} style={[styles.mobileWeekCol, { width: mobileCellSize, marginRight: mobileCellGap }]}>
                  {week.map((day) => {
                    const entry = heatmap.entries[day.dateKey];
                    const level = entry?.completed ? getStreakIntensityLevel(streakMap[day.dateKey] || 1) : 0;
                    return (
                      <DayCell
                        key={day.dateKey}
                        dateKey={day.dateKey}
                        level={level}
                        paletteId={heatmap.paletteId}
                        size={mobileCellSize}
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

          {/* Mobile Legend */}
          <View style={styles.legendRow}>
            <Text style={[styles.legendLabel, { color: theme.textMuted }]}>Less</Text>
            <View style={styles.legendSwatches}>
              {(!isDark && palette.lightLevels ? palette.lightLevels : palette.levels).map((color, idx) => (
                <View
                  key={`legend-${idx}`}
                  style={[
                    styles.legendSwatchMobile,
                    {
                      backgroundColor: color,
                      borderColor: isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.08)',
                      borderWidth: idx === 0 ? 1 : 0,
                    },
                  ]}
                />
              ))}
            </View>
            <Text style={[styles.legendLabel, { color: theme.textMuted }]}>More</Text>
          </View>
        </View>
      ) : (
        /* Desktop centered matrix view */
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
        >
          <View style={styles.centeredMatrixBlock}>
            {/* Desktop Month Headers */}
            <View style={styles.monthsRow}>
              {monthHeaders.map((m, idx) => (
                <Text
                  key={`${m.name}-${idx}`}
                  style={[
                    styles.monthText,
                    {
                      left: m.weekIndex * DESKTOP_COLUMN_STEP + DESKTOP_DAY_LABELS_WIDTH,
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
              <View style={[styles.dayLabelsCol, { width: DESKTOP_DAY_LABELS_WIDTH }]}>
                <Text style={[styles.dayLabelText, { color: theme.textMuted, top: 0 }]}>Mon</Text>
                <Text style={[styles.dayLabelText, { color: theme.textMuted, top: DESKTOP_COLUMN_STEP * 2 }]}>Wed</Text>
                <Text style={[styles.dayLabelText, { color: theme.textMuted, top: DESKTOP_COLUMN_STEP * 4 }]}>Fri</Text>
              </View>

              <View style={[styles.weeksContainer, { gap: DESKTOP_CELL_GAP }]}>
                {weeks.map((week, weekIdx) => (
                  <View key={`w-${weekIdx}`} style={[styles.weekColumn, { gap: DESKTOP_CELL_GAP }]}>
                    {week.map((day) => {
                      const entry = heatmap.entries[day.dateKey];
                      const level = entry?.completed ? getStreakIntensityLevel(streakMap[day.dateKey] || 1) : 0;
                      return (
                        <DayCell
                          key={day.dateKey}
                          dateKey={day.dateKey}
                          level={level}
                          paletteId={heatmap.paletteId}
                          size={DESKTOP_CELL_SIZE}
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

            {/* Desktop Legend */}
            <View style={styles.legendRow}>
              <Text style={[styles.legendLabel, { color: theme.textMuted }]}>Less</Text>
              <View style={styles.legendSwatches}>
                {(!isDark && palette.lightLevels ? palette.lightLevels : palette.levels).map((color, idx) => (
                  <View
                    key={`legend-${idx}`}
                    style={[
                      styles.legendSwatch,
                      {
                        backgroundColor: color,
                        borderColor: isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.08)',
                        borderWidth: idx === 0 ? 1 : 0,
                      },
                    ]}
                  />
                ))}
              </View>
              <Text style={[styles.legendLabel, { color: theme.textMuted }]}>More</Text>
            </View>
          </View>
        </ScrollView>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingVertical: 4,
    width: '100%',
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
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 3,
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

  // Mobile micro-matrix layout
  mobileMatrixContainer: {
    width: '100%',
    alignItems: 'center',
  },
  mobileMonthsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '100%',
    marginBottom: 4,
  },
  mobileMonthsRelative: {
    position: 'relative',
    height: 14,
  },
  mobileMonthText: {
    position: 'absolute',
    fontSize: 9,
    fontWeight: '600',
    fontFamily: fontStack,
  },
  mobileMatrixBody: {
    flexDirection: 'row',
    width: '100%',
    alignItems: 'flex-start',
  },
  mobileDayLabelsCol: {
    justifyContent: 'flex-start',
  },
  mobileDayLabelText: {
    fontSize: 7.5,
    fontWeight: '700',
    fontFamily: fontStack,
    lineHeight: 9,
  },
  mobileWeeksRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    flex: 1,
  },
  mobileWeekCol: {
    flexDirection: 'column',
    gap: 1.5,
  },

  // Desktop layout
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
    height: DESKTOP_COLUMN_STEP * 7,
  },
  dayLabelText: {
    position: 'absolute',
    fontSize: 9,
    fontFamily: fontStack,
    lineHeight: DESKTOP_CELL_SIZE,
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
    marginTop: 8,
    gap: 6,
    width: '100%',
  },
  legendLabel: {
    fontSize: 9.5,
    fontFamily: fontStack,
  },
  legendSwatches: {
    flexDirection: 'row',
    gap: 2.5,
  },
  legendSwatch: {
    width: 11,
    height: 11,
    borderRadius: 2.5,
    borderWidth: 1,
  },
  legendSwatchMobile: {
    width: 8,
    height: 8,
    borderRadius: 1.5,
    borderWidth: 0.5,
  },
});

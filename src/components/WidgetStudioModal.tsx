import React, { useState } from 'react';
import {
  StyleSheet,
  View,
  Text,
  Modal,
  TouchableOpacity,
  ScrollView,
  Platform,
} from 'react-native';
import { HeatMapModel } from '../types/heatmap';
import { PALETTES } from '../constants/palettes';
import { getStreakIntensityLevel } from '../utils/streakUtils';
import { DayCell } from './DayCell';
import { X, Smartphone, Check } from 'lucide-react-native';
import { useAppTheme, useIsDark } from '../theme/theme';

interface WidgetStudioModalProps {
  visible: boolean;
  heatmaps: HeatMapModel[];
  onClose: () => void;
}

type WidgetSize = 'small' | 'medium' | 'large';

const fontStack = Platform.select({
  web: '"SF Pro Rounded", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
  ios: 'System',
  default: 'sans-serif',
});

export const WidgetStudioModal: React.FC<WidgetStudioModalProps> = ({
  visible,
  heatmaps,
  onClose,
}) => {
  const theme = useAppTheme();
  const isDark = useIsDark();

  const [selectedMapId, setSelectedMapId] = useState<string | null>(heatmaps[0]?.id || null);
  const [widgetSize, setWidgetSize] = useState<WidgetSize>('medium');

  if (!visible) return null;

  const currentMap = heatmaps.find((m) => m.id === selectedMapId) || heatmaps[0];
  if (!currentMap) {
    return (
      <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
        <View style={styles.overlay}>
          <View style={[styles.modalBox, { backgroundColor: theme.surface, borderColor: theme.borderSubtle }]}>
            <Text style={[styles.emptyText, { color: theme.textSecondary }]}>No habits available for Widgets.</Text>
            <TouchableOpacity onPress={onClose} style={[styles.closeBtn, { backgroundColor: theme.surfaceHighlight }]}>
              <X size={16} color={theme.textSecondary} />
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    );
  }

  // Weeks to display based on widget size:
  // 2x2 Small: 8 weeks (fits 148px widget width)
  // 4x2 Medium: 19 weeks (fills 300px widget width edge-to-edge)
  // 4x4 Large: 19 weeks (fills 300px widget width edge-to-edge)
  const numWeeks = widgetSize === 'small' ? 8 : 19;
  const cellSize = widgetSize === 'small' ? 12 : 11.5;
  const cellGap = widgetSize === 'small' ? 3 : 3;

  // Build grid of recent days organized by week columns (each column = 7 days, Mon to Sun)
  const generateWidgetGrid = () => {
    const today = new Date();
    // Monday is 0, Sunday is 6
    const dayOfWeek = (today.getDay() + 6) % 7;
    const totalDays = numWeeks * 7;
    const gridWeeks: Array<Array<{ dateKey: string; level: 0 | 1 | 2 | 3 | 4 }>> = [];

    // Start date such that the last column ends on this Sunday
    const startDate = new Date(today);
    startDate.setDate(today.getDate() - (totalDays - 1 - (6 - dayOfWeek)));

    let curDate = new Date(startDate);
    for (let w = 0; w < numWeeks; w++) {
      const weekDays = [];
      for (let d = 0; d < 7; d++) {
        const year = curDate.getFullYear();
        const month = String(curDate.getMonth() + 1).padStart(2, '0');
        const day = String(curDate.getDate()).padStart(2, '0');
        const key = `${year}-${month}-${day}`;
        const entry = currentMap.entries[key];
        const isFuture = curDate > today;
        const level = entry?.completed && !isFuture ? getStreakIntensityLevel(1) : 0;

        weekDays.push({
          dateKey: key,
          level,
        });

        curDate.setDate(curDate.getDate() + 1);
      }
      gridWeeks.push(weekDays);
    }
    return gridWeeks;
  };

  const widgetGrid = generateWidgetGrid();
  const palette = PALETTES[currentMap.paletteId] || PALETTES.emerald;

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={[styles.modalBox, { backgroundColor: theme.surface, borderColor: theme.borderSubtle }]}>
          
          {/* Header */}
          <View style={[styles.header, { borderBottomColor: theme.borderSubtle }]}>
            <View>
              <Text style={[styles.modalSubtitle, { color: theme.textMuted }]}>HOME SCREEN WIDGET</Text>
              <Text style={[styles.modalTitle, { color: theme.text }]}>Widget Studio</Text>
            </View>
            <TouchableOpacity
              onPress={onClose}
              style={[styles.closeBtn, { backgroundColor: theme.surfaceHighlight }]}
              accessibilityLabel="Close"
            >
              <X size={16} color={theme.textSecondary} />
            </TouchableOpacity>
          </View>

          {/* Habit Selector Bar (Always hidden scrollbar) */}
          <View style={[styles.selectorBar, { backgroundColor: theme.surfaceHighlight, borderBottomColor: theme.borderSubtle }]}>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              overScrollMode="never"
              contentContainerStyle={styles.selectorScroll}
              style={[
                Platform.OS === 'web'
                  ? ({
                      scrollbarWidth: 'none',
                      msOverflowStyle: 'none',
                    } as any)
                  : {},
              ]}
            >
              {heatmaps.map((m) => {
                const isSelected = (selectedMapId || currentMap.id) === m.id;
                const mPalette = PALETTES[m.paletteId] || PALETTES.emerald;
                return (
                  <TouchableOpacity
                    key={m.id}
                    style={[
                      styles.habitPill,
                      {
                        backgroundColor: isSelected ? theme.surface : 'transparent',
                        borderColor: isSelected ? mPalette.accent : theme.borderSubtle,
                      },
                    ]}
                    onPress={() => setSelectedMapId(m.id)}
                    activeOpacity={0.7}
                  >
                    <View style={[styles.pillDot, { backgroundColor: mPalette.accent }]} />
                    <Text
                      style={[
                        styles.habitPillText,
                        { color: isSelected ? theme.text : theme.textSecondary },
                        isSelected && { fontWeight: '700' },
                      ]}
                    >
                      {m.title}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          </View>

          {/* Scrollable Content Body */}
          <ScrollView
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.scrollBody}
          >
            {/* Minimalist Size Switcher (2x2, 4x2, 4x4) */}
            <View style={styles.sizeControlSection}>
              <Text style={[styles.sectionLabel, { color: theme.textMuted }]}>PREVIEW SIZE</Text>
              <View style={[styles.sizeSwitcher, { backgroundColor: isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.05)' }]}>
                {(['small', 'medium', 'large'] as WidgetSize[]).map((sz) => {
                  const isActive = widgetSize === sz;
                  const label = sz === 'small' ? '2×2' : sz === 'medium' ? '4×2' : '4×4';
                  return (
                    <TouchableOpacity
                      key={sz}
                      style={[
                        styles.sizeOption,
                        isActive && [
                          styles.sizeOptionActive,
                          { backgroundColor: isDark ? '#21262D' : '#FFFFFF' },
                          Platform.select({
                            web: {
                              boxShadow: isDark
                                ? '0 1px 3px rgba(0, 0, 0, 0.4)'
                                : '0 1px 3px rgba(0, 0, 0, 0.1), 0 1px 2px rgba(0, 0, 0, 0.06)',
                            } as any,
                            default: {
                              shadowColor: '#000000',
                              shadowOffset: { width: 0, height: 1 },
                              shadowOpacity: 0.12,
                              shadowRadius: 2,
                              elevation: 1,
                            },
                          }),
                        ],
                      ]}
                      onPress={() => setWidgetSize(sz)}
                      activeOpacity={0.7}
                    >
                      <Text
                        style={[
                          styles.sizeOptionText,
                          { color: isActive ? theme.text : theme.textSecondary },
                          isActive && { fontWeight: '700' },
                        ]}
                      >
                        {label}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>

            {/* Widget Preview Canvas */}
            <View style={[styles.canvasBox, { backgroundColor: theme.surfaceHighlight, borderColor: theme.borderSubtle }]}>
              {/* Native Home Screen Widget: Habit Name in Top Left, Pure Matrix Everywhere Else */}
              <View
                style={[
                  styles.nativeWidget,
                  widgetSize === 'small' ? styles.nativeWidgetSmall : styles.nativeWidgetWide,
                  {
                    backgroundColor: isDark ? '#161B22' : '#FFFFFF',
                    borderColor: isDark ? '#30363D' : '#D0D7DE',
                    ...(Platform.OS === 'web'
                      ? {
                          boxShadow: isDark
                            ? '0 8px 24px rgba(0, 0, 0, 0.45)'
                            : '0 8px 24px rgba(0, 0, 0, 0.08)',
                        }
                      : {}),
                  },
                ]}
              >
                {/* Top Left: Habit Name Only */}
                <View style={styles.widgetHeader}>
                  <Text style={[styles.widgetHabitTitle, { color: isDark ? '#F0F6FC' : '#1F2328' }]} numberOfLines={1}>
                    {currentMap.title}
                  </Text>
                </View>

                {/* Pure Contribution Matrix - Fills Edge to Edge */}
                <View style={[styles.matrixColumns, { gap: cellGap }]}>
                  {widgetGrid.map((week, wIdx) => (
                    <View key={`ww-${wIdx}`} style={[styles.matrixColumn, { gap: cellGap }]}>
                      {week.map((day) => (
                        <DayCell
                          key={`wd-${day.dateKey}`}
                          dateKey={day.dateKey}
                          level={day.level}
                          paletteId={currentMap.paletteId}
                          size={cellSize}
                          disabled={true}
                        />
                      ))}
                    </View>
                  ))}
                </View>
              </View>
            </View>

            {/* Brief, Minimalist Home Screen Guide */}
            <View style={[styles.guideCard, { backgroundColor: theme.surfaceHighlight, borderColor: theme.borderSubtle }]}>
              <View style={styles.guideHeader}>
                <Smartphone size={14} color={theme.text} />
                <Text style={[styles.guideTitle, { color: theme.text }]}>Add to Home Screen</Text>
              </View>

              <View style={styles.guideSteps}>
                <Text style={[styles.stepText, { color: theme.textSecondary }]}>
                  • Long-press Home Screen → <Text style={{ fontWeight: '700', color: theme.text }}>Widgets</Text> → <Text style={{ fontWeight: '700', color: theme.text }}>TrackHeat</Text>
                </Text>
                <Text style={[styles.stepText, { color: theme.textSecondary }]}>
                  • Place widget, then drag borders to resize (<Text style={{ fontWeight: '600', color: theme.text }}>2×2, 4×2, 4×4</Text>)
                </Text>
              </View>
            </View>

          </ScrollView>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.75)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  modalBox: {
    width: '100%',
    maxWidth: 480,
    maxHeight: '90%',
    borderWidth: 1,
    borderRadius: 16,
    overflow: 'hidden',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 18,
    paddingVertical: 14,
    borderBottomWidth: 1,
  },
  modalSubtitle: {
    fontSize: 9.5,
    fontWeight: '700',
    fontFamily: fontStack,
    letterSpacing: 0.6,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '700',
    fontFamily: fontStack,
    marginTop: 2,
  },
  closeBtn: {
    width: 30,
    height: 30,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  selectorBar: {
    borderBottomWidth: 1,
  },
  selectorScroll: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    gap: 8,
  },
  habitPill: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 13,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1,
    gap: 6,
  },
  pillDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  habitPillText: {
    fontSize: 12,
    fontFamily: fontStack,
  },
  scrollBody: {
    padding: 18,
    gap: 16,
  },
  sizeControlSection: {
    gap: 6,
  },
  sectionLabel: {
    fontSize: 10,
    fontWeight: '700',
    fontFamily: fontStack,
    letterSpacing: 0.5,
  },
  sizeSwitcher: {
    flexDirection: 'row',
    borderRadius: 20,
    padding: 3,
  },
  sizeOption: {
    flex: 1,
    paddingVertical: 6,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 16,
  },
  sizeOptionActive: {},
  sizeOptionText: {
    fontSize: 11.5,
    fontFamily: fontStack,
    letterSpacing: 0.2,
  },
  canvasBox: {
    borderWidth: 1,
    borderRadius: 14,
    padding: 18,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 180,
  },

  // Native Widget Container (Mimicking iOS & Android system widget chrome)
  nativeWidget: {
    borderRadius: 18,
    borderWidth: 1,
    padding: 14,
    alignItems: 'flex-start',
    alignSelf: 'center',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.12,
        shadowRadius: 10,
      },
      android: {
        elevation: 4,
      },
    }),
  },
  nativeWidgetSmall: {
    width: 148,
    minHeight: 148,
  },
  nativeWidgetWide: {
    width: 304,
    minHeight: 126,
  },

  widgetHeader: {
    width: '100%',
    marginBottom: 10,
  },
  widgetHabitTitle: {
    fontSize: 13,
    fontWeight: '700',
    fontFamily: fontStack,
    letterSpacing: -0.1,
  },
  matrixColumns: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  matrixColumn: {
    flexDirection: 'column',
  },

  // Minimalist Guide Card
  guideCard: {
    borderWidth: 1,
    borderRadius: 12,
    padding: 12,
    gap: 8,
  },
  guideHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  guideTitle: {
    fontSize: 12,
    fontWeight: '700',
    fontFamily: fontStack,
  },
  guideSteps: {
    gap: 5,
  },
  stepText: {
    fontSize: 11.5,
    fontFamily: fontStack,
    lineHeight: 16,
  },
  emptyText: {
    fontSize: 13,
    fontFamily: fontStack,
    textAlign: 'center',
    padding: 24,
  },
});

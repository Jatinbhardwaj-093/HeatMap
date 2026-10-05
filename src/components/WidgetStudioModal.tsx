import React, { useState, useEffect } from 'react';
import {
  Modal,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  Platform,
} from 'react-native';
import { X, Smartphone, Check, Plus } from 'lucide-react-native';
import { HeatMapModel, PaletteId } from '../types/heatmap';
import { PALETTES } from '../constants/palettes';
import { DayCell } from './DayCell';
import { getStreakIntensityLevel } from '../utils/streakUtils';
import { useAppTheme, useIsDark } from '../theme/theme';
import { setActiveWidgetConfig, getWidgetConfig } from '../widgets/widgetStorage';
import { updateAndroidWidgets } from '../widgets/widgetSync';

interface WidgetStudioModalProps {
  visible: boolean;
  heatmaps: HeatMapModel[];
  onClose: () => void;
}

type WidgetPreset = '2x1' | '4x1' | '2x2' | '4x2' | '5x2';

const fontStack = Platform.select({
  web: '"SF Pro Rounded", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
  ios: 'System',
  default: 'sans-serif',
});

const paletteList: PaletteId[] = ['emerald', 'cyan', 'amber', 'crimson', 'obsidian'];

export const WidgetStudioModal: React.FC<WidgetStudioModalProps> = ({
  visible,
  heatmaps,
  onClose,
}) => {
  const theme = useAppTheme();
  const isAppDark = useIsDark();

  const [selectedMapId, setSelectedMapId] = useState<string | null>(heatmaps[0]?.id || null);
  const [preset, setPreset] = useState<WidgetPreset>('4x2');
  const [customAlias, setCustomAlias] = useState<string>('');
  const [themeChoice, setThemeChoice] = useState<'system' | 'dark' | 'light'>('system');
  const [selectedPalette, setSelectedPalette] = useState<PaletteId>('emerald');
  const [pinStatus, setPinStatus] = useState<string | null>(null);

  useEffect(() => {
    if (visible) {
      getWidgetConfig().then((cfg) => {
        if (cfg) {
          if (cfg.habitId && heatmaps.some((h) => h.id === cfg.habitId)) {
            setSelectedMapId(cfg.habitId);
          }
          if (cfg.customName) setCustomAlias(cfg.customName);
          if (cfg.theme) setThemeChoice(cfg.theme);
          if (cfg.paletteId) setSelectedPalette(cfg.paletteId);
        } else if (heatmaps[0]) {
          setSelectedPalette(heatmaps[0].paletteId || 'emerald');
        }
      });
    }
  }, [visible, heatmaps]);

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

  // Dimensions based on preset:
  // Height: 1 row (2x1, 4x1) or 2 rows (2x2, 4x2, 5x2)
  // Width: 2 to 5 columns wide
  const isSingleRow = preset === '2x1' || preset === '4x1';
  const isCompactWidth = preset === '2x1' || preset === '2x2';

  const numWeeks =
    preset === '2x1' ? 10 :
    preset === '4x1' ? 22 :
    preset === '2x2' ? 8 :
    preset === '4x2' ? 18 : 22;

  const cellSize = isSingleRow ? 7 : 11;
  const cellGap = isSingleRow ? 2 : 2.5;
  const titleFontSize = isSingleRow ? 11 : 14;

  const previewWidth =
    preset === '2x1' || preset === '2x2' ? 148 :
    preset === '4x1' || preset === '4x2' ? 310 : 364;

  const previewMinHeight = isSingleRow ? 88 : 132;

  // Resolved preview theme
  const isWidgetDark =
    themeChoice === 'dark' ? true :
    themeChoice === 'light' ? false : isAppDark;

  // Build grid of recent days organized by week columns (each column = 7 days, Mon to Sun)
  const generateWidgetGrid = () => {
    const today = new Date();
    const todayMidnight = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    const dayOfWeek = (today.getDay() + 6) % 7;
    const totalDays = numWeeks * 7;
    const gridWeeks: Array<Array<{ dateKey: string; level: 0 | 1 | 2 | 3 | 4; isFuture: boolean }>> = [];

    const startDate = new Date(today);
    startDate.setDate(today.getDate() - (totalDays - 1 - (6 - dayOfWeek)));

    let curDate = new Date(startDate);
    for (let w = 0; w < numWeeks; w++) {
      const weekDays = [];
      for (let d = 0; d < 7; d++) {
        const curMidnight = new Date(curDate.getFullYear(), curDate.getMonth(), curDate.getDate());
        const isFuture = curMidnight > todayMidnight;

        const year = curDate.getFullYear();
        const month = String(curDate.getMonth() + 1).padStart(2, '0');
        const day = String(curDate.getDate()).padStart(2, '0');
        const key = `${year}-${month}-${day}`;
        const entry = currentMap.entries[key];
        const level = entry?.completed && !isFuture ? getStreakIntensityLevel(1) : 0;

        weekDays.push({
          dateKey: key,
          level,
          isFuture,
        });

        curDate.setDate(curDate.getDate() + 1);
      }
      gridWeeks.push(weekDays);
    }
    return gridWeeks;
  };

  const widgetGrid = generateWidgetGrid();
  const palette = PALETTES[selectedPalette] || PALETTES[currentMap.paletteId] || PALETTES.emerald;
  const displayTitle = customAlias.trim() || currentMap.title;

  const today = new Date();
  const todayKey = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
  const isTodayDone = Boolean(currentMap.entries[todayKey]?.completed);

  const handleApplyToHomeScreen = async () => {
    try {
      const config = {
        habitId: currentMap.id,
        customName: customAlias.trim() || undefined,
        theme: themeChoice,
        paletteId: selectedPalette,
      };

      await setActiveWidgetConfig(config);
      await updateAndroidWidgets();

      if (Platform.OS === 'android') {
        try {
          const { requestPinWidget } = require('react-native-android-widget');
          const pinned = await requestPinWidget({ widgetName: 'TrackHeatWidget' });
          if (pinned) {
            setPinStatus('Prompt opened! Confirm on your home screen.');
          } else {
            setPinStatus(`Widget set to "${displayTitle}"`);
          }
        } catch {
          setPinStatus(`Widget set to "${displayTitle}"`);
        }
      } else {
        setPinStatus(`Widget set to "${displayTitle}"`);
      }
    } catch {
      setPinStatus('Error saving widget habit');
    }

    setTimeout(() => {
      setPinStatus(null);
    }, 4000);
  };

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
                    onPress={() => {
                      setSelectedMapId(m.id);
                      setSelectedPalette(m.paletteId || 'emerald');
                    }}
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
            {/* Minimalist Size Switcher (Height: 1 or 2 rows; Width: 2 to 5 columns) */}
            <View style={styles.sizeControlSection}>
              <View style={styles.sizeSectionHeader}>
                <Text style={[styles.sectionLabel, { color: theme.textMuted }]}>PREVIEW SIZE</Text>
                <Text style={[styles.sizeHint, { color: theme.textSecondary }]}>Height: 1, 2 • Width: 2 to 5</Text>
              </View>
              <View style={[styles.sizeSwitcher, { backgroundColor: isAppDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.05)' }]}>
                {(['2x1', '4x1', '2x2', '4x2', '5x2'] as WidgetPreset[]).map((p) => {
                  const isActive = preset === p;
                  const label = p.replace('x', '×');
                  return (
                    <TouchableOpacity
                      key={p}
                      style={[
                        styles.sizeOption,
                        isActive && [
                          styles.sizeOptionActive,
                          { backgroundColor: isAppDark ? '#21262D' : '#FFFFFF' },
                          Platform.select({
                            web: {
                              boxShadow: isAppDark
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
                      onPress={() => setPreset(p)}
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
              {/* Native Home Screen Widget: Habit Name + Direct Action + Stretched Matrix */}
              <View
                style={[
                  styles.nativeWidget,
                  {
                    width: previewWidth,
                    minHeight: previewMinHeight,
                    backgroundColor: isWidgetDark ? '#161B22' : '#FFFFFF',
                    borderColor: isWidgetDark ? '#30363D' : '#D0D7DE',
                    padding: isSingleRow ? 8 : 12,
                    ...(Platform.OS === 'web'
                      ? {
                          boxShadow: isWidgetDark
                            ? '0 8px 24px rgba(0, 0, 0, 0.45)'
                            : '0 8px 24px rgba(0, 0, 0, 0.08)',
                        }
                      : {}),
                  },
                ]}
              >
                {/* Top: Habit Name + Compact Toggle Button */}
                <View style={[styles.widgetHeader, { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: isSingleRow ? 4 : 8 }]}>
                  <Text
                    style={[
                      styles.widgetHabitTitle,
                      {
                        color: isWidgetDark ? '#F0F6FC' : '#1F2328',
                        fontSize: titleFontSize,
                        flex: 1,
                        marginRight: 6,
                      },
                    ]}
                    numberOfLines={1}
                  >
                    {displayTitle}
                  </Text>

                  {/* Single symbol '+' / '✓' on 2-wide; full badge on wider */}
                  <View
                    style={{
                      flexDirection: 'row',
                      alignItems: 'center',
                      justifyContent: 'center',
                      paddingHorizontal: isCompactWidth ? 6 : 8,
                      paddingVertical: isSingleRow ? 1.5 : 3,
                      borderRadius: isCompactWidth ? 10 : 8,
                      backgroundColor: isTodayDone
                        ? (isWidgetDark ? '#238636' : '#2EA043')
                        : (isWidgetDark ? '#21262D' : '#F0F2F5'),
                      borderColor: isTodayDone
                        ? (isWidgetDark ? '#2EA043' : '#238636')
                        : (isWidgetDark ? '#30363D' : '#D0D7DE'),
                      borderWidth: 1,
                    }}
                  >
                    <Text
                      style={{
                        fontSize: isSingleRow ? (isCompactWidth ? 11 : 9) : (isCompactWidth ? 12 : 10),
                        fontWeight: '700',
                        color: isTodayDone ? '#FFFFFF' : (isWidgetDark ? '#F0F3F6' : '#1F2328'),
                        fontFamily: fontStack,
                      }}
                    >
                      {isCompactWidth
                        ? (isTodayDone ? '✓' : '+')
                        : (isTodayDone ? '✓ Done' : '+ Log')}
                    </Text>
                  </View>
                </View>

                {/* Pure Contribution Matrix - Future days are transparent */}
                <View style={[styles.matrixColumns, { gap: cellGap }]}>
                  {widgetGrid.map((week, wIdx) => (
                    <View key={`ww-${wIdx}`} style={[styles.matrixColumn, { gap: cellGap }]}>
                      {week.map((day) =>
                        day.isFuture ? (
                          <View
                            key={`wd-${day.dateKey}`}
                            style={{
                              width: cellSize,
                              height: cellSize,
                              backgroundColor: 'transparent',
                            }}
                          />
                        ) : (
                          <DayCell
                            key={`wd-${day.dateKey}`}
                            dateKey={day.dateKey}
                            level={day.level}
                            paletteId={selectedPalette}
                            size={cellSize}
                            disabled={true}
                          />
                        )
                      )}
                    </View>
                  ))}
                </View>
              </View>
            </View>

            {/* Customization Options: Alias, Theme, Palette */}
            <View style={styles.customSection}>
              {/* Display Name Alias */}
              <View style={styles.settingBlock}>
                <Text style={[styles.settingLabel, { color: theme.textMuted }]}>DISPLAY NAME (ALIAS)</Text>
                <TextInput
                  style={[
                    styles.aliasInput,
                    {
                      backgroundColor: theme.surfaceHighlight,
                      borderColor: theme.borderSubtle,
                      color: theme.text,
                    },
                  ]}
                  value={customAlias}
                  onChangeText={setCustomAlias}
                  placeholder={currentMap.title}
                  placeholderTextColor={theme.textMuted}
                />
              </View>

              {/* Theme Choice */}
              <View style={styles.settingBlock}>
                <Text style={[styles.settingLabel, { color: theme.textMuted }]}>WIDGET THEME</Text>
                <View style={[styles.segmentedControl, { backgroundColor: isAppDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.05)' }]}>
                  {(['system', 'dark', 'light'] as const).map((t) => {
                    const isActive = themeChoice === t;
                    const label = t === 'system' ? 'System' : t === 'dark' ? 'Dark' : 'Light';
                    return (
                      <TouchableOpacity
                        key={t}
                        style={[
                          styles.segmentBtn,
                          isActive && [
                            styles.segmentBtnActive,
                            { backgroundColor: isAppDark ? '#21262D' : '#FFFFFF' },
                          ],
                        ]}
                        onPress={() => setThemeChoice(t)}
                        activeOpacity={0.7}
                      >
                        <Text style={[styles.segmentText, { color: isActive ? theme.text : theme.textSecondary }, isActive && { fontWeight: '700' }]}>
                          {label}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              </View>

              {/* Color Palette Choice */}
              <View style={styles.settingBlock}>
                <Text style={[styles.settingLabel, { color: theme.textMuted }]}>COLOR PALETTE</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.paletteScroll}>
                  {paletteList.map((pid) => {
                    const pal = PALETTES[pid];
                    const isSelected = selectedPalette === pid;
                    return (
                      <TouchableOpacity
                        key={pid}
                        style={[
                          styles.paletteOptionPill,
                          {
                            backgroundColor: isSelected ? theme.surface : 'transparent',
                            borderColor: isSelected ? pal.accent : theme.borderSubtle,
                          },
                        ]}
                        onPress={() => setSelectedPalette(pid)}
                        activeOpacity={0.7}
                      >
                        <View style={[styles.pillDot, { backgroundColor: pal.accent }]} />
                        <Text style={[styles.habitPillText, { color: isSelected ? theme.text : theme.textSecondary }, isSelected && { fontWeight: '700' }]}>
                          {pal.name.split(' ')[0]}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </ScrollView>
              </View>
            </View>

            {/* In-App Direct Widget Pin Action */}
            <View style={styles.actionSection}>
              <TouchableOpacity
                style={[styles.applyBtn, { backgroundColor: palette.accent }]}
                onPress={handleApplyToHomeScreen}
                activeOpacity={0.8}
              >
                <Plus size={16} color="#FFFFFF" strokeWidth={2.5} />
                <Text style={styles.applyBtnText}>Add Widget to Home Screen</Text>
              </TouchableOpacity>

              {pinStatus ? (
                <View style={[styles.statusPill, { backgroundColor: isAppDark ? '#21262D' : '#E6FFED' }]}>
                  <Check size={13} color={isAppDark ? '#39D353' : '#1A7F37'} />
                  <Text style={[styles.statusText, { color: isAppDark ? '#39D353' : '#1A7F37' }]}>
                    {pinStatus}
                  </Text>
                </View>
              ) : null}
            </View>

            {/* Brief, Minimalist Home Screen Guide */}
            <View style={[styles.guideCard, { backgroundColor: theme.surfaceHighlight, borderColor: theme.borderSubtle }]}>
              <View style={styles.guideHeader}>
                <Smartphone size={14} color={theme.text} />
                <Text style={[styles.guideTitle, { color: theme.text }]}>How to Use Widgets</Text>
              </View>

              <View style={styles.guideSteps}>
                <Text style={[styles.stepText, { color: theme.textSecondary }]}>
                  • Tap <Text style={{ fontWeight: '700', color: theme.text }}>Add Widget to Home Screen</Text> above to pin this habit directly from the app.
                </Text>
                <Text style={[styles.stepText, { color: theme.textSecondary }]}>
                  • Or long-press Home Screen → <Text style={{ fontWeight: '700', color: theme.text }}>Widgets</Text> → <Text style={{ fontWeight: '700', color: theme.text }}>TrackHeat Matrix</Text>.
                </Text>
                <Text style={[styles.stepText, { color: theme.textSecondary }]}>
                  • Tap the <Text style={{ fontWeight: '600', color: theme.text }}>+ / ✓</Text> button on the widget to log today directly from your home screen!
                </Text>
                <Text style={[styles.stepText, { color: theme.textSecondary }]}>
                  • Long-press the widget on your home screen and tap <Text style={{ fontWeight: '600', color: theme.text }}>Edit</Text> anytime to customize its alias, palette, and theme.
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
  sizeSectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  sectionLabel: {
    fontSize: 10,
    fontWeight: '700',
    fontFamily: fontStack,
    letterSpacing: 0.5,
  },
  sizeHint: {
    fontSize: 10,
    fontFamily: fontStack,
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
    padding: 16,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 150,
  },

  nativeWidget: {
    borderRadius: 18,
    borderWidth: 1,
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

  widgetHeader: {
    width: '100%',
  },
  widgetHabitTitle: {
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

  customSection: {
    gap: 12,
  },
  settingBlock: {
    gap: 6,
  },
  settingLabel: {
    fontSize: 9.5,
    fontWeight: '700',
    fontFamily: fontStack,
    letterSpacing: 0.5,
  },
  aliasInput: {
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 8,
    fontSize: 13,
    fontFamily: fontStack,
  },
  segmentedControl: {
    flexDirection: 'row',
    borderRadius: 14,
    padding: 3,
  },
  segmentBtn: {
    flex: 1,
    paddingVertical: 6,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 11,
  },
  segmentBtnActive: {},
  segmentText: {
    fontSize: 12,
    fontFamily: fontStack,
  },
  paletteScroll: {
    gap: 8,
    paddingVertical: 2,
  },
  paletteOptionPill: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1,
    gap: 6,
  },

  actionSection: {
    gap: 8,
    alignItems: 'center',
  },
  applyBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    width: '100%',
    paddingVertical: 12,
    borderRadius: 12,
  },
  applyBtnText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
    fontFamily: fontStack,
  },
  statusPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
    fontFamily: fontStack,
  },

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

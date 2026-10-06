import React, { useEffect, useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, ScrollView, StyleSheet, Platform } from 'react-native';
import type { WidgetConfigurationScreenProps } from 'react-native-android-widget';
import { Plus, Check } from 'lucide-react-native';
import { HeatMapModel, PaletteId } from '../types/heatmap';
import { getWidgetHabits, getWidgetConfig, setWidgetConfig, WidgetConfig } from './widgetStorage';
import { TrackHeatWidget } from './TrackHeatWidget';
import { PALETTES } from '../constants/palettes';

export function WidgetConfigurationScreen({ widgetInfo, renderWidget, setResult }: WidgetConfigurationScreenProps) {
  const [habits, setHabits] = useState<HeatMapModel[]>([]);
  const [selectedHabitId, setSelectedHabitId] = useState<string>('');
  const [customName, setCustomName] = useState<string>('');
  const [themeChoice, setThemeChoice] = useState<'system' | 'dark' | 'light'>('system');
  const [paletteChoice, setPaletteChoice] = useState<PaletteId>('emerald');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      getWidgetHabits(),
      getWidgetConfig(widgetInfo.widgetId),
    ]).then(([list, existingConfig]) => {
      setHabits(list);
      const initialHabit = existingConfig
        ? list.find((h) => h.id === existingConfig.habitId) || list[0]
        : list[0];

      if (initialHabit) {
        setSelectedHabitId(initialHabit.id);
        setPaletteChoice(existingConfig?.paletteId || initialHabit.paletteId || 'emerald');
      }
      if (existingConfig?.customName) {
        setCustomName(existingConfig.customName);
      }
      if (existingConfig?.theme) {
        setThemeChoice(existingConfig.theme);
      }
      setLoading(false);
    });
  }, [widgetInfo.widgetId]);

  const currentHabit = habits.find((h) => h.id === selectedHabitId) || habits[0];
  const isSingleRow = widgetInfo.height < 95;

  const isPreviewDark = themeChoice === 'dark' ? true : themeChoice === 'light' ? false : true;
  const isPaletteObsidian = paletteChoice === 'obsidian';
  const previewPalette = PALETTES[paletteChoice] || PALETTES.emerald;
  const previewActiveColor = isPreviewDark
    ? (previewPalette.levels[3] || previewPalette.accent)
    : (previewPalette.lightLevels?.[3] || previewPalette.accent);
  const previewTitle = customName.trim() || currentHabit?.title || 'Habit';
  const today = new Date();
  const todayKey = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
  const isTodayDone = Boolean(currentHabit?.entries?.[todayKey]?.completed);

  const previewBtnBg = isTodayDone
    ? (isPreviewDark
        ? (isPaletteObsidian ? '#F0F3F6' : (previewPalette.levels[3] || previewPalette.accent))
        : (isPaletteObsidian ? '#24292F' : (previewPalette.lightLevels?.[3] || previewPalette.accent)))
    : (isPreviewDark ? '#21262D' : '#F0F2F5');

  const previewBtnBorder = isTodayDone
    ? (isPreviewDark
        ? (isPaletteObsidian ? '#F0F3F6' : (previewPalette.levels[4] || previewPalette.accent))
        : (isPaletteObsidian ? '#24292F' : (previewPalette.lightLevels?.[4] || previewPalette.accent)))
    : (isPreviewDark ? '#30363D' : '#D0D7DE');

  const previewBtnTextColor = isTodayDone
    ? (isPreviewDark && isPaletteObsidian ? '#090A0C' : '#FFFFFF')
    : (isPreviewDark ? '#F0F3F6' : '#1F2328');

  // Build realistic matrix grid for live preview matching widget dimensions
  const generatePreviewGrid = () => {
    const numWeeks = isSingleRow ? 20 : 18;
    const todayMidnight = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    const dayOfWeek = (today.getDay() + 6) % 7;
    const totalDays = numWeeks * 7;
    const startDate = new Date(today);
    startDate.setDate(today.getDate() - (totalDays - 1 - (6 - dayOfWeek)));

    const gridWeeks = [];
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
        const entry = currentHabit?.entries?.[key];
        const isCompleted = !isFuture && Boolean(entry?.completed);

        weekDays.push({
          dateKey: key,
          isCompleted,
          isFuture,
        });
        curDate.setDate(curDate.getDate() + 1);
      }
      gridWeeks.push(weekDays);
    }
    return gridWeeks;
  };

  const previewGrid = generatePreviewGrid();

  const handleApply = async () => {
    if (!currentHabit) {
      setResult('cancel');
      return;
    }

    const config: WidgetConfig = {
      habitId: currentHabit.id,
      customName: customName.trim() || undefined,
      theme: themeChoice,
      paletteId: paletteChoice,
    };

    try {
      await setWidgetConfig(widgetInfo.widgetId, config);

      renderWidget({
        light: (
          <TrackHeatWidget
            map={currentHabit}
            config={config}
            width={widgetInfo.width}
            height={widgetInfo.height}
            isDark={false}
          />
        ),
        dark: (
          <TrackHeatWidget
            map={currentHabit}
            config={config}
            width={widgetInfo.width}
            height={widgetInfo.height}
            isDark={true}
          />
        ),
      });

      setResult('ok');
    } catch {
      setResult('ok');
    }
  };

  const paletteList: PaletteId[] = ['emerald', 'cyan', 'amber', 'crimson', 'obsidian'];

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.subtitle}>TRACKHEAT WIDGET</Text>
          <Text style={styles.title}>Widget Settings</Text>
          <Text style={styles.caption}>Customize appearance and habit display for this widget</Text>
        </View>

        {loading ? (
          <Text style={styles.emptyText}>Loading habits...</Text>
        ) : habits.length === 0 ? (
          <Text style={styles.emptyText}>No habits found. Open TrackHeat to create a habit.</Text>
        ) : (
          <>
            {/* Section 1: Choose Habit */}
            <View style={styles.section}>
              <Text style={styles.sectionLabel}>CHOOSE HABIT</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.pillRow}>
                {habits.map((habit) => {
                  const isSelected = habit.id === selectedHabitId;
                  const habitPalette = PALETTES[habit.paletteId] || PALETTES.emerald;
                  return (
                    <TouchableOpacity
                      key={habit.id}
                      style={[
                        styles.pill,
                        isSelected && { borderColor: habitPalette.accent, backgroundColor: '#161B22' },
                      ]}
                      onPress={() => {
                        setSelectedHabitId(habit.id);
                        setPaletteChoice(habit.paletteId || 'emerald');
                      }}
                      activeOpacity={0.7}
                    >
                      <View style={[styles.dot, { backgroundColor: habitPalette.accent }]} />
                      <Text style={[styles.pillText, isSelected && { color: '#F0F3F6', fontWeight: '700' }]}>
                        {habit.title}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </ScrollView>
            </View>

            {/* Section 2: Display Name Alias */}
            <View style={styles.section}>
              <Text style={styles.sectionLabel}>DISPLAY NAME (ALIAS)</Text>
              <TextInput
                style={styles.input}
                value={customName}
                onChangeText={setCustomName}
                placeholder={currentHabit?.title || 'Enter display alias'}
                placeholderTextColor="#6E7681"
              />
              <Text style={styles.helperText}>
                Leave blank to use the default name &quot;{currentHabit?.title}&quot;
              </Text>
            </View>

            {/* Section 3: Theme Mode */}
            <View style={styles.section}>
              <Text style={styles.sectionLabel}>THEME</Text>
              <View style={styles.segmentedControl}>
                {(['system', 'dark', 'light'] as const).map((t) => {
                  const isSelected = themeChoice === t;
                  const label = t === 'system' ? 'System' : t === 'dark' ? 'Dark' : 'Light';
                  return (
                    <TouchableOpacity
                      key={t}
                      style={[styles.segmentBtn, isSelected && styles.segmentBtnActive]}
                      onPress={() => setThemeChoice(t)}
                      activeOpacity={0.7}
                    >
                      <Text style={[styles.segmentText, isSelected && styles.segmentTextActive]}>
                        {label}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>

            {/* Section 4: Color Palette */}
            <View style={styles.section}>
              <Text style={styles.sectionLabel}>COLOR PALETTE</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.pillRow}>
                {paletteList.map((pid) => {
                  const pal = PALETTES[pid];
                  const isSelected = paletteChoice === pid;
                  return (
                    <TouchableOpacity
                      key={pid}
                      style={[
                        styles.palettePill,
                        isSelected && { borderColor: pal.accent, backgroundColor: '#161B22' },
                      ]}
                      onPress={() => setPaletteChoice(pid)}
                      activeOpacity={0.7}
                    >
                      <View style={[styles.paletteDot, { backgroundColor: pal.accent }]} />
                      <Text style={[styles.paletteText, isSelected && { color: '#F0F3F6', fontWeight: '700' }]}>
                        {pal.name.split(' ')[0]}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </ScrollView>
            </View>

            {/* Section 5: Live Preview */}
            <View style={styles.section}>
              <Text style={styles.sectionLabel}>LIVE PREVIEW</Text>
              <View style={styles.previewCanvas}>
                <View
                  style={[
                    styles.previewCard,
                    {
                      backgroundColor: isPreviewDark ? '#0D1117' : '#FFFFFF',
                      borderColor: isPreviewDark ? '#21262D' : '#D0D7DE',
                    },
                  ]}
                >
                  {isSingleRow ? (
                    /* Height 1 layout: 7-row matrix on left, vertical toggle pill on right */
                    <View style={styles.previewContentRow}>
                      <View style={styles.previewMatrix}>
                        {previewGrid.map((week, wIdx) => (
                          <View key={wIdx} style={styles.previewCol}>
                            {week.map((cell, dIdx) => {
                              const cellBg = cell.isFuture
                                ? 'transparent'
                                : cell.isCompleted
                                ? isPreviewDark
                                  ? isPaletteObsidian
                                    ? '#F0F3F6'
                                    : previewPalette.levels[3] || previewPalette.accent
                                  : isPaletteObsidian
                                  ? '#24292F'
                                  : previewPalette.lightLevels?.[3] || previewPalette.accent
                                : isPreviewDark
                                ? '#161B22'
                                : '#EBEDF0';

                              return (
                                <View
                                  key={dIdx}
                                  style={[
                                    styles.previewCell,
                                    {
                                      backgroundColor: cellBg,
                                      borderColor: isPreviewDark ? '#21262D' : '#D0D7DE',
                                      borderWidth: cell.isFuture ? 0 : 0.5,
                                    },
                                  ]}
                                />
                              );
                            })}
                          </View>
                        ))}
                      </View>

                      {/* Vertical Toggle Pill Button on right */}
                      <View
                        style={[
                          styles.previewActionBtn,
                          {
                            backgroundColor: previewBtnBg,
                            borderColor: previewBtnBorder,
                            borderWidth: 1,
                          },
                        ]}
                      >
                        {isTodayDone ? (
                          <Check size={11} color={previewBtnTextColor} strokeWidth={3} />
                        ) : (
                          <Plus size={11} color={previewBtnTextColor} strokeWidth={3} />
                        )}
                      </View>
                    </View>
                  ) : (
                    /* Height 2 layout: Top-left log button + habit title header, matrix below */
                    <View style={styles.previewContentCol}>
                      <View style={styles.previewHeaderRow}>
                        <View
                          style={[
                            styles.previewHeaderBtn,
                            {
                              backgroundColor: previewBtnBg,
                              borderColor: previewBtnBorder,
                              borderWidth: 1,
                            },
                          ]}
                        >
                          {isTodayDone ? (
                            <Check size={11} color={previewBtnTextColor} strokeWidth={3} />
                          ) : (
                            <Plus size={11} color={previewBtnTextColor} strokeWidth={3} />
                          )}
                        </View>
                        <Text
                          style={[
                            styles.previewHeaderTitle,
                            { color: isPreviewDark ? '#F0F3F6' : '#1F2328' },
                          ]}
                          numberOfLines={1}
                        >
                          {previewTitle}
                        </Text>
                      </View>

                      <View style={styles.previewMatrixFull}>
                        {previewGrid.map((week, wIdx) => (
                          <View key={wIdx} style={styles.previewCol}>
                            {week.map((cell, dIdx) => {
                              const cellBg = cell.isFuture
                                ? 'transparent'
                                : cell.isCompleted
                                ? isPreviewDark
                                  ? isPaletteObsidian
                                    ? '#F0F3F6'
                                    : (previewPalette.levels[3] || previewPalette.accent)
                                  : isPaletteObsidian
                                  ? '#24292F'
                                  : (previewPalette.lightLevels?.[3] || previewPalette.accent)
                                : isPreviewDark
                                ? 'rgba(255, 255, 255, 0.04)'
                                : '#EBEDF0';

                              return (
                                <View
                                  key={dIdx}
                                  style={[
                                    styles.previewCell,
                                    {
                                      backgroundColor: cellBg,
                                      borderColor: cell.isFuture
                                        ? 'transparent'
                                        : isPreviewDark
                                        ? 'rgba(255, 255, 255, 0.06)'
                                        : 'rgba(0, 0, 0, 0.06)',
                                      borderWidth: cell.isFuture ? 0 : 0.5,
                                    },
                                  ]}
                                />
                              );
                            })}
                          </View>
                        ))}
                      </View>
                    </View>
                  )}
                </View>
              </View>
            </View>
          </>
        )}
      </ScrollView>

      {/* Action Footer */}
      <View style={styles.footer}>
        <TouchableOpacity
          style={styles.cancelBtn}
          onPress={() => setResult('cancel')}
          activeOpacity={0.7}
        >
          <Text style={styles.cancelText}>Cancel</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.saveBtn}
          onPress={handleApply}
          activeOpacity={0.8}
        >
          <Text style={styles.saveText}>Save Widget</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0D1117',
    justifyContent: 'space-between',
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: Platform.OS === 'android' ? 58 : 44,
    paddingBottom: 24,
  },
  header: {
    marginBottom: 24,
  },
  subtitle: {
    fontSize: 10,
    fontWeight: '700',
    color: '#8B949E',
    letterSpacing: 0.8,
    marginBottom: 4,
  },
  title: {
    fontSize: 22,
    fontWeight: '700',
    color: '#F0F3F6',
    letterSpacing: -0.3,
  },
  caption: {
    fontSize: 13,
    color: '#8B949E',
    marginTop: 4,
  },
  section: {
    marginBottom: 20,
  },
  sectionLabel: {
    fontSize: 10.5,
    fontWeight: '700',
    color: '#8B949E',
    letterSpacing: 0.6,
    marginBottom: 8,
  },
  pillRow: {
    gap: 8,
    paddingVertical: 2,
  },
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#30363D',
    backgroundColor: '#161B22',
    gap: 6,
  },
  dot: {
    width: 7,
    height: 7,
    borderRadius: 3.5,
  },
  pillText: {
    fontSize: 12.5,
    color: '#8B949E',
  },
  input: {
    backgroundColor: '#161B22',
    borderWidth: 1,
    borderColor: '#30363D',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 10,
    fontSize: 14,
    color: '#F0F3F6',
    textAlignVertical: 'center',
  },
  helperText: {
    fontSize: 11,
    color: '#8B949E',
    marginTop: 6,
  },
  segmentedControl: {
    flexDirection: 'row',
    backgroundColor: '#161B22',
    borderRadius: 14,
    padding: 3,
    borderWidth: 1,
    borderColor: '#30363D',
  },
  segmentBtn: {
    flex: 1,
    paddingVertical: 8,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 11,
  },
  segmentBtnActive: {
    backgroundColor: '#21262D',
  },
  segmentText: {
    fontSize: 12.5,
    color: '#8B949E',
    fontWeight: '500',
  },
  segmentTextActive: {
    color: '#F0F3F6',
    fontWeight: '700',
  },
  palettePill: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#30363D',
    backgroundColor: '#161B22',
    gap: 6,
  },
  paletteDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  paletteText: {
    fontSize: 12,
    color: '#8B949E',
  },
  previewCanvas: {
    backgroundColor: '#161B22',
    borderRadius: 14,
    padding: 12,
    borderWidth: 1,
    borderColor: '#30363D',
    alignItems: 'center',
  },
  previewCard: {
    width: '100%',
    maxWidth: 290,
    borderWidth: 1,
    borderRadius: 12,
    padding: 12,
    alignItems: 'center',
  },
  previewContentRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
    gap: 8,
  },
  previewContentCol: {
    flexDirection: 'column',
    width: '100%',
    alignItems: 'center',
  },
  previewHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
    width: '100%',
  },
  previewHeaderBtn: {
    width: 20,
    height: 20,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 8,
  },
  previewHeaderBtnText: {
    fontSize: 11,
    fontWeight: '700',
    textAlign: 'center',
  },
  previewHeaderTitle: {
    fontSize: 12,
    fontWeight: '700',
    flex: 1,
  },
  previewMatrixFull: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 2.5,
    width: '100%',
  },
  previewActionBtn: {
    width: 20,
    height: 82,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  previewActionText: {
    fontSize: 11,
    fontWeight: '700',
    textAlign: 'center',
  },
  previewMatrix: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 2.5,
  },
  previewCol: {
    flexDirection: 'column',
    gap: 2.5,
  },
  previewCell: {
    width: 9.5,
    height: 9.5,
    borderRadius: 2,
  },
  footer: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderTopWidth: 1,
    borderTopColor: '#21262D',
    backgroundColor: '#0D1117',
    gap: 12,
  },
  cancelBtn: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
    borderRadius: 12,
    backgroundColor: '#21262D',
  },
  cancelText: {
    color: '#8B949E',
    fontSize: 14,
    fontWeight: '600',
  },
  saveBtn: {
    flex: 2,
    paddingVertical: 12,
    alignItems: 'center',
    borderRadius: 12,
    backgroundColor: '#238636',
  },
  saveText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
  },
  emptyText: {
    color: '#8B949E',
    fontSize: 13,
    textAlign: 'center',
    marginTop: 20,
  },
});

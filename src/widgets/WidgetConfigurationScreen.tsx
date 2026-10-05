import React, { useEffect, useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, ScrollView, StyleSheet } from 'react-native';
import type { WidgetConfigurationScreenProps } from 'react-native-android-widget';
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
          style={[styles.saveBtn, { backgroundColor: PALETTES[paletteChoice]?.accent || '#238636' }]}
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
    paddingTop: 36,
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

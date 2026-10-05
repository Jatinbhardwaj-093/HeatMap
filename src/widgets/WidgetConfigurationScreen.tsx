import React, { useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, ScrollView, StyleSheet } from 'react-native';
import type { WidgetConfigurationScreenProps } from 'react-native-android-widget';
import { HeatMapModel } from '../types/heatmap';
import { getWidgetHabits, setHabitForWidget } from './widgetStorage';
import { TrackHeatWidget } from './TrackHeatWidget';
import { PALETTES } from '../constants/palettes';

export function WidgetConfigurationScreen({ widgetInfo, renderWidget, setResult }: WidgetConfigurationScreenProps) {
  const [habits, setHabits] = useState<HeatMapModel[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getWidgetHabits().then((list) => {
      setHabits(list);
      setLoading(false);
    });
  }, []);

  const handleSelect = async (habit: HeatMapModel) => {
    try {
      await setHabitForWidget(widgetInfo.widgetId, habit.id);
      renderWidget({
        light: (
          <TrackHeatWidget
            map={habit}
            width={widgetInfo.width}
            height={widgetInfo.height}
            isDark={false}
          />
        ),
        dark: (
          <TrackHeatWidget
            map={habit}
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

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.subtitle}>TRACKHEAT WIDGET</Text>
        <Text style={styles.title}>Select Habit</Text>
        <Text style={styles.caption}>Choose which habit to track on this widget</Text>
      </View>

      <ScrollView contentContainerStyle={styles.list} showsVerticalScrollIndicator={false}>
        {loading ? (
          <Text style={styles.emptyText}>Loading habits...</Text>
        ) : habits.length === 0 ? (
          <Text style={styles.emptyText}>No habits found. Open TrackHeat to create a habit.</Text>
        ) : (
          habits.map((habit) => {
            const palette = PALETTES[habit.paletteId] || PALETTES.emerald;
            return (
              <TouchableOpacity
                key={habit.id}
                style={styles.habitItem}
                onPress={() => handleSelect(habit)}
                activeOpacity={0.7}
              >
                <View style={[styles.paletteDot, { backgroundColor: palette.accent }]} />
                <View style={styles.habitInfo}>
                  <Text style={styles.habitTitle}>{habit.title}</Text>
                  {habit.category ? <Text style={styles.habitCategory}>{habit.category}</Text> : null}
                </View>
              </TouchableOpacity>
            );
          })
        )}
      </ScrollView>

      <TouchableOpacity
        style={styles.cancelBtn}
        onPress={() => setResult('cancel')}
        activeOpacity={0.7}
      >
        <Text style={styles.cancelText}>Cancel</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0D1117',
    paddingHorizontal: 20,
    paddingTop: 40,
    paddingBottom: 24,
    justifyContent: 'space-between',
  },
  header: {
    marginBottom: 20,
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
  list: {
    paddingBottom: 16,
  },
  emptyText: {
    color: '#8B949E',
    fontSize: 14,
    textAlign: 'center',
    marginTop: 40,
  },
  habitItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 16,
    backgroundColor: '#161B22',
    borderRadius: 12,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#30363D',
  },
  paletteDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: 14,
  },
  habitInfo: {
    flex: 1,
  },
  habitTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: '#F0F3F6',
  },
  habitCategory: {
    fontSize: 12,
    color: '#8B949E',
    marginTop: 2,
  },
  cancelBtn: {
    paddingVertical: 14,
    alignItems: 'center',
    borderRadius: 12,
    backgroundColor: '#21262D',
  },
  cancelText: {
    color: '#8B949E',
    fontSize: 15,
    fontWeight: '600',
  },
});

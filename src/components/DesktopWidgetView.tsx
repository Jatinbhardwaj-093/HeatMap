import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  Platform,
  ActivityIndicator,
} from 'react-native';
import { Check, Plus, RefreshCw } from 'lucide-react-native';
import { HeatMapModel, PaletteId } from '../types/heatmap';
import { PALETTES } from '../constants/palettes';
import { getTodayKey, formatDateKey } from '../utils/dateUtils';
import { loadHeatMaps, saveHeatMaps } from '../utils/storage';
import { getResolvedWidgetData, ResolvedWidgetData } from '../widgets/widgetStorage';
import { useAppTheme, useIsDark } from '../theme/theme';
import { dragRegion, noDragRegion } from '../utils/platform';

const fontStack = Platform.select({
  web: '"SF Pro Rounded", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
  ios: 'System',
  default: 'sans-serif',
});

export const DesktopWidgetView: React.FC = () => {
  const theme = useAppTheme();
  const isAppDark = useIsDark();

  const [widgetData, setWidgetData] = useState<ResolvedWidgetData | null>(null);
  const [loading, setLoading] = useState(true);

  const reloadData = async () => {
    try {
      const data = await getResolvedWidgetData();
      setWidgetData(data);
    } catch {
      // Ignore load errors
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    reloadData();
    const interval = setInterval(reloadData, 10000);
    return () => clearInterval(interval);
  }, []);

  const habit = widgetData?.habit;
  const cfgTheme = widgetData?.config?.theme;
  const isDarkWidget = cfgTheme === 'dark' || (cfgTheme !== 'light' && isAppDark);
  const rawPaletteId = (widgetData?.config?.paletteId || habit?.paletteId || 'emerald') as PaletteId;
  const palette = PALETTES[rawPaletteId] || PALETTES.emerald;
  const colors = isDarkWidget ? palette.levels : (palette.lightLevels || palette.levels);
  const todayKey = getTodayKey();
  const isTodayDone = habit?.entries ? Boolean(habit.entries[todayKey]?.completed) : false;
  const displayTitle = widgetData?.config?.customName || habit?.title || 'Habit Matrix';

  const handleToggleToday = async () => {
    if (!habit) return;
    try {
      const allMaps = await loadHeatMaps();
      const updated = allMaps.map((m) => {
        if (m.id !== habit.id) return m;
        const entries = { ...m.entries };
        if (entries[todayKey]?.completed) {
          delete entries[todayKey];
        } else {
          entries[todayKey] = {
            date: todayKey,
            completed: true,
          };
        }
        return { ...m, entries };
      });

      await saveHeatMaps(updated);
      await reloadData();
    } catch {
      // Ignore toggle errors
    }
  };

  if (loading) {
    return (
      <View style={[styles.container, { backgroundColor: isDarkWidget ? '#0D1117' : '#FFFFFF' }]}>
        <ActivityIndicator size="small" color={palette.accent} />
      </View>
    );
  }

  if (!habit) {
    return (
      <View style={[styles.container, { backgroundColor: isDarkWidget ? '#0D1117' : '#FFFFFF' }]}>
        <Text style={[styles.emptyText, { color: isDarkWidget ? '#8B949E' : '#656D76' }]}>
          No habit selected for widget.
        </Text>
      </View>
    );
  }

  // Display 18 weeks (4x2 layout)
  const numWeeks = 18;
  const today = new Date();
  const dayOfWeek = (today.getDay() + 6) % 7;
  const endDate = new Date(today);
  endDate.setDate(today.getDate() + (6 - dayOfWeek));

  const startDate = new Date(endDate);
  startDate.setDate(endDate.getDate() - (numWeeks * 7 - 1));

  const weeks: { dateKey: string; completed: boolean; isFuture: boolean }[][] = [];
  const cur = new Date(startDate);

  for (let w = 0; w < numWeeks; w++) {
    const week: { dateKey: string; completed: boolean; isFuture: boolean }[] = [];
    for (let d = 0; d < 7; d++) {
      const dKey = formatDateKey(cur);
      week.push({
        dateKey: dKey,
        completed: Boolean(habit?.entries?.[dKey]?.completed),
        isFuture: dKey > todayKey,
      });
      cur.setDate(cur.getDate() + 1);
    }
    weeks.push(week);
  }

  return (
    <View
      style={[
        styles.container,
        {
          backgroundColor: isDarkWidget ? '#0D1117' : '#FFFFFF',
          borderColor: isDarkWidget ? '#30363D' : '#D0D7DE',
        },
      ]}
    >
      {/* Draggable Title Bar */}
      <View style={[styles.dragBar, dragRegion]}>
        <View style={styles.titleGroup}>
          <Text
            style={[
              styles.habitTitle,
              { color: isDarkWidget ? '#F0F6FC' : '#1F2328' },
            ]}
            numberOfLines={1}
          >
            {displayTitle}
          </Text>
        </View>

        {/* Quick Log Action */}
        <View style={[styles.actionRow, noDragRegion]}>
          <TouchableOpacity
            style={[
              styles.toggleBtn,
              {
                backgroundColor: isTodayDone
                  ? (isDarkWidget
                      ? (rawPaletteId === 'obsidian' ? '#F0F3F6' : palette.accent)
                      : (rawPaletteId === 'obsidian' ? '#24292F' : (palette.lightAccent || palette.accent)))
                  : (isDarkWidget
                      ? 'rgba(255, 255, 255, 0.08)'
                      : 'rgba(0, 0, 0, 0.05)'),
                borderColor: isTodayDone
                  ? (isDarkWidget
                      ? (rawPaletteId === 'obsidian' ? '#F0F3F6' : (palette.levels[4] || palette.accent))
                      : (rawPaletteId === 'obsidian' ? '#24292F' : (palette.lightLevels?.[4] || palette.accent)))
                  : (isDarkWidget
                      ? '#30363D'
                      : '#D0D7DE'),
              },
            ]}
            onPress={handleToggleToday}
            activeOpacity={0.7}
          >
            {isTodayDone ? (
              <Check
                size={13}
                color={isDarkWidget && rawPaletteId === 'obsidian' ? '#090A0C' : '#FFFFFF'}
                strokeWidth={3}
              />
            ) : (
              <Plus size={13} color={isDarkWidget ? '#C9D1D9' : '#1F2328'} strokeWidth={2.5} />
            )}
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.refreshBtn,
              { borderColor: isDarkWidget ? '#30363D' : '#D0D7DE' },
            ]}
            onPress={reloadData}
            activeOpacity={0.7}
          >
            <RefreshCw size={11} color={isDarkWidget ? '#8B949E' : '#656D76'} />
          </TouchableOpacity>
        </View>
      </View>

      {/* Contribution Grid */}
      <View style={styles.matrixArea}>
        <View style={styles.matrixGrid}>
          {weeks.map((week, wIdx) => (
            <View key={wIdx} style={styles.weekCol}>
              {week.map((day) => (
                <View
                  key={day.dateKey}
                  style={[
                    styles.cell,
                    {
                      backgroundColor: day.isFuture
                        ? 'transparent'
                        : day.completed
                        ? colors[4]
                        : isDarkWidget
                        ? 'rgba(255, 255, 255, 0.04)'
                        : '#EBEDF0',
                      borderColor: day.isFuture
                        ? 'transparent'
                        : isDarkWidget
                        ? 'rgba(255, 255, 255, 0.06)'
                        : 'rgba(0, 0, 0, 0.06)',
                    },
                  ]}
                />
              ))}
            </View>
          ))}
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 14,
    borderWidth: 1,
    justifyContent: 'space-between',
  },
  dragBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
    gap: 10,
  },
  titleGroup: {
    flex: 1,
  },
  habitTitle: {
    fontSize: 14,
    fontWeight: '800',
    fontFamily: fontStack,
    letterSpacing: -0.2,
  },
  actionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  toggleBtn: {
    width: 26,
    height: 26,
    borderRadius: 7,
    borderWidth: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  refreshBtn: {
    width: 24,
    height: 24,
    borderRadius: 6,
    borderWidth: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  matrixArea: {
    flex: 1,
    justifyContent: 'center',
  },
  matrixGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 3,
  },
  weekCol: {
    flexDirection: 'column',
    gap: 3,
  },
  cell: {
    width: 11,
    height: 11,
    borderRadius: 2.5,
    borderWidth: 0.5,
  },
  emptyText: {
    fontSize: 12,
    textAlign: 'center',
    fontFamily: fontStack,
  },
});

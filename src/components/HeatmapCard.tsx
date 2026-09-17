import React, { useState } from 'react';
import { StyleSheet, View, Text, TouchableOpacity, Alert, Platform } from 'react-native';
import { HeatMapModel, ViewMode } from '../types/heatmap';
import { PALETTES } from '../constants/palettes';
import { calculateStats } from '../utils/streakUtils';
import { getTodayKey } from '../utils/dateUtils';
import { StatsOverview } from './StatsOverview';
import { YearlyView } from './YearlyView';
import { MonthlyView } from './MonthlyView';
import { WeeklyView } from './WeeklyView';
import { Check, Plus, Trash2 } from 'lucide-react-native';
import { useAppTheme } from '../theme/theme';

interface HeatmapCardProps {
  heatmap: HeatMapModel;
  viewMode: ViewMode;
  onSelectDate: (mapId: string, dateKey: string) => void;
  onQuickLogToday: (mapId: string) => void;
  onDeleteMap: (mapId: string) => void;
}

export const HeatmapCard: React.FC<HeatmapCardProps> = ({
  heatmap,
  viewMode,
  onSelectDate,
  onQuickLogToday,
  onDeleteMap,
}) => {
  const theme = useAppTheme();
  const { stats, streakMap } = calculateStats(heatmap);
  const palette = PALETTES[heatmap.paletteId] || PALETTES.emerald;
  const todayKey = getTodayKey();
  const todayEntry = heatmap.entries[todayKey];
  const isTodayLogged = !!todayEntry?.completed;

  const handleDelete = () => {
    if (Platform.OS === 'web') {
      if (window.confirm(`Are you sure you want to delete "${heatmap.title}"? This cannot be undone.`)) {
        onDeleteMap(heatmap.id);
      }
    } else {
      Alert.alert(
        'Delete Tracker',
        `Are you sure you want to delete "${heatmap.title}"? This cannot be undone.`,
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Delete', style: 'destructive', onPress: () => onDeleteMap(heatmap.id) },
        ]
      );
    }
  };

  return (
    <View style={[styles.card, { backgroundColor: theme.surface, borderColor: theme.border }]}>
      <View style={styles.cardHeader}>
        <View style={styles.titleInfo}>
          <View style={styles.badgeRow}>
            <View style={[styles.categoryBadge, { borderColor: palette.accent }]}>
              <Text style={[styles.categoryText, { color: palette.accent }]}>
                {heatmap.category.toUpperCase()}
              </Text>
            </View>
            <Text style={[styles.targetHint, { color: theme.textMuted }]}>Daily Check-in</Text>
          </View>
          <Text style={[styles.titleText, { color: theme.text }]}>{heatmap.title}</Text>
          {heatmap.description ? (
            <Text style={[styles.descriptionText, { color: theme.textSecondary }]}>{heatmap.description}</Text>
          ) : null}
        </View>

        <View style={styles.actionsGroup}>
          <TouchableOpacity
            activeOpacity={0.7}
            onPress={() => onQuickLogToday(heatmap.id)}
            style={[
              styles.quickLogButton,
              isTodayLogged
                ? { backgroundColor: palette.levels[2], borderColor: palette.accent }
                : { backgroundColor: theme.surfaceHighlight, borderColor: theme.border },
            ]}
          >
            {isTodayLogged ? (
              <>
                <Check size={13} color="#FFFFFF" strokeWidth={2.5} />
                <Text style={styles.quickLogTextActive}>DONE</Text>
              </>
            ) : (
              <>
                <Plus size={13} color={theme.text} strokeWidth={2.5} />
                <Text style={[styles.quickLogText, { color: theme.text }]}>LOG</Text>
              </>
            )}
          </TouchableOpacity>

          <TouchableOpacity
            activeOpacity={0.7}
            onPress={handleDelete}
            style={[styles.deleteButton, { backgroundColor: theme.surfaceHighlight, borderColor: theme.border }]}
          >
            <Trash2 size={13} color={theme.textMuted} />
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.viewBody}>
        {viewMode === 'yearly' && (
          <YearlyView
            heatmap={heatmap}
            streakMap={streakMap}
            onSelectDate={(dKey) => onSelectDate(heatmap.id, dKey)}
          />
        )}
        {viewMode === 'monthly' && (
          <MonthlyView
            heatmap={heatmap}
            streakMap={streakMap}
            onSelectDate={(dKey) => onSelectDate(heatmap.id, dKey)}
          />
        )}
        {viewMode === 'weekly' && (
          <WeeklyView
            heatmap={heatmap}
            streakMap={streakMap}
            onSelectDate={(dKey) => onSelectDate(heatmap.id, dKey)}
          />
        )}
      </View>

      <StatsOverview
        stats={stats}
        accentColor={palette.accent}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    borderWidth: 1,
    borderRadius: 4,
    padding: 16,
    marginBottom: 16,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 10,
  },
  titleInfo: {
    flex: 1,
    marginRight: 12,
  },
  badgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 4,
  },
  categoryBadge: {
    borderWidth: 1,
    borderRadius: 2,
    paddingHorizontal: 6,
    paddingVertical: 1,
  },
  categoryText: {
    fontSize: 9,
    fontWeight: '700',
    fontFamily: Platform.OS === 'ios' ? 'System' : 'sans-serif',
    letterSpacing: 0.5,
  },
  targetHint: {
    fontSize: 10,
    fontFamily: Platform.OS === 'ios' ? 'System' : 'sans-serif',
  },
  titleText: {
    fontSize: 17,
    fontWeight: '600',
    letterSpacing: -0.2,
  },
  descriptionText: {
    fontSize: 12,
    marginTop: 2,
    lineHeight: 16,
  },
  actionsGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  quickLogButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 3,
    borderWidth: 1,
  },
  quickLogText: {
    fontSize: 11,
    fontWeight: '700',
    fontFamily: Platform.OS === 'ios' ? 'System' : 'sans-serif',
  },
  quickLogTextActive: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '700',
    fontFamily: Platform.OS === 'ios' ? 'System' : 'sans-serif',
  },
  deleteButton: {
    padding: 6,
    borderWidth: 1,
    borderRadius: 3,
  },
  viewBody: {
    marginBottom: 10,
  },
});

import React from 'react';
import { StyleSheet, View, Text, Platform } from 'react-native';
import { HeatMapStats } from '../types/heatmap';
import { useAppTheme } from '../theme/theme';

interface StatsOverviewProps {
  stats: HeatMapStats;
  accentColor: string;
}

export const StatsOverview: React.FC<StatsOverviewProps> = ({
  stats,
  accentColor,
}) => {
  const theme = useAppTheme();
  return (
    <View style={[styles.container, { backgroundColor: theme.surfaceHighlight, borderColor: theme.borderSubtle }]}>
      <View style={styles.statCol}>
        <Text style={[styles.statLabel, { color: theme.textMuted }]}>STREAK</Text>
        <Text style={[styles.statValue, { color: accentColor }]}>
          {stats.currentStreak}
          <Text style={[styles.statUnit, { color: theme.textSecondary }]}>d</Text>
        </Text>
      </View>

      <View style={[styles.divider, { backgroundColor: theme.border }]} />

      <View style={styles.statCol}>
        <Text style={[styles.statLabel, { color: theme.textMuted }]}>BEST</Text>
        <Text style={[styles.statValue, { color: theme.text }]}>
          {stats.longestStreak}
          <Text style={[styles.statUnit, { color: theme.textSecondary }]}>d</Text>
        </Text>
      </View>

      <View style={[styles.divider, { backgroundColor: theme.border }]} />

      <View style={styles.statCol}>
        <Text style={[styles.statLabel, { color: theme.textMuted }]}>90d %</Text>
        <Text style={[styles.statValue, { color: theme.text }]}>
          {stats.completionRate}
          <Text style={[styles.statUnit, { color: theme.textSecondary }]}>%</Text>
        </Text>
      </View>

      <View style={[styles.divider, { backgroundColor: theme.border }]} />

      <View style={styles.statCol}>
        <Text style={[styles.statLabel, { color: theme.textMuted }]}>TOTAL</Text>
        <Text style={[styles.statValue, { color: theme.text }]}>
          {stats.totalActiveDays}
          <Text style={[styles.statUnit, { color: theme.textSecondary }]}>d</Text>
        </Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderRadius: 4,
    paddingVertical: 12,
    paddingHorizontal: 16,
    marginTop: 8,
  },
  statCol: {
    alignItems: 'center',
    flex: 1,
  },
  divider: {
    width: 1,
    height: 24,
  },
  statLabel: {
    fontSize: 9,
    fontWeight: '700',
    fontFamily: Platform.OS === 'ios' ? 'System' : 'sans-serif',
    letterSpacing: 0.5,
    marginBottom: 4,
  },
  statValue: {
    fontSize: 16,
    fontWeight: '700',
    fontFamily: Platform.OS === 'ios' ? 'System' : 'sans-serif',
  },
  statUnit: {
    fontSize: 11,
    fontWeight: '500',
  },
});

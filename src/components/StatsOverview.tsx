import React from 'react';
import { StyleSheet, View, Text, Platform } from 'react-native';
import { HeatMapStats } from '../types/heatmap';

interface StatsOverviewProps {
  stats: HeatMapStats;
  accentColor: string;
}

export const StatsOverview: React.FC<StatsOverviewProps> = ({
  stats,
  accentColor,
}) => {
  return (
    <View style={styles.container}>
      <View style={styles.statCol}>
        <Text style={styles.statLabel}>STREAK</Text>
        <Text style={[styles.statValue, { color: accentColor }]}>
          {stats.currentStreak}
          <Text style={styles.statUnit}>d</Text>
        </Text>
      </View>

      <View style={styles.divider} />

      <View style={styles.statCol}>
        <Text style={styles.statLabel}>BEST</Text>
        <Text style={styles.statValue}>
          {stats.longestStreak}
          <Text style={styles.statUnit}>d</Text>
        </Text>
      </View>

      <View style={styles.divider} />

      <View style={styles.statCol}>
        <Text style={styles.statLabel}>90d %</Text>
        <Text style={styles.statValue}>
          {stats.completionRate}
          <Text style={styles.statUnit}>%</Text>
        </Text>
      </View>

      <View style={styles.divider} />

      <View style={styles.statCol}>
        <Text style={styles.statLabel}>TOTAL</Text>
        <Text style={styles.statValue}>
          {stats.totalActiveDays}
          <Text style={styles.statUnit}>d</Text>
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
    backgroundColor: '#0E1116',
    borderWidth: 1,
    borderColor: '#21262D',
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
    backgroundColor: '#30363D',
  },
  statLabel: {
    color: '#6E7681',
    fontSize: 9,
    fontWeight: '700',
    fontFamily: Platform.OS === 'ios' ? 'System' : 'sans-serif',
    letterSpacing: 0.5,
    marginBottom: 4,
  },
  statValue: {
    color: '#F0F6FC',
    fontSize: 16,
    fontWeight: '700',
    fontFamily: Platform.OS === 'ios' ? 'System' : 'sans-serif',
  },
  statUnit: {
    fontSize: 11,
    fontWeight: '500',
    color: '#8B949E',
  },
});

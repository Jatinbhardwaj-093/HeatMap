import React from 'react';
import { StyleSheet, View, Text } from 'react-native';
import { HeatMapStats, UnitType } from '../types/heatmap';
import { Zap, Trophy, Percent, Activity } from 'lucide-react-native';

interface StatsOverviewProps {
  stats: HeatMapStats;
  unitType: UnitType;
  unitLabel?: string;
  accentColor: string;
}

export const StatsOverview: React.FC<StatsOverviewProps> = ({
  stats,
  unitType,
  unitLabel,
  accentColor,
}) => {
  return (
    <View style={styles.container}>
      <View style={styles.metricBlock}>
        <View style={styles.metricHeader}>
          <Zap size={11} color={accentColor} strokeWidth={2} />
          <Text style={styles.metricLabel}>STREAK</Text>
        </View>
        <Text style={[styles.metricValue, { color: accentColor }]}>
          {stats.currentStreak}
          <Text style={styles.unitSmall}>d</Text>
        </Text>
      </View>

      <View style={styles.divider} />

      <View style={styles.metricBlock}>
        <View style={styles.metricHeader}>
          <Trophy size={11} color="#8B949E" strokeWidth={2} />
          <Text style={styles.metricLabel}>BEST</Text>
        </View>
        <Text style={styles.metricValue}>
          {stats.longestStreak}
          <Text style={styles.unitSmall}>d</Text>
        </Text>
      </View>

      <View style={styles.divider} />

      <View style={styles.metricBlock}>
        <View style={styles.metricHeader}>
          <Percent size={11} color="#8B949E" strokeWidth={2} />
          <Text style={styles.metricLabel}>90D RATE</Text>
        </View>
        <Text style={styles.metricValue}>
          {stats.completionRate}
          <Text style={styles.unitSmall}>%</Text>
        </Text>
      </View>

      <View style={styles.divider} />

      <View style={styles.metricBlock}>
        <View style={styles.metricHeader}>
          <Activity size={11} color="#8B949E" strokeWidth={2} />
          <Text style={styles.metricLabel}>
            {unitType === 'boolean' ? 'TOTAL' : unitLabel ? unitLabel.toUpperCase() : 'TOTAL'}
          </Text>
        </View>
        <Text style={styles.metricValue}>
          {unitType === 'boolean' ? `${stats.totalActiveDays}d` : stats.totalValue.toLocaleString()}
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
    borderColor: '#21262D',
    borderWidth: 1,
    borderRadius: 4,
    paddingVertical: 8,
    paddingHorizontal: 12,
  },
  metricBlock: {
    flex: 1,
    alignItems: 'center',
  },
  metricHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginBottom: 2,
  },
  metricLabel: {
    color: '#6E7681',
    fontSize: 9,
    fontWeight: '600',
    fontFamily: 'Courier',
    letterSpacing: 0.5,
  },
  metricValue: {
    color: '#F0F6FC',
    fontSize: 16,
    fontWeight: '700',
    fontFamily: 'Courier',
  },
  unitSmall: {
    fontSize: 10,
    color: '#8B949E',
    fontWeight: '400',
  },
  divider: {
    width: 1,
    height: 22,
    backgroundColor: '#21262D',
  },
});

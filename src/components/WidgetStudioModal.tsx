import React, { useState } from 'react';
import { StyleSheet, View, Text, Modal, TouchableOpacity, ScrollView, Platform } from 'react-native';
import { HeatMapModel } from '../types/heatmap';
import { PALETTES } from '../constants/palettes';
import { getTodayKey } from '../utils/dateUtils';
import { calculateStats, getStreakIntensityLevel } from '../utils/streakUtils';
import { DayCell } from './DayCell';
import { X, Copy, Code, Check } from 'lucide-react-native';

interface WidgetStudioModalProps {
  visible: boolean;
  heatmaps: HeatMapModel[];
  onClose: () => void;
}

export const WidgetStudioModal: React.FC<WidgetStudioModalProps> = ({
  visible,
  heatmaps,
  onClose,
}) => {
  const [selectedMapId, setSelectedMapId] = useState<string | null>(heatmaps[0]?.id || null);
  const [copiedNotification, setCopiedNotification] = useState(false);

  if (!visible) return null;

  const currentMap = heatmaps.find((m) => m.id === selectedMapId) || heatmaps[0];
  if (!currentMap) {
    return (
      <Modal visible={visible} transparent animationType="fade">
        <View style={styles.overlay}>
          <View style={styles.modalBox}>
            <Text style={styles.emptyText}>No HeatMaps available for Widgets.</Text>
            <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
              <X size={16} color="#8B949E" />
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    );
  }

  const { stats, streakMap } = calculateStats(currentMap);
  const palette = PALETTES[currentMap.paletteId] || PALETTES.emerald;
  const todayKey = getTodayKey();
  const isTodayLogged = !!currentMap.entries[todayKey]?.completed;

  const getRecentDays = (count: number) => {
    const list: Array<{ dateKey: string; level: 0 | 1 | 2 | 3 | 4 }> = [];
    const today = new Date();
    for (let i = count - 1; i >= 0; i--) {
      const d = new Date(today);
      d.setDate(today.getDate() - i);
      const key = formatDateKey(d);
      const entry = currentMap.entries[key];
      const level = entry?.completed ? getStreakIntensityLevel(streakMap[key] || 1) : 0;
      list.push({
        dateKey: key,
        level,
      });
    }
    return list;
  };

  const handleCopyConfig = () => {
    setCopiedNotification(true);
    setTimeout(() => setCopiedNotification(false), 2000);
  };

  // Helper inside here just for WidgetStudio formatting
  function formatDateKey(date: Date): string {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={styles.modalBox}>
          <View style={styles.header}>
            <View>
              <Text style={styles.modalSubtitle}>WIDGET STUDIO</Text>
              <Text style={styles.modalTitle}>Native Integrations</Text>
            </View>
            <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
              <X size={20} color="#8B949E" />
            </TouchableOpacity>
          </View>

          <View style={styles.selectorRow}>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.mapSelector}>
              {heatmaps.map((m) => (
                <TouchableOpacity
                  key={m.id}
                  style={[
                    styles.mapPill,
                    selectedMapId === m.id && { borderColor: PALETTES[m.paletteId]?.accent || '#58A6FF' },
                  ]}
                  onPress={() => setSelectedMapId(m.id)}
                >
                  <Text style={[
                    styles.mapPillText,
                    selectedMapId === m.id && { color: '#F0F6FC', fontWeight: '600' }
                  ]}>
                    {m.title}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>

          <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollBody}>
            
            {/* Small Square Widget Preview */}
            <View style={styles.widgetSection}>
              <Text style={styles.sectionTitle}>Small Square (iOS / Android)</Text>
              <View style={styles.widgetPreviewBox}>
                <View style={styles.widgetSmall}>
                  <View style={styles.widgetSmallHeader}>
                    <Text style={styles.widgetSmallTitle} numberOfLines={1}>{currentMap.title}</Text>
                  </View>
                  <View style={styles.widgetSmallStats}>
                    <Text style={[styles.widgetSmallVal, { color: palette.accent }]}>
                      {stats.currentStreak}
                      <Text style={styles.widgetSmallUnit}>d streak</Text>
                    </Text>
                  </View>
                  <View style={styles.widgetSmallGrid}>
                    {getRecentDays(14).map((d) => (
                      <DayCell
                        key={`sm-${d.dateKey}`}
                        dateKey={d.dateKey}
                        level={d.level}
                        paletteId={currentMap.paletteId}
                        size={14}
                      />
                    ))}
                  </View>
                </View>
              </View>
            </View>

            {/* Medium Rectangle Widget Preview */}
            <View style={styles.widgetSection}>
              <Text style={styles.sectionTitle}>Medium Rectangle (iOS / Android / Mac)</Text>
              <View style={styles.widgetPreviewBox}>
                <View style={styles.widgetMedium}>
                  <View style={styles.widgetMediumHeader}>
                    <View>
                      <Text style={styles.widgetMediumSubtitle}>{currentMap.category.toUpperCase()}</Text>
                      <Text style={styles.widgetMediumTitle}>{currentMap.title}</Text>
                    </View>
                    <View style={styles.widgetMediumBadge}>
                      <Text style={[styles.widgetMediumBadgeText, { color: palette.accent }]}>
                        {isTodayLogged ? 'DONE' : 'PENDING'}
                      </Text>
                    </View>
                  </View>
                  
                  <View style={styles.widgetMediumGridContainer}>
                    <View style={styles.widgetMediumGrid}>
                      {getRecentDays(35).map((d) => (
                        <DayCell
                          key={`md-${d.dateKey}`}
                          dateKey={d.dateKey}
                          level={d.level}
                          paletteId={currentMap.paletteId}
                          size={14}
                        />
                      ))}
                    </View>
                    
                    <View style={styles.widgetMediumStats}>
                      <View>
                        <Text style={styles.wStatLabel}>STREAK</Text>
                        <Text style={styles.wStatVal}>{stats.currentStreak}d</Text>
                      </View>
                      <View style={{marginTop: 6}}>
                        <Text style={styles.wStatLabel}>TOTAL</Text>
                        <Text style={styles.wStatVal}>{stats.totalActiveDays}d</Text>
                      </View>
                    </View>
                  </View>
                </View>
              </View>
            </View>

            {/* Integration Details */}
            <View style={styles.integrationBox}>
              <View style={styles.integrationHeader}>
                <Code size={16} color="#8B949E" />
                <Text style={styles.integrationTitle}>Export Configuration</Text>
              </View>
              <Text style={styles.integrationText}>
                Use this Map ID to configure your native iOS WidgetKit or Android RemoteViews instance.
              </Text>
              <View style={styles.codeRow}>
                <Text style={styles.codeText}>{currentMap.id}</Text>
                <TouchableOpacity style={styles.copyBtn} onPress={handleCopyConfig}>
                  {copiedNotification ? (
                    <Check size={14} color="#3FB950" />
                  ) : (
                    <Copy size={14} color="#8B949E" />
                  )}
                  <Text style={[styles.copyBtnText, copiedNotification && {color: '#3FB950'}]}>
                    {copiedNotification ? 'Copied' : 'Copy ID'}
                  </Text>
                </TouchableOpacity>
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
    backgroundColor: 'rgba(0,0,0,0.85)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalBox: {
    width: '100%',
    maxWidth: 600,
    maxHeight: '95%',
    backgroundColor: '#0D1117',
    borderColor: '#30363D',
    borderWidth: 1,
    borderRadius: 6,
    padding: 0,
    overflow: 'hidden',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#21262D',
  },
  modalSubtitle: {
    color: '#8B949E',
    fontSize: 10,
    fontWeight: '700',
    fontFamily: Platform.OS === 'ios' ? 'System' : 'sans-serif',
    letterSpacing: 0.5,
  },
  modalTitle: {
    color: '#F0F6FC',
    fontSize: 20,
    fontWeight: '600',
    marginTop: 2,
    fontFamily: Platform.OS === 'ios' ? 'System' : 'sans-serif',
  },
  closeBtn: {
    padding: 4,
  },
  selectorRow: {
    borderBottomWidth: 1,
    borderBottomColor: '#21262D',
    backgroundColor: '#161B22',
  },
  mapSelector: {
    paddingHorizontal: 20,
    paddingVertical: 12,
    gap: 8,
  },
  mapPill: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#30363D',
    backgroundColor: '#090B0E',
  },
  mapPillText: {
    color: '#8B949E',
    fontSize: 12,
    fontFamily: Platform.OS === 'ios' ? 'System' : 'sans-serif',
  },
  scrollBody: {
    padding: 20,
  },
  widgetSection: {
    marginBottom: 24,
  },
  sectionTitle: {
    color: '#F0F6FC',
    fontSize: 13,
    fontWeight: '600',
    fontFamily: Platform.OS === 'ios' ? 'System' : 'sans-serif',
    marginBottom: 10,
  },
  widgetPreviewBox: {
    backgroundColor: '#090B0E',
    borderWidth: 1,
    borderColor: '#21262D',
    borderRadius: 8,
    padding: 20,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundImage: 'radial-gradient(#21262D 1px, transparent 0)',
    backgroundSize: '20px 20px',
  },
  widgetSmall: {
    width: 140,
    height: 140,
    backgroundColor: '#0D1117',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#30363D',
    padding: 14,
    shadowColor: '#000',
    shadowOpacity: 0.3,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
  },
  widgetSmallHeader: {
    marginBottom: 4,
  },
  widgetSmallTitle: {
    color: '#F0F6FC',
    fontSize: 12,
    fontWeight: '600',
    fontFamily: Platform.OS === 'ios' ? 'System' : 'sans-serif',
  },
  widgetSmallStats: {
    marginBottom: 12,
  },
  widgetSmallVal: {
    fontSize: 18,
    fontWeight: '700',
    fontFamily: Platform.OS === 'ios' ? 'System' : 'sans-serif',
  },
  widgetSmallUnit: {
    fontSize: 10,
    fontWeight: '500',
    color: '#8B949E',
  },
  widgetSmallGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 3,
  },
  widgetMedium: {
    width: 320,
    height: 140,
    backgroundColor: '#0D1117',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#30363D',
    padding: 16,
    shadowColor: '#000',
    shadowOpacity: 0.3,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
  },
  widgetMediumHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  widgetMediumSubtitle: {
    color: '#8B949E',
    fontSize: 9,
    fontWeight: '700',
    fontFamily: Platform.OS === 'ios' ? 'System' : 'sans-serif',
    letterSpacing: 0.5,
  },
  widgetMediumTitle: {
    color: '#F0F6FC',
    fontSize: 14,
    fontWeight: '600',
    fontFamily: Platform.OS === 'ios' ? 'System' : 'sans-serif',
    marginTop: 2,
  },
  widgetMediumBadge: {
    backgroundColor: '#161B22',
    borderWidth: 1,
    borderColor: '#30363D',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  widgetMediumBadgeText: {
    fontSize: 9,
    fontWeight: '700',
    fontFamily: Platform.OS === 'ios' ? 'System' : 'sans-serif',
  },
  widgetMediumGridContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  widgetMediumGrid: {
    flexDirection: 'column',
    flexWrap: 'wrap',
    alignContent: 'flex-start',
    height: 5 * 14 + 4 * 3, // 5 rows
    width: 7 * 14 + 6 * 3, // 7 cols
    gap: 3,
  },
  widgetMediumStats: {
    alignItems: 'flex-end',
    justifyContent: 'center',
  },
  wStatLabel: {
    color: '#6E7681',
    fontSize: 9,
    fontWeight: '600',
    textAlign: 'right',
    fontFamily: Platform.OS === 'ios' ? 'System' : 'sans-serif',
  },
  wStatVal: {
    color: '#F0F6FC',
    fontSize: 13,
    fontWeight: '700',
    textAlign: 'right',
    fontFamily: Platform.OS === 'ios' ? 'System' : 'sans-serif',
  },
  integrationBox: {
    backgroundColor: '#161B22',
    borderColor: '#30363D',
    borderWidth: 1,
    borderRadius: 6,
    padding: 16,
    marginTop: 10,
  },
  integrationHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 6,
  },
  integrationTitle: {
    color: '#F0F6FC',
    fontSize: 14,
    fontWeight: '600',
    fontFamily: Platform.OS === 'ios' ? 'System' : 'sans-serif',
  },
  integrationText: {
    color: '#8B949E',
    fontSize: 12,
    lineHeight: 18,
    fontFamily: Platform.OS === 'ios' ? 'System' : 'sans-serif',
    marginBottom: 12,
  },
  codeRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#0D1117',
    borderWidth: 1,
    borderColor: '#30363D',
    borderRadius: 4,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  codeText: {
    color: '#E6EDF3',
    fontSize: 13,
  },
  copyBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    padding: 6,
    backgroundColor: '#21262D',
    borderRadius: 4,
  },
  copyBtnText: {
    color: '#8B949E',
    fontSize: 11,
    fontWeight: '600',
    fontFamily: Platform.OS === 'ios' ? 'System' : 'sans-serif',
  },
});

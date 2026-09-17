import React, { useState } from 'react';
import {
  StyleSheet,
  View,
  Text,
  Modal,
  TouchableOpacity,
  TouchableWithoutFeedback,
  ScrollView,
} from 'react-native';
import { HeatMapModel } from '../types/heatmap';
import { PALETTES } from '../constants/palettes';
import { calculateStats } from '../utils/streakUtils';
import { formatDateKey, getIntensityLevel, getTodayKey } from '../utils/dateUtils';
import { X, Smartphone, Layers, Check, Zap, Trophy, Copy } from 'lucide-react-native';

interface WidgetStudioModalProps {
  visible: boolean;
  heatmaps: HeatMapModel[];
  onClose: () => void;
}

type WidgetSize = 'small' | 'medium' | 'large' | 'lockscreen';

export const WidgetStudioModal: React.FC<WidgetStudioModalProps> = ({
  visible,
  heatmaps,
  onClose,
}) => {
  const [selectedMapId, setSelectedMapId] = useState<string>(
    heatmaps[0]?.id || ''
  );
  const [widgetSize, setWidgetSize] = useState<WidgetSize>('medium');
  const [copiedNotification, setCopiedNotification] = useState(false);

  if (!visible) return null;

  const currentMap = heatmaps.find((m) => m.id === selectedMapId) || heatmaps[0];
  if (!currentMap) return null;

  const stats = calculateStats(currentMap);
  const palette = PALETTES[currentMap.paletteId] || PALETTES.emerald;
  const todayKey = getTodayKey();
  const isTodayLogged = !!(currentMap.entries[todayKey]?.value > 0);

  // Generate last N days for widget previews
  const getRecentDays = (count: number) => {
    const list: Array<{ dateKey: string; level: 0 | 1 | 2 | 3 | 4 }> = [];
    const today = new Date();
    for (let i = count - 1; i >= 0; i--) {
      const d = new Date(today);
      d.setDate(today.getDate() - i);
      const key = formatDateKey(d);
      const entry = currentMap.entries[key];
      const val = entry ? entry.value : 0;
      list.push({
        dateKey: key,
        level: getIntensityLevel(val, currentMap.targetValue),
      });
    }
    return list;
  };

  const handleCopyConfig = () => {
    setCopiedNotification(true);
    setTimeout(() => setCopiedNotification(false), 2000);
  };

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <TouchableWithoutFeedback onPress={onClose}>
        <View style={styles.overlay}>
          <TouchableWithoutFeedback>
            <View style={styles.modalBox}>
              {/* Header */}
              <View style={styles.modalHeader}>
                <View>
                  <View style={styles.headerTagRow}>
                    <Smartphone size={12} color="#58A6FF" />
                    <Text style={styles.modalSubtitle}>WIDGET STUDIO</Text>
                  </View>
                  <Text style={styles.modalTitle}>Native Widget Simulation</Text>
                </View>
                <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
                  <X size={16} color="#8B949E" />
                </TouchableOpacity>
              </View>

              <ScrollView showsVerticalScrollIndicator={false} style={styles.contentScroll}>
                {/* Map Selector */}
                <View style={styles.section}>
                  <Text style={styles.sectionLabel}>BIND HEATMAP TARGET</Text>
                  <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.mapPickerScroll}>
                    {heatmaps.map((m) => {
                      const isSelected = m.id === currentMap.id;
                      const p = PALETTES[m.paletteId] || PALETTES.emerald;
                      return (
                        <TouchableOpacity
                          key={m.id}
                          style={[
                            styles.mapPickerItem,
                            isSelected && { borderColor: p.accent, backgroundColor: '#1C2128' },
                          ]}
                          onPress={() => setSelectedMapId(m.id)}
                        >
                          <View style={[styles.miniDot, { backgroundColor: p.accent }]} />
                          <Text style={[styles.mapPickerText, isSelected && { color: '#F0F6FC' }]}>
                            {m.title}
                          </Text>
                        </TouchableOpacity>
                      );
                    })}
                  </ScrollView>
                </View>

                {/* Size Selector */}
                <View style={styles.section}>
                  <Text style={styles.sectionLabel}>WIDGET DIMENSION</Text>
                  <View style={styles.sizeSwitcher}>
                    {(['small', 'medium', 'large', 'lockscreen'] as WidgetSize[]).map((sz) => (
                      <TouchableOpacity
                        key={sz}
                        style={[styles.sizeBtn, widgetSize === sz && styles.sizeBtnActive]}
                        onPress={() => setWidgetSize(sz)}
                      >
                        <Text style={[styles.sizeBtnText, widgetSize === sz && styles.sizeBtnTextActive]}>
                          {sz.toUpperCase()}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>

                {/* Live Simulated Widget Display */}
                <View style={styles.previewCanvas}>
                  <Text style={styles.previewHint}>
                    LIVE OS PREVIEW | iOS WIDGETKIT / ANDROID / MACOS
                  </Text>

                  {/* SMALL WIDGET (155x155) */}
                  {widgetSize === 'small' && (
                    <View style={styles.smallWidgetContainer}>
                      <View style={styles.widgetHeaderRow}>
                        <Text style={styles.smallWidgetTitle} numberOfLines={1}>
                          {currentMap.title}
                        </Text>
                        <View
                          style={[
                            styles.statusIndicator,
                            { backgroundColor: isTodayLogged ? palette.accent : '#30363D' },
                          ]}
                        />
                      </View>

                      <View style={styles.smallStreakBlock}>
                        <View style={styles.streakLabelRow}>
                          <Zap size={11} color={palette.accent} />
                          <Text style={[styles.smallStreakNumber, { color: palette.accent }]}>
                            {stats.currentStreak}
                          </Text>
                          <Text style={styles.smallStreakDays}>days</Text>
                        </View>
                        <Text style={styles.smallStreakSub}>
                          {isTodayLogged ? 'Done today' : 'Needs log today'}
                        </Text>
                      </View>

                      {/* 14-day mini spark grid (2 rows of 7) */}
                      <View style={styles.smallSparkMatrix}>
                        {getRecentDays(14).map((d, i) => (
                          <View
                            key={`sw-${i}`}
                            style={[
                              styles.smallSparkCell,
                              { backgroundColor: palette.levels[d.level] },
                            ]}
                          />
                        ))}
                      </View>
                    </View>
                  )}

                  {/* MEDIUM WIDGET (320x155) */}
                  {widgetSize === 'medium' && (
                    <View style={styles.mediumWidgetContainer}>
                      <View style={styles.mediumTopBar}>
                        <View>
                          <Text style={styles.mediumCategory}>{currentMap.category.toUpperCase()}</Text>
                          <Text style={styles.mediumTitle}>{currentMap.title}</Text>
                        </View>
                        <View style={styles.mediumStatPill}>
                          <Zap size={12} color={palette.accent} />
                          <Text style={[styles.mediumStatText, { color: palette.accent }]}>
                            {stats.currentStreak}d streak
                          </Text>
                        </View>
                      </View>

                      {/* 28 days mini heatmap (4 rows of 7 days) */}
                      <View style={styles.mediumGridRow}>
                        {Array.from({ length: 4 }).map((_, colIdx) => (
                          <View key={`mcol-${colIdx}`} style={styles.mediumGridCol}>
                            {getRecentDays(28)
                              .slice(colIdx * 7, colIdx * 7 + 7)
                              .map((d, rowIdx) => (
                                <View
                                  key={`mcell-${colIdx}-${rowIdx}`}
                                  style={[
                                    styles.mediumCell,
                                    { backgroundColor: palette.levels[d.level] },
                                  ]}
                                />
                              ))}
                          </View>
                        ))}
                      </View>

                      <View style={styles.mediumFooter}>
                        <Text style={styles.mediumFooterText}>
                          Best: {stats.longestStreak}d | Rate: {stats.completionRate}%
                        </Text>
                        <Text style={styles.mediumFooterHint}>
                          {isTodayLogged ? 'Logged' : 'Tap to log'}
                        </Text>
                      </View>
                    </View>
                  )}

                  {/* LARGE WIDGET (320x320) */}
                  {widgetSize === 'large' && (
                    <View style={styles.largeWidgetContainer}>
                      <View style={styles.mediumTopBar}>
                        <View>
                          <Text style={styles.mediumCategory}>{currentMap.category.toUpperCase()}</Text>
                          <Text style={styles.largeTitle}>{currentMap.title}</Text>
                        </View>
                        <View style={styles.largeStatsRight}>
                          <Text style={[styles.largeStreak, { color: palette.accent }]}>
                            {stats.currentStreak}d
                          </Text>
                          <Text style={styles.largeStreakLabel}>STREAK</Text>
                        </View>
                      </View>

                      {/* 12 weeks matrix (12 cols x 7 days = 84 days) */}
                      <View style={styles.largeHeatmapWrapper}>
                        {Array.from({ length: 12 }).map((_, colIdx) => (
                          <View key={`lcol-${colIdx}`} style={styles.largeGridCol}>
                            {getRecentDays(84)
                              .slice(colIdx * 7, colIdx * 7 + 7)
                              .map((d, rowIdx) => (
                                <View
                                  key={`lcell-${colIdx}-${rowIdx}`}
                                  style={[
                                    styles.largeCell,
                                    { backgroundColor: palette.levels[d.level] },
                                  ]}
                                />
                              ))}
                          </View>
                        ))}
                      </View>

                      <View style={styles.largeStatsBar}>
                        <View style={styles.largeStatItem}>
                          <Text style={styles.largeStatNum}>{stats.longestStreak}d</Text>
                          <Text style={styles.largeStatDesc}>LONGEST</Text>
                        </View>
                        <View style={styles.largeStatItem}>
                          <Text style={styles.largeStatNum}>{stats.completionRate}%</Text>
                          <Text style={styles.largeStatDesc}>90D RATE</Text>
                        </View>
                        <View style={styles.largeStatItem}>
                          <Text style={styles.largeStatNum}>{stats.totalActiveDays}</Text>
                          <Text style={styles.largeStatDesc}>ACTIVE DAYS</Text>
                        </View>
                      </View>
                    </View>
                  )}

                  {/* LOCK SCREEN ACCESSORY */}
                  {widgetSize === 'lockscreen' && (
                    <View style={styles.lockscreenWidget}>
                      <View style={styles.lockscreenRow}>
                        <Zap size={13} color="#FFFFFF" />
                        <Text style={styles.lockscreenTitle}>{currentMap.title}</Text>
                      </View>
                      <View style={styles.lockscreenStreak}>
                        <Text style={styles.lockscreenNumber}>{stats.currentStreak}</Text>
                        <Text style={styles.lockscreenSub}>DAY STREAK</Text>
                      </View>
                      <View style={styles.lockscreenDots}>
                        {getRecentDays(7).map((d, i) => (
                          <View
                            key={`lsd-${i}`}
                            style={[
                              styles.lockscreenDot,
                              { backgroundColor: d.level > 0 ? '#FFFFFF' : '#333333' },
                            ]}
                          />
                        ))}
                      </View>
                    </View>
                  )}
                </View>

                {/* Integration Details */}
                <View style={styles.infoBox}>
                  <Text style={styles.infoTitle}>NATIVE WIDGET INTEGRATION</Text>
                  <Text style={styles.infoDesc}>
                    Code exports available in project directory:
                  </Text>
                  <Text style={styles.codePath}>• iOS: widgets/ios/HeatMapWidget.swift</Text>
                  <Text style={styles.codePath}>• Android: widgets/android/HeatMapWidgetProvider.kt</Text>
                  <Text style={styles.codePath}>• Shared Data: AppGroup UserDefaults & SQLite</Text>
                </View>
              </ScrollView>

              {/* Footer */}
              <View style={styles.modalFooter}>
                <TouchableOpacity
                  style={styles.copyBtn}
                  onPress={handleCopyConfig}
                  activeOpacity={0.7}
                >
                  <Copy size={13} color="#8B949E" />
                  <Text style={styles.copyBtnText}>
                    {copiedNotification ? 'Config Copied' : 'Copy Widget Schema'}
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.closeActionBtn}
                  onPress={onClose}
                  activeOpacity={0.7}
                >
                  <Text style={styles.closeActionText}>Done</Text>
                </TouchableOpacity>
              </View>
            </View>
          </TouchableWithoutFeedback>
        </View>
      </TouchableWithoutFeedback>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.82)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  modalBox: {
    width: '100%',
    maxWidth: 580,
    maxHeight: '90%',
    backgroundColor: '#0D1117',
    borderColor: '#30363D',
    borderWidth: 1,
    borderRadius: 4,
    padding: 20,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#21262D',
    paddingBottom: 12,
  },
  headerTagRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  modalSubtitle: {
    color: '#58A6FF',
    fontSize: 10,
    fontWeight: '700',
    fontFamily: 'Courier',
    letterSpacing: 0.5,
  },
  modalTitle: {
    color: '#F0F6FC',
    fontSize: 18,
    fontWeight: '600',
    marginTop: 2,
  },
  closeBtn: {
    padding: 4,
  },
  contentScroll: {
    marginBottom: 12,
  },
  section: {
    marginBottom: 14,
    gap: 6,
  },
  sectionLabel: {
    color: '#8B949E',
    fontSize: 10,
    fontWeight: '600',
    fontFamily: 'Courier',
    letterSpacing: 0.5,
  },
  mapPickerScroll: {
    flexDirection: 'row',
  },
  mapPickerItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#161B22',
    borderColor: '#30363D',
    borderWidth: 1,
    borderRadius: 3,
    paddingHorizontal: 10,
    paddingVertical: 6,
    marginRight: 8,
  },
  miniDot: {
    width: 6,
    height: 6,
    borderRadius: 1,
  },
  mapPickerText: {
    color: '#8B949E',
    fontSize: 11,
    fontFamily: 'Courier',
  },
  sizeSwitcher: {
    flexDirection: 'row',
    gap: 6,
  },
  sizeBtn: {
    flex: 1,
    backgroundColor: '#161B22',
    borderColor: '#30363D',
    borderWidth: 1,
    borderRadius: 3,
    paddingVertical: 7,
    alignItems: 'center',
  },
  sizeBtnActive: {
    backgroundColor: '#21262D',
    borderColor: '#58A6FF',
  },
  sizeBtnText: {
    color: '#8B949E',
    fontSize: 10,
    fontWeight: '600',
    fontFamily: 'Courier',
  },
  sizeBtnTextActive: {
    color: '#F0F6FC',
  },
  previewCanvas: {
    backgroundColor: '#010409',
    borderColor: '#21262D',
    borderWidth: 1,
    borderRadius: 4,
    padding: 16,
    alignItems: 'center',
    marginBottom: 14,
  },
  previewHint: {
    color: '#6E7681',
    fontSize: 9,
    fontFamily: 'Courier',
    marginBottom: 12,
    letterSpacing: 0.5,
  },
  smallWidgetContainer: {
    width: 155,
    height: 155,
    backgroundColor: '#161B22',
    borderColor: '#30363D',
    borderWidth: 1,
    borderRadius: 16,
    padding: 12,
    justifyContent: 'space-between',
  },
  widgetHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  smallWidgetTitle: {
    color: '#F0F6FC',
    fontSize: 12,
    fontWeight: '600',
    fontFamily: 'Courier',
    maxWidth: 105,
  },
  statusIndicator: {
    width: 7,
    height: 7,
    borderRadius: 3.5,
  },
  smallStreakBlock: {
    marginVertical: 4,
  },
  streakLabelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  smallStreakNumber: {
    fontSize: 22,
    fontWeight: '700',
    fontFamily: 'Courier',
  },
  smallStreakDays: {
    color: '#8B949E',
    fontSize: 11,
    fontFamily: 'Courier',
  },
  smallStreakSub: {
    color: '#6E7681',
    fontSize: 9,
    fontFamily: 'Courier',
  },
  smallSparkMatrix: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 3,
  },
  smallSparkCell: {
    width: 14,
    height: 14,
    borderRadius: 2,
  },
  mediumWidgetContainer: {
    width: 320,
    height: 155,
    backgroundColor: '#161B22',
    borderColor: '#30363D',
    borderWidth: 1,
    borderRadius: 16,
    padding: 12,
    justifyContent: 'space-between',
  },
  mediumTopBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  mediumCategory: {
    color: '#6E7681',
    fontSize: 9,
    fontWeight: '700',
    fontFamily: 'Courier',
  },
  mediumTitle: {
    color: '#F0F6FC',
    fontSize: 14,
    fontWeight: '600',
  },
  mediumStatPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#0D1117',
    borderColor: '#30363D',
    borderWidth: 1,
    borderRadius: 3,
    paddingHorizontal: 6,
    paddingVertical: 3,
  },
  mediumStatText: {
    fontSize: 11,
    fontWeight: '700',
    fontFamily: 'Courier',
  },
  mediumGridRow: {
    flexDirection: 'row',
    gap: 5,
    justifyContent: 'center',
    marginVertical: 4,
  },
  mediumGridCol: {
    flexDirection: 'column',
    gap: 4,
  },
  mediumCell: {
    width: 10,
    height: 10,
    borderRadius: 2,
  },
  mediumFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  mediumFooterText: {
    color: '#8B949E',
    fontSize: 10,
    fontFamily: 'Courier',
  },
  mediumFooterHint: {
    color: '#6E7681',
    fontSize: 9,
    fontFamily: 'Courier',
  },
  largeWidgetContainer: {
    width: 320,
    height: 320,
    backgroundColor: '#161B22',
    borderColor: '#30363D',
    borderWidth: 1,
    borderRadius: 16,
    padding: 14,
    justifyContent: 'space-between',
  },
  largeTitle: {
    color: '#F0F6FC',
    fontSize: 16,
    fontWeight: '600',
  },
  largeStatsRight: {
    alignItems: 'flex-end',
  },
  largeStreak: {
    fontSize: 20,
    fontWeight: '700',
    fontFamily: 'Courier',
  },
  largeStreakLabel: {
    color: '#6E7681',
    fontSize: 8,
    fontFamily: 'Courier',
  },
  largeHeatmapWrapper: {
    flexDirection: 'row',
    gap: 4,
    justifyContent: 'center',
    paddingVertical: 10,
  },
  largeGridCol: {
    flexDirection: 'column',
    gap: 4,
  },
  largeCell: {
    width: 12,
    height: 12,
    borderRadius: 2,
  },
  largeStatsBar: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    borderTopWidth: 1,
    borderTopColor: '#30363D',
    paddingTop: 8,
  },
  largeStatItem: {
    alignItems: 'center',
  },
  largeStatNum: {
    color: '#F0F6FC',
    fontSize: 12,
    fontWeight: '700',
    fontFamily: 'Courier',
  },
  largeStatDesc: {
    color: '#6E7681',
    fontSize: 8,
    fontFamily: 'Courier',
  },
  lockscreenWidget: {
    width: 160,
    height: 65,
    backgroundColor: '#1A1A1A',
    borderColor: '#333333',
    borderWidth: 1,
    borderRadius: 8,
    padding: 8,
    justifyContent: 'space-between',
  },
  lockscreenRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  lockscreenTitle: {
    color: '#E0E0E0',
    fontSize: 10,
    fontWeight: '600',
    fontFamily: 'Courier',
  },
  lockscreenStreak: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 4,
  },
  lockscreenNumber: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
    fontFamily: 'Courier',
  },
  lockscreenSub: {
    color: '#888888',
    fontSize: 8,
    fontFamily: 'Courier',
  },
  lockscreenDots: {
    flexDirection: 'row',
    gap: 3,
  },
  lockscreenDot: {
    width: 6,
    height: 6,
    borderRadius: 1,
  },
  infoBox: {
    backgroundColor: '#161B22',
    borderColor: '#30363D',
    borderWidth: 1,
    borderRadius: 3,
    padding: 10,
    gap: 4,
  },
  infoTitle: {
    color: '#58A6FF',
    fontSize: 10,
    fontWeight: '700',
    fontFamily: 'Courier',
  },
  infoDesc: {
    color: '#8B949E',
    fontSize: 11,
  },
  codePath: {
    color: '#F0F6FC',
    fontSize: 10,
    fontFamily: 'Courier',
  },
  modalFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: '#21262D',
    paddingTop: 12,
  },
  copyBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 7,
    paddingHorizontal: 10,
    backgroundColor: '#161B22',
    borderColor: '#30363D',
    borderWidth: 1,
    borderRadius: 3,
  },
  copyBtnText: {
    color: '#8B949E',
    fontSize: 11,
    fontFamily: 'Courier',
  },
  closeActionBtn: {
    backgroundColor: '#21262D',
    borderColor: '#30363D',
    borderWidth: 1,
    borderRadius: 3,
    paddingVertical: 7,
    paddingHorizontal: 16,
  },
  closeActionText: {
    color: '#F0F6FC',
    fontSize: 12,
    fontWeight: '600',
    fontFamily: 'Courier',
  },
});

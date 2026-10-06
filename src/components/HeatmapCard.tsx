import React, { useState } from 'react';
import { StyleSheet, View, Text, TouchableOpacity, Platform, Modal, TextInput } from 'react-native';
import { HeatMapModel, ViewMode } from '../types/heatmap';
import { PALETTES } from '../constants/palettes';
import { calculateStats } from '../utils/streakUtils';
import { getTodayKey } from '../utils/dateUtils';
import { YearlyView } from './YearlyView';
import { MonthlyView } from './MonthlyView';
import { ViewSwitcher } from './ViewSwitcher';
import { Check, Plus, Trash2, Flame } from 'lucide-react-native';
import { useAppTheme, useIsDark } from '../theme/theme';

interface HeatmapCardProps {
  heatmap: HeatMapModel;
  viewMode?: ViewMode;
  onSelectDate: (mapId: string, dateKey: string) => void;
  onQuickLogToday: (mapId: string) => void;
  onDeleteMap: (mapId: string) => void;
  onUpdateViewMode?: (mapId: string, mode: ViewMode) => void;
}

const fontStack = Platform.select({
  web: '"SF Pro Rounded", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
  ios: 'System',
  default: 'sans-serif',
});

export const HeatmapCard: React.FC<HeatmapCardProps> = ({
  heatmap,
  viewMode: propViewMode,
  onSelectDate,
  onQuickLogToday,
  onDeleteMap,
  onUpdateViewMode,
}) => {
  const theme = useAppTheme();
  const isDark = useIsDark();
  const [cardViewMode, setCardViewMode] = useState<ViewMode>(
    heatmap.defaultView || propViewMode || 'yearly'
  );

  const { stats, streakMap } = calculateStats(heatmap);
  const palette = PALETTES[heatmap.paletteId] || PALETTES.emerald;
  const isObsidian = heatmap.paletteId === 'obsidian';
  const activeAccent = isDark ? palette.accent : (palette.lightAccent || palette.accent);
  const todayKey = getTodayKey();
  const todayEntry = heatmap.entries[todayKey];
  const isTodayLogged = !!todayEntry?.completed;

  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteInput, setDeleteInput] = useState('');

  const handleViewChange = (mode: ViewMode) => {
    setCardViewMode(mode);
    if (onUpdateViewMode) {
      onUpdateViewMode(heatmap.id, mode);
    }
  };

  const confirmDelete = () => {
    if (deleteInput === heatmap.title) {
      onDeleteMap(heatmap.id);
      setShowDeleteModal(false);
    }
  };

  return (
    <View style={[styles.card, { backgroundColor: theme.surface, borderColor: theme.borderSubtle }]}>
      {/* 1. Habit Header: Title + Palette Indicator + Independent View Switcher + Trash Button */}
      <View style={styles.cardHeader}>
        <View style={styles.titleGroup}>
          <View style={[styles.paletteIndicator, { backgroundColor: activeAccent }]} />
          <Text style={[styles.titleText, { color: theme.text }]} numberOfLines={1}>
            {heatmap.title}
          </Text>
        </View>

        <View style={styles.headerRightActions}>
          <ViewSwitcher
            currentView={cardViewMode}
            onViewChange={handleViewChange}
            size="small"
          />

          <TouchableOpacity
            activeOpacity={0.7}
            onPress={() => {
              setDeleteInput('');
              setShowDeleteModal(true);
            }}
            style={[
              styles.deleteButton,
              { backgroundColor: isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.05)' },
            ]}
            accessibilityLabel="Delete habit"
          >
            <Trash2 size={12} color={theme.textSecondary} />
          </TouchableOpacity>
        </View>
      </View>

      {/* 2. Separate Dedicated Section: Action Button & Habit Streak Info */}
      <View style={[styles.actionInfoBar, { backgroundColor: theme.surfaceHighlight, borderColor: theme.borderSubtle }]}>
        <TouchableOpacity
          activeOpacity={0.75}
          onPress={() => onQuickLogToday(heatmap.id)}
          style={[
            styles.quickLogButton,
            isTodayLogged
              ? {
                  backgroundColor: isDark
                    ? (isObsidian ? '#F0F3F6' : (palette.levels[2] || palette.accent))
                    : (isObsidian ? '#24292F' : (palette.lightLevels?.[3] || activeAccent)),
                  borderColor: isDark
                    ? (isObsidian ? '#F0F3F6' : palette.accent)
                    : (isObsidian ? '#24292F' : activeAccent),
                }
              : { backgroundColor: theme.surface, borderColor: theme.borderSubtle },
          ]}
        >
          {isTodayLogged ? (
            <>
              <Check
                size={13}
                color={isDark && isObsidian ? '#090A0C' : '#FFFFFF'}
                strokeWidth={2.5}
              />
              <Text
                style={[
                  styles.quickLogTextActive,
                  isDark && isObsidian && { color: '#090A0C' },
                ]}
              >
                Completed Today
              </Text>
            </>
          ) : (
            <>
              <Plus size={13} color={activeAccent} strokeWidth={2.5} />
              <Text style={[styles.quickLogTextPending, { color: activeAccent }]}>Mark Done Today</Text>
            </>
          )}
        </TouchableOpacity>

        {stats.currentStreak > 0 ? (
          <View
            style={[
              styles.streakBadge,
              {
                backgroundColor: theme.surface,
                borderColor: activeAccent,
              },
            ]}
          >
            <Flame size={12} color={activeAccent} strokeWidth={2.5} />
            <Text style={[styles.streakText, { color: activeAccent }]}>
              {stats.currentStreak}d streak
            </Text>
          </View>
        ) : (
          <Text style={[styles.streakPlaceholder, { color: theme.textMuted }]}>
            No active streak
          </Text>
        )}
      </View>

      {/* 3. Grid Matrix Body: Controlled by this card's independent view mode */}
      <View style={styles.viewBody}>
        {cardViewMode === 'monthly' ? (
          <MonthlyView
            heatmap={heatmap}
            streakMap={streakMap}
            onSelectDate={(dKey) => onSelectDate(heatmap.id, dKey)}
          />
        ) : (
          <YearlyView
            heatmap={heatmap}
            streakMap={streakMap}
            onSelectDate={(dKey) => onSelectDate(heatmap.id, dKey)}
          />
        )}
      </View>

      {/* 4. Compact Integrated Bottom Stats Line */}
      <View style={[styles.statsLine, { borderTopColor: theme.borderSubtle }]}>
        <View style={styles.statItem}>
          <Text style={[styles.statKey, { color: theme.textMuted }]}>Streak</Text>
          <Text style={[styles.statVal, { color: activeAccent }]}>{stats.currentStreak}d</Text>
        </View>
        <Text style={[styles.statDot, { color: theme.borderSubtle }]}>·</Text>
        <View style={styles.statItem}>
          <Text style={[styles.statKey, { color: theme.textMuted }]}>Best</Text>
          <Text style={[styles.statVal, { color: theme.text }]}>{stats.longestStreak}d</Text>
        </View>
        <Text style={[styles.statDot, { color: theme.borderSubtle }]}>·</Text>
        <View style={styles.statItem}>
          <Text style={[styles.statKey, { color: theme.textMuted }]}>90d</Text>
          <Text style={[styles.statVal, { color: theme.text }]}>{stats.completionRate}%</Text>
        </View>
        <Text style={[styles.statDot, { color: theme.borderSubtle }]}>·</Text>
        <View style={styles.statItem}>
          <Text style={[styles.statKey, { color: theme.textMuted }]}>Total</Text>
          <Text style={[styles.statVal, { color: theme.text }]}>{stats.totalActiveDays}d</Text>
        </View>
      </View>

      {/* GitHub-style Delete Modal */}
      <Modal visible={showDeleteModal} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: theme.surface, borderColor: theme.borderSubtle }]}>
            <Text style={[styles.modalTitle, { color: theme.text }]}>Delete Habit Tracker</Text>
            <Text style={[styles.modalWarning, { color: theme.textSecondary }]}>
              This action cannot be undone. All logged history for this habit will be permanently deleted.
            </Text>
            
            <Text style={[styles.modalLabel, { color: theme.text }]}>
              Please type <Text style={{ fontWeight: '800' }}>{heatmap.title}</Text> to confirm.
            </Text>
            
            <TextInput
              style={[
                styles.deleteInput,
                { 
                  backgroundColor: theme.surfaceHighlight, 
                  borderColor: theme.borderSubtle, 
                  color: theme.text 
                }
              ]}
              value={deleteInput}
              onChangeText={setDeleteInput}
              placeholder={heatmap.title}
              placeholderTextColor={theme.textMuted}
              autoFocus
            />

            <View style={styles.modalActions}>
              <TouchableOpacity
                style={[styles.cancelBtn, { borderColor: theme.borderSubtle, backgroundColor: theme.surfaceHighlight }]}
                onPress={() => setShowDeleteModal(false)}
              >
                <Text style={[styles.cancelBtnText, { color: theme.text }]}>Cancel</Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={[
                  styles.confirmBtn,
                  { backgroundColor: deleteInput === heatmap.title ? theme.error : theme.borderSubtle }
                ]}
                disabled={deleteInput !== heatmap.title}
                onPress={confirmDelete}
              >
                <Text style={styles.confirmBtnText}>Delete Tracker</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    borderWidth: 1,
    borderRadius: 14,
    padding: 16,
    marginBottom: 16,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
    gap: 8,
  },
  titleGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flex: 1,
  },
  paletteIndicator: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  titleText: {
    fontSize: 16,
    fontWeight: '700',
    fontFamily: fontStack,
    letterSpacing: -0.2,
  },
  headerRightActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  deleteButton: {
    width: 25,
    height: 25,
    borderRadius: 13,
    justifyContent: 'center',
    alignItems: 'center',
  },

  // Dedicated Action & Info Bar
  actionInfoBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderRadius: 9,
    borderWidth: 1,
    marginBottom: 12,
  },
  quickLogButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 7,
    borderWidth: 1,
  },
  quickLogTextActive: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 12,
    fontFamily: fontStack,
  },
  quickLogTextPending: {
    fontWeight: '700',
    fontSize: 12,
    fontFamily: fontStack,
  },
  streakBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 9,
    paddingVertical: 5,
    borderRadius: 7,
    borderWidth: 1,
  },
  streakText: {
    fontSize: 11.5,
    fontWeight: '700',
    fontFamily: fontStack,
  },
  streakPlaceholder: {
    fontSize: 11,
    fontFamily: fontStack,
  },

  viewBody: {
    marginVertical: 4,
  },

  // Bottom Stats
  statsLine: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 10,
    marginTop: 8,
    borderTopWidth: 1,
  },
  statItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  statKey: {
    fontSize: 11,
    fontFamily: fontStack,
  },
  statVal: {
    fontSize: 11,
    fontWeight: '700',
    fontFamily: fontStack,
  },
  statDot: {
    fontSize: 11,
  },

  // Delete modal
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.65)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContent: {
    width: '100%',
    maxWidth: 400,
    borderWidth: 1,
    borderRadius: 14,
    padding: 20,
  },
  modalTitle: {
    fontSize: 16,
    fontWeight: '700',
    fontFamily: fontStack,
    marginBottom: 8,
  },
  modalWarning: {
    fontSize: 13,
    fontFamily: fontStack,
    lineHeight: 18,
    marginBottom: 16,
  },
  modalLabel: {
    fontSize: 13,
    fontFamily: fontStack,
    marginBottom: 8,
  },
  deleteInput: {
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    fontSize: 13,
    fontFamily: fontStack,
    marginBottom: 16,
  },
  modalActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 10,
  },
  cancelBtn: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
  },
  cancelBtnText: {
    fontSize: 12,
    fontWeight: '600',
    fontFamily: fontStack,
  },
  confirmBtn: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 8,
  },
  confirmBtnText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '600',
    fontFamily: fontStack,
  },
});

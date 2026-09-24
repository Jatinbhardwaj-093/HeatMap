import React, { useState } from 'react';
import { StyleSheet, View, Text, TouchableOpacity, Platform, Modal, TextInput } from 'react-native';
import { HeatMapModel, ViewMode } from '../types/heatmap';
import { PALETTES } from '../constants/palettes';
import { calculateStats } from '../utils/streakUtils';
import { getTodayKey } from '../utils/dateUtils';
import { YearlyView } from './YearlyView';
import { MonthlyView } from './MonthlyView';
import { Check, Plus, Trash2, Flame } from 'lucide-react-native';
import { useAppTheme } from '../theme/theme';

interface HeatmapCardProps {
  heatmap: HeatMapModel;
  viewMode: ViewMode;
  onSelectDate: (mapId: string, dateKey: string) => void;
  onQuickLogToday: (mapId: string) => void;
  onDeleteMap: (mapId: string) => void;
}

const fontStack = Platform.select({
  web: '"SF Pro Rounded", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
  ios: 'System',
  default: 'sans-serif',
});

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

  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteInput, setDeleteInput] = useState('');

  const confirmDelete = () => {
    if (deleteInput === heatmap.title) {
      onDeleteMap(heatmap.id);
      setShowDeleteModal(false);
    }
  };

  return (
    <View style={[styles.card, { backgroundColor: theme.surface, borderColor: theme.borderSubtle }]}>
      {/* Streamlined Single Top Bar */}
      <View style={styles.cardHeader}>
        <View style={styles.titleGroup}>
          <Text style={[styles.titleText, { color: theme.text }]} numberOfLines={1}>
            {heatmap.title}
          </Text>

          {stats.currentStreak > 0 && (
            <View
              style={[
                styles.streakPill,
                {
                  backgroundColor: palette.levels[1] || theme.surfaceHighlight,
                  borderColor: palette.accent,
                },
              ]}
            >
              <Flame size={12} color={palette.accent} strokeWidth={2.5} />
              <Text style={[styles.streakText, { color: palette.accent }]}>
                {stats.currentStreak}d
              </Text>
            </View>
          )}
        </View>

        <View style={styles.actionsGroup}>
          <TouchableOpacity
            activeOpacity={0.75}
            onPress={() => onQuickLogToday(heatmap.id)}
            style={[
              styles.quickLogButton,
              isTodayLogged
                ? { backgroundColor: palette.levels[2], borderColor: palette.accent }
                : { backgroundColor: theme.surfaceHighlight, borderColor: theme.borderSubtle },
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
            onPress={() => {
              setDeleteInput('');
              setShowDeleteModal(true);
            }}
            style={[styles.deleteButton, { backgroundColor: theme.surfaceHighlight, borderColor: theme.borderSubtle }]}
            accessibilityLabel="Delete habit"
          >
            <Trash2 size={13} color={theme.textMuted} />
          </TouchableOpacity>
        </View>
      </View>

      {/* Grid Matrix Body */}
      <View style={styles.viewBody}>
        {viewMode === 'monthly' ? (
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

      {/* Compact Integrated Bottom Stats Line */}
      <View style={[styles.statsLine, { borderTopColor: theme.borderSubtle }]}>
        <View style={styles.statItem}>
          <Text style={[styles.statKey, { color: theme.textMuted }]}>Streak</Text>
          <Text style={[styles.statVal, { color: palette.accent }]}>{stats.currentStreak}d</Text>
        </View>
        <Text style={[styles.statDot, { color: theme.border }]}>·</Text>
        <View style={styles.statItem}>
          <Text style={[styles.statKey, { color: theme.textMuted }]}>Best</Text>
          <Text style={[styles.statVal, { color: theme.text }]}>{stats.longestStreak}d</Text>
        </View>
        <Text style={[styles.statDot, { color: theme.border }]}>·</Text>
        <View style={styles.statItem}>
          <Text style={[styles.statKey, { color: theme.textMuted }]}>90d</Text>
          <Text style={[styles.statVal, { color: theme.text }]}>{stats.completionRate}%</Text>
        </View>
        <Text style={[styles.statDot, { color: theme.border }]}>·</Text>
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
    padding: 18,
    marginBottom: 16,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  titleGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flex: 1,
    marginRight: 12,
  },
  titleText: {
    fontSize: 16,
    fontWeight: '700',
    fontFamily: fontStack,
    letterSpacing: -0.2,
  },
  streakPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
    borderWidth: 1,
  },
  streakText: {
    fontSize: 11,
    fontWeight: '700',
    fontFamily: fontStack,
  },
  actionsGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  quickLogButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 8,
    borderWidth: 1,
  },
  quickLogText: {
    fontSize: 11,
    fontWeight: '700',
    fontFamily: fontStack,
    letterSpacing: 0.5,
  },
  quickLogTextActive: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '700',
    fontFamily: fontStack,
    letterSpacing: 0.5,
  },
  deleteButton: {
    padding: 7,
    borderRadius: 8,
    borderWidth: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  viewBody: {
    marginBottom: 8,
  },
  statsLine: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingTop: 12,
    marginTop: 4,
    borderTopWidth: 1,
    gap: 12,
    flexWrap: 'wrap',
  },
  statItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  statKey: {
    fontSize: 11,
    fontWeight: '500',
    fontFamily: fontStack,
  },
  statVal: {
    fontSize: 12,
    fontWeight: '700',
    fontFamily: fontStack,
  },
  statDot: {
    fontSize: 14,
  },

  // Modal
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.65)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContent: {
    width: '100%',
    maxWidth: 420,
    borderWidth: 1,
    borderRadius: 14,
    padding: 24,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '800',
    marginBottom: 8,
    fontFamily: fontStack,
  },
  modalWarning: {
    fontSize: 13,
    lineHeight: 20,
    marginBottom: 16,
    fontFamily: fontStack,
  },
  modalLabel: {
    fontSize: 13,
    marginBottom: 10,
    fontFamily: fontStack,
  },
  deleteInput: {
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
    marginBottom: 20,
    fontFamily: fontStack,
  },
  modalActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 10,
  },
  cancelBtn: {
    paddingHorizontal: 16,
    paddingVertical: 9,
    borderRadius: 8,
    borderWidth: 1,
  },
  cancelBtnText: {
    fontSize: 13,
    fontWeight: '600',
    fontFamily: fontStack,
  },
  confirmBtn: {
    paddingHorizontal: 18,
    paddingVertical: 9,
    borderRadius: 8,
    justifyContent: 'center',
  },
  confirmBtnText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '700',
    fontFamily: fontStack,
  },
});

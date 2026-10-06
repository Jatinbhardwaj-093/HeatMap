import React from 'react';
import {
  StyleSheet,
  View,
  Text,
  Modal,
  TouchableOpacity,
  TouchableWithoutFeedback,
  Platform,
} from 'react-native';
import { HeatMapModel } from '../types/heatmap';
import { PALETTES } from '../constants/palettes';
import { X, Check } from 'lucide-react-native';
import { useAppTheme, useIsDark } from '../theme/theme';

interface DayDetailModalProps {
  visible: boolean;
  dateKey: string | null;
  heatmap: HeatMapModel | null;
  onClose: () => void;
  onSave: (dateKey: string, completed: boolean, notes?: string) => void;
  onDelete: (dateKey: string) => void;
}

function formatDisplayDate(dateStr: string): string {
  try {
    const [year, month, day] = dateStr.split('-').map(Number);
    const d = new Date(year, month - 1, day);
    return d.toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  } catch {
    return dateStr;
  }
}

export const DayDetailModal: React.FC<DayDetailModalProps> = ({
  visible,
  dateKey,
  heatmap,
  onClose,
  onSave,
}) => {
  const theme = useAppTheme();
  const isDark = useIsDark();

  if (!visible || !dateKey || !heatmap) return null;

  const existingEntry = heatmap.entries[dateKey];
  const isCompleted = !!existingEntry?.completed;
  const palette = PALETTES[heatmap.paletteId] || PALETTES.emerald;
  const isObsidian = heatmap.paletteId === 'obsidian';
  const activeAccent = isDark ? palette.accent : (palette.lightAccent || palette.accent);

  const handleToggle = (completed: boolean) => {
    onSave(dateKey, completed);
  };

  const trackBg = isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.05)';
  const inactivePillBg = isDark ? '#21262D' : '#FFFFFF';

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <TouchableWithoutFeedback onPress={onClose}>
        <View style={styles.overlay}>
          <TouchableWithoutFeedback>
            <View
              style={[
                styles.modalBox,
                {
                  backgroundColor: theme.surface,
                  borderColor: theme.borderSubtle,
                },
                Platform.select({
                  web: {
                    boxShadow: isDark
                      ? '0 16px 40px rgba(0, 0, 0, 0.6), 0 0 0 1px rgba(255, 255, 255, 0.06)'
                      : '0 16px 40px rgba(0, 0, 0, 0.12), 0 0 0 1px rgba(0, 0, 0, 0.04)',
                  } as any,
                  default: {
                    shadowColor: '#000000',
                    shadowOffset: { width: 0, height: 8 },
                    shadowOpacity: 0.25,
                    shadowRadius: 16,
                    elevation: 10,
                  },
                }),
              ]}
            >
              {/* Header */}
              <View style={styles.modalHeader}>
                <View style={styles.headerLeft}>
                  <View style={styles.habitBadge}>
                    <View style={[styles.habitDot, { backgroundColor: activeAccent }]} />
                    <Text style={[styles.habitTitle, { color: theme.textSecondary }]} numberOfLines={1}>
                      {heatmap.title.toUpperCase()}
                    </Text>
                  </View>
                  <Text style={[styles.modalDate, { color: theme.text }]}>
                    {formatDisplayDate(dateKey)}
                  </Text>
                </View>

                <TouchableOpacity
                  onPress={onClose}
                  style={[
                    styles.closeBtn,
                    { backgroundColor: isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.05)' },
                  ]}
                  activeOpacity={0.7}
                  accessibilityLabel="Close"
                >
                  <X size={15} color={theme.textSecondary} />
                </TouchableOpacity>
              </View>

              {/* Minimal Capsule Toggler */}
              <View style={[styles.toggleTrack, { backgroundColor: trackBg }]}>
                {/* Not Done Option */}
                <TouchableOpacity
                  activeOpacity={0.7}
                  style={[
                    styles.segment,
                    !isCompleted && [
                      styles.segmentActive,
                      { backgroundColor: inactivePillBg },
                      Platform.select({
                        web: {
                          boxShadow: isDark
                            ? '0 1px 3px rgba(0, 0, 0, 0.4)'
                            : '0 1px 3px rgba(0, 0, 0, 0.1), 0 1px 2px rgba(0, 0, 0, 0.06)',
                        } as any,
                        default: {
                          shadowColor: '#000000',
                          shadowOffset: { width: 0, height: 1 },
                          shadowOpacity: 0.12,
                          shadowRadius: 2,
                          elevation: 1,
                        },
                      }),
                    ],
                  ]}
                  onPress={() => handleToggle(false)}
                >
                  <View style={[styles.circleDot, { borderColor: !isCompleted ? theme.textSecondary : theme.textMuted }]} />
                  <Text
                    style={[
                      styles.segmentText,
                      { color: !isCompleted ? theme.text : theme.textSecondary },
                      !isCompleted && { fontWeight: '700' },
                    ]}
                  >
                    Not Done
                  </Text>
                </TouchableOpacity>

                {/* Completed Option */}
                <TouchableOpacity
                  activeOpacity={0.7}
                  style={[
                    styles.segment,
                    isCompleted && [
                      styles.segmentActive,
                      {
                        backgroundColor: isDark
                          ? (isObsidian ? '#F0F3F6' : (palette.levels[3] || palette.accent))
                          : (isObsidian ? '#24292F' : (palette.lightLevels?.[3] || activeAccent)),
                      },
                      Platform.select({
                        web: {
                          boxShadow: '0 2px 6px rgba(0, 0, 0, 0.25)',
                        } as any,
                        default: {
                          shadowColor: '#000000',
                          shadowOffset: { width: 0, height: 1 },
                          shadowOpacity: 0.18,
                          shadowRadius: 3,
                          elevation: 2,
                        },
                      }),
                    ],
                  ]}
                  onPress={() => handleToggle(true)}
                >
                  <Check
                    size={14}
                    color={
                      !isCompleted
                        ? theme.textSecondary
                        : isDark && isObsidian
                        ? '#090A0C'
                        : '#FFFFFF'
                    }
                    strokeWidth={2.5}
                  />
                  <Text
                    style={[
                      styles.segmentText,
                      {
                        color: !isCompleted
                          ? theme.textSecondary
                          : isDark && isObsidian
                          ? '#090A0C'
                          : '#FFFFFF',
                      },
                      isCompleted && { fontWeight: '700' },
                    ]}
                  >
                    Completed
                  </Text>
                </TouchableOpacity>
              </View>

              {/* Close Button */}
              <TouchableOpacity
                onPress={onClose}
                style={[
                  styles.doneBtn,
                  { backgroundColor: isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.05)' },
                ]}
                activeOpacity={0.7}
              >
                <Text style={[styles.doneBtnText, { color: theme.text }]}>Done</Text>
              </TouchableOpacity>
            </View>
          </TouchableWithoutFeedback>
        </View>
      </TouchableWithoutFeedback>
    </Modal>
  );
};

const fontStack = Platform.select({
  web: '"SF Pro Rounded", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
  ios: 'System',
  default: 'sans-serif',
});

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.65)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalBox: {
    width: '100%',
    maxWidth: 340,
    borderWidth: 1,
    borderRadius: 20,
    padding: 20,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 18,
  },
  headerLeft: {
    flex: 1,
    marginRight: 10,
  },
  habitBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 4,
  },
  habitDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  habitTitle: {
    fontSize: 10.5,
    fontWeight: '700',
    fontFamily: fontStack,
    letterSpacing: 0.5,
  },
  modalDate: {
    fontSize: 17,
    fontWeight: '700',
    fontFamily: fontStack,
    letterSpacing: -0.2,
  },
  closeBtn: {
    width: 28,
    height: 28,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
  },
  toggleTrack: {
    flexDirection: 'row',
    borderRadius: 20,
    padding: 3,
    marginBottom: 16,
  },
  segment: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 9,
    borderRadius: 16,
    gap: 6,
  },
  segmentActive: {},
  circleDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    borderWidth: 1.5,
  },
  segmentText: {
    fontSize: 12.5,
    fontWeight: '500',
    fontFamily: fontStack,
    letterSpacing: 0.1,
  },
  doneBtn: {
    paddingVertical: 10,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  doneBtnText: {
    fontSize: 13,
    fontWeight: '600',
    fontFamily: fontStack,
  },
});

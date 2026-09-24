import React, { useState } from 'react';
import {
  StyleSheet,
  View,
  Text,
  Modal,
  TextInput,
  TouchableOpacity,
  ScrollView,
  TouchableWithoutFeedback,
  Platform,
} from 'react-native';
import { HeatMapModel, PaletteId } from '../types/heatmap';
import { PALETTES, DEFAULT_PALETTE_ID } from '../constants/palettes';
import { X, Check } from 'lucide-react-native';
import { useAppTheme } from '../theme/theme';

interface CreateHeatmapModalProps {
  visible: boolean;
  onClose: () => void;
  onCreate: (heatmap: Omit<HeatMapModel, 'id' | 'createdAt' | 'entries'>) => void;
}

const fontStack = Platform.select({
  web: '"SF Pro Rounded", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
  ios: 'System',
  default: 'sans-serif',
});

export const CreateHeatmapModal: React.FC<CreateHeatmapModalProps> = ({
  visible,
  onClose,
  onCreate,
}) => {
  const theme = useAppTheme();
  const [title, setTitle] = useState('');
  const [paletteId, setPaletteId] = useState<PaletteId>(DEFAULT_PALETTE_ID);
  const [errorMsg, setErrorMsg] = useState('');

  const resetForm = () => {
    setTitle('');
    setPaletteId(DEFAULT_PALETTE_ID);
    setErrorMsg('');
  };

  const handleCreate = () => {
    if (!title.trim()) {
      setErrorMsg('Please enter a habit name.');
      return;
    }

    onCreate({
      title: title.trim(),
      category: 'HABIT',
      paletteId,
    });

    resetForm();
    onClose();
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <TouchableWithoutFeedback onPress={onClose}>
        <View style={styles.overlay}>
          <TouchableWithoutFeedback>
            <View style={[styles.modalBox, { backgroundColor: theme.surface, borderColor: theme.borderSubtle }]}>
              <View style={[styles.modalHeader, { borderBottomColor: theme.borderSubtle }]}>
                <View>
                  <Text style={[styles.modalSubtitle, { color: theme.textMuted }]}>NEW TRACKER</Text>
                  <Text style={[styles.modalTitle, { color: theme.text }]}>Create Habit</Text>
                </View>
                <TouchableOpacity onPress={onClose} style={[styles.closeBtn, { backgroundColor: theme.surfaceHighlight }]} accessibilityLabel="Close modal">
                  <X size={16} color={theme.textSecondary} />
                </TouchableOpacity>
              </View>

              <ScrollView style={styles.scrollBody} showsVerticalScrollIndicator={false}>
                {errorMsg ? (
                  <View style={[styles.errorBox, { backgroundColor: 'rgba(248, 81, 73, 0.1)', borderColor: theme.error }]}>
                    <Text style={[styles.errorText, { color: theme.error }]}>{errorMsg}</Text>
                  </View>
                ) : null}

                <View style={styles.formGroup}>
                  <Text style={[styles.label, { color: theme.text }]}>HABIT NAME *</Text>
                  <TextInput
                    style={[styles.input, { backgroundColor: theme.surfaceHighlight, borderColor: theme.borderSubtle, color: theme.text }]}
                    placeholder="e.g. Deep Work, Workout, Morning Run..."
                    placeholderTextColor={theme.textMuted}
                    value={title}
                    onChangeText={(t) => {
                      setTitle(t);
                      if (errorMsg) setErrorMsg('');
                    }}
                    autoFocus
                  />
                </View>

                <View style={styles.formGroup}>
                  <Text style={[styles.label, { color: theme.text }]}>COLOR THEME</Text>
                  <View style={styles.palettesList}>
                    {(Object.keys(PALETTES) as PaletteId[]).map((pId) => {
                      const pal = PALETTES[pId];
                      const isSelected = paletteId === pId;
                      return (
                        <TouchableOpacity
                          key={pId}
                          style={[
                            styles.paletteItem,
                            { backgroundColor: theme.surfaceHighlight, borderColor: theme.borderSubtle },
                            isSelected && { borderColor: pal.accent, backgroundColor: theme.surface },
                          ]}
                          onPress={() => setPaletteId(pId)}
                          activeOpacity={0.7}
                        >
                          <View style={styles.paletteHeader}>
                            <Text
                              style={[
                                styles.paletteName,
                                { color: theme.text },
                                isSelected && { color: pal.accent, fontWeight: '700' },
                              ]}
                            >
                              {pal.name}
                            </Text>
                            {isSelected && (
                              <Check size={14} color={pal.accent} strokeWidth={2.5} />
                            )}
                          </View>

                          <View style={styles.swatchRow}>
                            {pal.levels.map((color, idx) => (
                              <View
                                key={idx}
                                style={[
                                  styles.swatch,
                                  { backgroundColor: color },
                                ]}
                              />
                            ))}
                          </View>
                        </TouchableOpacity>
                      );
                    })}
                  </View>
                </View>
              </ScrollView>

              <View style={[styles.modalFooter, { borderTopColor: theme.borderSubtle }]}>
                <TouchableOpacity
                  onPress={onClose}
                  style={[styles.cancelBtn, { borderColor: theme.borderSubtle, backgroundColor: theme.surfaceHighlight }]}
                  activeOpacity={0.7}
                >
                  <Text style={[styles.cancelText, { color: theme.text }]}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={handleCreate}
                  style={[
                    styles.createBtn,
                    { backgroundColor: PALETTES[paletteId].accent },
                  ]}
                  activeOpacity={0.8}
                >
                  <Text style={styles.createText}>Create Tracker</Text>
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
    backgroundColor: 'rgba(0,0,0,0.7)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalBox: {
    width: '100%',
    maxWidth: 440,
    borderRadius: 16,
    borderWidth: 1,
    overflow: 'hidden',
    maxHeight: '85%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
  },
  modalSubtitle: {
    fontSize: 10,
    fontWeight: '800',
    fontFamily: fontStack,
    letterSpacing: 1,
    marginBottom: 2,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '800',
    fontFamily: fontStack,
  },
  closeBtn: {
    padding: 6,
    borderRadius: 8,
  },
  scrollBody: {
    padding: 20,
  },
  errorBox: {
    padding: 10,
    borderRadius: 8,
    borderWidth: 1,
    marginBottom: 16,
  },
  errorText: {
    fontSize: 12,
    fontFamily: fontStack,
    fontWeight: '500',
  },
  formGroup: {
    marginBottom: 20,
  },
  label: {
    fontSize: 11,
    fontWeight: '700',
    fontFamily: fontStack,
    letterSpacing: 0.5,
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 11,
    fontSize: 14,
    fontFamily: fontStack,
  },
  palettesList: {
    gap: 8,
  },
  paletteItem: {
    padding: 12,
    borderRadius: 10,
    borderWidth: 1,
  },
  paletteHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  paletteName: {
    fontSize: 13,
    fontWeight: '600',
    fontFamily: fontStack,
  },
  swatchRow: {
    flexDirection: 'row',
    gap: 6,
  },
  swatch: {
    flex: 1,
    height: 14,
    borderRadius: 3,
  },
  modalFooter: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 10,
    padding: 16,
    borderTopWidth: 1,
  },
  cancelBtn: {
    paddingHorizontal: 16,
    paddingVertical: 9,
    borderRadius: 8,
    borderWidth: 1,
  },
  cancelText: {
    fontSize: 13,
    fontWeight: '600',
    fontFamily: fontStack,
  },
  createBtn: {
    paddingHorizontal: 18,
    paddingVertical: 9,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  createText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '700',
    fontFamily: fontStack,
  },
});

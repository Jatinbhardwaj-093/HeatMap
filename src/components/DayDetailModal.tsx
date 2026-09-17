import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  View,
  Text,
  Modal,
  TouchableOpacity,
  TextInput,
  TouchableWithoutFeedback,
} from 'react-native';
import { HeatMapModel } from '../types/heatmap';
import { PALETTES } from '../constants/palettes';
import { X, Plus, Minus, Check, Trash2 } from 'lucide-react-native';

interface DayDetailModalProps {
  visible: boolean;
  dateKey: string | null;
  heatmap: HeatMapModel | null;
  onClose: () => void;
  onSave: (dateKey: string, value: number, notes?: string) => void;
  onDelete: (dateKey: string) => void;
}

export const DayDetailModal: React.FC<DayDetailModalProps> = ({
  visible,
  dateKey,
  heatmap,
  onClose,
  onSave,
  onDelete,
}) => {
  if (!visible || !dateKey || !heatmap) return null;

  const existingEntry = heatmap.entries[dateKey];
  const [val, setVal] = useState<number>(existingEntry ? existingEntry.value : 0);
  const [notes, setNotes] = useState<string>(existingEntry?.notes || '');

  useEffect(() => {
    if (heatmap && dateKey) {
      const entry = heatmap.entries[dateKey];
      setVal(entry ? entry.value : 0);
      setNotes(entry?.notes || '');
    }
  }, [dateKey, heatmap]);

  const palette = PALETTES[heatmap.paletteId] || PALETTES.emerald;

  const handleSave = () => {
    onSave(dateKey, val, notes.trim() || undefined);
    onClose();
  };

  const handleClear = () => {
    onDelete(dateKey);
    onClose();
  };

  const handleToggle = () => {
    setVal((prev) => (prev > 0 ? 0 : heatmap.targetValue || 1));
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
                  <Text style={styles.modalSubtitle}>{heatmap.title.toUpperCase()}</Text>
                  <Text style={styles.modalDate}>{dateKey}</Text>
                </View>
                <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
                  <X size={16} color="#8B949E" />
                </TouchableOpacity>
              </View>

              {/* Body */}
              <View style={styles.body}>
                {heatmap.unitType === 'boolean' ? (
                  <View style={styles.booleanRow}>
                    <TouchableOpacity
                      activeOpacity={0.8}
                      onPress={handleToggle}
                      style={[
                        styles.toggleButton,
                        val > 0
                          ? { backgroundColor: palette.levels[3], borderColor: palette.accent }
                          : styles.toggleUnchecked,
                      ]}
                    >
                      <Check
                        size={18}
                        color={val > 0 ? '#FFFFFF' : '#484F58'}
                        strokeWidth={2.5}
                      />
                      <Text
                        style={[
                          styles.toggleText,
                          { color: val > 0 ? '#FFFFFF' : '#8B949E' },
                        ]}
                      >
                        {val > 0 ? 'COMPLETED' : 'MARK AS COMPLETED'}
                      </Text>
                    </TouchableOpacity>
                  </View>
                ) : (
                  <View style={styles.counterSection}>
                    <Text style={styles.counterLabel}>
                      VALUE ({heatmap.unitLabel || 'units'}) | TARGET: {heatmap.targetValue}
                    </Text>
                    <View style={styles.counterRow}>
                      <TouchableOpacity
                        style={styles.stepBtn}
                        onPress={() => setVal((v) => Math.max(0, v - 1))}
                      >
                        <Minus size={16} color="#F0F6FC" />
                      </TouchableOpacity>

                      <TextInput
                        style={styles.numberInput}
                        keyboardType="numeric"
                        value={String(val)}
                        onChangeText={(txt) => {
                          const parsed = parseInt(txt, 10);
                          setVal(isNaN(parsed) ? 0 : parsed);
                        }}
                      />

                      <TouchableOpacity
                        style={styles.stepBtn}
                        onPress={() => setVal((v) => v + 1)}
                      >
                        <Plus size={16} color="#F0F6FC" />
                      </TouchableOpacity>
                    </View>
                  </View>
                )}

                {/* Notes input */}
                <View style={styles.notesSection}>
                  <Text style={styles.notesLabel}>LOG NOTES</Text>
                  <TextInput
                    style={styles.notesInput}
                    placeholder="Brief detail, weight, or milestone..."
                    placeholderTextColor="#484F58"
                    value={notes}
                    onChangeText={setNotes}
                    multiline
                  />
                </View>
              </View>

              {/* Footer Actions */}
              <View style={styles.modalFooter}>
                {existingEntry && existingEntry.value > 0 ? (
                  <TouchableOpacity
                    onPress={handleClear}
                    style={styles.clearButton}
                    activeOpacity={0.7}
                  >
                    <Trash2 size={14} color="#F85149" />
                    <Text style={styles.clearText}>Clear</Text>
                  </TouchableOpacity>
                ) : (
                  <View />
                )}

                <View style={styles.rightButtons}>
                  <TouchableOpacity
                    onPress={onClose}
                    style={styles.cancelButton}
                    activeOpacity={0.7}
                  >
                    <Text style={styles.cancelText}>Cancel</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    onPress={handleSave}
                    style={[styles.saveButton, { backgroundColor: palette.accent }]}
                    activeOpacity={0.7}
                  >
                    <Text style={styles.saveText}>Save Entry</Text>
                  </TouchableOpacity>
                </View>
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
    backgroundColor: 'rgba(0,0,0,0.75)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalBox: {
    width: '100%',
    maxWidth: 420,
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
  modalSubtitle: {
    color: '#8B949E',
    fontSize: 10,
    fontWeight: '700',
    fontFamily: 'Courier',
    letterSpacing: 0.5,
  },
  modalDate: {
    color: '#F0F6FC',
    fontSize: 16,
    fontWeight: '600',
    marginTop: 2,
    fontFamily: 'Courier',
  },
  closeBtn: {
    padding: 4,
  },
  body: {
    gap: 16,
    marginBottom: 20,
  },
  booleanRow: {
    alignItems: 'center',
  },
  toggleButton: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 12,
    borderRadius: 3,
    borderWidth: 1,
  },
  toggleUnchecked: {
    backgroundColor: '#161B22',
    borderColor: '#30363D',
  },
  toggleText: {
    fontSize: 12,
    fontWeight: '700',
    fontFamily: 'Courier',
    letterSpacing: 0.5,
  },
  counterSection: {
    gap: 6,
  },
  counterLabel: {
    color: '#8B949E',
    fontSize: 10,
    fontWeight: '600',
    fontFamily: 'Courier',
  },
  counterRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  stepBtn: {
    backgroundColor: '#161B22',
    borderColor: '#30363D',
    borderWidth: 1,
    borderRadius: 3,
    padding: 10,
  },
  numberInput: {
    flex: 1,
    backgroundColor: '#161B22',
    borderColor: '#30363D',
    borderWidth: 1,
    borderRadius: 3,
    color: '#F0F6FC',
    fontSize: 16,
    fontWeight: '700',
    fontFamily: 'Courier',
    textAlign: 'center',
    paddingVertical: 8,
  },
  notesSection: {
    gap: 6,
  },
  notesLabel: {
    color: '#8B949E',
    fontSize: 10,
    fontWeight: '600',
    fontFamily: 'Courier',
  },
  notesInput: {
    backgroundColor: '#161B22',
    borderColor: '#30363D',
    borderWidth: 1,
    borderRadius: 3,
    color: '#F0F6FC',
    fontSize: 13,
    padding: 10,
    minHeight: 60,
    textAlignVertical: 'top',
  },
  modalFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: '#21262D',
    paddingTop: 14,
  },
  clearButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingVertical: 6,
    paddingHorizontal: 8,
  },
  clearText: {
    color: '#F85149',
    fontSize: 12,
    fontFamily: 'Courier',
  },
  rightButtons: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  cancelButton: {
    paddingVertical: 7,
    paddingHorizontal: 12,
    borderRadius: 3,
    borderWidth: 1,
    borderColor: '#30363D',
    backgroundColor: '#161B22',
  },
  cancelText: {
    color: '#8B949E',
    fontSize: 12,
    fontWeight: '600',
    fontFamily: 'Courier',
  },
  saveButton: {
    paddingVertical: 7,
    paddingHorizontal: 14,
    borderRadius: 3,
  },
  saveText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700',
    fontFamily: 'Courier',
  },
});

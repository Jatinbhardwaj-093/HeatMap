import React, { useState } from 'react';
import {
  StyleSheet,
  View,
  Text,
  Modal,
  TouchableOpacity,
  TextInput,
  TouchableWithoutFeedback,
  ScrollView,
  Platform,
} from 'react-native';
import { HeatMapModel, PaletteId } from '../types/heatmap';
import { PALETTES } from '../constants/palettes';
import { X, Check } from 'lucide-react-native';

interface CreateHeatmapModalProps {
  visible: boolean;
  onClose: () => void;
  onCreate: (newMap: Omit<HeatMapModel, 'id' | 'createdAt' | 'entries'>) => void;
}

const CATEGORY_PRESETS = ['Fitness', 'Dieting', 'Productivity', 'Health', 'Habit'];

export const CreateHeatmapModal: React.FC<CreateHeatmapModalProps> = ({
  visible,
  onClose,
  onCreate,
}) => {
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState('Fitness');
  const [customCategory, setCustomCategory] = useState('');
  const [description, setDescription] = useState('');
  const [paletteId, setPaletteId] = useState<PaletteId>('emerald');
  const [errorMsg, setErrorMsg] = useState('');

  if (!visible) return null;

  const handleCreate = () => {
    if (!title.trim()) {
      setErrorMsg('Map name is required.');
      return;
    }

    const finalCategory = customCategory.trim() || category;

    onCreate({
      title: title.trim(),
      category: finalCategory,
      description: description.trim() || undefined,
      paletteId,
    });

    setTitle('');
    setDescription('');
    setPaletteId('emerald');
    setErrorMsg('');
    onClose();
  };

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <TouchableWithoutFeedback onPress={onClose}>
        <View style={styles.overlay}>
          <TouchableWithoutFeedback>
            <View style={styles.modalBox}>
              <View style={styles.modalHeader}>
                <View>
                  <Text style={styles.modalSubtitle}>NEW TRACKER</Text>
                  <Text style={styles.modalTitle}>Create Habit Tracker</Text>
                </View>
                <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
                  <X size={16} color="#8B949E" />
                </TouchableOpacity>
              </View>

              <ScrollView style={styles.scrollBody} showsVerticalScrollIndicator={false}>
                {errorMsg ? (
                  <View style={styles.errorBox}>
                    <Text style={styles.errorText}>{errorMsg}</Text>
                  </View>
                ) : null}

                <View style={styles.formGroup}>
                  <Text style={styles.label}>HABIT NAME *</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="e.g. Strength Training, Intermittent Fasting..."
                    placeholderTextColor="#484F58"
                    value={title}
                    onChangeText={(t) => {
                      setTitle(t);
                      if (errorMsg) setErrorMsg('');
                    }}
                    autoFocus
                  />
                </View>

                <View style={styles.formGroup}>
                  <Text style={styles.label}>CATEGORY</Text>
                  <View style={styles.presetRow}>
                    {CATEGORY_PRESETS.map((cat) => (
                      <TouchableOpacity
                        key={cat}
                        style={[
                          styles.presetBtn,
                          category === cat && !customCategory && styles.presetBtnActive,
                        ]}
                        onPress={() => {
                          setCategory(cat);
                          setCustomCategory('');
                        }}
                      >
                        <Text
                          style={[
                            styles.presetText,
                            category === cat && !customCategory && styles.presetTextActive,
                          ]}
                        >
                          {cat}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>

                <View style={styles.formGroup}>
                  <Text style={styles.label}>COLOR THEME</Text>
                  <View style={styles.palettesList}>
                    {(Object.keys(PALETTES) as PaletteId[]).map((pId) => {
                      const pal = PALETTES[pId];
                      const isSelected = paletteId === pId;
                      return (
                        <TouchableOpacity
                          key={pId}
                          style={[
                            styles.paletteItem,
                            isSelected && { borderColor: pal.accent },
                          ]}
                          onPress={() => setPaletteId(pId)}
                        >
                          <View style={styles.paletteHeader}>
                            <Text
                              style={[
                                styles.paletteName,
                                isSelected && { color: pal.accent },
                              ]}
                            >
                              {pal.name}
                            </Text>
                            {isSelected && <Check size={13} color={pal.accent} />}
                          </View>
                          <View style={styles.paletteSwatches}>
                            {pal.levels.map((c, i) => (
                              <View
                                key={`${pId}-${i}`}
                                style={[styles.swatch, { backgroundColor: c }]}
                              />
                            ))}
                          </View>
                        </TouchableOpacity>
                      );
                    })}
                  </View>
                </View>

                <View style={styles.formGroup}>
                  <Text style={styles.label}>NOTES / MOTIVATION (OPTIONAL)</Text>
                  <TextInput
                    style={styles.input}
                    value={description}
                    onChangeText={setDescription}
                    placeholder="Brief description or rules for this map..."
                    placeholderTextColor="#484F58"
                  />
                </View>
              </ScrollView>

              <View style={styles.modalFooter}>
                <TouchableOpacity
                  onPress={onClose}
                  style={styles.cancelBtn}
                  activeOpacity={0.7}
                >
                  <Text style={styles.cancelText}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={handleCreate}
                  style={[
                    styles.createBtn,
                    { backgroundColor: PALETTES[paletteId].accent },
                  ]}
                  activeOpacity={0.7}
                >
                  <Text style={styles.createText}>Create Map</Text>
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
    backgroundColor: 'rgba(0,0,0,0.8)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalBox: {
    width: '100%',
    maxWidth: 520,
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
  modalSubtitle: {
    color: '#8B949E',
    fontSize: 10,
    fontWeight: '700',
    fontFamily: Platform.OS === 'ios' ? 'System' : 'sans-serif',
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
  scrollBody: {
    marginBottom: 16,
  },
  errorBox: {
    backgroundColor: '#381014',
    borderColor: '#7F1D1D',
    borderWidth: 1,
    borderRadius: 3,
    padding: 8,
    marginBottom: 12,
  },
  errorText: {
    color: '#F85149',
    fontSize: 11,
    fontFamily: Platform.OS === 'ios' ? 'System' : 'sans-serif',
  },
  formGroup: {
    marginBottom: 14,
    gap: 6,
  },
  label: {
    color: '#8B949E',
    fontSize: 10,
    fontWeight: '600',
    fontFamily: Platform.OS === 'ios' ? 'System' : 'sans-serif',
    letterSpacing: 0.5,
  },
  input: {
    backgroundColor: '#161B22',
    borderColor: '#30363D',
    borderWidth: 1,
    borderRadius: 3,
    color: '#F0F6FC',
    fontSize: 13,
    paddingHorizontal: 12,
    paddingVertical: 9,
    fontFamily: Platform.OS === 'ios' ? 'System' : 'sans-serif',
  },
  presetRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  presetBtn: {
    backgroundColor: '#161B22',
    borderColor: '#30363D',
    borderWidth: 1,
    borderRadius: 3,
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  presetBtnActive: {
    backgroundColor: '#21262D',
    borderColor: '#58A6FF',
  },
  presetText: {
    color: '#8B949E',
    fontSize: 11,
    fontFamily: Platform.OS === 'ios' ? 'System' : 'sans-serif',
  },
  presetTextActive: {
    color: '#F0F6FC',
    fontWeight: '600',
  },
  palettesList: {
    gap: 6,
  },
  paletteItem: {
    backgroundColor: '#161B22',
    borderColor: '#30363D',
    borderWidth: 1,
    borderRadius: 3,
    padding: 8,
  },
  paletteHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  paletteName: {
    color: '#8B949E',
    fontSize: 11,
    fontFamily: Platform.OS === 'ios' ? 'System' : 'sans-serif',
    fontWeight: '600',
  },
  paletteSwatches: {
    flexDirection: 'row',
    gap: 4,
  },
  swatch: {
    flex: 1,
    height: 12,
    borderRadius: 2,
  },
  modalFooter: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 10,
    borderTopWidth: 1,
    borderTopColor: '#21262D',
    paddingTop: 12,
  },
  cancelBtn: {
    paddingVertical: 8,
    paddingHorizontal: 14,
    backgroundColor: '#161B22',
    borderColor: '#30363D',
    borderWidth: 1,
    borderRadius: 3,
  },
  cancelText: {
    color: '#8B949E',
    fontSize: 12,
    fontWeight: '600',
    fontFamily: Platform.OS === 'ios' ? 'System' : 'sans-serif',
  },
  createBtn: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 3,
  },
  createText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700',
    fontFamily: Platform.OS === 'ios' ? 'System' : 'sans-serif',
  },
});

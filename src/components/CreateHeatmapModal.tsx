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
} from 'react-native';
import { HeatMapModel, PaletteId, UnitType } from '../types/heatmap';
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
  const [unitType, setUnitType] = useState<UnitType>('boolean');
  const [unitLabel, setUnitLabel] = useState('');
  const [targetValue, setTargetValue] = useState('1');
  const [paletteId, setPaletteId] = useState<PaletteId>('emerald');
  const [errorMsg, setErrorMsg] = useState('');

  if (!visible) return null;

  const handleCreate = () => {
    if (!title.trim()) {
      setErrorMsg('Map name is required.');
      return;
    }

    const finalCategory = customCategory.trim() || category;
    const target = parseInt(targetValue, 10) || 1;

    onCreate({
      title: title.trim(),
      category: finalCategory,
      description: description.trim() || undefined,
      unitType,
      unitLabel: unitType === 'boolean' ? undefined : unitLabel.trim() || undefined,
      targetValue: target,
      paletteId,
    });

    // Reset form
    setTitle('');
    setDescription('');
    setUnitType('boolean');
    setUnitLabel('');
    setTargetValue('1');
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
              {/* Header */}
              <View style={styles.modalHeader}>
                <View>
                  <Text style={styles.modalSubtitle}>NEW TRACKER</Text>
                  <Text style={styles.modalTitle}>Create HeatMap</Text>
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

                {/* Name */}
                <View style={styles.formGroup}>
                  <Text style={styles.label}>NAME OF HEATMAP *</Text>
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

                {/* Category Presets */}
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

                {/* Tracking Unit Type */}
                <View style={styles.formGroup}>
                  <Text style={styles.label}>TRACKING TYPE</Text>
                  <View style={styles.typeRow}>
                    <TouchableOpacity
                      style={[
                        styles.typeBtn,
                        unitType === 'boolean' && styles.typeBtnActive,
                      ]}
                      onPress={() => {
                        setUnitType('boolean');
                        setTargetValue('1');
                      }}
                    >
                      <Text
                        style={[
                          styles.typeTitle,
                          unitType === 'boolean' && styles.typeTitleActive,
                        ]}
                      >
                        CHECK-IN
                      </Text>
                      <Text style={styles.typeSubtitle}>Done or Not Done</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                      style={[
                        styles.typeBtn,
                        unitType === 'count' && styles.typeBtnActive,
                      ]}
                      onPress={() => {
                        setUnitType('count');
                        if (targetValue === '1') setTargetValue('10');
                      }}
                    >
                      <Text
                        style={[
                          styles.typeTitle,
                          unitType === 'count' && styles.typeTitleActive,
                        ]}
                      >
                        QUANTITY
                      </Text>
                      <Text style={styles.typeSubtitle}>Reps, steps, glasses</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                      style={[
                        styles.typeBtn,
                        unitType === 'duration' && styles.typeBtnActive,
                      ]}
                      onPress={() => {
                        setUnitType('duration');
                        if (targetValue === '1') setTargetValue('45');
                        if (!unitLabel) setUnitLabel('mins');
                      }}
                    >
                      <Text
                        style={[
                          styles.typeTitle,
                          unitType === 'duration' && styles.typeTitleActive,
                        ]}
                      >
                        DURATION
                      </Text>
                      <Text style={styles.typeSubtitle}>Minutes, hours</Text>
                    </TouchableOpacity>
                  </View>
                </View>

                {/* Unit label & Target if not boolean */}
                {unitType !== 'boolean' && (
                  <View style={styles.formRow}>
                    <View style={[styles.formGroup, { flex: 1 }]}>
                      <Text style={styles.label}>DAILY TARGET</Text>
                      <TextInput
                        style={styles.input}
                        keyboardType="numeric"
                        value={targetValue}
                        onChangeText={setTargetValue}
                        placeholder="e.g. 60"
                        placeholderTextColor="#484F58"
                      />
                    </View>
                    <View style={[styles.formGroup, { flex: 1 }]}>
                      <Text style={styles.label}>UNIT LABEL</Text>
                      <TextInput
                        style={styles.input}
                        value={unitLabel}
                        onChangeText={setUnitLabel}
                        placeholder={unitType === 'duration' ? 'mins' : 'reps'}
                        placeholderTextColor="#484F58"
                      />
                    </View>
                  </View>
                )}

                {/* Color Palette Theme */}
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

                {/* Description */}
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

              {/* Footer */}
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
    fontFamily: 'Courier',
  },
  formGroup: {
    marginBottom: 14,
    gap: 6,
  },
  formRow: {
    flexDirection: 'row',
    gap: 10,
  },
  label: {
    color: '#8B949E',
    fontSize: 10,
    fontWeight: '600',
    fontFamily: 'Courier',
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
    fontFamily: 'Courier',
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
    fontFamily: 'Courier',
  },
  presetTextActive: {
    color: '#F0F6FC',
    fontWeight: '600',
  },
  typeRow: {
    flexDirection: 'row',
    gap: 8,
  },
  typeBtn: {
    flex: 1,
    backgroundColor: '#161B22',
    borderColor: '#30363D',
    borderWidth: 1,
    borderRadius: 3,
    padding: 8,
  },
  typeBtnActive: {
    backgroundColor: '#21262D',
    borderColor: '#58A6FF',
  },
  typeTitle: {
    color: '#8B949E',
    fontSize: 10,
    fontWeight: '700',
    fontFamily: 'Courier',
    marginBottom: 2,
  },
  typeTitleActive: {
    color: '#F0F6FC',
  },
  typeSubtitle: {
    color: '#6E7681',
    fontSize: 9,
    fontFamily: 'Courier',
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
    fontFamily: 'Courier',
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
    fontFamily: 'Courier',
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
    fontFamily: 'Courier',
  },
});

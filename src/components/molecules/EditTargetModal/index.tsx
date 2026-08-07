import React, { useState } from 'react';
import {
  Modal,
  View,
  StyleSheet,
  TouchableOpacity,
  Pressable,
  TextInput,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/hooks/useTheme';
import { AppText } from '@/components/atoms/AppText';
import { AppButton } from '@/components/atoms/AppButton';
import { Radius, Spacing, Shadow } from '@/constants/theme';

type EditTargetModalProps = {
  visible: boolean;
  title: string;
  unit: string;
  currentTarget: number;
  presets?: number[];
  onClose: () => void;
  onSave: (newTarget: number) => void;
};

export function EditTargetModal({
  visible,
  title,
  unit,
  currentTarget,
  presets = [4, 6, 8, 10, 15, 20, 30, 45],
  onClose,
  onSave,
}: EditTargetModalProps) {
  const { colors, isDark } = useTheme();
  const [targetVal, setTargetVal] = useState<number>(currentTarget || 1);

  React.useEffect(() => {
    setTargetVal(currentTarget || 1);
  }, [currentTarget, visible]);

  if (!visible) return null;

  const handleIncrement = () => setTargetVal((prev) => prev + 1);
  const handleDecrement = () => setTargetVal((prev) => Math.max(1, prev - 1));

  const handleSave = () => {
    if (targetVal > 0) {
      onSave(targetVal);
      onClose();
    }
  };

  return (
    <Modal
      visible={visible}
      animationType="fade"
      transparent
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <Pressable style={styles.backdrop} onPress={onClose} />

        <View
          style={[
            styles.container,
            { backgroundColor: colors.surfaceElevated, borderColor: colors.border },
          ]}
        >
          {/* Header */}
          <View style={styles.header}>
            <View style={styles.headerLeft}>
              <View style={[styles.pencilBadge, { backgroundColor: isDark ? 'rgba(59,130,246,0.2)' : '#E0F2FE' }]}>
                <Ionicons name="create" size={20} color={colors.primary} />
              </View>
              <View>
                <AppText variant="h3">Meta de {title}</AppText>
                <AppText variant="caption" color="textSecondary">
                  Ajustar a quantidade total diária
                </AppText>
              </View>
            </View>
            <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
              <Ionicons name="close" size={22} color={colors.icon} />
            </TouchableOpacity>
          </View>

          {/* Big Stepper Numeric Display Card */}
          <View style={[styles.stepperCard, { backgroundColor: isDark ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.02)', borderColor: colors.border }]}>
            <TouchableOpacity
              style={[
                styles.stepperBtn,
                { backgroundColor: colors.background, borderColor: colors.border },
              ]}
              onPress={handleDecrement}
              activeOpacity={0.7}
            >
              <Ionicons name="remove" size={22} color={colors.text} />
            </TouchableOpacity>

            <View style={styles.numericValueWrapper}>
              <TextInput
                value={String(targetVal)}
                onChangeText={(val) => setTargetVal(Number(val.replace(/[^0-9]/g, '')) || 1)}
                keyboardType="numeric"
                style={[styles.bigNumericInput, { color: colors.primary }]}
                selectTextOnFocus
              />
              <AppText variant="caption" color="textSecondary" style={{ fontWeight: '600' }}>
                {unit} por dia
              </AppText>
            </View>

            <TouchableOpacity
              style={[styles.stepperBtn, { backgroundColor: colors.primary, borderColor: colors.primary }]}
              onPress={handleIncrement}
              activeOpacity={0.7}
            >
              <Ionicons name="add" size={22} color="#FFFFFF" />
            </TouchableOpacity>
          </View>

          {/* Quick Preset Chips */}
          <AppText variant="label" color="textSecondary" style={{ marginBottom: Spacing.xs }}>
            Metas Sugeridas:
          </AppText>
          <View style={styles.presetsGrid}>
            {presets.map((preset) => {
              const isSelected = targetVal === preset;
              return (
                <TouchableOpacity
                  key={preset}
                  style={[
                    styles.presetChip,
                    {
                      backgroundColor: isSelected ? colors.primary : colors.background,
                      borderColor: isSelected ? colors.primary : colors.border,
                    },
                  ]}
                  onPress={() => setTargetVal(preset)}
                  activeOpacity={0.7}
                >
                  <AppText
                    style={{
                      color: isSelected ? '#FFFFFF' : colors.text,
                      fontWeight: '700',
                      fontSize: 13,
                    }}
                  >
                    {preset} {unit}
                  </AppText>
                </TouchableOpacity>
              );
            })}
          </View>

          {/* Save & Cancel Buttons */}
          <View style={styles.buttonRow}>
            <AppButton label="Cancelar" variant="ghost" onPress={onClose} />
            <AppButton label="Salvar Meta" variant="primary" onPress={handleSave} />
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.65)',
    padding: Spacing.base,
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
  },
  container: {
    width: '100%',
    maxWidth: 360,
    borderRadius: Radius['2xl'],
    padding: Spacing.xl,
    borderWidth: StyleSheet.hairlineWidth,
    ...Shadow.lg,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: Spacing.md,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  pencilBadge: {
    width: 40,
    height: 40,
    borderRadius: Radius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  closeBtn: {
    padding: Spacing.xs,
  },
  stepperCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderRadius: Radius.xl,
    borderWidth: 1,
    padding: Spacing.md,
    marginBottom: Spacing.md,
  },
  stepperBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    ...Shadow.sm,
  },
  numericValueWrapper: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  bigNumericInput: {
    fontSize: 34,
    fontWeight: '800',
    textAlign: 'center',
    minWidth: 80,
    paddingVertical: 2,
  },
  presetsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: Spacing.lg,
  },
  presetChip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: Radius.md,
    borderWidth: 1,
  },
  buttonRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: Spacing.sm,
  },
});

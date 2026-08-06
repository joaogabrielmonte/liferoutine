import React, { useState } from 'react';
import {
  Modal,
  View,
  ScrollView,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';

import { useTheme } from '@/hooks/useTheme';
import { useHabitsStore } from '@/stores/useHabitsStore';
import { AppText } from '@/components/atoms/AppText';
import { AppButton } from '@/components/atoms/AppButton';
import { Spacing, Radius } from '@/constants/theme';
import { HABIT_CATEGORIES, type HabitCategory, type Habit } from '@/types/habit';

const habitSchema = z.object({
  title: z.string().min(2, 'O titulo deve ter pelo menos 2 caracteres'),
  description: z.string().optional(),
  category: z.string(),
  color: z.string(),
  icon: z.string(),
  unit: z.string().optional(),
  targetCount: z.number().min(1, 'A meta deve ser no minimo 1'),
});

type HabitFormData = z.infer<typeof habitSchema>;

const AVAILABLE_COLORS = [
  '#3B82F6', // Blue
  '#22C55E', // Green
  '#EF4444', // Red
  '#F59E0B', // Amber
  '#8B5CF6', // Purple
  '#06B6D4', // Cyan
  '#EC4899', // Pink
  '#64748B', // Slate
];

const AVAILABLE_ICONS = [
  'water-outline',
  'dumbbell',
  'brain',
  'book-open-outline',
  'target',
  'heart-outline',
  'palette-outline',
  'account-group-outline',
  'trending-up',
  'star-outline',
  'run',
  'meditation',
  'food-apple-outline',
  'sleep',
  'cash-multiple',
  'laptop',
];

const DAYS_OF_WEEK = [
  { label: 'Dom', value: 0 },
  { label: 'Seg', value: 1 },
  { label: 'Ter', value: 2 },
  { label: 'Qua', value: 3 },
  { label: 'Qui', value: 4 },
  { label: 'Sex', value: 5 },
  { label: 'Sab', value: 6 },
];

type CreateHabitModalProps = {
  visible: boolean;
  onClose: () => void;
};

export function CreateHabitModal({ visible, onClose }: CreateHabitModalProps) {
  const { colors } = useTheme();
  const { addHabit } = useHabitsStore();

  const [selectedDays, setSelectedDays] = useState<number[]>([0, 1, 2, 3, 4, 5, 6]);

  const {
    control,
    handleSubmit,
    reset,
    setValue,
    watch,
    formState: { errors },
  } = useForm<HabitFormData>({
    resolver: zodResolver(habitSchema),
    defaultValues: {
      title: '',
      description: '',
      category: 'health',
      color: '#3B82F6',
      icon: 'water-outline',
      unit: 'vezes',
      targetCount: 1,
    },
  });

  const selectedCategory = watch('category') as HabitCategory;
  const selectedColor = watch('color');
  const selectedIcon = watch('icon');

  const toggleDay = (day: number) => {
    if (selectedDays.includes(day)) {
      if (selectedDays.length > 1) {
        setSelectedDays(selectedDays.filter((d) => d !== day));
      }
    } else {
      setSelectedDays([...selectedDays, day].sort());
    }
  };

  const onSubmit = async (data: HabitFormData) => {
    const newHabit: Habit = {
      id: Date.now().toString(),
      title: data.title,
      description: data.description || undefined,
      category: data.category as HabitCategory,
      color: data.color,
      icon: data.icon,
      unit: data.unit || 'vezes',
      frequency: 'daily',
      targetDays: selectedDays,
      targetCount: Number(data.targetCount) || 1,
      reminderEnabled: false,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      streak: 0,
      bestStreak: 0,
    };

    await addHabit(newHabit);
    reset();
    onClose();
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent
      onRequestClose={onClose}
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.overlay}
      >
        <View
          style={[
            styles.container,
            { backgroundColor: colors.surfaceElevated, borderColor: colors.border },
          ]}
        >
          {/* Header */}
          <View style={styles.header}>
            <AppText variant="h3">Novo Habito</AppText>
            <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
              <Ionicons name="close" size={24} color={colors.icon} />
            </TouchableOpacity>
          </View>

          <ScrollView
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.scrollContent}
          >
            {/* Title Input */}
            <AppText variant="label" color="textSecondary" style={styles.fieldLabel}>
              Nome do Habito *
            </AppText>
            <Controller
              control={control}
              name="title"
              render={({ field: { onChange, value } }) => (
                <TextInput
                  style={[
                    styles.input,
                    {
                      backgroundColor: colors.background,
                      color: colors.text,
                      borderColor: errors.title ? colors.danger : colors.border,
                    },
                  ]}
                  placeholder="Ex: Beber agua"
                  placeholderTextColor={colors.textTertiary}
                  value={value}
                  onChangeText={onChange}
                />
              )}
            />
            {errors.title && (
              <AppText variant="caption" style={{ color: colors.danger, marginTop: 4 }}>
                {errors.title.message}
              </AppText>
            )}

            {/* Description Input */}
            <AppText variant="label" color="textSecondary" style={styles.fieldLabel}>
              Descricao (opcional)
            </AppText>
            <Controller
              control={control}
              name="description"
              render={({ field: { onChange, value } }) => (
                <TextInput
                  style={[
                    styles.input,
                    {
                      backgroundColor: colors.background,
                      color: colors.text,
                      borderColor: colors.border,
                    },
                  ]}
                  placeholder="Ex: Espalhado ao longo do dia"
                  placeholderTextColor={colors.textTertiary}
                  value={value}
                  onChangeText={onChange}
                />
              )}
            />

            {/* Meta Numérica & Unidade */}
            <View style={styles.rowTwoFields}>
              <View style={{ flex: 1 }}>
                <AppText variant="label" color="textSecondary" style={styles.fieldLabel}>
                  Meta por dia *
                </AppText>
                <Controller
                  control={control}
                  name="targetCount"
                  render={({ field: { onChange, value } }) => (
                    <TextInput
                      style={[
                        styles.input,
                        {
                          backgroundColor: colors.background,
                          color: colors.text,
                          borderColor: errors.targetCount ? colors.danger : colors.border,
                        },
                      ]}
                      keyboardType="numeric"
                      placeholder="1"
                      placeholderTextColor={colors.textTertiary}
                      value={String(value ?? 1)}
                      onChangeText={(val) => onChange(Number(val) || 1)}
                    />
                  )}
                />
              </View>

              <View style={{ flex: 1, marginLeft: Spacing.sm }}>
                <AppText variant="label" color="textSecondary" style={styles.fieldLabel}>
                  Unidade do Hábito
                </AppText>
                <Controller
                  control={control}
                  name="unit"
                  render={({ field: { onChange, value } }) => (
                    <TextInput
                      style={[
                        styles.input,
                        {
                          backgroundColor: colors.background,
                          color: colors.text,
                          borderColor: colors.border,
                        },
                      ]}
                      placeholder="copos, min, páginas..."
                      placeholderTextColor={colors.textTertiary}
                      value={value}
                      onChangeText={onChange}
                    />
                  )}
                />
              </View>
            </View>

            {/* Quick Unit Presets Chips */}
            <AppText variant="caption" color="textSecondary" style={{ marginTop: 6, marginBottom: 4 }}>
              Sugestões de Unidade:
            </AppText>
            <View style={styles.unitPresetsRow}>
              {['copos', 'min', 'páginas', 'vezes', 'horas', 'km', 'passos'].map((u) => (
                <TouchableOpacity
                  key={u}
                  style={[
                    styles.unitChip,
                    {
                      backgroundColor: watch('unit') === u ? colors.primary : colors.background,
                      borderColor: watch('unit') === u ? colors.primary : colors.border,
                    },
                  ]}
                  onPress={() => setValue('unit', u)}
                >
                  <AppText
                    style={{
                      fontSize: 11,
                      fontWeight: '700',
                      color: watch('unit') === u ? '#FFF' : colors.textSecondary,
                    }}
                  >
                    {u}
                  </AppText>
                </TouchableOpacity>
              ))}
            </View>

            {/* Category Selector */}
            <AppText variant="label" color="textSecondary" style={styles.fieldLabel}>
              Categoria
            </AppText>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.horizontalScroll}>
              {(Object.keys(HABIT_CATEGORIES) as HabitCategory[]).map((catKey) => {
                const cat = HABIT_CATEGORIES[catKey];
                const isSelected = selectedCategory === catKey;
                return (
                  <TouchableOpacity
                    key={catKey}
                    onPress={() => {
                      setValue('category', catKey);
                      if (catKey === 'health') {
                        setValue('unit', 'copos');
                        setValue('targetCount', 8);
                      } else if (catKey === 'fitness') {
                        setValue('unit', 'min');
                        setValue('targetCount', 30);
                      } else if (catKey === 'mindfulness') {
                        setValue('unit', 'min');
                        setValue('targetCount', 15);
                      } else if (catKey === 'learning') {
                        setValue('unit', 'páginas');
                        setValue('targetCount', 20);
                      } else if (catKey === 'productivity') {
                        setValue('unit', 'vezes');
                        setValue('targetCount', 1);
                      }
                    }}
                    style={[
                      styles.chip,
                      {
                        backgroundColor: isSelected ? colors.primary : colors.background,
                        borderColor: isSelected ? colors.primary : colors.border,
                      },
                    ]}
                  >
                    <MaterialCommunityIcons
                      name={cat.icon as any}
                      size={16}
                      color={isSelected ? '#FFFFFF' : colors.textSecondary}
                    />
                    <AppText
                      style={{
                        marginLeft: 6,
                        fontSize: 13,
                        fontWeight: '600',
                        color: isSelected ? '#FFFFFF' : colors.textSecondary,
                      }}
                    >
                      {cat.label}
                    </AppText>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>

            {/* Color Selector */}
            <AppText variant="label" color="textSecondary" style={styles.fieldLabel}>
              Cor
            </AppText>
            <View style={styles.colorRow}>
              {AVAILABLE_COLORS.map((c) => {
                const isSelected = selectedColor === c;
                return (
                  <TouchableOpacity
                    key={c}
                    onPress={() => setValue('color', c)}
                    style={[
                      styles.colorDot,
                      { backgroundColor: c },
                      isSelected && styles.colorDotSelected,
                    ]}
                  >
                    {isSelected && <Ionicons name="checkmark" size={16} color="#FFF" />}
                  </TouchableOpacity>
                );
              })}
            </View>

            {/* Icon Selector */}
            <AppText variant="label" color="textSecondary" style={styles.fieldLabel}>
              Icone
            </AppText>
            <View style={styles.iconGrid}>
              {AVAILABLE_ICONS.map((iconName) => {
                const isSelected = selectedIcon === iconName;
                return (
                  <TouchableOpacity
                    key={iconName}
                    onPress={() => setValue('icon', iconName)}
                    style={[
                      styles.iconBox,
                      {
                        backgroundColor: isSelected
                          ? `${selectedColor}22`
                          : colors.background,
                        borderColor: isSelected ? selectedColor : colors.border,
                      },
                    ]}
                  >
                    <MaterialCommunityIcons
                      name={iconName as any}
                      size={24}
                      color={isSelected ? selectedColor : colors.icon}
                    />
                  </TouchableOpacity>
                );
              })}
            </View>

            {/* Target Days Selector */}
            <AppText variant="label" color="textSecondary" style={styles.fieldLabel}>
              Dias da Semana
            </AppText>
            <View style={styles.daysRow}>
              {DAYS_OF_WEEK.map((d) => {
                const isSelected = selectedDays.includes(d.value);
                return (
                  <TouchableOpacity
                    key={d.value}
                    onPress={() => toggleDay(d.value)}
                    style={[
                      styles.dayChip,
                      {
                        backgroundColor: isSelected ? colors.primary : colors.background,
                        borderColor: isSelected ? colors.primary : colors.border,
                      },
                    ]}
                  >
                    <AppText
                      style={{
                        fontSize: 12,
                        fontWeight: '700',
                        color: isSelected ? '#FFFFFF' : colors.textSecondary,
                      }}
                    >
                      {d.label}
                    </AppText>
                  </TouchableOpacity>
                );
              })}
            </View>

            {/* Submit Button */}
            <View style={{ marginTop: Spacing.xl }}>
              <AppButton
                label="Criar Habito"
                onPress={handleSubmit(onSubmit)}
                variant="primary"
                size="lg"
                fullWidth
              />
            </View>
          </ScrollView>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    justifyContent: 'flex-end',
  },
  container: {
    borderTopLeftRadius: Radius['2xl'],
    borderTopRightRadius: Radius['2xl'],
    maxHeight: '90%',
    padding: Spacing.xl,
    borderWidth: StyleSheet.hairlineWidth,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.base,
  },
  closeBtn: {
    padding: Spacing.xs,
  },
  scrollContent: {
    paddingBottom: Spacing.xl,
  },
  fieldLabel: {
    marginTop: Spacing.base,
    marginBottom: Spacing.xs,
  },
  input: {
    height: 48,
    borderRadius: Radius.md,
    borderWidth: 1,
    paddingHorizontal: Spacing.md,
    fontSize: 15,
  },
  rowTwoFields: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  horizontalScroll: {
    flexDirection: 'row',
    marginBottom: Spacing.xs,
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs + 2,
    borderRadius: 99,
    borderWidth: 1.5,
    marginRight: Spacing.sm,
  },
  colorRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  colorDot: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: 'center',
    justifyContent: 'center',
  },
  colorDotSelected: {
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },
  iconGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  iconBox: {
    width: 44,
    height: 44,
    borderRadius: Radius.md,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  daysRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  dayChip: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  unitPresetsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginBottom: Spacing.xs,
  },
  unitChip: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: Radius.full,
    borderWidth: 1,
  },
});

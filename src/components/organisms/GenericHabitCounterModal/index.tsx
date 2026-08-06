import React from 'react';
import {
  Modal,
  View,
  StyleSheet,
  TouchableOpacity,
  Pressable,
} from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useTheme } from '@/hooks/useTheme';
import { useHabitsStore, useTodayHabits } from '@/stores/useHabitsStore';
import { AppText } from '@/components/atoms/AppText';
import { AppButton } from '@/components/atoms/AppButton';
import { ArcSliderCounter } from '@/components/molecules/ArcSliderCounter';
import { Radius, Spacing, Shadow } from '@/constants/theme';
import type { HabitWithLogs } from '@/types/habit';

type GenericHabitCounterModalProps = {
  visible: boolean;
  habit: HabitWithLogs | null;
  onClose: () => void;
};

export function GenericHabitCounterModal({
  visible,
  habit: initialHabit,
  onClose,
}: GenericHabitCounterModalProps) {
  const { colors, isDark } = useTheme();
  const { incrementHabitToday, decrementHabitToday } = useHabitsStore();
  const todayHabits = useTodayHabits();

  // Find live habit from store so it updates instantly
  const habit =
    todayHabits.find((h) => h.id === initialHabit?.id) ?? initialHabit;

  if (!habit || !visible) return null;

  const currentCount = habit.todayLog?.completedCount ?? 0;
  const targetCount = habit.targetCount || 1;
  const unit = habit.unit || 'vezes';
  const progressRatio = Math.min(1, currentCount / targetCount);
  const percentage = Math.round(progressRatio * 100);

  const handleAdd = (delta: number) => {
    incrementHabitToday(habit.id, delta);
  };

  const handleRemove = (delta: number) => {
    decrementHabitToday(habit.id, delta);
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
            <View style={styles.headerTitleRow}>
              <View
                style={[
                  styles.badgeIcon,
                  { backgroundColor: `${habit.color || colors.primary}22` },
                ]}
              >
                <MaterialCommunityIcons
                  name={(habit.icon as any) || 'target'}
                  size={24}
                  color={habit.color || colors.primary}
                />
              </View>
              <View style={{ flex: 1 }}>
                <AppText variant="h3" numberOfLines={1}>{habit.title}</AppText>
                <AppText variant="caption" color="textSecondary">
                  {currentCount} de {targetCount} {unit} ({percentage}% concluído)
                </AppText>
              </View>
            </View>

            <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
              <Ionicons name="close" size={24} color={colors.icon} />
            </TouchableOpacity>
          </View>

          {/* Interactive Drag Half-Moon Arc Slider ("Meia-Lua") */}
          <ArcSliderCounter
            value={currentCount}
            max={targetCount}
            unit={unit}
            color={habit.color || colors.primary}
            onChange={(newVal) => {
              const diff = newVal - currentCount;
              if (diff > 0) {
                incrementHabitToday(habit.id, diff);
              } else if (diff < 0) {
                decrementHabitToday(habit.id, Math.abs(diff));
              }
            }}
          />

          {/* Quick Increment Buttons */}
          <AppText variant="label" color="textSecondary" style={{ marginTop: Spacing.xs, marginBottom: 4 }}>
            Ações Rápidas:
          </AppText>
          <View style={styles.actionGrid}>
            {[1, 2, 5, 10].map((step) => (
              <TouchableOpacity
                key={step}
                style={[
                  styles.quickAddBtn,
                  { backgroundColor: colors.background, borderColor: colors.border },
                ]}
                onPress={() => handleAdd(step)}
                activeOpacity={0.7}
              >
                <AppText style={[styles.quickAddText, { color: colors.text }]}>
                  +{step} {unit}
                </AppText>
              </TouchableOpacity>
            ))}
          </View>

          {/* Bottom Secondary Action Row */}
          <View style={styles.secondaryRow}>
            <TouchableOpacity
              style={[
                styles.minorBtn,
                { backgroundColor: colors.background, borderColor: colors.border },
              ]}
              onPress={() => handleRemove(1)}
              disabled={currentCount === 0}
            >
              <Ionicons name="remove" size={18} color={colors.text} />
              <AppText variant="caption" style={{ marginLeft: 4 }}>
                Remover 1
              </AppText>
            </TouchableOpacity>

            <AppButton
              label="Concluir"
              onPress={onClose}
              variant="primary"
              size="md"
            />
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
    maxWidth: 370,
    borderRadius: Radius['2xl'],
    padding: Spacing.lg,
    borderWidth: StyleSheet.hairlineWidth,
    ...Shadow.lg,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: Spacing.xs,
  },
  headerTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    flex: 1,
  },
  badgeIcon: {
    width: 44,
    height: 44,
    borderRadius: Radius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  closeBtn: {
    padding: Spacing.xs,
  },
  actionGrid: {
    flexDirection: 'row',
    gap: Spacing.xs,
    marginVertical: Spacing.xs,
  },
  quickAddBtn: {
    flex: 1,
    height: 40,
    borderRadius: Radius.md,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  quickAddText: {
    fontWeight: '700',
    fontSize: 12,
  },
  secondaryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: Spacing.sm,
  },
  minorBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: Radius.md,
    borderWidth: 1,
  },
});

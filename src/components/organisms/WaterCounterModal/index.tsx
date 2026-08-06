import React, { useState } from 'react';
import {
  Modal,
  View,
  StyleSheet,
  TouchableOpacity,
  Pressable,
  Alert,
} from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
} from 'react-native-reanimated';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useTheme } from '@/hooks/useTheme';
import { useHabitsStore, useTodayHabits } from '@/stores/useHabitsStore';
import { AppText } from '@/components/atoms/AppText';
import { AppButton } from '@/components/atoms/AppButton';
import { EditTargetModal } from '@/components/molecules/EditTargetModal';
import { ArcSliderCounter } from '@/components/molecules/ArcSliderCounter';
import {
  scheduleWaterIntervalReminder,
  scheduleTestNotification,
} from '@/services/notifications';
import { Radius, Spacing, Shadow } from '@/constants/theme';
import type { HabitWithLogs } from '@/types/habit';

type WaterCounterModalProps = {
  visible: boolean;
  habit: HabitWithLogs | null;
  onClose: () => void;
};

export function WaterCounterModal({
  visible,
  habit: initialHabit,
  onClose,
}: WaterCounterModalProps) {
  const { colors, isDark } = useTheme();
  const { incrementHabitToday, decrementHabitToday, updateHabit } = useHabitsStore();
  const todayHabits = useTodayHabits();
  const [isEditTargetOpen, setIsEditTargetOpen] = useState(false);
  const [activeReminderInterval, setActiveReminderInterval] = useState<number | null>(null);

  // Find live habit from store so it updates instantly when clicking buttons inside modal
  const habit =
    todayHabits.find((h) => h.id === initialHabit?.id) ?? initialHabit;

  const currentCount = habit?.todayLog?.completedCount ?? 0;
  const targetCount = habit?.targetCount || 8;
  const unit = habit?.unit || 'copos';
  const glassVolume = 250; // ml per glass
  const currentMl = currentCount * glassVolume;
  const targetMl = targetCount * glassVolume;
  const progressRatio = Math.min(1, currentCount / targetCount);
  const percentage = Math.round(progressRatio * 100);

  const fillHeight = useSharedValue(progressRatio);

  React.useEffect(() => {
    fillHeight.value = withSpring(progressRatio, {
      damping: 14,
      stiffness: 100,
    });
  }, [progressRatio]);

  const animatedWaterStyle = useAnimatedStyle(() => ({
    height: `${fillHeight.value * 100}%`,
  }));

  if (!habit) return null;

  const handleAddOne = () => {
    incrementHabitToday(habit.id, 1);
  };

  const handleAddTwo = () => {
    incrementHabitToday(habit.id, 2);
  };

  const handleRemoveOne = () => {
    decrementHabitToday(habit.id, 1);
  };

  const handleSaveTarget = (newTarget: number) => {
    updateHabit(habit.id, { targetCount: newTarget });
  };

  const handleSetIntervalReminder = async (minutes: number) => {
    setActiveReminderInterval(minutes);
    const ok = await scheduleWaterIntervalReminder(minutes);
    if (ok) {
      if (minutes <= 0.1) {
        Alert.alert(
          '💧 Alerta de Hidratação (6s)',
          'Minimize o app para ver a notificação de beber água em 6 segundos.'
        );
      } else {
        Alert.alert(
          '💧 Lembrete de Hidratação Agendado!',
          `Você receberá o alarme para beber água a cada ${minutes} minutos.`
        );
      }
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
            <View style={styles.headerTitleRow}>
              <View style={[styles.badgeIcon, { backgroundColor: '#06B6D422' }]}>
                <MaterialCommunityIcons name="water" size={24} color="#06B6D4" />
              </View>
              <View>
                <AppText variant="h3">{habit.title}</AppText>
                <TouchableOpacity
                  onPress={() => setIsEditTargetOpen(true)}
                  style={styles.editTargetRow}
                  activeOpacity={0.6}
                  hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                >
                  <AppText variant="caption" color="textSecondary">
                    {currentMl} ml de {targetMl} ml ({targetCount} {unit})
                  </AppText>
                  <Ionicons name="pencil" size={14} color="#06B6D4" style={{ marginLeft: 4 }} />
                </TouchableOpacity>
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
            color="#06B6D4"
            onChange={(newVal) => {
              const diff = newVal - currentCount;
              if (diff > 0) {
                incrementHabitToday(habit.id, diff);
              } else if (diff < 0) {
                decrementHabitToday(habit.id, Math.abs(diff));
              }
            }}
          />

          {/* Interval Reminder Selector */}
          <AppText variant="label" color="textSecondary" style={{ marginTop: 4, marginBottom: 4 }}>
            🔔 Agendar Alarme de Água Recorrente:
          </AppText>
          <View style={styles.reminderRow}>
            {[
              { label: '30 min', min: 30 },
              { label: '60 min', min: 60 },
              { label: 'Testar (6s)', min: 0.1 },
            ].map(({ label, min }) => (
              <TouchableOpacity
                key={label}
                style={[
                  styles.reminderChip,
                  {
                    backgroundColor: activeReminderInterval === min ? '#06B6D4' : colors.background,
                    borderColor: activeReminderInterval === min ? '#06B6D4' : colors.border,
                  },
                ]}
                onPress={() => handleSetIntervalReminder(min)}
              >
                <AppText
                  style={{
                    fontSize: 11,
                    fontWeight: '700',
                    color: activeReminderInterval === min ? '#FFF' : colors.text,
                  }}
                >
                  {label}
                </AppText>
              </TouchableOpacity>
            ))}
          </View>

          {/* Edit Target Bar */}
          <TouchableOpacity
            style={[
              styles.editTargetBar,
              { backgroundColor: isDark ? 'rgba(6,182,212,0.15)' : '#E0F2FE' },
            ]}
            onPress={() => setIsEditTargetOpen(true)}
            activeOpacity={0.7}
          >
            <Ionicons name="create-outline" size={16} color="#06B6D4" />
            <AppText variant="caption" style={{ color: '#06B6D4', fontWeight: '700', marginLeft: 4 }}>
              Alterar Meta Diária de Água ({targetCount} {unit})
            </AppText>
          </TouchableOpacity>

          {/* Action Buttons */}
          <View style={styles.actionGrid}>
            <TouchableOpacity
              style={[styles.quickAddBtn, { backgroundColor: '#06B6D4' }]}
              onPress={handleAddOne}
              activeOpacity={0.8}
            >
              <MaterialCommunityIcons name="cup-water" size={22} color="#FFF" />
              <AppText style={styles.quickAddText}>+1 Copo (250ml)</AppText>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.quickAddBtn, { backgroundColor: '#0284C7' }]}
              onPress={handleAddTwo}
              activeOpacity={0.8}
            >
              <MaterialCommunityIcons name="water-pump" size={22} color="#FFF" />
              <AppText style={styles.quickAddText}>+2 Copos (500ml)</AppText>
            </TouchableOpacity>
          </View>

          <View style={styles.secondaryRow}>
            <TouchableOpacity
              style={[
                styles.minorBtn,
                { backgroundColor: colors.background, borderColor: colors.border },
              ]}
              onPress={handleRemoveOne}
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

          {/* Edit Target In-Modal Overlay */}
          <EditTargetModal
            visible={isEditTargetOpen}
            title="Água"
            unit="copos"
            currentTarget={targetCount}
            presets={[4, 6, 8, 10, 12, 16]}
            onClose={() => setIsEditTargetOpen(false)}
            onSave={handleSaveTarget}
          />
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
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  container: {
    width: '100%',
    maxWidth: 380,
    borderRadius: Radius['2xl'],
    padding: Spacing.xl,
    borderWidth: StyleSheet.hairlineWidth,
    ...Shadow.lg,
    position: 'relative',
    overflow: 'hidden',
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
    gap: Spacing.md,
  },
  editTargetRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 2,
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
  cupSection: {
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: Spacing.xs,
  },
  glassOuter: {
    width: 160,
    height: 180,
    borderRadius: Radius.xl,
    borderWidth: 3,
    borderTopWidth: 1,
    overflow: 'hidden',
    justifyContent: 'flex-end',
    alignItems: 'center',
    position: 'relative',
  },
  waterFill: {
    width: '100%',
    backgroundColor: '#06B6D4',
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    opacity: 0.85,
  },
  waveTopLine: {
    height: 6,
    backgroundColor: '#67E8F9',
    width: '100%',
  },
  marksContainer: {
    position: 'absolute',
    left: 8,
    top: 20,
    bottom: 20,
    justifyContent: 'space-between',
  },
  markRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  markLine: {
    width: 10,
    height: 2,
    backgroundColor: 'rgba(6,182,212,0.5)',
    marginRight: 4,
  },
  markText: {
    fontSize: 10,
    color: '#06B6D4',
    fontWeight: '600',
  },
  glassCenterText: {
    position: 'absolute',
    alignItems: 'center',
    justifyContent: 'center',
    top: 35,
    zIndex: 10,
  },
  reminderRow: {
    flexDirection: 'row',
    gap: Spacing.xs,
    marginVertical: 4,
  },
  reminderChip: {
    flex: 1,
    paddingVertical: 6,
    borderRadius: Radius.md,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  editTargetBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Spacing.xs,
    paddingHorizontal: Spacing.md,
    borderRadius: Radius.md,
    marginTop: 4,
    marginBottom: Spacing.xs,
  },
  actionGrid: {
    flexDirection: 'row',
    gap: Spacing.sm,
    marginTop: Spacing.xs,
  },
  quickAddBtn: {
    flex: 1,
    height: 44,
    borderRadius: Radius.lg,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    ...Shadow.sm,
  },
  quickAddText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 13,
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

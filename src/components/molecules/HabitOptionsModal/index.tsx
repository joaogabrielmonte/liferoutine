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
import { AppText } from '@/components/atoms/AppText';
import { Radius, Spacing, Shadow } from '@/constants/theme';
import type { HabitWithLogs } from '@/types/habit';

type HabitOptionsModalProps = {
  visible: boolean;
  habit: HabitWithLogs | null;
  onClose: () => void;
  onOpenHabit: (habit: HabitWithLogs) => void;
  onEdit?: (habit: HabitWithLogs) => void;
  onArchive: (habitId: string) => void;
  onDelete: (habitId: string) => void;
};

export function HabitOptionsModal({
  visible,
  habit,
  onClose,
  onOpenHabit,
  onEdit,
  onArchive,
  onDelete,
}: HabitOptionsModalProps) {
  const { colors, isDark } = useTheme();

  if (!habit || !visible) return null;

  const titleLower = habit.title.toLowerCase();
  const isSystemHabit =
    habit.id === '1' ||
    habit.id === '2' ||
    titleLower.includes('agua') ||
    titleLower.includes('água') ||
    titleLower.includes('exerc') ||
    titleLower.includes('treino');

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
              <View
                style={[
                  styles.iconBox,
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
                  {isSystemHabit ? 'Hábito Principal do Sistema' : 'Hábito Personalizado'}
                </AppText>
              </View>
            </View>

            <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
              <Ionicons name="close" size={22} color={colors.icon} />
            </TouchableOpacity>
          </View>

          {/* System Habit vs Custom Habit Options */}
          {isSystemHabit ? (
            <View style={styles.systemContent}>
              <View style={[styles.infoBox, { backgroundColor: isDark ? 'rgba(59,130,246,0.15)' : '#EFF6FF' }]}>
                <Ionicons name="information-circle-outline" size={20} color="#3B82F6" />
                <AppText variant="body" style={{ color: colors.text, flex: 1, marginLeft: Spacing.xs }}>
                  Este hábito possui contador e temporizador ao vivo, não podendo ser excluído.
                </AppText>
              </View>

              <TouchableOpacity
                style={[styles.actionRow, { backgroundColor: colors.primary }]}
                onPress={() => {
                  onClose();
                  onOpenHabit(habit);
                }}
                activeOpacity={0.8}
              >
                <Ionicons name="open-outline" size={20} color="#FFFFFF" />
                <AppText style={styles.primaryActionText}>
                  Abrir Contador / Relógio
                </AppText>
              </TouchableOpacity>

              {onEdit && (
                <TouchableOpacity
                  style={[styles.actionRow, { backgroundColor: colors.background, borderColor: colors.border, borderWidth: 1 }]}
                  onPress={() => {
                    onClose();
                    onEdit(habit);
                  }}
                  activeOpacity={0.7}
                >
                  <Ionicons name="create-outline" size={20} color={colors.primary} />
                  <AppText style={[styles.actionText, { color: colors.text }]}>
                    Editar Meta Diária
                  </AppText>
                </TouchableOpacity>
              )}
            </View>
          ) : (
            <View style={styles.optionsList}>
              {onEdit && (
                <TouchableOpacity
                  style={[styles.actionRow, { backgroundColor: colors.background, borderColor: colors.border, borderWidth: 1 }]}
                  onPress={() => {
                    onClose();
                    onEdit(habit);
                  }}
                  activeOpacity={0.7}
                >
                  <Ionicons name="create-outline" size={20} color={colors.primary} />
                  <AppText style={[styles.actionText, { color: colors.text }]}>
                    Editar Hábito & Meta
                  </AppText>
                </TouchableOpacity>
              )}

              <TouchableOpacity
                style={[styles.actionRow, { backgroundColor: colors.background, borderColor: colors.border, borderWidth: 1 }]}
                onPress={() => {
                  onClose();
                  onArchive(habit.id);
                }}
                activeOpacity={0.7}
              >
                <Ionicons name="archive-outline" size={20} color="#F59E0B" />
                <AppText style={[styles.actionText, { color: colors.text }]}>
                  Arquivar Hábito
                </AppText>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.actionRow, { backgroundColor: '#FEF2F2', borderColor: '#FCA5A5', borderWidth: 1 }]}
                onPress={() => {
                  onClose();
                  onDelete(habit.id);
                }}
                activeOpacity={0.7}
              >
                <Ionicons name="trash-outline" size={20} color="#EF4444" />
                <AppText style={[styles.actionText, { color: '#EF4444' }]}>
                  Excluir Hábito Permanentemente
                </AppText>
              </TouchableOpacity>
            </View>
          )}
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
    borderRadius: Radius.xl,
    padding: Spacing.lg,
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
    flex: 1,
  },
  iconBox: {
    width: 44,
    height: 44,
    borderRadius: Radius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  closeBtn: {
    padding: Spacing.xs,
  },
  systemContent: {
    gap: Spacing.sm,
  },
  infoBox: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.md,
    borderRadius: Radius.md,
  },
  optionsList: {
    gap: Spacing.sm,
  },
  actionRow: {
    height: 48,
    borderRadius: Radius.md,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.xs,
    paddingHorizontal: Spacing.md,
  },
  primaryActionText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 14,
  },
  actionText: {
    fontWeight: '700',
    fontSize: 14,
  },
});

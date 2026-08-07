import React from 'react';
import { View, ScrollView, StyleSheet, Modal, Pressable, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { useTheme } from '@/hooks/useTheme';
import { useHabitsStore, useTodayHabits, useTodayCompletion } from '@/stores/useHabitsStore';
import { AppText } from '@/components/atoms/AppText';
import { AppCard } from '@/components/atoms/AppCard';
import { AppButton } from '@/components/atoms/AppButton';
import { ProgressRing } from '@/components/molecules/ProgressRing';
import { HeatmapCalendar } from '@/components/molecules/HeatmapCalendar';
import { Spacing, Radius, Shadow } from '@/constants/theme';
import { HABIT_CATEGORIES, type HabitCategory } from '@/types/habit';

type StatCardProps = {
  icon: React.ReactNode;
  label: string;
  value: string;
  subtitle?: string;
  color: string;
};

function StatCard({ icon, label, value, subtitle, color }: StatCardProps) {
  return (
    <AppCard style={[styles.statCard, { flex: 1 }]}>
      <View style={[styles.statIcon, { backgroundColor: `${color}22` }]}>
        {icon}
      </View>
      <AppText variant="h3" style={{ marginTop: Spacing.sm }}>
        {value}
      </AppText>
      <AppText variant="label" color="textSecondary">
        {label}
      </AppText>
      {subtitle && (
        <AppText variant="caption" style={{ color, marginTop: 2 }}>
          {subtitle}
        </AppText>
      )}
    </AppCard>
  );
}

export default function StatsScreen() {
  const { colors, isDark } = useTheme();
  const habits = useTodayHabits();
  const logs = useHabitsStore((state) => state.logs);
  const completion = useTodayCompletion();
  const completedToday = habits.filter((h) => h.isCompletedToday).length;

  const [selectedDateKey, setSelectedDateKey] = React.useState<string | null>(null);
  const [selectedDayNum, setSelectedDayNum] = React.useState<number | null>(null);

  const currentStreak =
    habits.length > 0
      ? Math.max(...habits.map((h) => h.streak || 0))
      : 0;

  const bestStreak =
    habits.length > 0
      ? Math.max(...habits.map((h) => h.bestStreak || h.streak || 0))
      : 0;

  const totalCompletionsCount = logs.filter((l) => l.completedCount > 0).length;

  // Selected Day Logs Breakdown
  const selectedDayLogs = selectedDateKey
    ? logs.filter((l) => l.date === selectedDateKey && l.completedCount > 0)
    : [];

  const formattedSelectedDate = selectedDateKey
    ? (() => {
        const parts = selectedDateKey.split('-').map(Number);
        const d = new Date(parts[0], parts[1] - 1, parts[2]);
        return d.toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
      })()
    : '';

  return (
    <SafeAreaView
      style={[styles.safe, { backgroundColor: colors.background }]}
      edges={['top']}
    >
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scroll}
      >
        {/* Header */}
        <Animated.View entering={FadeInDown.duration(400)} style={styles.header}>
          <AppText variant="h2">Progresso & Estatísticas</AppText>
          <AppText variant="caption" color="textSecondary">
            Sua constância, recordes e conquistas diárias
          </AppText>
        </Animated.View>

        {/* Main ring */}
        <Animated.View entering={FadeInDown.delay(100).duration(400)}>
          <AppCard style={styles.mainCard} elevated>
            <AppText
              variant="title"
              align="center"
              style={{ marginBottom: Spacing.xl }}
            >
              Conclusão de Hoje
            </AppText>
            <View style={styles.ringContainer}>
              <ProgressRing
                progress={completion}
                size={160}
                strokeWidth={14}
                label={`${Math.round(completion * 100)}%`}
                sublabel={`${completedToday}/${habits.length} hábitos`}
              />
            </View>
          </AppCard>
        </Animated.View>

        {/* Stat cards row 1 */}
        <Animated.View
          entering={FadeInDown.delay(200).duration(400)}
          style={styles.statsRow}
        >
          <StatCard
            icon={
              <MaterialCommunityIcons name="fire" size={22} color="#F59E0B" />
            }
            label="SEQUÊNCIA ATUAL"
            value={`${currentStreak} ${currentStreak === 1 ? 'dia' : 'dias'}`}
            subtitle="dias seguidos"
            color="#F59E0B"
          />
          <View style={{ width: Spacing.sm }} />
          <StatCard
            icon={
              <MaterialCommunityIcons
                name="trophy-award"
                size={22}
                color="#8B5CF6"
              />
            }
            label="RECORDE MÁXIMO"
            value={`${bestStreak} ${bestStreak === 1 ? 'dia' : 'dias'}`}
            subtitle="maior sequência"
            color="#8B5CF6"
          />
        </Animated.View>

        {/* Stat cards row 2 */}
        <Animated.View
          entering={FadeInDown.delay(250).duration(400)}
          style={styles.statsRow}
        >
          <StatCard
            icon={
              <MaterialCommunityIcons
                name="target"
                size={22}
                color={colors.primary}
              />
            }
            label="HÁBITOS ATIVOS"
            value={`${habits.length}`}
            subtitle="programados hoje"
            color={colors.primary}
          />
          <View style={{ width: Spacing.sm }} />
          <StatCard
            icon={
              <Ionicons
                name="checkmark-done-circle-outline"
                size={22}
                color="#22C55E"
              />
            }
            label="TOTAL REGISTRADO"
            value={`${totalCompletionsCount}`}
            subtitle="conclusões no total"
            color="#22C55E"
          />
        </Animated.View>

        {/* Heatmap Calendar Section */}
        <Animated.View entering={FadeInDown.delay(300).duration(400)}>
          <AppCard style={styles.heatmapCard}>
            <HeatmapCalendar
              logs={logs}
              totalActiveHabitsCount={habits.length}
              onSelectDay={(dateKey, dayNum) => {
                setSelectedDateKey(dateKey);
                setSelectedDayNum(dayNum);
              }}
            />
          </AppCard>
        </Animated.View>

        {/* Category Performance Breakdown */}
        <Animated.View entering={FadeInDown.delay(350).duration(400)}>
          <AppCard style={styles.categoryCard}>
            <AppText variant="title" style={{ marginBottom: Spacing.md }}>
              Desempenho por Categoria
            </AppText>
            {(Object.keys(HABIT_CATEGORIES) as HabitCategory[]).map((catKey) => {
              const catInfo = HABIT_CATEGORIES[catKey];
              const catHabits = habits.filter((h) => h.category === catKey);
              if (catHabits.length === 0) return null;

              const completedCat = catHabits.filter((h) => h.isCompletedToday).length;
              const catRatio = completedCat / catHabits.length;

              return (
                <View key={catKey} style={styles.categoryRow}>
                  <View style={styles.categoryTitleRow}>
                    <View style={[styles.categoryIcon, { backgroundColor: `${catInfo.color}22` }]}>
                      <MaterialCommunityIcons name={catInfo.icon as any} size={16} color={catInfo.color} />
                    </View>
                    <AppText variant="bodyMedium" style={{ marginLeft: Spacing.xs, flex: 1 }}>
                      {catInfo.label}
                    </AppText>
                    <AppText variant="caption" style={{ fontWeight: '700', color: catInfo.color }}>
                      {completedCat}/{catHabits.length} ({Math.round(catRatio * 100)}%)
                    </AppText>
                  </View>
                  <View style={[styles.progressTrack, { backgroundColor: isDark ? 'rgba(255,255,255,0.08)' : '#E2E8F0' }]}>
                    <View
                      style={[
                        styles.progressFill,
                        {
                          width: `${Math.round(catRatio * 100)}%`,
                          backgroundColor: catInfo.color,
                        },
                      ]}
                    />
                  </View>
                </View>
              );
            })}
          </AppCard>
        </Animated.View>

        <View style={{ height: Spacing['3xl'] }} />
      </ScrollView>

      {/* Modal de Histórico do Dia Selecionado */}
      <Modal
        visible={!!selectedDateKey}
        animationType="fade"
        transparent
        onRequestClose={() => setSelectedDateKey(null)}
      >
        <View style={styles.modalOverlay}>
          <Pressable style={styles.modalBackdrop} onPress={() => setSelectedDateKey(null)} />
          <View
            style={[
              styles.modalCard,
              { backgroundColor: colors.surfaceElevated, borderColor: colors.border },
            ]}
          >
            <View style={styles.modalHeaderRow}>
              <View style={styles.modalHeaderTitle}>
                <Ionicons name="calendar-outline" size={20} color={colors.primary} />
                <AppText variant="title" style={{ textTransform: 'capitalize' }}>
                  Dia {selectedDayNum}
                </AppText>
              </View>
              <TouchableOpacity onPress={() => setSelectedDateKey(null)} style={{ padding: 4 }}>
                <Ionicons name="close" size={22} color={colors.icon} />
              </TouchableOpacity>
            </View>

            <AppText variant="caption" color="textSecondary" style={{ marginBottom: Spacing.md }}>
              {formattedSelectedDate}
            </AppText>

            <AppText variant="label" style={{ marginBottom: Spacing.xs }}>
              Hábitos Concluídos neste Dia ({selectedDayLogs.length}):
            </AppText>

            {selectedDayLogs.length === 0 ? (
              <View style={styles.emptyDayBox}>
                <Ionicons name="sunny-outline" size={32} color={colors.textTertiary} />
                <AppText variant="caption" color="textSecondary" align="center" style={{ marginTop: 6 }}>
                  Nenhum hábito foi concluído nesta data.
                </AppText>
              </View>
            ) : (
              <ScrollView style={{ maxHeight: 220 }}>
                {selectedDayLogs.map((log) => {
                  const habitObj = habits.find((h) => h.id === log.habitId);
                  const habitTitle = habitObj?.title || 'Hábito';
                  const habitIcon = habitObj?.icon || 'checkmark-circle-outline';
                  const habitColor = habitObj?.color || colors.primary;

                  return (
                    <View
                      key={log.id}
                      style={[
                        styles.logItemRow,
                        { backgroundColor: colors.background, borderColor: colors.border },
                      ]}
                    >
                      <View style={[styles.logItemIcon, { backgroundColor: `${habitColor}22` }]}>
                        <MaterialCommunityIcons name={habitIcon as any} size={18} color={habitColor} />
                      </View>
                      <View style={{ flex: 1 }}>
                        <AppText variant="bodyMedium" style={{ fontWeight: '600' }}>
                          {habitTitle}
                        </AppText>
                        <AppText variant="caption" color="textSecondary">
                          {log.completedCount} {habitObj?.unit || 'vezes'}
                        </AppText>
                      </View>
                      <Ionicons name="checkmark-circle" size={20} color="#22C55E" />
                    </View>
                  );
                })}
              </ScrollView>
            )}

            <View style={{ marginTop: Spacing.md, alignItems: 'flex-end' }}>
              <AppButton label="Fechar" variant="primary" onPress={() => setSelectedDateKey(null)} />
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  scroll: { paddingHorizontal: Spacing.base, paddingTop: Spacing.md },
  header: { marginBottom: Spacing.xl },
  mainCard: { marginBottom: Spacing.md, alignItems: 'center' },
  ringContainer: { alignItems: 'center', marginBottom: Spacing.md },
  statsRow: {
    flexDirection: 'row',
    marginBottom: Spacing.md,
  },
  statCard: { padding: Spacing.base },
  statIcon: {
    width: 40,
    height: 40,
    borderRadius: Radius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  heatmapCard: {
    padding: Spacing.base,
    marginBottom: Spacing.md,
  },
  categoryCard: {
    padding: Spacing.base,
    marginBottom: Spacing.md,
  },
  categoryRow: {
    marginBottom: Spacing.sm,
  },
  categoryTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  categoryIcon: {
    width: 28,
    height: 28,
    borderRadius: Radius.sm,
    alignItems: 'center',
    justifyContent: 'center',
  },
  progressTrack: {
    height: 8,
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 4,
  },
  modalOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.65)',
    padding: Spacing.base,
  },
  modalBackdrop: {
    ...StyleSheet.absoluteFillObject,
  },
  modalCard: {
    width: '100%',
    maxWidth: 360,
    borderRadius: Radius['2xl'],
    padding: Spacing.lg,
    borderWidth: StyleSheet.hairlineWidth,
    ...Shadow.lg,
  },
  modalHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  modalHeaderTitle: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
  },
  emptyDayBox: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Spacing.lg,
  },
  logItemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.md,
    borderRadius: Radius.md,
    borderWidth: 1,
    marginBottom: Spacing.xs,
    gap: Spacing.sm,
  },
  logItemIcon: {
    width: 34,
    height: 34,
    borderRadius: Radius.sm,
    alignItems: 'center',
    justifyContent: 'center',
  },
});

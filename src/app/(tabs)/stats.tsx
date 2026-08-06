import React from 'react';
import { View, ScrollView, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { useTheme } from '@/hooks/useTheme';
import { useHabitsStore, useTodayHabits, useTodayCompletion } from '@/stores/useHabitsStore';
import { AppText } from '@/components/atoms/AppText';
import { AppCard } from '@/components/atoms/AppCard';
import { ProgressRing } from '@/components/molecules/ProgressRing';
import { HeatmapCalendar } from '@/components/molecules/HeatmapCalendar';
import { Spacing, Radius } from '@/constants/theme';
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

  const avgStreak =
    habits.length > 0
      ? Math.round(
          habits.reduce((acc, h) => acc + h.streak, 0) / habits.length
        )
      : 0;

  const bestStreak = habits.reduce(
    (max, h) => Math.max(max, h.bestStreak),
    0
  );

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
            Sua constância e conquistas diárias
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
              <MaterialCommunityIcons name="fire" size={20} color="#F59E0B" />
            }
            label="SEQUÊNCIA"
            value={`${avgStreak} dias`}
            subtitle="média atual"
            color="#F59E0B"
          />
          <View style={{ width: Spacing.sm }} />
          <StatCard
            icon={
              <MaterialCommunityIcons
                name="medal-outline"
                size={20}
                color="#8B5CF6"
              />
            }
            label="RECORDE"
            value={`${bestStreak} dias`}
            subtitle="melhor sequência"
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
                size={20}
                color={colors.primary}
              />
            }
            label="HÁBITOS"
            value={`${habits.length}`}
            subtitle="ativos hoje"
            color={colors.primary}
          />
          <View style={{ width: Spacing.sm }} />
          <StatCard
            icon={
              <Ionicons
                name="trending-up-outline"
                size={20}
                color="#22C55E"
              />
            }
            label="CONCLUÍDOS"
            value={`${completedToday}`}
            subtitle="hoje"
            color="#22C55E"
          />
        </Animated.View>

        {/* Heatmap Calendar Section */}
        <Animated.View entering={FadeInDown.delay(300).duration(400)}>
          <AppCard style={styles.heatmapCard}>
            <HeatmapCalendar logs={logs} totalActiveHabitsCount={habits.length} />
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
});

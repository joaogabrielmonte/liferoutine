import React from 'react';
import { View, ScrollView, StyleSheet } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useTheme } from '@/hooks/useTheme';
import { AppText } from '@/components/atoms/AppText';
import { AppCard } from '@/components/atoms/AppCard';
import { Radius, Spacing, Shadow } from '@/constants/theme';
import type { HabitWithLogs } from '@/types/habit';

type BadgeItem = {
  id: string;
  title: string;
  subtitle: string;
  icon: string;
  color: string;
  unlocked: boolean;
  progress: number; // 0..1
};

type BadgesSectionProps = {
  habits: HabitWithLogs[];
};

export function BadgesSection({ habits }: BadgesSectionProps) {
  const { colors, isDark } = useTheme();

  // Calculate dynamic stats
  const totalWaterLog = habits.find((h) => h.id === '1' || h.title.toLowerCase().includes('agua'))?.todayLog?.completedCount ?? 0;
  const totalExerciseLog = habits.find((h) => h.id === '2' || h.title.toLowerCase().includes('exerc'))?.todayLog?.completedCount ?? 0;
  const maxStreak = habits.reduce((max, h) => Math.max(max, h.streak), 0);
  const completedTodayCount = habits.filter((h) => h.isCompletedToday).length;

  const BADGES: BadgeItem[] = [
    {
      id: 'streak-7',
      title: 'Sequência de Ouro',
      subtitle: '7 dias seguidos',
      icon: 'trophy-award',
      color: '#F59E0B',
      unlocked: maxStreak >= 7,
      progress: Math.min(1, maxStreak / 7),
    },
    {
      id: 'water-master',
      title: 'Mestre da Hidratação',
      subtitle: '8 copos em 1 dia',
      icon: 'water-check',
      color: '#06B6D4',
      unlocked: totalWaterLog >= 8,
      progress: Math.min(1, totalWaterLog / 8),
    },
    {
      id: 'exercise-pro',
      title: 'Atleta Consistente',
      subtitle: '30 min de treino',
      icon: 'lightning-bolt',
      color: '#8B5CF6',
      unlocked: totalExerciseLog >= 30,
      progress: Math.min(1, totalExerciseLog / 30),
    },
    {
      id: 'perfect-day',
      title: 'Dia Perfeito',
      subtitle: '100% dos hábitos',
      icon: 'star-circle',
      color: '#22C55E',
      unlocked: habits.length > 0 && completedTodayCount === habits.length,
      progress: habits.length > 0 ? completedTodayCount / habits.length : 0,
    },
  ];

  return (
    <View style={styles.container}>
      <View style={styles.headerRow}>
        <AppText variant="title">Conquistas & Medalhas</AppText>
        <AppText variant="caption" color="textSecondary">
          {BADGES.filter((b) => b.unlocked).length} de {BADGES.length} desbloqueadas
        </AppText>
      </View>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {BADGES.map((badge) => (
          <AppCard
            key={badge.id}
            style={[
              styles.badgeCard,
              {
                backgroundColor: isDark ? colors.surface : '#FFFFFF',
                borderColor: badge.unlocked ? badge.color : colors.border,
                opacity: badge.unlocked ? 1 : 0.7,
              },
            ]}
          >
            <View
              style={[
                styles.badgeIcon,
                { backgroundColor: badge.unlocked ? `${badge.color}22` : isDark ? 'rgba(255,255,255,0.06)' : '#F1F5F9' },
              ]}
            >
              <MaterialCommunityIcons
                name={badge.icon as any}
                size={24}
                color={badge.unlocked ? badge.color : colors.textSecondary}
              />
            </View>

            <AppText
              style={[
                styles.badgeTitle,
                { color: badge.unlocked ? colors.text : colors.textSecondary },
              ]}
              numberOfLines={2}
            >
              {badge.title}
            </AppText>

            <AppText variant="caption" color="textSecondary" numberOfLines={1} style={{ marginTop: 2 }}>
              {badge.subtitle}
            </AppText>

            {/* Progress track */}
            <View style={[styles.progressTrack, { backgroundColor: colors.border }]}>
              <View
                style={[
                  styles.progressFill,
                  {
                    width: `${Math.round(badge.progress * 100)}%`,
                    backgroundColor: badge.unlocked ? badge.color : colors.textSecondary,
                  },
                ]}
              />
            </View>
          </AppCard>
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginVertical: Spacing.xs,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: Spacing.sm,
  },
  scrollContent: {
    gap: Spacing.sm,
    paddingRight: Spacing.base,
  },
  badgeCard: {
    width: 156,
    padding: Spacing.md,
    borderRadius: Radius.lg,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'space-between',
    ...Shadow.sm,
  },
  badgeIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  badgeTitle: {
    fontSize: 12,
    fontWeight: '700',
    textAlign: 'center',
    marginTop: Spacing.xs,
    lineHeight: 15,
  },
  progressTrack: {
    height: 4,
    width: '100%',
    borderRadius: 2,
    marginTop: Spacing.xs + 2,
    overflow: 'hidden',
  },
  progressFill: {
    height: 4,
    borderRadius: 2,
  },
});

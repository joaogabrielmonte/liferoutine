import React, { useState } from 'react';
import {
  View,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { useTheme } from '@/hooks/useTheme';
import { useHabitsStore, useTodayHabits, useTodayCompletion } from '@/stores/useHabitsStore';
import { AppText } from '@/components/atoms/AppText';
import { AppCard } from '@/components/atoms/AppCard';
import { ProgressRing } from '@/components/molecules/ProgressRing';
import { HabitCard } from '@/components/molecules/HabitCard';
import { HabitOptionsModal } from '@/components/molecules/HabitOptionsModal';
import { EditTargetModal } from '@/components/molecules/EditTargetModal';
import { DateStripSelector } from '@/components/molecules/DateStripSelector';
import { BadgesSection } from '@/components/molecules/BadgesSection';
import { CreateHabitModal } from '@/components/organisms/CreateHabitModal';
import { WaterCounterModal } from '@/components/organisms/WaterCounterModal';
import { ExerciseTimerModal } from '@/components/organisms/ExerciseTimerModal';
import { GenericHabitCounterModal } from '@/components/organisms/GenericHabitCounterModal';
import { Spacing, Palette } from '@/constants/theme';
import type { HabitWithLogs } from '@/types/habit';

function getGreeting(name: string = 'Gabriel'): string {
  const hour = new Date().getHours();
  let timeGreeting = 'Bom dia';
  if (hour >= 12 && hour < 18) timeGreeting = 'Boa tarde';
  if (hour >= 18 || hour < 5) timeGreeting = 'Boa noite';

  return `${timeGreeting}, ${name}`;
}

function formatDate(dateObj?: Date): string {
  const d = dateObj ?? new Date();
  const str = d.toLocaleDateString('pt-BR', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  });
  return str.charAt(0).toUpperCase() + str.slice(1);
}

function getTodayFormatted(): string {
  const d = new Date();
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export default function HomeScreen() {
  const { colors, isDark } = useTheme();
  const { deleteHabit, archiveHabit, updateHabit } = useHabitsStore();
  const [selectedDate, setSelectedDate] = useState<string>(getTodayFormatted());
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [selectedOptionHabit, setSelectedOptionHabit] = useState<HabitWithLogs | null>(null);
  const [editingHabit, setEditingHabit] = useState<HabitWithLogs | null>(null);
  const [activeWaterHabit, setActiveWaterHabit] = useState<HabitWithLogs | null>(null);
  const [activeExerciseHabit, setActiveExerciseHabit] = useState<HabitWithLogs | null>(null);
  const [activeGenericHabit, setActiveGenericHabit] = useState<HabitWithLogs | null>(null);

  const todayHabits = useTodayHabits();
  const completion = useTodayCompletion();

  const handleHabitPress = (habit: HabitWithLogs) => {
    const titleLower = habit.title.toLowerCase();
    if (habit.id === '1' || titleLower.includes('agua') || titleLower.includes('água')) {
      setActiveWaterHabit(habit);
    } else if (
      habit.id === '2' ||
      titleLower.includes('exerc') ||
      titleLower.includes('treino')
    ) {
      setActiveExerciseHabit(habit);
    } else {
      setActiveGenericHabit(habit);
    }
  };

  const completedCount = todayHabits.filter((h) => h.isCompletedToday).length;
  const totalCount = todayHabits.length;
  const progressPercent = Math.round(completion * 100);

  const progressLabel =
    completedCount === 0
      ? 'Vamos começar!'
      : completedCount === totalCount
      ? 'Tudo concluído!'
      : 'Ótimo progresso!';

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
        <Animated.View
          entering={FadeInDown.delay(0).duration(500)}
          style={styles.header}
        >
          <View>
            <AppText variant="caption" color="textSecondary">
              {formatDate()}
            </AppText>
            <AppText variant="h2">{getGreeting()}</AppText>
          </View>

          <TouchableOpacity
            style={[
              styles.iconBtn,
              { backgroundColor: colors.surface, borderColor: colors.border },
            ]}
          >
            <Ionicons name="notifications-outline" size={20} color={colors.icon} />
          </TouchableOpacity>
        </Animated.View>

        {/* Date Selector Strip (Past & Present Calendar Navigation) */}
        <Animated.View entering={FadeInDown.delay(50).duration(500)}>
          <DateStripSelector
            selectedDate={selectedDate}
            onSelectDate={setSelectedDate}
          />
        </Animated.View>

        {/* Progress Card */}
        <Animated.View entering={FadeInDown.delay(100).duration(500)}>
          <AppCard
            style={[
              styles.progressCard,
              {
                backgroundColor: isDark
                  ? colors.surfaceElevated
                  : colors.primary,
              },
            ]}
            elevated
          >
            <View style={styles.progressRow}>
              <View style={styles.progressTextCol}>
                <AppText
                  variant="caption"
                  style={{
                    color: isDark ? colors.primary : Palette.primary100,
                    textTransform: 'uppercase',
                    letterSpacing: 1,
                  }}
                >
                  {progressLabel}
                </AppText>
                <AppText
                  variant="h2"
                  style={{
                    color: isDark ? colors.text : '#FFFFFF',
                    marginTop: 4,
                  }}
                >
                  {completedCount} de {totalCount} hábitos
                </AppText>

                <AppText
                  variant="caption"
                  style={{
                    color: isDark ? colors.textSecondary : Palette.primary200,
                    marginTop: 4,
                  }}
                >
                  {progressPercent === 100
                    ? 'Parabéns! Meta do dia atingida!'
                    : `Faltam ${totalCount - completedCount} hábitos para concluir hoje`}
                </AppText>
              </View>

              <ProgressRing
                progress={completion}
                size={80}
                strokeWidth={8}
                color={isDark ? colors.primary : '#FFFFFF'}
                label={`${progressPercent}%`}
              />
            </View>

            {/* Mini progress bar */}
            <View
              style={[
                styles.miniProgressTrack,
                { backgroundColor: 'rgba(255,255,255,0.2)' },
              ]}
            >
              <View
                style={[
                  styles.miniProgressFill,
                  {
                    width: `${progressPercent}%`,
                    backgroundColor: isDark ? colors.primary : '#FFFFFF',
                  },
                ]}
              />
            </View>
          </AppCard>
        </Animated.View>

        {/* Badges & Achievements Section */}
        <Animated.View entering={FadeInDown.delay(150).duration(500)}>
          <BadgesSection habits={todayHabits} />
        </Animated.View>

        {/* Hábitos de hoje */}
        <Animated.View
          entering={FadeInDown.delay(200).duration(500)}
          style={styles.section}
        >
          <View style={styles.sectionHeader}>
            <AppText variant="title">Hábitos de Hoje</AppText>
            <TouchableOpacity
              onPress={() => setIsCreateModalOpen(true)}
              style={[
                styles.addBtn,
                { backgroundColor: colors.primaryLight },
              ]}
            >
              <Ionicons name="add" size={16} color={colors.primary} />
              <AppText
                style={{
                  color: colors.primary,
                  fontSize: 13,
                  fontWeight: '600',
                  marginLeft: 4,
                }}
              >
                Novo
              </AppText>
            </TouchableOpacity>
          </View>

          {todayHabits.length === 0 ? (
            <AppCard style={styles.emptyCard}>
              <Ionicons
                name="leaf-outline"
                size={32}
                color={colors.textSecondary}
                style={{ marginBottom: Spacing.sm }}
              />
              <AppText variant="body" color="textSecondary" align="center">
                Nenhum hábito para hoje.{'\n'}Adicione um novo hábito!
              </AppText>
            </AppCard>
          ) : (
            todayHabits.map((habit, i) => (
              <Animated.View
                key={habit.id}
                entering={FadeInDown.delay(250 + i * 60).duration(400)}
              >
                <HabitCard
                  habit={habit}
                  onPress={() => handleHabitPress(habit)}
                  onLongPress={() => setSelectedOptionHabit(habit)}
                  onOptionsPress={() => setSelectedOptionHabit(habit)}
                />
              </Animated.View>
            ))
          )}
        </Animated.View>

        <View style={{ height: Spacing['3xl'] }} />
      </ScrollView>

      {/* Habit Options Modal */}
      <HabitOptionsModal
        visible={!!selectedOptionHabit}
        habit={selectedOptionHabit}
        onClose={() => setSelectedOptionHabit(null)}
        onOpenHabit={(h) => handleHabitPress(h)}
        onEdit={(h) => setEditingHabit(h)}
        onArchive={async (id) => {
          await archiveHabit(id);
        }}
        onDelete={async (id) => {
          await deleteHabit(id);
        }}
      />

      {/* Edit Target / Habit Goal Modal */}
      {editingHabit && (
        <EditTargetModal
          visible={!!editingHabit}
          title={editingHabit.title}
          unit={editingHabit.unit || 'vezes'}
          currentTarget={editingHabit.targetCount || 1}
          presets={[1, 5, 10, 15, 20, 30]}
          onClose={() => setEditingHabit(null)}
          onSave={(newTarget) => {
            updateHabit(editingHabit.id, { targetCount: newTarget });
            setEditingHabit(null);
          }}
        />
      )}

      {/* Create Habit Modal */}
      <CreateHabitModal
        visible={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
      />

      {/* Interactive Generic Habit Counter Modal (Meditar, Ler, Custom Habits) */}
      <GenericHabitCounterModal
        visible={!!activeGenericHabit}
        habit={activeGenericHabit}
        onClose={() => setActiveGenericHabit(null)}
      />

      {/* Interactive Water Modal */}
      <WaterCounterModal
        visible={!!activeWaterHabit}
        habit={activeWaterHabit}
        onClose={() => setActiveWaterHabit(null)}
      />

      {/* Interactive Exercise Timer Modal */}
      <ExerciseTimerModal
        visible={!!activeExerciseHabit}
        habit={activeExerciseHabit}
        onClose={() => setActiveExerciseHabit(null)}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
  },
  scroll: {
    paddingHorizontal: Spacing.base,
    paddingTop: Spacing.md,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  iconBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: StyleSheet.hairlineWidth,
    alignItems: 'center',
    justifyContent: 'center',
  },
  progressCard: {
    marginBottom: Spacing.base,
    borderRadius: 20,
    padding: Spacing.lg,
  },
  progressRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  progressTextCol: {
    flex: 1,
    paddingRight: Spacing.md,
  },
  miniProgressTrack: {
    height: 6,
    borderRadius: 3,
    marginTop: Spacing.md,
    overflow: 'hidden',
  },
  miniProgressFill: {
    height: 6,
    borderRadius: 3,
  },
  section: {
    marginBottom: Spacing.xl,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  addBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
    borderRadius: 99,
  },
  emptyCard: {
    paddingVertical: Spacing['2xl'],
    alignItems: 'center',
  },
});

import React, { useState } from 'react';
import {
  View,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { useTheme } from '@/hooks/useTheme';
import { useHabitsStore, useTodayHabits } from '@/stores/useHabitsStore';
import { AppText } from '@/components/atoms/AppText';
import { AppCard } from '@/components/atoms/AppCard';
import { HabitCard } from '@/components/molecules/HabitCard';
import { HabitOptionsModal } from '@/components/molecules/HabitOptionsModal';
import { EditTargetModal } from '@/components/molecules/EditTargetModal';
import { CreateHabitModal } from '@/components/organisms/CreateHabitModal';
import { WaterCounterModal } from '@/components/organisms/WaterCounterModal';
import { ExerciseTimerModal } from '@/components/organisms/ExerciseTimerModal';
import { GenericHabitCounterModal } from '@/components/organisms/GenericHabitCounterModal';
import { Spacing, Radius, Shadow } from '@/constants/theme';
import type { HabitWithLogs } from '@/types/habit';

const CATEGORY_CHIPS = [
  { label: 'Todos', value: 'all' },
  { label: 'Saúde', value: 'health' },
  { label: 'Fitness', value: 'fitness' },
  { label: 'Mente', value: 'mindfulness' },
  { label: 'Aprendizado', value: 'learning' },
  { label: 'Produtividade', value: 'productivity' },
];

export default function HabitsScreen() {
  const { colors } = useTheme();
  const { deleteHabit, archiveHabit, updateHabit } = useHabitsStore();
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [selectedOptionHabit, setSelectedOptionHabit] = useState<HabitWithLogs | null>(null);
  const [editingHabit, setEditingHabit] = useState<HabitWithLogs | null>(null);
  const [activeWaterHabit, setActiveWaterHabit] = useState<HabitWithLogs | null>(null);
  const [activeExerciseHabit, setActiveExerciseHabit] = useState<HabitWithLogs | null>(null);
  const [activeGenericHabit, setActiveGenericHabit] = useState<HabitWithLogs | null>(null);

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');

  const habits = useTodayHabits();

  // Filter habits by search and category
  const filteredHabits = habits.filter((h) => {
    const matchesSearch =
      h.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (h.description && h.description.toLowerCase().includes(searchQuery.toLowerCase()));

    const matchesCategory =
      selectedCategory === 'all' || h.category === selectedCategory;

    return matchesSearch && matchesCategory;
  });

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

  const handleHabitLongPress = (habit: HabitWithLogs) => {
    setSelectedOptionHabit(habit);
  };

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
          entering={FadeInDown.duration(400)}
          style={styles.header}
        >
          <View>
            <AppText variant="h2">Seus Hábitos</AppText>
            <AppText variant="caption" color="textSecondary">
              {filteredHabits.length} de {habits.length} hábitos exibidos
            </AppText>
          </View>
          <TouchableOpacity
            onPress={() => setIsCreateModalOpen(true)}
            style={[styles.primaryBtn, { backgroundColor: colors.primary }]}
            activeOpacity={0.8}
          >
            <Ionicons name="add" size={26} color="#FFF" />
          </TouchableOpacity>
        </Animated.View>

        {/* Search bar */}
        <Animated.View entering={FadeInDown.delay(100).duration(400)}>
          <View
            style={[
              styles.searchBar,
              { backgroundColor: colors.surface, borderColor: colors.border },
            ]}
          >
            <Ionicons
              name="search-outline"
              size={18}
              color={colors.textSecondary}
            />
            <TextInput
              style={[styles.searchInput, { color: colors.text }]}
              placeholder="Buscar hábitos..."
              placeholderTextColor={colors.textTertiary}
              value={searchQuery}
              onChangeText={setSearchQuery}
            />
            {searchQuery !== '' && (
              <TouchableOpacity onPress={() => setSearchQuery('')}>
                <Ionicons name="close-circle" size={18} color={colors.textSecondary} />
              </TouchableOpacity>
            )}
          </View>
        </Animated.View>

        {/* Category chips */}
        <Animated.View entering={FadeInDown.delay(150).duration(400)}>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            style={styles.categories}
          >
            {CATEGORY_CHIPS.map((chip) => {
              const isSelected = selectedCategory === chip.value;
              return (
                <TouchableOpacity
                  key={chip.value}
                  style={[
                    styles.chip,
                    {
                      backgroundColor: isSelected ? colors.primary : colors.surface,
                      borderColor: isSelected ? colors.primary : colors.border,
                    },
                  ]}
                  onPress={() => setSelectedCategory(chip.value)}
                >
                  <AppText
                    style={{
                      fontSize: 13,
                      fontWeight: '600',
                      color: isSelected ? '#FFF' : colors.textSecondary,
                    }}
                  >
                    {chip.label}
                  </AppText>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        </Animated.View>

        {/* Habits list */}
        <Animated.View
          entering={FadeInDown.delay(200).duration(400)}
          style={styles.section}
        >
          <View style={styles.sectionHeaderRow}>
            <AppText variant="title">Hábitos Ativos</AppText>
            <AppText variant="caption" color="textSecondary">
              Pressione e segure para gerenciar
            </AppText>
          </View>

          {filteredHabits.length === 0 ? (
            <AppCard style={styles.empty}>
              <Ionicons
                name="leaf-outline"
                size={36}
                color={colors.textSecondary}
                style={{ marginBottom: Spacing.sm }}
              />
              <AppText variant="body" color="textSecondary" align="center">
                Nenhum hábito encontrado.{'\n'}Clique no botão + acima para criar!
              </AppText>
            </AppCard>
          ) : (
            filteredHabits.map((h, i) => (
              <Animated.View
                key={h.id}
                entering={FadeInDown.delay(220 + i * 40).duration(400)}
              >
                <HabitCard
                  habit={h}
                  onPress={() => handleHabitPress(h)}
                  onLongPress={() => handleHabitLongPress(h)}
                  onOptionsPress={() => handleHabitLongPress(h)}
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
  safe: { flex: 1 },
  scroll: { paddingHorizontal: Spacing.base, paddingTop: Spacing.md },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.xl,
  },
  primaryBtn: {
    width: 46,
    height: 46,
    borderRadius: 23,
    alignItems: 'center',
    justifyContent: 'center',
    ...Shadow.sm,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.md,
    height: 46,
    borderRadius: Radius.md,
    borderWidth: StyleSheet.hairlineWidth,
    marginBottom: Spacing.md,
  },
  searchInput: {
    flex: 1,
    marginLeft: Spacing.sm,
    fontSize: 14,
  },
  categories: {
    marginBottom: Spacing.xl,
  },
  chip: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs + 2,
    borderRadius: 99,
    borderWidth: 1.5,
    marginRight: Spacing.sm,
  },
  section: { marginBottom: Spacing.xl },
  sectionHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: Spacing.md,
  },
  empty: {
    paddingVertical: Spacing['2xl'],
    alignItems: 'center',
  },
});

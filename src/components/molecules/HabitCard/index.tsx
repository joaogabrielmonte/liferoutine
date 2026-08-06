import React from 'react';
import { View, Pressable, StyleSheet } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
} from 'react-native-reanimated';
import { MaterialCommunityIcons, Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/hooks/useTheme';
import { useHabitsStore } from '@/stores/useHabitsStore';
import { AppText } from '@/components/atoms/AppText';
import { Radius, Spacing, Shadow } from '@/constants/theme';
import type { HabitWithLogs } from '@/types/habit';

type HabitCardProps = {
  habit: HabitWithLogs;
  onToggle?: () => void;
  onPress?: () => void;
  onLongPress?: () => void;
  onOptionsPress?: () => void;
};

export function HabitCard({
  habit,
  onToggle,
  onPress,
  onLongPress,
  onOptionsPress,
}: HabitCardProps) {
  const { colors, isDark } = useTheme();
  const { toggleHabitToday, incrementHabitToday } = useHabitsStore();
  const scale = useSharedValue(1);

  const animStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const handlePressIn = () => {
    scale.value = withSpring(0.98, { damping: 15 });
  };
  const handlePressOut = () => {
    scale.value = withSpring(1, { damping: 15 });
  };

  const currentCount = habit.todayLog?.completedCount ?? 0;
  const targetCount = habit.targetCount ?? 1;
  const isCompleted = habit.isCompletedToday || currentCount >= targetCount;
  const isCounter = targetCount > 1;

  const handleMainPress = () => {
    if (onPress) {
      onPress();
    } else if (isCounter) {
      incrementHabitToday(habit.id, 1);
    } else if (onToggle) {
      onToggle();
    } else {
      toggleHabitToday(habit.id);
    }
  };

  const triggerOptions = onOptionsPress || onLongPress;

  return (
    <Animated.View style={[animStyle, styles.animatedWrapper]}>
      <Pressable
        style={[
          styles.container,
          { backgroundColor: colors.surface, borderColor: colors.border },
        ]}
        onPress={handleMainPress}
        onLongPress={triggerOptions}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        delayLongPress={350}
      >
        {/* Left: Habit Category Icon + Title & Description */}
        <View style={styles.left}>
          <View
            style={[
              styles.iconContainer,
              { backgroundColor: isCompleted ? habit.color : `${habit.color}22` },
            ]}
          >
            <MaterialCommunityIcons
              name={(habit.icon as any) || 'target'}
              size={22}
              color={isCompleted ? '#FFFFFF' : habit.color}
            />
          </View>

          <View style={styles.info}>
            <View style={styles.titleRow}>
              <AppText
                variant="bodyMedium"
                style={
                  isCompleted
                    ? { textDecorationLine: 'line-through', opacity: 0.5 }
                    : undefined
                }
                numberOfLines={1}
              >
                {habit.title}
              </AppText>
            </View>

            <AppText variant="caption" color="textSecondary" numberOfLines={1}>
              {isCounter
                ? `${currentCount} de ${targetCount} ${habit.unit ?? 'vezes'}`
                : habit.description || 'Habilidade diária'}
            </AppText>

            {/* Progress track */}
            <View
              style={[styles.progressTrack, { backgroundColor: colors.border }]}
            >
              <View
                style={[
                  styles.progressFill,
                  {
                    width: `${
                      isCompleted
                        ? 100
                        : targetCount > 0
                        ? Math.min(100, Math.round((currentCount / targetCount) * 100))
                        : Math.round((habit.completionRate || 0) * 100)
                    }%`,
                    backgroundColor: habit.color,
                  },
                ]}
              />
            </View>
          </View>
        </View>

        {/* Right Section: Interactive Counter Pill / Checkbox + Vector 3-Dots Options */}
        <View style={styles.rightSection}>
          {/* Interactive Counter Badge or Checkbox (No cramped +/- buttons) */}
          <Pressable
            style={[
              styles.counterPill,
              {
                backgroundColor: isCompleted
                  ? habit.color
                  : isDark
                  ? `${habit.color}1E`
                  : `${habit.color}14`,
                borderColor: habit.color,
              },
            ]}
            onPress={handleMainPress}
          >
            {isCompleted ? (
              <View style={styles.completedBadgeRow}>
                <Ionicons name="checkmark-circle" size={16} color="#FFFFFF" />
                <AppText style={styles.completedText}>Concluído</AppText>
              </View>
            ) : (
              <AppText style={[styles.counterPillText, { color: habit.color }]}>
                {isCounter ? `${currentCount}/${targetCount}` : '+1'}
              </AppText>
            )}
          </Pressable>

          {/* Dedicated Vector Options Button (3-dots) */}
          {triggerOptions && (
            <Pressable
              style={({ pressed }) => [
                styles.optionsBtn,
                { opacity: pressed ? 0.5 : 1 },
              ]}
              onPress={triggerOptions}
              hitSlop={{ top: 10, bottom: 10, left: 6, right: 6 }}
            >
              <Ionicons
                name="ellipsis-vertical"
                size={18}
                color={colors.textTertiary}
              />
            </Pressable>
          )}
        </View>
      </Pressable>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  animatedWrapper: {
    marginBottom: Spacing.sm,
  },
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.base,
    borderRadius: Radius.lg,
    borderWidth: StyleSheet.hairlineWidth,
    ...Shadow.sm,
  },
  left: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    paddingRight: Spacing.xs,
  },
  iconContainer: {
    width: 44,
    height: 44,
    borderRadius: Radius.md,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: Spacing.sm,
  },
  info: {
    flex: 1,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  progressTrack: {
    height: 4,
    borderRadius: 2,
    marginTop: Spacing.xs,
    overflow: 'hidden',
  },
  progressFill: {
    height: 4,
    borderRadius: 2,
  },
  rightSection: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  counterPill: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: Radius.full,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: 54,
  },
  counterPillText: {
    fontSize: 12,
    fontWeight: '700',
  },
  completedBadgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  completedText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  optionsBtn: {
    padding: 6,
    marginLeft: 2,
  },
});

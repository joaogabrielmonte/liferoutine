import React, { useState, useEffect } from 'react';
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
  withRepeat,
  withTiming,
  withSequence,
  Easing,
  cancelAnimation,
} from 'react-native-reanimated';
import Svg, { Circle, Line, G, Defs, LinearGradient, Stop } from 'react-native-svg';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useTheme } from '@/hooks/useTheme';
import { useHabitsStore, useTodayHabits } from '@/stores/useHabitsStore';
import { AppText } from '@/components/atoms/AppText';
import { AppButton } from '@/components/atoms/AppButton';
import { EditTargetModal } from '@/components/molecules/EditTargetModal';
import {
  scheduleExerciseAlarm,
  triggerExerciseTargetAlarm,
} from '@/services/notifications';
import { Radius, Spacing, Shadow } from '@/constants/theme';
import type { HabitWithLogs } from '@/types/habit';

type ExerciseTimerModalProps = {
  visible: boolean;
  habit: HabitWithLogs | null;
  onClose: () => void;
};

export function ExerciseTimerModal({
  visible,
  habit: initialHabit,
  onClose,
}: ExerciseTimerModalProps) {
  const { colors, isDark } = useTheme();
  const { incrementHabitToday, decrementHabitToday, updateHabit } = useHabitsStore();
  const todayHabits = useTodayHabits();

  const [isEditTargetOpen, setIsEditTargetOpen] = useState(false);
  const [isTimerRunning, setIsTimerRunning] = useState(false);
  const [secondsElapsed, setSecondsElapsed] = useState(0);

  // Find live habit from store so it updates instantly in real-time
  const habit =
    todayHabits.find((h) => h.id === initialHabit?.id) ?? initialHabit;

  const rotation = useSharedValue(0);
  const pulseScale = useSharedValue(1);

  const currentMin = habit?.todayLog?.completedCount ?? 0;
  const targetMin = habit?.targetCount || 30;
  const progressRatio = Math.min(1, currentMin / targetMin);
  const percentage = Math.round(progressRatio * 100);

  // Synchronize secondsElapsed whenever habit or modal visibility changes while paused
  useEffect(() => {
    if (!isTimerRunning) {
      setSecondsElapsed(currentMin * 60);
    }
  }, [currentMin, visible]);

  // SVG Canvas Parameters - Canvas 220x220 gives ample space
  const SVG_SIZE = 220;
  const CENTER = SVG_SIZE / 2;
  const STROKE_WIDTH = 12;
  const RADIUS = 75;
  const CIRCUMFERENCE = 2 * Math.PI * RADIUS;
  const strokeDashoffset = CIRCUMFERENCE * (1 - progressRatio);

  // Live Workout Timer Loop
  useEffect(() => {
    let interval: any = null;
    if (isTimerRunning && habit) {
      rotation.value = withRepeat(
        withTiming(360, { duration: 3000, easing: Easing.linear }),
        -1
      );
      pulseScale.value = withRepeat(
        withSequence(
          withTiming(1.03, { duration: 800 }),
          withTiming(1, { duration: 800 })
        ),
        -1
      );

      interval = setInterval(() => {
        setSecondsElapsed((prev) => {
          const next = prev + 1;
          if (next % 60 === 0 && habit) {
            incrementHabitToday(habit.id, 1);
            const newMins = Math.floor(next / 60);
            if (newMins >= targetMin) {
              triggerExerciseTargetAlarm(targetMin);
            }
          }
          return next;
        });
      }, 1000);
    } else {
      cancelAnimation(rotation);
      cancelAnimation(pulseScale);
      pulseScale.value = withTiming(1);
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isTimerRunning, habit, targetMin]);

  const clockHandStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: `${rotation.value}deg` }],
  }));

  const pulseContainerStyle = useAnimatedStyle(() => ({
    transform: [{ scale: pulseScale.value }],
  }));

  if (!habit) return null;

  const toggleTimer = () => {
    setIsTimerRunning(!isTimerRunning);
  };

  const handleAddMinutes = (min: number) => {
    incrementHabitToday(habit.id, min);
    if (!isTimerRunning) {
      setSecondsElapsed((prev) => prev + min * 60);
    }
  };

  const handleRemoveMinutes = (min: number) => {
    decrementHabitToday(habit.id, min);
    if (!isTimerRunning) {
      setSecondsElapsed((prev) => Math.max(0, prev - min * 60));
    }
  };

  const handleSaveTarget = (newTarget: number) => {
    updateHabit(habit.id, { targetCount: newTarget });
  };

  const handleScheduleExerciseAlarm = async (minutes: number) => {
    const seconds = Math.round(minutes * 60);
    const ok = await scheduleExerciseAlarm(seconds);
    if (ok) {
      Alert.alert(
        '⚡ Alarme de Treino Agendado!',
        `Um alarme de treino tocará no celular em ${minutes < 1 ? '10 segundos' : `${minutes} minutos`}.`
      );
    }
  };

  const formatTimerSeconds = (totalSec: number) => {
    const mins = Math.floor(totalSec / 60);
    const secs = totalSec % 60;
    return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
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
              <View style={[styles.badgeIcon, { backgroundColor: '#F59E0B22' }]}>
                <MaterialCommunityIcons name="lightning-bolt" size={24} color="#F59E0B" />
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
                    {currentMin} min de {targetMin} min meta de hoje
                  </AppText>
                  <Ionicons name="pencil" size={14} color="#F59E0B" style={{ marginLeft: 4 }} />
                </TouchableOpacity>
              </View>
            </View>

            <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
              <Ionicons name="close" size={24} color={colors.icon} />
            </TouchableOpacity>
          </View>

          {/* High-End Clean Vector SVG Watch Face Section */}
          <View style={styles.clockSection}>
            <Animated.View
              style={[
                styles.watchContainer,
                pulseContainerStyle,
                {
                  backgroundColor: isDark ? '#0F172A' : '#FAFAFA',
                  borderColor: isTimerRunning
                    ? '#F59E0B'
                    : isDark
                    ? 'rgba(245,158,11,0.2)'
                    : '#E2E8F0',
                },
              ]}
            >
              {/* SVG Ring with Progress Arc & Tick Marks */}
              <Svg width={SVG_SIZE} height={SVG_SIZE} style={styles.svgAbsolute}>
                <Defs>
                  <LinearGradient id="amberGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                    <Stop offset="0%" stopColor="#FBBF24" />
                    <Stop offset="50%" stopColor="#F59E0B" />
                    <Stop offset="100%" stopColor="#D97706" />
                  </LinearGradient>
                </Defs>

                {/* Outer Track Circle */}
                <Circle
                  cx={CENTER}
                  cy={CENTER}
                  r={RADIUS}
                  stroke={isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)'}
                  strokeWidth={STROKE_WIDTH}
                  fill="none"
                />

                {/* Progress Arc */}
                <Circle
                  cx={CENTER}
                  cy={CENTER}
                  r={RADIUS}
                  stroke="url(#amberGradient)"
                  strokeWidth={STROKE_WIDTH}
                  strokeDasharray={CIRCUMFERENCE}
                  strokeDashoffset={strokeDashoffset}
                  strokeLinecap="round"
                  fill="none"
                  transform={`rotate(-90 ${CENTER} ${CENTER})`}
                />

                {/* 12 Perimeter Dial Ticks */}
                <G transform={`translate(${CENTER}, ${CENTER})`}>
                  {Array.from({ length: 12 }).map((_, i) => {
                    const angle = (i * 30 * Math.PI) / 180;
                    const rInner = RADIUS - 16;
                    const rOuter = RADIUS - 10;
                    const x1 = Math.sin(angle) * rInner;
                    const y1 = -Math.cos(angle) * rInner;
                    const x2 = Math.sin(angle) * rOuter;
                    const y2 = -Math.cos(angle) * rOuter;
                    const isMain = i % 3 === 0;

                    return (
                      <Line
                        key={i}
                        x1={x1}
                        y1={y1}
                        x2={x2}
                        y2={y2}
                        stroke={
                          isMain
                            ? '#F59E0B'
                            : isDark
                            ? 'rgba(255,255,255,0.2)'
                            : 'rgba(0,0,0,0.15)'
                        }
                        strokeWidth={isMain ? 2.5 : 1.5}
                        strokeLinecap="round"
                      />
                    );
                  })}
                </G>
              </Svg>

              {/* Rotating Glowing Indicator Dot */}
              <Animated.View
                style={[
                  styles.rotatingDotWrapper,
                  clockHandStyle,
                  { width: SVG_SIZE, height: SVG_SIZE },
                ]}
              >
                <View style={[styles.glowingDot, { top: CENTER - RADIUS - 6 }]} />
              </Animated.View>

              {/* Center Digital Display (Preserves exact seconds when paused) */}
              <View style={styles.clockCenterText}>
                <AppText
                  style={[
                    styles.displayValueText,
                    { color: isDark ? '#FFFFFF' : '#0F172A' },
                  ]}
                >
                  {formatTimerSeconds(secondsElapsed)}
                </AppText>

                <AppText
                  variant="caption"
                  style={{
                    color: isTimerRunning ? '#EF4444' : '#F59E0B',
                    fontWeight: '700',
                    fontSize: 11,
                    textTransform: 'uppercase',
                    letterSpacing: 0.5,
                    marginBottom: 4,
                  }}
                >
                  {isTimerRunning ? 'em andamento' : 'pausado'}
                </AppText>

                <View
                  style={[
                    styles.percentageBadge,
                    { backgroundColor: isDark ? 'rgba(245,158,11,0.18)' : '#FEF3C7' },
                  ]}
                >
                  <AppText variant="caption" style={{ color: '#D97706', fontWeight: '700', fontSize: 11 }}>
                    {percentage}% • {currentMin}/{targetMin} min
                  </AppText>
                </View>
              </View>
            </Animated.View>
          </View>

          {/* Live Workout Timer Control Button */}
          <View style={styles.timerControlRow}>
            <TouchableOpacity
              style={[
                styles.timerPlayBtn,
                { backgroundColor: isTimerRunning ? '#EF4444' : '#F59E0B' },
              ]}
              onPress={toggleTimer}
              activeOpacity={0.8}
            >
              <Ionicons
                name={isTimerRunning ? 'pause' : 'play'}
                size={22}
                color="#FFFFFF"
              />
              <AppText style={styles.timerPlayText}>
                {isTimerRunning ? 'Pausar Treino ao Vivo' : 'Iniciar Treino ao Vivo'}
              </AppText>
            </TouchableOpacity>
          </View>

          {/* Quick Alarm Scheduler Bar */}
          <AppText variant="label" color="textSecondary" style={{ marginTop: 4, marginBottom: 4 }}>
            🔔 Agendar Alarme de Treino:
          </AppText>
          <View style={styles.alarmRow}>
            {[
              { label: 'Alarme 2 min', min: 2 },
              { label: 'Alarme 5 min', min: 5 },
              { label: 'Testar (10s)', min: 0.16 },
            ].map(({ label, min }) => (
              <TouchableOpacity
                key={label}
                style={[
                  styles.alarmChip,
                  { backgroundColor: colors.background, borderColor: colors.border },
                ]}
                onPress={() => handleScheduleExerciseAlarm(min)}
              >
                <AppText style={{ fontSize: 11, fontWeight: '700', color: colors.text }}>
                  {label}
                </AppText>
              </TouchableOpacity>
            ))}
          </View>

          {/* Quick Minute Add Buttons */}
          <AppText
            variant="label"
            color="textSecondary"
            style={{ marginTop: 2, marginBottom: 4 }}
          >
            Adicionar Minutos Rápidos
          </AppText>
          <View style={styles.actionGrid}>
            {[5, 10, 15, 30].map((min) => (
              <TouchableOpacity
                key={min}
                style={[
                  styles.quickAddBtn,
                  { backgroundColor: colors.background, borderColor: colors.border },
                ]}
                onPress={() => handleAddMinutes(min)}
                activeOpacity={0.7}
              >
                <AppText style={[styles.quickAddText, { color: colors.text }]}>
                  +{min} min
                </AppText>
              </TouchableOpacity>
            ))}
          </View>

          {/* Bottom Secondary Controls */}
          <View style={styles.secondaryRow}>
            <TouchableOpacity
              style={[
                styles.minorBtn,
                { backgroundColor: colors.background, borderColor: colors.border },
              ]}
              onPress={() => handleRemoveMinutes(5)}
              disabled={currentMin === 0}
            >
              <Ionicons name="remove" size={18} color={colors.text} />
              <AppText variant="caption" style={{ marginLeft: 4 }}>
                -5 min
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
            title="Exercício"
            unit="min"
            currentTarget={targetMin}
            presets={[15, 20, 30, 45, 60, 90]}
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
    maxWidth: 370,
    borderRadius: Radius['2xl'],
    padding: Spacing.lg,
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
    width: 40,
    height: 40,
    borderRadius: Radius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  closeBtn: {
    padding: Spacing.xs,
  },
  clockSection: {
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: Spacing.xs,
  },
  watchContainer: {
    width: 220,
    height: 220,
    borderRadius: 110,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
    overflow: 'visible',
    ...Shadow.sm,
  },
  svgAbsolute: {
    position: 'absolute',
  },
  rotatingDotWrapper: {
    position: 'absolute',
    alignItems: 'center',
    justifyContent: 'flex-start',
  },
  glowingDot: {
    position: 'absolute',
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#F59E0B',
    shadowColor: '#FBBF24',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 1,
    shadowRadius: 6,
    elevation: 6,
  },
  clockCenterText: {
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 10,
  },
  displayValueText: {
    fontSize: 40,
    fontWeight: '800',
    lineHeight: 46,
    textAlign: 'center',
  },
  percentageBadge: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: 2,
    borderRadius: Radius.full,
    marginTop: 2,
  },
  timerControlRow: {
    marginTop: Spacing.xs,
  },
  timerPlayBtn: {
    height: 46,
    borderRadius: Radius.lg,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    ...Shadow.sm,
  },
  timerPlayText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 14,
  },
  alarmRow: {
    flexDirection: 'row',
    gap: Spacing.xs,
    marginVertical: 2,
  },
  alarmChip: {
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
    paddingVertical: 6,
    paddingHorizontal: Spacing.md,
    borderRadius: Radius.md,
    marginTop: Spacing.xs,
  },
  actionGrid: {
    flexDirection: 'row',
    gap: Spacing.xs,
  },
  quickAddBtn: {
    flex: 1,
    height: 38,
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

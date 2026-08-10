import React, { useEffect, useState } from 'react';
import {
  View,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Switch,
  Modal,
  TextInput,
  Platform,
  DeviceEventEmitter,
} from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { useTheme } from '@/hooks/useTheme';
import { AppText } from '@/components/atoms/AppText';
import { AppCard } from '@/components/atoms/AppCard';
import { useWorkoutStore } from '@/stores/useWorkoutStore';
import * as SecureStore from 'expo-secure-store';
import { Spacing, Radius } from '@/constants/theme';

const STORAGE_SPLITS_KEY = 'liferoutine_custom_splits_v1';

type UserSplitItem = {
  id: string;
  name: string;
  category: string;
  exercises: string[];
};

const DEFAULT_USER_SPLITS: UserSplitItem[] = [
  { id: 's-1', name: 'Treino A - Peito, Ombros & Tríceps', category: 'Push', exercises: [] },
  { id: 's-2', name: 'Treino B - Costas, Trapézio & Bíceps', category: 'Pull', exercises: [] },
  { id: 's-3', name: 'Treino C - Pernas, Quadríceps & Panturrilhas', category: 'Legs', exercises: [] },
];

export function GymWorkoutCard() {
  const { colors, isDark } = useTheme();
  const {
    todayMuscleGroup,
    isWorkoutCompletedToday,
    isCreatineTakenToday,
    workoutTime,
    creatineTime,
    workoutReminderEnabled,
    creatineReminderEnabled,
    loadStore,
    setTodayMuscleGroup,
    toggleWorkoutCompleted,
    toggleCreatineTaken,
    setWorkoutTime,
    setCreatineTime,
    toggleWorkoutReminder,
    toggleCreatineReminder,
  } = useWorkoutStore();

  const [userSplits, setUserSplits] = useState<string[]>([]);
  const [isTimeModalOpen, setIsTimeModalOpen] = useState(false);
  const [tempWorkoutTime, setTempWorkoutTime] = useState(workoutTime);
  const [tempCreatineTime, setTempCreatineTime] = useState(creatineTime);

  useEffect(() => {
    loadStore();
    loadCustomUserSplits();

    const sub = DeviceEventEmitter.addListener('liferoutine_splits_updated', () => {
      loadCustomUserSplits();
    });
    return () => sub.remove();
  }, []);

  const loadCustomUserSplits = async () => {
    try {
      let json: string | null = null;
      if (Platform.OS === 'web' && typeof window !== 'undefined') {
        json = localStorage.getItem(STORAGE_SPLITS_KEY);
      } else if (Platform.OS !== 'web') {
        json = await SecureStore.getItemAsync(STORAGE_SPLITS_KEY);
      }

      if (json) {
        const parsed: UserSplitItem[] = JSON.parse(json);
        if (Array.isArray(parsed) && parsed.length > 0) {
          const names = parsed.map((s) => s.name);
          setUserSplits([...names, 'Descanso Ativo (Off)']);
          return;
        }
      }
    } catch (e) {}

    setUserSplits([
      'Treino A - Peito, Ombros & Tríceps',
      'Treino B - Costas, Trapézio & Bíceps',
      'Treino C - Pernas, Quadríceps & Panturrilhas',
      'Descanso Ativo (Off)',
    ]);
  };

  const cardBg = isDark ? '#172B4D' : '#FFFFFF';
  const borderColor = isDark ? '#253858' : '#DFE1E6';

  const handleSaveTimes = () => {
    setWorkoutTime(tempWorkoutTime);
    setCreatineTime(tempCreatineTime);
    setIsTimeModalOpen(false);
  };

  return (
    <Animated.View entering={FadeInDown.delay(180).duration(400)}>
      <AppCard style={{ padding: Spacing.base, marginBottom: Spacing.lg }}>
        {/* Header */}
        <View style={styles.headerRow}>
          <View style={[styles.iconBox, { backgroundColor: 'rgba(255, 86, 48, 0.15)' }]}>
            <MaterialCommunityIcons name="dumbbell" size={22} color="#FF5630" />
          </View>
          <View style={{ flex: 1, marginLeft: 10 }}>
            <AppText variant="h3" style={{ fontSize: 16, fontWeight: '700' }}>
              Academia & Treino do Dia
            </AppText>
            <AppText variant="caption" color="textSecondary" style={{ fontSize: 12 }}>
              Seus treinos criados em Minhas Divisões
            </AppText>
          </View>
          <TouchableOpacity
            style={[styles.btnSettings, { backgroundColor: isDark ? '#253858' : '#F4F5F7' }]}
            onPress={() => {
              setTempWorkoutTime(workoutTime);
              setTempCreatineTime(creatineTime);
              setIsTimeModalOpen(true);
            }}
          >
            <Ionicons name="alarm-outline" size={18} color={colors.textSecondary} />
          </TouchableOpacity>
        </View>

        {/* Dynamic User Custom Split Selector */}
        <AppText variant="caption" color="textSecondary" style={styles.sectionLabel}>
          SUAS DIVISÕES DE TREINO (SELEÇÃO DO DIA)
        </AppText>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 14 }}>
          <View style={{ flexDirection: 'row', gap: 6 }}>
            {userSplits.map((groupName) => {
              const isSelected = todayMuscleGroup === groupName;
              return (
                <TouchableOpacity
                  key={groupName}
                  style={[
                    styles.chip,
                    {
                      backgroundColor: isSelected ? '#FF5630' : isDark ? '#091E42' : '#F4F5F7',
                      borderColor: isSelected ? '#FF5630' : borderColor,
                    },
                  ]}
                  onPress={() => setTodayMuscleGroup(groupName as any)}
                  activeOpacity={0.8}
                >
                  <AppText
                    style={{
                      fontSize: 12,
                      fontWeight: isSelected ? '700' : '500',
                      color: isSelected ? '#FFFFFF' : colors.text,
                    }}
                  >
                    {groupName}
                  </AppText>
                </TouchableOpacity>
              );
            })}
          </View>
        </ScrollView>

        {/* Action Toggle Buttons */}
        <View style={{ gap: 10 }}>
          {/* Workout Completion Toggle */}
          <TouchableOpacity
            style={[
              styles.actionBtn,
              {
                backgroundColor: isWorkoutCompletedToday ? '#00875A' : '#FF5630',
              },
            ]}
            onPress={toggleWorkoutCompleted}
            activeOpacity={0.85}
          >
            <MaterialCommunityIcons
              name={isWorkoutCompletedToday ? 'checkbox-marked-circle' : 'weight-lifter'}
              size={20}
              color="#FFFFFF"
            />
            <AppText style={styles.actionBtnText}>
              {isWorkoutCompletedToday
                ? `${todayMuscleGroup} Concluído! 🔥`
                : `Marcar ${todayMuscleGroup} Concluído`}
            </AppText>
          </TouchableOpacity>

          {/* Creatine Intake Toggle */}
          <TouchableOpacity
            style={[
              styles.actionBtn,
              {
                backgroundColor: isCreatineTakenToday ? '#0052CC' : isDark ? '#253858' : '#DFE1E6',
              },
            ]}
            onPress={toggleCreatineTaken}
            activeOpacity={0.85}
          >
            <MaterialCommunityIcons
              name={isCreatineTakenToday ? 'bottle-tonic' : 'bottle-tonic-outline'}
              size={20}
              color={isCreatineTakenToday ? '#FFFFFF' : colors.text}
            />
            <AppText
              style={[
                styles.actionBtnText,
                { color: isCreatineTakenToday ? '#FFFFFF' : colors.text },
              ]}
            >
              {isCreatineTakenToday
                ? 'Creatina Diária Tomada (3g-5g) ✅'
                : `Tomar Creatina Diária (${creatineTime})`}
            </AppText>
          </TouchableOpacity>
        </View>

        {/* Alarm Summary Bar */}
        <View style={[styles.alarmBar, { backgroundColor: isDark ? '#091E42' : '#F4F5F7' }]}>
          <View style={styles.alarmItem}>
            <Ionicons name="time-outline" size={14} color="#FF5630" />
            <AppText variant="caption" style={{ fontSize: 11, fontWeight: '600', marginLeft: 4 }}>
              Treino: {workoutTime}
            </AppText>
          </View>

          <View style={styles.alarmItem}>
            <Ionicons name="fitness-outline" size={14} color="#0052CC" />
            <AppText variant="caption" style={{ fontSize: 11, fontWeight: '600', marginLeft: 4 }}>
              Creatina: {creatineTime}
            </AppText>
          </View>
        </View>
      </AppCard>

      {/* Alarm Settings Modal */}
      <Modal
        visible={isTimeModalOpen}
        animationType="fade"
        transparent
        onRequestClose={() => setIsTimeModalOpen(false)}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setIsTimeModalOpen(false)}
        >
          <TouchableOpacity
            activeOpacity={1}
            style={[
              styles.modalCard,
              { backgroundColor: isDark ? '#1E293B' : '#FFFFFF', borderColor },
            ]}
            onPress={(e) => e.stopPropagation?.()}
          >
            <View style={styles.modalHeader}>
              <AppText variant="h3" style={{ fontSize: 16, fontWeight: '700' }}>
                Configurar Lembretes da Academia
              </AppText>
              <TouchableOpacity onPress={() => setIsTimeModalOpen(false)}>
                <Ionicons name="close" size={20} color={colors.icon} />
              </TouchableOpacity>
            </View>

            {/* Workout Reminder */}
            <View style={styles.settingRow}>
              <View style={{ flex: 1 }}>
                <AppText style={{ fontWeight: '600', fontSize: 13 }}>Alarme do Treino</AppText>
                <AppText variant="caption" color="textSecondary">
                  Horário para notificação diária do treino
                </AppText>
              </View>
              <TextInput
                style={[styles.timeInput, { color: colors.text, borderColor }]}
                value={tempWorkoutTime}
                onChangeText={setTempWorkoutTime}
                placeholder="17:00"
                placeholderTextColor={colors.textTertiary}
              />
              <Switch
                value={workoutReminderEnabled}
                onValueChange={toggleWorkoutReminder}
                trackColor={{ false: colors.border, true: '#FF5630' }}
                thumbColor="#FFF"
              />
            </View>

            {/* Creatine Reminder */}
            <View style={styles.settingRow}>
              <View style={{ flex: 1 }}>
                <AppText style={{ fontWeight: '600', fontSize: 13 }}>Lembrete de Creatina</AppText>
                <AppText variant="caption" color="textSecondary">
                  Horário para suplementação diária
                </AppText>
              </View>
              <TextInput
                style={[styles.timeInput, { color: colors.text, borderColor }]}
                value={tempCreatineTime}
                onChangeText={setTempCreatineTime}
                placeholder="09:00"
                placeholderTextColor={colors.textTertiary}
              />
              <Switch
                value={creatineReminderEnabled}
                onValueChange={toggleCreatineReminder}
                trackColor={{ false: colors.border, true: '#0052CC' }}
                thumbColor="#FFF"
              />
            </View>

            <TouchableOpacity
              style={[styles.btnSaveModal, { backgroundColor: colors.primary }]}
              onPress={handleSaveTimes}
            >
              <AppText style={{ color: '#FFF', fontWeight: '700', fontSize: 13 }}>
                Salvar Horários
              </AppText>
            </TouchableOpacity>
          </TouchableOpacity>
        </TouchableOpacity>
      </Modal>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  iconBox: {
    width: 38,
    height: 38,
    borderRadius: Radius.sm,
    alignItems: 'center',
    justifyContent: 'center',
  },
  btnSettings: {
    width: 34,
    height: 34,
    borderRadius: Radius.sm,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sectionLabel: {
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.5,
    marginBottom: 6,
  },
  chip: {
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 16,
    borderWidth: 1,
  },
  actionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderRadius: Radius.sm,
    gap: 8,
  },
  actionBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  alarmBar: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingVertical: 8,
    borderRadius: Radius.xs,
    marginTop: 12,
  },
  alarmItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  modalCard: {
    width: '100%',
    maxWidth: 380,
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  settingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 14,
  },
  timeInput: {
    width: 60,
    height: 36,
    borderWidth: 1,
    borderRadius: 6,
    textAlign: 'center',
    fontSize: 13,
    fontWeight: '700',
  },
  btnSaveModal: {
    height: 42,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 8,
  },
});

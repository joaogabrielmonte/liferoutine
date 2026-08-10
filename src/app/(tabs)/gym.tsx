import React, { useState, useEffect } from 'react';
import {
  View,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  Switch,
  TextInput,
  Modal,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { useTheme } from '@/hooks/useTheme';
import { AppText } from '@/components/atoms/AppText';
import { AppCard } from '@/components/atoms/AppCard';
import { AppToast } from '@/components/atoms/AppToast';
import { GymWorkoutCard } from '@/components/organisms/GymWorkoutCard';
import { FitAIChatModal } from '@/components/organisms/FitAIChatModal';
import { scheduleHabitReminder } from '@/services/notifications';
import * as SecureStore from 'expo-secure-store';
import { Spacing, Radius } from '@/constants/theme';
import type { GeneratedWorkoutSplit } from '@/services/aiWorkoutGenerator';

export type CustomWorkoutSplit = {
  id: string;
  name: string; // e.g. "Treino A - Peito & Tríceps"
  category: string;
  exercises: string[];
  isCompletedToday?: boolean;
};

export type CustomAlarm = {
  id: string;
  title: string;
  time: string; // "17:00"
  enabled: boolean;
  category: 'workout' | 'creatine' | 'water' | 'meal' | 'custom';
  repeatDays: string;
};

const DEFAULT_SPLITS: CustomWorkoutSplit[] = [
  {
    id: 's-1',
    name: 'Treino A - Peito, Ombros & Tríceps',
    category: 'Push',
    exercises: [
      'Supino Reto com Barra (4x10)',
      'Supino Inclinado com Halteres (3x12)',
      'Desenvolvimento com Halteres (4x10)',
      'Elevação Lateral (4x15)',
      'Tríceps Testa na Polia (4x12)',
    ],
  },
  {
    id: 's-2',
    name: 'Treino B - Costas, Trapézio & Bíceps',
    category: 'Pull',
    exercises: [
      'Puxada Frontal Aberta (4x10)',
      'Remada Curvada com Barra (3x12)',
      'Encolhimento com Halteres (4x15)',
      'Rosca Direta no Pulley (4x12)',
      'Rosca Martelo (3x12)',
    ],
  },
  {
    id: 's-3',
    name: 'Treino C - Pernas, Quadríceps & Panturrilhas',
    category: 'Legs',
    exercises: [
      'Agachamento Livre (4x10)',
      'Leg Press 45º (4x12)',
      'Cadeira Extensora (3x15)',
      'Stiff com Halteres (4x10)',
      'Gêmeos Sentado (4x20)',
    ],
  },
];

const DEFAULT_ALARMS: CustomAlarm[] = [
  { id: 'a-1', title: 'Hora do Treino! 🏋️‍♂️', time: '17:00', enabled: true, category: 'workout', repeatDays: 'Seg a Sex' },
  { id: 'a-2', title: 'Tomar Creatina (3g-5g) 🧪', time: '09:00', enabled: true, category: 'creatine', repeatDays: 'Todos os dias' },
  { id: 'a-3', title: 'Hidratação 500ml Água 💧', time: '14:00', enabled: true, category: 'water', repeatDays: 'Todos os dias' },
];

const STORAGE_SPLITS_KEY = 'liferoutine_custom_splits_v1';
const STORAGE_ALARMS_KEY = 'liferoutine_custom_alarms_v1';

export default function GymScreen() {
  const { colors, isDark } = useTheme();
  const [activeTab, setActiveTab] = useState<'splits' | 'alarms'>('splits');

  // Custom Splits State
  const [splits, setSplits] = useState<CustomWorkoutSplit[]>(DEFAULT_SPLITS);
  const [isSplitModalOpen, setIsSplitModalOpen] = useState(false);
  const [isAiModalOpen, setIsAiModalOpen] = useState(false);
  const [newSplitName, setNewSplitName] = useState('');
  const [newSplitCategory, setNewSplitCategory] = useState('');
  const [newSplitExercises, setNewSplitExercises] = useState('');

  // Custom Alarms State
  const [alarms, setAlarms] = useState<CustomAlarm[]>(DEFAULT_ALARMS);
  const [isAlarmModalOpen, setIsAlarmModalOpen] = useState(false);
  const [newAlarmTitle, setNewAlarmTitle] = useState('');
  const [newAlarmTime, setNewAlarmTime] = useState('17:00');
  const [toast, setToast] = useState<{ visible: boolean; title: string; message?: string; type?: 'success' | 'error' | 'info' | 'warning' }>({ visible: false, title: '' });

  useEffect(() => {
    loadGymData();
  }, []);

  const loadGymData = async () => {
    try {
      let splitsJson: string | null = null;
      let alarmsJson: string | null = null;

      if (Platform.OS === 'web' && typeof window !== 'undefined') {
        splitsJson = localStorage.getItem(STORAGE_SPLITS_KEY);
        alarmsJson = localStorage.getItem(STORAGE_ALARMS_KEY);
      } else if (Platform.OS !== 'web') {
        splitsJson = await SecureStore.getItemAsync(STORAGE_SPLITS_KEY);
        alarmsJson = await SecureStore.getItemAsync(STORAGE_ALARMS_KEY);
      }

      if (splitsJson) setSplits(JSON.parse(splitsJson));
      if (alarmsJson) setAlarms(JSON.parse(alarmsJson));
    } catch (e) {}
  };

  const saveSplits = async (list: CustomWorkoutSplit[]) => {
    setSplits(list);
    const json = JSON.stringify(list);
    try {
      if (Platform.OS === 'web' && typeof window !== 'undefined') {
        localStorage.setItem(STORAGE_SPLITS_KEY, json);
      } else if (Platform.OS !== 'web') {
        await SecureStore.setItemAsync(STORAGE_SPLITS_KEY, json);
      }
    } catch (e) {}
  };

  const saveAlarms = async (list: CustomAlarm[]) => {
    setAlarms(list);
    const json = JSON.stringify(list);
    try {
      if (Platform.OS === 'web' && typeof window !== 'undefined') {
        localStorage.setItem(STORAGE_ALARMS_KEY, json);
      } else if (Platform.OS !== 'web') {
        await SecureStore.setItemAsync(STORAGE_ALARMS_KEY, json);
      }
    } catch (e) {}
  };

  const handleAddSplit = async () => {
    if (!newSplitName.trim()) {
      setToast({ visible: true, title: 'Nome Obrigatório', message: 'Informe o nome do treino.', type: 'warning' });
      return;
    }

    const exercisesList = newSplitExercises
      .split('\n')
      .map((e) => e.trim())
      .filter(Boolean);

    const newSplit: CustomWorkoutSplit = {
      id: `s-${Date.now()}`,
      name: newSplitName.trim(),
      category: newSplitCategory.trim() || 'Personalizado',
      exercises: exercisesList.length > 0 ? exercisesList : ['Supino Reto 4x10', 'Desenvolvimento 3x12'],
    };

    const updated = [newSplit, ...splits];
    await saveSplits(updated);

    setNewSplitName('');
    setNewSplitCategory('');
    setNewSplitExercises('');
    setIsSplitModalOpen(false);
    setToast({ visible: true, title: 'Treino Criado!', message: 'Sua divisão de treino personalizada foi salva.', type: 'success' });
  };

  const handleImportAiSplits = async (aiSplits: GeneratedWorkoutSplit[]) => {
    const formatted: CustomWorkoutSplit[] = aiSplits.map((s) => ({
      id: s.id,
      name: s.name,
      category: s.category,
      exercises: s.exercises,
    }));

    const updated = [...formatted, ...splits];
    await saveSplits(updated);
    setToast({ visible: true, title: 'Treinos da IA Importados! 🤖', message: 'Os treinos prescritos pela IA foram salvos na sua lista.', type: 'success' });
  };

  const handleDeleteSplit = async (id: string) => {
    const updated = splits.filter((s) => s.id !== id);
    await saveSplits(updated);
    setToast({ visible: true, title: 'Treino Removido', message: 'Divisão de treino excluída.', type: 'info' });
  };

  const handleAddAlarm = async () => {
    if (!newAlarmTitle.trim()) {
      setToast({ visible: true, title: 'Título Obrigatório', message: 'Informe o nome do alarme.', type: 'warning' });
      return;
    }

    const newAlarm: CustomAlarm = {
      id: `a-${Date.now()}`,
      title: newAlarmTitle.trim(),
      time: newAlarmTime.trim() || '12:00',
      enabled: true,
      category: 'custom',
      repeatDays: 'Todos os dias',
    };

    const updated = [newAlarm, ...alarms];
    await saveAlarms(updated);

    const [h, m] = newAlarm.time.split(':').map(Number);
    scheduleHabitReminder(newAlarm.id, newAlarm.title, 'Lembrete configurado na Central de Alarmes.', h || 12, m || 0);

    setNewAlarmTitle('');
    setNewAlarmTime('17:00');
    setIsAlarmModalOpen(false);
    setToast({ visible: true, title: 'Alarme Configurado!', message: `Lembrete agendado para às ${newAlarm.time}.`, type: 'success' });
  };

  const handleToggleAlarm = async (id: string) => {
    const updated = alarms.map((a) => {
      if (a.id === id) {
        const next = !a.enabled;
        if (next) {
          const [h, m] = a.time.split(':').map(Number);
          scheduleHabitReminder(a.id, a.title, 'Lembrete ativado.', h || 12, m || 0);
        }
        return { ...a, enabled: next };
      }
      return a;
    });

    await saveAlarms(updated);
  };

  const handleDeleteAlarm = async (id: string) => {
    const updated = alarms.filter((a) => a.id !== id);
    await saveAlarms(updated);
    setToast({ visible: true, title: 'Alarme Removido', message: 'Lembrete excluído com sucesso.', type: 'info' });
  };

  const cardBg = isDark ? '#172B4D' : '#FFFFFF';
  const borderColor = isDark ? '#253858' : '#DFE1E6';

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: colors.background }]} edges={['top']}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>
        {/* Header */}
        <Animated.View entering={FadeInDown.duration(400)} style={styles.header}>
          <View style={{ flex: 1 }}>
            <AppText variant="caption" color="textSecondary">
              MÓDULO FITNESS & ALARMES
            </AppText>
            <AppText variant="h2">Academia & Alarmes</AppText>
          </View>
        </Animated.View>

        {/* Gym Workout Interactive Card */}
        <GymWorkoutCard />

        {/* Tab Navigation Switcher */}
        <View style={styles.tabBarRow}>
          <TouchableOpacity
            style={[
              styles.tabBtn,
              {
                backgroundColor: activeTab === 'splits' ? colors.primary : isDark ? '#172B4D' : '#F4F5F7',
                borderColor: activeTab === 'splits' ? colors.primary : borderColor,
              },
            ]}
            onPress={() => setActiveTab('splits')}
          >
            <MaterialCommunityIcons
              name="dumbbell"
              size={16}
              color={activeTab === 'splits' ? '#FFFFFF' : colors.textSecondary}
            />
            <AppText style={{ color: activeTab === 'splits' ? '#FFF' : colors.textSecondary, fontWeight: '700', fontSize: 13, marginLeft: 6 }}>
              Divisões de Treino
            </AppText>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.tabBtn,
              {
                backgroundColor: activeTab === 'alarms' ? colors.primary : isDark ? '#172B4D' : '#F4F5F7',
                borderColor: activeTab === 'alarms' ? colors.primary : borderColor,
              },
            ]}
            onPress={() => setActiveTab('alarms')}
          >
            <Ionicons
              name="alarm-outline"
              size={16}
              color={activeTab === 'alarms' ? '#FFFFFF' : colors.textSecondary}
            />
            <AppText style={{ color: activeTab === 'alarms' ? '#FFF' : colors.textSecondary, fontWeight: '700', fontSize: 13, marginLeft: 6 }}>
              Central de Alarmes
            </AppText>
          </TouchableOpacity>
        </View>

        {/* TAB 1: WORKOUT SPLITS */}
        {activeTab === 'splits' && (
          <Animated.View entering={FadeInDown.duration(300)}>
            <View style={styles.sectionHeader}>
              <AppText variant="h3" style={{ fontSize: 16, fontWeight: '700' }}>
                Suas Divisões de Treino
              </AppText>
              <TouchableOpacity
                style={[styles.btnAdd, { backgroundColor: colors.primary }]}
                onPress={() => setIsSplitModalOpen(true)}
              >
                <Ionicons name="add" size={16} color="#FFF" />
                <AppText style={{ color: '#FFF', fontWeight: '700', fontSize: 12, marginLeft: 4 }}>
                  Novo Treino
                </AppText>
              </TouchableOpacity>
            </View>

            {splits.map((split) => (
              <AppCard key={split.id} style={{ marginBottom: 12, padding: 14 }}>
                <View style={styles.splitHeaderRow}>
                  <View style={[styles.categoryBadge, { backgroundColor: 'rgba(255, 86, 48, 0.15)' }]}>
                    <AppText style={{ color: '#FF5630', fontWeight: '700', fontSize: 11 }}>
                      {split.category.toUpperCase()}
                    </AppText>
                  </View>
                  <AppText style={{ flex: 1, fontWeight: '700', fontSize: 14, marginLeft: 8 }}>
                    {split.name}
                  </AppText>
                  <TouchableOpacity onPress={() => handleDeleteSplit(split.id)} style={{ padding: 4 }}>
                    <Ionicons name="trash-outline" size={16} color={colors.danger} />
                  </TouchableOpacity>
                </View>

                <View style={{ marginTop: 8, gap: 4 }}>
                  {split.exercises.map((ex, idx) => (
                    <View key={idx} style={styles.exerciseRow}>
                      <Ionicons name="checkmark-circle-outline" size={14} color="#00875A" />
                      <AppText style={{ fontSize: 12, color: colors.textSecondary, marginLeft: 6 }}>
                        {ex}
                      </AppText>
                    </View>
                  ))}
                </View>
              </AppCard>
            ))}
          </Animated.View>
        )}

        {/* TAB 2: CENTRAL DE ALARMES */}
        {activeTab === 'alarms' && (
          <Animated.View entering={FadeInDown.duration(300)}>
            <View style={styles.sectionHeader}>
              <AppText variant="h3" style={{ fontSize: 16, fontWeight: '700' }}>
                Central de Alarmes & Lembretes
              </AppText>
              <TouchableOpacity
                style={[styles.btnAdd, { backgroundColor: colors.primary }]}
                onPress={() => setIsAlarmModalOpen(true)}
              >
                <Ionicons name="add" size={16} color="#FFF" />
                <AppText style={{ color: '#FFF', fontWeight: '700', fontSize: 12, marginLeft: 4 }}>
                  Novo Alarme
                </AppText>
              </TouchableOpacity>
            </View>

            {alarms.map((alarm) => (
              <AppCard key={alarm.id} style={{ marginBottom: 10, padding: 14 }}>
                <View style={styles.alarmRow}>
                  <View style={[styles.alarmIconBox, { backgroundColor: alarm.enabled ? 'rgba(0, 135, 90, 0.15)' : 'rgba(107, 119, 140, 0.15)' }]}>
                    <Ionicons name="alarm" size={20} color={alarm.enabled ? '#00875A' : '#6B778C'} />
                  </View>

                  <View style={{ flex: 1, marginLeft: 10 }}>
                    <AppText style={{ fontWeight: '700', fontSize: 14 }}>{alarm.title}</AppText>
                    <AppText variant="caption" color="textSecondary" style={{ fontSize: 11, marginTop: 2 }}>
                      Horário: {alarm.time} • Repetição: {alarm.repeatDays}
                    </AppText>
                  </View>

                  <Switch
                    value={alarm.enabled}
                    onValueChange={() => handleToggleAlarm(alarm.id)}
                    trackColor={{ false: colors.border, true: colors.primary }}
                    thumbColor="#FFF"
                  />

                  <TouchableOpacity onPress={() => handleDeleteAlarm(alarm.id)} style={{ paddingLeft: 8 }}>
                    <Ionicons name="trash-outline" size={16} color={colors.danger} />
                  </TouchableOpacity>
                </View>
              </AppCard>
            ))}
          </Animated.View>
        )}

        <View style={{ height: Spacing['3xl'] }} />
      </ScrollView>

      {/* CREATE WORKOUT SPLIT MODAL */}
      <Modal
        visible={isSplitModalOpen}
        animationType="fade"
        transparent
        onRequestClose={() => setIsSplitModalOpen(false)}
      >
        <TouchableOpacity style={styles.modalOverlay} activeOpacity={1} onPress={() => setIsSplitModalOpen(false)}>
          <TouchableOpacity activeOpacity={1} style={[styles.modalCard, { backgroundColor: isDark ? '#1E293B' : '#FFF', borderColor }]} onPress={(e) => e.stopPropagation?.()}>
            <View style={styles.modalHeader}>
              <AppText variant="h3" style={{ fontSize: 16, fontWeight: '700' }}>Criar Nova Divisão de Treino</AppText>
              <TouchableOpacity onPress={() => setIsSplitModalOpen(false)}>
                <Ionicons name="close" size={20} color={colors.icon} />
              </TouchableOpacity>
            </View>

            <AppText variant="caption" color="textSecondary" style={styles.inputLabel}>NOME DO TREINO</AppText>
            <View style={[styles.inputBox, { borderColor }]}>
              <TextInput style={[styles.input, { color: colors.text }]} value={newSplitName} onChangeText={setNewSplitName} placeholder="Ex: Treino D - Ombros & Abdominal" placeholderTextColor={colors.textTertiary} />
            </View>

            <AppText variant="caption" color="textSecondary" style={styles.inputLabel}>CATEGORIA / FOCO</AppText>
            <View style={[styles.inputBox, { borderColor }]}>
              <TextInput style={[styles.input, { color: colors.text }]} value={newSplitCategory} onChangeText={setNewSplitCategory} placeholder="Ex: Push / Pull / Legs / Hipertrofia" placeholderTextColor={colors.textTertiary} />
            </View>

            <AppText variant="caption" color="textSecondary" style={styles.inputLabel}>EXERCÍCIOS (UM POR LINHA)</AppText>
            <View style={[styles.inputBox, { borderColor, height: 90 }]}>
              <TextInput style={[styles.input, { color: colors.text, height: 90, textAlignVertical: 'top' }]} value={newSplitExercises} onChangeText={setNewSplitExercises} placeholder="Supino Reto 4x10&#10;Desenvolvimento Arnold 3x12&#10;Abdominal Infra 4x20" placeholderTextColor={colors.textTertiary} multiline />
            </View>

            <TouchableOpacity style={[styles.btnSubmitModal, { backgroundColor: colors.primary }]} onPress={handleAddSplit}>
              <AppText style={{ color: '#FFF', fontWeight: '700' }}>Salvar Divisão de Treino</AppText>
            </TouchableOpacity>
          </TouchableOpacity>
        </TouchableOpacity>
      </Modal>

      {/* CREATE ALARM MODAL */}
      <Modal
        visible={isAlarmModalOpen}
        animationType="fade"
        transparent
        onRequestClose={() => setIsAlarmModalOpen(false)}
      >
        <TouchableOpacity style={styles.modalOverlay} activeOpacity={1} onPress={() => setIsAlarmModalOpen(false)}>
          <TouchableOpacity activeOpacity={1} style={[styles.modalCard, { backgroundColor: isDark ? '#1E293B' : '#FFF', borderColor }]} onPress={(e) => e.stopPropagation?.()}>
            <View style={styles.modalHeader}>
              <AppText variant="h3" style={{ fontSize: 16, fontWeight: '700' }}>Criar Novo Alarme</AppText>
              <TouchableOpacity onPress={() => setIsAlarmModalOpen(false)}>
                <Ionicons name="close" size={20} color={colors.icon} />
              </TouchableOpacity>
            </View>

            <AppText variant="caption" color="textSecondary" style={styles.inputLabel}>TÍTULO / TAREFA DO ALARME</AppText>
            <View style={[styles.inputBox, { borderColor }]}>
              <TextInput style={[styles.input, { color: colors.text }]} value={newAlarmTitle} onChangeText={setNewAlarmTitle} placeholder="Ex: Tomar Whey Protein / Treino" placeholderTextColor={colors.textTertiary} />
            </View>

            <AppText variant="caption" color="textSecondary" style={styles.inputLabel}>HORÁRIO (HH:MM)</AppText>
            <View style={[styles.inputBox, { borderColor }]}>
              <TextInput style={[styles.input, { color: colors.text }]} value={newAlarmTime} onChangeText={setNewAlarmTime} placeholder="17:00" placeholderTextColor={colors.textTertiary} />
            </View>

            <TouchableOpacity style={[styles.btnSubmitModal, { backgroundColor: colors.primary }]} onPress={handleAddAlarm}>
              <AppText style={{ color: '#FFF', fontWeight: '700' }}>Agendar Alarme</AppText>
            </TouchableOpacity>
          </TouchableOpacity>
        </TouchableOpacity>
      </Modal>

      <AppToast
        visible={toast.visible}
        title={toast.title}
        message={toast.message}
        type={toast.type}
        onClose={() => setToast((t) => ({ ...t, visible: false }))}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  scroll: { paddingHorizontal: Spacing.base, paddingTop: Spacing.md },
  header: { flexDirection: 'row', alignItems: 'center', marginBottom: Spacing.md },
  tabBarRow: { flexDirection: 'row', gap: 8, marginBottom: 14 },
  tabBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', height: 42, borderRadius: 8, borderWidth: 1 },
  aiBanner: { flexDirection: 'row', alignItems: 'center', padding: 12, borderRadius: 10, marginBottom: 14 },
  sectionHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 },
  btnAdd: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 10, paddingVertical: 6, borderRadius: 6 },
  splitHeaderRow: { flexDirection: 'row', alignItems: 'center' },
  categoryBadge: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 4 },
  exerciseRow: { flexDirection: 'row', alignItems: 'center', marginTop: 3 },
  alarmRow: { flexDirection: 'row', alignItems: 'center' },
  alarmIconBox: { width: 38, height: 38, borderRadius: 8, alignItems: 'center', justifyContent: 'center' },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'center', alignItems: 'center', padding: 16 },
  modalCard: { width: '100%', maxWidth: 380, borderRadius: 12, padding: 16, borderWidth: 1 },
  modalHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 },
  inputLabel: { marginTop: 8, marginBottom: 4, fontSize: 11, fontWeight: '700' },
  inputBox: { borderRadius: 6, borderWidth: 1, paddingHorizontal: 10, marginBottom: 8 },
  input: { fontSize: 13, paddingVertical: 8 },
  btnSubmitModal: { height: 42, borderRadius: 8, alignItems: 'center', justifyContent: 'center', marginTop: 12 },
});

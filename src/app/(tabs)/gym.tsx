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
  Alert,
  DeviceEventEmitter,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { useTheme } from '@/hooks/useTheme';
import { AppText } from '@/components/atoms/AppText';
import { AppCard } from '@/components/atoms/AppCard';
import { AppToast } from '@/components/atoms/AppToast';
import { GymWorkoutCard } from '@/components/organisms/GymWorkoutCard';
import { scheduleHabitReminder } from '@/services/notifications';
import { BACKEND_API_URL } from '@/services/supabase';
import * as SecureStore from 'expo-secure-store';
import { Spacing, Radius } from '@/constants/theme';

export type CustomWorkoutSplit = {
  id: string;
  name: string;
  category: string;
  exercises: string[];
  isCompletedToday?: boolean;
};

export type CustomAlarm = {
  id: string;
  title: string;
  time: string;
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

const CATEGORY_OPTIONS = ['Push', 'Pull', 'Legs', 'Hipertrofia', 'Cardio', 'Outros'];

const STORAGE_SPLITS_KEY = 'liferoutine_custom_splits_v1';
const STORAGE_ALARMS_KEY = 'liferoutine_custom_alarms_v1';

export default function GymScreen() {
  const { colors, isDark } = useTheme();
  const [activeTab, setActiveTab] = useState<'splits' | 'alarms'>('splits');

  // Custom Splits State
  const [splits, setSplits] = useState<CustomWorkoutSplit[]>(DEFAULT_SPLITS);
  const [isSplitModalOpen, setIsSplitModalOpen] = useState(false);
  const [editingSplitId, setEditingSplitId] = useState<string | null>(null);
  const [newSplitName, setNewSplitName] = useState('');
  const [selectedCategoryOption, setSelectedCategoryOption] = useState('Push');
  const [customCategoryText, setCustomCategoryText] = useState('');

  // Interactive '+' Exercise List Items & Reordering inside Edit Modal
  const [exerciseInputText, setExerciseInputText] = useState('');
  const [exerciseList, setExerciseList] = useState<string[]>([]);

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
    // 1. Local Cache Read
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

    // 2. Fetch Live Remote PostgreSQL Splits from VPS Server
    setTimeout(async () => {
      try {
        const urls = [`${BACKEND_API_URL}/api/workout-splits`, '/api/workout-splits'];
        for (const url of urls) {
          const res = await fetch(url).catch(() => null);
          if (res && res.ok) {
            const remoteSplits = await res.json();
            if (Array.isArray(remoteSplits) && remoteSplits.length > 0) {
              setSplits(remoteSplits);
              const json = JSON.stringify(remoteSplits);
              if (Platform.OS === 'web' && typeof window !== 'undefined') {
                localStorage.setItem(STORAGE_SPLITS_KEY, json);
              } else if (Platform.OS !== 'web') {
                await SecureStore.setItemAsync(STORAGE_SPLITS_KEY, json);
              }
              DeviceEventEmitter.emit('liferoutine_splits_updated');
              break;
            }
          }
        }
      } catch (e) {}
    }, 10);
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
      DeviceEventEmitter.emit('liferoutine_splits_updated');
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

  const handleOpenAddSplitModal = () => {
    setEditingSplitId(null);
    setNewSplitName('');
    setSelectedCategoryOption('Push');
    setCustomCategoryText('');
    setExerciseInputText('');
    setExerciseList([]);
    setIsSplitModalOpen(true);
  };

  const handleOpenEditSplitModal = (split: CustomWorkoutSplit) => {
    setEditingSplitId(split.id);
    setNewSplitName(split.name);
    if (CATEGORY_OPTIONS.includes(split.category)) {
      setSelectedCategoryOption(split.category);
      setCustomCategoryText('');
    } else {
      setSelectedCategoryOption('Outros');
      setCustomCategoryText(split.category);
    }
    setExerciseInputText('');
    setExerciseList(split.exercises || []);
    setIsSplitModalOpen(true);
  };

  const handleAddExerciseToList = () => {
    if (!exerciseInputText.trim()) return;
    setExerciseList((prev) => [...prev, exerciseInputText.trim()]);
    setExerciseInputText('');
  };

  const handleRemoveExerciseFromList = (index: number) => {
    setExerciseList((prev) => prev.filter((_, idx) => idx !== index));
  };

  const handleMoveExerciseUp = (index: number) => {
    if (index === 0) return;
    setExerciseList((prev) => {
      const updated = [...prev];
      const temp = updated[index];
      updated[index] = updated[index - 1];
      updated[index - 1] = temp;
      return updated;
    });
  };

  const handleMoveExerciseDown = (index: number) => {
    setExerciseList((prev) => {
      if (index >= prev.length - 1) return prev;
      const updated = [...prev];
      const temp = updated[index];
      updated[index] = updated[index + 1];
      updated[index + 1] = temp;
      return updated;
    });
  };

  const handleSaveSplit = async () => {
    if (!newSplitName.trim()) {
      setToast({ visible: true, title: 'Nome Obrigatório', message: 'Informe o nome do treino.', type: 'warning' });
      return;
    }

    const finalCategory = selectedCategoryOption === 'Outros'
      ? (customCategoryText.trim() || 'Outros')
      : selectedCategoryOption;

    let targetSplit: CustomWorkoutSplit;

    if (editingSplitId) {
      targetSplit = {
        id: editingSplitId,
        name: newSplitName.trim(),
        category: finalCategory,
        exercises: exerciseList.length > 0 ? exerciseList : ['Exercício Padrão 4x10'],
      };
      const updated = splits.map((s) => (s.id === editingSplitId ? targetSplit : s));
      await saveSplits(updated);
      setToast({ visible: true, title: 'Treino Atualizado!', message: 'Sua divisão de treino foi editada com sucesso.', type: 'success' });
    } else {
      targetSplit = {
        id: `s-${Date.now()}`,
        name: newSplitName.trim(),
        category: finalCategory,
        exercises: exerciseList.length > 0 ? exerciseList : ['Supino Reto 4x10', 'Desenvolvimento 3x12'],
      };
      const updated = [targetSplit, ...splits];
      await saveSplits(updated);
      setToast({ visible: true, title: 'Treino Criado!', message: 'Sua divisão de treino personalizada foi salva.', type: 'success' });
    }

    // Sync to PostgreSQL Database Server
    setTimeout(() => {
      const urls = [`${BACKEND_API_URL}/api/workout-splits`, '/api/workout-splits'];
      for (const url of urls) {
        fetch(url, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(targetSplit),
        }).catch(() => {});
      }
    }, 10);

    setIsSplitModalOpen(false);
  };

  const confirmDeleteSplit = (id: string, name: string) => {
    if (Platform.OS === 'web') {
      const confirmWeb = window.confirm(`Deseja realmente excluir a divisão de treino "${name}"?`);
      if (confirmWeb) {
        executeDeleteSplit(id);
      }
    } else {
      Alert.alert(
        'Excluir Divisão de Treino',
        `Deseja realmente excluir a divisão "${name}"?`,
        [
          { text: 'Cancelar', style: 'cancel' },
          { text: 'Excluir', style: 'destructive', onPress: () => executeDeleteSplit(id) },
        ],
        { cancelable: true }
      );
    }
  };

  const executeDeleteSplit = async (id: string) => {
    const updated = splits.filter((s) => s.id !== id);
    await saveSplits(updated);
    setToast({ visible: true, title: 'Treino Removido', message: 'Divisão de treino excluída com sucesso.', type: 'info' });

    setTimeout(() => {
      const urls = [`${BACKEND_API_URL}/api/workout-splits/${id}`, `/api/workout-splits/${id}`];
      for (const url of urls) {
        fetch(url, { method: 'DELETE' }).catch(() => {});
      }
    }, 10);
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

  const confirmDeleteAlarm = (id: string, title: string) => {
    if (Platform.OS === 'web') {
      const confirmWeb = window.confirm(`Deseja realmente excluir o alarme "${title}"?`);
      if (confirmWeb) {
        executeDeleteAlarm(id);
      }
    } else {
      Alert.alert(
        'Excluir Alarme',
        `Deseja realmente excluir o alarme "${title}"?`,
        [
          { text: 'Cancelar', style: 'cancel' },
          { text: 'Excluir', style: 'destructive', onPress: () => executeDeleteAlarm(id) },
        ],
        { cancelable: true }
      );
    }
  };

  const executeDeleteAlarm = async (id: string) => {
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
                onPress={handleOpenAddSplitModal}
              >
                <Ionicons name="add" size={16} color="#FFF" />
                <AppText style={{ color: '#FFF', fontWeight: '700', fontSize: 12, marginLeft: 4 }}>
                  Novo Treino
                </AppText>
              </TouchableOpacity>
            </View>

            {splits.map((split) => (
              <TouchableOpacity
                key={split.id}
                onPress={() => handleOpenEditSplitModal(split)}
                activeOpacity={0.85}
              >
                <AppCard style={{ marginBottom: 12, padding: 14 }}>
                  <View style={styles.splitHeaderRow}>
                    <View style={[styles.categoryBadge, { backgroundColor: 'rgba(255, 86, 48, 0.15)' }]}>
                      <AppText style={{ color: '#FF5630', fontWeight: '700', fontSize: 11 }}>
                        {split.category.toUpperCase()}
                      </AppText>
                    </View>
                    <AppText style={{ flex: 1, fontWeight: '700', fontSize: 14, marginLeft: 8 }}>
                      {split.name}
                    </AppText>

                    {/* Edit Icon */}
                    <TouchableOpacity onPress={() => handleOpenEditSplitModal(split)} style={{ padding: 4, marginRight: 4 }}>
                      <Ionicons name="pencil-outline" size={16} color={colors.primary} />
                    </TouchableOpacity>

                    {/* Delete Icon with Explicit Confirmation */}
                    <TouchableOpacity
                      onPress={(e) => {
                        e.stopPropagation?.();
                        confirmDeleteSplit(split.id, split.name);
                      }}
                      style={{ padding: 4 }}
                    >
                      <Ionicons name="trash-outline" size={16} color={colors.danger} />
                    </TouchableOpacity>
                  </View>

                  {/* Clean Vertical Exercise List */}
                  <View style={{ marginTop: 10, gap: 4 }}>
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
              </TouchableOpacity>
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

                  <TouchableOpacity
                    onPress={() => confirmDeleteAlarm(alarm.id, alarm.title)}
                    style={{ paddingLeft: 8 }}
                  >
                    <Ionicons name="trash-outline" size={16} color={colors.danger} />
                  </TouchableOpacity>
                </View>
              </AppCard>
            ))}
          </Animated.View>
        )}

        <View style={{ height: Spacing['3xl'] }} />
      </ScrollView>

      {/* CREATE / EDIT WORKOUT SPLIT MODAL WITH REORDERABLE EXERCISE LIST */}
      <Modal
        visible={isSplitModalOpen}
        animationType="fade"
        transparent
        onRequestClose={() => setIsSplitModalOpen(false)}
      >
        <TouchableOpacity style={styles.modalOverlay} activeOpacity={1} onPress={() => setIsSplitModalOpen(false)}>
          <TouchableOpacity activeOpacity={1} style={[styles.modalCard, { backgroundColor: isDark ? '#1E293B' : '#FFF', borderColor }]} onPress={(e) => e.stopPropagation?.()}>
            <View style={styles.modalHeader}>
              <AppText variant="h3" style={{ fontSize: 16, fontWeight: '700' }}>
                {editingSplitId ? 'Editar Divisão de Treino' : 'Criar Nova Divisão de Treino'}
              </AppText>
              <TouchableOpacity onPress={() => setIsSplitModalOpen(false)}>
                <Ionicons name="close" size={20} color={colors.icon} />
              </TouchableOpacity>
            </View>

            <AppText variant="caption" color="textSecondary" style={styles.inputLabel}>NOME DO TREINO</AppText>
            <View style={[styles.inputBox, { borderColor }]}>
              <TextInput style={[styles.input, { color: colors.text }]} value={newSplitName} onChangeText={setNewSplitName} placeholder="Ex: Treino D - Ombros & Abdominal" placeholderTextColor={colors.textTertiary} />
            </View>

            {/* CATEGORY SELECTOR CHIPS WITH "OUTROS" OPTION */}
            <AppText variant="caption" color="textSecondary" style={styles.inputLabel}>CATEGORIA / FOCO</AppText>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginBottom: 8 }}>
              {CATEGORY_OPTIONS.map((cat) => {
                const isSelected = selectedCategoryOption === cat;
                return (
                  <TouchableOpacity
                    key={cat}
                    style={[
                      styles.catChip,
                      {
                        backgroundColor: isSelected ? colors.primary : isDark ? '#091E42' : '#F4F5F7',
                        borderColor: isSelected ? colors.primary : borderColor,
                      },
                    ]}
                    onPress={() => setSelectedCategoryOption(cat)}
                  >
                    <AppText style={{ fontSize: 12, fontWeight: isSelected ? '700' : '500', color: isSelected ? '#FFF' : colors.text }}>
                      {cat}
                    </AppText>
                  </TouchableOpacity>
                );
              })}
            </View>

            {/* Custom Category Input if "Outros" is Selected */}
            {selectedCategoryOption === 'Outros' && (
              <View style={[styles.inputBox, { borderColor, marginBottom: 8 }]}>
                <TextInput
                  style={[styles.input, { color: colors.text }]}
                  value={customCategoryText}
                  onChangeText={setCustomCategoryText}
                  placeholder="Digite sua categoria personalizada..."
                  placeholderTextColor={colors.textTertiary}
                />
              </View>
            )}

            {/* INTERACTIVE EXERCISE ADD INPUT (+) */}
            <AppText variant="caption" color="textSecondary" style={styles.inputLabel}>EXERCÍCIOS DO TREINO (ADICIONE E REORDENE)</AppText>
            <View style={{ flexDirection: 'row', gap: 6, marginBottom: 8 }}>
              <View style={[styles.inputBox, { borderColor, flex: 1, marginBottom: 0 }]}>
                <TextInput
                  style={[styles.input, { color: colors.text }]}
                  value={exerciseInputText}
                  onChangeText={setExerciseInputText}
                  placeholder="Ex: Supino Reto 4x10..."
                  placeholderTextColor={colors.textTertiary}
                  onSubmitEditing={handleAddExerciseToList}
                />
              </View>
              <TouchableOpacity
                style={[styles.btnAddExercise, { backgroundColor: colors.primary }]}
                onPress={handleAddExerciseToList}
              >
                <Ionicons name="add" size={20} color="#FFF" />
              </TouchableOpacity>
            </View>

            {/* Added Exercise List Container with Persistent Visible Native Scrollbar */}
            <ScrollView
              style={{ maxHeight: 220, minHeight: 100, marginBottom: 14 }}
              nestedScrollEnabled={true}
              keyboardShouldPersistTaps="handled"
              showsVerticalScrollIndicator={true}
              persistentScrollbar={true}
              indicatorStyle={isDark ? 'white' : 'black'}
              contentContainerStyle={{ paddingRight: 6 }}
            >
              <View style={{ gap: 6 }}>
                {exerciseList.length === 0 ? (
                  <View style={[styles.emptyExerciseNotice, { borderColor }]}>
                    <AppText variant="caption" color="textSecondary" style={{ textAlign: 'center', fontSize: 11 }}>
                      Nenhum exercício adicionado ainda. Digite acima e clique em (+)
                    </AppText>
                  </View>
                ) : (
                  exerciseList.map((ex, idx) => (
                    <View key={idx} style={[styles.exerciseListItem, { borderColor, backgroundColor: isDark ? '#0F172A' : '#F8FAFC' }]}>
                      <View style={[styles.exerciseIndexBadge, { backgroundColor: colors.primaryLight }]}>
                        <AppText style={{ fontSize: 10, fontWeight: '800', color: colors.primary }}>
                          #{idx + 1}
                        </AppText>
                      </View>

                      <AppText style={{ flex: 1, fontSize: 12, fontWeight: '600', color: colors.text, marginLeft: 8 }}>
                        {ex}
                      </AppText>

                      <TouchableOpacity onPress={() => handleRemoveExerciseFromList(idx)} style={{ padding: 4 }}>
                        <Ionicons name="close-circle-outline" size={18} color={colors.danger} />
                      </TouchableOpacity>
                    </View>
                  ))
                )}
              </View>
            </ScrollView>

            <TouchableOpacity style={[styles.btnSubmitModal, { backgroundColor: colors.primary }]} onPress={handleSaveSplit}>
              <AppText style={{ color: '#FFF', fontWeight: '700' }}>
                {editingSplitId ? 'Atualizar Treino' : 'Salvar Divisão de Treino'}
              </AppText>
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
  sectionHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 },
  btnAdd: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 10, paddingVertical: 6, borderRadius: 6 },
  splitHeaderRow: { flexDirection: 'row', alignItems: 'center' },
  categoryBadge: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 4 },
  catChip: { paddingHorizontal: 10, paddingVertical: 6, borderRadius: 14, borderWidth: 1 },
  exerciseRow: { flexDirection: 'row', alignItems: 'center', marginTop: 3 },
  btnAddExercise: { width: 42, height: 40, borderRadius: 6, alignItems: 'center', justifyContent: 'center' },
  exerciseListItem: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 10, paddingVertical: 8, borderRadius: 8, borderWidth: 1 },
  exerciseIndexBadge: { paddingHorizontal: 6, paddingVertical: 2, borderRadius: 6 },
  emptyExerciseNotice: { padding: 12, borderRadius: 8, borderWidth: 1, borderStyle: 'dashed' },
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

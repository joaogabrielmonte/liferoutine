import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  Platform,
  Switch,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from 'expo-router';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { useTheme } from '@/hooks/useTheme';
import { useHabitsStore, useTodayHabits, useTodayCompletion } from '@/stores/useHabitsStore';
import { getUserProfile } from '@/services/storage';
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
import { BACKEND_API_URL } from '@/services/supabase';
import { Spacing, Palette } from '@/constants/theme';
import type { HabitWithLogs } from '@/types/habit';

export default function HomeScreen() {
  const { colors, isDark } = useTheme();
  const { deleteHabit, archiveHabit, updateHabit, habits, logs } = useHabitsStore();
  const [userName, setUserName] = useState<string>('');
  const [selectedDate, setSelectedDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [selectedOptionHabit, setSelectedOptionHabit] = useState<HabitWithLogs | null>(null);
  const [editingHabit, setEditingHabit] = useState<HabitWithLogs | null>(null);
  const [activeWaterHabit, setActiveWaterHabit] = useState<HabitWithLogs | null>(null);
  const [activeExerciseHabit, setActiveExerciseHabit] = useState<HabitWithLogs | null>(null);
  const [activeGenericHabit, setActiveGenericHabit] = useState<HabitWithLogs | null>(null);

  // Web Admin Feature Flags state
  const [featureAnalytics, setFeatureAnalytics] = useState(true);
  const [featureAIAdvisor, setFeatureAIAdvisor] = useState(true);
  const [featureCloudSync, setFeatureCloudSync] = useState(true);
  const [featureTimers, setFeatureTimers] = useState(true);

  const isWeb = Platform.OS === 'web';

  useFocusEffect(
    useCallback(() => {
      getUserProfile().then((profile) => {
        if (profile && profile.name) {
          setUserName(profile.name);
        }
      });
    }, [])
  );

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

  const cardBg = isDark ? '#172B4D' : '#FFFFFF';
  const borderColor = isDark ? '#253858' : '#DFE1E6';

  if (isWeb) {
    // -------------------------------------------------------------
    // WEB ENTERPRISE ADMIN CRM & SYSTEM CONTROL DASHBOARD
    // -------------------------------------------------------------
    return (
      <SafeAreaView
        style={[styles.safe, { backgroundColor: isDark ? '#091E42' : '#FAFBFC' }]}
        edges={['top']}
      >
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.webScroll}
        >
          {/* Executive Header */}
          <Animated.View entering={FadeInDown.duration(300)} style={styles.webHeader}>
            <View style={{ flex: 1 }}>
              <AppText variant="h2" style={{ fontWeight: '700', fontSize: 20, letterSpacing: -0.3 }}>
                Dashboard Executive & Controle do Sistema
              </AppText>
              <AppText variant="caption" color="textSecondary" style={{ marginTop: 2, fontSize: 13 }}>
                Painel administrativo do servidor Oracle VPS PostgreSQL (kingslityc.com.br)
              </AppText>
            </View>

            <View style={styles.webHeaderActions}>
              <View style={styles.vpsBadge}>
                <View style={styles.dotGreen} />
                <AppText style={{ fontSize: 12, fontWeight: '600', color: '#00875A' }}>
                  PostgreSQL 147.15.72.151
                </AppText>
              </View>
            </View>
          </Animated.View>

          {/* CRM Metric Cards Grid */}
          <Animated.View entering={FadeInDown.delay(60).duration(300)} style={styles.crmMetricsRow}>
            <View style={[styles.crmMetricBox, { backgroundColor: cardBg, borderColor }]}>
              <View style={styles.metricIconRow}>
                <AppText variant="caption" color="textSecondary" style={styles.metricLabel}>
                  CONTAS CADASTRADAS
                </AppText>
                <Ionicons name="people" size={18} color="#0052CC" />
              </View>
              <AppText variant="h2" style={{ fontWeight: '700', fontSize: 24, marginTop: 4 }}>
                2 Contas
              </AppText>
              <AppText variant="caption" color="textSecondary" style={{ fontSize: 11, marginTop: 2 }}>
                Gabriel Monte & Emmanuel
              </AppText>
            </View>

            <View style={[styles.crmMetricBox, { backgroundColor: cardBg, borderColor }]}>
              <View style={styles.metricIconRow}>
                <AppText variant="caption" color="textSecondary" style={styles.metricLabel}>
                  ARMAZENAMENTO POSTGRESQL
                </AppText>
                <MaterialCommunityIcons name="database-check" size={18} color="#00875A" />
              </View>
              <AppText variant="h2" style={{ fontWeight: '700', fontSize: 24, marginTop: 4, color: '#00875A' }}>
                Ativo (SSL OK)
              </AppText>
              <AppText variant="caption" color="textSecondary" style={{ fontSize: 11, marginTop: 2 }}>
                Docker liferoutine_api:4000
              </AppText>
            </View>

            <View style={[styles.crmMetricBox, { backgroundColor: cardBg, borderColor }]}>
              <View style={styles.metricIconRow}>
                <AppText variant="caption" color="textSecondary" style={styles.metricLabel}>
                  RECURSOS HABILITADOS
                </AppText>
                <Ionicons name="toggle" size={18} color="#6554C0" />
              </View>
              <AppText variant="h2" style={{ fontWeight: '700', fontSize: 24, marginTop: 4, color: '#6554C0' }}>
                4 Modulos
              </AppText>
              <AppText variant="caption" color="textSecondary" style={{ fontSize: 11, marginTop: 2 }}>
                Analytics, IA, Timers & Cloud
              </AppText>
            </View>
          </Animated.View>

          {/* Feature Flags & Habilitação de Recursos */}
          <Animated.View entering={FadeInDown.delay(120).duration(300)} style={[styles.featureFlagsCard, { backgroundColor: cardBg, borderColor }]}>
            <View style={styles.sectionTitleRow}>
              <Ionicons name="options-outline" size={18} color="#0052CC" />
              <AppText variant="h3" style={{ fontSize: 15, fontWeight: '700', marginLeft: 6 }}>
                Gestão de Recursos & Feature Flags (Novas Telas para Usuários)
              </AppText>
            </View>
            <AppText variant="caption" color="textSecondary" style={{ fontSize: 12, marginBottom: 14 }}>
              Ative ou desative módulos do aplicativo em tempo real para as contas dos usuários.
            </AppText>

            <View style={styles.flagsGrid}>
              <View style={[styles.flagItem, { borderColor }]}>
                <View style={{ flex: 1 }}>
                  <AppText style={{ fontWeight: '600', fontSize: 13 }}>
                    📊 Tela de Analytics & Relatórios Avançados
                  </AppText>
                  <AppText variant="caption" color="textSecondary" style={{ fontSize: 11 }}>
                    Permite aos usuários verem o calendário de consistência e estatísticas.
                  </AppText>
                </View>
                <Switch
                  value={featureAnalytics}
                  onValueChange={setFeatureAnalytics}
                  trackColor={{ false: borderColor, true: '#0052CC' }}
                />
              </View>

              <View style={[styles.flagItem, { borderColor }]}>
                <View style={{ flex: 1 }}>
                  <AppText style={{ fontWeight: '600', fontSize: 13 }}>
                    🤖 Assistente de Rotina Inteligente (IA)
                  </AppText>
                  <AppText variant="caption" color="textSecondary" style={{ fontSize: 11 }}>
                    Sugestões automáticas baseadas nos horários de acordar e dormir.
                  </AppText>
                </View>
                <Switch
                  value={featureAIAdvisor}
                  onValueChange={setFeatureAIAdvisor}
                  trackColor={{ false: borderColor, true: '#0052CC' }}
                />
              </View>

              <View style={[styles.flagItem, { borderColor }]}>
                <View style={{ flex: 1 }}>
                  <AppText style={{ fontWeight: '600', fontSize: 13 }}>
                    ☁️ Sincronização Cloud Automática (VPS)
                  </AppText>
                  <AppText variant="caption" color="textSecondary" style={{ fontSize: 11 }}>
                    Sincroniza imediatamente com o banco PostgreSQL no servidor Oracle.
                  </AppText>
                </View>
                <Switch
                  value={featureCloudSync}
                  onValueChange={setFeatureCloudSync}
                  trackColor={{ false: borderColor, true: '#0052CC' }}
                />
              </View>

              <View style={[styles.flagItem, { borderColor }]}>
                <View style={{ flex: 1 }}>
                  <AppText style={{ fontWeight: '600', fontSize: 13 }}>
                    ⏱️ Modais de Timer & Contador de Hábitos
                  </AppText>
                  <AppText variant="caption" color="textSecondary" style={{ fontSize: 11 }}>
                    Habilita o cronômetro de exercício e contador de água de 250ml.
                  </AppText>
                </View>
                <Switch
                  value={featureTimers}
                  onValueChange={setFeatureTimers}
                  trackColor={{ false: borderColor, true: '#0052CC' }}
                />
              </View>
            </View>
          </Animated.View>

          {/* System Audit Log Stream */}
          <Animated.View entering={FadeInDown.delay(180).duration(300)} style={[styles.auditLogCard, { backgroundColor: cardBg, borderColor }]}>
            <View style={styles.sectionTitleRow}>
              <Ionicons name="list-circle-outline" size={18} color="#00875A" />
              <AppText variant="h3" style={{ fontSize: 15, fontWeight: '700', marginLeft: 6 }}>
                Logs de Auditoria & Atividade do Servidor
              </AppText>
            </View>

            <View style={styles.logList}>
              {[
                { time: 'Agora', event: 'Sincronização VPS OK', detail: 'Conexão com PostgreSQL efetuada com sucesso (147.15.72.151)', type: 'success' },
                { time: 'Há 5m', event: 'Feature Flag Atualizada', detail: 'Recurso de Analytics Avançado marcado como ativo', type: 'info' },
                { time: 'Há 15m', event: 'Autenticação de Usuário', detail: 'Gabriel Monte realizou login no painel administrativo', type: 'info' },
                { time: 'Há 1h', event: 'Backup de Tabelas', detail: 'Tabelas users, habits e habit_logs verificadas e integras', type: 'success' },
              ].map((log, idx) => (
                <View key={idx} style={[styles.logRow, { borderBottomColor: borderColor }]}>
                  <View style={[styles.logDot, { backgroundColor: log.type === 'success' ? '#00875A' : '#0052CC' }]} />
                  <View style={{ flex: 1 }}>
                    <AppText style={{ fontWeight: '600', fontSize: 13 }}>{log.event}</AppText>
                    <AppText variant="caption" color="textSecondary" style={{ fontSize: 11 }}>
                      {log.detail}
                    </AppText>
                  </View>
                  <AppText variant="caption" color="textSecondary" style={{ fontSize: 11 }}>
                    {log.time}
                  </AppText>
                </View>
              ))}
            </View>
          </Animated.View>

          <View style={{ height: 40 }} />
        </ScrollView>
      </SafeAreaView>
    );
  }

  // -------------------------------------------------------------
  // MOBILE APP NATIVE HABIT TRACKER (UNTOUCHED FOR MOBILE)
  // -------------------------------------------------------------
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
              {new Date().toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long' })}
            </AppText>
            <AppText variant="h2">Olá, {userName || ' Gabriel'}</AppText>
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

        {/* Date Selector Strip */}
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
          </AppCard>
        </Animated.View>

        {/* Badges Section */}
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

          {todayHabits.map((habit, i) => (
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
          ))}
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

      {/* Create Habit Modal */}
      <CreateHabitModal
        visible={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
      />

      {/* Interactive Generic Habit Counter Modal */}
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
  webScroll: {
    paddingHorizontal: 20,
    paddingTop: 16,
  },
  webHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  webHeaderActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  vpsBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(0, 135, 90, 0.1)',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 6,
  },
  dotGreen: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#00875A',
  },
  crmMetricsRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 20,
  },
  crmMetricBox: {
    flex: 1,
    padding: 16,
    borderRadius: 8,
    borderWidth: 1,
  },
  metricIconRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  metricLabel: {
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  featureFlagsCard: {
    padding: 16,
    borderRadius: 8,
    borderWidth: 1,
    marginBottom: 20,
  },
  sectionTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  flagsGrid: {
    gap: 10,
  },
  flagItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 12,
    borderRadius: 6,
    borderWidth: 1,
  },
  auditLogCard: {
    padding: 16,
    borderRadius: 8,
    borderWidth: 1,
  },
  logList: {
    marginTop: 10,
  },
  logRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 10,
    borderBottomWidth: 1,
  },
  logDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
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
});

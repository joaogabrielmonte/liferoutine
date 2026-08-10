import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  Platform,
  DeviceEventEmitter,
  Switch,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from 'expo-router';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { useTheme } from '@/hooks/useTheme';
import { useHabitsStore, useHabitsForDate, useTodayCompletion } from '@/stores/useHabitsStore';
import { getUserProfile } from '@/services/storage';
import { AppText } from '@/components/atoms/AppText';
import { AppCard } from '@/components/atoms/AppCard';
import { AppToast } from '@/components/atoms/AppToast';
import { ProgressRing } from '@/components/molecules/ProgressRing';
import { HabitCard } from '@/components/molecules/HabitCard';
import { HabitOptionsModal } from '@/components/molecules/HabitOptionsModal';
import { DateStripSelector } from '@/components/molecules/DateStripSelector';
import { BadgesSection } from '@/components/molecules/BadgesSection';
import { CreateHabitModal } from '@/components/organisms/CreateHabitModal';
import { WaterCounterModal } from '@/components/organisms/WaterCounterModal';
import { ExerciseTimerModal } from '@/components/organisms/ExerciseTimerModal';
import { GenericHabitCounterModal } from '@/components/organisms/GenericHabitCounterModal';
import { GymWorkoutCard } from '@/components/organisms/GymWorkoutCard';
import { getSupportTickets, updateTicketStatus, SupportTicket, TicketStatus } from '@/services/tickets';
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

  // Support Tickets State
  const [tickets, setTickets] = useState<SupportTicket[]>([]);

  // Web Admin Feature Flags state
  const [featureAnalytics, setFeatureAnalytics] = useState(true);
  const [featureAIAdvisor, setFeatureAIAdvisor] = useState(true);
  const [featureCloudSync, setFeatureCloudSync] = useState(true);
  const [featureTimers, setFeatureTimers] = useState(true);

  const isWeb = Platform.OS === 'web';

  const [toast, setToast] = useState<{ visible: boolean; title: string; message?: string; type?: 'success' | 'error' | 'info' | 'warning' }>({ visible: false, title: '' });

  const loadTickets = async () => {
    const list = await getSupportTickets();
    setTickets(list);
  };

  const handleStatusChange = async (id: string, newStatus: TicketStatus) => {
    const list = await updateTicketStatus(id, newStatus);
    setTickets(list);
    setToast({
      visible: true,
      title: 'Status do Chamado Atualizado',
      message: `Status alterado para ${newStatus === 'resolved' ? 'Concluído' : newStatus === 'in_progress' ? 'Em Atendimento' : 'Pendente'}.`,
      type: 'info',
    });
  };

  useFocusEffect(
    useCallback(() => {
      getUserProfile().then((profile) => {
        if (profile && profile.name) {
          setUserName(profile.name);
        }
      });
      loadTickets();

      const subscription = DeviceEventEmitter.addListener('liferoutine_tickets_updated', () => {
        loadTickets();
      });
      return () => subscription.remove();
    }, [])
  );

  const todayHabits = useHabitsForDate(selectedDate);
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

  const handleTicketStatusChange = async (ticketId: string, newStatus: TicketStatus) => {
    const updated = await updateTicketStatus(ticketId, newStatus);
    setTickets(updated);
  };

  const cardBg = isDark ? '#111827' : '#FFFFFF';
  const borderColor = isDark ? '#1F2937' : '#E5E7EB';

  if (isWeb) {
    // -------------------------------------------------------------
    // WEB ADMIN DASHBOARD & SUPPORT TICKET CONTROL CENTER
    // -------------------------------------------------------------
    const openTicketsCount = tickets.filter((t) => t.status === 'open').length;

    return (
      <SafeAreaView
        style={[styles.safe, { backgroundColor: isDark ? '#0B0F19' : '#F9FAFB' }]}
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
                Visão Geral & Central de Suporte
              </AppText>
              <AppText variant="caption" color="textSecondary" style={{ marginTop: 2, fontSize: 13 }}>
                Painel administrativo de controle e atendimento de chamados do LifeRoutine Mobile
              </AppText>
            </View>

            <TouchableOpacity
              style={[styles.btnPrimary, { backgroundColor: '#0052CC' }]}
              onPress={loadTickets}
              activeOpacity={0.7}
            >
              <Ionicons name="refresh" size={14} color="#FFF" />
              <AppText style={{ color: '#FFF', fontWeight: '600', fontSize: 12, marginLeft: 4 }}>
                Atualizar Dados
              </AppText>
            </TouchableOpacity>
          </Animated.View>

          {/* CRM Metric Cards Grid */}
          <Animated.View entering={FadeInDown.delay(60).duration(300)} style={styles.crmMetricsRow}>
            <View style={[styles.crmMetricBox, { backgroundColor: cardBg, borderColor }]}>
              <View style={styles.metricIconRow}>
                <AppText variant="caption" color="textSecondary" style={styles.metricLabel}>
                  CHAMADOS ABERTOS
                </AppText>
                <Ionicons name="chatbubbles" size={18} color={openTicketsCount > 0 ? '#DE350B' : '#00875A'} />
              </View>
              <AppText variant="h2" style={{ fontWeight: '700', fontSize: 24, marginTop: 4, color: openTicketsCount > 0 ? '#DE350B' : colors.text }}>
                {openTicketsCount} {openTicketsCount === 1 ? 'Chamado' : 'Chamados'}
              </AppText>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 4 }}>
                <Ionicons
                  name={openTicketsCount > 0 ? "alert-circle-outline" : "checkmark-circle-outline"}
                  size={14}
                  color={openTicketsCount > 0 ? '#DE350B' : '#00875A'}
                />
                <AppText variant="caption" color="textSecondary" style={{ fontSize: 11 }}>
                  {openTicketsCount > 0 ? 'Requer atenção do admin' : 'Todos chamados resolvidos'}
                </AppText>
              </View>
            </View>

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
                  MÓDULOS ATIVOS
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

          {/* Support Ticket Stream (Chamados de Usuários Mobile) */}
          <Animated.View entering={FadeInDown.delay(100).duration(300)} style={[styles.sectionCard, { backgroundColor: cardBg, borderColor }]}>
            <View style={styles.sectionTitleRow}>
              <Ionicons name="ticket-outline" size={18} color="#0052CC" />
              <AppText variant="h3" style={{ fontSize: 15, fontWeight: '700', marginLeft: 6 }}>
                Chamados de Suporte Enviados pelos Usuários Mobile ({tickets.length})
              </AppText>
            </View>
            <AppText variant="caption" color="textSecondary" style={{ fontSize: 12, marginBottom: 14 }}>
              Responda ou marque o status dos chamados abertos diretamente pelo app móvel.
            </AppText>

            <View style={styles.ticketsList}>
              {tickets.length === 0 ? (
                <AppText variant="caption" color="textSecondary" align="center" style={{ paddingVertical: 20 }}>
                  Nenhum chamado pendente no momento.
                </AppText>
              ) : (
                tickets.map((t) => (
                  <View key={t.id} style={[styles.ticketBox, { borderColor }]}>
                    <View style={styles.ticketHeader}>
                      <View style={{ flex: 1 }}>
                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                          <AppText style={{ fontWeight: '700', fontSize: 14 }}>{t.subject}</AppText>
                          <View
                            style={[
                              styles.statusPill,
                              {
                                backgroundColor:
                                  t.status === 'open'
                                    ? 'rgba(222, 53, 11, 0.12)'
                                    : t.status === 'in_progress'
                                    ? 'rgba(255, 171, 0, 0.12)'
                                    : 'rgba(0, 135, 90, 0.12)',
                                flexDirection: 'row',
                                alignItems: 'center',
                                gap: 4,
                              },
                            ]}
                          >
                            <View
                              style={{
                                width: 6,
                                height: 6,
                                borderRadius: 3,
                                backgroundColor:
                                  t.status === 'open'
                                    ? '#DE350B'
                                    : t.status === 'in_progress'
                                    ? '#FFAB00'
                                    : '#00875A',
                              }}
                            />
                            <AppText
                              style={{
                                fontSize: 10,
                                fontWeight: '700',
                                color:
                                  t.status === 'open'
                                    ? '#DE350B'
                                    : t.status === 'in_progress'
                                    ? '#FFAB00'
                                    : '#00875A',
                              }}
                            >
                              {t.status === 'open'
                                ? 'Pendente'
                                : t.status === 'in_progress'
                                ? 'Em Atendimento'
                                : 'Concluído'}
                            </AppText>
                          </View>
                        </View>
                        <AppText variant="caption" color="textSecondary" style={{ fontSize: 11, marginTop: 2 }}>
                          Enviado por: {t.userName} ({t.userEmail}) • {new Date(t.createdAt).toLocaleDateString('pt-BR')}
                        </AppText>
                      </View>

                      {/* Ticket Action Buttons */}
                      <View style={styles.ticketActions}>
                        {t.status !== 'in_progress' && t.status !== 'resolved' && (
                          <TouchableOpacity
                            style={[styles.btnActionSmall, { backgroundColor: 'rgba(255, 171, 0, 0.15)', borderColor: '#FFAB00' }]}
                            onPress={() => handleTicketStatusChange(t.id, 'in_progress')}
                          >
                            <AppText style={{ fontSize: 11, fontWeight: '700', color: '#FFAB00' }}>Atender</AppText>
                          </TouchableOpacity>
                        )}
                        {t.status !== 'resolved' && (
                          <TouchableOpacity
                            style={[styles.btnActionSmall, { backgroundColor: '#00875A' }]}
                            onPress={() => handleTicketStatusChange(t.id, 'resolved')}
                          >
                            <AppText style={{ fontSize: 11, fontWeight: '700', color: '#FFF' }}>Concluir</AppText>
                          </TouchableOpacity>
                        )}
                      </View>
                    </View>

                    <AppText style={{ fontSize: 12, marginTop: 8, lineHeight: 18, color: colors.text }}>
                      "{t.message}"
                    </AppText>
                  </View>
                ))
              )}
            </View>
          </Animated.View>

          {/* Feature Flags & Habilitação de Recursos */}
          <Animated.View entering={FadeInDown.delay(140).duration(300)} style={[styles.sectionCard, { backgroundColor: cardBg, borderColor }]}>
            <View style={styles.sectionTitleRow}>
              <Ionicons name="options-outline" size={18} color="#0052CC" />
              <AppText variant="h3" style={{ fontSize: 15, fontWeight: '700', marginLeft: 6 }}>
                Gestão de Recursos & Feature Flags (Novas Telas para Usuários)
              </AppText>
            </View>

            <View style={styles.flagsGrid}>
              <View style={[styles.flagItem, { borderColor }]}>
                <View style={{ flex: 1 }}>
                  <AppText style={{ fontWeight: '600', fontSize: 13 }}>
                    Tela de Analytics & Relatórios Avançados
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
                    Assistente de Rotina Inteligente (IA)
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
                    Sincronização Cloud Automática (VPS)
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
            </View>
          </Animated.View>

          <View style={{ height: 40 }} />
        </ScrollView>

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

        {/* Academia & Treino Fitness Suite */}
        <GymWorkoutCard />

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
  safe: { flex: 1 },
  scroll: { paddingHorizontal: Spacing.base, paddingTop: Spacing.md },
  webScroll: { paddingHorizontal: 20, paddingTop: 16 },
  webHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  btnPrimary: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 6,
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
  sectionCard: {
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
  ticketsList: {
    gap: 10,
  },
  ticketBox: {
    padding: 12,
    borderRadius: 6,
    borderWidth: 1,
  },
  ticketHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
  },
  statusPill: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  ticketActions: {
    flexDirection: 'row',
    gap: 6,
  },
  btnActionSmall: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
    borderWidth: 1,
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

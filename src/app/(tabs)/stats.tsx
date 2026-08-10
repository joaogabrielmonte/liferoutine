import React, { useState } from 'react';
import {
  View,
  ScrollView,
  StyleSheet,
  Modal,
  Pressable,
  TouchableOpacity,
  Switch,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { useTheme } from '@/hooks/useTheme';
import { useHabitsStore, useTodayHabits, useTodayCompletion } from '@/stores/useHabitsStore';
import { AppText } from '@/components/atoms/AppText';
import { AppCard } from '@/components/atoms/AppCard';
import { AppButton } from '@/components/atoms/AppButton';
import { ProgressRing } from '@/components/molecules/ProgressRing';
import { HeatmapCalendar } from '@/components/molecules/HeatmapCalendar';
import { PointsLeaderboardSection } from '@/components/organisms/PointsLeaderboardSection';
import { Spacing, Radius, Shadow } from '@/constants/theme';
import { HABIT_CATEGORIES, type HabitCategory } from '@/types/habit';

type StatCardProps = {
  icon: React.ReactNode;
  label: string;
  value: string;
  subtitle?: string;
  color: string;
};

function StatCard({ icon, label, value, subtitle, color }: StatCardProps) {
  return (
    <AppCard style={[styles.statCard, { flex: 1 }]}>
      <View style={[styles.statIcon, { backgroundColor: `${color}22` }]}>
        {icon}
      </View>
      <AppText variant="h3" style={{ marginTop: Spacing.sm }}>
        {value}
      </AppText>
      <AppText variant="label" color="textSecondary">
        {label}
      </AppText>
      {subtitle && (
        <AppText variant="caption" style={{ color, marginTop: 2 }}>
          {subtitle}
        </AppText>
      )}
    </AppCard>
  );
}

export default function StatsScreen() {
  const { colors, isDark } = useTheme();
  const habits = useTodayHabits();
  const logs = useHabitsStore((state) => state.logs);
  const completion = useTodayCompletion();
  const completedToday = habits.filter((h) => h.isCompletedToday).length;

  const [selectedDateKey, setSelectedDateKey] = useState<string | null>(null);
  const [selectedDayNum, setSelectedDayNum] = useState<number | null>(null);

  // Web Feature Flags State
  const [flagAnalytics, setFlagAnalytics] = useState(true);
  const [flagAIRoutine, setFlagAIRoutine] = useState(true);
  const [flagNotifications, setFlagNotifications] = useState(true);
  const [flagTimers, setFlagTimers] = useState(true);

  const isWeb = Platform.OS === 'web';
  const cardBg = isDark ? '#172B4D' : '#FFFFFF';
  const borderColor = isDark ? '#253858' : '#DFE1E6';

  // -------------------------------------------------------------
  // WEB FEATURE FLAGS & RECURSOS CONTROL CENTER
  // -------------------------------------------------------------
  if (isWeb) {
    return (
      <SafeAreaView
        style={[styles.safe, { backgroundColor: isDark ? '#091E42' : '#FAFBFC' }]}
        edges={['top']}
      >
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.webScroll}
        >
          <Animated.View entering={FadeInDown.duration(300)} style={styles.webHeader}>
            <View style={{ flex: 1 }}>
              <AppText variant="h2" style={{ fontWeight: '700', fontSize: 20, letterSpacing: -0.3 }}>
                Gestão de Recursos & Feature Flags
              </AppText>
              <AppText variant="caption" color="textSecondary" style={{ marginTop: 2, fontSize: 13 }}>
                Habilitar ou desabilitar módulos e telas para os usuários do aplicativo mobile
              </AppText>
            </View>

            <TouchableOpacity
              style={[styles.btnPrimary, { backgroundColor: '#0052CC' }]}
              onPress={() => alert('✅ Configurações de Feature Flags salvas com sucesso!')}
              activeOpacity={0.8}
            >
              <Ionicons name="save-outline" size={16} color="#FFF" />
              <AppText style={{ color: '#FFF', fontWeight: '600', fontSize: 12, marginLeft: 6 }}>
                Salvar Alterações
              </AppText>
            </TouchableOpacity>
          </Animated.View>

          {/* Module Switches Card */}
          <Animated.View entering={FadeInDown.delay(60).duration(300)} style={[styles.vpsCard, { backgroundColor: cardBg, borderColor }]}>
            <AppText style={{ fontWeight: '700', fontSize: 15, marginBottom: 14 }}>
              Módulos Ativos no App Mobile
            </AppText>

            <View style={styles.flagsList}>
              <View style={[styles.flagRow, { borderColor }]}>
                <View style={styles.flagIconBox}>
                  <Ionicons name="stats-chart" size={18} color="#0052CC" />
                </View>
                <View style={{ flex: 1, marginLeft: 10 }}>
                  <AppText style={{ fontWeight: '600', fontSize: 13 }}>
                    Tela de Estatísticas & Calendário de Consistência
                  </AppText>
                  <AppText variant="caption" color="textSecondary" style={{ fontSize: 11 }}>
                    Permite ao usuário visualizar gráficos de progresso e heatmaps no mobile.
                  </AppText>
                </View>
                <Switch
                  value={flagAnalytics}
                  onValueChange={setFlagAnalytics}
                  trackColor={{ false: borderColor, true: '#0052CC' }}
                />
              </View>

              <View style={[styles.flagRow, { borderColor }]}>
                <View style={styles.flagIconBox}>
                  <MaterialCommunityIcons name="robot" size={18} color="#6554C0" />
                </View>
                <View style={{ flex: 1, marginLeft: 10 }}>
                  <AppText style={{ fontWeight: '600', fontSize: 13 }}>
                    Assistente Inteligente de Rotina (IA)
                  </AppText>
                  <AppText variant="caption" color="textSecondary" style={{ fontSize: 11 }}>
                    Habilita dicas personalizadas de horários para hábitos de treino e sono.
                  </AppText>
                </View>
                <Switch
                  value={flagAIRoutine}
                  onValueChange={setFlagAIRoutine}
                  trackColor={{ false: borderColor, true: '#0052CC' }}
                />
              </View>

              <View style={[styles.flagRow, { borderColor }]}>
                <View style={styles.flagIconBox}>
                  <Ionicons name="notifications" size={18} color="#FFAB00" />
                </View>
                <View style={{ flex: 1, marginLeft: 10 }}>
                  <AppText style={{ fontWeight: '600', fontSize: 13 }}>
                    Notificações Push & Lembretes Diários
                  </AppText>
                  <AppText variant="caption" color="textSecondary" style={{ fontSize: 11 }}>
                    Envia alertas agendados de hidratação e treino para o dispositivo.
                  </AppText>
                </View>
                <Switch
                  value={flagNotifications}
                  onValueChange={setFlagNotifications}
                  trackColor={{ false: borderColor, true: '#0052CC' }}
                />
              </View>

              <View style={[styles.flagRow, { borderColor }]}>
                <View style={styles.flagIconBox}>
                  <Ionicons name="stopwatch" size={18} color="#00875A" />
                </View>
                <View style={{ flex: 1, marginLeft: 10 }}>
                  <AppText style={{ fontWeight: '600', fontSize: 13 }}>
                    Modais de Cronômetro & Contador de Água
                  </AppText>
                  <AppText variant="caption" color="textSecondary" style={{ fontSize: 11 }}>
                    Exibe modais interativos ao tocar nos cards de água e exercício.
                  </AppText>
                </View>
                <Switch
                  value={flagTimers}
                  onValueChange={setFlagTimers}
                  trackColor={{ false: borderColor, true: '#0052CC' }}
                />
              </View>
            </View>
          </Animated.View>

          <View style={{ height: 40 }} />
        </ScrollView>
      </SafeAreaView>
    );
  }

  // -------------------------------------------------------------
  // MOBILE APP PROGRESS & STATS (UNTOUCHED FOR MOBILE)
  // -------------------------------------------------------------
  const currentStreak = habits.length > 0 ? Math.max(...habits.map((h) => h.streak || 0)) : 0;
  const bestStreak = habits.length > 0 ? Math.max(...habits.map((h) => h.bestStreak || h.streak || 0)) : 0;
  const totalCompletionsCount = logs.filter((l) => l.completedCount > 0).length;

  const selectedDayLogs = selectedDateKey
    ? logs.filter((l) => l.date === selectedDateKey && l.completedCount > 0)
    : [];

  const formattedSelectedDate = selectedDateKey
    ? (() => {
        const parts = selectedDateKey.split('-').map(Number);
        const d = new Date(parts[0], parts[1] - 1, parts[2]);
        return d.toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
      })()
    : '';

  return (
    <SafeAreaView
      style={[styles.safe, { backgroundColor: colors.background }]}
      edges={['top']}
    >
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scroll}
      >
        <Animated.View entering={FadeInDown.duration(400)} style={styles.header}>
          <AppText variant="h2">Progresso & Estatísticas</AppText>
          <AppText variant="caption" color="textSecondary">
            Sua constância, recordes e conquistas diárias
          </AppText>
        </Animated.View>

        <Animated.View entering={FadeInDown.delay(100).duration(400)}>
          <AppCard style={styles.mainCard} elevated>
            <AppText
              variant="title"
              align="center"
              style={{ marginBottom: Spacing.xl }}
            >
              Conclusão de Hoje
            </AppText>
            <View style={styles.ringContainer}>
              <ProgressRing
                progress={completion}
                size={160}
                strokeWidth={14}
                label={`${Math.round(completion * 100)}%`}
                sublabel={`${completedToday}/${habits.length} hábitos`}
              />
            </View>
          </AppCard>
        </Animated.View>

        <Animated.View
          entering={FadeInDown.delay(200).duration(400)}
          style={styles.statsRow}
        >
          <StatCard
            icon={<MaterialCommunityIcons name="fire" size={22} color="#F59E0B" />}
            label="SEQUÊNCIA ATUAL"
            value={`${currentStreak} ${currentStreak === 1 ? 'dia' : 'dias'}`}
            subtitle="dias seguidos"
            color="#F59E0B"
          />
          <View style={{ width: Spacing.sm }} />
          <StatCard
            icon={<MaterialCommunityIcons name="trophy-award" size={22} color="#8B5CF6" />}
            label="RECORDE MÁXIMO"
            value={`${bestStreak} ${bestStreak === 1 ? 'dia' : 'dias'}`}
            subtitle="maior sequência"
            color="#8B5CF6"
          />
        </Animated.View>

        <Animated.View entering={FadeInDown.delay(300).duration(400)}>
          <AppCard style={styles.heatmapCard}>
            <HeatmapCalendar
              logs={logs}
              totalActiveHabitsCount={habits.length}
              onSelectDay={(dateKey, dayNum) => {
                setSelectedDateKey(dateKey);
                setSelectedDayNum(dayNum);
              }}
            />
          </AppCard>
        </Animated.View>

        {/* Sistema de Pontos & Ranking Global de Usuários */}
        <PointsLeaderboardSection />

        <View style={{ height: Spacing['3xl'] }} />
      </ScrollView>

      <Modal
        visible={!!selectedDateKey}
        animationType="fade"
        transparent
        onRequestClose={() => setSelectedDateKey(null)}
      >
        <View style={styles.modalOverlay}>
          <Pressable style={styles.modalBackdrop} onPress={() => setSelectedDateKey(null)} />
          <View
            style={[
              styles.modalCard,
              { backgroundColor: colors.surfaceElevated, borderColor: colors.border },
            ]}
          >
            <View style={styles.modalHeaderRow}>
              <View style={styles.modalHeaderTitle}>
                <Ionicons name="calendar-outline" size={20} color={colors.primary} />
                <AppText variant="title" style={{ textTransform: 'capitalize' }}>
                  Dia {selectedDayNum}
                </AppText>
              </View>
              <TouchableOpacity onPress={() => setSelectedDateKey(null)} style={{ padding: 4 }}>
                <Ionicons name="close" size={22} color={colors.icon} />
              </TouchableOpacity>
            </View>

            <AppText variant="caption" color="textSecondary" style={{ marginBottom: Spacing.md }}>
              {formattedSelectedDate}
            </AppText>

            {selectedDayLogs.length === 0 ? (
              <View style={styles.emptyDayBox}>
                <Ionicons name="sunny-outline" size={32} color={colors.textTertiary} />
                <AppText variant="caption" color="textSecondary" align="center" style={{ marginTop: 6 }}>
                  Nenhum hábito foi concluído nesta data.
                </AppText>
              </View>
            ) : (
              <ScrollView style={{ maxHeight: 220 }}>
                {selectedDayLogs.map((log) => {
                  const habitObj = habits.find((h) => h.id === log.habitId);
                  return (
                    <View
                      key={log.id}
                      style={[
                        styles.logItemRow,
                        { backgroundColor: colors.background, borderColor: colors.border },
                      ]}
                    >
                      <View style={{ flex: 1 }}>
                        <AppText variant="bodyMedium" style={{ fontWeight: '600' }}>
                          {habitObj?.title || 'Hábito'}
                        </AppText>
                      </View>
                      <Ionicons name="checkmark-circle" size={20} color="#22C55E" />
                    </View>
                  );
                })}
              </ScrollView>
            )}

            <View style={{ marginTop: Spacing.md, alignItems: 'flex-end' }}>
              <AppButton label="Fechar" variant="primary" onPress={() => setSelectedDateKey(null)} />
            </View>
          </View>
        </View>
      </Modal>
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
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 6,
  },
  vpsCard: {
    padding: 16,
    borderRadius: 8,
    borderWidth: 1,
    marginBottom: 16,
  },
  flagsList: {
    gap: 10,
  },
  flagRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 6,
    borderWidth: 1,
  },
  flagIconBox: {
    width: 32,
    height: 32,
    borderRadius: 6,
    backgroundColor: 'rgba(0,0,0,0.04)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  header: { marginBottom: Spacing.xl },
  mainCard: { marginBottom: Spacing.md, alignItems: 'center' },
  ringContainer: { alignItems: 'center', marginBottom: Spacing.md },
  statsRow: {
    flexDirection: 'row',
    marginBottom: Spacing.md,
  },
  statCard: { padding: Spacing.base },
  statIcon: {
    width: 40,
    height: 40,
    borderRadius: Radius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  heatmapCard: {
    padding: Spacing.base,
    marginBottom: Spacing.md,
  },
  modalOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.65)',
    padding: Spacing.base,
  },
  modalBackdrop: {
    ...StyleSheet.absoluteFillObject,
  },
  modalCard: {
    width: '100%',
    maxWidth: 360,
    borderRadius: Radius['2xl'],
    padding: Spacing.lg,
    borderWidth: StyleSheet.hairlineWidth,
    ...Shadow.lg,
  },
  modalHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  modalHeaderTitle: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
  },
  emptyDayBox: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Spacing.lg,
  },
  logItemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.md,
    borderRadius: Radius.md,
    borderWidth: 1,
    marginBottom: Spacing.xs,
    gap: Spacing.sm,
  },
});

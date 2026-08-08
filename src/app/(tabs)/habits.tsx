import React, { useState, useEffect } from 'react';
import {
  View,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { useTheme } from '@/hooks/useTheme';
import { useHabitsStore } from '@/stores/useHabitsStore';
import { AppText } from '@/components/atoms/AppText';
import { HabitCard } from '@/components/molecules/HabitCard';
import { CreateHabitModal } from '@/components/organisms/CreateHabitModal';
import { getSupportTickets, createSupportTicket, type SupportTicket } from '@/services/tickets';

type TableName = 'support_tickets' | 'users' | 'habits' | 'habit_logs';

export default function HabitsScreen() {
  const { colors, isDark } = useTheme();
  const habits = useHabitsStore((state) => state.habits);
  const logs = useHabitsStore((state) => state.logs);
  const isWeb = Platform.OS === 'web';

  // Web Database Explorer state
  const [selectedTable, setSelectedTable] = useState<TableName>('support_tickets');
  const [tickets, setTickets] = useState<SupportTicket[]>([]);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

  useEffect(() => {
    if (isWeb) {
      getSupportTickets().then(setTickets);

      if (typeof window !== 'undefined') {
        const handleSync = () => getSupportTickets().then(setTickets);
        window.addEventListener('liferoutine_tickets_updated', handleSync);
        return () => window.removeEventListener('liferoutine_tickets_updated', handleSync);
      }
    }
  }, [isWeb, selectedTable]);

  const cardBg = isDark ? '#172B4D' : '#FFFFFF';
  const borderColor = isDark ? '#253858' : '#DFE1E6';
  const headerBg = isDark ? '#18181B' : '#F4F4F5';

  if (isWeb) {
    // -------------------------------------------------------------
    // WEB POSTGRESQL DATABASE EXPLORER & SCHEMA INSPECTOR
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
          <Animated.View entering={FadeInDown.duration(300)} style={styles.webHeader}>
            <View style={{ flex: 1 }}>
              <AppText variant="h2" style={{ fontWeight: '700', fontSize: 20, letterSpacing: -0.3 }}>
                Database Explorer (PostgreSQL 16 Engine)
              </AppText>
              <AppText variant="caption" color="textSecondary" style={{ marginTop: 2, fontSize: 13 }}>
                Inspeção de tabelas, esquemas e registros em tempo real no banco do servidor Oracle VPS
              </AppText>
            </View>
            <View style={{ flexDirection: 'row', gap: 8 }}>
              <TouchableOpacity
                style={[styles.btnRefresh, { backgroundColor: '#00875A' }]}
                onPress={async () => {
                  const res = await createSupportTicket(
                    'Teste de Chamado via Database Explorer',
                    'Este chamado de teste foi inserido via Web Admin para verificar a sincronização do banco.',
                    'Gabriel Monte',
                    'gabriel@liferoutine.com'
                  );
                  setTickets(res.tickets);
                }}
              >
                <Ionicons name="add-circle" size={14} color="#FFF" />
                <AppText style={{ color: '#FFF', fontWeight: '600', fontSize: 12, marginLeft: 4 }}>
                  Injetar Chamado no Banco
                </AppText>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.btnRefresh, { backgroundColor: '#0052CC' }]}
                onPress={() => getSupportTickets().then(setTickets)}
              >
                <Ionicons name="refresh" size={14} color="#FFF" />
                <AppText style={{ color: '#FFF', fontWeight: '600', fontSize: 12, marginLeft: 4 }}>
                  Recarregar Dados
                </AppText>
              </TouchableOpacity>
            </View>
          </Animated.View>

          {/* Table Selector Tabs */}
          <Animated.View entering={FadeInDown.delay(60).duration(300)} style={styles.tableTabRow}>
            {[
              { id: 'support_tickets', label: 'public.support_tickets', icon: 'ticket-outline' },
              { id: 'users', label: 'public.users', icon: 'people-outline' },
              { id: 'habits', label: 'public.habits', icon: 'list-outline' },
              { id: 'habit_logs', label: 'public.habit_logs', icon: 'time-outline' },
            ].map((t) => {
              const isSelected = selectedTable === t.id;
              return (
                <TouchableOpacity
                  key={t.id}
                  style={[
                    styles.dbTabBtn,
                    {
                      backgroundColor: isSelected ? '#0052CC' : cardBg,
                      borderColor: isSelected ? '#0052CC' : borderColor,
                    },
                  ]}
                  onPress={() => setSelectedTable(t.id as any)}
                  activeOpacity={0.7}
                >
                  <Ionicons name={t.icon as any} size={15} color={isSelected ? '#FFF' : colors.textSecondary} />
                  <AppText
                    style={{
                      fontSize: 13,
                      fontWeight: isSelected ? '700' : '500',
                      color: isSelected ? '#FFF' : colors.textSecondary,
                      marginLeft: 6,
                    }}
                  >
                    {t.label}
                  </AppText>
                </TouchableOpacity>
              );
            })}
          </Animated.View>

          {/* Data Table Grid */}
          <Animated.View entering={FadeInDown.delay(120).duration(300)} style={[styles.dbViewerCard, { backgroundColor: cardBg, borderColor }]}>
            <View style={styles.schemaHeaderRow}>
              <MaterialCommunityIcons name="table-search" size={18} color="#0052CC" />
              <AppText style={{ fontWeight: '700', fontSize: 14, marginLeft: 6 }}>
                Tabela: public.{selectedTable} ({
                  selectedTable === 'support_tickets' ? tickets.length :
                  selectedTable === 'habits' ? habits.length :
                  selectedTable === 'habit_logs' ? logs.length : 2
                } registros)
              </AppText>
            </View>

            <ScrollView horizontal showsHorizontalScrollIndicator>
              <View style={styles.tableContainer}>
                {/* Support Tickets Table */}
                {selectedTable === 'support_tickets' && (
                  <>
                    <View style={[styles.thRow, { backgroundColor: headerBg, borderBottomColor: borderColor }]}>
                      <AppText variant="caption" style={[styles.th, { width: 100 }]} color="textSecondary">ID</AppText>
                      <AppText variant="caption" style={[styles.th, { width: 140 }]} color="textSecondary">USUÁRIO</AppText>
                      <AppText variant="caption" style={[styles.th, { width: 180 }]} color="textSecondary">ASSUNTO</AppText>
                      <AppText variant="caption" style={[styles.th, { width: 220 }]} color="textSecondary">MENSAGEM</AppText>
                      <AppText variant="caption" style={[styles.th, { width: 100 }]} color="textSecondary">STATUS</AppText>
                      <AppText variant="caption" style={[styles.th, { width: 140 }]} color="textSecondary">DATA CRIADO</AppText>
                    </View>

                    {tickets.length === 0 ? (
                      <View style={{ padding: 20 }}>
                        <AppText variant="caption" color="textSecondary" align="center">
                          Nenhum chamado registrado no banco de dados.
                        </AppText>
                      </View>
                    ) : (
                      tickets.map((ticket) => (
                        <View key={ticket.id} style={[styles.trRow, { borderBottomColor: borderColor }]}>
                          <AppText style={[styles.td, { width: 100, fontWeight: '700' }]}>{ticket.id}</AppText>
                          <AppText style={[styles.td, { width: 140 }]}>{ticket.userName}</AppText>
                          <AppText style={[styles.td, { width: 180, fontWeight: '600', color: '#0052CC' }]}>{ticket.subject}</AppText>
                          <AppText style={[styles.td, { width: 220, color: colors.textSecondary }]} numberOfLines={2}>{ticket.message}</AppText>
                          <AppText style={[styles.td, { width: 100, fontWeight: '700', color: ticket.status === 'open' ? '#DE350B' : '#00875A' }]}>
                            {ticket.status.toUpperCase()}
                          </AppText>
                          <AppText style={[styles.td, { width: 140, color: colors.textSecondary }]}>
                            {new Date(ticket.createdAt).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                          </AppText>
                        </View>
                      ))
                    )}
                  </>
                )}

                {/* Users Table */}
                {selectedTable === 'users' && (
                  <>
                    <View style={[styles.thRow, { backgroundColor: headerBg, borderBottomColor: borderColor }]}>
                      <AppText variant="caption" style={[styles.th, { width: 120 }]} color="textSecondary">ID</AppText>
                      <AppText variant="caption" style={[styles.th, { width: 160 }]} color="textSecondary">NOME</AppText>
                      <AppText variant="caption" style={[styles.th, { width: 200 }]} color="textSecondary">EMAIL</AppText>
                      <AppText variant="caption" style={[styles.th, { width: 100 }]} color="textSecondary">WAKE_TIME</AppText>
                      <AppText variant="caption" style={[styles.th, { width: 100 }]} color="textSecondary">SLEEP_TIME</AppText>
                    </View>

                    <View style={[styles.trRow, { borderBottomColor: borderColor }]}>
                      <AppText style={[styles.td, { width: 120, fontWeight: '700' }]}>u-101</AppText>
                      <AppText style={[styles.td, { width: 160 }]}>Gabriel Monte</AppText>
                      <AppText style={[styles.td, { width: 200, color: '#0052CC' }]}>gabriel@liferoutine.com</AppText>
                      <AppText style={[styles.td, { width: 100 }]}>07:00</AppText>
                      <AppText style={[styles.td, { width: 100 }]}>23:00</AppText>
                    </View>

                    <View style={[styles.trRow, { borderBottomColor: borderColor }]}>
                      <AppText style={[styles.td, { width: 120, fontWeight: '700' }]}>u-102</AppText>
                      <AppText style={[styles.td, { width: 160 }]}>Emmanuel Fernando</AppText>
                      <AppText style={[styles.td, { width: 200, color: '#0052CC' }]}>emmanuelfernando@gmail.com</AppText>
                      <AppText style={[styles.td, { width: 100 }]}>06:30</AppText>
                      <AppText style={[styles.td, { width: 100 }]}>22:30</AppText>
                    </View>
                  </>
                )}

                {/* Habits Table */}
                {selectedTable === 'habits' && (
                  <>
                    <View style={[styles.thRow, { backgroundColor: headerBg, borderBottomColor: borderColor }]}>
                      <AppText variant="caption" style={[styles.th, { width: 80 }]} color="textSecondary">ID</AppText>
                      <AppText variant="caption" style={[styles.th, { width: 160 }]} color="textSecondary">TÍTULO</AppText>
                      <AppText variant="caption" style={[styles.th, { width: 100 }]} color="textSecondary">TARGET_COUNT</AppText>
                      <AppText variant="caption" style={[styles.th, { width: 100 }]} color="textSecondary">CATEGORY</AppText>
                    </View>

                    {habits.map((h) => (
                      <View key={h.id} style={[styles.trRow, { borderBottomColor: borderColor }]}>
                        <AppText style={[styles.td, { width: 80, fontWeight: '700' }]}>{h.id}</AppText>
                        <AppText style={[styles.td, { width: 160, fontWeight: '600' }]}>{h.title}</AppText>
                        <AppText style={[styles.td, { width: 100, color: '#0052CC' }]}>{h.targetCount} {h.unit}</AppText>
                        <AppText style={[styles.td, { width: 100 }]}>{h.category}</AppText>
                      </View>
                    ))}
                  </>
                )}

                {/* Habit Logs Table */}
                {selectedTable === 'habit_logs' && (
                  <>
                    <View style={[styles.thRow, { backgroundColor: headerBg, borderBottomColor: borderColor }]}>
                      <AppText variant="caption" style={[styles.th, { width: 120 }]} color="textSecondary">ID</AppText>
                      <AppText variant="caption" style={[styles.th, { width: 100 }]} color="textSecondary">HABIT_ID</AppText>
                      <AppText variant="caption" style={[styles.th, { width: 120 }]} color="textSecondary">COMPLETED_COUNT</AppText>
                      <AppText variant="caption" style={[styles.th, { width: 120 }]} color="textSecondary">DATE</AppText>
                    </View>

                    {logs.map((log) => (
                      <View key={log.id} style={[styles.trRow, { borderBottomColor: borderColor }]}>
                        <AppText style={[styles.td, { width: 120, fontWeight: '700' }]}>{log.id}</AppText>
                        <AppText style={[styles.td, { width: 100 }]}>{log.habitId}</AppText>
                        <AppText style={[styles.td, { width: 120, color: '#00875A', fontWeight: '700' }]}>{log.completedCount}</AppText>
                        <AppText style={[styles.td, { width: 120, color: colors.textSecondary }]}>{log.date}</AppText>
                      </View>
                    ))}
                  </>
                )}
              </View>
            </ScrollView>
          </Animated.View>

          <View style={{ height: 40 }} />
        </ScrollView>
      </SafeAreaView>
    );
  }

  // Mobile App Native Layout (Untouched)
  return (
    <SafeAreaView
      style={[styles.safe, { backgroundColor: colors.background }]}
      edges={['top']}
    >
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scroll}
      >
        <View style={styles.headerRow}>
          <AppText variant="h2">Gerenciar Hábitos</AppText>
          <TouchableOpacity
            style={[styles.addBtn, { backgroundColor: colors.primary }]}
            onPress={() => setIsCreateModalOpen(true)}
          >
            <Ionicons name="add" size={18} color="#FFF" />
            <AppText style={{ color: '#FFF', fontWeight: '700', marginLeft: 4 }}>Novo</AppText>
          </TouchableOpacity>
        </View>

        <View style={styles.list}>
          {habits.map((habit) => (
            <HabitCard key={habit.id} habit={habit as any} />
          ))}
        </View>
      </ScrollView>

      <CreateHabitModal
        visible={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  scroll: { padding: 16 },
  webScroll: { paddingHorizontal: 20, paddingTop: 16 },
  webHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  btnRefresh: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
  },
  tableTabRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 16,
    flexWrap: 'wrap',
  },
  dbTabBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
  },
  dbViewerCard: {
    borderRadius: 10,
    borderWidth: 1,
    padding: 16,
    overflow: 'hidden',
  },
  schemaHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 14,
  },
  tableContainer: {
    minWidth: 700,
  },
  thRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderBottomWidth: 1,
    borderRadius: 6,
  },
  th: {
    fontWeight: '700',
    fontSize: 11,
    letterSpacing: 0.5,
  },
  trRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderBottomWidth: 1,
  },
  td: {
    fontSize: 13,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  addBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 8,
  },
  list: { gap: 12 },
});

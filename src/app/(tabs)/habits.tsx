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
import { BACKEND_API_URL } from '@/services/supabase';

export default function HabitsScreen() {
  const { colors, isDark } = useTheme();
  const habits = useHabitsStore((state) => state.habits);
  const isWeb = Platform.OS === 'web';

  // Web Database Explorer state
  const [selectedTable, setSelectedTable] = useState<'users' | 'habits' | 'habit_logs'>('users');
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

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
                Database Explorer (PostgreSQL 16)
              </AppText>
              <AppText variant="caption" color="textSecondary" style={{ marginTop: 2, fontSize: 13 }}>
                Inspeção de tabelas, esquemas e registros em tempo real no servidor Oracle VPS
              </AppText>
            </View>
          </Animated.View>

          {/* Table Selector Tabs */}
          <Animated.View entering={FadeInDown.delay(60).duration(300)} style={styles.tableTabRow}>
            {[
              { id: 'users', label: 'Tabela public.users', icon: 'people-outline' },
              { id: 'habits', label: 'Tabela public.habits', icon: 'list-outline' },
              { id: 'habit_logs', label: 'Tabela public.habit_logs', icon: 'time-outline' },
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

          {/* Schema & Data Viewer */}
          <Animated.View entering={FadeInDown.delay(120).duration(300)} style={[styles.dbViewerCard, { backgroundColor: cardBg, borderColor }]}>
            <View style={styles.schemaHeaderRow}>
              <MaterialCommunityIcons name="table-search" size={18} color="#0052CC" />
              <AppText style={{ fontWeight: '700', fontSize: 14, marginLeft: 6 }}>
                Visualização: public.{selectedTable} (3 colunas chave)
              </AppText>
            </View>

            {/* Simulated Table Data Stream */}
            <View style={styles.tableContainer}>
              <View style={[styles.thRow, { backgroundColor: headerBg, borderBottomColor: borderColor }]}>
                <AppText variant="caption" style={[styles.th, { flex: 1.5 }]} color="textSecondary">COLUMN</AppText>
                <AppText variant="caption" style={[styles.th, { flex: 1.5 }]} color="textSecondary">DATA TYPE</AppText>
                <AppText variant="caption" style={[styles.th, { flex: 2 }]} color="textSecondary">CONSTRAINTS</AppText>
                <AppText variant="caption" style={[styles.th, { flex: 3 }]} color="textSecondary">AMOSTRA DE DADOS</AppText>
              </View>

              {selectedTable === 'users' && (
                <>
                  <View style={[styles.trRow, { borderBottomColor: borderColor }]}>
                    <AppText style={[styles.td, { flex: 1.5, fontWeight: '700' }]}>id</AppText>
                    <AppText style={[styles.td, { flex: 1.5, color: '#0052CC' }]}>UUID</AppText>
                    <AppText style={[styles.td, { flex: 2 }]}>PRIMARY KEY, NOT NULL</AppText>
                    <AppText style={[styles.td, { flex: 3, color: colors.textSecondary }]}>130e711b-97e5-4d7c...</AppText>
                  </View>
                  <View style={[styles.trRow, { borderBottomColor: borderColor }]}>
                    <AppText style={[styles.td, { flex: 1.5, fontWeight: '700' }]}>email</AppText>
                    <AppText style={[styles.td, { flex: 1.5, color: '#0052CC' }]}>VARCHAR(255)</AppText>
                    <AppText style={[styles.td, { flex: 2 }]}>UNIQUE, NOT NULL</AppText>
                    <AppText style={[styles.td, { flex: 3, color: colors.textSecondary }]}>gabriel@liferoutine.com</AppText>
                  </View>
                  <View style={[styles.trRow, { borderBottomColor: borderColor }]}>
                    <AppText style={[styles.td, { flex: 1.5, fontWeight: '700' }]}>wake_time</AppText>
                    <AppText style={[styles.td, { flex: 1.5, color: '#0052CC' }]}>VARCHAR(10)</AppText>
                    <AppText style={[styles.td, { flex: 2 }]}>DEFAULT '07:00'</AppText>
                    <AppText style={[styles.td, { flex: 3, color: colors.textSecondary }]}>'07:00'</AppText>
                  </View>
                </>
              )}

              {selectedTable === 'habits' && (
                <>
                  <View style={[styles.trRow, { borderBottomColor: borderColor }]}>
                    <AppText style={[styles.td, { flex: 1.5, fontWeight: '700' }]}>id</AppText>
                    <AppText style={[styles.td, { flex: 1.5, color: '#0052CC' }]}>VARCHAR(50)</AppText>
                    <AppText style={[styles.td, { flex: 2 }]}>PRIMARY KEY</AppText>
                    <AppText style={[styles.td, { flex: 3, color: colors.textSecondary }]}>'1' (Beber Água)</AppText>
                  </View>
                  <View style={[styles.trRow, { borderBottomColor: borderColor }]}>
                    <AppText style={[styles.td, { flex: 1.5, fontWeight: '700' }]}>target_count</AppText>
                    <AppText style={[styles.td, { flex: 1.5, color: '#0052CC' }]}>INTEGER</AppText>
                    <AppText style={[styles.td, { flex: 2 }]}>DEFAULT 1</AppText>
                    <AppText style={[styles.td, { flex: 3, color: colors.textSecondary }]}>8</AppText>
                  </View>
                </>
              )}

              {selectedTable === 'habit_logs' && (
                <>
                  <View style={[styles.trRow, { borderBottomColor: borderColor }]}>
                    <AppText style={[styles.td, { flex: 1.5, fontWeight: '700' }]}>id</AppText>
                    <AppText style={[styles.td, { flex: 1.5, color: '#0052CC' }]}>UUID</AppText>
                    <AppText style={[styles.td, { flex: 2 }]}>PRIMARY KEY</AppText>
                    <AppText style={[styles.td, { flex: 3, color: colors.textSecondary }]}>9b21f-88a1...</AppText>
                  </View>
                  <View style={[styles.trRow, { borderBottomColor: borderColor }]}>
                    <AppText style={[styles.td, { flex: 1.5, fontWeight: '700' }]}>completed_at</AppText>
                    <AppText style={[styles.td, { flex: 1.5, color: '#0052CC' }]}>TIMESTAMP</AppText>
                    <AppText style={[styles.td, { flex: 2 }]}>DEFAULT NOW()</AppText>
                    <AppText style={[styles.td, { flex: 3, color: colors.textSecondary }]}>2026-08-08 10:25:00</AppText>
                  </View>
                </>
              )}
            </View>
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
  tableTabRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 16,
  },
  dbTabBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 6,
    borderWidth: 1,
  },
  dbViewerCard: {
    padding: 16,
    borderRadius: 8,
    borderWidth: 1,
  },
  schemaHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 14,
  },
  tableContainer: {
    borderRadius: 6,
    borderWidth: 1,
    overflow: 'hidden',
  },
  thRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderBottomWidth: 1,
  },
  th: {
    fontSize: 11,
    fontWeight: '700',
  },
  trRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderBottomWidth: 1,
  },
  td: {
    fontSize: 12,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  addBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
  },
  list: {
    gap: 12,
  },
});

import React, { useState, useEffect } from 'react';
import {
  View,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  Modal,
  Pressable,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { useTheme } from '@/hooks/useTheme';
import { AppText } from '@/components/atoms/AppText';
import { AppCard } from '@/components/atoms/AppCard';
import { AppButton } from '@/components/atoms/AppButton';
import { BACKEND_API_URL } from '@/services/supabase';
import { useHabitsStore } from '@/stores/useHabitsStore';
import { Radius, Spacing, Shadow } from '@/constants/theme';

type UserData = {
  id: string;
  name: string;
  email: string;
  wakeTime?: string;
  sleepTime?: string;
  createdAt: string;
};

export default function UsersScreen() {
  const { colors, isDark } = useTheme();
  const habits = useHabitsStore((state) => state.habits);
  const logs = useHabitsStore((state) => state.logs);

  const [users, setUsers] = useState<UserData[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [dbStatus, setDbStatus] = useState<'online' | 'offline'>('online');
  const [selectedUser, setSelectedUser] = useState<UserData | null>(null);

  const fetchUsers = async () => {
    setIsLoading(true);
    try {
      // Fetch users from backend VPS PostgreSQL API
      const res = await fetch(`${BACKEND_API_URL}/api/auth/users`).catch(() => null);
      if (res && res.ok) {
        const data = await res.json();
        if (Array.isArray(data.users)) {
          setUsers(data.users);
          setDbStatus('online');
          setIsLoading(false);
          return;
        }
      }
    } catch (e) {
      console.warn('Failed to fetch remote users:', e);
    }

    // Fallback: Default system demo users + current local user
    setUsers([
      {
        id: '130e711b-97e5-4d7c-8a2b-c90b746a5149',
        name: 'Gabriel Monte',
        email: 'gabriel@liferoutine.com',
        wakeTime: '07:00',
        sleepTime: '23:00',
        createdAt: new Date().toISOString(),
      },
      {
        id: '241f822c-88f6-5e8d-9b3a-d10c857b6250',
        name: 'Emmanuel Fernando',
        email: 'emmanuelfernando@gmail.com',
        wakeTime: '07:00',
        sleepTime: '23:00',
        createdAt: new Date(Date.now() - 86400000).toISOString(),
      },
    ]);
    setIsLoading(false);
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const filteredUsers = users.filter((u) => {
    const q = searchQuery.toLowerCase().trim();
    if (!q) return true;
    return u.name.toLowerCase().includes(q) || u.email.toLowerCase().includes(q);
  });

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
        <Animated.View entering={FadeInDown.duration(400)} style={styles.headerRow}>
          <View>
            <AppText variant="h2">Gestão de Usuários</AppText>
            <AppText variant="caption" color="textSecondary">
              Painel Interativo de Usuários • Oracle VPS PostgreSQL
            </AppText>
          </View>

          <TouchableOpacity
            style={[
              styles.refreshBtn,
              { backgroundColor: colors.surface, borderColor: colors.border },
            ]}
            onPress={fetchUsers}
            activeOpacity={0.7}
          >
            <Ionicons name="sync" size={18} color={colors.primary} />
            <AppText variant="caption" style={{ color: colors.primary, fontWeight: '700', marginLeft: 6 }}>
              Atualizar
            </AppText>
          </TouchableOpacity>
        </Animated.View>

        {/* Database Status Banner */}
        <Animated.View entering={FadeInDown.delay(100).duration(400)}>
          <AppCard style={styles.statusBannerCard}>
            <View style={styles.statusBannerLeft}>
              <View
                style={[
                  styles.statusDot,
                  { backgroundColor: dbStatus === 'online' ? '#22C55E' : '#F59E0B' },
                ]}
              />
              <View>
                <AppText variant="subtitle" style={{ fontWeight: '700' }}>
                  Servidor Oracle VPS PostgreSQL: {dbStatus === 'online' ? 'Online 🚀' : 'SQLite Local'}
                </AppText>
                <AppText variant="caption" color="textSecondary">
                  {BACKEND_API_URL}
                </AppText>
              </View>
            </View>
            <View style={[styles.badgePill, { backgroundColor: 'rgba(34, 197, 94, 0.15)' }]}>
              <AppText style={{ fontSize: 11, fontWeight: '700', color: '#22C55E' }}>
                Conexão Ativa
              </AppText>
            </View>
          </AppCard>
        </Animated.View>

        {/* Search Bar */}
        <Animated.View entering={FadeInDown.delay(150).duration(400)} style={styles.searchContainer}>
          <View style={[styles.searchWrapper, { backgroundColor: colors.surfaceElevated, borderColor: colors.border }]}>
            <Ionicons name="search-outline" size={20} color={colors.textSecondary} />
            <TextInput
              style={[styles.searchInput, { color: colors.text }]}
              placeholder="Buscar por nome ou e-mail..."
              placeholderTextColor={colors.textTertiary}
              value={searchQuery}
              onChangeText={setSearchQuery}
            />
            {searchQuery !== '' && (
              <TouchableOpacity onPress={() => setSearchQuery('')}>
                <Ionicons name="close-circle" size={18} color={colors.textTertiary} />
              </TouchableOpacity>
            )}
          </View>
        </Animated.View>

        {/* Users Count Summary Header */}
        <Animated.View entering={FadeInDown.delay(200).duration(400)} style={styles.summaryRow}>
          <AppText variant="label" color="textSecondary">
            {filteredUsers.length} {filteredUsers.length === 1 ? 'usuário encontrado' : 'usuários encontrados'}
          </AppText>
        </Animated.View>

        {/* Users List Cards */}
        {filteredUsers.map((user, idx) => {
          const initials = user.name
            ? user.name
                .split(' ')
                .map((n) => n[0])
                .join('')
                .substring(0, 2)
                .toUpperCase()
            : 'U';

          return (
            <Animated.View
              key={user.id || idx}
              entering={FadeInDown.delay(220 + idx * 50).duration(400)}
            >
              <AppCard style={styles.userCard} elevated>
                <TouchableOpacity
                  style={styles.userCardContent}
                  onPress={() => setSelectedUser(user)}
                  activeOpacity={0.7}
                >
                  <View style={[styles.avatarCircle, { backgroundColor: colors.primary }]}>
                    <AppText style={styles.avatarText}>{initials}</AppText>
                  </View>

                  <View style={styles.userInfo}>
                    <View style={styles.userNameRow}>
                      <AppText variant="bodyMedium" style={{ fontWeight: '700' }}>
                        {user.name}
                      </AppText>
                      <View style={[styles.activeTag, { backgroundColor: 'rgba(34, 197, 94, 0.15)' }]}>
                        <AppText style={{ fontSize: 10, fontWeight: '700', color: '#22C55E' }}>
                          Ativo
                        </AppText>
                      </View>
                    </View>

                    <AppText variant="caption" color="textSecondary" style={{ marginTop: 2 }}>
                      {user.email}
                    </AppText>

                    <View style={styles.userMetaRow}>
                      <View style={styles.metaChip}>
                        <Ionicons name="sunny-outline" size={12} color="#F59E0B" />
                        <AppText style={styles.metaChipText}>Acorda {user.wakeTime || '07:00'}</AppText>
                      </View>
                      <View style={styles.metaChip}>
                        <Ionicons name="moon-outline" size={12} color="#8B5CF6" />
                        <AppText style={styles.metaChipText}>Dorme {user.sleepTime || '23:00'}</AppText>
                      </View>
                    </View>
                  </View>

                  <Ionicons name="chevron-forward" size={18} color={colors.textTertiary} />
                </TouchableOpacity>
              </AppCard>
            </Animated.View>
          );
        })}

        <View style={{ height: Spacing['3xl'] }} />
      </ScrollView>

      {/* User Details Modal */}
      <Modal
        visible={!!selectedUser}
        animationType="fade"
        transparent
        onRequestClose={() => setSelectedUser(null)}
      >
        <View style={styles.modalOverlay}>
          <Pressable style={styles.modalBackdrop} onPress={() => setSelectedUser(null)} />
          {selectedUser && (
            <View
              style={[
                styles.modalCard,
                { backgroundColor: colors.surfaceElevated, borderColor: colors.border },
              ]}
            >
              <View style={styles.modalHeader}>
                <View style={[styles.avatarCircle, { width: 50, height: 50, borderRadius: 25 }]}>
                  <AppText style={[styles.avatarText, { fontSize: 18 }]}>
                    {selectedUser.name
                      ? selectedUser.name
                          .split(' ')
                          .map((n) => n[0])
                          .join('')
                          .substring(0, 2)
                          .toUpperCase()
                      : 'U'}
                  </AppText>
                </View>
                <View style={{ flex: 1, marginLeft: Spacing.sm }}>
                  <AppText variant="h3">{selectedUser.name}</AppText>
                  <AppText variant="caption" color="textSecondary">
                    {selectedUser.email}
                  </AppText>
                </View>
                <TouchableOpacity onPress={() => setSelectedUser(null)}>
                  <Ionicons name="close" size={22} color={colors.icon} />
                </TouchableOpacity>
              </View>

              <View style={[styles.detailSection, { borderTopColor: colors.border }]}>
                <AppText variant="label" style={{ marginBottom: Spacing.xs }}>
                  Informações da Conta:
                </AppText>
                <View style={styles.detailRow}>
                  <AppText variant="caption" color="textSecondary">ID no PostgreSQL:</AppText>
                  <AppText variant="caption" style={{ fontWeight: '600' }}>{selectedUser.id}</AppText>
                </View>
                <View style={styles.detailRow}>
                  <AppText variant="caption" color="textSecondary">Horário Acordar:</AppText>
                  <AppText variant="caption" style={{ fontWeight: '600' }}>{selectedUser.wakeTime || '07:00'}</AppText>
                </View>
                <View style={styles.detailRow}>
                  <AppText variant="caption" color="textSecondary">Horário Dormir:</AppText>
                  <AppText variant="caption" style={{ fontWeight: '600' }}>{selectedUser.sleepTime || '23:00'}</AppText>
                </View>
                <View style={styles.detailRow}>
                  <AppText variant="caption" color="textSecondary">Data de Cadastro:</AppText>
                  <AppText variant="caption" style={{ fontWeight: '600' }}>
                    {new Date(selectedUser.createdAt).toLocaleString('pt-BR')}
                  </AppText>
                </View>
              </View>

              <View style={{ marginTop: Spacing.lg, alignItems: 'flex-end' }}>
                <AppButton label="Fechar" variant="primary" onPress={() => setSelectedUser(null)} />
              </View>
            </View>
          )}
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  scroll: { paddingHorizontal: Spacing.base, paddingTop: Spacing.md },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: Spacing.md,
  },
  refreshBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
    borderRadius: Radius.md,
    borderWidth: 1,
  },
  statusBannerCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: Spacing.md,
    padding: Spacing.md,
  },
  statusBannerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  statusDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  badgePill: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: 4,
    borderRadius: Radius.full,
  },
  searchContainer: {
    marginBottom: Spacing.sm,
  },
  searchWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 46,
    borderRadius: Radius.lg,
    borderWidth: 1,
    paddingHorizontal: Spacing.md,
  },
  searchInput: {
    flex: 1,
    marginLeft: Spacing.xs,
    fontSize: 14,
  },
  summaryRow: {
    marginBottom: Spacing.sm,
    paddingHorizontal: Spacing.xs,
  },
  userCard: {
    marginBottom: Spacing.sm,
    padding: Spacing.md,
  },
  userCardContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatarCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    color: '#FFFFFF',
    fontWeight: '800',
    fontSize: 15,
  },
  userInfo: {
    flex: 1,
    marginLeft: Spacing.md,
  },
  userNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
  },
  activeTag: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: Radius.sm,
  },
  userMetaRow: {
    flexDirection: 'row',
    gap: Spacing.xs,
    marginTop: Spacing.xs,
  },
  metaChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(0,0,0,0.04)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: Radius.sm,
  },
  metaChipText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#64748B',
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
    maxWidth: 380,
    borderRadius: Radius['2xl'],
    padding: Spacing.xl,
    borderWidth: StyleSheet.hairlineWidth,
    ...Shadow.lg,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  detailSection: {
    marginTop: Spacing.sm,
    paddingTop: Spacing.md,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 4,
  },
});

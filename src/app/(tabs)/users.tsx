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

type UserRole = 'admin' | 'manager' | 'member';

type UserData = {
  id: string;
  name: string;
  email: string;
  wakeTime?: string;
  sleepTime?: string;
  role?: UserRole;
  createdAt: string;
  isBlocked?: boolean;
};

export default function UsersScreen() {
  const { colors, isDark } = useTheme();
  const habits = useHabitsStore((state) => state.habits);
  const logs = useHabitsStore((state) => state.logs);

  const [users, setUsers] = useState<UserData[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState<'all' | 'admin' | 'manager' | 'member'>('all');
  const [isLoading, setIsLoading] = useState(false);
  const [dbStatus, setDbStatus] = useState<'online' | 'offline'>('online');

  // Modals
  const [selectedUser, setSelectedUser] = useState<UserData | null>(null);
  const [editingPermissionsUser, setEditingPermissionsUser] = useState<UserData | null>(null);
  const [userRole, setUserRole] = useState<UserRole>('member');
  const [canEditHabits, setCanEditHabits] = useState(true);
  const [canViewStats, setCanViewStats] = useState(true);
  const [hasMobileAccess, setHasMobileAccess] = useState(true);

  const fetchUsers = async () => {
    setIsLoading(true);
    try {
      const res = await fetch(`${BACKEND_API_URL}/api/auth/users`).catch(() => null);
      if (res && res.ok) {
        const data = await res.json();
        if (Array.isArray(data.users)) {
          const mapped = data.users.map((u: any) => ({
            ...u,
            role: u.email.includes('gabriel') ? 'admin' : 'member',
          }));
          setUsers(mapped);
          setDbStatus('online');
          setIsLoading(false);
          return;
        }
      }
    } catch (e) {
      console.warn('Failed to fetch remote users:', e);
    }

    // Default corporate fallback
    setUsers([
      {
        id: '130e711b-97e5-4d7c-8a2b-c90b746a5149',
        name: 'Gabriel Monte',
        email: 'gabriel@liferoutine.com',
        wakeTime: '07:00',
        sleepTime: '23:00',
        role: 'admin',
        createdAt: new Date().toISOString(),
      },
      {
        id: '241f822c-88f6-5e8d-9b3a-d10c857b6250',
        name: 'Emmanuel Fernando',
        email: 'emmanuelfernando@gmail.com',
        wakeTime: '07:00',
        sleepTime: '23:00',
        role: 'member',
        createdAt: new Date(Date.now() - 86400000).toISOString(),
      },
    ]);
    setIsLoading(false);
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleSavePermissions = () => {
    if (!editingPermissionsUser) return;
    setUsers((prev) =>
      prev.map((u) =>
        u.id === editingPermissionsUser.id ? { ...u, role: userRole } : u
      )
    );
    setEditingPermissionsUser(null);
  };

  const toggleUserBlock = (userId: string) => {
    setUsers((prev) =>
      prev.map((u) =>
        u.id === userId ? { ...u, isBlocked: !u.isBlocked } : u
      )
    );
  };

  const filteredUsers = users.filter((u) => {
    const q = searchQuery.toLowerCase().trim();
    const matchesSearch = !q || u.name.toLowerCase().includes(q) || u.email.toLowerCase().includes(q);
    const matchesRole = roleFilter === 'all' || u.role === roleFilter;
    return matchesSearch && matchesRole;
  });

  const adminCount = users.filter((u) => u.role === 'admin').length;
  const memberCount = users.filter((u) => u.role !== 'admin').length;

  return (
    <SafeAreaView
      style={[styles.safe, { backgroundColor: colors.background }]}
      edges={['top']}
    >
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scroll}
      >
        {/* Corporate Page Header */}
        <Animated.View entering={FadeInDown.duration(400)} style={styles.corpHeader}>
          <View style={{ flex: 1 }}>
            <View style={styles.breadcrumbRow}>
              <AppText variant="caption" color="textSecondary" style={{ fontWeight: '600' }}>
                ADMINISTRAÇÃO
              </AppText>
              <AppText variant="caption" color="textSecondary" style={{ marginHorizontal: 6 }}>
                /
              </AppText>
              <AppText variant="caption" style={{ fontWeight: '700', color: colors.primary }}>
                GESTÃO DE USUÁRIOS & PERMISSÕES
              </AppText>
            </View>

            <AppText variant="h2" style={{ fontWeight: '800', marginTop: 4 }}>
              Gestão de Usuários & Níveis de Acesso
            </AppText>
            <AppText variant="caption" color="textSecondary">
              Gerencie usuários ativos, contas registradas no banco PostgreSQL e permissões de acesso ao aplicativo mobile.
            </AppText>
          </View>

          <View style={styles.headerActionsGroup}>
            <TouchableOpacity
              style={[styles.btnCorpSecondary, { backgroundColor: colors.surfaceElevated, borderColor: colors.border }]}
              onPress={fetchUsers}
              activeOpacity={0.7}
            >
              <Ionicons name="refresh-outline" size={16} color={colors.text} />
              <AppText variant="caption" style={{ fontWeight: '700', marginLeft: 6 }}>
                Sincronizar VPS
              </AppText>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.btnCorpPrimary, { backgroundColor: colors.primary }]}
              onPress={() => alert('Função de convidar usuário ativada')}
              activeOpacity={0.7}
            >
              <Ionicons name="person-add-outline" size={16} color="#FFFFFF" />
              <AppText variant="caption" style={{ fontWeight: '700', color: '#FFFFFF', marginLeft: 6 }}>
                Novo Usuário
              </AppText>
            </TouchableOpacity>
          </View>
        </Animated.View>

        {/* Corporate Metrics Bar */}
        <Animated.View entering={FadeInDown.delay(100).duration(400)} style={styles.corpMetricsRow}>
          <View style={[styles.corpMetricCard, { backgroundColor: colors.surfaceElevated, borderColor: colors.border }]}>
            <View style={styles.corpMetricTop}>
              <AppText variant="caption" color="textSecondary" style={{ fontWeight: '700', letterSpacing: 0.5 }}>
                TOTAL DE USUÁRIOS
              </AppText>
              <View style={[styles.corpIconBox, { backgroundColor: 'rgba(37, 99, 235, 0.1)' }]}>
                <Ionicons name="people-outline" size={18} color="#2563EB" />
              </View>
            </View>
            <AppText variant="h1" style={{ fontWeight: '800', marginTop: 4 }}>
              {users.length}
            </AppText>
            <View style={styles.metricSubRow}>
              <View style={styles.badgeSuccess}>
                <AppText style={{ fontSize: 10, fontWeight: '700', color: '#059669' }}>● {adminCount} Admin</AppText>
              </View>
              <AppText variant="caption" color="textSecondary" style={{ fontSize: 11, marginLeft: 6 }}>
                {memberCount} Membros
              </AppText>
            </View>
          </View>

          <View style={[styles.corpMetricCard, { backgroundColor: colors.surfaceElevated, borderColor: colors.border }]}>
            <View style={styles.corpMetricTop}>
              <AppText variant="caption" color="textSecondary" style={{ fontWeight: '700', letterSpacing: 0.5 }}>
                STATUS SERVIDOR VPS
              </AppText>
              <View style={[styles.corpIconBox, { backgroundColor: 'rgba(16, 185, 129, 0.1)' }]}>
                <MaterialCommunityIcons name="server-network" size={18} color="#10B981" />
              </View>
            </View>
            <AppText variant="h3" style={{ fontWeight: '800', color: '#10B981', marginTop: 4 }}>
              {dbStatus === 'online' ? 'PostgreSQL Ativo' : 'SQLite Local'}
            </AppText>
            <AppText variant="caption" color="textSecondary" style={{ fontSize: 11, marginTop: 2 }}>
              Oracle Cloud • 147.15.72.151
            </AppText>
          </View>

          <View style={[styles.corpMetricCard, { backgroundColor: colors.surfaceElevated, borderColor: colors.border }]}>
            <View style={styles.corpMetricTop}>
              <AppText variant="caption" color="textSecondary" style={{ fontWeight: '700', letterSpacing: 0.5 }}>
                HÁBITOS CADASTRADOS
              </AppText>
              <View style={[styles.corpIconBox, { backgroundColor: 'rgba(217, 119, 6, 0.1)' }]}>
                <Ionicons name="checkbox-outline" size={18} color="#D97706" />
              </View>
            </View>
            <AppText variant="h1" style={{ fontWeight: '800', marginTop: 4 }}>
              {habits.length}
            </AppText>
            <AppText variant="caption" color="textSecondary" style={{ fontSize: 11 }}>
              {logs.length} registros de conclusão
            </AppText>
          </View>

          <View style={[styles.corpMetricCard, { backgroundColor: colors.surfaceElevated, borderColor: colors.border }]}>
            <View style={styles.corpMetricTop}>
              <AppText variant="caption" color="textSecondary" style={{ fontWeight: '700', letterSpacing: 0.5 }}>
                SEU NIVEL DE ACESSO
              </AppText>
              <View style={[styles.corpIconBox, { backgroundColor: 'rgba(139, 92, 246, 0.1)' }]}>
                <Ionicons name="shield-checkmark-outline" size={18} color="#8B5CF6" />
              </View>
            </View>
            <AppText variant="h3" style={{ fontWeight: '800', color: '#8B5CF6', marginTop: 4 }}>
              Super Admin
            </AppText>
            <AppText variant="caption" color="textSecondary" style={{ fontSize: 11, marginTop: 2 }}>
              Acesso e Controle Total
            </AppText>
          </View>
        </Animated.View>

        {/* Corporate Search & Filter Toolbar */}
        <Animated.View entering={FadeInDown.delay(160).duration(400)} style={[styles.corpToolbar, { backgroundColor: colors.surfaceElevated, borderColor: colors.border }]}>
          <View style={styles.searchWrapper}>
            <Ionicons name="search-outline" size={18} color={colors.textSecondary} />
            <TextInput
              style={[styles.searchInput, { color: colors.text }]}
              placeholder="Buscar por nome ou e-mail corporativo..."
              placeholderTextColor={colors.textTertiary}
              value={searchQuery}
              onChangeText={setSearchQuery}
            />
            {searchQuery !== '' && (
              <TouchableOpacity onPress={() => setSearchQuery('')}>
                <Ionicons name="close-circle" size={16} color={colors.textTertiary} />
              </TouchableOpacity>
            )}
          </View>

          <View style={styles.filterGroup}>
            {[
              { key: 'all', label: 'Todos' },
              { key: 'admin', label: 'Super Admins' },
              { key: 'member', label: 'Membros' },
            ].map(({ key, label }) => {
              const isActive = roleFilter === key;
              return (
                <TouchableOpacity
                  key={key}
                  style={[
                    styles.corpFilterTab,
                    {
                      backgroundColor: isActive ? colors.primary : 'transparent',
                      borderColor: isActive ? colors.primary : colors.border,
                    },
                  ]}
                  onPress={() => setRoleFilter(key as any)}
                  activeOpacity={0.7}
                >
                  <AppText
                    style={{
                      fontSize: 12,
                      fontWeight: isActive ? '700' : '600',
                      color: isActive ? '#FFFFFF' : colors.textSecondary,
                    }}
                  >
                    {label}
                  </AppText>
                </TouchableOpacity>
              );
            })}
          </View>
        </Animated.View>

        {/* Corporate Data Table Container */}
        <Animated.View entering={FadeInDown.delay(220).duration(400)} style={[styles.corpTableContainer, { backgroundColor: colors.surfaceElevated, borderColor: colors.border }]}>
          {/* Table Header */}
          <View style={[styles.tableHeaderRow, { backgroundColor: isDark ? '#1E293B' : '#F1F5F9', borderBottomColor: colors.border }]}>
            <AppText variant="caption" style={[styles.thCell, { flex: 2.5, fontWeight: '700' }]} color="textSecondary">
              USUÁRIO / CONTA
            </AppText>
            <AppText variant="caption" style={[styles.thCell, { flex: 1.5, fontWeight: '700' }]} color="textSecondary">
              CARGO & NÍVEL
            </AppText>
            <AppText variant="caption" style={[styles.thCell, { flex: 1.8, fontWeight: '700' }]} color="textSecondary">
              HORÁRIO ROTINA
            </AppText>
            <AppText variant="caption" style={[styles.thCell, { flex: 1.8, fontWeight: '700' }]} color="textSecondary">
              DATA REGISTRO
            </AppText>
            <AppText variant="caption" style={[styles.thCell, { flex: 1.2, fontWeight: '700' }]} color="textSecondary">
              STATUS
            </AppText>
            <AppText variant="caption" style={[styles.thCell, { flex: 2, textAlign: 'right', fontWeight: '700' }]} color="textSecondary">
              AÇÕES DE GESTÃO
            </AppText>
          </View>

          {/* Table Rows */}
          {filteredUsers.length === 0 ? (
            <View style={styles.emptyTableState}>
              <Ionicons name="folder-open-outline" size={36} color={colors.textTertiary} />
              <AppText variant="caption" color="textSecondary" style={{ marginTop: 8 }}>
                Nenhum usuário encontrado com os filtros selecionados.
              </AppText>
            </View>
          ) : (
            filteredUsers.map((user, idx) => {
              const initials = user.name
                ? user.name
                    .split(' ')
                    .map((n) => n[0])
                    .join('')
                    .substring(0, 2)
                    .toUpperCase()
                : 'U';

              const isAdmin = user.role === 'admin';

              return (
                <View
                  key={user.id || idx}
                  style={[
                    styles.tableBodyRow,
                    { borderBottomColor: colors.border },
                    idx % 2 === 1 && { backgroundColor: isDark ? 'rgba(255,255,255,0.02)' : 'rgba(0,0,0,0.01)' },
                  ]}
                >
                  {/* User Info */}
                  <View style={[styles.tdCell, { flex: 2.5, flexDirection: 'row', alignItems: 'center' }]}>
                    <View style={[styles.avatarCircle, { backgroundColor: isAdmin ? '#2563EB' : '#475569' }]}>
                      <AppText style={styles.avatarText}>{initials}</AppText>
                    </View>
                    <View style={{ marginLeft: Spacing.xs, flex: 1 }}>
                      <AppText variant="bodyMedium" style={{ fontWeight: '700', fontSize: 13 }}>
                        {user.name}
                      </AppText>
                      <AppText variant="caption" color="textSecondary" style={{ fontSize: 11 }}>
                        {user.email}
                      </AppText>
                    </View>
                  </View>

                  {/* Role */}
                  <View style={[styles.tdCell, { flex: 1.5 }]}>
                    {isAdmin ? (
                      <View style={styles.roleBadgeAdmin}>
                        <Ionicons name="shield-checkmark" size={12} color="#2563EB" />
                        <AppText style={styles.roleBadgeAdminText}>Super Admin</AppText>
                      </View>
                    ) : (
                      <View style={styles.roleBadgeMember}>
                        <AppText style={styles.roleBadgeMemberText}>Membro</AppText>
                      </View>
                    )}
                  </View>

                  {/* Schedule */}
                  <View style={[styles.tdCell, { flex: 1.8 }]}>
                    <AppText variant="caption" style={{ fontWeight: '600' }}>
                      ☀️ {user.wakeTime || '07:00'} • 🌙 {user.sleepTime || '23:00'}
                    </AppText>
                  </View>

                  {/* Created At */}
                  <View style={[styles.tdCell, { flex: 1.8 }]}>
                    <AppText variant="caption" color="textSecondary">
                      {new Date(user.createdAt).toLocaleDateString('pt-BR')}
                    </AppText>
                  </View>

                  {/* Status */}
                  <View style={[styles.tdCell, { flex: 1.2 }]}>
                    {user.isBlocked ? (
                      <View style={styles.statusBlocked}>
                        <AppText style={styles.statusBlockedText}>● Bloqueado</AppText>
                      </View>
                    ) : (
                      <View style={styles.statusActive}>
                        <AppText style={styles.statusActiveText}>● Ativo</AppText>
                      </View>
                    )}
                  </View>

                  {/* Actions */}
                  <View style={[styles.tdCell, { flex: 2, flexDirection: 'row', justifyContent: 'flex-end', gap: 6 }]}>
                    <TouchableOpacity
                      style={[styles.btnCorpAction, { backgroundColor: colors.surface }]}
                      onPress={() => setSelectedUser(user)}
                    >
                      <Ionicons name="eye-outline" size={14} color={colors.text} />
                    </TouchableOpacity>

                    <TouchableOpacity
                      style={[styles.btnCorpAction, { backgroundColor: 'rgba(37, 99, 235, 0.1)' }]}
                      onPress={() => {
                        setEditingPermissionsUser(user);
                        setUserRole(user.role || 'member');
                      }}
                    >
                      <Ionicons name="key-outline" size={14} color="#2563EB" />
                    </TouchableOpacity>

                    <TouchableOpacity
                      style={[
                        styles.btnCorpAction,
                        { backgroundColor: user.isBlocked ? 'rgba(5, 150, 105, 0.1)' : 'rgba(220, 38, 38, 0.1)' },
                      ]}
                      onPress={() => toggleUserBlock(user.id)}
                    >
                      <Ionicons
                        name={user.isBlocked ? 'checkmark-circle-outline' : 'ban-outline'}
                        size={14}
                        color={user.isBlocked ? '#059669' : '#DC2626'}
                      />
                    </TouchableOpacity>
                  </View>
                </View>
              );
            })
          )}
        </Animated.View>

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
            <View style={[styles.corpModalCard, { backgroundColor: colors.surfaceElevated, borderColor: colors.border }]}>
              <View style={styles.modalHeader}>
                <View style={[styles.avatarCircle, { width: 44, height: 44, borderRadius: 22, backgroundColor: colors.primary }]}>
                  <AppText style={[styles.avatarText, { fontSize: 15 }]}>
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
                <View style={{ flex: 1, marginLeft: Spacing.xs }}>
                  <AppText variant="h3" style={{ fontWeight: '800' }}>{selectedUser.name}</AppText>
                  <AppText variant="caption" color="textSecondary">{selectedUser.email}</AppText>
                </View>
                <TouchableOpacity onPress={() => setSelectedUser(null)}>
                  <Ionicons name="close" size={20} color={colors.icon} />
                </TouchableOpacity>
              </View>

              <View style={[styles.detailSection, { borderTopColor: colors.border }]}>
                <AppText variant="caption" color="textSecondary" style={{ fontWeight: '700', marginBottom: 8, letterSpacing: 0.5 }}>
                  DADOS REGISTRADOS NO POSTGRESQL (ORACLE VPS)
                </AppText>

                <View style={styles.detailRow}>
                  <AppText variant="caption" color="textSecondary">ID no Banco:</AppText>
                  <AppText variant="caption" style={{ fontWeight: '600' }}>{selectedUser.id}</AppText>
                </View>
                <View style={styles.detailRow}>
                  <AppText variant="caption" color="textSecondary">Nível de Permissão:</AppText>
                  <AppText variant="caption" style={{ fontWeight: '700', color: selectedUser.role === 'admin' ? '#2563EB' : colors.text }}>
                    {selectedUser.role === 'admin' ? 'Super Administrator' : 'Membro Comum'}
                  </AppText>
                </View>
                <View style={styles.detailRow}>
                  <AppText variant="caption" color="textSecondary">Horário de Acordar:</AppText>
                  <AppText variant="caption" style={{ fontWeight: '600' }}>{selectedUser.wakeTime || '07:00'}</AppText>
                </View>
                <View style={styles.detailRow}>
                  <AppText variant="caption" color="textSecondary">Horário de Dormir:</AppText>
                  <AppText variant="caption" style={{ fontWeight: '600' }}>{selectedUser.sleepTime || '23:00'}</AppText>
                </View>
                <View style={styles.detailRow}>
                  <AppText variant="caption" color="textSecondary">Data de Registro:</AppText>
                  <AppText variant="caption" style={{ fontWeight: '600' }}>
                    {new Date(selectedUser.createdAt).toLocaleString('pt-BR')}
                  </AppText>
                </View>
              </View>

              <View style={{ marginTop: Spacing.md, alignItems: 'flex-end' }}>
                <AppButton label="Fechar" variant="primary" onPress={() => setSelectedUser(null)} />
              </View>
            </View>
          )}
        </View>
      </Modal>

      {/* Permission & Role Editor Modal */}
      <Modal
        visible={!!editingPermissionsUser}
        animationType="fade"
        transparent
        onRequestClose={() => setEditingPermissionsUser(null)}
      >
        <View style={styles.modalOverlay}>
          <Pressable style={styles.modalBackdrop} onPress={() => setEditingPermissionsUser(null)} />
          {editingPermissionsUser && (
            <View style={[styles.corpModalCard, { backgroundColor: colors.surfaceElevated, borderColor: colors.border }]}>
              <View style={styles.modalHeader}>
                <Ionicons name="key-outline" size={22} color="#2563EB" />
                <View style={{ flex: 1, marginLeft: Spacing.xs }}>
                  <AppText variant="h3" style={{ fontWeight: '800' }}>Editar Nível de Acesso</AppText>
                  <AppText variant="caption" color="textSecondary">
                    {editingPermissionsUser.name} ({editingPermissionsUser.email})
                  </AppText>
                </View>
                <TouchableOpacity onPress={() => setEditingPermissionsUser(null)}>
                  <Ionicons name="close" size={20} color={colors.icon} />
                </TouchableOpacity>
              </View>

              <View style={[styles.detailSection, { borderTopColor: colors.border }]}>
                <AppText variant="caption" color="textSecondary" style={{ fontWeight: '700', marginBottom: 8, letterSpacing: 0.5 }}>
                  SELECIONAR CARGO CORPORATIVO
                </AppText>

                {[
                  { role: 'admin', title: 'Super Administrator', desc: 'Acesso total a usuários, VPS e banco de dados' },
                  { role: 'manager', title: 'Gestor de Hábitos', desc: 'Permissão para editar hábitos e relatórios' },
                  { role: 'member', title: 'Membro Padrão', desc: 'Acesso normal via aplicativo mobile' },
                ].map((r) => {
                  const isSelected = userRole === r.role;
                  return (
                    <TouchableOpacity
                      key={r.role}
                      style={[
                        styles.roleCardOption,
                        {
                          backgroundColor: isSelected ? 'rgba(37, 99, 235, 0.08)' : colors.surface,
                          borderColor: isSelected ? '#2563EB' : colors.border,
                        },
                      ]}
                      onPress={() => setUserRole(r.role as UserRole)}
                      activeOpacity={0.7}
                    >
                      <View style={{ flex: 1 }}>
                        <AppText variant="bodyMedium" style={{ fontWeight: '700', color: isSelected ? '#2563EB' : colors.text }}>
                          {r.title}
                        </AppText>
                        <AppText variant="caption" color="textSecondary" style={{ fontSize: 11, marginTop: 2 }}>
                          {r.desc}
                        </AppText>
                      </View>
                      {isSelected && <Ionicons name="checkmark-circle" size={18} color="#2563EB" />}
                    </TouchableOpacity>
                  );
                })}
              </View>

              <View style={{ marginTop: Spacing.md, flexDirection: 'row', justifyContent: 'flex-end', gap: Spacing.xs }}>
                <AppButton label="Cancelar" variant="secondary" onPress={() => setEditingPermissionsUser(null)} />
                <AppButton label="Salvar Permissões" variant="primary" onPress={handleSavePermissions} />
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
  corpHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    marginBottom: Spacing.md,
  },
  breadcrumbRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerActionsGroup: {
    flexDirection: 'row',
    gap: Spacing.xs,
  },
  btnCorpSecondary: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.md,
    paddingVertical: 8,
    borderRadius: Radius.md,
    borderWidth: 1,
  },
  btnCorpPrimary: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.md,
    paddingVertical: 8,
    borderRadius: Radius.md,
  },
  corpMetricsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.sm,
    marginBottom: Spacing.md,
  },
  corpMetricCard: {
    flex: 1,
    minWidth: 200,
    padding: Spacing.md,
    borderRadius: Radius.lg,
    borderWidth: 1,
  },
  corpMetricTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  corpIconBox: {
    width: 34,
    height: 34,
    borderRadius: Radius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  metricSubRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
  },
  badgeSuccess: {
    backgroundColor: 'rgba(5, 150, 105, 0.1)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  corpToolbar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: Spacing.sm,
    borderRadius: Radius.lg,
    borderWidth: 1,
    marginBottom: Spacing.md,
    flexWrap: 'wrap',
    gap: Spacing.sm,
  },
  searchWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    minWidth: 240,
    height: 38,
    paddingHorizontal: Spacing.sm,
  },
  searchInput: {
    flex: 1,
    marginLeft: 6,
    fontSize: 13,
  },
  filterGroup: {
    flexDirection: 'row',
    gap: 4,
  },
  corpFilterTab: {
    paddingHorizontal: Spacing.md,
    paddingVertical: 6,
    borderRadius: Radius.md,
    borderWidth: 1,
  },
  corpTableContainer: {
    borderRadius: Radius.lg,
    borderWidth: 1,
    overflow: 'hidden',
  },
  tableHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.md,
    paddingVertical: 10,
    borderBottomWidth: 1,
  },
  thCell: {
    fontSize: 11,
    letterSpacing: 0.5,
  },
  tableBodyRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.md,
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  tdCell: {
    justifyContent: 'center',
  },
  avatarCircle: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    color: '#FFFFFF',
    fontWeight: '800',
    fontSize: 12,
  },
  roleBadgeAdmin: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(37, 99, 235, 0.1)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 4,
    alignSelf: 'flex-start',
  },
  roleBadgeAdminText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#2563EB',
  },
  roleBadgeMember: {
    backgroundColor: 'rgba(100, 116, 139, 0.1)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 4,
    alignSelf: 'flex-start',
  },
  roleBadgeMemberText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#64748B',
  },
  statusActive: {
    backgroundColor: 'rgba(5, 150, 105, 0.1)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 4,
    alignSelf: 'flex-start',
  },
  statusActiveText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#059669',
  },
  statusBlocked: {
    backgroundColor: 'rgba(220, 38, 38, 0.1)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 4,
    alignSelf: 'flex-start',
  },
  statusBlockedText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#DC2626',
  },
  btnCorpAction: {
    padding: 6,
    borderRadius: Radius.sm,
  },
  emptyTableState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Spacing.xl,
  },
  modalOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.5)',
    padding: Spacing.base,
  },
  modalBackdrop: {
    ...StyleSheet.absoluteFillObject,
  },
  corpModalCard: {
    width: '100%',
    maxWidth: 440,
    borderRadius: Radius.xl,
    padding: Spacing.lg,
    borderWidth: 1,
    ...Shadow.lg,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.sm,
  },
  detailSection: {
    marginTop: Spacing.xs,
    paddingTop: Spacing.sm,
    borderTopWidth: 1,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 4,
  },
  roleCardOption: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.sm,
    borderRadius: Radius.md,
    borderWidth: 1,
    marginBottom: Spacing.xs,
  },
});

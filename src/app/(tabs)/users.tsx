import React, { useState, useEffect } from 'react';
import {
  View,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  Modal,
  Pressable,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { useTheme } from '@/hooks/useTheme';
import { AppText } from '@/components/atoms/AppText';
import { ConfirmDialogModal } from '@/components/molecules/ConfirmDialogModal';
import { BACKEND_API_URL } from '@/services/supabase';
import { useHabitsStore } from '@/stores/useHabitsStore';

type UserRole = 'admin' | 'member';

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

  const [users, setUsers] = useState<UserData[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [dbStatus, setDbStatus] = useState<'online' | 'offline'>('online');

  // Modals
  const [selectedUser, setSelectedUser] = useState<UserData | null>(null);
  const [editingPermissionsUser, setEditingPermissionsUser] = useState<UserData | null>(null);
  const [userRole, setUserRole] = useState<UserRole>('member');

  const fetchUsers = async () => {
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
          return;
        }
      }
    } catch (e) {
      console.warn('Failed to fetch remote users:', e);
    }

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
    return !q || u.name.toLowerCase().includes(q) || u.email.toLowerCase().includes(q);
  });

  const cardBg = isDark ? '#172B4D' : '#FFFFFF';
  const borderColor = isDark ? '#253858' : '#DFE1E6';
  const headerBg = isDark ? '#091E42' : '#F4F5F7';

  return (
    <SafeAreaView
      style={[styles.safe, { backgroundColor: isDark ? '#091E42' : '#FAFBFC' }]}
      edges={['top']}
    >
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scroll}
      >
        {/* Minimalist Vercel Page Header */}
        <Animated.View entering={FadeInDown.duration(300)} style={styles.pageHeader}>
          <View style={{ flex: 1 }}>
            <AppText variant="h2" style={{ fontWeight: '700', fontSize: 20, letterSpacing: -0.4 }}>
              Usuários
            </AppText>
            <AppText variant="caption" color="textSecondary" style={{ marginTop: 2, fontSize: 13 }}>
              Gerencie contas de usuários e permissões do PostgreSQL na VPS.
            </AppText>
          </View>

          <View style={styles.headerActions}>
            <TouchableOpacity
              style={[styles.btnOutline, { backgroundColor: cardBg, borderColor }]}
              onPress={fetchUsers}
              activeOpacity={0.7}
            >
              <Ionicons name="refresh-outline" size={14} color={colors.text} />
              <AppText variant="caption" style={{ fontWeight: '600', marginLeft: 6, fontSize: 12 }}>
                Sincronizar
              </AppText>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.btnPrimary, { backgroundColor: isDark ? '#FAFAFA' : '#09090B' }]}
              onPress={() => alert('Função de convite')}
              activeOpacity={0.7}
            >
              <Ionicons name="add" size={16} color={isDark ? '#09090B' : '#FAFAFA'} />
              <AppText variant="caption" style={{ fontWeight: '600', color: isDark ? '#09090B' : '#FAFAFA', marginLeft: 4, fontSize: 12 }}>
                Convidar
              </AppText>
            </TouchableOpacity>
          </View>
        </Animated.View>

        {/* Minimal Stats Summary Bar */}
        <Animated.View entering={FadeInDown.delay(60).duration(300)} style={styles.statsBar}>
          <View style={[styles.statBox, { backgroundColor: cardBg, borderColor }]}>
            <AppText variant="caption" color="textSecondary" style={{ fontSize: 11, fontWeight: '500' }}>
              Total Usuários
            </AppText>
            <AppText variant="h2" style={{ fontWeight: '700', fontSize: 22, marginTop: 4 }}>
              {users.length}
            </AppText>
          </View>

          <View style={[styles.statBox, { backgroundColor: cardBg, borderColor }]}>
            <AppText variant="caption" color="textSecondary" style={{ fontSize: 11, fontWeight: '500' }}>
              Servidor Banco
            </AppText>
            <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 6, gap: 6 }}>
              <View style={styles.dotGreen} />
              <AppText style={{ fontWeight: '600', fontSize: 14, color: isDark ? '#FAFAFA' : '#09090B' }}>
                PostgreSQL
              </AppText>
            </View>
          </View>

          <View style={[styles.statBox, { backgroundColor: cardBg, borderColor }]}>
            <AppText variant="caption" color="textSecondary" style={{ fontSize: 11, fontWeight: '500' }}>
              Hábitos Registrados
            </AppText>
            <AppText variant="h2" style={{ fontWeight: '700', fontSize: 22, marginTop: 4 }}>
              {habits.length}
            </AppText>
          </View>
        </Animated.View>

        {/* Search Toolbar */}
        <Animated.View entering={FadeInDown.delay(100).duration(300)} style={styles.toolbar}>
          <View style={[styles.searchContainer, { backgroundColor: cardBg, borderColor }]}>
            <Ionicons name="search-outline" size={16} color={colors.textSecondary} />
            <TextInput
              style={[styles.searchInput, { color: colors.text }]}
              placeholder="Buscar por nome ou e-mail..."
              placeholderTextColor={colors.textTertiary}
              value={searchQuery}
              onChangeText={setSearchQuery}
            />
            {searchQuery !== '' && (
              <TouchableOpacity onPress={() => setSearchQuery('')}>
                <Ionicons name="close-circle" size={14} color={colors.textTertiary} />
              </TouchableOpacity>
            )}
          </View>
        </Animated.View>

        {/* Shadcn/Vercel Data Table */}
        <Animated.View entering={FadeInDown.delay(140).duration(300)} style={[styles.tableCard, { backgroundColor: cardBg, borderColor }]}>
          {/* Table Header */}
          <View style={[styles.thRow, { backgroundColor: headerBg, borderBottomColor: borderColor }]}>
            <AppText variant="caption" style={[styles.th, { flex: 2.2 }]} color="textSecondary">
              USUÁRIO
            </AppText>
            <AppText variant="caption" style={[styles.th, { flex: 2 }]} color="textSecondary">
              E-MAIL
            </AppText>
            <AppText variant="caption" style={[styles.th, { flex: 1.2 }]} color="textSecondary">
              CARGO
            </AppText>
            <AppText variant="caption" style={[styles.th, { flex: 1.5 }]} color="textSecondary">
              HORÁRIOS
            </AppText>
            <AppText variant="caption" style={[styles.th, { flex: 1.2 }]} color="textSecondary">
              STATUS
            </AppText>
            <AppText variant="caption" style={[styles.th, { flex: 1.4, textAlign: 'right' }]} color="textSecondary">
              AÇÕES
            </AppText>
          </View>

          {/* Table Body */}
          {filteredUsers.length === 0 ? (
            <View style={styles.emptyState}>
              <AppText variant="caption" color="textSecondary">
                Nenhum usuário encontrado.
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
                    styles.trRow,
                    { borderBottomColor: borderColor },
                    idx === filteredUsers.length - 1 && { borderBottomWidth: 0 },
                  ]}
                >
                  {/* Name */}
                  <View style={[styles.td, { flex: 2.2, flexDirection: 'row', alignItems: 'center' }]}>
                    <View style={[styles.avatar, { backgroundColor: isDark ? '#27272A' : '#E4E4E7' }]}>
                      <AppText style={{ fontSize: 11, fontWeight: '700', color: isDark ? '#FAFAFA' : '#09090B' }}>
                        {initials}
                      </AppText>
                    </View>
                    <AppText variant="bodyMedium" style={{ fontWeight: '600', fontSize: 13, marginLeft: 8 }}>
                      {user.name}
                    </AppText>
                  </View>

                  {/* Email */}
                  <View style={[styles.td, { flex: 2 }]}>
                    <AppText variant="caption" color="textSecondary" style={{ fontSize: 12 }}>
                      {user.email}
                    </AppText>
                  </View>

                  {/* Role */}
                  <View style={[styles.td, { flex: 1.2 }]}>
                    <View style={[styles.badgeRole, { backgroundColor: isDark ? '#27272A' : '#F4F4F5' }]}>
                      <AppText style={{ fontSize: 11, fontWeight: '600', color: isAdmin ? (isDark ? '#FAFAFA' : '#09090B') : colors.textSecondary }}>
                        {isAdmin ? 'Admin' : 'Membro'}
                      </AppText>
                    </View>
                  </View>

                  {/* Schedule */}
                  <View style={[styles.td, { flex: 1.5 }]}>
                    <AppText variant="caption" color="textSecondary" style={{ fontSize: 12 }}>
                      {user.wakeTime || '07:00'} - {user.sleepTime || '23:00'}
                    </AppText>
                  </View>

                  {/* Status */}
                  <View style={[styles.td, { flex: 1.2 }]}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 5 }}>
                      <View
                        style={[
                          styles.dotStatus,
                          { backgroundColor: user.isBlocked ? '#EF4444' : '#22C55E' },
                        ]}
                      />
                      <AppText style={{ fontSize: 12, color: colors.textSecondary }}>
                        {user.isBlocked ? 'Bloqueado' : 'Ativo'}
                      </AppText>
                    </View>
                  </View>

                  {/* Actions */}
                  <View style={[styles.td, { flex: 1.4, flexDirection: 'row', justifyContent: 'flex-end', gap: 4 }]}>
                    <TouchableOpacity
                      style={[styles.btnAction, { backgroundColor: isDark ? '#27272A' : '#F4F4F5' }]}
                      onPress={() => {
                        setEditingPermissionsUser(user);
                        setUserRole(user.role || 'member');
                      }}
                    >
                      <AppText style={{ fontSize: 11, fontWeight: '600', color: colors.text }}>
                        Editar
                      </AppText>
                    </TouchableOpacity>

                    <TouchableOpacity
                      style={[styles.btnAction, { backgroundColor: isDark ? '#27272A' : '#F4F4F5' }]}
                      onPress={() => toggleUserBlock(user.id)}
                    >
                      <AppText
                        style={{
                          fontSize: 11,
                          fontWeight: '600',
                          color: user.isBlocked ? '#22C55E' : '#EF4444',
                        }}
                      >
                        {user.isBlocked ? 'Ativar' : 'Bloquear'}
                      </AppText>
                    </TouchableOpacity>
                  </View>
                </View>
              );
            })
          )}
        </Animated.View>

        <View style={{ height: 40 }} />
      </ScrollView>

      {/* Clean Permission Modal */}
      <Modal
        visible={!!editingPermissionsUser}
        animationType="fade"
        transparent
        onRequestClose={() => setEditingPermissionsUser(null)}
      >
        <View style={styles.modalOverlay}>
          <Pressable style={styles.modalBackdrop} onPress={() => setEditingPermissionsUser(null)} />
          {editingPermissionsUser && (
            <View style={[styles.modalCard, { backgroundColor: cardBg, borderColor }]}>
              <View style={styles.modalHeader}>
                <AppText variant="h3" style={{ fontWeight: '700', fontSize: 16 }}>
                  Permissões do Usuário
                </AppText>
                <TouchableOpacity onPress={() => setEditingPermissionsUser(null)}>
                  <Ionicons name="close" size={18} color={colors.icon} />
                </TouchableOpacity>
              </View>

              <AppText variant="caption" color="textSecondary" style={{ marginBottom: 16, fontSize: 12 }}>
                {editingPermissionsUser.name} ({editingPermissionsUser.email})
              </AppText>

              <View style={styles.roleOptionsGroup}>
                {[
                  { role: 'admin', title: 'Administrador', desc: 'Acesso total a usuários e VPS' },
                  { role: 'member', title: 'Membro', desc: 'Acesso normal via aplicativo mobile' },
                ].map((r) => {
                  const isSelected = userRole === r.role;
                  return (
                    <TouchableOpacity
                      key={r.role}
                      style={[
                        styles.roleOption,
                        {
                          backgroundColor: isSelected ? (isDark ? '#27272A' : '#F4F4F5') : 'transparent',
                          borderColor: isSelected ? (isDark ? '#FAFAFA' : '#09090B') : borderColor,
                        },
                      ]}
                      onPress={() => setUserRole(r.role as UserRole)}
                      activeOpacity={0.7}
                    >
                      <View style={{ flex: 1 }}>
                        <AppText variant="bodyMedium" style={{ fontWeight: '600', fontSize: 13 }}>
                          {r.title}
                        </AppText>
                        <AppText variant="caption" color="textSecondary" style={{ fontSize: 11, marginTop: 2 }}>
                          {r.desc}
                        </AppText>
                      </View>
                      {isSelected && <Ionicons name="checkmark" size={16} color={isDark ? '#FAFAFA' : '#09090B'} />}
                    </TouchableOpacity>
                  );
                })}
              </View>

              <View style={styles.modalFooter}>
                <TouchableOpacity
                  style={[styles.btnOutline, { backgroundColor: cardBg, borderColor }]}
                  onPress={() => setEditingPermissionsUser(null)}
                >
                  <AppText variant="caption" style={{ fontWeight: '600', fontSize: 12 }}>
                    Cancelar
                  </AppText>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.btnPrimary, { backgroundColor: isDark ? '#FAFAFA' : '#09090B' }]}
                  onPress={handleSavePermissions}
                >
                  <AppText variant="caption" style={{ fontWeight: '600', color: isDark ? '#09090B' : '#FAFAFA', fontSize: 12 }}>
                    Salvar
                  </AppText>
                </TouchableOpacity>
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
  scroll: { paddingHorizontal: 20, paddingTop: 16 },
  pageHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  headerActions: {
    flexDirection: 'row',
    gap: 8,
  },
  btnOutline: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 6,
    borderWidth: 1,
  },
  btnPrimary: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 6,
  },
  statsBar: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 20,
  },
  statBox: {
    flex: 1,
    padding: 14,
    borderRadius: 8,
    borderWidth: 1,
  },
  dotGreen: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#22C55E',
  },
  toolbar: {
    marginBottom: 14,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 36,
    paddingHorizontal: 10,
    borderRadius: 6,
    borderWidth: 1,
  },
  searchInput: {
    flex: 1,
    marginLeft: 6,
    fontSize: 13,
  },
  tableCard: {
    borderRadius: 8,
    borderWidth: 1,
    overflow: 'hidden',
  },
  thRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderBottomWidth: 1,
  },
  th: {
    fontSize: 11,
    fontWeight: '600',
    letterSpacing: 0.5,
  },
  trRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderBottomWidth: 1,
  },
  td: {
    justifyContent: 'center',
  },
  avatar: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  badgeRole: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
    alignSelf: 'flex-start',
  },
  dotStatus: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  btnAction: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  emptyState: {
    padding: 24,
    alignItems: 'center',
  },
  modalOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.4)',
    padding: 16,
  },
  modalBackdrop: {
    ...StyleSheet.absoluteFillObject,
  },
  modalCard: {
    width: '100%',
    maxWidth: 380,
    borderRadius: 8,
    padding: 16,
    borderWidth: 1,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  roleOptionsGroup: {
    gap: 8,
    marginBottom: 20,
  },
  roleOption: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 6,
    borderWidth: 1,
  },
  modalFooter: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 8,
  },
});

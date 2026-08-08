import React, { useState, useEffect } from 'react';
import {
  View,
  StyleSheet,
  TouchableOpacity,
  Modal,
  TextInput,
  Pressable,
  Platform,
  Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/hooks/useTheme';
import { useThemeStore } from '@/stores/useThemeStore';
import { AppText } from '@/components/atoms/AppText';
import { AppButton } from '@/components/atoms/AppButton';
import { getUserProfile, saveUserProfile, UserProfile } from '@/services/storage';
import { logoutUser } from '@/services/auth';

export function AdminTopBar() {
  const { colors, isDark } = useTheme();
  const { setTheme } = useThemeStore();
  const router = useRouter();

  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  // Edit Profile Form State
  const [editName, setEditName] = useState('');
  const [editWakeTime, setEditWakeTime] = useState('07:00');
  const [editSleepTime, setEditSleepTime] = useState('23:00');

  const loadProfile = async () => {
    const data = await getUserProfile();
    if (data) {
      setProfile(data);
      setEditName(data.name || 'Gabriel Monte');
      setEditWakeTime(data.wakeTime || '07:00');
      setEditSleepTime(data.sleepTime || '23:00');
    }
  };

  useEffect(() => {
    loadProfile();
  }, []);

  const handleSaveProfileSubmit = async () => {
    if (!editName.trim()) {
      if (Platform.OS === 'web') alert('Informe o nome.');
      return;
    }

    const updated: UserProfile = {
      name: editName.trim(),
      wakeTime: editWakeTime.trim(),
      sleepTime: editSleepTime.trim(),
      waterGoalMl: profile?.waterGoalMl || 2000,
      exerciseGoalMin: profile?.exerciseGoalMin || 30,
      notificationsEnabled: profile?.notificationsEnabled ?? true,
    };

    await saveUserProfile(updated);
    setProfile(updated);
    setIsEditModalOpen(false);

    if (Platform.OS === 'web') {
      alert('Perfil atualizado com sucesso!');
    } else {
      Alert.alert('Sucesso', 'Perfil atualizado!');
    }
  };

  const handleLogout = async () => {
    setIsDropdownOpen(false);
    await logoutUser();
    router.replace('/login');
  };

  const userInitials = profile && profile.name
    ? profile.name
        .split(' ')
        .map((n) => n[0])
        .join('')
        .substring(0, 2)
        .toUpperCase()
    : 'GM';

  const topBarBg = isDark ? '#111827' : '#FFFFFF';
  const borderColor = isDark ? '#1F2937' : '#E5E7EB';
  const cardBg = isDark ? '#1F2937' : '#F3F4F6';
  const primaryBlue = '#2563EB';

  return (
    <View style={[styles.topBarContainer, { backgroundColor: topBarBg, borderBottomColor: borderColor }]}>
      {/* Left Search Bar / Breadcrumb */}
      <View style={styles.leftSection}>
        <View style={[styles.searchBox, { backgroundColor: cardBg, borderColor }]}>
          <Ionicons name="search-outline" size={15} color={colors.textSecondary} />
          <TextInput
            style={[styles.searchInput, { color: colors.text }]}
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholder="Buscar por usuários, chamados ou tabelas..."
            placeholderTextColor={colors.textTertiary}
          />
        </View>
      </View>

      {/* TOP RIGHT (CANTO SUPERIOR DIREITO) USER PROFILE BADGE & CONTROLS */}
      <View style={styles.topRightRow}>
        {/* Clickable Profile Badge */}
        <TouchableOpacity
          style={[styles.profileBadge, { backgroundColor: cardBg, borderColor }]}
          onPress={() => setIsDropdownOpen(!isDropdownOpen)}
          activeOpacity={0.8}
        >
          <View style={[styles.avatarCircle, { backgroundColor: primaryBlue }]}>
            <AppText style={{ color: '#FFF', fontWeight: '700', fontSize: 11 }}>
              {userInitials}
            </AppText>
          </View>
          <View style={styles.profileTextCol}>
            <AppText style={{ fontWeight: '700', fontSize: 12 }}>
              {profile?.name || 'Gabriel Monte'}
            </AppText>
            <AppText variant="caption" color="textSecondary" style={{ fontSize: 10 }}>
              Administrador
            </AppText>
          </View>
          <Ionicons name="chevron-down" size={12} color={colors.textSecondary} style={{ marginLeft: 6 }} />
        </TouchableOpacity>

        {/* Dropdown Menu Overlay */}
        {isDropdownOpen && (
          <View style={[styles.dropdownMenu, { backgroundColor: isDark ? '#111827' : '#FFFFFF', borderColor }]}>
            <Pressable style={styles.dropdownHeader} onPress={() => { setIsDropdownOpen(false); setIsEditModalOpen(true); }}>
              <AppText style={{ fontWeight: '700', fontSize: 13 }}>{profile?.name || 'Gabriel Monte'}</AppText>
              <AppText variant="caption" color="textSecondary" style={{ fontSize: 11 }}>Configurações de rotina</AppText>
            </Pressable>

            <View style={[styles.divider, { backgroundColor: borderColor }]} />

            {/* Wake/Sleep Schedule Info (Using vector icons instead of Emojis) */}
            <View style={styles.dropdownInfoRow}>
              <Ionicons name="sunny-outline" size={14} color="#F59E0B" />
              <AppText variant="caption" color="textSecondary" style={{ marginLeft: 6, fontSize: 12 }}>
                Acorda: {profile?.wakeTime || '07:00'}
              </AppText>
            </View>

            <View style={styles.dropdownInfoRow}>
              <Ionicons name="moon-outline" size={14} color="#8B5CF6" />
              <AppText variant="caption" color="textSecondary" style={{ marginLeft: 6, fontSize: 12 }}>
                Dorme: {profile?.sleepTime || '23:00'}
              </AppText>
            </View>

            <View style={[styles.divider, { backgroundColor: borderColor }]} />

            {/* Dropdown Actions */}
            <TouchableOpacity
              style={styles.dropdownItem}
              onPress={() => {
                setIsDropdownOpen(false);
                setIsEditModalOpen(true);
              }}
            >
              <Ionicons name="settings-outline" size={15} color={colors.textSecondary} />
              <AppText style={{ marginLeft: 8, fontSize: 13 }}>Editar Perfil</AppText>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.dropdownItem}
              onPress={() => {
                setIsDropdownOpen(false);
                setTheme(isDark ? 'light' : 'dark');
              }}
            >
              <Ionicons name={isDark ? 'sunny-outline' : 'moon-outline'} size={15} color={colors.textSecondary} />
              <AppText style={{ marginLeft: 8, fontSize: 13 }}>
                Alterar Tema
              </AppText>
            </TouchableOpacity>

            <View style={[styles.divider, { backgroundColor: borderColor }]} />

            <TouchableOpacity style={styles.dropdownItem} onPress={handleLogout}>
              <Ionicons name="log-out-outline" size={15} color="#EF4444" />
              <AppText style={{ marginLeft: 8, fontSize: 13, color: '#EF4444', fontWeight: '600' }}>
                Sair
              </AppText>
            </TouchableOpacity>
          </View>
        )}
      </View>

      {/* Edit Profile Modal */}
      <Modal
        visible={isEditModalOpen}
        animationType="fade"
        transparent
        onRequestClose={() => setIsEditModalOpen(false)}
      >
        <View style={styles.overlay}>
          <Pressable style={styles.backdrop} onPress={() => setIsEditModalOpen(false)} />

          <View style={[styles.modalCard, { backgroundColor: isDark ? '#111827' : '#FFFFFF', borderColor }]}>
            <View style={styles.modalHeader}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                <Ionicons name="person-circle-outline" size={22} color={primaryBlue} />
                <AppText variant="h3" style={{ fontSize: 16, fontWeight: '700' }}>
                  Editar Perfil Administrativo
                </AppText>
              </View>
              <TouchableOpacity onPress={() => setIsEditModalOpen(false)}>
                <Ionicons name="close" size={20} color={colors.icon} />
              </TouchableOpacity>
            </View>

            <AppText variant="caption" color="textSecondary" style={{ marginBottom: 14, fontSize: 12 }}>
              Atualize seu nome e horários de rotina configurados no sistema:
            </AppText>

            {/* Name Input */}
            <AppText variant="caption" color="textSecondary" style={styles.inputLabel}>
              NOME DO ADMINISTRADOR
            </AppText>
            <View style={[styles.inputBox, { borderColor, backgroundColor: cardBg }]}>
              <Ionicons name="person-outline" size={16} color={colors.textSecondary} />
              <TextInput
                style={[styles.input, { color: colors.text }]}
                value={editName}
                onChangeText={setEditName}
                placeholder="Ex: Gabriel Monte"
                placeholderTextColor={colors.textTertiary}
              />
            </View>

            {/* Schedules */}
            <View style={{ flexDirection: 'row', gap: 10, marginTop: 4 }}>
              <View style={{ flex: 1 }}>
                <AppText variant="caption" color="textSecondary" style={styles.inputLabel}>
                  HORÁRIO DE ACORDAR
                </AppText>
                <View style={[styles.inputBox, { borderColor, backgroundColor: cardBg }]}>
                  <Ionicons name="sunny-outline" size={16} color="#F59E0B" />
                  <TextInput
                    style={[styles.input, { color: colors.text }]}
                    value={editWakeTime}
                    onChangeText={setEditWakeTime}
                    placeholder="07:00"
                    placeholderTextColor={colors.textTertiary}
                  />
                </View>
              </View>

              <View style={{ flex: 1 }}>
                <AppText variant="caption" color="textSecondary" style={styles.inputLabel}>
                  HORÁRIO DE DORMIR
                </AppText>
                <View style={[styles.inputBox, { borderColor, backgroundColor: cardBg }]}>
                  <Ionicons name="moon-outline" size={16} color="#8B5CF6" />
                  <TextInput
                    style={[styles.input, { color: colors.text }]}
                    value={editSleepTime}
                    onChangeText={setEditSleepTime}
                    placeholder="23:00"
                    placeholderTextColor={colors.textTertiary}
                  />
                </View>
              </View>
            </View>

            <View style={styles.modalButtonRow}>
              <AppButton label="Cancelar" variant="ghost" onPress={() => setIsEditModalOpen(false)} />
              <AppButton label="Salvar Perfil" variant="primary" onPress={handleSaveProfileSubmit} />
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  topBarContainer: {
    height: 56,
    borderBottomWidth: 1,
    paddingHorizontal: 24,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    zIndex: 999,
  },
  leftSection: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    width: 320,
    height: 36,
    borderRadius: 8,
    borderWidth: 1,
    paddingHorizontal: 10,
  },
  searchInput: {
    flex: 1,
    marginLeft: 6,
    fontSize: 12,
    ...(Platform.OS === 'web' ? ({ outlineStyle: 'none' } as any) : {}),
  },
  topRightRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    position: 'relative',
  },
  profileBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
    borderWidth: 1,
  },
  avatarCircle: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  profileTextCol: {
    marginLeft: 8,
  },
  dropdownMenu: {
    position: 'absolute',
    top: 42,
    right: 0,
    width: 220,
    borderRadius: 8,
    borderWidth: 1,
    paddingVertical: 6,
    zIndex: 1000,
    ...(Platform.OS === 'web' ? ({ boxShadow: '0 10px 15px -3px rgba(0,0,0,0.3)' } as any) : {}),
  },
  dropdownHeader: {
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  dropdownInfoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 4,
  },
  dropdownItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  divider: {
    height: 1,
    marginVertical: 4,
  },
  actionIconBtn: {
    padding: 8,
    borderRadius: 8,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoutBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 8,
    borderWidth: 1,
  },
  overlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    padding: 16,
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
  },
  modalCard: {
    width: '100%',
    maxWidth: 400,
    borderRadius: 12,
    padding: 20,
    borderWidth: 1,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  inputLabel: {
    marginTop: 8,
    marginBottom: 4,
    fontSize: 11,
    fontWeight: '700',
  },
  inputBox: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 40,
    borderRadius: 8,
    borderWidth: 1,
    paddingHorizontal: 10,
  },
  input: {
    flex: 1,
    marginLeft: 6,
    fontSize: 13,
    ...(Platform.OS === 'web' ? ({ outlineStyle: 'none' } as any) : {}),
  },
  modalButtonRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 8,
    marginTop: 18,
  },
});

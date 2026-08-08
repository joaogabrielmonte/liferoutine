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
      alert('✅ Perfil atualizado com sucesso!');
    } else {
      Alert.alert('Sucesso', 'Perfil atualizado!');
    }
  };

  const handleLogout = async () => {
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

  const cardBg = isDark ? '#172B4D' : '#FFFFFF';
  const borderColor = isDark ? '#253858' : '#DFE1E6';
  const primaryBlue = '#0052CC';

  return (
    <View style={[styles.topBarContainer, { backgroundColor: isDark ? '#091E42' : '#FFFFFF', borderBottomColor: borderColor }]}>
      <View style={styles.leftTitleRow}>
        <AppText variant="caption" color="textSecondary" style={{ fontSize: 12 }}>
          LifeRoutine Admin Control Panel
        </AppText>
      </View>

      {/* TOP RIGHT (CANTO SUPERIOR DIREITO) USER PROFILE BADGE & CONTROLS */}
      <View style={styles.topRightRow}>
        {/* Clickable Profile Badge */}
        <TouchableOpacity
          style={[styles.profileBadge, { backgroundColor: cardBg, borderColor }]}
          onPress={() => setIsEditModalOpen(true)}
          activeOpacity={0.8}
        >
          <View style={[styles.avatarCircle, { backgroundColor: primaryBlue }]}>
            <AppText style={{ color: '#FFF', fontWeight: '700', fontSize: 11 }}>
              {userInitials}
            </AppText>
          </View>
          <View style={styles.profileTextCol}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
              <AppText style={{ fontWeight: '700', fontSize: 12 }}>
                {profile?.name || 'Gabriel Monte'}
              </AppText>
              <Ionicons name="create-outline" size={12} color={colors.textSecondary} />
            </View>
            <AppText variant="caption" color="textSecondary" style={{ fontSize: 10 }}>
              ☀️ {profile?.wakeTime || '07:00'} • 🌙 {profile?.sleepTime || '23:00'}
            </AppText>
          </View>
        </TouchableOpacity>

        {/* Theme Toggle Button */}
        <TouchableOpacity
          onPress={() => setTheme(isDark ? 'light' : 'dark')}
          style={[styles.actionIconBtn, { backgroundColor: cardBg, borderColor }]}
        >
          <Ionicons name={isDark ? 'moon-outline' : 'sunny-outline'} size={15} color={isDark ? '#FAFBFC' : '#091E42'} />
        </TouchableOpacity>

        {/* Logout Button */}
        <TouchableOpacity
          style={[styles.logoutBtn, { backgroundColor: isDark ? '#2A1215' : '#FFEBE6', borderColor: '#FFBDAD' }]}
          onPress={handleLogout}
          activeOpacity={0.8}
        >
          <Ionicons name="log-out-outline" size={15} color="#DE350B" />
          <AppText style={{ fontSize: 12, fontWeight: '700', color: '#DE350B', marginLeft: 4 }}>
            Sair
          </AppText>
        </TouchableOpacity>
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

          <View style={[styles.modalCard, { backgroundColor: cardBg, borderColor }]}>
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
            <View style={[styles.inputBox, { borderColor }]}>
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
                <View style={[styles.inputBox, { borderColor }]}>
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
                <View style={[styles.inputBox, { borderColor }]}>
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
    height: 54,
    borderBottomWidth: 1,
    paddingHorizontal: 20,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  leftTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  topRightRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
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
    width: 26,
    height: 26,
    borderRadius: 13,
    alignItems: 'center',
    justifyContent: 'center',
  },
  profileTextCol: {
    marginLeft: 8,
  },
  actionIconBtn: {
    padding: 7,
    borderRadius: 8,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoutBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
  },
  overlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(9, 30, 66, 0.65)',
    padding: 16,
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
  },
  modalCard: {
    width: '100%',
    maxWidth: 400,
    borderRadius: 12,
    padding: 18,
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

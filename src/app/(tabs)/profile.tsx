import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  Switch,
  Alert,
} from 'react-native';
import { useRouter, useFocusEffect } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { useTheme } from '@/hooks/useTheme';
import { useThemeStore } from '@/stores/useThemeStore';
import { useTodayHabits } from '@/stores/useHabitsStore';
import { AppText } from '@/components/atoms/AppText';
import { AppCard } from '@/components/atoms/AppCard';
import {
  requestNotificationPermissions,
  scheduleHabitReminder,
  scheduleTestNotification,
  cancelAllNotifications,
} from '@/services/notifications';
import {
  getUserProfile,
  saveUserProfile,
  DEFAULT_PROFILE,
  type UserProfile,
} from '@/services/storage';
import { shareHabitReport, exportDataJSON } from '@/services/export';
import { SyncManager } from '@/services/sync';
import { logoutUser } from '@/services/auth';
import { Spacing, Radius } from '@/constants/theme';

type SettingRowProps = {
  icon: React.ReactNode;
  iconBg: string;
  label: string;
  subtitle?: string;
  right?: React.ReactNode;
  onPress?: () => void;
  isLast?: boolean;
};

function SettingRow({
  icon,
  iconBg,
  label,
  subtitle,
  right,
  onPress,
  isLast,
}: SettingRowProps) {
  const { colors } = useTheme();
  return (
    <TouchableOpacity
      style={[
        styles.row,
        { borderBottomColor: isLast ? 'transparent' : colors.border },
      ]}
      onPress={onPress}
      activeOpacity={0.7}
      disabled={!onPress && !right}
    >
      <View style={[styles.rowIcon, { backgroundColor: iconBg }]}>{icon}</View>
      <View style={styles.rowText}>
        <AppText variant="bodyMedium">{label}</AppText>
        {subtitle && (
          <AppText variant="caption" color="textSecondary">
            {subtitle}
          </AppText>
        )}
      </View>
      {right ?? (
        <Ionicons
          name="chevron-forward"
          size={18}
          color={colors.textTertiary}
        />
      )}
    </TouchableOpacity>
  );
}

export default function ProfileScreen() {
  const { colors, isDark } = useTheme();
  const { settings, setTheme, toggleNotifications } = useThemeStore();
  const router = useRouter();
  const todayHabits = useTodayHabits();
  const [profile, setProfile] = useState<UserProfile>(DEFAULT_PROFILE);
  const [devTapCount, setDevTapCount] = useState(0);

  useFocusEffect(
    useCallback(() => {
      getUserProfile().then(setProfile);
    }, [])
  );

  const totalHabitsCount = todayHabits.length;
  const completedHabitsCount = todayHabits.filter((h) => h.isCompletedToday).length;

  const handleToggleNotifications = async (enabled: boolean) => {
    toggleNotifications();
    const updated = { ...profile, notificationsEnabled: enabled };
    setProfile(updated);
    await saveUserProfile(updated);

    if (enabled) {
      const granted = await requestNotificationPermissions();
      if (granted) {
        // Schedule default daily reminders for active habits
        await scheduleHabitReminder(
          'water-daily',
          'Hora de beber água! 💧',
          'Mantenha sua hidratação em dia.',
          10,
          0
        );
        await scheduleHabitReminder(
          'exercise-daily',
          'Hora do seu treino! ⚡',
          'Complete sua meta diária de exercícios.',
          17,
          0
        );
        Alert.alert(
          'Notificações Ativadas! 🔔',
          'Você receberá lembretes diários para manter sua rotina.'
        );
      } else {
        Alert.alert(
          'Permissão Necessária',
          'Ative as permissões de notificação nas configurações do seu celular.'
        );
      }
    } else {
      await cancelAllNotifications();
    }
  };

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
          entering={FadeInDown.duration(400)}
          style={styles.header}
        >
          <AppText variant="h2">Perfil</AppText>
        </Animated.View>

        {/* Avatar + Name */}
        <Animated.View entering={FadeInDown.delay(100).duration(400)}>
          <AppCard style={styles.profileCard} elevated>
            <View
              style={[
                styles.avatar,
                { backgroundColor: colors.primaryLight },
              ]}
            >
              <Ionicons
                name="person"
                size={38}
                color={colors.primary}
              />
            </View>
            <AppText
              variant="title"
              align="center"
              style={{ marginTop: Spacing.md }}
            >
              {profile.name}
            </AppText>
            <AppText variant="caption" color="textSecondary" align="center">
              Acorda às {profile.wakeTime} • Dorme às {profile.sleepTime}
            </AppText>

            <View
              style={[
                styles.miniStats,
                { borderTopColor: colors.border },
              ]}
            >
              {[
                { label: 'Hábitos Hoje', value: `${totalHabitsCount}` },
                { label: 'Concluídos', value: `${completedHabitsCount}` },
                {
                  label: 'Sequência',
                  value: `${
                    todayHabits.length > 0
                      ? Math.max(...todayHabits.map((h) => h.streak || 0))
                      : 0
                  } dias`,
                },
              ].map(({ label, value }) => (
                <View key={label} style={styles.miniStat}>
                  <AppText
                    variant="subtitle"
                    style={{ color: colors.primary, fontWeight: '700' }}
                  >
                    {value}
                  </AppText>
                  <AppText variant="caption" color="textSecondary">
                    {label}
                  </AppText>
                </View>
              ))}
            </View>
          </AppCard>
        </Animated.View>

        {/* Preferences */}
        <Animated.View entering={FadeInDown.delay(200).duration(400)}>
          <AppText
            variant="label"
            color="textSecondary"
            style={styles.sectionLabel}
          >
            Preferências da Conta
          </AppText>
          <AppCard>
            <SettingRow
              icon={
                <Ionicons name="moon-outline" size={18} color="#8B5CF6" />
              }
              iconBg="rgba(139, 92, 246, 0.15)"
              label="Tema Escuro"
              subtitle={
                settings.theme === 'system'
                  ? 'Automático do Sistema'
                  : isDark
                  ? 'Ativo'
                  : 'Inativo'
              }
              right={
                <Switch
                  value={isDark}
                  onValueChange={(val) => setTheme(val ? 'dark' : 'light')}
                  trackColor={{ false: colors.border, true: colors.primary }}
                  thumbColor="#FFF"
                />
              }
            />
            <SettingRow
              icon={
                <Ionicons
                  name="notifications-outline"
                  size={18}
                  color="#F59E0B"
                />
              }
              iconBg="rgba(245, 158, 11, 0.15)"
              label="Lembretes Diários"
              subtitle={
                settings.notificationsEnabled ? 'Ativos (10:00 e 17:00)' : 'Desativados'
              }
              right={
                <Switch
                  value={settings.notificationsEnabled}
                  onValueChange={handleToggleNotifications}
                  trackColor={{ false: colors.border, true: colors.primary }}
                  thumbColor="#FFF"
                />
              }
            />
            <SettingRow
              icon={
                <Ionicons
                  name="alarm-outline"
                  size={18}
                  color="#06B6D4"
                />
              }
              iconBg="rgba(6, 182, 212, 0.15)"
              label="Testar Notificação Agora"
              subtitle="Receber um alerta de teste em 5 segundos"
              isLast
              onPress={async () => {
                const ok = await scheduleTestNotification(5);
                if (ok) {
                  Alert.alert(
                    'Notificação Agendada! 🔔',
                    'Aguarde 5 segundos (você pode minimizar o app para ver a notificação push aparecer).'
                  );
                } else {
                  Alert.alert(
                    'Permissão Necessária',
                    'Ative as permissões de notificação no switch acima.'
                  );
                }
              }}
            />
          </AppCard>
        </Animated.View>

        {/* Export & Backup */}
        <Animated.View entering={FadeInDown.delay(280).duration(400)}>
          <AppText
            variant="label"
            color="textSecondary"
            style={styles.sectionLabel}
          >
            Relatórios & Exportação
          </AppText>
          <AppCard>
            <SettingRow
              icon={
                <Ionicons
                  name="share-social-outline"
                  size={18}
                  color={colors.primary}
                />
              }
              iconBg={`${colors.primary}22`}
              label="Compartilhar Relatório de Hábitos"
              subtitle="Gerar resumo formatado para WhatsApp ou redes"
              onPress={async () => {
                await shareHabitReport();
              }}
            />
            <SettingRow
              icon={
                <Ionicons
                  name="download-outline"
                  size={18}
                  color="#22C55E"
                />
              }
              iconBg="rgba(34, 197, 94, 0.15)"
              label="Exportar Backup dos Dados (JSON)"
              subtitle="Salvar cópia dos dados salvos no SQLite"
              onPress={async () => {
                await exportDataJSON();
              }}
            />
            <SettingRow
              icon={
                <Ionicons
                  name="download-outline"
                  size={18}
                  color="#22C55E"
                />
              }
              iconBg="rgba(34, 197, 94, 0.15)"
              label="Exportar Backup dos Dados (JSON)"
              subtitle="Salvar cópia dos dados salvos no SQLite"
              isLast
              onPress={async () => {
                await exportDataJSON();
              }}
            />
          </AppCard>
        </Animated.View>

        {/* Support */}
        <Animated.View entering={FadeInDown.delay(300).duration(400)}>
          <AppText
            variant="label"
            color="textSecondary"
            style={styles.sectionLabel}
          >
            Suporte & Informações
          </AppText>
          <AppCard>
            <SettingRow
              icon={<Ionicons name="star-outline" size={18} color="#F59E0B" />}
              iconBg="rgba(245, 158, 11, 0.15)"
              label="Avaliar o LifeRoutine"
              onPress={() => {
                Alert.alert('Obrigado! ⭐', 'Obrigado por usar o LifeRoutine!');
              }}
            />
            <SettingRow
              icon={
                <Ionicons
                  name="help-circle-outline"
                  size={18}
                  color={colors.info}
                />
              }
              iconBg={`${colors.info}22`}
              label="Ajuda e Documentação"
              onPress={() => {
                Alert.alert('Ajuda', 'Acesse o projeto.md para ler o planejamento completo.');
              }}
            />
            <SettingRow
              icon={
                <Ionicons
                  name="shield-checkmark-outline"
                  size={18}
                  color="#22C55E"
                />
              }
              iconBg="rgba(34, 197, 94, 0.15)"
              label="Privacidade & Dados Locais (SQLite)"
              isLast
              onPress={() => {
                Alert.alert('Privacidade', 'Seus dados são mantidos 100% locais no seu dispositivo.');
              }}
            />
          </AppCard>
        </Animated.View>

        {/* Login / Setup Account */}
        <Animated.View entering={FadeInDown.delay(400).duration(400)}>
          <AppCard style={{ marginTop: Spacing.md }}>
            <SettingRow
              icon={
                <Ionicons name="log-out-outline" size={18} color={colors.danger} />
              }
              iconBg={colors.dangerLight}
              label="Sair da Conta (Logout)"
              subtitle="Limpar sessão e solicitar credenciais ao abrir"
              isLast
              onPress={() => {
                Alert.alert(
                  'Sair da Conta',
                  'Deseja encerrar a sessão atual? Você precisará informar seu e-mail e senha para entrar novamente.',
                  [
                    { text: 'Cancelar', style: 'cancel' },
                    {
                      text: 'Sair',
                      style: 'destructive',
                      onPress: async () => {
                        await logoutUser();
                        router.replace('/login');
                      },
                    },
                  ]
                );
              }}
            />
          </AppCard>
        </Animated.View>

        {/* Hidden Developer Mode on 5 Taps */}
        <TouchableOpacity
          activeOpacity={0.8}
          onPress={async () => {
            const next = devTapCount + 1;
            setDevTapCount(next);
            if (next >= 5) {
              setDevTapCount(0);
              const res = await SyncManager.syncLocalToCloud();
              Alert.alert(
                res.success ? '🛠️ Modo Dev: Nuvem & Docker OK! 🚀' : '🛠️ Modo Dev: Offline',
                res.message
              );
            }
          }}
        >
          <AppText
            variant="caption"
            color="textTertiary"
            align="center"
            style={{ marginTop: Spacing.xl }}
          >
            LifeRoutine v1.0.0 • Expo SDK 54
          </AppText>
        </TouchableOpacity>

        <View style={{ height: Spacing['3xl'] }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  scroll: { paddingHorizontal: Spacing.base, paddingTop: Spacing.md },
  header: { marginBottom: Spacing.xl },
  profileCard: {
    alignItems: 'center',
    marginBottom: Spacing.xl,
    padding: Spacing.xl,
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  miniStats: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    width: '100%',
    marginTop: Spacing.xl,
    paddingTop: Spacing.base,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  miniStat: { alignItems: 'center' },
  sectionLabel: {
    marginBottom: Spacing.sm,
    marginTop: Spacing.base,
    paddingHorizontal: Spacing.xs,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: Spacing.md,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  rowIcon: {
    width: 36,
    height: 36,
    borderRadius: Radius.sm,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: Spacing.md,
  },
  rowText: { flex: 1 },
});

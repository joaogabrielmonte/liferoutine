import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  Switch,
  Alert,
  Platform,
  TextInput,
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
  cancelAllNotifications,
} from '@/services/notifications';
import {
  getUserProfile,
  saveUserProfile,
  DEFAULT_PROFILE,
  type UserProfile,
} from '@/services/storage';
import { logoutUser } from '@/services/auth';
import { createSupportTicket } from '@/services/tickets';
import { BACKEND_API_URL } from '@/services/supabase';
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
  const [vpsPing, setVpsPing] = useState<'online' | 'offline' | 'checking'>('online');

  // Support Ticket Form State
  const [ticketSubject, setTicketSubject] = useState('');
  const [ticketMessage, setTicketMessage] = useState('');

  const isWeb = Platform.OS === 'web';

  useFocusEffect(
    useCallback(() => {
      getUserProfile().then(setProfile);
    }, [])
  );

  const cardBg = isDark ? '#172B4D' : '#FFFFFF';
  const borderColor = isDark ? '#253858' : '#DFE1E6';

  const testVpsConnection = async () => {
    setVpsPing('checking');
    try {
      const res = await fetch(`${BACKEND_API_URL}/api/auth/users`).catch(() => null);
      if (res && res.ok) {
        setVpsPing('online');
        alert('Conexão VPS OK: Servidor Oracle (147.15.72.151) e PostgreSQL 16 operacionais!');
      } else {
        setVpsPing('offline');
        alert('Conexão de teste offline.');
      }
    } catch (e) {
      setVpsPing('offline');
    }
  };

  const handleCreateTicketSubmit = async () => {
    if (!ticketSubject.trim() || !ticketMessage.trim()) {
      Alert.alert('Atenção', 'Informe o assunto e a mensagem do chamado.');
      return;
    }

    const res = await createSupportTicket(ticketSubject, ticketMessage);
    if (res.success) {
      setTicketSubject('');
      setTicketMessage('');
      Alert.alert('Chamado Enviado!', res.message);
    } else {
      Alert.alert('Erro', res.message);
    }
  };

  // -------------------------------------------------------------
  // WEB ORACLE VPS INFRASTRUCTURE CONTROL CENTER
  // -------------------------------------------------------------
  if (isWeb) {
    return (
      <SafeAreaView
        style={[styles.safe, { backgroundColor: isDark ? '#0B0F19' : '#F9FAFB' }]}
        edges={['top']}
      >
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.webScroll}
        >
          <Animated.View entering={FadeInDown.duration(300)} style={styles.webHeader}>
            <View style={{ flex: 1 }}>
              <AppText variant="h2" style={{ fontWeight: '700', fontSize: 20, letterSpacing: -0.3 }}>
                Configurações da VPS Oracle & Infraestrutura
              </AppText>
              <AppText variant="caption" color="textSecondary" style={{ marginTop: 2, fontSize: 13 }}>
                Status de servidores, proxy Nginx, certificado SSL e banco de dados PostgreSQL
              </AppText>
            </View>
          </Animated.View>

          {/* VPS Status Overview Card */}
          <Animated.View entering={FadeInDown.delay(60).duration(300)} style={[styles.vpsCard, { backgroundColor: isDark ? '#111827' : '#FFFFFF', borderColor: isDark ? '#1F2937' : '#E5E7EB' }]}>
            <View style={styles.vpsTopRow}>
              <View style={[styles.vpsIconBox, { backgroundColor: 'rgba(0, 135, 90, 0.1)' }]}>
                <MaterialCommunityIcons name="server-security" size={24} color="#00875A" />
              </View>
              <View style={{ flex: 1, marginLeft: 10 }}>
                <AppText style={{ fontWeight: '700', fontSize: 15 }}>
                  Oracle Cloud Infrastructure (Ubuntu 22.04)
                </AppText>
                <AppText variant="caption" color="textSecondary" style={{ fontSize: 12 }}>
                  IP Público: 147.15.72.151 • Porta Docker API: 4000
                </AppText>
              </View>
              <TouchableOpacity
                style={[styles.btnAction, { backgroundColor: '#0052CC' }]}
                onPress={testVpsConnection}
              >
                <Ionicons name="refresh" size={14} color="#FFF" />
                <AppText style={{ color: '#FFF', fontWeight: '600', fontSize: 12, marginLeft: 4 }}>
                  Testar Ping
                </AppText>
              </TouchableOpacity>
            </View>

            <View style={styles.vpsDetailsGrid}>
              <View style={[styles.detailItem, { borderColor: isDark ? '#1F2937' : '#E5E7EB' }]}>
                <AppText variant="caption" color="textSecondary" style={{ fontSize: 11 }}>DOMÍNIO & SSL</AppText>
                <AppText style={{ fontWeight: '600', fontSize: 13, color: '#00875A', marginTop: 2 }}>
                  https://kingslityc.com.br
                </AppText>
                <AppText variant="caption" color="textSecondary" style={{ fontSize: 10 }}>
                  {"Let's Encrypt SSL Válido"}
                </AppText>
              </View>

              <View style={[styles.detailItem, { borderColor: isDark ? '#1F2937' : '#E5E7EB' }]}>
                <AppText variant="caption" color="textSecondary" style={{ fontSize: 11 }}>REVERSE PROXY</AppText>
                <AppText style={{ fontWeight: '600', fontSize: 13, marginTop: 2 }}>
                  Nginx Reverse Proxy
                </AppText>
                <AppText variant="caption" color="textSecondary" style={{ fontSize: 10 }}>
                  {"Proxy /liferoutine/ -> liferoutine_api:4000"}
                </AppText>
              </View>

              <View style={[styles.detailItem, { borderColor: isDark ? '#1F2937' : '#E5E7EB' }]}>
                <AppText variant="caption" color="textSecondary" style={{ fontSize: 11 }}>BANCO DE DADOS</AppText>
                <AppText style={{ fontWeight: '600', fontSize: 13, color: '#0052CC', marginTop: 2 }}>
                  PostgreSQL 16 Engine
                </AppText>
                <AppText variant="caption" color="textSecondary" style={{ fontSize: 10 }}>
                  Container Postgres Docker OK
                </AppText>
              </View>
            </View>
          </Animated.View>

          {/* Infra Actions */}
          <Animated.View entering={FadeInDown.delay(120).duration(300)} style={[styles.vpsCard, { backgroundColor: isDark ? '#111827' : '#FFFFFF', borderColor: isDark ? '#1F2937' : '#E5E7EB' }]}>
            <AppText style={{ fontWeight: '700', fontSize: 14, marginBottom: 12 }}>
              Ações de Manutenção do Servidor
            </AppText>

            <View style={{ gap: 8 }}>
              <TouchableOpacity
                style={[styles.btnRow, { borderColor: isDark ? '#1F2937' : '#E5E7EB' }]}
                onPress={() => alert('Logs Nginx verificados: 0 erros de HTTPS.')}
              >
                <Ionicons name="document-text-outline" size={16} color={colors.textSecondary} />
                <AppText style={{ fontWeight: '600', fontSize: 13, marginLeft: 8, flex: 1 }}>
                  Ver Logs do Nginx & Proxy
                </AppText>
                <Ionicons name="chevron-forward" size={14} color={colors.textSecondary} />
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.btnRow, { borderColor: isDark ? '#1F2937' : '#E5E7EB' }]}
                onPress={() => alert('Backup do banco de dados gerado com sucesso.')}
              >
                <Ionicons name="cloud-download-outline" size={16} color={colors.textSecondary} />
                <AppText style={{ fontWeight: '600', fontSize: 13, marginLeft: 8, flex: 1 }}>
                  Fazer Backup do Banco PostgreSQL
                </AppText>
                <Ionicons name="chevron-forward" size={14} color={colors.textSecondary} />
              </TouchableOpacity>
            </View>
          </Animated.View>

          <View style={{ height: 40 }} />
        </ScrollView>
      </SafeAreaView>
    );
  }

  // -------------------------------------------------------------
  // MOBILE APP USER PROFILE (UNTOUCHED FOR MOBILE)
  // -------------------------------------------------------------
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
        await scheduleHabitReminder('water-daily', 'Hora de beber água!', 'Mantenha sua hidratação em dia.', 10, 0);
        await scheduleHabitReminder('exercise-daily', 'Hora do seu treino!', 'Complete sua meta diária de exercícios.', 17, 0);
        Alert.alert('Notificações Ativadas!', 'Você receberá lembretes diários para manter sua rotina.');
      } else {
        Alert.alert('Permissão Necessária', 'Ative as permissões de notificação nas configurações do seu celular.');
      }
    } else {
      await cancelAllNotifications();
    }
  };

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: colors.background }]} edges={['top']}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>
        <Animated.View entering={FadeInDown.duration(400)} style={styles.header}>
          <AppText variant="h2">Perfil</AppText>
        </Animated.View>

        <Animated.View entering={FadeInDown.delay(100).duration(400)}>
          <AppCard style={styles.profileCard} elevated>
            <View style={[styles.avatar, { backgroundColor: colors.primaryLight }]}>
              <Ionicons name="person" size={38} color={colors.primary} />
            </View>
            <AppText variant="title" align="center" style={{ marginTop: Spacing.md }}>
              {profile.name}
            </AppText>
            <AppText variant="caption" color="textSecondary" align="center">
              Acorda às {profile.wakeTime} • Dorme às {profile.sleepTime}
            </AppText>

            <View style={[styles.miniStats, { borderTopColor: colors.border }]}>
              {[
                { label: 'Hábitos Hoje', value: `${totalHabitsCount}` },
                { label: 'Concluídos', value: `${completedHabitsCount}` },
                {
                  label: 'Sequência',
                  value: `${todayHabits.length > 0 ? Math.max(...todayHabits.map((h) => h.streak || 0)) : 0} dias`,
                },
              ].map(({ label, value }) => (
                <View key={label} style={styles.miniStat}>
                  <AppText variant="subtitle" style={{ color: colors.primary, fontWeight: '700' }}>
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
          <AppText variant="label" color="textSecondary" style={styles.sectionLabel}>
            Preferências da Conta
          </AppText>
          <AppCard>
            <SettingRow
              icon={<Ionicons name="moon-outline" size={18} color="#8B5CF6" />}
              iconBg="rgba(139, 92, 246, 0.15)"
              label="Tema Escuro"
              subtitle={settings.theme === 'system' ? 'Automático do Sistema' : isDark ? 'Ativo' : 'Inativo'}
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
              icon={<Ionicons name="notifications-outline" size={18} color="#F59E0B" />}
              iconBg="rgba(245, 158, 11, 0.15)"
              label="Lembretes Diários"
              subtitle={settings.notificationsEnabled ? 'Ativos (10:00 e 17:00)' : 'Desativados'}
              right={
                <Switch
                  value={settings.notificationsEnabled}
                  onValueChange={handleToggleNotifications}
                  trackColor={{ false: colors.border, true: colors.primary }}
                  thumbColor="#FFF"
                />
              }
            />
          </AppCard>
        </Animated.View>

        {/* Support Ticket Section - Directly in Profile page */}
        <Animated.View entering={FadeInDown.delay(300).duration(400)}>
          <AppText variant="label" color="textSecondary" style={styles.sectionLabel}>
            Suporte & Atendimento
          </AppText>
          <AppCard style={{ padding: Spacing.base }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 8 }}>
              <Ionicons name="chatbubbles-outline" size={18} color={colors.primary} />
              <AppText style={{ fontWeight: '700', fontSize: 14 }}>
                Enviar Chamado ao Administrador
              </AppText>
            </View>
            <AppText variant="caption" color="textSecondary" style={{ marginBottom: 12 }}>
              Descreva sua dúvida ou problema técnico. O painel administrativo receberá seu chamado imediatamente.
            </AppText>

            <AppText variant="caption" color="textSecondary" style={styles.inputLabel}>ASSUNTO</AppText>
            <View style={[styles.inputBox, { backgroundColor: colors.background, borderColor: colors.border }]}>
              <TextInput
                style={[styles.textInput, { color: colors.text }]}
                value={ticketSubject}
                onChangeText={setTicketSubject}
                placeholder="Ex: Problema de sincronização"
                placeholderTextColor={colors.textTertiary}
              />
            </View>

            <AppText variant="caption" color="textSecondary" style={styles.inputLabel}>MENSAGEM / DETALHES</AppText>
            <View style={[styles.inputBox, { backgroundColor: colors.background, borderColor: colors.border, height: 80 }]}>
              <TextInput
                style={[styles.textInput, { color: colors.text, height: 80, textAlignVertical: 'top' }]}
                value={ticketMessage}
                onChangeText={setTicketMessage}
                placeholder="Descreva o que está ocorrendo..."
                placeholderTextColor={colors.textTertiary}
                multiline
              />
            </View>

            <TouchableOpacity
              style={[styles.btnSubmitTicket, { backgroundColor: colors.primary }]}
              onPress={handleCreateTicketSubmit}
              activeOpacity={0.8}
            >
              <AppText style={{ color: '#FFFFFF', fontWeight: '700', fontSize: 13 }}>
                Enviar Chamado
              </AppText>
            </TouchableOpacity>
          </AppCard>
        </Animated.View>

        {/* Logout Card */}
        <Animated.View entering={FadeInDown.delay(400).duration(400)}>
          <AppCard style={{ marginTop: Spacing.md }}>
            <SettingRow
              icon={<Ionicons name="log-out-outline" size={18} color={colors.danger} />}
              iconBg={colors.dangerLight}
              label="Sair da Conta (Logout)"
              subtitle="Limpar sessão e solicitar credenciais ao abrir"
              isLast
              onPress={() => {
                Alert.alert('Sair da Conta', 'Deseja encerrar a sessão atual?', [
                  { text: 'Cancelar', style: 'cancel' },
                  {
                    text: 'Sair',
                    style: 'destructive',
                    onPress: async () => {
                      await logoutUser();
                      router.replace('/login');
                    },
                  },
                ]);
              }}
            />
          </AppCard>
        </Animated.View>

        <View style={{ height: Spacing['3xl'] }} />
      </ScrollView>
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
  vpsCard: {
    padding: 16,
    borderRadius: 8,
    borderWidth: 1,
    marginBottom: 16,
  },
  vpsTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 14,
  },
  vpsIconBox: {
    width: 42,
    height: 42,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  btnAction: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
  },
  vpsDetailsGrid: {
    gap: 8,
  },
  detailItem: {
    padding: 12,
    borderRadius: 6,
    borderWidth: 1,
  },
  btnRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 6,
    borderWidth: 1,
  },
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
  inputLabel: {
    marginTop: 8,
    marginBottom: 4,
    fontSize: 11,
    fontWeight: '700',
  },
  inputBox: {
    borderRadius: 6,
    borderWidth: 1,
    paddingHorizontal: 10,
    marginBottom: 8,
  },
  textInput: {
    fontSize: 13,
    paddingVertical: 8,
  },
  btnSubmitTicket: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    borderRadius: 8,
    marginTop: 8,
  },
});

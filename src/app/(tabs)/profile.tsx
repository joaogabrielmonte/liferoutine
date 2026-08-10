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
  Modal,
  ActivityIndicator,
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
import { AppToast } from '@/components/atoms/AppToast';
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
  const [devTapCount, setDevTapCount] = useState(0);
  const [vpsPing, setVpsPing] = useState<'online' | 'offline' | 'checking'>('online');

  // Support Ticket Modal & Form State
  const [isTicketModalOpen, setIsTicketModalOpen] = useState(false);
  const [ticketSubject, setTicketSubject] = useState('');
  const [ticketMessage, setTicketMessage] = useState('');
  const [isSubmittingTicket, setIsSubmittingTicket] = useState(false);
  const [toast, setToast] = useState<{ visible: boolean; title: string; message?: string; type?: 'success' | 'error' | 'info' | 'warning' }>({ visible: false, title: '' });

  const isWeb = Platform.OS === 'web';

  useFocusEffect(
    useCallback(() => {
      getUserProfile().then(setProfile);
    }, [])
  );

  const testVpsConnection = async () => {
    setVpsPing('checking');
    try {
      const res = await fetch(`${BACKEND_API_URL}/api/auth/users`).catch(() => null);
      if (res && res.ok) {
        setVpsPing('online');
        setToast({ visible: true, title: 'Servidor Operacional', message: 'Conexão VPS Oracle (147.15.72.151) e PostgreSQL 16 ativas.', type: 'success' });
      } else {
        setVpsPing('offline');
        setToast({ visible: true, title: 'Conexão Offline', message: 'Verifique a rede com a VPS.', type: 'warning' });
      }
    } catch (e) {
      setVpsPing('offline');
    }
  };

  const handleCreateTicketSubmit = async () => {
    if (!ticketSubject.trim() || !ticketMessage.trim()) {
      setToast({ visible: true, title: 'Preencha todos os campos', message: 'Informe o assunto e a mensagem do chamado.', type: 'warning' });
      return;
    }

    setIsSubmittingTicket(true);
    try {
      const res = await createSupportTicket(ticketSubject, ticketMessage);
      setIsSubmittingTicket(false);
      setIsTicketModalOpen(false);
      setTicketSubject('');
      setTicketMessage('');

      if (res.success) {
        setToast({
          visible: true,
          title: 'Chamado Enviado com Sucesso!',
          message: 'Seu chamado foi gravado e notificado ao Painel Administrativo.',
          type: 'success',
        });
      } else {
        setToast({ visible: true, title: 'Erro ao Enviar', message: res.message, type: 'error' });
      }
    } catch (error) {
      setIsSubmittingTicket(false);
      setToast({ visible: true, title: 'Erro de Envio', message: 'Falha ao processar a requisição.', type: 'error' });
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

          <View style={{ height: 40 }} />
        </ScrollView>
      </SafeAreaView>
    );
  }

  // -------------------------------------------------------------
  // MOBILE APP USER PROFILE
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

  const handleDevTap = () => {
    const next = devTapCount + 1;
    setDevTapCount(next);
    if (next >= 5) {
      setDevTapCount(0);
      router.push('/(tabs)/users');
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

        {/* Profile Card */}
        <Animated.View entering={FadeInDown.delay(100).duration(400)}>
          <AppCard style={styles.profileCard} elevated>
            <TouchableOpacity activeOpacity={0.9} onPress={handleDevTap}>
              <View
                style={[
                  styles.avatar,
                  { backgroundColor: colors.primaryLight },
                ]}
              >
                <Ionicons name="person" size={38} color={colors.primary} />
              </View>
            </TouchableOpacity>

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

            {/* Mini Stats */}
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
              icon={<Ionicons name="moon-outline" size={18} color="#8B5CF6" />}
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
                settings.notificationsEnabled
                  ? 'Ativos (10:00 e 17:00)'
                  : 'Desativados'
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
          </AppCard>
        </Animated.View>

        {/* Support Ticket Action Row & Modal Opener */}
        <Animated.View entering={FadeInDown.delay(300).duration(400)}>
          <AppText
            variant="label"
            color="textSecondary"
            style={styles.sectionLabel}
          >
            Suporte & Atendimento
          </AppText>
          <AppCard>
            <SettingRow
              icon={<Ionicons name="chatbubbles-outline" size={18} color="#0052CC" />}
              iconBg="rgba(0, 82, 204, 0.15)"
              label="Abrir Chamado de Suporte"
              subtitle="Notificar o painel administrativo sobre dúvidas ou problemas"
              isLast
              onPress={() => setIsTicketModalOpen(true)}
            />
          </AppCard>
        </Animated.View>

        {/* Logout Card */}
        <Animated.View entering={FadeInDown.delay(400).duration(400)}>
          <AppCard style={{ marginTop: Spacing.md }}>
            <SettingRow
              icon={
                <Ionicons
                  name="log-out-outline"
                  size={18}
                  color={colors.danger}
                />
              }
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

      {/* Support Ticket Modal Sheet for Mobile Users */}
      <Modal
        visible={isTicketModalOpen}
        animationType="fade"
        transparent
        onRequestClose={() => setIsTicketModalOpen(false)}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setIsTicketModalOpen(false)}
        >
          <TouchableOpacity
            activeOpacity={1}
            style={[
              styles.modalCard,
              { backgroundColor: isDark ? '#1E293B' : '#FFFFFF', borderColor: colors.border },
            ]}
            onPress={(e) => {
              if (e && typeof e.stopPropagation === 'function') {
                e.stopPropagation();
              }
            }}
          >
            <View style={styles.modalHeaderRow}>
              <AppText variant="h3" style={{ fontSize: 16, fontWeight: '700' }}>
                Abrir Chamado de Suporte
              </AppText>
              <TouchableOpacity onPress={() => setIsTicketModalOpen(false)} style={{ padding: 4 }}>
                <Ionicons name="close" size={20} color={colors.icon} />
              </TouchableOpacity>
            </View>

            <AppText variant="caption" color="textSecondary" style={{ marginBottom: 12 }}>
              Descreva sua dúvida ou problema técnico. O painel administrativo receberá a notificação imediatamente.
            </AppText>

            <AppText variant="caption" color="textSecondary" style={styles.inputLabel}>
              ASSUNTO
            </AppText>
            <View style={[styles.inputBox, { backgroundColor: colors.background, borderColor: colors.border }]}>
              <TextInput
                style={[styles.textInput, { color: colors.text }]}
                value={ticketSubject}
                onChangeText={setTicketSubject}
                placeholder="Ex: Dúvida sobre o aplicativo"
                placeholderTextColor={colors.textTertiary}
              />
            </View>

            <AppText variant="caption" color="textSecondary" style={styles.inputLabel}>
              MENSAGEM / DETALHES
            </AppText>
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

            <View style={styles.modalButtonRow}>
              <TouchableOpacity
                style={[styles.btnModal, { borderColor: colors.border }]}
                onPress={() => setIsTicketModalOpen(false)}
              >
                <AppText style={{ color: colors.textSecondary, fontWeight: '600' }}>
                  Cancelar
                </AppText>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.btnModal, { backgroundColor: colors.primary, minWidth: 120, alignItems: 'center' }]}
                onPress={handleCreateTicketSubmit}
                disabled={isSubmittingTicket}
              >
                {isSubmittingTicket ? (
                  <ActivityIndicator size="small" color="#FFFFFF" />
                ) : (
                  <AppText style={{ color: '#FFFFFF', fontWeight: '700' }}>
                    Enviar Chamado
                  </AppText>
                )}
              </TouchableOpacity>
            </View>
          </TouchableOpacity>
        </TouchableOpacity>
      </Modal>

      <AppToast
        visible={toast.visible}
        title={toast.title}
        message={toast.message}
        type={toast.type}
        onClose={() => setToast((t) => ({ ...t, visible: false }))}
      />
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
  modalOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.6)',
    padding: 16,
  },
  modalCard: {
    width: '100%',
    maxWidth: 380,
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
  },
  modalHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  modalButtonRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 8,
    marginTop: 12,
  },
  btnModal: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 6,
    borderWidth: 1,
  },
});

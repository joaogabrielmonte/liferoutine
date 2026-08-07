import React, { useState, useEffect } from 'react';
import {
  View,
  ScrollView,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  Alert,
  Modal,
  Pressable,
  Switch,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import * as LocalAuthentication from 'expo-local-authentication';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { useTheme } from '@/hooks/useTheme';
import { AppText } from '@/components/atoms/AppText';
import { AppButton } from '@/components/atoms/AppButton';
import {
  loginUser,
  registerUser,
  resetUserPassword,
  saveRememberedCredentials,
  getRememberedCredentials,
} from '@/services/auth';
import { saveUserProfile, DEFAULT_PROFILE } from '@/services/storage';
import { Radius, Spacing, Shadow } from '@/constants/theme';

export default function LoginScreen() {
  const { colors, isDark } = useTheme();
  const router = useRouter();

  // Mode: 'login' | 'signup'
  const [activeTab, setActiveTab] = useState<'login' | 'signup'>('login');

  // Form Fields (Empty default on clean start)
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(true);

  // Signup fields
  const [name, setName] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [wakeTime, setWakeTime] = useState('07:00');
  const [sleepTime, setSleepTime] = useState('23:00');

  // Password Visibility Toggle ("Olhinho")
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // Biometrics & Saved credentials state
  const [hasBiometrics, setHasBiometrics] = useState(false);
  const [hasSavedCredentials, setHasSavedCredentials] = useState(false);

  // Forgot Password Modal state
  const [isResetModalOpen, setIsResetModalOpen] = useState(false);
  const [resetEmail, setResetEmail] = useState('');
  const [newPassword, setNewPassword] = useState('');

  useEffect(() => {
    async function checkBiometricsAndSavedCreds() {
      try {
        // Check hardware biometrics support
        const compatible = await LocalAuthentication.hasHardwareAsync();
        const enrolled = await LocalAuthentication.isEnrolledAsync();
        setHasBiometrics(compatible && enrolled);

        // Check if user previously saved credentials
        const creds = await getRememberedCredentials();
        if (creds) {
          setEmail(creds.email);
          setPassword(creds.password);
          setRememberMe(true);
          setHasSavedCredentials(true);
        }
      } catch (e) {
        console.warn('Biometric check error:', e);
      }
    }
    checkBiometricsAndSavedCreds();
  }, []);

  const handleBiometricAuth = async () => {
    try {
      const result = await LocalAuthentication.authenticateAsync({
        promptMessage: 'Autenticação Biométrica LifeRoutine',
        fallbackLabel: 'Usar Senha',
        cancelLabel: 'Cancelar',
        disableDeviceFallback: false,
      });

      if (result.success) {
        const creds = await getRememberedCredentials();
        if (creds && creds.email && creds.password) {
          const res = await loginUser(creds.email, creds.password);
          if (res.success && res.user) {
            await saveUserProfile({
              ...DEFAULT_PROFILE,
              name: res.user.name || 'Usuário',
              wakeTime: res.user.wakeTime || wakeTime,
              sleepTime: res.user.sleepTime || sleepTime,
            });
            router.replace('/(tabs)');
            return;
          }
        }
        Alert.alert('Sucesso', 'Biometria confirmada! Informe sua senha para o primeiro acesso.');
      }
    } catch (error) {
      Alert.alert('Biometria Indisponível', 'Não foi possível ler a digital.');
    }
  };

  const handleLoginSubmit = async () => {
    if (!email || !password) {
      Alert.alert('Atenção', 'Informe e-mail e senha.');
      return;
    }

    const res = await loginUser(email, password);
    if (res.success && res.user) {
      await saveRememberedCredentials(email, password, rememberMe);
      await saveUserProfile({
        ...DEFAULT_PROFILE,
        name: res.user.name || name || 'Gabriel',
        wakeTime: res.user.wakeTime || wakeTime,
        sleepTime: res.user.sleepTime || sleepTime,
      });
      router.replace('/(tabs)');
    } else {
      Alert.alert('Erro ao Fazer Login', res.message);
    }
  };

  const handleSignupSubmit = async () => {
    if (!name || !email || !password) {
      Alert.alert('Atenção', 'Preencha todos os campos obrigatórios.');
      return;
    }

    if (password !== confirmPassword) {
      Alert.alert('Atenção', 'As senhas digitadas não coincidem.');
      return;
    }

    const res = await registerUser(name, email, password, wakeTime, sleepTime);
    if (res.success) {
      await saveRememberedCredentials(email, password, rememberMe);
      await saveUserProfile({
        ...DEFAULT_PROFILE,
        name,
        wakeTime,
        sleepTime,
      });
      Alert.alert('Conta Criada! 🚀', 'Sua conta foi criada com sucesso.', [
        { text: 'Ir para o Aplicativo', onPress: () => router.replace('/(tabs)') },
      ]);
    } else {
      Alert.alert('Erro no Cadastro', res.message);
    }
  };

  const handleResetSubmit = async () => {
    if (!resetEmail || !newPassword) {
      Alert.alert('Atenção', 'Informe e-mail e nova senha.');
      return;
    }

    const res = await resetUserPassword(resetEmail, newPassword);
    if (res.success) {
      setIsResetModalOpen(false);
      setEmail(resetEmail);
      setPassword(newPassword);
      Alert.alert('Senha Redefinida!', res.message);
    } else {
      Alert.alert('Erro', res.message);
    }
  };

  return (
    <SafeAreaView
      style={[styles.safe, { backgroundColor: colors.background }]}
      edges={['top', 'bottom']}
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={{ flex: 1 }}
      >
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scroll}
        >
          {/* Brand Logo & Header */}
          <Animated.View entering={FadeInDown.duration(400)} style={styles.header}>
            <View style={[styles.logoBox, { backgroundColor: `${colors.primary}22` }]}>
              <MaterialCommunityIcons name="lightning-bolt" size={38} color={colors.primary} />
            </View>
            <AppText variant="h1" align="center" style={{ marginTop: Spacing.sm }}>
              LifeRoutine
            </AppText>
            <AppText variant="subtitle" color="textSecondary" align="center" style={{ marginTop: 2 }}>
              Sua rotina diária inteligente e persistente
            </AppText>
          </Animated.View>

          {/* Mode Switcher Tabs (Login vs Cadastro) */}
          <Animated.View entering={FadeInDown.delay(100).duration(400)} style={styles.tabsRow}>
            <TouchableOpacity
              style={[
                styles.tabBtn,
                {
                  backgroundColor: activeTab === 'login' ? colors.primary : colors.surface,
                  borderColor: activeTab === 'login' ? colors.primary : colors.border,
                },
              ]}
              onPress={() => setActiveTab('login')}
            >
              <Ionicons
                name="log-in-outline"
                size={18}
                color={activeTab === 'login' ? '#FFF' : colors.textSecondary}
              />
              <AppText
                style={{
                  fontWeight: '700',
                  color: activeTab === 'login' ? '#FFF' : colors.textSecondary,
                  marginLeft: 6,
                }}
              >
                Entrar / Login
              </AppText>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.tabBtn,
                {
                  backgroundColor: activeTab === 'signup' ? colors.primary : colors.surface,
                  borderColor: activeTab === 'signup' ? colors.primary : colors.border,
                },
              ]}
              onPress={() => setActiveTab('signup')}
            >
              <Ionicons
                name="person-add-outline"
                size={18}
                color={activeTab === 'signup' ? '#FFF' : colors.textSecondary}
              />
              <AppText
                style={{
                  fontWeight: '700',
                  color: activeTab === 'signup' ? '#FFF' : colors.textSecondary,
                  marginLeft: 6,
                }}
              >
                Criar Nova Conta
              </AppText>
            </TouchableOpacity>
          </Animated.View>

          {/* Login Form */}
          {activeTab === 'login' ? (
            <Animated.View entering={FadeInDown.delay(150).duration(400)}>
              <View
                style={[
                  styles.card,
                  { backgroundColor: colors.surfaceElevated, borderColor: colors.border },
                ]}
              >
                <AppText variant="title" style={{ marginBottom: Spacing.md }}>
                  Acessar sua Conta
                </AppText>

                {/* Email Field */}
                <AppText variant="label" color="textSecondary" style={styles.fieldLabel}>
                  E-mail
                </AppText>
                <View style={[styles.inputWrapper, { backgroundColor: colors.background, borderColor: colors.border }]}>
                  <Ionicons name="mail-outline" size={18} color={colors.textSecondary} />
                  <TextInput
                    style={[styles.input, { color: colors.text }]}
                    value={email}
                    onChangeText={setEmail}
                    placeholder="seu.email@exemplo.com"
                    placeholderTextColor={colors.textTertiary}
                    keyboardType="email-address"
                    autoCapitalize="none"
                  />
                </View>

                {/* Password Field */}
                <AppText variant="label" color="textSecondary" style={styles.fieldLabel}>
                  Senha
                </AppText>
                <View style={[styles.inputWrapper, { backgroundColor: colors.background, borderColor: colors.border }]}>
                  <Ionicons name="lock-closed-outline" size={18} color={colors.textSecondary} />
                  <TextInput
                    style={[styles.input, { color: colors.text }]}
                    value={password}
                    onChangeText={setPassword}
                    placeholder="Digite sua senha"
                    placeholderTextColor={colors.textTertiary}
                    secureTextEntry={!showPassword}
                  />
                  <TouchableOpacity onPress={() => setShowPassword(!showPassword)} style={{ padding: 4 }}>
                    <Ionicons
                      name={showPassword ? 'eye-off-outline' : 'eye-outline'}
                      size={20}
                      color={colors.textSecondary}
                    />
                  </TouchableOpacity>
                </View>

                {/* Save Password Toggle */}
                <View style={styles.rememberRow}>
                  <View style={styles.rememberLeft}>
                    <Switch
                      value={rememberMe}
                      onValueChange={setRememberMe}
                      trackColor={{ false: colors.border, true: colors.primary }}
                      thumbColor="#FFFFFF"
                    />
                    <AppText variant="caption" color="textSecondary" style={{ marginLeft: 6 }}>
                      Salvar senha no celular
                    </AppText>
                  </View>

                  <TouchableOpacity
                    onPress={() => {
                      setResetEmail(email);
                      setIsResetModalOpen(true);
                    }}
                  >
                    <AppText variant="caption" style={{ color: colors.primary, fontWeight: '700' }}>
                      Esqueceu a senha?
                    </AppText>
                  </TouchableOpacity>
                </View>

                {/* Biometrics Login Button (Fingerprint / Face ID) */}
                {hasBiometrics && (
                  <TouchableOpacity
                    style={[
                      styles.biometricBtn,
                      { backgroundColor: `${colors.primary}15`, borderColor: colors.primary },
                    ]}
                    onPress={handleBiometricAuth}
                    activeOpacity={0.7}
                  >
                    <Ionicons name="finger-print" size={24} color={colors.primary} />
                    <AppText style={{ color: colors.primary, fontWeight: '700', marginLeft: 8 }}>
                      Entrar com Biometria / Digital
                    </AppText>
                  </TouchableOpacity>
                )}

                {/* Submit Login */}
                <View style={{ marginTop: Spacing.md }}>
                  <AppButton
                    label="Entrar na Conta"
                    onPress={handleLoginSubmit}
                    variant="primary"
                    size="lg"
                    fullWidth
                  />
                </View>
              </View>
            </Animated.View>
          ) : (
            /* Signup Form */
            <Animated.View entering={FadeInDown.delay(150).duration(400)}>
              <View
                style={[
                  styles.card,
                  { backgroundColor: colors.surfaceElevated, borderColor: colors.border },
                ]}
              >
                <AppText variant="title" style={{ marginBottom: Spacing.md }}>
                  Criar Nova Conta Persistente
                </AppText>

                {/* Name */}
                <AppText variant="label" color="textSecondary" style={styles.fieldLabel}>
                  Seu Nome *
                </AppText>
                <View style={[styles.inputWrapper, { backgroundColor: colors.background, borderColor: colors.border }]}>
                  <Ionicons name="person-outline" size={18} color={colors.textSecondary} />
                  <TextInput
                    style={[styles.input, { color: colors.text }]}
                    value={name}
                    onChangeText={setName}
                    placeholder="Ex: Gabriel"
                    placeholderTextColor={colors.textTertiary}
                  />
                </View>

                {/* Email */}
                <AppText variant="label" color="textSecondary" style={styles.fieldLabel}>
                  E-mail *
                </AppText>
                <View style={[styles.inputWrapper, { backgroundColor: colors.background, borderColor: colors.border }]}>
                  <Ionicons name="mail-outline" size={18} color={colors.textSecondary} />
                  <TextInput
                    style={[styles.input, { color: colors.text }]}
                    value={email}
                    onChangeText={setEmail}
                    placeholder="seu.email@exemplo.com"
                    placeholderTextColor={colors.textTertiary}
                    keyboardType="email-address"
                    autoCapitalize="none"
                  />
                </View>

                {/* Password */}
                <AppText variant="label" color="textSecondary" style={styles.fieldLabel}>
                  Senha *
                </AppText>
                <View style={[styles.inputWrapper, { backgroundColor: colors.background, borderColor: colors.border }]}>
                  <Ionicons name="lock-closed-outline" size={18} color={colors.textSecondary} />
                  <TextInput
                    style={[styles.input, { color: colors.text }]}
                    value={password}
                    onChangeText={setPassword}
                    placeholder="Crie uma senha forte"
                    placeholderTextColor={colors.textTertiary}
                    secureTextEntry={!showPassword}
                  />
                  <TouchableOpacity onPress={() => setShowPassword(!showPassword)} style={{ padding: 4 }}>
                    <Ionicons
                      name={showPassword ? 'eye-off-outline' : 'eye-outline'}
                      size={20}
                      color={colors.textSecondary}
                    />
                  </TouchableOpacity>
                </View>

                {/* Confirm Password */}
                <AppText variant="label" color="textSecondary" style={styles.fieldLabel}>
                  Confirmar Senha *
                </AppText>
                <View style={[styles.inputWrapper, { backgroundColor: colors.background, borderColor: colors.border }]}>
                  <Ionicons name="shield-checkmark-outline" size={18} color={colors.textSecondary} />
                  <TextInput
                    style={[styles.input, { color: colors.text }]}
                    value={confirmPassword}
                    onChangeText={setConfirmPassword}
                    placeholder="Repita a senha"
                    placeholderTextColor={colors.textTertiary}
                    secureTextEntry={!showConfirmPassword}
                  />
                  <TouchableOpacity onPress={() => setShowConfirmPassword(!showConfirmPassword)} style={{ padding: 4 }}>
                    <Ionicons
                      name={showConfirmPassword ? 'eye-off-outline' : 'eye-outline'}
                      size={20}
                      color={colors.textSecondary}
                    />
                  </TouchableOpacity>
                </View>

                {/* Wake / Sleep times */}
                <View style={styles.rowTwo}>
                  <View style={{ flex: 1 }}>
                    <AppText variant="label" color="textSecondary" style={styles.fieldLabel}>
                      Acorda às
                    </AppText>
                    <View style={[styles.inputWrapper, { backgroundColor: colors.background, borderColor: colors.border }]}>
                      <Ionicons name="sunny-outline" size={18} color="#F59E0B" />
                      <TextInput
                        style={[styles.input, { color: colors.text }]}
                        value={wakeTime}
                        onChangeText={setWakeTime}
                        placeholder="07:00"
                        placeholderTextColor={colors.textTertiary}
                      />
                    </View>
                  </View>

                  <View style={{ flex: 1 }}>
                    <AppText variant="label" color="textSecondary" style={styles.fieldLabel}>
                      Dorme às
                    </AppText>
                    <View style={[styles.inputWrapper, { backgroundColor: colors.background, borderColor: colors.border }]}>
                      <Ionicons name="moon-outline" size={18} color="#8B5CF6" />
                      <TextInput
                        style={[styles.input, { color: colors.text }]}
                        value={sleepTime}
                        onChangeText={setSleepTime}
                        placeholder="23:00"
                        placeholderTextColor={colors.textTertiary}
                      />
                    </View>
                  </View>
                </View>

                {/* Submit Signup */}
                <View style={{ marginTop: Spacing.lg }}>
                  <AppButton
                    label="Cadastrar e Iniciar"
                    onPress={handleSignupSubmit}
                    variant="primary"
                    size="lg"
                    fullWidth
                  />
                </View>
              </View>
            </Animated.View>
          )}

          {/* Quick Access without Login */}
          <TouchableOpacity
            style={styles.skipBtn}
            onPress={() => router.replace('/(tabs)')}
          >
            <AppText variant="caption" color="textSecondary" align="center">
              Continuar no Modo Convidado →
            </AppText>
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>

      {/* Redefinir Senha Modal */}
      <Modal
        visible={isResetModalOpen}
        animationType="fade"
        transparent
        onRequestClose={() => setIsResetModalOpen(false)}
      >
        <View style={styles.overlay}>
          <Pressable style={styles.backdrop} onPress={() => setIsResetModalOpen(false)} />

          <View
            style={[
              styles.modalContainer,
              { backgroundColor: colors.surfaceElevated, borderColor: colors.border },
            ]}
          >
            <View style={styles.modalHeader}>
              <AppText variant="h3">Redefinir Senha</AppText>
              <TouchableOpacity onPress={() => setIsResetModalOpen(false)}>
                <Ionicons name="close" size={22} color={colors.icon} />
              </TouchableOpacity>
            </View>

            <AppText variant="body" color="textSecondary" style={{ marginBottom: Spacing.md }}>
              Informe o e-mail da sua conta e escolha uma nova senha:
            </AppText>

            <AppText variant="label" color="textSecondary" style={styles.fieldLabel}>
              E-mail da Conta
            </AppText>
            <View style={[styles.inputWrapper, { backgroundColor: colors.background, borderColor: colors.border }]}>
              <Ionicons name="mail-outline" size={18} color={colors.textSecondary} />
              <TextInput
                style={[styles.input, { color: colors.text }]}
                value={resetEmail}
                onChangeText={setResetEmail}
                placeholder="seu.email@exemplo.com"
                placeholderTextColor={colors.textTertiary}
                keyboardType="email-address"
                autoCapitalize="none"
              />
            </View>

            <AppText variant="label" color="textSecondary" style={styles.fieldLabel}>
              Nova Senha
            </AppText>
            <View style={[styles.inputWrapper, { backgroundColor: colors.background, borderColor: colors.border }]}>
              <Ionicons name="lock-closed-outline" size={18} color={colors.textSecondary} />
              <TextInput
                style={[styles.input, { color: colors.text }]}
                value={newPassword}
                onChangeText={setNewPassword}
                placeholder="Digite a nova senha"
                placeholderTextColor={colors.textTertiary}
                secureTextEntry={!showPassword}
              />
              <TouchableOpacity onPress={() => setShowPassword(!showPassword)} style={{ padding: 4 }}>
                <Ionicons
                  name={showPassword ? 'eye-off-outline' : 'eye-outline'}
                  size={20}
                  color={colors.textSecondary}
                />
              </TouchableOpacity>
            </View>

            <View style={styles.modalButtonRow}>
              <AppButton label="Cancelar" variant="ghost" onPress={() => setIsResetModalOpen(false)} />
              <AppButton label="Salvar Senha" variant="primary" onPress={handleResetSubmit} />
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  scroll: { padding: Spacing.lg },
  header: {
    alignItems: 'center',
    marginVertical: Spacing.base,
  },
  logoBox: {
    width: 64,
    height: 64,
    borderRadius: Radius.xl,
    alignItems: 'center',
    justifyContent: 'center',
    ...Shadow.sm,
  },
  tabsRow: {
    flexDirection: 'row',
    gap: Spacing.sm,
    marginBottom: Spacing.md,
  },
  tabBtn: {
    flex: 1,
    height: 44,
    borderRadius: Radius.md,
    borderWidth: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    ...Shadow.sm,
  },
  card: {
    padding: Spacing.lg,
    borderRadius: Radius.xl,
    borderWidth: StyleSheet.hairlineWidth,
    ...Shadow.sm,
  },
  fieldLabel: {
    marginTop: Spacing.xs,
    marginBottom: 4,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 48,
    borderRadius: Radius.md,
    borderWidth: 1,
    paddingHorizontal: Spacing.md,
  },
  input: {
    flex: 1,
    marginLeft: Spacing.xs,
    fontSize: 15,
  },
  rowTwo: {
    flexDirection: 'row',
    gap: Spacing.sm,
    marginTop: Spacing.xs,
  },
  rememberRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: Spacing.sm,
  },
  rememberLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  biometricBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    height: 48,
    borderRadius: Radius.lg,
    borderWidth: 1.5,
    marginTop: Spacing.md,
  },
  skipBtn: {
    marginVertical: Spacing.xl,
    padding: Spacing.sm,
  },
  overlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.65)',
    padding: Spacing.base,
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
  },
  modalContainer: {
    width: '100%',
    maxWidth: 350,
    borderRadius: Radius.xl,
    padding: Spacing.lg,
    borderWidth: StyleSheet.hairlineWidth,
    ...Shadow.lg,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: Spacing.sm,
  },
  modalButtonRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: Spacing.sm,
    marginTop: Spacing.lg,
  },
});

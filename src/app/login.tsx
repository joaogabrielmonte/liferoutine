import React, { useState, useEffect } from 'react';
import {
  View,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  Switch,
  Alert,
  Platform,
  Modal,
  Image,
} from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import * as LocalAuthentication from 'expo-local-authentication';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { useTheme } from '@/hooks/useTheme';
import { AppText } from '@/components/atoms/AppText';
import {
  loginUser,
  registerUser,
  resetUserPassword,
  saveRememberedCredentials,
  getRememberedCredentials,
} from '@/services/auth';
import { saveUserProfile, DEFAULT_PROFILE } from '@/services/storage';

type FieldName = 'name' | 'email' | 'password' | 'confirmPassword' | 'wakeTime' | 'sleepTime';

export default function LoginScreen() {
  const { colors, isDark } = useTheme();
  const router = useRouter();

  const [activeTab, setActiveTab] = useState<'login' | 'signup'>('login');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [wakeTime, setWakeTime] = useState('07:00');
  const [sleepTime, setSleepTime] = useState('23:00');

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [hasBiometrics, setHasBiometrics] = useState(false);

  // Field inline errors
  const [nameError, setNameError] = useState('');
  const [emailError, setEmailError] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [confirmPasswordError, setConfirmPasswordError] = useState('');

  // Password reset modal
  const [isResetModalOpen, setIsResetModalOpen] = useState(false);
  const [resetEmail, setResetEmail] = useState('');
  const [newPassword, setNewPassword] = useState('');

  // Focused Field Glow
  const [focusedField, setFocusedField] = useState<FieldName | null>(null);

  const isWeb = Platform.OS === 'web';

  useEffect(() => {
    async function checkBiometricsAndSavedCreds() {
      if (!isWeb) {
        const compatible = await LocalAuthentication.hasHardwareAsync();
        const enrolled = await LocalAuthentication.isEnrolledAsync();
        setHasBiometrics(compatible && enrolled);
      }

      const saved = await getRememberedCredentials();
      if (saved && saved.rememberMe) {
        setEmail(saved.email);
        setPassword(saved.password);
        setRememberMe(true);
      }
    }
    checkBiometricsAndSavedCreds();
  }, []);

  const validateLoginForm = (): boolean => {
    let valid = true;
    setEmailError('');
    setPasswordError('');

    if (!email || !email.includes('@')) {
      setEmailError('Digite um e-mail válido');
      valid = false;
    }

    if (!password || password.length < 4) {
      setPasswordError('A senha deve conter pelo menos 4 caracteres');
      valid = false;
    }

    return valid;
  };

  const validateSignupForm = (): boolean => {
    let valid = true;
    setNameError('');
    setEmailError('');
    setPasswordError('');
    setConfirmPasswordError('');

    if (!name.trim()) {
      setNameError('Informe seu nome completo');
      valid = false;
    }

    if (!email || !email.includes('@')) {
      setEmailError('Digite um e-mail válido');
      valid = false;
    }

    if (!password || password.length < 4) {
      setPasswordError('A senha deve ter no mínimo 4 caracteres');
      valid = false;
    }

    if (password !== confirmPassword) {
      setConfirmPasswordError('As senhas não coincidem');
      valid = false;
    }

    return valid;
  };

  const handleLoginSubmit = async () => {
    if (!validateLoginForm()) return;

    const res = await loginUser(email, password);
    if (res.success && res.user) {
      await saveRememberedCredentials(email, password, rememberMe);
      await saveUserProfile({
        ...DEFAULT_PROFILE,
        name: res.user.name || 'Gabriel Monte',
      });
      router.replace('/(tabs)');
    } else {
      setPasswordError(res.message || 'Credenciais inválidas.');
    }
  };

  const handleRegisterSubmit = async () => {
    if (!validateSignupForm()) return;

    const res = await registerUser(name, email, password, wakeTime, sleepTime);
    if (res.success) {
      await saveUserProfile({
        ...DEFAULT_PROFILE,
        name: name.trim(),
        wakeTime,
        sleepTime,
      });
      Alert.alert('Conta Criada!', res.message, [
        {
          text: 'Continuar',
          onPress: () => router.replace('/(tabs)'),
        },
      ]);
    } else {
      Alert.alert('Erro no Cadastro', res.message);
    }
  };

  const handleBiometricAuth = async () => {
    try {
      const result = await LocalAuthentication.authenticateAsync({
        promptMessage: 'Autenticação Biométrica LifeRoutine',
        fallbackLabel: 'Usar Senha',
      });

      if (result.success) {
        router.replace('/(tabs)');
      }
    } catch (e) {
      console.warn('Biometric auth error:', e);
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

  const primaryBlue = '#0052CC';

  const getInputWrapperStyle = (fieldName: FieldName, hasError: boolean) => {
    const isFocused = focusedField === fieldName;
    return [
      styles.inputWrapper,
      {
        backgroundColor: colors.background,
        borderColor: hasError
          ? colors.danger
          : isFocused
          ? colors.primary
          : colors.border,
      },
      isFocused && !hasError && styles.focusedGlow,
      hasError && styles.errorGlow,
    ];
  };

  // -------------------------------------------------------------
  // WEB ADMIN PANEL LOGIN SCREEN (EXCLUSIVE STICKY WEB)
  // -------------------------------------------------------------
  if (isWeb) {
    const webBg = isDark ? '#0B0F19' : '#F9FAFB';
    const webCardBg = isDark ? '#111827' : '#FFFFFF';
    const webBorder = isDark ? '#1F2937' : '#E5E7EB';

    return (
      <SafeAreaView
        style={[styles.safe, { backgroundColor: webBg }]}
        edges={['top', 'bottom']}
      >
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.webContainer}
        >
          <View style={styles.webLoginBox}>
            <Animated.View entering={FadeInDown.duration(300)} style={styles.webBrandHeader}>
              <Image
                source={require('../../assets/images/icon.png')}
                style={styles.logoImageWeb}
                resizeMode="contain"
              />
              <AppText variant="h1" align="center" style={{ marginTop: 12, fontSize: 22, fontWeight: '700', letterSpacing: -0.3 }}>
                LifeRoutine Admin
              </AppText>
              <AppText variant="caption" color="textSecondary" align="center" style={{ marginTop: 4, fontSize: 13 }}>
                Painel Administrativo de Controle e Suporte
              </AppText>
            </Animated.View>

            <Animated.View entering={FadeInDown.delay(100).duration(300)}>
              <View
                style={[
                  styles.card,
                  { backgroundColor: webCardBg, borderColor: webBorder },
                ]}
              >
                <View style={styles.adminBadgeRow}>
                  <Ionicons name="shield-checkmark" size={16} color={primaryBlue} />
                  <AppText style={{ fontSize: 12, fontWeight: '700', color: isDark ? '#4C9AFF' : primaryBlue, marginLeft: 4 }}>
                    ACESSO RESTRITO AO PAINEL ADMIN
                  </AppText>
                </View>

                {/* Email Field */}
                <AppText variant="caption" color="textSecondary" style={styles.fieldLabel}>
                  E-MAIL ADMINISTRATIVO
                </AppText>
                <View style={getInputWrapperStyle('email', !!emailError)}>
                  <Ionicons
                    name="mail-outline"
                    size={16}
                    color={focusedField === 'email' ? primaryBlue : colors.textSecondary}
                  />
                  <TextInput
                    style={[styles.input, { color: colors.text }]}
                    value={email}
                    onChangeText={(t) => { setEmail(t); setEmailError(''); }}
                    placeholder="admin@liferoutine.com"
                    placeholderTextColor={colors.textTertiary}
                    keyboardType="email-address"
                    autoCapitalize="none"
                    onFocus={() => setFocusedField('email')}
                    onBlur={() => setFocusedField(null)}
                  />
                </View>
                {!!emailError && <AppText style={styles.errorFallback}>{emailError}</AppText>}

                {/* Password Field */}
                <AppText variant="caption" color="textSecondary" style={styles.fieldLabel}>
                  SENHA DE ACESSO
                </AppText>
                <View style={getInputWrapperStyle('password', !!passwordError)}>
                  <Ionicons
                    name="lock-closed-outline"
                    size={16}
                    color={focusedField === 'password' ? primaryBlue : colors.textSecondary}
                  />
                  <TextInput
                    style={[styles.input, { color: colors.text }]}
                    value={password}
                    onChangeText={(t) => { setPassword(t); setPasswordError(''); }}
                    placeholder="Digite sua senha"
                    placeholderTextColor={colors.textTertiary}
                    secureTextEntry={!showPassword}
                    onFocus={() => setFocusedField('password')}
                    onBlur={() => setFocusedField(null)}
                  />
                  <TouchableOpacity onPress={() => setShowPassword(!showPassword)} style={{ padding: 4 }}>
                    <Ionicons
                      name={showPassword ? 'eye-off-outline' : 'eye-outline'}
                      size={18}
                      color={colors.textSecondary}
                    />
                  </TouchableOpacity>
                </View>
                {!!passwordError && <AppText style={styles.errorFallback}>{passwordError}</AppText>}

                {/* Remember Row */}
                <View style={styles.rememberRow}>
                  <View style={styles.rememberLeft}>
                    <Switch
                      value={rememberMe}
                      onValueChange={setRememberMe}
                      trackColor={{ false: webBorder, true: primaryBlue }}
                      thumbColor="#FFFFFF"
                    />
                    <AppText variant="caption" color="textSecondary" style={{ marginLeft: 6, fontSize: 12 }}>
                      Lembrar sessão (30 min timeout)
                    </AppText>
                  </View>

                  <TouchableOpacity
                    onPress={() => {
                      setResetEmail(email);
                      setIsResetModalOpen(true);
                    }}
                  >
                    <AppText variant="caption" style={{ color: isDark ? '#4C9AFF' : primaryBlue, fontWeight: '600', fontSize: 12 }}>
                      Esqueceu a senha?
                    </AppText>
                  </TouchableOpacity>
                </View>

                {/* Submit Button */}
                <View style={{ marginTop: 18 }}>
                  <TouchableOpacity
                    style={[styles.btnSubmit, { backgroundColor: primaryBlue }]}
                    onPress={handleLoginSubmit}
                    activeOpacity={0.8}
                  >
                    <AppText style={styles.btnSubmitText}>
                      Entrar no Painel Admin
                    </AppText>
                  </TouchableOpacity>
                </View>
              </View>
            </Animated.View>
          </View>
        </ScrollView>
      </SafeAreaView>
    );
  }

  // -------------------------------------------------------------
  // MOBILE APP NATIVE LOGIN & SIGNUP SCREEN (UNTOUCHED)
  // -------------------------------------------------------------
  return (
    <SafeAreaView
      style={[styles.safe, { backgroundColor: colors.background }]}
      edges={['top', 'bottom']}
    >
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scroll}
      >
        {/* Mobile Header Brand */}
        <Animated.View entering={FadeInDown.duration(400)} style={styles.mobileHeader}>
          <Image
            source={require('../../assets/images/icon.png')}
            style={styles.logoImageMobile}
            resizeMode="contain"
          />
          <AppText variant="h1" align="center" style={{ marginTop: 8 }}>
            LifeRoutine
          </AppText>
          <AppText variant="caption" color="textSecondary" align="center">
            Construa hábitos diários com consistência
          </AppText>
        </Animated.View>

        {/* Mobile Tab Selector (Entrar / Criar Conta) */}
        <Animated.View entering={FadeInDown.delay(100).duration(400)} style={styles.tabContainer}>
          <TouchableOpacity
            style={[
              styles.tabBtn,
              {
                backgroundColor: activeTab === 'login' ? colors.surfaceElevated : 'transparent',
                borderColor: activeTab === 'login' ? colors.primary : colors.border,
              },
            ]}
            onPress={() => setActiveTab('login')}
          >
            <Ionicons
              name="log-in-outline"
              size={16}
              color={activeTab === 'login' ? colors.primary : colors.textSecondary}
            />
            <AppText
              style={{
                marginLeft: 6,
                fontWeight: activeTab === 'login' ? '700' : '500',
                color: activeTab === 'login' ? colors.primary : colors.textSecondary,
              }}
            >
              Entrar
            </AppText>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.tabBtn,
              {
                backgroundColor: activeTab === 'signup' ? colors.surfaceElevated : 'transparent',
                borderColor: activeTab === 'signup' ? colors.primary : colors.border,
              },
            ]}
            onPress={() => setActiveTab('signup')}
          >
            <Ionicons
              name="person-add-outline"
              size={16}
              color={activeTab === 'signup' ? colors.primary : colors.textSecondary}
            />
            <AppText
              style={{
                marginLeft: 6,
                fontWeight: activeTab === 'signup' ? '700' : '500',
                color: activeTab === 'signup' ? colors.primary : colors.textSecondary,
              }}
            >
              Criar Conta
            </AppText>
          </TouchableOpacity>
        </Animated.View>

        {/* Form Card */}
        <Animated.View entering={FadeInDown.delay(200).duration(400)}>
          <View style={[styles.card, { backgroundColor: colors.surfaceElevated, borderColor: colors.border }]}>
            {activeTab === 'signup' && (
              <>
                <AppText variant="caption" color="textSecondary" style={styles.fieldLabel}>
                  NOME COMPLETO
                </AppText>
                <View style={getInputWrapperStyle('name', !!nameError)}>
                  <Ionicons name="person-outline" size={16} color={colors.textSecondary} />
                  <TextInput
                    style={[styles.input, { color: colors.text }]}
                    value={name}
                    onChangeText={(t) => { setName(t); setNameError(''); }}
                    placeholder="Ex: Gabriel Monte"
                    placeholderTextColor={colors.textTertiary}
                  />
                </View>
                {!!nameError && <AppText style={styles.errorFallback}>{nameError}</AppText>}
              </>
            )}

            {/* Email */}
            <AppText variant="caption" color="textSecondary" style={styles.fieldLabel}>
              E-MAIL
            </AppText>
            <View style={getInputWrapperStyle('email', !!emailError)}>
              <Ionicons name="mail-outline" size={16} color={colors.textSecondary} />
              <TextInput
                style={[styles.input, { color: colors.text }]}
                value={email}
                onChangeText={(t) => { setEmail(t); setEmailError(''); }}
                placeholder="seu.email@exemplo.com"
                placeholderTextColor={colors.textTertiary}
                keyboardType="email-address"
                autoCapitalize="none"
              />
            </View>
            {!!emailError && <AppText style={styles.errorFallback}>{emailError}</AppText>}

            {/* Password */}
            <AppText variant="caption" color="textSecondary" style={styles.fieldLabel}>
              SENHA
            </AppText>
            <View style={getInputWrapperStyle('password', !!passwordError)}>
              <Ionicons name="lock-closed-outline" size={16} color={colors.textSecondary} />
              <TextInput
                style={[styles.input, { color: colors.text }]}
                value={password}
                onChangeText={(t) => { setPassword(t); setPasswordError(''); }}
                placeholder="Digite sua senha"
                placeholderTextColor={colors.textTertiary}
                secureTextEntry={!showPassword}
              />
              <TouchableOpacity onPress={() => setShowPassword(!showPassword)} style={{ padding: 4 }}>
                <Ionicons
                  name={showPassword ? 'eye-off-outline' : 'eye-outline'}
                  size={18}
                  color={colors.textSecondary}
                />
              </TouchableOpacity>
            </View>
            {!!passwordError && <AppText style={styles.errorFallback}>{passwordError}</AppText>}

            {activeTab === 'signup' && (
              <>
                {/* Confirm Password */}
                <AppText variant="caption" color="textSecondary" style={styles.fieldLabel}>
                  CONFIRMAR SENHA
                </AppText>
                <View style={getInputWrapperStyle('confirmPassword', !!confirmPasswordError)}>
                  <Ionicons name="shield-checkmark-outline" size={16} color={colors.textSecondary} />
                  <TextInput
                    style={[styles.input, { color: colors.text }]}
                    value={confirmPassword}
                    onChangeText={(t) => { setConfirmPassword(t); setConfirmPasswordError(''); }}
                    placeholder="Repita sua senha"
                    placeholderTextColor={colors.textTertiary}
                    secureTextEntry={!showConfirmPassword}
                  />
                  <TouchableOpacity onPress={() => setShowConfirmPassword(!showConfirmPassword)} style={{ padding: 4 }}>
                    <Ionicons
                      name={showConfirmPassword ? 'eye-off-outline' : 'eye-outline'}
                      size={18}
                      color={colors.textSecondary}
                    />
                  </TouchableOpacity>
                </View>
                {!!confirmPasswordError && <AppText style={styles.errorFallback}>{confirmPasswordError}</AppText>}

                {/* Schedules */}
                <View style={styles.scheduleRow}>
                  <View style={{ flex: 1 }}>
                    <AppText variant="caption" color="textSecondary" style={styles.fieldLabel}>
                      ACORDAR
                    </AppText>
                    <View style={[styles.inputWrapper, { backgroundColor: colors.background, borderColor: colors.border }]}>
                      <Ionicons name="sunny-outline" size={16} color="#F59E0B" />
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
                    <AppText variant="caption" color="textSecondary" style={styles.fieldLabel}>
                      DORMIR
                    </AppText>
                    <View style={[styles.inputWrapper, { backgroundColor: colors.background, borderColor: colors.border }]}>
                      <Ionicons name="moon-outline" size={16} color="#8B5CF6" />
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
              </>
            )}

            {activeTab === 'login' && (
              <View style={styles.rememberRow}>
                <View style={styles.rememberLeft}>
                  <Switch
                    value={rememberMe}
                    onValueChange={setRememberMe}
                    trackColor={{ false: colors.border, true: colors.primary }}
                    thumbColor="#FFFFFF"
                  />
                  <AppText variant="caption" color="textSecondary" style={{ marginLeft: 6, fontSize: 12 }}>
                    Lembrar-me
                  </AppText>
                </View>

                <TouchableOpacity
                  onPress={() => {
                    setResetEmail(email);
                    setIsResetModalOpen(true);
                  }}
                >
                  <AppText variant="caption" style={{ color: colors.primary, fontWeight: '600', fontSize: 12 }}>
                    Esqueceu a senha?
                  </AppText>
                </TouchableOpacity>
              </View>
            )}

            {/* Submit Button */}
            <TouchableOpacity
              style={[styles.btnSubmit, { backgroundColor: colors.primary, marginTop: 18 }]}
              onPress={activeTab === 'login' ? handleLoginSubmit : handleRegisterSubmit}
              activeOpacity={0.8}
            >
              <AppText style={styles.btnSubmitText}>
                {activeTab === 'login' ? 'Entrar no Aplicativo' : 'Criar Minha Conta'}
              </AppText>
            </TouchableOpacity>

            {/* Biometric Login option */}
            {activeTab === 'login' && hasBiometrics && (
              <TouchableOpacity
                style={[styles.btnBiometric, { borderColor: colors.border }]}
                onPress={handleBiometricAuth}
                activeOpacity={0.7}
              >
                <Ionicons name="finger-print-outline" size={20} color={colors.primary} />
                <AppText style={{ color: colors.primary, fontWeight: '600', marginLeft: 8, fontSize: 13 }}>
                  Entrar com Biometria / Digital
                </AppText>
              </TouchableOpacity>
            )}
          </View>
        </Animated.View>

        {/* Skip button for Guest Mobile Access */}
        <TouchableOpacity
          style={styles.skipBtn}
          onPress={() => router.replace('/(tabs)')}
        >
          <AppText variant="caption" color="textSecondary" align="center" style={{ fontSize: 12 }}>
            Continuar sem login →
          </AppText>
        </TouchableOpacity>
      </ScrollView>

      {/* Password Reset Modal */}
      <Modal
        visible={isResetModalOpen}
        animationType="fade"
        transparent
        onRequestClose={() => setIsResetModalOpen(false)}
      >
        <View style={styles.modalOverlay}>
          <Pressable style={styles.modalBackdrop} onPress={() => setIsResetModalOpen(false)} />
          <View style={[styles.modalCard, { backgroundColor: colors.surfaceElevated, borderColor: colors.border }]}>
            <AppText variant="h3" style={{ fontSize: 16, fontWeight: '700', marginBottom: 6 }}>
              Redefinir Senha
            </AppText>
            <AppText variant="caption" color="textSecondary" style={{ marginBottom: 12 }}>
              Informe seu e-mail e a nova senha desejada:
            </AppText>

            <AppText variant="caption" color="textSecondary" style={styles.fieldLabel}>E-MAIL</AppText>
            <View style={[styles.inputWrapper, { backgroundColor: colors.background, borderColor: colors.border }]}>
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

            <AppText variant="caption" color="textSecondary" style={styles.fieldLabel}>NOVA SENHA</AppText>
            <View style={[styles.inputWrapper, { backgroundColor: colors.background, borderColor: colors.border }]}>
              <TextInput
                style={[styles.input, { color: colors.text }]}
                value={newPassword}
                onChangeText={setNewPassword}
                placeholder="Digite a nova senha"
                placeholderTextColor={colors.textTertiary}
                secureTextEntry
              />
            </View>

            <View style={styles.modalButtonRow}>
              <TouchableOpacity
                style={[styles.btnModal, { borderColor: colors.border }]}
                onPress={() => setIsResetModalOpen(false)}
              >
                <AppText style={{ color: colors.textSecondary, fontWeight: '600' }}>Cancelar</AppText>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.btnModal, { backgroundColor: colors.primary }]}
                onPress={handleResetSubmit}
              >
                <AppText style={{ color: '#FFF', fontWeight: '700' }}>Redefinir</AppText>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  scroll: { paddingHorizontal: 20, paddingTop: 20, paddingBottom: 40 },
  webContainer: { flexGrow: 1, justifyContent: 'center', alignItems: 'center', padding: 20 },
  webLoginBox: { width: '100%', maxWidth: 420 },
  webBrandHeader: { alignItems: 'center', marginBottom: 24 },
  mobileHeader: { alignItems: 'center', marginBottom: 24 },
  logoImageWeb: { width: 48, height: 48, borderRadius: 12 },
  logoImageMobile: { width: 56, height: 56, borderRadius: 14 },
  card: { padding: 20, borderRadius: 16, borderWidth: 1 },
  adminBadgeRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 16 },
  fieldLabel: { fontSize: 11, fontWeight: '700', letterSpacing: 0.5, marginTop: 12, marginBottom: 4 },
  inputWrapper: { flexDirection: 'row', alignItems: 'center', height: 42, borderRadius: 8, borderWidth: 1.5, paddingHorizontal: 12 },
  focusedGlow: {
    shadowColor: '#0052CC',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.35,
    shadowRadius: 6,
    elevation: 3,
  },
  errorGlow: {
    shadowColor: '#DE350B',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.35,
    shadowRadius: 6,
    elevation: 3,
  },
  input: { flex: 1, marginLeft: 6, fontSize: 13 },
  errorFallback: { color: '#DE350B', fontSize: 11, marginTop: 2, fontWeight: '600' },
  rememberRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 14 },
  rememberLeft: { flexDirection: 'row', alignItems: 'center' },
  btnSubmit: { height: 44, borderRadius: 8, alignItems: 'center', justifyContent: 'center' },
  btnSubmitText: { color: '#FFFFFF', fontWeight: '700', fontSize: 14 },
  tabContainer: { flexDirection: 'row', gap: 10, marginBottom: 16 },
  tabBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', height: 40, borderRadius: 8, borderWidth: 1 },
  scheduleRow: { flexDirection: 'row', gap: 10 },
  btnBiometric: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', height: 42, borderRadius: 8, borderWidth: 1, marginTop: 12 },
  skipBtn: { marginTop: 20, padding: 10 },
  modalOverlay: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: 'rgba(0,0,0,0.6)', padding: 16 },
  modalBackdrop: { ...StyleSheet.absoluteFillObject },
  modalCard: { width: '100%', maxWidth: 360, borderRadius: 12, padding: 16, borderWidth: 1 },
  modalButtonRow: { flexDirection: 'row', justifyContent: 'flex-end', gap: 8, marginTop: 16 },
  btnModal: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 6, borderWidth: 1 },
});

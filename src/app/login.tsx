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

type FieldName = 'email' | 'password' | 'name' | 'confirmPassword' | null;

export default function LoginScreen() {
  const { colors, isDark } = useTheme();
  const router = useRouter();
  const isWeb = Platform.OS === 'web';

  // Mode: 'login' | 'signup'
  const [activeTab, setActiveTab] = useState<'login' | 'signup'>('login');

  // Active Focused Field for Dynamic Glow Effect
  const [focusedField, setFocusedField] = useState<FieldName>(null);

  // Form Fields
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(true);

  // Signup fields
  const [name, setName] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  // Inline Validation Error Fallbacks
  const [emailError, setEmailError] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [nameError, setNameError] = useState('');
  const [confirmPasswordError, setConfirmPasswordError] = useState('');

  // Password Visibility Toggle ("Olhinho")
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // Biometrics
  const [hasBiometrics, setHasBiometrics] = useState(false);

  // Forgot Password Modal state
  const [isResetModalOpen, setIsResetModalOpen] = useState(false);
  const [resetEmail, setResetEmail] = useState('');
  const [newPassword, setNewPassword] = useState('');

  useEffect(() => {
    async function checkBiometricsAndSavedCreds() {
      try {
        if (!isWeb) {
          const compatible = await LocalAuthentication.hasHardwareAsync();
          const enrolled = await LocalAuthentication.isEnrolledAsync();
          setHasBiometrics(compatible && enrolled);
        }

        const creds = await getRememberedCredentials();
        if (creds) {
          setEmail(creds.email);
          setPassword(creds.password);
          setRememberMe(true);
        }
      } catch (e) {
        console.warn('Biometric check error:', e);
      }
    }
    checkBiometricsAndSavedCreds();
  }, []);

  const validateLoginForm = (): boolean => {
    let valid = true;
    setEmailError('');
    setPasswordError('');

    if (!email || !email.includes('@')) {
      setEmailError('⚠️ Digite um endereço de e-mail válido (ex: usuario@email.com)');
      valid = false;
    }

    if (!password || password.length < 4) {
      setPasswordError('⚠️ A senha deve conter pelo menos 4 caracteres');
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
        name: res.user.name || name || 'Gabriel Monte',
      });
      router.replace('/(tabs)');
    } else {
      setPasswordError(`⚠️ ${res.message || 'Credenciais inválidas. Verifique e-mail e senha.'}`);
    }
  };

  const validateSignupForm = (): boolean => {
    let valid = true;
    setNameError('');
    setEmailError('');
    setPasswordError('');
    setConfirmPasswordError('');

    if (!name.trim()) {
      setNameError('⚠️ Por favor, informe seu nome completo');
      valid = false;
    }

    if (!email || !email.includes('@')) {
      setEmailError('⚠️ Digite um e-mail válido');
      valid = false;
    }

    if (!password || password.length < 6) {
      setPasswordError('⚠️ A senha deve ter no mínimo 6 caracteres por segurança');
      valid = false;
    }

    if (password !== confirmPassword) {
      setConfirmPasswordError('⚠️ As senhas não coincidem');
      valid = false;
    }

    return valid;
  };

  const handleSignupSubmit = async () => {
    if (!validateSignupForm()) return;

    const res = await registerUser(name, email, password, '07:00', '23:00');
    if (res.success) {
      await saveRememberedCredentials(email, password, rememberMe);
      await saveUserProfile({
        ...DEFAULT_PROFILE,
        name,
      });
      Alert.alert('Conta Criada! 🚀', 'Sua conta foi cadastrada com sucesso.', [
        { text: 'Ir para o Painel', onPress: () => router.replace('/(tabs)') },
      ]);
    } else {
      setEmailError(`⚠️ ${res.message}`);
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

  // Apple/Vercel Clean UI Palette
  const webBg = isDark ? '#0F172A' : '#F8FAFC';
  const webCardBg = isDark ? '#1E293B' : '#FFFFFF';
  const webBorder = isDark ? '#334155' : '#E2E8F0';
  const primaryBlue = '#2563EB';

  const getInputWrapperStyle = (fieldName: FieldName, hasError: boolean) => {
    const isFocused = focusedField === fieldName;
    return [
      styles.inputWrapper,
      {
        backgroundColor: isWeb ? (isDark ? '#0F172A' : '#FFFFFF') : colors.background,
        borderColor: hasError
          ? '#EF4444'
          : isFocused
          ? primaryBlue
          : isWeb
          ? webBorder
          : colors.border,
      },
      isFocused && !hasError && styles.focusedGlow,
      hasError && styles.errorGlow,
    ];
  };

  return (
    <SafeAreaView
      style={[styles.safe, { backgroundColor: isWeb ? webBg : colors.background }]}
      edges={['top', 'bottom']}
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={{ flex: 1 }}
      >
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={[styles.scroll, isWeb && styles.webScrollContainer]}
        >
          <View style={[styles.mainWrapper, isWeb && styles.webMainWrapper]}>
            {/* Apple Style Minimal Header */}
            <Animated.View entering={FadeInDown.duration(300)} style={styles.header}>
              <View style={[styles.logoBox, { backgroundColor: primaryBlue }]}>
                <MaterialCommunityIcons name="lightning-bolt" size={32} color="#FFFFFF" />
              </View>
              <AppText variant="h1" align="center" style={{ marginTop: 12, fontSize: 22, fontWeight: '700', letterSpacing: -0.3 }}>
                LifeRoutine
              </AppText>
              <AppText variant="caption" color="textSecondary" align="center" style={{ marginTop: 4, fontSize: 13 }}>
                Painel Administrativo & Gestão Inteligente
              </AppText>
            </Animated.View>

            {/* Mode Switcher Tabs */}
            <Animated.View entering={FadeInDown.delay(80).duration(300)} style={styles.tabsRow}>
              <TouchableOpacity
                style={[
                  styles.tabBtn,
                  {
                    backgroundColor: activeTab === 'login' ? primaryBlue : (isWeb ? webCardBg : colors.surface),
                    borderColor: activeTab === 'login' ? primaryBlue : (isWeb ? webBorder : colors.border),
                  },
                ]}
                onPress={() => {
                  setActiveTab('login');
                  setFocusedField(null);
                }}
              >
                <Ionicons
                  name="log-in-outline"
                  size={16}
                  color={activeTab === 'login' ? '#FFF' : colors.textSecondary}
                />
                <AppText
                  style={{
                    fontSize: 13,
                    fontWeight: '600',
                    color: activeTab === 'login' ? '#FFF' : colors.textSecondary,
                    marginLeft: 6,
                  }}
                >
                  Entrar
                </AppText>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.tabBtn,
                  {
                    backgroundColor: activeTab === 'signup' ? primaryBlue : (isWeb ? webCardBg : colors.surface),
                    borderColor: activeTab === 'signup' ? primaryBlue : (isWeb ? webBorder : colors.border),
                  },
                ]}
                onPress={() => {
                  setActiveTab('signup');
                  setFocusedField(null);
                }}
              >
                <Ionicons
                  name="person-add-outline"
                  size={16}
                  color={activeTab === 'signup' ? '#FFF' : colors.textSecondary}
                />
                <AppText
                  style={{
                    fontSize: 13,
                    fontWeight: '600',
                    color: activeTab === 'signup' ? '#FFF' : colors.textSecondary,
                    marginLeft: 6,
                  }}
                >
                  Criar Conta
                </AppText>
              </TouchableOpacity>
            </Animated.View>

            {/* Form Container */}
            <Animated.View entering={FadeInDown.delay(120).duration(300)}>
              <View
                style={[
                  styles.card,
                  { backgroundColor: isWeb ? webCardBg : colors.surfaceElevated, borderColor: isWeb ? webBorder : colors.border },
                ]}
              >
                <AppText variant="title" style={{ marginBottom: 14, fontSize: 16, fontWeight: '700' }}>
                  {activeTab === 'login' ? 'Entrar na sua conta' : 'Criar nova conta'}
                </AppText>

                {activeTab === 'signup' && (
                  <>
                    {/* Name */}
                    <AppText variant="caption" color="textSecondary" style={styles.fieldLabel}>
                      NOME COMPLETO
                    </AppText>
                    <View style={getInputWrapperStyle('name', !!nameError)}>
                      <Ionicons
                        name="person-outline"
                        size={16}
                        color={focusedField === 'name' ? primaryBlue : colors.textSecondary}
                      />
                      <TextInput
                        style={[styles.input, { color: colors.text }]}
                        value={name}
                        onChangeText={(t) => { setName(t); setNameError(''); }}
                        placeholder="Ex: Gabriel Monte"
                        placeholderTextColor={colors.textTertiary}
                        onFocus={() => setFocusedField('name')}
                        onBlur={() => setFocusedField(null)}
                      />
                    </View>
                    {!!nameError && <AppText style={styles.errorFallback}>{nameError}</AppText>}
                  </>
                )}

                {/* Email Field */}
                <AppText variant="caption" color="textSecondary" style={styles.fieldLabel}>
                  E-MAIL
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
                    placeholder="seu.email@exemplo.com"
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
                  SENHA
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

                {activeTab === 'signup' && (
                  <>
                    <AppText variant="caption" color="textSecondary" style={styles.fieldLabel}>
                      CONFIRMAR SENHA
                    </AppText>
                    <View style={getInputWrapperStyle('confirmPassword', !!confirmPasswordError)}>
                      <Ionicons
                        name="shield-checkmark-outline"
                        size={16}
                        color={focusedField === 'confirmPassword' ? primaryBlue : colors.textSecondary}
                      />
                      <TextInput
                        style={[styles.input, { color: colors.text }]}
                        value={confirmPassword}
                        onChangeText={(t) => { setConfirmPassword(t); setConfirmPasswordError(''); }}
                        placeholder="Repita a senha"
                        placeholderTextColor={colors.textTertiary}
                        secureTextEntry={!showConfirmPassword}
                        onFocus={() => setFocusedField('confirmPassword')}
                        onBlur={() => setFocusedField(null)}
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
                  </>
                )}

                {/* Save Password Toggle */}
                {activeTab === 'login' && (
                  <View style={styles.rememberRow}>
                    <View style={styles.rememberLeft}>
                      <Switch
                        value={rememberMe}
                        onValueChange={setRememberMe}
                        trackColor={{ false: webBorder, true: primaryBlue }}
                        thumbColor="#FFFFFF"
                      />
                      <AppText variant="caption" color="textSecondary" style={{ marginLeft: 6, fontSize: 12 }}>
                        Lembrar acesso
                      </AppText>
                    </View>

                    <TouchableOpacity
                      onPress={() => {
                        setResetEmail(email);
                        setIsResetModalOpen(true);
                      }}
                    >
                      <AppText variant="caption" style={{ color: primaryBlue, fontWeight: '600', fontSize: 12 }}>
                        Esqueceu a senha?
                      </AppText>
                    </TouchableOpacity>
                  </View>
                )}

                {/* Submit Button */}
                <View style={{ marginTop: 18 }}>
                  <TouchableOpacity
                    style={[styles.btnSubmit, { backgroundColor: primaryBlue }]}
                    onPress={activeTab === 'login' ? handleLoginSubmit : handleSignupSubmit}
                    activeOpacity={0.8}
                  >
                    <AppText style={styles.btnSubmitText}>
                      {activeTab === 'login' ? 'Entrar na Conta' : 'Concluir Cadastro'}
                    </AppText>
                  </TouchableOpacity>
                </View>
              </View>
            </Animated.View>

            {/* Quick Access */}
            <TouchableOpacity
              style={styles.skipBtn}
              onPress={() => router.replace('/(tabs)')}
            >
              <AppText variant="caption" color="textSecondary" align="center" style={{ fontSize: 12 }}>
                Continuar sem login →
              </AppText>
            </TouchableOpacity>
          </View>
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

          <View style={[styles.modalContainer, { backgroundColor: isWeb ? webCardBg : colors.surfaceElevated, borderColor: isWeb ? webBorder : colors.border }]}>
            <View style={styles.modalHeader}>
              <AppText variant="h3" style={{ fontSize: 16, fontWeight: '700' }}>Redefinir Senha</AppText>
              <TouchableOpacity onPress={() => setIsResetModalOpen(false)}>
                <Ionicons name="close" size={18} color={colors.icon} />
              </TouchableOpacity>
            </View>

            <AppText variant="caption" color="textSecondary" style={{ marginBottom: 12, fontSize: 12 }}>
              Informe o e-mail cadastrado e defina uma nova senha:
            </AppText>

            <AppText variant="caption" color="textSecondary" style={styles.fieldLabel}>
              E-MAIL
            </AppText>
            <View style={[styles.inputWrapper, { backgroundColor: isWeb ? (isDark ? '#0F172A' : '#FFFFFF') : colors.background, borderColor: webBorder }]}>
              <Ionicons name="mail-outline" size={16} color={colors.textSecondary} />
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

            <AppText variant="caption" color="textSecondary" style={styles.fieldLabel}>
              NOVA SENHA
            </AppText>
            <View style={[styles.inputWrapper, { backgroundColor: isWeb ? (isDark ? '#0F172A' : '#FFFFFF') : colors.background, borderColor: webBorder }]}>
              <Ionicons name="lock-closed-outline" size={16} color={colors.textSecondary} />
              <TextInput
                style={[styles.input, { color: colors.text }]}
                value={newPassword}
                onChangeText={setNewPassword}
                placeholder="Digite a nova senha"
                placeholderTextColor={colors.textTertiary}
                secureTextEntry={!showPassword}
              />
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
  scroll: { padding: 16 },
  webScrollContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: '100%',
  },
  mainWrapper: {
    width: '100%',
  },
  webMainWrapper: {
    maxWidth: 400,
    alignSelf: 'center',
  },
  header: {
    alignItems: 'center',
    marginBottom: 20,
  },
  logoBox: {
    width: 52,
    height: 52,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tabsRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 16,
  },
  tabBtn: {
    flex: 1,
    height: 38,
    borderRadius: 8,
    borderWidth: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  card: {
    padding: 20,
    borderRadius: 12,
    borderWidth: 1,
  },
  fieldLabel: {
    marginTop: 10,
    marginBottom: 4,
    fontSize: 11,
    fontWeight: '600',
    letterSpacing: 0.5,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 42,
    borderRadius: 8,
    borderWidth: 1.5,
    paddingHorizontal: 12,
  },
  focusedGlow: {
    shadowColor: '#2563EB',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.35,
    shadowRadius: 6,
    elevation: 3,
    ...(Platform.OS === 'web'
      ? ({
          outlineStyle: 'none',
          boxShadow: '0 0 0 3px rgba(37, 99, 235, 0.25)',
        } as any)
      : {}),
  },
  errorGlow: {
    shadowColor: '#EF4444',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.35,
    shadowRadius: 6,
    elevation: 3,
    ...(Platform.OS === 'web'
      ? ({
          outlineStyle: 'none',
          boxShadow: '0 0 0 3px rgba(239, 68, 68, 0.25)',
        } as any)
      : {}),
  },
  input: {
    flex: 1,
    marginLeft: 6,
    fontSize: 13,
    ...(Platform.OS === 'web' ? ({ outlineStyle: 'none' } as any) : {}),
  },
  errorFallback: {
    color: '#EF4444',
    fontSize: 11,
    fontWeight: '500',
    marginTop: 4,
    marginLeft: 2,
  },
  rememberRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 14,
  },
  rememberLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  btnSubmit: {
    height: 42,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  btnSubmitText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
  skipBtn: {
    marginVertical: 16,
    padding: 8,
  },
  overlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.5)',
    padding: 16,
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
  },
  modalContainer: {
    width: '100%',
    maxWidth: 360,
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  modalButtonRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 8,
    marginTop: 16,
  },
});

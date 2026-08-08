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

  const isWeb = Platform.OS === 'web';

  // Mode: 'login' | 'signup'
  const [activeTab, setActiveTab] = useState<'login' | 'signup'>('login');

  // Form Fields
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

  // Atlassian / Trello Concise Minimal Palette
  const webBg = isDark ? '#091E42' : '#FAFBFC';
  const webCardBg = isDark ? '#172B4D' : '#FFFFFF';
  const webBorder = isDark ? '#253858' : '#DFE1E6';
  const atlassianBlue = '#0052CC';

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
            {/* Atlassian / Trello Clean Brand Header */}
            <Animated.View entering={FadeInDown.duration(300)} style={styles.header}>
              <View style={[styles.logoBox, { backgroundColor: isWeb ? '#0052CC' : colors.primary }]}>
                <MaterialCommunityIcons name="lightning-bolt" size={32} color="#FFFFFF" />
              </View>
              <AppText variant="h1" align="center" style={{ marginTop: 12, fontSize: 22, fontWeight: '700', letterSpacing: -0.3 }}>
                LifeRoutine
              </AppText>
              <AppText variant="caption" color="textSecondary" align="center" style={{ marginTop: 4, fontSize: 13 }}>
                Gestão simples de rotinas e acompanhamento diário
              </AppText>
            </Animated.View>

            {/* Mode Switcher Tabs */}
            <Animated.View entering={FadeInDown.delay(80).duration(300)} style={styles.tabsRow}>
              <TouchableOpacity
                style={[
                  styles.tabBtn,
                  {
                    backgroundColor: activeTab === 'login' ? (isWeb ? atlassianBlue : colors.primary) : (isWeb ? webCardBg : colors.surface),
                    borderColor: activeTab === 'login' ? (isWeb ? atlassianBlue : colors.primary) : (isWeb ? webBorder : colors.border),
                  },
                ]}
                onPress={() => setActiveTab('login')}
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
                    backgroundColor: activeTab === 'signup' ? (isWeb ? atlassianBlue : colors.primary) : (isWeb ? webCardBg : colors.surface),
                    borderColor: activeTab === 'signup' ? (isWeb ? atlassianBlue : colors.primary) : (isWeb ? webBorder : colors.border),
                  },
                ]}
                onPress={() => setActiveTab('signup')}
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

            {/* Login Form */}
            {activeTab === 'login' ? (
              <Animated.View entering={FadeInDown.delay(120).duration(300)}>
                <View
                  style={[
                    styles.card,
                    { backgroundColor: isWeb ? webCardBg : colors.surfaceElevated, borderColor: isWeb ? webBorder : colors.border },
                  ]}
                >
                  <AppText variant="title" style={{ marginBottom: 14, fontSize: 16, fontWeight: '700' }}>
                    Entrar na sua conta
                  </AppText>

                  {/* Email Field */}
                  <AppText variant="caption" color="textSecondary" style={styles.fieldLabel}>
                    E-MAIL
                  </AppText>
                  <View style={[styles.inputWrapper, { backgroundColor: isWeb ? (isDark ? '#091E42' : '#FFFFFF') : colors.background, borderColor: isWeb ? webBorder : colors.border }]}>
                    <Ionicons name="mail-outline" size={16} color={colors.textSecondary} />
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
                  <AppText variant="caption" color="textSecondary" style={styles.fieldLabel}>
                    SENHA
                  </AppText>
                  <View style={[styles.inputWrapper, { backgroundColor: isWeb ? (isDark ? '#091E42' : '#FFFFFF') : colors.background, borderColor: isWeb ? webBorder : colors.border }]}>
                    <Ionicons name="lock-closed-outline" size={16} color={colors.textSecondary} />
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
                        size={18}
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
                        trackColor={{ false: isWeb ? webBorder : colors.border, true: atlassianBlue }}
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
                      <AppText variant="caption" style={{ color: isWeb ? '#4C9AFF' : colors.primary, fontWeight: '600', fontSize: 12 }}>
                        Esqueceu a senha?
                      </AppText>
                    </TouchableOpacity>
                  </View>

                  {/* Biometrics Button */}
                  {hasBiometrics && !isWeb && (
                    <TouchableOpacity
                      style={[
                        styles.biometricBtn,
                        { backgroundColor: `${colors.primary}15`, borderColor: colors.primary },
                      ]}
                      onPress={handleBiometricAuth}
                      activeOpacity={0.7}
                    >
                      <Ionicons name="finger-print" size={20} color={colors.primary} />
                      <AppText style={{ color: colors.primary, fontWeight: '600', marginLeft: 8, fontSize: 13 }}>
                        Entrar com Biometria
                      </AppText>
                    </TouchableOpacity>
                  )}

                  {/* Submit Login */}
                  <View style={{ marginTop: 16 }}>
                    <TouchableOpacity
                      style={[styles.btnSubmit, { backgroundColor: isWeb ? atlassianBlue : colors.primary }]}
                      onPress={handleLoginSubmit}
                      activeOpacity={0.8}
                    >
                      <AppText style={styles.btnSubmitText}>Entrar na Conta</AppText>
                    </TouchableOpacity>
                  </View>
                </View>
              </Animated.View>
            ) : (
              /* Signup Form */
              <Animated.View entering={FadeInDown.delay(120).duration(300)}>
                <View
                  style={[
                    styles.card,
                    { backgroundColor: isWeb ? webCardBg : colors.surfaceElevated, borderColor: isWeb ? webBorder : colors.border },
                  ]}
                >
                  <AppText variant="title" style={{ marginBottom: 14, fontSize: 16, fontWeight: '700' }}>
                    Criar conta
                  </AppText>

                  {/* Name */}
                  <AppText variant="caption" color="textSecondary" style={styles.fieldLabel}>
                    NOME COMPLETO *
                  </AppText>
                  <View style={[styles.inputWrapper, { backgroundColor: isWeb ? (isDark ? '#091E42' : '#FFFFFF') : colors.background, borderColor: isWeb ? webBorder : colors.border }]}>
                    <Ionicons name="person-outline" size={16} color={colors.textSecondary} />
                    <TextInput
                      style={[styles.input, { color: colors.text }]}
                      value={name}
                      onChangeText={setName}
                      placeholder="Ex: Gabriel Monte"
                      placeholderTextColor={colors.textTertiary}
                    />
                  </View>

                  {/* Email */}
                  <AppText variant="caption" color="textSecondary" style={styles.fieldLabel}>
                    E-MAIL *
                  </AppText>
                  <View style={[styles.inputWrapper, { backgroundColor: isWeb ? (isDark ? '#091E42' : '#FFFFFF') : colors.background, borderColor: isWeb ? webBorder : colors.border }]}>
                    <Ionicons name="mail-outline" size={16} color={colors.textSecondary} />
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
                  <AppText variant="caption" color="textSecondary" style={styles.fieldLabel}>
                    SENHA *
                  </AppText>
                  <View style={[styles.inputWrapper, { backgroundColor: isWeb ? (isDark ? '#091E42' : '#FFFFFF') : colors.background, borderColor: isWeb ? webBorder : colors.border }]}>
                    <Ionicons name="lock-closed-outline" size={16} color={colors.textSecondary} />
                    <TextInput
                      style={[styles.input, { color: colors.text }]}
                      value={password}
                      onChangeText={setPassword}
                      placeholder="Crie uma senha"
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

                  {/* Confirm Password */}
                  <AppText variant="caption" color="textSecondary" style={styles.fieldLabel}>
                    CONFIRMAR SENHA *
                  </AppText>
                  <View style={[styles.inputWrapper, { backgroundColor: isWeb ? (isDark ? '#091E42' : '#FFFFFF') : colors.background, borderColor: isWeb ? webBorder : colors.border }]}>
                    <Ionicons name="shield-checkmark-outline" size={16} color={colors.textSecondary} />
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
                        size={18}
                        color={colors.textSecondary}
                      />
                    </TouchableOpacity>
                  </View>

                  {/* Submit Signup */}
                  <View style={{ marginTop: 16 }}>
                    <TouchableOpacity
                      style={[styles.btnSubmit, { backgroundColor: isWeb ? atlassianBlue : colors.primary }]}
                      onPress={handleSignupSubmit}
                      activeOpacity={0.8}
                    >
                      <AppText style={styles.btnSubmitText}>Cadastrar</AppText>
                    </TouchableOpacity>
                  </View>
                </View>
              </Animated.View>
            )}

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
            <View style={[styles.inputWrapper, { backgroundColor: isWeb ? (isDark ? '#091E42' : '#FFFFFF') : colors.background, borderColor: isWeb ? webBorder : colors.border }]}>
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
            <View style={[styles.inputWrapper, { backgroundColor: isWeb ? (isDark ? '#091E42' : '#FFFFFF') : colors.background, borderColor: isWeb ? webBorder : colors.border }]}>
              <Ionicons name="lock-closed-outline" size={16} color={colors.textSecondary} />
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
                  size={18}
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
    borderRadius: 6,
    borderWidth: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  card: {
    padding: 20,
    borderRadius: 8,
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
    height: 40,
    borderRadius: 6,
    borderWidth: 1,
    paddingHorizontal: 12,
  },
  input: {
    flex: 1,
    marginLeft: 6,
    fontSize: 13,
  },
  rememberRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 12,
  },
  rememberLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  biometricBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    height: 40,
    borderRadius: 6,
    borderWidth: 1,
    marginTop: 12,
  },
  btnSubmit: {
    height: 40,
    borderRadius: 6,
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
    borderRadius: 8,
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

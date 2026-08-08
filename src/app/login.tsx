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
  Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import * as LocalAuthentication from 'expo-local-authentication';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { useTheme } from '@/hooks/useTheme';
import { AppText } from '@/components/atoms/AppText';
import { AppButton } from '@/components/atoms/AppButton';
import {
  loginUser,
  resetUserPassword,
  saveRememberedCredentials,
  getRememberedCredentials,
} from '@/services/auth';
import { saveUserProfile, DEFAULT_PROFILE } from '@/services/storage';

type FieldName = 'email' | 'password' | null;

export default function LoginScreen() {
  const { colors, isDark } = useTheme();
  const router = useRouter();
  const isWeb = Platform.OS === 'web';

  // Active Focused Field for Dynamic Glow Effect
  const [focusedField, setFocusedField] = useState<FieldName>(null);

  // Form Fields
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(true);

  // Inline Validation Error Fallbacks
  const [emailError, setEmailError] = useState('');
  const [passwordError, setPasswordError] = useState('');

  // Password Visibility Toggle ("Olhinho")
  const [showPassword, setShowPassword] = useState(false);

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
      setEmailError('⚠️ Digite um endereço de e-mail válido (ex: admin@liferoutine.com)');
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
        name: res.user.name || 'Gabriel Monte',
      });
      router.replace('/(tabs)');
    } else {
      setPasswordError(`⚠️ ${res.message || 'Credenciais inválidas. Verifique e-mail e senha.'}`);
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

  // ERP Apple Clean Palette
  const webBg = isDark ? '#091E42' : '#F4F5F7';
  const webCardBg = isDark ? '#172B4D' : '#FFFFFF';
  const webBorder = isDark ? '#253858' : '#DFE1E6';
  const primaryBlue = '#0052CC';

  const getInputWrapperStyle = (fieldName: FieldName, hasError: boolean) => {
    const isFocused = focusedField === fieldName;
    return [
      styles.inputWrapper,
      {
        backgroundColor: isWeb ? (isDark ? '#091E42' : '#FFFFFF') : colors.background,
        borderColor: hasError
          ? '#DE350B'
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
            {/* Official Mobile App Logo */}
            <Animated.View entering={FadeInDown.duration(300)} style={styles.header}>
              <Image
                source={require('../../assets/images/icon.png')}
                style={styles.officialLogo}
                resizeMode="contain"
              />
              <AppText variant="h1" align="center" style={{ marginTop: 12, fontSize: 22, fontWeight: '700', letterSpacing: -0.3 }}>
                LifeRoutine ERP
              </AppText>
              <AppText variant="caption" color="textSecondary" align="center" style={{ marginTop: 4, fontSize: 13 }}>
                Painel Administrativo de Gestão do Aplicativo Mobile
              </AppText>
            </Animated.View>

            {/* Exclusive Admin Login Card (No "Criar Conta") */}
            <Animated.View entering={FadeInDown.delay(100).duration(300)}>
              <View
                style={[
                  styles.card,
                  { backgroundColor: isWeb ? webCardBg : colors.surfaceElevated, borderColor: isWeb ? webBorder : colors.border },
                ]}
              >
                <View style={styles.adminBadgeRow}>
                  <Ionicons name="shield-checkmark" size={16} color="#0052CC" />
                  <AppText style={{ fontSize: 12, fontWeight: '700', color: isDark ? '#4C9AFF' : '#0052CC', marginLeft: 4 }}>
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

                {/* Remember & Timeout Notice */}
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
                      Entrar no Painel ERP
                    </AppText>
                  </TouchableOpacity>
                </View>
              </View>
            </Animated.View>

            {/* Direct Access */}
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
              <AppText variant="h3" style={{ fontSize: 16, fontWeight: '700' }}>Redefinir Senha ERP</AppText>
              <TouchableOpacity onPress={() => setIsResetModalOpen(false)}>
                <Ionicons name="close" size={18} color={colors.icon} />
              </TouchableOpacity>
            </View>

            <AppText variant="caption" color="textSecondary" style={{ marginBottom: 12, fontSize: 12 }}>
              Informe o e-mail administrativo cadastrado:
            </AppText>

            <AppText variant="caption" color="textSecondary" style={styles.fieldLabel}>
              E-MAIL
            </AppText>
            <View style={[styles.inputWrapper, { backgroundColor: isWeb ? (isDark ? '#091E42' : '#FFFFFF') : colors.background, borderColor: webBorder }]}>
              <Ionicons name="mail-outline" size={16} color={colors.textSecondary} />
              <TextInput
                style={[styles.input, { color: colors.text }]}
                value={resetEmail}
                onChangeText={setResetEmail}
                placeholder="admin@liferoutine.com"
                placeholderTextColor={colors.textTertiary}
                keyboardType="email-address"
                autoCapitalize="none"
              />
            </View>

            <AppText variant="caption" color="textSecondary" style={styles.fieldLabel}>
              NOVA SENHA
            </AppText>
            <View style={[styles.inputWrapper, { backgroundColor: isWeb ? (isDark ? '#091E42' : '#FFFFFF') : colors.background, borderColor: webBorder }]}>
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
  officialLogo: {
    width: 60,
    height: 60,
    borderRadius: 14,
  },
  card: {
    padding: 20,
    borderRadius: 10,
    borderWidth: 1,
  },
  adminBadgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 14,
    backgroundColor: 'rgba(0, 82, 204, 0.1)',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 6,
  },
  fieldLabel: {
    marginTop: 10,
    marginBottom: 4,
    fontSize: 11,
    fontWeight: '700',
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
    shadowColor: '#0052CC',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.35,
    shadowRadius: 6,
    elevation: 3,
    ...(Platform.OS === 'web'
      ? ({
          outlineStyle: 'none',
          boxShadow: '0 0 0 3px rgba(0, 82, 204, 0.25)',
        } as any)
      : {}),
  },
  errorGlow: {
    shadowColor: '#DE350B',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.35,
    shadowRadius: 6,
    elevation: 3,
    ...(Platform.OS === 'web'
      ? ({
          outlineStyle: 'none',
          boxShadow: '0 0 0 3px rgba(222, 53, 11, 0.25)',
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
    color: '#DE350B',
    fontSize: 11,
    fontWeight: '600',
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
    fontWeight: '700',
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
    borderRadius: 10,
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

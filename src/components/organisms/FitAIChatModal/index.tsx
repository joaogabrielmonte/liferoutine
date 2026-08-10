import React, { useState } from 'react';
import {
  View,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  TextInput,
  Modal,
  ActivityIndicator,
} from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { useTheme } from '@/hooks/useTheme';
import { AppText } from '@/components/atoms/AppText';
import { AppCard } from '@/components/atoms/AppCard';
import {
  generateAIWorkoutPlan,
  type AIWorkoutInput,
  type GeneratedWorkoutSplit,
} from '@/services/aiWorkoutGenerator';
import { Spacing, Radius } from '@/constants/theme';

type FitAIChatModalProps = {
  visible: boolean;
  onClose: () => void;
  onImportSplits: (splits: GeneratedWorkoutSplit[]) => void;
};

export function FitAIChatModal({ visible, onClose, onImportSplits }: FitAIChatModalProps) {
  const { colors, isDark } = useTheme();

  // Input States
  const [gender, setGender] = useState<'homem' | 'mulher'>('homem');
  const [objective, setObjective] = useState<'massa' | 'emagrecimento' | 'definicao' | 'saude'>('massa');
  const [experience, setExperience] = useState<'iniciante' | 'intermediario' | 'avancado'>('intermediario');
  const [preferredTime, setPreferredTime] = useState('Noite (18:00)');
  const [notes, setNotes] = useState('');

  // AI Response State
  const [isGenerating, setIsGenerating] = useState(false);
  const [aiResult, setAiResult] = useState<{
    greeting: string;
    splits: GeneratedWorkoutSplit[];
    advice: string;
  } | null>(null);

  const handleGenerate = () => {
    setIsGenerating(true);
    setTimeout(() => {
      const result = generateAIWorkoutPlan({
        gender,
        objective,
        experience,
        preferredTime,
        notes: notes.trim(),
      });
      setAiResult(result);
      setIsGenerating(false);
    }, 600);
  };

  const handleImport = () => {
    if (aiResult && aiResult.splits.length > 0) {
      onImportSplits(aiResult.splits);
      onClose();
    }
  };

  const cardBg = isDark ? '#1E293B' : '#FFFFFF';
  const borderColor = isDark ? '#334155' : '#E2E8F0';

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <TouchableOpacity style={styles.overlay} activeOpacity={1} onPress={onClose}>
        <TouchableOpacity
          activeOpacity={1}
          style={[styles.modalBox, { backgroundColor: cardBg, borderColor }]}
          onPress={(e) => e.stopPropagation?.()}
        >
          {/* Modal Header */}
          <View style={styles.headerRow}>
            <View style={[styles.aiIconBox, { backgroundColor: 'rgba(139, 92, 246, 0.15)' }]}>
              <MaterialCommunityIcons name="robot" size={22} color="#8B5CF6" />
            </View>
            <View style={{ flex: 1, marginLeft: 10 }}>
              <AppText variant="h3" style={{ fontSize: 16, fontWeight: '700' }}>
                Assistente de Treinos IA (Personal)
              </AppText>
              <AppText variant="caption" color="textSecondary" style={{ fontSize: 11 }}>
                Gere treinos adaptados com base no seu objetivo e ajustes do personal
              </AppText>
            </View>
            <TouchableOpacity onPress={onClose} style={{ padding: 4 }}>
              <Ionicons name="close" size={20} color={colors.icon} />
            </TouchableOpacity>
          </View>

          <ScrollView showsVerticalScrollIndicator={false} style={{ maxHeight: 460 }}>
            {/* Step 1: Preferences Form */}
            <AppText variant="caption" color="textSecondary" style={styles.fieldLabel}>
              GÊNERO
            </AppText>
            <View style={styles.chipRow}>
              {[
                { id: 'homem', label: '👨‍🦱 Homem' },
                { id: 'mulher', label: '👩‍🦰 Mulher' },
              ].map((item) => (
                <TouchableOpacity
                  key={item.id}
                  style={[
                    styles.chip,
                    {
                      backgroundColor: gender === item.id ? '#8B5CF6' : isDark ? '#0F172A' : '#F1F5F9',
                      borderColor: gender === item.id ? '#8B5CF6' : borderColor,
                    },
                  ]}
                  onPress={() => setGender(item.id as any)}
                >
                  <AppText style={{ fontSize: 12, fontWeight: '700', color: gender === item.id ? '#FFF' : colors.text }}>
                    {item.label}
                  </AppText>
                </TouchableOpacity>
              ))}
            </View>

            <AppText variant="caption" color="textSecondary" style={styles.fieldLabel}>
              OBJETIVO PRINCIPAL
            </AppText>
            <View style={styles.chipRow}>
              {[
                { id: 'massa', label: '💪 Ganho de Massa' },
                { id: 'emagrecimento', label: '🔥 Emagrecimento' },
                { id: 'definicao', label: '⚡ Definição' },
                { id: 'saude', label: '🌱 Longevidade' },
              ].map((item) => (
                <TouchableOpacity
                  key={item.id}
                  style={[
                    styles.chip,
                    {
                      backgroundColor: objective === item.id ? '#8B5CF6' : isDark ? '#0F172A' : '#F1F5F9',
                      borderColor: objective === item.id ? '#8B5CF6' : borderColor,
                    },
                  ]}
                  onPress={() => setObjective(item.id as any)}
                >
                  <AppText style={{ fontSize: 12, fontWeight: '700', color: objective === item.id ? '#FFF' : colors.text }}>
                    {item.label}
                  </AppText>
                </TouchableOpacity>
              ))}
            </View>

            <AppText variant="caption" color="textSecondary" style={styles.fieldLabel}>
              NÍVEL DE EXPERIÊNCIA
            </AppText>
            <View style={styles.chipRow}>
              {[
                { id: 'iniciante', label: '🌱 Iniciante' },
                { id: 'intermediario', label: '🏋️‍♂️ Intermediário' },
                { id: 'avancado', label: '🔥 Avançado' },
              ].map((item) => (
                <TouchableOpacity
                  key={item.id}
                  style={[
                    styles.chip,
                    {
                      backgroundColor: experience === item.id ? '#8B5CF6' : isDark ? '#0F172A' : '#F1F5F9',
                      borderColor: experience === item.id ? '#8B5CF6' : borderColor,
                    },
                  ]}
                  onPress={() => setExperience(item.id as any)}
                >
                  <AppText style={{ fontSize: 12, fontWeight: '700', color: experience === item.id ? '#FFF' : colors.text }}>
                    {item.label}
                  </AppText>
                </TouchableOpacity>
              ))}
            </View>

            <AppText variant="caption" color="textSecondary" style={styles.fieldLabel}>
              AJUSTES DO PERSONAL / OBSERVAÇÕES
            </AppText>
            <View style={[styles.inputBox, { borderColor }]}>
              <TextInput
                style={[styles.input, { color: colors.text }]}
                value={notes}
                onChangeText={setNotes}
                placeholder="Ex: Lesão no joelho, foco em ombros, 45 min por dia..."
                placeholderTextColor={colors.textTertiary}
              />
            </View>

            {/* Generate Button */}
            <TouchableOpacity
              style={[styles.btnGenerate, { backgroundColor: '#8B5CF6' }]}
              onPress={handleGenerate}
              disabled={isGenerating}
            >
              {isGenerating ? (
                <ActivityIndicator size="small" color="#FFF" />
              ) : (
                <>
                  <MaterialCommunityIcons name="auto-fix" size={18} color="#FFF" />
                  <AppText style={{ color: '#FFF', fontWeight: '700', fontSize: 13, marginLeft: 6 }}>
                    Gerar Ficha de Treino com IA
                  </AppText>
                </>
              )}
            </TouchableOpacity>

            {/* AI Generated Result View */}
            {aiResult && (
              <Animated.View entering={FadeInDown.duration(300)} style={styles.aiResultContainer}>
                <AppText style={{ fontWeight: '600', fontSize: 13, marginBottom: 8 }}>
                  {aiResult.greeting}
                </AppText>

                {aiResult.splits.map((split) => (
                  <View key={split.id} style={[styles.splitCard, { borderColor }]}>
                    <AppText style={{ fontWeight: '700', fontSize: 14, color: '#8B5CF6', marginBottom: 4 }}>
                      {split.name}
                    </AppText>
                    {split.exercises.map((ex, idx) => (
                      <AppText key={idx} variant="caption" color="textSecondary" style={{ fontSize: 12 }}>
                        • {ex}
                      </AppText>
                    ))}
                  </View>
                ))}

                <AppText variant="caption" color="textSecondary" style={{ marginTop: 8, fontStyle: 'italic' }}>
                  {aiResult.advice}
                </AppText>

                <TouchableOpacity
                  style={[styles.btnImport, { backgroundColor: '#00875A' }]}
                  onPress={handleImport}
                >
                  <Ionicons name="download-outline" size={16} color="#FFF" />
                  <AppText style={{ color: '#FFF', fontWeight: '700', fontSize: 13, marginLeft: 6 }}>
                    Salvar este Treino nas Minhas Divisões
                  </AppText>
                </TouchableOpacity>
              </Animated.View>
            )}
          </ScrollView>
        </TouchableOpacity>
      </TouchableOpacity>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.65)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  modalBox: {
    width: '100%',
    maxWidth: 400,
    borderRadius: 14,
    padding: 16,
    borderWidth: 1,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 14,
  },
  aiIconBox: {
    width: 38,
    height: 38,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  fieldLabel: {
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.5,
    marginTop: 10,
    marginBottom: 4,
  },
  chipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginBottom: 6,
  },
  chip: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 12,
    borderWidth: 1,
  },
  inputBox: {
    borderRadius: 6,
    borderWidth: 1,
    paddingHorizontal: 10,
    marginBottom: 12,
  },
  input: {
    fontSize: 13,
    paddingVertical: 8,
  },
  btnGenerate: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    height: 42,
    borderRadius: 8,
    marginTop: 6,
  },
  aiResultContainer: {
    marginTop: 16,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#334155',
  },
  splitCard: {
    padding: 10,
    borderRadius: 8,
    borderWidth: 1,
    marginBottom: 8,
    backgroundColor: 'rgba(139, 92, 246, 0.05)',
  },
  btnImport: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    height: 42,
    borderRadius: 8,
    marginTop: 12,
  },
});

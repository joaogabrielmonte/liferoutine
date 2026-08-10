import React from 'react';
import { View, StyleSheet, ScrollView } from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { useTheme } from '@/hooks/useTheme';
import { AppText } from '@/components/atoms/AppText';
import { AppCard } from '@/components/atoms/AppCard';
import {
  usePointsStore,
  POINTS_RULES,
  getLevelInfo,
} from '@/stores/usePointsStore';
import { Spacing, Radius } from '@/constants/theme';

const ALL_LEVELS = [
  { level: 1, name: 'Iniciante Fit 🌱', reqXp: 0, color: '#10B981', badge: 'seed-outline' },
  { level: 2, name: 'Atleta Bronze 🥉', reqXp: 300, color: '#D97706', badge: 'medal-outline' },
  { level: 3, name: 'Atleta Prata 🥈', reqXp: 800, color: '#94A3B8', badge: 'ribbon-outline' },
  { level: 4, name: 'Atleta Ouro 🥇', reqXp: 1500, color: '#FFAB00', badge: 'trophy-outline' },
  { level: 5, name: 'Elite Diamante 💎', reqXp: 3000, color: '#3B82F6', badge: 'diamond-outline' },
  { level: 6, name: 'Mestre LifeRoutine 🏆', reqXp: 5000, color: '#8B5CF6', badge: 'crown-outline' },
];

export function PointsLeaderboardSection() {
  const { colors, isDark } = useTheme();
  const { userXp, leaderboard, getUserRank } = usePointsStore();

  const levelInfo = getLevelInfo(userXp);
  const userRank = getUserRank();

  const cardBg = isDark ? '#172B4D' : '#FFFFFF';
  const borderColor = isDark ? '#253858' : '#DFE1E6';

  return (
    <View style={{ gap: Spacing.md }}>
      {/* USER CURRENT XP & LEVEL PROGRESS CARD */}
      <Animated.View entering={FadeInDown.duration(400)}>
        <AppCard style={{ padding: Spacing.base, backgroundColor: isDark ? '#1E293B' : '#FFFFFF' }}>
          <View style={styles.levelHeaderRow}>
            <View style={[styles.badgeLevelIcon, { backgroundColor: 'rgba(255, 171, 0, 0.15)' }]}>
              <MaterialCommunityIcons name="trophy" size={24} color="#FFAB00" />
            </View>

            <View style={{ flex: 1, marginLeft: 10 }}>
              <AppText variant="caption" color="textSecondary" style={{ fontSize: 11, fontWeight: '700' }}>
                SEU NÍVEL ATUAL
              </AppText>
              <AppText variant="h2" style={{ fontSize: 18, fontWeight: '800', color: colors.text }}>
                {levelInfo.levelName}
              </AppText>
            </View>

            <View style={[styles.rankPill, { backgroundColor: colors.primaryLight }]}>
              <AppText style={{ color: colors.primary, fontWeight: '800', fontSize: 12 }}>
                #{userRank} no Ranking
              </AppText>
            </View>
          </View>

          {/* XP Progress Bar */}
          <View style={styles.xpBarTrack}>
            <View style={[styles.xpBarFill, { width: `${levelInfo.progress}%`, backgroundColor: '#FFAB00' }]} />
          </View>

          <View style={styles.xpProgressLabels}>
            <AppText variant="caption" style={{ fontWeight: '700', fontSize: 11, color: colors.text }}>
              {userXp} XP Acumulados
            </AppText>
            <AppText variant="caption" color="textSecondary" style={{ fontSize: 11 }}>
              Próximo Nível: {levelInfo.nextLevelXp} XP
            </AppText>
          </View>
        </AppCard>
      </Animated.View>

      {/* GALERIA DE TODOS OS NÍVEIS & CONQUISTAS */}
      <Animated.View entering={FadeInDown.delay(80).duration(400)}>
        <AppCard style={{ padding: Spacing.base }}>
          <View style={styles.sectionTitleRow}>
            <Ionicons name="trophy-outline" size={20} color="#FFAB00" />
            <AppText variant="h3" style={{ fontSize: 15, fontWeight: '700', marginLeft: 6 }}>
              Galeria de Níveis & Conquistas
            </AppText>
          </View>
          <AppText variant="caption" color="textSecondary" style={{ fontSize: 12, marginBottom: 12 }}>
            Conquiste pontos XP para desbloquear os emblemas de cada nível:
          </AppText>

          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            <View style={{ flexDirection: 'row', gap: 10 }}>
              {ALL_LEVELS.map((lvl) => {
                const isUnlocked = userXp >= lvl.reqXp;
                const isCurrent = levelInfo.levelNum === lvl.level;

                return (
                  <View
                    key={lvl.level}
                    style={[
                      styles.levelBadgeCard,
                      {
                        backgroundColor: isCurrent
                          ? 'rgba(255, 171, 0, 0.12)'
                          : isUnlocked
                          ? isDark
                            ? '#0F172A'
                            : '#F8FAFC'
                          : isDark
                          ? '#1E293B'
                          : '#F1F5F9',
                        borderColor: isCurrent ? '#FFAB00' : isUnlocked ? lvl.color : borderColor,
                        borderWidth: isCurrent ? 2 : 1,
                        opacity: isUnlocked ? 1 : 0.6,
                      },
                    ]}
                  >
                    <View
                      style={[
                        styles.levelIconCircle,
                        { backgroundColor: isUnlocked ? `${lvl.color}22` : '#334155' },
                      ]}
                    >
                      <Ionicons
                        name={isUnlocked ? (lvl.badge as any) : 'lock-closed-outline'}
                        size={22}
                        color={isUnlocked ? lvl.color : '#94A3B8'}
                      />
                    </View>

                    <AppText
                      style={{
                        fontSize: 12,
                        fontWeight: '700',
                        color: isCurrent ? '#FFAB00' : isUnlocked ? colors.text : colors.textSecondary,
                        marginTop: 6,
                        textAlign: 'center',
                      }}
                    >
                      {lvl.name}
                    </AppText>

                    <AppText
                      variant="caption"
                      color="textSecondary"
                      style={{ fontSize: 10, marginTop: 2, textAlign: 'center' }}
                    >
                      {lvl.reqXp} XP
                    </AppText>

                    <View style={{ marginTop: 6 }}>
                      {isCurrent ? (
                        <View style={[styles.statusTag, { backgroundColor: '#FFAB00' }]}>
                          <AppText style={{ color: '#000', fontSize: 9, fontWeight: '800' }}>
                            ATUAL
                          </AppText>
                        </View>
                      ) : isUnlocked ? (
                        <View style={[styles.statusTag, { backgroundColor: '#10B981' }]}>
                          <AppText style={{ color: '#FFF', fontSize: 9, fontWeight: '800' }}>
                            CONQUISTADO
                          </AppText>
                        </View>
                      ) : (
                        <View style={[styles.statusTag, { backgroundColor: '#64748B' }]}>
                          <AppText style={{ color: '#FFF', fontSize: 9, fontWeight: '800' }}>
                            BLOQUEADO
                          </AppText>
                        </View>
                      )}
                    </View>
                  </View>
                );
              })}
            </View>
          </ScrollView>
        </AppCard>
      </Animated.View>

      {/* GAMIFICATION & POINTS EXPLANATION SYSTEM */}
      <Animated.View entering={FadeInDown.delay(160).duration(400)}>
        <AppCard style={{ padding: Spacing.base }}>
          <View style={styles.sectionTitleRow}>
            <MaterialCommunityIcons name="star-circle" size={20} color={colors.primary} />
            <AppText variant="h3" style={{ fontSize: 15, fontWeight: '700', marginLeft: 6 }}>
              Sistema de Pontuações & Recompensas
            </AppText>
          </View>
          <AppText variant="caption" color="textSecondary" style={{ fontSize: 12, marginBottom: 12 }}>
            Ganhe pontos de experiência (XP) ao manter suas atividades em dia e suba no Ranking:
          </AppText>

          <View style={{ gap: 8 }}>
            {POINTS_RULES.map((rule, idx) => (
              <View key={idx} style={[styles.ruleRow, { borderColor }]}>
                <View style={[styles.ruleIconBox, { backgroundColor: colors.surface }]}>
                  <MaterialCommunityIcons name={rule.icon as any} size={18} color={colors.primary} />
                </View>
                <View style={{ flex: 1, marginLeft: 8 }}>
                  <AppText style={{ fontWeight: '700', fontSize: 13 }}>{rule.action}</AppText>
                  <AppText variant="caption" color="textSecondary" style={{ fontSize: 11 }}>
                    {rule.description}
                  </AppText>
                </View>
                <View style={styles.xpBadge}>
                  <AppText style={{ color: '#00875A', fontWeight: '800', fontSize: 12 }}>
                    +{rule.xp} XP
                  </AppText>
                </View>
              </View>
            ))}
          </View>
        </AppCard>
      </Animated.View>

      {/* GLOBAL USER LEADERBOARD (RANKING) */}
      <Animated.View entering={FadeInDown.delay(240).duration(400)}>
        <AppCard style={{ padding: Spacing.base }}>
          <View style={styles.sectionTitleRow}>
            <MaterialCommunityIcons name="medal" size={20} color="#FFAB00" />
            <AppText variant="h3" style={{ fontSize: 15, fontWeight: '700', marginLeft: 6 }}>
              Ranking Global dos Usuários
            </AppText>
          </View>
          <AppText variant="caption" color="textSecondary" style={{ fontSize: 12, marginBottom: 12 }}>
            Acompanhe sua posição no ranking de constância da comunidade:
          </AppText>

          <View style={{ gap: 8 }}>
            {leaderboard.map((user) => {
              const isFirst = user.rank === 1;
              const isSecond = user.rank === 2;
              const isThird = user.rank === 3;
              const isCurrent = user.isCurrentUser;

              return (
                <View
                  key={user.id}
                  style={[
                    styles.leaderboardRow,
                    {
                      backgroundColor: isCurrent ? 'rgba(37, 99, 235, 0.12)' : isDark ? '#091E42' : '#F4F5F7',
                      borderColor: isCurrent ? colors.primary : borderColor,
                      borderWidth: isCurrent ? 1.5 : 1,
                    },
                  ]}
                >
                  <View style={styles.rankCol}>
                    <AppText
                      style={{
                        fontWeight: '800',
                        fontSize: 14,
                        color: isFirst ? '#FFAB00' : isSecond ? '#94A3B8' : isThird ? '#D97706' : colors.textSecondary,
                      }}
                    >
                      {isFirst ? '🥇 #1' : isSecond ? '🥈 #2' : isThird ? '🥉 #3' : `#${user.rank}`}
                    </AppText>
                  </View>

                  <AppText style={{ fontSize: 20, marginHorizontal: 6 }}>{user.avatar}</AppText>

                  <View style={{ flex: 1 }}>
                    <AppText
                      style={{
                        fontWeight: isCurrent ? '800' : '700',
                        fontSize: 13,
                        color: isCurrent ? colors.primary : colors.text,
                      }}
                    >
                      {user.name} {isCurrent ? '(Você)' : ''}
                    </AppText>
                    <AppText variant="caption" color="textSecondary" style={{ fontSize: 11 }}>
                      {user.levelName} • {user.workoutsCompleted} treinos
                    </AppText>
                  </View>

                  <View style={styles.xpBox}>
                    <AppText style={{ fontWeight: '800', fontSize: 13, color: colors.text }}>
                      {user.xp} XP
                    </AppText>
                  </View>
                </View>
              );
            })}
          </View>
        </AppCard>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  levelHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  badgeLevelIcon: {
    width: 44,
    height: 44,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rankPill: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 16,
  },
  xpBarTrack: {
    height: 8,
    backgroundColor: '#334155',
    borderRadius: 4,
    overflow: 'hidden',
    marginBottom: 6,
  },
  xpBarFill: {
    height: '100%',
    borderRadius: 4,
  },
  xpProgressLabels: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  sectionTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  levelBadgeCard: {
    width: 120,
    padding: 12,
    borderRadius: 12,
    alignItems: 'center',
  },
  levelIconCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  statusTag: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  ruleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 10,
    borderRadius: 8,
    borderWidth: 1,
  },
  ruleIconBox: {
    width: 32,
    height: 32,
    borderRadius: 6,
    alignItems: 'center',
    justifyContent: 'center',
  },
  xpBadge: {
    backgroundColor: 'rgba(0, 135, 90, 0.15)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  leaderboardRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 10,
  },
  rankCol: {
    width: 36,
    alignItems: 'center',
  },
  xpBox: {
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
});

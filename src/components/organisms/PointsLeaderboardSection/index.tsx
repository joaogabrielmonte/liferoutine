import React from 'react';
import { View, StyleSheet, TouchableOpacity } from 'react-native';
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

      {/* GAMIFICATION & POINTS EXPLANATION SYSTEM */}
      <Animated.View entering={FadeInDown.delay(100).duration(400)}>
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
      <Animated.View entering={FadeInDown.delay(200).duration(400)}>
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
                  {/* Rank Position */}
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

                  {/* Avatar */}
                  <AppText style={{ fontSize: 20, marginHorizontal: 6 }}>{user.avatar}</AppText>

                  {/* Name & Level */}
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

                  {/* XP */}
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

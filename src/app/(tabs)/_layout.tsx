import React from 'react';
import { Tabs, useRouter, usePathname } from 'expo-router';
import { View, StyleSheet, Platform, TouchableOpacity, useWindowDimensions } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useTheme } from '@/hooks/useTheme';
import { useThemeStore } from '@/stores/useThemeStore';
import { AppText } from '@/components/atoms/AppText';
import { Shadow, Radius, Spacing } from '@/constants/theme';

function WebSidebarNav() {
  const { colors, isDark } = useTheme();
  const { setTheme } = useThemeStore();
  const router = useRouter();
  const pathname = usePathname();

  const navSections = [
    {
      title: 'GERENCIAMENTO DE CONTEÚDO',
      items: [
        { name: 'users', title: 'Usuários & Níveis de Acesso', icon: 'people-outline', activeIcon: 'people', path: '/(tabs)/users' },
        { name: 'habits', title: 'Hábitos Globais', icon: 'checkbox-outline', activeIcon: 'checkbox', path: '/(tabs)/habits' },
      ],
    },
    {
      title: 'ANALYTICS & EXECUTIVE',
      items: [
        { name: 'index', title: 'Visão Geral & Dashboard', icon: 'grid-outline', activeIcon: 'grid', path: '/(tabs)' },
        { name: 'stats', title: 'Analytics & Relatórios', icon: 'stats-chart-outline', activeIcon: 'stats-chart', path: '/(tabs)/stats' },
      ],
    },
    {
      title: 'INFRAESTRUTURA',
      items: [
        { name: 'profile', title: 'Configurações do Servidor', icon: 'server-outline', activeIcon: 'server', path: '/(tabs)/profile' },
      ],
    },
  ];

  return (
    <View style={[styles.sidebar, { backgroundColor: colors.surfaceElevated, borderColor: colors.border }]}>
      {/* Enterprise Brand Header */}
      <View style={styles.sidebarBrand}>
        <View style={[styles.logoSquare, { backgroundColor: colors.primary }]}>
          <MaterialCommunityIcons name="lightning-bolt" size={22} color="#FFFFFF" />
        </View>
        <View style={{ flex: 1, marginLeft: Spacing.xs }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
            <AppText variant="subtitle" style={{ fontWeight: '800', fontSize: 15, letterSpacing: 0.3 }}>
              LifeRoutine
            </AppText>
            <View style={styles.enterprisePill}>
              <AppText style={{ fontSize: 9, fontWeight: '800', color: '#FFFFFF' }}>ENTERPRISE</AppText>
            </View>
          </View>
          <AppText variant="caption" color="textSecondary" style={{ fontSize: 11 }}>
            Painel Administrativo
          </AppText>
        </View>
      </View>

      {/* Navigation Groups */}
      <View style={styles.navList}>
        {navSections.map((section) => (
          <View key={section.title} style={styles.navGroup}>
            <AppText variant="caption" color="textTertiary" style={styles.groupHeader}>
              {section.title}
            </AppText>

            {section.items.map((item) => {
              const isSelected =
                item.name === 'index'
                  ? pathname === '/' || pathname === '/(tabs)' || pathname === '/(tabs)/'
                  : pathname.includes(item.name);

              return (
                <TouchableOpacity
                  key={item.name}
                  style={[
                    styles.navItem,
                    {
                      backgroundColor: isSelected ? (isDark ? '#1E293B' : '#E2E8F0') : 'transparent',
                      borderColor: isSelected ? colors.primary : 'transparent',
                    },
                  ]}
                  onPress={() => router.push(item.path as any)}
                  activeOpacity={0.7}
                >
                  <Ionicons
                    name={(isSelected ? item.activeIcon : item.icon) as any}
                    size={17}
                    color={isSelected ? colors.primary : colors.textSecondary}
                  />
                  <AppText
                    style={{
                      fontSize: 13,
                      fontWeight: isSelected ? '700' : '600',
                      color: isSelected ? colors.text : colors.textSecondary,
                      marginLeft: Spacing.xs,
                      flex: 1,
                    }}
                  >
                    {item.title}
                  </AppText>
                </TouchableOpacity>
              );
            })}
          </View>
        ))}
      </View>

      {/* Footer Profile & Server Status */}
      <View style={[styles.sidebarFooter, { borderTopColor: colors.border }]}>
        <View style={[styles.corpProfileCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <View style={[styles.avatarCircle, { backgroundColor: '#2563EB' }]}>
            <AppText style={{ color: '#FFF', fontWeight: '800', fontSize: 12 }}>GM</AppText>
          </View>
          <View style={{ flex: 1, marginLeft: 8 }}>
            <AppText variant="caption" style={{ fontWeight: '800', fontSize: 12 }}>
              Gabriel Monte
            </AppText>
            <AppText variant="caption" color="textSecondary" style={{ fontSize: 10 }}>
              Super Administrator
            </AppText>
          </View>
        </View>

        <View style={styles.bottomStatusRow}>
          <View style={styles.statusIndicator}>
            <View style={styles.dotGreen} />
            <AppText style={{ fontSize: 11, fontWeight: '700', color: '#059669' }}>
              Oracle VPS Online
            </AppText>
          </View>

          <TouchableOpacity
            onPress={() => setTheme(isDark ? 'light' : 'dark')}
            style={[styles.themeBtn, { backgroundColor: colors.background, borderColor: colors.border }]}
            title="Alternar Tema"
          >
            <Ionicons name={isDark ? 'moon' : 'sunny'} size={14} color={colors.text} />
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}

export default function TabLayout() {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();

  const isWebLayout = Platform.OS === 'web' || width >= 768;

  return (
    <View style={[styles.rootWrapper, { backgroundColor: colors.background }]}>
      {isWebLayout && <WebSidebarNav />}

      <View style={styles.contentWrapper}>
        <Tabs
          screenOptions={{
            headerShown: false,
            tabBarActiveTintColor: colors.tabActive,
            tabBarInactiveTintColor: colors.tabInactive,
            tabBarStyle: isWebLayout
              ? { display: 'none' }
              : {
                  backgroundColor: colors.tabBar,
                  borderTopColor: colors.tabBarBorder,
                  borderTopWidth: StyleSheet.hairlineWidth,
                  height: 60 + insets.bottom,
                  paddingBottom: insets.bottom,
                  ...Shadow.md,
                },
            tabBarLabelStyle: {
              fontSize: 11,
              fontWeight: '600',
              marginTop: -2,
            },
          }}
        >
          <Tabs.Screen
            name="index"
            options={{
              title: 'Hoje',
              tabBarIcon: ({ color, size, focused }) => (
                <Ionicons
                  name={focused ? 'home' : 'home-outline'}
                  size={size}
                  color={color}
                />
              ),
            }}
          />
          <Tabs.Screen
            name="habits"
            options={{
              title: 'Hábitos',
              tabBarIcon: ({ color, size, focused }) => (
                <Ionicons
                  name={focused ? 'list' : 'list-outline'}
                  size={size}
                  color={color}
                />
              ),
            }}
          />
          <Tabs.Screen
            name="stats"
            options={{
              title: 'Progresso',
              tabBarIcon: ({ color, size, focused }) => (
                <Ionicons
                  name={focused ? 'bar-chart' : 'bar-chart-outline'}
                  size={size}
                  color={color}
                />
              ),
            }}
          />
          <Tabs.Screen
            name="users"
            options={{
              title: 'Usuários',
              tabBarIcon: ({ color, size, focused }) => (
                <Ionicons
                  name={focused ? 'people' : 'people-outline'}
                  size={size}
                  color={color}
                />
              ),
            }}
          />
          <Tabs.Screen
            name="profile"
            options={{
              title: 'Perfil',
              tabBarIcon: ({ color, size, focused }) => (
                <Ionicons
                  name={focused ? 'person' : 'person-outline'}
                  size={size}
                  color={color}
                />
              ),
            }}
          />
        </Tabs>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  rootWrapper: {
    flex: 1,
    flexDirection: 'row',
  },
  sidebar: {
    width: 260,
    height: '100%',
    borderRightWidth: 1,
    padding: Spacing.md,
    justifyContent: 'space-between',
  },
  sidebarBrand: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.lg,
  },
  logoSquare: {
    width: 36,
    height: 36,
    borderRadius: Radius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  enterprisePill: {
    backgroundColor: '#2563EB',
    paddingHorizontal: 5,
    paddingVertical: 1,
    borderRadius: 3,
  },
  navList: {
    flex: 1,
    gap: Spacing.md,
  },
  navGroup: {
    gap: 3,
  },
  groupHeader: {
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.8,
    marginBottom: 4,
    paddingLeft: 6,
  },
  navItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.sm,
    paddingVertical: 9,
    borderRadius: Radius.md,
    borderLeftWidth: 3,
  },
  sidebarFooter: {
    paddingTop: Spacing.md,
    borderTopWidth: StyleSheet.hairlineWidth,
    gap: Spacing.xs,
  },
  corpProfileCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 8,
    borderRadius: Radius.md,
    borderWidth: 1,
  },
  avatarCircle: {
    width: 30,
    height: 30,
    borderRadius: 15,
    alignItems: 'center',
    justifyContent: 'center',
  },
  bottomStatusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 4,
    marginTop: 4,
  },
  statusIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  dotGreen: {
    width: 7,
    height: 7,
    borderRadius: 4,
    backgroundColor: '#059669',
  },
  themeBtn: {
    padding: 5,
    borderRadius: Radius.sm,
    borderWidth: 1,
  },
  contentWrapper: {
    flex: 1,
  },
});

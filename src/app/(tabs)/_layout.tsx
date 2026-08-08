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

  const sidebarNavItems = [
    { name: 'index', title: 'Visão Geral & Dashboard', icon: 'speedometer-outline', activeIcon: 'speedometer', path: '/(tabs)' },
    { name: 'users', title: 'Gestão de Usuários & Roles', icon: 'people-outline', activeIcon: 'people', path: '/(tabs)/users' },
    { name: 'habits', title: 'Hábitos Globais', icon: 'list-outline', activeIcon: 'list', path: '/(tabs)/habits' },
    { name: 'stats', title: 'Analytics & Relatórios', icon: 'bar-chart-outline', activeIcon: 'bar-chart', path: '/(tabs)/stats' },
    { name: 'profile', title: 'Configurações do Servidor', icon: 'settings-outline', activeIcon: 'settings', path: '/(tabs)/profile' },
  ];

  return (
    <View style={[styles.sidebar, { backgroundColor: colors.surfaceElevated, borderColor: colors.border }]}>
      {/* Brand Header */}
      <View style={styles.sidebarHeader}>
        <View style={[styles.logoIcon, { backgroundColor: 'rgba(139, 92, 246, 0.2)', borderColor: 'rgba(139, 92, 246, 0.4)' }]}>
          <MaterialCommunityIcons name="lightning-bolt" size={26} color="#C084FC" />
        </View>
        <View style={{ flex: 1 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
            <AppText variant="h3" style={{ fontWeight: '900', letterSpacing: 0.5 }}>
              LifeRoutine
            </AppText>
            <View style={styles.proTag}>
              <AppText style={{ fontSize: 9, fontWeight: '800', color: '#FFF' }}>ADMIN</AppText>
            </View>
          </View>
          <AppText variant="caption" color="textSecondary" style={{ fontSize: 11 }}>
            Command Center • Oracle VPS
          </AppText>
        </View>
      </View>

      {/* Nav items */}
      <View style={styles.sidebarNavList}>
        <AppText variant="caption" color="textTertiary" style={{ fontSize: 10, fontWeight: '700', letterSpacing: 1, marginBottom: 6, paddingLeft: 8 }}>
          NAVEGAÇÃO PRINCIPAL
        </AppText>

        {sidebarNavItems.map((item) => {
          const isSelected =
            item.name === 'index'
              ? pathname === '/' || pathname === '/(tabs)' || pathname === '/(tabs)/'
              : pathname.includes(item.name);

          return (
            <TouchableOpacity
              key={item.name}
              style={[
                styles.sidebarItem,
                {
                  backgroundColor: isSelected ? colors.primary : 'transparent',
                },
              ]}
              onPress={() => router.push(item.path as any)}
              activeOpacity={0.7}
            >
              {isSelected && <View style={styles.activeGlowPill} />}
              <Ionicons
                name={(isSelected ? item.activeIcon : item.icon) as any}
                size={20}
                color={isSelected ? '#FFFFFF' : colors.textSecondary}
              />
              <AppText
                style={{
                  fontSize: 13,
                  fontWeight: isSelected ? '800' : '600',
                  color: isSelected ? '#FFFFFF' : colors.textSecondary,
                  marginLeft: Spacing.sm,
                }}
              >
                {item.title}
              </AppText>
            </TouchableOpacity>
          );
        })}
      </View>

      {/* Super Admin User Profile Card & Footer */}
      <View style={[styles.sidebarFooter, { borderTopColor: colors.border }]}>
        <View style={[styles.adminUserCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <View style={[styles.adminAvatar, { backgroundColor: '#8B5CF6' }]}>
            <AppText style={{ color: '#FFF', fontWeight: '800', fontSize: 13 }}>GM</AppText>
          </View>
          <View style={{ flex: 1, marginLeft: Spacing.xs }}>
            <AppText variant="caption" style={{ fontWeight: '800' }}>
              Gabriel Monte
            </AppText>
            <AppText variant="caption" color="textSecondary" style={{ fontSize: 10 }}>
              gabriel@liferoutine.com
            </AppText>
          </View>
          <View style={styles.onlineBadge}>
            <View style={styles.statusDot} />
          </View>
        </View>

        <View style={styles.themeRow}>
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <Ionicons name={isDark ? 'moon' : 'sunny'} size={16} color={colors.primary} />
            <AppText variant="caption" style={{ marginLeft: 6, fontWeight: '700' }}>
              Tema {isDark ? 'Escuro' : 'Claro'}
            </AppText>
          </View>

          <TouchableOpacity
            onPress={() => setTheme(isDark ? 'light' : 'dark')}
            style={[styles.themeToggleBtn, { backgroundColor: colors.background, borderColor: colors.border }]}
          >
            <Ionicons name="swap-horizontal" size={14} color={colors.text} />
          </TouchableOpacity>
        </View>

        <View style={styles.dbStatusPill}>
          <View style={[styles.statusDot, { backgroundColor: '#22C55E' }]} />
          <AppText style={{ fontSize: 11, color: '#22C55E', fontWeight: '700' }}>
            Oracle VPS PostgreSQL Online
          </AppText>
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
    width: 270,
    height: '100%',
    borderRightWidth: 1,
    padding: Spacing.md,
    justifyContent: 'space-between',
    ...Shadow.sm,
  },
  sidebarHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
    marginBottom: Spacing.lg,
    paddingHorizontal: 4,
  },
  logoIcon: {
    width: 42,
    height: 42,
    borderRadius: Radius.md,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
  },
  proTag: {
    backgroundColor: '#8B5CF6',
    paddingHorizontal: 5,
    paddingVertical: 1,
    borderRadius: 4,
  },
  sidebarNavList: {
    flex: 1,
    gap: 4,
  },
  sidebarItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.md,
    paddingVertical: 11,
    borderRadius: Radius.md,
    position: 'relative',
    overflow: 'hidden',
  },
  activeGlowPill: {
    position: 'absolute',
    left: 0,
    top: 6,
    bottom: 6,
    width: 4,
    backgroundColor: '#FFFFFF',
    borderTopRightRadius: 4,
    borderBottomRightRadius: 4,
  },
  sidebarFooter: {
    paddingTop: Spacing.md,
    borderTopWidth: StyleSheet.hairlineWidth,
    gap: Spacing.xs,
  },
  adminUserCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.xs,
    paddingHorizontal: Spacing.sm,
    borderRadius: Radius.md,
    borderWidth: 1,
    marginBottom: 4,
  },
  adminAvatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  onlineBadge: {
    padding: 4,
  },
  themeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 4,
  },
  themeToggleBtn: {
    padding: 4,
    paddingHorizontal: 8,
    borderRadius: Radius.sm,
    borderWidth: 1,
  },
  dbStatusPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(34, 197, 94, 0.12)',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: Radius.md,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#22C55E',
  },
  contentWrapper: {
    flex: 1,
  },
});

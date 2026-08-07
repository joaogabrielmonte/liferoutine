import React from 'react';
import { Tabs, useRouter, usePathname } from 'expo-router';
import { View, StyleSheet, Platform, TouchableOpacity, useWindowDimensions } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useTheme } from '@/hooks/useTheme';
import { useThemeStore } from '@/stores/useThemeStore';
import { AppText } from '@/components/atoms/AppText';
import { Shadow, Radius, Spacing } from '@/constants/theme';

export default function TabLayout() {
  const { colors, isDark } = useTheme();
  const { settings, setTheme } = useThemeStore();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const pathname = usePathname();
  const { width } = useWindowDimensions();

  const isWebLayout = Platform.OS === 'web' || width >= 768;

  const sidebarNavItems = [
    { name: 'index', title: 'Hoje & Dashboard', icon: 'home-outline', activeIcon: 'home', path: '/(tabs)' },
    { name: 'habits', title: 'Gerenciar Hábitos', icon: 'list-outline', activeIcon: 'list', path: '/(tabs)/habits' },
    { name: 'stats', title: 'Progresso & Analytics', icon: 'bar-chart-outline', activeIcon: 'bar-chart', path: '/(tabs)/stats' },
    { name: 'users', title: 'Gestão de Usuários', icon: 'people-outline', activeIcon: 'people', path: '/(tabs)/users' },
    { name: 'profile', title: 'Perfil & Configurações', icon: 'person-outline', activeIcon: 'person', path: '/(tabs)/profile' },
  ];

  if (isWebLayout) {
    return (
      <View style={[styles.webRootContainer, { backgroundColor: colors.background }]}>
        {/* Left Fixed Interactive Web Sidebar Navigation Menu */}
        <View style={[styles.sidebar, { backgroundColor: colors.surfaceElevated, borderColor: colors.border }]}>
          {/* Logo & Brand Header */}
          <View style={styles.sidebarHeader}>
            <View style={[styles.logoIcon, { backgroundColor: `${colors.primary}22` }]}>
              <MaterialCommunityIcons name="lightning-bolt" size={26} color={colors.primary} />
            </View>
            <View>
              <AppText variant="h3" style={{ fontWeight: '800' }}>
                LifeRoutine
              </AppText>
              <AppText variant="caption" color="textSecondary">
                Sistema Web & Admin
              </AppText>
            </View>
          </View>

          {/* Navigation Items List */}
          <View style={styles.sidebarNavList}>
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
                  <Ionicons
                    name={(isSelected ? item.activeIcon : item.icon) as any}
                    size={20}
                    color={isSelected ? '#FFFFFF' : colors.textSecondary}
                  />
                  <AppText
                    style={{
                      fontSize: 14,
                      fontWeight: isSelected ? '700' : '600',
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

          {/* Sidebar Footer Theme & Database Status */}
          <View style={[styles.sidebarFooter, { borderTopColor: colors.border }]}>
            <View style={styles.themeRow}>
              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                <Ionicons name={isDark ? 'moon' : 'sunny'} size={18} color={colors.primary} />
                <AppText variant="caption" style={{ marginLeft: 6, fontWeight: '600' }}>
                  Tema {isDark ? 'Escuro' : 'Claro'}
                </AppText>
              </View>

              <TouchableOpacity
                onPress={() => setTheme(isDark ? 'light' : 'dark')}
                style={[styles.themeToggleBtn, { backgroundColor: colors.background }]}
              >
                <Ionicons name="swap-horizontal" size={16} color={colors.text} />
              </TouchableOpacity>
            </View>

            <View style={styles.dbStatusPill}>
              <View style={[styles.statusDot, { backgroundColor: '#22C55E' }]} />
              <AppText style={{ fontSize: 11, color: '#22C55E', fontWeight: '700' }}>
                VPS PostgreSQL Online
              </AppText>
            </View>
          </View>
        </View>

        {/* Main Content Area */}
        <View style={styles.webContentArea}>
          <Tabs
            screenOptions={{
              headerShown: false,
              tabBarStyle: { display: 'none' }, // Hide bottom tab bar on Web Layout
            }}
          >
            <Tabs.Screen name="index" options={{ title: 'Hoje' }} />
            <Tabs.Screen name="habits" options={{ title: 'Hábitos' }} />
            <Tabs.Screen name="stats" options={{ title: 'Progresso' }} />
            <Tabs.Screen name="users" options={{ title: 'Usuários' }} />
            <Tabs.Screen name="profile" options={{ title: 'Perfil' }} />
          </Tabs>
        </View>
      </View>
    );
  }

  // Mobile Bottom Tab Bar Layout
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: colors.tabActive,
        tabBarInactiveTintColor: colors.tabInactive,
        tabBarStyle: {
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
  );
}

const styles = StyleSheet.create({
  webRootContainer: {
    flex: 1,
    flexDirection: 'row',
  },
  sidebar: {
    width: 260,
    height: '100%',
    borderRightWidth: 1,
    padding: Spacing.lg,
    justifyContent: 'space-between',
    ...Shadow.sm,
  },
  sidebarHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    marginBottom: Spacing.xl,
  },
  logoIcon: {
    width: 44,
    height: 44,
    borderRadius: Radius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sidebarNavList: {
    flex: 1,
    gap: Spacing.xs,
  },
  sidebarItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.md,
    paddingVertical: 12,
    borderRadius: Radius.lg,
  },
  sidebarFooter: {
    paddingTop: Spacing.md,
    borderTopWidth: StyleSheet.hairlineWidth,
    gap: Spacing.sm,
  },
  themeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  themeToggleBtn: {
    padding: 6,
    borderRadius: Radius.md,
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
  },
  webContentArea: {
    flex: 1,
  },
});

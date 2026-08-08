import React from 'react';
import { Tabs, useRouter, usePathname } from 'expo-router';
import { View, StyleSheet, Platform, TouchableOpacity, useWindowDimensions } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/hooks/useTheme';
import { useThemeStore } from '@/stores/useThemeStore';
import { AppText } from '@/components/atoms/AppText';
import { Shadow, Radius, Spacing } from '@/constants/theme';

function WebSidebarNav() {
  const { colors, isDark } = useTheme();
  const { setTheme } = useThemeStore();
  const router = useRouter();
  const pathname = usePathname();

  const navItems = [
    { name: 'index', title: 'Visão Geral', icon: 'grid-outline', activeIcon: 'grid', path: '/(tabs)' },
    { name: 'users', title: 'Usuários', icon: 'people-outline', activeIcon: 'people', path: '/(tabs)/users' },
    { name: 'habits', title: 'Hábitos', icon: 'checkbox-outline', activeIcon: 'checkbox', path: '/(tabs)/habits' },
    { name: 'stats', title: 'Relatórios', icon: 'stats-chart-outline', activeIcon: 'stats-chart', path: '/(tabs)/stats' },
    { name: 'profile', title: 'Configurações', icon: 'settings-outline', activeIcon: 'settings', path: '/(tabs)/profile' },
  ];

  return (
    <View style={[styles.sidebar, { backgroundColor: isDark ? '#09090B' : '#FFFFFF', borderColor: isDark ? '#27272A' : '#E4E4E7' }]}>
      {/* Vercel-style Minimalist Brand Header */}
      <View style={styles.sidebarHeader}>
        <View style={[styles.logoDot, { backgroundColor: isDark ? '#FAFAFA' : '#09090B' }]}>
          <Ionicons name="flash" size={14} color={isDark ? '#09090B' : '#FAFAFA'} />
        </View>
        <AppText variant="subtitle" style={{ fontWeight: '700', fontSize: 14, marginLeft: 8, letterSpacing: -0.2 }}>
          LifeRoutine
        </AppText>
        <View style={[styles.adminBadge, { backgroundColor: isDark ? '#27272A' : '#F4F4F5' }]}>
          <AppText style={{ fontSize: 10, fontWeight: '600', color: isDark ? '#A1A1AA' : '#71717A' }}>
            Admin
          </AppText>
        </View>
      </View>

      {/* Nav List */}
      <View style={styles.navList}>
        {navItems.map((item) => {
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
                  backgroundColor: isSelected
                    ? isDark ? '#27272A' : '#F4F4F5'
                    : 'transparent',
                },
              ]}
              onPress={() => router.push(item.path as any)}
              activeOpacity={0.7}
            >
              <Ionicons
                name={(isSelected ? item.activeIcon : item.icon) as any}
                size={16}
                color={isSelected ? (isDark ? '#FAFAFA' : '#09090B') : (isDark ? '#A1A1AA' : '#71717A')}
              />
              <AppText
                style={{
                  fontSize: 13,
                  fontWeight: isSelected ? '600' : '500',
                  color: isSelected ? (isDark ? '#FAFAFA' : '#09090B') : (isDark ? '#A1A1AA' : '#71717A'),
                  marginLeft: 10,
                  flex: 1,
                }}
              >
                {item.title}
              </AppText>
            </TouchableOpacity>
          );
        })}
      </View>

      {/* Footer Status */}
      <View style={[styles.sidebarFooter, { borderTopColor: isDark ? '#27272A' : '#E4E4E7' }]}>
        <View style={styles.footerRow}>
          <View style={styles.statusGroup}>
            <View style={styles.dotGreen} />
            <AppText style={{ fontSize: 12, fontWeight: '500', color: isDark ? '#A1A1AA' : '#71717A' }}>
              VPS Online
            </AppText>
          </View>

          <TouchableOpacity
            onPress={() => setTheme(isDark ? 'light' : 'dark')}
            style={[styles.themeBtn, { backgroundColor: isDark ? '#18181B' : '#F4F4F5', borderColor: isDark ? '#27272A' : '#E4E4E7' }]}
          >
            <Ionicons name={isDark ? 'moon-outline' : 'sunny-outline'} size={14} color={isDark ? '#A1A1AA' : '#71717A'} />
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}

export default function TabLayout() {
  const { colors, isDark } = useTheme();
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();

  const isWebLayout = Platform.OS === 'web' || width >= 768;

  return (
    <View style={[styles.rootWrapper, { backgroundColor: isDark ? '#09090B' : '#FAFAFA' }]}>
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
    width: 230,
    height: '100%',
    borderRightWidth: 1,
    padding: 16,
    justifyContent: 'space-between',
  },
  sidebarHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 24,
    paddingHorizontal: 4,
  },
  logoDot: {
    width: 26,
    height: 26,
    borderRadius: 6,
    alignItems: 'center',
    justifyContent: 'center',
  },
  adminBadge: {
    marginLeft: 'auto',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  navList: {
    flex: 1,
    gap: 2,
  },
  navItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderRadius: 6,
  },
  sidebarFooter: {
    paddingTop: 14,
    borderTopWidth: 1,
  },
  footerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 4,
  },
  statusGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  dotGreen: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#22C55E',
  },
  themeBtn: {
    padding: 5,
    borderRadius: 6,
    borderWidth: 1,
  },
  contentWrapper: {
    flex: 1,
  },
});

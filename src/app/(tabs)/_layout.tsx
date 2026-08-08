import React, { useState } from 'react';
import { Tabs, useRouter, usePathname } from 'expo-router';
import { View, StyleSheet, Platform, TouchableOpacity, useWindowDimensions, Image } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/hooks/useTheme';
import { AppText } from '@/components/atoms/AppText';
import { AdminTopBar } from '@/components/organisms/AdminTopBar';
import { Shadow } from '@/constants/theme';

function WebSidebarNav() {
  const { colors, isDark } = useTheme();
  const router = useRouter();
  const pathname = usePathname();

  const [isCollapsed, setIsCollapsed] = useState<boolean>(false);

  const navSections = [
    {
      title: 'PAINEL DE GESTÃO ADMIN',
      items: [
        { name: 'index', title: 'Visão Geral & Suporte', icon: 'grid-outline', activeIcon: 'grid', path: '/(tabs)' },
        { name: 'users', title: 'Contas & Usuários', icon: 'people-outline', activeIcon: 'people', path: '/(tabs)/users' },
      ],
    },
    {
      title: 'BANCO DE DADOS & APIS',
      items: [
        { name: 'stats', title: 'Feature Flags & Módulos', icon: 'toggle-outline', activeIcon: 'toggle', path: '/(tabs)/stats' },
      ],
    },
    {
      title: 'SERVIDORES & INFRA',
      items: [
        { name: 'profile', title: 'Infraestrutura VPS Oracle', icon: 'hardware-chip-outline', activeIcon: 'hardware-chip', path: '/(tabs)/profile' },
      ],
    },
  ];

  const sidebarBg = isDark ? '#111827' : '#FFFFFF';
  const sidebarBorder = isDark ? '#1F2937' : '#E5E7EB';
  const primaryColor = '#2563EB';

  return (
    <View
      style={[
        styles.sidebar,
        {
          width: isCollapsed ? 70 : 250,
          backgroundColor: sidebarBg,
          borderColor: sidebarBorder,
        },
        Platform.OS === 'web'
          ? ({
              transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
            } as any)
          : {},
      ]}
    >
      {/* Sidebar Header with Mobile Logo & Collapse Toggle */}
      <View style={styles.topHeaderWrapper}>
        <View style={[styles.sidebarBrand, isCollapsed && styles.sidebarBrandCollapsed]}>
          <Image
            source={require('../../../assets/images/icon.png')}
            style={styles.logoImage}
            resizeMode="contain"
          />

          {!isCollapsed && (
            <View style={{ flex: 1, marginLeft: 10 }}>
              <AppText variant="subtitle" style={{ fontWeight: '700', fontSize: 14, letterSpacing: -0.2 }}>
                LifeRoutine Admin
              </AppText>
              <AppText variant="caption" color="textSecondary" style={{ fontSize: 10 }}>
                Painel de Controle
              </AppText>
            </View>
          )}

          {/* Toggle Collapse Button (< >) */}
          <TouchableOpacity
            style={[styles.collapseBtn, { backgroundColor: isDark ? '#1F2937' : '#F3F4F6', borderColor: sidebarBorder }]}
            onPress={() => setIsCollapsed(!isCollapsed)}
            activeOpacity={0.7}
          >
            <Ionicons
              name={isCollapsed ? 'chevron-forward' : 'chevron-back'}
              size={14}
              color={isDark ? '#F9FAFB' : '#111827'}
            />
          </TouchableOpacity>
        </View>
      </View>

      {/* Navigation Groups */}
      <View style={styles.navList}>
        {navSections.map((section) => (
          <View key={section.title} style={styles.navGroup}>
            {!isCollapsed && (
              <AppText variant="caption" color="textTertiary" style={styles.groupHeader}>
                {section.title}
              </AppText>
            )}

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
                    isCollapsed && styles.navItemCollapsed,
                    {
                      backgroundColor: isSelected
                        ? (isDark ? '#1F2937' : '#EFF6FF')
                        : 'transparent',
                      borderLeftColor: isSelected ? primaryColor : 'transparent',
                    },
                  ]}
                  onPress={() => router.push(item.path as any)}
                  activeOpacity={0.7}
                >
                  <Ionicons
                    name={(isSelected ? item.activeIcon : item.icon) as any}
                    size={18}
                    color={isSelected ? primaryColor : (isDark ? '#9CA3AF' : '#6B7280')}
                  />

                  {!isCollapsed && (
                    <AppText
                      style={{
                        fontSize: 13,
                        fontWeight: isSelected ? '700' : '500',
                        color: isSelected ? (isDark ? '#F9FAFB' : '#1E40AF') : (isDark ? '#9CA3AF' : '#6B7280'),
                        marginLeft: 10,
                        flex: 1,
                      }}
                    >
                      {item.title}
                    </AppText>
                  )}
                </TouchableOpacity>
              );
            })}
          </View>
        ))}
      </View>

      {/* Clean Footer (No duplicate Logout / Theme buttons) */}
      <View style={[styles.sidebarFooter, { borderTopColor: sidebarBorder }]}>
        {!isCollapsed ? (
          <View style={styles.footerBrandRow}>
            <View style={styles.statusDot} />
            <AppText variant="caption" color="textSecondary" style={{ fontSize: 11 }}>
              LifeRoutine v1.4.0 • Online
            </AppText>
          </View>
        ) : (
          <View style={{ alignItems: 'center' }}>
            <View style={styles.statusDot} />
          </View>
        )}
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
        {isWebLayout && <AdminTopBar />}
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
    height: '100%',
    borderRightWidth: 1,
    padding: 16,
    justifyContent: 'space-between',
  },
  topHeaderWrapper: {
    marginBottom: 20,
  },
  sidebarBrand: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  sidebarBrandCollapsed: {
    justifyContent: 'center',
  },
  logoImage: {
    width: 32,
    height: 32,
    borderRadius: 8,
  },
  collapseBtn: {
    padding: 5,
    borderRadius: 6,
    borderWidth: 1,
    marginLeft: 6,
  },
  navList: {
    flex: 1,
    gap: 18,
  },
  navGroup: {
    gap: 3,
  },
  groupHeader: {
    fontSize: 9,
    fontWeight: '700',
    letterSpacing: 0.8,
    marginBottom: 6,
    paddingLeft: 8,
  },
  navItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 9,
    borderRadius: 8,
    borderLeftWidth: 3,
  },
  navItemCollapsed: {
    justifyContent: 'center',
    paddingHorizontal: 0,
    borderLeftWidth: 0,
  },
  sidebarFooter: {
    paddingTop: 14,
    borderTopWidth: 1,
  },
  footerBrandRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#10B981',
  },
  contentWrapper: {
    flex: 1,
  },
});

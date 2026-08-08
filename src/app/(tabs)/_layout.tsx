import React, { useState } from 'react';
import { Tabs, useRouter, usePathname } from 'expo-router';
import { View, StyleSheet, Platform, TouchableOpacity, useWindowDimensions, Image } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/hooks/useTheme';
import { useThemeStore } from '@/stores/useThemeStore';
import { AppText } from '@/components/atoms/AppText';
import { AdminTopBar } from '@/components/organisms/AdminTopBar';
import { logoutUser } from '@/services/auth';
import { Shadow } from '@/constants/theme';

function WebSidebarNav() {
  const { colors, isDark } = useTheme();
  const { setTheme } = useThemeStore();
  const router = useRouter();
  const pathname = usePathname();

  const [isCollapsed, setIsCollapsed] = useState<boolean>(false);

  const handleLogout = async () => {
    try {
      await logoutUser();
      router.replace('/login');
    } catch (e) {
      console.warn('Logout error:', e);
      router.replace('/login');
    }
  };

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
        { name: 'habits', title: 'Database Explorer', icon: 'server-outline', activeIcon: 'server', path: '/(tabs)/habits' },
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

  const sidebarBg = isDark ? '#091E42' : '#FFFFFF';
  const sidebarBorder = isDark ? '#253858' : '#DFE1E6';
  const primaryColor = '#0052CC';

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
      {/* Sidebar Header with Mobile Logo */}
      <View style={styles.topHeaderWrapper}>
        <View style={[styles.sidebarBrand, isCollapsed && styles.sidebarBrandCollapsed]}>
          <Image
            source={require('../../../assets/images/icon.png')}
            style={styles.logoImage}
            resizeMode="contain"
          />

          {!isCollapsed && (
            <View style={{ flex: 1, marginLeft: 8 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                <AppText variant="subtitle" style={{ fontWeight: '700', fontSize: 14, letterSpacing: -0.2 }}>
                  LifeRoutine Admin
                </AppText>
              </View>
              <AppText variant="caption" color="textSecondary" style={{ fontSize: 10 }}>
                Painel de Controle
              </AppText>
            </View>
          )}

          {/* Toggle Collapse Button (< >) */}
          <TouchableOpacity
            style={[styles.collapseBtn, { backgroundColor: isDark ? '#172B4D' : '#F4F5F7', borderColor: sidebarBorder }]}
            onPress={() => setIsCollapsed(!isCollapsed)}
            activeOpacity={0.7}
          >
            <Ionicons
              name={isCollapsed ? 'chevron-forward' : 'chevron-back'}
              size={14}
              color={isDark ? '#FAFBFC' : '#091E42'}
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
                        ? (isDark ? '#172B4D' : '#F4F5F7')
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
                    color={isSelected ? primaryColor : (isDark ? '#A5ADBA' : '#6B778C')}
                  />

                  {!isCollapsed && (
                    <AppText
                      style={{
                        fontSize: 13,
                        fontWeight: isSelected ? '700' : '500',
                        color: isSelected ? (isDark ? '#FAFBFC' : '#091E42') : (isDark ? '#A5ADBA' : '#6B778C'),
                        marginLeft: 8,
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

      {/* Footer Theme & Logout */}
      <View style={[styles.sidebarFooter, { borderTopColor: sidebarBorder }]}>
        {!isCollapsed ? (
          <View style={styles.expandedFooterRow}>
            <TouchableOpacity
              onPress={() => setTheme(isDark ? 'light' : 'dark')}
              style={[styles.themeBtnExpanded, { backgroundColor: isDark ? '#172B4D' : '#FAFBFC', borderColor: sidebarBorder }]}
            >
              <Ionicons name={isDark ? 'moon-outline' : 'sunny-outline'} size={14} color={isDark ? '#A5ADBA' : '#6B778C'} />
              <AppText variant="caption" style={{ marginLeft: 6, fontSize: 11, color: colors.textSecondary }}>
                {isDark ? 'Modo Escuro' : 'Modo Claro'}
              </AppText>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.logoutBtn, { backgroundColor: isDark ? '#2A1215' : '#FFEBE6', borderColor: '#FFBDAD' }]}
              onPress={handleLogout}
              activeOpacity={0.7}
            >
              <Ionicons name="log-out-outline" size={16} color="#DE350B" />
              <AppText style={{ fontSize: 12, fontWeight: '700', color: '#DE350B', marginLeft: 4 }}>
                Sair
              </AppText>
            </TouchableOpacity>
          </View>
        ) : (
          <View style={styles.collapsedFooterRow}>
            <TouchableOpacity
              onPress={() => setTheme(isDark ? 'light' : 'dark')}
              style={[styles.themeBtn, { backgroundColor: isDark ? '#091E42' : '#F4F5F7', borderColor: sidebarBorder, marginBottom: 8 }]}
            >
              <Ionicons name={isDark ? 'moon-outline' : 'sunny-outline'} size={16} color={isDark ? '#A5ADBA' : '#6B778C'} />
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.logoutBtnCollapsed, { backgroundColor: isDark ? '#2A1215' : '#FFEBE6', borderColor: '#FFBDAD' }]}
              onPress={handleLogout}
              activeOpacity={0.7}
            >
              <Ionicons name="log-out-outline" size={16} color="#DE350B" />
            </TouchableOpacity>
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
    padding: 12,
    justifyContent: 'space-between',
  },
  topHeaderWrapper: {
    marginBottom: 16,
  },
  sidebarBrand: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
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
    padding: 4,
    borderRadius: 4,
    borderWidth: 1,
    marginLeft: 6,
  },
  navList: {
    flex: 1,
    gap: 14,
  },
  navGroup: {
    gap: 2,
  },
  groupHeader: {
    fontSize: 9,
    fontWeight: '700',
    letterSpacing: 0.8,
    marginBottom: 4,
    paddingLeft: 6,
  },
  navItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 9,
    borderRadius: 6,
    borderLeftWidth: 3,
  },
  navItemCollapsed: {
    justifyContent: 'center',
    paddingHorizontal: 0,
    borderLeftWidth: 0,
  },
  sidebarFooter: {
    paddingTop: 12,
    borderTopWidth: 1,
  },
  expandedFooterRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
  },
  themeBtnExpanded: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 6,
    borderRadius: 6,
    borderWidth: 1,
    flex: 1,
  },
  themeBtn: {
    padding: 6,
    borderRadius: 4,
    borderWidth: 1,
  },
  logoutBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 6,
    borderWidth: 1,
  },
  logoutBtnCollapsed: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 8,
    borderRadius: 6,
    borderWidth: 1,
  },
  collapsedFooterRow: {
    alignItems: 'center',
  },
  contentWrapper: {
    flex: 1,
  },
});

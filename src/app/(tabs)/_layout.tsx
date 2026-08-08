import React, { useState, useEffect } from 'react';
import { Tabs, useRouter, usePathname } from 'expo-router';
import { View, StyleSheet, Platform, TouchableOpacity, useWindowDimensions, Image } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/hooks/useTheme';
import { useThemeStore } from '@/stores/useThemeStore';
import { AppText } from '@/components/atoms/AppText';
import { getUserProfile, UserProfile } from '@/services/storage';
import { logoutUser } from '@/services/auth';
import { Shadow } from '@/constants/theme';

function WebSidebarNav() {
  const { colors, isDark } = useTheme();
  const { setTheme } = useThemeStore();
  const router = useRouter();
  const pathname = usePathname();

  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);

  useEffect(() => {
    getUserProfile().then((profile) => {
      if (profile) {
        setUserProfile(profile);
      }
    });
  }, []);

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
      title: 'PAINEL DE GESTÃO ERP',
      items: [
        { name: 'index', title: 'Visão Geral ERP', icon: 'grid-outline', activeIcon: 'grid', path: '/(tabs)' },
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

  const userInitials = userProfile && userProfile.name
    ? userProfile.name
        .split(' ')
        .map((n) => n[0])
        .join('')
        .substring(0, 2)
        .toUpperCase()
    : 'GM';

  const sidebarBg = isDark ? '#091E42' : '#FFFFFF';
  const sidebarBorder = isDark ? '#253858' : '#DFE1E6';
  const primaryColor = '#0052CC';

  return (
    <View style={[styles.sidebar, { backgroundColor: sidebarBg, borderColor: sidebarBorder }]}>
      {/* Brand Header with Official Mobile App Logo */}
      <View style={styles.sidebarBrand}>
        <Image
          source={require('../../../assets/images/icon.png')}
          style={styles.logoImage}
          resizeMode="contain"
        />
        <View style={{ flex: 1, marginLeft: 10 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
            <AppText variant="subtitle" style={{ fontWeight: '700', fontSize: 15, letterSpacing: -0.2 }}>
              LifeRoutine ERP
            </AppText>
            <View style={[styles.crmPill, { backgroundColor: primaryColor }]}>
              <AppText style={{ fontSize: 8, fontWeight: '700', color: '#FFFFFF' }}>ERP ADMIN</AppText>
            </View>
          </View>
          <AppText variant="caption" color="textSecondary" style={{ fontSize: 11 }}>
            Gestão Mobile • Oracle VPS
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
                    size={16}
                    color={isSelected ? primaryColor : (isDark ? '#A5ADBA' : '#6B778C')}
                  />
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
                </TouchableOpacity>
              );
            })}
          </View>
        ))}
      </View>

      {/* Footer Profile & Logout Button */}
      <View style={[styles.sidebarFooter, { borderTopColor: sidebarBorder }]}>
        {/* Dynamic User Profile Card */}
        <View style={[styles.crmProfileCard, { backgroundColor: isDark ? '#172B4D' : '#FAFBFC', borderColor: sidebarBorder }]}>
          <View style={[styles.avatarCircle, { backgroundColor: primaryColor }]}>
            <AppText style={{ color: '#FFF', fontWeight: '700', fontSize: 12 }}>
              {userInitials}
            </AppText>
          </View>
          <View style={{ flex: 1, marginLeft: 8 }}>
            <AppText variant="caption" style={{ fontWeight: '700', fontSize: 12 }}>
              {userProfile?.name || 'Gabriel Monte'}
            </AppText>
            <AppText variant="caption" color="textSecondary" style={{ fontSize: 10 }}>
              ⏳ Sessão: 30 min max
            </AppText>
          </View>
        </View>

        {/* Status & Theme Row */}
        <View style={styles.bottomStatusRow}>
          <View style={styles.statusIndicator}>
            <View style={[styles.dotGreen, { backgroundColor: '#00875A' }]} />
            <AppText style={{ fontSize: 11, fontWeight: '600', color: '#00875A' }}>
              PostgreSQL Online
            </AppText>
          </View>

          <TouchableOpacity
            onPress={() => setTheme(isDark ? 'light' : 'dark')}
            style={[styles.themeBtn, { backgroundColor: isDark ? '#091E42' : '#F4F5F7', borderColor: sidebarBorder }]}
          >
            <Ionicons name={isDark ? 'moon-outline' : 'sunny-outline'} size={14} color={isDark ? '#A5ADBA' : '#6B778C'} />
          </TouchableOpacity>
        </View>

        {/* Botão de Sair do ERP */}
        <TouchableOpacity
          style={[styles.logoutBtn, { backgroundColor: isDark ? '#2A1215' : '#FFEBE6', borderColor: '#FFBDAD' }]}
          onPress={handleLogout}
          activeOpacity={0.7}
        >
          <Ionicons name="log-out-outline" size={16} color="#DE350B" />
          <AppText style={{ fontSize: 13, fontWeight: '700', color: '#DE350B', marginLeft: 6 }}>
            Sair do ERP
          </AppText>
        </TouchableOpacity>
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
    width: 250,
    height: '100%',
    borderRightWidth: 1,
    padding: 16,
    justifyContent: 'space-between',
  },
  sidebarBrand: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 24,
  },
  logoImage: {
    width: 36,
    height: 36,
    borderRadius: 8,
  },
  crmPill: {
    paddingHorizontal: 5,
    paddingVertical: 1,
    borderRadius: 3,
  },
  navList: {
    flex: 1,
    gap: 16,
  },
  navGroup: {
    gap: 2,
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
    paddingHorizontal: 10,
    paddingVertical: 9,
    borderRadius: 6,
    borderLeftWidth: 3,
  },
  sidebarFooter: {
    paddingTop: 14,
    borderTopWidth: 1,
    gap: 8,
  },
  crmProfileCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 8,
    borderRadius: 6,
    borderWidth: 1,
  },
  avatarCircle: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  bottomStatusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 4,
  },
  statusIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  dotGreen: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  themeBtn: {
    padding: 5,
    borderRadius: 4,
    borderWidth: 1,
  },
  logoutBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 6,
    borderWidth: 1,
    marginTop: 4,
  },
  contentWrapper: {
    flex: 1,
  },
});

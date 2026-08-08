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
      title: 'PAINEL EXECUTIVE CRM',
      items: [
        { name: 'index', title: 'Dashboard Executive', icon: 'grid-outline', activeIcon: 'grid', path: '/(tabs)' },
        { name: 'users', title: 'Gestão de Usuários', icon: 'people-outline', activeIcon: 'people', path: '/(tabs)/users' },
      ],
    },
    {
      title: 'EXPERT TOOLS & BANCO',
      items: [
        { name: 'habits', title: 'Database Explorer', icon: 'server-outline', activeIcon: 'server', path: '/(tabs)/habits' },
        { name: 'stats', title: 'Feature Flags & Recursos', icon: 'toggle-outline', activeIcon: 'toggle', path: '/(tabs)/stats' },
      ],
    },
    {
      title: 'INFRAESTRUTURA',
      items: [
        { name: 'profile', title: 'Configurações VPS Oracle', icon: 'hardware-chip-outline', activeIcon: 'hardware-chip', path: '/(tabs)/profile' },
      ],
    },
  ];

  const sidebarBg = isDark ? '#091E42' : '#FFFFFF';
  const sidebarBorder = isDark ? '#253858' : '#DFE1E6';
  const activeBg = isDark ? '#172B4D' : '#EB5A46';

  return (
    <View style={[styles.sidebar, { backgroundColor: sidebarBg, borderColor: sidebarBorder }]}>
      {/* Brand Header */}
      <View style={styles.sidebarBrand}>
        <View style={[styles.logoSquare, { backgroundColor: '#0052CC' }]}>
          <MaterialCommunityIcons name="lightning-bolt" size={22} color="#FFFFFF" />
        </View>
        <View style={{ flex: 1, marginLeft: 10 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
            <AppText variant="subtitle" style={{ fontWeight: '700', fontSize: 15, letterSpacing: -0.2 }}>
              LifeRoutine
            </AppText>
            <View style={styles.crmPill}>
              <AppText style={{ fontSize: 9, fontWeight: '700', color: '#FFFFFF' }}>CRM ADMIN</AppText>
            </View>
          </View>
          <AppText variant="caption" color="textSecondary" style={{ fontSize: 11 }}>
            Command Center • Oracle VPS
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
                      borderLeftColor: isSelected ? '#0052CC' : 'transparent',
                    },
                  ]}
                  onPress={() => router.push(item.path as any)}
                  activeOpacity={0.7}
                >
                  <Ionicons
                    name={(isSelected ? item.activeIcon : item.icon) as any}
                    size={16}
                    color={isSelected ? '#0052CC' : (isDark ? '#A5ADBA' : '#6B778C')}
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

      {/* Footer Profile & Server Status */}
      <View style={[styles.sidebarFooter, { borderTopColor: sidebarBorder }]}>
        <View style={[styles.crmProfileCard, { backgroundColor: isDark ? '#172B4D' : '#FAFBFC', borderColor: sidebarBorder }]}>
          <View style={[styles.avatarCircle, { backgroundColor: '#0052CC' }]}>
            <AppText style={{ color: '#FFF', fontWeight: '700', fontSize: 12 }}>GM</AppText>
          </View>
          <View style={{ flex: 1, marginLeft: 8 }}>
            <AppText variant="caption" style={{ fontWeight: '700', fontSize: 12 }}>
              Gabriel Monte
            </AppText>
            <AppText variant="caption" color="textSecondary" style={{ fontSize: 10 }}>
              Super Admin
            </AppText>
          </View>
        </View>

        <View style={styles.bottomStatusRow}>
          <View style={styles.statusIndicator}>
            <View style={styles.dotGreen} />
            <AppText style={{ fontSize: 11, fontWeight: '600', color: '#00875A' }}>
              PostgreSQL VPS Online
            </AppText>
          </View>

          <TouchableOpacity
            onPress={() => setTheme(isDark ? 'light' : 'dark')}
            style={[styles.themeBtn, { backgroundColor: isDark ? '#091E42' : '#F4F5F7', borderColor: sidebarBorder }]}
          >
            <Ionicons name={isDark ? 'moon-outline' : 'sunny-outline'} size={14} color={isDark ? '#A5ADBA' : '#6B778C'} />
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
  logoSquare: {
    width: 34,
    height: 34,
    borderRadius: 6,
    alignItems: 'center',
    justifyContent: 'center',
  },
  crmPill: {
    backgroundColor: '#0052CC',
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
    backgroundColor: '#00875A',
  },
  themeBtn: {
    padding: 5,
    borderRadius: 4,
    borderWidth: 1,
  },
  contentWrapper: {
    flex: 1,
  },
});

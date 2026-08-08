import React, { useEffect, useState } from 'react';
import { View, ActivityIndicator, StyleSheet, Platform } from 'react-native';
import { useRouter } from 'expo-router';
import { getActiveSessionUser } from '@/services/auth';

export default function IndexScreen() {
  const router = useRouter();
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    async function checkAuthSession() {
      try {
        const activeUser = await getActiveSessionUser();
        if (activeUser) {
          router.replace('/(tabs)');
        } else {
          router.replace('/login');
        }
      } catch (e) {
        console.warn('Session check error on root index:', e);
        router.replace('/login');
      } finally {
        setChecking(false);
      }
    }
    checkAuthSession();
  }, []);

  return (
    <View style={styles.center}>
      <ActivityIndicator size="large" color="#0052CC" />
    </View>
  );
}

const styles = StyleSheet.create({
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#091E42',
  },
});

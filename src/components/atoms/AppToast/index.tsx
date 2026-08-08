import React, { useEffect } from 'react';
import { View, StyleSheet, TouchableOpacity, Platform } from 'react-native';
import Animated, { FadeInUp, FadeOutUp } from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import { AppText } from '@/components/atoms/AppText';
import { useTheme } from '@/hooks/useTheme';

export type ToastType = 'success' | 'error' | 'info' | 'warning';

export type AppToastProps = {
  visible: boolean;
  title: string;
  message?: string;
  type?: ToastType;
  onClose: () => void;
  duration?: number;
};

export function AppToast({
  visible,
  title,
  message,
  type = 'success',
  onClose,
  duration = 3500,
}: AppToastProps) {
  const { isDark } = useTheme();

  useEffect(() => {
    if (visible && duration > 0) {
      const timer = setTimeout(() => {
        onClose();
      }, duration);
      return () => clearTimeout(timer);
    }
  }, [visible, duration, onClose]);

  if (!visible) return null;

  const getTypeConfig = () => {
    switch (type) {
      case 'success':
        return {
          icon: 'checkmark-circle-outline',
          iconColor: '#00875A',
          bgColor: isDark ? '#051C14' : '#E3FCEF',
          borderColor: '#00875A',
          textColor: isDark ? '#E3FCEF' : '#006644',
        };
      case 'error':
        return {
          icon: 'alert-circle-outline',
          iconColor: '#DE350B',
          bgColor: isDark ? '#2D0E0E' : '#FFEBE6',
          borderColor: '#DE350B',
          textColor: isDark ? '#FFEBE6' : '#BF2600',
        };
      case 'warning':
        return {
          icon: 'warning-outline',
          iconColor: '#FFAB00',
          bgColor: isDark ? '#261B00' : '#FFF0B3',
          borderColor: '#FFAB00',
          textColor: isDark ? '#FFF0B3' : '#172B4D',
        };
      case 'info':
      default:
        return {
          icon: 'information-circle-outline',
          iconColor: '#0052CC',
          bgColor: isDark ? '#091E42' : '#DEEBFF',
          borderColor: '#0052CC',
          textColor: isDark ? '#DEEBFF' : '#0747A6',
        };
    }
  };

  const config = getTypeConfig();

  return (
    <Animated.View
      entering={FadeInUp.duration(300)}
      exiting={FadeOutUp.duration(250)}
      style={[
        styles.toastContainer,
        {
          backgroundColor: config.bgColor,
          borderColor: config.borderColor,
        },
      ]}
    >
      <Ionicons name={config.icon as any} size={22} color={config.iconColor} />
      <View style={styles.textContainer}>
        <AppText style={[styles.title, { color: config.textColor }]}>
          {title}
        </AppText>
        {!!message && (
          <AppText style={[styles.message, { color: config.textColor }]}>
            {message}
          </AppText>
        )}
      </View>

      <TouchableOpacity onPress={onClose} style={styles.closeBtn} activeOpacity={0.7}>
        <Ionicons name="close" size={18} color={config.textColor} />
      </TouchableOpacity>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  toastContainer: {
    position: 'absolute',
    top: Platform.OS === 'web' ? 20 : 50,
    left: 20,
    right: 20,
    maxWidth: 500,
    alignSelf: 'center',
    zIndex: 9999,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderRadius: 10,
    borderWidth: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 10,
    elevation: 8,
  },
  textContainer: {
    flex: 1,
    marginLeft: 10,
    marginRight: 8,
  },
  title: {
    fontWeight: '700',
    fontSize: 13,
  },
  message: {
    fontSize: 11,
    marginTop: 2,
    opacity: 0.9,
  },
  closeBtn: {
    padding: 4,
  },
});

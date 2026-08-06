import React from 'react';
import {
  TouchableOpacity,
  ActivityIndicator,
  StyleSheet,
  ViewStyle,
  TextStyle,
  StyleProp,
  View,
} from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
} from 'react-native-reanimated';
import { useTheme } from '@/hooks/useTheme';
import { AppText } from '@/components/atoms/AppText';
import { Spacing, Radius, FontFamily, FontSize } from '@/constants/theme';

const AnimatedTouchable = Animated.createAnimatedComponent(TouchableOpacity);

type ButtonVariant = 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger';
type ButtonSize = 'sm' | 'md' | 'lg';

type ButtonProps = {
  label: string;
  onPress: () => void;
  variant?: ButtonVariant;
  size?: ButtonSize;
  disabled?: boolean;
  loading?: boolean;
  icon?: React.ReactNode;
  iconPosition?: 'left' | 'right';
  style?: StyleProp<ViewStyle>;
  fullWidth?: boolean;
};

export function AppButton({
  label,
  onPress,
  variant = 'primary',
  size = 'md',
  disabled = false,
  loading = false,
  icon,
  iconPosition = 'left',
  style,
  fullWidth = false,
}: ButtonProps) {
  const { colors } = useTheme();
  const scale = useSharedValue(1);

  const animStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const handlePressIn = () => {
    scale.value = withSpring(0.96, { damping: 15 });
  };

  const handlePressOut = () => {
    scale.value = withSpring(1, { damping: 15 });
  };

  const containerStyle: ViewStyle = {
    ...styles.base,
    ...sizeStyles[size],
    ...(fullWidth ? { alignSelf: 'stretch' as const } : {}),
    ...variantContainerStyles(variant, colors),
    ...(disabled || loading ? { opacity: 0.5 } : {}),
  };

  const labelColor = variant === 'outline' || variant === 'ghost'
    ? colors.primary
    : variant === 'danger'
    ? '#FFFFFF'
    : '#FFFFFF';

  return (
    <AnimatedTouchable
      style={[animStyle, containerStyle, style]}
      onPress={onPress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      disabled={disabled || loading}
      activeOpacity={1}
    >
      {loading ? (
        <ActivityIndicator color={labelColor} size="small" />
      ) : (
        <View style={styles.content}>
          {icon && iconPosition === 'left' && (
            <View style={{ marginRight: Spacing.xs }}>{icon}</View>
          )}
          <AppText
            style={{
              fontFamily: FontFamily.semiBold,
              fontSize: labelFontSize[size],
              color: labelColor,
            }}
          >
            {label}
          </AppText>
          {icon && iconPosition === 'right' && (
            <View style={{ marginLeft: Spacing.xs }}>{icon}</View>
          )}
        </View>
      )}
    </AnimatedTouchable>
  );
}

const variantContainerStyles = (
  variant: ButtonVariant,
  colors: ReturnType<typeof useTheme>['colors']
): ViewStyle => {
  switch (variant) {
    case 'primary':
      return { backgroundColor: colors.primary };
    case 'secondary':
      return { backgroundColor: colors.primaryLight };
    case 'outline':
      return {
        backgroundColor: 'transparent',
        borderWidth: 1.5,
        borderColor: colors.primary,
      };
    case 'ghost':
      return { backgroundColor: 'transparent' };
    case 'danger':
      return { backgroundColor: colors.danger };
  }
};

const sizeStyles: Record<ButtonSize, ViewStyle> = {
  sm: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm - 2,
    borderRadius: Radius.sm,
  },
  md: {
    paddingHorizontal: Spacing.xl,
    paddingVertical: Spacing.md,
    borderRadius: Radius.md,
  },
  lg: {
    paddingHorizontal: Spacing['2xl'],
    paddingVertical: Spacing.base,
    borderRadius: Radius.lg,
  },
};

const labelFontSize: Record<ButtonSize, number> = {
  sm: FontSize.sm,
  md: FontSize.base,
  lg: FontSize.lg,
};

const styles = StyleSheet.create({
  base: {
    alignSelf: 'flex-start',
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
});

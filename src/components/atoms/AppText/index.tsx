import React from 'react';
import {
  Text as RNText,
  TextStyle,
  StyleSheet,
  StyleProp,
} from 'react-native';
import { useTheme } from '@/hooks/useTheme';
import { Typography, FontFamily, type ThemeColors } from '@/constants/theme';

type TextVariant = keyof typeof Typography;
type TextColor = keyof ThemeColors;

type TextProps = {
  variant?: TextVariant;
  color?: TextColor;
  style?: StyleProp<TextStyle>;
  align?: 'left' | 'center' | 'right';
  numberOfLines?: number;
  children: React.ReactNode;
};

export function AppText({
  variant = 'body',
  color,
  style,
  align,
  numberOfLines,
  children,
}: TextProps) {
  const { colors } = useTheme();

  const textColor = color
    ? colors[color]
    : colors.text;

  return (
    <RNText
      numberOfLines={numberOfLines}
      style={[
        Typography[variant],
        { color: textColor as string },
        align ? { textAlign: align } : undefined,
        style,
      ]}
    >
      {children}
    </RNText>
  );
}

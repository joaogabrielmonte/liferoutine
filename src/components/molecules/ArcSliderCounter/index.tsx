import React, { useRef } from 'react';
import {
  View,
  StyleSheet,
  PanResponder,
  TouchableOpacity,
} from 'react-native';
import Svg, { Path, Circle, Defs, LinearGradient, Stop } from 'react-native-svg';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/hooks/useTheme';
import { AppText } from '@/components/atoms/AppText';
import { Radius, Spacing, Shadow } from '@/constants/theme';

type ArcSliderCounterProps = {
  value: number;
  max: number;
  unit: string;
  color?: string;
  onChange: (newValue: number) => void;
};

export function ArcSliderCounter({
  value,
  max = 10,
  unit = 'unidades',
  color = '#3B82F6',
  onChange,
}: ArcSliderCounterProps) {
  const { colors, isDark } = useTheme();

  // Canvas Dimensions for Half-Moon Arc (Semi-circle)
  const width = 220;
  const height = 130;
  const cx = 110;
  const cy = 110;
  const rx = 85;
  const ry = 85;
  const strokeWidth = 14;

  const currentVal = Math.min(max, Math.max(0, value));
  const progressRatio = max > 0 ? currentVal / max : 0;
  const percentage = Math.round(progressRatio * 100);

  // Angle from Math.PI (180deg - left) to 0 (0deg - right)
  const currentAngle = Math.PI * (1 - progressRatio);
  const knobX = cx + rx * Math.cos(currentAngle);
  const knobY = cy - ry * Math.sin(currentAngle);

  // SVG Arc Path String (from left 180deg to right 0deg)
  const startX = cx - rx;
  const startY = cy;
  const endX = cx + rx;
  const endY = cy;

  // Track arc path (Full semi-circle)
  const trackPath = `M ${startX} ${startY} A ${rx} ${ry} 0 0 1 ${endX} ${endY}`;

  // Fill arc path (Dynamic based on progress)
  const fillPath = `M ${startX} ${startY} A ${rx} ${ry} 0 0 1 ${knobX} ${knobY}`;

  // PanResponder to handle smooth touch drag along the Half-Moon Arc
  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => true,
      onPanResponderGrant: (evt) => handleTouch(evt.nativeEvent.locationX, evt.nativeEvent.locationY),
      onPanResponderMove: (evt) => handleTouch(evt.nativeEvent.locationX, evt.nativeEvent.locationY),
    })
  ).current;

  const handleTouch = (touchX: number, touchY: number) => {
    // Calculate angle relative to center (cx, cy)
    const dx = touchX - cx;
    const dy = cy - touchY; // inverted Y

    let angleRad = Math.atan2(dy, dx);
    if (angleRad < 0) {
      angleRad = dx < 0 ? Math.PI : 0;
    }

    // Angle goes from Math.PI (left = 0%) to 0 (right = 100%)
    const clampedAngle = Math.max(0, Math.min(Math.PI, angleRad));
    const newRatio = 1 - clampedAngle / Math.PI;
    const calculatedValue = Math.round(newRatio * max);

    if (calculatedValue !== currentVal) {
      onChange(calculatedValue);
    }
  };

  const handleIncrement = () => {
    if (currentVal < max) onChange(currentVal + 1);
  };

  const handleDecrement = () => {
    if (currentVal > 0) onChange(currentVal - 1);
  };

  return (
    <View style={styles.container}>
      {/* Half-Moon Arc SVG Gauge */}
      <View style={styles.svgWrapper} {...panResponder.panHandlers}>
        <Svg width={width} height={height}>
          <Defs>
            <LinearGradient id="arcGradient" x1="0%" y1="0%" x2="100%" y2="0%">
              <Stop offset="0%" stopColor={color} stopOpacity={0.7} />
              <Stop offset="100%" stopColor={color} stopOpacity={1} />
            </LinearGradient>
          </Defs>

          {/* Outer Background Arc Track */}
          <Path
            d={trackPath}
            stroke={isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)'}
            strokeWidth={strokeWidth}
            strokeLinecap="round"
            fill="none"
          />

          {/* Active Colored Arc Fill */}
          <Path
            d={fillPath}
            stroke="url(#arcGradient)"
            strokeWidth={strokeWidth}
            strokeLinecap="round"
            fill="none"
          />

          {/* Interactive Drag Handle Knob */}
          <Circle
            cx={knobX}
            cy={knobY}
            r={11}
            fill="#FFFFFF"
            stroke={color}
            strokeWidth={4}
          />
        </Svg>

        {/* Center Display Value */}
        <View style={styles.centerTextContainer}>
          <AppText variant="display" style={{ color: colors.text, fontWeight: '800', lineHeight: 42 }}>
            {currentVal}
          </AppText>
          <AppText variant="caption" color="textSecondary">
            de {max} {unit} ({percentage}%)
          </AppText>
        </View>
      </View>

      {/* Auxiliary Precision Increment / Decrement Controls */}
      <View style={styles.controlsRow}>
        <TouchableOpacity
          style={[
            styles.ctrlBtn,
            { backgroundColor: colors.background, borderColor: colors.border },
          ]}
          onPress={handleDecrement}
          disabled={currentVal === 0}
        >
          <Ionicons name="remove" size={18} color={colors.text} />
        </TouchableOpacity>

        <AppText variant="caption" color="textSecondary" style={{ fontWeight: '600' }}>
          Arraste na meia-lua para ajustar
        </AppText>

        <TouchableOpacity
          style={[styles.ctrlBtn, { backgroundColor: color, borderColor: color }]}
          onPress={handleIncrement}
          disabled={currentVal >= max}
        >
          <Ionicons name="add" size={18} color="#FFFFFF" />
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    marginVertical: Spacing.xs,
  },
  svgWrapper: {
    width: 220,
    height: 130,
    alignItems: 'center',
    justifyContent: 'flex-start',
    position: 'relative',
  },
  centerTextContainer: {
    position: 'absolute',
    bottom: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  controlsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    width: '100%',
    maxWidth: 240,
    marginTop: Spacing.xs,
  },
  ctrlBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    ...Shadow.sm,
  },
});

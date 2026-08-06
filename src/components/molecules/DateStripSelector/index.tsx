import React from 'react';
import { View, ScrollView, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/hooks/useTheme';
import { AppText } from '@/components/atoms/AppText';
import { Radius, Spacing, Shadow } from '@/constants/theme';

type DateStripSelectorProps = {
  selectedDate: string; // 'YYYY-MM-DD'
  onSelectDate: (dateStr: string) => void;
};

export function DateStripSelector({
  selectedDate,
  onSelectDate,
}: DateStripSelectorProps) {
  const { colors, isDark } = useTheme();

  // Generate 7 days around today: -3, -2, -1, TODAY, +1, +2, +3
  const today = new Date();
  const daysArray = [];

  for (let i = -3; i <= 3; i++) {
    const d = new Date();
    d.setDate(today.getDate() + i);

    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    const dateStr = `${year}-${month}-${day}`;

    const dayName = d
      .toLocaleDateString('pt-BR', { weekday: 'short' })
      .replace('.', '')
      .toUpperCase();
    const dayNumber = d.getDate();
    const isToday = i === 0;

    daysArray.push({
      dateStr,
      dayName,
      dayNumber,
      isToday,
    });
  }

  return (
    <View style={styles.container}>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {daysArray.map((item) => {
          const isSelected = selectedDate === item.dateStr;

          return (
            <TouchableOpacity
              key={item.dateStr}
              onPress={() => onSelectDate(item.dateStr)}
              style={[
                styles.dayCard,
                {
                  backgroundColor: isSelected
                    ? colors.primary
                    : isDark
                    ? colors.surface
                    : '#FFFFFF',
                  borderColor: isSelected
                    ? colors.primary
                    : item.isToday
                    ? colors.primary
                    : colors.border,
                },
              ]}
              activeOpacity={0.7}
            >
              <AppText
                style={{
                  fontSize: 10,
                  fontWeight: '700',
                  color: isSelected
                    ? '#FFFFFF'
                    : item.isToday
                    ? colors.primary
                    : colors.textSecondary,
                }}
              >
                {item.isToday ? 'HOJE' : item.dayName}
              </AppText>

              <AppText
                style={{
                  fontSize: 16,
                  fontWeight: '800',
                  marginTop: 2,
                  color: isSelected ? '#FFFFFF' : colors.text,
                }}
              >
                {item.dayNumber}
              </AppText>
            </TouchableOpacity>
          );
        })}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginVertical: Spacing.sm,
  },
  scrollContent: {
    paddingHorizontal: 2,
    gap: 8,
  },
  dayCard: {
    width: 48,
    height: 56,
    borderRadius: Radius.md,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 4,
    ...Shadow.sm,
  },
});

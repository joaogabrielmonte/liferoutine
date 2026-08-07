import React from 'react';
import { View, StyleSheet, TouchableOpacity } from 'react-native';
import { useTheme } from '@/hooks/useTheme';
import { AppText } from '@/components/atoms/AppText';
import { Radius, Spacing } from '@/constants/theme';
import type { HabitLog } from '@/types/habit';

type HeatmapCalendarProps = {
  logs: HabitLog[];
  totalActiveHabitsCount: number;
  onSelectDay?: (dateKey: string, dayNum: number) => void;
};

export function HeatmapCalendar({ logs, totalActiveHabitsCount, onSelectDay }: HeatmapCalendarProps) {
  const { colors, isDark } = useTheme();

  // Generate days for the current month (e.g. 30 days)
  const today = new Date();
  const year = today.getFullYear();
  const month = today.getMonth();
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  const daysArray = Array.from({ length: daysInMonth }, (_, i) => {
    const dayNum = i + 1;
    const monthStr = String(month + 1).padStart(2, '0');
    const dayStr = String(dayNum).padStart(2, '0');
    const dateKey = `${year}-${monthStr}-${dayStr}`;

    // Find logs for this date
    const dayLogs = logs.filter((l) => l.date === dateKey && l.completedCount > 0);
    const completedCount = dayLogs.length;

    // Calculate intensity 0..4
    let intensity = 0;
    if (totalActiveHabitsCount > 0 && completedCount > 0) {
      const ratio = completedCount / totalActiveHabitsCount;
      if (ratio >= 0.8) intensity = 4;
      else if (ratio >= 0.5) intensity = 3;
      else if (ratio >= 0.25) intensity = 2;
      else intensity = 1;
    }

    return { dayNum, dateKey, intensity, completedCount };
  });

  const getCellColor = (intensity: number) => {
    switch (intensity) {
      case 4:
        return '#22C55E'; // 100% vibrant green
      case 3:
        return '#4ADE80'; // 75% green
      case 2:
        return '#86EFAC'; // 50% light green
      case 1:
        return '#BBF7D0'; // 25% pale green
      default:
        return isDark ? 'rgba(255,255,255,0.06)' : '#F1F5F9';
    }
  };

  const monthName = today.toLocaleString('pt-BR', { month: 'long' });

  return (
    <View style={styles.container}>
      <View style={styles.headerRow}>
        <AppText variant="subtitle" style={{ textTransform: 'capitalize', fontWeight: '700' }}>
          Consistência em {monthName}
        </AppText>
        <AppText variant="caption" color="textSecondary">
          Toque em um dia para ver o histórico
        </AppText>
      </View>

      <View style={styles.grid}>
        {daysArray.map(({ dayNum, dateKey, intensity }) => {
          const bg = getCellColor(intensity);
          const isToday = dayNum === today.getDate();

          return (
            <TouchableOpacity
              key={dayNum}
              style={[
                styles.cell,
                { backgroundColor: bg, borderColor: isToday ? colors.primary : 'transparent' },
                isToday && styles.todayCell,
              ]}
              onPress={() => onSelectDay && onSelectDay(dateKey, dayNum)}
              activeOpacity={0.7}
            >
              <AppText
                style={{
                  fontSize: 11,
                  fontWeight: isToday ? '800' : '700',
                  color: intensity >= 3 ? '#FFFFFF' : colors.text,
                }}
              >
                {dayNum}
              </AppText>
            </TouchableOpacity>
          );
        })}
      </View>

      {/* Legend */}
      <View style={styles.legendRow}>
        <AppText variant="caption" color="textSecondary">
          Menos
        </AppText>
        {[0, 1, 2, 3, 4].map((level) => (
          <View
            key={level}
            style={[styles.legendCell, { backgroundColor: getCellColor(level) }]}
          />
        ))}
        <AppText variant="caption" color="textSecondary">
          Mais
        </AppText>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginVertical: Spacing.xs,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: Spacing.sm,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    justifyContent: 'flex-start',
  },
  cell: {
    width: 38,
    height: 38,
    borderRadius: Radius.sm,
    alignItems: 'center',
    justifyContent: 'center',
  },
  todayCell: {
    borderWidth: 2,
  },
  legendRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    gap: 4,
    marginTop: Spacing.md,
  },
  legendCell: {
    width: 14,
    height: 14,
    borderRadius: 3,
  },
});

import React from 'react';
import {
  StyleSheet, Text, View, ScrollView, Platform,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import Animated, { FadeInDown } from 'react-native-reanimated';
import Colors from '@/constants/colors';
import { useWellness, Mood } from '@/lib/wellness-context';

const MOOD_COLORS: Record<Mood, string> = {
  great: Colors.light.success,
  good: '#8FB996',
  okay: Colors.light.warning,
  low: Colors.light.calm,
  stressed: Colors.light.danger,
};

const MOOD_ICONS: Record<Mood, keyof typeof Ionicons.glyphMap> = {
  great: 'sunny',
  good: 'partly-sunny',
  okay: 'cloudy',
  low: 'rainy',
  stressed: 'thunderstorm',
};

const MOOD_LABELS: Record<Mood, string> = {
  great: 'Great',
  good: 'Good',
  okay: 'Okay',
  low: 'Low',
  stressed: 'Stressed',
};

function BarChart({ data, maxVal }: { data: { label: string; value: number; color: string }[], maxVal: number }) {
  const max = Math.max(maxVal, 1);
  return (
    <View style={styles.chartContainer}>
      {data.map((item, i) => (
        <View key={i} style={styles.barColumn}>
          <View style={styles.barWrapper}>
            <View style={[styles.bar, { height: `${(item.value / max) * 100}%`, backgroundColor: item.color }]} />
          </View>
          <Text style={styles.barLabel}>{item.label}</Text>
        </View>
      ))}
    </View>
  );
}

function MoodDot({ mood, size = 32 }: { mood: Mood; size?: number }) {
  return (
    <View style={[styles.moodDot, { width: size, height: size, backgroundColor: MOOD_COLORS[mood] + '25' }]}>
      <Ionicons name={MOOD_ICONS[mood]} size={size * 0.5} color={MOOD_COLORS[mood]} />
    </View>
  );
}

export default function InsightsScreen() {
  const insets = useSafeAreaInsets();
  const { moodEntries, gemTransactions, gems, breathingCompleted, gamesPlayed, streak, screenSessions } = useWellness();
  const webTopInset = Platform.OS === 'web' ? 67 : 0;

  const last7Days = getLast7Days();
  const moodCounts: Record<Mood, number> = { great: 0, good: 0, okay: 0, low: 0, stressed: 0 };
  moodEntries.forEach(e => { moodCounts[e.mood]++; });

  const moodChartData = (['great', 'good', 'okay', 'low', 'stressed'] as Mood[]).map(m => ({
    label: MOOD_LABELS[m],
    value: moodCounts[m],
    color: MOOD_COLORS[m],
  }));
  const maxMoodCount = Math.max(...Object.values(moodCounts), 1);

  const screenData = last7Days.map(day => {
    const session = screenSessions.find(s => s.date === day.date);
    return {
      label: day.label,
      value: session?.minutes || 0,
      color: Colors.light.mutedBlue || Colors.light.calm,
    };
  });
  const maxScreen = Math.max(...screenData.map(d => d.value), 30);

  const recentGems = gemTransactions.slice(0, 5);

  return (
    <View style={styles.container}>
      <ScrollView
        contentContainerStyle={[
          styles.scrollContent,
          {
            paddingTop: insets.top + webTopInset + 16,
            paddingBottom: Platform.OS === 'web' ? 34 + 84 : 100,
          },
        ]}
        showsVerticalScrollIndicator={false}
      >
        <Animated.View entering={Platform.OS !== 'web' ? FadeInDown.delay(100).duration(500) : undefined}>
          <Text style={styles.title}>Your Insights</Text>
          <Text style={styles.subtitle}>Track your wellness journey</Text>
        </Animated.View>

        <Animated.View entering={Platform.OS !== 'web' ? FadeInDown.delay(200).duration(500) : undefined} style={styles.statsGrid}>
          <View style={styles.statCard}>
            <Ionicons name="diamond" size={22} color={Colors.light.gem} />
            <Text style={styles.statNum}>{gems}</Text>
            <Text style={styles.statLabel}>Gems Earned</Text>
          </View>
          <View style={styles.statCard}>
            <Ionicons name="flame" size={22} color={Colors.light.coral || '#E8927C'} />
            <Text style={styles.statNum}>{streak}</Text>
            <Text style={styles.statLabel}>Day Streak</Text>
          </View>
          <View style={styles.statCard}>
            <Ionicons name="leaf" size={22} color={Colors.light.accent} />
            <Text style={styles.statNum}>{breathingCompleted}</Text>
            <Text style={styles.statLabel}>Breathing</Text>
          </View>
          <View style={styles.statCard}>
            <Ionicons name="game-controller" size={22} color={Colors.light.calm} />
            <Text style={styles.statNum}>{gamesPlayed}</Text>
            <Text style={styles.statLabel}>Games</Text>
          </View>
        </Animated.View>

        <Animated.View entering={Platform.OS !== 'web' ? FadeInDown.delay(300).duration(500) : undefined}>
          <Text style={styles.sectionTitle}>Mood History</Text>
          {moodEntries.length > 0 ? (
            <View style={styles.card}>
              <BarChart data={moodChartData} maxVal={maxMoodCount} />
            </View>
          ) : (
            <View style={styles.emptyCard}>
              <Ionicons name="happy-outline" size={28} color={Colors.light.textSecondary} />
              <Text style={styles.emptyText}>Log your first mood to see trends</Text>
            </View>
          )}
        </Animated.View>

        <Animated.View entering={Platform.OS !== 'web' ? FadeInDown.delay(350).duration(500) : undefined}>
          <Text style={styles.sectionTitle}>Recent Moods</Text>
          {moodEntries.length > 0 ? (
            <View style={styles.card}>
              {moodEntries.slice(0, 5).map(entry => (
                <View key={entry.id} style={styles.moodRow}>
                  <MoodDot mood={entry.mood} />
                  <View style={styles.moodInfo}>
                    <Text style={styles.moodLabel}>{MOOD_LABELS[entry.mood]}</Text>
                    <Text style={styles.moodTime}>{formatTime(entry.timestamp)}</Text>
                  </View>
                  {entry.note ? (
                    <Text style={styles.moodNote} numberOfLines={1}>{entry.note}</Text>
                  ) : null}
                </View>
              ))}
            </View>
          ) : (
            <View style={styles.emptyCard}>
              <Ionicons name="journal-outline" size={28} color={Colors.light.textSecondary} />
              <Text style={styles.emptyText}>No moods logged yet</Text>
            </View>
          )}
        </Animated.View>

        <Animated.View entering={Platform.OS !== 'web' ? FadeInDown.delay(400).duration(500) : undefined}>
          <Text style={styles.sectionTitle}>App Time (minutes)</Text>
          <View style={styles.card}>
            <BarChart data={screenData} maxVal={maxScreen} />
          </View>
          <View style={styles.screenTip}>
            <Ionicons name="information-circle-outline" size={16} color={Colors.light.textSecondary} />
            <Text style={styles.screenTipText}>Time tracked while app is open. Take breaks to earn gems!</Text>
          </View>
        </Animated.View>

        <Animated.View entering={Platform.OS !== 'web' ? FadeInDown.delay(450).duration(500) : undefined}>
          <Text style={styles.sectionTitle}>Recent Gems</Text>
          {recentGems.length > 0 ? (
            <View style={styles.card}>
              {recentGems.map(tx => (
                <View key={tx.id} style={styles.gemRow}>
                  <View style={styles.gemIcon}>
                    <Ionicons name="diamond" size={14} color={Colors.light.gem} />
                  </View>
                  <View style={styles.gemInfo}>
                    <Text style={styles.gemReason}>{tx.reason}</Text>
                    <Text style={styles.gemTime}>{formatTime(tx.timestamp)}</Text>
                  </View>
                  <Text style={styles.gemAmount}>+{tx.amount}</Text>
                </View>
              ))}
            </View>
          ) : (
            <View style={styles.emptyCard}>
              <Ionicons name="diamond-outline" size={28} color={Colors.light.textSecondary} />
              <Text style={styles.emptyText}>Complete activities to earn gems</Text>
            </View>
          )}
        </Animated.View>
      </ScrollView>
    </View>
  );
}

function getLast7Days() {
  const days = [];
  const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  for (let i = 6; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    days.push({
      date: d.toISOString().split('T')[0],
      label: dayNames[d.getDay()],
    });
  }
  return days;
}

function formatTime(ts: number): string {
  const d = new Date(ts);
  const now = new Date();
  const diffMs = now.getTime() - d.getTime();
  const diffMin = Math.floor(diffMs / 60000);
  if (diffMin < 1) return 'Just now';
  if (diffMin < 60) return `${diffMin}m ago`;
  const diffH = Math.floor(diffMin / 60);
  if (diffH < 24) return `${diffH}h ago`;
  const diffD = Math.floor(diffH / 24);
  return `${diffD}d ago`;
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.light.background,
  },
  scrollContent: {
    paddingHorizontal: 20,
  },
  title: {
    fontSize: 28,
    fontFamily: 'Nunito_700Bold',
    color: Colors.light.text,
  },
  subtitle: {
    fontSize: 15,
    fontFamily: 'Nunito_400Regular',
    color: Colors.light.textSecondary,
    marginTop: 4,
    marginBottom: 20,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginBottom: 24,
  },
  statCard: {
    width: '48%' as any,
    flexGrow: 1,
    flexBasis: '45%',
    backgroundColor: Colors.light.card,
    borderRadius: 16,
    padding: 16,
    alignItems: 'center',
    gap: 4,
    borderWidth: 1,
    borderColor: Colors.light.border,
  },
  statNum: {
    fontSize: 24,
    fontFamily: 'Nunito_700Bold',
    color: Colors.light.text,
  },
  statLabel: {
    fontSize: 12,
    fontFamily: 'Nunito_400Regular',
    color: Colors.light.textSecondary,
  },
  sectionTitle: {
    fontSize: 18,
    fontFamily: 'Nunito_700Bold',
    color: Colors.light.text,
    marginBottom: 12,
  },
  card: {
    backgroundColor: Colors.light.card,
    borderRadius: 16,
    padding: 16,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: Colors.light.border,
  },
  emptyCard: {
    backgroundColor: Colors.light.card,
    borderRadius: 16,
    padding: 24,
    marginBottom: 20,
    alignItems: 'center',
    gap: 8,
    borderWidth: 1,
    borderColor: Colors.light.border,
  },
  emptyText: {
    fontSize: 14,
    fontFamily: 'Nunito_500Medium',
    color: Colors.light.textSecondary,
  },
  chartContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-around',
    height: 120,
    gap: 4,
  },
  barColumn: {
    flex: 1,
    alignItems: 'center',
    gap: 4,
  },
  barWrapper: {
    flex: 1,
    width: '100%',
    justifyContent: 'flex-end',
    alignItems: 'center',
  },
  bar: {
    width: '60%',
    minHeight: 4,
    borderRadius: 4,
  },
  barLabel: {
    fontSize: 10,
    fontFamily: 'Nunito_500Medium',
    color: Colors.light.textSecondary,
  },
  moodRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 8,
  },
  moodDot: {
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  moodInfo: {
    flex: 1,
  },
  moodLabel: {
    fontSize: 14,
    fontFamily: 'Nunito_600SemiBold',
    color: Colors.light.text,
  },
  moodTime: {
    fontSize: 11,
    fontFamily: 'Nunito_400Regular',
    color: Colors.light.textSecondary,
  },
  moodNote: {
    fontSize: 12,
    fontFamily: 'Nunito_400Regular',
    color: Colors.light.textSecondary,
    maxWidth: 120,
  },
  screenTip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 20,
    marginTop: -12,
  },
  screenTipText: {
    fontSize: 12,
    fontFamily: 'Nunito_400Regular',
    color: Colors.light.textSecondary,
    flex: 1,
  },
  gemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 8,
  },
  gemIcon: {
    width: 32,
    height: 32,
    borderRadius: 10,
    backgroundColor: Colors.light.gem + '15',
    justifyContent: 'center',
    alignItems: 'center',
  },
  gemInfo: {
    flex: 1,
  },
  gemReason: {
    fontSize: 14,
    fontFamily: 'Nunito_500Medium',
    color: Colors.light.text,
  },
  gemTime: {
    fontSize: 11,
    fontFamily: 'Nunito_400Regular',
    color: Colors.light.textSecondary,
  },
  gemAmount: {
    fontSize: 16,
    fontFamily: 'Nunito_700Bold',
    color: Colors.light.gem,
  },
});

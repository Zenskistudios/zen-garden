import React from 'react';
import {
  StyleSheet, Text, View, ScrollView, Pressable, Platform,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import * as Haptics from 'expo-haptics';
import Animated, {
  FadeInDown, FadeInRight,
} from 'react-native-reanimated';
import Colors from '@/constants/colors';
import { useWellness } from '@/lib/wellness-context';

function GemBadge({ gems }: { gems: number }) {
  return (
    <View style={styles.gemBadge}>
      <Ionicons name="diamond" size={16} color={Colors.light.gem} />
      <Text style={styles.gemCount}>{gems}</Text>
    </View>
  );
}

function QuickAction({ icon, label, color, onPress }: {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  color: string;
  onPress: () => void;
}) {
  return (
    <Pressable
      onPress={() => {
        if (Platform.OS !== 'web') Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        onPress();
      }}
      style={({ pressed }) => [styles.quickAction, { opacity: pressed ? 0.8 : 1, transform: [{ scale: pressed ? 0.96 : 1 }] }]}
    >
      <View style={[styles.quickActionIcon, { backgroundColor: color + '20' }]}>
        <Ionicons name={icon} size={24} color={color} />
      </View>
      <Text style={styles.quickActionLabel}>{label}</Text>
    </Pressable>
  );
}

function ChallengePreview({ title, description, gemReward, completed, icon }: {
  title: string;
  description: string;
  gemReward: number;
  completed: boolean;
  icon: string;
}) {
  return (
    <View style={[styles.challengeItem, completed && styles.challengeCompleted]}>
      <View style={[styles.challengeIcon, completed && styles.challengeIconDone]}>
        <Ionicons
          name={completed ? 'checkmark' : (icon as keyof typeof Ionicons.glyphMap)}
          size={18}
          color={completed ? Colors.light.success : Colors.light.tint}
        />
      </View>
      <View style={styles.challengeText}>
        <Text style={[styles.challengeTitle, completed && styles.challengeTitleDone]}>{title}</Text>
        <Text style={styles.challengeDesc}>{description}</Text>
      </View>
      <View style={styles.challengeGem}>
        <Ionicons name="diamond" size={12} color={Colors.light.gem} />
        <Text style={styles.challengeGemText}>+{gemReward}</Text>
      </View>
    </View>
  );
}

export default function HomeScreen() {
  const insets = useSafeAreaInsets();
  const { gems, streak, challenges, todayMoodLogged, moodEntries, isLoading } = useWellness();
  const webTopInset = Platform.OS === 'web' ? 67 : 0;

  if (isLoading) {
    return (
      <View style={[styles.container, { paddingTop: insets.top + webTopInset }]}>
        <View style={styles.loadingContainer}>
          <Ionicons name="leaf" size={40} color={Colors.light.tint} />
        </View>
      </View>
    );
  }

  const greeting = getGreeting();
  const completedCount = challenges.filter(c => c.completed).length;
  const lastMood = moodEntries.length > 0 ? moodEntries[0] : null;

  return (
    <View style={styles.container}>
      <ScrollView
        contentContainerStyle={[
          styles.scrollContent,
          {
            paddingTop: insets.top + webTopInset + 16,
            paddingBottom: Platform.OS === 'web' ? 34 + 84 : 100,
          }
        ]}
        showsVerticalScrollIndicator={false}
      >
        <Animated.View entering={Platform.OS !== 'web' ? FadeInDown.delay(100).duration(600) : undefined} style={styles.header}>
          <View>
            <Text style={styles.greeting}>{greeting}</Text>
            <Text style={styles.subtitle}>How are you feeling?</Text>
          </View>
          <GemBadge gems={gems} />
        </Animated.View>

        <Animated.View entering={Platform.OS !== 'web' ? FadeInDown.delay(200).duration(600) : undefined}>
          <LinearGradient
            colors={['#A8D5BA', '#8FB996']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.streakCard}
          >
            <View style={styles.streakLeft}>
              <Ionicons name="flame" size={28} color="#FFF" />
              <View>
                <Text style={styles.streakNumber}>{streak} day streak</Text>
                <Text style={styles.streakLabel}>Keep going, you're doing great</Text>
              </View>
            </View>
            {lastMood && (
              <View style={styles.lastMoodChip}>
                <Text style={styles.lastMoodText}>
                  {getMoodLabel(lastMood.mood)}
                </Text>
              </View>
            )}
          </LinearGradient>
        </Animated.View>

        {!todayMoodLogged && (
          <Animated.View entering={Platform.OS !== 'web' ? FadeInDown.delay(300).duration(600) : undefined}>
            <Pressable
              onPress={() => {
                if (Platform.OS !== 'web') Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                router.push('/mood');
              }}
              style={({ pressed }) => [styles.moodPrompt, { opacity: pressed ? 0.9 : 1, transform: [{ scale: pressed ? 0.98 : 1 }] }]}
            >
              <LinearGradient
                colors={['#B8A9C9', '#A89BBF']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.moodPromptGradient}
              >
                <Ionicons name="happy-outline" size={32} color="#FFF" />
                <View style={styles.moodPromptText}>
                  <Text style={styles.moodPromptTitle}>Mood Check-In</Text>
                  <Text style={styles.moodPromptSub}>Take a moment to reflect</Text>
                </View>
                <View style={styles.moodPromptGem}>
                  <Ionicons name="diamond" size={14} color={Colors.light.gemShimmer} />
                  <Text style={styles.moodPromptGemText}>+10</Text>
                </View>
              </LinearGradient>
            </Pressable>
          </Animated.View>
        )}

        <Animated.View entering={Platform.OS !== 'web' ? FadeInDown.delay(400).duration(600) : undefined}>
          <Text style={styles.sectionTitle}>Quick Actions</Text>
          <View style={styles.quickActionsRow}>
            <QuickAction icon="leaf" label="Breathe" color={Colors.light.tint} onPress={() => router.push('/(tabs)/breathe')} />
            <QuickAction icon="water" label="Bubbles" color={Colors.light.calm} onPress={() => router.push('/bubble-game')} />
            <QuickAction icon="color-palette" label="Colors" color={Colors.light.accentSecondary} onPress={() => router.push('/color-match')} />
            <QuickAction icon="trophy" label="Challenges" color={Colors.light.gem} onPress={() => router.push('/challenges')} />
          </View>
        </Animated.View>

        <Animated.View entering={Platform.OS !== 'web' ? FadeInDown.delay(500).duration(600) : undefined}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Today's Challenges</Text>
            <Text style={styles.sectionBadge}>{completedCount}/{challenges.length}</Text>
          </View>
          <View style={styles.challengesList}>
            {challenges.slice(0, 3).map((c) => (
              <ChallengePreview
                key={c.id}
                title={c.title}
                description={c.description}
                gemReward={c.gemReward}
                completed={c.completed}
                icon={c.icon}
              />
            ))}
            {challenges.length > 3 && (
              <Pressable
                onPress={() => router.push('/challenges')}
                style={({ pressed }) => [styles.seeAllBtn, { opacity: pressed ? 0.7 : 1 }]}
              >
                <Text style={styles.seeAllText}>See all challenges</Text>
                <Ionicons name="chevron-forward" size={16} color={Colors.light.tint} />
              </Pressable>
            )}
          </View>
        </Animated.View>

        <Animated.View entering={Platform.OS !== 'web' ? FadeInRight.delay(600).duration(600) : undefined}>
          <View style={styles.tipCard}>
            <Ionicons name="bulb-outline" size={20} color={Colors.light.gem} />
            <Text style={styles.tipText}>
              {getWellnessTip()}
            </Text>
          </View>
        </Animated.View>
      </ScrollView>
    </View>
  );
}

function getGreeting(): string {
  const hour = new Date().getHours();
  if (hour < 12) return 'Good morning';
  if (hour < 17) return 'Good afternoon';
  return 'Good evening';
}

function getMoodLabel(mood: string): string {
  const labels: Record<string, string> = {
    great: 'Feeling great',
    good: 'Feeling good',
    okay: 'Feeling okay',
    low: 'Feeling low',
    stressed: 'Stressed',
  };
  return labels[mood] || mood;
}

function getWellnessTip(): string {
  const tips = [
    'Taking short breaks throughout the day can boost your focus and mood.',
    'Deep breathing activates your body\'s natural relaxation response.',
    'Even 5 minutes of mindfulness can reduce stress and anxiety.',
    'Drinking water regularly helps your brain function at its best.',
    'A short walk can improve creativity and lift your spirits.',
    'Screen breaks every 20 minutes help reduce eye strain.',
  ];
  const idx = Math.floor(Date.now() / (1000 * 60 * 60)) % tips.length;
  return tips[idx];
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.light.background,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  scrollContent: {
    paddingHorizontal: 20,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  greeting: {
    fontSize: 28,
    fontFamily: 'Nunito_700Bold',
    color: Colors.light.text,
  },
  subtitle: {
    fontSize: 15,
    fontFamily: 'Nunito_400Regular',
    color: Colors.light.textSecondary,
    marginTop: 2,
  },
  gemBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.light.card,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    gap: 6,
    borderWidth: 1,
    borderColor: Colors.light.border,
  },
  gemCount: {
    fontSize: 16,
    fontFamily: 'Nunito_700Bold',
    color: Colors.light.gem,
  },
  streakCard: {
    borderRadius: 20,
    padding: 20,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  streakLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  streakNumber: {
    fontSize: 18,
    fontFamily: 'Nunito_700Bold',
    color: '#FFF',
  },
  streakLabel: {
    fontSize: 13,
    fontFamily: 'Nunito_400Regular',
    color: 'rgba(255,255,255,0.85)',
  },
  lastMoodChip: {
    backgroundColor: 'rgba(255,255,255,0.25)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  lastMoodText: {
    fontSize: 12,
    fontFamily: 'Nunito_600SemiBold',
    color: '#FFF',
  },
  moodPrompt: {
    marginBottom: 20,
  },
  moodPromptGradient: {
    borderRadius: 20,
    padding: 20,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  moodPromptText: {
    flex: 1,
  },
  moodPromptTitle: {
    fontSize: 17,
    fontFamily: 'Nunito_700Bold',
    color: '#FFF',
  },
  moodPromptSub: {
    fontSize: 13,
    fontFamily: 'Nunito_400Regular',
    color: 'rgba(255,255,255,0.85)',
  },
  moodPromptGem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(255,255,255,0.2)',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 10,
  },
  moodPromptGemText: {
    fontSize: 13,
    fontFamily: 'Nunito_700Bold',
    color: '#FFF',
  },
  sectionTitle: {
    fontSize: 18,
    fontFamily: 'Nunito_700Bold',
    color: Colors.light.text,
    marginBottom: 12,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  sectionBadge: {
    fontSize: 14,
    fontFamily: 'Nunito_600SemiBold',
    color: Colors.light.tint,
    backgroundColor: Colors.light.tint + '15',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 10,
    marginBottom: 12,
  },
  quickActionsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 24,
    gap: 10,
  },
  quickAction: {
    flex: 1,
    alignItems: 'center',
    gap: 8,
  },
  quickActionIcon: {
    width: 56,
    height: 56,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
  },
  quickActionLabel: {
    fontSize: 12,
    fontFamily: 'Nunito_600SemiBold',
    color: Colors.light.textSecondary,
  },
  challengesList: {
    backgroundColor: Colors.light.card,
    borderRadius: 16,
    padding: 4,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: Colors.light.border,
  },
  challengeItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    gap: 12,
  },
  challengeCompleted: {
    opacity: 0.6,
  },
  challengeIcon: {
    width: 36,
    height: 36,
    borderRadius: 12,
    backgroundColor: Colors.light.tint + '15',
    justifyContent: 'center',
    alignItems: 'center',
  },
  challengeIconDone: {
    backgroundColor: Colors.light.success + '20',
  },
  challengeText: {
    flex: 1,
  },
  challengeTitle: {
    fontSize: 15,
    fontFamily: 'Nunito_600SemiBold',
    color: Colors.light.text,
  },
  challengeTitleDone: {
    textDecorationLine: 'line-through',
  },
  challengeDesc: {
    fontSize: 12,
    fontFamily: 'Nunito_400Regular',
    color: Colors.light.textSecondary,
  },
  challengeGem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  challengeGemText: {
    fontSize: 13,
    fontFamily: 'Nunito_600SemiBold',
    color: Colors.light.gem,
  },
  seeAllBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 12,
    gap: 4,
  },
  seeAllText: {
    fontSize: 14,
    fontFamily: 'Nunito_600SemiBold',
    color: Colors.light.tint,
  },
  tipCard: {
    backgroundColor: Colors.light.gem + '10',
    borderRadius: 16,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    borderWidth: 1,
    borderColor: Colors.light.gem + '20',
    marginBottom: 20,
  },
  tipText: {
    flex: 1,
    fontSize: 14,
    fontFamily: 'Nunito_500Medium',
    color: Colors.light.textSecondary,
    lineHeight: 20,
  },
});

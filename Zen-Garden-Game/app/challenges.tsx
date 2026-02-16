import React, { useState } from 'react';
import {
  StyleSheet, Text, View, ScrollView, Pressable, Platform, TextInput,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import * as Haptics from 'expo-haptics';
import Animated, { FadeInDown } from 'react-native-reanimated';
import Colors from '@/constants/colors';
import { useWellness } from '@/lib/wellness-context';

export default function ChallengesScreen() {
  const insets = useSafeAreaInsets();
  const { challenges, completeChallenge, addGems } = useWellness();
  const [gratitudeNote, setGratitudeNote] = useState('');
  const [showGratitude, setShowGratitude] = useState(false);
  const [breakTimer, setBreakTimer] = useState<number | null>(null);
  const [breakTimeLeft, setBreakTimeLeft] = useState(0);

  const completedCount = challenges.filter(c => c.completed).length;
  const totalGems = challenges.reduce((sum, c) => sum + c.gemReward, 0);

  function handleChallengePress(id: string) {
    const challenge = challenges.find(c => c.id === id);
    if (!challenge || challenge.completed) return;

    if (id === 'c1') {
      router.push('/mood');
      return;
    }
    if (id === 'c2') {
      router.push('/(tabs)/breathe');
      return;
    }
    if (id === 'c3') {
      router.push('/bubble-game');
      return;
    }
    if (id === 'c4') {
      startBreakTimer();
      return;
    }
    if (id === 'c5') {
      setShowGratitude(true);
      return;
    }
  }

  function startBreakTimer() {
    if (Platform.OS !== 'web') Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setBreakTimeLeft(300);
    const timer = setInterval(() => {
      setBreakTimeLeft(prev => {
        if (prev <= 1) {
          clearInterval(timer);
          setBreakTimer(null);
          completeChallenge('c4');
          if (Platform.OS !== 'web') Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
          return 0;
        }
        return prev - 1;
      });
    }, 1000) as unknown as number;
    setBreakTimer(timer);
  }

  function submitGratitude() {
    if (!gratitudeNote.trim()) return;
    if (Platform.OS !== 'web') Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    completeChallenge('c5');
    setShowGratitude(false);
    setGratitudeNote('');
  }

  function formatBreakTime(seconds: number): string {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s.toString().padStart(2, '0')}`;
  }

  const categoryColors: Record<string, string> = {
    break: Colors.light.coral || '#E8927C',
    breathe: Colors.light.accent,
    play: Colors.light.calm,
    mindful: Colors.light.accentSecondary,
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top + 12, paddingBottom: insets.bottom + 20 }]}>
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} style={styles.closeBtn}>
          <Ionicons name="close" size={24} color={Colors.light.textSecondary} />
        </Pressable>
        <Text style={styles.headerTitle}>Daily Challenges</Text>
        <View style={styles.progressBadge}>
          <Text style={styles.progressText}>{completedCount}/{challenges.length}</Text>
        </View>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        <Animated.View entering={Platform.OS !== 'web' ? FadeInDown.delay(100).duration(500) : undefined} style={styles.progressCard}>
          <View style={styles.progressBar}>
            <View style={[styles.progressFill, { width: `${(completedCount / challenges.length) * 100}%` }]} />
          </View>
          <Text style={styles.progressLabel}>
            {completedCount === challenges.length
              ? 'All challenges complete! Amazing!'
              : `${challenges.length - completedCount} challenges remaining`}
          </Text>
          <View style={styles.progressGem}>
            <Ionicons name="diamond" size={14} color={Colors.light.gem} />
            <Text style={styles.progressGemText}>{totalGems} gems available</Text>
          </View>
        </Animated.View>

        {breakTimer !== null && (
          <Animated.View entering={Platform.OS !== 'web' ? FadeInDown.duration(400) : undefined} style={styles.breakCard}>
            <Ionicons name="pause-circle" size={32} color={Colors.light.tint} />
            <View>
              <Text style={styles.breakTitle}>Screen Break Active</Text>
              <Text style={styles.breakTime}>{formatBreakTime(breakTimeLeft)}</Text>
            </View>
            <Text style={styles.breakHint}>Put your phone down and relax</Text>
          </Animated.View>
        )}

        {showGratitude && (
          <Animated.View entering={Platform.OS !== 'web' ? FadeInDown.duration(400) : undefined} style={styles.gratitudeCard}>
            <Text style={styles.gratitudeTitle}>What are you grateful for?</Text>
            <TextInput
              value={gratitudeNote}
              onChangeText={setGratitudeNote}
              placeholder="Today I'm grateful for..."
              placeholderTextColor={Colors.light.textSecondary + '80'}
              style={styles.gratitudeInput}
              multiline
              maxLength={200}
            />
            <Pressable
              onPress={submitGratitude}
              disabled={!gratitudeNote.trim()}
              style={({ pressed }) => [
                styles.gratitudeBtn,
                !gratitudeNote.trim() && { opacity: 0.4 },
                { opacity: pressed && gratitudeNote.trim() ? 0.9 : gratitudeNote.trim() ? 1 : 0.4 },
              ]}
            >
              <Ionicons name="checkmark" size={18} color="#FFF" />
              <Text style={styles.gratitudeBtnText}>Save</Text>
            </Pressable>
          </Animated.View>
        )}

        {challenges.map((challenge, i) => (
          <Animated.View
            key={challenge.id}
            entering={Platform.OS !== 'web' ? FadeInDown.delay(200 + i * 80).duration(400) : undefined}
          >
            <Pressable
              onPress={() => handleChallengePress(challenge.id)}
              disabled={challenge.completed}
              style={({ pressed }) => [
                styles.challengeCard,
                challenge.completed && styles.challengeCardDone,
                { opacity: pressed && !challenge.completed ? 0.9 : 1, transform: [{ scale: pressed && !challenge.completed ? 0.98 : 1 }] },
              ]}
            >
              <View style={[styles.challengeIconWrap, { backgroundColor: (categoryColors[challenge.category] || Colors.light.tint) + '15' }]}>
                <Ionicons
                  name={challenge.completed ? 'checkmark' : (challenge.icon as keyof typeof Ionicons.glyphMap)}
                  size={22}
                  color={challenge.completed ? Colors.light.success : categoryColors[challenge.category] || Colors.light.tint}
                />
              </View>
              <View style={styles.challengeInfo}>
                <Text style={[styles.challengeName, challenge.completed && styles.challengeNameDone]}>{challenge.title}</Text>
                <Text style={styles.challengeDesc}>{challenge.description}</Text>
              </View>
              <View style={styles.challengeRight}>
                <View style={styles.challengeGem}>
                  <Ionicons name="diamond" size={12} color={challenge.completed ? Colors.light.success : Colors.light.gem} />
                  <Text style={[styles.challengeGemText, challenge.completed && { color: Colors.light.success }]}>
                    {challenge.completed ? 'Done' : `+${challenge.gemReward}`}
                  </Text>
                </View>
                {!challenge.completed && (
                  <Ionicons name="chevron-forward" size={16} color={Colors.light.textSecondary + '60'} />
                )}
              </View>
            </Pressable>
          </Animated.View>
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.light.background,
    paddingHorizontal: 20,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  closeBtn: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontFamily: 'Nunito_700Bold',
    color: Colors.light.text,
  },
  progressBadge: {
    backgroundColor: Colors.light.tint + '15',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  progressText: {
    fontSize: 14,
    fontFamily: 'Nunito_700Bold',
    color: Colors.light.tint,
  },
  scrollContent: {
    paddingBottom: 40,
  },
  progressCard: {
    backgroundColor: Colors.light.card,
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: Colors.light.border,
    gap: 10,
  },
  progressBar: {
    height: 8,
    backgroundColor: Colors.light.overlay,
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: Colors.light.tint,
    borderRadius: 4,
  },
  progressLabel: {
    fontSize: 14,
    fontFamily: 'Nunito_500Medium',
    color: Colors.light.textSecondary,
  },
  progressGem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  progressGemText: {
    fontSize: 13,
    fontFamily: 'Nunito_600SemiBold',
    color: Colors.light.gem,
  },
  breakCard: {
    backgroundColor: Colors.light.tint + '10',
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    alignItems: 'center',
    gap: 8,
    borderWidth: 1,
    borderColor: Colors.light.tint + '20',
  },
  breakTitle: {
    fontSize: 16,
    fontFamily: 'Nunito_700Bold',
    color: Colors.light.tint,
    textAlign: 'center',
  },
  breakTime: {
    fontSize: 36,
    fontFamily: 'Nunito_700Bold',
    color: Colors.light.tint,
    textAlign: 'center',
  },
  breakHint: {
    fontSize: 13,
    fontFamily: 'Nunito_400Regular',
    color: Colors.light.textSecondary,
  },
  gratitudeCard: {
    backgroundColor: Colors.light.card,
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    gap: 12,
    borderWidth: 1,
    borderColor: Colors.light.border,
  },
  gratitudeTitle: {
    fontSize: 16,
    fontFamily: 'Nunito_700Bold',
    color: Colors.light.text,
  },
  gratitudeInput: {
    backgroundColor: Colors.light.background,
    borderRadius: 12,
    padding: 14,
    fontSize: 15,
    fontFamily: 'Nunito_400Regular',
    color: Colors.light.text,
    minHeight: 80,
    textAlignVertical: 'top',
    borderWidth: 1,
    borderColor: Colors.light.border,
  },
  gratitudeBtn: {
    backgroundColor: Colors.light.tint,
    borderRadius: 14,
    paddingVertical: 12,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 6,
  },
  gratitudeBtnText: {
    fontSize: 15,
    fontFamily: 'Nunito_700Bold',
    color: '#FFF',
  },
  challengeCard: {
    backgroundColor: Colors.light.card,
    borderRadius: 16,
    padding: 16,
    marginBottom: 10,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    borderWidth: 1,
    borderColor: Colors.light.border,
  },
  challengeCardDone: {
    opacity: 0.6,
  },
  challengeIconWrap: {
    width: 44,
    height: 44,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
  },
  challengeInfo: {
    flex: 1,
    gap: 2,
  },
  challengeName: {
    fontSize: 15,
    fontFamily: 'Nunito_600SemiBold',
    color: Colors.light.text,
  },
  challengeNameDone: {
    textDecorationLine: 'line-through',
  },
  challengeDesc: {
    fontSize: 12,
    fontFamily: 'Nunito_400Regular',
    color: Colors.light.textSecondary,
  },
  challengeRight: {
    alignItems: 'flex-end',
    gap: 4,
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
});

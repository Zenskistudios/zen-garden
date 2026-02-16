import React, { useState } from 'react';
import {
  StyleSheet, Text, View, Pressable, TextInput, Platform, KeyboardAvoidingView,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import * as Haptics from 'expo-haptics';
import Animated, { FadeInDown, FadeInUp } from 'react-native-reanimated';
import Colors from '@/constants/colors';
import { useWellness, Mood } from '@/lib/wellness-context';

const MOODS: { mood: Mood; icon: keyof typeof Ionicons.glyphMap; label: string; color: string }[] = [
  { mood: 'great', icon: 'sunny', label: 'Great', color: Colors.light.success },
  { mood: 'good', icon: 'partly-sunny', label: 'Good', color: '#8FB996' },
  { mood: 'okay', icon: 'cloudy', label: 'Okay', color: Colors.light.warning },
  { mood: 'low', icon: 'rainy', label: 'Low', color: Colors.light.calm },
  { mood: 'stressed', icon: 'thunderstorm', label: 'Stressed', color: Colors.light.danger },
];

export default function MoodScreen() {
  const insets = useSafeAreaInsets();
  const { logMood } = useWellness();
  const [selected, setSelected] = useState<Mood | null>(null);
  const [note, setNote] = useState('');
  const [submitted, setSubmitted] = useState(false);

  function handleSubmit() {
    if (!selected) return;
    if (Platform.OS !== 'web') Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    logMood(selected, note);
    setSubmitted(true);
    setTimeout(() => router.back(), 1500);
  }

  if (submitted) {
    return (
      <View style={[styles.container, { paddingTop: insets.top + 20 }]}>
        <Animated.View entering={Platform.OS !== 'web' ? FadeInUp.duration(600) : undefined} style={styles.doneContainer}>
          <View style={styles.doneCircle}>
            <Ionicons name="checkmark" size={40} color={Colors.light.success} />
          </View>
          <Text style={styles.doneTitle}>Thank you</Text>
          <Text style={styles.doneSubtitle}>You earned 10 gems for checking in</Text>
          <View style={styles.doneGemRow}>
            <Ionicons name="diamond" size={18} color={Colors.light.gem} />
            <Text style={styles.doneGemText}>+10</Text>
          </View>
        </Animated.View>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <View style={[styles.content, { paddingTop: insets.top + 12, paddingBottom: insets.bottom + 20 }]}>
        <View style={styles.header}>
          <Pressable onPress={() => router.back()} style={styles.closeBtn}>
            <Ionicons name="close" size={24} color={Colors.light.textSecondary} />
          </Pressable>
        </View>

        <Animated.View entering={Platform.OS !== 'web' ? FadeInDown.delay(100).duration(500) : undefined}>
          <Text style={styles.title}>How are you feeling?</Text>
          <Text style={styles.subtitle}>Take a moment to check in with yourself</Text>
        </Animated.View>

        <Animated.View entering={Platform.OS !== 'web' ? FadeInDown.delay(200).duration(500) : undefined} style={styles.moodsRow}>
          {MOODS.map((m) => (
            <Pressable
              key={m.mood}
              onPress={() => {
                setSelected(m.mood);
                if (Platform.OS !== 'web') Haptics.selectionAsync();
              }}
              style={[
                styles.moodOption,
                selected === m.mood && { backgroundColor: m.color + '20', borderColor: m.color },
              ]}
            >
              <Ionicons
                name={m.icon}
                size={32}
                color={selected === m.mood ? m.color : Colors.light.textSecondary}
              />
              <Text style={[
                styles.moodLabel,
                selected === m.mood && { color: m.color },
              ]}>{m.label}</Text>
            </Pressable>
          ))}
        </Animated.View>

        <Animated.View entering={Platform.OS !== 'web' ? FadeInDown.delay(300).duration(500) : undefined} style={styles.noteSection}>
          <Text style={styles.noteLabel}>Want to add a note? (optional)</Text>
          <TextInput
            value={note}
            onChangeText={setNote}
            placeholder="What's on your mind..."
            placeholderTextColor={Colors.light.textSecondary + '80'}
            style={styles.noteInput}
            multiline
            maxLength={200}
          />
        </Animated.View>

        <View style={styles.bottomArea}>
          <Pressable
            onPress={handleSubmit}
            disabled={!selected}
            style={({ pressed }) => [
              styles.submitBtn,
              !selected && styles.submitBtnDisabled,
              { opacity: pressed && selected ? 0.9 : 1, transform: [{ scale: pressed && selected ? 0.97 : 1 }] },
            ]}
          >
            <Ionicons name="checkmark" size={20} color="#FFF" />
            <Text style={styles.submitBtnText}>Log Mood</Text>
            <View style={styles.submitGem}>
              <Ionicons name="diamond" size={12} color={Colors.light.gemShimmer} />
              <Text style={styles.submitGemText}>+10</Text>
            </View>
          </Pressable>
        </View>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.light.background,
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginBottom: 12,
  },
  closeBtn: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    fontSize: 26,
    fontFamily: 'Nunito_700Bold',
    color: Colors.light.text,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 15,
    fontFamily: 'Nunito_400Regular',
    color: Colors.light.textSecondary,
    textAlign: 'center',
    marginTop: 6,
    marginBottom: 32,
  },
  moodsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 8,
    marginBottom: 32,
  },
  moodOption: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 16,
    borderRadius: 16,
    borderWidth: 2,
    borderColor: Colors.light.border,
    gap: 6,
  },
  moodLabel: {
    fontSize: 11,
    fontFamily: 'Nunito_600SemiBold',
    color: Colors.light.textSecondary,
  },
  noteSection: {
    marginBottom: 24,
  },
  noteLabel: {
    fontSize: 14,
    fontFamily: 'Nunito_600SemiBold',
    color: Colors.light.text,
    marginBottom: 8,
  },
  noteInput: {
    backgroundColor: Colors.light.card,
    borderRadius: 14,
    padding: 16,
    fontSize: 15,
    fontFamily: 'Nunito_400Regular',
    color: Colors.light.text,
    minHeight: 100,
    textAlignVertical: 'top',
    borderWidth: 1,
    borderColor: Colors.light.border,
  },
  bottomArea: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  submitBtn: {
    backgroundColor: Colors.light.tint,
    borderRadius: 24,
    paddingVertical: 16,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
  },
  submitBtnDisabled: {
    opacity: 0.4,
  },
  submitBtnText: {
    fontSize: 17,
    fontFamily: 'Nunito_700Bold',
    color: '#FFF',
  },
  submitGem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    backgroundColor: 'rgba(255,255,255,0.2)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
  },
  submitGemText: {
    fontSize: 12,
    fontFamily: 'Nunito_700Bold',
    color: '#FFF',
  },
  doneContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 12,
  },
  doneCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: Colors.light.success + '15',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  doneTitle: {
    fontSize: 24,
    fontFamily: 'Nunito_700Bold',
    color: Colors.light.text,
  },
  doneSubtitle: {
    fontSize: 15,
    fontFamily: 'Nunito_400Regular',
    color: Colors.light.textSecondary,
  },
  doneGemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 4,
  },
  doneGemText: {
    fontSize: 20,
    fontFamily: 'Nunito_700Bold',
    color: Colors.light.gem,
  },
});

import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  StyleSheet, Text, View, Pressable, Platform,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import Animated, {
  useSharedValue, useAnimatedStyle, withTiming, withRepeat, withSequence,
  Easing, FadeInDown, runOnJS,
} from 'react-native-reanimated';
import Colors from '@/constants/colors';
import { useWellness } from '@/lib/wellness-context';

type BreathPhase = 'idle' | 'inhale' | 'hold' | 'exhale' | 'done';

const PATTERNS = [
  { name: 'Calm', inhale: 4, hold: 4, exhale: 4, cycles: 4, color: '#8FB996' },
  { name: 'Relax', inhale: 4, hold: 7, exhale: 8, cycles: 3, color: '#7BA7BC' },
  { name: 'Focus', inhale: 5, hold: 5, exhale: 5, cycles: 4, color: '#B8A9C9' },
];

export default function BreatheScreen() {
  const insets = useSafeAreaInsets();
  const { addGems, incrementBreathing, completeChallenge, breathingCompleted } = useWellness();
  const webTopInset = Platform.OS === 'web' ? 67 : 0;

  const [selectedPattern, setSelectedPattern] = useState(0);
  const [phase, setPhase] = useState<BreathPhase>('idle');
  const [currentCycle, setCurrentCycle] = useState(0);
  const [timeLeft, setTimeLeft] = useState(0);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const phaseRef = useRef<BreathPhase>('idle');
  const cycleRef = useRef(0);

  const circleScale = useSharedValue(0.6);
  const circleOpacity = useSharedValue(0.4);
  const pulseScale = useSharedValue(1);

  const pattern = PATTERNS[selectedPattern];

  const animatedCircle = useAnimatedStyle(() => ({
    transform: [{ scale: circleScale.value }],
    opacity: circleOpacity.value,
  }));

  const animatedPulse = useAnimatedStyle(() => ({
    transform: [{ scale: pulseScale.value }],
  }));

  const handlePhaseComplete = useCallback((nextPhase: BreathPhase, cycleNum: number) => {
    if (nextPhase === 'done') {
      setPhase('done');
      phaseRef.current = 'done';
      circleScale.value = withTiming(0.6, { duration: 800 });
      circleOpacity.value = withTiming(0.4, { duration: 800 });
      addGems(15, 'Breathing exercise');
      incrementBreathing();
      completeChallenge('c2');
      return;
    }
    setPhase(nextPhase);
    phaseRef.current = nextPhase;
    startPhaseAnimation(nextPhase, cycleNum);
  }, []);

  function startPhaseAnimation(p: BreathPhase, cycleNum: number) {
    const pat = PATTERNS[selectedPattern];
    let duration = 0;

    if (p === 'inhale') {
      duration = pat.inhale;
      circleScale.value = withTiming(1.0, { duration: duration * 1000, easing: Easing.inOut(Easing.ease) });
      circleOpacity.value = withTiming(0.8, { duration: duration * 1000, easing: Easing.inOut(Easing.ease) });
    } else if (p === 'hold') {
      duration = pat.hold;
      pulseScale.value = withRepeat(
        withSequence(
          withTiming(1.02, { duration: 500 }),
          withTiming(1.0, { duration: 500 })
        ),
        Math.ceil(duration),
        true
      );
    } else if (p === 'exhale') {
      duration = pat.exhale;
      circleScale.value = withTiming(0.6, { duration: duration * 1000, easing: Easing.inOut(Easing.ease) });
      circleOpacity.value = withTiming(0.4, { duration: duration * 1000, easing: Easing.inOut(Easing.ease) });
    }

    setTimeLeft(duration);
    if (timerRef.current) clearInterval(timerRef.current);

    let remaining = duration;
    timerRef.current = setInterval(() => {
      remaining -= 1;
      if (remaining <= 0) {
        if (timerRef.current) clearInterval(timerRef.current);
        const currentPhase = phaseRef.current;
        const currentCycleNum = cycleRef.current;
        if (currentPhase === 'inhale') {
          handlePhaseComplete('hold', currentCycleNum);
        } else if (currentPhase === 'hold') {
          handlePhaseComplete('exhale', currentCycleNum);
        } else if (currentPhase === 'exhale') {
          const newCycle = currentCycleNum + 1;
          cycleRef.current = newCycle;
          setCurrentCycle(newCycle);
          if (newCycle >= pat.cycles) {
            handlePhaseComplete('done', newCycle);
          } else {
            handlePhaseComplete('inhale', newCycle);
          }
        }
      } else {
        setTimeLeft(remaining);
      }
    }, 1000);
  }

  function startBreathing() {
    if (Platform.OS !== 'web') Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setCurrentCycle(0);
    cycleRef.current = 0;
    setPhase('inhale');
    phaseRef.current = 'inhale';
    startPhaseAnimation('inhale', 0);
  }

  function stopBreathing() {
    if (timerRef.current) clearInterval(timerRef.current);
    setPhase('idle');
    phaseRef.current = 'idle';
    setCurrentCycle(0);
    cycleRef.current = 0;
    circleScale.value = withTiming(0.6, { duration: 600 });
    circleOpacity.value = withTiming(0.4, { duration: 600 });
  }

  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, []);

  const phaseLabel = phase === 'inhale' ? 'Breathe In' : phase === 'hold' ? 'Hold' : phase === 'exhale' ? 'Breathe Out' : phase === 'done' ? 'Well Done' : 'Ready?';

  return (
    <View style={styles.container}>
      <View style={[styles.content, { paddingTop: insets.top + webTopInset + 16, paddingBottom: Platform.OS === 'web' ? 34 + 84 : 100 }]}>
        <Animated.View entering={Platform.OS !== 'web' ? FadeInDown.delay(100).duration(500) : undefined}>
          <Text style={styles.title}>Breathing</Text>
          <Text style={styles.subtitle}>Find your calm</Text>
        </Animated.View>

        {phase === 'idle' && (
          <Animated.View entering={Platform.OS !== 'web' ? FadeInDown.delay(200).duration(500) : undefined} style={styles.patternsRow}>
            {PATTERNS.map((p, i) => (
              <Pressable
                key={p.name}
                onPress={() => {
                  setSelectedPattern(i);
                  if (Platform.OS !== 'web') Haptics.selectionAsync();
                }}
                style={[styles.patternChip, selectedPattern === i && { backgroundColor: p.color + '25', borderColor: p.color }]}
              >
                <Text style={[styles.patternName, selectedPattern === i && { color: p.color }]}>{p.name}</Text>
                <Text style={styles.patternDetail}>{p.inhale}-{p.hold}-{p.exhale}</Text>
              </Pressable>
            ))}
          </Animated.View>
        )}

        <View style={styles.circleContainer}>
          <Animated.View style={[styles.pulseRing, animatedPulse, { borderColor: pattern.color + '30' }]} />
          <Animated.View style={[styles.breathCircle, animatedCircle, { backgroundColor: pattern.color + '40', borderColor: pattern.color }]}>
            <Text style={[styles.phaseLabel, { color: pattern.color }]}>{phaseLabel}</Text>
            {(phase === 'inhale' || phase === 'hold' || phase === 'exhale') && (
              <Text style={[styles.timerText, { color: pattern.color }]}>{timeLeft}</Text>
            )}
            {phase === 'done' && (
              <View style={styles.doneRow}>
                <Ionicons name="diamond" size={16} color={Colors.light.gem} />
                <Text style={styles.doneGems}>+15 gems</Text>
              </View>
            )}
          </Animated.View>
        </View>

        {(phase === 'inhale' || phase === 'hold' || phase === 'exhale') && (
          <Text style={styles.cycleText}>
            Cycle {currentCycle + 1} of {pattern.cycles}
          </Text>
        )}

        <View style={styles.bottomActions}>
          {phase === 'idle' || phase === 'done' ? (
            <Pressable
              onPress={startBreathing}
              style={({ pressed }) => [styles.startBtn, { backgroundColor: pattern.color, opacity: pressed ? 0.9 : 1, transform: [{ scale: pressed ? 0.97 : 1 }] }]}
            >
              <Text style={styles.startBtnText}>{phase === 'done' ? 'Again' : 'Begin'}</Text>
            </Pressable>
          ) : (
            <Pressable
              onPress={stopBreathing}
              style={({ pressed }) => [styles.stopBtn, { opacity: pressed ? 0.8 : 1 }]}
            >
              <Ionicons name="close" size={20} color={Colors.light.textSecondary} />
              <Text style={styles.stopBtnText}>Stop</Text>
            </Pressable>
          )}
        </View>

        <View style={styles.sessionCount}>
          <Ionicons name="leaf" size={16} color={Colors.light.accent} />
          <Text style={styles.sessionText}>{breathingCompleted} sessions completed</Text>
        </View>
      </View>
    </View>
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
    alignItems: 'center',
  },
  title: {
    fontSize: 28,
    fontFamily: 'Nunito_700Bold',
    color: Colors.light.text,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 15,
    fontFamily: 'Nunito_400Regular',
    color: Colors.light.textSecondary,
    textAlign: 'center',
    marginTop: 4,
    marginBottom: 16,
  },
  patternsRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 16,
  },
  patternChip: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: Colors.light.border,
    alignItems: 'center',
    gap: 2,
  },
  patternName: {
    fontSize: 14,
    fontFamily: 'Nunito_600SemiBold',
    color: Colors.light.text,
  },
  patternDetail: {
    fontSize: 11,
    fontFamily: 'Nunito_400Regular',
    color: Colors.light.textSecondary,
  },
  circleContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    width: '100%',
  },
  pulseRing: {
    position: 'absolute',
    width: 260,
    height: 260,
    borderRadius: 130,
    borderWidth: 2,
  },
  breathCircle: {
    width: 220,
    height: 220,
    borderRadius: 110,
    borderWidth: 3,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 4,
  },
  phaseLabel: {
    fontSize: 22,
    fontFamily: 'Nunito_700Bold',
  },
  timerText: {
    fontSize: 40,
    fontFamily: 'Nunito_700Bold',
  },
  doneRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 4,
  },
  doneGems: {
    fontSize: 16,
    fontFamily: 'Nunito_600SemiBold',
    color: Colors.light.gem,
  },
  cycleText: {
    fontSize: 14,
    fontFamily: 'Nunito_500Medium',
    color: Colors.light.textSecondary,
    marginBottom: 16,
  },
  bottomActions: {
    marginBottom: 16,
  },
  startBtn: {
    paddingHorizontal: 48,
    paddingVertical: 16,
    borderRadius: 28,
  },
  startBtnText: {
    fontSize: 18,
    fontFamily: 'Nunito_700Bold',
    color: '#FFF',
  },
  stopBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 20,
    backgroundColor: Colors.light.overlay,
  },
  stopBtnText: {
    fontSize: 15,
    fontFamily: 'Nunito_600SemiBold',
    color: Colors.light.textSecondary,
  },
  sessionCount: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 16,
  },
  sessionText: {
    fontSize: 13,
    fontFamily: 'Nunito_500Medium',
    color: Colors.light.textSecondary,
  },
});

import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  StyleSheet, Text, View, Pressable, Platform, Dimensions,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import * as Haptics from 'expo-haptics';
import Animated, { FadeInDown, FadeIn, FadeOut, useSharedValue, useAnimatedStyle, withTiming, withSpring } from 'react-native-reanimated';
import Colors from '@/constants/colors';
import { useWellness } from '@/lib/wellness-context';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');
const GAME_DURATION = 30;

const BUBBLE_COLORS = [
  '#A8D5BA', '#B8A9C9', '#7BA7BC', '#F5D6C6', '#8BC9A3',
  '#F4D68C', '#8BB8E8', '#E8B8B8', '#C5D5A3', '#D4B8D9',
];

interface Bubble {
  id: string;
  x: number;
  y: number;
  size: number;
  color: string;
  speed: number;
}

function BubbleItem({ bubble, onPop }: { bubble: Bubble; onPop: (id: string) => void }) {
  const translateY = useSharedValue(bubble.y);
  const scale = useSharedValue(1);
  const opacity = useSharedValue(0.85);

  useEffect(() => {
    translateY.value = withTiming(-bubble.size - 20, {
      duration: bubble.speed,
    });
    opacity.value = withTiming(0.85, { duration: 500 });
  }, []);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [
      { translateX: bubble.x },
      { translateY: translateY.value },
      { scale: scale.value },
    ],
    opacity: opacity.value,
  }));

  function handlePop() {
    if (Platform.OS !== 'web') Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    scale.value = withSpring(1.5, { damping: 5 });
    opacity.value = withTiming(0, { duration: 200 });
    setTimeout(() => onPop(bubble.id), 200);
  }

  return (
    <Animated.View style={[styles.bubbleAbsolute, animatedStyle]}>
      <Pressable onPress={handlePop}>
        <View style={[styles.bubble, { width: bubble.size, height: bubble.size, borderRadius: bubble.size / 2, backgroundColor: bubble.color }]}>
          <View style={[styles.bubbleShine, { width: bubble.size * 0.3, height: bubble.size * 0.3, borderRadius: bubble.size * 0.15 }]} />
        </View>
      </Pressable>
    </Animated.View>
  );
}

export default function BubbleGameScreen() {
  const insets = useSafeAreaInsets();
  const { addGems, incrementGamesPlayed, completeChallenge } = useWellness();

  const [gameState, setGameState] = useState<'ready' | 'playing' | 'done'>('ready');
  const [bubbles, setBubbles] = useState<Bubble[]>([]);
  const [score, setScore] = useState(0);
  const [timeLeft, setTimeLeft] = useState(GAME_DURATION);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const spawnRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const generateId = () => Date.now().toString() + Math.random().toString(36).substr(2, 9);

  const spawnBubble = useCallback(() => {
    const size = 40 + Math.random() * 40;
    const x = Math.random() * (SCREEN_WIDTH - size - 40) + 20;
    const y = SCREEN_HEIGHT - insets.bottom - 100;
    const color = BUBBLE_COLORS[Math.floor(Math.random() * BUBBLE_COLORS.length)];
    const speed = 4000 + Math.random() * 4000;

    const newBubble: Bubble = { id: generateId(), x, y, size, color, speed };
    setBubbles(prev => [...prev.slice(-15), newBubble]);
  }, [insets.bottom]);

  function startGame() {
    if (Platform.OS !== 'web') Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setGameState('playing');
    setScore(0);
    setTimeLeft(GAME_DURATION);
    setBubbles([]);

    timerRef.current = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          endGame();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    spawnRef.current = setInterval(() => {
      spawnBubble();
    }, 800);
  }

  function endGame() {
    if (timerRef.current) clearInterval(timerRef.current);
    if (spawnRef.current) clearInterval(spawnRef.current);
    setGameState('done');
    setBubbles([]);
  }

  useEffect(() => {
    if (gameState === 'done' && score > 0) {
      const gems = Math.min(Math.floor(score / 2), 15);
      if (gems > 0) {
        addGems(gems, 'Bubble Pop game');
      }
      incrementGamesPlayed();
      completeChallenge('c3');
    }
  }, [gameState]);

  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
      if (spawnRef.current) clearInterval(spawnRef.current);
    };
  }, []);

  function popBubble(id: string) {
    setBubbles(prev => prev.filter(b => b.id !== id));
    setScore(prev => prev + 1);
  }

  const gemsEarned = Math.min(Math.floor(score / 2), 15);

  if (gameState === 'ready') {
    return (
      <View style={[styles.container, { paddingTop: insets.top + 12 }]}>
        <View style={styles.header}>
          <Pressable onPress={() => router.back()} style={styles.closeBtn}>
            <Ionicons name="close" size={24} color={Colors.light.textSecondary} />
          </Pressable>
        </View>
        <Animated.View entering={Platform.OS !== 'web' ? FadeInDown.duration(500) : undefined} style={styles.readyContainer}>
          <View style={styles.readyIcon}>
            <Ionicons name="water" size={48} color={Colors.light.calm} />
          </View>
          <Text style={styles.readyTitle}>Bubble Pop</Text>
          <Text style={styles.readyDesc}>
            Gently tap the floating bubbles.{'\n'}No rush - enjoy the calm.
          </Text>
          <Pressable
            onPress={startGame}
            style={({ pressed }) => [styles.playBtn, { opacity: pressed ? 0.9 : 1, transform: [{ scale: pressed ? 0.97 : 1 }] }]}
          >
            <Ionicons name="play" size={20} color="#FFF" />
            <Text style={styles.playBtnText}>Start</Text>
          </Pressable>
        </Animated.View>
      </View>
    );
  }

  if (gameState === 'done') {
    return (
      <View style={[styles.container, { paddingTop: insets.top + 12 }]}>
        <View style={styles.header}>
          <Pressable onPress={() => router.back()} style={styles.closeBtn}>
            <Ionicons name="close" size={24} color={Colors.light.textSecondary} />
          </Pressable>
        </View>
        <Animated.View entering={Platform.OS !== 'web' ? FadeInDown.duration(500) : undefined} style={styles.doneContainer}>
          <View style={styles.doneCircle}>
            <Ionicons name="heart" size={40} color={Colors.light.accent} />
          </View>
          <Text style={styles.doneTitle}>Nice work</Text>
          <Text style={styles.doneScore}>You popped {score} bubbles</Text>
          {gemsEarned > 0 && (
            <View style={styles.doneGemRow}>
              <Ionicons name="diamond" size={18} color={Colors.light.gem} />
              <Text style={styles.doneGemText}>+{gemsEarned} gems</Text>
            </View>
          )}
          <View style={styles.doneActions}>
            <Pressable
              onPress={startGame}
              style={({ pressed }) => [styles.playBtn, { opacity: pressed ? 0.9 : 1 }]}
            >
              <Ionicons name="refresh" size={18} color="#FFF" />
              <Text style={styles.playBtnText}>Play Again</Text>
            </Pressable>
            <Pressable
              onPress={() => router.back()}
              style={({ pressed }) => [styles.backBtn, { opacity: pressed ? 0.8 : 1 }]}
            >
              <Text style={styles.backBtnText}>Done</Text>
            </Pressable>
          </View>
        </Animated.View>
      </View>
    );
  }

  return (
    <View style={[styles.gameContainer, { paddingTop: insets.top }]}>
      <View style={styles.gameHeader}>
        <Pressable onPress={() => { endGame(); router.back(); }} style={styles.closeBtn}>
          <Ionicons name="close" size={24} color={Colors.light.textSecondary} />
        </Pressable>
        <View style={styles.gameStats}>
          <View style={styles.gameStat}>
            <Ionicons name="water" size={14} color={Colors.light.calm} />
            <Text style={styles.gameStatText}>{score}</Text>
          </View>
          <View style={styles.gameStat}>
            <Ionicons name="time-outline" size={14} color={Colors.light.textSecondary} />
            <Text style={styles.gameStatText}>{timeLeft}s</Text>
          </View>
        </View>
      </View>

      <View style={styles.bubblesArea}>
        {bubbles.map(b => (
          <BubbleItem key={b.id} bubble={b} onPop={popBubble} />
        ))}
      </View>
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
    justifyContent: 'flex-end',
  },
  closeBtn: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  readyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 16,
  },
  readyIcon: {
    width: 96,
    height: 96,
    borderRadius: 30,
    backgroundColor: Colors.light.calm + '15',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  readyTitle: {
    fontSize: 28,
    fontFamily: 'Nunito_700Bold',
    color: Colors.light.text,
  },
  readyDesc: {
    fontSize: 15,
    fontFamily: 'Nunito_400Regular',
    color: Colors.light.textSecondary,
    textAlign: 'center',
    lineHeight: 22,
  },
  playBtn: {
    backgroundColor: Colors.light.tint,
    paddingHorizontal: 36,
    paddingVertical: 14,
    borderRadius: 24,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 8,
  },
  playBtnText: {
    fontSize: 17,
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
    backgroundColor: Colors.light.accent + '15',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  doneTitle: {
    fontSize: 26,
    fontFamily: 'Nunito_700Bold',
    color: Colors.light.text,
  },
  doneScore: {
    fontSize: 16,
    fontFamily: 'Nunito_500Medium',
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
  doneActions: {
    gap: 12,
    alignItems: 'center',
    marginTop: 16,
  },
  backBtn: {
    paddingHorizontal: 24,
    paddingVertical: 12,
  },
  backBtnText: {
    fontSize: 15,
    fontFamily: 'Nunito_600SemiBold',
    color: Colors.light.textSecondary,
  },
  gameContainer: {
    flex: 1,
    backgroundColor: Colors.light.background,
  },
  gameHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingBottom: 8,
  },
  gameStats: {
    flexDirection: 'row',
    gap: 16,
  },
  gameStat: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  gameStatText: {
    fontSize: 16,
    fontFamily: 'Nunito_700Bold',
    color: Colors.light.text,
  },
  bubblesArea: {
    flex: 1,
    overflow: 'hidden',
  },
  bubbleAbsolute: {
    position: 'absolute',
  },
  bubble: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  bubbleShine: {
    position: 'absolute',
    top: '15%',
    left: '20%',
    backgroundColor: 'rgba(255,255,255,0.4)',
  },
});

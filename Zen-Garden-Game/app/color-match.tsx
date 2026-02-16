import React, { useState, useEffect } from 'react';
import {
  StyleSheet, Text, View, Pressable, Platform,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import * as Haptics from 'expo-haptics';
import Animated, { FadeInDown, FadeIn } from 'react-native-reanimated';
import Colors from '@/constants/colors';
import { useWellness } from '@/lib/wellness-context';

const COLOR_SETS = [
  ['#A8D5BA', '#B8A9C9', '#F5D6C6', '#7BA7BC', '#F4D68C', '#E8B8B8'],
  ['#8FB996', '#D4B8D9', '#8BB8E8', '#E8927C', '#C5D5A3', '#B8A9C9'],
  ['#7BA7BC', '#F4D68C', '#A8D5BA', '#E8B8B8', '#8FB996', '#D4B8D9'],
];

interface Card {
  id: number;
  color: string;
  pairId: number;
  flipped: boolean;
  matched: boolean;
}

function generateCards(): Card[] {
  const setIdx = Math.floor(Math.random() * COLOR_SETS.length);
  const colors = COLOR_SETS[setIdx].slice(0, 6);
  const cards: Card[] = [];
  colors.forEach((color, i) => {
    cards.push({ id: i * 2, color, pairId: i, flipped: false, matched: false });
    cards.push({ id: i * 2 + 1, color, pairId: i, flipped: false, matched: false });
  });
  for (let i = cards.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [cards[i], cards[j]] = [cards[j], cards[i]];
  }
  return cards;
}

function ColorCard({ card, onPress }: { card: Card; onPress: () => void }) {
  return (
    <Pressable
      onPress={onPress}
      disabled={card.flipped || card.matched}
      style={({ pressed }) => [
        styles.card,
        card.matched && styles.cardMatched,
        { opacity: pressed ? 0.85 : 1, transform: [{ scale: pressed ? 0.95 : 1 }] },
      ]}
    >
      {card.flipped || card.matched ? (
        <Animated.View
          entering={Platform.OS !== 'web' ? FadeIn.duration(200) : undefined}
          style={[styles.cardFront, { backgroundColor: card.color }]}
        >
          {card.matched && (
            <Ionicons name="checkmark" size={20} color="rgba(255,255,255,0.7)" />
          )}
        </Animated.View>
      ) : (
        <View style={styles.cardBack}>
          <Ionicons name="help" size={20} color={Colors.light.textSecondary + '50'} />
        </View>
      )}
    </Pressable>
  );
}

export default function ColorMatchScreen() {
  const insets = useSafeAreaInsets();
  const { addGems, incrementGamesPlayed, completeChallenge } = useWellness();

  const [cards, setCards] = useState<Card[]>(generateCards);
  const [flippedIds, setFlippedIds] = useState<number[]>([]);
  const [moves, setMoves] = useState(0);
  const [gameState, setGameState] = useState<'playing' | 'done'>('playing');
  const [isChecking, setIsChecking] = useState(false);

  function handleFlip(id: number) {
    if (isChecking) return;
    if (flippedIds.length >= 2) return;

    if (Platform.OS !== 'web') Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

    const newCards = cards.map(c => c.id === id ? { ...c, flipped: true } : c);
    setCards(newCards);
    const newFlipped = [...flippedIds, id];
    setFlippedIds(newFlipped);

    if (newFlipped.length === 2) {
      setMoves(prev => prev + 1);
      setIsChecking(true);
      const first = newCards.find(c => c.id === newFlipped[0])!;
      const second = newCards.find(c => c.id === newFlipped[1])!;

      if (first.pairId === second.pairId) {
        if (Platform.OS !== 'web') Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        setTimeout(() => {
          setCards(prev => prev.map(c =>
            c.pairId === first.pairId ? { ...c, matched: true } : c
          ));
          setFlippedIds([]);
          setIsChecking(false);
        }, 300);
      } else {
        setTimeout(() => {
          setCards(prev => prev.map(c =>
            newFlipped.includes(c.id) ? { ...c, flipped: false } : c
          ));
          setFlippedIds([]);
          setIsChecking(false);
        }, 800);
      }
    }
  }

  useEffect(() => {
    if (cards.length > 0 && cards.every(c => c.matched) && gameState === 'playing') {
      setGameState('done');
      const gems = Math.max(20 - Math.floor(moves / 3), 5);
      addGems(gems, 'Color Harmony game');
      incrementGamesPlayed();
      completeChallenge('c3');
    }
  }, [cards, gameState]);

  function restart() {
    if (Platform.OS !== 'web') Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setCards(generateCards());
    setFlippedIds([]);
    setMoves(0);
    setGameState('playing');
    setIsChecking(false);
  }

  const gemsEarned = Math.max(20 - Math.floor(moves / 3), 5);

  if (gameState === 'done') {
    return (
      <View style={[styles.container, { paddingTop: insets.top + 12, paddingBottom: insets.bottom + 20 }]}>
        <View style={styles.header}>
          <Pressable onPress={() => router.back()} style={styles.closeBtn}>
            <Ionicons name="close" size={24} color={Colors.light.textSecondary} />
          </Pressable>
        </View>
        <Animated.View entering={Platform.OS !== 'web' ? FadeInDown.duration(500) : undefined} style={styles.doneContainer}>
          <View style={styles.doneCircle}>
            <Ionicons name="color-palette" size={40} color={Colors.light.accentSecondary} />
          </View>
          <Text style={styles.doneTitle}>Beautiful</Text>
          <Text style={styles.doneScore}>Matched in {moves} moves</Text>
          <View style={styles.doneGemRow}>
            <Ionicons name="diamond" size={18} color={Colors.light.gem} />
            <Text style={styles.doneGemText}>+{gemsEarned} gems</Text>
          </View>
          <View style={styles.doneActions}>
            <Pressable
              onPress={restart}
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
    <View style={[styles.container, { paddingTop: insets.top + 12, paddingBottom: insets.bottom + 20 }]}>
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} style={styles.closeBtn}>
          <Ionicons name="close" size={24} color={Colors.light.textSecondary} />
        </Pressable>
        <Text style={styles.headerTitle}>Color Harmony</Text>
        <View style={styles.movesBadge}>
          <Text style={styles.movesText}>{moves}</Text>
        </View>
      </View>

      <Text style={styles.instruction}>Match the color pairs</Text>

      <View style={styles.grid}>
        {cards.map(card => (
          <ColorCard key={card.id} card={card} onPress={() => handleFlip(card.id)} />
        ))}
      </View>

      <View style={styles.bottomHint}>
        <Ionicons name="heart-outline" size={16} color={Colors.light.textSecondary} />
        <Text style={styles.hintText}>Take your time, there's no rush</Text>
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
    justifyContent: 'space-between',
    alignItems: 'center',
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
  movesBadge: {
    backgroundColor: Colors.light.tint + '15',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  movesText: {
    fontSize: 14,
    fontFamily: 'Nunito_700Bold',
    color: Colors.light.tint,
  },
  instruction: {
    fontSize: 15,
    fontFamily: 'Nunito_500Medium',
    color: Colors.light.textSecondary,
    textAlign: 'center',
    marginTop: 16,
    marginBottom: 24,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: 12,
    paddingHorizontal: 10,
  },
  card: {
    width: '28%',
    aspectRatio: 1,
    borderRadius: 16,
    overflow: 'hidden',
  },
  cardMatched: {
    opacity: 0.7,
  },
  cardFront: {
    flex: 1,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  cardBack: {
    flex: 1,
    borderRadius: 16,
    backgroundColor: Colors.light.card,
    borderWidth: 2,
    borderColor: Colors.light.border,
    justifyContent: 'center',
    alignItems: 'center',
  },
  bottomHint: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 6,
    marginTop: 32,
  },
  hintText: {
    fontSize: 13,
    fontFamily: 'Nunito_500Medium',
    color: Colors.light.textSecondary,
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
    backgroundColor: Colors.light.accentSecondary + '15',
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
  playBtn: {
    backgroundColor: Colors.light.tint,
    paddingHorizontal: 36,
    paddingVertical: 14,
    borderRadius: 24,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  playBtnText: {
    fontSize: 17,
    fontFamily: 'Nunito_700Bold',
    color: '#FFF',
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
});

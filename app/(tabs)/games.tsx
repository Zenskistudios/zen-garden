import React from 'react';
import {
  StyleSheet, Text, View, ScrollView, Pressable, Platform,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import * as Haptics from 'expo-haptics';
import Animated, { FadeInDown } from 'react-native-reanimated';
import Colors from '@/constants/colors';
import { useWellness } from '@/lib/wellness-context';

function GameCard({ title, description, icon, gradient, gems, onPress, delay }: {
  title: string;
  description: string;
  icon: keyof typeof Ionicons.glyphMap;
  gradient: [string, string];
  gems: number;
  onPress: () => void;
  delay: number;
}) {
  return (
    <Animated.View entering={Platform.OS !== 'web' ? FadeInDown.delay(delay).duration(500) : undefined}>
      <Pressable
        onPress={() => {
          if (Platform.OS !== 'web') Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
          onPress();
        }}
        style={({ pressed }) => [styles.gameCard, { opacity: pressed ? 0.9 : 1, transform: [{ scale: pressed ? 0.97 : 1 }] }]}
      >
        <LinearGradient
          colors={gradient}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.gameGradient}
        >
          <View style={styles.gameIconWrap}>
            <Ionicons name={icon} size={40} color="#FFF" />
          </View>
          <View style={styles.gameInfo}>
            <Text style={styles.gameTitle}>{title}</Text>
            <Text style={styles.gameDesc}>{description}</Text>
            <View style={styles.gameGemRow}>
              <Ionicons name="diamond" size={14} color={Colors.light.gemShimmer} />
              <Text style={styles.gameGemText}>Earn up to {gems} gems</Text>
            </View>
          </View>
        </LinearGradient>
      </Pressable>
    </Animated.View>
  );
}

export default function GamesScreen() {
  const insets = useSafeAreaInsets();
  const { gamesPlayed, gems } = useWellness();
  const webTopInset = Platform.OS === 'web' ? 67 : 0;

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
          <Text style={styles.headerTitle}>Relaxing Games</Text>
          <Text style={styles.headerSub}>Unwind with calming mini-games</Text>
        </Animated.View>

        <Animated.View entering={Platform.OS !== 'web' ? FadeInDown.delay(200).duration(500) : undefined} style={styles.statsRow}>
          <View style={styles.statBox}>
            <Ionicons name="game-controller-outline" size={20} color={Colors.light.tint} />
            <Text style={styles.statValue}>{gamesPlayed}</Text>
            <Text style={styles.statLabel}>Games Played</Text>
          </View>
          <View style={styles.statBox}>
            <Ionicons name="diamond-outline" size={20} color={Colors.light.gem} />
            <Text style={styles.statValue}>{gems}</Text>
            <Text style={styles.statLabel}>Total Gems</Text>
          </View>
        </Animated.View>

        <GameCard
          title="Bubble Pop"
          description="Tap gently floating bubbles to pop them. A soothing way to release tension."
          icon="water"
          gradient={['#7BA7BC', '#6896AB']}
          gems={15}
          onPress={() => router.push('/bubble-game')}
          delay={300}
        />

        <GameCard
          title="Color Harmony"
          description="Match soft colors in a calming pattern game. No rush, no pressure."
          icon="color-palette"
          gradient={['#B8A9C9', '#A89BBF']}
          gems={20}
          onPress={() => router.push('/color-match')}
          delay={400}
        />

        <Animated.View entering={Platform.OS !== 'web' ? FadeInDown.delay(500).duration(500) : undefined} style={styles.reminderCard}>
          <Ionicons name="heart-outline" size={20} color={Colors.light.tint} />
          <Text style={styles.reminderText}>
            These games are designed to help you relax. There's no score pressure - just enjoy the moment.
          </Text>
        </Animated.View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.light.background,
  },
  scrollContent: {
    paddingHorizontal: 20,
  },
  headerTitle: {
    fontSize: 28,
    fontFamily: 'Nunito_700Bold',
    color: Colors.light.text,
  },
  headerSub: {
    fontSize: 15,
    fontFamily: 'Nunito_400Regular',
    color: Colors.light.textSecondary,
    marginTop: 4,
    marginBottom: 20,
  },
  statsRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 24,
  },
  statBox: {
    flex: 1,
    backgroundColor: Colors.light.card,
    borderRadius: 16,
    padding: 16,
    alignItems: 'center',
    gap: 6,
    borderWidth: 1,
    borderColor: Colors.light.border,
  },
  statValue: {
    fontSize: 22,
    fontFamily: 'Nunito_700Bold',
    color: Colors.light.text,
  },
  statLabel: {
    fontSize: 12,
    fontFamily: 'Nunito_400Regular',
    color: Colors.light.textSecondary,
  },
  gameCard: {
    marginBottom: 16,
  },
  gameGradient: {
    borderRadius: 20,
    padding: 24,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  gameIconWrap: {
    width: 72,
    height: 72,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  gameInfo: {
    flex: 1,
    gap: 4,
  },
  gameTitle: {
    fontSize: 20,
    fontFamily: 'Nunito_700Bold',
    color: '#FFF',
  },
  gameDesc: {
    fontSize: 13,
    fontFamily: 'Nunito_400Regular',
    color: 'rgba(255,255,255,0.85)',
    lineHeight: 18,
  },
  gameGemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    marginTop: 4,
  },
  gameGemText: {
    fontSize: 13,
    fontFamily: 'Nunito_600SemiBold',
    color: 'rgba(255,255,255,0.9)',
  },
  reminderCard: {
    backgroundColor: Colors.light.tint + '10',
    borderRadius: 16,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    marginTop: 8,
    borderWidth: 1,
    borderColor: Colors.light.tint + '20',
  },
  reminderText: {
    flex: 1,
    fontSize: 14,
    fontFamily: 'Nunito_500Medium',
    color: Colors.light.textSecondary,
    lineHeight: 20,
  },
});

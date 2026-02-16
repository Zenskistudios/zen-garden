import React, { createContext, useContext, useState, useEffect, useMemo, ReactNode } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

export type Mood = 'great' | 'good' | 'okay' | 'low' | 'stressed';

export interface MoodEntry {
  id: string;
  mood: Mood;
  note: string;
  timestamp: number;
  gemsEarned: number;
}

export interface Challenge {
  id: string;
  title: string;
  description: string;
  gemReward: number;
  completed: boolean;
  icon: string;
  category: 'break' | 'breathe' | 'play' | 'mindful';
}

export interface GemTransaction {
  id: string;
  amount: number;
  reason: string;
  timestamp: number;
}

export interface ScreenSession {
  date: string;
  minutes: number;
}

interface WellnessState {
  gems: number;
  streak: number;
  lastActiveDate: string;
  moodEntries: MoodEntry[];
  challenges: Challenge[];
  gemTransactions: GemTransaction[];
  screenSessions: ScreenSession[];
  breathingCompleted: number;
  gamesPlayed: number;
  todayMoodLogged: boolean;
}

interface WellnessContextValue extends WellnessState {
  addGems: (amount: number, reason: string) => void;
  logMood: (mood: Mood, note: string) => void;
  completeChallenge: (id: string) => void;
  resetDailyChallenges: () => void;
  incrementBreathing: () => void;
  incrementGamesPlayed: () => void;
  addScreenTime: (minutes: number) => void;
  isLoading: boolean;
}

const WellnessContext = createContext<WellnessContextValue | null>(null);

const STORAGE_KEY = '@serenity_wellness';

function generateId(): string {
  return Date.now().toString() + Math.random().toString(36).substr(2, 9);
}

function getTodayString(): string {
  return new Date().toISOString().split('T')[0];
}

function getDailyChallenges(): Challenge[] {
  return [
    { id: 'c1', title: 'Morning Check-In', description: 'Log how you feel today', gemReward: 10, completed: false, icon: 'sunny-outline', category: 'mindful' },
    { id: 'c2', title: 'Deep Breaths', description: 'Complete a breathing exercise', gemReward: 15, completed: false, icon: 'leaf-outline', category: 'breathe' },
    { id: 'c3', title: 'Bubble Break', description: 'Play a calming mini-game', gemReward: 10, completed: false, icon: 'water-outline', category: 'play' },
    { id: 'c4', title: 'Mindful Pause', description: 'Take a 5-minute screen break', gemReward: 20, completed: false, icon: 'pause-circle-outline', category: 'break' },
    { id: 'c5', title: 'Gratitude Note', description: 'Write something you\'re grateful for', gemReward: 10, completed: false, icon: 'heart-outline', category: 'mindful' },
  ];
}

const defaultState: WellnessState = {
  gems: 0,
  streak: 0,
  lastActiveDate: '',
  moodEntries: [],
  challenges: getDailyChallenges(),
  gemTransactions: [],
  screenSessions: [],
  breathingCompleted: 0,
  gamesPlayed: 0,
  todayMoodLogged: false,
};

export function WellnessProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<WellnessState>(defaultState);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadState();
  }, []);

  useEffect(() => {
    if (!isLoading) {
      saveState(state);
    }
  }, [state, isLoading]);

  async function loadState() {
    try {
      const stored = await AsyncStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored) as WellnessState;
        const today = getTodayString();

        if (parsed.lastActiveDate !== today) {
          const yesterday = new Date();
          yesterday.setDate(yesterday.getDate() - 1);
          const yesterdayStr = yesterday.toISOString().split('T')[0];
          const newStreak = parsed.lastActiveDate === yesterdayStr ? parsed.streak + 1 : 1;

          setState({
            ...parsed,
            streak: newStreak,
            lastActiveDate: today,
            challenges: getDailyChallenges(),
            todayMoodLogged: false,
          });
        } else {
          setState(parsed);
        }
      } else {
        setState({ ...defaultState, lastActiveDate: getTodayString(), streak: 1 });
      }
    } catch (e) {
      console.error('Failed to load wellness state:', e);
    } finally {
      setIsLoading(false);
    }
  }

  async function saveState(s: WellnessState) {
    try {
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(s));
    } catch (e) {
      console.error('Failed to save wellness state:', e);
    }
  }

  function addGems(amount: number, reason: string) {
    setState(prev => ({
      ...prev,
      gems: prev.gems + amount,
      gemTransactions: [
        { id: generateId(), amount, reason, timestamp: Date.now() },
        ...prev.gemTransactions.slice(0, 49),
      ],
    }));
  }

  function logMood(mood: Mood, note: string) {
    const gemsEarned = 10;
    setState(prev => ({
      ...prev,
      moodEntries: [
        { id: generateId(), mood, note, timestamp: Date.now(), gemsEarned },
        ...prev.moodEntries.slice(0, 29),
      ],
      gems: prev.gems + gemsEarned,
      gemTransactions: [
        { id: generateId(), amount: gemsEarned, reason: 'Mood check-in', timestamp: Date.now() },
        ...prev.gemTransactions.slice(0, 49),
      ],
      todayMoodLogged: true,
      challenges: prev.challenges.map(c =>
        c.id === 'c1' ? { ...c, completed: true } : c
      ),
    }));
  }

  function completeChallenge(id: string) {
    setState(prev => {
      const challenge = prev.challenges.find(c => c.id === id);
      if (!challenge || challenge.completed) return prev;
      return {
        ...prev,
        challenges: prev.challenges.map(c =>
          c.id === id ? { ...c, completed: true } : c
        ),
        gems: prev.gems + challenge.gemReward,
        gemTransactions: [
          { id: generateId(), amount: challenge.gemReward, reason: challenge.title, timestamp: Date.now() },
          ...prev.gemTransactions.slice(0, 49),
        ],
      };
    });
  }

  function resetDailyChallenges() {
    setState(prev => ({ ...prev, challenges: getDailyChallenges() }));
  }

  function incrementBreathing() {
    setState(prev => ({ ...prev, breathingCompleted: prev.breathingCompleted + 1 }));
  }

  function incrementGamesPlayed() {
    setState(prev => ({ ...prev, gamesPlayed: prev.gamesPlayed + 1 }));
  }

  function addScreenTime(minutes: number) {
    const today = getTodayString();
    setState(prev => {
      const existing = prev.screenSessions.find(s => s.date === today);
      if (existing) {
        return {
          ...prev,
          screenSessions: prev.screenSessions.map(s =>
            s.date === today ? { ...s, minutes: s.minutes + minutes } : s
          ),
        };
      }
      return {
        ...prev,
        screenSessions: [
          { date: today, minutes },
          ...prev.screenSessions.slice(0, 6),
        ],
      };
    });
  }

  const value = useMemo(() => ({
    ...state,
    addGems,
    logMood,
    completeChallenge,
    resetDailyChallenges,
    incrementBreathing,
    incrementGamesPlayed,
    addScreenTime,
    isLoading,
  }), [state, isLoading]);

  return (
    <WellnessContext.Provider value={value}>
      {children}
    </WellnessContext.Provider>
  );
}

export function useWellness() {
  const context = useContext(WellnessContext);
  if (!context) {
    throw new Error('useWellness must be used within a WellnessProvider');
  }
  return context;
}

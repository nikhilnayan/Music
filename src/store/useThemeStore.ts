import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { colors } from '../theme';

interface ThemeState {
  isDarkMode: boolean;
  toggleTheme: () => void;
  loadTheme: () => Promise<void>;
}

export const useThemeStore = create<ThemeState>((set, get) => ({
  isDarkMode: true,
  toggleTheme: async () => {
    const newTheme = !get().isDarkMode;
    set({ isDarkMode: newTheme });
    await AsyncStorage.setItem('app_theme', newTheme ? 'dark' : 'light');
  },
  loadTheme: async () => {
    const saved = await AsyncStorage.getItem('app_theme');
    if (saved) set({ isDarkMode: saved === 'dark' });
  }
}));

export const getThemeColors = (isDarkMode: boolean) => {
  return {
    background: isDarkMode ? '#060606' : '#FAFAFA',
    card: isDarkMode ? '#141414' : '#FFFFFF',
    text: isDarkMode ? '#EFEFEF' : '#1C1C1C',
    textMuted: isDarkMode ? '#888' : '#777',
    border: isDarkMode ? '#1C1C1C' : '#E0E0E0',
    accent: colors.accent,
    accent2: colors.accent2,
    modalOverlay: isDarkMode ? 'rgba(0,0,0,0.4)' : 'rgba(255,255,255,0.4)',
    tileBg: isDarkMode ? '#111' : '#F5F5F5' // For liked/playlists tile background
  };
};

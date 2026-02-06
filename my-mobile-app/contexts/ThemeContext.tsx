import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useColorScheme as useSystemColorScheme } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

type ThemeMode = 'light' | 'dark' | 'system';

interface ThemeContextType {
  theme: 'light' | 'dark';
  themeMode: ThemeMode;
  setThemeMode: (mode: ThemeMode) => void;
  isDark: boolean;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

const THEME_STORAGE_KEY = '@balanceflow_theme';

export function ThemeProvider({ children }: { children: ReactNode }) {
  const systemColorScheme = useSystemColorScheme();
  const [themeMode, setThemeModeState] = useState<ThemeMode>('system');
  const [isLoading, setIsLoading] = useState(true);

  // Load saved theme preference
  useEffect(() => {
    const loadTheme = async () => {
      try {
        const savedTheme = await AsyncStorage.getItem(THEME_STORAGE_KEY);
        if (savedTheme && ['light', 'dark', 'system'].includes(savedTheme)) {
          setThemeModeState(savedTheme as ThemeMode);
        }
      } catch (error) {
        console.error('Failed to load theme:', error);
      } finally {
        setIsLoading(false);
      }
    };
    loadTheme();
  }, []);

  // Save theme preference
  const setThemeMode = async (mode: ThemeMode) => {
    try {
      await AsyncStorage.setItem(THEME_STORAGE_KEY, mode);
      setThemeModeState(mode);
    } catch (error) {
      console.error('Failed to save theme:', error);
    }
  };

  // Calculate actual theme
  const theme: 'light' | 'dark' = 
    themeMode === 'system' 
      ? (systemColorScheme ?? 'light') 
      : themeMode;

  const isDark = theme === 'dark';

  if (isLoading) {
    return null; // Or a loading spinner
  }

  return (
    <ThemeContext.Provider value={{ theme, themeMode, setThemeMode, isDark }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
}

// Color definitions for easy access
export const Colors = {
  light: {
    background: '#FFFFFF',
    backgroundSecondary: '#F5F7FA',
    text: '#2D3436',
    textSecondary: '#636E72',
    textMuted: '#8E8E93',
    border: '#E2E8F0',
    card: '#FFFFFF',
    primary: '#007AFF',
    success: '#28C76F',
    danger: '#FF4D4D',
    warning: '#FFC107',
    incomeBackground: '#E6F9EF',
    expenseBackground: '#FFF0F0',
  },
  dark: {
    background: '#1A1A1A',
    backgroundSecondary: '#2D2D2D',
    text: '#FFFFFF',
    textSecondary: '#B0B0B0',
    textMuted: '#808080',
    border: '#404040',
    card: '#2D2D2D',
    primary: '#0A84FF',
    success: '#30D158',
    danger: '#FF453A',
    warning: '#FFD60A',
    incomeBackground: '#1E3D2F',
    expenseBackground: '#3D1E1E',
  },
};

export function useColors() {
  const { theme } = useTheme();
  return Colors[theme];
}

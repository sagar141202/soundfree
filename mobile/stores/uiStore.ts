import { create } from 'zustand';

export interface AccentPalette {
  bg: [string, string];
  accent: string;
  light: string;
}

interface UIState {
  accentColor: string;
  accentPalette: AccentPalette;
  showMiniPlayer: boolean;
  activeTab: string;
  isLoading: boolean;
  setAccentColor: (color: string) => void;
  setAccentPalette: (palette: AccentPalette) => void;
  setShowMiniPlayer: (show: boolean) => void;
  setActiveTab: (tab: string) => void;
  setIsLoading: (loading: boolean) => void;
}

const DEFAULT_PALETTE: AccentPalette = {
  bg: ['#C4B5FD', '#A78BFA'],
  accent: '#7C3AED',
  light: 'rgba(167,139,250,0.2)',
};

export const useUIStore = create<UIState>((set) => ({
  accentColor: '#7C3AED',
  accentPalette: DEFAULT_PALETTE,
  showMiniPlayer: false,
  activeTab: 'index',
  isLoading: false,
  setAccentColor: (color) => set({ accentColor: color }),
  setAccentPalette: (palette) => set({ accentPalette: palette, accentColor: palette.accent }),
  setShowMiniPlayer: (show) => set({ showMiniPlayer: show }),
  setActiveTab: (tab) => set({ activeTab: tab }),
  setIsLoading: (loading) => set({ isLoading: loading }),
}));

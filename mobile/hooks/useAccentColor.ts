import { useEffect } from 'react';
import { useUIStore } from '../stores/uiStore';
import { usePlayerStore } from '../stores/playerStore';

// Predefined palette based on thumbnail URL hash
// Since we can't run native image processing in Expo Go,
// we extract accent color from the thumbnail URL pattern
// and map it to our design system colors

const ACCENT_PALETTES = [
  { bg: ['#C4B5FD', '#A78BFA'], accent: '#7C3AED', light: 'rgba(167,139,250,0.2)' },
  { bg: ['#7DD3FC', '#93C5FD'], accent: '#2563EB', light: 'rgba(125,211,252,0.2)' },
  { bg: ['#86EFAC', '#6EE7B7'], accent: '#059669', light: 'rgba(134,239,172,0.2)' },
  { bg: ['#FDE68A', '#FCD34D'], accent: '#D97706', light: 'rgba(253,230,138,0.2)' },
  { bg: ['#FBCFE8', '#F9A8D4'], accent: '#DB2777', light: 'rgba(251,207,232,0.2)' },
  { bg: ['#A5F3FC', '#67E8F9'], accent: '#0891B2', light: 'rgba(165,243,252,0.2)' },
  { bg: ['#FCA5A5', '#F87171'], accent: '#DC2626', light: 'rgba(252,165,165,0.2)' },
  { bg: ['#D8B4FE', '#C084FC'], accent: '#9333EA', light: 'rgba(216,180,254,0.2)' },
];

function hashString(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash = hash & hash;
  }
  return Math.abs(hash);
}

export function useAccentColor() {
  const currentTrack = usePlayerStore(s => s.currentTrack);
  const setAccentColor = useUIStore(s => s.setAccentColor);
  const accentColor = useUIStore(s => s.accentColor);

  useEffect(() => {
    if (!currentTrack) return;

    const index = hashString(currentTrack.video_id) % ACCENT_PALETTES.length;
    const palette = ACCENT_PALETTES[index];
    setAccentColor(palette.accent);
  }, [currentTrack?.video_id]);

  const getPalette = (videoId: string) => {
    const index = hashString(videoId) % ACCENT_PALETTES.length;
    return ACCENT_PALETTES[index];
  };

  return { accentColor, getPalette };
}

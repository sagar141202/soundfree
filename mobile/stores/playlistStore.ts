import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';
import type { Track } from './playerStore';

export interface Playlist {
  id: string;
  name: string;
  description?: string;
  coverEmoji: string;
  coverColors: [string, string];
  tracks: Track[];
  createdAt: string;
  updatedAt: string;
}

interface PlaylistState {
  playlists: Playlist[];
  createPlaylist: (name: string, description?: string) => Playlist;
  updatePlaylist: (id: string, updates: Partial<Playlist>) => void;
  deletePlaylist: (id: string) => void;
  addTrackToPlaylist: (playlistId: string, track: Track) => void;
  removeTrackFromPlaylist: (playlistId: string, videoId: string) => void;
  loadFromStorage: () => Promise<void>;
}

const EMOJIS = ['🎵', '🎸', '🎹', '🎺', '🎻', '🥁', '🎤', '🎧', '🎼', '🎙️'];
const COLOR_PAIRS: [string, string][] = [
  ['#C4B5FD', '#A78BFA'],
  ['#7DD3FC', '#93C5FD'],
  ['#86EFAC', '#6EE7B7'],
  ['#FDE68A', '#FCA5A5'],
  ['#FBCFE8', '#F9A8D4'],
  ['#D8B4FE', '#C084FC'],
  ['#A5F3FC', '#67E8F9'],
];

function randomEmoji() { return EMOJIS[Math.floor(Math.random() * EMOJIS.length)]; }
function randomColors(): [string, string] { return COLOR_PAIRS[Math.floor(Math.random() * COLOR_PAIRS.length)]; }

export const usePlaylistStore = create<PlaylistState>((set, get) => ({
  playlists: [],

  createPlaylist: (name, description) => {
    const playlist: Playlist = {
      id: `pl_${Date.now()}`,
      name,
      description,
      coverEmoji: randomEmoji(),
      coverColors: randomColors(),
      tracks: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    set(s => ({ playlists: [playlist, ...s.playlists] }));
    AsyncStorage.setItem('playlists', JSON.stringify(get().playlists));
    return playlist;
  },

  updatePlaylist: (id, updates) => {
    set(s => ({
      playlists: s.playlists.map(p =>
        p.id === id ? { ...p, ...updates, updatedAt: new Date().toISOString() } : p
      ),
    }));
    AsyncStorage.setItem('playlists', JSON.stringify(get().playlists));
  },

  deletePlaylist: (id) => {
    set(s => ({ playlists: s.playlists.filter(p => p.id !== id) }));
    AsyncStorage.setItem('playlists', JSON.stringify(get().playlists));
  },

  addTrackToPlaylist: (playlistId, track) => {
    set(s => ({
      playlists: s.playlists.map(p =>
        p.id === playlistId && !p.tracks.find(t => t.video_id === track.video_id)
          ? { ...p, tracks: [...p.tracks, track], updatedAt: new Date().toISOString() }
          : p
      ),
    }));
    AsyncStorage.setItem('playlists', JSON.stringify(get().playlists));
  },

  removeTrackFromPlaylist: (playlistId, videoId) => {
    set(s => ({
      playlists: s.playlists.map(p =>
        p.id === playlistId
          ? { ...p, tracks: p.tracks.filter(t => t.video_id !== videoId), updatedAt: new Date().toISOString() }
          : p
      ),
    }));
    AsyncStorage.setItem('playlists', JSON.stringify(get().playlists));
  },

  loadFromStorage: async () => {
    try {
      const data = await AsyncStorage.getItem('playlists');
      if (data) set({ playlists: JSON.parse(data) });
    } catch (e) { console.warn('Playlist load failed', e); }
  },
}));

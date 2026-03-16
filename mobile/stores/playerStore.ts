import { create } from 'zustand';
import { emitPlay } from '../services/playerEvents';

export interface Track {
  video_id: string;
  title: string;
  artist: string;
  album: string | null;
  duration_ms: number | null;
  thumbnail_url: string | null;
  stream_url?: string;
}

function fisherYates<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

interface PlayerState {
  currentTrack: Track | null;
  queue: Track[];
  originalQueue: Track[]; // saved for shuffle restore
  currentIndex: number;
  isPlaying: boolean;
  position: number;
  duration: number;
  isShuffled: boolean;
  repeatMode: 'none' | 'all' | 'one';
  radioMode: boolean;

  setCurrentTrack: (track: Track) => void;
  setQueue: (queue: Track[], index?: number) => void;
  setIsPlaying: (playing: boolean) => void;
  setPosition: (pos: number) => void;
  setDuration: (dur: number) => void;
  nextTrack: () => void;
  previousTrack: () => void;
  toggleShuffle: () => void;
  toggleRepeat: () => void;
  toggleRadio: () => void;
}

export const usePlayerStore = create<PlayerState>((set, get) => ({
  currentTrack: null,
  queue: [],
  originalQueue: [],
  currentIndex: 0,
  isPlaying: false,
  position: 0,
  duration: 0,
  isShuffled: false,
  repeatMode: 'none',
  radioMode: true,

  setCurrentTrack: (track) => set({ currentTrack: track }),

  setQueue: (queue, index = 0) => set({
    queue,
    originalQueue: queue,
    currentIndex: index,
  }),

  setIsPlaying: (playing) => set({ isPlaying: playing }),
  setPosition: (pos) => set({ position: pos }),
  setDuration: (dur) => set({ duration: dur }),

  nextTrack: () => {
    const { queue, currentIndex, repeatMode, isShuffled } = get();
    if (queue.length === 0) return;

    if (repeatMode === 'one') {
      const track = queue[currentIndex];
      emitPlay(track);
      return;
    }

    let nextIndex = currentIndex + 1;

    if (nextIndex >= queue.length) {
      if (repeatMode === 'all') {
        nextIndex = 0;
      } else if (get().radioMode) {
        // Radio mode — fetch more recommendations
        const lastTrack = queue[queue.length - 1];
        set({ isPlaying: false });
        import('../services/radioService').then(({ fetchRadioTracks }) => {
          fetchRadioTracks(lastTrack).then(newTracks => {
            if (newTracks.length > 0) {
              set({ queue: newTracks, currentIndex: 0, currentTrack: newTracks[0] });
              emitPlay(newTracks[0]);
            }
          });
        });
        return;
      } else {
        set({ isPlaying: false });
        return;
      }
    }

    const nextTrack = queue[nextIndex];
    set({ currentIndex: nextIndex, currentTrack: nextTrack, position: 0 });
    emitPlay(nextTrack);
  },

  previousTrack: () => {
    const { queue, currentIndex, position } = get();
    if (queue.length === 0) return;

    // If > 3s in, restart current track
    if (position > 3000) {
      const track = queue[currentIndex];
      emitPlay(track);
      return;
    }

    const prevIndex = Math.max(0, currentIndex - 1);
    const prevTrack = queue[prevIndex];
    set({ currentIndex: prevIndex, currentTrack: prevTrack, position: 0 });
    emitPlay(prevTrack);
  },

  toggleShuffle: () => {
    const { isShuffled, queue, originalQueue, currentTrack, currentIndex } = get();

    if (!isShuffled) {
      // Shuffle ON — Fisher-Yates shuffle, keep current track first
      const rest = queue.filter((_, i) => i !== currentIndex);
      const shuffled = fisherYates(rest);
      const newQueue = currentTrack ? [currentTrack, ...shuffled] : shuffled;
      set({
        isShuffled: true,
        queue: newQueue,
        originalQueue: queue,
        currentIndex: 0,
      });
    } else {
      // Shuffle OFF — restore original order
      const current = currentTrack;
      const restoredIndex = current
        ? originalQueue.findIndex(t => t.video_id === current.video_id)
        : 0;
      set({
        isShuffled: false,
        queue: originalQueue,
        currentIndex: restoredIndex >= 0 ? restoredIndex : 0,
      });
    }
  },

  toggleRepeat: () => {
    const { repeatMode } = get();
    const modes: Array<'none' | 'all' | 'one'> = ['none', 'all', 'one'];
    const nextMode = modes[(modes.indexOf(repeatMode) + 1) % modes.length];
    set({ repeatMode: nextMode });
  },

  toggleRadio: () => {
    const { radioMode } = get();
    set({ radioMode: !radioMode });
    console.log('Radio mode:', !radioMode);
  },
}));

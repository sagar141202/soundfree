import { useEffect, useRef } from 'react';
import { AppState } from 'react-native';
import { usePlayerStore } from '../stores/playerStore';
import { usePlayTrack } from './usePlayTrack';

export function useMediaKeys() {
  const lastPressTime = useRef(0);
  const pressCount = useRef(0);
  const pressTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const { togglePlayPause } = usePlayTrack();
  const nextTrack = usePlayerStore(s => s.nextTrack);
  const previousTrack = usePlayerStore(s => s.previousTrack);

  useEffect(() => {
    // expo-av handles media button events automatically when
    // staysActiveInBackground: true is set.
    // For additional media key handling, we listen via AppState
    // and the sound instance's remote control events.

    const setupRemoteControl = async () => {
      const sound = (global as any)._soundInstance;
      if (!sound) return;

      // Remote control is handled natively by expo-av
      // when androidImplementation: 'MediaPlayer' is used
    };

    const subscription = AppState.addEventListener('change', (state) => {
      if (state === 'active') setupRemoteControl();
    });

    setupRemoteControl();

    return () => subscription.remove();
  }, []);
}

// Headset button handler — called from audio status updates
export function handleHeadsetButton(event: string) {
  const store = usePlayerStore.getState();

  switch (event) {
    case 'play':
    case 'pause':
      const sound = (global as any)._soundInstance;
      if (sound) {
        if (store.isPlaying) {
          sound.pauseAsync();
          store.setIsPlaying(false);
        } else {
          sound.playAsync();
          store.setIsPlaying(true);
        }
      }
      break;
    case 'next':
      store.nextTrack();
      break;
    case 'previous':
      store.previousTrack();
      break;
  }
}

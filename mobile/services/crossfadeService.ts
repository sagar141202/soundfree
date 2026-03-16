import { Audio } from 'expo-av';
import { usePlayerStore } from '../stores/playerStore';

const CROSSFADE_DURATION = 3000; // 3 seconds
const FADE_STEPS = 30;
const STEP_MS = CROSSFADE_DURATION / FADE_STEPS;

let _currentSound: Audio.Sound | null = null;
let _nextSound: Audio.Sound | null = null;
let _isCrossfading = false;
let _crossfadeTimer: ReturnType<typeof setInterval> | null = null;

export function getCurrentSound(): Audio.Sound | null {
  return _currentSound;
}

export function setCurrentSound(sound: Audio.Sound | null) {
  _currentSound = sound;
  (global as any)._soundInstance = sound;
}

function clearCrossfadeTimer() {
  if (_crossfadeTimer) {
    clearInterval(_crossfadeTimer);
    _crossfadeTimer = null;
  }
}

async function fadeOut(sound: Audio.Sound, durationMs: number): Promise<void> {
  const steps = FADE_STEPS;
  const stepMs = durationMs / steps;
  let step = 0;

  return new Promise((resolve) => {
    const timer = setInterval(async () => {
      step++;
      const volume = Math.max(0, 1 - step / steps);
      try {
        await sound.setVolumeAsync(volume);
      } catch (_) {}

      if (step >= steps) {
        clearInterval(timer);
        resolve();
      }
    }, stepMs);
  });
}

async function fadeIn(sound: Audio.Sound, durationMs: number): Promise<void> {
  const steps = FADE_STEPS;
  const stepMs = durationMs / steps;
  let step = 0;

  return new Promise((resolve) => {
    const timer = setInterval(async () => {
      step++;
      const volume = Math.min(1, step / steps);
      try {
        await sound.setVolumeAsync(volume);
      } catch (_) {}

      if (step >= steps) {
        clearInterval(timer);
        resolve();
      }
    }, stepMs);
  });
}

export async function crossfadeTo(
  nextUrl: string,
  onStatusUpdate: (status: any) => void,
  onPlayLogged: () => void,
): Promise<Audio.Sound | null> {
  if (_isCrossfading) {
    console.log('Crossfade already in progress — skipping');
    return null;
  }

  _isCrossfading = true;
  clearCrossfadeTimer();

  try {
    await Audio.setAudioModeAsync({
      staysActiveInBackground: true,
      playsInSilentModeIOS: true,
      shouldDuckAndroid: false,
      playThroughEarpieceAndroid: false,
    });

    // Load next track at volume 0
    const { sound: nextSound } = await Audio.Sound.createAsync(
      { uri: nextUrl },
      { shouldPlay: true, volume: 0, progressUpdateIntervalMillis: 1000 },
      onStatusUpdate,
    );
    _nextSound = nextSound;

    const oldSound = _currentSound;

    // Crossfade: fade out old, fade in new simultaneously
    await Promise.all([
      oldSound ? fadeOut(oldSound, CROSSFADE_DURATION) : Promise.resolve(),
      fadeIn(nextSound, CROSSFADE_DURATION),
    ]);

    // Unload old sound
    if (oldSound) {
      try {
        await oldSound.stopAsync();
        await oldSound.unloadAsync();
      } catch (_) {}
    }

    _currentSound = nextSound;
    _nextSound = null;
    (global as any)._soundInstance = nextSound;

    console.log('Crossfade complete');
    return nextSound;

  } catch (e: any) {
    console.error('Crossfade error:', e?.message);
    return null;
  } finally {
    _isCrossfading = false;
  }
}

export async function startCrossfadeMonitor(
  sound: Audio.Sound,
  durationMs: number,
  onCrossfadeNeeded: () => void,
) {
  // Start crossfade 3 seconds before track ends
  const crossfadeAt = durationMs - CROSSFADE_DURATION - 500;
  if (crossfadeAt <= 0) return;

  clearCrossfadeTimer();

  _crossfadeTimer = setInterval(async () => {
    try {
      const status = await sound.getStatusAsync();
      if (!status.isLoaded) return;

      const position = status.positionMillis;
      const duration = status.durationMillis || durationMs;
      const remaining = duration - position;

      if (remaining <= CROSSFADE_DURATION + 500 && remaining > 0) {
        clearCrossfadeTimer();
        console.log(`Crossfade triggered — ${remaining}ms remaining`);
        onCrossfadeNeeded();
      }
    } catch (_) {}
  }, 500);
}

export function stopCrossfadeMonitor() {
  clearCrossfadeTimer();
}

import { getCurrentSound } from './crossfadeService';
import { usePlayerStore } from '../stores/playerStore';

let _timer: ReturnType<typeof setInterval> | null = null;
let _endTime: number | null = null;
let _listeners = new Set<(remaining: number) => void>();

export function getSleepTimerRemaining(): number {
  if (!_endTime) return 0;
  return Math.max(0, _endTime - Date.now());
}

export function isSleepTimerActive(): boolean {
  return _timer !== null;
}

export function addSleepTimerListener(cb: (remaining: number) => void) {
  _listeners.add(cb);
  return () => _listeners.delete(cb);
}

function notifyListeners(remaining: number) {
  _listeners.forEach(cb => cb(remaining));
}

export function cancelSleepTimer() {
  if (_timer) { clearInterval(_timer); _timer = null; }
  _endTime = null;
  notifyListeners(0);
}

async function fadeOutAndStop() {
  const sound = getCurrentSound();
  if (!sound) {
    usePlayerStore.getState().setIsPlaying(false);
    return;
  }

  const STEPS = 30;
  const DURATION_MS = 3000;
  const STEP_MS = DURATION_MS / STEPS;

  let step = 0;
  const fadeTimer = setInterval(async () => {
    step++;
    const vol = Math.max(0, 1 - step / STEPS);
    try { await sound.setVolumeAsync(vol); } catch (_) {}
    if (step >= STEPS) {
      clearInterval(fadeTimer);
      try {
        await sound.pauseAsync();
        await sound.setVolumeAsync(1); // restore volume
      } catch (_) {}
      usePlayerStore.getState().setIsPlaying(false);
      console.log('Sleep timer: audio faded out and stopped');
    }
  }, STEP_MS);
}

export function startSleepTimer(durationMs: number) {
  cancelSleepTimer(); // cancel any existing timer

  _endTime = Date.now() + durationMs;
  console.log(`Sleep timer set for ${Math.round(durationMs / 60000)} minutes`);

  _timer = setInterval(async () => {
    const remaining = getSleepTimerRemaining();
    notifyListeners(remaining);

    if (remaining <= 0) {
      cancelSleepTimer();
      await fadeOutAndStop();
    }
  }, 1000);

  notifyListeners(durationMs);
}

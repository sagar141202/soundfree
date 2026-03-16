import { useCallback } from 'react';
import { Audio } from 'expo-av';
import { usePlayerStore } from '../stores/playerStore';
import { useLibraryStore } from '../stores/libraryStore';
import { useUIStore } from '../stores/uiStore';
import { getStreamUrl, logPlay } from '../lib/api';
import { isDownloaded, getLocalPath } from './useDownload';
import {
  crossfadeTo,
  setCurrentSound,
  getCurrentSound,
  startCrossfadeMonitor,
  stopCrossfadeMonitor,
} from '../services/crossfadeService';

async function _getPlayUrl(track: { video_id: string }): Promise<string | null> {
  // Check local download first
  const localAvailable = await isDownloaded(track.video_id);
  if (localAvailable) {
    console.log('Playing from local file:', track.video_id);
    return getLocalPath(track.video_id);
  }
  // Stream from backend
  try {
    const streamData = await getStreamUrl(track.video_id);
    if (!streamData?.stream_url && !streamData?.proxy_url) return null;
    return streamData.proxy_url || streamData.stream_url;
  } catch {
    return null;
  }
}

async function _playTrack(track: any, useCrossfade = false) {
  try {
    const playUrl = await _getPlayUrl(track);
    if (!playUrl) {
      console.warn('No play URL for:', track.title);
      usePlayerStore.getState().setIsPlaying(false);
      return;
    }

    usePlayerStore.getState().setCurrentTrack({ ...track, stream_url: playUrl });
    (global as any)._playLogged = false;

    await Audio.setAudioModeAsync({
      staysActiveInBackground: true,
      playsInSilentModeIOS: true,
      shouldDuckAndroid: true,
      playThroughEarpieceAndroid: false,
    });

    const onStatusUpdate = (status: any) => {
      if (status.isLoaded) {
        usePlayerStore.getState().setPosition(status.positionMillis ?? 0);
        usePlayerStore.getState().setDuration(status.durationMillis ?? 0);

        if (!(global as any)._playLogged && status.positionMillis >= 30000) {
          (global as any)._playLogged = true;
          logPlay(track.video_id, {
            title: track.title, artist: track.artist,
            album: track.album, duration_ms: track.duration_ms,
            thumbnail_url: track.thumbnail_url,
          });
        }

        if (status.didJustFinish) {
          stopCrossfadeMonitor();
          usePlayerStore.getState().nextTrack();
        }

        // Start crossfade monitor when duration is known
        if (status.durationMillis && status.durationMillis > 6000) {
          const sound = getCurrentSound();
          if (sound) {
            startCrossfadeMonitor(
              sound,
              status.durationMillis,
              () => usePlayerStore.getState().nextTrack(),
            );
          }
        }
      }
    };

    let sound: Audio.Sound | null = null;

    if (useCrossfade && getCurrentSound()) {
      // Crossfade from current to next
      sound = await crossfadeTo(playUrl, onStatusUpdate, () => {});
    }

    if (!sound) {
      // Normal play (first track or crossfade failed)
      const existing = getCurrentSound();
      if (existing) {
        stopCrossfadeMonitor();
        try { await existing.stopAsync(); await existing.unloadAsync(); } catch (_) {}
      }

      const { sound: newSound } = await Audio.Sound.createAsync(
        { uri: playUrl },
        { shouldPlay: true, progressUpdateIntervalMillis: 1000 },
        onStatusUpdate,
      );
      sound = newSound;
      setCurrentSound(newSound);
    }

    (global as any)._soundInstance = sound;
    usePlayerStore.getState().setIsPlaying(true);

  } catch (e: any) {
    console.error('_playTrack error:', e?.message || e);
    usePlayerStore.getState().setIsPlaying(false);
  }
}

export const playTrackAuto = _playTrack;

export function usePlayTrack() {
  const setCurrentTrack = usePlayerStore(s => s.setCurrentTrack);
  const setIsPlaying = usePlayerStore(s => s.setIsPlaying);
  const setQueue = usePlayerStore(s => s.setQueue);
  const setIsLoading = useUIStore(s => s.setIsLoading);
  const addToRecent = useLibraryStore(s => s.addToRecent);

  const playTrack = useCallback(async (track: any, queue?: any[]) => {
    try {
      setIsLoading(true);
      setCurrentTrack(track);
      setIsPlaying(false);
      if (queue) setQueue(queue, queue.findIndex((t: any) => t.video_id === track.video_id));
      // Use crossfade if there's already a track playing
      const useCrossfade = !!getCurrentSound();
      await _playTrack(track, useCrossfade);
      addToRecent(track);
    } catch (e: any) {
      console.error('playTrack error:', e?.message);
      setIsPlaying(false);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const togglePlayPause = useCallback(async () => {
    const { isPlaying, setIsPlaying } = usePlayerStore.getState();
    const sound = getCurrentSound() || (global as any)._soundInstance;
    if (sound) {
      if (isPlaying) { await sound.pauseAsync(); setIsPlaying(false); }
      else { await sound.playAsync(); setIsPlaying(true); }
    } else {
      setIsPlaying(!isPlaying);
    }
  }, []);

  return { playTrack, togglePlayPause };
}

export async function seekToPosition(positionMs: number) {
  const sound = getCurrentSound() || (global as any)._soundInstance;
  if (sound) {
    await sound.setPositionAsync(positionMs);
    usePlayerStore.getState().setPosition(positionMs);
  }
}

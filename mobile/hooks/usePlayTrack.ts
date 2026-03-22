import { registerPlayHandler } from '../services/playerEvents';
import { useCallback } from 'react';
import { Audio } from 'expo-av';
import { usePlayerStore } from '../stores/playerStore';
import { useLibraryStore } from '../stores/libraryStore';
import { useUIStore } from '../stores/uiStore';
import { getStreamUrl, logPlay, updateDiscordPresence } from '../lib/api';
import { toast } from '../services/toastService';
import { captureError } from '../services/sentryService';
import { getLastfmConfig, scrobbleTrack, updateNowPlaying } from '../services/lastfmService';
import { isDownloaded, getLocalPath } from './useDownload';
import {
  getCurrentSound, setCurrentSound,
  fadeOutCurrent, fadeInNew, stopAll,
} from '../services/crossfadeService';
import { loadSavedSpeed } from '../app/playback-speed';

async function _getPlayUrl(videoId: string): Promise<string | null> {
  const local = await isDownloaded(videoId);
  if (local) return getLocalPath(videoId);
  try {
    const s = await getStreamUrl(videoId);
    return s?.proxy_url || s?.stream_url || null;
  } catch { return null; }
}

async function _playTrack(track: any) {
  try {
    const playUrl = await _getPlayUrl(track.video_id);
    if (!playUrl) {
      toast.error('Stream unavailable for: ' + track.title);
      usePlayerStore.getState().setIsPlaying(false);
      return;
    }

    usePlayerStore.getState().setCurrentTrack({ ...track, stream_url: playUrl });
    (global as any)._playLogged = false;
    (global as any)._scrobbled = false;

    await Audio.setAudioModeAsync({
      staysActiveInBackground: true,
      playsInSilentModeIOS: true,
      shouldDuckAndroid: false,
      playThroughEarpieceAndroid: false,
    });

    const hasCurrent = !!getCurrentSound();

    // Start fading out current sound in background
    const fadeOutPromise = hasCurrent ? fadeOutCurrent() : Promise.resolve();

    // Load next sound (not playing yet)
    const { sound: newSound } = await Audio.Sound.createAsync(
      { uri: playUrl },
      { shouldPlay: false, volume: 0, progressUpdateIntervalMillis: 500 },
      (status: any) => {
        if (!status.isLoaded) return;
        usePlayerStore.getState().setPosition(status.positionMillis ?? 0);
        usePlayerStore.getState().setDuration(status.durationMillis ?? 0);

        if (!(global as any)._playLogged && status.positionMillis >= 30000) {
          (global as any)._playLogged = true;
          logPlay(track.video_id, {
            title: track.title, artist: track.artist,
            album: track.album, duration_ms: track.duration_ms,
            thumbnail_url: track.thumbnail_url,
          });
          getLastfmConfig().then(config => {
            if (config?.sessionKey) updateNowPlaying(config, track);
          });
          // Update Discord RPC
          updateDiscordPresence({
            title: track.title,
            artist: track.artist,
            album: track.album,
            position_ms: status.positionMillis,
            duration_ms: status.durationMillis || track.duration_ms,
            is_playing: true,
          });
        }
        const dur = status.durationMillis || track.duration_ms || 0;
        const scrobbleAt = Math.max(30000, dur * 0.5);
        if (!(global as any)._scrobbled && dur > 0 && status.positionMillis >= scrobbleAt) {
          (global as any)._scrobbled = true;
          getLastfmConfig().then(config => {
            if (config?.sessionKey) scrobbleTrack(config, track);
          });
        }
        if (status.didJustFinish) {
          usePlayerStore.getState().nextTrack();
        }
      }
    );

    setCurrentSound(newSound);

    // Fade in new sound while old fades out
    await Promise.all([
      fadeOutPromise,
      fadeInNew(newSound),
    ]);

    // Apply saved playback speed
    loadSavedSpeed().then(rate => {
      if (rate !== 1.0) {
        const s = getCurrentSound();
        if (s) s.setRateAsync(rate, true).catch(() => {});
      }
    });

    usePlayerStore.getState().setIsPlaying(true);
    console.log('Playing:', track.title);

  } catch (e: any) {
    console.error('_playTrack error:', e?.message);
    usePlayerStore.getState().setIsPlaying(false);
  }
}

export const playTrackAuto = _playTrack;

// Register global play handler to break circular dependency
registerPlayHandler(_playTrack);

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
      await _playTrack(track);
      addToRecent(track);
    } catch (e: any) {
      toast.error('Playback failed — check your connection');
      captureError(e instanceof Error ? e : new Error(String(e)), { track: track.video_id });
      setIsPlaying(false);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const togglePlayPause = useCallback(async () => {
    const { isPlaying, setIsPlaying } = usePlayerStore.getState();
    const sound = getCurrentSound();
    if (sound) {
      if (isPlaying) { await sound.pauseAsync(); setIsPlaying(false); }
      else { await sound.playAsync(); setIsPlaying(true); }
    }
  }, []);

  return { playTrack, togglePlayPause };
}

export async function seekToPosition(positionMs: number) {
  const sound = getCurrentSound();
  if (sound) {
    await sound.setPositionAsync(positionMs);
    usePlayerStore.getState().setPosition(positionMs);
  }
}

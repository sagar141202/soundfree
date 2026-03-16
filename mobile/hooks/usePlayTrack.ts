import { useCallback } from 'react';
import { Audio } from 'expo-av';
import { usePlayerStore } from '../stores/playerStore';
import { useLibraryStore } from '../stores/libraryStore';
import { useUIStore } from '../stores/uiStore';
import { getStreamUrl, logPlay } from '../lib/api';
import { isDownloaded, getLocalPath } from './useDownload';
import type { Track } from '../components/TrackListItem';

async function _playTrack(track: Track) {
  try {
    let playUrl: string;
    let isLocal = false;

    // 1. Check local download first
    const localAvailable = await isDownloaded(track.video_id);
    if (localAvailable) {
      playUrl = getLocalPath(track.video_id);
      isLocal = true;
      console.log('Playing from local file:', track.title);
    } else {
      // 2. Try streaming from backend
      try {
        const streamData = await getStreamUrl(track.video_id);
        if (!streamData?.stream_url && !streamData?.proxy_url) {
          throw new Error('No stream URL');
        }
        playUrl = streamData.proxy_url || streamData.stream_url;
        console.log('Playing via proxy:', playUrl.slice(0, 60));
      } catch (streamError: any) {
        // 3. Offline and not downloaded
        if (streamError?.message === 'OFFLINE' || streamError?.code === 'ECONNREFUSED') {
          console.warn('Offline — track not downloaded:', track.title);
          usePlayerStore.getState().setIsPlaying(false);
          useUIStore.getState().setIsLoading(false);
          return;
        }
        throw streamError;
      }
    }

    usePlayerStore.getState().setCurrentTrack({ ...track, stream_url: playUrl });

    // Stop existing sound
    if ((global as any)._soundInstance) {
      try { await (global as any)._soundInstance.unloadAsync(); } catch (_) {}
      (global as any)._soundInstance = null;
    }

    // Reset play logged flag
    (global as any)._playLogged = false;

    const { Audio } = require('expo-av');
    await Audio.setAudioModeAsync({
      staysActiveInBackground: true,
      playsInSilentModeIOS: true,
      shouldDuckAndroid: true,
      playThroughEarpieceAndroid: false,
    });

    const { sound } = await Audio.Sound.createAsync(
      { uri: playUrl },
      { shouldPlay: true, progressUpdateIntervalMillis: 1000 },
      (status: any) => {
        if (status.isLoaded) {
          usePlayerStore.getState().setPosition(status.positionMillis ?? 0);
          usePlayerStore.getState().setDuration(status.durationMillis ?? 0);

          // Log play after 30s (only for streamed tracks)
          if (!isLocal && !(global as any)._playLogged && status.positionMillis >= 30000) {
            (global as any)._playLogged = true;
            logPlay(track.video_id, {
              title: track.title,
              artist: track.artist,
              album: track.album,
              duration_ms: track.duration_ms,
              thumbnail_url: track.thumbnail_url,
            });
          }

          if (status.didJustFinish) {
            usePlayerStore.getState().nextTrack();
          }
        }
      }
    );

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

  const playTrack = useCallback(async (track: Track, queue?: Track[]) => {
    try {
      setIsLoading(true);
      setCurrentTrack(track);
      setIsPlaying(false);
      if (queue) setQueue(queue, queue.findIndex(t => t.video_id === track.video_id));
      await _playTrack(track);
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
    const sound = (global as any)._soundInstance;
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
  const sound = (global as any)._soundInstance;
  if (sound) {
    await sound.setPositionAsync(positionMs);
    usePlayerStore.getState().setPosition(positionMs);
  }
}

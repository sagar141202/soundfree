import { useState, useCallback } from 'react';
import * as FileSystem from 'expo-file-system';
import { saveTrack, deleteTrack, getTrack } from '../services/localDb';
import { cacheArt, deleteArt } from '../services/artCache';
import type { Track } from '../components/TrackListItem';

const API_URL = process.env.EXPO_PUBLIC_API_URL || 'http://10.53.24.112:8000';
const DOWNLOAD_DIR = `${FileSystem.documentDirectory}soundfree/audio/`;

export interface DownloadState {
  progress: number;
  status: 'idle' | 'downloading' | 'done' | 'error';
  localUri?: string;
}

const downloadStates: Record<string, DownloadState> = {};
const listeners: Record<string, Set<(state: DownloadState) => void>> = {};

function notify(videoId: string, state: DownloadState) {
  downloadStates[videoId] = state;
  listeners[videoId]?.forEach(cb => cb(state));
}

export async function ensureDir() {
  const info = await FileSystem.getInfoAsync(DOWNLOAD_DIR);
  if (!info.exists) {
    await FileSystem.makeDirectoryAsync(DOWNLOAD_DIR, { intermediates: true });
  }
}

export function getLocalPath(videoId: string): string {
  return `${DOWNLOAD_DIR}${videoId}.opus`;
}

export async function isDownloaded(videoId: string): Promise<boolean> {
  const localPath = getLocalPath(videoId);
  const info = await FileSystem.getInfoAsync(localPath);
  return info.exists && (info as any).size > 0;
}

export async function downloadTrack(track: Track): Promise<void> {
  const videoId = track.video_id;
  if (downloadStates[videoId]?.status === 'downloading') return;

  notify(videoId, { progress: 0, status: 'downloading' });

  try {
    await ensureDir();
    const localPath = getLocalPath(videoId);

    // Check SQLite cache
    const existing = await getTrack(videoId);
    if (existing) {
      const info = await FileSystem.getInfoAsync(localPath);
      if (info.exists) {
        notify(videoId, { progress: 1, status: 'done', localUri: localPath });
        return;
      }
    }

    const downloadUrl = `${API_URL}/download/${videoId}`;
    const downloadResumable = FileSystem.createDownloadResumable(
      downloadUrl,
      localPath,
      {},
      (progress) => {
        const ratio = progress.totalBytesWritten / progress.totalBytesExpectedToWrite;
        notify(videoId, { progress: ratio, status: 'downloading' });
      }
    );

    const result = await downloadResumable.downloadAsync();

    if (result?.uri) {
      // Get file size
      const fileInfo = await FileSystem.getInfoAsync(result.uri);
      const fileSize = (fileInfo as any).size ?? 0;

      // Cache album art locally
      if (track.thumbnail_url) {
        await cacheArt(videoId, track.thumbnail_url);
      }

      // Save metadata to SQLite
      await saveTrack({
        video_id: videoId,
        title: track.title,
        artist: track.artist,
        album: track.album,
        duration_ms: track.duration_ms,
        thumbnail_url: track.thumbnail_url,
        local_path: result.uri,
        file_size: fileSize,
      });

      notify(videoId, { progress: 1, status: 'done', localUri: result.uri });
      console.log(`Downloaded & saved: ${track.title} (${Math.round(fileSize / 1024)}KB)`);
    } else {
      throw new Error('No URI returned');
    }

  } catch (e: any) {
    console.error('Download error:', e?.message);
    notify(videoId, { progress: 0, status: 'error' });
    try {
      await FileSystem.deleteAsync(getLocalPath(videoId), { idempotent: true });
    } catch (_) {}
  }
}

export async function deleteDownload(videoId: string): Promise<void> {
  try {
    await FileSystem.deleteAsync(getLocalPath(videoId), { idempotent: true });
    await deleteTrack(videoId);
    await deleteArt(videoId);
    notify(videoId, { progress: 0, status: 'idle' });
    console.log(`Deleted download: ${videoId}`);
  } catch (e) {
    console.error('Delete error:', e);
  }
}

export function useDownloadState(videoId: string) {
  const [state, setState] = useState<DownloadState>(
    downloadStates[videoId] || { progress: 0, status: 'idle' }
  );

  useState(() => {
    // Subscribe
    if (!listeners[videoId]) listeners[videoId] = new Set();
    const cb = (s: DownloadState) => setState({ ...s });
    listeners[videoId].add(cb);

    // Check SQLite + filesystem on mount
    Promise.all([getTrack(videoId), isDownloaded(videoId)]).then(([dbTrack, fileExists]) => {
      if (dbTrack && fileExists) {
        const s = { progress: 1, status: 'done' as const, localUri: getLocalPath(videoId) };
        setState(s);
        downloadStates[videoId] = s;
      }
    });

    return () => listeners[videoId]?.delete(cb);
  });

  const download = useCallback((track: Track) => downloadTrack(track), []);
  const remove = useCallback(() => deleteDownload(videoId), [videoId]);

  return { ...state, download, remove };
}

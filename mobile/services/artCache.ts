import * as FileSystem from 'expo-file-system';

const ART_DIR = `${FileSystem.documentDirectory}soundfree/art/`;

export async function ensureArtDir() {
  const info = await FileSystem.getInfoAsync(ART_DIR);
  if (!info.exists) {
    await FileSystem.makeDirectoryAsync(ART_DIR, { intermediates: true });
  }
}

export function getArtPath(videoId: string): string {
  return `${ART_DIR}${videoId}.jpg`;
}

export async function isArtCached(videoId: string): Promise<boolean> {
  const info = await FileSystem.getInfoAsync(getArtPath(videoId));
  return info.exists && (info as any).size > 0;
}

export async function cacheArt(videoId: string, url: string): Promise<string | null> {
  try {
    await ensureArtDir();
    const localPath = getArtPath(videoId);

    // Already cached
    if (await isArtCached(videoId)) {
      return localPath;
    }

    // Download art
    const result = await FileSystem.downloadAsync(url, localPath);
    if (result.uri) {
      console.log(`Art cached: ${videoId}`);
      return result.uri;
    }
    return null;
  } catch (e: any) {
    console.warn('Art cache error:', e?.message);
    return null;
  }
}

export async function deleteArt(videoId: string): Promise<void> {
  try {
    await FileSystem.deleteAsync(getArtPath(videoId), { idempotent: true });
  } catch (_) {}
}

export async function getArtUri(videoId: string, fallbackUrl: string | null): Promise<string | null> {
  // Return local if available, else fallback to remote
  if (await isArtCached(videoId)) {
    return getArtPath(videoId);
  }
  return fallbackUrl;
}

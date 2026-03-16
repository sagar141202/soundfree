import axios from 'axios';

const BASE_URL = process.env.EXPO_PUBLIC_API_URL || 'http://10.53.24.112:8000';

export const api = axios.create({
  baseURL: BASE_URL,
  timeout: 15000,
});

console.log('API URL:', BASE_URL);

export const searchTracks = async (query: string, limit = 20) => {
  const { data } = await api.get('/search', { params: { q: query, limit } });
  return data;
};

export const getStreamUrl = async (videoId: string) => {
  const { data } = await api.get(`/stream/${videoId}`);
  return data;
};

export const getLyrics = async (videoId: string, artist: string, title: string) => {
  const { data } = await api.get(`/lyrics/${videoId}`, { params: { artist, title } });
  return data;
};

export const logPlay = async (videoId: string, track?: {
  title?: string; artist?: string; album?: string | null;
  duration_ms?: number | null; thumbnail_url?: string | null;
}) => {
  try {
    await api.post(`/stream/${videoId}/played`, track || {});
  } catch (_) {}
};

export const likeTrack = async (videoId: string) => {
  const { data } = await api.post(`/likes/${videoId}`);
  return data;
};

export const unlikeTrack = async (videoId: string) => {
  const { data } = await api.delete(`/likes/${videoId}`);
  return data;
};

export const getLikedTracks = async () => {
  const { data } = await api.get('/likes/');
  return data;
};

export const getRecommendations = async (limit = 20) => {
  const { data } = await api.get('/recommendations/cached', { params: { limit } });
  return data;
};

export const getTrendingTracks = async (_query = '', limit = 10) => {
  try {
    const { data } = await api.get('/trending', { params: { limit } });
    return data.slice(0, limit);
  } catch {
    // fallback to search
    const { data } = await api.get('/search', { params: { q: 'top hits 2025', limit } });
    return data;
  }
};

export const getSimilarTracks = async (limit = 10) => {
  try {
    const { data } = await api.get('/recommendations/similar', { params: { limit } });
    return data;
  } catch {
    return [];
  }
};

export const updateDiscordPresence = async (track: {
  title: string; artist: string; album?: string | null;
  position_ms?: number; duration_ms?: number | null; is_playing?: boolean;
}) => {
  try {
    await api.post('/discord/update', {
      title: track.title,
      artist: track.artist,
      album: track.album,
      position_ms: track.position_ms || 0,
      duration_ms: track.duration_ms || 0,
      is_playing: track.is_playing !== false,
    });
  } catch (_) {}
};

export const getDiscordStatus = async () => {
  try {
    const { data } = await api.get('/discord/status');
    return data;
  } catch { return null; }
};

export const setDiscordConfig = async (clientId: string, enabled: boolean) => {
  try {
    const { data } = await api.post('/discord/config', { client_id: clientId, enabled });
    return data;
  } catch { return null; }
};

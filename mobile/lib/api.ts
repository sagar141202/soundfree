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

export const getTrendingTracks = async (query = 'trending music 2025', limit = 10) => {
  const { data } = await api.get('/search', { params: { q: query, limit } });
  return data;
};

export const getSimilarTracks = async (limit = 10) => {
  try {
    const { data } = await api.get('/recommendations/similar', { params: { limit } });
    return data;
  } catch {
    return [];
  }
};

import axios, { AxiosError } from 'axios';

const API_URL = process.env.EXPO_PUBLIC_API_URL || 'http://10.53.24.112:8000';

console.log('API URL:', API_URL);

export const api = axios.create({
  baseURL: API_URL,
  timeout: 15000,
  headers: { 'Content-Type': 'application/json' },
});

api.interceptors.response.use(
  (response) => response,
  (error: AxiosError) => {
    if (!error.response) throw new Error('OFFLINE');
    throw error;
  }
);

export const searchTracks = async (query: string, limit = 20) => {
  const { data } = await api.get('/search', { params: { q: query, limit } });
  return data;
};

export const getStreamUrl = async (videoId: string) => {
  const { data } = await api.get(`/stream/${videoId}`);
  // Use proxy URL for actual playback
  return {
    ...data,
    proxy_url: `${API_URL}/stream/${videoId}/proxy`,
  };
};

export const getMetadata = async (videoId: string) => {
  const { data } = await api.get(`/metadata/${videoId}`);
  return data;
};

export const checkHealth = async () => {
  const { data } = await api.get('/health');
  return data;
};

export const getLyrics = async (videoId: string, artist?: string, title?: string) => {
  const params: any = {};
  if (artist) params.artist = artist;
  if (title) params.title = title;
  const { data } = await api.get(`/lyrics/${videoId}`, { params });
  return data;
};

export const logPlay = async (videoId: string) => {
  try {
    await api.post(`/stream/${videoId}/played`);
  } catch (_) {}
};

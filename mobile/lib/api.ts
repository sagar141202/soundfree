import axios, { AxiosError } from 'axios';

const API_URL = process.env.EXPO_PUBLIC_API_URL || 'http://10.53.24.112:8000';

export const api = axios.create({
  baseURL: API_URL,
  timeout: 10000,
  headers: { 'Content-Type': 'application/json' },
});

// Response interceptor for error handling
api.interceptors.response.use(
  (response) => response,
  (error: AxiosError) => {
    if (!error.response) {
      throw new Error('OFFLINE');
    }
    throw error;
  }
);

// Search tracks
export const searchTracks = async (query: string, limit = 20) => {
  const { data } = await api.get('/search', { params: { q: query, limit } });
  return data;
};

// Get stream URL
export const getStreamUrl = async (videoId: string) => {
  const { data } = await api.get(`/stream/${videoId}`);
  return data;
};

// Get metadata
export const getMetadata = async (videoId: string) => {
  const { data } = await api.get(`/metadata/${videoId}`);
  return data;
};

// Health check
export const checkHealth = async () => {
  const { data } = await api.get('/health');
  return data;
};

import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { QueryClientProvider } from '@tanstack/react-query';
import { queryClient } from '../lib/queryClient';
import { useEffect } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Audio } from 'expo-av';
import { useLibraryStore } from '../stores/libraryStore';
import { usePlaylistStore } from '../stores/playlistStore';
import { useSettingsStore } from '../stores/settingsStore';
import { useHealth } from '../hooks/useHealth';

function OfflineBanner() {
  const { isError } = useHealth();
  if (!isError) return null;
  return (
    <View style={styles.banner}>
      <Text style={styles.bannerText}>⚠️ Backend offline</Text>
    </View>
  );
}

function AppInit() {
  const loadLibrary = useLibraryStore(s => s.loadFromStorage);
  const loadPlaylists = usePlaylistStore(s => s.loadFromStorage);
  const loadSettings = useSettingsStore(s => s.loadFromStorage);

  useEffect(() => {
    loadLibrary();
    loadSettings();

    // Setup audio session for background + media keys
    Audio.setAudioModeAsync({
      staysActiveInBackground: true,
      playsInSilentModeIOS: true,
      shouldDuckAndroid: true,
      playThroughEarpieceAndroid: false,
    });
  }, []);

  return null;
}

export default function RootLayout() {
  return (
    <QueryClientProvider client={queryClient}>
      <StatusBar style="dark" />
      <AppInit />
      <OfflineBanner />
      <Stack screenOptions={{ headerShown: false }} />
    </QueryClientProvider>
  );
}

const styles = StyleSheet.create({
  banner: { backgroundColor: '#FDE68A', paddingVertical: 8, paddingHorizontal: 16, alignItems: 'center' },
  bannerText: { fontSize: 12, fontWeight: '700', color: '#92400E' },
});
// Playlist store loaded in AppInit - handled by libraryStore

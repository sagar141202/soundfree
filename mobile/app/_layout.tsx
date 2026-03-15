import '../global.css';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { QueryClientProvider } from '@tanstack/react-query';
import { queryClient } from '../lib/queryClient';
import { useEffect } from 'react';
import { View, Text, StyleSheet, Animated } from 'react-native';
import { useLibraryStore } from '../stores/libraryStore';
import { useSettingsStore } from '../stores/settingsStore';
import { useHealth } from '../hooks/useHealth';

function OfflineBanner() {
  const { isError } = useHealth();
  if (!isError) return null;
  return (
    <View style={styles.banner}>
      <Text style={styles.bannerText}>⚠️ Backend offline — playing from cache</Text>
    </View>
  );
}

function StoreLoader() {
  const loadLibrary = useLibraryStore(s => s.loadFromStorage);
  const loadSettings = useSettingsStore(s => s.loadFromStorage);
  useEffect(() => { loadLibrary(); loadSettings(); }, []);
  return null;
}

export default function RootLayout() {
  return (
    <QueryClientProvider client={queryClient}>
      <StatusBar style="dark" />
      <StoreLoader />
      <OfflineBanner />
      <Stack screenOptions={{ headerShown: false }} />
    </QueryClientProvider>
  );
}

const styles = StyleSheet.create({
  banner: {
    backgroundColor: '#FDE68A',
    paddingVertical: 8,
    paddingHorizontal: 16,
    alignItems: 'center',
    zIndex: 999,
  },
  bannerText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#92400E',
    letterSpacing: 0.3,
  },
});

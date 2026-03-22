import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { QueryClientProvider } from '@tanstack/react-query';
import { queryClient } from '../lib/queryClient';
import { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useLibraryStore } from '../stores/libraryStore';
import { useSettingsStore } from '../stores/settingsStore';
import { usePlaylistStore } from '../stores/playlistStore';
import { useNetworkStatus } from '../hooks/useNetworkStatus';
import ToastProvider from '../components/ToastProvider';
import { initSentry } from '../services/sentryService';

function OfflineSnackbar() {
  const { isOffline } = useNetworkStatus();
  const slideAnim = useRef(new Animated.Value(100)).current;
  const opacityAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (isOffline) {
      Animated.parallel([
        Animated.spring(slideAnim, { toValue: 0, useNativeDriver: true, tension: 80, friction: 12 }),
        Animated.timing(opacityAnim, { toValue: 1, duration: 300, useNativeDriver: true }),
      ]).start();
    } else {
      Animated.parallel([
        Animated.timing(slideAnim, { toValue: 100, duration: 300, useNativeDriver: true }),
        Animated.timing(opacityAnim, { toValue: 0, duration: 300, useNativeDriver: true }),
      ]).start();
    }
  }, [isOffline]);

  return (
    <Animated.View style={[styles.snackbar, { transform: [{ translateY: slideAnim }], opacity: opacityAnim }]}>
      <LinearGradient colors={['#1E1B4B', '#312E81']} style={StyleSheet.absoluteFillObject} />
      <Text style={styles.snackbarIcon}>📵</Text>
      <View style={styles.snackbarText}>
        <Text style={styles.snackbarTitle}>You're offline</Text>
        <Text style={styles.snackbarSub}>Playing from downloaded library</Text>
      </View>
      <View style={styles.snackbarDot} />
    </Animated.View>
  );
}

function AppInit() {
  useEffect(() => { initSentry(); }, []);
  const loadLibrary = useLibraryStore(s => s.loadFromStorage);
  const loadSettings = useSettingsStore(s => s.loadFromStorage);
  const loadPlaylists = usePlaylistStore(s => s.loadFromStorage);
  useEffect(() => { loadLibrary(); loadSettings(); loadPlaylists(); }, []);
  return null;
}

export default function RootLayout() {
  return (
    <QueryClientProvider client={queryClient}>
      <StatusBar style="dark" />
      <AppInit />
      <Stack screenOptions={{ headerShown: false }} />
      <OfflineSnackbar />
      <ToastProvider />
    </QueryClientProvider>
  );
}

const styles = StyleSheet.create({
  snackbar: {
    position: 'absolute',
    bottom: 152, left: 16, right: 16,
    borderRadius: 18, overflow: 'hidden',
    flexDirection: 'row', alignItems: 'center',
    paddingVertical: 14, paddingHorizontal: 18,
    gap: 12, zIndex: 9999, elevation: 12,
    shadowColor: '#1E1B4B', shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.4, shadowRadius: 12,
    borderWidth: 1, borderColor: 'rgba(167,139,250,0.3)',
  },
  snackbarIcon: { fontSize: 20 },
  snackbarText: { flex: 1 },
  snackbarTitle: { fontSize: 14, fontWeight: '800', color: '#FFFFFF', marginBottom: 2 },
  snackbarSub: { fontSize: 12, color: 'rgba(255,255,255,0.7)' },
  snackbarDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: '#FCA5A5' },
});

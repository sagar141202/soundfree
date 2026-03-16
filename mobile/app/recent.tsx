import {
  View, Text, StyleSheet, TouchableOpacity,
  Dimensions, Animated
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { StatusBar } from 'expo-status-bar';
import { useRef, useEffect } from 'react';
import { router } from 'expo-router';
import { FlashList } from '@shopify/flash-list';
import { useLibraryStore } from '../stores/libraryStore';
import { usePlayTrack } from '../hooks/usePlayTrack';
import TrackListItem from '../components/TrackListItem';
import { usePlayerStore } from '../stores/playerStore';
import { Ionicons } from '@expo/vector-icons';

const { width } = Dimensions.get('window');

export default function RecentlyPlayedScreen() {
  const recentlyPlayed = useLibraryStore(s => s.recentlyPlayed);
  const currentTrack = usePlayerStore(s => s.currentTrack);
  const { playTrack } = usePlayTrack();
  const slideAnim = useRef(new Animated.Value(50)).current;
  const opacityAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.spring(slideAnim, { toValue: 0, useNativeDriver: true, tension: 80, friction: 12 }),
      Animated.timing(opacityAnim, { toValue: 1, duration: 300, useNativeDriver: true }),
    ]).start();
  }, []);

  return (
    <View style={styles.container}>
      <StatusBar style="dark" />
      <LinearGradient colors={['#F0F9FF', '#FAFBFF', '#F0F4FF']} style={StyleSheet.absoluteFillObject} />

      <View style={styles.heroBg} pointerEvents="none">
        <LinearGradient colors={['rgba(125,211,252,0.4)', 'transparent']} style={{ flex: 1, borderRadius: 300 }} />
      </View>

      <Animated.View style={[styles.inner, { transform: [{ translateY: slideAnim }], opacity: opacityAnim }]}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
            <LinearGradient colors={['rgba(125,211,252,0.3)', 'rgba(147,197,253,0.2)']} style={StyleSheet.absoluteFillObject} />
            <Ionicons name="chevron-back" size={22} color="#2563EB" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Recently Played</Text>
          <View style={{ width: 42 }} />
        </View>

        {/* Hero */}
        <View style={styles.hero}>
          <LinearGradient
            colors={['#7DD3FC', '#93C5FD', '#60A5FA']}
            style={styles.heroArt}
            start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
          >
            <Text style={styles.heroEmoji}>🕐</Text>
          </LinearGradient>
          <Text style={styles.heroTitle}>Recently Played</Text>
          <Text style={styles.heroCount}>
            {recentlyPlayed.length} {recentlyPlayed.length === 1 ? 'track' : 'tracks'}
          </Text>

          {recentlyPlayed.length > 0 && (
            <TouchableOpacity
              style={styles.playAllBtn}
              onPress={() => playTrack(recentlyPlayed[0], recentlyPlayed)}
            >
              <LinearGradient colors={['#7DD3FC', '#93C5FD']} style={StyleSheet.absoluteFillObject} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} />
              <Ionicons name="play" size={18} color="#1D4ED8" />
              <Text style={styles.playAllText}>Continue Playing</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Track list */}
        {recentlyPlayed.length === 0 ? (
          <View style={styles.emptyWrap}>
            <View style={styles.emptyCard}>
              <LinearGradient colors={['rgba(125,211,252,0.15)', 'rgba(147,197,253,0.08)']} style={StyleSheet.absoluteFillObject} />
              <Text style={styles.emptyEmoji}>🎵</Text>
              <Text style={styles.emptyTitle}>Nothing played yet</Text>
              <Text style={styles.emptySub}>Your listening history will appear here</Text>
              <TouchableOpacity
                style={styles.discoverBtn}
                onPress={() => router.push('/(tabs)/search')}
              >
                <LinearGradient colors={['#7DD3FC', '#93C5FD']} style={StyleSheet.absoluteFillObject} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} />
                <Text style={styles.discoverText}>Start Listening</Text>
              </TouchableOpacity>
            </View>
          </View>
        ) : (
          <FlashList
            data={recentlyPlayed}
            estimatedItemSize={72}
            keyExtractor={(item) => item.video_id}
            contentContainerStyle={styles.list}
            showsVerticalScrollIndicator={false}
            renderItem={({ item, index }) => (
              <TrackListItem
                track={item}
                index={index}
                isPlaying={currentTrack?.video_id === item.video_id}
                onPress={() => playTrack(item, recentlyPlayed)}
              />
            )}
            ListFooterComponent={<View style={{ height: 160 }} />}
          />
        )}
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FAFBFF' },
  heroBg: { position: 'absolute', top: -100, right: -80, width: width * 1.2, height: 400, borderRadius: 300 },
  inner: { flex: 1 },
  header: {
    flexDirection: 'row', alignItems: 'center',
    paddingTop: 56, paddingHorizontal: 24, paddingBottom: 8,
  },
  backBtn: {
    width: 42, height: 42, borderRadius: 21,
    alignItems: 'center', justifyContent: 'center',
    overflow: 'hidden', borderWidth: 1.5,
    borderColor: 'rgba(125,211,252,0.4)',
  },
  headerTitle: { flex: 1, textAlign: 'center', fontSize: 17, fontWeight: '800', color: '#1E1B4B' },
  hero: { alignItems: 'center', paddingVertical: 24, paddingHorizontal: 24 },
  heroArt: {
    width: 140, height: 140, borderRadius: 28,
    alignItems: 'center', justifyContent: 'center',
    marginBottom: 16, borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.9)',
  },
  heroEmoji: { fontSize: 60 },
  heroTitle: { fontSize: 28, fontWeight: '900', color: '#1E1B4B', marginBottom: 4 },
  heroCount: { fontSize: 14, color: '#6B7280', marginBottom: 20 },
  playAllBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    paddingHorizontal: 28, paddingVertical: 13,
    borderRadius: 30, overflow: 'hidden',
    borderWidth: 1.5, borderColor: 'rgba(125,211,252,0.6)',
  },
  playAllText: { fontSize: 14, fontWeight: '700', color: '#1D4ED8' },
  list: { paddingTop: 8 },
  emptyWrap: { flex: 1, padding: 24, justifyContent: 'center' },
  emptyCard: {
    padding: 40, borderRadius: 28, overflow: 'hidden',
    alignItems: 'center', borderWidth: 1.5,
    borderColor: 'rgba(125,211,252,0.2)',
  },
  emptyEmoji: { fontSize: 56, marginBottom: 16 },
  emptyTitle: { fontSize: 20, fontWeight: '800', color: '#1E1B4B', marginBottom: 8 },
  emptySub: { fontSize: 14, color: '#6B7280', textAlign: 'center', lineHeight: 22, marginBottom: 24 },
  discoverBtn: {
    paddingHorizontal: 28, paddingVertical: 13,
    borderRadius: 30, overflow: 'hidden',
  },
  discoverText: { fontSize: 14, fontWeight: '700', color: '#1D4ED8' },
});

import {
  View, Text, StyleSheet, TouchableOpacity,
  Dimensions, Animated
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { StatusBar } from 'expo-status-bar';
import { useRef, useEffect, useState } from 'react';
import { router } from 'expo-router';
import { FlashList } from '@shopify/flash-list';
import { useLibraryStore } from '../stores/libraryStore';
import { usePlayTrack } from '../hooks/usePlayTrack';
import { useLike } from '../hooks/useLike';
import TrackListItem from '../components/TrackListItem';
import { usePlayerStore } from '../stores/playerStore';
import { Ionicons } from '@expo/vector-icons';
import { HeroSkeleton, TrackRowSkeleton } from '../components/Skeleton';

const { width } = Dimensions.get('window');

export default function LikedSongsScreen() {
  const [loading, setLoading] = useState(true);
  const likedTracks = useLibraryStore(s => s.likedTracks);
  const currentTrack = usePlayerStore(s => s.currentTrack);
  const { playTrack } = usePlayTrack();
  const slideAnim = useRef(new Animated.Value(50)).current;
  const opacityAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    setTimeout(() => setLoading(false), 400);
    Animated.parallel([
      Animated.spring(slideAnim, { toValue: 0, useNativeDriver: true, tension: 80, friction: 12 }),
      Animated.timing(opacityAnim, { toValue: 1, duration: 300, useNativeDriver: true }),
    ]).start();
  }, []);

  const playAll = () => {
    if (likedTracks.length > 0) playTrack(likedTracks[0], likedTracks);
  };

  const shufflePlay = () => {
    if (likedTracks.length === 0) return;
    const shuffled = [...likedTracks].sort(() => Math.random() - 0.5);
    playTrack(shuffled[0], shuffled);
  };

  return (
    <View style={styles.container}>
      <StatusBar style="dark" />
      <LinearGradient colors={['#FDF2F8', '#FFF0FB', '#FAFBFF']} style={StyleSheet.absoluteFillObject} />

      {/* Hero blob */}
      <View style={styles.heroBg} pointerEvents="none">
        <LinearGradient colors={['rgba(251,207,232,0.6)', 'transparent']} style={{ flex: 1, borderRadius: 300 }} />
      </View>

      <Animated.View style={[styles.inner, { transform: [{ translateY: slideAnim }], opacity: opacityAnim }]}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
            <LinearGradient colors={['rgba(251,207,232,0.4)', 'rgba(249,168,212,0.2)']} style={StyleSheet.absoluteFillObject} />
            <Ionicons name="chevron-back" size={22} color="#DB2777" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Liked Songs</Text>
          <View style={{ width: 42 }} />
        </View>

        {/* Hero section */}
        <View style={styles.hero}>
          <LinearGradient colors={['#FBCFE8', '#F9A8D4', '#E879F9']} style={styles.heroArt} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}>
            <Text style={styles.heroEmoji}>❤️</Text>
          </LinearGradient>
          <Text style={styles.heroTitle}>Liked Songs</Text>
          <Text style={styles.heroCount}>{likedTracks.length} {likedTracks.length === 1 ? 'song' : 'songs'}</Text>

          {likedTracks.length > 0 && (
            <View style={styles.heroControls}>
              <TouchableOpacity style={styles.playAllBtn} onPress={playAll} accessibilityLabel="Play all liked songs" accessibilityRole="button">
                <LinearGradient colors={['#FBCFE8', '#F9A8D4']} style={StyleSheet.absoluteFillObject} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} />
                <Ionicons name="play" size={18} color="#DB2777" />
                <Text style={styles.playAllText}>Play All</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.shuffleBtn} onPress={shufflePlay} accessibilityLabel="Shuffle liked songs" accessibilityRole="button">
                <LinearGradient colors={['rgba(251,207,232,0.3)', 'rgba(249,168,212,0.2)']} style={StyleSheet.absoluteFillObject} />
                <Ionicons name="shuffle" size={18} color="#DB2777" />
                <Text style={styles.shuffleText}>Shuffle</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>

        {/* Track list */}
        {likedTracks.length === 0 ? (
          <View style={styles.emptyWrap}>
            <View style={styles.emptyCard}>
              <LinearGradient colors={['rgba(251,207,232,0.2)', 'rgba(249,168,212,0.1)']} style={StyleSheet.absoluteFillObject} />
              <Text style={styles.emptyEmoji}>🎵</Text>
              <Text style={styles.emptyTitle}>No liked songs yet</Text>
              <Text style={styles.emptySub}>Tap the ❤️ on any track to add it here</Text>
              <TouchableOpacity style={styles.discoverBtn} onPress={() => router.push('/(tabs)/search')}>
                <LinearGradient colors={['#FBCFE8', '#F9A8D4']} style={StyleSheet.absoluteFillObject} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} />
                <Text style={styles.discoverText}>Discover Music</Text>
              </TouchableOpacity>
            </View>
          </View>
        ) : (
          <FlashList
            data={likedTracks}
            estimatedItemSize={72}
            keyExtractor={(item) => item.video_id}
            contentContainerStyle={styles.list}
            showsVerticalScrollIndicator={false}
            renderItem={({ item, index }) => (
              <TrackListItem
                track={item}
                index={index}
                isPlaying={currentTrack?.video_id === item.video_id}
                onPress={() => playTrack(item, likedTracks)}
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
  heroBg: { position: 'absolute', top: -100, left: -80, width: width * 1.2, height: 400, borderRadius: 300 },
  inner: { flex: 1 },
  header: {
    flexDirection: 'row', alignItems: 'center',
    paddingTop: 56, paddingHorizontal: 24, paddingBottom: 8,
  },
  backBtn: {
    width: 42, height: 42, borderRadius: 21,
    alignItems: 'center', justifyContent: 'center',
    overflow: 'hidden', borderWidth: 1.5,
    borderColor: 'rgba(251,207,232,0.5)',
  },
  headerTitle: { flex: 1, textAlign: 'center', fontSize: 17, fontWeight: '800', color: '#1E1B4B' },
  hero: { alignItems: 'center', paddingVertical: 24, paddingHorizontal: 24 },
  heroArt: {
    width: 140, height: 140, borderRadius: 28,
    alignItems: 'center', justifyContent: 'center',
    marginBottom: 16,
    borderWidth: 2, borderColor: 'rgba(255,255,255,0.9)',
  },
  heroEmoji: { fontSize: 60 },
  heroTitle: { fontSize: 28, fontWeight: '900', color: '#1E1B4B', marginBottom: 4 },
  heroCount: { fontSize: 14, color: '#6B7280', marginBottom: 20 },
  heroControls: { flexDirection: 'row', gap: 12 },
  playAllBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    paddingHorizontal: 24, paddingVertical: 12,
    borderRadius: 30, overflow: 'hidden',
    borderWidth: 1.5, borderColor: 'rgba(251,207,232,0.8)',
  },
  playAllText: { fontSize: 14, fontWeight: '700', color: '#DB2777' },
  shuffleBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    paddingHorizontal: 24, paddingVertical: 12,
    borderRadius: 30, overflow: 'hidden',
    borderWidth: 1.5, borderColor: 'rgba(251,207,232,0.4)',
  },
  shuffleText: { fontSize: 14, fontWeight: '600', color: '#DB2777' },
  list: { paddingTop: 8 },
  emptyWrap: { flex: 1, padding: 24, justifyContent: 'center' },
  emptyCard: {
    padding: 40, borderRadius: 28, overflow: 'hidden',
    alignItems: 'center', borderWidth: 1.5,
    borderColor: 'rgba(251,207,232,0.3)',
  },
  emptyEmoji: { fontSize: 56, marginBottom: 16 },
  emptyTitle: { fontSize: 20, fontWeight: '800', color: '#1E1B4B', marginBottom: 8 },
  emptySub: { fontSize: 14, color: '#6B7280', textAlign: 'center', lineHeight: 22, marginBottom: 24 },
  discoverBtn: {
    paddingHorizontal: 28, paddingVertical: 13,
    borderRadius: 30, overflow: 'hidden',
  },
  discoverText: { fontSize: 14, fontWeight: '700', color: '#DB2777' },
});

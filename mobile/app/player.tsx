import {
  View, Text, StyleSheet, TouchableOpacity,
  Dimensions, Animated, Image
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { StatusBar } from 'expo-status-bar';
import { useRef, useEffect, useState } from 'react';
import { router } from 'expo-router';
import { usePlayerStore } from '../stores/playerStore';
import { usePlayTrack, seekToPosition } from '../hooks/usePlayTrack';
import ProgressBar from '../components/ProgressBar';

const { width, height } = Dimensions.get('window');

const THUMB_COLORS = [
  ['#C4B5FD', '#A78BFA'],
  ['#7DD3FC', '#93C5FD'],
  ['#86EFAC', '#6EE7B7'],
  ['#FDE68A', '#FCA5A5'],
  ['#FBCFE8', '#F9A8D4'],
];

function BlurredBackground({ imageUrl }: { imageUrl: string | null }) {
  const opacity = useRef(new Animated.Value(0)).current;
  const [currentUrl, setCurrentUrl] = useState(imageUrl);
  const [nextUrl, setNextUrl] = useState<string | null>(null);
  const nextOpacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(opacity, { toValue: 1, duration: 400, useNativeDriver: true }).start();
  }, []);

  useEffect(() => {
    if (imageUrl === currentUrl) return;
    setNextUrl(imageUrl);
    nextOpacity.setValue(0);
    Animated.timing(nextOpacity, { toValue: 1, duration: 600, useNativeDriver: true }).start(() => {
      setCurrentUrl(imageUrl);
      setNextUrl(null);
      nextOpacity.setValue(0);
    });
  }, [imageUrl]);

  return (
    <View style={StyleSheet.absoluteFillObject}>
      <LinearGradient colors={['#F0F4FF', '#FAFBFF', '#F8F0FF']} style={StyleSheet.absoluteFillObject} />
      {currentUrl && (
        <Animated.Image source={{ uri: currentUrl }} style={[styles.bgImage, { opacity }]} blurRadius={25} resizeMode="cover" />
      )}
      {nextUrl && (
        <Animated.Image source={{ uri: nextUrl }} style={[styles.bgImage, { opacity: nextOpacity }]} blurRadius={25} resizeMode="cover" />
      )}
      <LinearGradient
        colors={['rgba(250,251,255,0.75)', 'rgba(240,244,255,0.6)', 'rgba(248,240,255,0.75)']}
        style={StyleSheet.absoluteFillObject}
      />
    </View>
  );
}

export default function FullPlayer() {
  const currentTrack = usePlayerStore(s => s.currentTrack);
  const isPlaying = usePlayerStore(s => s.isPlaying);
  const position = usePlayerStore(s => s.position);
  const duration = usePlayerStore(s => s.duration);
  const isShuffled = usePlayerStore(s => s.isShuffled);
  const repeatMode = usePlayerStore(s => s.repeatMode);
  const nextTrack = usePlayerStore(s => s.nextTrack);
  const previousTrack = usePlayerStore(s => s.previousTrack);
  const toggleShuffle = usePlayerStore(s => s.toggleShuffle);
  const toggleRepeat = usePlayerStore(s => s.toggleRepeat);
  const { togglePlayPause } = usePlayTrack();

  const artScale = useRef(new Animated.Value(0.92)).current;
  const slideAnim = useRef(new Animated.Value(height)).current;
  const artOpacity = useRef(new Animated.Value(1)).current;
  const [liked, setLiked] = useState(false);
  const prevTrackId = useRef<string | null>(null);

  useEffect(() => {
    Animated.spring(slideAnim, { toValue: 0, useNativeDriver: true, tension: 60, friction: 12 }).start();
  }, []);

  useEffect(() => {
    Animated.spring(artScale, {
      toValue: isPlaying ? 1.0 : 0.92,
      useNativeDriver: true, tension: 60, friction: 10,
    }).start();
  }, [isPlaying]);

  useEffect(() => {
    if (!currentTrack) return;
    if (prevTrackId.current && prevTrackId.current !== currentTrack.video_id) {
      Animated.sequence([
        Animated.timing(artOpacity, { toValue: 0, duration: 150, useNativeDriver: true }),
        Animated.timing(artOpacity, { toValue: 1, duration: 200, useNativeDriver: true }),
      ]).start();
    }
    prevTrackId.current = currentTrack.video_id;
  }, [currentTrack?.video_id]);

  if (!currentTrack) { router.back(); return null; }

  const colorIndex = currentTrack.video_id.charCodeAt(0) % THUMB_COLORS.length;

  const ACTIONS = [
    { icon: '⬇️', label: 'Download', onPress: () => {} },
    { icon: '🎵', label: 'Lyrics', onPress: () => router.push('/lyrics') },
    { icon: '📋', label: 'Queue', onPress: () => {} },
    { icon: '⏱️', label: 'Sleep', onPress: () => {} },
    { icon: '↗️', label: 'Share', onPress: () => {} },
  ];

  return (
    <Animated.View style={[styles.container, { transform: [{ translateY: slideAnim }] }]}>
      <StatusBar style="dark" />
      <BlurredBackground imageUrl={currentTrack.thumbnail_url} />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
          <LinearGradient colors={['rgba(167,139,250,0.2)', 'rgba(167,139,250,0.1)']} style={StyleSheet.absoluteFillObject} />
          <Text style={styles.backIcon}>↓</Text>
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <Text style={styles.headerLabel}>NOW PLAYING</Text>
          {currentTrack.album && <Text style={styles.headerAlbum} numberOfLines={1}>{currentTrack.album}</Text>}
        </View>
        <TouchableOpacity style={styles.moreBtn}>
          <Text style={styles.moreIcon}>⋮</Text>
        </TouchableOpacity>
      </View>

      {/* Album Art */}
      <View style={styles.artWrap}>
        <Animated.View style={[styles.artContainer, { transform: [{ scale: artScale }], opacity: artOpacity }]}>
          <View style={styles.artShadow} />
          {currentTrack.thumbnail_url ? (
            <Image source={{ uri: currentTrack.thumbnail_url }} style={styles.art} resizeMode="cover" />
          ) : (
            <LinearGradient colors={THUMB_COLORS[colorIndex] as [string, string]} style={styles.art}>
              <Text style={styles.artEmoji}>��</Text>
            </LinearGradient>
          )}
        </Animated.View>
      </View>

      {/* Track info */}
      <View style={styles.trackInfo}>
        <View style={styles.trackInfoRow}>
          <View style={styles.trackInfoText}>
            <Text style={styles.trackTitle} numberOfLines={1}>{currentTrack.title}</Text>
            <Text style={styles.trackArtist} numberOfLines={1}>{currentTrack.artist}</Text>
          </View>
          <TouchableOpacity style={styles.likeBtn} onPress={() => setLiked(!liked)}>
            <Text style={styles.likeIcon}>{liked ? '❤️' : '🤍'}</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Progress Bar */}
      <ProgressBar position={position} duration={duration} onSeek={seekToPosition} />

      {/* Controls */}
      <View style={styles.controls}>
        <TouchableOpacity style={styles.controlBtn} onPress={toggleShuffle}>
          <Text style={[styles.controlIcon, isShuffled && styles.controlActive]}>⇄</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.controlBtn} onPress={previousTrack}>
          <Text style={styles.controlIconLg}>⏮</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.playBtn} onPress={togglePlayPause}>
          <LinearGradient colors={['#C4B5FD', '#A78BFA', '#818CF8']} style={styles.playGrad} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}>
            <Text style={styles.playIcon}>{isPlaying ? '⏸' : '▶'}</Text>
          </LinearGradient>
        </TouchableOpacity>
        <TouchableOpacity style={styles.controlBtn} onPress={nextTrack}>
          <Text style={styles.controlIconLg}>⏭</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.controlBtn} onPress={toggleRepeat}>
          <Text style={[styles.controlIcon, repeatMode !== 'none' && styles.controlActive]}>
            {repeatMode === 'one' ? '🔂' : '🔁'}
          </Text>
        </TouchableOpacity>
      </View>

      {/* Action row */}
      <View style={styles.actionRow}>
        {ACTIONS.map((a, i) => (
          <TouchableOpacity key={i} style={styles.actionBtn} onPress={a.onPress}>
            <View style={styles.actionIconWrap}>
              <LinearGradient colors={['rgba(167,139,250,0.15)', 'rgba(125,211,252,0.08)']} style={StyleSheet.absoluteFillObject} />
              <Text style={styles.actionIcon}>{a.icon}</Text>
            </View>
            <Text style={styles.actionLabel}>{a.label}</Text>
          </TouchableOpacity>
        ))}
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  bgImage: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, width, height },
  header: { flexDirection: 'row', alignItems: 'center', paddingTop: 56, paddingHorizontal: 24, paddingBottom: 8 },
  backBtn: { width: 42, height: 42, borderRadius: 21, alignItems: 'center', justifyContent: 'center', overflow: 'hidden', borderWidth: 1.5, borderColor: 'rgba(167,139,250,0.3)' },
  backIcon: { fontSize: 20, color: '#7C3AED' },
  headerCenter: { flex: 1, alignItems: 'center' },
  headerLabel: { fontSize: 11, color: '#7C3AED', fontWeight: '800', letterSpacing: 2 },
  headerAlbum: { fontSize: 12, color: '#6B7280', marginTop: 2, maxWidth: 200 },
  moreBtn: { width: 42, height: 42, alignItems: 'center', justifyContent: 'center' },
  moreIcon: { fontSize: 24, color: '#6B7280' },
  artWrap: { alignItems: 'center', paddingVertical: 16 },
  artContainer: { position: 'relative' },
  artShadow: { position: 'absolute', top: 12, left: 12, right: 12, bottom: -8, borderRadius: 28, backgroundColor: 'rgba(167,139,250,0.3)' },
  art: { width: width * 0.72, height: width * 0.72, borderRadius: 28, alignItems: 'center', justifyContent: 'center', borderWidth: 2, borderColor: 'rgba(255,255,255,0.9)' },
  artEmoji: { fontSize: 80 },
  trackInfo: { paddingHorizontal: 28, marginBottom: 8 },
  trackInfoRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  trackInfoText: { flex: 1 },
  trackTitle: { fontSize: 24, fontWeight: '900', color: '#1E1B4B', letterSpacing: -0.5, marginBottom: 4 },
  trackArtist: { fontSize: 16, color: '#6B7280', fontWeight: '500' },
  likeBtn: { width: 44, height: 44, alignItems: 'center', justifyContent: 'center' },
  likeIcon: { fontSize: 26 },
  controls: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 28, marginBottom: 24 },
  controlBtn: { width: 48, height: 48, alignItems: 'center', justifyContent: 'center' },
  controlIcon: { fontSize: 22, color: '#9CA3AF' },
  controlActive: { color: '#7C3AED' },
  controlIconLg: { fontSize: 28, color: '#1E1B4B' },
  playBtn: { borderRadius: 40, overflow: 'hidden' },
  playGrad: { width: 72, height: 72, borderRadius: 36, alignItems: 'center', justifyContent: 'center' },
  playIcon: { fontSize: 28, color: '#FFFFFF' },
  actionRow: { flexDirection: 'row', justifyContent: 'space-around', paddingHorizontal: 24 },
  actionBtn: { alignItems: 'center', gap: 6 },
  actionIconWrap: { width: 48, height: 48, borderRadius: 16, alignItems: 'center', justifyContent: 'center', overflow: 'hidden', borderWidth: 1.5, borderColor: 'rgba(167,139,250,0.2)' },
  actionIcon: { fontSize: 20 },
  actionLabel: { fontSize: 11, color: '#6B7280', fontWeight: '600' },
});

import {
  View, Text, StyleSheet, TouchableOpacity,
  Dimensions, Animated
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { StatusBar } from 'expo-status-bar';
import { useRef, useEffect, useState } from 'react';
import { router } from 'expo-router';
import { usePlayerStore } from '../stores/playerStore';
import { usePlayTrack, seekToPosition } from '../hooks/usePlayTrack';
import { useAccentColor } from '../hooks/useAccentColor';
import { useLike } from '../hooks/useLike';
import ProgressBar from '../components/ProgressBar';
import LyricsView from '../components/LyricsView';
import ProgressiveImage from '../components/ProgressiveImage';
import AddToPlaylistSheet from '../components/AddToPlaylistSheet';
import DownloadButton from '../components/DownloadButton';

const { width, height } = Dimensions.get('window');

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
  const { getPalette } = useAccentColor();

  const artScale = useRef(new Animated.Value(0.92)).current;
  const slideAnim = useRef(new Animated.Value(height)).current;
  const artOpacity = useRef(new Animated.Value(1)).current;
  const lyricsSlide = useRef(new Animated.Value(height)).current;
  const { liked, toggleLike } = useLike(currentTrack);
  const [showLyrics, setShowLyrics] = useState(false);
  const [showAddToPlaylist, setShowAddToPlaylist] = useState(false);
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

  const toggleLyrics = () => {
    if (!showLyrics) {
      setShowLyrics(true);
      Animated.spring(lyricsSlide, { toValue: 0, useNativeDriver: true, tension: 70, friction: 12 }).start();
    } else {
      Animated.timing(lyricsSlide, { toValue: height, duration: 300, useNativeDriver: true }).start(() => setShowLyrics(false));
    }
  };

  if (!currentTrack) { router.back(); return null; }

  const palette = getPalette(currentTrack.video_id);
  const artSize = width * 0.72;

  return (
    <Animated.View style={[styles.container, { transform: [{ translateY: slideAnim }] }]}>
      <StatusBar style="dark" />
      <BlurredBackground imageUrl={currentTrack.thumbnail_url} />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={[styles.backBtn, { borderColor: palette.light }]} onPress={() => router.back()}>
          <LinearGradient colors={[palette.light, 'rgba(255,255,255,0.1)']} style={StyleSheet.absoluteFillObject} />
          <Text style={[styles.backIcon, { color: palette.accent }]}>↓</Text>
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <Text style={[styles.headerLabel, { color: palette.accent }]}>NOW PLAYING</Text>
          {currentTrack.album && <Text style={styles.headerAlbum} numberOfLines={1}>{currentTrack.album}</Text>}
        </View>
        <TouchableOpacity style={styles.moreBtn} onPress={() => setShowAddToPlaylist(true)}>
          <Text style={styles.moreIcon}>⋮</Text>
        </TouchableOpacity>
      </View>

      {/* Album Art — progressive load */}
      <View style={styles.artWrap}>
        <Animated.View style={[{ transform: [{ scale: artScale }], opacity: artOpacity }]}>
          <View style={[styles.artShadow, { backgroundColor: palette.light, width: artSize, height: artSize }]} />
          <ProgressiveImage
            videoId={currentTrack.video_id}
            thumbnailUrl={currentTrack.thumbnail_url}
            style={{ width: artSize, height: artSize }}
            borderRadius={28}
            fallbackColors={palette.bg}
            fallbackEmoji="🎵"
          />
        </Animated.View>
      </View>

      {/* Track info */}
      <View style={styles.trackInfo}>
        <View style={styles.trackInfoRow}>
          <View style={styles.trackInfoText}>
            <Text style={styles.trackTitle} numberOfLines={1}>{currentTrack.title}</Text>
            <TouchableOpacity onPress={() => router.push({ pathname: "/artist/[name]", params: { name: currentTrack.artist } })}><Text style={styles.trackArtist} numberOfLines={1}>{currentTrack.artist}</Text></TouchableOpacity>
          </View>
          <TouchableOpacity style={styles.likeBtn} onPress={toggleLike}>
            <Text style={styles.likeIcon}>{liked ? '❤️' : '🤍'}</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Progress Bar */}
      <ProgressBar position={position} duration={duration} onSeek={seekToPosition} accentColors={palette.bg} />

      {/* Controls */}
      <View style={styles.controls}>
        <TouchableOpacity style={styles.controlBtn} onPress={toggleShuffle}>
          <Text style={[styles.controlIcon, isShuffled && { color: palette.accent }]}>⇄</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.controlBtn} onPress={previousTrack}>
          <Text style={styles.controlIconLg}>⏮</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.playBtn} onPress={togglePlayPause}>
          <LinearGradient colors={palette.bg} style={styles.playGrad} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}>
            <Text style={styles.playIcon}>{isPlaying ? '⏸' : '▶'}</Text>
          </LinearGradient>
        </TouchableOpacity>
        <TouchableOpacity style={styles.controlBtn} onPress={nextTrack}>
          <Text style={styles.controlIconLg}>⏭</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.controlBtn} onPress={toggleRepeat}>
          <Text style={[styles.controlIcon, repeatMode !== 'none' && { color: palette.accent }, repeatMode === 'none' && { opacity: 0.4 }]}>
            {repeatMode === 'one' ? '🔂' : '🔁'}
          </Text>
        </TouchableOpacity>
      </View>

      {/* Action row */}
      <View style={styles.actionRow}>
        {[
          { icon: '⬇️', label: 'Download', onPress: () => {}, active: false, isDownload: true },
          { icon: '🎵', label: showLyrics ? 'Hide' : 'Lyrics', onPress: toggleLyrics, active: showLyrics },
          { icon: '📋', label: 'Queue', onPress: () => router.push('/queue'), active: false },
          { icon: '⏱️', label: 'Sleep', onPress: () => {}, active: false },
          { icon: '↗️', label: 'Share', onPress: () => {}, active: false },
        ].map((a: any, i) => (
          <View key={i} style={styles.actionBtn}>
            {a.isDownload ? (
              <>
                <View style={[styles.actionIconWrap, { overflow: 'hidden' }]}>
                  <LinearGradient colors={['rgba(167,139,250,0.1)', 'rgba(125,211,252,0.05)']} style={StyleSheet.absoluteFillObject} />
                  <DownloadButton track={currentTrack} size={24} />
                </View>
                <Text style={styles.actionLabel}>Download</Text>
              </>
            ) : (
              <TouchableOpacity onPress={a.onPress} style={{ alignItems: 'center', gap: 6 }}>
                <View style={[styles.actionIconWrap, a.active && { borderColor: palette.accent }]}>
                  <LinearGradient
                    colors={a.active ? [palette.light, palette.light] : ['rgba(167,139,250,0.1)', 'rgba(125,211,252,0.05)']}
                    style={StyleSheet.absoluteFillObject}
                  />
                  <Text style={styles.actionIcon}>{a.icon}</Text>
                </View>
                <Text style={[styles.actionLabel, a.active && { color: palette.accent }]}>{a.label}</Text>
              </TouchableOpacity>
            )}
          </View>
        ))}
      </View>

      {/* Lyrics overlay */}
      {showLyrics && (
        <Animated.View style={[styles.lyricsOverlay, { transform: [{ translateY: lyricsSlide }] }]}>
          <LinearGradient colors={['rgba(250,251,255,0.98)', 'rgba(240,244,255,0.98)']} style={StyleSheet.absoluteFillObject} />
          {currentTrack.thumbnail_url && (
            <Animated.Image source={{ uri: currentTrack.thumbnail_url }} style={[StyleSheet.absoluteFillObject, { opacity: 0.06 }]} blurRadius={30} resizeMode="cover" />
          )}
          <View style={styles.lyricsHeader}>
            <View style={[styles.lyricsPill, { backgroundColor: palette.light }]} />
            <View style={styles.lyricsHeaderRow}>
              <View>
                <Text style={styles.lyricsTitle}>Lyrics</Text>
                <Text style={styles.lyricsSubtitle} numberOfLines={1}>{currentTrack.title}</Text>
              </View>
              <TouchableOpacity style={[styles.lyricsCloseBtn, { borderColor: palette.light }]} onPress={toggleLyrics}>
                <LinearGradient colors={[palette.light, 'rgba(255,255,255,0.1)']} style={StyleSheet.absoluteFillObject} />
                <Text style={[styles.lyricsCloseIcon, { color: palette.accent }]}>↓</Text>
              </TouchableOpacity>
            </View>
          </View>
          <LyricsView videoId={currentTrack.video_id} artist={currentTrack.artist} title={currentTrack.title} accentColor={palette.accent} />
        </Animated.View>
      )}
      {showAddToPlaylist && currentTrack && (
        <AddToPlaylistSheet
          track={currentTrack}
          onClose={() => setShowAddToPlaylist(false)}
        />
      )}
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  bgImage: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, width, height },
  header: { flexDirection: 'row', alignItems: 'center', paddingTop: 56, paddingHorizontal: 24, paddingBottom: 8 },
  backBtn: { width: 42, height: 42, borderRadius: 21, alignItems: 'center', justifyContent: 'center', overflow: 'hidden', borderWidth: 1.5 },
  backIcon: { fontSize: 20 },
  headerCenter: { flex: 1, alignItems: 'center' },
  headerLabel: { fontSize: 11, fontWeight: '800', letterSpacing: 2 },
  headerAlbum: { fontSize: 12, color: '#6B7280', marginTop: 2, maxWidth: 200 },
  moreBtn: { width: 42, height: 42, alignItems: 'center', justifyContent: 'center' },
  moreIcon: { fontSize: 24, color: '#6B7280' },
  artWrap: { alignItems: 'center', paddingVertical: 16 },
  artShadow: { position: 'absolute', top: 12, left: 12, right: 12, bottom: -8, borderRadius: 28 },
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
  controlIconLg: { fontSize: 28, color: '#1E1B4B' },
  playBtn: { borderRadius: 40, overflow: 'hidden' },
  playGrad: { width: 72, height: 72, borderRadius: 36, alignItems: 'center', justifyContent: 'center' },
  playIcon: { fontSize: 28, color: '#FFFFFF' },
  actionRow: { flexDirection: 'row', justifyContent: 'space-around', paddingHorizontal: 24 },
  actionBtn: { alignItems: 'center', gap: 6 },
  actionIconWrap: { width: 48, height: 48, borderRadius: 16, alignItems: 'center', justifyContent: 'center', overflow: 'hidden', borderWidth: 1.5, borderColor: 'rgba(167,139,250,0.2)' },
  actionIcon: { fontSize: 20 },
  actionLabel: { fontSize: 11, color: '#6B7280', fontWeight: '600' },
  lyricsOverlay: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, borderTopLeftRadius: 32, borderTopRightRadius: 32, overflow: 'hidden' },
  lyricsHeader: { paddingTop: 12, paddingHorizontal: 24, paddingBottom: 8 },
  lyricsPill: { width: 40, height: 4, borderRadius: 2, alignSelf: 'center', marginBottom: 16 },
  lyricsHeaderRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  lyricsTitle: { fontSize: 24, fontWeight: '900', color: '#1E1B4B' },
  lyricsSubtitle: { fontSize: 13, color: '#6B7280', marginTop: 2 },
  lyricsCloseBtn: { width: 42, height: 42, borderRadius: 21, alignItems: 'center', justifyContent: 'center', overflow: 'hidden', borderWidth: 1.5 },
  lyricsCloseIcon: { fontSize: 20 },
});

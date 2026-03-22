import {
  View, Text, TouchableOpacity, Image,
  StyleSheet, Animated, PanResponder
} from 'react-native';
import { useRef, useEffect } from 'react';
import { LinearGradient } from 'expo-linear-gradient';
import PlayPauseButton from './PlayPauseButton';
import { router } from 'expo-router';
import { usePlayerStore } from '../stores/playerStore';
import { usePlayTrack } from '../hooks/usePlayTrack';

const THUMB_COLORS = [
  ['#C4B5FD','#A78BFA'],['#7DD3FC','#93C5FD'],
  ['#86EFAC','#6EE7B7'],['#FDE68A','#FCA5A5'],
  ['#FBCFE8','#F9A8D4'],
];

export default function MiniPlayer({ onPress }: { onPress?: () => void }) {
  const currentTrack = usePlayerStore(s => s.currentTrack);
  const isPlaying = usePlayerStore(s => s.isPlaying);
  const position = usePlayerStore(s => s.position);
  const duration = usePlayerStore(s => s.duration);
  const nextTrack = usePlayerStore(s => s.nextTrack);
  const { togglePlayPause } = usePlayTrack();
  const slideAnim = useRef(new Animated.Value(100)).current;
  const playBtnScale = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    Animated.spring(slideAnim, {
      toValue: currentTrack ? 0 : 100,
      useNativeDriver: true, tension: 80, friction: 10,
    }).start();
  }, [!!currentTrack]);

  const panResponder = useRef(PanResponder.create({
    onMoveShouldSetPanResponder: (_, { dx, dy }) =>
      Math.abs(dx) > Math.abs(dy) && Math.abs(dx) > 10,
    onPanResponderRelease: (_, { dx }) => { if (dx < -50) nextTrack(); },
  })).current;

  if (!currentTrack) return null;

  const colorIndex = currentTrack.video_id.charCodeAt(0) % THUMB_COLORS.length;
  const progress = duration > 0 ? `${Math.round((position / duration) * 100)}%` : '0%';

  return (
    <Animated.View
      style={[styles.wrapper, { transform: [{ translateY: slideAnim }] }]}
      {...panResponder.panHandlers}
    >
      <LinearGradient
        colors={['rgba(255,255,255,0.97)', 'rgba(240,244,255,0.97)']}
        style={StyleSheet.absoluteFillObject}
      />
      <View style={styles.border} />
      <View style={styles.progressBg}>
        <LinearGradient
          colors={['#C4B5FD','#7DD3FC']}
          style={[styles.progressFill, { width: progress }]}
          start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
        />
      </View>
      <TouchableOpacity
        style={styles.content}
        onPress={() => router.push('/player')}
        accessibilityLabel="Open full player"
        accessibilityRole="button"
        activeOpacity={0.9}
      >
        <View style={styles.thumbWrap}>
          {currentTrack.thumbnail_url
            ? <Image source={{ uri: currentTrack.thumbnail_url }} style={styles.thumb} resizeMode="cover" />
            : <LinearGradient colors={THUMB_COLORS[colorIndex] as [string,string]} style={styles.thumb}><Text style={{ fontSize: 18 }}>🎵</Text></LinearGradient>
          }
        </View>
        <View style={styles.info}>
          <Text style={styles.title} numberOfLines={1}>{currentTrack.title}</Text>
          <Text style={styles.artist} numberOfLines={1}>{currentTrack.artist}</Text>
        </View>
        <View style={styles.controls}>
          <PlayPauseButton
            isPlaying={isPlaying}
            onPress={(e?: any) => { togglePlayPause(); }} accessibilityLabel={isPlaying ? "Pause" : "Play"} accessibilityRole="button"
            size={44}
            colors={['#C4B5FD', '#A78BFA']}
          />
          <TouchableOpacity
            style={styles.nextBtn}
            onPress={(e) => { e.stopPropagation(); nextTrack(); }} accessibilityLabel="Next track" accessibilityRole="button"
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <Text style={styles.nextIcon}>⏭</Text>
          </TouchableOpacity>
        </View>
      </TouchableOpacity>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    position: 'absolute',
    bottom: 80, left: 12, right: 12,
    borderRadius: 22, overflow: 'hidden',
    borderWidth: 1.5, borderColor: 'rgba(167,139,250,0.25)',
    shadowColor: '#A78BFA', shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2, shadowRadius: 12, elevation: 8, zIndex: 100,
  },
  border: { position: 'absolute', inset: 0, borderRadius: 22, borderWidth: 1, borderColor: 'rgba(255,255,255,0.8)' },
  progressBg: { height: 3, backgroundColor: 'rgba(167,139,250,0.15)' },
  progressFill: { height: 3, borderRadius: 2 },
  content: { flexDirection: 'row', alignItems: 'center', padding: 12, gap: 12 },
  thumbWrap: { width: 48, height: 48, borderRadius: 12, overflow: 'hidden' },
  thumb: { width: 48, height: 48, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  info: { flex: 1 },
  title: { fontSize: 14, fontWeight: '700', color: '#1E1B4B', marginBottom: 2 },
  artist: { fontSize: 12, color: '#6B7280' },
  controls: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  playBtn: { borderRadius: 22, overflow: 'hidden' },
  playGrad: { width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center' },
  playIcon: { fontSize: 16 },
  nextBtn: { width: 44, height: 44, alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(167,139,250,0.12)', borderRadius: 22, borderWidth: 1, borderColor: 'rgba(167,139,250,0.2)' },
  nextIcon: { fontSize: 14 },
});

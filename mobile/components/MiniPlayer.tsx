import {
  View, Text, TouchableOpacity, Image,
  StyleSheet, Animated, PanResponder, Dimensions
} from 'react-native';
import { useRef, useEffect } from 'react';
import { LinearGradient } from 'expo-linear-gradient';
import { usePlayerStore } from '../stores/playerStore';
import { useUIStore } from '../stores/uiStore';

const { width } = Dimensions.get('window');

const THUMB_COLORS = [
  ['#C4B5FD', '#A78BFA'],
  ['#7DD3FC', '#93C5FD'],
  ['#86EFAC', '#6EE7B7'],
  ['#FDE68A', '#FCA5A5'],
  ['#FBCFE8', '#F9A8D4'],
];

interface MiniPlayerProps {
  onPress?: () => void;
}

export default function MiniPlayer({ onPress }: MiniPlayerProps) {
  const currentTrack = usePlayerStore(s => s.currentTrack);
  const isPlaying = usePlayerStore(s => s.isPlaying);
  const setIsPlaying = usePlayerStore(s => s.setIsPlaying);
  const nextTrack = usePlayerStore(s => s.nextTrack);
  const accentColor = useUIStore(s => s.accentColor);

  const slideAnim = useRef(new Animated.Value(100)).current;
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const playBtnScale = useRef(new Animated.Value(1)).current;

  // Slide up when track appears
  useEffect(() => {
    if (currentTrack) {
      Animated.spring(slideAnim, {
        toValue: 0,
        useNativeDriver: true,
        tension: 80,
        friction: 10,
      }).start();
    } else {
      Animated.timing(slideAnim, {
        toValue: 100,
        duration: 200,
        useNativeDriver: true,
      }).start();
    }
  }, [currentTrack]);

  // Swipe gesture
  const panResponder = useRef(
    PanResponder.create({
      onMoveShouldSetPanResponder: (_, { dx, dy }) =>
        Math.abs(dx) > Math.abs(dy) && Math.abs(dx) > 10,
      onPanResponderRelease: (_, { dx }) => {
        if (dx < -50) {
          // Swipe left = next
          Animated.sequence([
            Animated.timing(scaleAnim, { toValue: 0.95, duration: 100, useNativeDriver: true }),
            Animated.timing(scaleAnim, { toValue: 1, duration: 100, useNativeDriver: true }),
          ]).start();
          nextTrack();
        }
      },
    })
  ).current;

  const handlePlayPause = () => {
    Animated.sequence([
      Animated.timing(playBtnScale, { toValue: 0.85, duration: 80, useNativeDriver: true }),
      Animated.spring(playBtnScale, { toValue: 1, useNativeDriver: true, tension: 200 }),
    ]).start();
    setIsPlaying(!isPlaying);
  };

  if (!currentTrack) return null;

  const colorIndex = currentTrack.video_id.charCodeAt(0) % THUMB_COLORS.length;

  return (
    <Animated.View
      style={[styles.wrapper, { transform: [{ translateY: slideAnim }] }]}
      {...panResponder.panHandlers}
    >
      {/* Glass background */}
      <LinearGradient
        colors={['rgba(255,255,255,0.95)', 'rgba(240,244,255,0.95)']}
        style={StyleSheet.absoluteFillObject}
      />
      <View style={styles.border} />

      {/* Progress bar at top */}
      <View style={styles.progressBg}>
        <LinearGradient
          colors={['#C4B5FD', '#7DD3FC']}
          style={[styles.progressFill, { width: '35%' }]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
        />
      </View>

      <TouchableOpacity
        style={styles.content}
        onPress={onPress}
        activeOpacity={0.9}
      >
        {/* Thumbnail */}
        <Animated.View style={[styles.thumbWrap, { transform: [{ scale: scaleAnim }] }]}>
          {currentTrack.thumbnail_url ? (
            <Image
              source={{ uri: currentTrack.thumbnail_url }}
              style={styles.thumb}
              resizeMode="cover"
            />
          ) : (
            <LinearGradient
              colors={THUMB_COLORS[colorIndex] as [string, string]}
              style={styles.thumb}
            >
              <Text style={{ fontSize: 18 }}>🎵</Text>
            </LinearGradient>
          )}
        </Animated.View>

        {/* Track info */}
        <View style={styles.info}>
          <Text style={styles.title} numberOfLines={1}>
            {currentTrack.title}
          </Text>
          <Text style={styles.artist} numberOfLines={1}>
            {currentTrack.artist}
          </Text>
        </View>

        {/* Controls */}
        <View style={styles.controls}>
          {/* Play/Pause */}
          <Animated.View style={{ transform: [{ scale: playBtnScale }] }}>
            <TouchableOpacity
              style={styles.playBtn}
              onPress={handlePlayPause}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
              <LinearGradient
                colors={['#C4B5FD', '#A78BFA']}
                style={styles.playGrad}
              >
                <Text style={styles.playIcon}>
                  {isPlaying ? '⏸' : '▶'}
                </Text>
              </LinearGradient>
            </TouchableOpacity>
          </Animated.View>

          {/* Next */}
          <TouchableOpacity
            style={styles.nextBtn}
            onPress={nextTrack}
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
    bottom: 72,
    left: 12,
    right: 12,
    borderRadius: 22,
    overflow: 'hidden',
    borderWidth: 1.5,
    borderColor: 'rgba(167,139,250,0.25)',
    shadowColor: '#A78BFA',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 12,
    elevation: 8,
    zIndex: 100,
  },
  border: {
    position: 'absolute', inset: 0,
    borderRadius: 22,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.8)',
  },
  progressBg: {
    height: 3,
    backgroundColor: 'rgba(167,139,250,0.15)',
  },
  progressFill: {
    height: 3,
    borderRadius: 2,
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    gap: 12,
  },
  thumbWrap: {
    width: 48, height: 48,
    borderRadius: 12,
    overflow: 'hidden',
  },
  thumb: {
    width: 48, height: 48,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  info: { flex: 1 },
  title: {
    fontSize: 14, fontWeight: '700',
    color: '#1E1B4B', marginBottom: 2,
  },
  artist: { fontSize: 12, color: '#6B7280' },
  controls: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  playBtn: { borderRadius: 22, overflow: 'hidden' },
  playGrad: {
    width: 44, height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  playIcon: { fontSize: 16 },
  nextBtn: {
    width: 36, height: 36,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(167,139,250,0.12)',
    borderRadius: 18,
    borderWidth: 1,
    borderColor: 'rgba(167,139,250,0.2)',
  },
  nextIcon: { fontSize: 14 },
});

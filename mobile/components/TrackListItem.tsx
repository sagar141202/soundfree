import {
  View, Text, TouchableOpacity, Image,
  StyleSheet, Animated
} from 'react-native';
import { useRef } from 'react';
import { LinearGradient } from 'expo-linear-gradient';

export interface Track {
  video_id: string;
  title: string;
  artist: string;
  album: string | null;
  duration_ms: number | null;
  thumbnail_url: string | null;
}

interface TrackListItemProps {
  track: Track;
  index?: number;
  isPlaying?: boolean;
  onPress?: () => void;
  onMorePress?: () => void;
}

function formatDuration(ms: number | null): string {
  if (!ms) return '--:--';
  const totalSeconds = Math.floor(ms / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes}:${seconds.toString().padStart(2, '0')}`;
}

const THUMB_COLORS = [
  ['#C4B5FD', '#A78BFA'],
  ['#7DD3FC', '#93C5FD'],
  ['#86EFAC', '#6EE7B7'],
  ['#FDE68A', '#FCA5A5'],
  ['#FBCFE8', '#F9A8D4'],
  ['#A5F3FC', '#67E8F9'],
];

export default function TrackListItem({
  track,
  index = 0,
  isPlaying = false,
  onPress,
  onMorePress,
}: TrackListItemProps) {
  const scaleAnim = useRef(new Animated.Value(1)).current;

  const handlePressIn = () => {
    Animated.spring(scaleAnim, {
      toValue: 0.97,
      useNativeDriver: true,
      tension: 100,
      friction: 8,
    }).start();
  };

  const handlePressOut = () => {
    Animated.spring(scaleAnim, {
      toValue: 1,
      useNativeDriver: true,
      tension: 100,
      friction: 8,
    }).start();
  };

  return (
    <Animated.View style={[styles.wrapper, { transform: [{ scale: scaleAnim }] }]}>
      <TouchableOpacity
        style={[styles.container, isPlaying && styles.containerActive]}
        onPress={onPress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        activeOpacity={1}
      >
        {/* Active indicator */}
        {isPlaying && (
          <LinearGradient
            colors={['rgba(167,139,250,0.15)', 'rgba(125,211,252,0.08)']}
            style={StyleSheet.absoluteFillObject}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
          />
        )}

        {/* Left accent bar when playing */}
        {isPlaying && <View style={styles.activeBar} />}

        {/* Thumbnail */}
        <View style={styles.thumbWrap}>
          {track.thumbnail_url ? (
            <Image
              source={{ uri: track.thumbnail_url }}
              style={styles.thumb}
              resizeMode="cover"
            />
          ) : (
            <LinearGradient
              colors={THUMB_COLORS[index % THUMB_COLORS.length] as [string, string]}
              style={styles.thumb}
            >
              <Text style={styles.thumbIcon}>🎵</Text>
            </LinearGradient>
          )}
          {isPlaying && (
            <View style={styles.playingOverlay}>
              <Text style={styles.playingIcon}>▶</Text>
            </View>
          )}
        </View>

        {/* Track info */}
        <View style={styles.info}>
          <Text
            style={[styles.title, isPlaying && styles.titleActive]}
            numberOfLines={1}
          >
            {track.title}
          </Text>
          <Text style={styles.artist} numberOfLines={1}>
            {track.artist}
            {track.album ? ` · ${track.album}` : ''}
          </Text>
        </View>

        {/* Duration */}
        <Text style={styles.duration}>
          {formatDuration(track.duration_ms)}
        </Text>

        {/* 3-dot menu */}
        <TouchableOpacity
          style={styles.moreBtn}
          onPress={onMorePress}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <View style={styles.dotWrap}>
            <View style={styles.dot} />
            <View style={styles.dot} />
            <View style={styles.dot} />
          </View>
        </TouchableOpacity>
      </TouchableOpacity>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  wrapper: { marginHorizontal: 24, marginBottom: 6 },
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 18,
    gap: 12,
    backgroundColor: 'rgba(255,255,255,0.7)',
    borderWidth: 1.5,
    borderColor: 'rgba(255,255,255,0.9)',
    overflow: 'hidden',
  },
  containerActive: {
    borderColor: 'rgba(167,139,250,0.4)',
  },
  activeBar: {
    position: 'absolute',
    left: 0, top: 8, bottom: 8,
    width: 3, borderRadius: 2,
    backgroundColor: '#A78BFA',
  },
  thumbWrap: {
    width: 48, height: 48,
    borderRadius: 12,
    overflow: 'hidden',
    position: 'relative',
  },
  thumb: {
    width: 48, height: 48,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  thumbIcon: { fontSize: 20 },
  playingOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(167,139,250,0.6)',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 12,
  },
  playingIcon: { fontSize: 14, color: '#FFFFFF' },
  info: { flex: 1, gap: 3 },
  title: {
    fontSize: 15, fontWeight: '700',
    color: '#1E1B4B', letterSpacing: -0.2,
  },
  titleActive: { color: '#7C3AED' },
  artist: { fontSize: 12, color: '#6B7280' },
  duration: {
    fontSize: 12, color: '#9CA3AF',
    fontWeight: '500', minWidth: 36,
    textAlign: 'right',
  },
  moreBtn: { padding: 4 },
  dotWrap: { gap: 3, alignItems: 'center' },
  dot: {
    width: 4, height: 4,
    borderRadius: 2,
    backgroundColor: '#C4B5FD',
  },
});

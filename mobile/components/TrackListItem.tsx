import { Image,View, Text, TouchableOpacity, StyleSheet, Animated } from 'react-native';
import { useRef, memo } from 'react';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useEffect, useState } from 'react';
import { isDownloaded } from '../hooks/useDownload';
import { useNetworkStatus } from '../hooks/useNetworkStatus';

export interface Track {
  video_id: string;
  title: string;
  artist: string;
  album: string | null;
  duration_ms: number | null;
  thumbnail_url: string | null;
  stream_url?: string;
}

const THUMB_COLORS = [
  ['#C4B5FD','#A78BFA'],['#7DD3FC','#93C5FD'],
  ['#86EFAC','#6EE7B7'],['#FDE68A','#FCA5A5'],
  ['#FBCFE8','#F9A8D4'],['#A5F3FC','#67E8F9']
];

function formatDuration(ms: number | null): string {
  if (!ms) return '--:--';
  const s = Math.floor(ms / 1000);
  return `${Math.floor(s / 60)}:${(s % 60).toString().padStart(2, '0')}`;
}

function TrackListItem({
  track, index = 0, isPlaying = false, onPress, onMorePress
}: {
  track: Track;
  index?: number;
  isPlaying?: boolean;
  onPress?: () => void;
  onMorePress?: () => void;
}) {
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const [downloaded, setDownloaded] = useState(false);
  const { isOffline } = useNetworkStatus();

  useEffect(() => {
    isDownloaded(track.video_id).then(setDownloaded);
  }, [track.video_id]);

  return (
    <Animated.View style={[styles.wrapper, { transform: [{ scale: scaleAnim }] }]}>
      {/* Main tap area */}
      <TouchableOpacity
        style={[styles.container, isPlaying && styles.containerActive, isOffline && !downloaded && styles.containerOffline]}
        onPress={onPress}
        onPressIn={() => Animated.spring(scaleAnim, { toValue: 0.97, useNativeDriver: true, tension: 100, friction: 8 }).start()}
        onPressOut={() => Animated.spring(scaleAnim, { toValue: 1, useNativeDriver: true, tension: 100, friction: 8 }).start()}
        activeOpacity={0.9}
      accessibilityLabel={isPlaying ? `Now playing: ${track.title} by ${track.artist}` : `Play ${track.title} by ${track.artist}`}
      accessibilityRole="button"
      >
        {isPlaying && (
          <LinearGradient
            colors={['rgba(167,139,250,0.15)','rgba(125,211,252,0.08)']}
            style={StyleSheet.absoluteFillObject}
            start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
          />
        )}
        {isPlaying && <View style={styles.activeBar} />}

        {/* Thumbnail */}
        <View style={styles.thumbWrap}>
          {track.thumbnail_url
            ? <Image source={{ uri: track.thumbnail_url }} style={styles.thumb} resizeMode="cover" />
            : (
              <LinearGradient
                colors={THUMB_COLORS[index % THUMB_COLORS.length] as [string,string]}
                style={styles.thumb}
              >
                <Text style={{ fontSize: 20 }}>🎵</Text>
              </LinearGradient>
            )
          }
          {isPlaying && (
            <View style={styles.playingOverlay}>
              <Text style={styles.playingIcon}>▶</Text>
            </View>
          )}
        </View>

        {/* Info */}
        <View style={styles.info}>
          <Text style={[styles.title, isPlaying && styles.titleActive]} numberOfLines={1}>
            {track.title}
          </Text>
          <Text style={styles.artist} numberOfLines={1}>
            {track.artist}{track.album ? ` · ${track.album}` : ''}
          </Text>
        </View>

        {/* Duration */}
        <View style={styles.rightSection}>
          {downloaded && (
            <Ionicons name="arrow-down-circle" size={14} color="#86EFAC" style={styles.downloadedIcon} />
          )}
          <Text style={styles.duration}>{formatDuration(track.duration_ms)}</Text>
        </View>

        {/* 3-dot button — INSIDE TouchableOpacity but stops propagation */}
        <TouchableOpacity
          style={styles.moreBtn}
          onPress={(e) => {
            e.stopPropagation();
            onMorePress?.();
          }}
          hitSlop={{ top: 20, bottom: 20, left: 20, right: 20 }}
          activeOpacity={0.6}
        >
          <LinearGradient
            colors={['rgba(167,139,250,0.15)', 'rgba(125,211,252,0.08)']}
            style={styles.moreBtnGrad}
          >
            <View style={styles.dot} />
            <View style={styles.dot} />
            <View style={styles.dot} />
          </LinearGradient>
        </TouchableOpacity>
      </TouchableOpacity>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  wrapper: { marginHorizontal: 24, marginBottom: 6 },
  container: {
    flexDirection: 'row', alignItems: 'center',
    padding: 12, borderRadius: 18, gap: 12,
    backgroundColor: 'rgba(255,255,255,0.7)',
    borderWidth: 1.5, borderColor: 'rgba(255,255,255,0.9)',
    overflow: 'hidden',
  },
  containerActive: { borderColor: 'rgba(167,139,250,0.4)' },
  containerOffline: { opacity: 0.4 },
  activeBar: {
    position: 'absolute', left: 0, top: 8, bottom: 8,
    width: 3, borderRadius: 2, backgroundColor: '#A78BFA',
  },
  thumbWrap: { width: 48, height: 48, borderRadius: 12, overflow: 'hidden' },
  thumb: {
    width: 48, height: 48, borderRadius: 12,
    alignItems: 'center', justifyContent: 'center',
  },
  playingOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(167,139,250,0.6)',
    alignItems: 'center', justifyContent: 'center', borderRadius: 12,
  },
  playingIcon: { fontSize: 14, color: '#FFFFFF' },
  info: { flex: 1, gap: 3 },
  title: { fontSize: 15, fontWeight: '700', color: '#1E1B4B' },
  titleActive: { color: '#7C3AED' },
  artist: { fontSize: 12, color: '#6B7280' },
  rightSection: { alignItems: 'flex-end', gap: 2 },
  downloadedIcon: { marginBottom: 1 },
  duration: {
    fontSize: 12, color: '#9CA3AF',
    fontWeight: '500', minWidth: 36, textAlign: 'right',
  },
  moreBtn: { marginLeft: 4, minWidth: 44, minHeight: 44, alignItems: 'center', justifyContent: 'center' },
  moreBtnGrad: {
    width: 32, height: 32, borderRadius: 10,
    alignItems: 'center', justifyContent: 'center',
    gap: 3,
  },
  dot: { width: 3.5, height: 3.5, borderRadius: 2, backgroundColor: '#A78BFA' },
});

export default memo(TrackListItem, (prev, next) => {
  return prev.track.video_id === next.track.video_id &&
    prev.isPlaying === next.isPlaying &&
    prev.index === next.index;
});

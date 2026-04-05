import { View, Text, StyleSheet, Animated, TouchableOpacity, Dimensions } from 'react-native';
import { useRef, useEffect } from 'react';
import { LinearGradient } from 'expo-linear-gradient';
import TrackListItem from './TrackListItem';
import type { Track } from './TrackListItem';
import EmptyState from './EmptyState';

const { width } = Dimensions.get('window');
const AnimatedLinearGradient = Animated.createAnimatedComponent(LinearGradient);

interface SkeletonGlassItemProps {
  index: number;
}

function SkeletonGlassItem({ index }: SkeletonGlassItemProps) {
  const shimmerAnim = useRef(new Animated.Value(0)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // Fade in
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 400,
      delay: index * 80,
      useNativeDriver: true,
    }).start();

    // Shimmer loop
    const shimmer = Animated.loop(
      Animated.timing(shimmerAnim, {
        toValue: 1,
        duration: 1500,
        useNativeDriver: true,
      })
    );
    shimmer.start();

    return () => shimmer.stop();
  }, [index]);

  const shimmerTranslate = shimmerAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [-width, width],
  });

  return (
    <Animated.View style={[styles.skeletonRow, { opacity: fadeAnim }]}>
      {/* Glass container */}
      <LinearGradient
        colors={['rgba(255,255,255,0.3)', 'rgba(255,255,255,0.15)']}
        style={StyleSheet.absoluteFillObject}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      />

      {/* Shimmer overlay */}
      <Animated.View
        style={[
          styles.shimmerOverlay,
          {
            transform: [{ translateX: shimmerTranslate }],
          },
        ]}
      >
        <LinearGradient
          colors={['transparent', 'rgba(255,255,255,0.4)', 'transparent']}
          style={StyleSheet.absoluteFillObject}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
        />
      </Animated.View>

      {/* Skeleton content */}
      <View style={styles.skeletonThumb} />
      <View style={styles.skeletonInfo}>
        <View style={[styles.skeletonLine, { width: `${65 + (index % 3) * 10}%` }]} />
        <View style={[styles.skeletonLine, { width: `${40 + (index % 4) * 10}%`, height: 10, opacity: 0.5 }]} />
      </View>
    </Animated.View>
  );
}

interface GlassResultItemProps {
  track: Track;
  index: number;
  isPlaying: boolean;
  onPress: () => void;
  onMorePress: () => void;
}

function GlassResultItem({ track, index, isPlaying, onPress, onMorePress }: GlassResultItemProps) {
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.95)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 400,
        delay: index * 60,
        useNativeDriver: true,
      }),
      Animated.spring(scaleAnim, {
        toValue: 1,
        friction: 8,
        tension: 100,
        delay: index * 60,
        useNativeDriver: true,
      }),
    ]).start();
  }, [index]);

  return (
    <Animated.View
      style={[
        styles.resultItemContainer,
        {
          opacity: fadeAnim,
          transform: [{ scale: scaleAnim }],
        },
      ]}
    >
      <TouchableOpacity
        activeOpacity={0.9}
        onPress={onPress}
        style={styles.resultItem}
      >
        {/* Glass background */}
        <LinearGradient
          colors={isPlaying
            ? ['rgba(167,139,250,0.2)', 'rgba(125,211,252,0.15)']
            : ['rgba(255,255,255,0.4)', 'rgba(255,255,255,0.2)']
          }
          style={StyleSheet.absoluteFillObject}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
        />

        {/* Active playing indicator */}
        {isPlaying && (
          <View style={styles.playingIndicator}>
            <Animated.View style={styles.playingDot} />
          </View>
        )}

        <TrackListItem
          track={track}
          index={index}
          isPlaying={isPlaying}
          onPress={onPress}
          onMorePress={onMorePress}
        />
      </TouchableOpacity>
    </Animated.View>
  );
}

interface GlassSearchResultsProps {
  tracks: Track[];
  isLoading: boolean;
  query: string;
  currentTrackId?: string;
  onTrackPress?: (track: Track) => void;
  onMorePress?: (track: Track) => void;
  onClearSearch?: () => void;
}

export default function GlassSearchResults({
  tracks,
  isLoading,
  query,
  currentTrackId,
  onTrackPress,
  onMorePress,
  onClearSearch,
}: GlassSearchResultsProps) {
  const headerFadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(headerFadeAnim, {
      toValue: 1,
      duration: 400,
      useNativeDriver: true,
    }).start();
  }, []);

  if (isLoading) {
    return (
      <View style={styles.container}>
        <View style={styles.loadingHeader}>
          <Text style={styles.loadingText}>Searching for "{query}"...</Text>
          <View style={styles.loadingDots}>
            <View style={styles.dot} />
            <View style={styles.dot} />
            <View style={styles.dot} />
          </View>
        </View>
        {Array.from({ length: 6 }).map((_, i) => (
          <SkeletonGlassItem key={i} index={i} />
        ))}
      </View>
    );
  }

  if (!isLoading && tracks.length === 0 && query.length >= 2) {
    return (
      <EmptyState
        emoji="🔮"
        title={`No results for "${query}"`}
        subtitle="Try different keywords or browse our curated categories"
        actionLabel="Clear search"
        onAction={onClearSearch}
      />
    );
  }

  return (
    <View style={styles.container}>
      {tracks.length > 0 && (
        <Animated.View style={[styles.resultsHeader, { opacity: headerFadeAnim }]}>
          <LinearGradient
            colors={['rgba(167,139,250,0.1)', 'transparent']}
            style={StyleSheet.absoluteFillObject}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
          />
          <Text style={styles.resultsCount}>
            <Text style={styles.countNumber}>{tracks.length}</Text> results
          </Text>
          <Text style={styles.resultsQuery}>for "{query}"</Text>
        </Animated.View>
      )}

      <View style={styles.resultsList}>
        {tracks.map((track, index) => (
          <GlassResultItem
            key={track.video_id}
            track={track}
            index={index}
            isPlaying={track.video_id === currentTrackId}
            onPress={() => onTrackPress?.(track)}
            onMorePress={() => onMorePress?.(track)}
          />
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  loadingHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    marginBottom: 20,
    gap: 8,
  },
  loadingText: {
    fontSize: 14,
    color: '#6B7280',
    fontWeight: '500',
  },
  loadingDots: {
    flexDirection: 'row',
    gap: 4,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#A78BFA',
  },
  resultsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 16,
    marginBottom: 16,
    borderRadius: 16,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(167,139,250,0.15)',
  },
  resultsCount: {
    fontSize: 14,
    color: '#6B7280',
    fontWeight: '500',
  },
  countNumber: {
    fontSize: 18,
    fontWeight: '800',
    color: '#7C3AED',
  },
  resultsQuery: {
    fontSize: 14,
    color: '#9CA3AF',
    marginLeft: 4,
    fontStyle: 'italic',
  },
  resultsList: {
    gap: 8,
  },
  resultItemContainer: {
    borderRadius: 20,
    overflow: 'hidden',
  },
  resultItem: {
    borderRadius: 20,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.5)',
    shadowColor: '#A78BFA',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 4,
  },
  playingIndicator: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    width: 4,
    backgroundColor: '#A78BFA',
    borderTopLeftRadius: 20,
    borderBottomLeftRadius: 20,
  },
  playingDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#A78BFA',
    marginTop: 'auto',
    marginBottom: 'auto',
    marginLeft: -2,
    shadowColor: '#A78BFA',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 6,
  },
  skeletonRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
    padding: 14,
    borderRadius: 18,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.4)',
    gap: 12,
  },
  shimmerOverlay: {
    ...StyleSheet.absoluteFillObject,
    width: 100,
  },
  skeletonThumb: {
    width: 52,
    height: 52,
    borderRadius: 14,
    backgroundColor: 'rgba(167,139,250,0.15)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.3)',
  },
  skeletonInfo: {
    flex: 1,
    gap: 10,
  },
  skeletonLine: {
    height: 12,
    borderRadius: 6,
    backgroundColor: 'rgba(167,139,250,0.15)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.3)',
  },
});

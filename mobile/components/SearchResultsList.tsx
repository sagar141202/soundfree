import { View, Text, StyleSheet, Animated } from 'react-native';
import { FlashList } from '@shopify/flash-list';
import { useRef, useEffect } from 'react';
import { LinearGradient } from 'expo-linear-gradient';
import TrackListItem, { Track } from './TrackListItem';
import EmptyState from './EmptyState';

interface SearchResultsListProps {
  tracks: Track[];
  isLoading: boolean;
  query: string;
  currentTrackId?: string;
  onTrackPress?: (track: Track) => void;
  onMorePress?: (track: Track) => void;
  onClearSearch?: () => void;
}

function SkeletonItem({ index }: { index: number }) {
  const shimmer = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(shimmer, {
          toValue: 1, duration: 900,
          useNativeDriver: true, delay: index * 80,
        }),
        Animated.timing(shimmer, {
          toValue: 0, duration: 900,
          useNativeDriver: true,
        }),
      ])
    ).start();
  }, []);

  const opacity = shimmer.interpolate({ inputRange: [0, 1], outputRange: [0.4, 0.9] });

  return (
    <Animated.View style={[styles.skeletonRow, { opacity }]}>
      <LinearGradient colors={['#E9D5FF', '#DDD6FE']} style={styles.skeletonThumb} />
      <View style={styles.skeletonInfo}>
        <LinearGradient
          colors={['#E9D5FF', '#DDD6FE']}
          style={[styles.skeletonLine, { width: `${60 + (index % 3) * 12}%` }]}
        />
        <LinearGradient
          colors={['#F3E8FF', '#EDE9FE']}
          style={[styles.skeletonLine, { width: `${35 + (index % 4) * 8}%`, height: 10, opacity: 0.6 }]}
        />
      </View>
      <LinearGradient colors={['#E9D5FF', '#DDD6FE']} style={styles.skeletonDur} />
    </Animated.View>
  );
}

export default function SearchResultsList({
  tracks,
  isLoading,
  query,
  currentTrackId,
  onTrackPress,
  onMorePress,
  onClearSearch,
}: SearchResultsListProps) {

  if (isLoading) {
    return (
      <View style={styles.container}>
        <Text style={styles.resultsLabel}>Searching for "{query}"...</Text>
        {Array.from({ length: 6 }).map((_, i) => (
          <SkeletonItem key={i} index={i} />
        ))}
      </View>
    );
  }

  if (!isLoading && tracks.length === 0 && query.length >= 2) {
    return (
      <EmptyState
        emoji="🔍"
        title={`No results for "${query}"`}
        subtitle="Try different keywords, check spelling, or browse a category"
        actionLabel="Clear search"
        onAction={onClearSearch}
      />
    );
  }

  return (
    <View style={styles.container}>
      {tracks.length > 0 && (
        <Text style={styles.resultsLabel}>
          {tracks.length} results for "{query}"
        </Text>
      )}
      <FlashList
        data={tracks}
        estimatedItemSize={72}
        keyExtractor={(item) => item.video_id}
        scrollEnabled={false}
        renderItem={({ item, index }) => (
          <TrackListItem
            track={item}
            index={index}
            isPlaying={item.video_id === currentTrackId}
            onPress={() => onTrackPress?.(item)}
            onMorePress={() => onMorePress?.(item)}
          />
        )}
        ItemSeparatorComponent={() => <View style={{ height: 2 }} />}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { paddingBottom: 20 },
  resultsLabel: {
    fontSize: 13, color: '#9CA3AF',
    paddingHorizontal: 24, marginBottom: 12, fontWeight: '500',
  },
  skeletonRow: {
    flexDirection: 'row', alignItems: 'center',
    marginHorizontal: 24, marginBottom: 8,
    padding: 12, borderRadius: 18, gap: 12,
    backgroundColor: 'rgba(255,255,255,0.7)',
    borderWidth: 1.5, borderColor: 'rgba(255,255,255,0.9)',
  },
  skeletonThumb: { width: 48, height: 48, borderRadius: 12 },
  skeletonInfo: { flex: 1, gap: 8 },
  skeletonLine: { height: 13, borderRadius: 6 },
  skeletonDur: { width: 32, height: 12, borderRadius: 6 },
});

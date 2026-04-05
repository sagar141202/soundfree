import { View, Text, StyleSheet, ScrollView, Animated, Dimensions } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { StatusBar } from 'expo-status-bar';
import { useState, useRef, useEffect } from 'react';
import LiquidSearchBar from '../../components/LiquidSearchBar';
import GlassCategories from '../../components/GlassCategories';
import GlassSearchResults from '../../components/GlassSearchResults';
import AddToPlaylistSheet from '../../components/AddToPlaylistSheet';
import { useSearch } from '../../hooks/useSearch';
import { usePlayTrack } from '../../hooks/usePlayTrack';
import type { Track } from '../../components/TrackListItem';

const { width, height } = Dimensions.get('window');

// Animated background blob component
function AnimatedBlob({
  colors,
  size,
  startPosition,
  duration,
  delay,
}: {
  colors: string[];
  size: number;
  startPosition: { x: number; y: number };
  duration: number;
  delay: number;
}) {
  const anim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const animation = Animated.loop(
      Animated.sequence([
        Animated.timing(anim, {
          toValue: 1,
          duration: duration,
          delay: delay,
          useNativeDriver: true,
        }),
        Animated.timing(anim, {
          toValue: 0,
          duration: duration,
          useNativeDriver: true,
        }),
      ])
    );
    animation.start();
    return () => animation.stop();
  }, []);

  const translateX = anim.interpolate({
    inputRange: [0, 0.5, 1],
    outputRange: [startPosition.x, startPosition.x + 50, startPosition.x],
  });

  const translateY = anim.interpolate({
    inputRange: [0, 0.5, 1],
    outputRange: [startPosition.y, startPosition.y - 80, startPosition.y],
  });

  const scale = anim.interpolate({
    inputRange: [0, 0.5, 1],
    outputRange: [1, 1.15, 1],
  });

  return (
    <Animated.View
      style={[
        styles.blob,
        {
          width: size,
          height: size,
          borderRadius: size / 2,
          transform: [
            { translateX },
            { translateY },
            { scale },
          ],
        },
      ]}
    >
      <LinearGradient
        colors={colors}
        style={StyleSheet.absoluteFillObject}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      />
    </Animated.View>
  );
}

// Floating music note decoration
function FloatingNote({ emoji, startX, startY, delay }: { emoji: string; startX: number; startY: number; delay: number }) {
  const anim = useRef(new Animated.Value(0)).current;
  const opacityAnim = useRef(new Animated.Value(0.3)).current;

  useEffect(() => {
    const float = Animated.loop(
      Animated.sequence([
        Animated.parallel([
          Animated.timing(anim, {
            toValue: 1,
            duration: 4000,
            delay: delay,
            useNativeDriver: true,
          }),
          Animated.timing(opacityAnim, {
            toValue: 0.6,
            duration: 2000,
            delay: delay,
            useNativeDriver: true,
          }),
        ]),
        Animated.parallel([
          Animated.timing(anim, {
            toValue: 0,
            duration: 4000,
            useNativeDriver: true,
          }),
          Animated.timing(opacityAnim, {
            toValue: 0.3,
            duration: 2000,
            useNativeDriver: true,
          }),
        ]),
      ])
    );
    float.start();
    return () => float.stop();
  }, []);

  const translateY = anim.interpolate({
    inputRange: [0, 1],
    outputRange: [startY, startY - 40],
  });

  return (
    <Animated.Text
      style={[
        styles.floatingNote,
        {
          left: startX,
          transform: [{ translateY }],
          opacity: opacityAnim,
        },
      ]}
    >
      {emoji}
    </Animated.Text>
  );
}

export default function SearchScreen() {
  const [query, setQuery] = useState('');
  const [selectedTrack, setSelectedTrack] = useState<Track | null>(null);
  const { data: tracks = [], isLoading } = useSearch(query);
  const { playTrack } = usePlayTrack();
  const scrollY = useRef(new Animated.Value(0)).current;

  const handleMorePress = (track: Track) => {
    setSelectedTrack(track);
  };

  // Header animation based on scroll
  const headerOpacity = scrollY.interpolate({
    inputRange: [0, 100],
    outputRange: [1, 0.8],
    extrapolate: 'clamp',
  });

  const headerTranslate = scrollY.interpolate({
    inputRange: [0, 100],
    outputRange: [0, -10],
    extrapolate: 'clamp',
  });

  return (
    <View style={styles.container}>
      <StatusBar style="dark" />

      {/* Animated background */}
      <View style={styles.background}>
        {/* Base gradient */}
        <LinearGradient
          colors={['#FAFBFF', '#F5F3FF', '#EFF6FF', '#FAFAFA']}
          style={StyleSheet.absoluteFillObject}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
        />

        {/* Animated blobs */}
        <AnimatedBlob
          colors={['rgba(167,139,250,0.25)', 'rgba(167,139,250,0.1)']}
          size={300}
          startPosition={{ x: -100, y: 100 }}
          duration={8000}
          delay={0}
        />
        <AnimatedBlob
          colors={['rgba(125,211,252,0.2)', 'rgba(125,211,252,0.05)']}
          size={250}
          startPosition={{ x: width - 150, y: 200 }}
          duration={10000}
          delay={2000}
        />
        <AnimatedBlob
          colors={['rgba(232,121,249,0.15)', 'rgba(232,121,249,0.05)']}
          size={200}
          startPosition={{ x: width * 0.3, y: 400 }}
          duration={9000}
          delay={1000}
        />
        <AnimatedBlob
          colors={['rgba(251,191,36,0.12)', 'rgba(251,191,36,0.04)']}
          size={180}
          startPosition={{ x: -50, y: 600 }}
          duration={7000}
          delay={3000}
        />

        {/* Floating notes */}
        <FloatingNote emoji="🎵" startX={width * 0.1} startY={150} delay={0} />
        <FloatingNote emoji="🎶" startX={width * 0.8} startY={300} delay={1500} />
        <FloatingNote emoji="🎸" startX={width * 0.15} startY={450} delay={3000} />
        <FloatingNote emoji="🎹" startX={width * 0.75} startY={550} delay={4500} />
        <FloatingNote emoji="🎺" startX={width * 0.05} startY={700} delay={2000} />
        <FloatingNote emoji="🎻" startX={width * 0.85} startY={750} delay={1000} />
      </View>

      {/* Content */}
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scroll}
        keyboardShouldPersistTaps="always"
        onScroll={(event) => {
          scrollY.setValue(event.nativeEvent.contentOffset.y);
        }}
        scrollEventThrottle={16}
      >
        {/* Glass header */}
        <Animated.View
          style={[
            styles.header,
            {
              opacity: headerOpacity,
              transform: [{ translateY: headerTranslate }],
            },
          ]}
        >
          <View style={styles.headerGlass}>
            <LinearGradient
              colors={['rgba(255,255,255,0.5)', 'rgba(255,255,255,0.2)']}
              style={StyleSheet.absoluteFillObject}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
            />
            <View style={styles.headerContent}>
              <View style={styles.titleRow}>
                <Text style={styles.title}>Discover</Text>
                <View style={styles.sparkleBadge}>
                  <LinearGradient
                    colors={['#A78BFA', '#7DD3FC']}
                    style={StyleSheet.absoluteFillObject}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                  />
                  <Text style={styles.sparkleText}>✨</Text>
                </View>
              </View>
              <Text style={styles.subtitle}>Find your next favorite song</Text>
            </View>
          </View>
        </Animated.View>

        {/* Search bar */}
        <LiquidSearchBar
          value={query}
          onChangeText={setQuery}
          placeholder="Search songs, artists, albums..."
        />

        {/* Content sections */}
        {query.length === 0 && (
          <View style={styles.section}>
            <GlassCategories onCategoryPress={setQuery} />
          </View>
        )}

        {query.length === 1 && (
          <View style={styles.hintContainer}>
            <LinearGradient
              colors={['rgba(167,139,250,0.15)', 'rgba(125,211,252,0.1)']}
              style={StyleSheet.absoluteFillObject}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
            />
            <Text style={styles.hintEmoji}>✨</Text>
            <Text style={styles.hintText}>Keep typing to discover...</Text>
          </View>
        )}

        {query.length >= 2 && (
          <GlassSearchResults
            tracks={tracks}
            isLoading={isLoading}
            query={query}
            onTrackPress={(track: Track) => playTrack(track, tracks)}
            onMorePress={handleMorePress}
            onClearSearch={() => setQuery('')}
          />
        )}
      </ScrollView>

      {/* Bottom fade */}
      <View style={styles.bottomFade} pointerEvents="none">
        <LinearGradient
          colors={['transparent', 'rgba(250,251,255,0.8)', 'rgba(250,251,255,1)']}
          style={StyleSheet.absoluteFillObject}
          start={{ x: 0, y: 0 }}
          end={{ x: 0, y: 1 }}
        />
      </View>

      {selectedTrack && (
        <AddToPlaylistSheet
          track={selectedTrack}
          onClose={() => setSelectedTrack(null)}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'transparent',
  },
  background: {
    ...StyleSheet.absoluteFillObject,
    overflow: 'hidden',
  },
  blob: {
    position: 'absolute',
    shadowColor: '#A78BFA',
    shadowOffset: { width: 0, height: 20 },
    shadowOpacity: 0.3,
    shadowRadius: 40,
  },
  floatingNote: {
    position: 'absolute',
    fontSize: 20,
  },
  scroll: {
    paddingBottom: 160,
  },
  header: {
    paddingTop: 70,
    paddingHorizontal: 24,
    marginBottom: 24,
  },
  headerGlass: {
    borderRadius: 28,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.6)',
    shadowColor: '#A78BFA',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.15,
    shadowRadius: 24,
    elevation: 8,
  },
  headerContent: {
    padding: 24,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  title: {
    fontSize: 42,
    fontWeight: '900',
    color: '#1E1B4B',
    letterSpacing: -1.5,
  },
  sparkleBadge: {
    width: 40,
    height: 40,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
    shadowColor: '#A78BFA',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  sparkleText: {
    fontSize: 20,
  },
  subtitle: {
    fontSize: 15,
    color: '#6B7280',
    marginTop: 6,
    fontWeight: '500',
    letterSpacing: 0.2,
  },
  section: {
    marginTop: 8,
  },
  hintContainer: {
    marginHorizontal: 24,
    marginTop: 32,
    padding: 28,
    borderRadius: 24,
    overflow: 'hidden',
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: 'rgba(167,139,250,0.2)',
    shadowColor: '#A78BFA',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 16,
  },
  hintEmoji: {
    fontSize: 32,
    marginBottom: 12,
  },
  hintText: {
    fontSize: 16,
    color: '#7C3AED',
    fontWeight: '600',
    letterSpacing: 0.3,
  },
  bottomFade: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 120,
  },
});

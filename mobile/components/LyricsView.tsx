import {
  View, Text, StyleSheet, ScrollView,
  Animated, Dimensions, TouchableOpacity
} from 'react-native';
import { useRef, useEffect, useState } from 'react';
import { LinearGradient } from 'expo-linear-gradient';
import { getLyrics } from '../lib/api';
import { usePlayerStore } from '../stores/playerStore';

const { height } = Dimensions.get('window');

interface LyricsLine {
  time_ms: number;
  text: string;
}

interface LyricsViewProps {
  videoId: string;
  artist: string;
  title: string;
}

export default function LyricsView({ videoId, artist, title }: LyricsViewProps) {
  const position = usePlayerStore(s => s.position);
  const [lines, setLines] = useState<LyricsLine[]>([]);
  const [synced, setSynced] = useState(false);
  const [loading, setLoading] = useState(true);
  const [activeIndex, setActiveIndex] = useState(0);
  const scrollRef = useRef<ScrollView>(null);
  const lineAnims = useRef<Animated.Value[]>([]);
  const prevIndex = useRef(-1);

  useEffect(() => {
    console.log('LyricsView fetching:', { videoId, artist, title });
    setLoading(true);
    getLyrics(videoId, artist, title)
      .then((data) => {
        console.log('Lyrics response:', data.source, data.synced, data.lines?.length);
        setLines(data.lines || []);
        setSynced(data.synced || false);
        lineAnims.current = (data.lines || []).map(() => new Animated.Value(1));
      })
      .catch((e) => {
        console.error('Lyrics fetch error:', e?.message);
        setLines([]);
      })
      .finally(() => setLoading(false));
  }, [videoId]);

  useEffect(() => {
    if (!synced || lines.length === 0) return;
    let newIndex = 0;
    for (let i = 0; i < lines.length; i++) {
      if (lines[i].time_ms <= position + 500) newIndex = i;
      else break;
    }
    if (newIndex === prevIndex.current) return;
    prevIndex.current = newIndex;
    setActiveIndex(newIndex);
    if (lineAnims.current[newIndex]) {
      Animated.spring(lineAnims.current[newIndex], {
        toValue: 1.04, useNativeDriver: true, tension: 200, friction: 8,
      }).start();
    }
    if (newIndex > 0 && lineAnims.current[newIndex - 1]) {
      Animated.spring(lineAnims.current[newIndex - 1], {
        toValue: 1, useNativeDriver: true, tension: 100, friction: 8,
      }).start();
    }
    scrollRef.current?.scrollTo({
      y: Math.max(0, newIndex * 56 - height * 0.25),
      animated: true,
    });
  }, [position, synced, lines]);

  if (loading) {
    return (
      <View style={styles.center}>
        <View style={styles.loadingWrap}>
          <LinearGradient colors={['rgba(167,139,250,0.2)', 'rgba(125,211,252,0.1)']} style={StyleSheet.absoluteFillObject} />
          <Text style={styles.loadingText}>Loading lyrics...</Text>
        </View>
      </View>
    );
  }

  if (lines.length === 0) {
    return (
      <View style={styles.center}>
        <Text style={styles.noLyricsEmoji}>🎵</Text>
        <Text style={styles.noLyricsText}>No lyrics available</Text>
      </View>
    );
  }

  if (!synced) {
    return (
      <ScrollView style={styles.scroll} contentContainerStyle={styles.plainContent} showsVerticalScrollIndicator={false}>
        <View style={styles.sourceBadge}>
          <LinearGradient colors={['rgba(167,139,250,0.2)', 'rgba(125,211,252,0.1)']} style={StyleSheet.absoluteFillObject} />
          <Text style={styles.sourceText}>�� Plain Lyrics</Text>
        </View>
        <Text style={styles.plainText}>{lines[0]?.text}</Text>
      </ScrollView>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.sourceBadgeTop}>
        <LinearGradient colors={['#C4B5FD', '#7DD3FC']} style={StyleSheet.absoluteFillObject} />
        <Text style={styles.sourceTextTop}>✦ SYNCED LYRICS</Text>
      </View>
      <LinearGradient colors={['rgba(250,251,255,1)', 'rgba(250,251,255,0)']} style={styles.fadeTop} pointerEvents="none" />
      <ScrollView
        ref={scrollRef}
        style={styles.scroll}
        contentContainerStyle={styles.syncedContent}
        showsVerticalScrollIndicator={false}
      >
        {lines.map((line, i) => {
          const isActive = i === activeIndex;
          const isPast = i < activeIndex;
          return (
            <TouchableOpacity key={i} onPress={() => {
              const sound = (global as any)._soundInstance;
              if (sound) sound.setPositionAsync(line.time_ms);
              usePlayerStore.getState().setPosition(line.time_ms);
            }} activeOpacity={0.7}>
              <Animated.View style={[
                styles.lineWrap,
                isActive && styles.lineWrapActive,
                { transform: [{ scale: lineAnims.current[i] || new Animated.Value(1) }] },
              ]}>
                {isActive && (
                  <LinearGradient colors={['rgba(167,139,250,0.15)', 'rgba(125,211,252,0.08)']} style={StyleSheet.absoluteFillObject} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} />
                )}
                {isActive && <View style={styles.activeDot} />}
                <Text style={[styles.lineText, isPast && styles.lineTextPast, isActive && styles.lineTextActive]}>
                  {line.text}
                </Text>
              </Animated.View>
            </TouchableOpacity>
          );
        })}
        <View style={{ height: height * 0.3 }} />
      </ScrollView>
      <LinearGradient colors={['rgba(250,251,255,0)', 'rgba(250,251,255,1)']} style={styles.fadeBottom} pointerEvents="none" />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scroll: { flex: 1 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 32 },
  loadingWrap: { padding: 24, borderRadius: 20, overflow: 'hidden', borderWidth: 1.5, borderColor: 'rgba(167,139,250,0.2)' },
  loadingText: { fontSize: 16, color: '#7C3AED', fontWeight: '600' },
  noLyricsEmoji: { fontSize: 48, marginBottom: 16 },
  noLyricsText: { fontSize: 16, color: '#6B7280', fontWeight: '600' },
  sourceBadge: { alignSelf: 'center', marginBottom: 20, paddingHorizontal: 16, paddingVertical: 6, borderRadius: 20, overflow: 'hidden', borderWidth: 1.5, borderColor: 'rgba(167,139,250,0.2)' },
  sourceText: { fontSize: 12, color: '#7C3AED', fontWeight: '700' },
  sourceBadgeTop: { alignSelf: 'center', marginBottom: 12, paddingHorizontal: 16, paddingVertical: 6, borderRadius: 20, overflow: 'hidden' },
  sourceTextTop: { fontSize: 10, color: '#FFFFFF', fontWeight: '800', letterSpacing: 2 },
  plainContent: { padding: 24 },
  plainText: { fontSize: 15, color: '#1E1B4B', lineHeight: 26 },
  syncedContent: { paddingTop: 20, paddingHorizontal: 16 },
  lineWrap: { paddingVertical: 10, paddingHorizontal: 16, borderRadius: 16, marginBottom: 2, overflow: 'hidden', position: 'relative' },
  lineWrapActive: { borderWidth: 1, borderColor: 'rgba(167,139,250,0.3)' },
  activeDot: { position: 'absolute', left: 4, top: '50%', width: 4, height: 4, borderRadius: 2, backgroundColor: '#A78BFA', marginTop: -2 },
  lineText: { fontSize: 17, color: '#9CA3AF', fontWeight: '500', lineHeight: 24 },
  lineTextPast: { color: '#C4B5FD' },
  lineTextActive: { color: '#1E1B4B', fontWeight: '800', fontSize: 18 },
  fadeTop: { position: 'absolute', top: 40, left: 0, right: 0, height: 60, zIndex: 10 },
  fadeBottom: { position: 'absolute', bottom: 0, left: 0, right: 0, height: 80, zIndex: 10 },
});

import {
  View, Text, StyleSheet, ScrollView,
  Animated, Dimensions, TouchableOpacity
} from 'react-native';
import { useRef, useEffect, useState } from 'react';
import { LinearGradient } from 'expo-linear-gradient';
import { getLyrics } from '../lib/api';
import { usePlayerStore } from '../stores/playerStore';

const { height } = Dimensions.get('window');

interface LyricsLine { time_ms: number; text: string; }

interface LyricsViewProps {
  videoId: string;
  artist: string;
  title: string;
  accentColor?: string;
}

export default function LyricsView({ videoId, artist, title, accentColor = '#7C3AED' }: LyricsViewProps) {
  const position = usePlayerStore(s => s.position);
  const [lines, setLines] = useState<LyricsLine[]>([]);
  const [synced, setSynced] = useState(false);
  const [source, setSource] = useState('none');
  const [loading, setLoading] = useState(true);
  const [activeIndex, setActiveIndex] = useState(0);
  const scrollRef = useRef<ScrollView>(null);
  const scrollY = useRef(new Animated.Value(0)).current;
  const currentScrollY = useRef(0);
  const lineAnims = useRef<Animated.Value[]>([]);
  const prevIndex = useRef(-1);

  useEffect(() => {
    setLoading(true);
    getLyrics(videoId, artist, title)
      .then((data) => {
        setLines(data.lines || []);
        setSynced(data.synced || false);
        setSource(data.source || 'none');
        lineAnims.current = (data.lines || []).map(() => new Animated.Value(1));
      })
      .catch(() => { setLines([]); setSource('none'); })
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
      Animated.spring(lineAnims.current[newIndex], { toValue: 1.04, useNativeDriver: true, tension: 200, friction: 8 }).start();
    }
    if (newIndex > 0 && lineAnims.current[newIndex - 1]) {
      Animated.spring(lineAnims.current[newIndex - 1], { toValue: 1, useNativeDriver: true, tension: 100, friction: 8 }).start();
    }
    // Spring scroll to active line
    const targetY = Math.max(0, newIndex * 56 - height * 0.25);
    const springScroll = new Animated.Value(0);
    if (scrollRef.current) {
      scrollRef.current.scrollTo({ y: targetY, animated: true });
    }
  }, [position, synced, lines]);

  if (loading) {
    return (
      <View style={styles.center}>
        <View style={styles.loadingWrap}>
          <LinearGradient colors={['rgba(167,139,250,0.15)', 'rgba(125,211,252,0.08)']} style={StyleSheet.absoluteFillObject} />
          <Text style={styles.loadingEmoji}>🎵</Text>
          <Text style={[styles.loadingText, { color: accentColor }]}>Finding lyrics...</Text>
          <Text style={styles.loadingSubtext}>Searching lrclib & Genius</Text>
        </View>
      </View>
    );
  }

  if (source === 'none' || lines.length === 0 || (lines.length === 1 && lines[0].text === 'Lyrics not available for this track.')) {
    return (
      <View style={styles.center}>
        <View style={styles.unavailableCard}>
          <LinearGradient colors={['rgba(167,139,250,0.08)', 'rgba(125,211,252,0.04)']} style={StyleSheet.absoluteFillObject} />
          <Text style={styles.unavailableEmoji}>🎼</Text>
          <Text style={styles.unavailableTitle}>Lyrics unavailable</Text>
          <Text style={styles.unavailableSubtitle}>
            We couldn't find lyrics for{'\n'}
            <Text style={[styles.unavailableTrack, { color: accentColor }]}>"{title}"</Text>
          </Text>
          <View style={styles.unavailableTips}>
            <Text style={styles.tipText}>💡 Try searching for the original version</Text>
            <Text style={styles.tipText}>🌐 Lyrics may not be indexed yet</Text>
          </View>
        </View>
      </View>
    );
  }

  if (!synced) {
    return (
      <ScrollView style={styles.scroll} contentContainerStyle={styles.plainContent} showsVerticalScrollIndicator={false}>
        <View style={styles.sourceBadge}>
          <LinearGradient colors={['rgba(167,139,250,0.15)', 'rgba(125,211,252,0.08)']} style={StyleSheet.absoluteFillObject} />
          <Text style={[styles.sourceText, { color: accentColor }]}>📝 Plain Lyrics · {source}</Text>
        </View>
        <Text style={styles.plainText}>{lines[0]?.text}</Text>
      </ScrollView>
    );
  }

  return (
    <View style={styles.container}>
      <LinearGradient colors={['rgba(250,251,255,1)', 'rgba(250,251,255,0)']} style={styles.fadeTop} pointerEvents="none" />
      <ScrollView ref={scrollRef} style={styles.scroll} contentContainerStyle={styles.syncedContent} showsVerticalScrollIndicator={false}>
        {lines.map((line, i) => {
          const isActive = i === activeIndex;
          const isPast = i < activeIndex;
          return (
            <TouchableOpacity key={i} onPress={() => {
              const sound = (global as any)._soundInstance;
              if (sound) sound.setPositionAsync(line.time_ms);
              usePlayerStore.getState().setPosition(line.time_ms);
            }} activeOpacity={0.7}>
              <Animated.View style={[styles.lineWrap, isActive && { borderColor: accentColor + '50', borderWidth: 1 }, { transform: [{ scale: lineAnims.current[i] || new Animated.Value(1) }] }]}>
                {isActive && <View style={[styles.activeDot, { backgroundColor: accentColor }]} />}
                <Text style={[styles.lineText, isPast && { color: accentColor + '80' }, isActive && { color: '#1E1B4B', fontWeight: '800', fontSize: 18 }]}>
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
  loadingWrap: { padding: 32, borderRadius: 28, overflow: 'hidden', alignItems: 'center', borderWidth: 1.5, borderColor: 'rgba(167,139,250,0.2)', width: '100%' },
  loadingEmoji: { fontSize: 40, marginBottom: 12 },
  loadingText: { fontSize: 17, fontWeight: '700', marginBottom: 4 },
  loadingSubtext: { fontSize: 13, color: '#9CA3AF' },
  unavailableCard: { padding: 32, borderRadius: 28, overflow: 'hidden', alignItems: 'center', borderWidth: 1.5, borderColor: 'rgba(167,139,250,0.15)', width: '100%' },
  unavailableEmoji: { fontSize: 56, marginBottom: 16 },
  unavailableTitle: { fontSize: 20, fontWeight: '800', color: '#1E1B4B', marginBottom: 8 },
  unavailableSubtitle: { fontSize: 14, color: '#6B7280', textAlign: 'center', lineHeight: 22, marginBottom: 20 },
  unavailableTrack: { fontWeight: '700' },
  unavailableTips: { gap: 8, width: '100%' },
  tipText: { fontSize: 13, color: '#9CA3AF', textAlign: 'center' },
  sourceBadge: { alignSelf: 'center', marginBottom: 20, paddingHorizontal: 16, paddingVertical: 6, borderRadius: 20, overflow: 'hidden', borderWidth: 1.5, borderColor: 'rgba(167,139,250,0.2)' },
  sourceText: { fontSize: 12, fontWeight: '700' },
  plainContent: { padding: 24 },
  plainText: { fontSize: 15, color: '#1E1B4B', lineHeight: 26 },
  syncedContent: { paddingTop: 20, paddingHorizontal: 16 },
  lineWrap: { paddingVertical: 12, paddingHorizontal: 16, borderRadius: 16, marginBottom: 2, overflow: 'hidden', position: 'relative', minHeight: 44 },
  activeDot: { position: 'absolute', left: 4, top: '50%', width: 4, height: 4, borderRadius: 2, marginTop: -2 },
  lineText: { fontSize: 17, color: '#9CA3AF', fontWeight: '500', lineHeight: 24 },
  fadeTop: { position: 'absolute', top: 0, left: 0, right: 0, height: 60, zIndex: 10 },
  fadeBottom: { position: 'absolute', bottom: 0, left: 0, right: 0, height: 80, zIndex: 10 },
});

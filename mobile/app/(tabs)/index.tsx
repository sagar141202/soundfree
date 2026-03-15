import {
  View, Text, ScrollView, StyleSheet,
  TouchableOpacity, Dimensions, Animated
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { StatusBar } from 'expo-status-bar';
import { useRef, useEffect } from 'react';
import { usePlayerStore } from '../../stores/playerStore';

const { width } = Dimensions.get('window');

function AnimatedBackground() {
  const a1 = useRef(new Animated.Value(0)).current;
  const a2 = useRef(new Animated.Value(0)).current;
  const a3 = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const wave = (a: Animated.Value, dur: number) =>
      Animated.loop(Animated.sequence([
        Animated.timing(a, { toValue: 1, duration: dur, useNativeDriver: true }),
        Animated.timing(a, { toValue: 0, duration: dur, useNativeDriver: true }),
      ])).start();
    wave(a1, 4000); wave(a2, 6000); wave(a3, 8000);
  }, []);

  const y1 = a1.interpolate({ inputRange: [0, 1], outputRange: [0, -20] });
  const y2 = a2.interpolate({ inputRange: [0, 1], outputRange: [0, 16] });
  const y3 = a3.interpolate({ inputRange: [0, 1], outputRange: [0, -12] });

  return (
    <View style={StyleSheet.absoluteFillObject} pointerEvents="none">
      <LinearGradient colors={['#FAFBFF', '#F0F4FF', '#F8FAFF']} style={StyleSheet.absoluteFillObject} />
      <Animated.View style={[styles.blob1, { transform: [{ translateY: y1 }] }]}>
        <LinearGradient colors={['rgba(167,139,250,0.35)', 'transparent']} style={{ flex: 1, borderRadius: 300 }} />
      </Animated.View>
      <Animated.View style={[styles.blob2, { transform: [{ translateY: y2 }] }]}>
        <LinearGradient colors={['rgba(125,211,252,0.3)', 'transparent']} style={{ flex: 1, borderRadius: 300 }} />
      </Animated.View>
      <Animated.View style={[styles.blob3, { transform: [{ translateY: y3 }] }]}>
        <LinearGradient colors={['rgba(134,239,172,0.25)', 'transparent']} style={{ flex: 1, borderRadius: 300 }} />
      </Animated.View>
    </View>
  );
}

function GlassCard({ children, style, colors }: any) {
  return (
    <View style={[styles.glass, style]}>
      <LinearGradient
        colors={colors || ['rgba(255,255,255,0.8)', 'rgba(255,255,255,0.4)']}
        style={StyleSheet.absoluteFillObject}
        start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
      />
      <View style={styles.glassBorder} />
      {children}
    </View>
  );
}

export default function HomeScreen() {
  const setCurrentTrack = usePlayerStore(s => s.setCurrentTrack);
  const setIsPlaying = usePlayerStore(s => s.setIsPlaying);
  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Good Morning ☀️' : hour < 17 ? 'Good Afternoon 🌤️' : 'Good Evening 🌙';

  // TEST: load a track to show MiniPlayer — remove after T-048
  useEffect(() => {
    setTimeout(() => {
      setCurrentTrack({
        video_id: 'bSnlKl_PoQU',
        title: 'Bohemian Rhapsody',
        artist: 'Queen',
        album: 'A Night At The Opera',
        duration_ms: 355000,
        thumbnail_url: 'https://lh3.googleusercontent.com/9CrMB2k2WFBUGXQXlaFfwP8e5_Q8FiUqQ8ljMGWm22VyLmvLZEqBMPUNjf6FNZrmMDUBTlEsFxk88_kOCQ=w120-h120-l90-rj',
      });
      setIsPlaying(true);
    }, 2000);
  }, []);

  return (
    <View style={styles.container}>
      <StatusBar style="dark" />
      <AnimatedBackground />
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>

        <View style={styles.header}>
          <Text style={styles.greeting}>{greeting}</Text>
          <Text style={styles.appName}>SoundFree</Text>
          <Text style={styles.tagline}>Zero cost · Infinite music · Zero ads</Text>
        </View>

        <GlassCard style={styles.hero} colors={['rgba(167,139,250,0.5)', 'rgba(125,211,252,0.3)', 'rgba(134,239,172,0.2)']}>
          <View style={styles.heroDeco1} />
          <View style={styles.heroDeco2} />
          <View style={styles.heroContent}>
            <View style={styles.heroBadge}>
              <Text style={styles.heroBadgeText}>✦ AI DAILY MIX</Text>
            </View>
            <Text style={styles.heroTitle}>Your Vibe{'\n'}Today</Text>
            <Text style={styles.heroSub}>Curated by AI · Updated daily</Text>
            <TouchableOpacity>
              <LinearGradient colors={['#A78BFA', '#818CF8']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={styles.playBtn}>
                <Text style={styles.playBtnText}>▶  Play Now</Text>
              </LinearGradient>
            </TouchableOpacity>
          </View>
        </GlassCard>

        <Text style={styles.section}>Browse Moods</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.hPad}>
          {MOODS.map((m, i) => (
            <TouchableOpacity key={i} style={styles.moodPill}>
              <LinearGradient colors={m.colors as [string,string]} style={StyleSheet.absoluteFillObject} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} />
              <Text style={styles.moodEmoji}>{m.emoji}</Text>
              <Text style={styles.moodName}>{m.name}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        <Text style={styles.section}>Quick Picks</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.hPad}>
          {PICKS.map((p, i) => (
            <TouchableOpacity key={i} style={styles.pickCard}>
              <LinearGradient colors={p.colors as [string,string]} style={StyleSheet.absoluteFillObject} />
              <Text style={styles.pickEmoji}>{p.emoji}</Text>
              <Text style={styles.pickName}>{p.name}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        <Text style={styles.section}>Trending Now 🔥</Text>
        <GlassCard style={styles.trackCard}>
          {TRACKS.map((t, i) => (
            <TouchableOpacity key={i} style={styles.trackRow}>
              <LinearGradient colors={TRACK_COLORS[i % TRACK_COLORS.length] as [string,string]} style={styles.trackNum}>
                <Text style={styles.trackNumText}>{i + 1}</Text>
              </LinearGradient>
              <View style={styles.trackInfo}>
                <Text style={styles.trackTitle} numberOfLines={1}>{t.title}</Text>
                <Text style={styles.trackArtist} numberOfLines={1}>{t.artist}</Text>
              </View>
              <TouchableOpacity style={styles.trackPlayBtn}>
                <Text style={styles.trackPlayText}>▶</Text>
              </TouchableOpacity>
            </TouchableOpacity>
          ))}
        </GlassCard>

        <View style={styles.statsRow}>
          {STATS.map((s, i) => (
            <GlassCard key={i} style={styles.statCard}>
              <Text style={[styles.statValue, { color: STAT_COLORS[i] }]}>{s.value}</Text>
              <Text style={styles.statLabel}>{s.label}</Text>
            </GlassCard>
          ))}
        </View>

      </ScrollView>
    </View>
  );
}

const MOODS = [
  { name: 'Chill', emoji: '🌊', colors: ['#7DD3FC', '#93C5FD'] },
  { name: 'Focus', emoji: '🎯', colors: ['#C4B5FD', '#A5B4FC'] },
  { name: 'Hype', emoji: '⚡', colors: ['#FDE68A', '#FCA5A5'] },
  { name: 'Happy', emoji: '✨', colors: ['#86EFAC', '#6EE7B7'] },
  { name: 'Love', emoji: '💫', colors: ['#FBCFE8', '#F9A8D4'] },
  { name: 'Vibe', emoji: '🌈', colors: ['#A5F3FC', '#93C5FD'] },
];

const PICKS = [
  { name: 'Lo-fi', emoji: '☕', colors: ['#C4B5FD', '#A78BFA'] },
  { name: 'Bollywood', emoji: '🎬', colors: ['#FCA5A5', '#F87171'] },
  { name: 'Hip Hop', emoji: '🎤', colors: ['#D8B4FE', '#C084FC'] },
  { name: 'Classical', emoji: '🎻', colors: ['#86EFAC', '#4ADE80'] },
  { name: 'Rock', emoji: '🎸', colors: ['#FCA5A5', '#FB923C'] },
  { name: 'K-Pop', emoji: '⭐', colors: ['#7DD3FC', '#818CF8'] },
];

const TRACKS = [
  { title: 'Kesariya', artist: 'Arijit Singh' },
  { title: 'Blinding Lights', artist: 'The Weeknd' },
  { title: 'Tum Hi Ho', artist: 'Arijit Singh' },
  { title: 'Levitating', artist: 'Dua Lipa' },
  { title: 'Raataan Lambiyan', artist: 'Jubin Nautiyal' },
];

const TRACK_COLORS = [
  ['#A78BFA', '#C4B5FD'], ['#7DD3FC', '#93C5FD'],
  ['#86EFAC', '#6EE7B7'], ['#FDE68A', '#FCA5A5'],
  ['#FBCFE8', '#F9A8D4'],
];

const STATS = [
  { value: '∞', label: 'Songs' },
  { value: '₹0', label: 'Cost' },
  { value: '0', label: 'Ads' },
];

const STAT_COLORS = ['#A78BFA', '#4ADE80', '#7DD3FC'];

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FAFBFF' },
  scroll: { paddingBottom: 160 },
  blob1: { position: 'absolute', top: -150, left: -100, width: width * 1.2, height: 500, borderRadius: 300 },
  blob2: { position: 'absolute', top: 250, right: -120, width: width, height: 400, borderRadius: 300 },
  blob3: { position: 'absolute', top: 550, left: -80, width: width * 0.9, height: 380, borderRadius: 300 },
  header: { paddingTop: 64, paddingHorizontal: 24, marginBottom: 24 },
  greeting: { fontSize: 15, color: '#7C3AED', letterSpacing: 0.3, marginBottom: 6, fontWeight: '600' },
  appName: { fontSize: 44, fontWeight: '900', color: '#1E1B4B', letterSpacing: -2, marginBottom: 4 },
  tagline: { fontSize: 13, color: '#6B7280', letterSpacing: 0.3 },
  glass: { borderRadius: 24, overflow: 'hidden', borderWidth: 1.5, borderColor: 'rgba(255,255,255,0.9)' },
  glassBorder: { position: 'absolute', inset: 0, borderRadius: 24, borderWidth: 1, borderColor: 'rgba(167,139,250,0.2)' },
  hero: { marginHorizontal: 24, marginBottom: 36, minHeight: 230 },
  heroDeco1: { position: 'absolute', right: -50, top: -50, width: 200, height: 200, borderRadius: 100, backgroundColor: 'rgba(168,85,247,0.12)', borderWidth: 1.5, borderColor: 'rgba(168,85,247,0.2)' },
  heroDeco2: { position: 'absolute', right: 60, bottom: -40, width: 130, height: 130, borderRadius: 65, backgroundColor: 'rgba(125,211,252,0.1)', borderWidth: 1, borderColor: 'rgba(125,211,252,0.2)' },
  heroContent: { padding: 28, zIndex: 2 },
  heroBadge: { alignSelf: 'flex-start', backgroundColor: 'rgba(167,139,250,0.2)', borderRadius: 20, paddingHorizontal: 14, paddingVertical: 5, marginBottom: 16, borderWidth: 1, borderColor: 'rgba(167,139,250,0.4)' },
  heroBadgeText: { fontSize: 10, color: '#7C3AED', fontWeight: '800', letterSpacing: 2 },
  heroTitle: { fontSize: 36, fontWeight: '900', color: '#1E1B4B', lineHeight: 42, marginBottom: 8, letterSpacing: -1 },
  heroSub: { fontSize: 13, color: '#6B7280', marginBottom: 24 },
  playBtn: { alignSelf: 'flex-start', paddingHorizontal: 28, paddingVertical: 13, borderRadius: 30 },
  playBtnText: { fontSize: 14, fontWeight: '700', color: '#FFFFFF', letterSpacing: 0.5 },
  section: { fontSize: 20, fontWeight: '800', color: '#1E1B4B', paddingHorizontal: 24, marginBottom: 14 },
  hPad: { paddingLeft: 24, paddingRight: 12, marginBottom: 28 },
  moodPill: { flexDirection: 'row', alignItems: 'center', gap: 7, paddingHorizontal: 18, paddingVertical: 11, borderRadius: 30, marginRight: 10, overflow: 'hidden', minWidth: 100, borderWidth: 1.5, borderColor: 'rgba(255,255,255,0.8)' },
  moodEmoji: { fontSize: 16 },
  moodName: { fontSize: 13, fontWeight: '700', color: '#1E1B4B' },
  pickCard: { width: 115, height: 115, borderRadius: 22, marginRight: 12, overflow: 'hidden', alignItems: 'center', justifyContent: 'center', borderWidth: 1.5, borderColor: 'rgba(255,255,255,0.8)' },
  pickEmoji: { fontSize: 30, marginBottom: 8 },
  pickName: { fontSize: 13, fontWeight: '800', color: '#1E1B4B' },
  trackCard: { marginHorizontal: 24, marginBottom: 28, paddingVertical: 6 },
  trackRow: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 12, gap: 14 },
  trackNum: { width: 34, height: 34, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  trackNumText: { fontSize: 13, fontWeight: '900', color: '#1E1B4B' },
  trackInfo: { flex: 1 },
  trackTitle: { fontSize: 15, fontWeight: '700', color: '#1E1B4B', marginBottom: 2 },
  trackArtist: { fontSize: 12, color: '#6B7280' },
  trackPlayBtn: { width: 36, height: 36, borderRadius: 18, backgroundColor: 'rgba(167,139,250,0.2)', alignItems: 'center', justifyContent: 'center', borderWidth: 1.5, borderColor: 'rgba(167,139,250,0.4)' },
  trackPlayText: { fontSize: 12, color: '#7C3AED' },
  statsRow: { flexDirection: 'row', paddingHorizontal: 24, gap: 12, marginBottom: 16 },
  statCard: { flex: 1, alignItems: 'center', paddingVertical: 20 },
  statValue: { fontSize: 30, fontWeight: '900', marginBottom: 4 },
  statLabel: { fontSize: 11, color: '#6B7280', letterSpacing: 1, textTransform: 'uppercase' },
});

import {
  View, Text, StyleSheet, ScrollView,
  TouchableOpacity, Image, Dimensions
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { StatusBar } from 'expo-status-bar';
import { useState, useEffect } from 'react';
import { router } from 'expo-router';
import { useLibraryStore } from '../../stores/libraryStore';
import { usePlayerStore } from '../../stores/playerStore';
import { usePlayTrack } from '../../hooks/usePlayTrack';
import { getRecommendations, getTrendingTracks, getSimilarTracks } from '../../lib/api';
import type { Track } from '../../components/TrackListItem';
import { Ionicons } from '@expo/vector-icons';

const { width } = Dimensions.get('window');

const MOODS = [
  { label: 'Energetic', emoji: '⚡', query: 'energetic workout music', colors: ['#FDE68A', '#FCA5A5'] as [string,string] },
  { label: 'Chill', emoji: '🌊', query: 'chill lofi music', colors: ['#7DD3FC', '#93C5FD'] as [string,string] },
  { label: 'Focus', emoji: '🎯', query: 'focus study music', colors: ['#86EFAC', '#6EE7B7'] as [string,string] },
  { label: 'Happy', emoji: '☀️', query: 'happy upbeat music', colors: ['#FDE68A', '#FCD34D'] as [string,string] },
  { label: 'Romance', emoji: '💕', query: 'romantic love songs', colors: ['#FBCFE8', '#F9A8D4'] as [string,string] },
  { label: 'Party', emoji: '🎉', query: 'party dance music', colors: ['#C4B5FD', '#A78BFA'] as [string,string] },
];

const GREETINGS = {
  morning: { text: 'Good Morning', emoji: '🌅' },
  afternoon: { text: 'Good Afternoon', emoji: '☀️' },
  evening: { text: 'Good Evening', emoji: '🌆' },
  night: { text: 'Good Night', emoji: '🌙' },
};

function getGreeting() {
  const hour = new Date().getHours();
  if (hour < 12) return GREETINGS.morning;
  if (hour < 17) return GREETINGS.afternoon;
  if (hour < 21) return GREETINGS.evening;
  return GREETINGS.night;
}

function TrackCard({ track, index, onPress, showReason }: {
  track: any; index: number; onPress: () => void; showReason?: boolean;
}) {
  const COLORS = [
    ['#C4B5FD','#A78BFA'], ['#7DD3FC','#93C5FD'],
    ['#86EFAC','#6EE7B7'], ['#FDE68A','#FCA5A5'],
    ['#FBCFE8','#F9A8D4'],
  ];
  const colors = COLORS[index % COLORS.length] as [string, string];
  return (
    <TouchableOpacity style={styles.trackCard} onPress={onPress}>
      <View style={styles.trackCardThumb}>
        {track.thumbnail_url ? (
          <Image source={{ uri: track.thumbnail_url }} style={styles.trackCardImg} resizeMode="cover" />
        ) : (
          <LinearGradient colors={colors} style={styles.trackCardImg}>
            <Text style={{ fontSize: 24 }}>🎵</Text>
          </LinearGradient>
        )}
        <View style={styles.trackCardPlay}>
          <Ionicons name="play" size={14} color="rgba(255,255,255,0.9)" />
        </View>
      </View>
      <Text style={styles.trackCardTitle} numberOfLines={2}>{track.title}</Text>
      <Text style={styles.trackCardArtist} numberOfLines={1}>{track.artist}</Text>
      {showReason && track.reason && (
        <View style={styles.reasonBadge}>
          <Text style={styles.reasonText}>{track.reason}</Text>
        </View>
      )}
    </TouchableOpacity>
  );
}

function SectionHeader({ title, onSeeAll }: { title: string; onSeeAll?: () => void }) {
  return (
    <View style={styles.sectionHeader}>
      <Text style={styles.sectionTitle}>{title}</Text>
      {onSeeAll && (
        <TouchableOpacity onPress={onSeeAll}>
          <Text style={styles.seeAll}>See all →</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

export default function HomeScreen() {
  const recentlyPlayed = useLibraryStore(s => s.recentlyPlayed);
  const likedTracks = useLibraryStore(s => s.likedTracks);
  const currentTrack = usePlayerStore(s => s.currentTrack);
  const { playTrack } = usePlayTrack();
  const [recommendations, setRecommendations] = useState<any[]>([]);
  const [trending, setTrending] = useState<Track[]>([]);
  const [similarTracks, setSimilarTracks] = useState<any[]>([]);
  const greeting = getGreeting();

  useEffect(() => {
    getRecommendations(10).then(setRecommendations).catch(() => {});
    getTrendingTracks('top hits 2025', 10).then(setTrending).catch(() => {});
    getSimilarTracks(10).then(setSimilarTracks).catch(() => {});
  }, []);

  return (
    <View style={styles.container}>
      <StatusBar style="dark" />
      <LinearGradient colors={['#FAFBFF', '#F0F4FF', '#F8FAFF']} style={StyleSheet.absoluteFillObject} />

      {/* Animated blobs */}
      <View style={styles.blob1} pointerEvents="none">
        <LinearGradient colors={['rgba(196,181,253,0.35)', 'transparent']} style={{ flex: 1, borderRadius: 300 }} />
      </View>
      <View style={styles.blob2} pointerEvents="none">
        <LinearGradient colors={['rgba(125,211,252,0.25)', 'transparent']} style={{ flex: 1, borderRadius: 300 }} />
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>

        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text style={styles.greeting}>{greeting.emoji} {greeting.text}</Text>
            <Text style={styles.subGreeting}>What are you listening to today?</Text>
          </View>
          <TouchableOpacity style={styles.searchBtn} onPress={() => router.push('/(tabs)/search')}>
            <LinearGradient colors={['rgba(167,139,250,0.2)', 'rgba(125,211,252,0.1)']} style={StyleSheet.absoluteFillObject} />
            <Ionicons name="search" size={22} color="#7C3AED" />
          </TouchableOpacity>
        </View>

        {/* Jump Back In — currently playing */}
        {currentTrack && (
          <View style={styles.jumpBackCard}>
            <LinearGradient colors={['rgba(167,139,250,0.15)', 'rgba(125,211,252,0.1)']} style={StyleSheet.absoluteFillObject} />
            <View style={styles.jumpBackBorder} />
            <TouchableOpacity style={styles.jumpBackContent} onPress={() => router.push('/player')}>
              {currentTrack.thumbnail_url ? (
                <Image source={{ uri: currentTrack.thumbnail_url }} style={styles.jumpBackThumb} resizeMode="cover" />
              ) : (
                <LinearGradient colors={['#C4B5FD', '#A78BFA']} style={styles.jumpBackThumb}>
                  <Text style={{ fontSize: 20 }}>🎵</Text>
                </LinearGradient>
              )}
              <View style={styles.jumpBackInfo}>
                <Text style={styles.jumpBackLabel}>▶ Now Playing</Text>
                <Text style={styles.jumpBackTitle} numberOfLines={1}>{currentTrack.title}</Text>
                <Text style={styles.jumpBackArtist} numberOfLines={1}>{currentTrack.artist}</Text>
              </View>
              <Ionicons name="chevron-forward" size={20} color="#A78BFA" />
            </TouchableOpacity>
          </View>
        )}

        {/* Daily Mix Card */}
        <TouchableOpacity style={styles.dailyMixCard} onPress={() => router.push('/daily-mix')}>
          <LinearGradient colors={['#C4B5FD', '#818CF8']} style={StyleSheet.absoluteFillObject} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} />
          <View style={styles.dailyMixDeco} />
          <View style={styles.dailyMixContent}>
            <View>
              <Text style={styles.dailyMixBadge}>✦ AI GENERATED</Text>
              <Text style={styles.dailyMixTitle}>Your Daily Mix</Text>
              <Text style={styles.dailyMixSub}>20 tracks picked just for you</Text>
            </View>
            <View style={styles.dailyMixBtn}>
              <Ionicons name="play" size={20} color="#7C3AED" />
            </View>
          </View>
        </TouchableOpacity>

        {/* Moods */}
        <View style={styles.moodsSection}>
          <SectionHeader title="🎭 Browse by Mood" />
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.moodsScroll}>
            {MOODS.map((mood, i) => (
              <TouchableOpacity
                key={i}
                style={styles.moodChip}
                onPress={() => router.push({ pathname: '/(tabs)/search', params: { q: mood.query } })}
              >
                <LinearGradient colors={mood.colors} style={StyleSheet.absoluteFillObject} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} />
                <Text style={styles.moodEmoji}>{mood.emoji}</Text>
                <Text style={styles.moodLabel}>{mood.label}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        {/* Recently Played */}
        {recentlyPlayed.length > 0 && (
          <View style={styles.section}>
            <SectionHeader title="🕐 Recently Played" onSeeAll={() => router.push('/recent')} />
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.horizontalScroll}>
              {recentlyPlayed.slice(0, 8).map((track, i) => (
                <TrackCard
                  key={track.video_id}
                  track={track}
                  index={i}
                  onPress={() => playTrack(track, recentlyPlayed)}
                />
              ))}
            </ScrollView>
          </View>
        )}

        {/* Liked Songs quick access */}
        {likedTracks.length > 0 && (
          <View style={styles.section}>
            <SectionHeader title="❤️ Liked Songs" onSeeAll={() => router.push('/liked')} />
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.horizontalScroll}>
              {likedTracks.slice(0, 8).map((track, i) => (
                <TrackCard
                  key={track.video_id}
                  track={track}
                  index={i}
                  onPress={() => playTrack(track, likedTracks)}
                />
              ))}
            </ScrollView>
          </View>
        )}

        {/* Recommendations */}
        {recommendations.length > 0 && (
          <View style={styles.section}>
            <SectionHeader title="✨ Recommended For You" />
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.horizontalScroll}>
              {recommendations.map((track, i) => (
                <TrackCard
                  key={track.video_id}
                  track={track}
                  index={i}
                  showReason
                  onPress={() => playTrack(track, recommendations)}
                />
              ))}
            </ScrollView>
          </View>
        )}

        {/* Based On Last Played */}
        {similarTracks.length > 0 && currentTrack && (
          <View style={styles.section}>
            <SectionHeader title={`🎯 Based on "${currentTrack.title.slice(0, 20)}${currentTrack.title.length > 20 ? '...' : ''}"`} />
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.horizontalScroll}>
              {similarTracks.map((track, i) => (
                <TrackCard
                  key={track.video_id}
                  track={track}
                  index={i}
                  showReason
                  onPress={() => playTrack(track, similarTracks)}
                />
              ))}
            </ScrollView>
          </View>
        )}

        {/* Trending */}
        {trending.length > 0 && (
          <View style={styles.section}>
            <SectionHeader title="🔥 Trending Now" />
            <View style={styles.trendingList}>
              {trending.slice(0, 5).map((track, i) => (
                <TouchableOpacity
                  key={track.video_id}
                  style={styles.trendingRow}
                  onPress={() => playTrack(track, trending)}
                >
                  <LinearGradient colors={['rgba(255,255,255,0.8)', 'rgba(255,255,255,0.4)']} style={StyleSheet.absoluteFillObject} />
                  <View style={styles.trendingRank}>
                    <Text style={styles.trendingRankText}>{i + 1}</Text>
                  </View>
                  {track.thumbnail_url ? (
                    <Image source={{ uri: track.thumbnail_url }} style={styles.trendingThumb} resizeMode="cover" />
                  ) : (
                    <LinearGradient colors={['#C4B5FD', '#A78BFA']} style={styles.trendingThumb}>
                      <Text style={{ fontSize: 16 }}>🎵</Text>
                    </LinearGradient>
                  )}
                  <View style={styles.trendingInfo}>
                    <Text style={styles.trendingTitle} numberOfLines={1}>{track.title}</Text>
                    <Text style={styles.trendingArtist} numberOfLines={1}>{track.artist}</Text>
                  </View>
                  <Ionicons name="play-circle" size={30} color="#C4B5FD" />
                </TouchableOpacity>
              ))}
            </View>
          </View>
        )}

        {/* Empty state */}
        {recentlyPlayed.length === 0 && recommendations.length === 0 && (
          <View style={styles.emptyWrap}>
            <View style={styles.emptyCard}>
              <LinearGradient colors={['rgba(167,139,250,0.1)', 'rgba(125,211,252,0.05)']} style={StyleSheet.absoluteFillObject} />
              <Text style={styles.emptyEmoji}>🎵</Text>
              <Text style={styles.emptyTitle}>Start listening</Text>
              <Text style={styles.emptySub}>Search for your favourite music to get started</Text>
              <TouchableOpacity style={styles.emptyBtn} onPress={() => router.push('/(tabs)/search')}>
                <LinearGradient colors={['#C4B5FD', '#A78BFA']} style={StyleSheet.absoluteFillObject} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}>
                  <Text style={styles.emptyBtnText}>Search Music</Text>
                </LinearGradient>
              </TouchableOpacity>
            </View>
          </View>
        )}

        <View style={{ height: 160 }} />
      </ScrollView>
    </View>
  );
}

const CARD_W = 130;

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FAFBFF' },
  blob1: { position: 'absolute', top: -80, right: -60, width: 280, height: 280, borderRadius: 140 },
  blob2: { position: 'absolute', top: 200, left: -80, width: 240, height: 240, borderRadius: 120 },
  scroll: { paddingBottom: 20 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingTop: 64, paddingHorizontal: 24, marginBottom: 24 },
  greeting: { fontSize: 28, fontWeight: '900', color: '#1E1B4B', letterSpacing: -0.5 },
  subGreeting: { fontSize: 14, color: '#6B7280', marginTop: 4 },
  searchBtn: { width: 46, height: 46, borderRadius: 23, alignItems: 'center', justifyContent: 'center', overflow: 'hidden', borderWidth: 1.5, borderColor: 'rgba(167,139,250,0.3)' },
  jumpBackCard: { marginHorizontal: 24, marginBottom: 24, borderRadius: 20, overflow: 'hidden', borderWidth: 1.5, borderColor: 'rgba(167,139,250,0.25)' },
  jumpBackBorder: { position: 'absolute', inset: 0, borderRadius: 20, borderWidth: 1, borderColor: 'rgba(255,255,255,0.8)' },
  jumpBackContent: { flexDirection: 'row', alignItems: 'center', padding: 14, gap: 14 },
  jumpBackThumb: { width: 56, height: 56, borderRadius: 14, alignItems: 'center', justifyContent: 'center', overflow: 'hidden' },
  jumpBackInfo: { flex: 1 },
  jumpBackLabel: { fontSize: 11, color: '#A78BFA', fontWeight: '700', letterSpacing: 1, marginBottom: 3 },
  jumpBackTitle: { fontSize: 15, fontWeight: '800', color: '#1E1B4B', marginBottom: 2 },
  jumpBackArtist: { fontSize: 12, color: '#6B7280' },
  moodsSection: { marginBottom: 8 },
  moodsScroll: { paddingLeft: 24, paddingRight: 12, gap: 10 },
  moodChip: { paddingHorizontal: 16, paddingVertical: 12, borderRadius: 20, overflow: 'hidden', alignItems: 'center', gap: 4, minWidth: 80, borderWidth: 1.5, borderColor: 'rgba(255,255,255,0.9)' },
  moodEmoji: { fontSize: 20 },
  moodLabel: { fontSize: 12, fontWeight: '700', color: '#1E1B4B' },
  section: { marginBottom: 8 },
  sectionHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 24, paddingVertical: 12 },
  sectionTitle: { fontSize: 18, fontWeight: '800', color: '#1E1B4B' },
  seeAll: { fontSize: 13, color: '#A78BFA', fontWeight: '600' },
  horizontalScroll: { paddingLeft: 24, paddingRight: 12, gap: 14 },
  trackCard: { width: CARD_W },
  trackCardThumb: { width: CARD_W, height: CARD_W, borderRadius: 18, overflow: 'hidden', marginBottom: 10, position: 'relative', borderWidth: 1.5, borderColor: 'rgba(255,255,255,0.9)' },
  trackCardImg: { width: CARD_W, height: CARD_W, borderRadius: 18, alignItems: 'center', justifyContent: 'center' },
  trackCardPlay: { position: 'absolute', bottom: 8, right: 8, width: 30, height: 30, borderRadius: 15, backgroundColor: 'rgba(0,0,0,0.35)', alignItems: 'center', justifyContent: 'center' },
  trackCardTitle: { fontSize: 13, fontWeight: '700', color: '#1E1B4B', lineHeight: 18, marginBottom: 2 },
  trackCardArtist: { fontSize: 11, color: '#6B7280' },
  reasonBadge: { marginTop: 4, backgroundColor: 'rgba(167,139,250,0.15)', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8, alignSelf: 'flex-start' },
  reasonText: { fontSize: 10, color: '#7C3AED', fontWeight: '700' },
  trendingList: { paddingHorizontal: 16, gap: 6 },
  trendingRow: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 12, borderRadius: 18, overflow: 'hidden', borderWidth: 1.5, borderColor: 'rgba(255,255,255,0.9)' },
  trendingRank: { width: 28, height: 28, borderRadius: 8, backgroundColor: 'rgba(167,139,250,0.15)', alignItems: 'center', justifyContent: 'center' },
  trendingRankText: { fontSize: 13, fontWeight: '900', color: '#7C3AED' },
  trendingThumb: { width: 44, height: 44, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  trendingInfo: { flex: 1 },
  trendingTitle: { fontSize: 14, fontWeight: '700', color: '#1E1B4B', marginBottom: 2 },
  trendingArtist: { fontSize: 12, color: '#6B7280' },
  emptyWrap: { paddingHorizontal: 24, marginTop: 20 },
  emptyCard: { padding: 40, borderRadius: 28, overflow: 'hidden', alignItems: 'center', borderWidth: 1.5, borderColor: 'rgba(167,139,250,0.15)' },
  emptyEmoji: { fontSize: 56, marginBottom: 16 },
  emptyTitle: { fontSize: 20, fontWeight: '800', color: '#1E1B4B', marginBottom: 8 },
  emptySub: { fontSize: 14, color: '#6B7280', textAlign: 'center', lineHeight: 22, marginBottom: 24 },
  dailyMixCard: { marginHorizontal: 24, marginBottom: 16, borderRadius: 24, overflow: 'hidden', height: 100, borderWidth: 1.5, borderColor: 'rgba(255,255,255,0.9)' },
  dailyMixDeco: { position: 'absolute', right: -30, top: -30, width: 140, height: 140, borderRadius: 70, backgroundColor: 'rgba(255,255,255,0.15)' },
  dailyMixContent: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 20 },
  dailyMixBadge: { fontSize: 10, fontWeight: '800', color: 'rgba(255,255,255,0.8)', letterSpacing: 2, marginBottom: 4 },
  dailyMixTitle: { fontSize: 20, fontWeight: '900', color: '#FFFFFF', letterSpacing: -0.5 },
  dailyMixSub: { fontSize: 12, color: 'rgba(255,255,255,0.8)', marginTop: 2 },
  dailyMixBtn: { width: 48, height: 48, borderRadius: 24, backgroundColor: 'rgba(255,255,255,0.9)', alignItems: 'center', justifyContent: 'center' },
  emptyBtn: { borderRadius: 30, overflow: 'hidden' },
  emptyBtnText: { fontSize: 14, fontWeight: '700', color: '#FFFFFF', paddingHorizontal: 28, paddingVertical: 13 },
});

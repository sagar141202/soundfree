import {
  View, Text, StyleSheet, ScrollView,
  TouchableOpacity, Image, Dimensions
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { StatusBar } from 'expo-status-bar';
import { router } from 'expo-router';
import { useLibraryStore } from '../../stores/libraryStore';
import { usePlayTrack } from '../../hooks/usePlayTrack';
import { Ionicons } from '@expo/vector-icons';

const { width } = Dimensions.get('window');

const THUMB_COLORS = [
  ['#C4B5FD', '#A78BFA'],
  ['#7DD3FC', '#93C5FD'],
  ['#86EFAC', '#6EE7B7'],
  ['#FDE68A', '#FCA5A5'],
  ['#FBCFE8', '#F9A8D4'],
];

function TrackRow({ track, index, onPress }: any) {
  const colorIndex = track.video_id.charCodeAt(0) % THUMB_COLORS.length;
  return (
    <TouchableOpacity style={styles.trackRow} onPress={onPress}>
      <View style={styles.trackThumbWrap}>
        {track.thumbnail_url ? (
          <Image source={{ uri: track.thumbnail_url }} style={styles.trackThumb} resizeMode="cover" />
        ) : (
          <LinearGradient colors={THUMB_COLORS[colorIndex] as [string, string]} style={styles.trackThumb}>
            <Text style={{ fontSize: 14 }}>🎵</Text>
          </LinearGradient>
        )}
      </View>
      <View style={styles.trackInfo}>
        <Text style={styles.trackTitle} numberOfLines={1}>{track.title}</Text>
        <Text style={styles.trackArtist} numberOfLines={1}>{track.artist}</Text>
      </View>
      <TouchableOpacity style={styles.trackPlay} onPress={onPress}>
        <Ionicons name="play-circle" size={32} color="#A78BFA" />
      </TouchableOpacity>
    </TouchableOpacity>
  );
}

export default function LibraryScreen() {
  const likedTracks = useLibraryStore(s => s.likedTracks);
  const recentlyPlayed = useLibraryStore(s => s.recentlyPlayed);
  const { playTrack } = usePlayTrack();

  return (
    <View style={styles.container}>
      <StatusBar style="dark" />
      <LinearGradient colors={['#FAFBFF', '#F0F4FF', '#F8FAFF']} style={StyleSheet.absoluteFillObject} />

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>
        <View style={styles.header}>
          <Text style={styles.title}>Library</Text>
          <Text style={styles.sub}>Your personal collection</Text>
        </View>

        {/* Top cards */}
        <View style={styles.cardsRow}>
          {/* Liked Songs */}
          <TouchableOpacity style={styles.bigCard} onPress={() => router.push("/liked")}>
            <LinearGradient colors={['#FBCFE8', '#F9A8D4']} style={StyleSheet.absoluteFillObject} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} />
            <View style={styles.cardOverlay} />
            <View style={styles.cardIconWrap}>
              <Text style={styles.cardIconEmoji}>❤️</Text>
            </View>
            <Text style={styles.cardTitle}>Liked Songs</Text>
            <Text style={styles.cardCount}>{likedTracks.length} tracks</Text>
          </TouchableOpacity>

          {/* Downloaded */}
          <TouchableOpacity style={styles.bigCard} onPress={() => router.push("/liked")}>
            <LinearGradient colors={['#86EFAC', '#6EE7B7']} style={StyleSheet.absoluteFillObject} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} />
            <View style={styles.cardOverlay} />
            <View style={styles.cardIconWrap}>
              <Text style={styles.cardIconEmoji}>⬇️</Text>
            </View>
            <Text style={styles.cardTitle}>Downloads</Text>
            <Text style={styles.cardCount}>0 tracks</Text>
          </TouchableOpacity>
        </View>

        {/* Section cards */}
        {[
          { name: 'Playlists', emoji: '🎵', count: '0 playlists', colors: ['#93C5FD', '#A5B4FC'] as [string,string], route: '/playlists' },
          { name: 'Artists', emoji: '🎤', count: '0 artists', colors: ['#D8B4FE', '#C084FC'] as [string,string] },
          { name: 'Albums', emoji: '💿', count: '0 albums', colors: ['#FDE68A', '#FCD34D'] as [string,string] },
        ].map((s, i) => (
          <TouchableOpacity key={i} style={styles.sectionCard}>
            <LinearGradient colors={['rgba(255,255,255,0.9)', 'rgba(255,255,255,0.6)']} style={StyleSheet.absoluteFillObject} />
            <View style={styles.sectionCardBorder} />
            <LinearGradient colors={s.colors} style={styles.sectionIcon}>
              <Text style={styles.sectionEmoji}>{s.emoji}</Text>
            </LinearGradient>
            <View style={styles.sectionInfo}>
              <Text style={styles.sectionName}>{s.name}</Text>
              <Text style={styles.sectionCount}>{s.count}</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color="#C4B5FD" />
          </TouchableOpacity>
        ))}

        {/* Liked Songs list */}
        {likedTracks.length > 0 && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>❤️ Liked Songs</Text>
              <TouchableOpacity onPress={() => router.push('/liked')}><Text style={styles.seeAll}>See all →</Text></TouchableOpacity>
            </View>
            <View style={styles.trackList}>
              {likedTracks.slice(0, 5).map((track, i) => (
                <TrackRow
                  key={track.video_id}
                  track={track}
                  index={i}
                  onPress={() => playTrack(track, likedTracks)}
                />
              ))}
            </View>
          </View>
        )}

        {/* Recently Played */}
        {recentlyPlayed.length > 0 && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>🕐 Recently Played</Text>
              <TouchableOpacity onPress={() => router.push('/recent')}><Text style={styles.seeAll}>See all →</Text></TouchableOpacity>
            </View>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.recentScroll}>
              {recentlyPlayed.slice(0, 10).map((track, i) => {
                const colorIndex = track.video_id.charCodeAt(0) % THUMB_COLORS.length;
                return (
                  <TouchableOpacity
                    key={track.video_id}
                    style={styles.recentCard}
                    onPress={() => playTrack(track, recentlyPlayed)}
                  >
                    <View style={styles.recentThumbWrap}>
                      {track.thumbnail_url ? (
                        <Image source={{ uri: track.thumbnail_url }} style={styles.recentThumb} resizeMode="cover" />
                      ) : (
                        <LinearGradient colors={THUMB_COLORS[colorIndex] as [string, string]} style={styles.recentThumb}>
                          <Text style={{ fontSize: 24 }}>🎵</Text>
                        </LinearGradient>
                      )}
                      <View style={styles.recentPlayOverlay}>
                        <Ionicons name="play" size={20} color="rgba(255,255,255,0.9)" />
                      </View>
                    </View>
                    <Text style={styles.recentTitle} numberOfLines={2}>{track.title}</Text>
                    <Text style={styles.recentArtist} numberOfLines={1}>{track.artist}</Text>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          </View>
        )}

        {/* Empty state */}
        {likedTracks.length === 0 && recentlyPlayed.length === 0 && (
          <View style={styles.emptyWrap}>
            <View style={styles.emptyCard}>
              <LinearGradient colors={['rgba(167,139,250,0.1)', 'rgba(125,211,252,0.05)']} style={StyleSheet.absoluteFillObject} />
              <Text style={styles.emptyEmoji}>🎵</Text>
              <Text style={styles.emptyTitle}>Your library is empty</Text>
              <Text style={styles.emptySub}>Start playing music to build your collection</Text>
              <TouchableOpacity style={styles.emptyBtn} onPress={() => router.push('/(tabs)/search')}>
                <LinearGradient colors={['#C4B5FD', '#A78BFA']} style={styles.emptyBtnGrad} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}>
                  <Text style={styles.emptyBtnText}>Discover Music</Text>
                </LinearGradient>
              </TouchableOpacity>
            </View>
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const CARD_WIDTH = (width - 60) / 2;

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FAFBFF' },
  scroll: { paddingBottom: 160 },
  header: { paddingTop: 64, paddingHorizontal: 24, marginBottom: 24 },
  title: { fontSize: 36, fontWeight: '900', color: '#1E1B4B', letterSpacing: -1 },
  sub: { fontSize: 14, color: '#6B7280', marginTop: 4 },
  cardsRow: { flexDirection: 'row', paddingHorizontal: 24, gap: 12, marginBottom: 12 },
  bigCard: {
    flex: 1, height: 140, borderRadius: 22, overflow: 'hidden',
    justifyContent: 'flex-end', padding: 16,
    borderWidth: 1.5, borderColor: 'rgba(255,255,255,0.9)',
  },
  cardOverlay: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(255,255,255,0.1)' },
  cardIconWrap: { marginBottom: 8 },
  cardIconEmoji: { fontSize: 28 },
  cardTitle: { fontSize: 16, fontWeight: '800', color: '#1E1B4B' },
  cardCount: { fontSize: 12, color: '#6B7280', marginTop: 2 },
  sectionCard: {
    flexDirection: 'row', alignItems: 'center',
    marginHorizontal: 24, marginBottom: 8,
    padding: 16, borderRadius: 20, overflow: 'hidden',
    borderWidth: 1.5, borderColor: 'rgba(255,255,255,0.9)',
    gap: 14,
  },
  sectionCardBorder: { position: 'absolute', inset: 0, borderRadius: 20, borderWidth: 1, borderColor: 'rgba(167,139,250,0.1)' },
  sectionIcon: { width: 46, height: 46, borderRadius: 13, alignItems: 'center', justifyContent: 'center' },
  sectionEmoji: { fontSize: 20 },
  sectionInfo: { flex: 1 },
  sectionName: { fontSize: 16, fontWeight: '700', color: '#1E1B4B', marginBottom: 2 },
  sectionCount: { fontSize: 12, color: '#6B7280' },
  section: { marginTop: 24 },
  sectionHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 24, marginBottom: 12 },
  sectionTitle: { fontSize: 20, fontWeight: '800', color: '#1E1B4B' },
  seeAll: { fontSize: 13, color: '#A78BFA', fontWeight: '600' },
  trackList: { paddingHorizontal: 24, gap: 4 },
  trackRow: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    padding: 10, borderRadius: 16,
    backgroundColor: 'rgba(255,255,255,0.7)',
    borderWidth: 1.5, borderColor: 'rgba(255,255,255,0.9)',
    marginBottom: 6,
  },
  trackThumbWrap: { width: 46, height: 46, borderRadius: 10, overflow: 'hidden' },
  trackThumb: { width: 46, height: 46, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  trackInfo: { flex: 1 },
  trackTitle: { fontSize: 14, fontWeight: '700', color: '#1E1B4B', marginBottom: 2 },
  trackArtist: { fontSize: 12, color: '#6B7280' },
  trackPlay: { padding: 4 },
  recentScroll: { paddingLeft: 24, paddingRight: 12 },
  recentCard: { width: 130, marginRight: 12 },
  recentThumbWrap: { width: 130, height: 130, borderRadius: 18, overflow: 'hidden', marginBottom: 8, position: 'relative' },
  recentThumb: { width: 130, height: 130, borderRadius: 18, alignItems: 'center', justifyContent: 'center' },
  recentPlayOverlay: {
    position: 'absolute', bottom: 8, right: 8,
    width: 36, height: 36, borderRadius: 18,
    backgroundColor: 'rgba(0,0,0,0.4)',
    alignItems: 'center', justifyContent: 'center',
  },
  recentTitle: { fontSize: 13, fontWeight: '700', color: '#1E1B4B', lineHeight: 18 },
  recentArtist: { fontSize: 11, color: '#6B7280', marginTop: 2 },
  emptyWrap: { paddingHorizontal: 24, marginTop: 32 },
  emptyCard: { padding: 40, borderRadius: 28, overflow: 'hidden', alignItems: 'center', borderWidth: 1.5, borderColor: 'rgba(167,139,250,0.15)' },
  emptyEmoji: { fontSize: 56, marginBottom: 16 },
  emptyTitle: { fontSize: 20, fontWeight: '800', color: '#1E1B4B', marginBottom: 8 },
  emptySub: { fontSize: 14, color: '#6B7280', textAlign: 'center', lineHeight: 22, marginBottom: 24 },
  emptyBtn: { borderRadius: 30, overflow: 'hidden' },
  emptyBtnGrad: { paddingHorizontal: 28, paddingVertical: 13, borderRadius: 30 },
  emptyBtnText: { fontSize: 14, fontWeight: '700', color: '#FFFFFF' },
});

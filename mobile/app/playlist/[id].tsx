import {
  View, Text, StyleSheet, TouchableOpacity,
  Image, Animated, Alert, ScrollView
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { StatusBar } from 'expo-status-bar';
import { useRef, useEffect, useState } from 'react';
import { router, useLocalSearchParams } from 'expo-router';
import { usePlaylistStore } from '../../stores/playlistStore';
import { usePlayTrack } from '../../hooks/usePlayTrack';
import { usePlayerStore } from '../../stores/playerStore';
import { Ionicons } from '@expo/vector-icons';
import type { Track } from '../../components/TrackListItem';

const THUMB_COLORS = [
  ['#C4B5FD','#A78BFA'],['#7DD3FC','#93C5FD'],
  ['#86EFAC','#6EE7B7'],['#FDE68A','#FCA5A5'],
  ['#FBCFE8','#F9A8D4'],
];

export default function PlaylistDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const playlists = usePlaylistStore(s => s.playlists);
  const updatePlaylist = usePlaylistStore(s => s.updatePlaylist);
  const removeTrackFromPlaylist = usePlaylistStore(s => s.removeTrackFromPlaylist);
  const deletePlaylist = usePlaylistStore(s => s.deletePlaylist);
  const { playTrack } = usePlayTrack();
  const currentTrack = usePlayerStore(s => s.currentTrack);

  const playlist = playlists.find(p => p.id === id);
  const [editMode, setEditMode] = useState(false);
  const [tracks, setTracks] = useState<Track[]>(playlist?.tracks || []);
  const slideAnim = useRef(new Animated.Value(40)).current;
  const opacityAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.spring(slideAnim, { toValue: 0, useNativeDriver: true, tension: 80, friction: 12 }),
      Animated.timing(opacityAnim, { toValue: 1, duration: 300, useNativeDriver: true }),
    ]).start();
  }, []);

  useEffect(() => {
    if (playlist) setTracks(playlist.tracks);
  }, [playlist]);

  if (!playlist) { router.back(); return null; }

  const moveUp = (index: number) => {
    if (index === 0) return;
    const newTracks = [...tracks];
    [newTracks[index - 1], newTracks[index]] = [newTracks[index], newTracks[index - 1]];
    setTracks(newTracks);
    updatePlaylist(playlist.id, { tracks: newTracks });
  };

  const moveDown = (index: number) => {
    if (index === tracks.length - 1) return;
    const newTracks = [...tracks];
    [newTracks[index], newTracks[index + 1]] = [newTracks[index + 1], newTracks[index]];
    setTracks(newTracks);
    updatePlaylist(playlist.id, { tracks: newTracks });
  };

  const handleDelete = () => {
    Alert.alert('Delete Playlist', `Delete "${playlist.name}"?`, [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: () => { deletePlaylist(playlist.id); router.back(); } },
    ]);
  };

  return (
    <View style={styles.container}>
      <StatusBar style="dark" />
      <LinearGradient colors={['#F8F0FF', '#FAFBFF', '#F0F4FF']} style={StyleSheet.absoluteFillObject} />
      <Animated.View style={[styles.inner, { transform: [{ translateY: slideAnim }], opacity: opacityAnim }]}>

        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
            <LinearGradient colors={['rgba(167,139,250,0.2)', 'rgba(167,139,250,0.1)']} style={StyleSheet.absoluteFillObject} />
            <Ionicons name="chevron-back" size={22} color="#7C3AED" />
          </TouchableOpacity>
          <Text style={styles.headerTitle} numberOfLines={1}>{playlist.name}</Text>
          <TouchableOpacity style={[styles.editBtn, editMode && styles.editBtnActive]} onPress={() => setEditMode(!editMode)}>
            <LinearGradient colors={editMode ? ['#C4B5FD', '#A78BFA'] : ['rgba(167,139,250,0.15)', 'rgba(167,139,250,0.08)']} style={StyleSheet.absoluteFillObject} />
            <Ionicons name={editMode ? 'checkmark' : 'pencil'} size={18} color={editMode ? '#FFFFFF' : '#7C3AED'} />
          </TouchableOpacity>
        </View>

        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>
          {/* Hero */}
          <View style={styles.hero}>
            <LinearGradient colors={playlist.coverColors} style={styles.heroArt} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}>
              <Text style={styles.heroEmoji}>{playlist.coverEmoji}</Text>
            </LinearGradient>
            <Text style={styles.heroTitle}>{playlist.name}</Text>
            <Text style={styles.heroCount}>{tracks.length} tracks</Text>

            {tracks.length > 0 && !editMode && (
              <View style={styles.heroControls}>
                <TouchableOpacity style={styles.playAllBtn} onPress={() => playTrack(tracks[0], tracks)}>
                  <LinearGradient colors={playlist.coverColors} style={StyleSheet.absoluteFillObject} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} />
                  <Ionicons name="play" size={18} color="#1E1B4B" />
                  <Text style={styles.playAllText}>Play All</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.shuffleBtn} onPress={() => {
                  const s = [...tracks].sort(() => Math.random() - 0.5);
                  playTrack(s[0], s);
                }}>
                  <LinearGradient colors={['rgba(167,139,250,0.15)', 'rgba(125,211,252,0.08)']} style={StyleSheet.absoluteFillObject} />
                  <Ionicons name="shuffle" size={18} color="#7C3AED" />
                  <Text style={styles.shuffleText}>Shuffle</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.deleteBtn} onPress={handleDelete}>
                  <LinearGradient colors={['rgba(252,165,165,0.2)', 'rgba(248,113,113,0.1)']} style={StyleSheet.absoluteFillObject} />
                  <Ionicons name="trash-outline" size={18} color="#EF4444" />
                </TouchableOpacity>
              </View>
            )}

            {editMode && (
              <View style={styles.editHint}>
                <LinearGradient colors={['rgba(167,139,250,0.1)', 'rgba(125,211,252,0.05)']} style={StyleSheet.absoluteFillObject} />
                <Ionicons name="information-circle-outline" size={16} color="#7C3AED" />
                <Text style={styles.editHintText}>Use ↑↓ to reorder • Tap − to remove</Text>
              </View>
            )}
          </View>

          {/* Track list */}
          {tracks.length === 0 ? (
            <View style={styles.emptyWrap}>
              <Text style={styles.emptyEmoji}>🎵</Text>
              <Text style={styles.emptyTitle}>No tracks yet</Text>
              <Text style={styles.emptySub}>Search songs and tap ⋮ to add here</Text>
            </View>
          ) : (
            <View style={styles.list}>
              {tracks.map((item, index) => {
                const colorIndex = item.video_id.charCodeAt(0) % THUMB_COLORS.length;
                const isPlaying = currentTrack?.video_id === item.video_id;
                return (
                  <View key={item.video_id} style={[styles.trackRow, isPlaying && styles.trackRowActive]}>
                    {isPlaying && (
                      <LinearGradient colors={['rgba(167,139,250,0.15)', 'rgba(125,211,252,0.08)']} style={StyleSheet.absoluteFillObject} />
                    )}

                    {/* Index or reorder buttons */}
                    {editMode ? (
                      <View style={styles.reorderBtns}>
                        <TouchableOpacity
                          style={[styles.reorderBtn, index === 0 && styles.reorderBtnDisabled]}
                          onPress={() => moveUp(index)}
                        >
                          <Ionicons name="chevron-up" size={16} color={index === 0 ? '#E5E7EB' : '#A78BFA'} />
                        </TouchableOpacity>
                        <TouchableOpacity
                          style={[styles.reorderBtn, index === tracks.length - 1 && styles.reorderBtnDisabled]}
                          onPress={() => moveDown(index)}
                        >
                          <Ionicons name="chevron-down" size={16} color={index === tracks.length - 1 ? '#E5E7EB' : '#A78BFA'} />
                        </TouchableOpacity>
                      </View>
                    ) : (
                      <Text style={styles.trackIndex}>{index + 1}</Text>
                    )}

                    {/* Thumbnail */}
                    <TouchableOpacity
                      style={styles.thumbWrap}
                      onPress={() => !editMode && playTrack(item, tracks)}
                    >
                      {item.thumbnail_url ? (
                        <Image source={{ uri: item.thumbnail_url }} style={styles.thumb} resizeMode="cover" />
                      ) : (
                        <LinearGradient colors={THUMB_COLORS[colorIndex] as [string,string]} style={styles.thumb}>
                          <Text style={{ fontSize: 16 }}>🎵</Text>
                        </LinearGradient>
                      )}
                      {isPlaying && (
                        <View style={styles.playingOverlay}>
                          <Text style={{ fontSize: 12, color: '#FFF' }}>▶</Text>
                        </View>
                      )}
                    </TouchableOpacity>

                    {/* Info */}
                    <TouchableOpacity style={styles.trackInfo} onPress={() => !editMode && playTrack(item, tracks)}>
                      <Text style={[styles.trackTitle, isPlaying && styles.trackTitleActive]} numberOfLines={1}>{item.title}</Text>
                      <Text style={styles.trackArtist} numberOfLines={1}>{item.artist}</Text>
                    </TouchableOpacity>

                    {/* Action */}
                    {editMode ? (
                      <TouchableOpacity
                        style={styles.removeBtn}
                        onPress={() => removeTrackFromPlaylist(playlist.id, item.video_id)}
                      >
                        <LinearGradient colors={['#FCA5A5', '#F87171']} style={styles.removeBtnGrad}>
                          <Ionicons name="remove" size={18} color="#FFFFFF" />
                        </LinearGradient>
                      </TouchableOpacity>
                    ) : (
                      <TouchableOpacity onPress={() => playTrack(item, tracks)}>
                        <Ionicons name="play-circle" size={32} color="#C4B5FD" />
                      </TouchableOpacity>
                    )}
                  </View>
                );
              })}
            </View>
          )}
          <View style={{ height: 160 }} />
        </ScrollView>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FAFBFF' },
  inner: { flex: 1 },
  scroll: { paddingBottom: 20 },
  header: { flexDirection: 'row', alignItems: 'center', paddingTop: 56, paddingHorizontal: 24, paddingBottom: 8 },
  backBtn: { width: 42, height: 42, borderRadius: 21, alignItems: 'center', justifyContent: 'center', overflow: 'hidden', borderWidth: 1.5, borderColor: 'rgba(167,139,250,0.3)' },
  headerTitle: { flex: 1, textAlign: 'center', fontSize: 17, fontWeight: '800', color: '#1E1B4B', paddingHorizontal: 8 },
  editBtn: { width: 42, height: 42, borderRadius: 21, alignItems: 'center', justifyContent: 'center', overflow: 'hidden', borderWidth: 1.5, borderColor: 'rgba(167,139,250,0.3)' },
  editBtnActive: { borderColor: '#A78BFA' },
  hero: { alignItems: 'center', paddingVertical: 20, paddingHorizontal: 24 },
  heroArt: { width: 120, height: 120, borderRadius: 24, alignItems: 'center', justifyContent: 'center', marginBottom: 14, borderWidth: 2, borderColor: 'rgba(255,255,255,0.9)' },
  heroEmoji: { fontSize: 52 },
  heroTitle: { fontSize: 26, fontWeight: '900', color: '#1E1B4B', marginBottom: 4 },
  heroCount: { fontSize: 13, color: '#6B7280', marginBottom: 16 },
  heroControls: { flexDirection: 'row', gap: 10, alignItems: 'center' },
  playAllBtn: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 20, paddingVertical: 11, borderRadius: 30, overflow: 'hidden', borderWidth: 1.5, borderColor: 'rgba(255,255,255,0.8)' },
  playAllText: { fontSize: 14, fontWeight: '700', color: '#1E1B4B' },
  shuffleBtn: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 20, paddingVertical: 11, borderRadius: 30, overflow: 'hidden', borderWidth: 1.5, borderColor: 'rgba(167,139,250,0.3)' },
  shuffleText: { fontSize: 14, fontWeight: '600', color: '#7C3AED' },
  deleteBtn: { width: 42, height: 42, borderRadius: 21, alignItems: 'center', justifyContent: 'center', overflow: 'hidden', borderWidth: 1.5, borderColor: 'rgba(252,165,165,0.4)' },
  editHint: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20, overflow: 'hidden', borderWidth: 1, borderColor: 'rgba(167,139,250,0.2)' },
  editHintText: { fontSize: 13, color: '#7C3AED', fontWeight: '500' },
  list: { paddingHorizontal: 16, gap: 6 },
  trackRow: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 12, borderRadius: 18, backgroundColor: 'rgba(255,255,255,0.7)', borderWidth: 1.5, borderColor: 'rgba(255,255,255,0.9)', overflow: 'hidden' },
  trackRowActive: { borderColor: 'rgba(167,139,250,0.4)' },
  reorderBtns: { gap: 2, alignItems: 'center' },
  reorderBtn: { width: 24, height: 24, alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(167,139,250,0.1)', borderRadius: 6 },
  reorderBtnDisabled: { backgroundColor: 'rgba(229,231,235,0.3)' },
  trackIndex: { width: 24, textAlign: 'center', fontSize: 13, color: '#9CA3AF', fontWeight: '600' },
  thumbWrap: { width: 46, height: 46, borderRadius: 10, overflow: 'hidden' },
  thumb: { width: 46, height: 46, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  playingOverlay: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(167,139,250,0.6)', alignItems: 'center', justifyContent: 'center', borderRadius: 10 },
  trackInfo: { flex: 1 },
  trackTitle: { fontSize: 14, fontWeight: '700', color: '#1E1B4B', marginBottom: 2 },
  trackTitleActive: { color: '#7C3AED' },
  trackArtist: { fontSize: 12, color: '#6B7280' },
  removeBtn: { marginLeft: 4 },
  removeBtnGrad: { width: 30, height: 30, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  emptyWrap: { alignItems: 'center', justifyContent: 'center', padding: 40 },
  emptyEmoji: { fontSize: 48, marginBottom: 16 },
  emptyTitle: { fontSize: 18, fontWeight: '800', color: '#1E1B4B', marginBottom: 8 },
  emptySub: { fontSize: 14, color: '#6B7280', textAlign: 'center', lineHeight: 22 },
});

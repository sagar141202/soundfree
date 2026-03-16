import {
  View, Text, StyleSheet, TouchableOpacity,
  ScrollView, Animated, Dimensions
} from 'react-native';
import { useRef, useEffect } from 'react';
import { LinearGradient } from 'expo-linear-gradient';
import { usePlaylistStore } from '../stores/playlistStore';
import { Ionicons } from '@expo/vector-icons';
import type { Track } from './TrackListItem';

const { height } = Dimensions.get('window');

interface AddToPlaylistSheetProps {
  track: Track;
  onClose: () => void;
}

export default function AddToPlaylistSheet({ track, onClose }: AddToPlaylistSheetProps) {
  const playlists = usePlaylistStore(s => s.playlists);
  const addTrackToPlaylist = usePlaylistStore(s => s.addTrackToPlaylist);
  const slideAnim = useRef(new Animated.Value(height)).current;
  const bgOpacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.spring(slideAnim, {
        toValue: 0, useNativeDriver: true,
        tension: 70, friction: 12,
      }),
      Animated.timing(bgOpacity, {
        toValue: 1, duration: 300, useNativeDriver: true,
      }),
    ]).start();
  }, []);

  const handleClose = () => {
    Animated.parallel([
      Animated.timing(slideAnim, { toValue: height, duration: 300, useNativeDriver: true }),
      Animated.timing(bgOpacity, { toValue: 0, duration: 300, useNativeDriver: true }),
    ]).start(() => onClose());
  };

  const handleAdd = (playlistId: string, playlistName: string) => {
    addTrackToPlaylist(playlistId, track);
    handleClose();
  };

  const isInPlaylist = (playlistId: string) => {
    const playlist = playlists.find(p => p.id === playlistId);
    return playlist?.tracks.some(t => t.video_id === track.video_id) ?? false;
  };

  return (
    <View style={StyleSheet.absoluteFillObject} pointerEvents="box-none">
      {/* Backdrop */}
      <Animated.View style={[styles.backdrop, { opacity: bgOpacity }]}>
        <TouchableOpacity style={StyleSheet.absoluteFillObject} onPress={handleClose} />
      </Animated.View>

      {/* Sheet */}
      <Animated.View style={[styles.sheet, { transform: [{ translateY: slideAnim }] }]}>
        <LinearGradient
          colors={['rgba(255,255,255,0.99)', 'rgba(240,244,255,0.99)']}
          style={StyleSheet.absoluteFillObject}
        />

        {/* Handle */}
        <View style={styles.handle} />

        {/* Track info */}
        <View style={styles.trackInfo}>
          <Text style={styles.sheetTitle}>Add to Playlist</Text>
          <Text style={styles.trackName} numberOfLines={1}>"{track.title}"</Text>
        </View>

        {playlists.length === 0 ? (
          <View style={styles.emptyWrap}>
            <Text style={styles.emptyText}>No playlists yet</Text>
            <Text style={styles.emptySub}>Create a playlist from your Library first</Text>
          </View>
        ) : (
          <ScrollView
            style={styles.list}
            contentContainerStyle={styles.listContent}
            showsVerticalScrollIndicator={false}
          >
            {playlists.map((playlist) => {
              const added = isInPlaylist(playlist.id);
              return (
                <TouchableOpacity
                  key={playlist.id}
                  style={[styles.playlistRow, added && styles.playlistRowAdded]}
                  onPress={() => !added && handleAdd(playlist.id, playlist.name)}
                  activeOpacity={added ? 1 : 0.7}
                >
                  <LinearGradient
                    colors={added ? ['rgba(167,139,250,0.1)', 'rgba(125,211,252,0.05)'] : ['rgba(255,255,255,0.8)', 'rgba(255,255,255,0.4)']}
                    style={StyleSheet.absoluteFillObject}
                  />
                  <LinearGradient
                    colors={playlist.coverColors}
                    style={styles.playlistIcon}
                    start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
                  >
                    <Text style={styles.playlistEmoji}>{playlist.coverEmoji}</Text>
                  </LinearGradient>
                  <View style={styles.playlistInfo}>
                    <Text style={[styles.playlistName, added && styles.playlistNameAdded]}>
                      {playlist.name}
                    </Text>
                    <Text style={styles.playlistCount}>
                      {playlist.tracks.length} tracks
                    </Text>
                  </View>
                  {added ? (
                    <View style={styles.addedBadge}>
                      <LinearGradient colors={['#C4B5FD', '#A78BFA']} style={StyleSheet.absoluteFillObject} />
                      <Ionicons name="checkmark" size={16} color="#FFFFFF" />
                    </View>
                  ) : (
                    <View style={styles.addBtn}>
                      <Ionicons name="add" size={22} color="#A78BFA" />
                    </View>
                  )}
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        )}

        <TouchableOpacity style={styles.cancelBtn} onPress={handleClose}>
          <LinearGradient colors={['rgba(167,139,250,0.1)', 'rgba(125,211,252,0.05)']} style={StyleSheet.absoluteFillObject} />
          <Text style={styles.cancelText}>Cancel</Text>
        </TouchableOpacity>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(30,27,75,0.5)',
  },
  sheet: {
    position: 'absolute', bottom: 0, left: 0, right: 0,
    borderTopLeftRadius: 32, borderTopRightRadius: 32,
    overflow: 'hidden', paddingBottom: 40,
    maxHeight: height * 0.75,
  },
  handle: {
    width: 40, height: 4, borderRadius: 2,
    backgroundColor: 'rgba(167,139,250,0.4)',
    alignSelf: 'center', marginTop: 12, marginBottom: 4,
  },
  trackInfo: { paddingHorizontal: 24, paddingVertical: 16 },
  sheetTitle: { fontSize: 22, fontWeight: '900', color: '#1E1B4B', marginBottom: 4 },
  trackName: { fontSize: 14, color: '#6B7280' },
  list: { maxHeight: height * 0.45 },
  listContent: { paddingHorizontal: 16, gap: 8, paddingBottom: 8 },
  playlistRow: {
    flexDirection: 'row', alignItems: 'center', gap: 14,
    padding: 14, borderRadius: 18, overflow: 'hidden',
    borderWidth: 1.5, borderColor: 'rgba(255,255,255,0.9)',
  },
  playlistRowAdded: { borderColor: 'rgba(167,139,250,0.3)' },
  playlistIcon: { width: 46, height: 46, borderRadius: 13, alignItems: 'center', justifyContent: 'center' },
  playlistEmoji: { fontSize: 22 },
  playlistInfo: { flex: 1 },
  playlistName: { fontSize: 15, fontWeight: '700', color: '#1E1B4B', marginBottom: 2 },
  playlistNameAdded: { color: '#7C3AED' },
  playlistCount: { fontSize: 12, color: '#6B7280' },
  addedBadge: {
    width: 32, height: 32, borderRadius: 16,
    alignItems: 'center', justifyContent: 'center', overflow: 'hidden',
  },
  addBtn: {
    width: 32, height: 32, borderRadius: 16,
    alignItems: 'center', justifyContent: 'center',
    backgroundColor: 'rgba(167,139,250,0.1)',
    borderWidth: 1.5, borderColor: 'rgba(167,139,250,0.3)',
  },
  emptyWrap: { padding: 32, alignItems: 'center' },
  emptyText: { fontSize: 16, fontWeight: '700', color: '#1E1B4B', marginBottom: 8 },
  emptySub: { fontSize: 13, color: '#6B7280', textAlign: 'center' },
  cancelBtn: {
    marginHorizontal: 16, marginTop: 8, padding: 16,
    borderRadius: 18, overflow: 'hidden', alignItems: 'center',
    borderWidth: 1.5, borderColor: 'rgba(167,139,250,0.2)',
  },
  cancelText: { fontSize: 15, fontWeight: '700', color: '#6B7280' },
});

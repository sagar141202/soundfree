import {
  View, Text, StyleSheet, TouchableOpacity,
  TextInput, ScrollView, Dimensions, Animated, Alert
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { StatusBar } from 'expo-status-bar';
import { useRef, useEffect, useState } from 'react';
import { router } from 'expo-router';
import { usePlaylistStore } from '../stores/playlistStore';
import { usePlayTrack } from '../hooks/usePlayTrack';
import { Ionicons } from '@expo/vector-icons';

const { width } = Dimensions.get('window');

const COLOR_PAIRS: [string, string][] = [
  ['#C4B5FD', '#A78BFA'],
  ['#7DD3FC', '#93C5FD'],
  ['#86EFAC', '#6EE7B7'],
  ['#FDE68A', '#FCA5A5'],
  ['#FBCFE8', '#F9A8D4'],
  ['#D8B4FE', '#C084FC'],
  ['#FCA5A5', '#F87171'],
];

const EMOJIS = ['🎵', '🎸', '🎹', '🎺', '🎻', '🥁', '🎤', '🎧', '🎼', '🌟', '🔥', '💫', '✨', '🎯'];

function CreatePlaylistModal({ onClose, onSave }: { onClose: () => void; onSave: (name: string, emoji: string, colors: [string, string]) => void }) {
  const [name, setName] = useState('');
  const [selectedEmoji, setSelectedEmoji] = useState('🎵');
  const [selectedColors, setSelectedColors] = useState<[string, string]>(COLOR_PAIRS[0]);

  return (
    <View style={styles.modalOverlay}>
      <TouchableOpacity style={StyleSheet.absoluteFillObject} onPress={onClose} />
      <View style={styles.modalCard}>
        <LinearGradient colors={['rgba(255,255,255,0.98)', 'rgba(240,244,255,0.98)']} style={StyleSheet.absoluteFillObject} />

        {/* Preview */}
        <View style={styles.modalPreview}>
          <LinearGradient colors={selectedColors} style={styles.previewArt}>
            <Text style={styles.previewEmoji}>{selectedEmoji}</Text>
          </LinearGradient>
        </View>

        <Text style={styles.modalTitle}>New Playlist</Text>

        {/* Name input */}
        <View style={styles.inputWrap}>
          <LinearGradient colors={['rgba(167,139,250,0.1)', 'rgba(125,211,252,0.05)']} style={StyleSheet.absoluteFillObject} />
          <TextInput
            style={styles.input}
            placeholder="Playlist name..."
            placeholderTextColor="#9CA3AF"
            value={name}
            onChangeText={setName}
            autoFocus
            selectionColor="#A78BFA"
          />
        </View>

        {/* Emoji picker */}
        <Text style={styles.pickerLabel}>Choose Icon</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.emojiPicker}>
          {EMOJIS.map((emoji) => (
            <TouchableOpacity
              key={emoji}
              style={[styles.emojiBtn, selectedEmoji === emoji && styles.emojiBtnActive]}
              onPress={() => setSelectedEmoji(emoji)}
            >
              <Text style={styles.emojiText}>{emoji}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {/* Color picker */}
        <Text style={styles.pickerLabel}>Choose Color</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.colorPicker}>
          {COLOR_PAIRS.map((colors, i) => (
            <TouchableOpacity
              key={i}
              style={[styles.colorBtn, selectedColors === colors && styles.colorBtnActive]}
              onPress={() => setSelectedColors(colors)}
            >
              <LinearGradient colors={colors} style={styles.colorSwatch} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} />
            </TouchableOpacity>
          ))}
        </ScrollView>

        {/* Actions */}
        <View style={styles.modalActions}>
          <TouchableOpacity style={styles.cancelBtn} onPress={onClose}>
            <Text style={styles.cancelText}>Cancel</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.saveBtn, !name.trim() && styles.saveBtnDisabled]}
            onPress={() => name.trim() && onSave(name.trim(), selectedEmoji, selectedColors)}
          >
            <LinearGradient colors={['#C4B5FD', '#A78BFA']} style={StyleSheet.absoluteFillObject} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} />
            <Text style={styles.saveText}>Create</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}

export default function PlaylistsScreen() {
  const playlists = usePlaylistStore(s => s.playlists);
  const createPlaylist = usePlaylistStore(s => s.createPlaylist);
  const deletePlaylist = usePlaylistStore(s => s.deletePlaylist);
  const { playTrack } = usePlayTrack();
  const [showCreate, setShowCreate] = useState(false);
  const slideAnim = useRef(new Animated.Value(50)).current;
  const opacityAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.spring(slideAnim, { toValue: 0, useNativeDriver: true, tension: 80, friction: 12 }),
      Animated.timing(opacityAnim, { toValue: 1, duration: 300, useNativeDriver: true }),
    ]).start();
  }, []);

  const handleCreate = (name: string, emoji: string, colors: [string, string]) => {
    const playlist = createPlaylist(name);
    usePlaylistStore.getState().updatePlaylist(playlist.id, { coverEmoji: emoji, coverColors: colors });
    setShowCreate(false);
  };

  const handleDelete = (id: string, name: string) => {
    Alert.alert('Delete Playlist', `Delete "${name}"?`, [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: () => deletePlaylist(id) },
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
          <Text style={styles.headerTitle}>Playlists</Text>
          <TouchableOpacity style={styles.createBtn} onPress={() => setShowCreate(true)}>
            <LinearGradient colors={['#C4B5FD', '#A78BFA']} style={StyleSheet.absoluteFillObject} />
            <Ionicons name="add" size={22} color="#FFFFFF" />
          </TouchableOpacity>
        </View>

        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>
          {playlists.length === 0 ? (
            <View style={styles.emptyWrap}>
              <View style={styles.emptyCard}>
                <LinearGradient colors={['rgba(167,139,250,0.1)', 'rgba(125,211,252,0.05)']} style={StyleSheet.absoluteFillObject} />
                <Text style={styles.emptyEmoji}>🎵</Text>
                <Text style={styles.emptyTitle}>No playlists yet</Text>
                <Text style={styles.emptySub}>Create your first playlist to organize your music</Text>
                <TouchableOpacity style={styles.createFirstBtn} onPress={() => setShowCreate(true)}>
                  <LinearGradient colors={['#C4B5FD', '#A78BFA']} style={StyleSheet.absoluteFillObject} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} />
                  <Text style={styles.createFirstText}>Create Playlist</Text>
                </TouchableOpacity>
              </View>
            </View>
          ) : (
            <View style={styles.grid}>
              {playlists.map((playlist) => (
                <TouchableOpacity
                  key={playlist.id}
                  style={styles.playlistCard}
                  onPress={() => router.push({ pathname: '/playlist/[id]', params: { id: playlist.id } })}
                  onLongPress={() => handleDelete(playlist.id, playlist.name)}
                >
                  <LinearGradient
                    colors={playlist.coverColors}
                    style={styles.playlistArt}
                    start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
                  >
                    <Text style={styles.playlistEmoji}>{playlist.coverEmoji}</Text>
                    {playlist.tracks.length > 0 && (
                      <View style={styles.playlistPlayBtn}>
                        <Ionicons name="play" size={16} color="rgba(255,255,255,0.9)" />
                      </View>
                    )}
                  </LinearGradient>
                  <Text style={styles.playlistName} numberOfLines={2}>{playlist.name}</Text>
                  <Text style={styles.playlistCount}>{playlist.tracks.length} tracks</Text>
                </TouchableOpacity>
              ))}

              {/* Add new card */}
              <TouchableOpacity style={styles.addCard} onPress={() => setShowCreate(true)}>
                <LinearGradient colors={['rgba(167,139,250,0.15)', 'rgba(125,211,252,0.08)']} style={StyleSheet.absoluteFillObject} />
                <Ionicons name="add" size={32} color="#A78BFA" />
                <Text style={styles.addCardText}>New</Text>
              </TouchableOpacity>
            </View>
          )}
          <View style={{ height: 160 }} />
        </ScrollView>
      </Animated.View>

      {showCreate && (
        <CreatePlaylistModal
          onClose={() => setShowCreate(false)}
          onSave={handleCreate}
        />
      )}
    </View>
  );
}

const CARD_WIDTH = (width - 60) / 2;

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FAFBFF' },
  inner: { flex: 1 },
  header: { flexDirection: 'row', alignItems: 'center', paddingTop: 56, paddingHorizontal: 24, paddingBottom: 16 },
  backBtn: { width: 42, height: 42, borderRadius: 21, alignItems: 'center', justifyContent: 'center', overflow: 'hidden', borderWidth: 1.5, borderColor: 'rgba(167,139,250,0.3)' },
  headerTitle: { flex: 1, textAlign: 'center', fontSize: 17, fontWeight: '800', color: '#1E1B4B' },
  createBtn: { width: 42, height: 42, borderRadius: 21, alignItems: 'center', justifyContent: 'center', overflow: 'hidden' },
  scroll: { paddingHorizontal: 24, paddingTop: 8 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  playlistCard: { width: CARD_WIDTH },
  playlistArt: {
    width: CARD_WIDTH, height: CARD_WIDTH, borderRadius: 20,
    alignItems: 'center', justifyContent: 'center',
    marginBottom: 10, position: 'relative',
    borderWidth: 1.5, borderColor: 'rgba(255,255,255,0.9)',
  },
  playlistEmoji: { fontSize: 40 },
  playlistPlayBtn: {
    position: 'absolute', bottom: 10, right: 10,
    width: 32, height: 32, borderRadius: 16,
    backgroundColor: 'rgba(0,0,0,0.3)',
    alignItems: 'center', justifyContent: 'center',
  },
  playlistName: { fontSize: 15, fontWeight: '700', color: '#1E1B4B', marginBottom: 3 },
  playlistCount: { fontSize: 12, color: '#6B7280' },
  addCard: {
    width: CARD_WIDTH, height: CARD_WIDTH, borderRadius: 20,
    alignItems: 'center', justifyContent: 'center',
    overflow: 'hidden', borderWidth: 2,
    borderColor: 'rgba(167,139,250,0.3)',
    borderStyle: 'dashed', gap: 4,
  },
  addCardText: { fontSize: 13, color: '#A78BFA', fontWeight: '600' },
  emptyWrap: { flex: 1, paddingTop: 40 },
  emptyCard: { padding: 40, borderRadius: 28, overflow: 'hidden', alignItems: 'center', borderWidth: 1.5, borderColor: 'rgba(167,139,250,0.15)' },
  emptyEmoji: { fontSize: 56, marginBottom: 16 },
  emptyTitle: { fontSize: 20, fontWeight: '800', color: '#1E1B4B', marginBottom: 8 },
  emptySub: { fontSize: 14, color: '#6B7280', textAlign: 'center', lineHeight: 22, marginBottom: 24 },
  createFirstBtn: { paddingHorizontal: 28, paddingVertical: 13, borderRadius: 30, overflow: 'hidden' },
  createFirstText: { fontSize: 14, fontWeight: '700', color: '#FFFFFF' },
  modalOverlay: { position: 'absolute', inset: 0, backgroundColor: 'rgba(30,27,75,0.5)', justifyContent: 'flex-end' },
  modalCard: { borderTopLeftRadius: 32, borderTopRightRadius: 32, overflow: 'hidden', padding: 24, paddingBottom: 48 },
  modalPreview: { alignItems: 'center', marginBottom: 20 },
  previewArt: { width: 100, height: 100, borderRadius: 22, alignItems: 'center', justifyContent: 'center', borderWidth: 2, borderColor: 'rgba(255,255,255,0.9)' },
  previewEmoji: { fontSize: 44 },
  modalTitle: { fontSize: 22, fontWeight: '900', color: '#1E1B4B', textAlign: 'center', marginBottom: 20 },
  inputWrap: { borderRadius: 16, overflow: 'hidden', borderWidth: 1.5, borderColor: 'rgba(167,139,250,0.2)', marginBottom: 20 },
  input: { padding: 16, fontSize: 16, color: '#1E1B4B', fontWeight: '500' },
  pickerLabel: { fontSize: 13, fontWeight: '700', color: '#6B7280', marginBottom: 10, letterSpacing: 1, textTransform: 'uppercase' },
  emojiPicker: { gap: 8, marginBottom: 20, paddingBottom: 4 },
  emojiBtn: { width: 44, height: 44, borderRadius: 12, alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(167,139,250,0.1)', borderWidth: 1.5, borderColor: 'transparent' },
  emojiBtnActive: { borderColor: '#A78BFA', backgroundColor: 'rgba(167,139,250,0.2)' },
  emojiText: { fontSize: 22 },
  colorPicker: { gap: 8, marginBottom: 24, paddingBottom: 4 },
  colorBtn: { borderRadius: 14, padding: 3, borderWidth: 2, borderColor: 'transparent' },
  colorBtnActive: { borderColor: '#1E1B4B' },
  colorSwatch: { width: 40, height: 40, borderRadius: 11 },
  modalActions: { flexDirection: 'row', gap: 12 },
  cancelBtn: { flex: 1, padding: 16, borderRadius: 16, alignItems: 'center', backgroundColor: 'rgba(167,139,250,0.1)', borderWidth: 1.5, borderColor: 'rgba(167,139,250,0.2)' },
  cancelText: { fontSize: 15, fontWeight: '700', color: '#6B7280' },
  saveBtn: { flex: 1, padding: 16, borderRadius: 16, alignItems: 'center', overflow: 'hidden' },
  saveBtnDisabled: { opacity: 0.5 },
  saveText: { fontSize: 15, fontWeight: '700', color: '#FFFFFF' },
});

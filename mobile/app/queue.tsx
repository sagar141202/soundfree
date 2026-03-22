import {
  View, Text, StyleSheet, TouchableOpacity,
  Image, ScrollView, Animated, Dimensions
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { StatusBar } from 'expo-status-bar';
import { useRef, useEffect, useState } from 'react';
import { router } from 'expo-router';
import { usePlayerStore } from '../stores/playerStore';
import { usePlayTrack } from '../hooks/usePlayTrack';
import { Ionicons } from '@expo/vector-icons';
import EmptyState from '../components/EmptyState';
import type { Track } from '../components/TrackListItem';

const { width, height } = Dimensions.get('window');

const THUMB_COLORS = [
  ['#C4B5FD','#A78BFA'], ['#7DD3FC','#93C5FD'],
  ['#86EFAC','#6EE7B7'], ['#FDE68A','#FCA5A5'],
  ['#FBCFE8','#F9A8D4'],
];

function formatDuration(ms: number | null): string {
  if (!ms) return '';
  const s = Math.floor(ms / 1000);
  return `${Math.floor(s / 60)}:${(s % 60).toString().padStart(2, '0')}`;
}

function QueueTrackRow({
  track, index, isCurrent, onPress, onRemove, onMoveUp, onMoveDown,
  isFirst, isLast, editMode,
}: {
  track: Track; index: number; isCurrent?: boolean;
  onPress: () => void; onRemove: () => void;
  onMoveUp: () => void; onMoveDown: () => void;
  isFirst: boolean; isLast: boolean; editMode: boolean;
}) {
  const slideAnim = useRef(new Animated.Value(0)).current;
  const colorIndex = track.video_id.charCodeAt(0) % THUMB_COLORS.length;

  return (
    <Animated.View style={[styles.trackRowWrap, { transform: [{ translateX: slideAnim }] }]}>
      <TouchableOpacity
        style={[styles.trackRow, isCurrent && styles.trackRowCurrent]}
        onPress={onPress}
        activeOpacity={0.8}
      >
        {isCurrent && (
          <LinearGradient
            colors={['rgba(167,139,250,0.2)', 'rgba(125,211,252,0.1)']}
            style={StyleSheet.absoluteFillObject}
            start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
          />
        )}
        {isCurrent && <View style={styles.currentBar} />}

        {/* Index / now playing indicator */}
        <View style={styles.indexWrap}>
          {isCurrent ? (
            <View style={styles.nowPlayingDots}>
              <View style={[styles.dot, styles.dotActive]} />
              <View style={[styles.dot, styles.dotActive, { height: 14 }]} />
              <View style={[styles.dot, styles.dotActive, { height: 10 }]} />
            </View>
          ) : (
            <Text style={styles.indexText}>{index + 1}</Text>
          )}
        </View>

        {/* Thumbnail */}
        <View style={styles.thumbWrap}>
          {track.thumbnail_url ? (
            <Image source={{ uri: track.thumbnail_url }} style={styles.thumb} resizeMode="cover" />
          ) : (
            <LinearGradient colors={THUMB_COLORS[colorIndex] as [string,string]} style={styles.thumb}>
              <Text style={{ fontSize: 16 }}>🎵</Text>
            </LinearGradient>
          )}
        </View>

        {/* Info */}
        <View style={styles.trackInfo}>
          <Text style={[styles.trackTitle, isCurrent && styles.trackTitleCurrent]} numberOfLines={1}>
            {track.title}
          </Text>
          <Text style={styles.trackArtist} numberOfLines={1}>{track.artist}</Text>
        </View>

        <Text style={styles.duration}>{formatDuration(track.duration_ms)}</Text>

        {/* Edit mode controls */}
        {editMode ? (
          <View style={styles.editControls}>
            <TouchableOpacity
              style={[styles.reorderBtn, isFirst && styles.reorderBtnDisabled]}
              onPress={onMoveUp}
            >
              <Ionicons name="chevron-up" size={16} color={isFirst ? '#E5E7EB' : '#A78BFA'} />
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.reorderBtn, isLast && styles.reorderBtnDisabled]}
              onPress={onMoveDown}
            >
              <Ionicons name="chevron-down" size={16} color={isLast ? '#E5E7EB' : '#A78BFA'} />
            </TouchableOpacity>
            <TouchableOpacity style={styles.removeBtn} onPress={onRemove}>
              <Ionicons name="close" size={16} color="#FCA5A5" />
            </TouchableOpacity>
          </View>
        ) : (
          <TouchableOpacity style={styles.removeBtn} onPress={onRemove}>
            <Ionicons name="close" size={16} color="#D1D5DB" />
          </TouchableOpacity>
        )}
      </TouchableOpacity>
    </Animated.View>
  );
}

export default function QueueScreen() {
  const queue = usePlayerStore(s => s.queue);
  const currentIndex = usePlayerStore(s => s.currentIndex);
  const currentTrack = usePlayerStore(s => s.currentTrack);
  const setQueue = usePlayerStore(s => s.setQueue);
  const isShuffled = usePlayerStore(s => s.isShuffled);
  const toggleShuffle = usePlayerStore(s => s.toggleShuffle);
  const repeatMode = usePlayerStore(s => s.repeatMode);
  const toggleRepeat = usePlayerStore(s => s.toggleRepeat);
  const radioMode = usePlayerStore(s => s.radioMode);
  const toggleRadio = usePlayerStore(s => s.toggleRadio);
  const { playTrack } = usePlayTrack();
  const [editMode, setEditMode] = useState(false);
  const slideAnim = useRef(new Animated.Value(height)).current;
  const opacityAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.spring(slideAnim, { toValue: 0, useNativeDriver: true, tension: 70, friction: 12 }),
      Animated.timing(opacityAnim, { toValue: 1, duration: 300, useNativeDriver: true }),
    ]).start();
  }, []);

  const upcomingTracks = queue.slice(currentIndex + 1);
  const playedTracks = queue.slice(0, currentIndex);

  const removeTrack = (idx: number) => {
    const newQueue = queue.filter((_, i) => i !== idx);
    setQueue(newQueue, idx < currentIndex ? currentIndex - 1 : currentIndex);
  };

  const moveUp = (idx: number) => {
    if (idx <= 0) return;
    const newQueue = [...queue];
    [newQueue[idx - 1], newQueue[idx]] = [newQueue[idx], newQueue[idx - 1]];
    setQueue(newQueue, idx - 1 === currentIndex ? currentIndex + 1 : idx === currentIndex ? currentIndex - 1 : currentIndex);
  };

  const moveDown = (idx: number) => {
    if (idx >= queue.length - 1) return;
    const newQueue = [...queue];
    [newQueue[idx], newQueue[idx + 1]] = [newQueue[idx + 1], newQueue[idx]];
    setQueue(newQueue, idx + 1 === currentIndex ? currentIndex - 1 : idx === currentIndex ? currentIndex + 1 : currentIndex);
  };

  const clearQueue = () => {
    if (currentTrack) {
      setQueue([currentTrack], 0);
    }
  };

  return (
    <Animated.View style={[styles.container, { transform: [{ translateY: slideAnim }] }]}>
      <StatusBar style="dark" />
      <LinearGradient colors={['#FAFBFF', '#F0F4FF', '#F8FAFF']} style={StyleSheet.absoluteFillObject} />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
          <LinearGradient colors={['rgba(167,139,250,0.2)', 'rgba(167,139,250,0.1)']} style={StyleSheet.absoluteFillObject} />
          <Ionicons name="chevron-down" size={22} color="#7C3AED" />
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <Text style={styles.headerTitle}>Queue</Text>
          <Text style={styles.headerSub}>{queue.length} tracks</Text>
        </View>
        <TouchableOpacity
          style={[styles.editBtn, editMode && styles.editBtnActive]}
          onPress={() => setEditMode(!editMode)}
        >
          <LinearGradient
            colors={editMode ? ['#C4B5FD', '#A78BFA'] : ['rgba(167,139,250,0.15)', 'rgba(167,139,250,0.08)']}
            style={StyleSheet.absoluteFillObject}
          />
          <Ionicons name={editMode ? 'checkmark' : 'pencil'} size={18} color={editMode ? '#FFFFFF' : '#7C3AED'} />
        </TouchableOpacity>
      </View>

      {/* Action row */}
      <View style={styles.actionRow}>
        <TouchableOpacity
          style={[styles.actionChip, isShuffled && styles.actionChipActive]}
          onPress={toggleShuffle}
          accessibilityLabel={isShuffled ? "Shuffle on" : "Shuffle off"}
          accessibilityRole="button"
        >
          <LinearGradient
            colors={isShuffled ? ['#C4B5FD', '#A78BFA'] : ['rgba(167,139,250,0.1)', 'rgba(125,211,252,0.05)']}
            style={StyleSheet.absoluteFillObject}
          />
          <Ionicons name="shuffle" size={16} color={isShuffled ? '#FFFFFF' : '#7C3AED'} />
          <Text style={[styles.actionChipText, isShuffled && { color: '#FFFFFF' }]}>Shuffle</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.actionChip, repeatMode !== 'none' && styles.actionChipActive]}
          onPress={toggleRepeat}
        >
          <LinearGradient
            colors={repeatMode !== 'none' ? ['#C4B5FD', '#A78BFA'] : ['rgba(167,139,250,0.1)', 'rgba(125,211,252,0.05)']}
            style={StyleSheet.absoluteFillObject}
          />
          <Text style={{ fontSize: 14 }}>{repeatMode === 'one' ? '🔂' : '🔁'}</Text>
          <Text style={[styles.actionChipText, repeatMode !== 'none' && { color: '#FFFFFF' }]}>
            {repeatMode === 'none' ? 'Repeat' : repeatMode === 'one' ? 'Repeat 1' : 'Repeat All'}
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.actionChip, radioMode && styles.actionChipActive]}
          onPress={toggleRadio}
        >
          <LinearGradient
            colors={radioMode ? ['#C4B5FD', '#A78BFA'] : ['rgba(167,139,250,0.1)', 'rgba(125,211,252,0.05)']}
            style={StyleSheet.absoluteFillObject}
          />
          <Text style={{ fontSize: 14 }}>��</Text>
          <Text style={[styles.actionChipText, radioMode && { color: '#FFFFFF' }]}>Radio</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.actionChip} onPress={clearQueue} accessibilityLabel="Clear queue" accessibilityRole="button">
          <LinearGradient colors={['rgba(252,165,165,0.15)', 'rgba(248,113,113,0.08)']} style={StyleSheet.absoluteFillObject} />
          <Ionicons name="trash-outline" size={16} color="#EF4444" />
          <Text style={[styles.actionChipText, { color: '#EF4444' }]}>Clear</Text>
        </TouchableOpacity>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>
        {/* Now Playing */}
        {currentTrack && (
          <View style={styles.section}>
            <Text style={styles.sectionLabel}>NOW PLAYING</Text>
            <QueueTrackRow
              track={currentTrack}
              index={currentIndex}
              isCurrent
              editMode={false}
              isFirst={currentIndex === 0}
              isLast={currentIndex === queue.length - 1}
              onPress={() => router.push('/player')}
              onRemove={() => {}}
              onMoveUp={() => {}}
              onMoveDown={() => {}}
            />
          </View>
        )}

        {/* Upcoming */}
        {upcomingTracks.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionLabel}>UP NEXT — {upcomingTracks.length} TRACKS</Text>
            {upcomingTracks.map((track, i) => {
              const queueIdx = currentIndex + 1 + i;
              return (
                <QueueTrackRow
                  key={`${track.video_id}-${queueIdx}`}
                  track={track}
                  index={queueIdx}
                  isCurrent={false}
                  editMode={editMode}
                  isFirst={queueIdx === 0}
                  isLast={queueIdx === queue.length - 1}
                  onPress={() => playTrack(track, queue)}
                  onRemove={() => removeTrack(queueIdx)}
                  onMoveUp={() => moveUp(queueIdx)}
                  onMoveDown={() => moveDown(queueIdx)}
                />
              );
            })}
          </View>
        )}

        {/* Previously played */}
        {playedTracks.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionLabel}>PREVIOUSLY PLAYED</Text>
            {playedTracks.map((track, i) => (
              <QueueTrackRow
                key={`${track.video_id}-${i}`}
                track={track}
                index={i}
                isCurrent={false}
                editMode={false}
                isFirst={i === 0}
                isLast={i === playedTracks.length - 1}
                onPress={() => playTrack(track, queue)}
                onRemove={() => removeTrack(i)}
                onMoveUp={() => {}}
                onMoveDown={() => {}}
              />
            ))}
          </View>
        )}

        {queue.length === 0 && (
          <EmptyState
            emoji="📋"
            title="Queue is empty"
            subtitle="Play some music to see your queue here"
            actionLabel="Search Music"
            onAction={() => router.push('/(tabs)/search')}
          />
        )}

        <View style={{ height: 120 }} />
      </ScrollView>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FAFBFF' },
  header: { flexDirection: 'row', alignItems: 'center', paddingTop: 56, paddingHorizontal: 24, paddingBottom: 12 },
  backBtn: { width: 42, height: 42, borderRadius: 21, alignItems: 'center', justifyContent: 'center', overflow: 'hidden', borderWidth: 1.5, borderColor: 'rgba(167,139,250,0.3)' },
  headerCenter: { flex: 1, alignItems: 'center' },
  headerTitle: { fontSize: 18, fontWeight: '900', color: '#1E1B4B' },
  headerSub: { fontSize: 12, color: '#6B7280', marginTop: 2 },
  editBtn: { width: 42, height: 42, borderRadius: 21, alignItems: 'center', justifyContent: 'center', overflow: 'hidden', borderWidth: 1.5, borderColor: 'rgba(167,139,250,0.3)' },
  editBtnActive: { borderColor: '#A78BFA' },
  actionRow: { flexDirection: 'row', gap: 10, paddingHorizontal: 24, marginBottom: 16 },
  actionChip: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 16, paddingVertical: 10, borderRadius: 20, overflow: 'hidden', borderWidth: 1.5, borderColor: 'rgba(167,139,250,0.2)' },
  actionChipActive: { borderColor: '#A78BFA' },
  actionChipText: { fontSize: 13, fontWeight: '600', color: '#7C3AED' },
  scroll: { paddingHorizontal: 16 },
  section: { marginBottom: 20 },
  sectionLabel: { fontSize: 11, fontWeight: '800', color: '#9CA3AF', letterSpacing: 1.5, marginBottom: 8, paddingHorizontal: 4 },
  trackRowWrap: { marginBottom: 4 },
  trackRow: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 12, borderRadius: 18, backgroundColor: 'rgba(255,255,255,0.7)', borderWidth: 1.5, borderColor: 'rgba(255,255,255,0.9)', overflow: 'hidden' },
  trackRowCurrent: { borderColor: 'rgba(167,139,250,0.4)' },
  currentBar: { position: 'absolute', left: 0, top: 8, bottom: 8, width: 3, borderRadius: 2, backgroundColor: '#A78BFA' },
  indexWrap: { width: 28, alignItems: 'center' },
  indexText: { fontSize: 13, color: '#9CA3AF', fontWeight: '600' },
  nowPlayingDots: { flexDirection: 'row', alignItems: 'flex-end', gap: 2, height: 16 },
  dot: { width: 3, borderRadius: 2, backgroundColor: '#A78BFA', height: 8 },
  dotActive: { backgroundColor: '#7C3AED' },
  thumbWrap: { width: 46, height: 46, borderRadius: 10, overflow: 'hidden' },
  thumb: { width: 46, height: 46, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  trackInfo: { flex: 1 },
  trackTitle: { fontSize: 14, fontWeight: '700', color: '#1E1B4B', marginBottom: 2 },
  trackTitleCurrent: { color: '#7C3AED' },
  trackArtist: { fontSize: 12, color: '#6B7280' },
  duration: { fontSize: 12, color: '#9CA3AF', minWidth: 36, textAlign: 'right' },
  editControls: { flexDirection: 'row', gap: 4 },
  reorderBtn: { width: 28, height: 28, borderRadius: 8, alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(167,139,250,0.1)' },
  reorderBtnDisabled: { backgroundColor: 'rgba(229,231,235,0.3)' },
  removeBtn: { width: 36, height: 36, minWidth: 44, minHeight: 44, borderRadius: 8, alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(252,165,165,0.1)' },
  emptyWrap: { alignItems: 'center', paddingTop: 60 },
  emptyEmoji: { fontSize: 48, marginBottom: 16 },
  emptyTitle: { fontSize: 18, fontWeight: '800', color: '#1E1B4B', marginBottom: 8 },
  emptySub: { fontSize: 14, color: '#6B7280', textAlign: 'center' },
});

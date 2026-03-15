import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { StatusBar } from 'expo-status-bar';
import { router } from 'expo-router';
import { usePlayerStore } from '../stores/playerStore';
import LyricsView from '../components/LyricsView';

export default function LyricsScreen() {
  const currentTrack = usePlayerStore(s => s.currentTrack);

  if (!currentTrack) { router.back(); return null; }

  return (
    <View style={styles.container}>
      <StatusBar style="dark" />
      <LinearGradient colors={['#F8F0FF', '#FAFBFF', '#F0F4FF']} style={StyleSheet.absoluteFillObject} />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
          <LinearGradient colors={['rgba(167,139,250,0.2)', 'rgba(167,139,250,0.1)']} style={StyleSheet.absoluteFillObject} />
          <Text style={styles.backIcon}>↓</Text>
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <Text style={styles.headerLabel}>LYRICS</Text>
          <Text style={styles.headerTrack} numberOfLines={1}>{currentTrack.title}</Text>
        </View>
        <View style={{ width: 42 }} />
      </View>

      <LyricsView
        videoId={currentTrack.video_id}
        artist={currentTrack.artist}
        title={currentTrack.title}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: 'row', alignItems: 'center',
    paddingTop: 56, paddingHorizontal: 24, paddingBottom: 16,
  },
  backBtn: {
    width: 42, height: 42, borderRadius: 21,
    alignItems: 'center', justifyContent: 'center',
    overflow: 'hidden', borderWidth: 1.5,
    borderColor: 'rgba(167,139,250,0.3)',
  },
  backIcon: { fontSize: 20, color: '#7C3AED' },
  headerCenter: { flex: 1, alignItems: 'center' },
  headerLabel: { fontSize: 11, color: '#7C3AED', fontWeight: '800', letterSpacing: 2 },
  headerTrack: { fontSize: 13, color: '#6B7280', marginTop: 2, maxWidth: 200 },
});

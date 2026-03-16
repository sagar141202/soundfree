import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { StatusBar } from 'expo-status-bar';
import { router } from 'expo-router';
import { useLibraryStore } from '../../stores/libraryStore';
import { usePlaylistStore } from '../../stores/playlistStore';
import { getDownloadCount } from '../../services/localDb';
import { useEffect, useState } from 'react';
import { Ionicons } from '@expo/vector-icons';

const SETTINGS = [
  { name: 'Equalizer', value: 'Flat preset', emoji: '🎚️', colors: ['#FDE68A', '#FCD34D'] as [string,string], route: '/equalizer' },
  { name: 'Sleep Timer', value: 'Set a timer', emoji: '⏱️', colors: ['#86EFAC', '#6EE7B7'] as [string,string], route: '/sleep-timer' },
  { name: 'Last.fm', value: 'Connect account', emoji: '📊', colors: ['#FBCFE8', '#F9A8D4'] as [string,string], route: '/lastfm' },
  { name: 'Downloads', value: 'Offline library', emoji: '⬇️', colors: ['#93C5FD', '#7DD3FC'] as [string,string], route: '/downloads' },
  { name: 'Daily Mix', value: 'AI playlist', emoji: '🤖', colors: ['#C4B5FD', '#A78BFA'] as [string,string], route: '/daily-mix' },
  { name: 'Discord RPC', value: 'Rich Presence', emoji: '🎮', colors: ['#A5B4FC', '#818CF8'] as [string,string], route: '/discord' },
];

export default function ProfileScreen() {
  const likedTracks = useLibraryStore(s => s.likedTracks);
  const playlists = usePlaylistStore(s => s.playlists);
  const [downloadCount, setDownloadCount] = useState(0);

  useEffect(() => {
    getDownloadCount().then(setDownloadCount);
  }, []);

  return (
    <View style={styles.container}>
      <StatusBar style="dark" />
      <LinearGradient colors={['#FAFBFF', '#F0F4FF', '#F8FAFF']} style={StyleSheet.absoluteFillObject} />
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>

        {/* Header */}
        <View style={styles.header}>
          <View style={styles.avatarWrap}>
            <LinearGradient colors={['#A78BFA', '#7DD3FC', '#86EFAC']} style={StyleSheet.absoluteFillObject} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} />
            <Text style={styles.avatarText}>S</Text>
          </View>
          <Text style={styles.name}>Sagar</Text>
          <Text style={styles.sub}>Personal · SoundFree v1.0.0</Text>
          <View style={styles.proTag}>
            <LinearGradient colors={['#C4B5FD', '#93C5FD']} style={StyleSheet.absoluteFillObject} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} />
            <Text style={styles.proText}>✦ FREE FOREVER · NO ADS</Text>
          </View>
        </View>

        {/* Stats */}
        <View style={styles.statsRow}>
          {[
            { v: String(likedTracks.length), l: 'Liked', colors: ['#FBCFE8','#F9A8D4'] as [string,string], route: '/liked' },
            { v: String(downloadCount), l: 'Downloads', colors: ['#86EFAC','#6EE7B7'] as [string,string], route: '/downloads' },
            { v: String(playlists.length), l: 'Playlists', colors: ['#C4B5FD','#A78BFA'] as [string,string], route: '/playlists' },
          ].map((s, i) => (
            <TouchableOpacity key={i} style={styles.statCard} onPress={() => router.push(s.route as any)}>
              <LinearGradient colors={['rgba(255,255,255,0.9)','rgba(255,255,255,0.6)']} style={StyleSheet.absoluteFillObject} />
              <LinearGradient colors={s.colors} style={styles.statDot} />
              <Text style={styles.statVal}>{s.v}</Text>
              <Text style={styles.statLbl}>{s.l}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Settings */}
        <Text style={styles.section}>Settings ⚙️</Text>
        <View style={styles.settingsList}>
          {SETTINGS.map((s, i) => (
            <TouchableOpacity
              key={i}
              style={[styles.settingRow, i === SETTINGS.length - 1 && { borderBottomWidth: 0 }]}
              onPress={() => router.push(s.route as any)}
            >
              <LinearGradient colors={['rgba(255,255,255,0.9)', 'rgba(255,255,255,0.6)']} style={StyleSheet.absoluteFillObject} />
              <LinearGradient colors={s.colors} style={styles.settingIcon}>
                <Text style={{ fontSize: 18 }}>{s.emoji}</Text>
              </LinearGradient>
              <View style={styles.settingInfo}>
                <Text style={styles.settingName}>{s.name}</Text>
                <Text style={styles.settingValue}>{s.value}</Text>
              </View>
              <Ionicons name="chevron-forward" size={18} color="#C4B5FD" />
            </TouchableOpacity>
          ))}
        </View>

        {/* App info */}
        <View style={styles.appInfo}>
          <LinearGradient colors={['rgba(167,139,250,0.08)', 'rgba(125,211,252,0.04)']} style={StyleSheet.absoluteFillObject} />
          <Text style={styles.appInfoTitle}>SoundFree</Text>
          <Text style={styles.appInfoSub}>v1.0.0 · Self-hosted · Zero ads · Zero cost</Text>
          <Text style={styles.appInfoSub}>Built with ❤️ using FastAPI + Expo</Text>
        </View>

        <View style={{ height: 160 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FAFBFF' },
  scroll: { paddingBottom: 20 },
  header: { alignItems: 'center', paddingTop: 64, paddingBottom: 28, gap: 8 },
  avatarWrap: { width: 90, height: 90, borderRadius: 45, overflow: 'hidden', alignItems: 'center', justifyContent: 'center', borderWidth: 3, borderColor: 'rgba(255,255,255,0.9)', marginBottom: 4 },
  avatarText: { fontSize: 36, fontWeight: '900', color: '#FFFFFF' },
  name: { fontSize: 26, fontWeight: '900', color: '#1E1B4B', letterSpacing: -0.5 },
  sub: { fontSize: 13, color: '#6B7280' },
  proTag: { paddingHorizontal: 16, paddingVertical: 6, borderRadius: 20, overflow: 'hidden', marginTop: 4 },
  proText: { fontSize: 11, fontWeight: '800', color: '#FFFFFF', letterSpacing: 1.5 },
  statsRow: { flexDirection: 'row', paddingHorizontal: 24, gap: 12, marginBottom: 28 },
  statCard: { flex: 1, padding: 16, borderRadius: 20, overflow: 'hidden', alignItems: 'center', gap: 6, borderWidth: 1.5, borderColor: 'rgba(255,255,255,0.9)' },
  statDot: { width: 32, height: 4, borderRadius: 2 },
  statVal: { fontSize: 22, fontWeight: '900', color: '#1E1B4B' },
  statLbl: { fontSize: 11, color: '#6B7280', fontWeight: '600' },
  section: { fontSize: 18, fontWeight: '800', color: '#1E1B4B', paddingHorizontal: 24, marginBottom: 12 },
  settingsList: { marginHorizontal: 24, borderRadius: 20, overflow: 'hidden', borderWidth: 1.5, borderColor: 'rgba(255,255,255,0.9)', marginBottom: 24 },
  settingRow: { flexDirection: 'row', alignItems: 'center', padding: 16, gap: 14, overflow: 'hidden', borderBottomWidth: 1, borderBottomColor: 'rgba(167,139,250,0.1)' },
  settingIcon: { width: 42, height: 42, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  settingInfo: { flex: 1 },
  settingName: { fontSize: 15, fontWeight: '700', color: '#1E1B4B', marginBottom: 2 },
  settingValue: { fontSize: 12, color: '#6B7280' },
  appInfo: { marginHorizontal: 24, padding: 20, borderRadius: 20, overflow: 'hidden', alignItems: 'center', gap: 6, borderWidth: 1.5, borderColor: 'rgba(167,139,250,0.12)' },
  appInfoTitle: { fontSize: 16, fontWeight: '900', color: '#7C3AED' },
  appInfoSub: { fontSize: 12, color: '#9CA3AF', textAlign: 'center' },
});

import {
  View, Text, StyleSheet, ScrollView,
  TouchableOpacity, Dimensions
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { StatusBar } from 'expo-status-bar';
import { useState } from 'react';
import SearchBar from '../../components/SearchBar';

const { width } = Dimensions.get('window');

const CATEGORIES = [
  { name: 'Bollywood', emoji: '��', colors: ['#FCA5A5', '#F87171'] },
  { name: 'English Pop', emoji: '🎵', colors: ['#7DD3FC', '#93C5FD'] },
  { name: 'Lo-fi', emoji: '☕', colors: ['#C4B5FD', '#A78BFA'] },
  { name: 'Hip-Hop', emoji: '🎤', colors: ['#D8B4FE', '#C084FC'] },
  { name: 'Classical', emoji: '🎻', colors: ['#86EFAC', '#4ADE80'] },
  { name: 'Punjabi', emoji: '🥁', colors: ['#FDE68A', '#FCD34D'] },
  { name: 'Rock', emoji: '🎸', colors: ['#FCA5A5', '#FB923C'] },
  { name: 'Electronic', emoji: '🎛️', colors: ['#A5F3FC', '#7DD3FC'] },
  { name: 'K-Pop', emoji: '⭐', colors: ['#FBCFE8', '#F9A8D4'] },
  { name: 'Jazz', emoji: '🎷', colors: ['#FDE68A', '#FCA5A5'] },
];

export default function SearchScreen() {
  const [query, setQuery] = useState('');

  return (
    <View style={styles.container}>
      <StatusBar style="dark" />
      <LinearGradient
        colors={['#FAFBFF', '#F0F4FF', '#F8FAFF']}
        style={StyleSheet.absoluteFillObject}
      />

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scroll}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.header}>
          <Text style={styles.title}>Search</Text>
          <Text style={styles.sub}>Find any song, artist or album</Text>
        </View>

        <SearchBar
          value={query}
          onChangeText={setQuery}
          placeholder="Songs, artists, albums..."
        />

        {/* Empty state hint */}
        {query.length === 0 && (
          <>
            <Text style={styles.section}>Browse Categories</Text>
            <View style={styles.grid}>
              {CATEGORIES.map((cat, i) => (
                <TouchableOpacity key={i} style={styles.catCard}>
                  <LinearGradient
                    colors={cat.colors as [string, string]}
                    style={StyleSheet.absoluteFillObject}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                  />
                  <View style={styles.catOverlay} />
                  <Text style={styles.catEmoji}>{cat.emoji}</Text>
                  <Text style={styles.catName}>{cat.name}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </>
        )}

        {/* Search hint when typing */}
        {query.length > 0 && query.length < 2 && (
          <View style={styles.hintBox}>
            <Text style={styles.hintText}>Keep typing to search...</Text>
          </View>
        )}

        {/* Results placeholder — wired up in T-044 */}
        {query.length >= 2 && (
          <View style={styles.hintBox}>
            <Text style={styles.hintText}>🔍 Searching for "{query}"...</Text>
            <Text style={styles.hintSub}>Results coming in T-044</Text>
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FAFBFF' },
  scroll: { paddingBottom: 120 },
  header: { paddingTop: 64, paddingHorizontal: 24, marginBottom: 20 },
  title: { fontSize: 36, fontWeight: '900', color: '#1E1B4B', letterSpacing: -1 },
  sub: { fontSize: 14, color: '#6B7280', marginTop: 4 },
  section: {
    fontSize: 20, fontWeight: '800', color: '#1E1B4B',
    paddingHorizontal: 24, marginBottom: 16, marginTop: 8,
  },
  grid: { flexDirection: 'row', flexWrap: 'wrap', paddingHorizontal: 24, gap: 12 },
  catCard: {
    width: (width - 60) / 2, height: 95, borderRadius: 20,
    overflow: 'hidden', justifyContent: 'flex-end', padding: 14,
    borderWidth: 1.5, borderColor: 'rgba(255,255,255,0.9)',
  },
  catOverlay: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(255,255,255,0.1)' },
  catEmoji: { fontSize: 26, marginBottom: 4 },
  catName: { fontSize: 15, fontWeight: '800', color: '#1E1B4B' },
  hintBox: {
    marginHorizontal: 24, marginTop: 32,
    padding: 24, borderRadius: 20,
    backgroundColor: 'rgba(167,139,250,0.1)',
    borderWidth: 1.5, borderColor: 'rgba(167,139,250,0.2)',
    alignItems: 'center',
  },
  hintText: { fontSize: 16, color: '#7C3AED', fontWeight: '600', marginBottom: 4 },
  hintSub: { fontSize: 13, color: '#9CA3AF' },
});

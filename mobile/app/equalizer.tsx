import {
  View, Text, StyleSheet, TouchableOpacity,
  ScrollView, Animated, PanResponder, Dimensions
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { StatusBar } from 'expo-status-bar';
import { useRef, useEffect, useState } from 'react';
import { router } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Ionicons } from '@expo/vector-icons';

const { width } = Dimensions.get('window');

const BANDS = [
  { freq: '32Hz', label: '32' },
  { freq: '64Hz', label: '64' },
  { freq: '125Hz', label: '125' },
  { freq: '250Hz', label: '250' },
  { freq: '500Hz', label: '500' },
  { freq: '1kHz', label: '1k' },
  { freq: '2kHz', label: '2k' },
  { freq: '4kHz', label: '4k' },
  { freq: '8kHz', label: '8k' },
  { freq: '16kHz', label: '16k' },
];

const PRESETS: Record<string, number[]> = {
  Flat:       [0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
  Bass:       [6, 5, 4, 2, 0, 0, 0, 0, 0, 0],
  Treble:     [0, 0, 0, 0, 0, 2, 3, 4, 5, 6],
  Vocal:      [-2, -1, 0, 2, 4, 4, 3, 2, 1, 0],
  Classical:  [4, 3, 2, 0, -1, -1, 0, 2, 3, 4],
  Electronic: [5, 4, 1, 0, -2, 2, 1, 2, 4, 5],
  Rock:       [4, 3, 2, 0, -1, 0, 2, 3, 4, 4],
  Jazz:       [3, 2, 1, 2, -1, -1, 0, 1, 2, 3],
};

const SLIDER_HEIGHT = 180;
const DB_RANGE = 12; // ±12 dB

function dbToPosition(db: number): number {
  return SLIDER_HEIGHT * (1 - (db + DB_RANGE) / (DB_RANGE * 2));
}

function positionToDb(pos: number): number {
  const db = DB_RANGE - (pos / SLIDER_HEIGHT) * DB_RANGE * 2;
  return Math.round(Math.max(-DB_RANGE, Math.min(DB_RANGE, db)));
}

function EQSlider({
  band, value, onChange, accentColor,
}: {
  band: typeof BANDS[0]; value: number; onChange: (db: number) => void; accentColor: string;
}) {
  const positionY = useRef(new Animated.Value(dbToPosition(value))).current;
  const lastY = useRef(dbToPosition(value));
  const [currentDb, setCurrentDb] = useState(value);

  useEffect(() => {
    const newPos = dbToPosition(value);
    lastY.current = newPos;
    Animated.spring(positionY, { toValue: newPos, useNativeDriver: false, tension: 120, friction: 8 }).start();
    setCurrentDb(value);
  }, [value]);

  const panResponder = useRef(PanResponder.create({
    onStartShouldSetPanResponder: () => true,
    onMoveShouldSetPanResponder: () => true,
    onPanResponderGrant: () => {},
    onPanResponderMove: (_, gesture) => {
      const newPos = Math.max(0, Math.min(SLIDER_HEIGHT, lastY.current + gesture.dy));
      positionY.setValue(newPos);
      const db = positionToDb(newPos);
      setCurrentDb(db);
      onChange(db);
    },
    onPanResponderRelease: (_, gesture) => {
      const newPos = Math.max(0, Math.min(SLIDER_HEIGHT, lastY.current + gesture.dy));
      lastY.current = newPos;
      const db = positionToDb(newPos);
      onChange(db);
    },
  })).current;

  const isPositive = currentDb > 0;
  const isNegative = currentDb < 0;

  return (
    <View style={styles.sliderWrap}>
      {/* dB label */}
      <Text style={[styles.dbLabel, isPositive && { color: accentColor }, isNegative && { color: '#FCA5A5' }]}>
        {currentDb > 0 ? `+${currentDb}` : currentDb}
      </Text>

      {/* Track */}
      <View style={styles.sliderTrack}>
        {/* Center line */}
        <View style={styles.centerLine} />

        {/* Fill */}
        <Animated.View
          style={[
            styles.sliderFill,
            {
              position: 'absolute',
              left: '50%',
              marginLeft: -1.5,
              width: 3,
              backgroundColor: isPositive ? accentColor : isNegative ? '#FCA5A5' : '#E5E7EB',
              top: isPositive
                ? positionY
                : SLIDER_HEIGHT / 2,
              height: isPositive
                ? positionY.interpolate({ inputRange: [0, SLIDER_HEIGHT], outputRange: [SLIDER_HEIGHT / 2, 0] })
                : positionY.interpolate({ inputRange: [0, SLIDER_HEIGHT], outputRange: [0, SLIDER_HEIGHT / 2] }),
            },
          ]}
        />

        {/* Thumb */}
        <Animated.View
          style={[styles.thumb, { top: Animated.subtract(positionY, 10), backgroundColor: isNegative ? '#FCA5A5' : accentColor }]}
          {...panResponder.panHandlers}
        >
          <View style={styles.thumbInner} />
        </Animated.View>
      </View>

      {/* Freq label */}
      <Text style={styles.freqLabel}>{band.label}</Text>
    </View>
  );
}

export default function EqualizerScreen() {
  const [bands, setBands] = useState<number[]>(PRESETS.Flat);
  const [selectedPreset, setSelectedPreset] = useState('Flat');
  const [enabled, setEnabled] = useState(true);
  const slideAnim = useRef(new Animated.Value(60)).current;
  const opacityAnim = useRef(new Animated.Value(0)).current;

  const accentColor = '#A78BFA';

  useEffect(() => {
    Animated.parallel([
      Animated.spring(slideAnim, { toValue: 0, useNativeDriver: true, tension: 80, friction: 12 }),
      Animated.timing(opacityAnim, { toValue: 1, duration: 300, useNativeDriver: true }),
    ]).start();

    // Load saved settings
    AsyncStorage.getItem('eq_settings').then(saved => {
      if (saved) {
        const { bands: b, preset, enabled: en } = JSON.parse(saved);
        setBands(b || PRESETS.Flat);
        setSelectedPreset(preset || 'Flat');
        setEnabled(en !== false);
      }
    });
  }, []);

  const save = async (newBands: number[], preset: string, en: boolean) => {
    await AsyncStorage.setItem('eq_settings', JSON.stringify({
      bands: newBands, preset, enabled: en,
    }));
  };

  const applyPreset = (name: string) => {
    const newBands = PRESETS[name];
    setBands(newBands);
    setSelectedPreset(name);
    save(newBands, name, enabled);
  };

  const updateBand = (index: number, db: number) => {
    const newBands = [...bands];
    newBands[index] = db;
    setBands(newBands);
    setSelectedPreset('Custom');
    save(newBands, 'Custom', enabled);
  };

  const reset = () => applyPreset('Flat');

  const totalBoost = bands.reduce((sum, b) => sum + b, 0);

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
          <Text style={styles.headerTitle}>Equalizer</Text>
          <TouchableOpacity style={[styles.toggleBtn, enabled && styles.toggleBtnOn]} onPress={() => {
            const newEnabled = !enabled;
            setEnabled(newEnabled);
            save(bands, selectedPreset, newEnabled);
          }}>
            <LinearGradient
              colors={enabled ? ['#C4B5FD', '#A78BFA'] : ['rgba(167,139,250,0.1)', 'rgba(167,139,250,0.05)']}
              style={StyleSheet.absoluteFillObject}
            />
            <Text style={[styles.toggleText, enabled && { color: '#FFFFFF' }]}>
              {enabled ? 'ON' : 'OFF'}
            </Text>
          </TouchableOpacity>
        </View>

        <ScrollView showsVerticalScrollIndicator={false}>
          {/* Visualizer card */}
          <View style={styles.vizCard}>
            <LinearGradient colors={['rgba(167,139,250,0.12)', 'rgba(125,211,252,0.06)']} style={StyleSheet.absoluteFillObject} />
            <View style={styles.vizRow}>
              {bands.map((db, i) => {
                const barHeight = Math.abs(db) * 4 + 4;
                const isPos = db >= 0;
                return (
                  <View key={i} style={styles.vizBarWrap}>
                    <LinearGradient
                      colors={isPos ? [accentColor, accentColor + '60'] : ['#FCA5A5', '#FCA5A560']}
                      style={[styles.vizBar, { height: barHeight }]}
                    />
                  </View>
                );
              })}
            </View>
            <Text style={styles.vizLabel}>
              {selectedPreset} · {totalBoost >= 0 ? '+' : ''}{totalBoost} dB total
            </Text>
          </View>

          {/* Sliders */}
          <View style={[styles.slidersCard, !enabled && styles.slidersDisabled]}>
            <LinearGradient colors={['rgba(255,255,255,0.9)', 'rgba(255,255,255,0.6)']} style={StyleSheet.absoluteFillObject} />
            {/* dB scale */}
            <View style={styles.dbScale}>
              {['+12', '+6', '0', '-6', '-12'].map(label => (
                <Text key={label} style={styles.dbScaleLabel}>{label}</Text>
              ))}
            </View>
            <View style={styles.sliders}>
              {BANDS.map((band, i) => (
                <EQSlider
                  key={band.freq}
                  band={band}
                  value={enabled ? bands[i] : 0}
                  accentColor={accentColor}
                  onChange={(db) => enabled && updateBand(i, db)}
                />
              ))}
            </View>
          </View>

          {/* Presets */}
          <View style={styles.presetsSection}>
            <View style={styles.presetsHeader}>
              <Text style={styles.presetsTitle}>Presets</Text>
              <TouchableOpacity style={styles.resetBtn} onPress={reset}>
                <LinearGradient colors={['rgba(167,139,250,0.1)', 'rgba(125,211,252,0.05)']} style={StyleSheet.absoluteFillObject} />
                <Ionicons name="refresh" size={14} color="#7C3AED" />
                <Text style={styles.resetText}>Reset</Text>
              </TouchableOpacity>
            </View>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.presetsScroll}>
              {Object.keys(PRESETS).map(name => (
                <TouchableOpacity
                  key={name}
                  style={[styles.presetChip, selectedPreset === name && styles.presetChipActive]}
                  onPress={() => applyPreset(name)}
                >
                  <LinearGradient
                    colors={selectedPreset === name ? ['#C4B5FD', '#A78BFA'] : ['rgba(167,139,250,0.08)', 'rgba(125,211,252,0.04)']}
                    style={StyleSheet.absoluteFillObject}
                  />
                  <Text style={[styles.presetText, selectedPreset === name && styles.presetTextActive]}>
                    {name}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>

          {/* Info */}
          <View style={styles.infoCard}>
            <LinearGradient colors={['rgba(167,139,250,0.08)', 'rgba(125,211,252,0.04)']} style={StyleSheet.absoluteFillObject} />
            <Ionicons name="information-circle-outline" size={16} color="#A78BFA" />
            <Text style={styles.infoText}>
              EQ settings are saved and applied on next playback. Drag sliders up (+dB) or down (-dB).
            </Text>
          </View>

          <View style={{ height: 120 }} />
        </ScrollView>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FAFBFF' },
  inner: { flex: 1 },
  header: { flexDirection: 'row', alignItems: 'center', paddingTop: 56, paddingHorizontal: 24, paddingBottom: 16 },
  backBtn: { width: 42, height: 42, borderRadius: 21, alignItems: 'center', justifyContent: 'center', overflow: 'hidden', borderWidth: 1.5, borderColor: 'rgba(167,139,250,0.3)' },
  headerTitle: { flex: 1, textAlign: 'center', fontSize: 18, fontWeight: '900', color: '#1E1B4B' },
  toggleBtn: { paddingHorizontal: 16, paddingVertical: 10, borderRadius: 20, overflow: 'hidden', borderWidth: 1.5, borderColor: 'rgba(167,139,250,0.3)' },
  toggleBtnOn: { borderColor: '#A78BFA' },
  toggleText: { fontSize: 12, fontWeight: '800', color: '#7C3AED', letterSpacing: 1 },
  vizCard: { marginHorizontal: 24, marginBottom: 16, padding: 20, borderRadius: 24, overflow: 'hidden', borderWidth: 1.5, borderColor: 'rgba(167,139,250,0.2)' },
  vizRow: { flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'space-between', height: 52, marginBottom: 8 },
  vizBarWrap: { flex: 1, alignItems: 'center', justifyContent: 'flex-end' },
  vizBar: { width: 6, borderRadius: 3, minHeight: 4 },
  vizLabel: { fontSize: 12, color: '#6B7280', textAlign: 'center', fontWeight: '600' },
  slidersCard: { marginHorizontal: 24, marginBottom: 16, padding: 16, borderRadius: 24, overflow: 'hidden', borderWidth: 1.5, borderColor: 'rgba(255,255,255,0.9)', flexDirection: 'row' },
  slidersDisabled: { opacity: 0.4 },
  dbScale: { width: 32, justifyContent: 'space-between', paddingVertical: 10, paddingTop: 0, marginTop: 16 },
  dbScaleLabel: { fontSize: 9, color: '#9CA3AF', fontWeight: '600', textAlign: 'right', paddingRight: 4 },
  sliders: { flex: 1, flexDirection: 'row', justifyContent: 'space-between' },
  sliderWrap: { alignItems: 'center', gap: 6 },
  dbLabel: { fontSize: 9, fontWeight: '700', color: '#9CA3AF', height: 14 },
  sliderTrack: { width: 24, height: SLIDER_HEIGHT, position: 'relative', alignItems: 'center' },
  centerLine: { position: 'absolute', left: '50%', marginLeft: -0.5, top: 0, bottom: 0, width: 1, backgroundColor: 'rgba(167,139,250,0.2)' },
  sliderFill: {},
  thumb: { position: 'absolute', left: '50%', marginLeft: -10, width: 20, height: 20, borderRadius: 10, alignItems: 'center', justifyContent: 'center', borderWidth: 2, borderColor: '#FFFFFF', elevation: 4, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.2, shadowRadius: 4 },
  thumbInner: { width: 6, height: 6, borderRadius: 3, backgroundColor: 'rgba(255,255,255,0.8)' },
  freqLabel: { fontSize: 9, color: '#6B7280', fontWeight: '600' },
  presetsSection: { paddingHorizontal: 24, marginBottom: 16 },
  presetsHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 },
  presetsTitle: { fontSize: 16, fontWeight: '800', color: '#1E1B4B' },
  resetBtn: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 12, paddingVertical: 6, borderRadius: 14, overflow: 'hidden', borderWidth: 1, borderColor: 'rgba(167,139,250,0.2)' },
  resetText: { fontSize: 12, color: '#7C3AED', fontWeight: '600' },
  presetsScroll: { gap: 8 },
  presetChip: { paddingHorizontal: 18, paddingVertical: 10, borderRadius: 20, overflow: 'hidden', borderWidth: 1.5, borderColor: 'rgba(167,139,250,0.2)' },
  presetChipActive: { borderColor: '#A78BFA' },
  presetText: { fontSize: 13, fontWeight: '600', color: '#6B7280' },
  presetTextActive: { color: '#FFFFFF' },
  infoCard: { marginHorizontal: 24, padding: 16, borderRadius: 20, overflow: 'hidden', flexDirection: 'row', gap: 10, alignItems: 'flex-start', borderWidth: 1, borderColor: 'rgba(167,139,250,0.15)' },
  infoText: { flex: 1, fontSize: 12, color: '#6B7280', lineHeight: 18 },
});

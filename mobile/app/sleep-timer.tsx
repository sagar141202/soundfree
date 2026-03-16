import {
  View, Text, StyleSheet, TouchableOpacity,
  Animated, Dimensions
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { StatusBar } from 'expo-status-bar';
import { useRef, useEffect, useState } from 'react';
import { router } from 'expo-router';
import {
  startSleepTimer, cancelSleepTimer,
  isSleepTimerActive, addSleepTimerListener,
  getSleepTimerRemaining,
} from '../services/sleepTimer';
import { Ionicons } from '@expo/vector-icons';

const { width } = Dimensions.get('window');

const DURATIONS = [
  { label: '5 min', ms: 5 * 60 * 1000 },
  { label: '10 min', ms: 10 * 60 * 1000 },
  { label: '15 min', ms: 15 * 60 * 1000 },
  { label: '20 min', ms: 20 * 60 * 1000 },
  { label: '30 min', ms: 30 * 60 * 1000 },
  { label: '45 min', ms: 45 * 60 * 1000 },
  { label: '1 hour', ms: 60 * 60 * 1000 },
  { label: '1.5 hrs', ms: 90 * 60 * 1000 },
  { label: '2 hours', ms: 120 * 60 * 1000 },
];

function formatTime(ms: number): string {
  const totalSec = Math.ceil(ms / 1000);
  const min = Math.floor(totalSec / 60);
  const sec = totalSec % 60;
  return `${min}:${sec.toString().padStart(2, '0')}`;
}

function formatDuration(ms: number): string {
  const min = Math.floor(ms / 60000);
  if (min < 60) return `${min} min`;
  return `${min / 60} hr${min / 60 > 1 ? 's' : ''}`;
}

export default function SleepTimerScreen() {
  const [active, setActive] = useState(isSleepTimerActive());
  const [remaining, setRemaining] = useState(getSleepTimerRemaining());
  const [selectedMs, setSelectedMs] = useState(30 * 60 * 1000);
  const slideAnim = useRef(new Animated.Value(60)).current;
  const opacityAnim = useRef(new Animated.Value(0)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.spring(slideAnim, { toValue: 0, useNativeDriver: true, tension: 80, friction: 12 }),
      Animated.timing(opacityAnim, { toValue: 1, duration: 300, useNativeDriver: true }),
    ]).start();

    const unsub = addSleepTimerListener((rem) => {
      setRemaining(rem);
      setActive(rem > 0);
    });

    return unsub;
  }, []);

  useEffect(() => {
    if (active) {
      Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, { toValue: 1.08, duration: 1500, useNativeDriver: true }),
          Animated.timing(pulseAnim, { toValue: 1, duration: 1500, useNativeDriver: true }),
        ])
      ).start();
    } else {
      pulseAnim.stopAnimation();
      pulseAnim.setValue(1);
    }
  }, [active]);

  const handleStart = () => {
    startSleepTimer(selectedMs);
    setActive(true);
    setRemaining(selectedMs);
  };

  const handleCancel = () => {
    cancelSleepTimer();
    setActive(false);
    setRemaining(0);
  };

  const progress = active && remaining > 0 ? remaining / selectedMs : 0;

  return (
    <View style={styles.container}>
      <StatusBar style="dark" />
      <LinearGradient colors={['#F0F9FF', '#FAFBFF', '#F0F4FF']} style={StyleSheet.absoluteFillObject} />

      <Animated.View style={[styles.inner, { transform: [{ translateY: slideAnim }], opacity: opacityAnim }]}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
            <LinearGradient colors={['rgba(125,211,252,0.3)', 'rgba(147,197,253,0.2)']} style={StyleSheet.absoluteFillObject} />
            <Ionicons name="chevron-back" size={22} color="#2563EB" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Sleep Timer</Text>
          <View style={{ width: 42 }} />
        </View>

        {/* Timer display */}
        <View style={styles.timerSection}>
          <Animated.View style={[styles.timerRing, { transform: [{ scale: pulseAnim }] }]}>
            <LinearGradient
              colors={active ? ['#7DD3FC', '#93C5FD', '#60A5FA'] : ['rgba(167,139,250,0.15)', 'rgba(125,211,252,0.1)']}
              style={StyleSheet.absoluteFillObject}
              start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
            />
            {/* Progress ring */}
            {active && (
              <View style={styles.progressRing}>
                <LinearGradient
                  colors={['#7DD3FC', '#60A5FA']}
                  style={[styles.progressFill, { width: `${progress * 100}%` }]}
                  start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
                />
              </View>
            )}
            <Text style={styles.timerEmoji}>{active ? '😴' : '⏱️'}</Text>
            <Text style={[styles.timerText, active && { color: '#1D4ED8' }]}>
              {active ? formatTime(remaining) : formatDuration(selectedMs)}
            </Text>
            <Text style={styles.timerSub}>
              {active ? 'until sleep' : 'duration'}
            </Text>
          </Animated.View>
        </View>

        {/* Duration picker */}
        {!active && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Choose Duration</Text>
            <View style={styles.durationGrid}>
              {DURATIONS.map((d) => (
                <TouchableOpacity
                  key={d.ms}
                  style={[styles.durationChip, selectedMs === d.ms && styles.durationChipActive]}
                  onPress={() => setSelectedMs(d.ms)}
                >
                  <LinearGradient
                    colors={selectedMs === d.ms ? ['#7DD3FC', '#93C5FD'] : ['rgba(255,255,255,0.8)', 'rgba(255,255,255,0.5)']}
                    style={StyleSheet.absoluteFillObject}
                  />
                  <Text style={[styles.durationText, selectedMs === d.ms && styles.durationTextActive]}>
                    {d.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        )}

        {/* Active timer info */}
        {active && (
          <View style={styles.activeInfo}>
            <LinearGradient colors={['rgba(125,211,252,0.15)', 'rgba(147,197,253,0.08)']} style={StyleSheet.absoluteFillObject} />
            <Ionicons name="moon" size={20} color="#2563EB" />
            <View style={styles.activeInfoText}>
              <Text style={styles.activeInfoTitle}>Sleep timer is running</Text>
              <Text style={styles.activeInfoSub}>Music will fade out in {formatTime(remaining)}</Text>
            </View>
          </View>
        )}

        {/* Action button */}
        <View style={styles.actionWrap}>
          {active ? (
            <TouchableOpacity style={styles.cancelBtn} onPress={handleCancel}>
              <LinearGradient colors={['rgba(252,165,165,0.2)', 'rgba(248,113,113,0.1)']} style={StyleSheet.absoluteFillObject} />
              <Ionicons name="close-circle" size={20} color="#EF4444" />
              <Text style={styles.cancelBtnText}>Cancel Timer</Text>
            </TouchableOpacity>
          ) : (
            <TouchableOpacity style={styles.startBtn} onPress={handleStart}>
              <LinearGradient colors={['#7DD3FC', '#60A5FA']} style={StyleSheet.absoluteFillObject} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} />
              <Ionicons name="moon" size={20} color="#FFFFFF" />
              <Text style={styles.startBtnText}>Start Sleep Timer</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Info */}
        <View style={styles.infoCard}>
          <LinearGradient colors={['rgba(125,211,252,0.08)', 'rgba(147,197,253,0.04)']} style={StyleSheet.absoluteFillObject} />
          <Ionicons name="information-circle-outline" size={16} color="#60A5FA" />
          <Text style={styles.infoText}>
            Audio will gradually fade out over 3 seconds before stopping.
          </Text>
        </View>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FAFBFF' },
  inner: { flex: 1, paddingBottom: 40 },
  header: { flexDirection: 'row', alignItems: 'center', paddingTop: 56, paddingHorizontal: 24, paddingBottom: 8 },
  backBtn: { width: 42, height: 42, borderRadius: 21, alignItems: 'center', justifyContent: 'center', overflow: 'hidden', borderWidth: 1.5, borderColor: 'rgba(125,211,252,0.4)' },
  headerTitle: { flex: 1, textAlign: 'center', fontSize: 18, fontWeight: '900', color: '#1E1B4B' },
  timerSection: { alignItems: 'center', paddingVertical: 32 },
  timerRing: {
    width: 180, height: 180, borderRadius: 90,
    alignItems: 'center', justifyContent: 'center',
    overflow: 'hidden', borderWidth: 3,
    borderColor: 'rgba(125,211,252,0.4)',
    gap: 4,
  },
  progressRing: {
    position: 'absolute', bottom: 0, left: 0, right: 0,
    height: 4, backgroundColor: 'rgba(255,255,255,0.3)',
  },
  progressFill: { height: 4, borderRadius: 2 },
  timerEmoji: { fontSize: 40 },
  timerText: { fontSize: 32, fontWeight: '900', color: '#1E1B4B', letterSpacing: -1 },
  timerSub: { fontSize: 12, color: '#6B7280', fontWeight: '500' },
  section: { paddingHorizontal: 24, marginBottom: 24 },
  sectionTitle: { fontSize: 16, fontWeight: '800', color: '#1E1B4B', marginBottom: 14 },
  durationGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  durationChip: {
    paddingHorizontal: 18, paddingVertical: 12,
    borderRadius: 20, overflow: 'hidden',
    borderWidth: 1.5, borderColor: 'rgba(125,211,252,0.25)',
  },
  durationChipActive: { borderColor: '#60A5FA' },
  durationText: { fontSize: 13, fontWeight: '600', color: '#6B7280' },
  durationTextActive: { color: '#1D4ED8', fontWeight: '700' },
  activeInfo: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    marginHorizontal: 24, marginBottom: 24, padding: 16,
    borderRadius: 20, overflow: 'hidden',
    borderWidth: 1.5, borderColor: 'rgba(125,211,252,0.3)',
  },
  activeInfoText: { flex: 1 },
  activeInfoTitle: { fontSize: 15, fontWeight: '700', color: '#1E1B4B', marginBottom: 2 },
  activeInfoSub: { fontSize: 13, color: '#6B7280' },
  actionWrap: { paddingHorizontal: 24, marginBottom: 20 },
  startBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 10, paddingVertical: 16, borderRadius: 30, overflow: 'hidden',
  },
  startBtnText: { fontSize: 16, fontWeight: '700', color: '#FFFFFF' },
  cancelBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 10, paddingVertical: 16, borderRadius: 30, overflow: 'hidden',
    borderWidth: 1.5, borderColor: 'rgba(252,165,165,0.4)',
  },
  cancelBtnText: { fontSize: 16, fontWeight: '700', color: '#EF4444' },
  infoCard: {
    flexDirection: 'row', alignItems: 'flex-start', gap: 10,
    marginHorizontal: 24, padding: 14, borderRadius: 16,
    overflow: 'hidden', borderWidth: 1,
    borderColor: 'rgba(125,211,252,0.15)',
  },
  infoText: { flex: 1, fontSize: 12, color: '#6B7280', lineHeight: 18 },
});

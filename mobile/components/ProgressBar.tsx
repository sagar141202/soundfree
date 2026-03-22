import { View, Text, StyleSheet, PanResponder, Animated, Dimensions } from 'react-native';
import { useRef, useState } from 'react';
import { LinearGradient } from 'expo-linear-gradient';

const { width } = Dimensions.get('window');
const PADDING = 28;
const BAR_WIDTH = width - PADDING * 2;

interface ProgressBarProps {
  position: number;
  duration: number;
  onSeek?: (positionMs: number) => void;
  accentColors?: [string, string];
}

function formatTime(ms: number): string {
  if (!ms || ms < 0) return '0:00';
  const totalSec = Math.floor(ms / 1000);
  return `${Math.floor(totalSec / 60)}:${(totalSec % 60).toString().padStart(2, '0')}`;
}

export default function ProgressBar({ position, duration, onSeek, accentColors = ['#C4B5FD', '#A78BFA'] }: ProgressBarProps) {
  const [isScrubbing, setIsScrubbing] = useState(false);
  const [scrubProgress, setScrubProgress] = useState(0);
  const barX = useRef(0);
  const thumbScale = useRef(new Animated.Value(1)).current;
  const tooltipOpacity = useRef(new Animated.Value(0)).current;

  const clampedProgress = Math.min(Math.max(isScrubbing ? scrubProgress : (duration > 0 ? position / duration : 0), 0), 1);
  const displayPosition = isScrubbing ? scrubProgress * duration : position;
  const remaining = Math.max(0, duration - displayPosition);

  function getProgressFromPageX(pageX: number): number {
    return Math.min(Math.max((pageX - barX.current) / BAR_WIDTH, 0), 1);
  }

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => true,
      onPanResponderGrant: (evt) => {
        setIsScrubbing(true);
        setScrubProgress(getProgressFromPageX(evt.nativeEvent.pageX));
        Animated.parallel([
          Animated.spring(thumbScale, { toValue: 1.5, useNativeDriver: true, tension: 200 }),
          Animated.timing(tooltipOpacity, { toValue: 1, duration: 150, useNativeDriver: true }),
        ]).start();
      },
      onPanResponderMove: (evt) => setScrubProgress(getProgressFromPageX(evt.nativeEvent.pageX)),
      onPanResponderRelease: (evt) => {
        const p = getProgressFromPageX(evt.nativeEvent.pageX);
        setScrubProgress(p);
        setIsScrubbing(false);
        onSeek?.(p * duration);
        Animated.parallel([
          Animated.spring(thumbScale, { toValue: 1, useNativeDriver: true, tension: 200 }),
          Animated.timing(tooltipOpacity, { toValue: 0, duration: 150, useNativeDriver: true }),
        ]).start();
      },
    })
  ).current;

  return (
    <View style={styles.container}>
      <Animated.View style={[styles.tooltip, { opacity: tooltipOpacity, left: clampedProgress * BAR_WIDTH - 24 }]}>
        <LinearGradient colors={accentColors} style={styles.tooltipGrad}>
          <Text style={styles.tooltipText}>{formatTime(displayPosition)}</Text>
        </LinearGradient>
      </Animated.View>
      <View
        style={styles.barHitArea}
        onLayout={(e) => { barX.current = e.nativeEvent.layout.x + PADDING; }}
        {...panResponder.panHandlers}
      >
        <View style={styles.barBg}>
          <LinearGradient colors={accentColors} style={[styles.barFill, { width: `${clampedProgress * 100}%` }]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} />
          <Animated.View style={[styles.thumb, { left: `${clampedProgress * 100}%`, transform: [{ scale: thumbScale }], backgroundColor: accentColors[1] }]} />
        </View>
      </View>
      <View style={styles.timeRow}>
        <Text style={styles.timeText}>{formatTime(displayPosition)}</Text>
        <Text style={styles.timeText}>-{formatTime(remaining)}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { paddingHorizontal: PADDING, marginBottom: 20 },
  tooltip: { position: 'absolute', top: -36, zIndex: 10, alignItems: 'center' },
  tooltipGrad: { paddingHorizontal: 10, paddingVertical: 5, borderRadius: 8 },
  tooltipText: { fontSize: 12, color: '#FFFFFF', fontWeight: '700' },
  barHitArea: { paddingVertical: 18, minHeight: 44 },
  barBg: { height: 5, backgroundColor: 'rgba(167,139,250,0.2)', borderRadius: 3, position: 'relative' },
  barFill: { height: 5, borderRadius: 3 },
  thumb: { position: 'absolute', top: -5, width: 20, height: 20, borderRadius: 10, marginLeft: -10, borderWidth: 2, borderColor: '#FFFFFF', elevation: 4 },
  timeRow: { flexDirection: 'row', justifyContent: 'space-between', marginTop: -4 },
  timeText: { fontSize: 12, color: '#9CA3AF', fontWeight: '500' },
});

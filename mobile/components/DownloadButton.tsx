import { TouchableOpacity, View, StyleSheet, Animated } from 'react-native';
import { useRef, useEffect } from 'react';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useDownloadState } from '../hooks/useDownload';
import type { Track } from './TrackListItem';

interface DownloadButtonProps {
  track: Track;
  size?: number;
}

export default function DownloadButton({ track, size = 28 }: DownloadButtonProps) {
  const { status, progress, download, remove } = useDownloadState(track.video_id);
  const progressAnim = useRef(new Animated.Value(0)).current;
  const spinAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(progressAnim, {
      toValue: progress,
      duration: 300,
      useNativeDriver: false,
    }).start();
  }, [progress]);

  useEffect(() => {
    if (status === 'downloading') {
      Animated.loop(
        Animated.timing(spinAnim, {
          toValue: 1,
          duration: 1500,
          useNativeDriver: true,
        })
      ).start();
    } else {
      spinAnim.stopAnimation();
      spinAnim.setValue(0);
    }
  }, [status]);

  const handlePress = () => {
    if (status === 'idle' || status === 'error') {
      download(track);
    } else if (status === 'done') {
      remove();
    }
  };

  const spin = spinAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  const circumference = 2 * Math.PI * 12;
  const strokeDashoffset = progressAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [circumference, 0],
  });

  if (status === 'downloading') {
    return (
      <TouchableOpacity style={styles.btn} onPress={handlePress}>
        <Animated.View style={{ transform: [{ rotate: spin }] }}>
          <Ionicons name="ellipsis-horizontal-circle-outline" size={size} color="#A78BFA" />
        </Animated.View>
      </TouchableOpacity>
    );
  }

  if (status === 'done') {
    return (
      <TouchableOpacity style={styles.btn} onPress={handlePress}>
        <LinearGradient colors={['#86EFAC', '#6EE7B7']} style={[styles.doneBg, { width: size, height: size, borderRadius: size / 2 }]}>
          <Ionicons name="checkmark" size={size * 0.6} color="#FFFFFF" />
        </LinearGradient>
      </TouchableOpacity>
    );
  }

  if (status === 'error') {
    return (
      <TouchableOpacity style={styles.btn} onPress={handlePress}>
        <Ionicons name="cloud-download-outline" size={size} color="#FCA5A5" />
      </TouchableOpacity>
    );
  }

  // idle
  return (
    <TouchableOpacity style={styles.btn} onPress={handlePress}>
      <Ionicons name="cloud-download-outline" size={size} color="#C4B5FD" />
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  btn: { padding: 4, minWidth: 44, minHeight: 44, alignItems: 'center', justifyContent: 'center' },
  doneBg: { alignItems: 'center', justifyContent: 'center' },
});

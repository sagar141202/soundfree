import { TouchableOpacity, Animated, StyleSheet } from 'react-native';
import { useRef, useEffect } from 'react';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';

interface PlayPauseButtonProps {
  isPlaying: boolean;
  onPress: () => void;
  size?: number;
  colors: [string, string];
}

export default function PlayPauseButton({
  isPlaying, onPress, size = 72, colors,
}: PlayPauseButtonProps) {
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const rotateAnim = useRef(new Animated.Value(0)).current;
  const iconOpacity = useRef(new Animated.Value(1)).current;
  const prevPlaying = useRef(isPlaying);

  useEffect(() => {
    if (prevPlaying.current === isPlaying) return;
    prevPlaying.current = isPlaying;

    // Morph animation sequence
    Animated.sequence([
      // Shrink + rotate slightly
      Animated.parallel([
        Animated.spring(scaleAnim, {
          toValue: 0.82,
          useNativeDriver: true,
          tension: 300,
          friction: 8,
        }),
        Animated.timing(iconOpacity, {
          toValue: 0,
          duration: 80,
          useNativeDriver: true,
        }),
        Animated.timing(rotateAnim, {
          toValue: isPlaying ? 1 : -1,
          duration: 100,
          useNativeDriver: true,
        }),
      ]),
      // Spring back with new icon
      Animated.parallel([
        Animated.spring(scaleAnim, {
          toValue: 1,
          useNativeDriver: true,
          tension: 200,
          friction: 6,
        }),
        Animated.timing(iconOpacity, {
          toValue: 1,
          duration: 120,
          useNativeDriver: true,
        }),
        Animated.spring(rotateAnim, {
          toValue: 0,
          useNativeDriver: true,
          tension: 200,
          friction: 8,
        }),
      ]),
    ]).start();
  }, [isPlaying]);

  const handlePress = () => {
    // Tap feedback
    Animated.sequence([
      Animated.spring(scaleAnim, {
        toValue: 0.9,
        useNativeDriver: true,
        tension: 400,
        friction: 6,
      }),
      Animated.spring(scaleAnim, {
        toValue: 1,
        useNativeDriver: true,
        tension: 200,
        friction: 7,
      }),
    ]).start();
    onPress();
  };

  const spin = rotateAnim.interpolate({
    inputRange: [-1, 0, 1],
    outputRange: ['-15deg', '0deg', '15deg'],
  });

  return (
    <TouchableOpacity onPress={handlePress} activeOpacity={1} accessibilityLabel={isPlaying ? "Pause" : "Play"} accessibilityRole="button">
      <Animated.View style={[
        styles.btn,
        {
          width: size,
          height: size,
          borderRadius: size / 2,
          transform: [{ scale: scaleAnim }, { rotate: spin }],
        }
      ]}>
        <LinearGradient
          colors={colors}
          style={[StyleSheet.absoluteFillObject, { borderRadius: size / 2 }]}
          start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
        />
        {/* Shine overlay */}
        <LinearGradient
          colors={['rgba(255,255,255,0.3)', 'transparent']}
          style={[StyleSheet.absoluteFillObject, { borderRadius: size / 2 }]}
          start={{ x: 0, y: 0 }} end={{ x: 0, y: 1 }}
        />
        <Animated.View style={{ opacity: iconOpacity }}>
          <Ionicons
            name={isPlaying ? 'pause' : 'play'}
            size={size * 0.38}
            color="#FFFFFF"
            style={isPlaying ? {} : { marginLeft: size * 0.05 }}
          />
        </Animated.View>
      </Animated.View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  btn: {
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
});

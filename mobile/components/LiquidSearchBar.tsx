import { View, Text, TextInput, TouchableOpacity, StyleSheet, Animated, Keyboard, Dimensions } from 'react-native';
import { useRef, useEffect, useState, useCallback } from 'react';
import { LinearGradient } from 'expo-linear-gradient';
import Svg, { Path } from 'react-native-svg';

const { width } = Dimensions.get('window');

const AnimatedSvg = Animated.createAnimatedComponent(Svg);

interface LiquidSearchBarProps {
  value: string;
  onChangeText: (text: string) => void;
  onFocus?: () => void;
  onBlur?: () => void;
  placeholder?: string;
}

const WAVE_PATH = "M0,20 Q25,10 50,20 T100,20 T150,20 T200,20 T250,20 T300,20 T350,20 T400,20";

export default function LiquidSearchBar({
  value,
  onChangeText,
  onFocus,
  onBlur,
  placeholder = 'Search music, artists...'
}: LiquidSearchBarProps) {
  const [isFocused, setIsFocused] = useState(false);
  const pulseAnim = useRef(new Animated.Value(0)).current;
  const waveAnim = useRef(new Animated.Value(0)).current;
  const glowAnim = useRef(new Animated.Value(0)).current;
  const inputRef = useRef<TextInput>(null);

  // Liquid wave animation
  useEffect(() => {
    const wave = Animated.loop(
      Animated.timing(waveAnim, {
        toValue: 1,
        duration: 3000,
        useNativeDriver: true,
      })
    );
    wave.start();
    return () => wave.stop();
  }, []);

  // Glow pulse when focused
  useEffect(() => {
    Animated.timing(glowAnim, {
      toValue: isFocused ? 1 : 0,
      duration: 400,
      useNativeDriver: false,
    }).start();
  }, [isFocused]);

  // Tap pulse animation
  const triggerPulse = useCallback(() => {
    pulseAnim.setValue(0);
    Animated.timing(pulseAnim, {
      toValue: 1,
      duration: 400,
      useNativeDriver: true,
    }).start();
  }, []);

  const translateX = waveAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, -100],
  });

  const glowOpacity = glowAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, 0.6],
  });

  const glowScale = glowAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0.95, 1.05],
  });

  const pulseScale = pulseAnim.interpolate({
    inputRange: [0, 0.5, 1],
    outputRange: [1, 1.02, 1],
  });

  return (
    <Animated.View style={[styles.outerContainer, { transform: [{ scale: pulseScale }] }]}>
      {/* Glow effect */}
      <Animated.View
        style={[
          styles.glowLayer,
          {
            opacity: glowOpacity,
            transform: [{ scale: glowScale }],
          },
        ]}
      >
        <LinearGradient
          colors={['rgba(167,139,250,0.4)', 'rgba(125,211,252,0.3)', 'rgba(232,121,249,0.2)']}
          style={StyleSheet.absoluteFillObject}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
        />
      </Animated.View>

      <TouchableOpacity
        activeOpacity={0.9}
        onPress={() => {
          triggerPulse();
          inputRef.current?.focus();
        }}
        style={styles.touchable}
      >
        <View style={styles.container}>
          {/* Glass background */}
          <LinearGradient
            colors={[
              'rgba(255,255,255,0.25)',
              'rgba(255,255,255,0.15)',
              'rgba(255,255,255,0.05)',
            ]}
            style={StyleSheet.absoluteFillObject}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
          />

          {/* Liquid wave decoration */}
          <View style={styles.waveContainer} pointerEvents="none">
            <AnimatedSvg
              width={width}
              height={40}
              viewBox="0 0 400 40"
              style={{ transform: [{ translateX }] }}
            >
              <Path
                d={WAVE_PATH}
                fill="none"
                stroke="rgba(167,139,250,0.3)"
                strokeWidth="2"
              />
              <Path
                d={WAVE_PATH}
                fill="none"
                stroke="rgba(125,211,252,0.2)"
                strokeWidth="1.5"
                transform="translate(0, 8)"
              />
            </AnimatedSvg>
          </View>

          {/* Content */}
          <View style={styles.content}>
            <View style={styles.iconContainer}>
              <LinearGradient
                colors={['rgba(167,139,250,0.3)', 'rgba(125,211,252,0.2)']}
                style={StyleSheet.absoluteFillObject}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
              />
              <Animated.Text style={[styles.icon, { opacity: isFocused ? 1 : 0.7 }]}>
                🔍
              </Animated.Text>
            </View>

            <TextInput
              ref={inputRef}
              style={styles.input}
              placeholder={placeholder}
              placeholderTextColor="rgba(107,114,128,0.8)"
              value={value}
              onChangeText={onChangeText}
              onFocus={() => {
                setIsFocused(true);
                onFocus?.();
              }}
              onBlur={() => {
                setIsFocused(false);
                onBlur?.();
              }}
              selectionColor="#A78BFA"
              returnKeyType="search"
              autoCapitalize="none"
              autoCorrect={false}
            />

            {value.length > 0 && (
              <TouchableOpacity
                onPress={() => {
                  onChangeText('');
                  Keyboard.dismiss();
                }}
                hitSlop={{ top: 15, bottom: 15, left: 15, right: 15 }}
                style={styles.clearButton}
              >
                <LinearGradient
                  colors={['rgba(196,181,253,0.9)', 'rgba(167,139,250,0.9)']}
                  style={styles.clearGradient}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                >
                  <Text style={styles.clearText}>✕</Text>
                </LinearGradient>
              </TouchableOpacity>
            )}
          </View>
        </View>
      </TouchableOpacity>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  outerContainer: {
    marginHorizontal: 20,
    marginBottom: 20,
  },
  glowLayer: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: 28,
    margin: -4,
  },
  touchable: {
    borderRadius: 24,
  },
  container: {
    borderRadius: 24,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.5)',
    shadowColor: '#A78BFA',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 24,
    elevation: 8,
  },
  waveContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 40,
    opacity: 0.6,
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 14,
    gap: 12,
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
  },
  icon: {
    fontSize: 18,
  },
  input: {
    flex: 1,
    fontSize: 16,
    color: '#1E1B4B',
    fontWeight: '500',
    padding: 0,
    letterSpacing: 0.3,
  },
  clearButton: {
    shadowColor: '#A78BFA',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 4,
  },
  clearGradient: {
    width: 26,
    height: 26,
    borderRadius: 13,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.6)',
  },
  clearText: {
    fontSize: 12,
    color: '#FFFFFF',
    fontWeight: '800',
  },
});

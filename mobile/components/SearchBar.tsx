import {
  View, TextInput, TouchableOpacity,
  StyleSheet, Animated, Keyboard
} from 'react-native';
import { useRef, useEffect, useState } from 'react';
import { LinearGradient } from 'expo-linear-gradient';

interface SearchBarProps {
  value: string;
  onChangeText: (text: string) => void;
  onFocus?: () => void;
  onBlur?: () => void;
  placeholder?: string;
  autoFocus?: boolean;
}

export default function SearchBar({
  value,
  onChangeText,
  onFocus,
  onBlur,
  placeholder = 'Songs, artists, albums...',
  autoFocus = false,
}: SearchBarProps) {
  const [isFocused, setIsFocused] = useState(false);
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const borderAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.spring(scaleAnim, {
        toValue: isFocused ? 1.01 : 1,
        useNativeDriver: true,
        tension: 100,
        friction: 8,
      }),
      Animated.timing(borderAnim, {
        toValue: isFocused ? 1 : 0,
        duration: 200,
        useNativeDriver: false,
      }),
    ]).start();
  }, [isFocused]);

  const borderColor = borderAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['rgba(167,139,250,0.2)', 'rgba(167,139,250,0.7)'],
  });

  const handleFocus = () => {
    setIsFocused(true);
    onFocus?.();
  };

  const handleBlur = () => {
    setIsFocused(false);
    onBlur?.();
  };

  const handleClear = () => {
    onChangeText('');
    Keyboard.dismiss();
  };

  return (
    <Animated.View style={[styles.wrapper, { transform: [{ scale: scaleAnim }] }]}>
      <Animated.View style={[styles.container, { borderColor }]}>
        <LinearGradient
          colors={
            isFocused
              ? ['rgba(167,139,250,0.15)', 'rgba(125,211,252,0.08)']
              : ['rgba(255,255,255,0.85)', 'rgba(255,255,255,0.7)']
          }
          style={StyleSheet.absoluteFillObject}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
        />

        {/* Search icon */}
        <View style={styles.iconWrap}>
          <Animated.Text style={[styles.icon, { opacity: isFocused ? 1 : 0.5 }]}>
            🔍
          </Animated.Text>
        </View>

        {/* Input */}
        <TextInput
          style={styles.input}
          placeholder={placeholder}
          placeholderTextColor={isFocused ? '#9CA3AF' : '#C4B5FD'}
          value={value}
          onChangeText={onChangeText}
          onFocus={handleFocus}
          onBlur={handleBlur}
          selectionColor="#A78BFA"
          autoFocus={autoFocus}
          returnKeyType="search"
          clearButtonMode="never"
          autoCapitalize="none"
          autoCorrect={false}
        />

        {/* Clear button */}
        {value.length > 0 && (
          <TouchableOpacity
            onPress={handleClear}
            style={styles.clearBtn}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <LinearGradient
              colors={['#C4B5FD', '#A78BFA']}
              style={styles.clearGrad}
            >
              <Animated.Text style={styles.clearText}>✕</Animated.Text>
            </LinearGradient>
          </TouchableOpacity>
        )}
      </Animated.View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    marginHorizontal: 24,
    marginBottom: 16,
  },
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 20,
    overflow: 'hidden',
    borderWidth: 1.5,
    paddingHorizontal: 16,
    paddingVertical: 14,
    gap: 10,
  },
  iconWrap: {
    width: 24,
    alignItems: 'center',
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
  },
  clearBtn: {
    marginLeft: 4,
  },
  clearGrad: {
    width: 22,
    height: 22,
    borderRadius: 11,
    alignItems: 'center',
    justifyContent: 'center',
  },
  clearText: {
    fontSize: 10,
    color: '#FFFFFF',
    fontWeight: '800',
  },
});

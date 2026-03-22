import { View, TextInput, TouchableOpacity, StyleSheet, Animated, Keyboard } from 'react-native';
import { useRef, useEffect, useState } from 'react';
import { LinearGradient } from 'expo-linear-gradient';

interface SearchBarProps {
  value: string;
  onChangeText: (text: string) => void;
  onFocus?: () => void;
  onBlur?: () => void;
  placeholder?: string;
}

export default function SearchBar({ value, onChangeText, onFocus, onBlur, placeholder = 'Songs, artists, albums...' }: SearchBarProps) {
  const [isFocused, setIsFocused] = useState(false);
  const borderAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(borderAnim, { toValue: isFocused ? 1 : 0, duration: 200, useNativeDriver: false }).start();
  }, [isFocused]);

  const borderColor = borderAnim.interpolate({ inputRange: [0, 1], outputRange: ['rgba(167,139,250,0.2)', 'rgba(167,139,250,0.7)'] });

  return (
    <Animated.View style={[styles.container, { borderColor }]}>
      <LinearGradient colors={isFocused ? ['rgba(167,139,250,0.15)','rgba(125,211,252,0.08)'] : ['rgba(255,255,255,0.85)','rgba(255,255,255,0.7)']} style={StyleSheet.absoluteFillObject} />
      <Animated.Text style={[styles.icon, { opacity: isFocused ? 1 : 0.5 }]}>🔍</Animated.Text>
      <TextInput
        style={styles.input}
        placeholder={placeholder}
        placeholderTextColor="#9CA3AF"
        value={value}
        onChangeText={onChangeText}
        accessibilityLabel="Search music"
        accessibilityRole="search"
        onFocus={() => { setIsFocused(true); onFocus?.(); }}
        onBlur={() => { setIsFocused(false); onBlur?.(); }}
        selectionColor="#A78BFA"
        returnKeyType="search"
        autoCapitalize="none"
        autoCorrect={false}
      />
      {value.length > 0 && (
        <TouchableOpacity onPress={() => { onChangeText(''); Keyboard.dismiss(); }} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
          <LinearGradient colors={['#C4B5FD','#A78BFA']} style={styles.clearBtn}>
            <Animated.Text style={styles.clearText}>✕</Animated.Text>
          </LinearGradient>
        </TouchableOpacity>
      )}
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: { flexDirection: 'row', alignItems: 'center', marginHorizontal: 24, marginBottom: 16, borderRadius: 20, overflow: 'hidden', borderWidth: 1.5, paddingHorizontal: 16, paddingVertical: 14, gap: 10 },
  icon: { fontSize: 18 },
  input: { flex: 1, fontSize: 16, color: '#1E1B4B', fontWeight: '500', padding: 0 },
  clearBtn: { width: 22, height: 22, borderRadius: 11, alignItems: 'center', justifyContent: 'center' },
  clearText: { fontSize: 10, color: '#FFFFFF', fontWeight: '800' },
});

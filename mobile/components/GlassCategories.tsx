import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
  Animated,
  Easing,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useRef, useEffect, useState } from 'react';

const { width } = Dimensions.get('window');
const CARD_WIDTH = (width - 56) / 2;
const CARD_HEIGHT = 110;

const CATEGORIES = [
  { name: 'Bollywood', emoji: '🎬', colors: ['#FF6B6B', '#FF8E8E', '#FFB4B4'], accent: '#FF4757' },
  { name: 'English Pop', emoji: '🎵', colors: ['#4ECDC4', '#7EDDD6', '#A8E6E1'], accent: '#26D0CE' },
  { name: 'Lo-fi', emoji: '☕', colors: ['#A8D8EA', '#C7E9F1', '#E3F6F5'], accent: '#89CFF0' },
  { name: 'Hip-Hop', emoji: '🎤', colors: ['#C7CEEA', '#D6DAF2', '#E5E8FA'], accent: '#A29BFE' },
  { name: 'Classical', emoji: '🎻', colors: ['#95E1D3', '#B4EFE4', '#D2F5F0'], accent: '#74B9FF' },
  { name: 'Punjabi', emoji: '🥁', colors: ['#FFEAA7', '#FFF0C7', '#FFF6E7'], accent: '#FDCB6E' },
  { name: 'Rock', emoji: '🎸', colors: ['#FF8A80', '#FFAB91', '#FFCCBC'], accent: '#FF6348' },
  { name: 'Electronic', emoji: '🎛️', colors: ['#80DEEA', '#A4E8F2', '#C8F2FA'], accent: '#00D2D3' },
  { name: 'K-Pop', emoji: '⭐', colors: ['#F8BBD9', '#FACDE6', '#FCE1F3'], accent: '#FD79A8' },
  { name: 'Jazz', emoji: '🎷', colors: ['#FFCC80', '#FFE0B2', '#FFF3E0'], accent: '#FFA502' },
  { name: 'R&B', emoji: '🎙️', colors: ['#CE93D8', '#E1BEE7', '#F3E5F5'], accent: '#9B59B6' },
  { name: 'Devotional', emoji: '🙏', colors: ['#A5D6A7', '#C8E6C9', '#E8F5E9'], accent: '#2ECC71' },
];

interface GlassCardProps {
  category: typeof CATEGORIES[0];
  index: number;
  onPress: () => void;
}

function GlassCard({ category, index, onPress }: GlassCardProps) {
  const floatAnim = useRef(new Animated.Value(0)).current;
  const shimmerAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const [isPressed, setIsPressed] = useState(false);

  // Floating animation with stagger
  useEffect(() => {
    const float = Animated.loop(
      Animated.sequence([
        Animated.timing(floatAnim, {
          toValue: 1,
          duration: 2000 + index * 200,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
        Animated.timing(floatAnim, {
          toValue: 0,
          duration: 2000 + index * 200,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
      ])
    );
    float.start();
    return () => float.stop();
  }, [index]);

  // Shimmer effect
  useEffect(() => {
    const shimmer = Animated.loop(
      Animated.timing(shimmerAnim, {
        toValue: 1,
        duration: 3000,
        easing: Easing.linear,
        useNativeDriver: true,
      })
    );
    shimmer.start();
    return () => shimmer.stop();
  }, []);

  const translateY = floatAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, -6],
  });

  const shimmerTranslate = shimmerAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [-CARD_WIDTH, CARD_WIDTH],
  });

  const handlePressIn = () => {
    setIsPressed(true);
    Animated.spring(scaleAnim, {
      toValue: 0.96,
      useNativeDriver: true,
      friction: 8,
      tension: 100,
    }).start();
  };

  const handlePressOut = () => {
    setIsPressed(false);
    Animated.spring(scaleAnim, {
      toValue: 1,
      useNativeDriver: true,
      friction: 8,
      tension: 100,
    }).start();
  };

  return (
    <TouchableOpacity
      activeOpacity={0.9}
      onPress={onPress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      style={styles.cardContainer}
    >
      <Animated.View
        style={[
          styles.card,
          {
            transform: [
              { translateY },
              { scale: scaleAnim },
            ],
            shadowOpacity: isPressed ? 0.3 : 0.2,
          },
        ]}
      >
        {/* Glass background layers */}
        <LinearGradient
          colors={['rgba(255,255,255,0.4)', 'rgba(255,255,255,0.1)']}
          style={StyleSheet.absoluteFillObject}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
        />

        {/* Category gradient accent */}
        <LinearGradient
          colors={[...category.colors.map(c => c + '40'), 'transparent']}
          style={styles.accentGradient}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
        />

        {/* Shimmer effect */}
        <Animated.View
          style={[
            styles.shimmer,
            {
              transform: [{ translateX: shimmerTranslate }],
              backgroundColor: category.colors[0] + '15',
            },
          ]}
        />

        {/* Content */}
        <View style={styles.cardContent}>
          <View style={[styles.emojiContainer, { backgroundColor: category.colors[0] + '30' }]}>
            <Text style={styles.emoji}>{category.emoji}</Text>
          </View>
          <Text style={styles.categoryName}>{category.name}</Text>
        </View>

        {/* Floating particles */}
        <View style={[styles.particle, {
          backgroundColor: category.accent + '20',
          top: 15,
          right: 15,
          width: 8,
          height: 8
        }]} />
        <View style={[styles.particle, {
          backgroundColor: category.colors[1] + '30',
          bottom: 20,
          right: 25,
          width: 6,
          height: 6
        }]} />
      </Animated.View>
    </TouchableOpacity>
  );
}

interface GlassCategoriesProps {
  onCategoryPress?: (name: string) => void;
}

export default function GlassCategories({ onCategoryPress }: GlassCategoriesProps) {
  return (
    <View style={styles.container}>
      <Text style={styles.sectionTitle}>Browse by Mood</Text>
      <View style={styles.grid}>
        {CATEGORIES.map((category, index) => (
          <GlassCard
            key={category.name}
            category={category}
            index={index}
            onPress={() => onCategoryPress?.(category.name)}
          />
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingTop: 8,
  },
  sectionTitle: {
    fontSize: 24,
    fontWeight: '800',
    color: '#1E1B4B',
    paddingHorizontal: 28,
    marginBottom: 20,
    letterSpacing: -0.5,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: 28,
    gap: 12,
  },
  cardContainer: {
    width: CARD_WIDTH,
    height: CARD_HEIGHT,
  },
  card: {
    flex: 1,
    borderRadius: 24,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.6)',
    shadowColor: '#6366F1',
    shadowOffset: { width: 0, height: 12 },
    shadowRadius: 20,
    elevation: 10,
  },
  accentGradient: {
    ...StyleSheet.absoluteFillObject,
    opacity: 0.5,
  },
  shimmer: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    width: CARD_WIDTH * 0.6,
    transform: [{ skewX: '-20deg' }],
  },
  cardContent: {
    flex: 1,
    padding: 16,
    justifyContent: 'space-between',
  },
  emojiContainer: {
    width: 44,
    height: 44,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.5)',
  },
  emoji: {
    fontSize: 22,
  },
  categoryName: {
    fontSize: 14,
    fontWeight: '700',
    color: '#1E1B4B',
    letterSpacing: -0.3,
  },
  particle: {
    position: 'absolute',
    borderRadius: 10,
  },
});

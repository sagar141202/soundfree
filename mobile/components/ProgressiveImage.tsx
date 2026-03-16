import { View, StyleSheet, Animated } from 'react-native';
import { useState, useRef, useEffect } from 'react';
import { LinearGradient } from 'expo-linear-gradient';
import { getArtUri } from '../services/artCache';

interface ProgressiveImageProps {
  videoId?: string;
  thumbnailUrl: string | null;
  style?: any;
  borderRadius?: number;
  fallbackColors?: [string, string];
  fallbackEmoji?: string;
}

function getHighResUrl(url: string | null): string | null {
  if (!url) return null;
  return url
    .replace('w120-h120-l90-rj', 'w576-h576-l90-rj')
    .replace('w60-h60-l90-rj', 'w576-h576-l90-rj')
    .replace('w226-h226-l90-rj', 'w576-h576-l90-rj');
}

export default function ProgressiveImage({
  videoId,
  thumbnailUrl,
  style,
  borderRadius = 0,
  fallbackColors = ['#C4B5FD', '#A78BFA'],
  fallbackEmoji = '🎵',
}: ProgressiveImageProps) {
  const [fullResLoaded, setFullResLoaded] = useState(false);
  const [resolvedUrl, setResolvedUrl] = useState<string | null>(null);
  const thumbOpacity = useRef(new Animated.Value(1)).current;
  const fullOpacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // Check local art cache first
    if (videoId && thumbnailUrl) {
      getArtUri(videoId, getHighResUrl(thumbnailUrl)).then(uri => {
        setResolvedUrl(uri);
      });
    } else {
      setResolvedUrl(getHighResUrl(thumbnailUrl));
    }
  }, [videoId, thumbnailUrl]);

  const handleFullResLoad = () => {
    setFullResLoaded(true);
    Animated.parallel([
      Animated.timing(fullOpacity, { toValue: 1, duration: 400, useNativeDriver: true }),
      Animated.timing(thumbOpacity, { toValue: 0, duration: 400, useNativeDriver: true }),
    ]).start();
  };

  if (!thumbnailUrl && !resolvedUrl) {
    return (
      <LinearGradient
        colors={fallbackColors}
        style={[style, { borderRadius, alignItems: 'center', justifyContent: 'center' }]}
      >
        <Animated.Text style={{ fontSize: (style?.width || 100) * 0.25 }}>
          {fallbackEmoji}
        </Animated.Text>
      </LinearGradient>
    );
  }

  return (
    <View style={[style, { borderRadius, overflow: 'hidden' }]}>
      {/* Thumbnail first */}
      {thumbnailUrl && (
        <Animated.Image
          source={{ uri: thumbnailUrl }}
          style={[StyleSheet.absoluteFillObject, { opacity: thumbOpacity }]}
          resizeMode="cover"
        />
      )}

      {/* High-res / local cache */}
      {resolvedUrl && (
        <Animated.Image
          source={{ uri: resolvedUrl }}
          style={[StyleSheet.absoluteFillObject, { opacity: fullOpacity }]}
          resizeMode="cover"
          onLoad={handleFullResLoad}
          onError={() => {}}
        />
      )}
    </View>
  );
}

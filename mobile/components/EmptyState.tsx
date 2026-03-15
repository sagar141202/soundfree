import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';

interface EmptyStateProps {
  emoji?: string;
  title: string;
  subtitle?: string;
  actionLabel?: string;
  onAction?: () => void;
}

export default function EmptyState({
  emoji = '🎵',
  title,
  subtitle,
  actionLabel,
  onAction,
}: EmptyStateProps) {
  return (
    <View style={styles.container}>
      <View style={styles.emojiWrap}>
        <LinearGradient
          colors={['rgba(167,139,250,0.2)', 'rgba(125,211,252,0.1)']}
          style={StyleSheet.absoluteFillObject}
        />
        <Text style={styles.emoji}>{emoji}</Text>
      </View>
      <Text style={styles.title}>{title}</Text>
      {subtitle && <Text style={styles.subtitle}>{subtitle}</Text>}
      {actionLabel && onAction && (
        <TouchableOpacity style={styles.actionBtn} onPress={onAction}>
          <LinearGradient
            colors={['#C4B5FD', '#A78BFA']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.actionGrad}
          >
            <Text style={styles.actionText}>{actionLabel}</Text>
          </LinearGradient>
        </TouchableOpacity>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    paddingTop: 48,
    paddingHorizontal: 32,
  },
  emojiWrap: {
    width: 80, height: 80, borderRadius: 40,
    alignItems: 'center', justifyContent: 'center',
    overflow: 'hidden', marginBottom: 20,
    borderWidth: 1.5, borderColor: 'rgba(167,139,250,0.3)',
  },
  emoji: { fontSize: 36 },
  title: {
    fontSize: 18, fontWeight: '800',
    color: '#1E1B4B', textAlign: 'center',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 14, color: '#6B7280',
    textAlign: 'center', lineHeight: 20,
    marginBottom: 24,
  },
  actionBtn: { borderRadius: 30, overflow: 'hidden' },
  actionGrad: {
    paddingHorizontal: 24, paddingVertical: 12,
    borderRadius: 30,
  },
  actionText: {
    fontSize: 14, fontWeight: '700',
    color: '#FFFFFF', letterSpacing: 0.3,
  },
});

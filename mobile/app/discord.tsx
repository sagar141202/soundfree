import {
  View, Text, StyleSheet, TouchableOpacity,
  TextInput, Animated, Linking, Alert
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { StatusBar } from 'expo-status-bar';
import { useRef, useEffect, useState } from 'react';
import { router } from 'expo-router';
import { getDiscordStatus, setDiscordConfig } from '../lib/api';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Ionicons } from '@expo/vector-icons';

export default function DiscordScreen() {
  const [clientId, setClientId] = useState('');
  const [enabled, setEnabled] = useState(false);
  const [status, setStatus] = useState('');
  const [connected, setConnected] = useState(false);
  const [loading, setLoading] = useState(false);
  const slideAnim = useRef(new Animated.Value(40)).current;
  const opacityAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.spring(slideAnim, { toValue: 0, useNativeDriver: true, tension: 80, friction: 12 }),
      Animated.timing(opacityAnim, { toValue: 1, duration: 300, useNativeDriver: true }),
    ]).start();

    // Load saved config
    AsyncStorage.getItem('discord_config').then(saved => {
      if (saved) {
        const { clientId: id, enabled: en } = JSON.parse(saved);
        setClientId(id || '');
        setEnabled(en || false);
      }
    });

    // Check backend status
    getDiscordStatus().then(s => {
      if (s) {
        setConnected(s.connected);
        if (s.client_id && s.client_id !== '1234567890') setClientId(s.client_id);
        setEnabled(s.enabled);
      }
    });
  }, []);

  const handleSave = async () => {
    if (!clientId.trim()) {
      setStatus('Please enter your Discord Application Client ID');
      return;
    }
    setLoading(true);
    const result = await setDiscordConfig(clientId.trim(), enabled);
    if (result) {
      await AsyncStorage.setItem('discord_config', JSON.stringify({ clientId: clientId.trim(), enabled }));
      setConnected(result.enabled);
      setStatus(enabled ? '✅ Discord RPC enabled' : '⏸ Discord RPC disabled');
    } else {
      setStatus('❌ Failed — is the backend running?');
    }
    setLoading(false);
  };

  const handleToggle = async () => {
    const newEnabled = !enabled;
    setEnabled(newEnabled);
    if (clientId.trim()) {
      await setDiscordConfig(clientId.trim(), newEnabled);
      await AsyncStorage.setItem('discord_config', JSON.stringify({ clientId: clientId.trim(), enabled: newEnabled }));
      setStatus(newEnabled ? '✅ Discord RPC enabled' : '⏸ Discord RPC disabled');
    }
  };

  return (
    <View style={styles.container}>
      <StatusBar style="dark" />
      <LinearGradient colors={['#F0F0FF', '#FAFBFF', '#F0F4FF']} style={StyleSheet.absoluteFillObject} />

      <Animated.View style={[styles.inner, { transform: [{ translateY: slideAnim }], opacity: opacityAnim }]}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
            <LinearGradient colors={['rgba(99,102,241,0.2)', 'rgba(99,102,241,0.1)']} style={StyleSheet.absoluteFillObject} />
            <Ionicons name="chevron-back" size={22} color="#6366F1" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Discord RPC</Text>
          <TouchableOpacity
            style={[styles.toggleBtn, enabled && styles.toggleBtnOn]}
            onPress={handleToggle}
          >
            <LinearGradient
              colors={enabled ? ['#818CF8', '#6366F1'] : ['rgba(99,102,241,0.1)', 'rgba(99,102,241,0.05)']}
              style={StyleSheet.absoluteFillObject}
            />
            <Text style={[styles.toggleText, enabled && { color: '#FFFFFF' }]}>
              {enabled ? 'ON' : 'OFF'}
            </Text>
          </TouchableOpacity>
        </View>

        {/* Hero */}
        <View style={styles.hero}>
          <View style={styles.heroIcon}>
            <LinearGradient colors={['#818CF8', '#6366F1']} style={StyleSheet.absoluteFillObject} />
            <Text style={styles.heroEmoji}>🎮</Text>
          </View>
          <Text style={styles.heroTitle}>Discord Rich Presence</Text>
          <Text style={styles.heroSub}>Show what you're listening to on Discord</Text>

          {/* Preview card */}
          <View style={styles.previewCard}>
            <LinearGradient colors={['#2D2F36', '#23252B']} style={StyleSheet.absoluteFillObject} />
            <View style={styles.previewIcon}>
              <LinearGradient colors={['#818CF8', '#6366F1']} style={StyleSheet.absoluteFillObject} />
              <Text style={{ fontSize: 24 }}>🎵</Text>
            </View>
            <View style={styles.previewInfo}>
              <Text style={styles.previewApp}>SoundFree</Text>
              <Text style={styles.previewTitle}>Bohemian Rhapsody</Text>
              <Text style={styles.previewArtist}>by Queen · A Night At The Opera</Text>
              <Text style={styles.previewTime}>2:14 remaining</Text>
            </View>
          </View>
        </View>

        {/* Config */}
        <View style={styles.configSection}>
          <Text style={styles.inputLabel}>Discord Application Client ID</Text>
          <View style={styles.inputWrap}>
            <LinearGradient colors={['rgba(99,102,241,0.06)', 'rgba(99,102,241,0.02)']} style={StyleSheet.absoluteFillObject} />
            <TextInput
              style={styles.input}
              value={clientId}
              onChangeText={setClientId}
              placeholder="e.g. 1234567890123456789"
              placeholderTextColor="#9CA3AF"
              keyboardType="numeric"
              selectionColor="#6366F1"
            />
          </View>

          <TouchableOpacity
            style={styles.helpLink}
            onPress={() => Linking.openURL('https://discord.com/developers/applications')}
          >
            <Ionicons name="open-outline" size={14} color="#6366F1" />
            <Text style={styles.helpText}>Create app at discord.com/developers</Text>
          </TouchableOpacity>
        </View>

        {/* Save button */}
        <View style={styles.btnWrap}>
          <TouchableOpacity style={styles.saveBtn} onPress={handleSave} disabled={loading}>
            <LinearGradient colors={['#818CF8', '#6366F1']} style={StyleSheet.absoluteFillObject} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} />
            <Ionicons name="save" size={18} color="#FFFFFF" />
            <Text style={styles.saveBtnText}>{loading ? 'Saving...' : 'Save & Enable'}</Text>
          </TouchableOpacity>
        </View>

        {/* Status */}
        {status ? (
          <View style={styles.statusWrap}>
            <Text style={styles.statusText}>{status}</Text>
          </View>
        ) : null}

        {/* Instructions */}
        <View style={styles.infoCard}>
          <LinearGradient colors={['rgba(99,102,241,0.06)', 'rgba(99,102,241,0.02)']} style={StyleSheet.absoluteFillObject} />
          <Text style={styles.infoTitle}>Setup Steps</Text>
          <Text style={styles.infoText}>
            1. Go to discord.com/developers/applications{'\n'}
            2. Create a new application named "SoundFree"{'\n'}
            3. Copy the Application ID (Client ID){'\n'}
            4. Paste it above and tap Save{'\n'}
            5. Make sure Discord is running on your PC{'\n'}
            6. Play music — status updates automatically
          </Text>
        </View>

        <View style={{ height: 120 }} />
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FAFBFF' },
  inner: { flex: 1 },
  header: { flexDirection: 'row', alignItems: 'center', paddingTop: 56, paddingHorizontal: 24, paddingBottom: 16 },
  backBtn: { width: 42, height: 42, borderRadius: 21, alignItems: 'center', justifyContent: 'center', overflow: 'hidden', borderWidth: 1.5, borderColor: 'rgba(99,102,241,0.25)' },
  headerTitle: { flex: 1, textAlign: 'center', fontSize: 18, fontWeight: '900', color: '#1E1B4B' },
  toggleBtn: { paddingHorizontal: 16, paddingVertical: 10, borderRadius: 20, overflow: 'hidden', borderWidth: 1.5, borderColor: 'rgba(99,102,241,0.3)' },
  toggleBtnOn: { borderColor: '#6366F1' },
  toggleText: { fontSize: 12, fontWeight: '800', color: '#6366F1', letterSpacing: 1 },
  hero: { alignItems: 'center', paddingVertical: 20, paddingHorizontal: 24, gap: 8 },
  heroIcon: { width: 80, height: 80, borderRadius: 24, alignItems: 'center', justifyContent: 'center', overflow: 'hidden', marginBottom: 4 },
  heroEmoji: { fontSize: 36 },
  heroTitle: { fontSize: 22, fontWeight: '900', color: '#1E1B4B' },
  heroSub: { fontSize: 14, color: '#6B7280', textAlign: 'center' },
  previewCard: { width: '100%', flexDirection: 'row', gap: 14, padding: 16, borderRadius: 16, overflow: 'hidden', marginTop: 16, borderWidth: 1, borderColor: 'rgba(99,102,241,0.3)' },
  previewIcon: { width: 56, height: 56, borderRadius: 14, overflow: 'hidden', alignItems: 'center', justifyContent: 'center' },
  previewInfo: { flex: 1, gap: 3 },
  previewApp: { fontSize: 11, color: '#818CF8', fontWeight: '800', letterSpacing: 0.5 },
  previewTitle: { fontSize: 14, fontWeight: '700', color: '#FFFFFF' },
  previewArtist: { fontSize: 12, color: '#9CA3AF' },
  previewTime: { fontSize: 11, color: '#6B7280' },
  configSection: { paddingHorizontal: 24, marginBottom: 20, gap: 8 },
  inputLabel: { fontSize: 13, fontWeight: '700', color: '#6B7280' },
  inputWrap: { borderRadius: 16, overflow: 'hidden', borderWidth: 1.5, borderColor: 'rgba(99,102,241,0.2)' },
  input: { padding: 14, fontSize: 14, color: '#1E1B4B', fontWeight: '500' },
  helpLink: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  helpText: { fontSize: 13, color: '#6366F1', fontWeight: '600' },
  btnWrap: { paddingHorizontal: 24, marginBottom: 16 },
  saveBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10, paddingVertical: 15, borderRadius: 30, overflow: 'hidden' },
  saveBtnText: { fontSize: 15, fontWeight: '700', color: '#FFFFFF' },
  statusWrap: { marginHorizontal: 24, marginBottom: 16, padding: 12, borderRadius: 14, backgroundColor: 'rgba(99,102,241,0.08)', borderWidth: 1, borderColor: 'rgba(99,102,241,0.2)' },
  statusText: { fontSize: 13, color: '#6366F1', fontWeight: '500', textAlign: 'center' },
  infoCard: { marginHorizontal: 24, padding: 20, borderRadius: 20, overflow: 'hidden', borderWidth: 1.5, borderColor: 'rgba(99,102,241,0.12)', gap: 10 },
  infoTitle: { fontSize: 15, fontWeight: '800', color: '#1E1B4B' },
  infoText: { fontSize: 13, color: '#6B7280', lineHeight: 24 },
});

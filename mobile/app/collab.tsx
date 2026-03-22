import {
  View, Text, StyleSheet, TouchableOpacity,
  TextInput, ScrollView, Animated, Dimensions, KeyboardAvoidingView, Platform
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { StatusBar } from 'expo-status-bar';
import { useRef, useEffect, useState, useCallback } from 'react';
import { router } from 'expo-router';
import { usePlayerStore } from '../stores/playerStore';
import { usePlayTrack } from '../hooks/usePlayTrack';
import { Ionicons } from '@expo/vector-icons';
import { getCurrentSound } from '../services/crossfadeService';

const { width, height } = Dimensions.get('window');
const WS_URL = (process.env.EXPO_PUBLIC_API_URL || 'http://10.53.24.112:8000')
  .replace('http://', 'ws://')
  .replace('https://', 'wss://');

function generateRoomId(): string {
  return Math.random().toString(36).substring(2, 8).toUpperCase();
}

function generateClientId(): string {
  return Math.random().toString(36).substring(2, 12);
}

interface ChatMessage {
  type: string;
  client_id: string;
  name: string;
  text: string;
  timestamp: number;
}

export default function CollabScreen() {
  const [roomId, setRoomId] = useState('');
  const [joinRoomId, setJoinRoomId] = useState('');
  const [clientId] = useState(generateClientId);
  const [name, setName] = useState('Listener');
  const [connected, setConnected] = useState(false);
  const [isHost, setIsHost] = useState(false);
  const [members, setMembers] = useState<string[]>([]);
  const [chat, setChat] = useState<ChatMessage[]>([]);
  const [chatInput, setChatInput] = useState('');
  const [status, setStatus] = useState('');
  const [phase, setPhase] = useState<'setup' | 'room'>('setup');
  const wsRef = useRef<WebSocket | null>(null);
  const syncIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const slideAnim = useRef(new Animated.Value(40)).current;
  const opacityAnim = useRef(new Animated.Value(0)).current;
  const chatScrollRef = useRef<ScrollView>(null);

  const currentTrack = usePlayerStore(s => s.currentTrack);
  const isPlaying = usePlayerStore(s => s.isPlaying);
  const position = usePlayerStore(s => s.position);
  const { playTrack } = usePlayTrack();

  useEffect(() => {
    Animated.parallel([
      Animated.spring(slideAnim, { toValue: 0, useNativeDriver: true, tension: 80, friction: 12 }),
      Animated.timing(opacityAnim, { toValue: 1, duration: 300, useNativeDriver: true }),
    ]).start();
    return () => disconnect();
  }, []);

  const connect = useCallback((rid: string, hosting: boolean) => {
    const url = `${WS_URL}/collab/ws/${rid}/${clientId}?name=${encodeURIComponent(name)}`;
    console.log('Connecting to:', url);
    setStatus('Connecting...');

    const ws = new WebSocket(url);
    wsRef.current = ws;

    ws.onopen = () => {
      setConnected(true);
      setRoomId(rid);
      setPhase('room');
      setStatus(hosting ? '🎵 You are the host' : '👂 Joined as listener');
    };

    ws.onmessage = (e) => {
      try {
        const msg = JSON.parse(e.data);
        handleMessage(msg);
      } catch (_) {}
    };

    ws.onerror = () => setStatus('❌ Connection error');
    ws.onclose = () => {
      setConnected(false);
      setStatus('Disconnected');
      if (syncIntervalRef.current) clearInterval(syncIntervalRef.current);
    };

    // Host sends sync every 5 seconds
    if (hosting) {
      syncIntervalRef.current = setInterval(() => {
        if (ws.readyState === WebSocket.OPEN && currentTrack) {
          ws.send(JSON.stringify({
            type: 'sync',
            is_playing: isPlaying,
            position_ms: position,
          }));
        }
      }, 5000);
    }
  }, [name, clientId, currentTrack, isPlaying, position]);

  const handleMessage = useCallback((msg: any) => {
    switch (msg.type) {
      case 'welcome':
        setIsHost(msg.is_host);
        setMembers(msg.members || []);
        setChat(msg.chat || []);
        break;

      case 'member_joined':
      case 'member_left':
        setMembers(msg.members || []);
        setChat(prev => [...prev, {
          type: 'system',
          client_id: 'system',
          name: 'System',
          text: msg.type === 'member_joined'
            ? `${msg.name} joined the room`
            : `${msg.name} left the room`,
          timestamp: Date.now() / 1000,
        }]);
        break;

      case 'play_track':
        if (!isHost && msg.track) {
          playTrack(msg.track, [msg.track]);
        }
        break;

      case 'sync':
        if (!isHost && msg.position_ms !== undefined) {
          const drift = Math.abs(msg.position_ms - position);
          // Only seek if drift > 500ms
          if (drift > 500) {
            const sound = getCurrentSound();
            if (sound) {
              const serverPos = msg.position_ms + (Date.now() / 1000 - msg.timestamp) * 1000;
              sound.setPositionAsync(Math.max(0, serverPos));
            }
          }
          if (!msg.is_playing && isPlaying) {
            const sound = getCurrentSound();
            sound?.pauseAsync();
            usePlayerStore.getState().setIsPlaying(false);
          } else if (msg.is_playing && !isPlaying) {
            const sound = getCurrentSound();
            sound?.playAsync();
            usePlayerStore.getState().setIsPlaying(true);
          }
        }
        break;

      case 'pause':
        if (!isHost) {
          const sound = getCurrentSound();
          sound?.pauseAsync();
          usePlayerStore.getState().setIsPlaying(false);
        }
        break;

      case 'resume':
        if (!isHost) {
          const sound = getCurrentSound();
          sound?.playAsync();
          usePlayerStore.getState().setIsPlaying(true);
        }
        break;

      case 'chat':
        setChat(prev => [...prev, msg]);
        setTimeout(() => chatScrollRef.current?.scrollToEnd({ animated: true }), 100);
        break;

      case 'host_changed':
        if (msg.new_host_id === clientId) {
          setIsHost(true);
          setStatus('👑 You are now the host');
        }
        break;
    }
  }, [isHost, position, isPlaying, playTrack, clientId]);

  const disconnect = () => {
    wsRef.current?.close();
    wsRef.current = null;
    if (syncIntervalRef.current) clearInterval(syncIntervalRef.current);
    setConnected(false);
    setPhase('setup');
  };

  const createRoom = () => {
    const newRoomId = generateRoomId();
    connect(newRoomId, true);
  };

  const joinRoom = () => {
    if (!joinRoomId.trim()) return;
    connect(joinRoomId.trim().toUpperCase(), false);
  };

  const sendChat = () => {
    if (!chatInput.trim() || !wsRef.current) return;
    wsRef.current.send(JSON.stringify({ type: 'chat', text: chatInput.trim() }));
    setChatInput('');
  };

  const broadcastTrack = () => {
    if (!wsRef.current || !currentTrack || !isHost) return;
    wsRef.current.send(JSON.stringify({ type: 'play_track', track: currentTrack }));
    setStatus('📡 Broadcasting current track...');
  };

  // Setup screen
  if (phase === 'setup') {
    return (
      <View style={styles.container}>
        <StatusBar style="dark" />
        <LinearGradient colors={['#F0F5FF', '#FAFBFF', '#F5F0FF']} style={StyleSheet.absoluteFillObject} />
        <Animated.View style={[styles.inner, { transform: [{ translateY: slideAnim }], opacity: opacityAnim }]}>
          <View style={styles.header}>
            <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
              <LinearGradient colors={['rgba(99,102,241,0.2)', 'rgba(99,102,241,0.1)']} style={StyleSheet.absoluteFillObject} />
              <Ionicons name="chevron-back" size={22} color="#6366F1" />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>Listen Together</Text>
            <View style={{ width: 42 }} />
          </View>

          <ScrollView contentContainerStyle={styles.setupScroll}>
            {/* Hero */}
            <View style={styles.hero}>
              <LinearGradient colors={['#818CF8', '#6366F1', '#4F46E5']} style={styles.heroIcon} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}>
                <Text style={styles.heroEmoji}>🎵</Text>
              </LinearGradient>
              <Text style={styles.heroTitle}>Listen Together</Text>
              <Text style={styles.heroSub}>Create a room and invite friends to sync music in real-time</Text>
            </View>

            {/* Name input */}
            <View style={styles.inputSection}>
              <Text style={styles.inputLabel}>Your Name</Text>
              <View style={styles.inputWrap}>
                <LinearGradient colors={['rgba(99,102,241,0.06)', 'rgba(99,102,241,0.02)']} style={StyleSheet.absoluteFillObject} />
                <TextInput
                  style={styles.input}
                  value={name}
                  onChangeText={setName}
                  placeholder="How should others see you?"
                  placeholderTextColor="#9CA3AF"
                  selectionColor="#6366F1"
                />
              </View>
            </View>

            {/* Create room */}
            <TouchableOpacity style={styles.createBtn} onPress={createRoom}>
              <LinearGradient colors={['#818CF8', '#6366F1']} style={StyleSheet.absoluteFillObject} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} />
              <Ionicons name="add-circle" size={22} color="#FFFFFF" />
              <Text style={styles.createBtnText}>Create a Room</Text>
            </TouchableOpacity>

            <View style={styles.divider}>
              <View style={styles.dividerLine} />
              <Text style={styles.dividerText}>or join existing</Text>
              <View style={styles.dividerLine} />
            </View>

            {/* Join room */}
            <View style={styles.joinRow}>
              <View style={[styles.inputWrap, { flex: 1 }]}>
                <LinearGradient colors={['rgba(99,102,241,0.06)', 'rgba(99,102,241,0.02)']} style={StyleSheet.absoluteFillObject} />
                <TextInput
                  style={styles.input}
                  value={joinRoomId}
                  onChangeText={v => setJoinRoomId(v.toUpperCase())}
                  placeholder="Room code (e.g. ABC123)"
                  placeholderTextColor="#9CA3AF"
                  autoCapitalize="characters"
                  maxLength={6}
                  selectionColor="#6366F1"
                />
              </View>
              <TouchableOpacity style={styles.joinBtn} onPress={joinRoom}>
                <LinearGradient colors={['rgba(99,102,241,0.15)', 'rgba(99,102,241,0.08)']} style={StyleSheet.absoluteFillObject} />
                <Text style={styles.joinBtnText}>Join</Text>
              </TouchableOpacity>
            </View>

            {status ? <Text style={styles.statusText}>{status}</Text> : null}

            {/* Info */}
            <View style={styles.infoCard}>
              <LinearGradient colors={['rgba(99,102,241,0.06)', 'rgba(99,102,241,0.02)']} style={StyleSheet.absoluteFillObject} />
              <Text style={styles.infoTitle}>How it works</Text>
              <Text style={styles.infoText}>
                🎵 Host controls playback for everyone{'\n'}
                👥 Guests sync within ±500ms{'\n'}
                💬 Built-in chat overlay{'\n'}
                📡 Works over WiFi or mobile data
              </Text>
            </View>
          </ScrollView>
        </Animated.View>
      </View>
    );
  }

  // Room screen
  return (
    <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <StatusBar style="light" />
      <LinearGradient colors={['#1E1B4B', '#312E81', '#1E1B4B']} style={StyleSheet.absoluteFillObject} />

      {/* Header */}
      <View style={styles.roomHeader}>
        <TouchableOpacity style={styles.roomBackBtn} onPress={disconnect}>
          <Ionicons name="close" size={22} color="rgba(255,255,255,0.8)" />
        </TouchableOpacity>
        <View style={styles.roomHeaderCenter}>
          <Text style={styles.roomTitle}>Room: {roomId}</Text>
          <View style={styles.roomMeta}>
            {isHost && (
              <View style={styles.hostBadge}>
                <Text style={styles.hostBadgeText}>👑 HOST</Text>
              </View>
            )}
            <View style={styles.membersBadge}>
              <Ionicons name="people" size={12} color="rgba(255,255,255,0.7)" />
              <Text style={styles.membersText}>{members.length}</Text>
            </View>
          </View>
        </View>
        {isHost && (
          <TouchableOpacity style={styles.broadcastBtn} onPress={broadcastTrack}>
            <LinearGradient colors={['#818CF8', '#6366F1']} style={StyleSheet.absoluteFillObject} />
            <Ionicons name="radio" size={18} color="#FFFFFF" />
          </TouchableOpacity>
        )}
      </View>

      {/* Now playing */}
      <View style={styles.nowPlayingCard}>
        <LinearGradient colors={['rgba(255,255,255,0.1)', 'rgba(255,255,255,0.05)']} style={StyleSheet.absoluteFillObject} />
        <Ionicons name="musical-notes" size={20} color="#818CF8" />
        <View style={styles.nowPlayingInfo}>
          <Text style={styles.nowPlayingTitle} numberOfLines={1}>
            {currentTrack?.title || 'No track playing'}
          </Text>
          <Text style={styles.nowPlayingArtist} numberOfLines={1}>
            {currentTrack?.artist || (isHost ? 'Play a track to broadcast' : 'Waiting for host...')}
          </Text>
        </View>
        {isPlaying && <View style={styles.playingDot} />}
      </View>

      {/* Members */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.membersRow} contentContainerStyle={styles.membersScroll}>
        {members.map((m, i) => (
          <View key={i} style={styles.memberChip}>
            <LinearGradient colors={['rgba(129,140,248,0.3)', 'rgba(99,102,241,0.2)']} style={StyleSheet.absoluteFillObject} />
            <Text style={styles.memberAvatar}>{m.charAt(0).toUpperCase()}</Text>
            <Text style={styles.memberName} numberOfLines={1}>{m}</Text>
          </View>
        ))}
      </ScrollView>

      {/* Chat */}
      <ScrollView
        ref={chatScrollRef}
        style={styles.chatList}
        contentContainerStyle={styles.chatContent}
        showsVerticalScrollIndicator={false}
      >
        {chat.map((msg, i) => {
          const isSystem = msg.type === 'system';
          const isMe = msg.client_id === clientId;
          return (
            <View key={i} style={[styles.chatMsg, isMe && styles.chatMsgMe, isSystem && styles.chatMsgSystem]}>
              {!isSystem && !isMe && (
                <Text style={styles.chatName}>{msg.name}</Text>
              )}
              <View style={[styles.chatBubble, isMe && styles.chatBubbleMe, isSystem && styles.chatBubbleSystem]}>
                <Text style={[styles.chatText, isSystem && styles.chatTextSystem]}>
                  {msg.text}
                </Text>
              </View>
            </View>
          );
        })}
      </ScrollView>

      {/* Chat input */}
      <View style={styles.chatInputRow}>
        <View style={styles.chatInputWrap}>
          <TextInput
            style={styles.chatInput}
            value={chatInput}
            onChangeText={setChatInput}
            placeholder="Say something..."
            placeholderTextColor="rgba(255,255,255,0.3)"
            onSubmitEditing={sendChat}
            returnKeyType="send"
            selectionColor="#818CF8"
          />
        </View>
        <TouchableOpacity style={styles.sendBtn} onPress={sendChat}>
          <LinearGradient colors={['#818CF8', '#6366F1']} style={StyleSheet.absoluteFillObject} />
          <Ionicons name="send" size={18} color="#FFFFFF" />
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FAFBFF' },
  inner: { flex: 1 },
  header: { flexDirection: 'row', alignItems: 'center', paddingTop: 56, paddingHorizontal: 24, paddingBottom: 16 },
  backBtn: { width: 42, height: 42, borderRadius: 21, alignItems: 'center', justifyContent: 'center', overflow: 'hidden', borderWidth: 1.5, borderColor: 'rgba(99,102,241,0.25)' },
  headerTitle: { flex: 1, textAlign: 'center', fontSize: 18, fontWeight: '900', color: '#1E1B4B' },
  setupScroll: { paddingHorizontal: 24, paddingBottom: 40 },
  hero: { alignItems: 'center', paddingVertical: 24, gap: 10 },
  heroIcon: { width: 88, height: 88, borderRadius: 28, alignItems: 'center', justifyContent: 'center', marginBottom: 4 },
  heroEmoji: { fontSize: 40 },
  heroTitle: { fontSize: 26, fontWeight: '900', color: '#1E1B4B' },
  heroSub: { fontSize: 14, color: '#6B7280', textAlign: 'center', lineHeight: 20, paddingHorizontal: 20 },
  inputSection: { marginBottom: 16, gap: 8 },
  inputLabel: { fontSize: 13, fontWeight: '700', color: '#6B7280' },
  inputWrap: { borderRadius: 16, overflow: 'hidden', borderWidth: 1.5, borderColor: 'rgba(99,102,241,0.2)' },
  input: { padding: 14, fontSize: 14, color: '#1E1B4B', fontWeight: '500' },
  createBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10, paddingVertical: 16, borderRadius: 30, overflow: 'hidden', marginBottom: 20 },
  createBtnText: { fontSize: 16, fontWeight: '700', color: '#FFFFFF' },
  divider: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 20 },
  dividerLine: { flex: 1, height: 1, backgroundColor: 'rgba(99,102,241,0.15)' },
  dividerText: { fontSize: 13, color: '#6B7280' },
  joinRow: { flexDirection: 'row', gap: 10, marginBottom: 16 },
  joinBtn: { paddingHorizontal: 20, borderRadius: 16, overflow: 'hidden', justifyContent: 'center', borderWidth: 1.5, borderColor: 'rgba(99,102,241,0.3)' },
  joinBtnText: { fontSize: 14, fontWeight: '700', color: '#6366F1' },
  statusText: { fontSize: 13, color: '#6366F1', textAlign: 'center', marginBottom: 16 },
  infoCard: { padding: 20, borderRadius: 20, overflow: 'hidden', borderWidth: 1.5, borderColor: 'rgba(99,102,241,0.15)', gap: 8 },
  infoTitle: { fontSize: 15, fontWeight: '800', color: '#1E1B4B' },
  infoText: { fontSize: 13, color: '#6B7280', lineHeight: 24 },
  // Room styles
  roomHeader: { flexDirection: 'row', alignItems: 'center', paddingTop: 56, paddingHorizontal: 20, paddingBottom: 12 },
  roomBackBtn: { width: 36, height: 36, borderRadius: 18, backgroundColor: 'rgba(255,255,255,0.1)', alignItems: 'center', justifyContent: 'center' },
  roomHeaderCenter: { flex: 1, alignItems: 'center' },
  roomTitle: { fontSize: 18, fontWeight: '900', color: '#FFFFFF', letterSpacing: 2 },
  roomMeta: { flexDirection: 'row', gap: 8, marginTop: 4 },
  hostBadge: { backgroundColor: 'rgba(250,204,21,0.2)', paddingHorizontal: 8, paddingVertical: 2, borderRadius: 8 },
  hostBadgeText: { fontSize: 10, fontWeight: '800', color: '#FCD34D' },
  membersBadge: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: 'rgba(255,255,255,0.1)', paddingHorizontal: 8, paddingVertical: 2, borderRadius: 8 },
  membersText: { fontSize: 12, color: 'rgba(255,255,255,0.7)', fontWeight: '600' },
  broadcastBtn: { width: 40, height: 40, borderRadius: 20, overflow: 'hidden', alignItems: 'center', justifyContent: 'center' },
  nowPlayingCard: { flexDirection: 'row', alignItems: 'center', gap: 12, marginHorizontal: 16, marginBottom: 8, padding: 14, borderRadius: 18, overflow: 'hidden', borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)' },
  nowPlayingInfo: { flex: 1 },
  nowPlayingTitle: { fontSize: 14, fontWeight: '700', color: '#FFFFFF', marginBottom: 2 },
  nowPlayingArtist: { fontSize: 12, color: 'rgba(255,255,255,0.6)' },
  playingDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: '#86EFAC' },
  membersRow: { maxHeight: 56, marginHorizontal: 16, marginBottom: 8 },
  membersScroll: { gap: 8, paddingVertical: 4 },
  memberChip: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 12, paddingVertical: 6, borderRadius: 16, overflow: 'hidden', borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)' },
  memberAvatar: { fontSize: 14, fontWeight: '900', color: '#818CF8' },
  memberName: { fontSize: 12, color: 'rgba(255,255,255,0.7)', maxWidth: 80 },
  chatList: { flex: 1, paddingHorizontal: 16 },
  chatContent: { paddingVertical: 8, gap: 8 },
  chatMsg: { alignItems: 'flex-start' },
  chatMsgMe: { alignItems: 'flex-end' },
  chatMsgSystem: { alignItems: 'center' },
  chatName: { fontSize: 11, color: 'rgba(255,255,255,0.4)', marginBottom: 3, paddingHorizontal: 4 },
  chatBubble: { maxWidth: width * 0.7, backgroundColor: 'rgba(255,255,255,0.1)', padding: 10, borderRadius: 16, borderBottomLeftRadius: 4 },
  chatBubbleMe: { backgroundColor: '#6366F1', borderBottomLeftRadius: 16, borderBottomRightRadius: 4 },
  chatBubbleSystem: { backgroundColor: 'rgba(255,255,255,0.05)', borderRadius: 10 },
  chatText: { fontSize: 14, color: '#FFFFFF', lineHeight: 20 },
  chatTextSystem: { fontSize: 12, color: 'rgba(255,255,255,0.4)', fontStyle: 'italic' },
  chatInputRow: { flexDirection: 'row', gap: 10, padding: 16, paddingBottom: 32 },
  chatInputWrap: { flex: 1, backgroundColor: 'rgba(255,255,255,0.08)', borderRadius: 24, borderWidth: 1, borderColor: 'rgba(255,255,255,0.15)', paddingHorizontal: 16 },
  chatInput: { paddingVertical: 12, fontSize: 14, color: '#FFFFFF' },
  sendBtn: { width: 46, height: 46, borderRadius: 23, overflow: 'hidden', alignItems: 'center', justifyContent: 'center' },
});

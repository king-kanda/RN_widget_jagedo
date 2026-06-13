import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  View,
  Text,
  FlatList,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const API_BASE = 'https://api.cloud.nexuswave.ai';
const APP_TOKEN = 'demo-token';
const SESSION_ID = 'rn-user-' + Math.random().toString(36).substr(2, 9);
const POLLING_MS = 10000;

async function apiFetchMessages() {
  const res = await fetch(`${API_BASE}/widget/getmessages/${SESSION_ID}`, {
    headers: {
      Authorization: `Bearer ${APP_TOKEN}`,
      'Content-Type': 'application/json',
    },
  });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res.json();
}

async function apiSendMessage(text) {
  const form = new FormData();
  form.append('session_id', SESSION_ID);
  form.append('message', text);
  const res = await fetch(`${API_BASE}/widget/incoming`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${APP_TOKEN}` },
    body: form,
  });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res.json();
}

function parseMessages(data) {
  if (!Array.isArray(data) || data.length === 0) return [];
  const raw = data[0]?.messages;
  if (!Array.isArray(raw)) return [];

  const flat = [];
  raw
    .slice()
    .sort((a, b) => a.dateTime - b.dateTime)
    .forEach((m) => {
      if (m.user_message) {
        flat.push({ id: `${m.id}_user`, text: String(m.user_message), role: 'user', ts: m.dateTime });
      }
      const botText = m.ai_message || m.agent_message;
      if (botText) {
        flat.push({ id: `${m.id}_bot`, text: String(botText), role: 'bot', ts: m.dateTime + 0.001 });
      }
    });
  return flat;
}

export default function ChatScreen() {
  const insets = useSafeAreaInsets();
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [sending, setSending] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const [online, setOnline] = useState(true);
  const listRef = useRef(null);
  const seenIds = useRef(new Set());

  const mergeMessages = useCallback((incoming) => {
    setMessages((prev) => {
      const next = [...prev];
      let changed = false;
      incoming.forEach((m) => {
        if (!seenIds.current.has(m.id)) {
          seenIds.current.add(m.id);
          next.push(m);
          changed = true;
        }
      });
      if (!changed) return prev;
      return next.sort((a, b) => a.ts - b.ts);
    });
  }, []);

  const loadMessages = useCallback(async () => {
    try {
      const data = await apiFetchMessages();
      mergeMessages(parseMessages(data));
      setOnline(true);
    } catch {
      setOnline(false);
    }
  }, [mergeMessages]);

  useEffect(() => {
    loadMessages();
    const timer = setInterval(loadMessages, POLLING_MS);
    return () => clearInterval(timer);
  }, [loadMessages]);

  useEffect(() => {
    if (messages.length > 0) {
      setTimeout(() => listRef.current?.scrollToEnd({ animated: true }), 100);
    }
  }, [messages.length]);

  const handleSend = async () => {
    const text = input.trim();
    if (!text || sending) return;
    setInput('');
    setSending(true);
    setIsTyping(true);
    try {
      await apiSendMessage(text);
      await loadMessages();
    } catch {
      setOnline(false);
    } finally {
      setSending(false);
      setIsTyping(false);
    }
  };

  const renderMessage = ({ item }) => {
    const isUser = item.role === 'user';
    return (
      <View style={[styles.row, isUser ? styles.rowUser : styles.rowBot]}>
        {!isUser && <View style={styles.avatar}><Text style={styles.avatarText}>🤖</Text></View>}
        <View style={[styles.bubble, isUser ? styles.bubbleUser : styles.bubbleBot]}>
          <Text style={[styles.bubbleText, isUser && styles.bubbleTextUser]}>{item.text}</Text>
        </View>
      </View>
    );
  };

  return (
    <KeyboardAvoidingView
      style={styles.root}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={0}
    >
      <View style={[styles.header, { paddingTop: insets.top + 12 }]}>
        <Text style={styles.headerSub}>Support</Text>
        <View style={styles.headerRow}>
          <Text style={styles.headerTitle}>Site Chat</Text>
          <View style={[styles.dot, { backgroundColor: online ? '#34C759' : '#FF3B30' }]} />
        </View>
      </View>

      <FlatList
        ref={listRef}
        data={messages}
        keyExtractor={(m) => m.id}
        renderItem={renderMessage}
        contentContainerStyle={styles.list}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Text style={styles.emptyText}>💬  Send a message to get started</Text>
          </View>
        }
        ListFooterComponent={
          isTyping ? (
            <View style={[styles.row, styles.rowBot]}>
              <View style={styles.avatar}><Text style={styles.avatarText}>🤖</Text></View>
              <View style={[styles.bubble, styles.bubbleBot, styles.typingBubble]}>
                <ActivityIndicator size="small" color="#8E8E93" />
              </View>
            </View>
          ) : null
        }
      />

      <View style={[styles.inputBar, { paddingBottom: insets.bottom + 8 }]}>
        <TextInput
          style={styles.textInput}
          value={input}
          onChangeText={setInput}
          placeholder="Type a message…"
          placeholderTextColor="#8E8E93"
          multiline
          maxLength={1000}
          returnKeyType="send"
          onSubmitEditing={handleSend}
          blurOnSubmit={false}
          editable={!sending}
        />
        <TouchableOpacity
          style={[styles.sendBtn, (!input.trim() || sending) && styles.sendBtnDisabled]}
          onPress={handleSend}
          disabled={!input.trim() || sending}
        >
          <Text style={styles.sendIcon}>▶</Text>
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#F2F2F7' },
  header: {
    backgroundColor: '#1C1C1E',
    paddingBottom: 20,
    paddingHorizontal: 20,
  },
  headerSub: { color: '#8E8E93', fontSize: 13, marginBottom: 4 },
  headerRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  headerTitle: { color: '#FFFFFF', fontSize: 26, fontWeight: '700' },
  dot: { width: 10, height: 10, borderRadius: 5, marginTop: 2 },
  list: { padding: 16, paddingBottom: 8 },
  empty: { flex: 1, alignItems: 'center', marginTop: 60 },
  emptyText: { color: '#8E8E93', fontSize: 15 },
  row: { flexDirection: 'row', alignItems: 'flex-end', marginBottom: 12, maxWidth: '80%' },
  rowUser: { alignSelf: 'flex-end', flexDirection: 'row-reverse' },
  rowBot: { alignSelf: 'flex-start' },
  avatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#E5E5EA',
    alignItems: 'center',
    justifyContent: 'center',
    marginHorizontal: 6,
  },
  avatarText: { fontSize: 16 },
  bubble: {
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 18,
    maxWidth: '100%',
  },
  bubbleUser: {
    backgroundColor: '#6452DF',
    borderBottomRightRadius: 4,
  },
  bubbleBot: {
    backgroundColor: '#FFFFFF',
    borderBottomLeftRadius: 4,
    shadowColor: '#000',
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 1,
  },
  typingBubble: { paddingHorizontal: 16, paddingVertical: 12 },
  bubbleText: { fontSize: 15, color: '#1C1C1E', lineHeight: 21 },
  bubbleTextUser: { color: '#FFFFFF' },
  inputBar: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    paddingHorizontal: 12,
    paddingTop: 10,
    backgroundColor: '#FFFFFF',
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: '#D1D1D6',
    gap: 8,
  },
  textInput: {
    flex: 1,
    minHeight: 40,
    maxHeight: 120,
    backgroundColor: '#F2F2F7',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 10,
    fontSize: 15,
    color: '#1C1C1E',
  },
  sendBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#6452DF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  sendBtnDisabled: { backgroundColor: '#C7C7CC' },
  sendIcon: { color: '#FFFFFF', fontSize: 16, marginLeft: 2 },
});

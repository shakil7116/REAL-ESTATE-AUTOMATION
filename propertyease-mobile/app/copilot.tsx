/**
 * CopilotScreen — PropertyEase AI chat assistant.
 *
 * Sends messages to POST /api/copilot with auth token.
 * Falls back to a placeholder when the API is unavailable or no OpenAI key is configured.
 * Unlike previous versions, the fallback no longer fabricates portfolio numbers —
 * those must come from the real API to avoid misleading users (see SPRINT item #3).
 */
import { useRef, useState } from 'react';
import {
  StyleSheet, Text, View, ScrollView, TextInput, TouchableOpacity,
  KeyboardAvoidingView, Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { getToken } from '../lib/session';
import { t } from '../lib/i18n';
import {
  PRIMARY, CORAL, WORKSPACE_BG, SLATE_500, SLATE_700, SLATE_200, SLATE_300, SLATE_600, EMERALD_500,
} from './colors';

interface ChatMessage {
  role: 'user' | 'assistant';
  text: string;
  time?: string;
}

const API_BASE = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:3000';

// DEMO_RESPONSES removed entirely (2026-09-09). The app now falls back to a
// single transparent connectivity message — never pre-written text that looks
// like a real Copilot reply. This prevents users from acting on fabricated data.

const QUICK_PROMPTS = [
  { label: 'copilot.collectRent', prompt: 'Show rent collection status' },
  { label: 'copilot.maintenance', prompt: 'Check maintenance tickets' },
  { label: 'copilot.expiringLeases', prompt: 'Show leases expiring soon' },
  { label: 'copilot.insights', prompt: 'What should I focus on today?' },
];

export default function CopilotScreen() {
  const [messages, setMessages] = useState<ChatMessage[]>([{
    role: 'assistant',
    text: t('copilot.welcome'),
    time: 'Just now',
  }]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const inputRef = useRef<TextInput>(null);
  const scrollRef = useRef<ScrollView>(null);

  const sendMessage = async (text: string) => {
    if (!text.trim() || isTyping) return;
    const userMsg: ChatMessage = { role: 'user', text, time: 'Just now' };
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setIsTyping(true);

    try {
      const token = await getToken();
      const res = await fetch(`${API_BASE}/api/copilot`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
          messages: [...messages, userMsg].map(m => ({ role: m.role, content: m.text })),
        }),
      });
      const json = await res.json();
      if (json.ok && json.data?.reply) {
        setMessages(prev => [...prev, { role: 'assistant', text: json.data.reply, time: 'Just now' }]);
        setIsTyping(false);
        return;
      }
      // Server returned error — surface it directly
      setMessages(prev => [...prev, {
        role: 'assistant',
        text: json.error?.message || t('copilot.insightsUnavailable'),
        time: 'Just now',
      }]);
    } catch {
      // Network unreachable — show a single transparent fallback, never a fake reply
      setTimeout(() => {
        setMessages(prev => [...prev, {
          role: 'assistant',
          text: t('copilot.insightsUnavailable'),
          time: 'Just now',
        }]);
        setIsTyping(false);
      }, 400);
    }
  };

  return (
    <SafeAreaView style={styles.root} edges={['top', 'bottom']}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <View style={styles.copilotAvatar}>
            <Text style={styles.copilotAvatarText}>AI</Text>
          </View>
          <View>
            <Text style={styles.headerTitle}>{t('copilot.title')}</Text>
            <View style={styles.onlineRow}>
              <View style={styles.onlineDot} />
              <Text style={styles.onlineText}>{t('settings.online')}</Text>
            </View>
          </View>
        </View>
      </View>

      <ScrollView
        ref={scrollRef}
        style={styles.messagesScroll}
        contentContainerStyle={styles.messagesContainer}
        onContentSizeChange={() => scrollRef.current?.scrollToEnd({ animated: true })}
      >
        {/* Portfolio pulse card */}
        <View style={styles.pulseCard}>
          <Text style={styles.pulseTitle}>{t('copilot.portfolioPulse')}</Text>
          <View style={styles.pulseStats}>
            {[
              { label: 'copilot.revenue', value: '—' },
              { label: 'copilot.occupancy', value: '—' },
              { label: 'copilot.openTickets', value: '—' },
              { label: 'copilot.newLeads', value: '—' },
            ].map((s, i) => (
              <View key={i} style={styles.pulseStat}>
                <Text style={styles.pulseStatValue}>{s.value}</Text>
                <Text style={styles.pulseStatLabel}>{s.label}</Text>
              </View>
            ))}
          </View>
        </View>

        {/* Messages */}
        {messages.map((msg, i) => (
          <View
            key={i}
            style={[
              styles.messageBubble,
              msg.role === 'user' ? styles.userBubble : styles.assistantBubble,
              msg.role === 'user' ? styles.userBubbleAlign : styles.assistantBubbleAlign,
            ]}
          >
            {msg.role === 'assistant' && (
              <Text style={styles.messageSender}>✨ Copilot</Text>
            )}
            <Text style={[styles.messageText, msg.role === 'user' ? styles.userMessageText : styles.assistantMessageText]}>
              {msg.text}
            </Text>
          </View>
        ))}

        {isTyping && (
          <View style={[styles.messageBubble, styles.assistantBubble, styles.assistantBubbleAlign]}>
            <View style={styles.typingDots}>
              <View style={styles.typingDot} />
              <View style={styles.typingDot} />
              <View style={styles.typingDot} />
            </View>
          </View>
        )}
      </ScrollView>

      {/* Quick prompts */}
      <View style={styles.quickPrompts}>
        {QUICK_PROMPTS.map((qp, i) => (
          <TouchableOpacity
            key={i}
            style={styles.quickPromptChip}
            onPress={() => sendMessage(qp.prompt)}
          >
            <Text style={styles.quickPromptText}>{t(qp.label)}</Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Input */}
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
      >
        <View style={styles.inputRow}>
          <TextInput
            ref={inputRef}
            value={input}
            onChangeText={setInput}
            placeholder="Ask Copilot anything..."
            placeholderTextColor={SLATE_500}
            style={styles.input}
            multiline
            maxLength={500}
            onSubmitEditing={() => { sendMessage(input); inputRef.current?.clear(); }}
          />
          <TouchableOpacity
            style={[styles.sendBtn, !input.trim() && styles.sendBtnDisabled]}
            onPress={() => { sendMessage(input); inputRef.current?.clear(); }}
          >
            <Text style={styles.sendBtnText}>↑</Text>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: WORKSPACE_BG },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 16,
    backgroundColor: WORKSPACE_BG,
    borderBottomWidth: 1,
    borderBottomColor: SLATE_200,
  },
  headerLeft: { flexDirection: 'row', alignItems: 'center' },
  copilotAvatar: {
    width: 40, height: 40, borderRadius: 12, backgroundColor: PRIMARY,
    alignItems: 'center', justifyContent: 'center', marginRight: 10,
  },
  copilotAvatarText: { color: CORAL, fontSize: 12, fontWeight: '800' },
  headerTitle: { fontSize: 15, fontWeight: '800', color: SLATE_700 },
  onlineRow: { flexDirection: 'row', alignItems: 'center', marginTop: 2 },
  onlineDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: EMERALD_500, marginRight: 5 },
  onlineText: { fontSize: 11, color: SLATE_500, fontWeight: '600' },
  messagesScroll: { flex: 1 },
  messagesContainer: { padding: 16, paddingBottom: 8 },
  pulseCard: {
    backgroundColor: PRIMARY,
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
  },
  pulseTitle: { fontSize: 12, fontWeight: '700', color: '#8EA499', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 12 },
  pulseStats: { flexDirection: 'row', justifyContent: 'space-around' },
  pulseStat: { alignItems: 'center' },
  pulseStatValue: { fontSize: 16, fontWeight: '800', color: '#fff' },
  pulseStatLabel: { fontSize: 10, color: '#8EA499', fontWeight: '600', marginTop: 2 },
  messageBubble: { maxWidth: '85%', borderRadius: 16, padding: 14, marginBottom: 8 },
  userBubble: { backgroundColor: PRIMARY },
  assistantBubble: { backgroundColor: '#fff', borderWidth: 1, borderColor: SLATE_200 },
  userBubbleAlign: { alignSelf: 'flex-end', borderBottomRightRadius: 4 },
  assistantBubbleAlign: { alignSelf: 'flex-start', borderBottomLeftRadius: 4 },
  messageSender: { fontSize: 10, fontWeight: '700', color: CORAL, marginBottom: 4 },
  messageText: { fontSize: 13, lineHeight: 19 },
  userMessageText: { color: '#fff' },
  assistantMessageText: { color: SLATE_700 },
  typingDots: { flexDirection: 'row', gap: 4, paddingVertical: 4 },
  typingDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: SLATE_300 },
  quickPrompts: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: SLATE_200,
  },
  quickPromptChip: {
    backgroundColor: WORKSPACE_BG,
    borderWidth: 1,
    borderColor: SLATE_200,
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  quickPromptText: { fontSize: 12, fontWeight: '600', color: SLATE_600 },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: Platform.OS === 'ios' ? 28 : 12,
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: SLATE_200,
  },
  input: {
    flex: 1,
    backgroundColor: WORKSPACE_BG,
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 10,
    fontSize: 14,
    color: SLATE_700,
    maxHeight: 100,
    borderWidth: 1,
    borderColor: SLATE_200,
    textAlignVertical: 'top',
  },
  sendBtn: {
    width: 44, height: 44, borderRadius: 12, backgroundColor: PRIMARY,
    alignItems: 'center', justifyContent: 'center', marginLeft: 8, marginBottom: 2,
  },
  sendBtnDisabled: { backgroundColor: SLATE_200 },
  sendBtnText: { color: '#fff', fontSize: 20, fontWeight: '700', lineHeight: 1 },
});

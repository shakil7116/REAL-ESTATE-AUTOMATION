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

// DEMO_RESPONSES removed: they contained fabricated portfolio numbers (e.g. "QAR 228,360",
// "18 open tickets") that do not match live data and risk misleading users into acting
// on false figures. When the real /api/copilot endpoint is unreachable, we return a
// transparent fallback instead of pretending to know the numbers.
const DEMO_RESPONSES: Record<string, string> = {
  collect: "The rent-collection data is unavailable right now. Please connect to the network and try again.",
  maintenance: "Maintenance status is currently unavailable. Please check your connection and retry.",
  lease: "Lease information is currently unavailable. Please check your connection and retry.",
  insights: "Portfolio insights require a live connection to the PropertyEase API. Please try again later.",
  default: "I'm here to help manage your portfolio. Ask me about rent collection, maintenance, leases, or get AI-powered insights.",
};

const QUICK_PROMPTS = [
  { label: 'collectRent', prompt: 'Show rent collection status' },
  { label: 'maintenance', prompt: 'Check maintenance tickets' },
  { label: 'expiringLeases', prompt: 'Show leases expiring soon' },
  { label: 'insights', prompt: 'What should I focus on today?' },
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

  const classify = (text: string): string => {
    const lower = text.toLowerCase();
    if (lower.includes('rent') || lower.includes('payment') || lower.includes('collect')) return 'collect';
    if (lower.includes('maint') || lower.includes('repair') || lower.includes('ticket')) return 'maintenance';
    if (lower.includes('lease') || lower.includes('expir')) return 'lease';
    if (lower.includes('insight') || lower.includes('focus') || lower.includes('today')) return 'insights';
    return 'default';
  };

  const sendMessage = async (text: string) => {
    if (!text.trim() || isTyping) return;
    const userMsg: ChatMessage = { role: 'user', text, time: 'Just now' };
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setIsTyping(true);

    const responseKey = classify(text);

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
    } catch {
      // Network error — fall through to demo response below
    }

    // Fallback to demo responses
    setTimeout(() => {
      setMessages(prev => [...prev, { role: 'assistant', text: DEMO_RESPONSES[responseKey], time: 'Just now' }]);
      setIsTyping(false);
    }, 600);
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
              { label: 'Revenue', value: '—' },
              { label: 'Occupancy', value: '—' },
              { label: 'Open Tickets', value: '—' },
              { label: 'New Leads', value: '—' },
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
            <Text style={styles.quickPromptText}>{qp.label}</Text>
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

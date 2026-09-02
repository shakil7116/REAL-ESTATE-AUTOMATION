/**
 * GlobalCopilot — floating Copilot available on every page.
 *
 * Layout:
 *  - Mobile (<lg): true overlay, full-screen sheet.
 *  - Desktop (>=lg): right-anchored panel that takes the right 1/3 of
 *    (viewport - 240px), full viewport height. The page behind shrinks
 *    to the left 2/3 (push layout, handled in (dashboard)/layout.tsx).
 *    The page is fully visible, no backdrop dimming, no scroll lock —
 *    users can keep reading/scrolling the page while Copilot is open.
 *
 * Triggers: floating pill (bottom-right), header CopilotOpenButton, ⌘J.
 *
 * Voice: Web Speech API. Best support in Chrome/Edge.
 */
'use client';

import { useEffect, useRef, useState } from 'react';
import { Sparkles, X, Mic, MicOff, Send, ChevronRight, Loader2 } from 'lucide-react';

// Web Speech API types (not in default lib.dom)
type SR = any;
declare global {
  interface Window {
    SpeechRecognition?: SR;
    webkitSpeechRecognition?: SR;
  }
}

export interface GlobalCopilotProps {
  lang: 'en' | 'ar';
}

interface Message {
  id: number;
  role: 'user' | 'assistant' | 'system';
  text: string;
  ts: number;
}

const SUGGESTIONS_EN = [
  'Which leases expire this quarter?',
  'Show me last month\'s collections',
  'Any urgent maintenance tickets?',
  'Best-performing campaign this week?',
];
const SUGGESTIONS_AR = [
  'أي عقود تنتهي هذا الربع؟',
  'أظهر لي تحصيلات الشهر الماضي',
  'هل توجد تذاكر صيانة عاجلة؟',
  'أفضل حملة هذا الأسبوع؟',
];

const TYPING_DELAY = 450; // ms per "word" feel

export default function GlobalCopilot({ lang }: GlobalCopilotProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState<Message[]>([]);
  const [isTyping, setIsTyping] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [voiceSupported, setVoiceSupported] = useState(true);
  const recognitionRef = useRef<any>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const isRtl = lang === 'ar';

  // ── Cmd/Ctrl+J to toggle ───────────────────────────────────────────
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'j') {
        e.preventDefault();
        setIsOpen(prev => {
          const next = !prev;
          window.dispatchEvent(new CustomEvent(next ? 'pe:copilot:open' : 'pe:copilot:close'));
          return next;
        });
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  // ── External open trigger (header Copilot button) ─────────────────
  useEffect(() => {
    const onOpen = () => setIsOpen(true);
    window.addEventListener('pe:copilot:open', onOpen as EventListener);
    return () => window.removeEventListener('pe:copilot:open', onOpen as EventListener);
  }, []);

  // ── Broadcast close so the layout can drop the right gutter ───────
  useEffect(() => {
    if (!isOpen) {
      window.dispatchEvent(new CustomEvent('pe:copilot:close'));
    }
  }, [isOpen]);

  // ── Voice: Web Speech API ──────────────────────────────────────────
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SR) {
      setVoiceSupported(false);
      return;
    }
    const rec = new SR();
    rec.continuous = false;
    rec.interimResults = false;
    rec.lang = lang === 'ar' ? 'ar-QA' : 'en-QA';
    rec.onresult = (e: any) => {
      const transcript = e.results[0][0].transcript as string;
      setInput(transcript);
      setIsListening(false);
    };
    rec.onerror = () => setIsListening(false);
    rec.onend = () => setIsListening(false);
    recognitionRef.current = rec;
    return () => { try { rec.stop(); } catch {} };
  }, [lang]);

  const toggleVoice = () => {
    if (!voiceSupported || !recognitionRef.current) return;
    if (isListening) {
      recognitionRef.current.stop();
      setIsListening(false);
    } else {
      try {
        recognitionRef.current.start();
        setIsListening(true);
      } catch {
        setIsListening(false);
      }
    }
  };

  // No backdrop, no body-scroll lock — the page behind stays fully visible
  // and interactable so users can scroll the page while Copilot is open.
  // ESC still closes.
  useEffect(() => {
    if (!isOpen) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') setIsOpen(false); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [isOpen]);

  // ── Auto-scroll on new message ─────────────────────────────────────
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isTyping]);

  // ── Send ───────────────────────────────────────────────────────────
  const send = (text: string) => {
    const trimmed = text.trim();
    if (!trimmed) return;
    const userMsg: Message = { id: Date.now(), role: 'user', text: trimmed, ts: Date.now() };
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setIsTyping(true);
    // Stub response — real LLM call wires in via /api/copilot later.
    const responses = lang === 'ar'
      ? [
          'تم استلام سؤالك. سأبحث في بيانات محفظتك عن أفضل إجابة.',
          'هذا السؤال يحتاج إذنًا للوصول إلى البيانات. هل تريد المتابعة؟',
          'بناءً على آخر تحديث: لا توجد تنبيهات عاجلة في محفظتك الآن.',
        ]
      : [
          'Got it — let me look that up across your portfolio.',
          'I\'ll need a moment to check the latest data. One sec.',
          'Based on the last sync: no urgent items in your portfolio right now.',
        ];
    setTimeout(() => {
      const reply = responses[Math.floor(Math.random() * responses.length)]!;
      setMessages(prev => [...prev, { id: Date.now() + 1, role: 'assistant', text: reply, ts: Date.now() }]);
      setIsTyping(false);
    }, TYPING_DELAY + trimmed.length * 12);
  };

  const suggestions = lang === 'ar' ? SUGGESTIONS_AR : SUGGESTIONS_EN;
  const t = (en: string, ar: string) => lang === 'ar' ? ar : en;

  return (
    <>
      {/* ─── Floating trigger pill (bottom-right, always visible when closed) ─── */}
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className={[
            'fixed bottom-5 z-40 group flex items-center gap-2',
            isRtl ? 'left-5' : 'right-5',
            'bg-[#132B25] hover:bg-[#1A3831] text-white rounded-full py-3 shadow-2xl transition-all ps-4 pe-5 py-3 shadow-2xl transition-all',
          ].join(' ')}
          aria-label={t('Open Copilot', 'فتح المساعد')}
        >
          <Sparkles className="w-4 h-4 text-[#D97757] group-hover:scale-110 transition-transform" />
          <span className="text-xs font-bold tracking-wide">
            {t('Ask Copilot', 'اسأل المساعد')}
          </span>
          <kbd className="hidden sm:inline-block bg-white/10 border border-white/20 text-[10px] font-mono px-1.5 py-0.5 rounded-md ms-1">⌘J</kbd>
        </button>
      )}

      {/* ─── Panel: full-screen sheet on mobile, right-third docked column on >=lg ─── */}
      {/* On lg+ the panel is a right-anchored, full-height column taking the right
          1/3 of (viewport - 240px). The page behind it is fully visible — no
          backdrop, no dimming — and the main content is pushed left by the
          layout's `lg:ml-[calc(...)]` to make room. */}
      <aside
        dir={isRtl ? 'rtl' : 'ltr'}
        role="dialog"
        aria-modal="false"
        aria-label="PropertyEase Copilot"
        aria-hidden={!isOpen}
        className={[
          'fixed z-50 flex flex-col bg-white shadow-2xl border-slate-200 overflow-hidden',
          // Mobile: full-screen bottom sheet
          'inset-0 sm:inset-y-0 sm:inset-x-auto',
          // >=lg: right-anchored docked column, right 1/3 of (viewport - 240px)
          // Width = (100vw - 240px) / 3. Use calc with vw. Direction-aware
          // (anchored to right edge in LTR, left edge in RTL).
          isRtl
            ? 'lg:left-[240px] lg:right-auto lg:w-[calc((100vw_-_240px)_/_3)]'
            : 'lg:right-0 lg:left-auto lg:w-[calc((100vw_-_240px)_/_3)]',
          'lg:border-s',
          'transition-transform duration-300 ease-out',
          isOpen
            ? 'translate-x-0'
            : (isRtl ? '-translate-x-full' : 'translate-x-full'),
        ].join(' ')}
      >
        {/* Header */}
        <div className="bg-[#132B25] px-5 py-4 text-white flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-white/10 border border-white/20 flex items-center justify-center">
              <Sparkles className="w-5 h-5 text-[#D97757]" />
            </div>
            <div>
              <div className="font-bold text-sm tracking-tight">PropertyEase Copilot</div>
              <div className="text-[11px] text-slate-300 flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                {t('Online — Portfolio Live', 'متصل — محفظتك مباشرة')}
              </div>
            </div>
          </div>
          <button
            onClick={() => setIsOpen(false)}
            className="p-1.5 hover:bg-white/10 rounded-lg text-slate-300 hover:text-white transition-colors"
            aria-label="Close Copilot"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Conversation */}
        <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-3 bg-slate-50/50 min-h-0">
          {messages.length === 0 && !isTyping && (
            <div className="space-y-4 py-4">
              <div className="text-center px-4">
                <div className="w-12 h-12 rounded-2xl bg-[#132B25] flex items-center justify-center mx-auto mb-3">
                  <Sparkles className="w-6 h-6 text-[#D97757]" />
                </div>
                <p className="text-sm font-bold text-slate-900">
                  {t('How can I help today?', 'كيف أساعدك اليوم؟')}
                </p>
                <p className="text-xs text-slate-500 mt-1">
                  {t('Ask about your portfolio, leases, maintenance, or marketing.', 'اسأل عن محفظتك أو عقودك أو صيانتك أو تسويقك.')}
                </p>
              </div>
              <div>
                <div className="text-[10px] font-extrabold uppercase tracking-widest text-slate-400 px-1 mb-2">
                  {t('Try asking', 'جرّب السؤال')}
                </div>
                <div className="space-y-1.5">
                  {suggestions.map((s, i) => (
                    <button
                      key={i}
                      onClick={() => send(s)}
                      className="w-full p-start p-3 bg-white border border-slate-200 rounded-xl text-xs text-slate-700 hover:border-[#D97757] hover:bg-orange-50/30 transition-colors flex items-center justify-between gap-2 group"
                    >
                      <span className="font-medium">{s}</span>
                      <ChevronRight className={['w-3.5 h-3.5 text-slate-300 group-hover:text-[#D97757]', isRtl ? 'rotate-180' : ''].join(' ')} />
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {messages.map(m => (
            <div
              key={m.id}
              className={['flex', m.role === 'user' ? 'justify-end' : 'justify-start'].join(' ')}
            >
              <div
                className={[
                  'max-w-[88%] rounded-2xl px-3.5 py-2.5 text-sm leading-relaxed',
                  m.role === 'user'
                    ? 'bg-[#D97757] text-white rounded-br-md'
                    : 'bg-white border border-slate-200 text-slate-800 rounded-bl-md',
                ].join(' ')}
              >
                {m.text}
              </div>
            </div>
          ))}

          {isTyping && (
            <div className="flex justify-start">
              <div className="bg-white border border-slate-200 rounded-2xl rounded-bl-md px-4 py-3 flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-slate-400 animate-bounce" style={{ animationDelay: '0ms' }} />
                <span className="w-1.5 h-1.5 rounded-full bg-slate-400 animate-bounce" style={{ animationDelay: '150ms' }} />
                <span className="w-1.5 h-1.5 rounded-full bg-slate-400 animate-bounce" style={{ animationDelay: '300ms' }} />
              </div>
            </div>
          )}
        </div>

        {/* Input */}
        <div className="p-3 bg-white border-t border-slate-200 shrink-0">
          <div className="flex items-center gap-2 bg-slate-50 rounded-xl px-3 py-2.5 border border-slate-200 focus-within:border-[#132B25] focus-within:bg-white transition-all">
            {voiceSupported && (
              <button
                onClick={toggleVoice}
                title={isListening ? t('Stop listening', 'إيقاف الاستماع') : t('Voice input', 'الإدخال الصوتي')}
                className={[
                  'w-7 h-7 rounded-lg flex items-center justify-center transition-colors shrink-0',
                  isListening ? 'bg-rose-100 text-rose-600 animate-pulse' : 'text-slate-500 hover:bg-slate-200',
                ].join(' ')}
                aria-label={isListening ? 'Stop listening' : 'Start voice input'}
              >
                {isListening ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
              </button>
            )}
            <input
              type="text"
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter') send(input); }}
              placeholder={
                isListening
                  ? t('Listening…', 'أستمع…')
                  : t('Ask Copilot anything…', 'اسأل المساعد أي شيء…')
              }
              className="w-full bg-transparent text-sm text-slate-900 placeholder:text-slate-400 outline-none"
            />
            <button
              onClick={() => send(input)}
              disabled={!input.trim() || isTyping}
              className="w-8 h-8 bg-[#132B25] text-white rounded-lg flex items-center justify-center hover:bg-[#1A3831] transition-colors disabled:opacity-40 disabled:cursor-not-allowed shrink-0"
              aria-label="Send"
            >
              {isTyping ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
            </button>
          </div>
          {!voiceSupported && (
            <p className="text-[10px] text-slate-400 mt-1.5 px-1">
              {t('Voice input not supported in this browser. Try Chrome or Edge.', 'الإدخال الصوتي غير مدعوم في هذا المتصفح. جرّب كروم أو إيدج.')}
            </p>
          )}
          {isListening && (
            <div className="flex items-center gap-2 mt-2 text-xs text-rose-600 font-semibold px-1">
              <span className="w-2 h-2 rounded-full bg-rose-500 animate-pulse" />
              {t('Listening — speak now', 'أستمع — تحدث الآن')}
            </div>
          )}
        </div>
      </aside>
    </>
  );
}

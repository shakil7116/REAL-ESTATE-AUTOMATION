'use client';

import { useState, useEffect, useRef } from 'react';
import {
  Sparkles,
  X,
  User,
  Wrench,
  Mail,
  Target,
  Mic,
  Image as ImageIcon,
  ArrowUpRight,
  ShieldCheck,
  Bot,
  TrendingUp,
  DollarSign,
  Home,
  AlertCircle,
  Zap,
  Clock,
  CheckCircle2,
  Brain,
  BarChart3,
  FileCheck,
  ArrowRight,
} from 'lucide-react';

interface CopilotPanelProps {
  lang?: 'en' | 'ar';
  onClose?: () => void;
  isFloating?: boolean;
}

// Live portfolio data (would come from Supabase in production)
const portfolioData = {
  totalRevenue: 'QAR 2,756,000',
  pendingRent: 'QAR 62,480',
  activeLeases: 142,
  expiringLeases: 18,
  openTickets: 18,
  urgentTickets: 2,
  occupancy: '93.4%',
  monthlyTrend: '+12.4%',
  newLeads: 72,
  costPerLead: 'QAR 154',
};

// Quick actions with smart results
const quickActions = [
  { id: 'collect-rent', label: 'Collect Rent', icon: DollarSign, prompt: 'Show rent collection status', color: 'text-emerald-600' },
  { id: 'dispatch', label: 'Dispatch Repair', icon: Wrench, prompt: 'Dispatch maintenance team', color: 'text-amber-600' },
  { id: 'approve-lease', label: 'Approve Lease', icon: FileCheck, prompt: 'Show leases pending approval', color: 'text-sky-600' },
  { id: 'lead-followup', label: 'Follow Up Leads', icon: User, prompt: 'List leads needing follow-up', color: 'text-rose-600' },
  { id: 'run-report', label: 'Run Report', icon: BarChart3, prompt: 'Generate monthly performance report', color: 'text-[#D97757]' },
  { id: 'ai-insights', label: 'AI Insights', icon: Brain, prompt: 'What should I focus on today?', color: 'text-purple-600' },
];

const aiInsights = [
  { type: 'warning', icon: AlertCircle, text: '2 urgent maintenance tickets need immediate attention in Palm Residence', color: 'text-rose-600', bg: 'bg-rose-50 border-rose-200' },
  { type: 'opportunity', icon: TrendingUp, text: 'Marina Tower occupancy hit 93.7% — 2 units available for re-letting', color: 'text-emerald-600', bg: 'bg-emerald-50 border-emerald-200' },
  { type: 'financial', icon: DollarSign, text: 'QAR 62,480 rent pending — 5 tenants with overdue payments', color: 'text-amber-600', bg: 'bg-amber-50 border-amber-200' },
  { type: 'compliance', icon: CheckCircle2, text: '18 leases expiring within 90 days — renewal reminders auto-scheduled', color: 'text-sky-600', bg: 'bg-sky-50 border-sky-200' },
];

const demoResponses: Record<string, string> = {
  leasing: "📋 **Leasing Status**: 142 active contracts, 18 expiring within 90 days.\n\n• Palm Residence — 44/48 units occupied (91.6%)\n• Marina Tower — 30/32 units occupied (93.7%)\n• Business Hub — 17/20 units occupied (85.0%)\n• Al Nahda — 56/60 units occupied (93.3%)\n\n2 units available: Marina Tower 7C (Studio, QAR 55K) & Business Hub 3A (Office, QAR 45K). Want me to list them?",
  maintenance: "🔧 **Maintenance Dashboard**: 18 open work orders, 2 urgent.\n\n**Urgent:**\n• Elevator B sensor — Business Hub Plaza (1 day)\n• Water leakage — Palm Residence 12A (2h)\n\n**In Progress:** 4 tickets\n**Resolved Today:** 3 tickets\n\nAvg resolution: 4.2 hours. Auto-dispatch assigned 85% of tickets to verified contractors. Ready to dispatch a team?",
  finance: "💰 **Finance Overview**:\n\n• Revenue YTD: {totalRevenue}\n• Pending rent: {pendingRent} (5 tenants)\n• Overdue > 7 days: {overdue}\n• Auto-reminders sent today: 5\n\nQuick actions:\n1. Send payment reminders to all overdue tenants\n2. Generate invoice batch for upcoming leases\n3. Download QAR cash flow report",
  marketing: "📢 **Marketing Performance**:\n\n• Total leads this month: 72\n• Avg cost per lead: {cpl}\n• Active campaigns: 3\n• Best performer: Al Nahda (QAR 89 CPL, 28 leads)\n\nMeta Ads driving 40% of leads. Google Ads showing highest conversion rate at 18%. Want me to reallocate budget from underperforming campaigns?",
  default: "I've analyzed your portfolio data. Here are my top recommendations:\n\n1. **Focus on Business Hub Plaza** — 15% vacancy is above portfolio average. Consider reducing rent by 3% or adding furnished options.\n\n2. **Renew 18 upcoming leases** — Start outreach 60 days before expiry. I can draft personalized renewal emails.\n\n3. **Close 2 empty units** — Marina Tower 7C and Business Hub 3A are vacant. I've listed them on Bayut & Property Finder.\n\n4. **Urgent maintenance** — 2 tickets need same-day attention. Shall I auto-dispatch contractors?",
};

export default function CopilotPanel({ lang = 'en', onClose, isFloating = false }: CopilotPanelProps) {
  const isRtl = lang === 'ar';
  const [messages, setMessages] = useState<Array<{ role: 'user' | 'assistant'; text: string; time?: string; type?: string }>>([]);
  const [inputVal, setInputVal] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [activeCategory, setActiveCategory] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isTyping]);

  // Initial welcome message
  useEffect(() => {
    if (messages.length === 0) {
      setTimeout(() => {
        setMessages([{
          role: 'assistant',
          text: lang === 'en'
            ? "👋 Hello! I'm your PropertyEase Copilot. I can help with leasing, maintenance, finance & marketing. What would you like to do today?"
            : "👋 مرحباً! أنا مساعدك العقاري. يمكنني مساعدتك في التأجير والصيانة والمالية والتسويق. ماذا تود أن تفعل اليوم؟",
          time: 'Just now',
          type: 'welcome'
        }]);
      }, 300);
    }
  }, []);

  const handleSend = async (textToSend?: string) => {
    const query = textToSend || inputVal;
    if (!query.trim()) return;

    setMessages(prev => [...prev, { role: 'user', text: query, time: 'Just now' }]);
    if (!textToSend) setInputVal('');
    setIsTyping(true);

    try {
      // Send full messages history (last 6 exchanges) so AI has context
      const historyForApi = messages.length > 0
        ? messages.slice(-12)
        : [];

      const res = await fetch('/api/copilot', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: [
            ...historyForApi.map(m => ({ role: m.role, content: m.text })),
            { role: 'user', content: query },
          ],
        }),
      });

      const data = await res.json() as { reply: string };
      setMessages(prev => [...prev, { role: 'assistant', text: data.reply ?? '', time: 'Just now', type: 'ai' }]);
    } catch (err) {
      console.error('[CopilotPanel] Failed to get AI response:', err);
      setMessages(prev => [...prev, { role: 'assistant', text: 'Sorry, something went wrong. Please try again.', time: 'Just now', type: 'error' }]);
    } finally {
      setIsTyping(false);
    }
  };

  return (
    <div
      className={`bg-white rounded-2xl border border-slate-200 shadow-xl overflow-hidden flex flex-col ${
        isFloating ? 'w-full max-w-md h-[620px] fixed bottom-6 right-6 z-50 animate-fade-in' : 'w-full h-full'
      }`}
      dir={isRtl ? 'rtl' : 'ltr'}
    >
      {/* Header */}
      <div className="bg-[#132B25] p-4 text-white flex items-center justify-between shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-white/10 border border-white/20 flex items-center justify-center">
            <Sparkles className="w-5 h-5 text-[#D97757]" />
          </div>
          <div>
            <div className="font-bold text-sm tracking-tight">PropertyEase Copilot</div>
            <div className="text-[11px] text-slate-300 flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
              {lang === 'en' ? 'Online — Portfolio Live' : 'متصل — محفظتك مباشرة'}
            </div>
          </div>
        </div>

        {onClose && (
          <button
            onClick={onClose}
            className="p-1.5 hover:bg-white/10 rounded-lg text-slate-300 hover:text-white transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      <div className="flex flex-1 overflow-hidden">
        {/* Main Chat Area */}
        <div className="flex-1 flex flex-col overflow-hidden">
          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-slate-50/50">

            {/* Portfolio Pulse Card */}
            <div className="bg-gradient-to-r from-[#132B25] to-[#1A3831] rounded-xl p-3 text-white">
              <div className="flex items-center gap-2 mb-2">
                <Zap className="w-3.5 h-3.5 text-[#D97757]" />
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-300">
                  {lang === 'en' ? 'Portfolio Pulse' : 'نبض المحفظة'}
                </span>
              </div>
              <div className="grid grid-cols-4 gap-2 text-center">
                {[
                  { label: 'Revenue', value: portfolioData.totalRevenue.replace(/AED|QAR|\s/g, '') },
                  { label: 'Occupancy', value: portfolioData.occupancy },
                  { label: 'Open Tickets', value: `${portfolioData.openTickets}` },
                  { label: 'Leads', value: `${portfolioData.newLeads}` },
                ].map((k) => (
                  <div key={k.label}>
                    <div className="text-sm font-extrabold">{k.value}</div>
                    <div className="text-[9px] text-slate-400">{k.label}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* AI Insights */}
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Brain className="w-3.5 h-3.5 text-purple-500" />
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                  {lang === 'en' ? 'AI Insights' : 'رؤى الذكاء الاصطناعي'}
                </span>
              </div>
              {aiInsights.map((insight, i) => (
                <div key={i} className={`p-2.5 rounded-lg border text-xs ${insight.bg} flex items-start gap-2`}>
                  <insight.icon className="w-3.5 h-3.5 shrink-0 mt-0.5" />
                  <span className="font-medium">{insight.text}</span>
                </div>
              ))}
            </div>

            {/* Messages */}
            {messages.filter(m => m.type !== 'welcome').map((m, idx) => (
              <div key={idx} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[88%] rounded-xl p-3 text-xs whitespace-pre-wrap ${
                  m.role === 'user'
                    ? 'bg-[#132B25] text-white rounded-br-none'
                    : 'bg-white border border-slate-200 text-slate-800 shadow-sm rounded-bl-none'
                }`}>
                  {m.role === 'assistant' && (
                    <div className="flex items-center gap-1 text-[10px] font-bold text-[#D97757] mb-1">
                      <Sparkles className="w-3 h-3" />
                      <span>Copilot</span>
                    </div>
                  )}
                  <p className="leading-relaxed">{m.text}</p>
                </div>
              </div>
            ))}

            {/* Typing indicator */}
            {isTyping && (
              <div className="flex justify-start">
                <div className="bg-white border border-slate-200 rounded-xl rounded-bl-none p-3 shadow-sm">
                  <div className="flex items-center gap-1">
                    <span className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></span>
                    <span className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></span>
                    <span className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></span>
                  </div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Quick Actions */}
          <div className="px-4 py-2 border-t border-slate-100 bg-white">
            <div className="flex flex-wrap gap-2">
              {quickActions.map((action) => (
                <button
                  key={action.id}
                  onClick={() => handleSend(action.prompt)}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-slate-200 text-xs font-semibold text-slate-700 hover:bg-slate-50 hover:border-slate-300 transition-all"
                >
                  <action.icon className={`w-3.5 h-3.5 ${action.color}`} />
                  <span>{action.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Input */}
          <div className="p-3 bg-white border-t border-slate-200 shrink-0">
            <form
              onSubmit={(e) => { e.preventDefault(); handleSend(); }}
              className="flex items-center gap-2 bg-slate-50 rounded-xl px-3 py-2.5 border border-slate-200 focus-within:border-[#132B25] focus-within:bg-white transition-all"
            >
              <input
                type="text"
                placeholder={lang === 'en' ? 'Ask Copilot anything...' : 'اسأل المساعد أي شيء...'}
                value={inputVal}
                onChange={(e) => setInputVal(e.target.value)}
                className="w-full bg-transparent text-xs text-slate-900 placeholder:text-slate-400 outline-none"
              />
              <div className="flex items-center gap-1 text-slate-400">
                <button type="button" className="p-1.5 hover:text-slate-600 transition-colors">
                  <Mic className="w-4 h-4" />
                </button>
                <button type="button" className="p-1.5 hover:text-slate-600 transition-colors">
                  <ImageIcon className="w-4 h-4" />
                </button>
                <button
                  type="submit"
                  className="w-7 h-7 bg-[#132B25] text-white rounded-lg flex items-center justify-center hover:bg-[#1A3831] transition-colors ml-1"
                >
                  <ArrowUpRight className="w-4 h-4" />
                </button>
              </div>
            </form>
          </div>
        </div>

        {/* Right Sidebar — Context Actions */}
        <div className="hidden lg:flex w-52 border-s border-slate-100 bg-slate-50/30 flex-col shrink-0">
          <div className="p-4 border-b border-slate-100">
            <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
              {lang === 'en' ? 'Smart Actions' : 'إجراءات ذكية'}
            </div>
          </div>
          <div className="flex-1 overflow-y-auto p-3 space-y-2">
            {[
              { icon: DollarSign, label: lang === 'en' ? 'Collect Overdue Rent' : 'تحصيل الإيجار المتأخر', desc: '5 tenants', action: 'finance' },
              { icon: Wrench, label: lang === 'en' ? 'Dispatch Urgent Repair' : 'إرسال خدمة طارئة', desc: '2 tickets', action: 'maintenance' },
              { icon: FileCheck, label: lang === 'en' ? 'Review Expiring Leases' : 'مراجعة العقود المنتهية', desc: '18 upcoming', action: 'leasing' },
              { icon: Target, label: lang === 'en' ? 'Run Ad Campaign' : 'تشغيل حملة إعلانية', desc: '3 active', action: 'marketing' },
              { icon: BarChart3, label: lang === 'en' ? 'Generate Report' : 'إنشاء تقرير', desc: 'Monthly', action: 'default' },
              { icon: User, label: lang === 'en' ? 'Approve New Tenant' : 'الموافقة على مستأجر', desc: '2 pending', action: 'leasing' },
            ].map((item, i) => (
              <button
                key={i}
                onClick={() => handleSend(item.label)}
                className="w-full flex items-center gap-3 p-3 rounded-xl bg-white border border-slate-200 hover:border-[#132B25] hover:shadow-sm transition-all text-start"
              >
                <div className="w-8 h-8 rounded-lg bg-[#F6F8F6] border border-slate-200 flex items-center justify-center shrink-0">
                  <item.icon className="w-4 h-4 text-[#132B25]" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-xs font-semibold text-slate-900 truncate">{item.label}</div>
                  <div className="text-[10px] text-slate-400">{item.desc}</div>
                </div>
                <ArrowRight className="w-3.5 h-3.5 text-slate-300 shrink-0" />
              </button>
            ))}
          </div>

          {/* Copilot Pro Badge */}
          <div className="p-4 border-t border-slate-100">
            <div className="bg-gradient-to-r from-[#132B25] to-[#1A3831] rounded-xl p-3 text-center">
              <Sparkles className="w-6 h-6 text-[#D97757] mx-auto mb-2" />
              <div className="text-xs font-bold text-white">Copilot Pro</div>
              <div className="text-[10px] text-slate-300 mt-0.5">
                {lang === 'en' ? 'Unlock AI-powered workflows' : 'افتح سير العمل بالذكاء الاصطناعي'}
              </div>
              <button className="mt-2 w-full py-1.5 bg-[#D97757] text-white rounded-lg text-xs font-bold hover:bg-[#c46748] transition-colors">
                {lang === 'en' ? 'Upgrade' : 'ترقية'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
/**
 * CopilotOpenButton — small button in the page header that dispatches a
 * custom event to open the global Copilot panel. Keeps the open state
 * encapsulated inside GlobalCopilot (no need to lift it into layout).
 */
'use client';

import { Sparkles } from 'lucide-react';

export interface CopilotOpenButtonProps {
  lang: 'en' | 'ar';
}

export default function CopilotOpenButton({ lang }: CopilotOpenButtonProps) {
  const label = lang === 'ar' ? 'المساعد' : 'Copilot';
  return (
    <button
      onClick={() => window.dispatchEvent(new CustomEvent('pe:copilot:open'))}
      className="bg-[#132B25] hover:bg-[#1A3831] text-white rounded-full px-3 py-1.5 text-xs font-bold flex items-center gap-1.5 transition-all shadow-sm"
      title={`${label} (⌘J)`}
      aria-label="Open Copilot"
    >
      <Sparkles className="w-3.5 h-3.5 text-[#D97757]" />
      <span className="hidden sm:inline">{label}</span>
    </button>
  );
}

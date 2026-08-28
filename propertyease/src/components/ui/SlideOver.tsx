'use client';
/**
 * SlideOver — right-side slide-in panel for create/edit forms.
 * Replaces inline accordion forms. ESC + backdrop close.
 */
import { useEffect } from 'react';
import { X } from 'lucide-react';
import type { ReactNode } from 'react';

export interface SlideOverProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  subtitle?: string;
  children: ReactNode;
  footer?: ReactNode;
  /** 'sm' (360px) for compact forms, 'md' (480px) default, 'lg' (640px) for wide forms */
  width?: 'sm' | 'md' | 'lg';
}

const WIDTH = { sm: 'max-w-sm', md: 'max-w-md', lg: 'max-w-2xl' } as const;

export default function SlideOver({ isOpen, onClose, title, subtitle, children, footer, width = 'md' }: SlideOverProps) {
  // Lock body scroll + close on ESC
  useEffect(() => {
    if (!isOpen) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', onKey);
    return () => {
      document.body.style.overflow = prev;
      window.removeEventListener('keydown', onKey);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex justify-end" role="dialog" aria-modal="true" aria-label={title}>
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <div
        className={`relative bg-white w-full ${WIDTH[width]} h-full flex flex-col shadow-2xl`}
        style={{ animation: 'slideOverIn 0.25s cubic-bezier(0.16, 1, 0.3, 1)' }}
      >
        <div className="px-6 py-5 border-b border-slate-100 flex items-start justify-between gap-3">
          <div>
            <h2 className="font-extrabold text-slate-900 text-lg tracking-tight">{title}</h2>
            {subtitle && <p className="text-xs text-slate-500 mt-0.5">{subtitle}</p>}
          </div>
          <button
            onClick={onClose}
            className="p-1.5 -m-1.5 hover:bg-slate-100 rounded-lg text-slate-500 transition-colors"
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        <div className="flex-1 overflow-y-auto p-6">{children}</div>
        {footer && <div className="px-6 py-4 border-t border-slate-100 flex items-center justify-end gap-3">{footer}</div>}
      </div>
      <style dangerouslySetInnerHTML={{ __html: `
        @keyframes slideOverIn {
          from { opacity: 0; transform: translateX(40px); }
          to   { opacity: 1; transform: translateX(0); }
        }
      `}} />
    </div>
  );
}

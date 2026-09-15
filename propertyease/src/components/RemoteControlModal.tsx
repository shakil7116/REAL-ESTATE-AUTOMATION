'use client';

import { useState } from 'react';
import { Smartphone, QrCode, Copy, Check, ShieldCheck, Wifi, ExternalLink, X, RefreshCw } from 'lucide-react';

interface RemoteControlModalProps {
  isOpen: boolean;
  onClose: () => void;
  lang: 'en' | 'ar';
}

export default function RemoteControlModal({ isOpen, onClose, lang }: RemoteControlModalProps) {
  const [copied, setCopied] = useState(false);
  const [deviceConnected, setDeviceConnected] = useState(false);

  if (!isOpen) return null;

  const localIp = typeof window !== 'undefined' ? window.location.hostname : 'localhost';
  const port = '3001';
  const localUrl = `http://${localIp}:${port}`;
  // SVG QR Code pointing directly to http://192.168.10.48:3001
  const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(localUrl)}`;

  const handleCopy = () => {
    navigator.clipboard.writeText(localUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in">
      <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl max-w-md w-full overflow-hidden">
        {/* Header */}
        <div className="bg-[#132B25] text-white p-6 relative">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 text-slate-300 hover:text-white p-1 rounded-full hover:bg-white/10 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
          
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-[#D97757] flex items-center justify-center text-white shadow-lg">
              <Smartphone className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-extrabold tracking-tight">
                {lang === 'en' ? 'Mobile Remote Link' : 'رابط التحكم عبر الجوال'}
              </h2>
              <p className="text-xs text-slate-300 font-medium">
                {lang === 'en' ? 'Scan to view Operations OS on your phone' : 'امسح الرمز لفتح النظام من جوالك'}
              </p>
            </div>
          </div>
        </div>

        {/* Modal Body */}
        <div className="p-6 space-y-6">
          {/* Status Badge */}
          <div className={`p-3 rounded-2xl flex items-center justify-between border text-xs font-semibold ${
            deviceConnected 
              ? 'bg-emerald-50 text-emerald-800 border-emerald-200' 
              : 'bg-amber-50 text-amber-800 border-amber-200'
          }`}>
            <div className="flex items-center gap-2">
              <span className={`w-2.5 h-2.5 rounded-full ${deviceConnected ? 'bg-emerald-500 animate-pulse' : 'bg-amber-500'}`}></span>
              <span>
                {deviceConnected 
                  ? (lang === 'en' ? 'Mobile Device Connected' : 'تم اتصال الجوال بنجاح')
                  : (lang === 'en' ? 'Waiting for Mobile Connection...' : 'في انتظار اتصال الجوال...')}
              </span>
            </div>
            <button 
              onClick={() => setDeviceConnected(!deviceConnected)}
              className="text-[11px] underline opacity-80 hover:opacity-100"
            >
              {deviceConnected ? 'Reset' : 'Simulate Connect'}
            </button>
          </div>

          {/* QR Code Card */}
          <div className="bg-[#F6F8F6] border border-slate-200/80 rounded-2xl p-5 text-center flex flex-col items-center justify-center space-y-3">
            <div className="relative p-3 bg-white rounded-2xl border border-slate-200 shadow-sm">
              <img 
                src={qrCodeUrl} 
                alt="Mobile Remote QR Code" 
                className="w-44 h-44 rounded-lg object-contain"
              />
              <div className="absolute -bottom-2 -right-2 bg-[#132B25] text-white p-1.5 rounded-full shadow-md">
                <QrCode className="w-4 h-4" />
              </div>
            </div>
            <p className="text-xs text-slate-500 font-medium max-w-xs">
              {lang === 'en' 
                ? 'Open your phone camera & scan this QR code to load the app directly on your local Wi-Fi.' 
                : 'افتح كاميرا الجوال وافحص الكود لفتح التطبيق على شبكة الواي فاي نفسها.'}
            </p>
          </div>

          {/* URL Direct Copy Box */}
          <div className="space-y-1.5">
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
              {lang === 'en' ? 'Direct Mobile URL' : 'الرابط المباشر للجوال'}
            </label>
            <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 rounded-xl p-2">
              <span className="text-xs font-mono text-slate-800 flex-1 truncate px-2 font-medium">
                {localUrl}
              </span>
              <button
                onClick={handleCopy}
                className="px-3 py-1.5 bg-[#132B25] text-white text-xs font-semibold rounded-lg hover:bg-[#1A3831] active:scale-95 transition-all flex items-center gap-1.5 shadow-sm"
              >
                {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copied ? (lang === 'en' ? 'Copied!' : 'تم') : (lang === 'en' ? 'Copy' : 'نسخ')}</span>
              </button>
            </div>
          </div>

          {/* Network Requirement Notes */}
          <div className="bg-slate-50 border border-slate-200/80 rounded-2xl p-4 space-y-2">
            <div className="flex items-center gap-2 text-xs font-bold text-slate-800">
              <Wifi className="w-4 h-4 text-[#D97757]" />
              <span>{lang === 'en' ? 'Remote Control Instructions' : 'تعليمات التحكم عن بُعد'}</span>
            </div>
            <ul className="text-[11px] text-slate-600 space-y-1 list-disc list-inside">
              <li>{lang === 'en' ? 'Ensure mobile phone is connected to same Wi-Fi network' : 'تأكد من اتصال الجوال بنفس شبكة الواي فاي'}</li>
              <li>{lang === 'en' ? 'Accept portfolio sync notifications on phone' : 'قبول مزامنة الإشعارات والتحكم على الجوال'}</li>
              <li>{lang === 'en' ? 'Remote Copilot commands available on mobile web' : 'يتوفر المساعد الذكي Copilot كاملاً عبر شبكة الجوال'}</li>
            </ul>
          </div>
        </div>

        {/* Footer */}
        <div className="bg-slate-50 px-6 py-4 border-t border-slate-200 flex justify-between items-center text-xs">
          <span className="text-slate-400 font-medium">PropertyEase Remote v1.2</span>
          <a
            href={localUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="text-[#132B25] font-bold hover:underline inline-flex items-center gap-1"
          >
            <span>{lang === 'en' ? 'Test in Browser' : 'تجربة في المتصفح'}</span>
            <ExternalLink className="w-3.5 h-3.5" />
          </a>
        </div>
      </div>
    </div>
  );
}

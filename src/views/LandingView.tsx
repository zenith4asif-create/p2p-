import React, { useState } from 'react';
import { 
  Send, 
  Download, 
  QrCode, 
  Zap, 
  Clock, 
  ShieldCheck, 
  ArrowRight
} from 'lucide-react';
import { GhibliDancingDuo } from '../components/GhibliArt.tsx';
import { RGBLightBox } from '../components/RGBLightBox.tsx';
import { triggerHaptic } from '../utils/haptics.ts';

interface LandingViewProps {
  onNavigate: (view: string, param?: string) => void;
  onOpenScanner: () => void;
}

export const LandingView: React.FC<LandingViewProps> = ({ onNavigate, onOpenScanner }) => {
  const [quickCode, setQuickCode] = useState('');

  const handleAction = (cb: () => void) => {
    // Only vibrate on tap
    triggerHaptic('selection');
    cb();
  };

  const handleQuickReceive = (e: React.FormEvent) => {
    e.preventDefault();
    if (quickCode.trim().length >= 4) {
      triggerHaptic('selection');
      onNavigate('receive', quickCode.trim().toUpperCase());
    }
  };

  return (
    <div className="relative w-full flex flex-col justify-between select-none">
      
      {/* Hero Section */}
      <section className="relative max-w-5xl mx-auto px-4 pt-6 sm:pt-12 pb-8 sm:pb-14 text-center">
        
        {/* Live Looping Video Animation Showcase with Running RGB Light Outline Box */}
        <div className="mb-6 inline-block w-full max-w-sm sm:max-w-md mx-auto">
          <RGBLightBox className="w-full" innerClassName="p-3 sm:p-4">
            <GhibliDancingDuo label="Fast, Private & Direct P2P Transfer · Instant Live Stream" />
          </RGBLightBox>
        </div>

        {/* Unboxed Status Metadata */}
        <div className="flex flex-wrap items-center justify-center gap-2 text-xs text-slate-600 dark:text-neutral-300 font-medium mb-4">
          <span className="text-emerald-600 dark:text-emerald-400 font-bold">Next-Gen Browser P2P</span>
          <span aria-hidden="true" className="text-slate-400 dark:text-neutral-600">·</span>
          <span>Zero Server Retention</span>
          <span aria-hidden="true" className="text-slate-400 dark:text-neutral-600">·</span>
          <span className="font-mono text-emerald-600 dark:text-emerald-300 font-bold">10-Minute Hard Expiry</span>
        </div>

        {/* Hero Title with Dual Theme Gradient */}
        <h1 className="text-3xl sm:text-5xl lg:text-7xl font-black tracking-tight text-slate-900 dark:text-white uppercase leading-[1.08] mb-4 sm:mb-6 max-w-3xl mx-auto">
          SHARE ANYTHING. <br />
          <span className="bg-gradient-to-r from-emerald-600 via-teal-500 to-cyan-600 dark:from-emerald-300 dark:via-teal-200 dark:to-cyan-300 bg-clip-text text-transparent">
            INSTANTLY AROUND YOU.
          </span>
        </h1>

        {/* Hero Subtitle */}
        <p className="max-w-xl mx-auto text-sm sm:text-base text-slate-600 dark:text-neutral-300 leading-relaxed mb-8 px-2 font-normal">
          High-speed, encrypted browser-to-browser P2P file sharing. Scan QR codes or enter short codes to stream files directly between devices with automatic 10-minute expiry.
        </p>

        {/* iOS-Style Tactile Liquid Glass Primary Buttons */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3 max-w-md sm:max-w-xl mx-auto mb-8 w-full px-2">
          {/* Primary CTA: Send Files */}
          <button
            type="button"
            onClick={() => handleAction(() => onNavigate('create'))}
            className="w-full sm:w-auto flex-1 min-h-[50px] px-6 py-3.5 rounded-2xl liquid-glass-accent text-white font-black text-sm flex items-center justify-center gap-2.5 transition-all active:scale-95 shadow-lg shadow-emerald-500/25"
          >
            <Send className="w-4 h-4 stroke-[2.5]" />
            <span>SEND FILES</span>
          </button>

          {/* Secondary CTA: Receive Files */}
          <button
            type="button"
            onClick={() => handleAction(() => onNavigate('receive'))}
            className="w-full sm:w-auto flex-1 min-h-[50px] px-6 py-3.5 rounded-2xl liquid-glass-button text-slate-900 dark:text-white font-bold text-sm flex items-center justify-center gap-2.5 transition-all active:scale-95 shadow-md"
          >
            <Download className="w-4 h-4 text-emerald-600 dark:text-emerald-400 stroke-[2.5]" />
            <span>RECEIVE FILES</span>
          </button>

          {/* Tertiary Action: Quick Scan */}
          <button
            type="button"
            onClick={() => handleAction(onOpenScanner)}
            className="w-full sm:w-auto min-h-[50px] px-5 py-3.5 rounded-2xl liquid-glass-button text-slate-900 dark:text-white font-bold text-sm flex items-center justify-center gap-2.5 transition-all active:scale-95 shadow-md"
          >
            <QrCode className="w-4 h-4 text-emerald-600 dark:text-emerald-400 stroke-[2.5]" />
            <span>SCAN QR</span>
          </button>
        </div>

        {/* Quick Short Code Input with Continuous Running RGB Light Outline */}
        <div className="max-w-md mx-auto w-full px-2">
          <RGBLightBox className="w-full" innerClassName="p-1.5 sm:p-2">
            <form 
              onSubmit={handleQuickReceive}
              className="flex items-center gap-2"
            >
              <div className="pl-3 text-slate-500 dark:text-neutral-400 font-mono text-sm font-bold">#</div>
              <input
                type="text"
                placeholder="ENTER 6-DIGIT CODE (e.g. A7K92P)"
                value={quickCode}
                onChange={(e) => setQuickCode(e.target.value.toUpperCase().slice(0, 6))}
                className="w-full bg-transparent text-sm font-mono tracking-wider text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-neutral-500 focus:outline-none uppercase py-2"
              />
              <button
                type="submit"
                disabled={quickCode.trim().length < 4}
                className="min-h-[44px] px-5 rounded-xl liquid-glass-accent text-white disabled:opacity-40 disabled:hover:opacity-40 text-xs font-black transition-all flex items-center gap-1.5 shrink-0 shadow-md"
              >
                <span>Join</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </form>
          </RGBLightBox>
        </div>

      </section>

      {/* Features Bento Grid in Liquid Transparent Glass */}
      <section className="max-w-6xl mx-auto px-4 py-8 sm:py-12 w-full">
        <div className="text-center mb-8">
          <h2 className="text-xs font-bold tracking-widest text-emerald-600 dark:text-emerald-400 uppercase mb-1.5">
            Engineered for Speed &amp; Privacy
          </h2>
          <p className="text-lg sm:text-2xl font-bold text-slate-900 dark:text-white">
            Everything you need for instant transfer
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          
          <div className="liquid-glass-card p-5 rounded-3xl hover:border-emerald-500/50 transition-all shadow-md">
            <div className="w-10 h-10 rounded-2xl liquid-glass-button flex items-center justify-center text-emerald-600 dark:text-emerald-400 mb-4 shadow-sm">
              <Zap className="w-5 h-5" />
            </div>
            <h3 className="text-sm font-bold text-slate-900 dark:text-white mb-1.5">Direct P2P WebRTC</h3>
            <p className="text-xs text-slate-600 dark:text-neutral-300 leading-relaxed">
              Files stream directly peer-to-peer between your devices at maximum Wi-Fi and 5G local speeds.
            </p>
          </div>

          <div className="liquid-glass-card p-5 rounded-3xl hover:border-emerald-500/50 transition-all shadow-md">
            <div className="w-10 h-10 rounded-2xl liquid-glass-button flex items-center justify-center text-teal-600 dark:text-teal-400 mb-4 shadow-sm">
              <QrCode className="w-5 h-5" />
            </div>
            <h3 className="text-sm font-bold text-slate-900 dark:text-white mb-1.5">Fast QR &amp; Codes</h3>
            <p className="text-xs text-slate-600 dark:text-neutral-300 leading-relaxed">
              Instant mobile camera barcode scanning or simple 6-character memorable short codes.
            </p>
          </div>

          <div className="liquid-glass-card p-5 rounded-3xl hover:border-emerald-500/50 transition-all shadow-md">
            <div className="w-10 h-10 rounded-2xl liquid-glass-button flex items-center justify-center text-amber-600 dark:text-amber-400 mb-4 shadow-sm">
              <Clock className="w-5 h-5" />
            </div>
            <h3 className="text-sm font-bold text-slate-900 dark:text-white mb-1.5">10-Minute Ephemeral</h3>
            <p className="text-xs text-slate-600 dark:text-neutral-300 leading-relaxed">
              Automatic hard session wipe after 10 minutes. No lingering links or unwanted access.
            </p>
          </div>

          <div className="liquid-glass-card p-5 rounded-3xl hover:border-emerald-500/50 transition-all shadow-md">
            <div className="w-10 h-10 rounded-2xl liquid-glass-button flex items-center justify-center text-cyan-600 dark:text-cyan-400 mb-4 shadow-sm">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <h3 className="text-sm font-bold text-slate-900 dark:text-white mb-1.5">Zero Retention</h3>
            <p className="text-xs text-slate-600 dark:text-neutral-300 leading-relaxed">
              Transferred data never touches a persistent database. Your files remain completely yours.
            </p>
          </div>

        </div>
      </section>

    </div>
  );
};

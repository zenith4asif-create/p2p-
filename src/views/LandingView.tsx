import React, { useState } from 'react';
import { 
  Send, 
  Download, 
  QrCode, 
  Zap, 
  Clock, 
  Cloud, 
  Layers, 
  ArrowRight,
  FileCheck2,
  Lock,
  Smartphone,
  Sparkles
} from 'lucide-react';
import { GhibliDancingDuo } from '../components/GhibliArt.tsx';

interface LandingViewProps {
  onNavigate: (view: string, param?: string) => void;
  onOpenScanner: () => void;
}

export const LandingView: React.FC<LandingViewProps> = ({ onNavigate, onOpenScanner }) => {
  const [quickCode, setQuickCode] = useState('');

  const handleQuickReceive = (e: React.FormEvent) => {
    e.preventDefault();
    if (quickCode.trim().length >= 4) {
      onNavigate('receive', quickCode.trim().toUpperCase());
    }
  };

  return (
    <div className="relative overflow-hidden min-h-[calc(100vh-4rem)] flex flex-col justify-between bg-black text-neutral-100">
      
      {/* Hero Section */}
      <section className="relative max-w-5xl mx-auto px-4 pt-10 sm:pt-16 pb-12 text-center">
        
        {/* Live Looping Video Animation Showcase */}
        <div className="mb-6 inline-block">
          <div className="bg-neutral-950/90 p-4 rounded-3xl border border-neutral-800 shadow-2xl backdrop-blur-md">
            <GhibliDancingDuo label="Fast, Private & Direct P2P Transfer · Instant Live Stream" />
          </div>
        </div>

        {/* Modern Pill Tag */}
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-neutral-950 border border-neutral-800 shadow-inner mb-6 animate-in fade-in slide-in-from-bottom-2">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
          <span className="text-xs font-semibold text-neutral-300">
            Next-Gen Browser P2P &amp; Cloud Transfer
          </span>
          <span className="text-neutral-600">|</span>
          <span className="text-xs font-mono text-emerald-400">Zero Server Data Retention</span>
        </div>

        {/* Hero Title */}
        <h1 className="text-4xl sm:text-6xl lg:text-7xl font-black tracking-tight text-white uppercase leading-[1.1] mb-6">
          SHARE ANYTHING. <br />
          <span className="bg-gradient-to-r from-emerald-400 via-teal-300 to-cyan-400 bg-clip-text text-transparent">
            ANYWHERE.
          </span>
        </h1>

        {/* Hero Subtitle */}
        <p className="max-w-2xl mx-auto text-base sm:text-lg text-neutral-400 leading-relaxed mb-10">
          Fast, private and temporary file sharing using QR codes, short codes, links and direct browser-to-browser P2P transfer with automatic 10-minute expiry.
        </p>

        {/* Main Action Buttons */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3.5 mb-10">
          <button
            onClick={() => onNavigate('create')}
            className="w-full sm:w-auto px-8 py-4 rounded-2xl bg-emerald-500 hover:bg-emerald-400 text-black font-black text-sm shadow-xl shadow-emerald-500/20 hover:shadow-emerald-500/30 flex items-center justify-center gap-2.5 transition-all hover:scale-105 active:scale-95"
          >
            <Send className="w-4 h-4 stroke-[2.5]" />
            <span>SEND FILES</span>
          </button>

          <button
            onClick={() => onNavigate('receive')}
            className="w-full sm:w-auto px-8 py-4 rounded-2xl bg-neutral-900 hover:bg-neutral-800 text-white font-bold text-sm border border-neutral-800 shadow-lg flex items-center justify-center gap-2.5 transition-all hover:scale-105 active:scale-95"
          >
            <Download className="w-4 h-4 text-emerald-400 stroke-[2.5]" />
            <span>RECEIVE FILES</span>
          </button>

          <button
            onClick={onOpenScanner}
            className="w-full sm:w-auto px-8 py-4 rounded-2xl bg-neutral-900 hover:bg-neutral-800 text-white font-bold text-sm border border-neutral-800 shadow-lg flex items-center justify-center gap-2.5 transition-all hover:scale-105 active:scale-95 group"
          >
            <QrCode className="w-4 h-4 text-emerald-400 group-hover:rotate-12 transition-transform duration-300 stroke-[2.5]" />
            <span>SCAN QR</span>
          </button>
        </div>

        {/* Quick Short Code Input */}
        <div className="max-w-md mx-auto">
          <form 
            onSubmit={handleQuickReceive}
            className="flex items-center gap-2 bg-neutral-950 p-2.5 rounded-2xl border border-neutral-800 focus-within:border-emerald-500 shadow-xl transition-all"
          >
            <div className="pl-3 text-neutral-500 font-mono text-sm font-semibold">#</div>
            <input
              type="text"
              placeholder="ENTER 6-DIGIT CODE (e.g. A7K92P)"
              value={quickCode}
              onChange={(e) => setQuickCode(e.target.value.toUpperCase().slice(0, 6))}
              className="w-full bg-transparent text-sm font-mono tracking-wider text-white placeholder-neutral-500 focus:outline-none uppercase"
            />
            <button
              type="submit"
              disabled={quickCode.trim().length < 4}
              className="px-5 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-black disabled:opacity-40 disabled:hover:bg-neutral-800 disabled:hover:text-neutral-500 text-xs font-black transition-all flex items-center gap-1.5 shrink-0"
            >
              <span>Join</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </form>
        </div>

      </section>

      {/* Features Grid in True Dark Black */}
      <section className="max-w-6xl mx-auto px-4 py-12 border-t border-neutral-900 w-full">
        <div className="text-center mb-10">
          <h2 className="text-xs font-bold tracking-widest text-emerald-400 uppercase mb-2">
            Engineered for Speed &amp; Privacy
          </h2>
          <p className="text-xl sm:text-2xl font-bold text-white">
            Everything you need for instant transfer
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          
          <div className="p-5 rounded-2xl bg-neutral-950 border border-neutral-850 hover:border-emerald-500/50 transition-colors">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 mb-4">
              <Zap className="w-5 h-5" />
            </div>
            <h3 className="text-sm font-bold text-white mb-1.5">Direct P2P WebRTC</h3>
            <p className="text-xs text-neutral-400 leading-relaxed">
              Transfers stream directly between browsers through encrypted DataChannels without file data touching intermediate servers.
            </p>
          </div>

          <div className="p-5 rounded-2xl bg-neutral-950 border border-neutral-850 hover:border-emerald-500/50 transition-colors">
            <div className="w-10 h-10 rounded-xl bg-teal-500/10 border border-teal-500/20 flex items-center justify-center text-teal-400 mb-4">
              <QrCode className="w-5 h-5" />
            </div>
            <h3 className="text-sm font-bold text-white mb-1.5">Instant QR Sharing</h3>
            <p className="text-xs text-neutral-400 leading-relaxed">
              Point your phone camera to scan and start downloading instantly without typing links or sharing personal accounts.
            </p>
          </div>

          <div className="p-5 rounded-2xl bg-neutral-950 border border-neutral-850 hover:border-emerald-500/50 transition-colors">
            <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400 mb-4">
              <Clock className="w-5 h-5" />
            </div>
            <h3 className="text-sm font-bold text-white mb-1.5">10-Minute Auto Expiry</h3>
            <p className="text-xs text-neutral-400 leading-relaxed">
              Every share self-destructs after exactly 10 minutes. Strictly validated on server and client to guarantee transient sharing.
            </p>
          </div>

          <div className="p-5 rounded-2xl bg-neutral-950 border border-neutral-850 hover:border-emerald-500/50 transition-colors">
            <div className="w-10 h-10 rounded-xl bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center text-cyan-400 mb-4">
              <Cloud className="w-5 h-5" />
            </div>
            <h3 className="text-sm font-bold text-white mb-1.5">Cloud Fallback</h3>
            <p className="text-xs text-neutral-400 leading-relaxed">
              If peer firewalls or NAT block direct connections, automatic Cloudinary temporary storage steps in seamlessly.
            </p>
          </div>

          <div className="p-5 rounded-2xl bg-neutral-950 border border-neutral-850 hover:border-emerald-500/50 transition-colors">
            <div className="w-10 h-10 rounded-xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-purple-400 mb-4">
              <Layers className="w-5 h-5" />
            </div>
            <h3 className="text-sm font-bold text-white mb-1.5">Universal File Support</h3>
            <p className="text-xs text-neutral-400 leading-relaxed">
              Images, 4K videos, audio tracks, PDFs, documents, APK files, ZIP archives, and source code.
            </p>
          </div>

          <div className="p-5 rounded-2xl bg-neutral-950 border border-neutral-850 hover:border-emerald-500/50 transition-colors">
            <div className="w-10 h-10 rounded-xl bg-rose-500/10 border border-rose-500/20 flex items-center justify-center text-rose-400 mb-4">
              <Lock className="w-5 h-5" />
            </div>
            <h3 className="text-sm font-bold text-white mb-1.5">Privacy By Design</h3>
            <p className="text-xs text-neutral-400 leading-relaxed">
              No tracking, no analytics telemetry, no long-term file retention. You retain complete sovereignty over your data.
            </p>
          </div>

          <div className="p-5 rounded-2xl bg-neutral-950 border border-neutral-850 hover:border-emerald-500/50 transition-colors">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 mb-4">
              <Smartphone className="w-5 h-5" />
            </div>
            <h3 className="text-sm font-bold text-white mb-1.5">Mobile First &amp; PWA</h3>
            <p className="text-xs text-neutral-400 leading-relaxed">
              Touch-friendly, optimized for Android Chrome and iOS Safari, with native home-screen installation.
            </p>
          </div>

          <div className="p-5 rounded-2xl bg-neutral-950 border border-neutral-850 hover:border-emerald-500/50 transition-colors">
            <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400 mb-4">
              <FileCheck2 className="w-5 h-5" />
            </div>
            <h3 className="text-sm font-bold text-white mb-1.5">Real Backpressure</h3>
            <p className="text-xs text-neutral-400 leading-relaxed">
              Chunked binary streaming prevents browser memory freezes, handling large gigabyte files cleanly.
            </p>
          </div>

        </div>
      </section>

    </div>
  );
};

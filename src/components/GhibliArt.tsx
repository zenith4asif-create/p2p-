import React, { useEffect, useState } from 'react';
import { CheckCircle2, Home, Sparkles, FileCheck, Mail } from 'lucide-react';
import { formatBytes } from '../utils/helpers.ts';

export const VIDEO_ASSETS = {
  // Logo animation video
  logo: 'https://res.cloudinary.com/yuasb9xa/video/upload/v1792833021/2401.mp4',
  // No internet connection animation video
  noInternet: 'https://res.cloudinary.com/yuasb9xa/video/upload/v1792833010/2402.mp4',
  // Successful transfer animation video
  success: 'https://res.cloudinary.com/yuasb9xa/video/upload/v1792833019/2410.mp4',
};

/**
 * Animated Logo Video playing in an exact seamless loop
 */
export const LogoAnimationVideo: React.FC<{
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}> = ({ size = 'md', className = '' }) => {
  const sizeClasses = {
    sm: 'w-8 h-8 rounded-lg',
    md: 'w-10 h-10 rounded-xl',
    lg: 'w-16 h-16 rounded-2xl',
  }[size];

  return (
    <div
      className={`relative overflow-hidden bg-black border border-neutral-800 shadow-lg shadow-emerald-500/10 shrink-0 ${sizeClasses} ${className}`}
    >
      <video
        src={VIDEO_ASSETS.logo}
        autoPlay
        loop
        muted
        playsInline
        className="w-full h-full object-cover select-none pointer-events-none"
      />
    </div>
  );
};

/**
 * Active Transfer / Waiting Live Video Animation
 * Replaces old Ghibli cartoon drawings with live loop animation
 */
export const GhibliDancingDuo: React.FC<{
  label?: string;
  compact?: boolean;
}> = ({
  label = 'Active live transfer in progress...',
  compact = false,
}) => {
  return (
    <div className={`relative flex flex-col items-center justify-center ${compact ? 'py-2' : 'py-4'}`}>
      {/* Ambient Glow */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
        <div className="w-56 h-36 bg-gradient-to-r from-emerald-500/15 via-teal-500/20 to-cyan-500/15 rounded-full blur-2xl" />
      </div>

      {/* Video Loop Container */}
      <div className="relative rounded-2xl overflow-hidden border border-neutral-800 bg-black shadow-2xl max-w-[280px] sm:max-w-[320px] w-full aspect-video">
        <video
          src={VIDEO_ASSETS.logo}
          autoPlay
          loop
          muted
          playsInline
          className="w-full h-full object-cover"
        />
        {/* Subtle overlay badge */}
        <div className="absolute top-2 right-2 px-2 py-0.5 rounded-full bg-black/80 backdrop-blur-md border border-emerald-500/30 text-[10px] font-mono text-emerald-400 font-bold flex items-center gap-1">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
          <span>LIVE LOOP</span>
        </div>
      </div>

      {/* Status Label */}
      <div className="mt-3 text-center">
        <p className="text-xs font-semibold text-emerald-400 flex items-center justify-center gap-1.5">
          <Sparkles className="w-3.5 h-3.5 text-amber-400 animate-spin" />
          <span>{label}</span>
        </p>
      </div>
    </div>
  );
};

/**
 * No Internet Connection Video Animation
 * Plays exact loop: https://res.cloudinary.com/yuasb9xa/video/upload/v1792833010/2402.mp4
 */
export const GhibliNoInternet: React.FC = () => {
  return (
    <div className="relative flex flex-col items-center justify-center p-4 text-center select-none">
      {/* Looping No Internet Video */}
      <div className="relative rounded-2xl overflow-hidden border border-neutral-800 bg-black shadow-2xl max-w-[280px] w-full aspect-video mb-4">
        <video
          src={VIDEO_ASSETS.noInternet}
          autoPlay
          loop
          muted
          playsInline
          className="w-full h-full object-cover"
        />
        <div className="absolute top-2 right-2 px-2 py-0.5 rounded-full bg-black/80 backdrop-blur-md border border-amber-500/40 text-[10px] font-mono text-amber-400 font-bold flex items-center gap-1">
          <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse" />
          <span>OFFLINE</span>
        </div>
      </div>

      <h3 className="text-base font-bold text-white mb-1">
        No Internet Connection
      </h3>
      <p className="text-xs text-neutral-400 max-w-xs leading-relaxed">
        Network connection paused. ShareFlow will automatically resume active transfers as soon as your device reconnects!
      </p>
    </div>
  );
};

/**
 * Fullscreen Celebratory Modal when all files are completely received
 * Plays exact successful transfer loop: https://res.cloudinary.com/yuasb9xa/video/upload/v1792833019/2410.mp4
 */
export const FullScreenSuccessModal: React.FC<{
  isOpen: boolean;
  files: Array<{ name: string; size: number; url?: string }>;
  onClose: () => void;
  onGoHome: () => void;
}> = ({ isOpen, files, onClose, onGoHome }) => {
  const [confettiPieces, setConfettiPieces] = useState<Array<{ id: number; left: number; delay: number; color: string }>>([]);

  useEffect(() => {
    if (isOpen) {
      const colors = ['#22c55e', '#38bdf8', '#f43f5e', '#fbbf24', '#a855f7', '#ec4899'];
      const pieces = Array.from({ length: 45 }).map((_, i) => ({
        id: i,
        left: Math.random() * 100,
        delay: Math.random() * 2.5,
        color: colors[i % colors.length],
      }));
      setConfettiPieces(pieces);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const totalBytes = files.reduce((acc, f) => acc + f.size, 0);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/95 backdrop-blur-2xl p-4 overflow-y-auto animate-in fade-in zoom-in-95">
      {/* Falling Celebratory Confetti */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        {confettiPieces.map((p) => (
          <div
            key={p.id}
            className="absolute -top-4 w-2.5 h-3.5 rounded-sm opacity-90 animate-[ghibliConfettiFall_3.8s_linear_infinite]"
            style={{
              left: `${p.left}%`,
              animationDelay: `${p.delay}s`,
              backgroundColor: p.color,
            }}
          />
        ))}
      </div>

      {/* Main Pitch-Black Container */}
      <div className="relative w-full max-w-xl rounded-3xl bg-neutral-950 border border-neutral-800 p-6 sm:p-8 shadow-2xl text-center z-10">
        
        {/* Successful Transfer Live Video in Infinite Loop */}
        <div className="relative rounded-2xl overflow-hidden border border-emerald-500/40 bg-black shadow-2xl max-w-[340px] w-full aspect-video mx-auto mb-4">
          <video
            src={VIDEO_ASSETS.success}
            autoPlay
            loop
            muted
            playsInline
            className="w-full h-full object-cover"
          />
          <div className="absolute top-2 right-2 px-2 py-0.5 rounded-full bg-black/80 backdrop-blur-md border border-emerald-500/40 text-[10px] font-mono text-emerald-400 font-bold flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
            <span>COMPLETE</span>
          </div>
        </div>

        {/* Big Bold Headline Requested by User */}
        <div className="mb-4">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 text-xs font-bold uppercase tracking-wider mb-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            <span>Transfer Complete ✓</span>
          </div>

          <h1 className="text-2xl sm:text-4xl font-black text-white tracking-tight uppercase leading-snug">
            🎉 SUCCESSFULLY RECEIVED ALL FILES!
          </h1>
          
          <p className="text-base sm:text-lg font-bold text-emerald-400 mt-1">
            THANKS FOR USING SHAREFLOW
          </p>
          <p className="text-xs text-neutral-400 mt-1 font-mono">
            "Share Anything. Scan. Transfer. Done."
          </p>
        </div>

        {/* Received Files Summary Card */}
        <div className="bg-black rounded-2xl border border-neutral-800 p-4 text-left mb-6 max-h-44 overflow-y-auto">
          <div className="flex items-center justify-between pb-2 border-b border-neutral-800 mb-2 text-xs font-bold text-neutral-400">
            <span>Received Package ({files.length} {files.length === 1 ? 'file' : 'files'})</span>
            <span className="font-mono text-emerald-400">{formatBytes(totalBytes)}</span>
          </div>

          <div className="space-y-1.5">
            {files.map((file, idx) => (
              <div key={idx} className="flex items-center justify-between text-xs py-1">
                <div className="flex items-center gap-2 truncate pr-2">
                  <FileCheck className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                  <span className="text-white truncate font-medium">{file.name}</span>
                </div>
                <span className="font-mono text-neutral-400 text-[11px] shrink-0">
                  {formatBytes(file.size)}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row items-center gap-3 mb-6">
          <button
            onClick={onClose}
            className="w-full py-3.5 rounded-2xl bg-neutral-900 hover:bg-neutral-800 text-neutral-200 font-bold text-xs border border-neutral-800 transition"
          >
            Review Files
          </button>

          <button
            onClick={onGoHome}
            className="w-full py-3.5 rounded-2xl bg-emerald-500 hover:bg-emerald-400 text-black font-black text-xs shadow-xl shadow-emerald-500/20 transition flex items-center justify-center gap-2 hover:scale-[1.02] active:scale-[0.98]"
          >
            <Home className="w-4 h-4 stroke-[2.5]" />
            <span>FINISH &amp; BACK TO HOME</span>
          </button>
        </div>

        {/* Developer Credit Requested by User */}
        <div className="pt-4 border-t border-neutral-900 text-center text-xs text-neutral-500">
          <p className="font-medium text-neutral-400">
            Engineered by <span className="font-bold text-white">ASIF ANSARI</span>
          </p>
          <p className="text-[11px] text-neutral-500 mt-0.5">
            (independent technologist researcher and biologist)
          </p>
          <a
            href="mailto:bioasif77@gmail.com"
            className="inline-flex items-center gap-1.5 text-emerald-400 hover:text-emerald-300 font-mono text-[11px] mt-1.5 transition"
          >
            <Mail className="w-3 h-3" />
            <span>Contact: bioasif77@gmail.com</span>
          </a>
        </div>

      </div>
    </div>
  );
};

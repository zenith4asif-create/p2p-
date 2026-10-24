import React, { useEffect, useState } from 'react';
import { CheckCircle2, Download, Home, Sparkles, FileCheck, ArrowRight, Heart } from 'lucide-react';
import { formatBytes } from '../utils/helpers.ts';

/**
 * Animated CSS keyframes embedded for smooth Ghibli character choreography
 */
const ghibliStyles = `
@keyframes ghibliDanceA {
  0%, 100% { transform: translateY(0px) rotate(-3deg) scale(1); }
  25% { transform: translateY(-12px) rotate(4deg) scale(1.03); }
  50% { transform: translateY(-4px) rotate(-4deg) scale(0.98); }
  75% { transform: translateY(-16px) rotate(3deg) scale(1.04); }
}

@keyframes ghibliDanceB {
  0%, 100% { transform: translateY(-14px) rotate(4deg) scale(1.02); }
  25% { transform: translateY(-2px) rotate(-3deg) scale(0.97); }
  50% { transform: translateY(-16px) rotate(5deg) scale(1.05); }
  75% { transform: translateY(0px) rotate(-4deg) scale(0.99); }
}

@keyframes ghibliArmLeft {
  0%, 100% { transform: rotate(-15deg); }
  50% { transform: rotate(35deg); }
}

@keyframes ghibliArmRight {
  0%, 100% { transform: rotate(20deg); }
  50% { transform: rotate(-30deg); }
}

@keyframes ghibliBlink {
  0%, 90%, 100% { transform: scaleY(1); }
  95% { transform: scaleY(0.1); }
}

@keyframes ghibliFloatNote {
  0% { transform: translate(0, 0) scale(0.7); opacity: 0; }
  50% { opacity: 0.9; }
  100% { transform: translate(25px, -45px) scale(1.2); opacity: 0; }
}

@keyframes ghibliRain {
  0% { transform: translateY(-20px); opacity: 0; }
  50% { opacity: 0.8; }
  100% { transform: translateY(50px); opacity: 0; }
}

@keyframes ghibliConfetti {
  0% { transform: translateY(-10px) rotate(0deg); opacity: 1; }
  100% { transform: translateY(120vh) rotate(720deg); opacity: 0; }
}

.animate-ghibli-dance-a {
  animation: ghibliDanceA 1.6s ease-in-out infinite;
  transform-origin: bottom center;
}

.animate-ghibli-dance-b {
  animation: ghibliDanceB 1.6s ease-in-out infinite;
  transform-origin: bottom center;
}

.animate-ghibli-blink {
  animation: ghibliBlink 4s infinite;
  transform-origin: center;
}

.animate-ghibli-note-1 {
  animation: ghibliFloatNote 2.2s infinite ease-out;
}

.animate-ghibli-note-2 {
  animation: ghibliFloatNote 2.5s infinite 1.1s ease-out;
}
`;

/**
 * 2 Studio Ghibli Inspired Characters Joyfully Dancing Together
 * - Character 1: Round friendly woodland guardian (Totoro vibe)
 * - Character 2: Cute small white chibi spirit with green leaf hat (Kodama/mini-spirit)
 * Includes floating musical notes, glowing fireflies, and playful bouncing interaction.
 */
export const GhibliDancingDuo: React.FC<{ label?: string; compact?: boolean }> = ({
  label = "Receiving files with love & speed...",
  compact = false
}) => {
  return (
    <div className={`relative flex flex-col items-center justify-center ${compact ? 'py-2' : 'py-5'}`}>
      <style>{ghibliStyles}</style>

      {/* Background Soft Anime Glow */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
        <div className="w-56 h-36 bg-gradient-to-r from-emerald-500/15 via-cyan-500/20 to-amber-500/15 rounded-full blur-2xl" />
      </div>

      {/* SVG Canvas for Dancing Characters */}
      <div className="relative w-72 h-44 flex items-end justify-center select-none">
        
        {/* Floating Musical Notes & Magical Sparkles */}
        <div className="absolute top-2 left-16 text-emerald-400 font-bold text-lg animate-ghibli-note-1 pointer-events-none">
          ♫
        </div>
        <div className="absolute top-4 right-16 text-cyan-300 font-bold text-xl animate-ghibli-note-2 pointer-events-none">
          ♪
        </div>
        <div className="absolute top-1 left-32 text-amber-300 font-bold text-sm animate-pulse pointer-events-none">
          ✨
        </div>

        {/* Character 1: Big Guardian Spirit (Totoro-style) */}
        <div className="animate-ghibli-dance-a mr-2 z-10">
          <svg width="130" height="150" viewBox="0 0 130 150" fill="none" xmlns="http://www.w3.org/2000/svg">
            <defs>
              <linearGradient id="spiritGrad" x1="0" y1="0" x2="130" y2="150" gradientUnits="userSpaceOnUse">
                <stop offset="0%" stopColor="#475569" />
                <stop offset="50%" stopColor="#334155" />
                <stop offset="100%" stopColor="#1e293b" />
              </linearGradient>
              <linearGradient id="bellyGrad" x1="65" y1="60" x2="65" y2="135" gradientUnits="userSpaceOnUse">
                <stop offset="0%" stopColor="#fef08a" />
                <stop offset="100%" stopColor="#fef9c3" />
              </linearGradient>
            </defs>

            {/* Left Ear */}
            <path d="M36 28 C28 5 44 2 46 28 Z" fill="#475569" stroke="#1e293b" strokeWidth="2.5" />
            <path d="M38 24 C34 10 42 8 43 24 Z" fill="#64748b" />

            {/* Right Ear */}
            <path d="M84 28 C76 5 92 2 94 28 Z" fill="#475569" stroke="#1e293b" strokeWidth="2.5" />
            <path d="M86 24 C82 10 90 8 91 24 Z" fill="#64748b" />

            {/* Main Round Body */}
            <path
              d="M65 24 C28 24 18 55 18 96 C18 135 32 144 65 144 C98 144 112 135 112 96 C112 55 102 24 65 24 Z"
              fill="url(#spiritGrad)"
              stroke="#0f172a"
              strokeWidth="3"
            />

            {/* Fluffy Cream Belly */}
            <ellipse cx="65" cy="100" rx="34" ry="36" fill="url(#bellyGrad)" opacity="0.95" />

            {/* Traditional Ghibli Belly Arrows */}
            <g fill="#475569">
              <path d="M60 82 L65 77 L70 82 Z" />
              <path d="M47 90 L52 85 L57 90 Z" />
              <path d="M73 90 L78 85 L83 90 Z" />
              <path d="M60 99 L65 94 L70 99 Z" />
            </g>

            {/* Cute Big Expressive Eyes */}
            <g className="animate-ghibli-blink">
              <circle cx="48" cy="52" r="7.5" fill="#ffffff" stroke="#0f172a" strokeWidth="2" />
              <circle cx="49" cy="51" r="3.5" fill="#0f172a" />
              <circle cx="50.5" cy="49.5" r="1.5" fill="#ffffff" />

              <circle cx="82" cy="52" r="7.5" fill="#ffffff" stroke="#0f172a" strokeWidth="2" />
              <circle cx="81" cy="51" r="3.5" fill="#0f172a" />
              <circle cx="82.5" cy="49.5" r="1.5" fill="#ffffff" />
            </g>

            {/* Whiskers */}
            <line x1="22" y1="60" x2="38" y2="61" stroke="#0f172a" strokeWidth="1.8" strokeLinecap="round" />
            <line x1="22" y1="67" x2="38" y2="65" stroke="#0f172a" strokeWidth="1.8" strokeLinecap="round" />
            <line x1="108" y1="60" x2="92" y2="61" stroke="#0f172a" strokeWidth="1.8" strokeLinecap="round" />
            <line x1="108" y1="67" x2="92" y2="65" stroke="#0f172a" strokeWidth="1.8" strokeLinecap="round" />

            {/* Triangular Tiny Nose & Happy Grin */}
            <polygon points="63,57 67,57 65,60" fill="#0f172a" />
            <path d="M56 64 Q65 72 74 64" stroke="#0f172a" strokeWidth="2.5" strokeLinecap="round" fill="none" />

            {/* Rosy Blush */}
            <ellipse cx="36" cy="62" rx="4.5" ry="3" fill="#f43f5e" opacity="0.4" />
            <ellipse cx="94" cy="62" rx="4.5" ry="3" fill="#f43f5e" opacity="0.4" />

            {/* Dancing Paws / Hands */}
            <circle cx="20" cy="88" r="7" fill="#475569" stroke="#0f172a" strokeWidth="2" />
            <circle cx="110" cy="88" r="7" fill="#475569" stroke="#0f172a" strokeWidth="2" />

            {/* Tiny Green Leaf on Head */}
            <path d="M65 24 Q72 12 80 18 Q72 26 65 24 Z" fill="#22c55e" stroke="#14532d" strokeWidth="1.5" />
            <path d="M65 24 Q72 18 78 18" stroke="#14532d" strokeWidth="1" fill="none" />
          </svg>
        </div>

        {/* Character 2: Tiny Chibi Forest Sprite with Leaf Hat (Kodama/Mini Spirit) */}
        <div className="animate-ghibli-dance-b ml-2 z-20">
          <svg width="90" height="110" viewBox="0 0 90 110" fill="none" xmlns="http://www.w3.org/2000/svg">
            <defs>
              <linearGradient id="chibiGrad" x1="45" y1="20" x2="45" y2="105" gradientUnits="userSpaceOnUse">
                <stop offset="0%" stopColor="#ffffff" />
                <stop offset="100%" stopColor="#e2e8f0" />
              </linearGradient>
            </defs>

            {/* Big Green Lotus Leaf Hat */}
            <path
              d="M45 12 C18 10 10 24 15 28 C26 36 64 36 75 28 C80 24 72 10 45 12 Z"
              fill="#10b981"
              stroke="#065f46"
              strokeWidth="2.5"
            />
            {/* Leaf Veins & Stem */}
            <line x1="45" y1="6" x2="45" y2="14" stroke="#065f46" strokeWidth="2.5" strokeLinecap="round" />
            <path d="M45 14 Q45 28 45 32" stroke="#065f46" strokeWidth="1.5" strokeLinecap="round" />
            <path d="M45 22 Q30 26 22 28" stroke="#065f46" strokeWidth="1" />
            <path d="M45 22 Q60 26 68 28" stroke="#065f46" strokeWidth="1" />

            {/* Chibi White Body */}
            <path
              d="M45 28 C30 28 24 44 24 68 C24 92 32 102 45 102 C58 102 66 92 66 68 C66 44 60 28 45 28 Z"
              fill="url(#chibiGrad)"
              stroke="#0f172a"
              strokeWidth="2.5"
            />

            {/* Little Pointy Ears */}
            <path d="M34 32 C30 18 38 18 40 32 Z" fill="#ffffff" stroke="#0f172a" strokeWidth="2" />
            <path d="M56 32 C52 18 60 18 62 32 Z" fill="#ffffff" stroke="#0f172a" strokeWidth="2" />

            {/* Cute Wide Sparkling Eyes */}
            <g className="animate-ghibli-blink">
              <circle cx="38" cy="56" r="5" fill="#0f172a" />
              <circle cx="39.5" cy="54.5" r="1.8" fill="#ffffff" />

              <circle cx="52" cy="56" r="5" fill="#0f172a" />
              <circle cx="53.5" cy="54.5" r="1.8" fill="#ffffff" />
            </g>

            {/* Joyful Open Mouth */}
            <ellipse cx="45" cy="67" rx="3.5" ry="4" fill="#f43f5e" />
            <path d="M42 66 Q45 64 48 66" stroke="#0f172a" strokeWidth="1.5" strokeLinecap="round" />

            {/* Sweet Anime Blush */}
            <circle cx="31" cy="63" r="3.5" fill="#fb7185" opacity="0.5" />
            <circle cx="59" cy="63" r="3.5" fill="#fb7185" opacity="0.5" />

            {/* Happy Little Hands waving */}
            <circle cx="20" cy="66" r="4.5" fill="#ffffff" stroke="#0f172a" strokeWidth="2" />
            <circle cx="70" cy="66" r="4.5" fill="#ffffff" stroke="#0f172a" strokeWidth="2" />

            {/* Cute Feet */}
            <ellipse cx="38" cy="102" rx="5" ry="3" fill="#cbd5e1" stroke="#0f172a" strokeWidth="1.5" />
            <ellipse cx="52" cy="102" rx="5" ry="3" fill="#cbd5e1" stroke="#0f172a" strokeWidth="1.5" />
          </svg>
        </div>

      </div>

      {/* Playful Ghibli status text */}
      <div className="mt-2 text-center">
        <p className="text-xs font-semibold text-emerald-300 flex items-center justify-center gap-1.5">
          <Sparkles className="w-3.5 h-3.5 text-amber-300 animate-spin" />
          <span>{label}</span>
          <Heart className="w-3.5 h-3.5 text-rose-400 fill-rose-400" />
        </p>
      </div>
    </div>
  );
};

/**
 * Ghibli Illustration for Offline / No Internet
 * - Cozy forest spirit under a giant leaf umbrella in soft rain with a tiny soot sprite
 */
export const GhibliNoInternet: React.FC = () => {
  return (
    <div className="relative flex flex-col items-center justify-center p-6 text-center select-none">
      <style>{ghibliStyles}</style>

      {/* Soft Rain Backdrop */}
      <div className="relative w-56 h-48 flex items-center justify-center mb-3">
        {/* Animated Rain Drops */}
        <div className="absolute top-2 left-6 w-0.5 h-4 bg-cyan-300/40 rounded-full animate-[ghibliRain_1.2s_infinite]" />
        <div className="absolute top-6 left-16 w-0.5 h-5 bg-cyan-300/40 rounded-full animate-[ghibliRain_1.5s_infinite_0.3s]" />
        <div className="absolute top-1 right-8 w-0.5 h-4 bg-cyan-300/40 rounded-full animate-[ghibliRain_1.3s_infinite_0.6s]" />
        <div className="absolute top-8 right-20 w-0.5 h-5 bg-cyan-300/40 rounded-full animate-[ghibliRain_1.4s_infinite_0.2s]" />

        {/* Rain SVG Illustration */}
        <svg width="180" height="170" viewBox="0 0 180 170" fill="none">
          {/* Giant Lotus Leaf Umbrella */}
          <path
            d="M90 20 C40 18 20 48 30 55 C50 70 130 70 150 55 C160 48 140 18 90 20 Z"
            fill="#15803d"
            stroke="#14532d"
            strokeWidth="3"
          />
          <path d="M90 55 L90 120" stroke="#78350f" strokeWidth="4" strokeLinecap="round" />
          {/* Water drips on umbrella */}
          <circle cx="50" cy="56" r="3" fill="#67e8f9" opacity="0.8" />
          <circle cx="130" cy="56" r="3" fill="#67e8f9" opacity="0.8" />

          {/* Gentle Forest Spirit under umbrella */}
          <path
            d="M90 60 C65 60 55 82 55 125 C55 155 65 160 90 160 C115 160 125 155 125 125 C125 82 115 60 90 60 Z"
            fill="#475569"
            stroke="#0f172a"
            strokeWidth="3"
          />

          {/* Spirit ears */}
          <path d="M72 65 C68 45 78 45 80 65 Z" fill="#475569" stroke="#0f172a" strokeWidth="2" />
          <path d="M100 65 C102 45 112 45 108 65 Z" fill="#475569" stroke="#0f172a" strokeWidth="2" />

          {/* Cozy Closed Eyes (Peaceful nap) */}
          <path d="M73 88 Q80 94 87 88" stroke="#0f172a" strokeWidth="2.5" strokeLinecap="round" fill="none" />
          <path d="M93 88 Q100 94 107 88" stroke="#0f172a" strokeWidth="2.5" strokeLinecap="round" fill="none" />
          <polygon points="88,96 92,96 90,99" fill="#0f172a" />

          {/* Cute Soot Sprite (Susuwatari) next to spirit */}
          <g transform="translate(130, 130)">
            <circle cx="15" cy="15" r="14" fill="#090d16" stroke="#1e293b" strokeWidth="1.5" />
            {/* Spiky fuzz */}
            <circle cx="5" cy="8" r="2" fill="#090d16" />
            <circle cx="25" cy="8" r="2" fill="#090d16" />
            <circle cx="2" cy="18" r="2" fill="#090d16" />
            <circle cx="28" cy="18" r="2" fill="#090d16" />
            {/* Big round eyes */}
            <circle cx="11" cy="14" r="4.5" fill="#ffffff" />
            <circle cx="12" cy="14" r="2" fill="#090d16" />
            <circle cx="19" cy="14" r="4.5" fill="#ffffff" />
            <circle cx="18" cy="14" r="2" fill="#090d16" />
          </g>
        </svg>
      </div>

      <h3 className="text-base font-bold text-white mb-1">
        No Internet Connection
      </h3>
      <p className="text-xs text-slate-400 max-w-xs leading-relaxed">
        Taking a peaceful Ghibli rain break. Check your Wi-Fi or mobile data — ShareFlow will resume as soon as you reconnect!
      </p>
    </div>
  );
};

/**
 * Fullscreen Celebratory Modal when all files are completely received
 * Takes over the screen with dancing Ghibli characters, confetti, and big bold confirmation!
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
      const colors = ['#38bdf8', '#34d399', '#f43f5e', '#fbbf24', '#a855f7', '#ec4899'];
      const pieces = Array.from({ length: 45 }).map((_, i) => ({
        id: i,
        left: Math.random() * 100,
        delay: Math.random() * 2.5,
        color: colors[i % colors.length]
      }));
      setConfettiPieces(pieces);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const totalBytes = files.reduce((acc, f) => acc + f.size, 0);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/95 backdrop-blur-xl p-4 overflow-y-auto animate-in fade-in zoom-in-95">
      <style>{ghibliStyles}</style>

      {/* Falling Celebratory Confetti */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        {confettiPieces.map((p) => (
          <div
            key={p.id}
            className="absolute -top-4 w-2.5 h-3 rounded-sm opacity-90 animate-[ghibliConfetti_3.5s_linear_infinite]"
            style={{
              left: `${p.left}%`,
              animationDelay: `${p.delay}s`,
              backgroundColor: p.color
            }}
          />
        ))}
      </div>

      {/* Main Container */}
      <div className="relative w-full max-w-xl rounded-3xl bg-slate-900 border border-emerald-500/40 p-6 sm:p-10 shadow-2xl text-center z-10">
        
        {/* Animated Dancing Ghibli Characters in Center */}
        <div className="mb-2">
          <GhibliDancingDuo label="The forest spirits celebrate your successful transfer!" />
        </div>

        {/* Big Bold Headline Requested by User */}
        <div className="mb-4">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 text-xs font-bold uppercase tracking-wider mb-3">
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            <span>Transfer Complete</span>
          </div>

          <h1 className="text-2xl sm:text-4xl font-black text-white tracking-tight uppercase leading-snug">
            🎉 SUCCESSFULLY RECEIVED ALL FILES!
          </h1>
          
          <p className="text-base sm:text-lg font-bold text-cyan-300 mt-2">
            THANKS FOR USING SHAREFLOW
          </p>
          <p className="text-xs text-slate-400 mt-1">
            "Share Anything. Scan. Transfer. Done."
          </p>
        </div>

        {/* Received Files Summary Card */}
        <div className="bg-slate-950/80 rounded-2xl border border-slate-800 p-4 text-left mb-6 max-h-48 overflow-y-auto">
          <div className="flex items-center justify-between pb-2 border-b border-slate-800 mb-2 text-xs font-bold text-slate-400">
            <span>Received Package ({files.length} {files.length === 1 ? 'file' : 'files'})</span>
            <span className="font-mono text-cyan-400">{formatBytes(totalBytes)}</span>
          </div>

          <div className="space-y-1.5">
            {files.map((file, idx) => (
              <div key={idx} className="flex items-center justify-between text-xs py-1">
                <div className="flex items-center gap-2 truncate pr-2">
                  <FileCheck className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                  <span className="text-white truncate font-medium">{file.name}</span>
                </div>
                <span className="font-mono text-slate-400 text-[11px] shrink-0">
                  {formatBytes(file.size)}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row items-center gap-3">
          <button
            onClick={onClose}
            className="w-full py-3.5 rounded-2xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs transition"
          >
            Review Files
          </button>

          <button
            onClick={onGoHome}
            className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-emerald-500 via-cyan-500 to-indigo-600 hover:from-emerald-400 hover:to-indigo-500 text-slate-950 font-black text-xs shadow-xl shadow-emerald-500/20 transition flex items-center justify-center gap-2 hover:scale-[1.02] active:scale-[0.98]"
          >
            <Home className="w-4 h-4 text-slate-950 stroke-[2.5]" />
            <span>FINISH &amp; BACK TO HOME</span>
          </button>
        </div>

      </div>
    </div>
  );
};

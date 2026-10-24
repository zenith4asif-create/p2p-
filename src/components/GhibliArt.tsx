import React, { useEffect, useState } from 'react';
import { CheckCircle2, Home, Sparkles, FileCheck, Heart, Mail } from 'lucide-react';
import { formatBytes } from '../utils/helpers.ts';

/**
 * Animated CSS keyframes for Studio Ghibli human cartoon characters dancing
 */
const ghibliHumanStyles = `
@keyframes ghibliBoyDance {
  0%, 100% {
    transform: translateY(0px) rotate(-2deg);
  }
  25% {
    transform: translateY(-14px) rotate(3deg) scaleY(1.02);
  }
  50% {
    transform: translateY(-2px) rotate(-3deg) scaleY(0.98);
  }
  75% {
    transform: translateY(-16px) rotate(2deg) scaleY(1.03);
  }
}

@keyframes ghibliGirlDance {
  0%, 100% {
    transform: translateY(-14px) rotate(3deg) scaleY(1.03);
  }
  25% {
    transform: translateY(0px) rotate(-3deg);
  }
  50% {
    transform: translateY(-16px) rotate(3deg) scaleY(1.02);
  }
  75% {
    transform: translateY(-3px) rotate(-2deg) scaleY(0.98);
  }
}

@keyframes ghibliArmLeftWave {
  0%, 100% { transform: rotate(-10deg); }
  50% { transform: rotate(40deg); }
}

@keyframes ghibliArmRightWave {
  0%, 100% { transform: rotate(15deg); }
  50% { transform: rotate(-35deg); }
}

@keyframes ghibliRibbonFlutter {
  0%, 100% { transform: rotate(0deg) scale(1); }
  50% { transform: rotate(12deg) scale(1.08); }
}

@keyframes ghibliBlink {
  0%, 90%, 100% { transform: scaleY(1); }
  95% { transform: scaleY(0.08); }
}

@keyframes ghibliNoteFloatA {
  0% { transform: translate(0, 0) scale(0.6); opacity: 0; }
  40% { opacity: 0.95; }
  100% { transform: translate(30px, -50px) scale(1.2); opacity: 0; }
}

@keyframes ghibliNoteFloatB {
  0% { transform: translate(0, 0) scale(0.6); opacity: 0; }
  40% { opacity: 0.95; }
  100% { transform: translate(-25px, -55px) scale(1.3); opacity: 0; }
}

@keyframes ghibliConfettiFall {
  0% { transform: translateY(-20px) rotate(0deg); opacity: 1; }
  100% { transform: translateY(115vh) rotate(720deg); opacity: 0; }
}

.animate-ghibli-boy {
  animation: ghibliBoyDance 1.5s ease-in-out infinite;
  transform-origin: bottom center;
}

.animate-ghibli-girl {
  animation: ghibliGirlDance 1.5s ease-in-out infinite;
  transform-origin: bottom center;
}

.animate-ghibli-blink {
  animation: ghibliBlink 4.2s infinite;
  transform-origin: center;
}

.animate-ghibli-ribbon {
  animation: ghibliRibbonFlutter 1.8s ease-in-out infinite;
  transform-origin: 50% 80%;
}

.animate-note-a {
  animation: ghibliNoteFloatA 2.2s infinite ease-out;
}

.animate-note-b {
  animation: ghibliNoteFloatB 2.6s infinite 0.9s ease-out;
}
`;

/**
 * Two Ghibli Human Mascots Dancing Together
 * - Ren (Boy with adventurous vest, cap & boots)
 * - Aoi (Girl with signature red hair ribbon, dress & boots)
 * High fidelity vector art with Miyazaki anime aesthetics.
 */
export const GhibliDancingDuo: React.FC<{ label?: string; compact?: boolean }> = ({
  label = "Ghibli mascots dancing while connecting & transferring...",
  compact = false,
}) => {
  return (
    <div className={`relative flex flex-col items-center justify-center ${compact ? 'py-2' : 'py-5'}`}>
      <style>{ghibliHumanStyles}</style>

      {/* Subtle warm anime ambient glow */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
        <div className="w-64 h-40 bg-gradient-to-r from-amber-500/10 via-emerald-500/15 to-rose-500/10 rounded-full blur-2xl" />
      </div>

      {/* Stage Canvas */}
      <div className="relative w-80 h-52 flex items-end justify-center select-none">
        
        {/* Floating Magical Musical Notes & Sparkles */}
        <div className="absolute top-2 left-14 text-emerald-400 font-bold text-xl animate-note-a pointer-events-none">
          ♫
        </div>
        <div className="absolute top-4 right-14 text-rose-400 font-bold text-xl animate-note-b pointer-events-none">
          ♪
        </div>
        <div className="absolute top-1 left-36 text-amber-300 font-bold text-base animate-pulse pointer-events-none">
          ✨
        </div>
        <div className="absolute top-8 left-28 text-pink-400 font-bold text-xs animate-bounce pointer-events-none">
          ♥
        </div>

        {/* 1. Ghibli Boy ("Ren") */}
        <div className="animate-ghibli-boy mr-3 z-10">
          <svg width="125" height="180" viewBox="0 0 125 180" fill="none" xmlns="http://www.w3.org/2000/svg">
            <defs>
              <linearGradient id="boySkin" x1="60" y1="35" x2="60" y2="75" gradientUnits="userSpaceOnUse">
                <stop offset="0%" stopColor="#ffedd5" />
                <stop offset="100%" stopColor="#fed7aa" />
              </linearGradient>
              <linearGradient id="boyVest" x1="62" y1="75" x2="62" y2="135" gradientUnits="userSpaceOnUse">
                <stop offset="0%" stopColor="#047857" />
                <stop offset="100%" stopColor="#064e3b" />
              </linearGradient>
              <linearGradient id="boyHair" x1="62" y1="20" x2="62" y2="55" gradientUnits="userSpaceOnUse">
                <stop offset="0%" stopColor="#78350f" />
                <stop offset="100%" stopColor="#451a03" />
              </linearGradient>
              <linearGradient id="boyPants" x1="62" y1="130" x2="62" y2="165" gradientUnits="userSpaceOnUse">
                <stop offset="0%" stopColor="#374151" />
                <stop offset="100%" stopColor="#1f2937" />
              </linearGradient>
            </defs>

            {/* Boy Body Shadow */}
            <ellipse cx="62" cy="176" rx="28" ry="4" fill="#000000" opacity="0.4" />

            {/* Left Leg & Leather Boot */}
            <path d="M50 130 L46 160 L40 162 L40 172 L56 172 L56 130 Z" fill="url(#boyPants)" stroke="#111827" strokeWidth="2" />
            <path d="M40 162 C40 162 48 162 56 162 L56 173 L38 173 Z" fill="#92400e" stroke="#451a03" strokeWidth="2" />

            {/* Right Leg & Boot (Stepping forward) */}
            <path d="M74 130 L76 158 L84 160 L84 172 L68 172 L68 130 Z" fill="url(#boyPants)" stroke="#111827" strokeWidth="2" />
            <path d="M68 162 C68 162 76 162 84 162 L84 173 L66 173 Z" fill="#92400e" stroke="#451a03" strokeWidth="2" />

            {/* Cream Inner Shirt */}
            <path d="M42 75 L82 75 L86 130 L38 130 Z" fill="#fef9c3" stroke="#111827" strokeWidth="2" />
            <path d="M54 75 L62 90 L70 75 Z" fill="#ffffff" stroke="#111827" strokeWidth="1.5" />

            {/* Green Adventurer Vest */}
            <path d="M42 75 L56 75 L54 128 L38 128 Z" fill="url(#boyVest)" stroke="#064e3b" strokeWidth="2" />
            <path d="M68 75 L82 75 L86 128 L70 128 Z" fill="url(#boyVest)" stroke="#064e3b" strokeWidth="2" />
            {/* Vest buttons */}
            <circle cx="58" cy="98" r="2.5" fill="#f59e0b" />
            <circle cx="58" cy="112" r="2.5" fill="#f59e0b" />

            {/* Left Arm waving up */}
            <g style={{ transformOrigin: '40px 80px', animation: 'ghibliArmLeftWave 1.5s ease-in-out infinite' }}>
              <path d="M42 78 L26 95 L22 90 L36 74 Z" fill="#fef9c3" stroke="#111827" strokeWidth="2" />
              <circle cx="22" cy="94" r="5.5" fill="url(#boySkin)" stroke="#111827" strokeWidth="1.5" />
            </g>

            {/* Right Arm swinging happily */}
            <g style={{ transformOrigin: '84px 80px', animation: 'ghibliArmRightWave 1.5s ease-in-out infinite' }}>
              <path d="M82 78 L98 94 L102 88 L86 74 Z" fill="#fef9c3" stroke="#111827" strokeWidth="2" />
              <circle cx="102" cy="92" r="5.5" fill="url(#boySkin)" stroke="#111827" strokeWidth="1.5" />
            </g>

            {/* Boy Neck */}
            <rect x="57" y="66" width="10" height="12" fill="url(#boySkin)" />

            {/* Boy Head */}
            <path d="M42 45 C42 28 82 28 82 45 C82 66 74 74 62 74 C50 74 42 66 42 45 Z" fill="url(#boySkin)" stroke="#111827" strokeWidth="2" />

            {/* Tousled Brown Ghibli Hair */}
            <path
              d="M38 42 C38 20 54 14 62 14 C74 14 86 22 86 42 C86 48 84 54 84 54 C80 44 76 46 72 40 C68 46 64 38 58 46 C52 40 48 48 42 48 C38 48 38 42 38 42 Z"
              fill="url(#boyHair)"
              stroke="#111827"
              strokeWidth="2"
            />
            {/* Front anime bangs */}
            <path d="M44 38 L48 48 L53 38 L58 49 L64 38 L69 48 L75 39" stroke="#451a03" strokeWidth="2.5" strokeLinecap="round" />

            {/* Boy Aviator Cap / Newsboy Hat */}
            <path d="M38 28 C38 12 52 8 62 8 C72 8 86 12 86 28 Z" fill="#b45309" stroke="#78350f" strokeWidth="2" />
            <path d="M34 28 C34 28 62 24 90 28" stroke="#78350f" strokeWidth="3" strokeLinecap="round" />

            {/* Eyes (Blinking animation) */}
            <g className="animate-ghibli-blink">
              {/* Left Eye */}
              <ellipse cx="52" cy="50" rx="4.5" ry="5.5" fill="#1e293b" />
              <circle cx="53.5" cy="48.5" r="1.8" fill="#ffffff" />
              <circle cx="51" cy="52.5" r="0.9" fill="#ffffff" />

              {/* Right Eye */}
              <ellipse cx="72" cy="50" rx="4.5" ry="5.5" fill="#1e293b" />
              <circle cx="73.5" cy="48.5" r="1.8" fill="#ffffff" />
              <circle cx="71" cy="52.5" r="0.9" fill="#ffffff" />
            </g>

            {/* Cute Ghibli anime eyebrows */}
            <path d="M48 42 Q52 40 56 42" stroke="#451a03" strokeWidth="1.8" strokeLinecap="round" />
            <path d="M68 42 Q72 40 76 42" stroke="#451a03" strokeWidth="1.8" strokeLinecap="round" />

            {/* Tiny Button Nose & Joyful Grin */}
            <circle cx="62" cy="56" r="1.2" fill="#b45309" />
            <path d="M57 60 Q62 66 67 60" stroke="#78350f" strokeWidth="2" strokeLinecap="round" fill="none" />

            {/* Rosy Anime Cheeks */}
            <ellipse cx="46" cy="56" rx="4" ry="2.5" fill="#f43f5e" opacity="0.45" />
            <ellipse cx="78" cy="56" rx="4" ry="2.5" fill="#f43f5e" opacity="0.45" />
          </svg>
        </div>

        {/* 2. Ghibli Girl ("Aoi") */}
        <div className="animate-ghibli-girl ml-2 z-20">
          <svg width="125" height="180" viewBox="0 0 125 180" fill="none" xmlns="http://www.w3.org/2000/svg">
            <defs>
              <linearGradient id="girlSkin" x1="60" y1="35" x2="60" y2="75" gradientUnits="userSpaceOnUse">
                <stop offset="0%" stopColor="#fff1f2" />
                <stop offset="100%" stopColor="#ffe4e6" />
              </linearGradient>
              <linearGradient id="girlDress" x1="62" y1="75" x2="62" y2="140" gradientUnits="userSpaceOnUse">
                <stop offset="0%" stopColor="#e11d48" />
                <stop offset="100%" stopColor="#be123c" />
              </linearGradient>
              <linearGradient id="girlHair" x1="62" y1="18" x2="62" y2="65" gradientUnits="userSpaceOnUse">
                <stop offset="0%" stopColor="#1e1b4b" />
                <stop offset="100%" stopColor="#0f172a" />
              </linearGradient>
            </defs>

            {/* Girl Body Shadow */}
            <ellipse cx="62" cy="176" rx="26" ry="4" fill="#000000" opacity="0.4" />

            {/* Legs with white socks & Mary Jane shoes */}
            <path d="M50 138 L48 165 L54 165 L56 138 Z" fill="url(#girlSkin)" />
            <path d="M72 138 L70 165 L76 165 L74 138 Z" fill="url(#girlSkin)" />
            {/* White socks */}
            <rect x="46" y="160" width="8" height="6" fill="#ffffff" stroke="#cbd5e1" strokeWidth="1" />
            <rect x="68" y="160" width="8" height="6" fill="#ffffff" stroke="#cbd5e1" strokeWidth="1" />
            {/* Mary Jane red shoes */}
            <ellipse cx="49" cy="169" rx="7" ry="3.5" fill="#991b1b" stroke="#450a0a" strokeWidth="1.5" />
            <ellipse cx="71" cy="169" rx="7" ry="3.5" fill="#991b1b" stroke="#450a0a" strokeWidth="1.5" />

            {/* Flowing Ghibli Red / Terracotta Dress */}
            <path
              d="M48 78 L76 78 L88 138 C88 138 62 144 36 138 Z"
              fill="url(#girlDress)"
              stroke="#881337"
              strokeWidth="2"
            />
            {/* White Peter Pan Collar */}
            <path d="M50 78 C54 84 60 84 62 80 C64 84 70 84 74 78 Z" fill="#ffffff" stroke="#111827" strokeWidth="1.5" />

            {/* White Apron Accent */}
            <path d="M52 90 L72 90 L76 132 L48 132 Z" fill="#ffffff" opacity="0.9" stroke="#e2e8f0" strokeWidth="1.5" />

            {/* Left Arm (Holding hand / waving) */}
            <g style={{ transformOrigin: '46px 82px', animation: 'ghibliArmRightWave 1.5s ease-in-out infinite' }}>
              <path d="M48 80 L32 94 L28 88 L44 76 Z" fill="url(#girlDress)" stroke="#881337" strokeWidth="2" />
              <circle cx="28" cy="94" r="5" fill="url(#girlSkin)" stroke="#111827" strokeWidth="1.5" />
            </g>

            {/* Right Arm (Waving up high) */}
            <g style={{ transformOrigin: '78px 82px', animation: 'ghibliArmLeftWave 1.5s ease-in-out infinite' }}>
              <path d="M76 80 L94 92 L98 86 L80 76 Z" fill="url(#girlDress)" stroke="#881337" strokeWidth="2" />
              <circle cx="98" cy="90" r="5" fill="url(#girlSkin)" stroke="#111827" strokeWidth="1.5" />
            </g>

            {/* Girl Neck */}
            <rect x="57" y="68" width="10" height="12" fill="url(#girlSkin)" />

            {/* Girl Head */}
            <path d="M44 46 C44 30 80 30 80 46 C80 66 72 74 62 74 C52 74 44 66 44 46 Z" fill="url(#girlSkin)" stroke="#111827" strokeWidth="2" />

            {/* Cute Ghibli Bob Haircut */}
            <path
              d="M40 44 C40 24 50 18 62 18 C74 18 84 24 84 44 C84 62 82 66 80 66 C78 56 76 54 74 46 C68 44 64 48 58 44 C52 48 48 44 42 54 C40 54 40 44 40 44 Z"
              fill="url(#girlHair)"
              stroke="#0f172a"
              strokeWidth="2"
            />
            {/* Soft side locks */}
            <path d="M40 48 Q38 60 42 66 Q44 60 42 48" fill="url(#girlHair)" />
            <path d="M84 48 Q86 60 82 66 Q80 60 82 48" fill="url(#girlHair)" />

            {/* Signature Big Red Ghibli Hair Ribbon */}
            <g className="animate-ghibli-ribbon" transform="translate(62, 16)">
              {/* Center knot */}
              <circle cx="0" cy="0" r="4.5" fill="#f43f5e" stroke="#9f1239" strokeWidth="1.5" />
              {/* Left wing */}
              <path d="M-4 0 C-18 -12 -22 6 -4 2 Z" fill="#e11d48" stroke="#9f1239" strokeWidth="2" />
              {/* Right wing */}
              <path d="M4 0 C18 -12 22 6 4 2 Z" fill="#e11d48" stroke="#9f1239" strokeWidth="2" />
            </g>

            {/* Eyes (Blinking animation) */}
            <g className="animate-ghibli-blink">
              {/* Left Eye */}
              <ellipse cx="52" cy="50" rx="4.8" ry="6" fill="#0f172a" />
              <circle cx="53.8" cy="48" r="2" fill="#ffffff" />
              <circle cx="51" cy="53" r="1" fill="#ffffff" />

              {/* Right Eye */}
              <ellipse cx="72" cy="50" rx="4.8" ry="6" fill="#0f172a" />
              <circle cx="73.8" cy="48" r="2" fill="#ffffff" />
              <circle cx="71" cy="53" r="1" fill="#ffffff" />
            </g>

            {/* Soft anime eyebrows */}
            <path d="M48 42 Q52 39 56 42" stroke="#1e1b4b" strokeWidth="1.8" strokeLinecap="round" />
            <path d="M68 42 Q72 39 76 42" stroke="#1e1b4b" strokeWidth="1.8" strokeLinecap="round" />

            {/* Cute smile with little pink tongue */}
            <path d="M57 60 Q62 67 67 60 Z" fill="#fb7185" stroke="#9f1239" strokeWidth="1.5" />

            {/* Rosy Pink Cheeks */}
            <ellipse cx="46" cy="56" rx="4.5" ry="3" fill="#fb7185" opacity="0.6" />
            <ellipse cx="78" cy="56" rx="4.5" ry="3" fill="#fb7185" opacity="0.6" />
          </svg>
        </div>

      </div>

      {/* Playful Ghibli status text */}
      <div className="mt-2 text-center">
        <p className="text-xs font-semibold text-emerald-400 flex items-center justify-center gap-1.5">
          <Sparkles className="w-3.5 h-3.5 text-amber-400 animate-spin" />
          <span>{label}</span>
          <Heart className="w-3.5 h-3.5 text-rose-500 fill-rose-500" />
        </p>
      </div>
    </div>
  );
};

/**
 * Ghibli Illustration for Offline / No Internet
 * - Girl and boy resting under a cozy shelter in soft rain
 */
export const GhibliNoInternet: React.FC = () => {
  return (
    <div className="relative flex flex-col items-center justify-center p-6 text-center select-none">
      <style>{ghibliHumanStyles}</style>

      {/* Cozy Ghibli Rain Illustration */}
      <div className="relative w-56 h-48 flex items-center justify-center mb-2">
        <svg width="180" height="160" viewBox="0 0 180 160" fill="none">
          {/* Lotus Leaf Umbrella */}
          <path
            d="M90 20 C40 18 20 48 30 55 C50 70 130 70 150 55 C160 48 140 18 90 20 Z"
            fill="#15803d"
            stroke="#14532d"
            strokeWidth="3"
          />
          <path d="M90 55 L90 125" stroke="#78350f" strokeWidth="4" strokeLinecap="round" />

          {/* Boy and Girl sitting close under umbrella */}
          <circle cx="70" cy="90" r="18" fill="#fed7aa" stroke="#111827" strokeWidth="2" />
          <path d="M54 84 C54 70 86 70 86 84 Z" fill="#78350f" />
          {/* Eyes closed peacefully */}
          <path d="M64 92 Q68 96 72 92" stroke="#451a03" strokeWidth="2" strokeLinecap="round" fill="none" />

          <circle cx="108" cy="92" r="17" fill="#ffe4e6" stroke="#111827" strokeWidth="2" />
          <path d="M94 86 C94 72 122 72 122 86 Z" fill="#0f172a" />
          <path d="M102 94 Q106 98 110 94" stroke="#881337" strokeWidth="2" strokeLinecap="round" fill="none" />

          {/* Clothes */}
          <path d="M52 108 L88 108 L82 145 L58 145 Z" fill="#047857" />
          <path d="M92 108 L126 108 L122 145 L98 145 Z" fill="#e11d48" />
        </svg>
      </div>

      <h3 className="text-base font-bold text-white mb-1">
        No Internet Connection
      </h3>
      <p className="text-xs text-neutral-400 max-w-xs leading-relaxed">
        Taking a peaceful Studio Ghibli rain break. Check your Wi-Fi or cellular network — ShareFlow will reconnect automatically.
      </p>
    </div>
  );
};

/**
 * Fullscreen Celebratory Modal when all files are completely received
 * Takes over the screen with dancing Ghibli human mascots, confetti, developer badge, and finish button!
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
      const pieces = Array.from({ length: 50 }).map((_, i) => ({
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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/95 backdrop-blur-2xl p-4 overflow-y-auto animate-in fade-in zoom-in-95">
      <style>{ghibliHumanStyles}</style>

      {/* Falling Celebratory Confetti */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        {confettiPieces.map((p) => (
          <div
            key={p.id}
            className="absolute -top-4 w-2.5 h-3.5 rounded-sm opacity-90 animate-[ghibliConfettiFall_3.8s_linear_infinite]"
            style={{
              left: `${p.left}%`,
              animationDelay: `${p.delay}s`,
              backgroundColor: p.color
            }}
          />
        ))}
      </div>

      {/* Main Pitch-Black Container */}
      <div className="relative w-full max-w-xl rounded-3xl bg-neutral-950 border border-neutral-800 p-6 sm:p-8 shadow-2xl text-center z-10">
        
        {/* Animated Dancing Ghibli Human Mascots */}
        <div className="mb-2">
          <GhibliDancingDuo label="Ren & Aoi are celebrating your transfer complete!" />
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
          <p className="text-xs text-neutral-400 mt-1">
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

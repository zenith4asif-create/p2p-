import React, { useEffect, useState, useRef } from 'react';
import { CheckCircle2, Home, Sparkles, FileCheck, Mail, WifiOff, AlertTriangle, RefreshCw, ZapOff } from 'lucide-react';
import { formatBytes } from '../utils/helpers.ts';

export const VIDEO_ASSETS = {
  // Logo animation video - fast loop
  logo: 'https://res.cloudinary.com/yuasb9xa/video/upload/v1792833021/2401.mp4',
  // Successful transfer animation video - celebratory loop
  success: 'https://res.cloudinary.com/yuasb9xa/video/upload/v1792833019/2410.mp4',
};

/**
 * Animated Logo Video playing in an exact seamless loop with instant load
 */
export const LogoAnimationVideo: React.FC<{
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}> = ({ size = 'md', className = '' }) => {
  const videoRef = useRef<HTMLVideoElement | null>(null);

  useEffect(() => {
    if (videoRef.current) {
      videoRef.current.play().catch(() => {});
    }
  }, []);

  const sizeClasses = {
    sm: 'w-8 h-8 rounded-lg',
    md: 'w-10 h-10 rounded-xl',
    lg: 'w-16 h-16 rounded-2xl',
  }[size];

  return (
    <div
      className={`relative overflow-hidden bg-black border border-neutral-800 shadow-lg shadow-emerald-500/10 shrink-0 transform-gpu ${sizeClasses} ${className}`}
    >
      <video
        ref={videoRef}
        src={VIDEO_ASSETS.logo}
        autoPlay
        loop
        muted
        playsInline
        preload="auto"
        disablePictureInPicture
        onCanPlay={(e) => e.currentTarget.play().catch(() => {})}
        className="w-full h-full object-cover select-none pointer-events-none"
      />
    </div>
  );
};

/**
 * Active Transfer / Waiting Live Video Animation
 * Plays fast-loading continuous live loop with instant autoplay
 */
export const GhibliDancingDuo: React.FC<{
  label?: string;
  compact?: boolean;
}> = ({
  label = 'Active live transfer in progress...',
  compact = false,
}) => {
  const videoRef = useRef<HTMLVideoElement | null>(null);

  useEffect(() => {
    if (videoRef.current) {
      videoRef.current.play().catch(() => {});
    }
  }, []);

  return (
    <div className={`relative flex flex-col items-center justify-center ${compact ? 'py-2' : 'py-4'}`}>
      {/* Ambient Glow */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
        <div className="w-56 h-36 bg-gradient-to-r from-emerald-500/15 via-teal-500/20 to-cyan-500/15 rounded-full blur-2xl" />
      </div>

      {/* Video Loop Container with fast load */}
      <div className="relative rounded-2xl overflow-hidden border border-neutral-800 bg-black shadow-2xl max-w-[280px] sm:max-w-[320px] w-full aspect-video transform-gpu">
        <video
          ref={videoRef}
          src={VIDEO_ASSETS.logo}
          autoPlay
          loop
          muted
          playsInline
          preload="auto"
          disablePictureInPicture
          onCanPlay={(e) => e.currentTarget.play().catch(() => {})}
          className="w-full h-full object-cover"
        />
        {/* Subtle overlay badge */}
        <div className="absolute top-2 right-2 px-2 py-0.5 rounded-full bg-black/85 backdrop-blur-md border border-emerald-500/30 text-[10px] font-mono text-emerald-400 font-bold flex items-center gap-1 shadow-md">
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
 * Ghibli Style Radio Transmission Tower with Breakdown Animation
 * Replaces the offline video with hand-crafted Ghibli anime aesthetic artwork
 * featuring broken lattice, severed cables, sparking electrical shorts, disrupted signal waves,
 * drifting twilight embers, and red warning beacon.
 */
export const GhibliTowerBreakdown: React.FC<{
  onRetry?: () => void;
  compact?: boolean;
}> = ({ onRetry, compact = false }) => {
  return (
    <div className="relative flex flex-col items-center justify-center text-center select-none w-full">
      {/* Ghibli Tower Canvas Frame */}
      <div className="relative w-full max-w-[340px] aspect-[16/10] rounded-2xl overflow-hidden border border-amber-500/30 bg-neutral-950 shadow-2xl group">
        
        {/* Layer 1: Ghibli Twilight Anime Sky Background */}
        <svg
          viewBox="0 0 400 250"
          className="w-full h-full object-cover"
          preserveAspectRatio="xMidYMid meet"
        >
          <defs>
            {/* Deep Twilight Sky Gradient */}
            <linearGradient id="ghibliSkyGrad" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#080c18" />
              <stop offset="45%" stopColor="#141c2e" />
              <stop offset="75%" stopColor="#2e2439" />
              <stop offset="90%" stopColor="#542e3b" />
              <stop offset="100%" stopColor="#693732" />
            </linearGradient>

            {/* Distant Anime Mountains */}
            <linearGradient id="ghibliHills" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#1e1828" />
              <stop offset="100%" stopColor="#0c0d14" />
            </linearGradient>

            {/* Glowing Sunset Horizon */}
            <radialGradient id="ghibliHorizonGlow" cx="50%" cy="85%" r="60%">
              <stop offset="0%" stopColor="#f59e0b" stopOpacity="0.4" />
              <stop offset="50%" stopColor="#ef4444" stopOpacity="0.15" />
              <stop offset="100%" stopColor="#000000" stopOpacity="0" />
            </radialGradient>

            {/* Broken Signal Wave Gradient */}
            <linearGradient id="disruptedWaveGrad" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#ef4444" stopOpacity="0.9" />
              <stop offset="50%" stopColor="#f59e0b" stopOpacity="0.7" />
              <stop offset="100%" stopColor="#ef4444" stopOpacity="0.2" />
            </linearGradient>

            {/* Electric Spark Glow */}
            <filter id="electricGlow" x="-50%" y="-50%" width="200%" height="200%">
              <feGaussianBlur in="SourceGraphic" stdDeviation="2.5" result="blur" />
              <feMerge>
                <feMergeNode in="blur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
          </defs>

          {/* Sky Backdrop */}
          <rect width="400" height="250" fill="url(#ghibliSkyGrad)" />
          <rect width="400" height="250" fill="url(#ghibliHorizonGlow)" />

          {/* Ghibli Painted Twilight Clouds */}
          <path
            d="M -20,120 Q 30,105 70,115 Q 120,95 180,110 Q 230,100 290,118 Q 350,105 420,125 L 420,250 L -20,250 Z"
            fill="#1c1626"
            opacity="0.4"
          />
          <path
            d="M -10,140 Q 60,125 120,135 Q 180,120 240,132 Q 310,122 380,136 Q 410,130 430,145 L 430,250 L -10,250 Z"
            fill="#131522"
            opacity="0.7"
          />

          {/* Distant Hills / Grassy Knoll with Ghibli Silhouettes */}
          <path
            d="M 0,195 Q 110,175 200,188 Q 310,172 400,192 L 400,250 L 0,250 Z"
            fill="url(#ghibliHills)"
          />
          <path
            d="M 0,215 Q 130,200 230,212 Q 330,198 400,210 L 400,250 L 0,250 Z"
            fill="#090a0f"
          />

          {/* Twilight Stars */}
          <circle cx="50" cy="35" r="1.2" fill="#fef08a" opacity="0.8" />
          <circle cx="95" cy="55" r="0.8" fill="#ffffff" opacity="0.6" />
          <circle cx="160" cy="25" r="1" fill="#fef08a" opacity="0.7" />
          <circle cx="310" cy="40" r="1.3" fill="#ffffff" opacity="0.8" />
          <circle cx="360" cy="65" r="0.9" fill="#fef08a" opacity="0.6" />
          <circle cx="340" cy="20" r="0.7" fill="#ffffff" opacity="0.5" />

          {/* DISRUPTED SIGNAL WAVES (Animated Radiating Breakdown Rings) */}
          <g className="origin-[200px_48px]">
            <circle
              cx="200"
              cy="48"
              r="22"
              fill="none"
              stroke="url(#disruptedWaveGrad)"
              strokeWidth="2.5"
              strokeDasharray="14 10 6 8"
              style={{ animation: 'signalDisrupt 2.2s cubic-bezier(0.2, 0.8, 0.4, 1) infinite' }}
            />
            <circle
              cx="200"
              cy="48"
              r="38"
              fill="none"
              stroke="#f59e0b"
              strokeWidth="1.8"
              strokeDasharray="8 12 16 6"
              opacity="0.6"
              style={{ animation: 'signalDisrupt 2.2s cubic-bezier(0.2, 0.8, 0.4, 1) infinite 0.7s' }}
            />
            <circle
              cx="200"
              cy="48"
              r="54"
              fill="none"
              stroke="#ef4444"
              strokeWidth="1.2"
              strokeDasharray="5 15 25 10"
              opacity="0.4"
              style={{ animation: 'signalDisrupt 2.2s cubic-bezier(0.2, 0.8, 0.4, 1) infinite 1.4s' }}
            />
          </g>

          {/* GHIBLI LATTICE TRANSMISSION TOWER */}
          {/* Main Tower Base (Lower Section - Solid Steel Lattice with Vines) */}
          <g className="text-amber-500">
            {/* Concrete Foundation Blocks */}
            <rect x="155" y="215" width="22" height="12" rx="2" fill="#3f3f46" stroke="#18181b" strokeWidth="1" />
            <rect x="223" y="215" width="22" height="12" rx="2" fill="#3f3f46" stroke="#18181b" strokeWidth="1" />

            {/* Lower Struts (A-Frame Legs) */}
            <line x1="166" y1="215" x2="182" y2="135" stroke="#dc2626" strokeWidth="4.5" strokeLinecap="round" />
            <line x1="234" y1="215" x2="218" y2="135" stroke="#dc2626" strokeWidth="4.5" strokeLinecap="round" />

            {/* Mid Struts */}
            <line x1="182" y1="135" x2="192" y2="80" stroke="#f1f5f9" strokeWidth="3.5" strokeLinecap="round" />
            <line x1="218" y1="135" x2="208" y2="80" stroke="#f1f5f9" strokeWidth="3.5" strokeLinecap="round" />

            {/* Horizontal Crossbars */}
            <line x1="169" y1="195" x2="231" y2="195" stroke="#ffffff" strokeWidth="2.5" />
            <line x1="174" y1="165" x2="226" y2="165" stroke="#dc2626" strokeWidth="2.5" />
            <line x1="182" y1="135" x2="218" y2="135" stroke="#ffffff" strokeWidth="2.5" />
            <line x1="187" y1="105" x2="213" y2="105" stroke="#dc2626" strokeWidth="2" />
            <line x1="192" y1="80" x2="208" y2="80" stroke="#ffffff" strokeWidth="2" />

            {/* Diagonal Truss X-Bracing */}
            <line x1="166" y1="215" x2="231" y2="195" stroke="#71717a" strokeWidth="1.8" />
            <line x1="234" y1="215" x2="169" y2="195" stroke="#71717a" strokeWidth="1.8" />
            <line x1="169" y1="195" x2="226" y2="165" stroke="#71717a" strokeWidth="1.8" />
            <line x1="231" y1="195" x2="174" y2="165" stroke="#71717a" strokeWidth="1.8" />
            <line x1="174" y1="165" x2="218" y2="135" stroke="#71717a" strokeWidth="1.5" />
            <line x1="226" y1="165" x2="182" y2="135" stroke="#71717a" strokeWidth="1.5" />
            <line x1="182" y1="135" x2="213" y2="105" stroke="#71717a" strokeWidth="1.2" />
            <line x1="218" y1="135" x2="187" y2="105" stroke="#71717a" strokeWidth="1.2" />
            <line x1="187" y1="105" x2="208" y2="80" stroke="#71717a" strokeWidth="1" />
            <line x1="213" y1="105" x2="192" y2="80" stroke="#71717a" strokeWidth="1" />

            {/* Overgrown Ghibli Ivy / Vines climbing the base */}
            <path
              d="M 162,218 Q 166,200 170,188 Q 173,178 171,168"
              fill="none"
              stroke="#15803d"
              strokeWidth="2.5"
              strokeLinecap="round"
            />
            <path
              d="M 238,220 Q 233,205 230,192 Q 226,180 228,172"
              fill="none"
              stroke="#22c55e"
              strokeWidth="2.2"
              strokeLinecap="round"
            />
            <circle cx="168" cy="192" r="2.5" fill="#4ade80" />
            <circle cx="172" cy="176" r="2.2" fill="#86efac" />
            <circle cx="232" cy="198" r="2.4" fill="#4ade80" />

            {/* Microwave Dish / Transceiver on tower side (damaged) */}
            <ellipse cx="221" cy="130" rx="9" ry="6" fill="#475569" stroke="#94a3b8" strokeWidth="1.5" transform="rotate(25 221 130)" />
            <line x1="221" y1="130" x2="228" y2="136" stroke="#ef4444" strokeWidth="2" strokeLinecap="round" />
          </g>

          {/* BROKEN & BENT TOP ANTENNA SECTION (Breakdown Glitch Animation) */}
          <g
            className="origin-[200px_80px]"
            style={{ animation: 'towerBreakdownGlitch 3.5s ease-in-out infinite' }}
          >
            {/* Bent Upper Mast Spire - fractured at angle */}
            <line x1="200" y1="80" x2="197" y2="52" stroke="#dc2626" strokeWidth="3" strokeLinecap="round" />
            {/* The sharp fracture / bend */}
            <line x1="197" y1="52" x2="183" y2="28" stroke="#ef4444" strokeWidth="2.8" strokeLinecap="round" />
            
            {/* Horizontal broken cross-dipoles */}
            <line x1="189" y1="62" x2="207" y2="60" stroke="#f1f5f9" strokeWidth="1.8" />
            <line x1="176" y1="36" x2="192" y2="33" stroke="#f1f5f9" strokeWidth="1.6" />

            {/* Red Obstruction Warning Beacon with Stutter Blink */}
            <circle
              cx="183"
              cy="28"
              r="4.5"
              fill="#ef4444"
              filter="url(#electricGlow)"
              style={{ animation: 'beaconStutter 1.6s infinite' }}
            />
            <circle cx="183" cy="28" r="2" fill="#ffffff" />
          </g>

          {/* SNAPPED DANGLING CABLES WITH SWAY */}
          <g style={{ animation: 'cableSway 3s ease-in-out infinite' }}>
            <path
              d="M 197,52 Q 175,70 178,102 Q 179,122 174,142"
              fill="none"
              stroke="#0f172a"
              strokeWidth="1.5"
              strokeDasharray="2 2"
            />
            <path
              d="M 183,28 Q 165,45 168,75"
              fill="none"
              stroke="#1e293b"
              strokeWidth="1.2"
            />
          </g>

          {/* ELECTRICAL SPARK ARCS AT BREAKDOWN POINT (Snapping & Fizzling) */}
          <g filter="url(#electricGlow)">
            {/* Spark 1 */}
            <polygon
              points="197,52 191,48 194,54 188,52 195,58 192,54"
              fill="#fef08a"
              style={{ animation: 'sparkFlicker 0.9s ease-in-out infinite' }}
            />
            {/* Spark 2 */}
            <polygon
              points="183,28 178,25 181,30 174,29 180,34 177,31"
              fill="#f59e0b"
              style={{ animation: 'sparkFlicker 1.4s ease-in-out infinite 0.3s' }}
            />
            {/* Spark 3 (Dangling wire tip) */}
            <circle
              cx="168"
              cy="75"
              r="3.5"
              fill="#38bdf8"
              style={{ animation: 'sparkFlicker 0.7s ease-in-out infinite 0.5s' }}
            />
          </g>

          {/* DRIFTING GHIBLI PARTICLES / EMBERS IN THE WIND */}
          <g>
            <circle cx="195" cy="110" r="1.5" fill="#f59e0b" style={{ animation: 'particleDrift 3.5s linear infinite 0.2s' }} />
            <circle cx="175" cy="140" r="1.2" fill="#ef4444" style={{ animation: 'particleDrift 4s linear infinite 1.1s' }} />
            <circle cx="215" cy="95" r="1.4" fill="#fbbf24" style={{ animation: 'particleDrift 3.2s linear infinite 0.7s' }} />
            <circle cx="185" cy="65" r="1.8" fill="#fef08a" style={{ animation: 'particleDrift 2.8s linear infinite 1.8s' }} />
            <circle cx="230" cy="130" r="1" fill="#4ade80" style={{ animation: 'particleDrift 4.5s linear infinite 2.2s' }} />
          </g>

          {/* Signal Severed Warning Cross */}
          <g transform="translate(320, 25)">
            <rect x="0" y="0" width="65" height="22" rx="6" fill="#000000" fillOpacity="0.75" stroke="#ef4444" strokeWidth="1" />
            <circle cx="12" cy="11" r="3.5" fill="#ef4444" style={{ animation: 'beaconStutter 1.2s infinite' }} />
            <text x="22" y="14" fill="#f87171" fontSize="8" fontFamily="monospace" fontWeight="bold">OFFLINE</text>
          </g>
        </svg>

        {/* Live Status Overlay Banner */}
        <div className="absolute bottom-2 left-2 right-2 px-3 py-1.5 rounded-xl bg-black/85 backdrop-blur-md border border-neutral-800 flex items-center justify-between text-left">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-rose-500 animate-ping" />
            <div className="leading-tight">
              <p className="text-[10px] font-mono font-bold text-rose-400">SIGNAL SEVERED · DISCONNECTED</p>
              <p className="text-[9px] text-neutral-400">Ghibli transmission relay breakdown</p>
            </div>
          </div>
          <ZapOff className="w-4 h-4 text-amber-400 shrink-0" />
        </div>
      </div>

      {/* Text Headline & Context */}
      <div className="mt-3.5 max-w-sm">
        <h3 className="text-base font-bold text-white flex items-center justify-center gap-2">
          <WifiOff className="w-4 h-4 text-amber-400" />
          <span>No Internet Connection</span>
        </h3>
        <p className="text-xs text-neutral-400 mt-1 leading-relaxed">
          The transmission tower signal is severed. ShareFlow will automatically detect and restore your active P2P transfer the moment network connection returns!
        </p>
      </div>

      {/* Network Retry Action */}
      {onRetry && (
        <button
          onClick={onRetry}
          className="mt-3.5 px-4 py-2 rounded-xl bg-neutral-900 hover:bg-neutral-800 text-emerald-400 hover:text-emerald-300 border border-neutral-800 text-xs font-semibold flex items-center gap-1.5 transition active:scale-95 shadow-md"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          <span>Test Network Reconnect</span>
        </button>
      )}
    </div>
  );
};

/**
 * Legacy wrapper: calls GhibliTowerBreakdown
 */
export const GhibliNoInternet: React.FC<{ onRetry?: () => void }> = ({ onRetry }) => {
  return <GhibliTowerBreakdown onRetry={onRetry} />;
};

/**
 * Fullscreen Celebratory Modal when all files are completely received
 * Plays exact successful transfer loop: https://res.cloudinary.com/yuasb9xa/video/upload/v1792833019/2410.mp4
 * Loads fast, autoplays seamlessly in a loop, displays complete package files, and developer attribution.
 */
export const FullScreenSuccessModal: React.FC<{
  isOpen: boolean;
  files: Array<{ name: string; size: number; url?: string }>;
  onClose: () => void;
  onGoHome: () => void;
}> = ({ isOpen, files, onClose, onGoHome }) => {
  const [confettiPieces, setConfettiPieces] = useState<Array<{ id: number; left: number; delay: number; color: string }>>([]);
  const videoRef = useRef<HTMLVideoElement | null>(null);

  useEffect(() => {
    if (isOpen) {
      if (videoRef.current) {
        videoRef.current.play().catch(() => {});
      }
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
        
        {/* Successful Transfer Live Video in Infinite Loop with Fast Preload */}
        <div className="relative rounded-2xl overflow-hidden border border-emerald-500/40 bg-black shadow-2xl max-w-[340px] w-full aspect-video mx-auto mb-4 transform-gpu">
          <video
            ref={videoRef}
            src={VIDEO_ASSETS.success}
            autoPlay
            loop
            muted
            playsInline
            preload="auto"
            disablePictureInPicture
            onCanPlay={(e) => e.currentTarget.play().catch(() => {})}
            className="w-full h-full object-cover"
          />
          <div className="absolute top-2 right-2 px-2 py-0.5 rounded-full bg-black/85 backdrop-blur-md border border-emerald-500/40 text-[10px] font-mono text-emerald-400 font-bold flex items-center gap-1 shadow-md">
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
            className="w-full py-3.5 rounded-2xl bg-neutral-900 hover:bg-neutral-800 text-neutral-200 font-bold text-xs border border-neutral-800 transition active:scale-95"
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

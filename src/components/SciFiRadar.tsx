import React, { useEffect, useState } from 'react';
import { 
  Radio, 
  Wifi, 
  ShieldCheck, 
  Activity, 
  Cpu, 
  Sparkles,
  Volume2,
  VolumeX
} from 'lucide-react';
import { triggerHaptic, playSciFiSound, isSoundEnabled, setSoundEnabled } from '../utils/haptics.ts';

interface SciFiRadarProps {
  status: 'waiting' | 'connecting' | 'connected' | 'transferring' | 'completed';
  code?: string;
  size?: 'sm' | 'md' | 'lg';
  showTelemetry?: boolean;
  onBlipClick?: () => void;
}

export const SciFiRadar: React.FC<SciFiRadarProps> = ({
  status,
  code,
  size = 'md',
  showTelemetry = true,
  onBlipClick,
}) => {
  const [azimuth, setAzimuth] = useState<number>(45);
  const [soundOn, setSoundOn] = useState<boolean>(isSoundEnabled());
  const [activeBlip, setActiveBlip] = useState<boolean>(false);

  // Dimension scaling
  const dimensionClass = {
    sm: 'w-48 h-48',
    md: 'w-64 h-64 sm:w-72 sm:h-72',
    lg: 'w-72 h-72 sm:w-80 sm:h-80',
  }[size];

  // Rotate azimuth continuously for HUD readout
  useEffect(() => {
    const timer = setInterval(() => {
      setAzimuth((prev) => (prev + 3) % 360);
    }, 60);
    return () => clearInterval(timer);
  }, []);

  // Periodic radar ping sound & haptic (every 6 seconds if waiting)
  useEffect(() => {
    if (status !== 'waiting') return;

    const pingTimer = setInterval(() => {
      setActiveBlip(true);
      playSciFiSound('radar_ping');
      triggerHaptic('tap');
      setTimeout(() => setActiveBlip(false), 800);
    }, 5500);

    return () => clearInterval(pingTimer);
  }, [status]);

  const toggleSound = () => {
    const next = !soundOn;
    setSoundOn(next);
    setSoundEnabled(next);
    triggerHaptic('tap');
  };

  const handleRadarTap = () => {
    // Only vibrate on tap
    triggerHaptic('selection');
    setActiveBlip(true);
    setTimeout(() => setActiveBlip(false), 900);
    if (onBlipClick) onBlipClick();
  };

  const isTransferring = status === 'transferring';
  const isConnected = status === 'connected' || isTransferring;

  return (
    <div className="flex flex-col items-center select-none w-full max-w-sm mx-auto">
      {/* Top HUD Telemetry Header */}
      {showTelemetry && (
        <div className="w-full flex items-center justify-between text-[10px] font-mono uppercase tracking-wider text-slate-500 dark:text-neutral-400 mb-2 px-3">
          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping inline-block" />
            <span className="font-bold text-slate-800 dark:text-neutral-200">
              {status === 'waiting' && 'RADAR SEEKING'}
              {status === 'connecting' && 'LINK HANDSHAKE'}
              {status === 'connected' && 'P2P LOCK STABLE'}
              {status === 'transferring' && 'QUANTUM FLUX BUS'}
              {status === 'completed' && 'MISSION DELIVERED'}
            </span>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-emerald-600 dark:text-emerald-400 font-bold">
              AZM: {azimuth}°
            </span>
            <button
              type="button"
              onClick={toggleSound}
              className="p-1 rounded-lg hover:bg-black/5 dark:hover:bg-white/10 transition text-slate-600 dark:text-neutral-300"
              title={soundOn ? 'Mute Sci-Fi Audio' : 'Enable Sci-Fi Audio'}
            >
              {soundOn ? <Volume2 className="w-3.5 h-3.5 text-emerald-500" /> : <VolumeX className="w-3.5 h-3.5 text-slate-400" />}
            </button>
          </div>
        </div>
      )}

      {/* Main Continuous Moving RGB Outline Radar Housing */}
      <div 
        onClick={handleRadarTap}
        className={`rgb-radar-housing ${dimensionClass} cursor-pointer group active:scale-[0.98] transition-transform`}
        role="button"
        tabIndex={0}
        aria-label="Interactive Sci-Fi Radar"
      >
        <div className="rgb-radar-inner relative flex items-center justify-center">
          
          {/* Subtle Dark/Light Glass Grid Backdrop */}
          <div className="absolute inset-0 bg-radial from-slate-900/5 via-slate-900/15 to-slate-900/40 dark:from-black/60 dark:via-black/85 dark:to-black" />
          
          {/* Holographic Scanline Overlays */}
          <div className="absolute inset-0 bg-[linear-gradient(rgba(16,185,129,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(16,185,129,0.03)_1px,transparent_1px)] bg-[size:16px_16px] pointer-events-none" />

          {/* Sweeping Radar Scanner Beam with Phosphor Trail */}
          <div 
            className="absolute inset-0 rounded-full pointer-events-none"
            style={{
              animation: `radarBeamSweep ${isTransferring ? '1.4s' : '3.2s'} linear infinite`,
            }}
          >
            <div 
              className="w-full h-full rounded-full"
              style={{
                background: 'conic-gradient(from 0deg, transparent 0deg, transparent 270deg, rgba(16, 185, 129, 0.08) 310deg, rgba(16, 185, 129, 0.35) 350deg, rgba(52, 211, 153, 0.85) 360deg)',
              }}
            />
            {/* Beam Leading Needle */}
            <div className="absolute top-0 left-1/2 -ml-[1px] w-[2px] h-1/2 bg-gradient-to-t from-emerald-400 to-white shadow-[0_0_8px_#34d399]" />
          </div>

          {/* Concentric Distance Rings */}
          <div className="absolute inset-3 rounded-full border border-emerald-500/25 dark:border-emerald-400/20 pointer-events-none" />
          <div className="absolute inset-9 rounded-full border border-emerald-500/20 dark:border-emerald-400/15 pointer-events-none" />
          <div className="absolute inset-16 rounded-full border border-dashed border-emerald-500/30 dark:border-emerald-400/25 pointer-events-none" />
          <div className="absolute inset-24 rounded-full border border-emerald-500/35 dark:border-emerald-400/30 pointer-events-none" />

          {/* Crosshairs & Axis Reticle */}
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <div className="w-full h-[1px] bg-gradient-to-r from-transparent via-emerald-500/30 to-transparent" />
            <div className="absolute h-full w-[1px] bg-gradient-to-b from-transparent via-emerald-500/30 to-transparent" />
          </div>

          {/* Compass Degree Markers */}
          <span className="absolute top-1 text-[8px] font-mono font-bold text-emerald-600 dark:text-emerald-400 pointer-events-none">000°</span>
          <span className="absolute right-1 text-[8px] font-mono font-bold text-emerald-600 dark:text-emerald-400 pointer-events-none">090°</span>
          <span className="absolute bottom-1 text-[8px] font-mono font-bold text-emerald-600 dark:text-emerald-400 pointer-events-none">180°</span>
          <span className="absolute left-1 text-[8px] font-mono font-bold text-emerald-600 dark:text-emerald-400 pointer-events-none">270°</span>

          {/* Animated Ping Waves expanding outward */}
          <div 
            className="absolute rounded-full border-2 border-emerald-400/70 pointer-events-none"
            style={{
              width: '100%',
              height: '100%',
              animation: 'radarPingWave 2.8s cubic-bezier(0.1, 0.8, 0.3, 1) infinite',
            }}
          />
          <div 
            className="absolute rounded-full border-2 border-cyan-400/60 pointer-events-none"
            style={{
              width: '100%',
              height: '100%',
              animation: 'radarPingWave 2.8s cubic-bezier(0.1, 0.8, 0.3, 1) infinite',
              animationDelay: '1.4s',
            }}
          />

          {/* Peer Radar Blips */}
          {/* Central Host Node */}
          <div className="relative z-10 w-9 h-9 sm:w-11 sm:h-11 rounded-2xl bg-gradient-to-tr from-emerald-500 to-teal-400 p-[1.5px] shadow-lg shadow-emerald-500/40 flex items-center justify-center group-hover:scale-110 transition-transform">
            <div className="w-full h-full rounded-2xl bg-slate-900 flex items-center justify-center text-emerald-400">
              {isConnected ? (
                <Wifi className="w-4 h-4 sm:w-5 sm:h-5 animate-pulse text-emerald-300" />
              ) : (
                <Radio className="w-4 h-4 sm:w-5 sm:h-5 text-emerald-400 animate-pulse" />
              )}
            </div>
          </div>

          {/* Peer Blip 1: Target Device */}
          <div 
            className={`absolute top-1/4 right-1/4 z-10 transition-all duration-300 ${
              isConnected || activeBlip ? 'opacity-100 scale-100' : 'opacity-70 scale-90'
            }`}
          >
            <div className="relative">
              <span className="absolute -inset-1 rounded-full bg-cyan-400/60 animate-ping" />
              <div className="relative w-3.5 h-3.5 rounded-full bg-cyan-400 border-2 border-white shadow-[0_0_10px_#22d3ee] flex items-center justify-center">
                <span className="w-1 h-1 rounded-full bg-white" />
              </div>
            </div>
          </div>

          {/* Secondary Ghost Blip (signaling mesh) */}
          <div className="absolute bottom-1/3 left-1/4 z-10 opacity-50">
            <div className="w-2.5 h-2.5 rounded-full bg-emerald-400/60 border border-white/50" />
          </div>

          {/* Code Overlay badge at center-bottom */}
          {code && (
            <div className="absolute bottom-4 z-20 px-3 py-1 rounded-full bg-black/60 backdrop-blur-md border border-white/20 text-white font-mono text-[11px] font-bold tracking-widest shadow-md">
              {code}
            </div>
          )}
        </div>
      </div>

      {/* Bottom Live Sci-Fi Telemetry Footer */}
      {showTelemetry && (
        <div className="w-full mt-3 grid grid-cols-3 gap-2 text-center text-[10px] font-mono">
          <div className="p-1.5 rounded-xl liquid-glass-panel border border-black/5 dark:border-white/10">
            <span className="text-slate-500 dark:text-neutral-400 block text-[9px]">ENCRYPT</span>
            <span className="font-bold text-emerald-600 dark:text-emerald-400">AES-256-GCM</span>
          </div>

          <div className="p-1.5 rounded-xl liquid-glass-panel border border-black/5 dark:border-white/10">
            <span className="text-slate-500 dark:text-neutral-400 block text-[9px]">SIGNAL</span>
            <span className="font-bold text-cyan-600 dark:text-cyan-400">-38 dBm</span>
          </div>

          <div className="p-1.5 rounded-xl liquid-glass-panel border border-black/5 dark:border-white/10">
            <span className="text-slate-500 dark:text-neutral-400 block text-[9px]">TOPOLOGY</span>
            <span className="font-bold text-purple-600 dark:text-purple-400">P2P MESH</span>
          </div>
        </div>
      )}
    </div>
  );
};

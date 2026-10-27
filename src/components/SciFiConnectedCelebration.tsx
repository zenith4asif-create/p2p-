import React, { useEffect, useState } from 'react';
import { 
  CheckCircle2, 
  Smartphone, 
  Wifi, 
  ShieldCheck, 
  Sparkles, 
  X, 
  Zap,
  Radio,
  Lock
} from 'lucide-react';
import { triggerHaptic, playSciFiSound } from '../utils/haptics.ts';
import { RGBLightBox } from './RGBLightBox.tsx';

interface SciFiConnectedCelebrationProps {
  isOpen: boolean;
  onDismiss: () => void;
  deviceName?: string;
  shareCode?: string;
}

export const SciFiConnectedCelebration: React.FC<SciFiConnectedCelebrationProps> = ({
  isOpen,
  onDismiss,
  deviceName = 'Remote Peer Device',
  shareCode,
}) => {
  const [stage, setStage] = useState<'locking' | 'confirmed'>('locking');

  useEffect(() => {
    if (!isOpen) {
      setStage('locking');
      return;
    }

    // Phase 1: Trigger physical tactile vibration & futuristic audio
    triggerHaptic('connect');
    playSciFiSound('device_connected');

    // Phase 2: Lock into confirmed state
    const lockTimer = setTimeout(() => {
      setStage('confirmed');
      triggerHaptic('quantum_lock');
      playSciFiSound('quantum_lock');
    }, 900);

    // Auto-dismiss after 4.5 seconds if user doesn't close
    const dismissTimer = setTimeout(() => {
      onDismiss();
    }, 4500);

    return () => {
      clearTimeout(lockTimer);
      clearTimeout(dismissTimer);
    };
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-md animate-in fade-in duration-300">
      
      {/* Container with Continuous Moving RGB Outline Laser (strictly 2px outline line, zero card fill) */}
      <RGBLightBox 
        className="w-full max-w-sm shadow-2xl animate-in zoom-in-95 duration-300" 
        innerClassName="p-6 bg-slate-950/90 text-white relative overflow-hidden text-center"
      >
          
          {/* Holographic matrix grid */}
          <div className="absolute inset-0 bg-[linear-gradient(rgba(16,185,129,0.05)_1px,transparent_1px),linear-gradient(90deg,rgba(16,185,129,0.05)_1px,transparent_1px)] bg-[size:14px_14px] pointer-events-none" />

          {/* Close button */}
          <button
            type="button"
            onClick={onDismiss}
            className="absolute top-3.5 right-3.5 p-1.5 rounded-full hover:bg-white/10 text-neutral-400 hover:text-white transition z-20"
            aria-label="Dismiss Celebration"
          >
            <X className="w-4 h-4" />
          </button>

          {/* Central Rotating Quantum Reticle */}
          <div className="relative my-4 flex items-center justify-center">
            
            {/* Outer Counter-Clockwise HUD Reticle Ring */}
            <div 
              className="absolute w-36 h-36 rounded-full border border-dashed border-cyan-400/40 pointer-events-none"
              style={{ animation: 'targetLockReticle 6s linear infinite reverse' }}
            />

            {/* Inner Clockwise HUD Reticle Ring */}
            <div 
              className="absolute w-28 h-28 rounded-full border-2 border-emerald-400/50 border-t-white pointer-events-none"
              style={{ animation: 'targetLockReticle 4s linear infinite' }}
            />

            {/* Pulsing Quantum Core Circle */}
            <div className="relative w-20 h-20 rounded-2xl bg-gradient-to-tr from-emerald-500 via-teal-400 to-cyan-400 p-[2px] shadow-[0_0_25px_rgba(16,185,129,0.5)]">
              <div className="w-full h-full rounded-2xl bg-slate-900 flex items-center justify-center">
                {stage === 'locking' ? (
                  <Wifi className="w-9 h-9 text-cyan-400 animate-pulse" />
                ) : (
                  <CheckCircle2 className="w-9 h-9 text-emerald-400 animate-bounce" />
                )}
              </div>
            </div>

            {/* Floating Energy Sparks */}
            <div className="absolute -top-1 -right-1 text-emerald-400 animate-ping">
              <Sparkles className="w-4 h-4" />
            </div>
            <div className="absolute -bottom-1 -left-1 text-cyan-400 animate-ping" style={{ animationDelay: '0.4s' }}>
              <Zap className="w-4 h-4" />
            </div>
          </div>

          {/* HUD Status Header */}
          <div className="relative z-10 space-y-1">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 text-[10px] font-mono font-bold tracking-widest uppercase mb-1">
              <Lock className="w-3 h-3" />
              <span>QUANTUM P2P LINK ESTABLISHED</span>
            </div>

            <h3 className="text-xl font-black tracking-tight text-white uppercase">
              DEVICE CONNECTED!
            </h3>

            <p className="text-xs text-neutral-300 font-medium">
              WebRTC direct high-speed datachannel successfully synchronized.
            </p>
          </div>

          {/* Telemetry Badge Grid */}
          <div className="relative z-10 mt-5 grid grid-cols-2 gap-2 text-left text-[11px] font-mono">
            <div className="p-2.5 rounded-xl bg-white/5 border border-white/10">
              <span className="text-neutral-400 text-[9px] block">REMOTE PEER</span>
              <span className="font-bold text-white flex items-center gap-1 truncate">
                <Smartphone className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
                {deviceName}
              </span>
            </div>

            <div className="p-2.5 rounded-xl bg-white/5 border border-white/10">
              <span className="text-neutral-400 text-[9px] block">SECURITY</span>
              <span className="font-bold text-emerald-400 flex items-center gap-1">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                ZERO RETENTION
              </span>
            </div>
          </div>

          {/* Action button */}
          <div className="relative z-10 mt-5">
            <button
              type="button"
              onClick={onDismiss}
              className="w-full min-h-[44px] rounded-xl liquid-glass-accent text-white font-black text-xs uppercase tracking-wider transition active:scale-95 shadow-lg shadow-emerald-500/25 flex items-center justify-center gap-1.5"
            >
              <span>Commence High-Speed Stream</span>
              <Zap className="w-3.5 h-3.5" />
            </button>
        </div>
      </RGBLightBox>

    </div>
  );
};

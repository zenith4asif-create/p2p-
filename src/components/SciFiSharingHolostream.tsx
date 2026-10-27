import React, { useEffect, useState } from 'react';
import { 
  Zap, 
  Cpu, 
  ArrowRight, 
  Radio, 
  ShieldCheck, 
  Binary, 
  Activity, 
  Sparkles,
  Layers,
  CheckCircle2
} from 'lucide-react';
import { TransferProgress } from '../types.ts';
import { formatBytes, formatSpeed } from '../utils/helpers.ts';
import { triggerHaptic, playSciFiSound } from '../utils/haptics.ts';

interface SciFiSharingHolostreamProps {
  progress: TransferProgress | null;
  mode: 'sender' | 'receiver';
  fileCount: number;
  totalSize: number;
}

export const SciFiSharingHolostream: React.FC<SciFiSharingHolostreamProps> = ({
  progress,
  mode,
  fileCount,
  totalSize,
}) => {
  const [pulseIdx, setPulseIdx] = useState<number>(0);
  const [packetHex, setPacketHex] = useState<string>('0x7F4A...B9C2');

  // Continually update quantum packet signature
  useEffect(() => {
    const timer = setInterval(() => {
      setPulseIdx((p) => (p + 1) % 6);
      const hex = '0x' + Math.floor(Math.random() * 0xFFFFFF).toString(16).toUpperCase().padStart(6, '0');
      setPacketHex(hex + '...SYNC');
    }, 400);

    return () => clearInterval(timer);
  }, []);

  const percent = progress?.percent ?? 0;
  const speedStr = progress ? formatSpeed(progress.speedBytesPerSec) : 'Direct P2P Link';

  return (
    <div className="w-full select-none">
      {/* Sci-Fi Holo Beam Header with Moving RGB Border */}
      <div className="relative rounded-2xl p-4 overflow-hidden rgb-moving-border bg-slate-950/85 text-white shadow-xl">
        
        {/* Holographic matrix background scan grid */}
        <div className="absolute inset-0 bg-[linear-gradient(rgba(34,211,238,0.04)_1px,transparent_1px),linear-gradient(90deg,rgba(34,211,238,0.04)_1px,transparent_1px)] bg-[size:12px_12px] pointer-events-none" />
        
        {/* Live Scanline Ray */}
        <div 
          className="absolute inset-0 bg-gradient-to-b from-transparent via-cyan-400/10 to-transparent pointer-events-none"
          style={{ animation: 'holographicScanline 3s linear infinite' }}
        />

        {/* Top Channel Telemetry */}
        <div className="relative z-10 flex items-center justify-between text-[10px] font-mono border-b border-cyan-500/20 pb-2 mb-3">
          <div className="flex items-center gap-1.5 text-cyan-400 font-bold">
            <Activity className="w-3.5 h-3.5 animate-pulse text-cyan-300" />
            <span>QUANTUM PHOTONIC PIPE // ACTIVE</span>
          </div>
          <div className="flex items-center gap-2 text-neutral-400">
            <span>PACKET: <span className="text-emerald-400 font-bold">{packetHex}</span></span>
            <span className="px-1.5 py-0.5 rounded bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 text-[9px]">
              E2EE
            </span>
          </div>
        </div>

        {/* Central Dual Node Photonic Conduit */}
        <div className="relative z-10 py-3 flex items-center justify-between gap-2">
          
          {/* Node 1: Sender Node */}
          <div className="flex flex-col items-center">
            <div className="relative">
              <span className="absolute -inset-1 rounded-2xl bg-emerald-500/40 blur-sm animate-pulse" />
              <div className="relative w-12 h-12 rounded-2xl bg-gradient-to-tr from-emerald-600 to-teal-500 p-[1.5px] flex items-center justify-center">
                <div className="w-full h-full rounded-2xl bg-slate-900 flex items-center justify-center text-emerald-400">
                  <Radio className="w-5 h-5 animate-pulse" />
                </div>
              </div>
            </div>
            <span className="text-[10px] font-mono font-bold text-emerald-400 mt-1.5">
              {mode === 'sender' ? 'LOCAL (TX)' : 'REMOTE (TX)'}
            </span>
          </div>

          {/* Central Conduit: Laser Beam & Flying Photons */}
          <div className="relative flex-1 px-3">
            {/* Base Laser Conduit Track */}
            <div className="relative w-full h-3 bg-slate-900/90 rounded-full border border-cyan-500/40 overflow-hidden shadow-[0_0_15px_rgba(6,182,212,0.35)]">
              
              {/* Dynamic Fill Bar */}
              <div 
                className="h-full bg-gradient-to-r from-emerald-500 via-cyan-400 to-pink-500 transition-all duration-200"
                style={{ width: `${Math.max(percent, 8)}%` }}
              />

              {/* High-speed Photon Energy Pulses */}
              <div 
                className="absolute inset-y-0 w-8 bg-gradient-to-r from-transparent via-white to-transparent opacity-90"
                style={{ animation: 'quantumPacketTravel 1.1s linear infinite' }}
              />
              <div 
                className="absolute inset-y-0 w-8 bg-gradient-to-r from-transparent via-cyan-200 to-transparent opacity-75"
                style={{ animation: 'quantumPacketTravel 1.1s linear infinite', animationDelay: '0.55s' }}
              />
            </div>

            {/* Orbiting Quantum Particles */}
            <div className="flex items-center justify-between mt-1 text-[9px] font-mono text-neutral-400 px-1">
              <span className="text-cyan-300 font-bold">{speedStr}</span>
              <span className="font-bold text-pink-400">{percent}% SYNCED</span>
            </div>
          </div>

          {/* Node 2: Receiver Node */}
          <div className="flex flex-col items-center">
            <div className="relative">
              <span className="absolute -inset-1 rounded-2xl bg-cyan-500/40 blur-sm animate-pulse" />
              <div className="relative w-12 h-12 rounded-2xl bg-gradient-to-tr from-cyan-600 to-blue-500 p-[1.5px] flex items-center justify-center">
                <div className="w-full h-full rounded-2xl bg-slate-900 flex items-center justify-center text-cyan-400">
                  <Cpu className="w-5 h-5 animate-pulse" />
                </div>
              </div>
            </div>
            <span className="text-[10px] font-mono font-bold text-cyan-400 mt-1.5">
              {mode === 'receiver' ? 'LOCAL (RX)' : 'REMOTE (RX)'}
            </span>
          </div>

        </div>

        {/* Realtime Chunk & Throughput Telemetry Badges */}
        <div className="relative z-10 mt-3 pt-2 border-t border-cyan-500/20 grid grid-cols-3 gap-2 text-center text-[10px] font-mono">
          <div className="p-1.5 rounded-lg bg-black/40 border border-white/5">
            <span className="text-neutral-400 block text-[9px]">TOTAL PAYLOAD</span>
            <span className="font-bold text-neutral-200">{formatBytes(totalSize)}</span>
          </div>

          <div className="p-1.5 rounded-lg bg-black/40 border border-white/5">
            <span className="text-neutral-400 block text-[9px]">DATA BLOCKS</span>
            <span className="font-bold text-emerald-400">
              {progress ? `${formatBytes(progress.bytesTransferred)}` : `${fileCount} items`}
            </span>
          </div>

          <div className="p-1.5 rounded-lg bg-black/40 border border-white/5">
            <span className="text-neutral-400 block text-[9px]">STATUS</span>
            <span className="font-bold text-cyan-400">STREAMING</span>
          </div>
        </div>

      </div>
    </div>
  );
};

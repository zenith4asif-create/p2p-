import React from 'react';
import { Zap, Clock, Activity, ArrowUpRight, ArrowDownLeft, ShieldCheck, Sparkles } from 'lucide-react';
import { TransferProgress } from '../types.ts';
import { formatBytes, formatSpeed } from '../utils/helpers.ts';

interface QuantumProgressBarProps {
  progress: TransferProgress | null;
  mode?: 'upload' | 'download' | 'sender' | 'receiver';
  title?: string;
  className?: string;
}

export const QuantumProgressBar: React.FC<QuantumProgressBarProps> = ({
  progress,
  mode = 'upload',
  title,
  className = '',
}) => {
  if (!progress) return null;

  const percent = Math.min(100, Math.max(0, progress.percent || 0));
  const isUpload = mode === 'upload' || mode === 'sender';

  return (
    <div className={`w-full select-none ${className}`}>
      <div className="relative rounded-2xl liquid-glass-card p-4 sm:p-5 overflow-hidden shadow-lg border border-white/20 dark:border-white/10">
        
        {/* Subtle Cybernetic Background Scan Grid */}
        <div 
          className="absolute inset-0 pointer-events-none opacity-[0.06] dark:opacity-[0.1]" 
          style={{
            backgroundImage: `radial-gradient(circle at 1px 1px, currentColor 1px, transparent 0)`,
            backgroundSize: '16px 16px'
          }}
        />

        {/* Top Header: Packet Stream Status & Percentage */}
        <div className="relative z-10 flex items-center justify-between gap-2 mb-2.5">
          <div className="flex items-center gap-2 min-w-0">
            <div className={`p-1.5 rounded-xl shrink-0 ${isUpload ? 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400' : 'bg-cyan-500/15 text-cyan-600 dark:text-cyan-400'}`}>
              {isUpload ? <ArrowUpRight className="w-4 h-4 stroke-[2.5]" /> : <ArrowDownLeft className="w-4 h-4 stroke-[2.5]" />}
            </div>
            <div className="truncate">
              <span className="text-[10px] font-mono font-bold tracking-wider uppercase text-slate-500 dark:text-neutral-400 block leading-tight">
                {title || (isUpload ? 'Quantum Transmission Beam' : 'Quantum Reception Conduit')}
              </span>
              <p className="font-semibold text-xs sm:text-sm text-slate-900 dark:text-white truncate">
                {progress.fileName}
              </p>
            </div>
          </div>

          <div className="text-right shrink-0">
            <span className="font-mono text-xl sm:text-2xl font-black tracking-tight bg-gradient-to-r from-emerald-500 via-teal-400 to-cyan-500 bg-clip-text text-transparent">
              {percent}%
            </span>
          </div>
        </div>

        {/* Quantum Packet Energy Track */}
        <div className="relative z-10 my-3">
          {/* Main Track Background */}
          <div className="relative w-full h-4 sm:h-5 rounded-full bg-slate-200/70 dark:bg-black/50 p-0.5 overflow-hidden shadow-inner ring-1 ring-black/10 dark:ring-white/10">
            
            {/* Filled Progress Bar with Holographic Gradient */}
            <div
              className="h-full rounded-full bg-gradient-to-r from-emerald-500 via-teal-400 to-cyan-400 relative transition-all duration-150 ease-out shadow-[0_0_12px_rgba(16,185,129,0.5)]"
              style={{ width: `${Math.max(4, percent)}%` }}
            >
              {/* Internal Holographic Scanwave */}
              <div 
                className="absolute inset-0 opacity-70 bg-gradient-to-r from-transparent via-white to-transparent"
                style={{
                  animation: 'holographicScan 1.8s linear infinite',
                  backgroundSize: '200% 100%'
                }}
              />

              {/* Leading Quantum Head Node / Spark Emitter */}
              <div className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-1/2 w-4 h-4 rounded-full bg-white shadow-[0_0_12px_#10b981] ring-2 ring-emerald-300 flex items-center justify-center">
                <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping" />
              </div>
            </div>

            {/* Traveling Quantum Packets across track */}
            <div className="absolute inset-0 pointer-events-none flex items-center overflow-hidden">
              {/* Packet 1 */}
              <div 
                className="w-10 h-1.5 rounded-full bg-gradient-to-r from-transparent via-cyan-300 to-white shadow-[0_0_10px_#38bdf8] opacity-80"
                style={{
                  animation: 'quantumTrackPacketTravel 1.6s cubic-bezier(0.4, 0, 0.2, 1) infinite',
                }}
              />
              {/* Packet 2 with delay */}
              <div 
                className="w-14 h-1.5 rounded-full bg-gradient-to-r from-transparent via-emerald-300 to-white shadow-[0_0_10px_#34d399] opacity-90"
                style={{
                  animation: 'quantumTrackPacketTravel 2.1s cubic-bezier(0.4, 0, 0.2, 1) infinite 0.7s',
                }}
              />
              {/* Packet 3 micro-photon */}
              <div 
                className="w-5 h-1 rounded-full bg-white shadow-[0_0_12px_#fff] opacity-95"
                style={{
                  animation: 'quantumTrackPacketTravel 1.2s cubic-bezier(0.4, 0, 0.2, 1) infinite 0.3s',
                }}
              />
            </div>
          </div>
        </div>

        {/* Transfer HUD Telemetry Metrics Footer */}
        <div className="relative z-10 grid grid-cols-3 gap-2 pt-2 border-t border-black/10 dark:border-white/10 text-[11px] font-mono">
          
          {/* Byte Accumulation */}
          <div className="flex items-center gap-1.5 text-slate-700 dark:text-neutral-300">
            <Activity className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
            <span className="truncate">
              {formatBytes(progress.bytesTransferred)} / {formatBytes(progress.totalBytes)}
            </span>
          </div>

          {/* Speed Indicator */}
          <div className="flex items-center justify-center gap-1.5 text-slate-700 dark:text-neutral-300">
            <Zap className="w-3.5 h-3.5 text-cyan-500 shrink-0" />
            <span className="font-bold text-cyan-600 dark:text-cyan-400">
              {formatSpeed(progress.speedBytesPerSec)}
            </span>
          </div>

          {/* Time Remaining / ETA */}
          <div className="flex items-center justify-end gap-1.5 text-slate-700 dark:text-neutral-300">
            <Clock className="w-3.5 h-3.5 text-amber-500 shrink-0" />
            <span>
              ETA: <span className="font-bold text-amber-600 dark:text-amber-300">{progress.etaSeconds}s</span>
            </span>
          </div>
        </div>

        {/* Micro Quantum Integrity Badge */}
        <div className="mt-2.5 flex items-center justify-between text-[10px] font-mono text-slate-500 dark:text-neutral-400">
          <div className="flex items-center gap-1">
            <Sparkles className="w-3 h-3 text-emerald-500 animate-spin" />
            <span>QUANTUM CHUNK STREAM</span>
          </div>
          <span>FILE {progress.fileIndex} OF {progress.totalFiles}</span>
        </div>

      </div>
    </div>
  );
};

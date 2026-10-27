import React, { useState, useEffect } from 'react';
import { 
  Send, 
  Download, 
  QrCode, 
  Clock, 
  Zap, 
  Cloud, 
  Trash2, 
  ArrowRight, 
  ShieldCheck, 
  HardDrive, 
  Activity 
} from 'lucide-react';
import { useAuth } from '../context/AuthContext.tsx';
import { HistoryItem } from '../types.ts';
import { formatBytes, getLocalHistory, isShareExpired, removeFromHistory } from '../utils/helpers.ts';
import { useToast } from '../context/ToastContext.tsx';

interface DashboardViewProps {
  onNavigate: (view: string, param?: string) => void;
  onOpenScanner: () => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  onNavigate,
  onOpenScanner,
}) => {
  const { user } = useAuth();
  const { showToast } = useToast();
  const [historyItems, setHistoryItems] = useState<HistoryItem[]>([]);

  useEffect(() => {
    setHistoryItems(getLocalHistory());
  }, []);

  const handleDeleteItem = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    removeFromHistory(id);
    setHistoryItems((prev) => prev.filter((i) => i.id !== id));
    showToast('Record removed from history', 'info');
  };

  const activeShares = historyItems.filter((i) => !isShareExpired(i.expiresAt));
  const recentShares = historyItems.slice(0, 5);
  const totalTransferredBytes = historyItems.reduce((acc, curr) => acc + curr.totalSize, 0);

  return (
    <div className="max-w-6xl mx-auto px-4 py-6 sm:py-10 select-none">
      
      {/* Welcome Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 sm:mb-8">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
            Welcome, {user?.displayName || user?.email?.split('@')[0] || 'Explorer'}
          </h1>
          <div className="flex flex-wrap items-center gap-2 text-xs text-slate-600 dark:text-neutral-300 mt-1">
            <span>Active transfers</span>
            <span aria-hidden="true">·</span>
            <span>Local session logs</span>
            <span aria-hidden="true">·</span>
            <span className="text-emerald-600 dark:text-emerald-400 font-mono font-bold">10m Privacy Purge</span>
          </div>
        </div>

        <button
          type="button"
          onClick={() => onNavigate('create')}
          className="self-start sm:self-auto min-h-[44px] px-5 py-2.5 rounded-2xl liquid-glass-accent text-white font-black text-xs shadow-lg shadow-emerald-500/25 transition flex items-center gap-2 active:scale-95"
        >
          <Send className="w-3.5 h-3.5 stroke-[2.5]" />
          <span>New Share</span>
        </button>
      </div>

      {/* Main Action Cards: SEND, RECEIVE, SCAN QR (iOS Liquid Transparent Glass) */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
        <div
          onClick={() => onNavigate('create')}
          className="p-6 rounded-3xl liquid-glass-card hover:border-emerald-500/50 cursor-pointer transition-all hover:scale-[1.01] active:scale-[0.99] group shadow-md"
        >
          <div className="w-12 h-12 rounded-2xl liquid-glass-button text-emerald-600 dark:text-emerald-400 flex items-center justify-center mb-4 group-hover:scale-110 transition shadow-sm">
            <Send className="w-6 h-6 stroke-[2.5]" />
          </div>
          <h2 className="text-lg font-bold text-slate-900 dark:text-white mb-1">SEND FILES</h2>
          <p className="text-xs text-slate-600 dark:text-neutral-300 leading-relaxed mb-3">
            Pick files from your device and stream via QR code, short code, or WebRTC link.
          </p>
          <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-1 group-hover:translate-x-1 transition-transform">
            Start Sending <ArrowRight className="w-3.5 h-3.5" />
          </span>
        </div>

        <div
          onClick={() => onNavigate('receive')}
          className="p-6 rounded-3xl liquid-glass-card hover:border-teal-500/50 cursor-pointer transition-all hover:scale-[1.01] active:scale-[0.99] group shadow-md"
        >
          <div className="w-12 h-12 rounded-2xl liquid-glass-button text-teal-600 dark:text-teal-400 flex items-center justify-center mb-4 group-hover:scale-110 transition shadow-sm">
            <Download className="w-6 h-6 stroke-[2.5]" />
          </div>
          <h2 className="text-lg font-bold text-slate-900 dark:text-white mb-1">RECEIVE FILES</h2>
          <p className="text-xs text-slate-600 dark:text-neutral-300 leading-relaxed mb-3">
            Enter a 6-digit short code to join an active transfer session and stream directly.
          </p>
          <span className="text-xs font-bold text-teal-600 dark:text-teal-300 flex items-center gap-1 group-hover:translate-x-1 transition-transform">
            Enter Code <ArrowRight className="w-3.5 h-3.5" />
          </span>
        </div>

        <div
          onClick={onOpenScanner}
          className="p-6 rounded-3xl liquid-glass-card hover:border-cyan-500/50 cursor-pointer transition-all hover:scale-[1.01] active:scale-[0.99] group shadow-md"
        >
          <div className="w-12 h-12 rounded-2xl liquid-glass-button text-cyan-600 dark:text-cyan-400 flex items-center justify-center mb-4 group-hover:scale-110 transition shadow-sm">
            <QrCode className="w-6 h-6 stroke-[2.5]" />
          </div>
          <h2 className="text-lg font-bold text-slate-900 dark:text-white mb-1">SCAN QR CODE</h2>
          <p className="text-xs text-slate-600 dark:text-neutral-300 leading-relaxed mb-3">
            Scan a ShareFlow QR code on mobile or desktop for instant zero-config pairing.
          </p>
          <span className="text-xs font-bold text-cyan-600 dark:text-cyan-300 flex items-center gap-1 group-hover:translate-x-1 transition-transform">
            Open Camera <ArrowRight className="w-3.5 h-3.5" />
          </span>
        </div>
      </div>

      {/* Metrics Row (iOS Liquid Glass Panels) */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5 mb-8">
        <div className="p-4 rounded-3xl liquid-glass-card shadow-sm">
          <div className="flex items-center gap-2 text-slate-500 dark:text-neutral-400 text-xs mb-1">
            <Activity className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
            <span>Active Shares</span>
          </div>
          <p className="text-xl font-mono font-bold text-slate-900 dark:text-white tabular-nums">{activeShares.length}</p>
        </div>

        <div className="p-4 rounded-3xl liquid-glass-card shadow-sm">
          <div className="flex items-center gap-2 text-slate-500 dark:text-neutral-400 text-xs mb-1">
            <HardDrive className="w-3.5 h-3.5 text-cyan-600 dark:text-cyan-400" />
            <span>Total Volume</span>
          </div>
          <p className="text-xl font-mono font-bold text-slate-900 dark:text-white tabular-nums">{formatBytes(totalTransferredBytes)}</p>
        </div>

        <div className="p-4 rounded-3xl liquid-glass-card shadow-sm">
          <div className="flex items-center gap-2 text-slate-500 dark:text-neutral-400 text-xs mb-1">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
            <span>Privacy Rule</span>
          </div>
          <p className="text-sm font-bold text-emerald-600 dark:text-emerald-300">10m Hard Expiry</p>
        </div>

        <div className="p-4 rounded-3xl liquid-glass-card shadow-sm">
          <div className="flex items-center gap-2 text-slate-500 dark:text-neutral-400 text-xs mb-1">
            <Clock className="w-3.5 h-3.5 text-amber-500 dark:text-amber-400" />
            <span>Total History</span>
          </div>
          <p className="text-xl font-mono font-bold text-slate-900 dark:text-white tabular-nums">{historyItems.length}</p>
        </div>
      </div>

      {/* Active Shares Section */}
      {activeShares.length > 0 && (
        <div className="mb-8 liquid-glass-card rounded-3xl p-5 sm:p-6 shadow-md">
          <div className="flex items-center justify-between pb-3 border-b border-black/10 dark:border-white/10 mb-4">
            <h3 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-500 dark:bg-emerald-400 animate-ping" />
              <span>Active Shares In Flight ({activeShares.length})</span>
            </h3>
          </div>

          <div className="space-y-2.5">
            {activeShares.map((item) => (
              <div
                key={item.id}
                onClick={() => onNavigate('receive', item.code)}
                className="flex items-center justify-between gap-3 p-3.5 rounded-2xl liquid-glass-input hover:border-emerald-500/50 cursor-pointer transition shadow-sm"
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-xl liquid-glass-button text-emerald-600 dark:text-emerald-400 flex items-center justify-center font-mono font-bold text-xs">
                    {item.mode === 'p2p' ? <Zap className="w-4 h-4" /> : <Cloud className="w-4 h-4" />}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-mono font-bold text-slate-900 dark:text-white text-sm">{item.code}</span>
                      <span className="text-[10px] uppercase font-bold text-emerald-600 dark:text-emerald-300">
                        Active
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-500 dark:text-neutral-400 font-mono">
                      {item.fileCount} {item.fileCount === 1 ? 'file' : 'files'} · {formatBytes(item.totalSize)} · {item.firstFileName}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <span className="text-xs text-amber-600 dark:text-amber-400 font-mono hidden sm:inline tabular-nums">
                    {Math.max(0, Math.floor((item.expiresAt - Date.now()) / 1000 / 60))}m left
                  </span>
                  <button
                    type="button"
                    onClick={(e) => handleDeleteItem(item.id, e)}
                    className="min-h-[36px] min-w-[36px] p-1.5 rounded-xl liquid-glass-button text-slate-400 dark:text-neutral-400 hover:text-rose-500 dark:hover:text-rose-400 flex items-center justify-center shadow-sm"
                    aria-label="Remove share from list"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Recent History Section */}
      <div className="liquid-glass-card rounded-3xl p-5 sm:p-6 shadow-md">
        <div className="flex items-center justify-between pb-3 border-b border-black/10 dark:border-white/10 mb-4">
          <h3 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider">
            Recent Sessions
          </h3>
          <button
            type="button"
            onClick={() => onNavigate('history')}
            className="text-xs text-emerald-600 dark:text-emerald-400 hover:text-emerald-500 dark:hover:text-emerald-300 font-semibold transition"
          >
            View all
          </button>
        </div>

        {recentShares.length === 0 ? (
          <p className="text-xs text-slate-500 dark:text-neutral-400 py-6 text-center">
            No transfer sessions yet. Tap "SEND FILES" or "RECEIVE FILES" to get started!
          </p>
        ) : (
          <div className="space-y-2.5">
            {recentShares.map((item) => {
              const expired = isShareExpired(item.expiresAt);

              return (
                <div
                  key={item.id}
                  className="flex items-center justify-between gap-3 p-3 rounded-2xl liquid-glass-input text-xs"
                >
                  <div className="flex items-center gap-3">
                    <span className="font-mono font-bold text-slate-800 dark:text-neutral-200">{item.code}</span>
                    <span className="text-slate-500 dark:text-neutral-400 truncate max-w-[150px] sm:max-w-xs">
                      {item.firstFileName}
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    <span className="font-mono text-slate-500 dark:text-neutral-400 tabular-nums">{formatBytes(item.totalSize)}</span>
                    <span
                      className={`text-[10px] font-bold ${
                        expired ? 'text-slate-400 dark:text-neutral-500' : 'text-emerald-600 dark:text-emerald-400'
                      }`}
                    >
                      {expired ? 'Expired' : 'Active'}
                    </span>
                    <button
                      type="button"
                      onClick={(e) => handleDeleteItem(item.id, e)}
                      className="min-h-[32px] min-w-[32px] p-1 rounded-lg text-slate-400 dark:text-neutral-400 hover:text-rose-500 dark:hover:text-rose-400 flex items-center justify-center transition shadow-sm"
                      aria-label="Delete history item"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

    </div>
  );
};

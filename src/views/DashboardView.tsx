import React, { useState, useEffect } from 'react';
import { 
  Send, 
  Download, 
  QrCode, 
  Clock, 
  Zap, 
  Cloud, 
  CheckCircle2, 
  AlertCircle, 
  Trash2, 
  ArrowRight,
  ShieldCheck,
  HardDrive,
  Activity
} from 'lucide-react';
import { useAuth } from '../context/AuthContext.tsx';
import { HistoryItem } from '../types.ts';
import { formatBytes, formatTimeLeft, getLocalHistory, isShareExpired, removeFromHistory } from '../utils/helpers.ts';
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
    <div className="max-w-6xl mx-auto px-4 py-8">
      {/* Welcome Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
            Welcome, {user?.displayName || user?.email?.split('@')[0] || 'Explorer'}
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            Manage your active transfers, launch instant shares, and review temporary sessions.
          </p>
        </div>

        <button
          onClick={() => onNavigate('create')}
          className="self-start sm:self-auto px-5 py-2.5 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-xs shadow-lg shadow-cyan-500/20 transition flex items-center gap-2"
        >
          <Send className="w-3.5 h-3.5" />
          <span>New Share</span>
        </button>
      </div>

      {/* Main Action Cards: SEND, RECEIVE, SCAN QR */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
        <div
          onClick={() => onNavigate('create')}
          className="p-6 rounded-3xl bg-gradient-to-br from-cyan-950/40 to-slate-900 border border-cyan-500/30 hover:border-cyan-400/60 shadow-xl cursor-pointer transition-all hover:scale-[1.02] group"
        >
          <div className="w-12 h-12 rounded-2xl bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 flex items-center justify-center mb-4 group-hover:scale-110 transition">
            <Send className="w-6 h-6 stroke-[2.5]" />
          </div>
          <h2 className="text-lg font-bold text-white mb-1">SEND FILES</h2>
          <p className="text-xs text-slate-400 leading-relaxed mb-3">
            Pick files from your device and share via QR, short code, or WebRTC link.
          </p>
          <span className="text-xs font-bold text-cyan-400 flex items-center gap-1 group-hover:translate-x-1 transition-transform">
            Start Sending <ArrowRight className="w-3.5 h-3.5" />
          </span>
        </div>

        <div
          onClick={() => onNavigate('receive')}
          className="p-6 rounded-3xl bg-gradient-to-br from-emerald-950/30 to-slate-900 border border-emerald-500/30 hover:border-emerald-400/60 shadow-xl cursor-pointer transition-all hover:scale-[1.02] group"
        >
          <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center mb-4 group-hover:scale-110 transition">
            <Download className="w-6 h-6 stroke-[2.5]" />
          </div>
          <h2 className="text-lg font-bold text-white mb-1">RECEIVE FILES</h2>
          <p className="text-xs text-slate-400 leading-relaxed mb-3">
            Enter a 6-digit short code to join an active transfer session and download.
          </p>
          <span className="text-xs font-bold text-emerald-400 flex items-center gap-1 group-hover:translate-x-1 transition-transform">
            Enter Code <ArrowRight className="w-3.5 h-3.5" />
          </span>
        </div>

        <div
          onClick={onOpenScanner}
          className="p-6 rounded-3xl bg-gradient-to-br from-indigo-950/30 to-slate-900 border border-indigo-500/30 hover:border-indigo-400/60 shadow-xl cursor-pointer transition-all hover:scale-[1.02] group"
        >
          <div className="w-12 h-12 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 flex items-center justify-center mb-4 group-hover:scale-110 transition">
            <QrCode className="w-6 h-6 stroke-[2.5]" />
          </div>
          <h2 className="text-lg font-bold text-white mb-1">SCAN QR CODE</h2>
          <p className="text-xs text-slate-400 leading-relaxed mb-3">
            Scan a ShareFlow QR code on mobile or desktop to link and stream instantly.
          </p>
          <span className="text-xs font-bold text-indigo-400 flex items-center gap-1 group-hover:translate-x-1 transition-transform">
            Open Camera <ArrowRight className="w-3.5 h-3.5" />
          </span>
        </div>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5 mb-8">
        <div className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800">
          <div className="flex items-center gap-2 text-slate-400 text-xs mb-1">
            <Activity className="w-3.5 h-3.5 text-cyan-400" />
            <span>Active Shares</span>
          </div>
          <p className="text-xl font-mono font-bold text-white">{activeShares.length}</p>
        </div>

        <div className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800">
          <div className="flex items-center gap-2 text-slate-400 text-xs mb-1">
            <HardDrive className="w-3.5 h-3.5 text-purple-400" />
            <span>Total Volume</span>
          </div>
          <p className="text-xl font-mono font-bold text-white">{formatBytes(totalTransferredBytes)}</p>
        </div>

        <div className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800">
          <div className="flex items-center gap-2 text-slate-400 text-xs mb-1">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
            <span>Privacy Rule</span>
          </div>
          <p className="text-sm font-bold text-emerald-300">10m Hard Expiry</p>
        </div>

        <div className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800">
          <div className="flex items-center gap-2 text-slate-400 text-xs mb-1">
            <Clock className="w-3.5 h-3.5 text-amber-400" />
            <span>Total History</span>
          </div>
          <p className="text-xl font-mono font-bold text-white">{historyItems.length}</p>
        </div>
      </div>

      {/* Active Shares Section */}
      {activeShares.length > 0 && (
        <div className="mb-8 bg-slate-900/50 rounded-3xl border border-slate-800 p-6">
          <div className="flex items-center justify-between pb-3 border-b border-slate-800 mb-4">
            <h3 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
              <span>Active Shares In Flight ({activeShares.length})</span>
            </h3>
          </div>

          <div className="space-y-2.5">
            {activeShares.map((item) => (
              <div
                key={item.id}
                onClick={() => onNavigate('receive', item.code)}
                className="flex items-center justify-between gap-3 p-3.5 rounded-2xl bg-slate-950 border border-slate-800/80 hover:border-cyan-500/40 cursor-pointer transition"
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-xl bg-cyan-500/10 text-cyan-400 flex items-center justify-center font-mono font-bold text-xs">
                    {item.mode === 'p2p' ? <Zap className="w-4 h-4" /> : <Cloud className="w-4 h-4" />}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-mono font-bold text-white text-sm">{item.code}</span>
                      <span className="text-[10px] uppercase font-bold px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-300">
                        Active
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-400">
                      {item.fileCount} {item.fileCount === 1 ? 'file' : 'files'} · {formatBytes(item.totalSize)} · {item.firstFileName}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <span className="text-xs text-amber-400 font-mono hidden sm:inline">
                    {Math.max(0, Math.floor((item.expiresAt - Date.now()) / 1000 / 60))}m left
                  </span>
                  <button
                    onClick={(e) => handleDeleteItem(item.id, e)}
                    className="p-1.5 rounded-lg text-slate-400 hover:text-rose-400 transition"
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
      <div className="bg-slate-900/50 rounded-3xl border border-slate-800 p-6">
        <div className="flex items-center justify-between pb-3 border-b border-slate-800 mb-4">
          <h3 className="text-xs font-bold text-white uppercase tracking-wider">
            Recent Sessions
          </h3>
          <button
            onClick={() => onNavigate('history')}
            className="text-xs text-cyan-400 hover:text-cyan-300 transition"
          >
            View all
          </button>
        </div>

        {recentShares.length === 0 ? (
          <p className="text-xs text-slate-500 py-4 text-center">
            No transfer sessions yet. Click "SEND FILES" or "RECEIVE FILES" to get started!
          </p>
        ) : (
          <div className="space-y-2.5">
            {recentShares.map((item) => {
              const expired = isShareExpired(item.expiresAt);

              return (
                <div
                  key={item.id}
                  className="flex items-center justify-between gap-3 p-3 rounded-2xl bg-slate-950/60 border border-slate-800/60 text-xs"
                >
                  <div className="flex items-center gap-3">
                    <span className="font-mono font-bold text-slate-200">{item.code}</span>
                    <span className="text-slate-400 truncate max-w-[150px] sm:max-w-xs">
                      {item.firstFileName}
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    <span className="font-mono text-slate-400">{formatBytes(item.totalSize)}</span>
                    <span
                      className={`text-[10px] uppercase font-bold px-1.5 py-0.5 rounded ${
                        expired ? 'bg-slate-800 text-slate-400' : 'bg-emerald-500/20 text-emerald-300'
                      }`}
                    >
                      {expired ? 'Expired' : 'Active'}
                    </span>
                    <button
                      onClick={(e) => handleDeleteItem(item.id, e)}
                      className="p-1 rounded text-slate-500 hover:text-rose-400 transition"
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

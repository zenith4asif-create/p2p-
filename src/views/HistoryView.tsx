import React, { useState, useEffect } from 'react';
import { 
  Clock, 
  Trash2, 
  Zap, 
  Cloud, 
  ArrowRight, 
  Search,
  Filter,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';
import { HistoryItem } from '../types.ts';
import { formatBytes, formatTimeLeft, getLocalHistory, isShareExpired, removeFromHistory, clearLocalHistory } from '../utils/helpers.ts';
import { useToast } from '../context/ToastContext.tsx';

interface HistoryViewProps {
  onNavigate: (view: string, param?: string) => void;
}

export const HistoryView: React.FC<HistoryViewProps> = ({ onNavigate }) => {
  const { showToast } = useToast();
  const [items, setItems] = useState<HistoryItem[]>([]);
  const [filter, setFilter] = useState<'all' | 'active' | 'completed' | 'expired'>('all');
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    setItems(getLocalHistory());
  }, []);

  const handleDelete = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    removeFromHistory(id);
    setItems((prev) => prev.filter((i) => i.id !== id));
    showToast('Item deleted from history', 'info');
  };

  const handleClearAll = () => {
    if (window.confirm('Are you sure you want to clear your local transfer history?')) {
      clearLocalHistory();
      setItems([]);
      showToast('Transfer history cleared', 'info');
    }
  };

  const filteredItems = items.filter((item) => {
    const expired = isShareExpired(item.expiresAt);
    
    // Status filter
    if (filter === 'active' && expired) return false;
    if (filter === 'expired' && !expired) return false;
    if (filter === 'completed' && item.status !== 'completed') return false;

    // Search filter
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      return (
        item.code.toLowerCase().includes(q) ||
        item.firstFileName.toLowerCase().includes(q)
      );
    }

    return true;
  });

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      {/* Title */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
            Transfer History
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            Audit temporary shares, verify expiration, and manage your local session log.
          </p>
        </div>

        {items.length > 0 && (
          <button
            onClick={handleClearAll}
            className="self-start sm:self-auto text-xs text-rose-400 hover:text-rose-300 transition"
          >
            Clear All History
          </button>
        )}
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-slate-900/60 p-3 rounded-2xl border border-slate-800 mb-6">
        {/* Filter Pills */}
        <div className="flex items-center gap-1 w-full sm:w-auto">
          {(['all', 'active', 'completed', 'expired'] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setFilter(tab)}
              className={`flex-1 sm:flex-initial px-3.5 py-1.5 rounded-xl text-xs font-semibold capitalize transition ${
                filter === tab
                  ? 'bg-cyan-500 text-slate-950 shadow-sm'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800'
              }`}
            >
              {tab}
            </button>
          ))}
        </div>

        {/* Search */}
        <div className="relative w-full sm:w-64">
          <Search className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search code or filename..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-9 pr-3 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500"
          />
        </div>
      </div>

      {/* Items List */}
      {filteredItems.length === 0 ? (
        <div className="text-center py-16 bg-slate-900/30 rounded-3xl border border-dashed border-slate-800">
          <Clock className="w-10 h-10 text-slate-600 mx-auto mb-2" />
          <h3 className="text-sm font-bold text-white mb-1">No Transfers Found</h3>
          <p className="text-xs text-slate-500 max-w-xs mx-auto">
            {items.length === 0
              ? 'You have not sent or received any files yet.'
              : 'No items match your filter selection.'}
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredItems.map((item) => {
            const expired = isShareExpired(item.expiresAt);

            return (
              <div
                key={item.id}
                onClick={() => {
                  if (!expired) {
                    onNavigate('receive', item.code);
                  }
                }}
                className={`p-4 rounded-2xl bg-slate-900/60 border border-slate-800 transition ${
                  expired ? 'opacity-70' : 'hover:border-cyan-500/50 cursor-pointer'
                }`}
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-slate-800 text-cyan-400 flex items-center justify-center font-mono font-bold text-xs shrink-0">
                      {item.mode === 'p2p' ? <Zap className="w-5 h-5" /> : <Cloud className="w-5 h-5 text-purple-400" />}
                    </div>

                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-bold text-white text-sm">{item.code}</span>
                        <span className="text-[10px] uppercase font-bold px-1.5 py-0.5 rounded bg-slate-800 text-slate-300">
                          {item.role}
                        </span>
                        <span
                          className={`text-[10px] uppercase font-bold px-1.5 py-0.5 rounded ${
                            expired
                              ? 'bg-slate-800 text-slate-400'
                              : 'bg-emerald-500/20 text-emerald-300'
                          }`}
                        >
                          {expired ? 'Expired' : 'Active'}
                        </span>
                      </div>
                      <p className="text-xs text-slate-300 truncate max-w-sm mt-0.5">
                        {item.firstFileName} {item.fileCount > 1 ? `+${item.fileCount - 1} more` : ''}
                      </p>
                      <p className="text-[11px] text-slate-500 font-mono">
                        {new Date(item.createdAt).toLocaleTimeString()} · {formatBytes(item.totalSize)}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center justify-between sm:justify-end gap-3 pt-2 sm:pt-0 border-t sm:border-t-0 border-slate-800">
                    {!expired ? (
                      <span className="text-xs text-cyan-400 font-semibold flex items-center gap-1">
                        Open <ArrowRight className="w-3.5 h-3.5" />
                      </span>
                    ) : (
                      <span className="text-[11px] text-slate-500 font-mono">Self-destructed</span>
                    )}

                    <button
                      onClick={(e) => handleDelete(item.id, e)}
                      className="p-1.5 rounded-lg text-slate-500 hover:text-rose-400 transition"
                      title="Delete record"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

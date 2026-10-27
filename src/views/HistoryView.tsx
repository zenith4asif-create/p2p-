import React, { useState, useEffect } from 'react';
import { 
  Clock, 
  Trash2, 
  Zap, 
  Cloud, 
  ArrowRight, 
  Search
} from 'lucide-react';
import { HistoryItem } from '../types.ts';
import { formatBytes, getLocalHistory, isShareExpired, removeFromHistory, clearLocalHistory } from '../utils/helpers.ts';
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
    <div className="max-w-4xl mx-auto px-4 py-6 sm:py-10 select-none">
      
      {/* Title */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
            Transfer History
          </h1>
          <div className="flex flex-wrap items-center gap-2 text-xs text-slate-600 dark:text-neutral-300 mt-1">
            <span>Audit temporary shares</span>
            <span aria-hidden="true">·</span>
            <span>Verify expiration</span>
            <span aria-hidden="true">·</span>
            <span className="text-emerald-600 dark:text-emerald-400 font-mono font-bold">10m Hard Expiry</span>
          </div>
        </div>

        {items.length > 0 && (
          <button
            type="button"
            onClick={handleClearAll}
            className="self-start sm:self-auto text-xs text-rose-600 dark:text-rose-300 hover:text-rose-700 dark:hover:text-rose-200 transition min-h-[36px] px-3 py-1.5 rounded-xl liquid-glass-button hover:bg-rose-500/10 shadow-sm"
          >
            Clear All History
          </button>
        )}
      </div>

      {/* Filter and Search Bar (iOS Liquid Glass) */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 liquid-glass-card p-3 rounded-2xl mb-6 shadow-md">
        {/* Interactive Filter Tabs */}
        <div className="flex items-center gap-1 w-full sm:w-auto overflow-x-auto pb-1 sm:pb-0">
          {(['all', 'active', 'completed', 'expired'] as const).map((tab) => (
            <button
              key={tab}
              type="button"
              onClick={() => setFilter(tab)}
              className={`flex-1 sm:flex-initial min-h-[38px] px-3.5 py-1.5 rounded-xl text-xs font-semibold capitalize whitespace-nowrap transition-all ${
                filter === tab
                  ? 'liquid-glass-accent text-white font-bold shadow-md'
                  : 'text-slate-700 dark:text-neutral-300 hover:text-slate-950 dark:hover:text-white hover:bg-black/5 dark:hover:bg-white/5'
              }`}
            >
              {tab}
            </button>
          ))}
        </div>

        {/* Search */}
        <div className="relative w-full sm:w-64">
          <Search className="w-4 h-4 text-slate-400 dark:text-neutral-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search code or filename..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full liquid-glass-input rounded-xl pl-9 pr-3 py-2 text-xs text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-neutral-500 focus:outline-none"
          />
        </div>
      </div>

      {/* Items List */}
      {filteredItems.length === 0 ? (
        <div className="text-center py-16 liquid-glass-card rounded-3xl border border-dashed border-black/10 dark:border-white/10 shadow-sm">
          <Clock className="w-10 h-10 text-slate-400 dark:text-neutral-500 mx-auto mb-2" />
          <h3 className="text-sm font-bold text-slate-800 dark:text-white mb-1">No Transfers Found</h3>
          <p className="text-xs text-slate-500 dark:text-neutral-400 max-w-xs mx-auto">
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
                className={`p-4 rounded-3xl liquid-glass-card transition shadow-md ${
                  expired ? 'opacity-70' : 'hover:border-emerald-500/50 cursor-pointer'
                }`}
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-2xl liquid-glass-button text-emerald-600 dark:text-emerald-400 flex items-center justify-center font-mono font-bold text-xs shrink-0 shadow-sm">
                      {item.mode === 'p2p' ? <Zap className="w-5 h-5" /> : <Cloud className="w-5 h-5 text-purple-600 dark:text-purple-400" />}
                    </div>

                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-bold text-slate-900 dark:text-white text-sm">{item.code}</span>
                        <span className="text-[10px] text-slate-500 dark:text-neutral-400 font-mono">
                          {item.role === 'sender' ? 'Sent' : 'Received'}
                        </span>
                        <span aria-hidden="true" className="text-slate-300 dark:text-neutral-600">·</span>
                        <span
                          className={`text-[10px] font-bold ${
                            expired ? 'text-slate-400 dark:text-neutral-500' : 'text-emerald-600 dark:text-emerald-400'
                          }`}
                        >
                          {expired ? 'Expired' : 'Active'}
                        </span>
                      </div>
                      <p className="text-xs text-slate-700 dark:text-neutral-200 truncate max-w-sm mt-0.5">
                        {item.firstFileName} {item.fileCount > 1 ? `+${item.fileCount - 1} more` : ''}
                      </p>
                      <p className="text-[11px] text-slate-500 dark:text-neutral-400 font-mono tabular-nums">
                        {new Date(item.createdAt).toLocaleTimeString()} · {formatBytes(item.totalSize)}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center justify-between sm:justify-end gap-3 pt-2 sm:pt-0 border-t sm:border-t-0 border-black/10 dark:border-white/10">
                    {!expired ? (
                      <span className="text-xs text-emerald-600 dark:text-emerald-400 font-bold flex items-center gap-1">
                        Open <ArrowRight className="w-3.5 h-3.5" />
                      </span>
                    ) : (
                      <span className="text-[11px] text-slate-400 dark:text-neutral-500 font-mono">Self-destructed</span>
                    )}

                    <button
                      type="button"
                      onClick={(e) => handleDelete(item.id, e)}
                      className="min-h-[36px] min-w-[36px] p-1.5 rounded-xl liquid-glass-button text-slate-400 dark:text-neutral-400 hover:text-rose-500 dark:hover:text-rose-400 flex items-center justify-center transition shadow-sm"
                      title="Delete record"
                      aria-label="Delete history record"
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

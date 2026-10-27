import React, { useEffect, useState } from 'react';
import { WifiOff, X, Activity } from 'lucide-react';
import { GhibliTowerBreakdown } from './GhibliArt.tsx';

export const OfflineIndicator: React.FC = () => {
  const [isOnline, setIsOnline] = useState(
    typeof navigator !== 'undefined' ? navigator.onLine : true
  );
  const [showDetailedModal, setShowDetailedModal] = useState(false);
  const [isTesting, setIsTesting] = useState(false);

  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      setShowDetailedModal(false);
    };
    const handleOffline = () => {
      setIsOnline(false);
      setShowDetailedModal(true);
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const handleTestReconnect = async () => {
    setIsTesting(true);
    try {
      await fetch('/favicon.ico?t=' + Date.now(), { method: 'HEAD', cache: 'no-store' });
      setIsOnline(true);
      setShowDetailedModal(false);
    } catch {
      setIsOnline(false);
    } finally {
      setIsTesting(false);
    }
  };

  if (isOnline) return null;

  return (
    <>
      {/* Floating Alert above mobile bottom bar */}
      <div 
        onClick={() => setShowDetailedModal(true)}
        className="fixed bottom-20 md:bottom-6 left-4 right-4 sm:right-auto z-50 flex items-center gap-2.5 rounded-2xl liquid-glass-card border-amber-500/40 px-4 py-2.5 text-xs font-semibold text-slate-800 dark:text-neutral-200 shadow-2xl cursor-pointer hover:scale-105 transition-all select-none"
      >
        <div className="w-2.5 h-2.5 rounded-full bg-amber-500 animate-ping" />
        <WifiOff className="w-4 h-4 text-amber-500" />
        <span>No Internet Connection · Tower Signal Broken</span>
      </div>

      {/* Ghibli Broken Tower Animation Modal in iOS Liquid Transparent Glass */}
      {showDetailedModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 dark:bg-black/80 backdrop-blur-2xl p-4 animate-in fade-in select-none">
          <div className="relative w-full max-w-md rounded-3xl liquid-glass-card p-6 shadow-2xl">
            <button
              type="button"
              onClick={() => setShowDetailedModal(false)}
              className="absolute top-4 right-4 min-h-[40px] min-w-[40px] p-2 rounded-xl liquid-glass-button text-slate-500 dark:text-neutral-400 hover:text-slate-900 dark:hover:text-white flex items-center justify-center transition z-20 shadow-sm"
              aria-label="Close offline modal"
            >
              <X className="w-4 h-4" />
            </button>

            {/* Ghibli Animated Transmission Tower Breakdown */}
            <GhibliTowerBreakdown onRetry={handleTestReconnect} />

            <div className="mt-4 pt-3 border-t border-black/10 dark:border-white/10 flex items-center justify-between text-[11px] text-slate-500 dark:text-neutral-400 font-mono">
              <span className="flex items-center gap-1.5">
                <Activity className={`w-3.5 h-3.5 ${isTesting ? 'text-amber-500 animate-spin' : 'text-slate-400 dark:text-neutral-400'}`} />
                <span>{isTesting ? 'Checking tower carrier...' : 'Listening for reconnection...'}</span>
              </span>
              <button
                type="button"
                onClick={() => setShowDetailedModal(false)}
                className="text-slate-700 dark:text-neutral-300 hover:text-slate-950 dark:hover:text-white underline underline-offset-2"
              >
                Hide
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

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
      // Test small fetch with cache bust
      await fetch('/favicon.ico?t=' + Date.now(), { method: 'HEAD', cache: 'no-store' });
      setIsOnline(true);
      setShowDetailedModal(false);
    } catch {
      // Still offline
      setIsOnline(false);
    } finally {
      setIsTesting(false);
    }
  };

  if (isOnline) return null;

  return (
    <>
      {/* Floating Pill Alert */}
      <div 
        onClick={() => setShowDetailedModal(true)}
        className="fixed bottom-4 left-4 z-50 flex items-center gap-2.5 rounded-2xl bg-black/95 border border-amber-500/40 px-4 py-2.5 text-xs font-semibold text-neutral-200 shadow-2xl backdrop-blur-md cursor-pointer hover:scale-105 transition-all group"
      >
        <div className="w-2.5 h-2.5 rounded-full bg-amber-400 animate-ping" />
        <WifiOff className="w-4 h-4 text-amber-400" />
        <span>No Internet Connection · Tower Signal Broken</span>
      </div>

      {/* Ghibli Broken Tower Animation Modal */}
      {showDetailedModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-md p-4 animate-in fade-in">
          <div className="relative w-full max-w-md rounded-3xl bg-neutral-950 border border-neutral-800 p-6 shadow-2xl">
            <button
              onClick={() => setShowDetailedModal(false)}
              className="absolute top-4 right-4 p-2 rounded-xl bg-neutral-900 text-neutral-400 hover:text-white transition z-20"
              aria-label="Close offline modal"
            >
              <X className="w-4 h-4" />
            </button>

            {/* Ghibli Animated Transmission Tower Breakdown */}
            <GhibliTowerBreakdown onRetry={handleTestReconnect} />

            <div className="mt-4 pt-3 border-t border-neutral-900 flex items-center justify-between text-[11px] text-neutral-500">
              <span className="flex items-center gap-1.5">
                <Activity className={`w-3.5 h-3.5 ${isTesting ? 'text-amber-400 animate-spin' : 'text-neutral-500'}`} />
                <span>{isTesting ? 'Checking tower carrier...' : 'Listening for reconnection...'}</span>
              </span>
              <button
                onClick={() => setShowDetailedModal(false)}
                className="text-neutral-400 hover:text-white underline underline-offset-2"
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

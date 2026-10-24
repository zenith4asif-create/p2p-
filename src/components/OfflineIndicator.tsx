import React, { useEffect, useState } from 'react';
import { WifiOff, X } from 'lucide-react';
import { GhibliNoInternet } from './GhibliArt.tsx';

export const OfflineIndicator: React.FC = () => {
  const [isOnline, setIsOnline] = useState(
    typeof navigator !== 'undefined' ? navigator.onLine : true
  );
  const [showDetailedModal, setShowDetailedModal] = useState(false);

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
        <span>No Internet Connection · Offline</span>
      </div>

      {/* No Internet Video Dialog */}
      {showDetailedModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-md p-4 animate-in fade-in">
          <div className="relative w-full max-w-sm rounded-3xl bg-neutral-950 border border-neutral-800 p-6 shadow-2xl">
            <button
              onClick={() => setShowDetailedModal(false)}
              className="absolute top-4 right-4 p-2 rounded-xl bg-neutral-900 text-neutral-400 hover:text-white transition"
            >
              <X className="w-4 h-4" />
            </button>

            <GhibliNoInternet />

            <button
              onClick={() => setShowDetailedModal(false)}
              className="w-full mt-4 py-2.5 rounded-xl bg-neutral-900 hover:bg-neutral-800 text-neutral-300 font-semibold text-xs transition"
            >
              Dismiss &amp; Keep Waiting
            </button>
          </div>
        </div>
      )}
    </>
  );
};

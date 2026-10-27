import React, { useState } from 'react';
import { Download, Share2, X } from 'lucide-react';
import { usePWAInstall } from '../hooks/usePWAInstall.ts';

export const PWAInstallButton: React.FC = () => {
  const { isInstallable, isInstalled, isIOS, install } = usePWAInstall();
  const [showIOSGuide, setShowIOSGuide] = useState(false);

  // If already running as an installed PWA, hide the button
  if (isInstalled) {
    return null;
  }

  // Chromium / Android / Desktop flow
  if (isInstallable) {
    return (
      <button
        type="button"
        onClick={install}
        className="min-h-[44px] flex items-center gap-2 rounded-xl liquid-glass-accent text-white px-3.5 py-1.5 text-xs font-black shadow-lg shadow-emerald-500/25 transition-all hover:scale-[1.02] active:scale-[0.98]"
        title="Install ShareFlow as a native PWA"
      >
        <Download className="w-3.5 h-3.5 stroke-[2.5]" />
        <span className="hidden sm:inline">Install App</span>
      </button>
    );
  }

  // iOS Safari flow
  if (isIOS) {
    return (
      <>
        <button
          type="button"
          onClick={() => setShowIOSGuide(true)}
          className="min-h-[44px] flex items-center gap-1.5 rounded-xl liquid-glass-button px-3.5 py-1.5 text-xs font-semibold text-slate-800 dark:text-neutral-200 hover:text-slate-950 dark:hover:text-white transition shadow-sm"
        >
          <Download className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
          <span>Install</span>
        </button>

        {showIOSGuide && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 dark:bg-black/80 backdrop-blur-2xl p-4 select-none">
            <div className="w-full max-w-sm rounded-3xl liquid-glass-card p-6 shadow-2xl animate-in zoom-in-95">
              <div className="flex justify-between items-center mb-3">
                <h3 className="text-base font-semibold text-slate-900 dark:text-white flex items-center gap-2">
                  <Share2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400" /> Install on iOS
                </h3>
                <button
                  type="button"
                  onClick={() => setShowIOSGuide(false)}
                  className="min-h-[36px] min-w-[36px] p-1 rounded-xl liquid-glass-button text-slate-500 dark:text-neutral-400 hover:text-slate-900 dark:hover:text-white flex items-center justify-center transition shadow-sm"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
              <p className="text-xs text-slate-600 dark:text-neutral-300 leading-relaxed mb-4">
                1. Tap the <strong className="text-slate-900 dark:text-white">Share</strong> button in Safari's bottom toolbar.<br />
                2. Scroll down and tap <strong className="text-slate-900 dark:text-white">Add to Home Screen</strong>.<br />
                3. Enjoy instant launch and full-screen file sharing!
              </p>
              <button
                type="button"
                onClick={() => setShowIOSGuide(false)}
                className="w-full min-h-[44px] rounded-2xl liquid-glass-accent text-white font-black py-2.5 text-xs transition shadow-md active:scale-95"
              >
                Got it
              </button>
            </div>
          </div>
        )}
      </>
    );
  }

  return null;
};

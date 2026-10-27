import React, { useState, useEffect } from 'react';
import { 
  Moon, 
  Sun, 
  Zap, 
  Cloud, 
  Clock, 
  Check,
  ShieldCheck,
  Sparkles
} from 'lucide-react';
import { TransferMode } from '../types.ts';
import { useToast } from '../context/ToastContext.tsx';
import { useTheme } from '../context/ThemeContext.tsx';

export const SettingsView: React.FC = () => {
  const { showToast } = useToast();
  const { theme, setTheme } = useTheme();

  const [defaultMode, setDefaultMode] = useState<TransferMode>('p2p');
  const [autoFallback, setAutoFallback] = useState<boolean>(true);
  const [soundAlerts, setSoundAlerts] = useState<boolean>(true);

  useEffect(() => {
    const saved = localStorage.getItem('shareflow_settings');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (parsed.defaultMode) setDefaultMode(parsed.defaultMode);
        if (parsed.autoFallback !== undefined) setAutoFallback(parsed.autoFallback);
        if (parsed.soundAlerts !== undefined) setSoundAlerts(parsed.soundAlerts);
      } catch (_) {}
    }
  }, []);

  const saveSettings = (updated: any) => {
    try {
      localStorage.setItem('shareflow_settings', JSON.stringify(updated));
      showToast('Settings saved ✓', 'success');
    } catch (_) {}
  };

  const handleThemeChange = (newTheme: 'light' | 'dark') => {
    setTheme(newTheme);
    saveSettings({ theme: newTheme, defaultMode, autoFallback, soundAlerts });
  };

  const handleModeChange = (mode: TransferMode) => {
    setDefaultMode(mode);
    saveSettings({ theme, defaultMode: mode, autoFallback, soundAlerts });
  };

  const handleToggleFallback = () => {
    const val = !autoFallback;
    setAutoFallback(val);
    saveSettings({ theme, defaultMode, autoFallback: val, soundAlerts });
  };

  return (
    <div className="max-w-2xl mx-auto px-4 py-6 sm:py-10 select-none">
      
      <div className="mb-6 sm:mb-8">
        <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
          Application Settings
        </h1>
        <div className="flex flex-wrap items-center gap-2 text-xs text-slate-600 dark:text-neutral-300 mt-1.5">
          <span>Transfer protocols</span>
          <span aria-hidden="true">·</span>
          <span>Liquid glass transparency</span>
          <span aria-hidden="true">·</span>
          <span className="text-emerald-600 dark:text-emerald-400 font-mono font-bold">10m Session Life</span>
        </div>
      </div>

      <div className="space-y-6">
        
        {/* Appearance Section */}
        <div className="liquid-glass-card rounded-3xl p-5 sm:p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-xs font-bold text-slate-800 dark:text-neutral-200 uppercase tracking-wider flex items-center gap-2">
              <Sun className="w-4 h-4 text-amber-500" />
              <span>Theme &amp; iOS Appearance</span>
            </h3>
            <span className="text-[11px] font-mono text-emerald-600 dark:text-emerald-400 font-semibold">
              {theme === 'light' ? 'Light Mode (Default)' : 'Dark Mode'}
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {/* Light Mode Card (Default) */}
            <button
              type="button"
              onClick={() => handleThemeChange('light')}
              className={`p-4 rounded-2xl text-left transition flex items-center justify-between min-h-[56px] ${
                theme === 'light'
                  ? 'liquid-glass-accent text-white font-black shadow-md'
                  : 'liquid-glass-button text-slate-800 dark:text-neutral-300'
              }`}
            >
              <div className="flex items-center gap-3">
                <div className={`p-2 rounded-xl ${theme === 'light' ? 'bg-white/20' : 'bg-black/5 dark:bg-white/10'}`}>
                  <Sun className="w-5 h-5 text-amber-400" />
                </div>
                <div>
                  <div className="flex items-center gap-1.5">
                    <span className="text-xs font-bold">Refractive Light</span>
                    <span className="text-[9px] font-bold px-1.5 py-0.2 rounded bg-amber-500/20 text-amber-300">
                      Default
                    </span>
                  </div>
                  <p className={`text-[11px] mt-0.5 ${theme === 'light' ? 'text-white/80' : 'text-slate-500 dark:text-neutral-400'}`}>
                    See-through crystal iOS glass
                  </p>
                </div>
              </div>
              {theme === 'light' && <Check className="w-5 h-5 stroke-[2.5]" />}
            </button>

            {/* Dark Mode Card */}
            <button
              type="button"
              onClick={() => handleThemeChange('dark')}
              className={`p-4 rounded-2xl text-left transition flex items-center justify-between min-h-[56px] ${
                theme === 'dark'
                  ? 'liquid-glass-accent text-white font-black shadow-md'
                  : 'liquid-glass-button text-slate-800 dark:text-neutral-300'
              }`}
            >
              <div className="flex items-center gap-3">
                <div className={`p-2 rounded-xl ${theme === 'dark' ? 'bg-white/20' : 'bg-black/5 dark:bg-white/10'}`}>
                  <Moon className="w-5 h-5 text-emerald-400" />
                </div>
                <div>
                  <span className="text-xs font-bold">Liquid Dark</span>
                  <p className={`text-[11px] mt-0.5 ${theme === 'dark' ? 'text-white/80' : 'text-slate-500 dark:text-neutral-400'}`}>
                    Deep obsidian OLED glass
                  </p>
                </div>
              </div>
              {theme === 'dark' && <Check className="w-5 h-5 stroke-[2.5]" />}
            </button>
          </div>
        </div>

        {/* Transfer Protocols */}
        <div className="liquid-glass-card rounded-3xl p-5 sm:p-6">
          <h3 className="text-xs font-bold text-slate-800 dark:text-neutral-200 uppercase tracking-wider mb-4 flex items-center gap-2">
            <Zap className="w-4 h-4 text-emerald-500 dark:text-emerald-400" />
            <span>Default Transfer Protocol</span>
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-4">
            <div
              onClick={() => handleModeChange('p2p')}
              className={`p-4 rounded-2xl cursor-pointer transition ${
                defaultMode === 'p2p'
                  ? 'liquid-glass-card ring-2 ring-emerald-500 dark:ring-emerald-400 shadow-md'
                  : 'liquid-glass-button'
              }`}
            >
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                  <Zap className="w-3.5 h-3.5 text-emerald-500 dark:text-emerald-400" /> P2P WebRTC
                </span>
                {defaultMode === 'p2p' && <Check className="w-4 h-4 text-emerald-500 dark:text-emerald-400" />}
              </div>
              <p className="text-[11px] text-slate-600 dark:text-neutral-300">Direct streaming without intermediate cloud storage.</p>
            </div>

            <div
              onClick={() => handleModeChange('cloud')}
              className={`p-4 rounded-2xl cursor-pointer transition ${
                defaultMode === 'cloud'
                  ? 'liquid-glass-card ring-2 ring-purple-500 dark:ring-purple-400 shadow-md'
                  : 'liquid-glass-button'
              }`}
            >
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                  <Cloud className="w-3.5 h-3.5 text-purple-500 dark:text-purple-400" /> Cloudinary Buffer
                </span>
                {defaultMode === 'cloud' && <Check className="w-4 h-4 text-purple-500 dark:text-purple-400" />}
              </div>
              <p className="text-[11px] text-slate-600 dark:text-neutral-300">Temporary cloud uploads for async downloads.</p>
            </div>
          </div>

          {/* Auto Fallback Toggle */}
          <div className="flex items-center justify-between pt-4 border-t border-black/10 dark:border-white/10">
            <div>
              <p className="text-xs font-bold text-slate-900 dark:text-white">Auto Cloud Fallback</p>
              <p className="text-[11px] text-slate-600 dark:text-neutral-300">Automatically prompt or route via Cloudinary if direct P2P is blocked.</p>
            </div>
            <button
              type="button"
              onClick={handleToggleFallback}
              className={`min-h-[32px] w-12 h-7 rounded-full transition-colors relative ${
                autoFallback ? 'bg-emerald-500' : 'bg-slate-300 dark:bg-neutral-800'
              }`}
              aria-label="Toggle cloud fallback"
            >
              <span
                className={`w-5 h-5 rounded-full bg-white shadow-md absolute top-1 transition-transform ${
                  autoFallback ? 'left-6' : 'left-1'
                }`}
              />
            </button>
          </div>
        </div>

        {/* Expiration & Privacy Policy */}
        <div className="liquid-glass-card rounded-3xl p-5 sm:p-6">
          <h3 className="text-xs font-bold text-slate-800 dark:text-neutral-200 uppercase tracking-wider mb-4 flex items-center gap-2">
            <Clock className="w-4 h-4 text-amber-500 dark:text-amber-400" />
            <span>Strict Expiration &amp; Privacy Rule</span>
          </h3>

          <div className="space-y-3 text-xs">
            <div className="flex items-center justify-between p-3.5 rounded-2xl liquid-glass-input">
              <span className="font-semibold text-slate-800 dark:text-white">Share Lifespan</span>
              <span className="font-mono font-bold text-amber-600 dark:text-amber-300">10 Minutes (Fixed)</span>
            </div>

            <div className="flex items-center justify-between p-3.5 rounded-2xl liquid-glass-input">
              <span className="font-semibold text-slate-800 dark:text-white">Server Data Retention</span>
              <span className="font-mono font-bold text-emerald-600 dark:text-emerald-400">0 Days (Self-Purging)</span>
            </div>

            <div className="flex items-center justify-between p-3.5 rounded-2xl liquid-glass-input">
              <span className="font-semibold text-slate-800 dark:text-white">Signaling Channel</span>
              <span className="font-mono font-bold text-emerald-600 dark:text-emerald-300">Ephemeral RTDB Session</span>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
};

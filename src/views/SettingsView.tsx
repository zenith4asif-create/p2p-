import React, { useState, useEffect } from 'react';
import { 
  Moon, 
  Sun, 
  Zap, 
  Cloud, 
  Bell, 
  ShieldCheck, 
  Lock, 
  Clock, 
  Check, 
  HardDrive
} from 'lucide-react';
import { TransferMode } from '../types.ts';
import { useToast } from '../context/ToastContext.tsx';

export const SettingsView: React.FC = () => {
  const { showToast } = useToast();

  const [theme, setTheme] = useState<'dark' | 'light'>('dark');
  const [defaultMode, setDefaultMode] = useState<TransferMode>('p2p');
  const [autoFallback, setAutoFallback] = useState<boolean>(true);
  const [soundAlerts, setSoundAlerts] = useState<boolean>(true);

  useEffect(() => {
    const saved = localStorage.getItem('shareflow_settings');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (parsed.theme) setTheme(parsed.theme);
        if (parsed.defaultMode) setDefaultMode(parsed.defaultMode);
        if (parsed.autoFallback !== undefined) setAutoFallback(parsed.autoFallback);
        if (parsed.soundAlerts !== undefined) setSoundAlerts(parsed.soundAlerts);
      } catch (_) {}
    }
  }, []);

  const saveSettings = (newSettings: any) => {
    try {
      localStorage.setItem('shareflow_settings', JSON.stringify(newSettings));
      showToast('Settings saved ✓', 'success');
    } catch (_) {}
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

  const handleToggleSound = () => {
    const val = !soundAlerts;
    setSoundAlerts(val);
    saveSettings({ theme, defaultMode, autoFallback, soundAlerts: val });
  };

  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
          Application Settings
        </h1>
        <p className="text-xs sm:text-sm text-slate-400 mt-1">
          Customize your default transfer protocols, privacy parameters, and interface behavior.
        </p>
      </div>

      <div className="space-y-6">
        
        {/* Appearance Section */}
        <div className="bg-slate-900/60 rounded-3xl border border-slate-800 p-6">
          <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-4 flex items-center gap-2">
            <Moon className="w-4 h-4 text-indigo-400" />
            <span>Theme &amp; Appearance</span>
          </h3>

          <div className="grid grid-cols-2 gap-3">
            <button
              onClick={() => {
                setTheme('dark');
                saveSettings({ theme: 'dark', defaultMode, autoFallback, soundAlerts });
              }}
              className={`p-3.5 rounded-2xl border text-left transition flex items-center justify-between ${
                theme === 'dark'
                  ? 'border-cyan-400 bg-cyan-950/20 text-white'
                  : 'border-slate-800 bg-slate-950/40 text-slate-400'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <Moon className="w-4 h-4 text-cyan-400" />
                <span className="text-xs font-bold">Dark Mode</span>
              </div>
              {theme === 'dark' && <Check className="w-4 h-4 text-cyan-400" />}
            </button>

            <button
              onClick={() => {
                setTheme('light');
                saveSettings({ theme: 'light', defaultMode, autoFallback, soundAlerts });
                showToast('ShareFlow dark theme is optimized for low-power OLED screens', 'info');
              }}
              className={`p-3.5 rounded-2xl border text-left transition flex items-center justify-between ${
                theme === 'light'
                  ? 'border-cyan-400 bg-cyan-950/20 text-white'
                  : 'border-slate-800 bg-slate-950/40 text-slate-400'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <Sun className="w-4 h-4 text-amber-400" />
                <span className="text-xs font-bold">Midnight Slate</span>
              </div>
              {theme === 'light' && <Check className="w-4 h-4 text-cyan-400" />}
            </button>
          </div>
        </div>

        {/* Transfer Protocols */}
        <div className="bg-slate-900/60 rounded-3xl border border-slate-800 p-6">
          <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-4 flex items-center gap-2">
            <Zap className="w-4 h-4 text-cyan-400" />
            <span>Default Transfer Protocol</span>
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-4">
            <div
              onClick={() => handleModeChange('p2p')}
              className={`p-4 rounded-2xl border cursor-pointer transition ${
                defaultMode === 'p2p'
                  ? 'border-cyan-400 bg-cyan-950/20'
                  : 'border-slate-800 bg-slate-950/40 hover:border-slate-700'
              }`}
            >
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs font-bold text-white flex items-center gap-1.5">
                  <Zap className="w-3.5 h-3.5 text-cyan-400" /> P2P WebRTC
                </span>
                {defaultMode === 'p2p' && <Check className="w-4 h-4 text-cyan-400" />}
              </div>
              <p className="text-[11px] text-slate-400">Direct streaming without intermediate cloud storage.</p>
            </div>

            <div
              onClick={() => handleModeChange('cloud')}
              className={`p-4 rounded-2xl border cursor-pointer transition ${
                defaultMode === 'cloud'
                  ? 'border-purple-400 bg-purple-950/20'
                  : 'border-slate-800 bg-slate-950/40 hover:border-slate-700'
              }`}
            >
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs font-bold text-white flex items-center gap-1.5">
                  <Cloud className="w-3.5 h-3.5 text-purple-400" /> Cloudinary Storage
                </span>
                {defaultMode === 'cloud' && <Check className="w-4 h-4 text-purple-400" />}
              </div>
              <p className="text-[11px] text-slate-400">Temporary cloud uploads for async downloads.</p>
            </div>
          </div>

          {/* Auto Fallback Toggle */}
          <div className="flex items-center justify-between pt-4 border-t border-slate-800">
            <div>
              <p className="text-xs font-bold text-white">Auto Cloud Fallback</p>
              <p className="text-[11px] text-slate-400">Automatically prompt or route via Cloudinary if P2P blocked.</p>
            </div>
            <button
              onClick={handleToggleFallback}
              className={`w-11 h-6 rounded-full transition-colors relative ${
                autoFallback ? 'bg-cyan-500' : 'bg-slate-800'
              }`}
            >
              <span
                className={`w-4 h-4 rounded-full bg-white absolute top-1 transition-transform ${
                  autoFallback ? 'left-6' : 'left-1'
                }`}
              />
            </button>
          </div>
        </div>

        {/* Expiration & Privacy Policy */}
        <div className="bg-slate-900/60 rounded-3xl border border-slate-800 p-6">
          <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-4 flex items-center gap-2">
            <Clock className="w-4 h-4 text-amber-400" />
            <span>Strict Expiration &amp; Privacy Rule</span>
          </h3>

          <div className="space-y-3 text-xs text-slate-300">
            <div className="flex items-center justify-between p-3 rounded-xl bg-slate-950 border border-slate-800">
              <span className="font-medium">Share Lifespan</span>
              <span className="font-mono font-bold text-amber-300">10 Minutes (Fixed)</span>
            </div>

            <div className="flex items-center justify-between p-3 rounded-xl bg-slate-950 border border-slate-800">
              <span className="font-medium">Server Data Retention</span>
              <span className="font-mono font-bold text-emerald-400">0 Days (Self-Purging)</span>
            </div>

            <div className="flex items-center justify-between p-3 rounded-xl bg-slate-950 border border-slate-800">
              <span className="font-medium">WebRTC Signaling Channel</span>
              <span className="font-mono font-bold text-cyan-400">Ephemeral RTDB Session</span>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
};

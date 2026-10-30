import React, { useState } from 'react';
import { 
  Send, 
  Download, 
  QrCode, 
  Clock, 
  User as UserIcon, 
  LogOut, 
  LogIn, 
  Settings, 
  LayoutDashboard,
  Sun,
  Moon,
  Users
} from 'lucide-react';
import { useAuth } from '../context/AuthContext.tsx';
import { useTheme } from '../context/ThemeContext.tsx';
import { PWAInstallButton } from './PWAInstallButton.tsx';
import { LogoAnimationVideo } from './GhibliArt.tsx';
import { triggerHaptic, playSciFiSound } from '../utils/haptics.ts';

interface NavbarProps {
  currentView: string;
  onNavigate: (view: string, param?: string) => void;
  onOpenAuth: () => void;
  onOpenScanner: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentView,
  onNavigate,
  onOpenAuth,
  onOpenScanner,
}) => {
  const { user, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const [userMenuOpen, setUserMenuOpen] = useState(false);

  return (
    <header className="sticky top-0 z-40 w-full liquid-glass-nav select-none">
      <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 h-14 sm:h-16 flex items-center justify-between gap-3">
        
        {/* Zone 1: Brand Wordmark with Live Looping Video Animation */}
        <button 
          type="button"
          onClick={() => onNavigate('landing')}
          className="flex items-center gap-2.5 sm:gap-3 group focus:outline-none min-h-[44px] text-left shrink-0"
        >
          <LogoAnimationVideo 
            size="md" 
            className="w-8 h-8 sm:w-10 sm:h-10 rounded-xl ring-1 ring-black/10 dark:ring-white/20 group-hover:ring-emerald-400/60 transition-all duration-300 shadow-md" 
          />
          <div className="flex items-center gap-1.5">
            <span className="font-extrabold text-base sm:text-lg tracking-tight text-slate-900 dark:text-white group-hover:text-emerald-500 dark:group-hover:text-emerald-300 transition-colors whitespace-nowrap">
              ShareFlow
            </span>
            <span className="text-[9px] sm:text-[10px] font-bold tracking-widest px-1.5 py-0.5 rounded bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30">
              P2P
            </span>
          </div>
        </button>

        {/* Zone 2: Desktop Navigation Links (iOS Liquid Glass Island) */}
        <nav 
          aria-label="Desktop Navigation"
          className="hidden md:flex items-center gap-1 p-1 rounded-2xl liquid-glass-input"
        >
          <button
            type="button"
            onClick={() => onNavigate('create')}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
              currentView === 'create'
                ? 'liquid-glass-accent text-white font-bold shadow-md'
                : 'text-slate-700 dark:text-neutral-300 hover:text-slate-950 dark:hover:text-white hover:bg-black/5 dark:hover:bg-white/5'
            }`}
          >
            <Send className="w-3.5 h-3.5" />
            <span>Send Files</span>
          </button>

          <button
            type="button"
            onClick={() => onNavigate('receive')}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
              currentView === 'receive'
                ? 'liquid-glass-accent text-white font-bold shadow-md'
                : 'text-slate-700 dark:text-neutral-300 hover:text-slate-950 dark:hover:text-white hover:bg-black/5 dark:hover:bg-white/5'
            }`}
          >
            <Download className="w-3.5 h-3.5" />
            <span>Receive</span>
          </button>

          <button
            type="button"
            onClick={() => onNavigate('community')}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
              currentView === 'community'
                ? 'liquid-glass-accent text-white font-bold shadow-md'
                : 'text-slate-700 dark:text-neutral-300 hover:text-slate-950 dark:hover:text-white hover:bg-black/5 dark:hover:bg-white/5'
            }`}
          >
            <Users className="w-3.5 h-3.5 text-emerald-500 dark:text-emerald-400" />
            <span>Community</span>
          </button>

          <button
            type="button"
            onClick={onOpenScanner}
            className="flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold whitespace-nowrap text-slate-700 dark:text-neutral-300 hover:text-slate-950 dark:hover:text-white hover:bg-black/5 dark:hover:bg-white/5 transition-all"
          >
            <QrCode className="w-3.5 h-3.5 text-emerald-500 dark:text-emerald-400" />
            <span>Scan QR</span>
          </button>

          <button
            type="button"
            onClick={() => onNavigate('history')}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
              currentView === 'history'
                ? 'liquid-glass-accent text-white font-bold shadow-md'
                : 'text-slate-700 dark:text-neutral-300 hover:text-slate-950 dark:hover:text-white hover:bg-black/5 dark:hover:bg-white/5'
            }`}
          >
            <Clock className="w-3.5 h-3.5" />
            <span>History</span>
          </button>
        </nav>

        {/* Zone 3: Mobile & Desktop Actions (Theme Toggler, PWA install, QR scan trigger, User account) */}
        <div className="flex items-center gap-2 sm:gap-2.5 shrink-0">
          
          {/* iOS 1-Tap Theme Switcher Button (Light Mode Default <-> Dark Mode) */}
          <button
            type="button"
            onClick={() => {
              triggerHaptic('tap');
              toggleTheme();
            }}
            className="min-h-[44px] min-w-[44px] p-2.5 rounded-xl liquid-glass-button flex items-center justify-center transition-all group"
            title={`Switch to ${theme === 'light' ? 'Dark' : 'Light'} Mode`}
            aria-label={`Switch to ${theme === 'light' ? 'Dark' : 'Light'} Mode`}
          >
            {theme === 'light' ? (
              <Moon className="w-4 h-4 text-slate-700 group-hover:text-slate-900 group-hover:scale-110 transition-transform" />
            ) : (
              <Sun className="w-4 h-4 text-amber-400 group-hover:text-amber-300 group-hover:scale-110 transition-transform" />
            )}
          </button>

          {/* Quick Scan Button on Mobile (Direct one-tap $\ge 44px$) */}
          <button
            type="button"
            onClick={onOpenScanner}
            className="md:hidden min-h-[44px] min-w-[44px] p-2.5 rounded-xl liquid-glass-button flex items-center justify-center text-emerald-600 dark:text-emerald-400 hover:text-emerald-500"
            title="Scan QR Code"
            aria-label="Scan QR Code"
          >
            <QrCode className="w-5 h-5 stroke-[2.2]" />
          </button>

          {/* PWA Install Button */}
          <PWAInstallButton />

          {/* User Profile / Auth State */}
          {user ? (
            <div className="relative">
              <button
                type="button"
                onClick={() => setUserMenuOpen(!userMenuOpen)}
                className="min-h-[44px] flex items-center gap-2 p-1.5 sm:px-3 sm:py-1.5 rounded-xl liquid-glass-button text-xs text-slate-900 dark:text-white"
                aria-label="Open User Menu"
              >
                <div className="w-7 h-7 rounded-lg bg-gradient-to-tr from-emerald-500 to-teal-400 flex items-center justify-center font-black text-white dark:text-black text-xs shadow-md">
                  {user.displayName?.[0]?.toUpperCase() || user.email?.[0]?.toUpperCase() || 'U'}
                </div>
                <span className="hidden sm:inline font-semibold max-w-[90px] truncate">
                  {user.displayName || user.email?.split('@')[0]}
                </span>
              </button>

              {userMenuOpen && (
                <div 
                  className="absolute right-0 mt-2 w-52 rounded-2xl liquid-glass-panel p-1.5 z-50 text-xs shadow-xl animate-in fade-in slide-in-from-top-2"
                  onMouseLeave={() => setUserMenuOpen(false)}
                >
                  <div className="px-3 py-2 border-b border-black/10 dark:border-white/10">
                    <p className="font-bold text-slate-900 dark:text-white truncate">{user.displayName || 'ShareFlow User'}</p>
                    <p className="text-[11px] text-slate-500 dark:text-neutral-400 truncate font-mono">{user.email}</p>
                  </div>

                  <button
                    type="button"
                    onClick={() => {
                      setUserMenuOpen(false);
                      onNavigate('dashboard');
                    }}
                    className="w-full text-left px-3 py-2.5 rounded-xl hover:bg-black/5 dark:hover:bg-white/10 text-slate-700 dark:text-neutral-200 flex items-center gap-2.5 transition"
                  >
                    <LayoutDashboard className="w-4 h-4 text-emerald-500 dark:text-emerald-400" />
                    <span className="font-medium">Dashboard</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setUserMenuOpen(false);
                      onNavigate('profile');
                    }}
                    className="w-full text-left px-3 py-2.5 rounded-xl hover:bg-black/5 dark:hover:bg-white/10 text-slate-700 dark:text-neutral-200 flex items-center gap-2.5 transition"
                  >
                    <UserIcon className="w-4 h-4 text-teal-500 dark:text-teal-400" />
                    <span className="font-medium">Profile</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setUserMenuOpen(false);
                      onNavigate('settings');
                    }}
                    className="w-full text-left px-3 py-2.5 rounded-xl hover:bg-black/5 dark:hover:bg-white/10 text-slate-700 dark:text-neutral-200 flex items-center gap-2.5 transition"
                  >
                    <Settings className="w-4 h-4 text-slate-500 dark:text-neutral-400" />
                    <span className="font-medium">Settings</span>
                  </button>

                  <div className="border-t border-black/10 dark:border-white/10 my-1" />

                  <button
                    type="button"
                    onClick={async () => {
                      setUserMenuOpen(false);
                      await logout();
                      onNavigate('landing');
                    }}
                    className="w-full text-left px-3 py-2.5 rounded-xl hover:bg-rose-500/15 text-rose-600 dark:text-rose-300 flex items-center gap-2.5 transition font-medium"
                  >
                    <LogOut className="w-4 h-4 text-rose-500" />
                    <span>Log Out</span>
                  </button>
                </div>
              )}
            </div>
          ) : (
            <button
              type="button"
              onClick={onOpenAuth}
              className="min-h-[44px] flex items-center gap-1.5 px-3.5 py-2 rounded-xl liquid-glass-button text-xs font-semibold text-slate-800 dark:text-neutral-200 hover:text-slate-950 dark:hover:text-white"
            >
              <LogIn className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
              <span>Sign In</span>
            </button>
          )}

        </div>
      </div>
    </header>
  );
};

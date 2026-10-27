import React, { useState, useEffect } from 'react';
import { 
  Send, 
  Download, 
  QrCode, 
  Clock, 
  LayoutDashboard, 
  User as UserIcon
} from 'lucide-react';
import { AuthProvider, useAuth } from './context/AuthContext.tsx';
import { ToastProvider } from './context/ToastContext.tsx';
import { ThemeProvider, useTheme } from './context/ThemeContext.tsx';
import { Navbar } from './components/Navbar.tsx';
import { OfflineIndicator } from './components/OfflineIndicator.tsx';
import { LandingView } from './views/LandingView.tsx';
import { CreateShareView } from './views/CreateShareView.tsx';
import { ActiveShareView } from './views/ActiveShareView.tsx';
import { ReceiveView } from './views/ReceiveView.tsx';
import { DashboardView } from './views/DashboardView.tsx';
import { HistoryView } from './views/HistoryView.tsx';
import { ProfileView } from './views/ProfileView.tsx';
import { SettingsView } from './views/SettingsView.tsx';
import { ScannerModal } from './views/ScannerModal.tsx';
import { AuthModal } from './views/AuthModal.tsx';
import { Footer } from './components/Footer.tsx';
import { ShareSession } from './types.ts';
import { triggerHaptic, playSciFiSound } from './utils/haptics.ts';

/**
 * Mobile-First Ergonomic Fixed Bottom Navigation Bar
 * Optimized for natural thumb zone reachability on mobile touch screens with iOS liquid glass styling
 * and tactile window.navigator.vibrate haptic confirmation on touch.
 */
const MobileBottomNavBar: React.FC<{
  currentView: string;
  onNavigate: (view: string) => void;
  onOpenScanner: () => void;
  onOpenAuth: () => void;
}> = ({ currentView, onNavigate, onOpenScanner, onOpenAuth }) => {
  const { user } = useAuth();

  const handleNavClick = (action: () => void) => {
    // Tactile confirmation on mobile devices via window.navigator.vibrate (only vibrate, no tap sound)
    triggerHaptic('selection');
    action();
  };

  return (
    <nav 
      aria-label="Mobile Navigation"
      className="md:hidden fixed bottom-0 left-0 right-0 z-40 liquid-glass-tabbar px-2 py-1.5 flex items-center justify-around select-none shadow-[0_-8px_24px_rgba(0,0,0,0.12)]"
    >
      {/* 1. Send Files */}
      <button
        type="button"
        onClick={() => handleNavClick(() => onNavigate('create'))}
        className={`min-h-[48px] min-w-[56px] flex flex-col items-center justify-center rounded-xl px-2 py-1 transition-all active:scale-95 ${
          currentView === 'create'
            ? 'text-emerald-600 dark:text-emerald-400 font-bold'
            : 'text-slate-600 dark:text-neutral-400 hover:text-slate-900 dark:hover:text-white'
        }`}
      >
        <div className={`p-1 rounded-xl transition-all ${currentView === 'create' ? 'bg-emerald-500/20 shadow-sm scale-105' : ''}`}>
          <Send className="w-5 h-5" />
        </div>
        <span className="text-[10px] tracking-tight mt-0.5 whitespace-nowrap font-medium">Send</span>
      </button>

      {/* 2. Receive Files */}
      <button
        type="button"
        onClick={() => handleNavClick(() => onNavigate('receive'))}
        className={`min-h-[48px] min-w-[56px] flex flex-col items-center justify-center rounded-xl px-2 py-1 transition-all active:scale-95 ${
          currentView === 'receive'
            ? 'text-emerald-600 dark:text-emerald-400 font-bold'
            : 'text-slate-600 dark:text-neutral-400 hover:text-slate-900 dark:hover:text-white'
        }`}
      >
        <div className={`p-1 rounded-xl transition-all ${currentView === 'receive' ? 'bg-emerald-500/20 shadow-sm scale-105' : ''}`}>
          <Download className="w-5 h-5" />
        </div>
        <span className="text-[10px] tracking-tight mt-0.5 whitespace-nowrap font-medium">Receive</span>
      </button>

      {/* 3. Center Focal QR Camera Scanner (iOS Raised Tactile Button with Moving RGB Aura) */}
      <button
        type="button"
        onClick={() => handleNavClick(onOpenScanner)}
        className="min-h-[48px] min-w-[56px] -mt-5 flex flex-col items-center justify-center group active:scale-90 transition-transform"
      >
        <div className="relative">
          <span className="absolute -inset-1 rounded-2xl bg-gradient-to-r from-emerald-500 via-cyan-400 to-pink-500 opacity-70 blur-sm group-hover:opacity-100 transition duration-300" />
          <div className="relative w-12 h-12 rounded-2xl liquid-glass-accent flex items-center justify-center text-white shadow-lg shadow-emerald-500/35 group-hover:scale-105 transition-transform border border-white/40">
            <QrCode className="w-6 h-6 stroke-[2.3]" />
          </div>
        </div>
        <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 tracking-tight mt-1 whitespace-nowrap">Scan QR</span>
      </button>

      {/* 4. Transfer History */}
      <button
        type="button"
        onClick={() => handleNavClick(() => onNavigate('history'))}
        className={`min-h-[48px] min-w-[56px] flex flex-col items-center justify-center rounded-xl px-2 py-1 transition-all active:scale-95 ${
          currentView === 'history'
            ? 'text-emerald-600 dark:text-emerald-400 font-bold'
            : 'text-slate-600 dark:text-neutral-400 hover:text-slate-900 dark:hover:text-white'
        }`}
      >
        <div className={`p-1 rounded-xl transition-all ${currentView === 'history' ? 'bg-emerald-500/20 shadow-sm scale-105' : ''}`}>
          <Clock className="w-5 h-5" />
        </div>
        <span className="text-[10px] tracking-tight mt-0.5 whitespace-nowrap font-medium">History</span>
      </button>

      {/* 5. User Account / Dashboard */}
      <button
        type="button"
        onClick={() => handleNavClick(() => {
          if (user) {
            onNavigate('dashboard');
          } else {
            onOpenAuth();
          }
        })}
        className={`min-h-[48px] min-w-[56px] flex flex-col items-center justify-center rounded-xl px-2 py-1 transition-all active:scale-95 ${
          currentView === 'dashboard' || currentView === 'profile'
            ? 'text-emerald-600 dark:text-emerald-400 font-bold'
            : 'text-slate-600 dark:text-neutral-400 hover:text-slate-900 dark:hover:text-white'
        }`}
      >
        <div className={`p-1 rounded-xl transition-all ${currentView === 'dashboard' || currentView === 'profile' ? 'bg-emerald-500/20 shadow-sm scale-105' : ''}`}>
          {user ? (
            <LayoutDashboard className="w-5 h-5" />
          ) : (
            <UserIcon className="w-5 h-5" />
          )}
        </div>
        <span className="text-[10px] tracking-tight mt-0.5 whitespace-nowrap truncate max-w-[52px] font-medium">
          {user ? 'Dashboard' : 'Sign In'}
        </span>
      </button>
    </nav>
  );
};

function AppContent() {
  const [currentView, setCurrentView] = useState<string>('landing');
  const [receiveCode, setReceiveCode] = useState<string>('');
  
  // Active share session being served by sender
  const [activeShare, setActiveShare] = useState<ShareSession | null>(null);
  const [activeRawFiles, setActiveRawFiles] = useState<File[]>([]);

  // Modals
  const [isScannerOpen, setIsScannerOpen] = useState<boolean>(false);
  const [isAuthOpen, setIsAuthOpen] = useState<boolean>(false);

  // Sync hash routing and URL parameters
  useEffect(() => {
    const handleHashRoute = () => {
      const hash = window.location.hash.replace(/^#\/?/, '');
      const pathname = window.location.pathname;
      const searchParams = new URLSearchParams(window.location.search);

      // Check query parameter e.g. ?code=A7K92P
      const queryCode = searchParams.get('code');
      if (queryCode) {
        setReceiveCode(queryCode.toUpperCase());
        setCurrentView('receive');
        return;
      }

      // Check direct path /share/A7K92P
      const pathMatch = pathname.match(/\/share\/([a-zA-Z0-9]{4,8})/i);
      if (pathMatch && pathMatch[1]) {
        setReceiveCode(pathMatch[1].toUpperCase());
        setCurrentView('receive');
        return;
      }

      // Check hash route e.g. #receive/A7K92P or #create or #dashboard
      if (hash.startsWith('receive')) {
        const parts = hash.split('/');
        const code = parts[1] || '';
        if (code) {
          setReceiveCode(code.toUpperCase());
        }
        setCurrentView('receive');
      } else if (hash === 'create' || hash === 'send') {
        setCurrentView('create');
      } else if (hash === 'dashboard') {
        setCurrentView('dashboard');
      } else if (hash === 'history') {
        setCurrentView('history');
      } else if (hash === 'profile') {
        setCurrentView('profile');
      } else if (hash === 'settings') {
        setCurrentView('settings');
      } else {
        setCurrentView('landing');
      }
    };

    handleHashRoute();
    window.addEventListener('hashchange', handleHashRoute);
    return () => window.removeEventListener('hashchange', handleHashRoute);
  }, []);

  const navigateTo = (view: string, param?: string) => {
    if (view === 'receive') {
      if (param) {
        setReceiveCode(param.toUpperCase());
        window.location.hash = `receive/${param.toUpperCase()}`;
      } else {
        window.location.hash = 'receive';
      }
      setCurrentView('receive');
    } else {
      window.location.hash = view === 'landing' ? '' : view;
      setCurrentView(view);
    }
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleShareCreated = (share: ShareSession, rawFiles: File[]) => {
    setActiveShare(share);
    setActiveRawFiles(rawFiles);
    setCurrentView('active');
  };

  const handleCloseActiveShare = () => {
    setActiveShare(null);
    setActiveRawFiles([]);
    navigateTo('dashboard');
  };

  const handleCodeScanned = (code: string) => {
    navigateTo('receive', code);
  };

  return (
    <div className="relative min-h-screen bg-[#f1f5f9] dark:bg-[#07090e] text-slate-900 dark:text-neutral-100 flex flex-col font-sans selection:bg-emerald-500/30 selection:text-emerald-800 dark:selection:text-emerald-200 overflow-x-hidden transition-colors duration-300">
      
      {/* LIQUID TRANSPARENT MESH GRADIENTS (Floating orbs behind glass for "aar paar dikha" refraction) */}
      <div className="pointer-events-none fixed inset-0 -z-10 overflow-hidden select-none">
        {/* Holographic matrix subtle dot grid */}
        <div className="absolute inset-0 bg-[radial-gradient(rgba(16,185,129,0.08)_1px,transparent_1px)] dark:bg-[radial-gradient(rgba(255,255,255,0.06)_1px,transparent_1px)] bg-[size:24px_24px] opacity-70" />

        {/* Vibrant Emerald Liquid Orb */}
        <div 
          className="absolute -top-24 -left-24 w-[380px] sm:w-[620px] h-[380px] sm:h-[620px] rounded-full bg-gradient-to-tr from-emerald-500/35 to-teal-400/25 dark:from-emerald-600/22 dark:to-teal-500/15 blur-[80px] transform-gpu"
          style={{ animation: 'liquidOrb1 16s ease-in-out infinite' }}
        />
        {/* Cyan / Sky Electric Plasma Orb */}
        <div 
          className="absolute top-1/4 -right-28 w-[340px] sm:w-[560px] h-[340px] sm:h-[560px] rounded-full bg-gradient-to-bl from-cyan-400/35 to-blue-500/25 dark:from-cyan-500/20 dark:to-blue-600/15 blur-[90px] transform-gpu"
          style={{ animation: 'liquidOrb2 20s ease-in-out infinite' }}
        />
        {/* Neon Pink / Purple Caustic Pool */}
        <div 
          className="absolute top-1/2 left-1/3 w-[320px] sm:w-[500px] h-[320px] sm:h-[500px] rounded-full bg-gradient-to-r from-fuchsia-500/25 to-pink-500/20 dark:from-purple-600/18 dark:to-pink-600/12 blur-[100px] transform-gpu"
          style={{ animation: 'liquidOrb3 22s ease-in-out infinite' }}
        />
        {/* Violet / Indigo Deep Liquid Orb */}
        <div 
          className="absolute top-2/3 -left-20 w-[340px] sm:w-[540px] h-[340px] sm:h-[540px] rounded-full bg-gradient-to-tr from-indigo-500/30 to-violet-500/20 dark:from-indigo-600/18 dark:to-purple-800/15 blur-[100px] transform-gpu"
          style={{ animation: 'liquidOrb1 24s ease-in-out infinite reverse' }}
        />
        {/* Warm Amber Flare */}
        <div 
          className="absolute bottom-10 right-1/4 w-[300px] sm:w-[460px] h-[300px] sm:h-[460px] rounded-full bg-gradient-to-tl from-amber-400/30 to-orange-500/20 dark:from-amber-500/15 dark:to-orange-600/10 blur-[80px] transform-gpu"
          style={{ animation: 'liquidPulse 8s ease-in-out infinite' }}
        />
      </div>

      {/* Universal Sticky Navigation (iOS Liquid Glass Top Bar) */}
      <Navbar
        currentView={currentView}
        onNavigate={navigateTo}
        onOpenAuth={() => setIsAuthOpen(true)}
        onOpenScanner={() => setIsScannerOpen(true)}
      />

      {/* Offline Warning Banner (Ghibli Tower breakdown) */}
      <OfflineIndicator />

      {/* Main View Router with Mobile Bottom Padding for Thumb Nav */}
      <main className="flex-1 w-full pb-24 md:pb-12">
        {currentView === 'landing' && (
          <LandingView
            onNavigate={navigateTo}
            onOpenScanner={() => setIsScannerOpen(true)}
          />
        )}

        {currentView === 'create' && (
          <CreateShareView
            onShareCreated={handleShareCreated}
            onNavigate={navigateTo}
          />
        )}

        {currentView === 'active' && activeShare && (
          <ActiveShareView
            share={activeShare}
            rawFiles={activeRawFiles}
            onClose={handleCloseActiveShare}
            onNavigate={navigateTo}
          />
        )}

        {currentView === 'receive' && (
          <ReceiveView
            initialCode={receiveCode}
            onNavigate={navigateTo}
            onOpenScanner={() => setIsScannerOpen(true)}
          />
        )}

        {currentView === 'dashboard' && (
          <DashboardView
            onNavigate={navigateTo}
            onOpenScanner={() => setIsScannerOpen(true)}
          />
        )}

        {currentView === 'history' && (
          <HistoryView
            onNavigate={navigateTo}
          />
        )}

        {currentView === 'profile' && (
          <ProfileView
            onNavigate={navigateTo}
          />
        )}

        {currentView === 'settings' && (
          <SettingsView />
        )}
      </main>

      {/* Camera QR Scanner Modal */}
      <ScannerModal
        isOpen={isScannerOpen}
        onClose={() => setIsScannerOpen(false)}
        onCodeScanned={handleCodeScanned}
        onManualEntry={() => {
          setIsScannerOpen(false);
          navigateTo('receive');
        }}
      />

      {/* Authentication Modal */}
      <AuthModal
        isOpen={isAuthOpen}
        onClose={() => setIsAuthOpen(false)}
        onSuccess={() => navigateTo('dashboard')}
      />

      {/* Mobile Ergonomic Fixed Bottom Navigation Bar */}
      <MobileBottomNavBar
        currentView={currentView}
        onNavigate={navigateTo}
        onOpenScanner={() => setIsScannerOpen(true)}
        onOpenAuth={() => setIsAuthOpen(true)}
      />

      {/* Global Footer with Developer Attribution */}
      <Footer />

    </div>
  );
}

export default function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <ToastProvider>
          <AppContent />
        </ToastProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}

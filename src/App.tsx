import React, { useState, useEffect } from 'react';
import { AuthProvider } from './context/AuthContext.tsx';
import { ToastProvider } from './context/ToastContext.tsx';
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

export default function App() {
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
    <AuthProvider>
      <ToastProvider>
        <div className="min-h-screen bg-black text-neutral-100 flex flex-col font-sans selection:bg-emerald-500/30 selection:text-emerald-200">
          
          {/* Universal Sticky Navigation */}
          <Navbar
            currentView={currentView}
            onNavigate={navigateTo}
            onOpenAuth={() => setIsAuthOpen(true)}
            onOpenScanner={() => setIsScannerOpen(true)}
          />

          {/* Offline Warning Banner */}
          <OfflineIndicator />

          {/* Main View Router */}
          <main className="flex-1 w-full">
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

          {/* Global Footer with Developer Attribution */}
          <Footer />

        </div>
      </ToastProvider>
    </AuthProvider>
  );
}

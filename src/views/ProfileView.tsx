import React, { useState } from 'react';
import { User as UserIcon, Mail, Fingerprint, LogOut, Trash2, ShieldAlert } from 'lucide-react';
import { useAuth } from '../context/AuthContext.tsx';
import { useToast } from '../context/ToastContext.tsx';

interface ProfileViewProps {
  onNavigate: (view: string) => void;
}

export const ProfileView: React.FC<ProfileViewProps> = ({ onNavigate }) => {
  const { user, logout, deleteAccount } = useAuth();
  const { showToast } = useToast();
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  if (!user) {
    return (
      <div className="max-w-md mx-auto px-4 py-16 text-center select-none">
        <div className="liquid-glass-card p-8 rounded-3xl shadow-xl">
          <UserIcon className="w-12 h-12 text-slate-400 dark:text-neutral-500 mx-auto mb-3" />
          <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-2">Not Signed In</h2>
          <p className="text-xs text-slate-600 dark:text-neutral-300 mb-6 leading-relaxed">
            Sign in to your ShareFlow account to sync transfer sessions and manage your profile.
          </p>
          <button
            type="button"
            onClick={() => onNavigate('landing')}
            className="min-h-[44px] px-6 py-2.5 rounded-2xl liquid-glass-accent text-white font-black text-xs shadow-md active:scale-95 transition-transform"
          >
            Return Home
          </button>
        </div>
      </div>
    );
  }

  const handleDeleteAccount = async () => {
    setIsDeleting(true);
    try {
      await deleteAccount();
      showToast('Account successfully deleted', 'info');
      onNavigate('landing');
    } catch (err) {
      showToast((err as Error).message || 'Failed to delete account', 'error');
    } finally {
      setIsDeleting(false);
      setShowDeleteModal(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto px-4 py-6 sm:py-10 select-none">
      
      <div className="mb-6 sm:mb-8">
        <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
          User Profile
        </h1>
        <div className="flex flex-wrap items-center gap-2 text-xs text-slate-600 dark:text-neutral-300 mt-1">
          <span>Personal identifier</span>
          <span aria-hidden="true">·</span>
          <span>Security settings</span>
          <span aria-hidden="true">·</span>
          <span className="text-emerald-600 dark:text-emerald-400 font-mono font-bold">Zero Server Retention</span>
        </div>
      </div>

      <div className="liquid-glass-card rounded-3xl p-6 sm:p-8 mb-6 shadow-2xl">
        <div className="flex items-center gap-4 pb-6 border-b border-black/10 dark:border-white/10 mb-6">
          <div className="w-16 h-16 rounded-2xl liquid-glass-button text-emerald-600 dark:text-emerald-400 flex items-center justify-center font-black text-2xl shadow-lg shadow-emerald-500/20">
            {user.displayName?.[0]?.toUpperCase() || user.email?.[0]?.toUpperCase() || 'U'}
          </div>
          <div className="truncate">
            <h2 className="text-lg font-bold text-slate-900 dark:text-white truncate">
              {user.displayName || 'ShareFlow Explorer'}
            </h2>
            <p className="text-xs text-slate-500 dark:text-neutral-400 font-mono truncate">{user.email}</p>
          </div>
        </div>

        <div className="space-y-4">
          <div className="flex items-start gap-3 p-3.5 rounded-2xl liquid-glass-input">
            <Mail className="w-5 h-5 text-emerald-600 dark:text-emerald-400 mt-0.5 shrink-0" />
            <div className="truncate">
              <span className="text-[11px] font-bold text-slate-500 dark:text-neutral-400 uppercase tracking-wider block">
                Email Address
              </span>
              <p className="text-sm font-semibold text-slate-900 dark:text-white truncate">{user.email}</p>
            </div>
          </div>

          <div className="flex items-start gap-3 p-3.5 rounded-2xl liquid-glass-input">
            <Fingerprint className="w-5 h-5 text-teal-600 dark:text-teal-400 mt-0.5 shrink-0" />
            <div className="truncate">
              <span className="text-[11px] font-bold text-slate-500 dark:text-neutral-400 uppercase tracking-wider block">
                User UID
              </span>
              <p className="text-xs font-mono text-slate-600 dark:text-neutral-300 truncate">{user.uid}</p>
            </div>
          </div>
        </div>

        {/* Action Controls */}
        <div className="mt-8 pt-6 border-t border-black/10 dark:border-white/10 flex flex-col sm:flex-row items-center justify-between gap-3">
          <button
            type="button"
            onClick={async () => {
              await logout();
              showToast('Logged out of ShareFlow', 'info');
              onNavigate('landing');
            }}
            className="w-full sm:w-auto min-h-[44px] flex items-center justify-center gap-2 px-5 py-2.5 rounded-2xl liquid-glass-button text-xs font-semibold text-slate-700 dark:text-neutral-200 hover:text-slate-950 dark:hover:text-white shadow-sm"
          >
            <LogOut className="w-4 h-4 text-slate-500 dark:text-neutral-400" />
            <span>Sign Out</span>
          </button>

          <button
            type="button"
            onClick={() => setShowDeleteModal(true)}
            className="w-full sm:w-auto min-h-[44px] flex items-center justify-center gap-2 px-5 py-2.5 rounded-2xl liquid-glass-button hover:bg-rose-500/10 text-rose-600 dark:text-rose-300 text-xs font-semibold shadow-sm"
          >
            <Trash2 className="w-4 h-4 text-rose-500" />
            <span>Delete Account</span>
          </button>
        </div>
      </div>

      {/* Delete Account Confirmation Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-md animate-in fade-in">
          <div className="max-w-md w-full liquid-glass-card rounded-3xl p-6 sm:p-8 shadow-2xl">
            <div className="w-12 h-12 rounded-2xl liquid-glass-button text-rose-500 flex items-center justify-center mx-auto mb-4">
              <ShieldAlert className="w-6 h-6 stroke-[2.2]" />
            </div>
            <h3 className="text-lg font-black text-slate-900 dark:text-white uppercase tracking-tight text-center mb-2">
              Confirm Account Deletion
            </h3>
            <p className="text-xs text-slate-600 dark:text-neutral-300 text-center mb-6 leading-relaxed">
              This action is permanent and cannot be undone. All your user records and session references will be expunged immediately.
            </p>
            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => setShowDeleteModal(false)}
                className="flex-1 min-h-[44px] rounded-2xl liquid-glass-button text-slate-700 dark:text-white font-semibold text-xs"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleDeleteAccount}
                disabled={isDeleting}
                className="flex-1 min-h-[44px] rounded-2xl bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs transition shadow-lg shadow-rose-600/30"
              >
                {isDeleting ? 'Deleting...' : 'Yes, Delete'}
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

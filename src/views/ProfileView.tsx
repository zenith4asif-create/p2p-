import React, { useState } from 'react';
import { User as UserIcon, Mail, Fingerprint, Calendar, LogOut, Trash2, ShieldAlert } from 'lucide-react';
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
      <div className="max-w-md mx-auto px-4 py-16 text-center">
        <UserIcon className="w-12 h-12 text-slate-500 mx-auto mb-3" />
        <h2 className="text-xl font-bold text-white mb-2">Not Signed In</h2>
        <p className="text-xs text-slate-400 mb-6">
          Sign in to your ShareFlow account to sync transfer sessions and manage your profile.
        </p>
        <button
          onClick={() => onNavigate('landing')}
          className="px-6 py-2.5 rounded-xl bg-cyan-500 text-slate-950 font-bold text-xs"
        >
          Return Home
        </button>
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

  const creationDate = user.metadata.creationTime
    ? new Date(user.metadata.creationTime).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      })
    : 'Active Explorer';

  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
          User Profile
        </h1>
        <p className="text-xs sm:text-sm text-slate-400 mt-1">
          Review your personal identifier, security settings, and account lifespan.
        </p>
      </div>

      <div className="bg-slate-900/60 rounded-3xl border border-slate-800 p-6 sm:p-8 mb-6 shadow-2xl">
        <div className="flex items-center gap-4 pb-6 border-b border-slate-800 mb-6">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-cyan-500 to-indigo-600 flex items-center justify-center font-bold text-white text-2xl shadow-lg shadow-cyan-500/20">
            {user.displayName?.[0]?.toUpperCase() || user.email?.[0]?.toUpperCase() || 'U'}
          </div>
          <div>
            <h2 className="text-lg font-bold text-white">
              {user.displayName || 'ShareFlow Explorer'}
            </h2>
            <p className="text-xs text-slate-400 font-mono">{user.email}</p>
          </div>
        </div>

        <div className="space-y-4">
          <div className="flex items-start gap-3 p-3.5 rounded-2xl bg-slate-950 border border-slate-800/80">
            <Mail className="w-5 h-5 text-cyan-400 mt-0.5 shrink-0" />
            <div>
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
                Email Address
              </span>
              <p className="text-sm font-semibold text-white">{user.email}</p>
            </div>
          </div>

          <div className="flex items-start gap-3 p-3.5 rounded-2xl bg-slate-950 border border-slate-800/80">
            <Fingerprint className="w-5 h-5 text-indigo-400 mt-0.5 shrink-0" />
            <div className="truncate">
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
                User UID (Firebase ID)
              </span>
              <p className="text-xs font-mono text-slate-300 truncate">{user.uid}</p>
            </div>
          </div>

          <div className="flex items-start gap-3 p-3.5 rounded-2xl bg-slate-950 border border-slate-800/80">
            <Calendar className="w-5 h-5 text-purple-400 mt-0.5 shrink-0" />
            <div>
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
                Account Created Date
              </span>
              <p className="text-sm font-semibold text-white">{creationDate}</p>
            </div>
          </div>
        </div>

        <div className="flex items-center justify-between gap-4 mt-8 pt-6 border-t border-slate-800">
          <button
            onClick={async () => {
              await logout();
              showToast('Logged out', 'info');
              onNavigate('landing');
            }}
            className="px-5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold transition flex items-center gap-2"
          >
            <LogOut className="w-4 h-4 text-slate-400" />
            <span>Sign Out</span>
          </button>

          <button
            onClick={() => setShowDeleteModal(true)}
            className="px-5 py-2.5 rounded-xl bg-rose-950/40 hover:bg-rose-950/70 border border-rose-500/30 text-rose-300 text-xs font-bold transition flex items-center gap-2"
          >
            <Trash2 className="w-4 h-4 text-rose-400" />
            <span>Delete Account</span>
          </button>
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-in fade-in">
          <div className="w-full max-w-sm rounded-3xl bg-slate-900 border border-slate-800 p-6 shadow-2xl">
            <ShieldAlert className="w-10 h-10 text-rose-400 mx-auto mb-3" />
            <h3 className="text-base font-bold text-white text-center mb-1">
              Confirm Account Deletion
            </h3>
            <p className="text-xs text-slate-400 text-center mb-6 leading-relaxed">
              This action is permanent. All your profile data and user credentials will be purged immediately.
            </p>

            <div className="flex gap-3">
              <button
                onClick={() => setShowDeleteModal(false)}
                className="flex-1 py-2.5 rounded-xl bg-slate-800 text-slate-300 text-xs font-semibold hover:bg-slate-700"
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteAccount}
                disabled={isDeleting}
                className="flex-1 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold transition"
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

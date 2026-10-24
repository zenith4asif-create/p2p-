import React, { useState } from 'react';
import { Mail, Check, Copy, Heart, Shield, Code } from 'lucide-react';
import { useToast } from '../context/ToastContext.tsx';

export const Footer: React.FC = () => {
  const { showToast } = useToast();
  const [copied, setCopied] = useState(false);
  const developerEmail = 'bioasif77@gmail.com';

  const handleCopyEmail = (e: React.MouseEvent) => {
    e.preventDefault();
    navigator.clipboard.writeText(developerEmail);
    setCopied(true);
    showToast('Developer email copied to clipboard! ✓', 'success');
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <footer className="w-full bg-black border-t border-neutral-900 py-10 px-4 mt-auto select-none">
      <div className="max-w-5xl mx-auto flex flex-col items-center text-center space-y-5">
        
        {/* Brand Tagline */}
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
          <span className="font-bold text-sm tracking-tight text-white">ShareFlow</span>
          <span className="text-neutral-600">·</span>
          <span className="text-xs text-neutral-400 font-mono">"Share Anything. Scan. Transfer. Done."</span>
        </div>

        {/* Developer Attribution Box Requested by User */}
        <div className="p-4 sm:p-5 rounded-2xl bg-neutral-950 border border-neutral-800/80 max-w-xl w-full shadow-lg">
          <div className="flex items-center justify-center gap-2 mb-1.5">
            <Code className="w-4 h-4 text-emerald-400" />
            <h4 className="text-xs font-bold text-white uppercase tracking-wider">
              Developer &amp; Research Attribution
            </h4>
          </div>

          <p className="text-sm font-black text-white tracking-wide">
            ASIF ANSARI
          </p>
          <p className="text-xs text-neutral-400 font-medium mt-0.5">
            (independent technologist researcher and biologist)
          </p>

          <div className="mt-3.5 pt-3 border-t border-neutral-800/80 flex flex-wrap items-center justify-center gap-3">
            <span className="text-xs text-neutral-400">
              Contact us if you have any issue:
            </span>
            <div className="inline-flex items-center gap-1.5 bg-black px-3 py-1.5 rounded-xl border border-neutral-800">
              <a
                href={`mailto:${developerEmail}`}
                className="text-xs font-mono font-semibold text-emerald-400 hover:text-emerald-300 transition flex items-center gap-1.5"
              >
                <Mail className="w-3.5 h-3.5" />
                <span>{developerEmail}</span>
              </a>
              <button
                onClick={handleCopyEmail}
                className="p-1 rounded text-neutral-400 hover:text-white transition"
                title="Copy email"
              >
                {copied ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
              </button>
            </div>
          </div>
        </div>

        {/* Privacy & Copyright */}
        <div className="flex flex-wrap items-center justify-center gap-4 text-[11px] text-neutral-500 font-mono">
          <span className="flex items-center gap-1">
            <Shield className="w-3 h-3 text-emerald-400" />
            Zero Server Retention
          </span>
          <span>•</span>
          <span>10-Minute Hard Expiry</span>
          <span>•</span>
          <span>WebRTC P2P Direct Stream</span>
        </div>

      </div>
    </footer>
  );
};

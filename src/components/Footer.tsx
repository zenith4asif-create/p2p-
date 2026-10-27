import React, { useState } from 'react';
import { Mail, Check, Copy, Code } from 'lucide-react';
import { useToast } from '../context/ToastContext.tsx';
import { triggerHaptic } from '../utils/haptics.ts';
import { RGBLightBox } from './RGBLightBox.tsx';

export const Footer: React.FC = () => {
  const { showToast } = useToast();
  const [copied, setCopied] = useState(false);
  const developerEmail = 'bioasif77@gmail.com';

  const handleCopyEmail = (e: React.MouseEvent) => {
    e.preventDefault();
    triggerHaptic('tap');
    navigator.clipboard.writeText(developerEmail);
    setCopied(true);
    showToast('Developer email copied to clipboard! ✓', 'success');
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <footer className="w-full px-4 pt-6 pb-20 md:pb-10 select-none">
      <div className="max-w-4xl mx-auto flex flex-col items-center text-center space-y-6">
        
        {/* Developer Attribution Box with Continuous Running RGB Light Outline */}
        <RGBLightBox className="max-w-xl w-full shadow-lg" innerClassName="p-5 sm:p-7">
          <div className="flex items-center justify-center gap-2 mb-2">
            <Code className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
            <h4 className="text-xs font-bold text-slate-700 dark:text-white uppercase tracking-wider">
              Developer &amp; Research Attribution
            </h4>
          </div>

          <p className="text-base sm:text-lg font-black text-slate-900 dark:text-white tracking-wide">
            ASIF ANSARI
          </p>
          <p className="text-xs sm:text-sm text-slate-600 dark:text-neutral-300 font-medium mt-1">
            (independent technologist researcher and biologist)
          </p>

          <div className="mt-4 pt-4 border-t border-black/10 dark:border-white/10 flex flex-col sm:flex-row items-center justify-center gap-3">
            <span className="text-xs text-slate-600 dark:text-neutral-300 font-medium">
              Contact us if you have any issue:
            </span>
            <div className="inline-flex items-center gap-1.5 liquid-glass-input px-3 py-1.5 rounded-xl shadow-sm">
              <a
                href={`mailto:${developerEmail}`}
                className="text-xs font-mono font-semibold text-emerald-600 dark:text-emerald-300 hover:text-emerald-500 dark:hover:text-emerald-200 transition flex items-center gap-1.5 min-h-[36px]"
              >
                <Mail className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                <span>{developerEmail}</span>
              </a>
              <button
                type="button"
                onClick={handleCopyEmail}
                className="min-h-[36px] min-w-[36px] p-1.5 rounded-lg text-slate-600 dark:text-neutral-300 hover:text-slate-950 dark:hover:text-white hover:bg-black/5 dark:hover:bg-white/10 transition flex items-center justify-center"
                title="Copy email"
                aria-label="Copy developer email"
              >
                {copied ? <Check className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              </button>
            </div>
          </div>
        </RGBLightBox>

        {/* Brand Tagline & Security Guarantees */}
        <div className="flex flex-wrap items-center justify-center gap-2 text-xs text-slate-500 dark:text-neutral-400 font-mono">
          <span className="text-slate-800 dark:text-white font-bold">ShareFlow P2P</span>
          <span aria-hidden="true">·</span>
          <span>Zero Server Retention</span>
          <span aria-hidden="true">·</span>
          <span>10-Minute Hard Expiry</span>
          <span aria-hidden="true">·</span>
          <span>WebRTC Direct Stream</span>
        </div>

      </div>
    </footer>
  );
};

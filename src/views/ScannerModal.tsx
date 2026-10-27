import React, { useEffect, useRef, useState } from 'react';
import { X, Flashlight, Camera, AlertCircle, ArrowRight, Image as ImageIcon, Zap, Upload } from 'lucide-react';
import { startQRScanner, decodeQRFromFile, ScannerControls } from '../services/qrScanner.ts';
import { useToast } from '../context/ToastContext.tsx';

interface ScannerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCodeScanned: (code: string) => void;
  onManualEntry: () => void;
}

export const ScannerModal: React.FC<ScannerModalProps> = ({
  isOpen,
  onClose,
  onCodeScanned,
  onManualEntry,
}) => {
  const { showToast } = useToast();
  const videoRef = useRef<HTMLVideoElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [controls, setControls] = useState<ScannerControls | null>(null);
  const [permissionDenied, setPermissionDenied] = useState<boolean>(false);
  const [isTorchOn, setIsTorchOn] = useState<boolean>(false);
  const [isDecodingFile, setIsDecodingFile] = useState<boolean>(false);

  useEffect(() => {
    if (!isOpen) {
      controls?.stop();
      setControls(null);
      setPermissionDenied(false);
      return;
    }

    let activeScanner: ScannerControls | null = null;

    if (videoRef.current) {
      startQRScanner(
        videoRef.current,
        (detectedCode) => {
          showToast(`⚡ Ultra-fast QR detected: ${detectedCode}! ✓`, 'success');
          onCodeScanned(detectedCode);
          onClose();
        },
        (error) => {
          console.warn('Camera scanner access notice:', error);
          setPermissionDenied(true);
        }
      ).then((scanner) => {
        activeScanner = scanner;
        setControls(scanner);
      });
    }

    return () => {
      activeScanner?.stop();
    };
  }, [isOpen]);

  if (!isOpen) return null;

  const handleToggleTorch = async () => {
    if (controls?.toggleTorch) {
      await controls.toggleTorch();
      setIsTorchOn((prev) => !prev);
    }
  };

  const handleImageFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsDecodingFile(true);
    showToast('Analyzing QR code from image...', 'info');

    try {
      const code = await decodeQRFromFile(file);
      if (code) {
        showToast(`QR Code found in image: ${code}! ✓`, 'success');
        onCodeScanned(code);
        onClose();
      } else {
        showToast('No valid ShareFlow QR code detected in this photo', 'error');
      }
    } catch (_) {
      showToast('Could not process image', 'error');
    } finally {
      setIsDecodingFile(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 dark:bg-black/80 backdrop-blur-2xl p-4 animate-in fade-in select-none">
      <div className="relative w-full max-w-md rounded-3xl liquid-glass-card shadow-2xl overflow-hidden">
        
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-black/10 dark:border-white/10 liquid-glass-nav">
          <div className="flex items-center gap-2">
            <Camera className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
            <span className="font-bold text-sm text-slate-900 dark:text-white">Scan ShareFlow QR</span>
            <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-600 dark:text-emerald-300 border border-emerald-500/30 flex items-center gap-1">
              <Zap className="w-2.5 h-2.5" /> 60 FPS
            </span>
          </div>

          <div className="flex items-center gap-2">
            {controls?.hasTorch && (
              <button
                type="button"
                onClick={handleToggleTorch}
                className={`min-h-[40px] min-w-[40px] p-2 rounded-xl border transition flex items-center justify-center ${
                  isTorchOn 
                    ? 'bg-amber-500/20 border-amber-500 text-amber-500' 
                    : 'liquid-glass-button text-slate-700 dark:text-neutral-300 hover:text-slate-950 dark:hover:text-white'
                }`}
                title="Toggle Torch"
                aria-label="Toggle flashlight"
              >
                <Flashlight className="w-4 h-4" />
              </button>
            )}

            <button
              type="button"
              onClick={onClose}
              className="min-h-[40px] min-w-[40px] p-2 rounded-xl liquid-glass-button text-slate-700 dark:text-neutral-300 hover:text-slate-950 dark:hover:text-white flex items-center justify-center"
              aria-label="Close scanner"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Video / Camera Viewport */}
        <div className="relative w-full aspect-square bg-black overflow-hidden flex items-center justify-center">
          {permissionDenied ? (
            <div className="p-6 text-center">
              <AlertCircle className="w-12 h-12 text-amber-400 mx-auto mb-3" />
              <h3 className="font-bold text-white text-base mb-1">Camera Access Blocked</h3>
              <p className="text-xs text-neutral-300 mb-6 leading-relaxed">
                Camera permission was denied. You can upload a QR screenshot or enter the 6-character code manually.
              </p>
              
              <div className="space-y-2">
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="w-full min-h-[44px] rounded-2xl liquid-glass-button text-white font-bold text-xs flex items-center justify-center gap-2"
                >
                  <Upload className="w-4 h-4 text-emerald-400" />
                  <span>Upload QR Screenshot</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    onClose();
                    onManualEntry();
                  }}
                  className="w-full min-h-[44px] rounded-2xl liquid-glass-accent text-white font-black text-xs flex items-center justify-center gap-1.5 shadow-md"
                >
                  <span>Enter Code Manually</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ) : (
            <>
              <video
                ref={videoRef}
                className="w-full h-full object-cover"
                autoPlay
                playsInline
                muted
              />

              {/* Targeting Reticle Frame */}
              <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
                <div className="relative w-60 h-60 rounded-3xl border-2 border-emerald-400/80 shadow-[0_0_0_9999px_rgba(0,0,0,0.6)]">
                  {/* Corner accents */}
                  <div className="absolute -top-1 -left-1 w-7 h-7 border-t-4 border-l-4 border-emerald-400 rounded-tl-xl" />
                  <div className="absolute -top-1 -right-1 w-7 h-7 border-t-4 border-r-4 border-emerald-400 rounded-tr-xl" />
                  <div className="absolute -bottom-1 -left-1 w-7 h-7 border-b-4 border-l-4 border-emerald-400 rounded-bl-xl" />
                  <div className="absolute -bottom-1 -right-1 w-7 h-7 border-b-4 border-r-4 border-emerald-400 rounded-br-xl" />

                  {/* High-speed scanning laser */}
                  <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-emerald-300 to-transparent animate-pulse shadow-md shadow-emerald-400" />
                </div>
              </div>
            </>
          )}
        </div>

        {/* Hidden File Input for QR Image Decode */}
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={handleImageFileChange}
        />

        {/* Footer controls */}
        <div className="p-4 liquid-glass-panel text-center border-t border-black/10 dark:border-white/10 space-y-2.5">
          <div className="flex items-center justify-between gap-2">
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={isDecodingFile}
              className="flex-1 min-h-[44px] flex items-center justify-center gap-1.5 rounded-2xl liquid-glass-button text-slate-800 dark:text-neutral-200 text-xs font-semibold shadow-sm"
            >
              <ImageIcon className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
              <span>{isDecodingFile ? 'Decoding...' : 'Photo / File'}</span>
            </button>

            <button
              type="button"
              onClick={() => {
                onClose();
                onManualEntry();
              }}
              className="flex-1 min-h-[44px] flex items-center justify-center gap-1.5 rounded-2xl liquid-glass-button text-slate-800 dark:text-neutral-200 text-xs font-semibold shadow-sm"
            >
              <span>Type Code</span>
              <ArrowRight className="w-3.5 h-3.5 text-slate-400 dark:text-neutral-400" />
            </button>
          </div>

          <p className="text-[11px] text-slate-500 dark:text-neutral-400 font-mono">
            Position QR code within frame for instant automatic detection.
          </p>
        </div>

      </div>
    </div>
  );
};

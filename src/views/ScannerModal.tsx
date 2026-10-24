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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-md p-4 animate-in fade-in">
      <div className="relative w-full max-w-md rounded-3xl bg-slate-900 border border-slate-800 shadow-2xl overflow-hidden">
        
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-slate-800 bg-slate-950/60">
          <div className="flex items-center gap-2">
            <Camera className="w-5 h-5 text-cyan-400" />
            <span className="font-bold text-sm text-white">Scan ShareFlow QR</span>
            <span className="text-[10px] uppercase font-mono font-bold px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 flex items-center gap-1">
              <Zap className="w-2.5 h-2.5" /> 60 FPS
            </span>
          </div>

          <div className="flex items-center gap-2">
            {controls?.hasTorch && (
              <button
                onClick={handleToggleTorch}
                className={`p-2 rounded-xl border transition ${
                  isTorchOn 
                    ? 'bg-amber-500/20 border-amber-500 text-amber-300' 
                    : 'bg-slate-800 border-slate-700 text-slate-300 hover:text-white'
                }`}
                title="Toggle Torch"
              >
                <Flashlight className="w-4 h-4" />
              </button>
            )}

            <button
              onClick={onClose}
              className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition"
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
              <p className="text-xs text-slate-400 mb-6 leading-relaxed">
                Camera permission was denied. You can upload a QR screenshot or enter the 6-character code manually.
              </p>
              
              <div className="space-y-2">
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="w-full py-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs transition flex items-center justify-center gap-2"
                >
                  <Upload className="w-4 h-4 text-cyan-400" />
                  <span>Upload QR Screenshot</span>
                </button>

                <button
                  onClick={() => {
                    onClose();
                    onManualEntry();
                  }}
                  className="w-full py-3 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-xs transition flex items-center justify-center gap-1.5"
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
                <div className="relative w-60 h-60 rounded-3xl border-2 border-cyan-400 shadow-[0_0_0_9999px_rgba(0,0,0,0.55)]">
                  {/* Corner accents */}
                  <div className="absolute -top-1 -left-1 w-7 h-7 border-t-4 border-l-4 border-cyan-400 rounded-tl-xl" />
                  <div className="absolute -top-1 -right-1 w-7 h-7 border-t-4 border-r-4 border-cyan-400 rounded-tr-xl" />
                  <div className="absolute -bottom-1 -left-1 w-7 h-7 border-b-4 border-l-4 border-cyan-400 rounded-bl-xl" />
                  <div className="absolute -bottom-1 -right-1 w-7 h-7 border-b-4 border-r-4 border-cyan-400 rounded-br-xl" />

                  {/* High-speed scanning laser */}
                  <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-cyan-300 to-transparent animate-pulse shadow-md shadow-cyan-400" />
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
        <div className="p-4 bg-slate-950/80 text-center border-t border-slate-800 space-y-2.5">
          <div className="flex items-center justify-between gap-2">
            <button
              onClick={() => fileInputRef.current?.click()}
              disabled={isDecodingFile}
              className="flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-slate-200 text-xs font-semibold transition"
            >
              <ImageIcon className="w-3.5 h-3.5 text-cyan-400" />
              <span>{isDecodingFile ? 'Decoding...' : 'Photo / Screenshot'}</span>
            </button>

            <button
              onClick={() => {
                onClose();
                onManualEntry();
              }}
              className="flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-slate-200 text-xs font-semibold transition"
            >
              <span>Type Code</span>
              <ArrowRight className="w-3.5 h-3.5 text-slate-400" />
            </button>
          </div>

          <p className="text-[11px] text-slate-400">
            Center the QR code in the frame for instant hardware-accelerated detection.
          </p>
        </div>

      </div>
    </div>
  );
};

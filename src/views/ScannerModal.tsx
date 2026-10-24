import React, { useEffect, useRef, useState } from 'react';
import { X, Flashlight, Camera, AlertCircle, ArrowRight } from 'lucide-react';
import { startQRScanner, ScannerControls } from '../services/qrScanner.ts';
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
  const [controls, setControls] = useState<ScannerControls | null>(null);
  const [permissionDenied, setPermissionDenied] = useState<boolean>(false);
  const [isTorchOn, setIsTorchOn] = useState<boolean>(false);

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
          showToast(`QR Code detected: ${detectedCode}! ✓`, 'success');
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

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-md p-4 animate-in fade-in">
      <div className="relative w-full max-w-md rounded-3xl bg-slate-900 border border-slate-800 shadow-2xl overflow-hidden">
        
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-slate-800 bg-slate-950/60">
          <div className="flex items-center gap-2">
            <Camera className="w-5 h-5 text-cyan-400" />
            <span className="font-bold text-sm text-white">Scan ShareFlow QR</span>
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
                Camera permission was denied or is not supported in this environment. You can enter the 6-character code manually.
              </p>
              <button
                onClick={() => {
                  onClose();
                  onManualEntry();
                }}
                className="w-full py-3 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-xs transition flex items-center justify-center gap-1.5"
              >
                <span>Enter Share Code Manually</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
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
                <div className="relative w-56 h-56 rounded-3xl border-2 border-cyan-400/80 shadow-[0_0_0_9999px_rgba(0,0,0,0.5)]">
                  {/* Corner accents */}
                  <div className="absolute -top-1 -left-1 w-6 h-6 border-t-4 border-l-4 border-cyan-400 rounded-tl-xl" />
                  <div className="absolute -top-1 -right-1 w-6 h-6 border-t-4 border-r-4 border-cyan-400 rounded-tr-xl" />
                  <div className="absolute -bottom-1 -left-1 w-6 h-6 border-b-4 border-l-4 border-cyan-400 rounded-bl-xl" />
                  <div className="absolute -bottom-1 -right-1 w-6 h-6 border-b-4 border-r-4 border-cyan-400 rounded-br-xl" />

                  {/* Scanning beam animation */}
                  <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-cyan-400 to-transparent animate-pulse shadow-lg shadow-cyan-400" />
                </div>
              </div>
            </>
          )}
        </div>

        {/* Footer controls */}
        {!permissionDenied && (
          <div className="p-4 bg-slate-950/80 text-center border-t border-slate-800">
            <p className="text-[11px] text-slate-400 mb-2">
              Align the QR code inside the frame to connect automatically.
            </p>
            <button
              onClick={() => {
                onClose();
                onManualEntry();
              }}
              className="text-xs font-semibold text-cyan-400 hover:text-cyan-300 underline"
            >
              Enter Share Code manually instead
            </button>
          </div>
        )}

      </div>
    </div>
  );
};

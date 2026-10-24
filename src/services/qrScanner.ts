import jsQRModule from 'jsqr';

const jsQR = (jsQRModule as any).default || jsQRModule;

export interface ScannerControls {
  stop: () => void;
  toggleTorch?: () => Promise<void>;
  hasTorch?: boolean;
}

/**
 * Extracts a ShareFlow code from either a full URL or a raw 6-character code
 */
export function extractShareCode(scannedText: string): string | null {
  if (!scannedText) return null;
  const trimmed = scannedText.trim();

  // If matches /share/CODE or ?code=CODE
  const urlMatch = trimmed.match(/\/share\/([23456789ABCDEFGHJKMNPQRSTUVWXYZa-z0-9]{4,8})/i) ||
                   trimmed.match(/[?&#]code=([23456789ABCDEFGHJKMNPQRSTUVWXYZa-z0-9]{4,8})/i) ||
                   trimmed.match(/#receive\/([23456789ABCDEFGHJKMNPQRSTUVWXYZa-z0-9]{4,8})/i);
  if (urlMatch && urlMatch[1]) {
    return urlMatch[1].toUpperCase();
  }

  // If raw 4 to 8 character code
  if (/^[23456789ABCDEFGHJKMNPQRSTUVWXYZa-z0-9]{4,8}$/i.test(trimmed)) {
    return trimmed.toUpperCase();
  }

  // If general URL ending in code
  const parts = trimmed.split('/');
  const lastPart = parts[parts.length - 1].split('?')[0].split('#')[0];
  if (/^[23456789ABCDEFGHJKMNPQRSTUVWXYZa-z0-9]{4,8}$/i.test(lastPart)) {
    return lastPart.toUpperCase();
  }

  return null;
}

/**
 * Decodes QR code from an uploaded image file (screenshot or photo)
 */
export async function decodeQRFromFile(file: File): Promise<string | null> {
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onload = () => {
      const img = new Image();
      img.onload = async () => {
        // Try native BarcodeDetector if available
        if ('BarcodeDetector' in window) {
          try {
            const barcodeDetector = new (window as any).BarcodeDetector({ formats: ['qr_code'] });
            const barcodes = await barcodeDetector.detect(img);
            if (barcodes.length > 0 && barcodes[0].rawValue) {
              const code = extractShareCode(barcodes[0].rawValue);
              if (code) return resolve(code);
            }
          } catch (_) {}
        }

        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d', { willReadFrequently: true });
        if (!ctx) return resolve(null);

        canvas.width = img.width;
        canvas.height = img.height;
        ctx.drawImage(img, 0, 0);

        const imgData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const qr = jsQR(imgData.data, imgData.width, imgData.height, {
          inversionAttempts: 'attemptBoth',
        });

        if (qr && qr.data) {
          resolve(extractShareCode(qr.data));
        } else {
          resolve(null);
        }
      };
      img.onerror = () => resolve(null);
      img.src = reader.result as string;
    };
    reader.onerror = () => resolve(null);
    reader.readAsDataURL(file);
  });
}

/**
 * Starts continuous camera scanner on a <video> element with native hardware acceleration
 * and optimized cropped canvas fallback for ultra-fast detection.
 */
export async function startQRScanner(
  videoElement: HTMLVideoElement,
  onDetected: (code: string, rawText: string) => void,
  onError: (error: Error) => void
): Promise<ScannerControls> {
  let stream: MediaStream | null = null;
  let animationFrameId: number | null = null;
  let isScanning = true;
  let isProcessingFrame = false;

  try {
    // Request environment (rear) camera on mobile by default
    stream = await navigator.mediaDevices.getUserMedia({
      video: {
        facingMode: { ideal: 'environment' },
        width: { ideal: 1280 },
        height: { ideal: 720 },
      },
      audio: false,
    });

    videoElement.srcObject = stream;
    videoElement.setAttribute('playsinline', 'true');
    await videoElement.play();

    // Check if browser has native BarcodeDetector API (ultra-fast hardware decoding)
    let nativeDetector: any = null;
    if ('BarcodeDetector' in window) {
      try {
        nativeDetector = new (window as any).BarcodeDetector({ formats: ['qr_code'] });
      } catch (_) {
        nativeDetector = null;
      }
    }

    // High performance offscreen canvas for fallback
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d', { willReadFrequently: true });

    let frameCount = 0;

    const scanFrame = async () => {
      if (!isScanning) return;

      if (videoElement.readyState === videoElement.HAVE_ENOUGH_DATA && !isProcessingFrame) {
        isProcessingFrame = true;
        frameCount++;

        try {
          // Priority 1: Native Hardware BarcodeDetector (instantaneous)
          if (nativeDetector) {
            try {
              const barcodes = await nativeDetector.detect(videoElement);
              if (barcodes && barcodes.length > 0) {
                const rawVal = barcodes[0].rawValue;
                const code = extractShareCode(rawVal);
                if (code) {
                  isScanning = false;
                  onDetected(code, rawVal);
                  return;
                }
              }
            } catch (_) {
              // Fallback to canvas
            }
          }

          // Priority 2: Cropped center region for 4x faster jsQR processing
          if (isScanning && ctx) {
            const vWidth = videoElement.videoWidth;
            const vHeight = videoElement.videoHeight;

            // Crop the central 70% square where the targeting reticle is focused
            const cropSize = Math.floor(Math.min(vWidth, vHeight) * 0.75);
            const cropX = Math.floor((vWidth - cropSize) / 2);
            const cropY = Math.floor((vHeight - cropSize) / 2);

            // Scale down to max 400x400 for blazing 60fps jsQR performance
            const targetDim = Math.min(cropSize, 400);
            canvas.width = targetDim;
            canvas.height = targetDim;

            ctx.drawImage(
              videoElement,
              cropX, cropY, cropSize, cropSize,
              0, 0, targetDim, targetDim
            );

            const imageData = ctx.getImageData(0, 0, targetDim, targetDim);
            
            // Alternate inversion every 3 frames to catch dark-theme or reversed QR codes
            const inversion = frameCount % 3 === 0 ? 'attemptBoth' : 'dontInvert';
            const code = jsQR(imageData.data, targetDim, targetDim, {
              inversionAttempts: inversion,
            });

            if (code && code.data) {
              const extracted = extractShareCode(code.data);
              if (extracted) {
                isScanning = false;
                onDetected(extracted, code.data);
                return;
              }
            }
          }
        } finally {
          isProcessingFrame = false;
        }
      }

      if (isScanning) {
        animationFrameId = requestAnimationFrame(scanFrame);
      }
    };

    animationFrameId = requestAnimationFrame(scanFrame);

    const videoTrack = stream.getVideoTracks()[0];
    const capabilities: any = videoTrack?.getCapabilities?.() || {};
    const hasTorch = !!capabilities.torch;

    const toggleTorch = async () => {
      if (!videoTrack || !hasTorch) return;
      const settings: any = videoTrack.getSettings();
      const currentTorch = settings.torch || false;
      await videoTrack.applyConstraints({
        advanced: [{ torch: !currentTorch } as any]
      });
    };

    return {
      stop: () => {
        isScanning = false;
        if (animationFrameId) {
          cancelAnimationFrame(animationFrameId);
        }
        if (stream) {
          stream.getTracks().forEach((track) => track.stop());
        }
        videoElement.srcObject = null;
      },
      toggleTorch,
      hasTorch
    };
  } catch (err) {
    if (stream) {
      stream.getTracks().forEach((track) => track.stop());
    }
    onError(err as Error);
    return {
      stop: () => {}
    };
  }
}

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
  const urlMatch = trimmed.match(/\/share\/([23456789ABCDEFGHJKMNPQRSTUVWXYZa-z0-9]{6})/i) ||
                   trimmed.match(/[?&]code=([23456789ABCDEFGHJKMNPQRSTUVWXYZa-z0-9]{6})/i);
  if (urlMatch && urlMatch[1]) {
    return urlMatch[1].toUpperCase();
  }

  // If raw 6 character code
  if (/^[23456789ABCDEFGHJKMNPQRSTUVWXYZa-z0-9]{6}$/i.test(trimmed)) {
    return trimmed.toUpperCase();
  }

  // If general URL ending in code
  const parts = trimmed.split('/');
  const lastPart = parts[parts.length - 1].split('?')[0];
  if (/^[23456789ABCDEFGHJKMNPQRSTUVWXYZa-z0-9]{6}$/i.test(lastPart)) {
    return lastPart.toUpperCase();
  }

  return null;
}

/**
 * Starts continuous camera scanner on a <video> element
 */
export async function startQRScanner(
  videoElement: HTMLVideoElement,
  onDetected: (code: string, rawText: string) => void,
  onError: (error: Error) => void
): Promise<ScannerControls> {
  let stream: MediaStream | null = null;
  let animationFrameId: number | null = null;
  let isScanning = true;

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

    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d', { willReadFrequently: true });

    const scanFrame = () => {
      if (!isScanning) return;

      if (videoElement.readyState === videoElement.HAVE_ENOUGH_DATA && ctx) {
        canvas.width = videoElement.videoWidth;
        canvas.height = videoElement.videoHeight;
        ctx.drawImage(videoElement, 0, 0, canvas.width, canvas.height);

        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const code = jsQR(imageData.data, imageData.width, imageData.height, {
          inversionAttempts: 'dontInvert',
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

      animationFrameId = requestAnimationFrame(scanFrame);
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

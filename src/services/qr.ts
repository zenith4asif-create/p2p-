import QRCode from 'qrcode';

export interface QRCodeOptions {
  width?: number;
  margin?: number;
  darkColor?: string;
  lightColor?: string;
}

/**
 * Generates high quality Data URL representation of QR code
 */
export async function generateQRDataUrl(
  text: string, 
  options: QRCodeOptions = {}
): Promise<string> {
  const {
    width = 320,
    margin = 2,
    darkColor = '#0f172a',
    lightColor = '#ffffff'
  } = options;

  return QRCode.toDataURL(text, {
    width,
    margin,
    color: {
      dark: darkColor,
      light: lightColor
    },
    errorCorrectionLevel: 'M'
  });
}

/**
 * Generates an SVG string representation of QR code
 */
export async function generateQRSvg(
  text: string,
  options: QRCodeOptions = {}
): Promise<string> {
  const {
    width = 300,
    margin = 2,
    darkColor = '#0284c7',
    lightColor = '#ffffff'
  } = options;

  return QRCode.toString(text, {
    type: 'svg',
    width,
    margin,
    color: {
      dark: darkColor,
      light: lightColor
    },
    errorCorrectionLevel: 'M'
  });
}

/**
 * Triggers client-side download of generated QR code image as PNG
 */
export function downloadQRCodeImage(dataUrl: string, filename: string = 'shareflow-qr.png'): void {
  const anchor = document.createElement('a');
  anchor.href = dataUrl;
  anchor.download = filename;
  document.body.appendChild(anchor);
  anchor.click();
  document.body.removeChild(anchor);
}

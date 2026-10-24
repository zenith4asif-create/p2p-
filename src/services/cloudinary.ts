import { FileMetadata } from '../types.ts';

export const CLOUDINARY_CONFIG = {
  cloudName: 'yuasb9xa',
  uploadPreset: 'ml_default',
  apiKey: '331236418415425',
};

/**
 * Determines appropriate Cloudinary resource type for uploaded file.
 * - 'image' for raster & vector images
 * - 'video' for audio and video media
 * - 'raw' for PDFs, documents, ZIPs, APKs, source code, text files
 */
export function getCloudinaryResourceType(mimeType: string, fileName: string): 'image' | 'video' | 'raw' {
  const lowerName = fileName.toLowerCase();
  
  if (mimeType.startsWith('image/') && !mimeType.includes('photoshop')) {
    return 'image';
  }
  
  if (mimeType.startsWith('video/') || mimeType.startsWith('audio/')) {
    return 'video';
  }
  
  // Audio files with common extensions
  if (/\.(mp3|wav|ogg|m4a|aac|flac)$/i.test(lowerName)) {
    return 'video';
  }
  
  // Generic docs, binaries, APKs, ZIPs, PDFs
  return 'raw';
}

export interface CloudinaryUploadResult {
  publicId: string;
  secureUrl: string;
  resourceType: 'image' | 'video' | 'raw';
  bytes: number;
  format: string;
}

/**
 * Uploads a file directly to Cloudinary using unsigned upload preset.
 * Reports continuous byte progress via onProgress callback.
 */
export function uploadToCloudinary(
  file: File,
  onProgress?: (percent: number, loaded: number, total: number) => void
): Promise<CloudinaryUploadResult> {
  return new Promise((resolve, reject) => {
    const resourceType = getCloudinaryResourceType(file.type, file.name);
    const url = `https://api.cloudinary.com/v1_1/${CLOUDINARY_CONFIG.cloudName}/${resourceType}/upload`;

    const formData = new FormData();
    formData.append('file', file);
    formData.append('upload_preset', CLOUDINARY_CONFIG.uploadPreset);
    formData.append('api_key', CLOUDINARY_CONFIG.apiKey);
    
    // Pass original filename
    formData.append('filename_override', file.name);

    const xhr = new XMLHttpRequest();
    xhr.open('POST', url);

    if (xhr.upload && onProgress) {
      xhr.upload.onprogress = (event) => {
        if (event.lengthComputable) {
          const percent = Math.round((event.loaded / event.total) * 100);
          onProgress(percent, event.loaded, event.total);
        }
      };
    }

    xhr.onload = () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        try {
          const response = JSON.parse(xhr.responseText);
          resolve({
            publicId: response.public_id,
            secureUrl: response.secure_url,
            resourceType,
            bytes: response.bytes || file.size,
            format: response.format || ''
          });
        } catch (err) {
          reject(new Error('Failed to parse Cloudinary response'));
        }
      } else {
        let errorMsg = `Cloudinary upload failed (HTTP ${xhr.status})`;
        try {
          const res = JSON.parse(xhr.responseText);
          if (res.error?.message) {
            errorMsg = res.error.message;
          }
        } catch (_) {}
        reject(new Error(errorMsg));
      }
    };

    xhr.onerror = () => {
      reject(new Error('Network error occurred during Cloudinary upload'));
    };

    xhr.ontimeout = () => {
      reject(new Error('Cloudinary upload timed out'));
    };

    xhr.send(formData);
  });
}

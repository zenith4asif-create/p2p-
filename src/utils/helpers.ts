import { HistoryItem, ShareSession } from '../types.ts';

/**
 * Format raw byte size into human readable string
 */
export function formatBytes(bytes: number, decimals: number = 2): string {
  if (!bytes || bytes === 0) return '0 B';
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(dm))} ${sizes[i]}`;
}

/**
 * Format seconds into MM:SS format
 */
export function formatTimeLeft(seconds: number): string {
  if (seconds <= 0) return '00:00';
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
}

/**
 * Format bytes per second speed
 */
export function formatSpeed(bytesPerSec: number): string {
  if (!bytesPerSec || bytesPerSec === 0) return '0 KB/s';
  if (bytesPerSec >= 1024 * 1024) {
    return `${(bytesPerSec / (1024 * 1024)).toFixed(1)} MB/s`;
  }
  return `${(bytesPerSec / 1024).toFixed(1)} KB/s`;
}

/**
 * Strictly verifies whether a share has expired.
 * Never trusts only client countdown.
 */
export function isShareExpired(expiresAt: number): boolean {
  if (!expiresAt) return true;
  return Date.now() > expiresAt;
}

/**
 * Returns canonical share link for code
 */
export function getShareUrl(code: string): string {
  const origin = window.location.origin;
  return `${origin}/#receive/${code.toUpperCase()}`;
}

/**
 * Detects general file category for badges and previews
 */
export function getFileCategory(mimeType: string, fileName: string): 'image' | 'video' | 'audio' | 'pdf' | 'archive' | 'code' | 'document' | 'other' {
  const lowerName = fileName.toLowerCase();
  if (mimeType.startsWith('image/')) return 'image';
  if (mimeType.startsWith('video/')) return 'video';
  if (mimeType.startsWith('audio/') || /\.(mp3|wav|ogg|m4a|aac|flac)$/i.test(lowerName)) return 'audio';
  if (mimeType === 'application/pdf' || lowerName.endsWith('.pdf')) return 'pdf';
  if (/\.(zip|rar|7z|tar|gz|bz2)$/i.test(lowerName)) return 'archive';
  if (/\.(js|ts|jsx|tsx|html|css|json|py|java|cpp|c|go|rs|php|sh|yaml|yml)$/i.test(lowerName)) return 'code';
  if (/\.(doc|docx|xls|xlsx|ppt|pptx|txt|csv|rtf|odt)$/i.test(lowerName)) return 'document';
  return 'other';
}

const HISTORY_KEY = 'shareflow_history_v1';

export function getLocalHistory(): HistoryItem[] {
  try {
    const raw = localStorage.getItem(HISTORY_KEY);
    if (!raw) return [];
    return JSON.parse(raw);
  } catch (_) {
    return [];
  }
}

export function saveToHistory(item: HistoryItem): void {
  try {
    const current = getLocalHistory();
    const filtered = current.filter((h) => h.id !== item.id && h.code !== item.code);
    const updated = [item, ...filtered].slice(0, 50); // Keep last 50
    localStorage.setItem(HISTORY_KEY, JSON.stringify(updated));
  } catch (err) {
    console.warn('Could not save history to localStorage:', err);
  }
}

export function removeFromHistory(shareId: string): void {
  try {
    const current = getLocalHistory();
    const updated = current.filter((h) => h.id !== shareId);
    localStorage.setItem(HISTORY_KEY, JSON.stringify(updated));
  } catch (_) {}
}

export function clearLocalHistory(): void {
  try {
    localStorage.removeItem(HISTORY_KEY);
  } catch (_) {}
}

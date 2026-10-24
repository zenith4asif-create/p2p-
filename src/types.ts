export type TransferMode = 'p2p' | 'cloud';

export type ShareStatus = 
  | 'waiting' 
  | 'connecting' 
  | 'transferring' 
  | 'completed' 
  | 'expired' 
  | 'failed' 
  | 'cancelled';

export interface FileMetadata {
  id: string;
  name: string;
  size: number;
  mimeType: string;
  lastModified?: number;
  // Cloudinary specific fields if uploaded
  cloudinaryPublicId?: string;
  secureUrl?: string;
  resourceType?: 'image' | 'video' | 'raw';
}

export interface ShareSession {
  id: string;
  code: string;
  ownerUid: string;
  ownerName?: string;
  createdAt: number;
  expiresAt: number;
  status: ShareStatus;
  mode: TransferMode;
  files: Record<string, FileMetadata>;
  receiverJoined?: boolean;
  receiverConnectedAt?: number;
  completedAt?: number;
}

export interface TransferProgress {
  fileId: string;
  fileName: string;
  fileIndex: number;
  totalFiles: number;
  bytesTransferred: number;
  totalBytes: number;
  percent: number;
  speedBytesPerSec: number;
  etaSeconds: number;
  status: 'pending' | 'active' | 'completed' | 'error';
}

export interface UserProfile {
  uid: string;
  name: string;
  email: string;
  createdAt: number;
}

export interface HistoryItem {
  id: string;
  code: string;
  createdAt: number;
  expiresAt: number;
  mode: TransferMode;
  status: ShareStatus;
  fileCount: number;
  totalSize: number;
  firstFileName: string;
  role: 'sender' | 'receiver';
}

export interface AppSettings {
  theme: 'dark' | 'light' | 'system';
  defaultMode: TransferMode;
  autoCloudFallback: boolean;
  soundAlerts: boolean;
  retentionHours: number;
}

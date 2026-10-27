import React, { useState, useRef } from 'react';
import { 
  UploadCloud, 
  File, 
  Image as ImageIcon, 
  Video, 
  Music, 
  FileText, 
  Archive, 
  Code, 
  X, 
  Zap, 
  Cloud, 
  Clock, 
  ShieldCheck, 
  ArrowRight,
  Loader2
} from 'lucide-react';
import { TransferMode, FileMetadata, ShareSession } from '../types.ts';
import { formatBytes, getFileCategory, saveToHistory } from '../utils/helpers.ts';
import { generateUniqueShareCode } from '../services/codeGenerator.ts';
import { saveShareSession } from '../services/firebase.ts';
import { uploadToCloudinary } from '../services/cloudinary.ts';
import { useAuth } from '../context/AuthContext.tsx';
import { useToast } from '../context/ToastContext.tsx';
import { triggerHaptic } from '../utils/haptics.ts';
import { RGBLightBox } from '../components/RGBLightBox.tsx';

interface CreateShareViewProps {
  onShareCreated: (share: ShareSession, rawFiles: File[]) => void;
  onNavigate: (view: string) => void;
}

export const CreateShareView: React.FC<CreateShareViewProps> = ({
  onShareCreated,
  onNavigate
}) => {
  const { user } = useAuth();
  const { showToast } = useToast();
  
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [transferMode, setTransferMode] = useState<TransferMode>('p2p');
  const [isDragging, setIsDragging] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<{ current: number; total: number; percent: number }>({
    current: 0,
    total: 0,
    percent: 0,
  });

  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFilesAdded = (files: FileList | null) => {
    if (!files || files.length === 0) return;
    triggerHaptic('selection');
    const newFiles = Array.from(files);
    
    // Prevent duplicates by name and size
    setSelectedFiles((prev) => {
      const existingKeys = new Set(prev.map((f) => `${f.name}-${f.size}`));
      const uniqueNew = newFiles.filter((f) => !existingKeys.has(`${f.name}-${f.size}`));
      return [...prev, ...uniqueNew];
    });
  };

  const handleRemoveFile = (index: number) => {
    triggerHaptic('tap');
    setSelectedFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    handleFilesAdded(e.dataTransfer.files);
  };

  const totalSize = selectedFiles.reduce((sum, f) => sum + f.size, 0);

  const getFilePreviewIcon = (file: File) => {
    const category = getFileCategory(file.type, file.name);
    switch (category) {
      case 'image':
        return <ImageIcon className="w-5 h-5 text-emerald-500 dark:text-emerald-400" />;
      case 'video':
        return <Video className="w-5 h-5 text-purple-500 dark:text-purple-400" />;
      case 'audio':
        return <Music className="w-5 h-5 text-pink-500 dark:text-pink-400" />;
      case 'pdf':
      case 'document':
        return <FileText className="w-5 h-5 text-amber-500 dark:text-amber-400" />;
      case 'archive':
        return <Archive className="w-5 h-5 text-orange-500 dark:text-orange-400" />;
      case 'code':
        return <Code className="w-5 h-5 text-cyan-500 dark:text-cyan-400" />;
      default:
        return <File className="w-5 h-5 text-slate-500 dark:text-neutral-300" />;
    }
  };

  const handleCreateShare = async () => {
    if (selectedFiles.length === 0) {
      showToast('Please select at least one file to share', 'error');
      return;
    }

    setIsSubmitting(true);
    try {
      // 1. Generate 6-character short code & ID
      const code = await generateUniqueShareCode();
      const shareId = `share_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;
      const now = Date.now();
      const expiresAt = now + 10 * 60 * 1000; // 10 minutes strict lifetime

      // 2. Prepare file metadata
      const filesMap: Record<string, FileMetadata> = {};

      if (transferMode === 'cloud') {
        // Cloud Upload via Cloudinary
        setUploadProgress({ current: 0, total: selectedFiles.length, percent: 0 });

        for (let i = 0; i < selectedFiles.length; i++) {
          const file = selectedFiles[i];
          const fileId = `f_${i}_${Date.now()}`;
          
          setUploadProgress({
            current: i + 1,
            total: selectedFiles.length,
            percent: Math.round(((i) / selectedFiles.length) * 100)
          });

          const cloudRes = await uploadToCloudinary(file, (percent) => {
            const overall = Math.round(((i + (percent / 100)) / selectedFiles.length) * 100);
            setUploadProgress({ current: i + 1, total: selectedFiles.length, percent: overall });
          });

          filesMap[fileId] = {
            id: fileId,
            name: file.name,
            size: file.size,
            mimeType: file.type || 'application/octet-stream',
            secureUrl: cloudRes.secureUrl,
            cloudinaryPublicId: cloudRes.publicId,
          };
        }
      } else {
        // P2P WebRTC streaming: populate file manifest without cloud storage
        selectedFiles.forEach((file, i) => {
          const fileId = `f_${i}_${Date.now()}`;
          filesMap[fileId] = {
            id: fileId,
            name: file.name,
            size: file.size,
            mimeType: file.type || 'application/octet-stream',
          };
        });
      }

      const ownerUid = user ? user.uid : `anon_${Math.random().toString(36).substring(2, 10)}`;
      const ownerName = user?.displayName || user?.email?.split('@')[0] || 'ShareFlow Sender';

      const shareSession: ShareSession = {
        id: shareId,
        code,
        ownerUid,
        ownerName,
        createdAt: now,
        expiresAt,
        status: 'waiting',
        mode: transferMode,
        files: filesMap,
        receiverJoined: false,
      };

      await saveShareSession(shareSession);

      saveToHistory({
        id: shareId,
        code,
        createdAt: now,
        expiresAt,
        mode: transferMode,
        status: 'waiting',
        fileCount: selectedFiles.length,
        totalSize,
        firstFileName: selectedFiles[0].name,
        role: 'sender',
      });

      showToast('Share created successfully! ✓', 'success');
      triggerHaptic('success');
      onShareCreated(shareSession, selectedFiles);
    } catch (err) {
      console.error('Error creating share:', err);
      showToast((err as Error).message || 'Failed to create share', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto px-4 py-6 sm:py-10 select-none">
      
      {/* Header */}
      <div className="mb-6 text-center sm:text-left">
        <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
          Create New Share
        </h1>
        <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2 text-xs text-slate-600 dark:text-neutral-300 mt-1">
          <span>Browser-to-browser P2P</span>
          <span aria-hidden="true">·</span>
          <span>Temporary Cloudinary buffer</span>
          <span aria-hidden="true">·</span>
          <span className="text-emerald-600 dark:text-emerald-400 font-mono font-bold">10m Hard Expiry</span>
        </div>
      </div>

      {/* Drag & Drop Upload Zone with Continuous Running RGB Light Outline */}
      <RGBLightBox 
        className="w-full cursor-pointer transition-transform active:scale-[0.99]" 
        innerClassName="p-6 sm:p-12 text-center"
      >
        <div
          onDragOver={(e) => {
            e.preventDefault();
            setIsDragging(true);
          }}
          onDragLeave={() => setIsDragging(false)}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
          className="w-full h-full"
        >
          <input
            ref={fileInputRef}
            type="file"
            multiple
            className="hidden"
            onChange={(e) => handleFilesAdded(e.target.files)}
          />

          <div className="w-16 h-16 rounded-2xl liquid-glass-button text-emerald-600 dark:text-emerald-400 flex items-center justify-center mx-auto mb-4 shadow-lg shadow-emerald-500/15">
            <UploadCloud className="w-8 h-8 stroke-[2.2]" />
          </div>

          <h3 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white mb-1">
            Tap to select files, or <span className="text-emerald-600 dark:text-emerald-400 underline">browse</span>
          </h3>
          <p className="text-xs text-slate-600 dark:text-neutral-300 max-w-sm mx-auto mb-3">
            Photos, 4K Videos, Audio, PDFs, Documents, Archives, APKs &amp; Code
          </p>

          <div className="flex items-center justify-center gap-1.5 text-xs text-slate-500 dark:text-neutral-400 font-mono">
            <ShieldCheck className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
            <span>Pure binary stream. Zero server retention.</span>
          </div>
        </div>
      </RGBLightBox>

      {/* Selected Files List (iOS Liquid Transparent Glass) */}
      {selectedFiles.length > 0 && (
        <div className="mt-6 liquid-glass-card rounded-3xl p-4 sm:p-5 shadow-md">
          <div className="flex items-center justify-between pb-3 border-b border-black/10 dark:border-white/10 mb-3">
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider">
                Selected Files ({selectedFiles.length})
              </span>
              <span className="text-xs text-emerald-600 dark:text-emerald-400 font-mono font-bold">
                · {formatBytes(totalSize)} Total
              </span>
            </div>
            <button
              type="button"
              onClick={() => setSelectedFiles([])}
              className="text-xs text-rose-500 dark:text-rose-300 hover:text-rose-600 dark:hover:text-rose-200 min-h-[36px] px-2 py-1 rounded-lg hover:bg-rose-500/10 transition font-medium"
            >
              Clear all
            </button>
          </div>

          <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
            {selectedFiles.map((file, idx) => (
              <div
                key={`${file.name}-${idx}`}
                className="flex items-center justify-between gap-3 p-3 rounded-2xl liquid-glass-input text-xs"
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className="p-2 rounded-xl liquid-glass-button shrink-0">
                    {getFilePreviewIcon(file)}
                  </div>
                  <div className="truncate">
                    <p className="font-semibold text-slate-900 dark:text-white truncate">{file.name}</p>
                    <p className="text-[11px] text-slate-500 dark:text-neutral-400 font-mono">
                      {formatBytes(file.size)} · {file.type || 'Binary / Raw'}
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => handleRemoveFile(idx)}
                  className="min-h-[40px] min-w-[40px] rounded-xl liquid-glass-button text-slate-400 dark:text-neutral-400 hover:text-rose-500 dark:hover:text-rose-400 flex items-center justify-center transition shrink-0"
                  aria-label={`Remove ${file.name}`}
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Transfer Mode Selector (iOS Liquid Glass Options) */}
      <div className="mt-6">
        <label className="block text-xs font-bold text-slate-800 dark:text-neutral-300 uppercase tracking-wider mb-2.5">
          Select Sharing Mode
        </label>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {/* P2P Mode */}
          <div
            onClick={() => setTransferMode('p2p')}
            className={`p-4 rounded-3xl cursor-pointer transition-all ${
              transferMode === 'p2p'
                ? 'liquid-glass-card ring-2 ring-emerald-500 dark:ring-emerald-400 shadow-md'
                : 'liquid-glass-button'
            }`}
          >
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <Zap className="w-4 h-4 text-emerald-500 dark:text-emerald-400" />
                <span className="font-bold text-sm text-slate-900 dark:text-white">P2P DIRECT STREAM</span>
              </div>
              <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-300">
                Recommended
              </span>
            </div>
            <p className="text-xs text-slate-600 dark:text-neutral-300 leading-relaxed">
              Direct browser-to-browser WebRTC DataChannel transfer. Files never hit cloud servers. Maximum local bandwidth speed.
            </p>
          </div>

          {/* Cloud Mode */}
          <div
            onClick={() => setTransferMode('cloud')}
            className={`p-4 rounded-3xl cursor-pointer transition-all ${
              transferMode === 'cloud'
                ? 'liquid-glass-card ring-2 ring-purple-500 dark:ring-purple-400 shadow-md'
                : 'liquid-glass-button'
            }`}
          >
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <Cloud className="w-4 h-4 text-purple-500 dark:text-purple-400" />
                <span className="font-bold text-sm text-slate-900 dark:text-white">CLOUD BUFFER</span>
              </div>
              <span className="text-[10px] font-bold text-purple-600 dark:text-purple-300 font-mono">
                Cloudinary
              </span>
            </div>
            <p className="text-xs text-slate-600 dark:text-neutral-300 leading-relaxed">
              Uploads to temporary Cloudinary storage. Receiver can download asynchronously even if you disconnect.
            </p>
          </div>
        </div>
      </div>

      {/* 10-Minute Expiration Notice (iOS Liquid Glass Callout) */}
      <div className="mt-6 flex items-start gap-3 p-4 rounded-3xl liquid-glass-card border-amber-500/30 text-amber-700 dark:text-amber-200 shadow-md">
        <Clock className="w-5 h-5 shrink-0 mt-0.5 text-amber-500 dark:text-amber-400" />
        <div className="text-xs leading-relaxed">
          <p className="font-bold text-slate-900 dark:text-white">Strict 10-Minute Auto Expiry</p>
          <p className="text-slate-600 dark:text-neutral-300 mt-0.5">
            Every share session automatically dissolves after 10 minutes. Both WebRTC signaling and cloud temporary uploads are expunged.
          </p>
        </div>
      </div>

      {/* Mobile-First Action Buttons */}
      <div className="mt-8 flex flex-col-reverse sm:flex-row items-center justify-between gap-3">
        <button
          type="button"
          onClick={() => onNavigate('landing')}
          className="w-full sm:w-auto min-h-[48px] px-6 py-3 rounded-2xl liquid-glass-button text-slate-700 dark:text-neutral-300 hover:text-slate-950 dark:hover:text-white text-xs font-semibold"
        >
          Cancel
        </button>

        <button
          type="button"
          onClick={handleCreateShare}
          disabled={selectedFiles.length === 0 || isSubmitting}
          className="w-full sm:w-auto min-h-[50px] px-8 py-3.5 rounded-2xl liquid-glass-accent text-white font-black text-sm shadow-xl shadow-emerald-500/25 disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2 transition-transform active:scale-95"
        >
          {isSubmitting ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              <span>
                {transferMode === 'cloud' 
                  ? `Uploading (${uploadProgress.current}/${uploadProgress.total} - ${uploadProgress.percent}%)`
                  : 'Creating Secure Share...'}
              </span>
            </>
          ) : (
            <>
              <span>START SHARING</span>
              <ArrowRight className="w-4 h-4 stroke-[2.5]" />
            </>
          )}
        </button>
      </div>

    </div>
  );
};

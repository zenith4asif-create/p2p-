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
  Info,
  Loader2
} from 'lucide-react';
import { TransferMode, FileMetadata, ShareSession } from '../types.ts';
import { formatBytes, getFileCategory, saveToHistory } from '../utils/helpers.ts';
import { generateUniqueShareCode } from '../services/codeGenerator.ts';
import { saveShareSession } from '../services/firebase.ts';
import { uploadToCloudinary } from '../services/cloudinary.ts';
import { useAuth } from '../context/AuthContext.tsx';
import { useToast } from '../context/ToastContext.tsx';

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
    const newFiles = Array.from(files);
    
    // Prevent duplicates by name and size
    setSelectedFiles((prev) => {
      const existingKeys = new Set(prev.map((f) => `${f.name}-${f.size}`));
      const uniqueNew = newFiles.filter((f) => !existingKeys.has(`${f.name}-${f.size}`));
      return [...prev, ...uniqueNew];
    });
  };

  const handleRemoveFile = (index: number) => {
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
        return <ImageIcon className="w-5 h-5 text-emerald-400" />;
      case 'video':
        return <Video className="w-5 h-5 text-purple-400" />;
      case 'audio':
        return <Music className="w-5 h-5 text-pink-400" />;
      case 'pdf':
      case 'document':
        return <FileText className="w-5 h-5 text-amber-400" />;
      case 'archive':
        return <Archive className="w-5 h-5 text-orange-400" />;
      case 'code':
        return <Code className="w-5 h-5 text-cyan-400" />;
      default:
        return <File className="w-5 h-5 text-slate-400" />;
    }
  };

  const handleCreateShare = async () => {
    if (selectedFiles.length === 0) {
      showToast('Please select at least one file to share', 'error');
      return;
    }

    setIsSubmitting(true);
    try {
      const code = await generateUniqueShareCode();
      const shareId = `share_${Date.now()}_${code}`;
      const now = Date.now();
      const expiresAt = now + 10 * 60 * 1000; // Strictly 10 minutes (600,000 ms)

      const filesMap: Record<string, FileMetadata> = {};

      if (transferMode === 'cloud') {
        // Upload to Cloudinary sequentially with progress
        setUploadProgress({ current: 0, total: selectedFiles.length, percent: 0 });

        for (let i = 0; i < selectedFiles.length; i++) {
          const file = selectedFiles[i];
          const fileId = `file_${i}`;

          showToast(`Uploading ${file.name} to Cloudinary...`, 'info');

          const uploadResult = await uploadToCloudinary(file, (percent) => {
            setUploadProgress({
              current: i + 1,
              total: selectedFiles.length,
              percent,
            });
          });

          filesMap[fileId] = {
            id: fileId,
            name: file.name,
            size: file.size,
            mimeType: file.type || 'application/octet-stream',
            lastModified: file.lastModified,
            cloudinaryPublicId: uploadResult.publicId,
            secureUrl: uploadResult.secureUrl,
            resourceType: uploadResult.resourceType,
          };
        }
      } else {
        // P2P Mode: register metadata only; binary stays in browser memory
        selectedFiles.forEach((file, i) => {
          const fileId = `file_${i}`;
          filesMap[fileId] = {
            id: fileId,
            name: file.name,
            size: file.size,
            mimeType: file.type || 'application/octet-stream',
            lastModified: file.lastModified,
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

      // Save to Firebase RTDB
      await saveShareSession(shareSession);

      // Save to local history
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
      onShareCreated(shareSession, selectedFiles);
    } catch (err) {
      console.error('Error creating share:', err);
      showToast((err as Error).message || 'Failed to create share', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="mb-6 text-center sm:text-left">
        <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
          Create New Share
        </h1>
        <p className="text-xs sm:text-sm text-slate-400 mt-1">
          Select any files to share instantly via direct WebRTC P2P or temporary Cloudinary storage.
        </p>
      </div>

      {/* Drag & Drop Upload Zone */}
      <div
        onDragOver={(e) => {
          e.preventDefault();
          setIsDragging(true);
        }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
        className={`relative border-2 border-dashed rounded-3xl p-8 sm:p-12 text-center cursor-pointer transition-all ${
          isDragging
            ? 'border-emerald-400 bg-emerald-500/10 scale-[1.01]'
            : 'border-neutral-850 hover:border-neutral-700 bg-neutral-950/80 hover:bg-neutral-900/60'
        }`}
      >
        <input
          ref={fileInputRef}
          type="file"
          multiple
          className="hidden"
          onChange={(e) => handleFilesAdded(e.target.files)}
        />

        <div className="w-16 h-16 rounded-2xl bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 flex items-center justify-center mx-auto mb-4 shadow-lg shadow-cyan-500/10">
          <UploadCloud className="w-8 h-8" />
        </div>

        <h3 className="text-base font-bold text-white mb-1">
          Drag &amp; drop files here, or <span className="text-cyan-400 underline">browse</span>
        </h3>
        <p className="text-xs text-slate-400 max-w-sm mx-auto mb-4">
          Images, 4K Videos, Audio, PDFs, Documents, ZIP, APK, Text, and Code.
        </p>

        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-800 text-[11px] text-slate-400 font-medium">
          <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
          <span>Files are never executed. Pure binary transfer.</span>
        </div>
      </div>

      {/* Selected Files List */}
      {selectedFiles.length > 0 && (
        <div className="mt-6 bg-slate-900/60 rounded-2xl border border-slate-800/80 p-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-800 mb-3">
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-white uppercase tracking-wider">
                Selected Files ({selectedFiles.length})
              </span>
              <span className="text-xs text-cyan-400 font-mono font-medium">
                · {formatBytes(totalSize)} Total
              </span>
            </div>
            <button
              onClick={() => setSelectedFiles([])}
              className="text-xs text-rose-400 hover:text-rose-300 transition"
            >
              Clear all
            </button>
          </div>

          <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
            {selectedFiles.map((file, idx) => (
              <div
                key={`${file.name}-${idx}`}
                className="flex items-center justify-between gap-3 p-2.5 rounded-xl bg-slate-950/60 border border-slate-800/60 text-xs"
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className="p-2 rounded-lg bg-slate-900 shrink-0">
                    {getFilePreviewIcon(file)}
                  </div>
                  <div className="truncate">
                    <p className="font-semibold text-white truncate">{file.name}</p>
                    <p className="text-[11px] text-slate-400 font-mono">
                      {formatBytes(file.size)} · {file.type || 'Binary / Raw'}
                    </p>
                  </div>
                </div>

                <button
                  onClick={() => handleRemoveFile(idx)}
                  className="p-1 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-slate-900 transition shrink-0"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Transfer Mode Selector */}
      <div className="mt-6">
        <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-2.5">
          Select Sharing Mode
        </label>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {/* P2P Mode */}
          <div
            onClick={() => setTransferMode('p2p')}
            className={`p-4 rounded-2xl border cursor-pointer transition-all ${
              transferMode === 'p2p'
                ? 'border-cyan-400 bg-cyan-950/20 shadow-md shadow-cyan-950/40'
                : 'border-slate-800 bg-slate-900/40 hover:border-slate-700'
            }`}
          >
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <Zap className="w-4 h-4 text-cyan-400" />
                <span className="font-bold text-sm text-white">P2P TRANSFER</span>
              </div>
              <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded bg-cyan-500/20 text-cyan-300">
                Recommended
              </span>
            </div>
            <p className="text-xs text-slate-400 leading-relaxed">
              Direct browser-to-browser WebRTC DataChannel transfer. Files never hit cloud servers. Unlimited speed.
            </p>
          </div>

          {/* Cloud Mode */}
          <div
            onClick={() => setTransferMode('cloud')}
            className={`p-4 rounded-2xl border cursor-pointer transition-all ${
              transferMode === 'cloud'
                ? 'border-purple-400 bg-purple-950/20 shadow-md shadow-purple-950/40'
                : 'border-slate-800 bg-slate-900/40 hover:border-slate-700'
            }`}
          >
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <Cloud className="w-4 h-4 text-purple-400" />
                <span className="font-bold text-sm text-white">CLOUD TRANSFER</span>
              </div>
              <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded bg-purple-500/20 text-purple-300">
                Cloudinary
              </span>
            </div>
            <p className="text-xs text-slate-400 leading-relaxed">
              Uploads to temporary Cloudinary storage. Receiver can download even if you close your browser.
            </p>
          </div>
        </div>
      </div>

      {/* 10-Minute Expiration Notice */}
      <div className="mt-6 flex items-start gap-3 p-4 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-300">
        <Clock className="w-5 h-5 shrink-0 mt-0.5" />
        <div className="text-xs leading-relaxed">
          <p className="font-bold text-amber-200">Strict 10-Minute Auto Expiry</p>
          <p className="text-amber-300/80 mt-0.5">
            Every share self-destructs after 10 minutes. Both WebRTC signaling and temporary cloud files are automatically expunged after expiration.
          </p>
        </div>
      </div>

      {/* Action Button */}
      <div className="mt-8 flex items-center justify-between gap-4">
        <button
          onClick={() => onNavigate('landing')}
          className="px-5 py-3 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-300 text-xs font-semibold transition"
        >
          Cancel
        </button>

        <button
          onClick={handleCreateShare}
          disabled={selectedFiles.length === 0 || isSubmitting}
          className="flex-1 sm:flex-initial px-8 py-3.5 rounded-2xl bg-emerald-500 hover:bg-emerald-400 text-black font-black text-sm shadow-xl shadow-emerald-500/20 disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2 transition-all hover:scale-[1.02] active:scale-[0.98]"
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
              <ArrowRight className="w-4 h-4" />
            </>
          )}
        </button>
      </div>
    </div>
  );
};

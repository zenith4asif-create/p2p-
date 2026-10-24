import React, { useState, useEffect, useRef } from 'react';
import { 
  Download, 
  Clock, 
  Zap, 
  Cloud, 
  AlertTriangle, 
  CheckCircle2, 
  FileText, 
  Image as ImageIcon, 
  Video, 
  Music, 
  ArrowRight, 
  Loader2,
  FileCheck2,
  AlertCircle
} from 'lucide-react';
import { ShareSession, TransferProgress, FileMetadata } from '../types.ts';
import { formatBytes, formatSpeed, formatTimeLeft, getFileCategory, isShareExpired, saveToHistory } from '../utils/helpers.ts';
import { getShareByCode, updateShareStatus } from '../services/firebase.ts';
import { ReceiverPeer, WebRTCConnectionState } from '../services/webrtc.ts';
import { useToast } from '../context/ToastContext.tsx';

interface ReceiveViewProps {
  initialCode?: string;
  onNavigate: (view: string, param?: string) => void;
  onOpenScanner: () => void;
}

export const ReceiveView: React.FC<ReceiveViewProps> = ({
  initialCode = '',
  onNavigate,
  onOpenScanner,
}) => {
  const { showToast } = useToast();
  
  const [inputCode, setInputCode] = useState<string>(initialCode);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [share, setShare] = useState<ShareSession | null>(null);
  const [errorStatus, setErrorStatus] = useState<'expired' | 'not_found' | 'error' | null>(null);
  const [errorMessage, setErrorMessage] = useState<string>('');
  
  // Realtime Expiration
  const [timeLeftSec, setTimeLeftSec] = useState<number>(600);

  // WebRTC Receiving state
  const [p2pState, setP2pState] = useState<WebRTCConnectionState>('idle');
  const [p2pStatusDetail, setP2pStatusDetail] = useState<string>('');
  const [transferProgress, setTransferProgress] = useState<TransferProgress | null>(null);
  const [receivedFiles, setReceivedFiles] = useState<Record<string, { blob: Blob; url: string }>>({});
  const receiverPeerRef = useRef<ReceiverPeer | null>(null);

  // Auto-search if initialCode is provided
  useEffect(() => {
    if (initialCode && initialCode.trim().length >= 4) {
      handleLookup(initialCode.trim().toUpperCase());
    }
  }, [initialCode]);

  // Realtime 10-Minute Expiration verification countdown
  useEffect(() => {
    if (!share) return;

    const checkExpiry = () => {
      const now = Date.now();
      const remainingMs = share.expiresAt - now;
      const remainingSec = Math.max(0, Math.floor(remainingMs / 1000));
      setTimeLeftSec(remainingSec);

      if (remainingSec <= 0 || isShareExpired(share.expiresAt)) {
        setErrorStatus('expired');
        receiverPeerRef.current?.destroy();
      }
    };

    checkExpiry();
    const timer = setInterval(checkExpiry, 1000);
    return () => clearInterval(timer);
  }, [share]);

  // Connect WebRTC receiver when share is loaded in P2P mode
  useEffect(() => {
    if (!share || share.mode !== 'p2p' || isShareExpired(share.expiresAt)) return;

    const peer = new ReceiverPeer(share.id, {
      onStateChange: (state, detail) => {
        setP2pState(state);
        if (detail) setP2pStatusDetail(detail);

        if (state === 'connected') {
          showToast('Direct P2P Link Established ✓', 'success');
        }
      },
      onProgress: (prog) => {
        setTransferProgress(prog);
      },
      onFileReceived: (received) => {
        setReceivedFiles((prev) => ({
          ...prev,
          [received.name]: { blob: received.blob, url: received.url }
        }));
        showToast(`Received ${received.name}! ✓`, 'success');

        // Automatically trigger browser download
        triggerBrowserDownload(received.url, received.name);
      },
      onError: (err) => {
        console.error('WebRTC Receiver Error:', err);
        setP2pState('failed');
        setP2pStatusDetail(err.message);
      }
    });

    receiverPeerRef.current = peer;
    peer.connect();

    // Mark receiver joined in RTDB
    updateShareStatus(share.id, { receiverJoined: true }).catch(console.error);

    return () => {
      peer.destroy();
    };
  }, [share]);

  const handleLookup = async (codeToLookup: string) => {
    const formatted = codeToLookup.trim().toUpperCase();
    if (formatted.length < 4) {
      showToast('Please enter a valid share code', 'error');
      return;
    }

    setIsLoading(true);
    setErrorStatus(null);
    setErrorMessage('');

    try {
      const foundShare = await getShareByCode(formatted);
      if (!foundShare) {
        setErrorStatus('not_found');
        return;
      }

      // Strict expiration verification
      if (isShareExpired(foundShare.expiresAt)) {
        setErrorStatus('expired');
        return;
      }

      setShare(foundShare);

      // Save to local history as receiver
      const totalSize = Object.values(foundShare.files).reduce((s, f) => s + f.size, 0);
      const firstFile = Object.values(foundShare.files)[0]?.name || 'files';
      saveToHistory({
        id: foundShare.id,
        code: foundShare.code,
        createdAt: foundShare.createdAt,
        expiresAt: foundShare.expiresAt,
        mode: foundShare.mode,
        status: foundShare.status,
        fileCount: Object.keys(foundShare.files).length,
        totalSize,
        firstFileName: firstFile,
        role: 'receiver',
      });

      showToast(`Found share with ${Object.keys(foundShare.files).length} files!`, 'success');
    } catch (err) {
      console.error('Error fetching share:', err);
      setErrorStatus('error');
      setErrorMessage((err as Error).message || 'Failed to retrieve share');
    } finally {
      setIsLoading(false);
    }
  };

  const triggerBrowserDownload = (url: string, filename: string) => {
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  const handleDownloadCloudFile = async (file: FileMetadata) => {
    if (!file.secureUrl) {
      showToast('Cloud URL not available for this file', 'error');
      return;
    }

    try {
      showToast(`Downloading ${file.name}...`, 'info');
      // Fetch as blob to ensure browser saves with correct name
      const res = await fetch(file.secureUrl);
      const blob = await res.blob();
      const objUrl = URL.createObjectURL(blob);
      triggerBrowserDownload(objUrl, file.name);
      setTimeout(() => URL.revokeObjectURL(objUrl), 30000);
      showToast(`Downloaded ${file.name} ✓`, 'success');
    } catch (e) {
      // Direct window fallback
      window.open(file.secureUrl, '_blank');
    }
  };

  const handleDownloadAllCloud = async () => {
    if (!share) return;
    const fileList = Object.values(share.files);
    for (const file of fileList) {
      await handleDownloadCloudFile(file);
      await new Promise((r) => setTimeout(r, 400));
    }
  };

  const getFileIcon = (file: FileMetadata) => {
    const category = getFileCategory(file.mimeType, file.name);
    switch (category) {
      case 'image':
        return <ImageIcon className="w-5 h-5 text-emerald-400" />;
      case 'video':
        return <Video className="w-5 h-5 text-purple-400" />;
      case 'audio':
        return <Music className="w-5 h-5 text-pink-400" />;
      default:
        return <FileText className="w-5 h-5 text-cyan-400" />;
    }
  };

  // 1. Expired Share Screen
  if (errorStatus === 'expired') {
    return (
      <div className="max-w-md mx-auto px-4 py-16 text-center animate-in zoom-in-95">
        <div className="w-16 h-16 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-rose-400 flex items-center justify-center mx-auto mb-4">
          <Clock className="w-8 h-8" />
        </div>
        <h2 className="text-2xl font-black text-white uppercase tracking-tight mb-2">
          SHARE EXPIRED
        </h2>
        <p className="text-sm text-slate-400 mb-6 leading-relaxed">
          This share is no longer available. All ShareFlow shares automatically expire after exactly 10 minutes to protect user privacy.
        </p>
        <button
          onClick={() => {
            setErrorStatus(null);
            setShare(null);
            setInputCode('');
            onNavigate('create');
          }}
          className="w-full py-3.5 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-sm transition"
        >
          Create New Share
        </button>
      </div>
    );
  }

  // 2. Share Not Found Screen
  if (errorStatus === 'not_found') {
    return (
      <div className="max-w-md mx-auto px-4 py-16 text-center animate-in zoom-in-95">
        <div className="w-16 h-16 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-400 flex items-center justify-center mx-auto mb-4">
          <AlertCircle className="w-8 h-8" />
        </div>
        <h2 className="text-2xl font-black text-white uppercase tracking-tight mb-2">
          SHARE NOT FOUND
        </h2>
        <p className="text-sm text-slate-400 mb-6 leading-relaxed">
          We could not find an active share matching code <span className="font-mono text-cyan-400 font-bold">{inputCode}</span>. Please verify the code or scan the QR again.
        </p>
        <div className="flex gap-3">
          <button
            onClick={() => {
              setErrorStatus(null);
              setInputCode('');
            }}
            className="flex-1 py-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs transition"
          >
            Try Another Code
          </button>
          <button
            onClick={onOpenScanner}
            className="flex-1 py-3 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-xs transition"
          >
            Scan QR Code
          </button>
        </div>
      </div>
    );
  }

  // 3. Code Entry Form if no share selected
  if (!share) {
    return (
      <div className="max-w-lg mx-auto px-4 py-12">
        <div className="text-center mb-8">
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight mb-2">
            Receive Files
          </h1>
          <p className="text-xs sm:text-sm text-slate-400">
            Enter the 6-character code or scan the sender's QR code to connect.
          </p>
        </div>

        <div className="bg-slate-900/60 rounded-3xl border border-slate-800 p-6 sm:p-8 shadow-2xl">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleLookup(inputCode);
            }}
            className="space-y-4"
          >
            <div>
              <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-2">
                Enter Share Code
              </label>
              <div className="relative">
                <input
                  type="text"
                  maxLength={6}
                  placeholder="e.g. A7K92P"
                  value={inputCode}
                  onChange={(e) => setInputCode(e.target.value.toUpperCase())}
                  className="w-full bg-slate-950 border border-slate-700/80 rounded-2xl px-4 py-3.5 text-center font-mono text-2xl font-bold tracking-widest text-cyan-400 uppercase placeholder-slate-600 focus:outline-none focus:border-cyan-400 focus:ring-2 focus:ring-cyan-500/20"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading || inputCode.trim().length < 4}
              className="w-full py-4 rounded-2xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-sm shadow-xl shadow-cyan-500/20 disabled:opacity-40 disabled:cursor-not-allowed transition flex items-center justify-center gap-2"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Looking up share...</span>
                </>
              ) : (
                <>
                  <span>RECEIVE FILES</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          <div className="relative my-6 text-center">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-slate-800" />
            </div>
            <span className="relative bg-slate-900/90 px-3 text-[11px] font-bold text-slate-500 uppercase">
              Or
            </span>
          </div>

          <button
            onClick={onOpenScanner}
            className="w-full py-3.5 rounded-2xl bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs border border-slate-700 transition flex items-center justify-center gap-2"
          >
            <span>Scan QR with Camera</span>
          </button>
        </div>
      </div>
    );
  }

  // 4. Active Share View (Found Share)
  const fileList = Object.values(share.files);
  const totalSizeBytes = fileList.reduce((sum, f) => sum + f.size, 0);

  return (
    <div className="max-w-3xl mx-auto px-4 py-6">
      
      {/* Expiry and Code Banner */}
      <div className="flex items-center justify-between pb-4 mb-6 border-b border-slate-800">
        <div>
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">
            Active Share Code
          </span>
          <p className="font-mono text-xl font-black text-cyan-400 tracking-wider">
            {share.code}
          </p>
        </div>

        <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-700/80">
          <Clock className="w-4 h-4 text-amber-400" />
          <span className="text-xs text-slate-400">Expires:</span>
          <span className="font-mono text-sm font-bold text-amber-300">
            {formatTimeLeft(timeLeftSec)}
          </span>
        </div>
      </div>

      {/* Connection & Transfer Status Card */}
      <div className="bg-slate-900/60 rounded-3xl border border-slate-800 p-6 mb-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-slate-300 uppercase tracking-wider">
              Transfer Mode:
            </span>
            <span className="text-xs font-bold px-2 py-0.5 rounded bg-cyan-500/20 text-cyan-300 flex items-center gap-1.5">
              {share.mode === 'p2p' ? <Zap className="w-3.5 h-3.5" /> : <Cloud className="w-3.5 h-3.5" />}
              <span>{share.mode === 'p2p' ? 'WebRTC P2P Transfer' : 'Cloudinary Temporary Storage'}</span>
            </span>
          </div>

          <span className="text-xs text-slate-400 font-mono">
            {fileList.length} {fileList.length === 1 ? 'file' : 'files'} · {formatBytes(totalSizeBytes)}
          </span>
        </div>

        {/* P2P Live Status */}
        {share.mode === 'p2p' && (
          <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 mb-4">
            <div className="flex items-center gap-3">
              {p2pState === 'connecting' && (
                <>
                  <Loader2 className="w-5 h-5 text-cyan-400 animate-spin shrink-0" />
                  <div>
                    <p className="text-sm font-bold text-cyan-300">CONNECTING TO SENDER...</p>
                    <p className="text-xs text-slate-400">Negotiating WebRTC offer &amp; ICE candidates.</p>
                  </div>
                </>
              )}

              {p2pState === 'connected' && (
                <>
                  <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
                  <div>
                    <p className="text-sm font-bold text-emerald-300">DIRECT P2P LINK ESTABLISHED ✓</p>
                    <p className="text-xs text-slate-400">Waiting for sender to stream file packets...</p>
                  </div>
                </>
              )}

              {p2pState === 'transferring' && (
                <>
                  <Loader2 className="w-5 h-5 text-cyan-400 animate-spin shrink-0" />
                  <div>
                    <p className="text-sm font-bold text-cyan-300">RECEIVING FILES...</p>
                    <p className="text-xs text-slate-400">Assembling binary arraybuffers into browser blobs.</p>
                  </div>
                </>
              )}

              {p2pState === 'completed' && (
                <>
                  <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
                  <div>
                    <p className="text-sm font-bold text-emerald-300">TRANSFER COMPLETED ✓</p>
                    <p className="text-xs text-slate-400">All files received and assembled.</p>
                  </div>
                </>
              )}

              {p2pState === 'disconnected' && (
                <>
                  <AlertTriangle className="w-5 h-5 text-rose-400 shrink-0" />
                  <div>
                    <p className="text-sm font-bold text-rose-300">SENDER DISCONNECTED</p>
                    <p className="text-xs text-slate-400">The sender closed their tab or lost connectivity.</p>
                  </div>
                </>
              )}
            </div>
          </div>
        )}

        {/* Live Transfer Meter */}
        {transferProgress && (
          <div className="space-y-3 bg-slate-950 p-4 rounded-2xl border border-slate-800 mb-4">
            <div className="flex items-center justify-between text-xs">
              <span className="font-semibold text-white truncate max-w-[200px]">
                {transferProgress.fileName}
              </span>
              <span className="font-mono font-bold text-cyan-400">
                {transferProgress.percent}%
              </span>
            </div>

            <div className="w-full bg-slate-800 h-2.5 rounded-full overflow-hidden">
              <div
                className="bg-gradient-to-r from-cyan-500 to-indigo-500 h-full transition-all duration-150"
                style={{ width: `${transferProgress.percent}%` }}
              />
            </div>

            <div className="flex items-center justify-between text-[11px] font-mono text-slate-400">
              <span>
                {formatBytes(transferProgress.bytesTransferred)} / {formatBytes(transferProgress.totalBytes)}
              </span>
              <span>Speed: {formatSpeed(transferProgress.speedBytesPerSec)}</span>
              <span>ETA: {transferProgress.etaSeconds}s</span>
            </div>
          </div>
        )}

        {/* Cloud Mode Download All button */}
        {share.mode === 'cloud' && (
          <button
            onClick={handleDownloadAllCloud}
            className="w-full py-3.5 rounded-2xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-sm shadow-xl shadow-cyan-500/20 transition flex items-center justify-center gap-2"
          >
            <Download className="w-4 h-4 stroke-[2.5]" />
            <span>DOWNLOAD ALL ({fileList.length} FILES)</span>
          </button>
        )}
      </div>

      {/* Files List Card */}
      <div className="bg-slate-900/60 rounded-3xl border border-slate-800 p-6">
        <h3 className="text-xs font-bold text-white uppercase tracking-wider pb-3 border-b border-slate-800 mb-4">
          Available Files
        </h3>

        <div className="space-y-3">
          {fileList.map((file, idx) => {
            const hasReceivedP2P = receivedFiles[file.name];

            return (
              <div
                key={file.id || idx}
                className="flex items-center justify-between gap-3 p-3.5 rounded-2xl bg-slate-950 border border-slate-800/80"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div className="p-2.5 rounded-xl bg-slate-900 shrink-0">
                    {getFileIcon(file)}
                  </div>
                  <div className="truncate">
                    <p className="font-semibold text-white text-xs sm:text-sm truncate">
                      {file.name}
                    </p>
                    <p className="text-[11px] text-slate-400 font-mono">
                      {formatBytes(file.size)} · {file.mimeType}
                    </p>
                  </div>
                </div>

                <div className="shrink-0">
                  {share.mode === 'cloud' ? (
                    <button
                      onClick={() => handleDownloadCloudFile(file)}
                      className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-cyan-500 hover:text-slate-950 text-slate-200 text-xs font-semibold transition"
                    >
                      <Download className="w-3.5 h-3.5" />
                      <span>Download</span>
                    </button>
                  ) : hasReceivedP2P ? (
                    <button
                      onClick={() => triggerBrowserDownload(hasReceivedP2P.url, file.name)}
                      className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-emerald-950 border border-emerald-500/40 text-emerald-300 text-xs font-semibold hover:bg-emerald-900/50 transition"
                    >
                      <FileCheck2 className="w-3.5 h-3.5" />
                      <span>Save Again</span>
                    </button>
                  ) : (
                    <div className="flex items-center gap-1 text-[11px] font-mono text-cyan-400">
                      <span>Waiting for P2P chunk stream...</span>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

    </div>
  );
};

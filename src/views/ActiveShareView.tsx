import React, { useState, useEffect, useRef } from 'react';
import { 
  Copy, 
  Download, 
  Share2, 
  Check, 
  Clock, 
  Zap, 
  Cloud, 
  Trash2, 
  AlertTriangle,
  RefreshCw,
  CheckCircle2,
  ArrowLeft,
  Loader2,
  FileText
} from 'lucide-react';
import { ShareSession, TransferProgress, FileMetadata } from '../types.ts';
import { formatBytes, formatSpeed, formatTimeLeft, getShareUrl, isShareExpired } from '../utils/helpers.ts';
import { generateQRDataUrl, downloadQRCodeImage } from '../services/qr.ts';
import { SenderPeer, WebRTCConnectionState } from '../services/webrtc.ts';
import { deleteShareSession, subscribeToShare, updateShareStatus } from '../services/firebase.ts';
import { uploadToCloudinary } from '../services/cloudinary.ts';
import { useToast } from '../context/ToastContext.tsx';

interface ActiveShareViewProps {
  share: ShareSession;
  rawFiles: File[];
  onClose: () => void;
  onNavigate: (view: string) => void;
}

export const ActiveShareView: React.FC<ActiveShareViewProps> = ({
  share: initialShare,
  rawFiles,
  onClose,
  onNavigate,
}) => {
  const { showToast } = useToast();
  const [currentShare, setCurrentShare] = useState<ShareSession>(initialShare);
  const [qrDataUrl, setQrDataUrl] = useState<string>('');
  const [timeLeftSec, setTimeLeftSec] = useState<number>(600);
  const [isExpired, setIsExpired] = useState<boolean>(false);
  const [copiedLink, setCopiedLink] = useState<boolean>(false);
  const [copiedCode, setCopiedCode] = useState<boolean>(false);

  // WebRTC state
  const [p2pState, setP2pState] = useState<WebRTCConnectionState>('waiting');
  const [p2pStatusDetail, setP2pStatusDetail] = useState<string>('Waiting for receiver to connect...');
  const [transferProgress, setTransferProgress] = useState<TransferProgress | null>(null);
  const senderPeerRef = useRef<SenderPeer | null>(null);

  // Fallback upload state
  const [isConvertingToCloud, setIsConvertingToCloud] = useState<boolean>(false);

  const shareUrl = getShareUrl(currentShare.code);
  const totalSizeBytes = Object.values(currentShare.files).reduce((sum, f) => sum + f.size, 0);

  // 1. Generate QR Code
  useEffect(() => {
    generateQRDataUrl(shareUrl, {
      width: 320,
      margin: 2,
      darkColor: '#090d16',
      lightColor: '#ffffff',
    }).then(setQrDataUrl).catch(console.error);
  }, [shareUrl]);

  // 2. Realtime 10-Minute Expiration countdown & verification
  useEffect(() => {
    const updateCountdown = () => {
      const now = Date.now();
      const remainingMs = currentShare.expiresAt - now;
      const remainingSec = Math.max(0, Math.floor(remainingMs / 1000));
      setTimeLeftSec(remainingSec);

      if (remainingSec <= 0 || isShareExpired(currentShare.expiresAt)) {
        setIsExpired(true);
        setP2pState('expired');
        // Clean up peer
        senderPeerRef.current?.destroy();
      }
    };

    updateCountdown();
    const interval = setInterval(updateCountdown, 1000);
    return () => clearInterval(interval);
  }, [currentShare.expiresAt]);

  // 3. Subscribe to Realtime Database share session
  useEffect(() => {
    const unsubscribe = subscribeToShare(currentShare.id, (updated) => {
      if (!updated) {
        // Share was deleted or removed
        return;
      }
      setCurrentShare(updated);
    });

    return () => unsubscribe();
  }, [currentShare.id]);

  // 4. Initialize WebRTC peer if in P2P mode
  useEffect(() => {
    if (currentShare.mode !== 'p2p' || isExpired) return;

    const peer = new SenderPeer(currentShare.id, {
      onStateChange: (state, detail) => {
        setP2pState(state);
        if (detail) setP2pStatusDetail(detail);

        // When connected, trigger file transfer if rawFiles are available
        if (state === 'connected' && rawFiles.length > 0) {
          showToast('Receiver connected! Starting direct transfer...', 'success');
          updateShareStatus(currentShare.id, { 
            status: 'transferring',
            receiverJoined: true,
            receiverConnectedAt: Date.now()
          }).catch(console.error);

          peer.sendFiles(rawFiles)
            .then(() => {
              showToast('Transfer completed successfully! ✓', 'success');
              updateShareStatus(currentShare.id, { 
                status: 'completed',
                completedAt: Date.now()
              }).catch(console.error);
            })
            .catch((err) => {
              console.error('P2P file transfer error:', err);
              showToast(`Transfer interrupted: ${err.message}`, 'error');
            });
        }
      },
      onProgress: (prog) => {
        setTransferProgress(prog);
      },
      onError: (err) => {
        console.error('WebRTC Sender Error:', err);
        setP2pState('failed');
        setP2pStatusDetail(err.message);
      },
    });

    senderPeerRef.current = peer;
    peer.initialize();

    return () => {
      peer.destroy();
    };
  }, [currentShare.id, currentShare.mode, isExpired, rawFiles]);

  // Copy Link
  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopiedLink(true);
      showToast('Share link copied to clipboard! ✓', 'success');
      setTimeout(() => setCopiedLink(false), 2000);
    } catch (_) {
      showToast('Failed to copy to clipboard', 'error');
    }
  };

  // Copy Code
  const handleCopyCode = async () => {
    try {
      await navigator.clipboard.writeText(currentShare.code);
      setCopiedCode(true);
      showToast('Share code copied! ✓', 'success');
      setTimeout(() => setCopiedCode(false), 2000);
    } catch (_) {
      showToast('Failed to copy code', 'error');
    }
  };

  // Native Web Share API
  const handleNativeShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: `ShareFlow - Code ${currentShare.code}`,
          text: `Download files securely from ShareFlow using code ${currentShare.code}`,
          url: shareUrl,
        });
      } catch (_) {}
    } else {
      handleCopyLink();
    }
  };

  // Download QR Code
  const handleDownloadQR = () => {
    if (qrDataUrl) {
      downloadQRCodeImage(qrDataUrl, `ShareFlow-${currentShare.code}.png`);
      showToast('QR Code image downloaded', 'success');
    }
  };

  // Cancel / Delete Share
  const handleDeleteShare = async () => {
    if (window.confirm('Are you sure you want to cancel and delete this active share?')) {
      senderPeerRef.current?.destroy();
      await deleteShareSession(currentShare.id, currentShare.code);
      showToast('Share session cancelled and deleted', 'info');
      onClose();
    }
  };

  // Cloud Fallback execution if P2P fails
  const handleCloudFallback = async () => {
    if (rawFiles.length === 0) {
      showToast('Original files are required for cloud fallback', 'error');
      return;
    }

    setIsConvertingToCloud(true);
    showToast('Switching to Cloudinary cloud fallback...', 'info');

    try {
      const updatedFilesMap: Record<string, FileMetadata> = {};

      for (let i = 0; i < rawFiles.length; i++) {
        const file = rawFiles[i];
        const fileId = `file_${i}`;
        const uploadRes = await uploadToCloudinary(file);

        updatedFilesMap[fileId] = {
          id: fileId,
          name: file.name,
          size: file.size,
          mimeType: file.type || 'application/octet-stream',
          lastModified: file.lastModified,
          cloudinaryPublicId: uploadRes.publicId,
          secureUrl: uploadRes.secureUrl,
          resourceType: uploadRes.resourceType,
        };
      }

      await updateShareStatus(currentShare.id, {
        mode: 'cloud',
        files: updatedFilesMap,
        status: 'waiting',
      });

      senderPeerRef.current?.destroy();
      showToast('Files uploaded to Cloudinary! Receiver can now download.', 'success');
    } catch (err) {
      console.error('Cloud fallback failed:', err);
      showToast((err as Error).message || 'Cloud fallback failed', 'error');
    } finally {
      setIsConvertingToCloud(false);
    }
  };

  // Expired Screen
  if (isExpired) {
    return (
      <div className="max-w-md mx-auto px-4 py-16 text-center">
        <div className="w-16 h-16 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-rose-400 flex items-center justify-center mx-auto mb-4">
          <Clock className="w-8 h-8" />
        </div>
        <h2 className="text-2xl font-bold text-white mb-2">SHARE EXPIRED</h2>
        <p className="text-sm text-slate-400 mb-6">
          This share has expired after 10 minutes for your privacy. All active transfer channels and temporary session keys have been invalidated.
        </p>
        <button
          onClick={() => onNavigate('create')}
          className="w-full py-3.5 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-sm transition"
        >
          Create New Share
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-6">
      {/* Top Bar with Expiration and Cancel */}
      <div className="flex items-center justify-between gap-4 mb-6 pb-4 border-b border-slate-800">
        <button
          onClick={onClose}
          className="flex items-center gap-1.5 text-xs text-slate-400 hover:text-white transition"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back</span>
        </button>

        {/* 10-Minute Realtime Countdown */}
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-700/80">
          <Clock className="w-4 h-4 text-amber-400 shrink-0" />
          <span className="text-xs text-slate-400">Expires in:</span>
          <span className="font-mono text-sm font-bold text-amber-300">
            {formatTimeLeft(timeLeftSec)}
          </span>
        </div>

        <button
          onClick={handleDeleteShare}
          className="flex items-center gap-1.5 text-xs text-rose-400 hover:text-rose-300 hover:bg-rose-950/30 px-3 py-1.5 rounded-lg transition"
        >
          <Trash2 className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">Cancel Share</span>
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-start">
        
        {/* Left Card: QR Code & Sharing Controls (5 cols) */}
        <div className="md:col-span-5 bg-slate-900/60 rounded-3xl border border-slate-800 p-6 text-center">
          
          {/* QR Code Container */}
          <div className="bg-white p-4 rounded-2xl inline-block shadow-2xl mb-4 max-w-[240px] w-full aspect-square">
            {qrDataUrl ? (
              <img
                src={qrDataUrl}
                alt={`ShareFlow QR for ${currentShare.code}`}
                className="w-full h-full object-contain"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-slate-400">
                <Loader2 className="w-6 h-6 animate-spin" />
              </div>
            )}
          </div>

          {/* 6-Character Code */}
          <div className="mb-4">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-widest block mb-1">
              Short Share Code
            </span>
            <div className="inline-flex items-center gap-2 bg-slate-950 px-4 py-2 rounded-xl border border-slate-800">
              <span className="font-mono text-2xl font-black text-cyan-400 tracking-wider">
                {currentShare.code}
              </span>
              <button
                onClick={handleCopyCode}
                className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
                title="Copy Code"
              >
                {copiedCode ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {/* Controls: Copy Link, Download QR, Share */}
          <div className="grid grid-cols-3 gap-2">
            <button
              onClick={handleCopyLink}
              className="flex flex-col items-center justify-center gap-1.5 p-2.5 rounded-xl bg-slate-800/80 hover:bg-slate-700/80 text-slate-200 text-xs font-semibold transition"
            >
              {copiedLink ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4 text-cyan-400" />}
              <span>{copiedLink ? 'Copied' : 'Copy Link'}</span>
            </button>

            <button
              onClick={handleDownloadQR}
              className="flex flex-col items-center justify-center gap-1.5 p-2.5 rounded-xl bg-slate-800/80 hover:bg-slate-700/80 text-slate-200 text-xs font-semibold transition"
            >
              <Download className="w-4 h-4 text-indigo-400" />
              <span>Save QR</span>
            </button>

            <button
              onClick={handleNativeShare}
              className="flex flex-col items-center justify-center gap-1.5 p-2.5 rounded-xl bg-slate-800/80 hover:bg-slate-700/80 text-slate-200 text-xs font-semibold transition"
            >
              <Share2 className="w-4 h-4 text-purple-400" />
              <span>Share</span>
            </button>
          </div>

        </div>

        {/* Right Card: Transfer Status & Files Queue (7 cols) */}
        <div className="md:col-span-7 space-y-4">
          
          {/* Connection Status Banner */}
          <div className="bg-slate-900/60 rounded-3xl border border-slate-800 p-6">
            <div className="flex items-center justify-between mb-4">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                Connection Status
              </span>
              
              <div className="flex items-center gap-2">
                <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-slate-800 text-slate-300 flex items-center gap-1.5">
                  {currentShare.mode === 'p2p' ? (
                    <>
                      <Zap className="w-3.5 h-3.5 text-cyan-400" />
                      <span>WebRTC P2P</span>
                    </>
                  ) : (
                    <>
                      <Cloud className="w-3.5 h-3.5 text-purple-400" />
                      <span>Cloud Storage</span>
                    </>
                  )}
                </span>
              </div>
            </div>

            {/* Dynamic Status Display */}
            <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800/80 mb-4">
              <div className="flex items-center gap-3">
                {p2pState === 'waiting' && (
                  <>
                    <div className="w-3 h-3 rounded-full bg-amber-400 animate-ping shrink-0" />
                    <div>
                      <p className="text-sm font-bold text-amber-300">WAITING FOR RECEIVER...</p>
                      <p className="text-xs text-slate-400">Scan QR or enter code on the receiving device to connect.</p>
                    </div>
                  </>
                )}

                {p2pState === 'connecting' && (
                  <>
                    <Loader2 className="w-5 h-5 text-cyan-400 animate-spin shrink-0" />
                    <div>
                      <p className="text-sm font-bold text-cyan-300">RECEIVER CONNECTED ✓</p>
                      <p className="text-xs text-slate-400">Establishing direct P2P DataChannel...</p>
                    </div>
                  </>
                )}

                {p2pState === 'connected' && (
                  <>
                    <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
                    <div>
                      <p className="text-sm font-bold text-emerald-300">P2P DATACHANNEL READY ✓</p>
                      <p className="text-xs text-slate-400">Peer connection established. Ready for transmission.</p>
                    </div>
                  </>
                )}

                {p2pState === 'transferring' && (
                  <>
                    <RefreshCw className="w-5 h-5 text-cyan-400 animate-spin shrink-0" />
                    <div>
                      <p className="text-sm font-bold text-cyan-300">TRANSFER STARTED</p>
                      <p className="text-xs text-slate-400">Streaming binary chunks with backpressure control.</p>
                    </div>
                  </>
                )}

                {p2pState === 'completed' && (
                  <>
                    <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
                    <div>
                      <p className="text-sm font-bold text-emerald-300">TRANSFER COMPLETED ✓</p>
                      <p className="text-xs text-slate-400">All files received successfully by peer.</p>
                    </div>
                  </>
                )}

                {(p2pState === 'failed' || p2pState === 'disconnected') && (
                  <>
                    <AlertTriangle className="w-5 h-5 text-rose-400 shrink-0" />
                    <div>
                      <p className="text-sm font-bold text-rose-300">
                        {p2pState === 'disconnected' ? 'RECEIVER DISCONNECTED' : 'P2P CONNECTION FAILED'}
                      </p>
                      <p className="text-xs text-slate-400">{p2pStatusDetail}</p>
                    </div>
                  </>
                )}
              </div>
            </div>

            {/* Live Transfer Metrics */}
            {transferProgress && (
              <div className="space-y-3 bg-slate-950 p-4 rounded-2xl border border-slate-800">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-semibold text-white truncate max-w-[200px]">
                    {transferProgress.fileName}
                  </span>
                  <span className="font-mono font-bold text-cyan-400">
                    {transferProgress.percent}%
                  </span>
                </div>

                {/* Progress Bar */}
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

            {/* Cloud Fallback Button if P2P fails */}
            {(p2pState === 'failed' || p2pState === 'disconnected') && currentShare.mode === 'p2p' && (
              <div className="mt-4 p-4 rounded-2xl bg-slate-950 border border-slate-800 text-center">
                <p className="text-xs text-slate-300 mb-3">
                  Direct peer-to-peer connection encountered a network barrier (NAT/Firewall).
                </p>
                <button
                  onClick={handleCloudFallback}
                  disabled={isConvertingToCloud}
                  className="px-5 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs shadow-lg shadow-purple-900/30 transition flex items-center justify-center gap-2 mx-auto"
                >
                  {isConvertingToCloud ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      <span>Uploading to Cloud...</span>
                    </>
                  ) : (
                    <>
                      <Cloud className="w-3.5 h-3.5" />
                      <span>USE CLOUD TRANSFER FALLBACK</span>
                    </>
                  )}
                </button>
              </div>
            )}

          </div>

          {/* Files List Overview */}
          <div className="bg-slate-900/60 rounded-3xl border border-slate-800 p-6">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800 mb-3">
              <span className="text-xs font-bold text-white uppercase tracking-wider">
                Files in Share ({Object.keys(currentShare.files).length})
              </span>
              <span className="text-xs font-mono text-cyan-400">
                {formatBytes(totalSizeBytes)} Total
              </span>
            </div>

            <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
              {Object.values(currentShare.files).map((file, idx) => (
                <div
                  key={file.id || idx}
                  className="flex items-center justify-between p-2.5 rounded-xl bg-slate-950/60 border border-slate-800/60 text-xs"
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <FileText className="w-4 h-4 text-cyan-400 shrink-0" />
                    <span className="font-semibold text-slate-200 truncate">{file.name}</span>
                  </div>
                  <span className="font-mono text-slate-400 text-[11px] shrink-0">
                    {formatBytes(file.size)}
                  </span>
                </div>
              ))}
            </div>
          </div>

        </div>

      </div>
    </div>
  );
};

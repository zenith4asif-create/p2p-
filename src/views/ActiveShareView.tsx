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
import { GhibliDancingDuo } from '../components/GhibliArt.tsx';
import { SciFiRadar } from '../components/SciFiRadar.tsx';
import { SciFiSharingHolostream } from '../components/SciFiSharingHolostream.tsx';
import { SciFiConnectedCelebration } from '../components/SciFiConnectedCelebration.tsx';
import { RGBLightBox } from '../components/RGBLightBox.tsx';
import { triggerHaptic, playSciFiSound } from '../utils/haptics.ts';

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
  const [showConnectedCelebration, setShowConnectedCelebration] = useState<boolean>(false);
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
      darkColor: '#07090e',
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
      if (!updated) return;
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

        if (state === 'connected' && rawFiles.length > 0) {
          setShowConnectedCelebration(true);
          triggerHaptic('connect');
          playSciFiSound('device_connected');
          showToast('Receiver connected! Starting direct transfer...', 'success');
          updateShareStatus(currentShare.id, { 
            status: 'transferring',
            receiverJoined: true,
            receiverConnectedAt: Date.now()
          }).catch(console.error);

          peer.sendFiles(rawFiles)
            .then(() => {
              triggerHaptic('success');
              playSciFiSound('success_fanfare');
              showToast('Transfer completed successfully! ✓', 'success');
              updateShareStatus(currentShare.id, { 
                status: 'completed',
                completedAt: Date.now()
              }).catch(console.error);
            })
            .catch((err) => {
              console.error('Send files error:', err);
              showToast('Transfer encountered a glitch', 'error');
            });
        }
      },
      onProgress: (prog) => {
        setTransferProgress(prog);
      },
      onError: (err: Error) => {
        showToast(err.message || 'Transfer error', 'error');
      },
    });

    senderPeerRef.current = peer;
    peer.initialize().catch((err) => {
      console.error('Failed to init sender peer:', err);
    });

    return () => {
      peer.destroy();
      senderPeerRef.current = null;
    };
  }, [currentShare.id, currentShare.mode, isExpired]);

  const handleCopyLink = () => {
    triggerHaptic('tap');
    navigator.clipboard.writeText(shareUrl);
    setCopiedLink(true);
    showToast('Direct share link copied to clipboard! ✓', 'success');
    setTimeout(() => setCopiedLink(false), 2000);
  };

  const handleCopyCode = () => {
    triggerHaptic('tap');
    navigator.clipboard.writeText(currentShare.code);
    setCopiedCode(true);
    showToast(`Code ${currentShare.code} copied! ✓`, 'success');
    setTimeout(() => setCopiedCode(false), 2000);
  };

  const handleDownloadQR = () => {
    triggerHaptic('selection');
    if (!qrDataUrl) return;
    downloadQRCodeImage(qrDataUrl, `shareflow_${currentShare.code}.png`);
    showToast('QR code saved to device ✓', 'success');
  };

  const handleNativeShare = async () => {
    triggerHaptic('selection');
    if (navigator.share) {
      try {
        await navigator.share({
          title: `ShareFlow: Files (${Object.keys(currentShare.files).length})`,
          text: `Download files using code ${currentShare.code}. Expires in 10 minutes.`,
          url: shareUrl,
        });
      } catch (_) {}
    } else {
      handleCopyLink();
    }
  };

  const handleDeleteShare = async () => {
    if (!window.confirm('Are you sure you want to cancel this share?')) return;
    try {
      senderPeerRef.current?.destroy();
      await deleteShareSession(currentShare.id);
      showToast('Share session removed ✓', 'info');
      onClose();
    } catch (err) {
      showToast('Error removing share', 'error');
    }
  };

  const handleCloudFallback = async () => {
    if (rawFiles.length === 0) {
      showToast('No raw files available for cloud fallback', 'error');
      return;
    }

    setIsConvertingToCloud(true);
    showToast('Uploading files to temporary Cloudinary buffer...', 'info');

    try {
      const updatedFiles: Record<string, FileMetadata> = {};

      for (let i = 0; i < rawFiles.length; i++) {
        const file = rawFiles[i];
        const fileId = `f_${i}_${Date.now()}`;
        const cloudRes = await uploadToCloudinary(file);
        updatedFiles[fileId] = {
          id: fileId,
          name: file.name,
          size: file.size,
          mimeType: file.type || 'application/octet-stream',
          secureUrl: cloudRes.secureUrl,
          cloudinaryPublicId: cloudRes.publicId,
        };
      }

      await updateShareStatus(currentShare.id, {
        mode: 'cloud',
        files: updatedFiles,
        status: 'waiting',
      });

      setCurrentShare((prev) => ({
        ...prev,
        mode: 'cloud',
        files: updatedFiles,
      }));

      showToast('Switched to Cloud Buffer! Receiver can now download.', 'success');
    } catch (err) {
      console.error('Fallback error:', err);
      showToast('Failed to upload to cloud storage', 'error');
    } finally {
      setIsConvertingToCloud(false);
    }
  };

  // Expired Screen
  if (isExpired) {
    return (
      <div className="max-w-md mx-auto px-4 py-12 text-center animate-in zoom-in-95 select-none">
        <div className="liquid-glass-card p-6 sm:p-8 rounded-3xl shadow-xl">
          <div className="w-16 h-16 rounded-2xl liquid-glass-button text-rose-500 dark:text-rose-400 flex items-center justify-center mx-auto mb-4 shadow-sm">
            <Clock className="w-8 h-8 stroke-[2.2]" />
          </div>
          <h2 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white uppercase tracking-tight mb-2">
            SESSION EXPIRED
          </h2>
          <p className="text-xs sm:text-sm text-slate-600 dark:text-neutral-300 mb-6 leading-relaxed">
            Your 10-minute session has ended. In accordance with zero-retention privacy standards, all signaling data has been permanently destroyed.
          </p>
          <button
            type="button"
            onClick={onClose}
            className="w-full min-h-[48px] rounded-2xl liquid-glass-accent text-white font-black text-sm transition active:scale-95 shadow-md"
          >
            Return to Dashboard
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-6 select-none">
      
      {/* Top Bar with Expiry & Actions */}
      <div className="flex flex-wrap items-center justify-between gap-3 pb-4 mb-6 border-b border-black/10 dark:border-white/10">
        <button
          type="button"
          onClick={onClose}
          className="min-h-[40px] flex items-center gap-2 text-xs font-semibold text-slate-700 dark:text-neutral-300 hover:text-slate-950 dark:hover:text-white px-3 py-1.5 rounded-xl liquid-glass-button shadow-sm"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Dashboard</span>
        </button>

        {/* 10-Min Expiry Meter */}
        <div className="flex items-center gap-2 px-3.5 py-1.5 rounded-2xl liquid-glass-card shadow-sm">
          <Clock className="w-4 h-4 text-amber-500 dark:text-amber-400" />
          <span className="text-xs text-slate-500 dark:text-neutral-400">Expires in:</span>
          <span className="font-mono text-sm font-bold text-amber-600 dark:text-amber-300">
            {formatTimeLeft(timeLeftSec)}
          </span>
        </div>

        {/* Cancel Button */}
        <button
          type="button"
          onClick={handleDeleteShare}
          className="min-h-[40px] flex items-center gap-1.5 text-xs text-rose-600 dark:text-rose-400 hover:text-rose-700 dark:hover:text-rose-300 px-3 py-1.5 rounded-xl liquid-glass-button hover:bg-rose-500/10 transition shadow-sm"
        >
          <Trash2 className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">Cancel Share</span>
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-start">
        
        {/* Left Card: QR Code & Sharing Controls with Continuous Running RGB Outline */}
        <RGBLightBox className="md:col-span-5 text-center shadow-xl" innerClassName="p-6">
          
          {/* QR Code Container */}
          <div className="bg-white p-4 rounded-3xl inline-block shadow-2xl mb-4 max-w-[220px] sm:max-w-[240px] w-full aspect-square">
            {qrDataUrl ? (
              <img
                src={qrDataUrl}
                alt={`ShareFlow QR for ${currentShare.code}`}
                className="w-full h-full object-contain"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-slate-400 dark:text-neutral-400">
                <Loader2 className="w-6 h-6 animate-spin text-emerald-500" />
              </div>
            )}
          </div>

          {/* 6-Character Code */}
          <div className="mb-4">
            <span className="text-[11px] font-bold text-slate-500 dark:text-neutral-400 uppercase tracking-widest block mb-1">
              Short Share Code
            </span>
            <div className="inline-flex items-center gap-2 liquid-glass-input px-4 py-2 rounded-2xl shadow-sm">
              <span className="font-mono text-2xl font-black text-emerald-600 dark:text-emerald-400 tracking-wider">
                {currentShare.code}
              </span>
              <button
                type="button"
                onClick={handleCopyCode}
                className="min-h-[36px] min-w-[36px] p-1.5 rounded-xl liquid-glass-button text-slate-700 dark:text-neutral-300 hover:text-slate-950 dark:hover:text-white flex items-center justify-center shadow-sm"
                title="Copy Code"
                aria-label="Copy short code"
              >
                {copiedCode ? <Check className="w-4 h-4 text-emerald-600 dark:text-emerald-400" /> : <Copy className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {/* Controls: Copy Link, Download QR, Share */}
          <div className="grid grid-cols-3 gap-2">
            <button
              type="button"
              onClick={handleCopyLink}
              className="min-h-[50px] flex flex-col items-center justify-center gap-1 p-2 rounded-2xl liquid-glass-button text-slate-800 dark:text-neutral-200 text-xs font-semibold shadow-sm"
            >
              {copiedLink ? <Check className="w-4 h-4 text-emerald-600 dark:text-emerald-400" /> : <Copy className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />}
              <span>{copiedLink ? 'Copied' : 'Link'}</span>
            </button>

            <button
              type="button"
              onClick={handleDownloadQR}
              className="min-h-[50px] flex flex-col items-center justify-center gap-1 p-2 rounded-2xl liquid-glass-button text-slate-800 dark:text-neutral-200 text-xs font-semibold shadow-sm"
            >
              <Download className="w-4 h-4 text-cyan-600 dark:text-cyan-400" />
              <span>Save QR</span>
            </button>

            <button
              type="button"
              onClick={handleNativeShare}
              className="min-h-[50px] flex flex-col items-center justify-center gap-1 p-2 rounded-2xl liquid-glass-button text-slate-800 dark:text-neutral-200 text-xs font-semibold shadow-sm"
            >
              <Share2 className="w-4 h-4 text-purple-600 dark:text-purple-400" />
              <span>Share</span>
            </button>
          </div>

        </RGBLightBox>

        {/* Right Card: Transfer Status & Files Queue (7 cols on desktop, full width on mobile) */}
        <div className="md:col-span-7 space-y-4">
          
          {/* Connection Status Banner */}
          <div className="liquid-glass-card rounded-3xl p-5 sm:p-6 shadow-md">
            <div className="flex items-center justify-between mb-4">
              <span className="text-xs font-bold text-slate-800 dark:text-neutral-300 uppercase tracking-wider">
                Connection Status
              </span>
              
              <div className="flex items-center gap-2">
                <span className="text-xs font-mono font-bold text-emerald-600 dark:text-emerald-300 flex items-center gap-1.5">
                  {currentShare.mode === 'p2p' ? (
                    <>
                      <Zap className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                      <span>WebRTC P2P</span>
                    </>
                  ) : (
                    <>
                      <Cloud className="w-3.5 h-3.5 text-purple-600 dark:text-purple-400" />
                      <span>Cloud Storage</span>
                    </>
                  )}
                </span>
              </div>
            </div>

            {/* Dynamic Sci-Fi Status Display */}
            <div className="p-4 rounded-2xl liquid-glass-input mb-4">
              <div className="flex flex-col gap-3">
                {p2pState === 'waiting' && (
                  <div className="w-full space-y-3">
                    <div className="flex items-center gap-3">
                      <div className="w-3 h-3 rounded-full bg-amber-400 animate-ping shrink-0" />
                      <div>
                        <p className="text-sm font-bold text-amber-600 dark:text-amber-300">WAITING FOR RECEIVER...</p>
                        <p className="text-xs text-slate-600 dark:text-neutral-300">Scan QR code or enter code {currentShare.code} on another device.</p>
                      </div>
                    </div>

                    {/* Interactive Continuous Moving RGB Outline Radar */}
                    <div className="py-2">
                      <SciFiRadar 
                        status="waiting" 
                        code={currentShare.code} 
                        size="md" 
                        showTelemetry={true} 
                      />
                    </div>

                    {/* Live Looping Video Peer Feed */}
                    <div className="liquid-glass-panel rounded-2xl p-2 overflow-hidden shadow-sm">
                      <GhibliDancingDuo label="Awaiting receiver connection · Continuous peer mesh online" compact={true} />
                    </div>
                  </div>
                )}

                {p2pState === 'connecting' && (
                  <div className="w-full space-y-3">
                    <div className="flex items-center gap-3">
                      <Loader2 className="w-5 h-5 text-emerald-500 dark:text-emerald-400 animate-spin shrink-0" />
                      <div>
                        <p className="text-sm font-bold text-emerald-600 dark:text-emerald-300">RECEIVER CONNECTED ✓</p>
                        <p className="text-xs text-slate-600 dark:text-neutral-300">Negotiating WebRTC offer and establishing secure channel...</p>
                      </div>
                    </div>

                    {/* Radar in Connecting Mode */}
                    <div className="py-2">
                      <SciFiRadar 
                        status="connecting" 
                        code={currentShare.code} 
                        size="sm" 
                        showTelemetry={false} 
                      />
                    </div>
                  </div>
                )}

                {p2pState === 'connected' && (
                  <div className="w-full space-y-2">
                    <div className="flex items-center gap-3">
                      <CheckCircle2 className="w-5 h-5 text-emerald-500 dark:text-emerald-400 shrink-0" />
                      <div>
                        <p className="text-sm font-bold text-emerald-600 dark:text-emerald-300">P2P DATACHANNEL READY ✓</p>
                        <p className="text-xs text-slate-600 dark:text-neutral-300">Peer connection established. Commencing high-speed transmission.</p>
                      </div>
                    </div>
                    <div className="py-1">
                      <SciFiRadar 
                        status="connected" 
                        code={currentShare.code} 
                        size="sm" 
                        showTelemetry={false} 
                      />
                    </div>
                  </div>
                )}

                {p2pState === 'transferring' && (
                  <div className="w-full space-y-3">
                    <div className="flex items-center gap-3">
                      <RefreshCw className="w-5 h-5 text-emerald-500 dark:text-emerald-400 animate-spin shrink-0" />
                      <div>
                        <p className="text-sm font-bold text-emerald-600 dark:text-emerald-300">DIRECT QUANTUM STREAM IN PROGRESS</p>
                        <p className="text-xs text-slate-600 dark:text-neutral-300">Streaming binary file chunks across encrypted RTCDataChannel.</p>
                      </div>
                    </div>

                    {/* New Sci-Fi Modern Animated Holostream Conduit */}
                    <SciFiSharingHolostream
                      progress={transferProgress}
                      mode="sender"
                      fileCount={Object.keys(currentShare.files).length}
                      totalSize={totalSizeBytes}
                    />

                    <div className="liquid-glass-panel rounded-2xl p-2 overflow-hidden shadow-sm">
                      <GhibliDancingDuo label="Streaming files to receiver · Direct P2P link active" compact={true} />
                    </div>
                  </div>
                )}

                {p2pState === 'completed' && (
                  <div className="w-full text-center py-2">
                    <div className="liquid-glass-panel rounded-2xl p-2 mb-3 overflow-hidden shadow-sm">
                      <GhibliDancingDuo label="🎉 All files delivered successfully!" compact={true} />
                    </div>
                    <h3 className="text-base sm:text-lg font-black text-slate-900 dark:text-white uppercase tracking-tight">
                      🎉 SUCCESSFULLY TRANSFERRED ALL FILES!
                    </h3>
                    <p className="text-sm font-bold text-emerald-600 dark:text-emerald-400 mt-1">
                      THANKS FOR USING SHAREFLOW
                    </p>
                    <p className="text-xs text-slate-600 dark:text-neutral-300 mt-1 font-mono">
                      Receiver has successfully reconstructed the files.
                    </p>
                    <button
                      type="button"
                      onClick={onClose}
                      className="mt-3 min-h-[44px] px-6 py-2.5 rounded-2xl liquid-glass-accent text-white font-black text-xs transition active:scale-95 shadow-md"
                    >
                      Done &amp; Return to Dashboard
                    </button>
                  </div>
                )}

                {(p2pState === 'failed' || p2pState === 'disconnected') && (
                  <>
                    <AlertTriangle className="w-5 h-5 text-rose-500 dark:text-rose-400 shrink-0" />
                    <div>
                      <p className="text-sm font-bold text-rose-600 dark:text-rose-300">
                        {p2pState === 'disconnected' ? 'RECEIVER DISCONNECTED' : 'P2P CONNECTION FAILED'}
                      </p>
                      <p className="text-xs text-slate-600 dark:text-neutral-300">{p2pStatusDetail}</p>
                    </div>
                  </>
                )}
              </div>
            </div>

            {/* Live Transfer Metrics */}
            {transferProgress && (
              <div className="space-y-3 liquid-glass-input p-4 rounded-2xl">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-semibold text-slate-900 dark:text-white truncate max-w-[200px]">
                    {transferProgress.fileName}
                  </span>
                  <span className="font-mono font-bold text-emerald-600 dark:text-emerald-400">
                    {transferProgress.percent}%
                  </span>
                </div>

                <div className="w-full bg-black/10 dark:bg-white/10 h-2.5 rounded-full overflow-hidden">
                  <div
                    className="bg-gradient-to-r from-emerald-500 via-teal-400 to-cyan-500 h-full transition-all duration-150"
                    style={{ width: `${transferProgress.percent}%` }}
                  />
                </div>

                <div className="flex flex-wrap items-center justify-between gap-1 text-[11px] font-mono text-slate-600 dark:text-neutral-300">
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
              <div className="mt-4 p-4 rounded-2xl liquid-glass-input text-center">
                <p className="text-xs text-slate-600 dark:text-neutral-300 mb-3">
                  Direct peer-to-peer connection encountered a network barrier (NAT/Firewall).
                </p>
                <button
                  type="button"
                  onClick={handleCloudFallback}
                  disabled={isConvertingToCloud}
                  className="min-h-[44px] px-5 py-2.5 rounded-xl liquid-glass-button bg-purple-500/15 text-purple-700 dark:text-purple-200 hover:text-purple-900 dark:hover:text-white font-bold text-xs transition flex items-center justify-center gap-2 mx-auto shadow-sm"
                >
                  {isConvertingToCloud ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      <span>Uploading to Cloud...</span>
                    </>
                  ) : (
                    <>
                      <Cloud className="w-3.5 h-3.5" />
                      <span>USE CLOUD TRANSFER BUFFER</span>
                    </>
                  )}
                </button>
              </div>
            )}

          </div>

          {/* Files List Overview */}
          <div className="liquid-glass-card rounded-3xl p-5 sm:p-6 shadow-md">
            <div className="flex items-center justify-between pb-3 border-b border-black/10 dark:border-white/10 mb-3">
              <span className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider">
                Files in Share ({Object.keys(currentShare.files).length})
              </span>
              <span className="text-xs font-mono text-emerald-600 dark:text-emerald-400 font-bold">
                {formatBytes(totalSizeBytes)} Total
              </span>
            </div>

            <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
              {Object.values(currentShare.files).map((file, idx) => (
                <div
                  key={file.id || idx}
                  className="flex items-center justify-between p-2.5 rounded-xl liquid-glass-input text-xs"
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <FileText className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
                    <span className="font-semibold text-slate-800 dark:text-neutral-200 truncate">{file.name}</span>
                  </div>
                  <span className="font-mono text-slate-500 dark:text-neutral-400 text-[11px] shrink-0">
                    {formatBytes(file.size)}
                  </span>
                </div>
              ))}
            </div>
          </div>

        </div>

      </div>

      {/* High-Quality Sci-Fi Connected Device Celebration Sequence */}
      <SciFiConnectedCelebration
        isOpen={showConnectedCelebration}
        onDismiss={() => setShowConnectedCelebration(false)}
        deviceName="Target Receiver"
        shareCode={currentShare.code}
      />
    </div>
  );
};

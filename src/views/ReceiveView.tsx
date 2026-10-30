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
  AlertCircle,
  Play,
  Eye,
  X
} from 'lucide-react';
import { ShareSession, TransferProgress, FileMetadata } from '../types.ts';
import { formatBytes, formatSpeed, formatTimeLeft, getFileCategory, isShareExpired, saveToHistory } from '../utils/helpers.ts';
import { getShareByCode, updateShareStatus } from '../services/firebase.ts';
import { ReceiverPeer, WebRTCConnectionState } from '../services/webrtc.ts';
import { useToast } from '../context/ToastContext.tsx';
import { GhibliDancingDuo, FullScreenSuccessModal } from '../components/GhibliArt.tsx';
import { SciFiRadar } from '../components/SciFiRadar.tsx';
import { SciFiSharingHolostream } from '../components/SciFiSharingHolostream.tsx';
import { SciFiConnectedCelebration } from '../components/SciFiConnectedCelebration.tsx';
import { RGBLightBox } from '../components/RGBLightBox.tsx';
import { QuantumProgressBar } from '../components/QuantumProgressBar.tsx';
import { triggerHaptic, playSciFiSound } from '../utils/haptics.ts';

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
  const [showFullScreenSuccess, setShowFullScreenSuccess] = useState<boolean>(false);
  const [showConnectedCelebration, setShowConnectedCelebration] = useState<boolean>(false);
  const [activeMediaPreview, setActiveMediaPreview] = useState<{ url: string; name: string; type: 'video' | 'image' | 'other' } | null>(null);
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
          setShowConnectedCelebration(true);
          triggerHaptic('connect');
          playSciFiSound('device_connected');
          showToast('Direct P2P Link Established ✓', 'success');
        } else if (state === 'completed') {
          triggerHaptic('success');
          playSciFiSound('success_fanfare');
          setTimeout(() => {
            setShowFullScreenSuccess(true);
          }, 400);
        }
      },
      onProgress: (prog) => {
        setTransferProgress(prog);
      },
      onFileReceived: (receivedFile) => {
        triggerHaptic('beam');
        playSciFiSound('data_beam');
        setReceivedFiles((prev) => ({
          ...prev,
          [receivedFile.name]: { blob: receivedFile.blob, url: receivedFile.url },
        }));

        triggerBrowserDownload(receivedFile.url, receivedFile.name);
        showToast(`Received ${receivedFile.name} ✓`, 'success');
      },
      onError: (err: Error) => {
        showToast(err.message || 'Transfer error', 'error');
      },
    });

    receiverPeerRef.current = peer;
    peer.connect().catch((err: Error) => {
      console.error('Failed to init receiver peer:', err);
    });

    return () => {
      peer.destroy();
      receiverPeerRef.current = null;
    };
  }, [share]);

  const triggerBrowserDownload = (url: string, filename: string) => {
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  const handleLookup = async (codeToSearch: string) => {
    triggerHaptic('selection');
    const cleanCode = codeToSearch.trim().toUpperCase();
    if (cleanCode.length < 4) {
      showToast('Please enter a valid 4-to-6 digit code', 'error');
      return;
    }

    setIsLoading(true);
    setErrorStatus(null);
    setErrorMessage('');

    try {
      const found = await getShareByCode(cleanCode);
      if (!found) {
        setErrorStatus('not_found');
        return;
      }

      if (isShareExpired(found.expiresAt)) {
        setErrorStatus('expired');
        return;
      }

      setShare(found);

      // Save to receiver's history
      const fileList = Object.values(found.files);
      const totalSize = fileList.reduce((sum, f) => sum + f.size, 0);

      saveToHistory({
        id: found.id,
        code: found.code,
        createdAt: found.createdAt,
        expiresAt: found.expiresAt,
        mode: found.mode,
        status: 'completed',
        fileCount: fileList.length,
        totalSize,
        firstFileName: fileList[0]?.name || 'Unknown',
        role: 'receiver',
      });

      // Mark receiver joined in signaling
      updateShareStatus(found.id, { receiverJoined: true }).catch(() => {});
    } catch (err) {
      console.error('Lookup error:', err);
      setErrorStatus('error');
      setErrorMessage((err as Error).message || 'Failed to fetch share details');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDownloadCloudFile = async (file: FileMetadata) => {
    const url = file.secureUrl;
    if (!url) {
      showToast('Cloud URL not available for this file', 'error');
      return;
    }

    try {
      showToast(`Downloading ${file.name}...`, 'info');
      const res = await fetch(url);
      const blob = await res.blob();
      const objUrl = URL.createObjectURL(blob);
      triggerBrowserDownload(objUrl, file.name);
      setTimeout(() => URL.revokeObjectURL(objUrl), 30000);
      showToast(`Downloaded ${file.name} ✓`, 'success');
    } catch (e) {
      window.open(url, '_blank');
    }
  };

  const handleDownloadAllCloud = async () => {
    if (!share) return;
    const fileList = Object.values(share.files);
    for (const file of fileList) {
      await handleDownloadCloudFile(file);
      await new Promise((r) => setTimeout(r, 400));
    }
    setTimeout(() => {
      setShowFullScreenSuccess(true);
    }, 500);
  };

  const getFileIcon = (file: FileMetadata) => {
    const category = getFileCategory(file.mimeType, file.name);
    switch (category) {
      case 'image':
        return <ImageIcon className="w-5 h-5 text-emerald-500 dark:text-emerald-400" />;
      case 'video':
        return <Video className="w-5 h-5 text-purple-500 dark:text-purple-400" />;
      case 'audio':
        return <Music className="w-5 h-5 text-pink-500 dark:text-pink-400" />;
      default:
        return <FileText className="w-5 h-5 text-cyan-500 dark:text-cyan-400" />;
    }
  };

  // 1. Expired Share Screen
  if (errorStatus === 'expired') {
    return (
      <div className="max-w-md mx-auto px-4 py-12 text-center animate-in zoom-in-95 select-none">
        <div className="liquid-glass-card p-6 sm:p-8 rounded-3xl shadow-xl">
          <div className="w-16 h-16 rounded-2xl liquid-glass-button text-rose-500 dark:text-rose-400 flex items-center justify-center mx-auto mb-4 shadow-sm">
            <Clock className="w-8 h-8 stroke-[2.2]" />
          </div>
          <h2 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white uppercase tracking-tight mb-2">
            SHARE EXPIRED
          </h2>
          <p className="text-xs sm:text-sm text-slate-600 dark:text-neutral-300 mb-6 leading-relaxed">
            This share is no longer available. All ShareFlow shares automatically expire after exactly 10 minutes to protect user privacy.
          </p>
          <button
            type="button"
            onClick={() => {
              setErrorStatus(null);
              setShare(null);
              setInputCode('');
              onNavigate('create');
            }}
            className="w-full min-h-[48px] rounded-2xl liquid-glass-accent text-white font-black text-sm transition active:scale-95 shadow-md"
          >
            Create New Share
          </button>
        </div>
      </div>
    );
  }

  // 2. Share Not Found Screen
  if (errorStatus === 'not_found') {
    return (
      <div className="max-w-md mx-auto px-4 py-12 text-center animate-in zoom-in-95 select-none">
        <div className="liquid-glass-card p-6 sm:p-8 rounded-3xl shadow-xl">
          <div className="w-16 h-16 rounded-2xl liquid-glass-button text-amber-500 dark:text-amber-400 flex items-center justify-center mx-auto mb-4 shadow-sm">
            <AlertCircle className="w-8 h-8 stroke-[2.2]" />
          </div>
          <h2 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white uppercase tracking-tight mb-2">
            SHARE NOT FOUND
          </h2>
          <p className="text-xs sm:text-sm text-slate-600 dark:text-neutral-300 mb-6 leading-relaxed">
            We could not find an active share matching code <span className="font-mono text-emerald-600 dark:text-emerald-400 font-bold">{inputCode}</span>. Please verify the code or scan the QR code.
          </p>
          <div className="flex flex-col sm:flex-row gap-3">
            <button
              type="button"
              onClick={() => {
                setErrorStatus(null);
                setInputCode('');
              }}
              className="flex-1 min-h-[48px] rounded-2xl liquid-glass-button text-slate-800 dark:text-white font-bold text-xs"
            >
              Try Another Code
            </button>
            <button
              type="button"
              onClick={onOpenScanner}
              className="flex-1 min-h-[48px] rounded-2xl liquid-glass-accent text-white font-black text-xs shadow-md"
            >
              Scan QR Code
            </button>
          </div>
        </div>
      </div>
    );
  }

  // 3. Code Entry Form if no share selected
  if (!share) {
    return (
      <div className="max-w-lg mx-auto px-4 py-8 sm:py-14 select-none">
        <div className="text-center mb-6 sm:mb-8">
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight mb-2">
            Receive Files
          </h1>
          <p className="text-xs sm:text-sm text-slate-600 dark:text-neutral-300">
            Enter the 6-character code or scan the sender's QR code to stream files.
          </p>
        </div>

        <RGBLightBox className="w-full shadow-2xl" innerClassName="p-6 sm:p-8">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleLookup(inputCode);
            }}
            className="space-y-4"
          >
            <div>
              <label className="block text-xs font-bold text-slate-800 dark:text-neutral-300 uppercase tracking-wider mb-2">
                Enter Share Code
              </label>
              <div className="relative">
                <input
                  type="text"
                  maxLength={6}
                  placeholder="e.g. A7K92P"
                  value={inputCode}
                  onChange={(e) => setInputCode(e.target.value.toUpperCase())}
                  className="w-full liquid-glass-input rounded-2xl px-4 py-4 text-center font-mono text-2xl font-black tracking-widest text-emerald-600 dark:text-emerald-400 uppercase placeholder-slate-400 dark:placeholder-neutral-600 focus:outline-none"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading || inputCode.trim().length < 4}
              className="w-full min-h-[50px] rounded-2xl liquid-glass-accent text-white font-black text-sm shadow-xl shadow-emerald-500/25 disabled:opacity-40 disabled:cursor-not-allowed transition flex items-center justify-center gap-2 active:scale-95"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Looking up share...</span>
                </>
              ) : (
                <>
                  <span>RECEIVE FILES</span>
                  <ArrowRight className="w-4 h-4 stroke-[2.5]" />
                </>
              )}
            </button>
          </form>

          <div className="relative my-6 text-center">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-black/10 dark:border-white/10" />
            </div>
            <span className="relative liquid-glass-card px-3 py-0.5 rounded-full text-[10px] font-bold text-slate-500 dark:text-neutral-400 uppercase">
              Or
            </span>
          </div>

          <button
            type="button"
            onClick={onOpenScanner}
            className="w-full min-h-[48px] rounded-2xl liquid-glass-button text-slate-800 dark:text-white font-bold text-xs transition flex items-center justify-center gap-2 active:scale-95 shadow-sm"
          >
            <span>Scan QR with Camera</span>
          </button>
        </RGBLightBox>
      </div>
    );
  }

  // 4. Active Share View (Found Share)
  const fileList = Object.values(share.files);
  const totalSizeBytes = fileList.reduce((sum, f) => sum + f.size, 0);

  return (
    <div className="max-w-3xl mx-auto px-4 py-6 select-none">
      
      {/* Expiry and Code Banner */}
      <div className="flex items-center justify-between pb-4 mb-6 border-b border-black/10 dark:border-white/10">
        <div>
          <span className="text-[11px] font-bold text-slate-500 dark:text-neutral-400 uppercase tracking-widest">
            Active Share Code
          </span>
          <p className="font-mono text-xl sm:text-2xl font-black text-emerald-600 dark:text-emerald-400 tracking-wider">
            {share.code}
          </p>
        </div>

        <div className="flex items-center gap-2 px-3.5 py-1.5 rounded-2xl liquid-glass-card shadow-sm">
          <Clock className="w-4 h-4 text-amber-500 dark:text-amber-400" />
          <span className="text-xs text-slate-500 dark:text-neutral-400">Expires:</span>
          <span className="font-mono text-sm font-bold text-amber-600 dark:text-amber-300">
            {formatTimeLeft(timeLeftSec)}
          </span>
        </div>
      </div>

      {/* Connection & Transfer Status Card (iOS Liquid Transparent Glass) */}
      <div className="liquid-glass-card rounded-3xl p-5 sm:p-6 mb-6 shadow-md">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-4">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-slate-700 dark:text-neutral-300 uppercase tracking-wider">
              Transfer Mode:
            </span>
            <span className="text-xs font-bold text-emerald-600 dark:text-emerald-300 flex items-center gap-1.5 font-mono">
              {share.mode === 'p2p' ? <Zap className="w-3.5 h-3.5" /> : <Cloud className="w-3.5 h-3.5" />}
              <span>{share.mode === 'p2p' ? 'WebRTC P2P Transfer' : 'Cloudinary Temporary Buffer'}</span>
            </span>
          </div>

          <span className="text-xs text-slate-600 dark:text-neutral-300 font-mono">
            {fileList.length} {fileList.length === 1 ? 'file' : 'files'} · {formatBytes(totalSizeBytes)}
          </span>
        </div>

        {/* P2P Live Status & Sci-Fi Visualizations */}
        {share.mode === 'p2p' && (
          <div className="p-4 rounded-2xl liquid-glass-input mb-4">
            <div className="flex flex-col gap-3">
              {p2pState === 'connecting' && (
                <div className="w-full space-y-3">
                  <div className="flex items-center gap-3">
                    <Loader2 className="w-5 h-5 text-emerald-500 dark:text-emerald-400 animate-spin shrink-0" />
                    <div>
                      <p className="text-sm font-bold text-emerald-600 dark:text-emerald-300">CONNECTING TO SENDER...</p>
                      <p className="text-xs text-slate-500 dark:text-neutral-400">Negotiating WebRTC offer &amp; ICE candidates.</p>
                    </div>
                  </div>

                  {/* Interactive Continuous Moving RGB Outline Radar */}
                  <div className="py-2">
                    <SciFiRadar 
                      status="connecting" 
                      code={share.code} 
                      size="md" 
                      showTelemetry={true} 
                    />
                  </div>
                </div>
              )}

              {p2pState === 'connected' && (
                <div className="w-full space-y-2">
                  <div className="flex items-center gap-3">
                    <CheckCircle2 className="w-5 h-5 text-emerald-500 dark:text-emerald-400 shrink-0" />
                    <div>
                      <p className="text-sm font-bold text-emerald-600 dark:text-emerald-300">DIRECT P2P LINK ESTABLISHED ✓</p>
                      <p className="text-xs text-slate-500 dark:text-neutral-400">Waiting for sender to stream file packets...</p>
                    </div>
                  </div>
                  <div className="py-1">
                    <SciFiRadar 
                      status="connected" 
                      code={share.code} 
                      size="sm" 
                      showTelemetry={false} 
                    />
                  </div>
                </div>
              )}

              {p2pState === 'transferring' && (
                <div className="w-full space-y-3">
                  <div className="flex items-center gap-3">
                    <Loader2 className="w-5 h-5 text-emerald-500 dark:text-emerald-400 animate-spin shrink-0" />
                    <div>
                      <p className="text-sm font-bold text-emerald-600 dark:text-emerald-300">RECEIVING QUANTUM FILE STREAM...</p>
                      <p className="text-xs text-slate-500 dark:text-neutral-400">Assembling encrypted binary arraybuffers into browser blobs.</p>
                    </div>
                  </div>

                  {/* Visual Progress Bar with Animated Quantum Packet Effect */}
                  {transferProgress && (
                    <div className="my-2">
                      <QuantumProgressBar
                        progress={transferProgress}
                        mode="receiver"
                        title="Quantum Reception Stream"
                      />
                    </div>
                  )}

                  {/* Modern Sci-Fi Holographic Data Conduit */}
                  <SciFiSharingHolostream
                    progress={transferProgress}
                    mode="receiver"
                    fileCount={fileList.length}
                    totalSize={totalSizeBytes}
                  />
                </div>
              )}

              {p2pState === 'completed' && (
                <div className="flex items-center gap-3">
                  <CheckCircle2 className="w-5 h-5 text-emerald-500 dark:text-emerald-400 shrink-0" />
                  <div>
                    <p className="text-sm font-bold text-emerald-600 dark:text-emerald-300">TRANSFER COMPLETED ✓</p>
                    <p className="text-xs text-slate-500 dark:text-neutral-400">All files received and assembled.</p>
                  </div>
                </div>
              )}

              {p2pState === 'disconnected' && (
                <div className="flex items-center gap-3">
                  <AlertTriangle className="w-5 h-5 text-rose-500 dark:text-rose-400 shrink-0" />
                  <div>
                    <p className="text-sm font-bold text-rose-600 dark:text-rose-300">SENDER DISCONNECTED</p>
                    <p className="text-xs text-slate-500 dark:text-neutral-400">The sender closed their tab or lost connectivity.</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Live Transfer Video Animation during connection or transfer */}
        {(p2pState === 'transferring' || p2pState === 'connected' || p2pState === 'connecting') && (
          <div className="mb-4 liquid-glass-panel rounded-3xl p-3 overflow-hidden shadow-md">
            <GhibliDancingDuo label="Receiving stream active · Encrypted peer transfer in progress" />
          </div>
        )}

        {/* Cloud Mode Download All button */}
        {share.mode === 'cloud' && (
          <button
            type="button"
            onClick={handleDownloadAllCloud}
            className="w-full min-h-[50px] rounded-2xl liquid-glass-accent text-white font-black text-sm shadow-xl shadow-emerald-500/25 transition flex items-center justify-center gap-2 active:scale-95"
          >
            <Download className="w-4 h-4 stroke-[2.5]" />
            <span>DOWNLOAD ALL ({fileList.length} FILES)</span>
          </button>
        )}
      </div>

      {/* Files List Card */}
      <div className="liquid-glass-card rounded-3xl p-5 sm:p-6 shadow-md">
        <h3 className="text-xs font-bold text-slate-800 dark:text-white uppercase tracking-wider pb-3 border-b border-black/10 dark:border-white/10 mb-4">
          Available Files
        </h3>

        <div className="space-y-3">
          {fileList.map((file, idx) => {
            const hasReceivedP2P = receivedFiles[file.name];

            return (
              <div
                key={file.id || idx}
                className="flex items-center justify-between gap-3 p-3.5 rounded-2xl liquid-glass-input"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div className="p-2.5 rounded-xl liquid-glass-button shrink-0">
                    {getFileIcon(file)}
                  </div>
                  <div className="truncate">
                    <p className="font-semibold text-slate-900 dark:text-white text-xs sm:text-sm truncate">
                      {file.name}
                    </p>
                    <p className="text-[11px] text-slate-500 dark:text-neutral-400 font-mono">
                      {formatBytes(file.size)} · {file.mimeType || 'Binary / Raw'}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  {/* P2P Video/Image Play & Preview */}
                  {hasReceivedP2P && (getFileCategory(file.mimeType, file.name) === 'video' || getFileCategory(file.mimeType, file.name) === 'image') && (
                    <button
                      type="button"
                      onClick={() => {
                        triggerHaptic('selection');
                        setActiveMediaPreview({
                          url: hasReceivedP2P.url,
                          name: file.name,
                          type: getFileCategory(file.mimeType, file.name) === 'video' ? 'video' : 'image',
                        });
                      }}
                      className="min-h-[44px] flex items-center gap-1.5 px-3 py-2 rounded-xl liquid-glass-button text-purple-600 dark:text-purple-300 text-xs font-bold hover:bg-purple-500/15 transition shadow-sm"
                    >
                      {getFileCategory(file.mimeType, file.name) === 'video' ? (
                        <>
                          <Play className="w-3.5 h-3.5 fill-current" />
                          <span>Play Video</span>
                        </>
                      ) : (
                        <>
                          <Eye className="w-3.5 h-3.5" />
                          <span>Preview</span>
                        </>
                      )}
                    </button>
                  )}

                  {/* Cloud Mode Stream or Download */}
                  {share.mode === 'cloud' ? (
                    <div className="flex items-center gap-1.5">
                      {file.secureUrl && (getFileCategory(file.mimeType, file.name) === 'video' || getFileCategory(file.mimeType, file.name) === 'image') && (
                        <button
                          type="button"
                          onClick={() => {
                            triggerHaptic('selection');
                            setActiveMediaPreview({
                              url: file.secureUrl!,
                              name: file.name,
                              type: getFileCategory(file.mimeType, file.name) === 'video' ? 'video' : 'image',
                            });
                          }}
                          className="min-h-[44px] flex items-center gap-1.5 px-3 py-2 rounded-xl liquid-glass-button text-purple-600 dark:text-purple-300 text-xs font-bold shadow-sm"
                        >
                          <Play className="w-3.5 h-3.5 fill-current" />
                          <span>Play</span>
                        </button>
                      )}
                      <button
                        type="button"
                        onClick={() => handleDownloadCloudFile(file)}
                        className="min-h-[44px] flex items-center gap-1.5 px-3.5 py-2 rounded-xl liquid-glass-button text-slate-800 dark:text-neutral-200 text-xs font-semibold hover:text-slate-950 dark:hover:text-white shadow-sm"
                      >
                        <Download className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                        <span>Download</span>
                      </button>
                    </div>
                  ) : hasReceivedP2P ? (
                    <button
                      type="button"
                      onClick={() => triggerBrowserDownload(hasReceivedP2P.url, file.name)}
                      className="min-h-[44px] flex items-center gap-1.5 px-3.5 py-2 rounded-xl liquid-glass-accent text-white text-xs font-bold shadow-md"
                    >
                      <FileCheck2 className="w-3.5 h-3.5" />
                      <span>Save File</span>
                    </button>
                  ) : (
                    <div className="flex items-center gap-1 text-[11px] font-mono text-emerald-600 dark:text-emerald-400">
                      <span>Waiting for P2P chunk stream...</span>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Interactive Video Playback & Media Lightbox Modal */}
      {activeMediaPreview && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in"
          onClick={() => setActiveMediaPreview(null)}
        >
          <div 
            className="relative w-full max-w-3xl liquid-glass-card rounded-3xl p-4 sm:p-6 overflow-hidden shadow-2xl border border-white/20"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="flex items-center justify-between pb-3 mb-3 border-b border-black/10 dark:border-white/10">
              <div className="truncate pr-2">
                <span className="text-[10px] font-mono font-bold tracking-widest uppercase text-emerald-600 dark:text-emerald-400 block">
                  {activeMediaPreview.type === 'video' ? '4K Video Playback Stream' : 'High-Res Image Preview'}
                </span>
                <p className="font-bold text-sm text-slate-900 dark:text-white truncate">
                  {activeMediaPreview.name}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setActiveMediaPreview(null)}
                className="min-h-[40px] min-w-[40px] rounded-xl liquid-glass-button text-slate-500 hover:text-slate-900 dark:hover:text-white flex items-center justify-center shrink-0"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Media Content */}
            <div className="relative rounded-2xl overflow-hidden bg-black flex items-center justify-center min-h-[220px] max-h-[70vh]">
              {activeMediaPreview.type === 'video' ? (
                <video
                  src={activeMediaPreview.url}
                  controls
                  autoPlay
                  playsInline
                  preload="auto"
                  className="w-full max-h-[70vh] rounded-2xl object-contain"
                >
                  Your browser does not support video playback.
                </video>
              ) : (
                <img
                  src={activeMediaPreview.url}
                  alt={activeMediaPreview.name}
                  className="w-full max-h-[70vh] rounded-2xl object-contain"
                />
              )}
            </div>

            {/* Modal Footer Controls */}
            <div className="flex items-center justify-between gap-3 mt-4 pt-3 border-t border-black/10 dark:border-white/10">
              <span className="text-xs text-slate-500 dark:text-neutral-400 font-mono">
                Decrypted ArrayBuffer Blob
              </span>
              <button
                type="button"
                onClick={() => {
                  triggerBrowserDownload(activeMediaPreview.url, activeMediaPreview.name);
                  showToast(`Downloaded ${activeMediaPreview.name} ✓`, 'success');
                }}
                className="min-h-[44px] px-5 py-2 rounded-xl liquid-glass-accent text-white text-xs font-black flex items-center gap-2 shadow-md active:scale-95 transition"
              >
                <Download className="w-4 h-4 stroke-[2.5]" />
                <span>Save to Device</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Full Screen Celebratory Success Modal */}
      <FullScreenSuccessModal
        isOpen={showFullScreenSuccess}
        files={fileList}
        onClose={() => setShowFullScreenSuccess(false)}
        onGoHome={() => onNavigate('landing')}
      />

      {/* High-Quality Sci-Fi Connected Device Celebration Sequence */}
      <SciFiConnectedCelebration
        isOpen={showConnectedCelebration}
        onDismiss={() => setShowConnectedCelebration(false)}
        deviceName="Sender Host Device"
        shareCode={share.code}
      />

    </div>
  );
};

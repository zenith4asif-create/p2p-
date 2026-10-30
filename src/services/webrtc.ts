import { ref, set, onValue, off, push } from 'firebase/database';
import { db } from './firebase.ts';
import { TransferProgress } from '../types.ts';

// Public STUN servers for reliable peer connection
const RTC_CONFIG: RTCConfiguration = {
  iceServers: [
    { urls: 'stun:stun.l.google.com:19302' },
    { urls: 'stun:stun1.l.google.com:19302' },
    { urls: 'stun:stun2.l.google.com:19302' },
    { urls: 'stun:stun3.l.google.com:19302' },
    { urls: 'stun:stun4.l.google.com:19302' },
  ],
};

const CHUNK_SIZE = 16384; // 16 KB standard safe buffer chunk
const BUFFER_HIGH_WATERMARK = 262144; // 256 KB pause threshold
const BUFFER_LOW_WATERMARK = 65536; // 64 KB resume threshold

export type WebRTCConnectionState = 
  | 'idle' 
  | 'waiting' 
  | 'connecting' 
  | 'connected' 
  | 'transferring' 
  | 'completed' 
  | 'disconnected' 
  | 'failed'
  | 'expired';

export interface WebRTCEvents {
  onStateChange?: (state: WebRTCConnectionState, detail?: string) => void;
  onProgress?: (progress: TransferProgress) => void;
  onFileReceived?: (file: { id: string; name: string; size: number; mimeType: string; blob: Blob; url: string }) => void;
  onError?: (error: Error) => void;
}

export function resolveMimeType(mimeType: string, fileName: string): string {
  const cleanMime = (mimeType || '').trim().toLowerCase();
  const lowerName = fileName.toLowerCase();

  // If MIME is specifically quicktime or m4v, convert to video/mp4 for universal cross-browser HTML5 playback
  if (cleanMime === 'video/quicktime' || cleanMime === 'video/x-m4v') {
    return 'video/mp4';
  }

  // If valid media mime type already present, use it
  if (cleanMime && cleanMime !== 'application/octet-stream' && cleanMime !== 'binary/octet-stream') {
    return cleanMime;
  }

  // Infer from file extension
  const ext = lowerName.split('.').pop() || '';
  switch (ext) {
    case 'mp4':
    case 'm4v':
    case 'mov':
      return 'video/mp4';
    case 'webm':
      return 'video/webm';
    case 'ogv':
    case 'ogg':
      return 'video/ogg';
    case 'mkv':
    case 'avi':
    case 'wmv':
    case '3gp':
      return 'video/mp4';
    case 'jpg':
    case 'jpeg':
      return 'image/jpeg';
    case 'png':
      return 'image/png';
    case 'gif':
      return 'image/gif';
    case 'webp':
      return 'image/webp';
    case 'svg':
      return 'image/svg+xml';
    case 'mp3':
      return 'audio/mpeg';
    case 'wav':
      return 'audio/wav';
    case 'm4a':
    case 'aac':
      return 'audio/aac';
    case 'pdf':
      return 'application/pdf';
    case 'zip':
      return 'application/zip';
    default:
      return cleanMime || 'application/octet-stream';
  }
}

/**
 * Sender WebRTC peer instance
 */
export class SenderPeer {
  private peerConnection: RTCPeerConnection | null = null;
  private dataChannel: RTCDataChannel | null = null;
  private signalingListeners: Array<() => void> = [];
  private state: WebRTCConnectionState = 'idle';
  private events: WebRTCEvents;
  private isDestroyed = false;

  constructor(
    private sessionId: string,
    events: WebRTCEvents = {}
  ) {
    this.events = events;
  }

  private updateState(newState: WebRTCConnectionState, detail?: string) {
    this.state = newState;
    this.events.onStateChange?.(newState, detail);
  }

  public async initialize(): Promise<void> {
    try {
      this.updateState('waiting', 'Creating peer session and waiting for receiver');
      this.peerConnection = new RTCPeerConnection(RTC_CONFIG);

      // Create RTCDataChannel with binaryType arraybuffer
      this.dataChannel = this.peerConnection.createDataChannel('shareflow-transfer', {
        ordered: true,
      });
      this.dataChannel.binaryType = 'arraybuffer';
      this.dataChannel.bufferedAmountLowThreshold = BUFFER_LOW_WATERMARK;

      this.setupDataChannelEvents();
      this.setupPeerConnectionEvents();

      // Collect ICE candidates and push to signaling
      this.peerConnection.onicecandidate = (event) => {
        if (event.candidate && !this.isDestroyed) {
          const candRef = push(ref(db, `signaling/${this.sessionId}/senderCandidates`));
          set(candRef, event.candidate.toJSON());
        }
      };

      // Create Offer
      const offer = await this.peerConnection.createOffer();
      await this.peerConnection.setLocalDescription(offer);

      // Save Offer in RTDB
      await set(ref(db, `signaling/${this.sessionId}/offer`), {
        type: offer.type,
        sdp: offer.sdp,
        createdAt: Date.now(),
      });

      // Listen for receiver Answer
      const answerRef = ref(db, `signaling/${this.sessionId}/answer`);
      const answerListener = onValue(answerRef, async (snap) => {
        if (snap.exists() && this.peerConnection && !this.peerConnection.currentRemoteDescription) {
          const answerData = snap.val();
          this.updateState('connecting', 'Receiver joined! Negotiating connection');
          try {
            await this.peerConnection.setRemoteDescription(
              new RTCSessionDescription({ type: answerData.type, sdp: answerData.sdp })
            );
          } catch (err) {
            console.error('Failed setting remote description on sender:', err);
          }
        }
      });
      this.signalingListeners.push(() => off(answerRef, 'value', answerListener));

      // Listen for receiver ICE candidates
      const recCandRef = ref(db, `signaling/${this.sessionId}/receiverCandidates`);
      const recCandListener = onValue(recCandRef, (snap) => {
        if (snap.exists() && this.peerConnection) {
          const candidates = snap.val();
          Object.values(candidates).forEach((cand: any) => {
            try {
              this.peerConnection?.addIceCandidate(new RTCIceCandidate(cand));
            } catch (e) {
              console.warn('ICE candidate addition issue:', e);
            }
          });
        }
      });
      this.signalingListeners.push(() => off(recCandRef, 'value', recCandListener));

    } catch (err) {
      this.updateState('failed', (err as Error).message);
      this.events.onError?.(err as Error);
    }
  }

  private setupDataChannelEvents() {
    if (!this.dataChannel) return;

    this.dataChannel.onopen = () => {
      this.updateState('connected', 'P2P DataChannel open and ready for files');
    };

    this.dataChannel.onclose = () => {
      if (!this.isDestroyed) {
        this.updateState('disconnected', 'Receiver disconnected');
      }
    };

    this.dataChannel.onerror = (err) => {
      console.error('Sender DataChannel error:', err);
      this.updateState('failed', 'DataChannel error encountered');
    };
  }

  private setupPeerConnectionEvents() {
    if (!this.peerConnection) return;

    this.peerConnection.onconnectionstatechange = () => {
      const connState = this.peerConnection?.connectionState;
      if (connState === 'connected') {
        this.updateState('connected', 'Direct P2P Link Established');
      } else if (connState === 'disconnected') {
        this.updateState('disconnected', 'Receiver connection lost');
      } else if (connState === 'failed') {
        this.updateState('failed', 'P2P connection failed. Fallback available');
      }
    };
  }

  /**
   * Transfers a list of files sequentially over RTCDataChannel with backpressure
   */
  public async sendFiles(files: File[]): Promise<void> {
    if (!this.dataChannel || this.dataChannel.readyState !== 'open') {
      throw new Error('WebRTC DataChannel is not connected');
    }

    this.updateState('transferring', 'Starting file transfer...');

    const totalBytesAll = files.reduce((sum, f) => sum + f.size, 0);
    let cumulativeBytesTransferred = 0;
    const overallStartTime = performance.now();

    for (let i = 0; i < files.length; i++) {
      if (this.isDestroyed) break;
      const file = files[i];
      const totalChunks = Math.ceil(file.size / CHUNK_SIZE);
      const resolvedMime = resolveMimeType(file.type, file.name);

      // Send File Start metadata with precise resolved mimeType
      this.dataChannel.send(JSON.stringify({
        type: 'FILE_START',
        fileId: `file_${i}_${file.name}`,
        name: file.name,
        size: file.size,
        mimeType: resolvedMime,
        totalChunks
      }));

      let offset = 0;
      let chunkIndex = 0;
      let lastReportTime = performance.now();

      while (offset < file.size && !this.isDestroyed) {
        // Backpressure control: wait if buffer exceeds high watermark with timeout fallback
        if (this.dataChannel.bufferedAmount > BUFFER_HIGH_WATERMARK) {
          await new Promise<void>((resolve) => {
            let resolved = false;
            const timer = setTimeout(() => {
              if (!resolved) {
                resolved = true;
                this.dataChannel?.removeEventListener('bufferedamountlow', onLow);
                resolve();
              }
            }, 60);

            const onLow = () => {
              if (!resolved) {
                resolved = true;
                clearTimeout(timer);
                this.dataChannel?.removeEventListener('bufferedamountlow', onLow);
                resolve();
              }
            };
            this.dataChannel?.addEventListener('bufferedamountlow', onLow);

            if (this.dataChannel && this.dataChannel.bufferedAmount <= BUFFER_LOW_WATERMARK) {
              onLow();
            }
          });
        }

        const slice = file.slice(offset, offset + CHUNK_SIZE);
        const buffer = await slice.arrayBuffer();
        this.dataChannel.send(buffer);

        offset += buffer.byteLength;
        cumulativeBytesTransferred += buffer.byteLength;
        chunkIndex++;

        // Report progress every 80ms or on file completion
        const now = performance.now();
        if (now - lastReportTime > 80 || offset >= file.size) {
          const elapsedSec = (now - overallStartTime) / 1000;
          const currentSpeed = elapsedSec > 0 ? cumulativeBytesTransferred / elapsedSec : 0;
          const remainingBytes = Math.max(0, totalBytesAll - cumulativeBytesTransferred);
          const eta = currentSpeed > 0 ? Math.ceil(remainingBytes / currentSpeed) : 0;

          this.events.onProgress?.({
            fileId: `file_${i}`,
            fileName: file.name,
            fileIndex: i + 1,
            totalFiles: files.length,
            bytesTransferred: cumulativeBytesTransferred,
            totalBytes: totalBytesAll,
            percent: Math.min(100, Math.round((cumulativeBytesTransferred / totalBytesAll) * 100)),
            speedBytesPerSec: currentSpeed,
            etaSeconds: eta,
            status: offset >= file.size ? 'completed' : 'active'
          });

          lastReportTime = now;
        }
      }

      // Ensure all queued binary chunks are drained out of the network stack before sending FILE_END
      while (this.dataChannel && this.dataChannel.bufferedAmount > 0 && !this.isDestroyed) {
        await new Promise((r) => setTimeout(r, 20));
      }

      // Send File End signal with verified sizes
      this.dataChannel.send(JSON.stringify({
        type: 'FILE_END',
        fileId: `file_${i}_${file.name}`,
        size: file.size,
        mimeType: resolvedMime
      }));

      // Short pacing delay between files for receiver GC stability
      await new Promise((r) => setTimeout(r, 80));
    }

    this.updateState('completed', 'All files transferred successfully');
  }

  public destroy(): void {
    this.isDestroyed = true;
    this.signalingListeners.forEach((cleanup) => cleanup());
    this.signalingListeners = [];

    if (this.dataChannel) {
      try { this.dataChannel.close(); } catch (_) {}
      this.dataChannel = null;
    }

    if (this.peerConnection) {
      try { this.peerConnection.close(); } catch (_) {}
      this.peerConnection = null;
    }

    this.updateState('idle');
  }
}

/**
 * Receiver WebRTC peer instance
 */
export class ReceiverPeer {
  private peerConnection: RTCPeerConnection | null = null;
  private dataChannel: RTCDataChannel | null = null;
  private signalingListeners: Array<() => void> = [];
  private state: WebRTCConnectionState = 'idle';
  private events: WebRTCEvents;
  private isDestroyed = false;

  // Receiving state buffers
  private currentFileMeta: {
    fileId: string;
    name: string;
    size: number;
    mimeType: string;
    totalChunks: number;
  } | null = null;
  private receivedChunks: ArrayBuffer[] = [];
  private currentBytesReceived = 0;
  private totalCumulativeReceived = 0;
  private transferStartTime = 0;

  constructor(
    private sessionId: string,
    events: WebRTCEvents = {}
  ) {
    this.events = events;
  }

  private updateState(newState: WebRTCConnectionState, detail?: string) {
    this.state = newState;
    this.events.onStateChange?.(newState, detail);
  }

  public async connect(): Promise<void> {
    try {
      this.updateState('connecting', 'Connecting to sender...');
      this.peerConnection = new RTCPeerConnection(RTC_CONFIG);

      // When sender creates DataChannel, receiver gets ondatachannel
      this.peerConnection.ondatachannel = (event) => {
        this.dataChannel = event.channel;
        this.dataChannel.binaryType = 'arraybuffer';
        this.setupDataChannel();
      };

      this.setupPeerConnectionEvents();

      // Collect ICE candidates and push to signaling
      this.peerConnection.onicecandidate = (event) => {
        if (event.candidate && !this.isDestroyed) {
          const candRef = push(ref(db, `signaling/${this.sessionId}/receiverCandidates`));
          set(candRef, event.candidate.toJSON());
        }
      };

      // Listen for Offer in RTDB
      const offerRef = ref(db, `signaling/${this.sessionId}/offer`);
      const offerListener = onValue(offerRef, async (snap) => {
        if (snap.exists() && this.peerConnection && !this.peerConnection.currentRemoteDescription) {
          const offerData = snap.val();
          try {
            await this.peerConnection.setRemoteDescription(
              new RTCSessionDescription({ type: offerData.type, sdp: offerData.sdp })
            );

            // Create Answer
            const answer = await this.peerConnection.createAnswer();
            await this.peerConnection.setLocalDescription(answer);

            // Write Answer to RTDB
            await set(ref(db, `signaling/${this.sessionId}/answer`), {
              type: answer.type,
              sdp: answer.sdp,
              createdAt: Date.now()
            });
          } catch (err) {
            console.error('Error creating WebRTC answer:', err);
          }
        }
      });
      this.signalingListeners.push(() => off(offerRef, 'value', offerListener));

      // Listen for Sender ICE candidates
      const senderCandRef = ref(db, `signaling/${this.sessionId}/senderCandidates`);
      const senderCandListener = onValue(senderCandRef, (snap) => {
        if (snap.exists() && this.peerConnection) {
          const candidates = snap.val();
          Object.values(candidates).forEach((cand: any) => {
            try {
              this.peerConnection?.addIceCandidate(new RTCIceCandidate(cand));
            } catch (e) {
              console.warn('ICE candidate addition notice:', e);
            }
          });
        }
      });
      this.signalingListeners.push(() => off(senderCandRef, 'value', senderCandListener));

    } catch (err) {
      this.updateState('failed', (err as Error).message);
      this.events.onError?.(err as Error);
    }
  }

  private setupDataChannel() {
    if (!this.dataChannel) return;

    this.dataChannel.onopen = () => {
      this.updateState('connected', 'Direct P2P Link Established ✓');
    };

    this.dataChannel.onclose = () => {
      if (!this.isDestroyed) {
        this.updateState('disconnected', 'Sender disconnected');
      }
    };

    this.dataChannel.onerror = (err) => {
      console.error('Receiver DataChannel error:', err);
      this.updateState('failed', 'DataChannel error encountered');
    };

    this.dataChannel.onmessage = (event) => {
      this.handleIncomingMessage(event.data);
    };
  }

  private setupPeerConnectionEvents() {
    if (!this.peerConnection) return;

    this.peerConnection.onconnectionstatechange = () => {
      const connState = this.peerConnection?.connectionState;
      if (connState === 'connected') {
        this.updateState('connected', 'Direct P2P Link Established');
      } else if (connState === 'disconnected') {
        this.updateState('disconnected', 'Sender disconnected');
      } else if (connState === 'failed') {
        this.updateState('failed', 'P2P Connection Failed');
      }
    };
  }

  private handleIncomingMessage(data: string | ArrayBuffer) {
    if (typeof data === 'string') {
      try {
        const msg = JSON.parse(data);
        if (msg.type === 'FILE_START') {
          const resolvedMime = resolveMimeType(msg.mimeType, msg.name);
          this.currentFileMeta = {
            fileId: msg.fileId,
            name: msg.name,
            size: msg.size,
            mimeType: resolvedMime,
            totalChunks: msg.totalChunks,
          };
          this.receivedChunks = [];
          this.currentBytesReceived = 0;
          if (this.transferStartTime === 0) {
            this.transferStartTime = performance.now();
          }
          this.updateState('transferring', `Receiving ${msg.name}...`);
        } else if (msg.type === 'FILE_END') {
          // File completed, assemble Blob with verified MIME type
          if (this.currentFileMeta) {
            const finalMime = resolveMimeType(msg.mimeType || this.currentFileMeta.mimeType, this.currentFileMeta.name);
            const blob = new Blob(this.receivedChunks, { type: finalMime });
            const objectUrl = URL.createObjectURL(blob);

            this.events.onFileReceived?.({
              id: this.currentFileMeta.fileId,
              name: this.currentFileMeta.name,
              size: this.currentBytesReceived || this.currentFileMeta.size,
              mimeType: finalMime,
              blob,
              url: objectUrl
            });

            this.currentFileMeta = null;
            this.receivedChunks = [];
          }
        }
      } catch (err) {
        console.error('Failed to parse text message on dataChannel:', err);
      }
    } else if (data instanceof ArrayBuffer) {
      // Binary chunk received
      this.receivedChunks.push(data);
      this.currentBytesReceived += data.byteLength;
      this.totalCumulativeReceived += data.byteLength;

      if (this.currentFileMeta) {
        const now = performance.now();
        const elapsedSec = (now - this.transferStartTime) / 1000;
        const speed = elapsedSec > 0 ? this.totalCumulativeReceived / elapsedSec : 0;
        const remainingBytes = Math.max(0, this.currentFileMeta.size - this.currentBytesReceived);
        const eta = speed > 0 ? Math.ceil(remainingBytes / speed) : 0;

        this.events.onProgress?.({
          fileId: this.currentFileMeta.fileId,
          fileName: this.currentFileMeta.name,
          fileIndex: 1,
          totalFiles: 1,
          bytesTransferred: this.currentBytesReceived,
          totalBytes: this.currentFileMeta.size,
          percent: Math.min(100, Math.round((this.currentBytesReceived / this.currentFileMeta.size) * 100)),
          speedBytesPerSec: speed,
          etaSeconds: eta,
          status: this.currentBytesReceived >= this.currentFileMeta.size ? 'completed' : 'active'
        });
      }
    }
  }

  public destroy(): void {
    this.isDestroyed = true;
    this.signalingListeners.forEach((cleanup) => cleanup());
    this.signalingListeners = [];

    if (this.dataChannel) {
      try { this.dataChannel.close(); } catch (_) {}
      this.dataChannel = null;
    }

    if (this.peerConnection) {
      try { this.peerConnection.close(); } catch (_) {}
      this.peerConnection = null;
    }

    this.updateState('idle');
  }
}

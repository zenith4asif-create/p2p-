/**
 * ShareFlow Haptics & Sci-Fi Synthesizer Audio Engine
 * Provides physical tactile vibration via navigator.vibrate
 * and synthesized futuristic Web Audio soundscapes.
 */

export type HapticType = 
  | 'tap'
  | 'selection'
  | 'success'
  | 'connect'
  | 'beam'
  | 'quantum_lock'
  | 'warning'
  | 'error';

export type SciFiSoundType = 
  | 'radar_ping'
  | 'quantum_lock'
  | 'data_beam'
  | 'tap_click'
  | 'device_connected'
  | 'success_fanfare';

// Haptic vibration patterns in milliseconds [vibrate, pause, vibrate, ...]
const HAPTIC_PATTERNS: Record<HapticType, number | number[]> = {
  tap: 12,
  selection: [18, 30, 20],
  success: [25, 40, 30, 50, 70],
  connect: [40, 50, 60, 40, 90, 50, 110],
  beam: [15, 20, 15, 20, 25, 30, 40],
  quantum_lock: [30, 40, 40, 30, 60, 40, 80],
  warning: [50, 40, 50, 40, 60],
  error: [70, 50, 90, 60, 120],
};

/**
 * Triggers physical vibration haptics on supported mobile devices
 */
export function triggerHaptic(type: HapticType = 'tap'): boolean {
  try {
    if (typeof window !== 'undefined' && 'navigator' in window && 'vibrate' in navigator) {
      const pattern = HAPTIC_PATTERNS[type] ?? 15;
      return window.navigator.vibrate(pattern);
    }
  } catch (err) {
    // Vibration silently ignored on devices or permissions that block it
  }
  return false;
}

// Sound state cache
let audioCtx: AudioContext | null = null;
let soundEnabled = true;

if (typeof window !== 'undefined') {
  const saved = localStorage.getItem('shareflow_sound_enabled');
  if (saved !== null) {
    soundEnabled = saved === 'true';
  }
}

export function isSoundEnabled(): boolean {
  return soundEnabled;
}

export function setSoundEnabled(enabled: boolean): void {
  soundEnabled = enabled;
  if (typeof window !== 'undefined') {
    localStorage.setItem('shareflow_sound_enabled', enabled ? 'true' : 'false');
  }
}

function getAudioContext(): AudioContext | null {
  try {
    if (!audioCtx && typeof window !== 'undefined') {
      const AudioCtxClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (AudioCtxClass) {
        audioCtx = new AudioCtxClass();
      }
    }
    if (audioCtx && audioCtx.state === 'suspended') {
      audioCtx.resume().catch(() => {});
    }
    return audioCtx;
  } catch {
    return null;
  }
}

/**
 * Synthesizes futuristic sci-fi sound effects using native Web Audio API oscillators
 */
export function playSciFiSound(type: SciFiSoundType): void {
  if (!soundEnabled) return;
  const ctx = getAudioContext();
  if (!ctx) return;

  try {
    const now = ctx.currentTime;

    switch (type) {
      case 'tap_click': {
        // User requested: Remove sound on tap only vibrate
        return;
      }

      case 'radar_ping': {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(880, now);
        osc.frequency.exponentialRampToValueAtTime(1760, now + 0.12);
        osc.frequency.exponentialRampToValueAtTime(880, now + 0.35);
        gain.gain.setValueAtTime(0.07, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.4);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(now);
        osc.stop(now + 0.4);
        break;
      }

      case 'device_connected': {
        // Futuristic dual arpeggio quantum lock sound
        const notes = [523.25, 659.25, 783.99, 1046.50, 1318.51];
        notes.forEach((freq, idx) => {
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          const noteStart = now + idx * 0.06;
          osc.type = idx % 2 === 0 ? 'sine' : 'triangle';
          osc.frequency.setValueAtTime(freq, noteStart);
          osc.frequency.exponentialRampToValueAtTime(freq * 1.02, noteStart + 0.18);
          gain.gain.setValueAtTime(0.08, noteStart);
          gain.gain.exponentialRampToValueAtTime(0.001, noteStart + 0.22);
          osc.connect(gain);
          gain.connect(ctx.destination);
          osc.start(noteStart);
          osc.stop(noteStart + 0.25);
        });
        break;
      }

      case 'quantum_lock': {
        const osc = ctx.createOscillator();
        const sub = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sawtooth';
        sub.type = 'sine';
        osc.frequency.setValueAtTime(300, now);
        osc.frequency.exponentialRampToValueAtTime(900, now + 0.15);
        sub.frequency.setValueAtTime(150, now);
        sub.frequency.exponentialRampToValueAtTime(450, now + 0.15);
        gain.gain.setValueAtTime(0.05, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.25);
        osc.connect(gain);
        sub.connect(gain);
        gain.connect(ctx.destination);
        osc.start(now);
        sub.start(now);
        osc.stop(now + 0.25);
        sub.stop(now + 0.25);
        break;
      }

      case 'data_beam': {
        // Continuous data packet laser pulse
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(600, now);
        osc.frequency.linearRampToValueAtTime(1400, now + 0.08);
        gain.gain.setValueAtTime(0.04, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.1);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(now);
        osc.stop(now + 0.1);
        break;
      }

      case 'success_fanfare': {
        const chord = [523.25, 659.25, 783.99, 1046.50, 1567.98];
        chord.forEach((freq, idx) => {
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          const noteStart = now + idx * 0.07;
          osc.type = 'sine';
          osc.frequency.setValueAtTime(freq, noteStart);
          gain.gain.setValueAtTime(0.09, noteStart);
          gain.gain.exponentialRampToValueAtTime(0.001, noteStart + 0.45);
          osc.connect(gain);
          gain.connect(ctx.destination);
          osc.start(noteStart);
          osc.stop(noteStart + 0.5);
        });
        break;
      }
    }
  } catch (err) {
    // Audio context may be restricted or blocked
  }
}

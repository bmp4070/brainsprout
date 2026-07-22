/**
 * Zero-asset WebAudio sound effects for kid-friendly game feedback.
 * Everything is synthesized with oscillators; nothing is loaded from disk.
 * All exported functions are safe no-ops when AudioContext is unavailable
 * (e.g. very old browsers, some test/JSDOM environments) or muted.
 */

const MUTE_KEY = 'riddler:muted';

let audioContext: AudioContext | null = null;
let mutedCache: boolean | null = null;

function getAudioContext(): AudioContext | null {
  if (audioContext) return audioContext;
  try {
    audioContext = new AudioContext();
    return audioContext;
  } catch {
    return null;
  }
}

/** Whether sound effects are muted, persisted to localStorage. */
export function isMuted(): boolean {
  if (mutedCache !== null) return mutedCache;
  try {
    mutedCache = localStorage.getItem(MUTE_KEY) === '1';
  } catch {
    mutedCache = false;
  }
  return mutedCache;
}

/** Sets the muted flag and persists it to localStorage (best-effort). */
export function setMuted(muted: boolean): void {
  mutedCache = muted;
  try {
    localStorage.setItem(MUTE_KEY, muted ? '1' : '0');
  } catch {
    // Ignore storage failures; in-memory cache still reflects the choice.
  }
}

/**
 * Call on the first user gesture (pointerdown/click) to satisfy iOS/Safari's
 * requirement that AudioContext be resumed from within a user gesture.
 */
export function ensureAudioReady(): void {
  const ctx = getAudioContext();
  if (!ctx) return;
  if (ctx.state === 'suspended') {
    void ctx.resume().catch(() => {
      // Ignore resume failures; playback will simply no-op.
    });
  }
}

function playTone(
  freqStart: number,
  freqEnd: number,
  durationMs: number,
  type: OscillatorType,
  gainPeak: number,
  startDelayMs = 0,
): void {
  if (isMuted()) return;
  const ctx = getAudioContext();
  if (!ctx) return;
  try {
    const startTime = ctx.currentTime + startDelayMs / 1000;
    const duration = durationMs / 1000;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(freqStart, startTime);
    if (freqEnd !== freqStart) {
      osc.frequency.linearRampToValueAtTime(freqEnd, startTime + duration);
    }
    gain.gain.setValueAtTime(0, startTime);
    gain.gain.linearRampToValueAtTime(
      gainPeak,
      startTime + Math.min(0.01, duration / 4),
    );
    gain.gain.linearRampToValueAtTime(0.0001, startTime + duration);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(startTime);
    osc.stop(startTime + duration + 0.05);
  } catch {
    // Ignore any playback errors (e.g. context closed mid-flight).
  }
}

/** 30ms sine blip, ~600Hz rising slightly as the selection grows. */
export function playTick(step: number): void {
  const freq = 600 + Math.min(Math.max(step, 0), 20) * 8;
  playTone(freq, freq, 30, 'sine', 0.2);
}

/** Ascending triangle arpeggio C5-E5-G5, ~80ms each note, for a found word. */
export function playFound(): void {
  const notes = [523.25, 659.25, 783.99]; // C5, E5, G5
  notes.forEach((freq, i) => {
    playTone(freq, freq, 80, 'triangle', 0.25, i * 80);
  });
}

/** Short low sweep 200Hz -> 150Hz for an incorrect selection. */
export function playWrong(): void {
  playTone(200, 150, 150, 'sawtooth', 0.18);
}

/** Major-scale run followed by a bright chord for winning the puzzle. */
export function playFanfare(): void {
  const scale = [523.25, 587.33, 659.25, 698.46, 783.99]; // C D E F G
  scale.forEach((freq, i) => {
    playTone(freq, freq, 90, 'triangle', 0.25, i * 90);
  });
  const chordDelay = scale.length * 90;
  const chord = [523.25, 659.25, 783.99, 1046.5]; // C5 E5 G5 C6
  chord.forEach((freq) => {
    playTone(freq, freq, 550, 'triangle', 0.2, chordDelay);
  });
}

/** Short deep drum thump (~120Hz triangle, fast punchy envelope) for a row beat. */
export function playDrum(): void {
  if (isMuted()) return;
  const ctx = getAudioContext();
  if (!ctx) return;
  try {
    const startTime = ctx.currentTime;
    const duration = 0.12;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(130, startTime);
    osc.frequency.exponentialRampToValueAtTime(70, startTime + duration);
    gain.gain.setValueAtTime(0, startTime);
    gain.gain.linearRampToValueAtTime(0.35, startTime + 0.008);
    gain.gain.exponentialRampToValueAtTime(0.0001, startTime + duration);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(startTime);
    osc.stop(startTime + duration + 0.05);
  } catch {
    // Ignore any playback errors (e.g. context closed mid-flight).
  }
}

/** Short downward-pitch "womp" for a rowing-timing mistake. */
export function playSlip(): void {
  playTone(260, 110, 220, 'sawtooth', 0.2);
}

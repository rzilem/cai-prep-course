// =============================================
// CAI Prep Course — Synthesized Sound Effects
// Web Audio API — zero file downloads
// =============================================

let audioCtx: AudioContext | null = null

function ctx(): AudioContext {
  if (!audioCtx) {
    audioCtx = new (window.AudioContext ||
      (window as unknown as { webkitAudioContext: typeof AudioContext })
        .webkitAudioContext)()
  }
  if (audioCtx.state === 'suspended') {
    audioCtx.resume()
  }
  return audioCtx
}

function tone(
  frequency: number,
  type: OscillatorType,
  duration: number,
  volume = 0.3,
  delay = 0,
  attack = 0.02,
  freqEnd?: number
) {
  const c = ctx()
  const now = c.currentTime + delay
  const osc = c.createOscillator()
  const gain = c.createGain()
  osc.type = type
  osc.frequency.setValueAtTime(frequency, now)
  if (freqEnd) osc.frequency.linearRampToValueAtTime(freqEnd, now + duration)
  gain.gain.setValueAtTime(0, now)
  gain.gain.linearRampToValueAtTime(volume, now + attack)
  gain.gain.exponentialRampToValueAtTime(0.001, now + duration)
  osc.connect(gain).connect(c.destination)
  osc.start(now)
  osc.stop(now + duration + 0.01)
}

function noise(
  duration: number,
  volume = 0.1,
  delay = 0,
  bandpass?: { freq: number; Q: number }
) {
  const c = ctx()
  const now = c.currentTime + delay
  const bufferSize = Math.floor(c.sampleRate * duration)
  const buffer = c.createBuffer(1, bufferSize, c.sampleRate)
  const data = buffer.getChannelData(0)
  for (let i = 0; i < bufferSize; i++) data[i] = Math.random() * 2 - 1

  const source = c.createBufferSource()
  source.buffer = buffer
  const gain = c.createGain()
  gain.gain.setValueAtTime(volume, now)
  gain.gain.exponentialRampToValueAtTime(0.001, now + duration)

  if (bandpass) {
    const filter = c.createBiquadFilter()
    filter.type = 'bandpass'
    filter.frequency.value = bandpass.freq
    filter.Q.value = bandpass.Q
    source.connect(filter).connect(gain).connect(c.destination)
  } else {
    source.connect(gain).connect(c.destination)
  }
  source.start(now)
  source.stop(now + duration + 0.01)
}

export type SoundName =
  | 'correct'
  | 'wrong'
  | 'levelup'
  | 'achievement'
  | 'gavel'
  | 'streak'
  | 'quiz_start'
  | 'page_turn'
  | 'coin'
  | 'heart_break'
  | 'daily_goal'

const SOUNDS: Record<SoundName, () => void> = {
  correct() {
    // Bright ascending major chord C5 -> E5 -> G5
    tone(523.25, 'sine', 0.3, 0.25, 0)
    tone(659.25, 'sine', 0.3, 0.25, 0.06)
    tone(783.99, 'sine', 0.4, 0.25, 0.12)
  },

  wrong() {
    // Descending minor second buzz
    tone(311, 'sawtooth', 0.3, 0.12, 0, 0.01, 233)
    tone(293, 'sawtooth', 0.25, 0.08, 0.05, 0.01, 220)
  },

  levelup() {
    // Triumphant ascending arpeggio C4 -> C5 + sparkle
    const notes = [261.63, 329.63, 392.0, 523.25, 659.25, 783.99]
    notes.forEach((f, i) =>
      tone(f, 'sine', 0.5 - i * 0.03, 0.2, i * 0.08)
    )
    tone(1046.5, 'sine', 0.6, 0.1, 0.5)
    tone(1318.5, 'sine', 0.5, 0.08, 0.55)
  },

  achievement() {
    // Fanfare: trumpet-like square wave progression
    tone(523.25, 'square', 0.15, 0.1, 0)
    tone(523.25, 'square', 0.15, 0.1, 0.18)
    tone(659.25, 'square', 0.15, 0.1, 0.36)
    tone(783.99, 'square', 0.5, 0.12, 0.54)
    tone(1046.5, 'sine', 0.4, 0.06, 0.6)
  },

  gavel() {
    // Sharp percussive hit
    noise(0.08, 0.25, 0, { freq: 800, Q: 1 })
    tone(150, 'sine', 0.15, 0.2, 0, 0.005)
    noise(0.15, 0.08, 0.08, { freq: 400, Q: 2 })
  },

  streak() {
    // Whoosh + rising tone
    noise(0.3, 0.12, 0, { freq: 2000, Q: 0.5 })
    tone(300, 'sine', 0.35, 0.12, 0, 0.01, 900)
  },

  quiz_start() {
    // 3-2-1-GO countdown beeps
    tone(880, 'sine', 0.1, 0.15, 0)
    tone(880, 'sine', 0.1, 0.15, 0.3)
    tone(880, 'sine', 0.1, 0.15, 0.6)
    tone(1760, 'sine', 0.25, 0.2, 0.9)
  },

  page_turn() {
    // Soft paper flip
    noise(0.12, 0.06, 0, { freq: 3000, Q: 0.3 })
    noise(0.06, 0.03, 0.05, { freq: 5000, Q: 0.5 })
  },

  coin() {
    // Metallic coin collect ping
    tone(1318.5, 'sine', 0.15, 0.18, 0)
    tone(1760, 'sine', 0.2, 0.12, 0.05)
    tone(2093, 'sine', 0.15, 0.08, 0.1)
  },

  heart_break() {
    // Sad descending tone
    tone(440, 'sine', 0.2, 0.18, 0, 0.01, 330)
    tone(392, 'triangle', 0.3, 0.12, 0.1, 0.01, 262)
  },

  daily_goal() {
    // Victorious goal complete chord
    tone(392, 'sine', 0.3, 0.18, 0)
    tone(493.88, 'sine', 0.3, 0.18, 0.05)
    tone(587.33, 'sine', 0.4, 0.18, 0.1)
    tone(783.99, 'sine', 0.5, 0.12, 0.2)
  },
}

let soundEnabled = true

export function setSoundEnabled(enabled: boolean) {
  soundEnabled = enabled
  if (typeof window !== 'undefined') {
    localStorage.setItem('cai-sound-enabled', String(enabled))
  }
}

export function isSoundEnabled(): boolean {
  if (typeof window !== 'undefined') {
    const stored = localStorage.getItem('cai-sound-enabled')
    if (stored !== null) {
      soundEnabled = stored === 'true'
    }
  }
  return soundEnabled
}

export function playSound(name: SoundName) {
  if (!isSoundEnabled()) return
  try {
    SOUNDS[name]()
  } catch {
    // AudioContext not allowed yet (no user interaction)
  }
}

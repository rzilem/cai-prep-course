'use client'

import * as React from 'react'
import { ThemeProvider } from 'next-themes'
import { Toaster } from 'sonner'

// ── Sound System ────────────────────────────────────────────────────

type SoundName =
  | 'correct'
  | 'wrong'
  | 'levelup'
  | 'achievement'
  | 'gavel'
  | 'streak'
  | 'quiz_start'
  | 'page_turn'

interface SoundContextValue {
  soundEnabled: boolean
  setSoundEnabled: (enabled: boolean) => void
  playSound: (name: SoundName) => void
}

const SoundContext = React.createContext<SoundContextValue>({
  soundEnabled: true,
  setSoundEnabled: () => {},
  playSound: () => {},
})

export function useSound() {
  return React.useContext(SoundContext)
}

function SoundProvider({ children }: { children: React.ReactNode }) {
  const [soundEnabled, setSoundEnabledState] = React.useState(true)
  const audioCache = React.useRef<Map<string, HTMLAudioElement>>(new Map())

  // Load persisted preference from localStorage on mount
  React.useEffect(() => {
    try {
      const stored = localStorage.getItem('cai-sound-enabled')
      if (stored !== null) {
        setSoundEnabledState(stored === 'true')
      }
    } catch {
      // localStorage unavailable (SSR, privacy mode, etc.)
    }
  }, [])

  const setSoundEnabled = React.useCallback((enabled: boolean) => {
    setSoundEnabledState(enabled)
    try {
      localStorage.setItem('cai-sound-enabled', String(enabled))
    } catch {
      // localStorage unavailable
    }

    // Toggle CSS class on body for any CSS-driven sound indicators
    if (enabled) {
      document.body.classList.add('sound-enabled')
    } else {
      document.body.classList.remove('sound-enabled')
    }
  }, [])

  const playSound = React.useCallback(
    (name: SoundName) => {
      if (!soundEnabled) return

      const path = `/sounds/${name}.mp3`

      try {
        // Reuse cached Audio elements to avoid re-fetching
        let audio = audioCache.current.get(path)
        if (!audio) {
          audio = new Audio(path)
          audioCache.current.set(path, audio)
        }

        // Reset to start if already playing
        audio.currentTime = 0
        audio.volume = 0.5
        audio.play().catch(() => {
          // Browser may block autoplay before user interaction — silently ignore
        })
      } catch {
        // Audio not available
      }
    },
    [soundEnabled]
  )

  const value = React.useMemo(
    () => ({ soundEnabled, setSoundEnabled, playSound }),
    [soundEnabled, setSoundEnabled, playSound]
  )

  return <SoundContext.Provider value={value}>{children}</SoundContext.Provider>
}

// ── Root Providers ──────────────────────────────────────────────────

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider attribute="class" defaultTheme="dark" enableSystem={false}>
      <SoundProvider>
        {children}
        <Toaster
          position="bottom-right"
          richColors
          closeButton
          toastOptions={{
            className: 'font-sans',
          }}
        />
      </SoundProvider>
    </ThemeProvider>
  )
}

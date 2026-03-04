'use client'

import * as React from 'react'
import { ThemeProvider } from 'next-themes'
import { Toaster } from 'sonner'
import { playSound, isSoundEnabled, setSoundEnabled } from '@/lib/sounds'
import { CelebrationProvider } from '@/components/gamification/celebrations'
import type { SoundName } from '@/lib/sounds'

// ── Sound System (Web Audio API synth — zero file downloads) ────────

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
  const [enabled, setEnabledState] = React.useState(true)

  React.useEffect(() => {
    setEnabledState(isSoundEnabled())
  }, [])

  const handleSetEnabled = React.useCallback((value: boolean) => {
    setEnabledState(value)
    setSoundEnabled(value)
  }, [])

  const handlePlaySound = React.useCallback(
    (name: SoundName) => {
      if (!enabled) return
      playSound(name)
    },
    [enabled]
  )

  const value = React.useMemo(
    () => ({
      soundEnabled: enabled,
      setSoundEnabled: handleSetEnabled,
      playSound: handlePlaySound,
    }),
    [enabled, handleSetEnabled, handlePlaySound]
  )

  return (
    <SoundContext.Provider value={value}>{children}</SoundContext.Provider>
  )
}

// ── Root Providers ──────────────────────────────────────────────────

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider attribute="class" defaultTheme="dark" enableSystem={false}>
      <SoundProvider>
        <CelebrationProvider>
          {children}
        </CelebrationProvider>
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

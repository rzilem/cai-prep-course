'use client'

import {
  createContext,
  useContext,
  useState,
  useCallback,
  useEffect,
} from 'react'
import { motion, AnimatePresence } from 'motion/react'
import {
  Star,
  Trophy,
  Flame,
  Target,
  Sparkles,
  Zap,
} from 'lucide-react'
import { playSound } from '@/lib/sounds'
import type { CelebrationType } from '@/lib/gamification'

// --- Canvas Confetti ---

interface Particle {
  x: number
  y: number
  vx: number
  vy: number
  size: number
  color: string
  rotation: number
  rotationSpeed: number
  opacity: number
  shape: number
}

const CONFETTI_COLORS = [
  '#FF6B6B',
  '#4ECDC4',
  '#45B7D1',
  '#FFA07A',
  '#98D8C8',
  '#F7DC6F',
  '#BB8FCE',
  '#85C1E9',
  '#F0B27A',
  '#82E0AA',
]

export function fireConfetti(count = 150) {
  if (typeof window === 'undefined') return

  const canvas = document.createElement('canvas')
  canvas.style.cssText =
    'position:fixed;top:0;left:0;width:100vw;height:100vh;pointer-events:none;z-index:10000'
  canvas.width = window.innerWidth
  canvas.height = window.innerHeight
  document.body.appendChild(canvas)

  const ctx = canvas.getContext('2d')!
  const cx = canvas.width / 2
  const cy = canvas.height * 0.35

  const particles: Particle[] = Array.from({ length: count }, () => ({
    x: cx + (Math.random() - 0.5) * 100,
    y: cy,
    vx: (Math.random() - 0.5) * 24,
    vy: -Math.random() * 22 - 5,
    size: Math.random() * 8 + 4,
    color: CONFETTI_COLORS[Math.floor(Math.random() * CONFETTI_COLORS.length)],
    rotation: Math.random() * Math.PI * 2,
    rotationSpeed: (Math.random() - 0.5) * 0.3,
    opacity: 1,
    shape: Math.floor(Math.random() * 3),
  }))

  let frame: number

  function animate() {
    ctx.clearRect(0, 0, canvas.width, canvas.height)
    let alive = false

    for (const p of particles) {
      p.vy += 0.35
      p.vx *= 0.99
      p.x += p.vx
      p.y += p.vy
      p.rotation += p.rotationSpeed
      p.opacity -= 0.004

      if (p.opacity > 0 && p.y < canvas.height + 50) {
        alive = true
        ctx.save()
        ctx.globalAlpha = p.opacity
        ctx.translate(p.x, p.y)
        ctx.rotate(p.rotation)
        ctx.fillStyle = p.color

        if (p.shape === 0) {
          ctx.fillRect(-p.size / 2, -p.size / 2, p.size, p.size)
        } else if (p.shape === 1) {
          ctx.beginPath()
          ctx.arc(0, 0, p.size / 2, 0, Math.PI * 2)
          ctx.fill()
        } else {
          ctx.fillRect(-p.size / 2, -p.size / 4, p.size, p.size / 2)
        }

        ctx.restore()
      }
    }

    if (alive) {
      frame = requestAnimationFrame(animate)
    } else {
      canvas.remove()
    }
  }

  frame = requestAnimationFrame(animate)
  setTimeout(() => {
    cancelAnimationFrame(frame)
    if (canvas.parentNode) canvas.remove()
  }, 5000)
}

// --- Floating Popup (XP / Coins) ---

function FloatingPopup({
  type,
  value,
  onDone,
}: {
  type: 'xp' | 'coins'
  value: number
  onDone: () => void
}) {
  useEffect(() => {
    const timer = setTimeout(onDone, 2000)
    return () => clearTimeout(timer)
  }, [onDone])

  const isCoins = type === 'coins'

  return (
    <motion.div
      initial={{ opacity: 0, y: 20, scale: 0.5 }}
      animate={{ opacity: 1, y: -60, scale: 1 }}
      exit={{ opacity: 0, y: -120, scale: 0.8 }}
      transition={{ duration: 1.5, ease: 'easeOut' }}
      className="fixed top-1/3 left-1/2 -translate-x-1/2 pointer-events-none z-[10001]"
    >
      <div
        className={`flex items-center gap-2 rounded-full px-5 py-2.5 text-lg font-bold shadow-2xl ${
          isCoins
            ? 'bg-gradient-to-r from-amber-400 to-yellow-500 text-amber-900'
            : 'bg-gradient-to-r from-blue-500 to-indigo-600 text-white'
        }`}
      >
        {isCoins ? (
          <Sparkles className="size-5" />
        ) : (
          <Zap className="size-5" />
        )}
        +{value} {isCoins ? 'Coins' : 'XP'}
      </div>
    </motion.div>
  )
}

// --- Level Up Overlay ---

function LevelUpOverlay({
  level,
  onDone,
}: {
  level: number
  onDone: () => void
}) {
  useEffect(() => {
    const timer = setTimeout(onDone, 4000)
    return () => clearTimeout(timer)
  }, [onDone])

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.3 }}
      className="fixed inset-0 z-[10002] flex items-center justify-center bg-black/60 backdrop-blur-sm"
      onClick={onDone}
    >
      <motion.div
        initial={{ scale: 0, rotate: -10 }}
        animate={{ scale: 1, rotate: 0 }}
        exit={{ scale: 0.5, opacity: 0 }}
        transition={{ type: 'spring', stiffness: 200, damping: 15 }}
        className="text-center"
      >
        <motion.div
          animate={{
            boxShadow: [
              '0 0 30px rgba(234,179,8,0.3)',
              '0 0 80px rgba(234,179,8,0.6)',
              '0 0 30px rgba(234,179,8,0.3)',
            ],
          }}
          transition={{ duration: 2, repeat: Infinity }}
          className="mx-auto mb-4 flex size-24 items-center justify-center rounded-full bg-gradient-to-br from-yellow-400 to-amber-600"
        >
          <Star className="size-12 text-white" fill="white" />
        </motion.div>

        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="mb-2 text-sm font-semibold uppercase tracking-[0.3em] text-yellow-300"
        >
          Level Up!
        </motion.p>

        <motion.p
          initial={{ opacity: 0, scale: 0.5 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.5, type: 'spring' }}
          className="text-7xl font-black text-white"
          style={{
            textShadow: '0 0 40px rgba(234,179,8,0.5), 0 4px 12px rgba(0,0,0,0.5)',
          }}
        >
          {level}
        </motion.p>

        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.8 }}
          className="mt-3 text-lg text-yellow-200/80"
        >
          Keep going!
        </motion.p>
      </motion.div>
    </motion.div>
  )
}

// --- Achievement Toast ---

function AchievementToast({
  label,
  onDone,
}: {
  label: string
  onDone: () => void
}) {
  useEffect(() => {
    const timer = setTimeout(onDone, 3500)
    return () => clearTimeout(timer)
  }, [onDone])

  return (
    <motion.div
      initial={{ opacity: 0, x: 100, scale: 0.8 }}
      animate={{ opacity: 1, x: 0, scale: 1 }}
      exit={{ opacity: 0, x: 100, scale: 0.8 }}
      transition={{ type: 'spring', stiffness: 300, damping: 25 }}
      className="fixed right-6 top-20 z-[10001] flex items-center gap-3 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-700 px-5 py-3.5 text-white shadow-2xl"
    >
      <div className="flex size-10 items-center justify-center rounded-full bg-white/20">
        <Trophy className="size-5" />
      </div>
      <div>
        <p className="text-xs font-semibold uppercase tracking-wider text-purple-200">
          Achievement Unlocked
        </p>
        <p className="text-sm font-bold">{label}</p>
      </div>
    </motion.div>
  )
}

// --- Streak Milestone Toast ---

function StreakToast({
  streak,
  onDone,
}: {
  streak: number
  onDone: () => void
}) {
  useEffect(() => {
    const timer = setTimeout(onDone, 3000)
    return () => clearTimeout(timer)
  }, [onDone])

  return (
    <motion.div
      initial={{ opacity: 0, y: -50, scale: 0.8 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: -50 }}
      transition={{ type: 'spring', stiffness: 300, damping: 25 }}
      className="fixed left-1/2 top-20 z-[10001] -translate-x-1/2"
    >
      <div className="flex items-center gap-3 rounded-xl bg-gradient-to-r from-orange-500 to-red-600 px-6 py-3 text-white shadow-2xl">
        <Flame className="size-6 animate-pulse" />
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-orange-200">
            Streak Milestone!
          </p>
          <p className="text-lg font-black">{streak} Days</p>
        </div>
        <Flame className="size-6 animate-pulse" />
      </div>
    </motion.div>
  )
}

// --- Daily Goal Toast ---

function DailyGoalToast({ onDone }: { onDone: () => void }) {
  useEffect(() => {
    const timer = setTimeout(onDone, 3000)
    return () => clearTimeout(timer)
  }, [onDone])

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.5 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.8 }}
      transition={{ type: 'spring', stiffness: 300, damping: 20 }}
      className="fixed left-1/2 top-1/3 z-[10001] -translate-x-1/2"
    >
      <div className="flex flex-col items-center gap-2 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-600 px-8 py-5 text-white shadow-2xl">
        <Target className="size-10" />
        <p className="text-xl font-black">Daily Goal Complete!</p>
        <p className="text-sm text-emerald-100">+50 Coins Bonus</p>
      </div>
    </motion.div>
  )
}

// --- Heart Lost Flash ---

function HeartLostFlash({ onDone }: { onDone: () => void }) {
  useEffect(() => {
    const timer = setTimeout(onDone, 800)
    return () => clearTimeout(timer)
  }, [onDone])

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: [0, 0.3, 0] }}
      transition={{ duration: 0.6 }}
      className="fixed inset-0 z-[9999] bg-red-500 pointer-events-none"
    />
  )
}

// --- Celebration Context ---

interface CelebrationItem {
  id: string
  type: CelebrationType
  value?: number
  label?: string
}

interface CelebrationContextType {
  celebrate: (items: CelebrationItem | CelebrationItem[]) => void
}

const CelebrationContext = createContext<CelebrationContextType>({
  celebrate: () => {},
})

export function useCelebration() {
  return useContext(CelebrationContext)
}

export function CelebrationProvider({
  children,
}: {
  children: React.ReactNode
}) {
  const [popups, setPopups] = useState<CelebrationItem[]>([])
  const [levelUp, setLevelUp] = useState<number | null>(null)
  const [achievement, setAchievement] = useState<string | null>(null)
  const [streakMilestone, setStreakMilestone] = useState<number | null>(null)
  const [showDailyGoal, setShowDailyGoal] = useState(false)
  const [showHeartLost, setShowHeartLost] = useState(false)

  const celebrate = useCallback(
    (itemsOrItem: CelebrationItem | CelebrationItem[]) => {
      const items = Array.isArray(itemsOrItem) ? itemsOrItem : [itemsOrItem]

      for (const item of items) {
        switch (item.type) {
          case 'confetti':
            fireConfetti()
            break

          case 'xp':
          case 'coins':
            setPopups((prev) => [...prev, item])
            if (item.type === 'coins') playSound('coin')
            break

          case 'level_up':
            setLevelUp(item.value ?? 0)
            playSound('levelup')
            fireConfetti(200)
            break

          case 'achievement':
            setAchievement(item.label ?? 'New Achievement!')
            playSound('achievement')
            fireConfetti()
            break

          case 'perfect_score':
            fireConfetti(250)
            playSound('achievement')
            break

          case 'streak_milestone':
            setStreakMilestone(item.value ?? 7)
            playSound('streak')
            break

          case 'daily_goal':
            setShowDailyGoal(true)
            playSound('daily_goal')
            fireConfetti(100)
            break

          case 'heart_lost':
            setShowHeartLost(true)
            playSound('heart_break')
            break
        }
      }
    },
    []
  )

  const removePopup = useCallback((id: string) => {
    setPopups((prev) => prev.filter((p) => p.id !== id))
  }, [])

  return (
    <CelebrationContext.Provider value={{ celebrate }}>
      {children}

      {/* Floating XP / Coin popups */}
      <AnimatePresence>
        {popups.map((p, i) => (
          <div
            key={p.id}
            style={{ transform: `translateY(${i * -40}px)` }}
          >
            <FloatingPopup
              type={p.type as 'xp' | 'coins'}
              value={p.value ?? 0}
              onDone={() => removePopup(p.id)}
            />
          </div>
        ))}
      </AnimatePresence>

      {/* Level Up */}
      <AnimatePresence>
        {levelUp !== null && (
          <LevelUpOverlay
            level={levelUp}
            onDone={() => setLevelUp(null)}
          />
        )}
      </AnimatePresence>

      {/* Achievement */}
      <AnimatePresence>
        {achievement !== null && (
          <AchievementToast
            label={achievement}
            onDone={() => setAchievement(null)}
          />
        )}
      </AnimatePresence>

      {/* Streak */}
      <AnimatePresence>
        {streakMilestone !== null && (
          <StreakToast
            streak={streakMilestone}
            onDone={() => setStreakMilestone(null)}
          />
        )}
      </AnimatePresence>

      {/* Daily Goal */}
      <AnimatePresence>
        {showDailyGoal && (
          <DailyGoalToast onDone={() => setShowDailyGoal(false)} />
        )}
      </AnimatePresence>

      {/* Heart Lost Flash */}
      <AnimatePresence>
        {showHeartLost && (
          <HeartLostFlash onDone={() => setShowHeartLost(false)} />
        )}
      </AnimatePresence>
    </CelebrationContext.Provider>
  )
}

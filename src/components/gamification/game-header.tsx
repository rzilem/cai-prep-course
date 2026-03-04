'use client'

import { useState, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'motion/react'
import {
  Heart,
  Coins,
  Flame,
  Target,
  Star,
  Timer,
  ChevronRight,
} from 'lucide-react'
import {
  MAX_HEARTS,
  HEART_REGEN_MINUTES,
  getTimeUntilNextHeart,
  getLevelProgress,
  getLevelTitle,
} from '@/lib/gamification'
import { AnimatedCounter } from '@/components/animated-counter'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip'

interface GameHeaderProps {
  hearts: number
  coins: number
  streak: number
  dailyGoalProgress: number
  dailyGoalTarget: number
  totalXp: number
  lastHeartRegen: string | null
}

// --- Hearts Display ---

function HeartsDisplay({
  hearts,
  lastRegen,
}: {
  hearts: number
  lastRegen: string | null
}) {
  const [regenTime, setRegenTime] = useState({ minutes: 0, seconds: 0 })
  const isFull = hearts >= MAX_HEARTS

  useEffect(() => {
    if (isFull || !lastRegen) return
    const interval = setInterval(() => {
      setRegenTime(getTimeUntilNextHeart(lastRegen))
    }, 1000)
    return () => clearInterval(interval)
  }, [isFull, lastRegen])

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <div className="flex items-center gap-1">
            {Array.from({ length: MAX_HEARTS }, (_, i) => (
              <motion.div
                key={i}
                initial={false}
                animate={
                  i < hearts
                    ? { scale: [1, 1.2, 1], opacity: 1 }
                    : { scale: 1, opacity: 0.2 }
                }
                transition={{ duration: 0.3, delay: i * 0.05 }}
              >
                <Heart
                  className={`size-5 ${
                    i < hearts
                      ? 'fill-red-500 text-red-500'
                      : 'fill-slate-300 text-slate-300 dark:fill-slate-600 dark:text-slate-600'
                  }`}
                />
              </motion.div>
            ))}
            {!isFull && (
              <span className="ml-1 flex items-center gap-0.5 text-[10px] tabular-nums text-muted-foreground">
                <Timer className="size-3" />
                {regenTime.minutes}:{String(regenTime.seconds).padStart(2, '0')}
              </span>
            )}
          </div>
        </TooltipTrigger>
        <TooltipContent>
          <p>
            {hearts}/{MAX_HEARTS} Hearts
            {!isFull &&
              ` — Next heart in ${regenTime.minutes}m ${regenTime.seconds}s`}
          </p>
          <p className="text-xs text-muted-foreground">
            Lose a heart on wrong quiz answers. Regenerates every{' '}
            {HEART_REGEN_MINUTES}m.
          </p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  )
}

// --- Coins Display ---

function CoinsDisplay({ coins }: { coins: number }) {
  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <div className="flex items-center gap-1.5">
            <motion.div
              whileHover={{ rotate: 360 }}
              transition={{ duration: 0.5 }}
            >
              <Coins className="size-5 text-amber-500" />
            </motion.div>
            <span className="text-sm font-bold tabular-nums text-amber-600 dark:text-amber-400">
              <AnimatedCounter value={coins} duration={600} />
            </span>
          </div>
        </TooltipTrigger>
        <TooltipContent>
          <p>{coins.toLocaleString()} Coins</p>
          <p className="text-xs text-muted-foreground">
            Earn coins from lessons, quizzes, and daily goals. Spend on streak
            freezes and hints.
          </p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  )
}

// --- Streak Display with Fire ---

function StreakDisplay({ streak }: { streak: number }) {
  const isActive = streak > 0
  const isMilestone = streak > 0 && streak % 7 === 0

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <div className="flex items-center gap-1.5">
            <div className="relative">
              <Flame
                className={`size-5 ${
                  isActive
                    ? isMilestone
                      ? 'text-amber-500'
                      : 'text-orange-500'
                    : 'text-slate-400'
                }`}
                fill={isActive ? 'currentColor' : 'none'}
              />
              {isActive && (
                <motion.div
                  className="absolute -inset-1 rounded-full"
                  animate={{
                    boxShadow: [
                      '0 0 4px rgba(249,115,22,0.3)',
                      '0 0 12px rgba(249,115,22,0.5)',
                      '0 0 4px rgba(249,115,22,0.3)',
                    ],
                  }}
                  transition={{ duration: 1.5, repeat: Infinity }}
                />
              )}
            </div>
            <span
              className={`text-sm font-bold tabular-nums ${
                isActive
                  ? 'text-orange-600 dark:text-orange-400'
                  : 'text-muted-foreground'
              }`}
            >
              {streak}
            </span>
          </div>
        </TooltipTrigger>
        <TooltipContent>
          <p>
            {streak} Day Streak
            {isMilestone && ' — Milestone!'}
          </p>
          <p className="text-xs text-muted-foreground">
            Study every day to keep your streak alive!
          </p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  )
}

// --- Daily Goal ---

function DailyGoalDisplay({
  progress,
  target,
}: {
  progress: number
  target: number
}) {
  const percentage = Math.min(100, (progress / target) * 100)
  const isDone = progress >= target

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <div className="flex items-center gap-1.5">
            <Target
              className={`size-5 ${
                isDone ? 'text-emerald-500' : 'text-sky-500'
              }`}
            />
            <div className="flex items-center gap-1">
              <div className="h-2 w-14 overflow-hidden rounded-full bg-slate-200 dark:bg-slate-700">
                <motion.div
                  className={`h-full rounded-full ${
                    isDone
                      ? 'bg-gradient-to-r from-emerald-400 to-emerald-600'
                      : 'bg-gradient-to-r from-sky-400 to-blue-600'
                  }`}
                  initial={false}
                  animate={{ width: `${percentage}%` }}
                  transition={{ duration: 0.5, ease: 'easeOut' }}
                />
              </div>
              <span className="text-xs font-semibold tabular-nums text-muted-foreground">
                {progress}/{target}
              </span>
            </div>
            {isDone && (
              <motion.span
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                className="text-xs"
              >
                ✓
              </motion.span>
            )}
          </div>
        </TooltipTrigger>
        <TooltipContent>
          <p>
            Daily Goal: {progress}/{target} lessons
            {isDone && ' — Complete!'}
          </p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  )
}

// --- XP Level Bar ---

function LevelBar({ totalXp }: { totalXp: number }) {
  const { level, current, required, percentage } = getLevelProgress(totalXp)
  const title = getLevelTitle(level)

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <div className="flex items-center gap-1.5">
            <div className="flex size-6 items-center justify-center rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 text-[10px] font-black text-white">
              {level}
            </div>
            <div className="h-2 w-16 overflow-hidden rounded-full bg-slate-200 dark:bg-slate-700">
              <motion.div
                className="h-full rounded-full bg-gradient-to-r from-indigo-400 to-purple-600"
                initial={false}
                animate={{ width: `${percentage}%` }}
                transition={{ duration: 0.8, ease: 'easeOut' }}
              />
            </div>
          </div>
        </TooltipTrigger>
        <TooltipContent>
          <p className="font-semibold">
            Level {level} — {title}
          </p>
          <p className="text-xs text-muted-foreground">
            {current.toLocaleString()} / {required.toLocaleString()} XP to Level{' '}
            {level + 1}
          </p>
          <p className="text-xs text-muted-foreground">
            Total: {totalXp.toLocaleString()} XP
          </p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  )
}

// --- Main Game Header ---

export function GameHeader({
  hearts,
  coins,
  streak,
  dailyGoalProgress,
  dailyGoalTarget,
  totalXp,
  lastHeartRegen,
}: GameHeaderProps) {
  return (
    <div className="flex items-center gap-3 rounded-lg border bg-card/50 px-3 py-1.5 shadow-sm backdrop-blur-sm sm:gap-4 sm:px-4">
      <HeartsDisplay hearts={hearts} lastRegen={lastHeartRegen} />

      <div className="h-4 w-px bg-border" />

      <CoinsDisplay coins={coins} />

      <div className="h-4 w-px bg-border" />

      <StreakDisplay streak={streak} />

      <div className="h-4 w-px bg-border hidden sm:block" />

      <div className="hidden sm:block">
        <DailyGoalDisplay
          progress={dailyGoalProgress}
          target={dailyGoalTarget}
        />
      </div>

      <div className="ml-auto">
        <LevelBar totalXp={totalXp} />
      </div>
    </div>
  )
}

export { HeartsDisplay, CoinsDisplay, StreakDisplay, DailyGoalDisplay, LevelBar }

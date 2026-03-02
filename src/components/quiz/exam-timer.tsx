'use client'

import { useEffect, useState, useCallback } from 'react'
import { Clock, AlertTriangle } from 'lucide-react'
import { cn } from '@/lib/utils'

interface ExamTimerProps {
  totalSeconds: number // e.g. 10800 for 3 hours
  onTimeUp: () => void
  isPaused?: boolean
  className?: string
}

export function ExamTimer({ totalSeconds, onTimeUp, isPaused, className }: ExamTimerProps) {
  const [remaining, setRemaining] = useState(totalSeconds)

  useEffect(() => {
    if (isPaused || remaining <= 0) return
    const interval = setInterval(() => {
      setRemaining((prev) => {
        if (prev <= 1) {
          clearInterval(interval)
          onTimeUp()
          return 0
        }
        return prev - 1
      })
    }, 1000)
    return () => clearInterval(interval)
  }, [isPaused, remaining, onTimeUp])

  const hours = Math.floor(remaining / 3600)
  const minutes = Math.floor((remaining % 3600) / 60)
  const seconds = remaining % 60

  const percentUsed = ((totalSeconds - remaining) / totalSeconds) * 100
  const isWarning = remaining <= 600 // last 10 minutes
  const isCritical = remaining <= 120 // last 2 minutes

  const formatTime = useCallback((val: number) => String(val).padStart(2, '0'), [])

  return (
    <div
      className={cn(
        'flex items-center gap-2 px-3 py-1.5 rounded-lg border text-sm font-mono transition-colors',
        !isWarning && 'border-border/50 bg-muted/50 text-foreground',
        isWarning && !isCritical && 'border-amber-500/50 bg-amber-500/10 text-amber-400',
        isCritical && 'border-red-500/50 bg-red-500/10 text-red-400 animate-pulse',
        className
      )}
    >
      {isCritical ? (
        <AlertTriangle className="h-4 w-4" />
      ) : (
        <Clock className="h-4 w-4" />
      )}
      <span>
        {hours > 0 && `${formatTime(hours)}:`}
        {formatTime(minutes)}:{formatTime(seconds)}
      </span>
      {/* Mini progress bar */}
      <div className="w-16 h-1.5 bg-muted rounded-full overflow-hidden">
        <div
          className={cn(
            'h-full rounded-full transition-all duration-1000',
            !isWarning && 'bg-cai-blue',
            isWarning && !isCritical && 'bg-amber-500',
            isCritical && 'bg-red-500',
          )}
          style={{ width: `${100 - percentUsed}%` }}
        />
      </div>
    </div>
  )
}

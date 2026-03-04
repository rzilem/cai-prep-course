'use client'

import { useState, useEffect } from 'react'
import {
  Trophy,
  Flame,
  Zap,
  BarChart3,
  Crown,
  Loader2,
} from 'lucide-react'
import { motion, AnimatePresence } from 'motion/react'
import { createClient } from '@/lib/supabase/client'

import { FadeIn } from '@/components/fade-in'
import { AnimatedCounter } from '@/components/animated-counter'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Separator } from '@/components/ui/separator'

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface LeaderboardUser {
  rank: number
  email: string
  displayName: string
  initials: string
  totalXP: number
  currentStreak: number
  quizAverage: number
  lessonsCompleted: number
  studyMinutes: number
  isCurrentUser: boolean
}

// ---------------------------------------------------------------------------
// Avatar color palette (deterministic from email)
// ---------------------------------------------------------------------------

const AVATAR_COLORS = [
  'bg-cai-blue',
  'bg-cai-teal',
  'bg-cai-purple',
  'bg-cai-emerald',
  'bg-cai-amber',
  'bg-cai-red',
  'bg-cai-gold',
]

function getAvatarColor(email: string): string {
  let hash = 0
  for (let i = 0; i < email.length; i++) {
    hash = email.charCodeAt(i) + ((hash << 5) - hash)
  }
  return AVATAR_COLORS[Math.abs(hash) % AVATAR_COLORS.length]
}

// ---------------------------------------------------------------------------
// Podium Config
// ---------------------------------------------------------------------------

const podiumColors = [
  {
    bg: 'bg-gradient-to-b from-cai-gold/20 to-transparent',
    border: 'border-cai-gold/40',
    text: 'text-cai-gold',
  },
  {
    bg: 'bg-gradient-to-b from-zinc-400/20 to-transparent',
    border: 'border-zinc-400/40',
    text: 'text-zinc-400',
  },
  {
    bg: 'bg-gradient-to-b from-amber-700/20 to-transparent',
    border: 'border-amber-700/40',
    text: 'text-amber-700',
  },
]

// ---------------------------------------------------------------------------
// Leaderboard Page
// ---------------------------------------------------------------------------

export default function LeaderboardPage() {
  const [users, setUsers] = useState<LeaderboardUser[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()

      try {
        const params = new URLSearchParams()
        if (user?.email) params.set('user_email', user.email)
        const res = await fetch(`/api/leaderboard?${params}`)
        if (res.ok) {
          const data = await res.json()
          setUsers(data.leaderboard ?? [])
        }
      } catch {
        // silently fail
      }
      setLoading(false)
    }
    load()
  }, [])

  if (loading) {
    return (
      <div className="flex items-center justify-center py-32">
        <Loader2 className="size-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  const top3 = users.slice(0, 3)
  const hasEnoughForPodium = top3.length >= 3

  return (
    <div className="space-y-8">
      {/* ── Header ───────────────────────────────────────────────── */}
      <FadeIn delay={0}>
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Leaderboard</h1>
            <p className="mt-1 text-muted-foreground">
              See how you rank among your team
            </p>
          </div>
          <Badge variant="outline" className="w-fit text-xs text-muted-foreground">
            All Time XP
          </Badge>
        </div>
      </FadeIn>

      {users.length === 0 ? (
        <div className="flex flex-col items-center gap-4 py-16 text-center">
          <Trophy className="size-12 text-muted-foreground" />
          <p className="text-lg text-muted-foreground">
            No one on the leaderboard yet. Start studying to be first!
          </p>
        </div>
      ) : (
        <>
          {/* ── Podium (Top 3) ───────────────────────────────────────── */}
          {hasEnoughForPodium && (
            <FadeIn delay={80}>
              <div className="flex items-end justify-center gap-4 px-4 pb-4">
                {/* 2nd place (left) */}
                <motion.div
                  initial={{ opacity: 0, y: 30 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3, duration: 0.5 }}
                  className="flex flex-1 max-w-[220px]"
                >
                  <PodiumCard user={top3[1]} rank={2} />
                </motion.div>

                {/* 1st place (center, taller) */}
                <motion.div
                  initial={{ opacity: 0, y: 30 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.15, duration: 0.5 }}
                  className="flex flex-1 max-w-[240px]"
                >
                  <PodiumCard user={top3[0]} rank={1} />
                </motion.div>

                {/* 3rd place (right) */}
                <motion.div
                  initial={{ opacity: 0, y: 30 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.45, duration: 0.5 }}
                  className="flex flex-1 max-w-[220px]"
                >
                  <PodiumCard user={top3[2]} rank={3} />
                </motion.div>
              </div>
            </FadeIn>
          )}

          <Separator />

          {/* ── Full Rankings ────────────────────────────────────────── */}
          <FadeIn delay={200}>
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Full Rankings</CardTitle>
                <CardDescription>Total XP earned</CardDescription>
              </CardHeader>
              <CardContent className="space-y-1">
                <AnimatePresence mode="popLayout">
                  {users.map((user, index) => {
                    const avatarColor = getAvatarColor(user.email)
                    return (
                      <motion.div
                        key={user.email}
                        layout
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.25 + index * 0.05, duration: 0.3 }}
                        className={`flex items-center gap-4 rounded-lg px-4 py-3 transition-colors ${
                          user.isCurrentUser
                            ? 'bg-cai-blue/10 border border-cai-blue/30'
                            : 'hover:bg-muted/50'
                        }`}
                      >
                        {/* Rank */}
                        <div className="flex items-center gap-1 w-12">
                          <span
                            className={`text-lg font-bold ${
                              index < 3
                                ? podiumColors[index].text
                                : 'text-muted-foreground'
                            }`}
                          >
                            #{index + 1}
                          </span>
                        </div>

                        {/* Avatar & Name */}
                        <Avatar className="size-9">
                          <AvatarFallback
                            className={`${avatarColor} text-white text-xs`}
                          >
                            {user.initials}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium truncate">
                            {user.displayName}
                            {user.isCurrentUser && (
                              <Badge
                                variant="outline"
                                className="ml-2 text-[10px] border-cai-blue/40 text-cai-blue px-1 py-0"
                              >
                                You
                              </Badge>
                            )}
                          </p>
                          <div className="flex items-center gap-3 text-xs text-muted-foreground">
                            <span className="flex items-center gap-0.5">
                              <Flame className="size-3 text-cai-amber" />
                              {user.currentStreak}d
                            </span>
                            <span className="flex items-center gap-0.5">
                              <BarChart3 className="size-3" />
                              {user.quizAverage}%
                            </span>
                            <span>{user.lessonsCompleted} lessons</span>
                          </div>
                        </div>

                        {/* XP */}
                        <div className="text-right">
                          <p className="text-sm font-bold flex items-center gap-1 justify-end">
                            <Zap className="size-3.5 text-cai-gold" />
                            <AnimatedCounter value={user.totalXP} />
                          </p>
                          <p className="text-xs text-muted-foreground">
                            total XP
                          </p>
                        </div>
                      </motion.div>
                    )
                  })}
                </AnimatePresence>
              </CardContent>
            </Card>
          </FadeIn>
        </>
      )}
    </div>
  )
}

// ---------------------------------------------------------------------------
// Podium Card
// ---------------------------------------------------------------------------

function PodiumCard({
  user,
  rank,
}: {
  user: LeaderboardUser
  rank: 1 | 2 | 3
}) {
  const style = podiumColors[rank - 1]
  const avatarColor = getAvatarColor(user.email)

  return (
    <Card
      className={`w-full ${style.border} ${style.bg} overflow-hidden ${
        user.isCurrentUser ? 'ring-2 ring-cai-blue/50' : ''
      }`}
    >
      <CardContent className="flex flex-col items-center gap-3 pt-6 text-center">
        {/* Crown for 1st place */}
        {rank === 1 && (
          <motion.div
            initial={{ scale: 0, rotate: -20 }}
            animate={{ scale: 1, rotate: 0 }}
            transition={{ delay: 0.5, type: 'spring', stiffness: 300 }}
          >
            <Crown className="size-8 text-cai-gold" />
          </motion.div>
        )}

        {/* Avatar */}
        <div className="relative">
          <Avatar className={rank === 1 ? 'size-16' : 'size-12'}>
            <AvatarFallback
              className={`${avatarColor} text-white ${
                rank === 1 ? 'text-lg' : 'text-sm'
              }`}
            >
              {user.initials}
            </AvatarFallback>
          </Avatar>
          <div
            className={`absolute -bottom-1 -right-1 flex size-6 items-center justify-center rounded-full text-xs font-bold ${style.text} bg-background border-2 ${style.border}`}
          >
            {rank}
          </div>
        </div>

        {/* Name */}
        <div>
          <p className="text-sm font-semibold truncate max-w-[160px]">
            {user.displayName}
          </p>
          {user.isCurrentUser && (
            <Badge
              variant="outline"
              className="text-[10px] border-cai-blue/40 text-cai-blue mt-1"
            >
              You
            </Badge>
          )}
        </div>

        {/* XP */}
        <div className="flex items-center gap-1">
          <Zap className={`size-4 ${style.text}`} />
          <span className="text-lg font-bold">
            <AnimatedCounter value={user.totalXP} />
          </span>
        </div>

        {/* Stats */}
        <div className="flex items-center gap-3 text-xs text-muted-foreground">
          <span className="flex items-center gap-0.5">
            <Flame className="size-3 text-cai-amber" />
            {user.currentStreak}d
          </span>
          <span>{user.quizAverage}% avg</span>
        </div>
      </CardContent>
    </Card>
  )
}

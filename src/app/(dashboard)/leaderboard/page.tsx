'use client'

import { useState } from 'react'
import {
  Trophy,
  Medal,
  Flame,
  Zap,
  BarChart3,
  Crown,
  ArrowUp,
  ArrowDown,
  Minus,
} from 'lucide-react'
import { motion, AnimatePresence } from 'motion/react'

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
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Separator } from '@/components/ui/separator'

// ---------------------------------------------------------------------------
// Mock Leaderboard Data
// ---------------------------------------------------------------------------

interface LeaderboardUser {
  email: string
  displayName: string
  initials: string
  avatarColor: string
  totalXP: number
  currentStreak: number
  quizAverage: number
  lessonsCompleted: number
  isCurrentUser: boolean
  weeklyXP: number
  rankChange: 'up' | 'down' | 'same'
}

const mockLeaderboard: LeaderboardUser[] = [
  {
    email: 'maria.g@psprop.net',
    displayName: 'Maria Garcia',
    initials: 'MG',
    avatarColor: 'bg-cai-blue',
    totalXP: 8240,
    currentStreak: 28,
    quizAverage: 94,
    lessonsCompleted: 72,
    isCurrentUser: false,
    weeklyXP: 1580,
    rankChange: 'same',
  },
  {
    email: 'james.w@psprop.net',
    displayName: 'James Wilson',
    initials: 'JW',
    avatarColor: 'bg-cai-teal',
    totalXP: 7650,
    currentStreak: 21,
    quizAverage: 91,
    lessonsCompleted: 65,
    isCurrentUser: false,
    weeklyXP: 1420,
    rankChange: 'up',
  },
  {
    email: 'sarah.c@psprop.net',
    displayName: 'Sarah Chen',
    initials: 'SC',
    avatarColor: 'bg-cai-purple',
    totalXP: 6890,
    currentStreak: 15,
    quizAverage: 88,
    lessonsCompleted: 58,
    isCurrentUser: false,
    weeklyXP: 1350,
    rankChange: 'down',
  },
  {
    email: 'you@psprop.net',
    displayName: 'Sarah (You)',
    initials: 'PS',
    avatarColor: 'bg-cai-emerald',
    totalXP: 4750,
    currentStreak: 12,
    quizAverage: 84,
    lessonsCompleted: 47,
    isCurrentUser: true,
    weeklyXP: 920,
    rankChange: 'up',
  },
  {
    email: 'david.l@psprop.net',
    displayName: 'David Lee',
    initials: 'DL',
    avatarColor: 'bg-cai-amber',
    totalXP: 4200,
    currentStreak: 8,
    quizAverage: 82,
    lessonsCompleted: 40,
    isCurrentUser: false,
    weeklyXP: 780,
    rankChange: 'down',
  },
  {
    email: 'ashley.m@psprop.net',
    displayName: 'Ashley Martinez',
    initials: 'AM',
    avatarColor: 'bg-cai-red',
    totalXP: 3850,
    currentStreak: 6,
    quizAverage: 79,
    lessonsCompleted: 35,
    isCurrentUser: false,
    weeklyXP: 650,
    rankChange: 'same',
  },
  {
    email: 'kevin.r@psprop.net',
    displayName: 'Kevin Rodriguez',
    initials: 'KR',
    avatarColor: 'bg-cai-gold',
    totalXP: 3400,
    currentStreak: 4,
    quizAverage: 76,
    lessonsCompleted: 30,
    isCurrentUser: false,
    weeklyXP: 520,
    rankChange: 'up',
  },
  {
    email: 'jennifer.t@psprop.net',
    displayName: 'Jennifer Taylor',
    initials: 'JT',
    avatarColor: 'bg-cai-blue',
    totalXP: 2900,
    currentStreak: 3,
    quizAverage: 73,
    lessonsCompleted: 24,
    isCurrentUser: false,
    weeklyXP: 410,
    rankChange: 'same',
  },
  {
    email: 'michael.b@psprop.net',
    displayName: 'Michael Brown',
    initials: 'MB',
    avatarColor: 'bg-cai-teal',
    totalXP: 2100,
    currentStreak: 2,
    quizAverage: 71,
    lessonsCompleted: 18,
    isCurrentUser: false,
    weeklyXP: 290,
    rankChange: 'down',
  },
  {
    email: 'lisa.k@psprop.net',
    displayName: 'Lisa Kim',
    initials: 'LK',
    avatarColor: 'bg-cai-purple',
    totalXP: 1500,
    currentStreak: 1,
    quizAverage: 68,
    lessonsCompleted: 12,
    isCurrentUser: false,
    weeklyXP: 180,
    rankChange: 'up',
  },
]

const podiumColors = [
  {
    bg: 'bg-gradient-to-b from-cai-gold/20 to-transparent',
    border: 'border-cai-gold/40',
    text: 'text-cai-gold',
    medal: '1st',
    height: 'h-32',
  },
  {
    bg: 'bg-gradient-to-b from-zinc-400/20 to-transparent',
    border: 'border-zinc-400/40',
    text: 'text-zinc-400',
    medal: '2nd',
    height: 'h-24',
  },
  {
    bg: 'bg-gradient-to-b from-amber-700/20 to-transparent',
    border: 'border-amber-700/40',
    text: 'text-amber-700',
    medal: '3rd',
    height: 'h-20',
  },
]

function RankChangeIndicator({ change }: { change: 'up' | 'down' | 'same' }) {
  if (change === 'up')
    return <ArrowUp className="size-3.5 text-cai-emerald" />
  if (change === 'down')
    return <ArrowDown className="size-3.5 text-cai-red" />
  return <Minus className="size-3.5 text-muted-foreground" />
}

// ---------------------------------------------------------------------------
// Leaderboard Page
// ---------------------------------------------------------------------------

export default function LeaderboardPage() {
  const [period, setPeriod] = useState<'weekly' | 'alltime'>('alltime')

  // Sort by weekly or all-time XP
  const sorted = [...mockLeaderboard].sort((a, b) =>
    period === 'weekly' ? b.weeklyXP - a.weeklyXP : b.totalXP - a.totalXP
  )

  const top3 = sorted.slice(0, 3)
  const rest = sorted.slice(3)

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
          <div className="flex gap-2">
            <Button
              variant={period === 'weekly' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setPeriod('weekly')}
              className={
                period === 'weekly' ? 'bg-cai-blue hover:bg-cai-blue/90' : ''
              }
            >
              This Week
            </Button>
            <Button
              variant={period === 'alltime' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setPeriod('alltime')}
              className={
                period === 'alltime' ? 'bg-cai-blue hover:bg-cai-blue/90' : ''
              }
            >
              All Time
            </Button>
          </div>
        </div>
      </FadeIn>

      {/* ── Podium (Top 3) ───────────────────────────────────────── */}
      <FadeIn delay={80}>
        <div className="flex items-end justify-center gap-4 px-4 pb-4">
          {/* 2nd place (left) */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3, duration: 0.5 }}
            className="flex flex-1 max-w-[220px]"
          >
            <PodiumCard user={top3[1]} rank={2} period={period} />
          </motion.div>

          {/* 1st place (center, taller) */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15, duration: 0.5 }}
            className="flex flex-1 max-w-[240px]"
          >
            <PodiumCard user={top3[0]} rank={1} period={period} />
          </motion.div>

          {/* 3rd place (right) */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.45, duration: 0.5 }}
            className="flex flex-1 max-w-[220px]"
          >
            <PodiumCard user={top3[2]} rank={3} period={period} />
          </motion.div>
        </div>
      </FadeIn>

      <Separator />

      {/* ── Remaining Rankings ────────────────────────────────────── */}
      <FadeIn delay={200}>
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Full Rankings</CardTitle>
            <CardDescription>
              {period === 'weekly'
                ? 'XP earned this week'
                : 'Total XP earned'}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-1">
            <AnimatePresence mode="popLayout">
              {sorted.map((user, index) => (
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
                    <RankChangeIndicator change={user.rankChange} />
                  </div>

                  {/* Avatar & Name */}
                  <Avatar className="size-9">
                    <AvatarFallback
                      className={`${user.avatarColor} text-white text-xs`}
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
                      <AnimatedCounter
                        value={
                          period === 'weekly' ? user.weeklyXP : user.totalXP
                        }
                      />
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {period === 'weekly' ? 'this week' : 'total'} XP
                    </p>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </CardContent>
        </Card>
      </FadeIn>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Podium Card
// ---------------------------------------------------------------------------

function PodiumCard({
  user,
  rank,
  period,
}: {
  user: LeaderboardUser
  rank: 1 | 2 | 3
  period: 'weekly' | 'alltime'
}) {
  const style = podiumColors[rank - 1]
  const xp = period === 'weekly' ? user.weeklyXP : user.totalXP

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
              className={`${user.avatarColor} text-white ${
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
            <AnimatedCounter value={xp} />
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

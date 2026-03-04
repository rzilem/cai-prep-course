'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import {
  Flame,
  Zap,
  BookOpen,
  CheckCircle2,
  BarChart3,
  Clock,
  ArrowRight,
  Target,
  Calendar,
  GraduationCap,
  Heart,
  Coins,
  Star,
} from 'lucide-react'
import { motion } from 'motion/react'

import { createClient } from '@/lib/supabase/client'
import { FadeIn } from '@/components/fade-in'
import { AnimatedCounter } from '@/components/animated-counter'
import { useCelebration } from '@/components/gamification/celebrations'
import { getLevelProgress, getLevelTitle, streakMessage } from '@/lib/gamification'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { Badge } from '@/components/ui/badge'
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area'
import { Skeleton } from '@/components/ui/skeleton'

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface ApiCourse {
  id: string
  slug: string
  title: string
  credential_code: string
  difficulty: string
  estimated_hours: number
  module_count: number
  lesson_count: number
  icon_name: string | null
  color_primary: string | null
  color_secondary: string | null
  sort_order: number
  prerequisites: string[] | null
}

interface ProgressRecord {
  course_id: string
  module_id: string | null
  lesson_id: string | null
  status: string
  progress_percent: number | null
  updated_at: string
}

interface UserStats {
  total_xp: number
  current_streak: number
  longest_streak: number
  lessons_completed: number
  study_minutes: number
  avg_quiz_score: number
  quizzes_passed: number
}

// ---------------------------------------------------------------------------
// Color mapping — credential codes to Tailwind cai colour classes
// ---------------------------------------------------------------------------

const CODE_COLORS: Record<string, string> = {
  CMCA: 'bg-cai-blue',
  AMS: 'bg-cai-teal',
  PCAM: 'bg-cai-purple',
  LSM: 'bg-cai-amber',
  RS: 'bg-cai-gold',
  CIRMS: 'bg-cai-red',
  BOARD: 'bg-cai-emerald',
  TX_LAW: 'bg-cai-red',
}

function colorForCode(code: string): string {
  return CODE_COLORS[code] ?? 'bg-cai-blue'
}

// ---------------------------------------------------------------------------
// Circular Progress Component
// ---------------------------------------------------------------------------

function CircularProgress({
  value,
  max,
  size = 120,
  strokeWidth = 10,
  color = 'var(--cai-teal)',
}: {
  value: number
  max: number
  size?: number
  strokeWidth?: number
  color?: string
}) {
  const radius = (size - strokeWidth) / 2
  const circumference = 2 * Math.PI * radius
  const progress = Math.min(value / max, 1)
  const offset = circumference * (1 - progress)

  return (
    <div className="relative" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="currentColor"
          strokeWidth={strokeWidth}
          className="text-muted/30"
        />
        <motion.circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={color}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={circumference}
          initial={{ strokeDashoffset: circumference }}
          animate={{ strokeDashoffset: offset }}
          transition={{ duration: 1.2, ease: 'easeOut', delay: 0.3 }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-2xl font-bold">{value}</span>
        <span className="text-xs text-muted-foreground">/ {max} min</span>
      </div>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Track Progress Ring
// ---------------------------------------------------------------------------

function TrackProgressRing({
  progress,
  size = 56,
  color,
}: {
  progress: number
  size?: number
  color: string
}) {
  const strokeWidth = 5
  const radius = (size - strokeWidth) / 2
  const circumference = 2 * Math.PI * radius
  const offset = circumference * (1 - progress / 100)

  return (
    <div className="relative" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="currentColor"
          strokeWidth={strokeWidth}
          className="text-muted/20"
        />
        <motion.circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="currentColor"
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={circumference}
          initial={{ strokeDashoffset: circumference }}
          animate={{ strokeDashoffset: offset }}
          transition={{ duration: 1, ease: 'easeOut', delay: 0.5 }}
          className={color.replace('bg-', 'text-')}
        />
      </svg>
      <div className="absolute inset-0 flex items-center justify-center">
        <span className="text-xs font-semibold">{progress}%</span>
      </div>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Dashboard Page
// ---------------------------------------------------------------------------

interface GameState {
  hearts: number
  coins: number
  daily_goal_progress: number
  daily_goal_target: number
}

export default function DashboardPage() {
  const [selectedPeriod] = useState<'today' | 'week' | 'month'>('today')
  const { celebrate } = useCelebration()

  // Data state
  const [loading, setLoading] = useState(true)
  const [userEmail, setUserEmail] = useState<string | null>(null)
  const [courses, setCourses] = useState<ApiCourse[]>([])
  const [progressRecords, setProgressRecords] = useState<ProgressRecord[]>([])
  const [stats, setStats] = useState<UserStats | null>(null)
  const [gameState, setGameState] = useState<GameState | null>(null)

  useEffect(() => {
    async function load() {
      try {
        // Get the signed-in user
        const supabase = createClient()
        const {
          data: { user },
        } = await supabase.auth.getUser()
        const email = user?.email ?? null
        setUserEmail(email)

        // Parallel fetch: courses + progress + gamification
        const [coursesRes, progressRes, gameRes] = await Promise.all([
          fetch('/api/courses'),
          email ? fetch(`/api/progress?user_email=${encodeURIComponent(email)}`) : Promise.resolve(null),
          email ? fetch(`/api/gamification?user_email=${encodeURIComponent(email)}`) : Promise.resolve(null),
        ])

        if (coursesRes.ok) {
          const data = await coursesRes.json()
          setCourses(Array.isArray(data) ? data : [])
        }

        if (progressRes && progressRes.ok) {
          const data = await progressRes.json()
          setProgressRecords(data.progress ?? [])
          setStats(data.stats ?? null)
        }

        if (gameRes && gameRes.ok) {
          const data = await gameRes.json()
          setGameState(data)
        }
      } catch (err) {
        console.error('[Dashboard] load error:', err)
      } finally {
        setLoading(false)
      }
    }

    load()
  }, [])

  // ---------------------------------------------------------------------------
  // Derived display values
  // ---------------------------------------------------------------------------

  const displayName = userEmail ? userEmail.split('@')[0] : 'Student'
  const currentStreak = stats?.current_streak ?? 0
  const totalXp = stats?.total_xp ?? 0

  // Level info
  const levelInfo = getLevelProgress(totalXp)
  const levelTitle = getLevelTitle(levelInfo.level)

  // Stat cards — gamified
  const enrolledCourseIds = new Set(progressRecords.map((r) => r.course_id))
  const coursesStarted = enrolledCourseIds.size
  const lessonsCompleted = stats?.lessons_completed ?? 0
  const quizAverage = stats ? Math.round(stats.avg_quiz_score) : 0
  const studyHours = stats ? Math.round(stats.study_minutes / 60) : 0

  const statCards = [
    {
      label: 'Lessons Cleared',
      value: lessonsCompleted,
      suffix: '',
      icon: CheckCircle2,
      color: 'text-cai-emerald',
      bgColor: 'bg-cai-emerald/10',
    },
    {
      label: 'Total XP',
      value: totalXp,
      suffix: '',
      icon: Zap,
      color: 'text-indigo-500',
      bgColor: 'bg-indigo-500/10',
    },
    {
      label: 'Quiz Average',
      value: quizAverage,
      suffix: '%',
      icon: BarChart3,
      color: 'text-cai-purple',
      bgColor: 'bg-cai-purple/10',
    },
    {
      label: 'Coins Earned',
      value: gameState?.coins ?? 0,
      suffix: '',
      icon: Coins,
      color: 'text-amber-500',
      bgColor: 'bg-amber-500/10',
    },
  ]

  // Continue Learning: most recently updated in_progress lesson record
  const inProgressRecord = progressRecords.find(
    (r) => r.status === 'in_progress' && r.lesson_id
  )
  const continueCourse = inProgressRecord
    ? courses.find((c) => c.id === inProgressRecord.course_id)
    : null

  // Track cards: map courses → progress per course
  const trackCards = courses.map((course) => {
    const courseProgress = progressRecords.filter((r) => r.course_id === course.id)
    const completedLessons = courseProgress.filter(
      (r) => r.status === 'completed' && r.lesson_id
    ).length
    const totalLessons = course.lesson_count || 1
    const progressPct = Math.round((completedLessons / totalLessons) * 100)
    const enrolled = courseProgress.length > 0
    const color = colorForCode(course.credential_code)

    return {
      id: course.id,
      slug: course.slug,
      code: course.credential_code,
      name: course.title,
      color,
      progress: progressPct,
      enrolled,
      totalLessons: course.lesson_count,
      lessonsCompleted: completedLessons,
    }
  })

  // Daily goal: lessons completed today
  const dailyGoalProgress = gameState?.daily_goal_progress ?? 0
  const dailyGoalTarget = gameState?.daily_goal_target ?? 5
  const dailyGoalDone = dailyGoalProgress >= dailyGoalTarget

  // ---------------------------------------------------------------------------
  // Loading skeleton
  // ---------------------------------------------------------------------------

  if (loading) {
    return (
      <div className="space-y-8">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="space-y-2">
            <Skeleton className="h-9 w-64" />
            <Skeleton className="h-4 w-80" />
          </div>
          <div className="flex gap-4">
            <Skeleton className="h-10 w-32" />
            <Skeleton className="h-10 w-28" />
          </div>
        </div>
        <Skeleton className="h-28 w-full rounded-xl" />
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {[0, 1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-24 rounded-xl" />
          ))}
        </div>
        <div className="space-y-4">
          <Skeleton className="h-6 w-32" />
          <div className="flex gap-4">
            {[0, 1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-48 w-[220px] shrink-0 rounded-xl" />
            ))}
          </div>
        </div>
      </div>
    )
  }

  // ---------------------------------------------------------------------------
  // Render
  // ---------------------------------------------------------------------------

  return (
    <div className="space-y-8">
      {/* ── Welcome Section ──────────────────────────────────────────── */}
      <FadeIn delay={0}>
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">
              Welcome back, {displayName}
            </h1>
            <p className="mt-1 text-muted-foreground">
              {currentStreak > 0
                ? streakMessage(currentStreak)
                : 'Start studying to build your streak!'}
            </p>
          </div>
          <div className="flex items-center gap-3">
            {/* Level Badge */}
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: 0.3, type: 'spring' }}
              className="flex items-center gap-2 rounded-lg border border-indigo-500/30 bg-gradient-to-r from-indigo-500/10 to-purple-500/10 px-3 py-2"
            >
              <div className="flex size-8 items-center justify-center rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 text-xs font-black text-white">
                {levelInfo.level}
              </div>
              <div>
                <p className="text-sm font-semibold">{levelTitle}</p>
                <p className="text-[10px] text-muted-foreground">
                  {levelInfo.current}/{levelInfo.required} XP
                </p>
              </div>
            </motion.div>

            {/* Streak */}
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: 0.4, type: 'spring' }}
              className="flex items-center gap-2 rounded-lg border border-cai-amber/30 bg-cai-amber/10 px-3 py-2"
            >
              <Flame
                className="size-5 text-cai-amber"
                fill={currentStreak > 0 ? 'currentColor' : 'none'}
              />
              <p className="text-sm font-semibold">
                <AnimatedCounter value={currentStreak} /> day streak
              </p>
            </motion.div>
          </div>
        </div>
      </FadeIn>

      {/* ── Continue Learning ──────────────────────────────────────── */}
      {continueCourse && (
        <FadeIn delay={80}>
          <Card className="border-cai-blue/20 bg-gradient-to-br from-cai-blue/5 via-transparent to-cai-teal/5">
            <CardContent className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex-1 space-y-3">
                <div className="flex items-center gap-2">
                  <GraduationCap className="size-5 text-cai-blue" />
                  <span className="text-sm font-medium text-muted-foreground">
                    Continue Learning
                  </span>
                </div>
                <div>
                  <h3 className="text-lg font-semibold">{continueCourse.title}</h3>
                  <p className="text-sm text-muted-foreground">
                    {continueCourse.credential_code}
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <Progress
                    value={inProgressRecord?.progress_percent ?? 0}
                    className="h-2 flex-1 bg-cai-blue/20 [&>[data-slot=progress-indicator]]:bg-cai-blue"
                  />
                  <span className="text-sm font-medium text-muted-foreground">
                    {inProgressRecord?.progress_percent ?? 0}%
                  </span>
                </div>
              </div>
              <Button
                asChild
                size="lg"
                className="bg-cai-blue hover:bg-cai-blue/90"
              >
                <Link href={`/courses/${continueCourse.slug}`}>
                  Resume
                  <ArrowRight className="ml-2 size-4" />
                </Link>
              </Button>
            </CardContent>
          </Card>
        </FadeIn>
      )}

      {/* ── Stat Cards ─────────────────────────────────────────────── */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {statCards.map((stat, i) => (
          <FadeIn key={stat.label} delay={160 + i * 80}>
            <Card>
              <CardContent className="flex items-center gap-4">
                <div
                  className={`flex size-12 items-center justify-center rounded-lg ${stat.bgColor}`}
                >
                  <stat.icon className={`size-6 ${stat.color}`} />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">{stat.label}</p>
                  <p className="text-2xl font-bold">
                    <AnimatedCounter
                      value={stat.value}
                      suffix={stat.suffix}
                    />
                  </p>
                </div>
              </CardContent>
            </Card>
          </FadeIn>
        ))}
      </div>

      {/* ── Your Tracks ────────────────────────────────────────────── */}
      <FadeIn delay={520}>
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold">Your Tracks</h2>
            <Button variant="ghost" size="sm" asChild>
              <Link href="/courses">
                View All <ArrowRight className="ml-1 size-4" />
              </Link>
            </Button>
          </div>
          {trackCards.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              No tracks available yet.
            </p>
          ) : (
            <ScrollArea className="w-full whitespace-nowrap">
              <div className="flex gap-4 pb-4">
                {trackCards.map((track, i) => (
                  <motion.div
                    key={track.id}
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.6 + i * 0.1, duration: 0.4 }}
                  >
                    <Link href={`/courses/${track.slug}`}>
                      <Card className="w-[220px] cursor-pointer transition-all hover:border-cai-blue/40 hover:shadow-md hover:shadow-cai-blue/5">
                        <CardContent className="flex flex-col items-center gap-3 text-center">
                          <TrackProgressRing
                            progress={track.progress}
                            color={track.color}
                          />
                          <div>
                            <Badge
                              className={`${track.color} text-white mb-1`}
                              variant="default"
                            >
                              {track.code}
                            </Badge>
                            <p className="text-sm font-medium">{track.name}</p>
                          </div>
                          <p className="text-xs text-muted-foreground">
                            {track.lessonsCompleted}/{track.totalLessons} lessons
                          </p>
                          {track.enrolled ? (
                            <Badge
                              variant="outline"
                              className="border-cai-emerald/40 text-cai-emerald"
                            >
                              Enrolled
                            </Badge>
                          ) : (
                            <Badge variant="secondary">Not Started</Badge>
                          )}
                        </CardContent>
                      </Card>
                    </Link>
                  </motion.div>
                ))}
              </div>
              <ScrollBar orientation="horizontal" />
            </ScrollArea>
          )}
        </div>
      </FadeIn>

      {/* ── Bottom Row: Daily Goal + Recent Activity ───────────────── */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Daily Study Goal */}
        <FadeIn delay={700}>
          <Card className={dailyGoalDone ? 'border-emerald-500/30 bg-emerald-500/5' : ''}>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Target className={`size-5 ${dailyGoalDone ? 'text-emerald-500' : 'text-cai-teal'}`} />
                Daily Goal
              </CardTitle>
              <CardDescription>
                {dailyGoalDone
                  ? 'Goal complete! +50 Coins bonus earned.'
                  : `${dailyGoalTarget - dailyGoalProgress} more lesson${dailyGoalTarget - dailyGoalProgress !== 1 ? 's' : ''} to go`}
              </CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col items-center gap-4">
              <CircularProgress
                value={dailyGoalProgress}
                max={dailyGoalTarget}
                size={140}
                strokeWidth={12}
                color={dailyGoalDone ? 'var(--cai-emerald)' : 'var(--cai-teal)'}
              />
              <div className="flex items-center gap-6 text-sm text-muted-foreground">
                <div className="flex items-center gap-1">
                  <BookOpen className="size-4" />
                  {dailyGoalProgress}/{dailyGoalTarget} lessons
                </div>
                <div className="flex items-center gap-1">
                  <Flame className="size-4 text-cai-amber" />
                  {currentStreak} day streak
                </div>
              </div>
            </CardContent>
          </Card>
        </FadeIn>

        {/* Recent Activity */}
        <FadeIn delay={780}>
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="size-5 text-cai-blue" />
                Recent Activity
              </CardTitle>
              <CardDescription>Your latest study actions</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col items-center justify-center py-8 text-center text-sm text-muted-foreground gap-2">
                <BookOpen className="size-8 text-muted-foreground/40" />
                <p>Complete lessons to see activity here.</p>
              </div>
            </CardContent>
          </Card>
        </FadeIn>
      </div>
    </div>
  )
}

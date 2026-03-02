'use client'

import { useState } from 'react'
import Link from 'next/link'
import {
  Flame,
  Zap,
  BookOpen,
  CheckCircle2,
  BarChart3,
  Clock,
  ArrowRight,
  Trophy,
  Target,
  Calendar,
  GraduationCap,
  Star,
  FileText,
  Brain,
} from 'lucide-react'
import { motion } from 'motion/react'

import { FadeIn } from '@/components/fade-in'
import { AnimatedCounter } from '@/components/animated-counter'
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

// ---------------------------------------------------------------------------
// Mock Data
// ---------------------------------------------------------------------------

const mockUser = {
  displayName: 'Sarah',
  currentStreak: 12,
  totalXP: 4750,
  level: 4,
}

const mockContinueLearning = {
  courseTitle: 'CMCA Certification Prep',
  moduleTitle: 'Financial Management',
  lessonTitle: 'Reserve Fund Analysis & Planning',
  lessonSlug: 'reserve-fund-analysis',
  moduleSlug: 'financial-management',
  courseSlug: 'cmca',
  progress: 62,
  estimatedMinutes: 8,
}

const mockStats = [
  {
    label: 'Courses Started',
    value: 3,
    icon: BookOpen,
    color: 'text-cai-blue',
    bgColor: 'bg-cai-blue/10',
  },
  {
    label: 'Lessons Completed',
    value: 47,
    icon: CheckCircle2,
    color: 'text-cai-emerald',
    bgColor: 'bg-cai-emerald/10',
  },
  {
    label: 'Quiz Average',
    value: 84,
    suffix: '%',
    icon: BarChart3,
    color: 'text-cai-purple',
    bgColor: 'bg-cai-purple/10',
  },
  {
    label: 'Study Time',
    value: 23,
    suffix: 'h',
    icon: Clock,
    color: 'text-cai-amber',
    bgColor: 'bg-cai-amber/10',
  },
]

const mockTracks = [
  {
    code: 'CMCA',
    name: 'CMCA Certification',
    color: 'bg-cai-blue',
    progress: 45,
    enrolled: true,
    modules: 7,
    lessonsCompleted: 15,
    totalLessons: 35,
  },
  {
    code: 'AMS',
    name: 'AMS Specialist',
    color: 'bg-cai-teal',
    progress: 12,
    enrolled: true,
    modules: 6,
    lessonsCompleted: 3,
    totalLessons: 28,
  },
  {
    code: 'PCAM',
    name: 'PCAM Professional',
    color: 'bg-cai-purple',
    progress: 0,
    enrolled: false,
    modules: 8,
    lessonsCompleted: 0,
    totalLessons: 40,
  },
  {
    code: 'TX_LAW',
    name: 'Texas HOA Law',
    color: 'bg-cai-red',
    progress: 78,
    enrolled: true,
    modules: 5,
    lessonsCompleted: 12,
    totalLessons: 15,
  },
  {
    code: 'RS',
    name: 'Reserve Specialist',
    color: 'bg-cai-gold',
    progress: 0,
    enrolled: false,
    modules: 4,
    lessonsCompleted: 0,
    totalLessons: 20,
  },
  {
    code: 'BOARD',
    name: 'Board Leadership',
    color: 'bg-cai-emerald',
    progress: 33,
    enrolled: true,
    modules: 4,
    lessonsCompleted: 5,
    totalLessons: 16,
  },
]

const mockDailyGoal = {
  minutesToday: 22,
  goalMinutes: 30,
}

const mockActivity = [
  {
    id: '1',
    icon: CheckCircle2,
    text: 'Completed "Reserve Fund Analysis"',
    time: '2 hours ago',
    color: 'text-cai-emerald',
  },
  {
    id: '2',
    icon: Trophy,
    text: 'Scored 92% on Financial Management Quiz',
    time: '3 hours ago',
    color: 'text-cai-gold',
  },
  {
    id: '3',
    icon: Star,
    text: 'Earned "Quick Learner" achievement',
    time: '5 hours ago',
    color: 'text-cai-purple',
  },
  {
    id: '4',
    icon: FileText,
    text: 'Reviewed 15 flashcards',
    time: 'Yesterday',
    color: 'text-cai-blue',
  },
  {
    id: '5',
    icon: Brain,
    text: 'Started "Community Governance" module',
    time: 'Yesterday',
    color: 'text-cai-teal',
  },
]

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
// Track Card with Progress Ring
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

export default function DashboardPage() {
  const [selectedPeriod] = useState<'today' | 'week' | 'month'>('today')

  return (
    <div className="space-y-8">
      {/* ── Welcome Section ──────────────────────────────────────────── */}
      <FadeIn delay={0}>
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">
              Welcome back, {mockUser.displayName}
            </h1>
            <p className="mt-1 text-muted-foreground">
              Keep up the momentum — you&apos;re making great progress.
            </p>
          </div>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 rounded-lg border border-cai-amber/30 bg-cai-amber/10 px-3 py-2">
              <Flame className="size-5 text-cai-amber" />
              <div>
                <p className="text-sm font-semibold">
                  <AnimatedCounter value={mockUser.currentStreak} /> day streak
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2 rounded-lg border border-cai-blue/30 bg-cai-blue/10 px-3 py-2">
              <Zap className="size-5 text-cai-blue" />
              <div>
                <p className="text-sm font-semibold">
                  <AnimatedCounter value={mockUser.totalXP} /> XP
                </p>
              </div>
            </div>
          </div>
        </div>
      </FadeIn>

      {/* ── Continue Learning ──────────────────────────────────────── */}
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
                <h3 className="text-lg font-semibold">
                  {mockContinueLearning.lessonTitle}
                </h3>
                <p className="text-sm text-muted-foreground">
                  {mockContinueLearning.courseTitle} &bull;{' '}
                  {mockContinueLearning.moduleTitle}
                </p>
              </div>
              <div className="flex items-center gap-3">
                <Progress
                  value={mockContinueLearning.progress}
                  className="h-2 flex-1 bg-cai-blue/20 [&>[data-slot=progress-indicator]]:bg-cai-blue"
                />
                <span className="text-sm font-medium text-muted-foreground">
                  {mockContinueLearning.progress}%
                </span>
              </div>
              <p className="text-xs text-muted-foreground">
                <Clock className="mr-1 inline size-3" />~
                {mockContinueLearning.estimatedMinutes} min remaining
              </p>
            </div>
            <Button
              asChild
              size="lg"
              className="bg-cai-blue hover:bg-cai-blue/90"
            >
              <Link
                href={`/courses/${mockContinueLearning.courseSlug}/modules/${mockContinueLearning.moduleSlug}`}
              >
                Resume
                <ArrowRight className="ml-2 size-4" />
              </Link>
            </Button>
          </CardContent>
        </Card>
      </FadeIn>

      {/* ── Stat Cards ─────────────────────────────────────────────── */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {mockStats.map((stat, i) => (
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
                      suffix={stat.suffix || ''}
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
          <ScrollArea className="w-full whitespace-nowrap">
            <div className="flex gap-4 pb-4">
              {mockTracks.map((track, i) => (
                <motion.div
                  key={track.code}
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.6 + i * 0.1, duration: 0.4 }}
                >
                  <Link href={`/courses/${track.code.toLowerCase()}`}>
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
        </div>
      </FadeIn>

      {/* ── Bottom Row: Daily Goal + Recent Activity ───────────────── */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Daily Study Goal */}
        <FadeIn delay={700}>
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Target className="size-5 text-cai-teal" />
                Daily Study Goal
              </CardTitle>
              <CardDescription>
                {mockDailyGoal.minutesToday >= mockDailyGoal.goalMinutes
                  ? 'Goal reached! Great job today.'
                  : `${mockDailyGoal.goalMinutes - mockDailyGoal.minutesToday} minutes to go`}
              </CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col items-center gap-4">
              <CircularProgress
                value={mockDailyGoal.minutesToday}
                max={mockDailyGoal.goalMinutes}
                size={140}
                strokeWidth={12}
                color="var(--cai-teal)"
              />
              <div className="flex items-center gap-6 text-sm text-muted-foreground">
                <div className="flex items-center gap-1">
                  <Calendar className="size-4" />
                  {selectedPeriod === 'today' ? 'Today' : 'This Week'}
                </div>
                <div className="flex items-center gap-1">
                  <Flame className="size-4 text-cai-amber" />
                  {mockUser.currentStreak} day streak
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
              <div className="space-y-4">
                {mockActivity.map((item, i) => (
                  <motion.div
                    key={item.id}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.9 + i * 0.08, duration: 0.3 }}
                    className="flex items-start gap-3"
                  >
                    <div
                      className={`mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-full bg-muted ${item.color}`}
                    >
                      <item.icon className="size-4" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">
                        {item.text}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {item.time}
                      </p>
                    </div>
                  </motion.div>
                ))}
              </div>
            </CardContent>
          </Card>
        </FadeIn>
      </div>
    </div>
  )
}

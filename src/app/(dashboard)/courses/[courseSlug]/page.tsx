'use client'

import { use, useState, useEffect } from 'react'
import Link from 'next/link'
import {
  GraduationCap,
  Clock,
  Layers,
  FileText,
  CheckCircle2,
  Circle,
  PlayCircle,
  BookOpen,
  ArrowRight,
  BarChart3,
  Shield,
  Scale,
  ChevronRight,
  Info,
} from 'lucide-react'
import { motion } from 'motion/react'

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
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { Separator } from '@/components/ui/separator'
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion'
import { Skeleton } from '@/components/ui/skeleton'

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface ApiModule {
  id: string
  slug: string
  title: string
  description: string | null
  module_number: number
  exam_weight: number | null
  lesson_count: number
}

interface ApiCourse {
  id: string
  slug: string
  title: string
  description: string | null
  credential_code: string
  difficulty: string
  estimated_hours: number
  module_count: number
  lesson_count: number
  color_primary: string | null
  prerequisites: string[] | null
  modules: ApiModule[]
}

interface ProgressRecord {
  course_id: string
  module_id: string | null
  lesson_id: string | null
  status: string
  progress_percent: number | null
}

type ModuleStatus = 'completed' | 'in_progress' | 'not_started'

interface DisplayModule extends ApiModule {
  status: ModuleStatus
  progress: number
  completedLessons: number
  // Placeholder lesson stubs for the accordion — we only have a count, not names
  lessonStubs: { index: number; completed: boolean }[]
}

// ---------------------------------------------------------------------------
// Color mapping
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
// Large Progress Ring
// ---------------------------------------------------------------------------

function LargeProgressRing({
  progress,
  size = 160,
  strokeWidth = 14,
}: {
  progress: number
  size?: number
  strokeWidth?: number
}) {
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
          stroke="var(--cai-blue)"
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={circumference}
          initial={{ strokeDashoffset: circumference }}
          animate={{ strokeDashoffset: offset }}
          transition={{ duration: 1.5, ease: 'easeOut', delay: 0.3 }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-3xl font-bold">
          <AnimatedCounter value={progress} />%
        </span>
        <span className="text-xs text-muted-foreground">Complete</span>
      </div>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Module Status Icon
// ---------------------------------------------------------------------------

function ModuleStatusIcon({ status }: { status: ModuleStatus }) {
  if (status === 'completed')
    return <CheckCircle2 className="size-5 text-cai-emerald" />
  if (status === 'in_progress')
    return <PlayCircle className="size-5 text-cai-blue" />
  return <Circle className="size-5 text-muted-foreground/40" />
}

// ---------------------------------------------------------------------------
// Loading Skeleton
// ---------------------------------------------------------------------------

function CourseDetailSkeleton() {
  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-8 lg:flex-row lg:items-start">
        <div className="flex-1 space-y-6">
          <Skeleton className="h-4 w-40" />
          <div className="space-y-3">
            <Skeleton className="h-6 w-20" />
            <Skeleton className="h-9 w-3/4" />
            <Skeleton className="h-16 w-full" />
          </div>
          <div className="flex gap-3">
            {[0, 1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-9 w-28 rounded-md" />
            ))}
          </div>
        </div>
        <div className="flex flex-col items-center gap-6 lg:w-[260px]">
          <Skeleton className="size-40 rounded-full" />
          <Skeleton className="h-4 w-40" />
          <Skeleton className="h-11 w-full rounded-lg" />
        </div>
      </div>
      <div className="space-y-3">
        {[0, 1, 2, 3].map((i) => (
          <Skeleton key={i} className="h-16 w-full rounded-lg" />
        ))}
      </div>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Course Overview Page
// ---------------------------------------------------------------------------

export default function CourseOverviewPage({
  params,
}: {
  params: Promise<{ courseSlug: string }>
}) {
  const { courseSlug } = use(params)

  const [loading, setLoading] = useState(true)
  const [course, setCourse] = useState<ApiCourse | null>(null)
  const [modules, setModules] = useState<DisplayModule[]>([])
  const [overallProgress, setOverallProgress] = useState(0)
  const [totalLessonsCompleted, setTotalLessonsCompleted] = useState(0)
  const [enrolled, setEnrolled] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function load() {
      try {
        // Get user
        const supabase = createClient()
        const {
          data: { user },
        } = await supabase.auth.getUser()
        const email = user?.email ?? null

        // Parallel fetch: course detail + progress
        const [courseRes, progressRes] = await Promise.all([
          fetch(`/api/courses/${courseSlug}`),
          email
            ? fetch(`/api/progress?user_email=${encodeURIComponent(email)}`)
            : Promise.resolve(null),
        ])

        if (!courseRes.ok) {
          setError('Course not found.')
          return
        }

        const apiCourse: ApiCourse = await courseRes.json()
        setCourse(apiCourse)

        const progressRecords: ProgressRecord[] =
          progressRes && progressRes.ok
            ? (await progressRes.json()).progress ?? []
            : []

        // Check enrollment
        const courseProgress = progressRecords.filter(
          (r) => r.course_id === apiCourse.id
        )
        setEnrolled(courseProgress.length > 0)

        // Build per-module progress
        const apiModules: ApiModule[] = apiCourse.modules ?? []
        const totalLessons = apiCourse.lesson_count || 1
        let completedTotal = 0

        const displayModules: DisplayModule[] = apiModules.map((mod) => {
          const modProgress = progressRecords.filter(
            (r) => r.course_id === apiCourse.id && r.module_id === mod.id
          )
          const completedLessonsInModule = modProgress.filter(
            (r) => r.status === 'completed' && r.lesson_id
          ).length
          const lessonCount = mod.lesson_count || 1
          const progressPct = Math.round(
            (completedLessonsInModule / lessonCount) * 100
          )

          let status: ModuleStatus = 'not_started'
          if (completedLessonsInModule >= lessonCount && lessonCount > 0) {
            status = 'completed'
          } else if (completedLessonsInModule > 0) {
            status = 'in_progress'
          }

          completedTotal += completedLessonsInModule

          // Build stub array so accordion can show progress indicators
          // without needing individual lesson slugs/titles from API
          const lessonStubs = Array.from({ length: mod.lesson_count }, (_, idx) => ({
            index: idx,
            completed: idx < completedLessonsInModule,
          }))

          return {
            ...mod,
            status,
            progress: progressPct,
            completedLessons: completedLessonsInModule,
            lessonStubs,
          }
        })

        setModules(displayModules)
        setTotalLessonsCompleted(completedTotal)
        setOverallProgress(Math.round((completedTotal / totalLessons) * 100))
      } catch (err) {
        console.error('[CourseOverview] load error:', err)
        setError('Failed to load course. Please try again.')
      } finally {
        setLoading(false)
      }
    }

    load()
  }, [courseSlug])

  // ── Loading ───────────────────────────────────────────────────────────────
  if (loading) {
    return <CourseDetailSkeleton />
  }

  // ── Error ─────────────────────────────────────────────────────────────────
  if (error || !course) {
    return (
      <div className="flex flex-col items-center gap-4 py-16 text-center">
        <BookOpen className="size-12 text-muted-foreground" />
        <p className="text-lg text-muted-foreground">
          {error ?? 'Course not found.'}
        </p>
        <Button asChild variant="outline">
          <Link href="/courses">Back to Courses</Link>
        </Button>
      </div>
    )
  }

  const courseColor = colorForCode(course.credential_code)
  const prerequisites: string[] = Array.isArray(course.prerequisites)
    ? course.prerequisites
    : []

  // First in-progress module slug for "Continue Learning" button
  const resumeModule =
    modules.find((m) => m.status === 'in_progress') ?? modules[0]

  // Max exam weight for bar scaling
  const maxExamWeight = Math.max(...modules.map((m) => m.exam_weight ?? 0), 1)

  return (
    <div className="space-y-8">
      {/* ── Hero Section ───────────────────────────────────────────── */}
      <FadeIn delay={0}>
        <div className="flex flex-col gap-8 lg:flex-row lg:items-start">
          {/* Left - Info */}
          <div className="flex-1 space-y-6">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Link
                href="/courses"
                className="hover:text-foreground transition-colors"
              >
                Courses
              </Link>
              <ChevronRight className="size-4" />
              <span className="text-foreground font-medium">
                {course.credential_code}
              </span>
            </div>

            <div>
              <Badge className={`${courseColor} text-white mb-3`}>
                {course.credential_code}
              </Badge>
              <h1 className="text-3xl font-bold tracking-tight">
                {course.title}
              </h1>
              {course.description && (
                <p className="mt-3 text-muted-foreground leading-relaxed">
                  {course.description}
                </p>
              )}
            </div>

            {/* Metadata chips */}
            <div className="flex flex-wrap gap-3">
              <div className="flex items-center gap-1.5 rounded-md border px-3 py-1.5 text-sm">
                <BarChart3 className="size-4 text-cai-blue" />
                <span className="capitalize">{course.difficulty}</span>
              </div>
              <div className="flex items-center gap-1.5 rounded-md border px-3 py-1.5 text-sm">
                <Clock className="size-4 text-cai-amber" />
                {course.estimated_hours} hours
              </div>
              <div className="flex items-center gap-1.5 rounded-md border px-3 py-1.5 text-sm">
                <Layers className="size-4 text-cai-teal" />
                {course.module_count} modules
              </div>
              <div className="flex items-center gap-1.5 rounded-md border px-3 py-1.5 text-sm">
                <FileText className="size-4 text-cai-purple" />
                {course.lesson_count} lessons
              </div>
            </div>

            {/* Exam info */}
            <div className="rounded-lg border bg-muted/30 p-4 space-y-2">
              <h3 className="text-sm font-semibold flex items-center gap-2">
                <GraduationCap className="size-4 text-cai-blue" />
                Exam Information
              </h3>
              <div className="grid grid-cols-2 gap-2 text-sm">
                <div>
                  <span className="text-muted-foreground">Format:</span>{' '}
                  Multiple-choice questions
                </div>
                <div>
                  <span className="text-muted-foreground">Credential:</span>{' '}
                  {course.credential_code}
                </div>
              </div>
            </div>
          </div>

          {/* Right - Progress Ring & CTA */}
          <div className="flex flex-col items-center gap-6 lg:w-[260px]">
            <LargeProgressRing progress={overallProgress} />

            <div className="text-center text-sm text-muted-foreground">
              <AnimatedCounter value={totalLessonsCompleted} /> of{' '}
              {course.lesson_count} lessons completed
            </div>

            {enrolled ? (
              <Button
                asChild
                size="lg"
                className="w-full bg-cai-blue hover:bg-cai-blue/90"
              >
                <Link
                  href={`/courses/${courseSlug}/modules/${resumeModule?.slug ?? ''}`}
                >
                  Continue Learning
                  <ArrowRight className="ml-2 size-4" />
                </Link>
              </Button>
            ) : (
              <Button
                asChild
                size="lg"
                className="w-full bg-cai-blue hover:bg-cai-blue/90"
              >
                <Link href={`/courses/${courseSlug}/modules/${modules[0]?.slug ?? ''}`}>
                  Start Course
                  <ArrowRight className="ml-2 size-4" />
                </Link>
              </Button>
            )}

            {/* Progress bar */}
            {enrolled && (
              <div className="w-full space-y-1">
                <Progress
                  value={overallProgress}
                  className="h-2 bg-cai-blue/20 [&>[data-slot=progress-indicator]]:bg-cai-blue"
                />
              </div>
            )}
          </div>
        </div>
      </FadeIn>

      {/* ── Prerequisites ──────────────────────────────────────────── */}
      {prerequisites.length > 0 && (
        <FadeIn delay={100}>
          <Card className="border-cai-amber/30">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <Shield className="size-5 text-cai-amber" />
                Prerequisites
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-3">
                {prerequisites.map((pre) => (
                  <div
                    key={pre}
                    className="flex items-center gap-2 rounded-md border px-3 py-2"
                  >
                    <CheckCircle2 className="size-4 text-cai-emerald" />
                    <span className="text-sm">{pre}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </FadeIn>
      )}

      {/* ── Texas Law Callout (shown for CMCA and TX_LAW) ──────────── */}
      {['CMCA', 'TX_LAW'].includes(course.credential_code) && (
        <FadeIn delay={150}>
          <Card className="border-cai-red/20 bg-gradient-to-r from-cai-red/5 to-transparent">
            <CardContent className="flex items-start gap-4">
              <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-cai-red/10">
                <Scale className="size-5 text-cai-red" />
              </div>
              <div>
                <h3 className="font-semibold">Texas Law Integration</h3>
                <p className="mt-1 text-sm text-muted-foreground">
                  This course includes Texas-specific law callouts throughout
                  each module, covering Property Code Chapter 209, deed
                  restriction enforcement, and state-mandated compliance
                  requirements. Look for the{' '}
                  <Scale className="inline size-3.5 text-cai-red" /> icon in
                  lessons for Texas-specific content.
                </p>
              </div>
            </CardContent>
          </Card>
        </FadeIn>
      )}

      <Separator />

      {/* ── Module List (Accordion) ────────────────────────────────── */}
      <FadeIn delay={200}>
        <div className="space-y-4">
          <h2 className="text-xl font-semibold">Course Modules</h2>
          {modules.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              No modules available yet.
            </p>
          ) : (
            <Accordion
              type="multiple"
              defaultValue={modules
                .filter((m) => m.status === 'in_progress')
                .map((m) => m.slug)}
              className="space-y-3"
            >
              {modules.map((mod, i) => (
                <motion.div
                  key={mod.slug}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.25 + i * 0.06, duration: 0.3 }}
                >
                  <AccordionItem
                    value={mod.slug}
                    className="rounded-lg border px-4 data-[state=open]:border-cai-blue/30"
                  >
                    <AccordionTrigger className="hover:no-underline">
                      <div className="flex flex-1 items-center gap-4 pr-4">
                        <ModuleStatusIcon status={mod.status} />
                        <div className="flex-1 text-left">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="font-semibold">
                              Module {mod.module_number}: {mod.title}
                            </span>
                            {mod.exam_weight != null && (
                              <Badge
                                variant="secondary"
                                className="text-xs px-1.5 py-0"
                              >
                                {mod.exam_weight}% of exam
                              </Badge>
                            )}
                          </div>
                          <p className="text-xs text-muted-foreground mt-0.5">
                            {mod.lesson_count} lessons &bull;{' '}
                            {mod.completedLessons}/{mod.lesson_count} completed
                          </p>
                        </div>
                        {mod.status !== 'not_started' && (
                          <div className="hidden sm:block w-24">
                            <Progress
                              value={mod.progress}
                              className="h-1.5 bg-cai-blue/20 [&>[data-slot=progress-indicator]]:bg-cai-blue"
                            />
                          </div>
                        )}
                      </div>
                    </AccordionTrigger>
                    <AccordionContent className="pb-4">
                      {mod.description && (
                        <p className="mb-4 text-sm text-muted-foreground pl-9">
                          {mod.description}
                        </p>
                      )}
                      {/* Link to module overview page — lessons are listed there */}
                      <div className="pl-9">
                        <Link
                          href={`/courses/${courseSlug}/modules/${mod.slug}`}
                          className="flex items-center gap-3 rounded-md px-3 py-2 text-sm transition-colors hover:bg-muted group"
                        >
                          <BookOpen className="size-4 text-cai-blue shrink-0" />
                          <span className="flex-1">
                            View {mod.lesson_count} lesson
                            {mod.lesson_count !== 1 ? 's' : ''}
                          </span>
                          <ArrowRight className="size-3.5 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                        </Link>
                        {/* Progress indicator stubs */}
                        {mod.lessonStubs.length > 0 && (
                          <div className="mt-2 flex flex-wrap gap-1.5 px-3">
                            {mod.lessonStubs.map((stub) => (
                              <div
                                key={stub.index}
                                className={`size-2.5 rounded-full ${
                                  stub.completed
                                    ? 'bg-cai-emerald'
                                    : 'bg-muted-foreground/20'
                                }`}
                                title={
                                  stub.completed
                                    ? 'Completed'
                                    : 'Not yet completed'
                                }
                              />
                            ))}
                          </div>
                        )}
                      </div>
                    </AccordionContent>
                  </AccordionItem>
                </motion.div>
              ))}
            </Accordion>
          )}
        </div>
      </FadeIn>

      {/* ── Domain Weight Summary ──────────────────────────────────── */}
      {modules.some((m) => m.exam_weight != null) && (
        <FadeIn delay={400}>
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <Info className="size-5 text-cai-blue" />
                Exam Domain Weights
              </CardTitle>
              <CardDescription>
                Focus your study time on the highest-weighted domains
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {modules.map((mod) => (
                  <div key={mod.slug} className="flex items-center gap-3">
                    <span className="w-[200px] text-sm truncate">
                      {mod.title}
                    </span>
                    <div className="flex-1">
                      <div className="h-3 rounded-full bg-muted overflow-hidden">
                        <motion.div
                          className="h-full rounded-full bg-cai-blue"
                          initial={{ width: 0 }}
                          animate={{
                            width: `${((mod.exam_weight ?? 0) / maxExamWeight) * 100}%`,
                          }}
                          transition={{
                            duration: 0.8,
                            ease: 'easeOut',
                            delay: 0.5,
                          }}
                        />
                      </div>
                    </div>
                    <span className="w-12 text-right text-sm font-medium">
                      {mod.exam_weight != null ? `${mod.exam_weight}%` : '—'}
                    </span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </FadeIn>
      )}
    </div>
  )
}

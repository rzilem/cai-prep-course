'use client'

import { use, useEffect, useState } from 'react'
import Link from 'next/link'
import {
  ArrowLeft,
  BookOpen,
  CheckCircle2,
  ChevronRight,
  Circle,
  Clock,
  Play,
  Scale,
} from 'lucide-react'
import { motion } from 'motion/react'

import { FadeIn } from '@/components/fade-in'
import { createClient } from '@/lib/supabase/client'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Separator } from '@/components/ui/separator'

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface Lesson {
  id: string
  slug: string
  title: string
  sort_order: number
  estimated_minutes: number
  content_markdown: string | null
  key_points: string[] | null
  texas_law_callouts: TexasLawCallout[] | null
}

interface TexasLawCallout {
  statute: string
  title: string
  description: string
  severity: 'info' | 'warning' | 'critical'
}

interface ModuleData {
  id: string
  slug: string
  title: string
  description: string | null
  sort_order: number
  lesson_count: number
  lessons: Lesson[]
  course: {
    id: string
    slug: string
    title: string
    credential_code: string
  }
}

interface ProgressEntry {
  lesson_id: string
  status: string
}

// ---------------------------------------------------------------------------
// Skeleton
// ---------------------------------------------------------------------------

function ModulePageSkeleton() {
  return (
    <div className="space-y-6 animate-pulse">
      <div className="h-4 w-64 rounded bg-muted" />
      <div className="h-8 w-80 rounded bg-muted" />
      <div className="h-4 w-48 rounded bg-muted" />
      <div className="grid gap-3">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="h-16 rounded-xl bg-muted" />
        ))}
      </div>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Module Overview Page
// ---------------------------------------------------------------------------

export default function ModuleOverviewPage({
  params,
}: {
  params: Promise<{ courseSlug: string; moduleSlug: string }>
}) {
  const { courseSlug, moduleSlug } = use(params)

  const [moduleData, setModuleData] = useState<ModuleData | null>(null)
  const [completedLessonIds, setCompletedLessonIds] = useState<Set<string>>(
    new Set()
  )
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function load() {
      try {
        // Fetch module + lessons
        const res = await fetch(
          `/api/courses/${courseSlug}/modules/${moduleSlug}`
        )
        if (!res.ok) {
          throw new Error(`Failed to load module (${res.status})`)
        }
        const data: ModuleData = await res.json()
        setModuleData(data)

        // Fetch user progress
        const supabase = createClient()
        const {
          data: { user },
        } = await supabase.auth.getUser()

        if (user?.email) {
          const progressRes = await fetch(
            `/api/progress?user_email=${encodeURIComponent(user.email)}`
          )
          if (progressRes.ok) {
            const progressData: ProgressEntry[] = await progressRes.json()
            const completed = new Set(
              progressData
                .filter((p) => p.status === 'completed')
                .map((p) => p.lesson_id)
            )
            setCompletedLessonIds(completed)
          }
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load module')
      } finally {
        setLoading(false)
      }
    }

    load()
  }, [courseSlug, moduleSlug])

  if (loading) return <ModulePageSkeleton />

  if (error || !moduleData) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center space-y-3">
        <Scale className="size-10 text-muted-foreground" />
        <p className="font-semibold">Could not load module</p>
        <p className="text-sm text-muted-foreground">{error ?? 'Module not found'}</p>
        <Link
          href={`/courses/${courseSlug}`}
          className="text-sm text-cai-blue underline-offset-2 hover:underline"
        >
          Back to course
        </Link>
      </div>
    )
  }

  const lessons = [...moduleData.lessons].sort(
    (a, b) => a.sort_order - b.sort_order
  )
  const completedCount = lessons.filter((l) =>
    completedLessonIds.has(l.id)
  ).length
  const moduleProgress =
    lessons.length > 0
      ? Math.round((completedCount / lessons.length) * 100)
      : 0

  const totalMinutes = lessons.reduce(
    (sum, l) => sum + (l.estimated_minutes ?? 0),
    0
  )

  return (
    <div className="space-y-8">
      {/* ── Breadcrumb ──────────────────────────────────────────── */}
      <FadeIn delay={0}>
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Link
            href={`/courses/${courseSlug}`}
            className="flex items-center gap-1 hover:text-foreground transition-colors"
          >
            <ArrowLeft className="size-3.5" />
            {moduleData.course.title}
          </Link>
          <ChevronRight className="size-3.5" />
          <span className="text-foreground font-medium truncate">
            {moduleData.title}
          </span>
        </div>
      </FadeIn>

      {/* ── Module Header ────────────────────────────────────────── */}
      <FadeIn delay={60}>
        <div className="space-y-4">
          <div className="flex items-start gap-4">
            <div className="flex size-12 shrink-0 items-center justify-center rounded-xl bg-cai-blue/10 border border-cai-blue/20">
              <BookOpen className="size-6 text-cai-blue" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="text-2xl font-bold">{moduleData.title}</h1>
                <Badge variant="secondary" className="text-xs">
                  {moduleData.course.credential_code}
                </Badge>
              </div>
              {moduleData.description && (
                <p className="mt-1 text-sm text-muted-foreground leading-relaxed">
                  {moduleData.description}
                </p>
              )}
            </div>
          </div>

          {/* Stats row */}
          <div className="flex items-center gap-4 text-sm text-muted-foreground flex-wrap">
            <span className="flex items-center gap-1.5">
              <BookOpen className="size-4" />
              {lessons.length} lessons
            </span>
            <span className="flex items-center gap-1.5">
              <Clock className="size-4" />
              {totalMinutes} min total
            </span>
            <span className="flex items-center gap-1.5">
              <CheckCircle2 className="size-4 text-cai-emerald" />
              {completedCount}/{lessons.length} completed
            </span>
          </div>

          {/* Progress bar */}
          <div className="space-y-1.5">
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>Module progress</span>
              <span className="font-medium text-foreground">
                {moduleProgress}%
              </span>
            </div>
            <Progress
              value={moduleProgress}
              className="h-2 bg-cai-blue/20 [&>[data-slot=progress-indicator]]:bg-cai-blue"
            />
          </div>
        </div>
      </FadeIn>

      <Separator />

      {/* ── Lesson List ──────────────────────────────────────────── */}
      <FadeIn delay={120}>
        <div className="space-y-3">
          <h2 className="text-base font-semibold">Lessons</h2>

          <div className="space-y-2">
            {lessons.map((lesson, i) => {
              const isCompleted = completedLessonIds.has(lesson.id)
              const lessonHref = `/courses/${courseSlug}/modules/${moduleSlug}/${lesson.slug}`
              const hasTexasLaw =
                lesson.texas_law_callouts &&
                lesson.texas_law_callouts.length > 0
              const keyPointCount = lesson.key_points?.length ?? 0

              return (
                <motion.div
                  key={lesson.id}
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.06, duration: 0.3 }}
                >
                  <Link href={lessonHref}>
                    <Card className="group cursor-pointer transition-all duration-200 hover:border-cai-blue/40 hover:bg-cai-blue/5">
                      <CardContent className="flex items-center gap-4 py-4">
                        {/* Status icon */}
                        <div className="shrink-0">
                          {isCompleted ? (
                            <div className="flex size-9 items-center justify-center rounded-full bg-cai-emerald/15 border border-cai-emerald/30">
                              <CheckCircle2 className="size-5 text-cai-emerald" />
                            </div>
                          ) : (
                            <div className="flex size-9 items-center justify-center rounded-full bg-muted border border-border group-hover:bg-cai-blue/10 group-hover:border-cai-blue/30 transition-colors">
                              <Play className="size-4 text-muted-foreground group-hover:text-cai-blue ml-0.5 transition-colors" />
                            </div>
                          )}
                        </div>

                        {/* Lesson info */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="font-medium text-sm group-hover:text-cai-blue transition-colors">
                              {i + 1}. {lesson.title}
                            </span>
                            {isCompleted && (
                              <Badge
                                variant="secondary"
                                className="text-[10px] px-1.5 py-0 bg-cai-emerald/10 text-cai-emerald border-cai-emerald/20"
                              >
                                Done
                              </Badge>
                            )}
                          </div>
                          <div className="mt-0.5 flex items-center gap-3 text-xs text-muted-foreground">
                            <span className="flex items-center gap-1">
                              <Clock className="size-3" />
                              {lesson.estimated_minutes} min
                            </span>
                            {keyPointCount > 0 && (
                              <span>{keyPointCount} key points</span>
                            )}
                            {hasTexasLaw && (
                              <span className="flex items-center gap-1 text-cai-amber">
                                <Scale className="size-3" />
                                Texas law
                              </span>
                            )}
                          </div>
                        </div>

                        {/* Arrow */}
                        <ChevronRight className="size-4 text-muted-foreground group-hover:text-cai-blue group-hover:translate-x-0.5 transition-all shrink-0" />
                      </CardContent>
                    </Card>
                  </Link>
                </motion.div>
              )
            })}
          </div>
        </div>
      </FadeIn>

      {/* ── Resume / Start CTA ───────────────────────────────────── */}
      {lessons.length > 0 && (
        <FadeIn delay={200}>
          <Card className="border-cai-blue/20 bg-cai-blue/5">
            <CardHeader className="pb-3">
              <CardTitle className="text-base">
                {completedCount === 0
                  ? 'Ready to start?'
                  : completedCount === lessons.length
                  ? 'Module complete!'
                  : 'Continue where you left off'}
              </CardTitle>
              <CardDescription>
                {completedCount === lessons.length
                  ? 'You have completed all lessons in this module.'
                  : `${lessons.length - completedCount} lesson${
                      lessons.length - completedCount !== 1 ? 's' : ''
                    } remaining`}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {completedCount < lessons.length && (() => {
                // Find first incomplete lesson
                const nextLesson =
                  lessons.find((l) => !completedLessonIds.has(l.id)) ??
                  lessons[0]
                return (
                  <Link
                    href={`/courses/${courseSlug}/modules/${moduleSlug}/${nextLesson.slug}`}
                    className="inline-flex items-center gap-2 rounded-lg bg-cai-blue px-4 py-2 text-sm font-medium text-white hover:bg-cai-blue/90 transition-colors"
                  >
                    <Play className="size-4" />
                    {completedCount === 0 ? 'Start lesson 1' : 'Resume'}
                  </Link>
                )
              })()}
              {completedCount === lessons.length && (
                <Link
                  href={`/courses/${courseSlug}`}
                  className="inline-flex items-center gap-2 rounded-lg bg-cai-emerald px-4 py-2 text-sm font-medium text-white hover:bg-cai-emerald/90 transition-colors"
                >
                  <CheckCircle2 className="size-4" />
                  Back to course
                </Link>
              )}
            </CardContent>
          </Card>
        </FadeIn>
      )}
    </div>
  )
}

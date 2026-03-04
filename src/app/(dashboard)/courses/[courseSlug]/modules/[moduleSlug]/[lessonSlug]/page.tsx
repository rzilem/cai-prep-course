'use client'

import { use, useCallback, useEffect, useState } from 'react'
import Link from 'next/link'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import {
  ArrowLeft,
  BookOpen,
  Check,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Circle,
  Clock,
  HelpCircle,
  ListChecks,
  Play,
  Scale,
} from 'lucide-react'
import { motion, AnimatePresence } from 'motion/react'

import { FadeIn } from '@/components/fade-in'
import { VideoPlayer } from '@/components/video-player'
import { useSound } from '@/components/providers'
import { createClient } from '@/lib/supabase/client'
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface TexasLawCallout {
  statute: string
  title: string
  description: string
  severity: 'info' | 'warning' | 'critical'
}

interface Lesson {
  id: string
  slug: string
  title: string
  sort_order: number
  estimated_minutes: number
  content_markdown: string | null
  key_points: string[] | null
  texas_law_callouts: TexasLawCallout[] | null
  video_url: string | null
  audio_url: string | null
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
// Severity styling (matches existing pattern)
// ---------------------------------------------------------------------------

const severityStyles = {
  info: {
    border: 'border-cai-blue/30',
    bg: 'bg-cai-blue/5',
    icon: 'text-cai-blue',
    badge: 'bg-cai-blue/15 text-cai-blue',
  },
  warning: {
    border: 'border-cai-amber/30',
    bg: 'bg-cai-amber/5',
    icon: 'text-cai-amber',
    badge: 'bg-cai-amber/15 text-cai-amber',
  },
  critical: {
    border: 'border-cai-red/30',
    bg: 'bg-cai-red/5',
    icon: 'text-cai-red',
    badge: 'bg-cai-red/15 text-cai-red',
  },
}

// ---------------------------------------------------------------------------
// Skeleton
// ---------------------------------------------------------------------------

function LessonPlayerSkeleton() {
  return (
    <div className="space-y-6 animate-pulse">
      <div className="h-4 w-72 rounded bg-muted" />
      <div className="aspect-video w-full rounded-xl bg-muted" />
      <div className="h-8 w-64 rounded bg-muted" />
      <div className="h-48 w-full rounded-xl bg-muted" />
    </div>
  )
}

// ---------------------------------------------------------------------------
// Lesson Player Page
// ---------------------------------------------------------------------------

export default function LessonPlayerPage({
  params,
}: {
  params: Promise<{
    courseSlug: string
    moduleSlug: string
    lessonSlug: string
  }>
}) {
  const { courseSlug, moduleSlug, lessonSlug } = use(params)
  const { playSound } = useSound()

  const [moduleData, setModuleData] = useState<ModuleData | null>(null)
  const [userEmail, setUserEmail] = useState<string | null>(null)
  const [completedLessonIds, setCompletedLessonIds] = useState<Set<string>>(
    new Set()
  )
  const [isMarkingComplete, setIsMarkingComplete] = useState(false)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function load() {
      try {
        // Fetch module data (contains all lessons with content)
        const res = await fetch(
          `/api/courses/${courseSlug}/modules/${moduleSlug}`
        )
        if (!res.ok) {
          throw new Error(`Failed to load lesson (${res.status})`)
        }
        const data: ModuleData = await res.json()
        setModuleData(data)

        // Fetch user + progress
        const supabase = createClient()
        const {
          data: { user },
        } = await supabase.auth.getUser()

        if (user?.email) {
          setUserEmail(user.email)
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
        setError(
          err instanceof Error ? err.message : 'Failed to load lesson'
        )
      } finally {
        setLoading(false)
      }
    }

    load()
  }, [courseSlug, moduleSlug])

  const handleMarkComplete = useCallback(async () => {
    if (!moduleData || !userEmail || isMarkingComplete) return

    const currentLesson = moduleData.lessons.find((l) => l.slug === lessonSlug)
    if (!currentLesson) return

    setIsMarkingComplete(true)
    try {
      const res = await fetch('/api/progress', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user_email: userEmail,
          course_id: moduleData.course.id,
          module_id: moduleData.id,
          lesson_id: currentLesson.id,
          status: 'completed',
          progress_percent: 100,
        }),
      })
      if (res.ok) {
        setCompletedLessonIds((prev) => new Set([...prev, currentLesson.id]))
        playSound('correct')
      }
    } catch {
      // Silently fail — don't block the UX
    } finally {
      setIsMarkingComplete(false)
    }
  }, [moduleData, userEmail, lessonSlug, isMarkingComplete, playSound])

  if (loading) return <LessonPlayerSkeleton />

  if (error || !moduleData) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center space-y-3">
        <Scale className="size-10 text-muted-foreground" />
        <p className="font-semibold">Could not load lesson</p>
        <p className="text-sm text-muted-foreground">
          {error ?? 'Lesson not found'}
        </p>
        <Link
          href={`/courses/${courseSlug}/modules/${moduleSlug}`}
          className="text-sm text-cai-blue underline-offset-2 hover:underline"
        >
          Back to module
        </Link>
      </div>
    )
  }

  const lessons = [...moduleData.lessons].sort(
    (a, b) => a.sort_order - b.sort_order
  )
  const currentIndex = lessons.findIndex((l) => l.slug === lessonSlug)
  const currentLesson = lessons[currentIndex] ?? null
  const previousLesson = currentIndex > 0 ? lessons[currentIndex - 1] : null
  const nextLesson =
    currentIndex < lessons.length - 1 ? lessons[currentIndex + 1] : null

  if (!currentLesson) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center space-y-3">
        <Circle className="size-10 text-muted-foreground" />
        <p className="font-semibold">Lesson not found</p>
        <Link
          href={`/courses/${courseSlug}/modules/${moduleSlug}`}
          className="text-sm text-cai-blue underline-offset-2 hover:underline"
        >
          Back to module
        </Link>
      </div>
    )
  }

  const isCompleted = completedLessonIds.has(currentLesson.id)
  const completedCount = lessons.filter((l) =>
    completedLessonIds.has(l.id)
  ).length
  const moduleProgress =
    lessons.length > 0
      ? Math.round((completedCount / lessons.length) * 100)
      : 0

  const keyPoints: string[] = Array.isArray(currentLesson.key_points)
    ? currentLesson.key_points
    : []
  const texasLawCallouts: TexasLawCallout[] = Array.isArray(
    currentLesson.texas_law_callouts
  )
    ? currentLesson.texas_law_callouts
    : []

  return (
    <div className="space-y-6">
      {/* ── Breadcrumb ─────────────────────────────────────────────── */}
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
          <Link
            href={`/courses/${courseSlug}/modules/${moduleSlug}`}
            className="hover:text-foreground transition-colors"
          >
            {moduleData.title}
          </Link>
          <ChevronRight className="size-3.5" />
          <span className="text-foreground font-medium truncate">
            {currentLesson.title}
          </span>
        </div>
      </FadeIn>

      <div className="flex flex-col gap-6 xl:flex-row">
        {/* ── Main Content Area ─────────────────────────────────────── */}
        <div className="flex-1 space-y-6">
          {/* Video / Remotion Player */}
          <FadeIn delay={60}>
            {currentLesson.video_url ? (
              <VideoPlayer
                lessonTitle={currentLesson.title}
                moduleTitle={moduleData.title}
                courseTitle={moduleData.course.title}
                credentialCode={moduleData.course.credential_code}
                keyPoints={keyPoints}
                texasLawCallout={texasLawCallouts[0] ?? null}
                videoUrl={currentLesson.video_url}
                onComplete={handleMarkComplete}
              />
            ) : (
              // Placeholder when no video URL exists yet
              <div className="relative aspect-video w-full overflow-hidden rounded-xl border bg-zinc-950">
                <div className="absolute inset-0 flex flex-col items-center justify-center gap-4">
                  <motion.div
                    whileHover={{ scale: 1.08 }}
                    whileTap={{ scale: 0.95 }}
                    className="flex size-20 cursor-pointer items-center justify-center rounded-full bg-cai-blue/20 backdrop-blur-sm border border-cai-blue/30 transition-colors hover:bg-cai-blue/30"
                  >
                    <Play className="size-8 text-cai-blue ml-1" />
                  </motion.div>
                  <p className="text-sm text-zinc-500">
                    Video lesson coming soon — media pipeline pending
                  </p>
                </div>
                {/* Decorative controls bar */}
                <div className="absolute bottom-0 left-0 right-0 flex items-center gap-3 bg-gradient-to-t from-black/80 to-transparent px-4 pb-3 pt-8 pointer-events-none select-none">
                  <Play className="size-4 text-white/40" />
                  <div className="flex-1 h-1 rounded-full bg-white/20">
                    <div className="h-full w-0 rounded-full bg-cai-blue" />
                  </div>
                  <span className="text-xs text-white/40">
                    0:00 / {currentLesson.estimated_minutes}:00
                  </span>
                </div>
              </div>
            )}
          </FadeIn>

          {/* Audio bar */}
          {currentLesson.audio_url && (
            <FadeIn delay={80}>
              <div className="rounded-xl border bg-muted/30 p-3">
                <p className="text-xs text-muted-foreground mb-2 font-medium">
                  Audio version
                </p>
                <audio
                  src={currentLesson.audio_url}
                  controls
                  className="w-full h-8"
                />
              </div>
            </FadeIn>
          )}

          {/* Lesson Title + Mark Complete */}
          <FadeIn delay={120}>
            <div className="flex items-start justify-between gap-4">
              <div>
                <h1 className="text-2xl font-bold">{currentLesson.title}</h1>
                <p className="mt-1 text-sm text-muted-foreground">
                  {moduleData.title} &bull;{' '}
                  <Clock className="inline size-3.5 mr-0.5" />
                  {currentLesson.estimated_minutes} min
                </p>
              </div>

              <AnimatePresence mode="wait">
                {isCompleted ? (
                  <motion.div
                    key="completed"
                    initial={{ scale: 0.5, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ type: 'spring', stiffness: 300, damping: 15 }}
                  >
                    <Badge className="bg-cai-emerald text-white gap-1 px-3 py-1">
                      <CheckCircle2 className="size-3.5" />
                      Completed
                    </Badge>
                  </motion.div>
                ) : (
                  <motion.div
                    key="mark"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                  >
                    <Button
                      onClick={handleMarkComplete}
                      disabled={isMarkingComplete}
                      className="bg-cai-emerald hover:bg-cai-emerald/90 text-white"
                    >
                      <Check className="mr-1 size-4" />
                      {isMarkingComplete ? 'Saving...' : 'Mark Complete'}
                    </Button>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </FadeIn>

          {/* ── Tabbed Content ────────────────────────────────────── */}
          <FadeIn delay={180}>
            <Tabs defaultValue="content">
              <TabsList variant="line" className="w-full justify-start">
                <TabsTrigger value="content" className="gap-1.5">
                  <BookOpen className="size-3.5" />
                  Content
                </TabsTrigger>
                <TabsTrigger value="key-points" className="gap-1.5">
                  <ListChecks className="size-3.5" />
                  Key Points
                  {keyPoints.length > 0 && (
                    <Badge
                      variant="secondary"
                      className="ml-1 text-[10px] px-1 py-0"
                    >
                      {keyPoints.length}
                    </Badge>
                  )}
                </TabsTrigger>
                <TabsTrigger value="texas-law" className="gap-1.5">
                  <Scale className="size-3.5" />
                  Texas Law
                  {texasLawCallouts.length > 0 && (
                    <Badge
                      variant="secondary"
                      className="ml-1 text-[10px] px-1 py-0"
                    >
                      {texasLawCallouts.length}
                    </Badge>
                  )}
                </TabsTrigger>
                <TabsTrigger value="quiz" className="gap-1.5">
                  <HelpCircle className="size-3.5" />
                  Quiz
                </TabsTrigger>
              </TabsList>

              {/* ── Content Tab ─────────────────────────────────── */}
              <TabsContent value="content" className="mt-6">
                {currentLesson.content_markdown ? (
                  <div className="prose prose-invert prose-sm max-w-none">
                    <ReactMarkdown remarkPlugins={[remarkGfm]}>
                      {currentLesson.content_markdown}
                    </ReactMarkdown>
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center py-12 text-center space-y-2">
                    <BookOpen className="size-8 text-muted-foreground" />
                    <p className="text-sm text-muted-foreground">
                      Content for this lesson is being generated
                    </p>
                  </div>
                )}
              </TabsContent>

              {/* ── Key Points Tab ──────────────────────────────── */}
              <TabsContent value="key-points" className="mt-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base flex items-center gap-2">
                      <ListChecks className="size-5 text-cai-teal" />
                      Key Takeaways
                    </CardTitle>
                    <CardDescription>
                      Remember these critical points for the exam
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    {keyPoints.length > 0 ? (
                      <ul className="space-y-3">
                        {keyPoints.map((point, i) => (
                          <motion.li
                            key={i}
                            initial={{ opacity: 0, x: -10 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: i * 0.08, duration: 0.3 }}
                            className="flex items-start gap-3"
                          >
                            <div className="mt-1 flex size-6 shrink-0 items-center justify-center rounded-full bg-cai-teal/10 text-xs font-semibold text-cai-teal">
                              {i + 1}
                            </div>
                            <span className="text-sm leading-relaxed">
                              {point}
                            </span>
                          </motion.li>
                        ))}
                      </ul>
                    ) : (
                      <p className="text-sm text-muted-foreground">
                        No key points available for this lesson.
                      </p>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>

              {/* ── Texas Law Tab ────────────────────────────────── */}
              <TabsContent value="texas-law" className="mt-6 space-y-4">
                {texasLawCallouts.length > 0 ? (
                  texasLawCallouts.map((callout, i) => {
                    const style = severityStyles[callout.severity] ?? severityStyles.info
                    return (
                      <motion.div
                        key={i}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: i * 0.1, duration: 0.3 }}
                      >
                        <Card className={`${style.border} ${style.bg}`}>
                          <CardContent className="flex items-start gap-4">
                            <div className="mt-0.5">
                              <Scale className={`size-5 ${style.icon}`} />
                            </div>
                            <div className="flex-1 space-y-2">
                              <div className="flex items-center gap-2 flex-wrap">
                                <h4 className="font-semibold">
                                  {callout.title}
                                </h4>
                                <Badge
                                  variant="outline"
                                  className={`text-xs ${style.badge}`}
                                >
                                  {callout.severity}
                                </Badge>
                              </div>
                              <p className="text-sm font-mono text-muted-foreground">
                                {callout.statute}
                              </p>
                              <p className="text-sm leading-relaxed">
                                {callout.description}
                              </p>
                            </div>
                          </CardContent>
                        </Card>
                      </motion.div>
                    )
                  })
                ) : (
                  <Card>
                    <CardContent className="py-10 text-center">
                      <Scale className="mx-auto size-8 text-muted-foreground mb-2" />
                      <p className="text-sm text-muted-foreground">
                        No Texas law callouts for this lesson.
                      </p>
                    </CardContent>
                  </Card>
                )}
              </TabsContent>

              {/* ── Quiz Tab ─────────────────────────────────────── */}
              <TabsContent value="quiz" className="mt-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base flex items-center gap-2">
                      <HelpCircle className="size-5 text-cai-purple" />
                      Lesson Quiz
                    </CardTitle>
                    <CardDescription>
                      Test your understanding of {currentLesson.title}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="flex flex-col items-center justify-center py-10 text-center space-y-3">
                      <div className="flex size-14 items-center justify-center rounded-full bg-cai-purple/10 border border-cai-purple/20">
                        <HelpCircle className="size-7 text-cai-purple" />
                      </div>
                      <p className="font-medium">Quiz coming soon</p>
                      <p className="text-sm text-muted-foreground max-w-xs">
                        Quiz questions will appear here after the media pipeline
                        runs. Complete the content and key points above to
                        prepare.
                      </p>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </FadeIn>
        </div>

        {/* ── Side Panel ─────────────────────────────────────────── */}
        <FadeIn delay={240} className="xl:w-[300px] shrink-0">
          <div className="sticky top-6 space-y-6">
            {/* Module Progress */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-semibold">
                  Module Progress
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-1.5">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">
                      {completedCount}/{lessons.length} lessons
                    </span>
                    <span className="font-medium">{moduleProgress}%</span>
                  </div>
                  <Progress
                    value={moduleProgress}
                    className="h-2 bg-cai-blue/20 [&>[data-slot=progress-indicator]]:bg-cai-blue"
                  />
                </div>

                <Separator />

                {/* Lesson List */}
                <div className="space-y-1">
                  {lessons.map((lesson) => {
                    const isCurrent = lesson.slug === lessonSlug
                    const done = completedLessonIds.has(lesson.id)
                    return (
                      <Link
                        key={lesson.slug}
                        href={`/courses/${courseSlug}/modules/${moduleSlug}/${lesson.slug}`}
                      >
                        <div
                          className={`flex items-center gap-2 rounded-md px-2 py-1.5 text-sm transition-colors ${
                            isCurrent
                              ? 'bg-cai-blue/10 border border-cai-blue/30'
                              : 'hover:bg-muted/50'
                          }`}
                        >
                          {done ? (
                            <CheckCircle2 className="size-4 text-cai-emerald shrink-0" />
                          ) : isCurrent ? (
                            <Play className="size-4 text-cai-blue shrink-0" />
                          ) : (
                            <Circle className="size-4 text-muted-foreground/40 shrink-0" />
                          )}
                          <span
                            className={`flex-1 truncate ${
                              done && !isCurrent ? 'text-muted-foreground' : ''
                            }`}
                          >
                            {lesson.title}
                          </span>
                        </div>
                      </Link>
                    )
                  })}
                </div>
              </CardContent>
            </Card>

            {/* Navigation Buttons */}
            <div className="flex gap-2">
              {previousLesson ? (
                <Button
                  variant="outline"
                  size="sm"
                  className="flex-1"
                  asChild
                >
                  <Link
                    href={`/courses/${courseSlug}/modules/${moduleSlug}/${previousLesson.slug}`}
                  >
                    <ChevronLeft className="mr-1 size-4" />
                    Previous
                  </Link>
                </Button>
              ) : (
                <Button
                  variant="outline"
                  size="sm"
                  className="flex-1"
                  disabled
                >
                  <ChevronLeft className="mr-1 size-4" />
                  Previous
                </Button>
              )}

              {nextLesson ? (
                <Button
                  size="sm"
                  className="flex-1 bg-cai-blue hover:bg-cai-blue/90"
                  asChild
                >
                  <Link
                    href={`/courses/${courseSlug}/modules/${moduleSlug}/${nextLesson.slug}`}
                  >
                    Next
                    <ChevronRight className="ml-1 size-4" />
                  </Link>
                </Button>
              ) : (
                <Button
                  size="sm"
                  className="flex-1 bg-cai-emerald hover:bg-cai-emerald/90 text-white"
                  asChild
                >
                  <Link href={`/courses/${courseSlug}/modules/${moduleSlug}`}>
                    Finish Module
                    <CheckCircle2 className="ml-1 size-4" />
                  </Link>
                </Button>
              )}
            </div>

            {/* Mark Complete (mobile, below fold) */}
            <div className="xl:hidden">
              <AnimatePresence>
                {!isCompleted && (
                  <motion.div
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 8 }}
                  >
                    <Button
                      onClick={handleMarkComplete}
                      disabled={isMarkingComplete}
                      className="w-full bg-cai-emerald hover:bg-cai-emerald/90 text-white"
                    >
                      <Check className="mr-1 size-4" />
                      {isMarkingComplete ? 'Saving...' : 'Mark Complete'}
                    </Button>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </FadeIn>
      </div>
    </div>
  )
}

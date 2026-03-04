'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import {
  BookOpen,
  Clock,
  Lock,
  Layers,
  FileText,
  ChevronRight,
  Shield,
  Award,
  Scale,
  Building2,
  BadgeDollarSign,
  Users,
  Gavel,
  GraduationCap,
} from 'lucide-react'
import { motion } from 'motion/react'
import type { LucideIcon } from 'lucide-react'

import { createClient } from '@/lib/supabase/client'
import { FadeIn } from '@/components/fade-in'
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { Skeleton } from '@/components/ui/skeleton'

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

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
  icon_name: string | null
  color_primary: string | null
  prerequisites: string[] | null
  sort_order: number
}

interface ProgressRecord {
  course_id: string
  module_id: string | null
  lesson_id: string | null
  status: string
  progress_percent: number | null
}

interface DisplayCourse {
  id: string
  slug: string
  code: string
  title: string
  description: string
  difficulty: string
  estimatedHours: number
  moduleCount: number
  lessonCount: number
  prerequisites: string[]
  enrolled: boolean
  progress: number
  color: string
  colorAccent: string
  icon: LucideIcon
  locked: boolean
  completedLessons: number
}

// ---------------------------------------------------------------------------
// Static maps
// ---------------------------------------------------------------------------

const difficultyColors: Record<string, string> = {
  beginner: 'bg-cai-emerald/15 text-cai-emerald border-cai-emerald/30',
  intermediate: 'bg-cai-blue/15 text-cai-blue border-cai-blue/30',
  advanced: 'bg-cai-amber/15 text-cai-amber border-cai-amber/30',
  expert: 'bg-cai-purple/15 text-cai-purple border-cai-purple/30',
}

const CODE_COLORS: Record<string, { color: string; colorAccent: string }> = {
  CMCA: { color: 'bg-cai-blue', colorAccent: 'border-cai-blue/30' },
  AMS: { color: 'bg-cai-teal', colorAccent: 'border-cai-teal/30' },
  PCAM: { color: 'bg-cai-purple', colorAccent: 'border-cai-purple/30' },
  LSM: { color: 'bg-cai-amber', colorAccent: 'border-cai-amber/30' },
  RS: { color: 'bg-cai-gold', colorAccent: 'border-cai-gold/30' },
  CIRMS: { color: 'bg-cai-red', colorAccent: 'border-cai-red/30' },
  BOARD: { color: 'bg-cai-emerald', colorAccent: 'border-cai-emerald/30' },
  TX_LAW: { color: 'bg-cai-red', colorAccent: 'border-cai-red/30' },
}

const CODE_ICONS: Record<string, LucideIcon> = {
  CMCA: GraduationCap,
  AMS: Award,
  PCAM: Shield,
  LSM: Building2,
  RS: BadgeDollarSign,
  CIRMS: Scale,
  BOARD: Users,
  TX_LAW: Gavel,
}

function colorsForCode(code: string) {
  return CODE_COLORS[code] ?? { color: 'bg-cai-blue', colorAccent: 'border-cai-blue/30' }
}

function iconForCode(code: string): LucideIcon {
  return CODE_ICONS[code] ?? BookOpen
}

// ---------------------------------------------------------------------------
// Course Card
// ---------------------------------------------------------------------------

function CourseCard({
  course,
  index,
}: {
  course: DisplayCourse
  index: number
}) {
  return (
    <FadeIn delay={index * 80} className="h-full">
      <motion.div
        whileHover={{
          scale: course.locked ? 1 : 1.02,
          rotateY: course.locked ? 0 : 2,
        }}
        transition={{ type: 'spring', stiffness: 300, damping: 20 }}
        className="h-full"
        style={{ perspective: 1000 }}
      >
        <Card
          className={`relative h-full overflow-hidden transition-shadow ${
            course.locked
              ? 'opacity-60'
              : 'hover:shadow-lg hover:shadow-cai-blue/5'
          } ${course.colorAccent}`}
        >
          {/* Locked Overlay */}
          {course.locked && (
            <div className="absolute inset-0 z-10 flex items-center justify-center bg-background/60 backdrop-blur-[2px]">
              <div className="flex flex-col items-center gap-2 text-center">
                <div className="flex size-12 items-center justify-center rounded-full bg-muted">
                  <Lock className="size-6 text-muted-foreground" />
                </div>
                <p className="text-sm font-medium text-muted-foreground">
                  Complete {course.prerequisites.join(', ')} first
                </p>
              </div>
            </div>
          )}

          {/* Top accent bar */}
          <div className={`h-1 ${course.color}`} />

          <CardHeader>
            <div className="flex items-start justify-between">
              <div
                className={`flex size-10 items-center justify-center rounded-lg ${course.color}/10`}
              >
                <course.icon
                  className={`size-5 ${course.color.replace('bg-', 'text-')}`}
                />
              </div>
              <Badge
                variant="outline"
                className={difficultyColors[course.difficulty] ?? ''}
              >
                {course.difficulty}
              </Badge>
            </div>
            <div className="mt-2">
              <Badge className={`${course.color} text-white mb-2`}>
                {course.code}
              </Badge>
              <CardTitle className="text-base leading-snug">
                {course.title}
              </CardTitle>
            </div>
            <CardDescription className="line-clamp-2">
              {course.description}
            </CardDescription>
          </CardHeader>

          <CardContent className="space-y-3">
            {/* Meta */}
            <div className="flex items-center gap-4 text-xs text-muted-foreground">
              <span className="flex items-center gap-1">
                <Layers className="size-3.5" />
                {course.moduleCount} modules
              </span>
              <span className="flex items-center gap-1">
                <FileText className="size-3.5" />
                {course.lessonCount} lessons
              </span>
              <span className="flex items-center gap-1">
                <Clock className="size-3.5" />
                {course.estimatedHours}h
              </span>
            </div>

            {/* Prerequisites */}
            {course.prerequisites.length > 0 && (
              <div className="flex items-center gap-2">
                <span className="text-xs text-muted-foreground">
                  Requires:
                </span>
                {course.prerequisites.map((pre) => (
                  <Badge
                    key={pre}
                    variant="secondary"
                    className="text-xs px-1.5 py-0"
                  >
                    {pre}
                  </Badge>
                ))}
              </div>
            )}

            {/* Progress */}
            {course.enrolled && course.progress > 0 && (
              <div className="space-y-1">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-muted-foreground">Progress</span>
                  <span className="font-medium">{course.progress}%</span>
                </div>
                <Progress
                  value={course.progress}
                  className={`h-1.5 ${course.color}/20 [&>[data-slot=progress-indicator]]:${course.color}`}
                />
              </div>
            )}
          </CardContent>

          <CardFooter>
            {course.locked ? (
              <Button variant="secondary" disabled className="w-full">
                <Lock className="mr-2 size-4" />
                Locked
              </Button>
            ) : (
              <Button variant="outline" className="w-full" asChild>
                <Link href={`/courses/${course.slug}`}>
                  {course.enrolled
                    ? course.progress > 0
                      ? 'Continue'
                      : 'Resume'
                    : 'Start Course'}
                  <ChevronRight className="ml-1 size-4" />
                </Link>
              </Button>
            )}
          </CardFooter>
        </Card>
      </motion.div>
    </FadeIn>
  )
}

// ---------------------------------------------------------------------------
// Loading Skeleton Grid
// ---------------------------------------------------------------------------

function CourseGridSkeleton() {
  return (
    <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
      {[0, 1, 2, 3, 4, 5, 6, 7].map((i) => (
        <Skeleton key={i} className="h-72 w-full rounded-xl" />
      ))}
    </div>
  )
}

// ---------------------------------------------------------------------------
// Course Catalog Page
// ---------------------------------------------------------------------------

export default function CourseCatalogPage() {
  const [filter, setFilter] = useState<'all' | 'enrolled' | 'available'>('all')
  const [loading, setLoading] = useState(true)
  const [courses, setCourses] = useState<DisplayCourse[]>([])

  useEffect(() => {
    async function load() {
      try {
        // Get signed-in user
        const supabase = createClient()
        const {
          data: { user },
        } = await supabase.auth.getUser()
        const email = user?.email ?? null

        // Fetch courses and progress in parallel
        const [coursesRes, progressRes] = await Promise.all([
          fetch('/api/courses'),
          email
            ? fetch(`/api/progress?user_email=${encodeURIComponent(email)}`)
            : Promise.resolve(null),
        ])

        const apiCourses: ApiCourse[] = coursesRes.ok
          ? await coursesRes.json()
          : []

        const progressRecords: ProgressRecord[] =
          progressRes && progressRes.ok
            ? (await progressRes.json()).progress ?? []
            : []

        // Build a Set of credential_codes that the user has completed (all
        // lessons done) so we can determine lock status for prerequisites.
        const completedCourseCodes = new Set<string>()
        for (const course of apiCourses) {
          const courseProgress = progressRecords.filter(
            (r) => r.course_id === course.id
          )
          const completedLessons = courseProgress.filter(
            (r) => r.status === 'completed' && r.lesson_id
          ).length
          if (
            course.lesson_count > 0 &&
            completedLessons >= course.lesson_count
          ) {
            completedCourseCodes.add(course.credential_code)
          }
        }

        const display: DisplayCourse[] = apiCourses.map((course) => {
          const courseProgress = progressRecords.filter(
            (r) => r.course_id === course.id
          )
          const completedLessons = courseProgress.filter(
            (r) => r.status === 'completed' && r.lesson_id
          ).length
          const enrolled = courseProgress.length > 0
          const totalLessons = course.lesson_count || 1
          const progressPct = Math.round((completedLessons / totalLessons) * 100)

          const prerequisites: string[] = Array.isArray(course.prerequisites)
            ? course.prerequisites
            : []

          const locked =
            prerequisites.length > 0 &&
            !prerequisites.every((pre) => completedCourseCodes.has(pre))

          const { color, colorAccent } = colorsForCode(course.credential_code)

          return {
            id: course.id,
            slug: course.slug,
            code: course.credential_code,
            title: course.title,
            description: course.description ?? '',
            difficulty: course.difficulty,
            estimatedHours: course.estimated_hours,
            moduleCount: course.module_count,
            lessonCount: course.lesson_count,
            prerequisites,
            enrolled,
            progress: progressPct,
            color,
            colorAccent,
            icon: iconForCode(course.credential_code),
            locked,
            completedLessons,
          }
        })

        setCourses(display)
      } catch (err) {
        console.error('[CourseCatalog] load error:', err)
      } finally {
        setLoading(false)
      }
    }

    load()
  }, [])

  const filteredCourses = courses.filter((c) => {
    if (filter === 'enrolled') return c.enrolled
    if (filter === 'available') return !c.locked
    return true
  })

  return (
    <div className="space-y-8">
      {/* Header */}
      <FadeIn delay={0}>
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">
              Credential Tracks
            </h1>
            <p className="mt-1 text-muted-foreground">
              Choose your path to CAI certification
            </p>
          </div>
          <div className="flex gap-2">
            {(['all', 'enrolled', 'available'] as const).map((f) => (
              <Button
                key={f}
                variant={filter === f ? 'default' : 'outline'}
                size="sm"
                onClick={() => setFilter(f)}
                className={
                  filter === f ? 'bg-cai-blue hover:bg-cai-blue/90' : ''
                }
              >
                {f === 'all'
                  ? 'All Tracks'
                  : f === 'enrolled'
                    ? 'My Courses'
                    : 'Available'}
              </Button>
            ))}
          </div>
        </div>
      </FadeIn>

      {/* Course Grid */}
      {loading ? (
        <CourseGridSkeleton />
      ) : (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {filteredCourses.map((course, i) => (
            <CourseCard key={course.id} course={course} index={i} />
          ))}
        </div>
      )}

      {/* Empty State */}
      {!loading && filteredCourses.length === 0 && (
        <FadeIn delay={0}>
          <div className="flex flex-col items-center gap-4 py-16 text-center">
            <BookOpen className="size-12 text-muted-foreground" />
            <p className="text-lg text-muted-foreground">
              No courses match this filter.
            </p>
          </div>
        </FadeIn>
      )}
    </div>
  )
}

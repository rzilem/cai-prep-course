'use client'

import { useState } from 'react'
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

// ---------------------------------------------------------------------------
// Mock Course Data
// ---------------------------------------------------------------------------

interface MockCourse {
  slug: string
  code: string
  title: string
  description: string
  difficulty: 'beginner' | 'intermediate' | 'advanced' | 'expert'
  estimatedHours: number
  moduleCount: number
  lessonCount: number
  prerequisites: string[]
  enrolled: boolean
  progress: number
  color: string
  colorAccent: string
  icon: typeof BookOpen
  locked: boolean
}

const mockCourses: MockCourse[] = [
  {
    slug: 'cmca',
    code: 'CMCA',
    title: 'Certified Manager of Community Associations',
    description:
      'Foundation credential covering financial management, governance, facilities, and community relations.',
    difficulty: 'intermediate',
    estimatedHours: 60,
    moduleCount: 7,
    lessonCount: 35,
    prerequisites: [],
    enrolled: true,
    progress: 45,
    color: 'bg-cai-blue',
    colorAccent: 'border-cai-blue/30',
    icon: GraduationCap,
    locked: false,
  },
  {
    slug: 'ams',
    code: 'AMS',
    title: 'Association Management Specialist',
    description:
      'Advanced management practices including strategic planning, risk management, and leadership.',
    difficulty: 'advanced',
    estimatedHours: 45,
    moduleCount: 6,
    lessonCount: 28,
    prerequisites: ['CMCA'],
    enrolled: true,
    progress: 12,
    color: 'bg-cai-teal',
    colorAccent: 'border-cai-teal/30',
    icon: Award,
    locked: false,
  },
  {
    slug: 'pcam',
    code: 'PCAM',
    title: 'Professional Community Association Manager',
    description:
      'The highest individual manager credential, covering executive-level management and case studies.',
    difficulty: 'expert',
    estimatedHours: 80,
    moduleCount: 8,
    lessonCount: 40,
    prerequisites: ['AMS'],
    enrolled: false,
    progress: 0,
    color: 'bg-cai-purple',
    colorAccent: 'border-cai-purple/30',
    icon: Shield,
    locked: true,
  },
  {
    slug: 'lsm',
    code: 'LSM',
    title: 'Large-Scale Manager',
    description:
      'Specialized training for managing large-scale communities with 1,000+ units and complex operations.',
    difficulty: 'advanced',
    estimatedHours: 40,
    moduleCount: 5,
    lessonCount: 22,
    prerequisites: ['CMCA'],
    enrolled: false,
    progress: 0,
    color: 'bg-cai-amber',
    colorAccent: 'border-cai-amber/30',
    icon: Building2,
    locked: false,
  },
  {
    slug: 'rs',
    code: 'RS',
    title: 'Reserve Specialist',
    description:
      'Reserve fund planning, analysis, and reporting for community association financial health.',
    difficulty: 'intermediate',
    estimatedHours: 35,
    moduleCount: 4,
    lessonCount: 20,
    prerequisites: [],
    enrolled: false,
    progress: 0,
    color: 'bg-cai-gold',
    colorAccent: 'border-cai-gold/30',
    icon: BadgeDollarSign,
    locked: false,
  },
  {
    slug: 'cirms',
    code: 'CIRMS',
    title: 'Community Insurance & Risk Management Specialist',
    description:
      'Insurance coverage, risk assessment, and claims management for community associations.',
    difficulty: 'intermediate',
    estimatedHours: 30,
    moduleCount: 5,
    lessonCount: 18,
    prerequisites: [],
    enrolled: false,
    progress: 0,
    color: 'bg-cai-red',
    colorAccent: 'border-cai-red/30',
    icon: Scale,
    locked: false,
  },
  {
    slug: 'board-leader',
    code: 'BOARD',
    title: 'Board Leadership Certificate',
    description:
      'Essential training for HOA board members and volunteer leaders on governance and fiduciary duties.',
    difficulty: 'beginner',
    estimatedHours: 20,
    moduleCount: 4,
    lessonCount: 16,
    prerequisites: [],
    enrolled: true,
    progress: 33,
    color: 'bg-cai-emerald',
    colorAccent: 'border-cai-emerald/30',
    icon: Users,
    locked: false,
  },
  {
    slug: 'texas-law',
    code: 'TX_LAW',
    title: 'Texas HOA Law Essentials',
    description:
      'Texas Property Code Ch. 209, deed restrictions, foreclosure rules, and state-specific compliance.',
    difficulty: 'intermediate',
    estimatedHours: 25,
    moduleCount: 5,
    lessonCount: 15,
    prerequisites: [],
    enrolled: true,
    progress: 78,
    color: 'bg-cai-red',
    colorAccent: 'border-cai-red/30',
    icon: Gavel,
    locked: false,
  },
]

const difficultyColors: Record<string, string> = {
  beginner: 'bg-cai-emerald/15 text-cai-emerald border-cai-emerald/30',
  intermediate: 'bg-cai-blue/15 text-cai-blue border-cai-blue/30',
  advanced: 'bg-cai-amber/15 text-cai-amber border-cai-amber/30',
  expert: 'bg-cai-purple/15 text-cai-purple border-cai-purple/30',
}

// ---------------------------------------------------------------------------
// Course Card
// ---------------------------------------------------------------------------

function CourseCard({ course, index }: { course: MockCourse; index: number }) {
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
                className={difficultyColors[course.difficulty]}
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
// Course Catalog Page
// ---------------------------------------------------------------------------

export default function CourseCatalogPage() {
  const [filter, setFilter] = useState<'all' | 'enrolled' | 'available'>('all')

  const filteredCourses = mockCourses.filter((c) => {
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
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {filteredCourses.map((course, i) => (
          <CourseCard key={course.slug} course={course} index={i} />
        ))}
      </div>

      {/* Empty State */}
      {filteredCourses.length === 0 && (
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

'use client'

import { use } from 'react'
import Link from 'next/link'
import {
  GraduationCap,
  Clock,
  Layers,
  FileText,
  CheckCircle2,
  Circle,
  PlayCircle,
  AlertTriangle,
  BookOpen,
  ArrowRight,
  BarChart3,
  Shield,
  Scale,
  ChevronRight,
  Info,
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

// ---------------------------------------------------------------------------
// Mock Data - CMCA Course
// ---------------------------------------------------------------------------

interface MockModule {
  slug: string
  number: number
  title: string
  description: string
  lessonCount: number
  examWeight: number
  status: 'completed' | 'in_progress' | 'not_started'
  progress: number
  lessons: {
    slug: string
    title: string
    estimatedMinutes: number
    completed: boolean
  }[]
}

const mockCourse = {
  slug: 'cmca',
  code: 'CMCA',
  title: 'Certified Manager of Community Associations',
  description:
    'The CMCA is the foundation credential for community association managers. This comprehensive course covers all seven exam domains including financial management, community governance, legal compliance, facilities management, and community relations. Complete with Texas-specific law modules integrated throughout.',
  difficulty: 'intermediate' as const,
  estimatedHours: 60,
  moduleCount: 7,
  lessonCount: 35,
  examFormat: '100 multiple-choice questions, 3 hours',
  passingScore: 70,
  progress: 45,
  enrolled: true,
  color: 'bg-cai-blue',
  prerequisites: [] as string[],
  texasLawIntegrated: true,
}

const mockModules: MockModule[] = [
  {
    slug: 'financial-management',
    number: 1,
    title: 'Financial Management',
    description:
      'Budgeting, reserve funds, financial reporting, assessments, and collections.',
    lessonCount: 7,
    examWeight: 19,
    status: 'completed',
    progress: 100,
    lessons: [
      {
        slug: 'budgeting-basics',
        title: 'Budgeting Fundamentals',
        estimatedMinutes: 25,
        completed: true,
      },
      {
        slug: 'reserve-fund-analysis',
        title: 'Reserve Fund Analysis & Planning',
        estimatedMinutes: 30,
        completed: true,
      },
      {
        slug: 'financial-reporting',
        title: 'Financial Reporting Standards',
        estimatedMinutes: 20,
        completed: true,
      },
      {
        slug: 'assessments-collections',
        title: 'Assessments & Collections',
        estimatedMinutes: 25,
        completed: true,
      },
      {
        slug: 'investment-guidelines',
        title: 'Investment Guidelines',
        estimatedMinutes: 20,
        completed: true,
      },
      {
        slug: 'audit-review',
        title: 'Audit & Review Process',
        estimatedMinutes: 25,
        completed: true,
      },
      {
        slug: 'texas-hoa-financials',
        title: 'Texas HOA Financial Requirements',
        estimatedMinutes: 20,
        completed: true,
      },
    ],
  },
  {
    slug: 'community-governance',
    number: 2,
    title: 'Community Governance',
    description:
      'Board operations, meetings, elections, governing documents, and parliamentary procedure.',
    lessonCount: 6,
    examWeight: 18,
    status: 'in_progress',
    progress: 50,
    lessons: [
      {
        slug: 'governing-documents',
        title: 'Understanding Governing Documents',
        estimatedMinutes: 30,
        completed: true,
      },
      {
        slug: 'board-operations',
        title: 'Board Operations & Meetings',
        estimatedMinutes: 25,
        completed: true,
      },
      {
        slug: 'elections-voting',
        title: 'Elections & Voting Procedures',
        estimatedMinutes: 20,
        completed: true,
      },
      {
        slug: 'parliamentary-procedure',
        title: 'Parliamentary Procedure',
        estimatedMinutes: 20,
        completed: false,
      },
      {
        slug: 'committee-management',
        title: 'Committee Management',
        estimatedMinutes: 15,
        completed: false,
      },
      {
        slug: 'texas-governance-laws',
        title: 'Texas Governance Requirements',
        estimatedMinutes: 25,
        completed: false,
      },
    ],
  },
  {
    slug: 'legal-ethics-risk',
    number: 3,
    title: 'Legal, Ethics & Risk Management',
    description:
      'Fiduciary duties, fair housing, insurance, liability, and ethical standards.',
    lessonCount: 6,
    examWeight: 18,
    status: 'in_progress',
    progress: 33,
    lessons: [
      {
        slug: 'fiduciary-duties',
        title: 'Fiduciary Duties & Obligations',
        estimatedMinutes: 30,
        completed: true,
      },
      {
        slug: 'fair-housing',
        title: 'Fair Housing Act & Compliance',
        estimatedMinutes: 25,
        completed: true,
      },
      {
        slug: 'risk-assessment',
        title: 'Risk Assessment & Mitigation',
        estimatedMinutes: 25,
        completed: false,
      },
      {
        slug: 'insurance-programs',
        title: 'Insurance Programs',
        estimatedMinutes: 20,
        completed: false,
      },
      {
        slug: 'ethics-standards',
        title: 'CAI Ethics Standards',
        estimatedMinutes: 20,
        completed: false,
      },
      {
        slug: 'texas-property-code',
        title: 'Texas Property Code Ch. 209',
        estimatedMinutes: 30,
        completed: false,
      },
    ],
  },
  {
    slug: 'facilities-management',
    number: 4,
    title: 'Facilities Management',
    description:
      'Maintenance planning, vendor management, capital improvements, and environmental compliance.',
    lessonCount: 5,
    examWeight: 14,
    status: 'not_started',
    progress: 0,
    lessons: [
      {
        slug: 'maintenance-planning',
        title: 'Maintenance Planning & Scheduling',
        estimatedMinutes: 25,
        completed: false,
      },
      {
        slug: 'vendor-management',
        title: 'Vendor Selection & Management',
        estimatedMinutes: 25,
        completed: false,
      },
      {
        slug: 'capital-improvements',
        title: 'Capital Improvement Projects',
        estimatedMinutes: 20,
        completed: false,
      },
      {
        slug: 'environmental-compliance',
        title: 'Environmental Compliance',
        estimatedMinutes: 20,
        completed: false,
      },
      {
        slug: 'emergency-preparedness',
        title: 'Emergency Preparedness',
        estimatedMinutes: 20,
        completed: false,
      },
    ],
  },
  {
    slug: 'community-relations',
    number: 5,
    title: 'Community Relations',
    description:
      'Communication strategies, conflict resolution, homeowner engagement, and community building.',
    lessonCount: 5,
    examWeight: 14,
    status: 'not_started',
    progress: 0,
    lessons: [
      {
        slug: 'communication-strategies',
        title: 'Communication Strategies',
        estimatedMinutes: 20,
        completed: false,
      },
      {
        slug: 'conflict-resolution',
        title: 'Conflict Resolution',
        estimatedMinutes: 25,
        completed: false,
      },
      {
        slug: 'homeowner-engagement',
        title: 'Homeowner Engagement',
        estimatedMinutes: 20,
        completed: false,
      },
      {
        slug: 'covenant-enforcement',
        title: 'Covenant Enforcement',
        estimatedMinutes: 25,
        completed: false,
      },
      {
        slug: 'dispute-resolution',
        title: 'Alternative Dispute Resolution',
        estimatedMinutes: 20,
        completed: false,
      },
    ],
  },
  {
    slug: 'human-resources',
    number: 6,
    title: 'Human Resources',
    description:
      'Hiring, training, compensation, labor laws, and management company relationships.',
    lessonCount: 3,
    examWeight: 10,
    status: 'not_started',
    progress: 0,
    lessons: [
      {
        slug: 'hiring-training',
        title: 'Hiring & Training Practices',
        estimatedMinutes: 25,
        completed: false,
      },
      {
        slug: 'labor-laws',
        title: 'Employment Law Essentials',
        estimatedMinutes: 20,
        completed: false,
      },
      {
        slug: 'mgmt-company-relations',
        title: 'Management Company Relationships',
        estimatedMinutes: 20,
        completed: false,
      },
    ],
  },
  {
    slug: 'communications-technology',
    number: 7,
    title: 'Communications & Technology',
    description:
      'Technology tools, digital communication, record keeping, and management software.',
    lessonCount: 3,
    examWeight: 7,
    status: 'not_started',
    progress: 0,
    lessons: [
      {
        slug: 'technology-tools',
        title: 'Management Technology Tools',
        estimatedMinutes: 20,
        completed: false,
      },
      {
        slug: 'digital-communication',
        title: 'Digital Communication Best Practices',
        estimatedMinutes: 15,
        completed: false,
      },
      {
        slug: 'records-management',
        title: 'Records Management & Retention',
        estimatedMinutes: 20,
        completed: false,
      },
    ],
  },
]

// ---------------------------------------------------------------------------
// Progress Ring
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

function ModuleStatusIcon({
  status,
}: {
  status: 'completed' | 'in_progress' | 'not_started'
}) {
  if (status === 'completed')
    return <CheckCircle2 className="size-5 text-cai-emerald" />
  if (status === 'in_progress')
    return <PlayCircle className="size-5 text-cai-blue" />
  return <Circle className="size-5 text-muted-foreground/40" />
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
  // In production, we would fetch the course by slug. For now, use mock data.
  const course = mockCourse
  const modules = mockModules

  const totalLessonsCompleted = modules.reduce(
    (acc, m) => acc + m.lessons.filter((l) => l.completed).length,
    0
  )

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
                {course.code}
              </span>
            </div>

            <div>
              <Badge className={`${course.color} text-white mb-3`}>
                {course.code}
              </Badge>
              <h1 className="text-3xl font-bold tracking-tight">
                {course.title}
              </h1>
              <p className="mt-3 text-muted-foreground leading-relaxed">
                {course.description}
              </p>
            </div>

            {/* Metadata chips */}
            <div className="flex flex-wrap gap-3">
              <div className="flex items-center gap-1.5 rounded-md border px-3 py-1.5 text-sm">
                <BarChart3 className="size-4 text-cai-blue" />
                <span className="capitalize">{course.difficulty}</span>
              </div>
              <div className="flex items-center gap-1.5 rounded-md border px-3 py-1.5 text-sm">
                <Clock className="size-4 text-cai-amber" />
                {course.estimatedHours} hours
              </div>
              <div className="flex items-center gap-1.5 rounded-md border px-3 py-1.5 text-sm">
                <Layers className="size-4 text-cai-teal" />
                {course.moduleCount} modules
              </div>
              <div className="flex items-center gap-1.5 rounded-md border px-3 py-1.5 text-sm">
                <FileText className="size-4 text-cai-purple" />
                {course.lessonCount} lessons
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
                  {course.examFormat}
                </div>
                <div>
                  <span className="text-muted-foreground">Passing Score:</span>{' '}
                  {course.passingScore}%
                </div>
              </div>
            </div>
          </div>

          {/* Right - Progress Ring & CTA */}
          <div className="flex flex-col items-center gap-6 lg:w-[260px]">
            <LargeProgressRing progress={course.progress} />

            <div className="text-center text-sm text-muted-foreground">
              <AnimatedCounter value={totalLessonsCompleted} /> of{' '}
              {course.lessonCount} lessons completed
            </div>

            {course.enrolled ? (
              <Button
                asChild
                size="lg"
                className="w-full bg-cai-blue hover:bg-cai-blue/90"
              >
                <Link
                  href={`/courses/${courseSlug}/modules/${
                    modules.find((m) => m.status === 'in_progress')?.slug ||
                    modules[0].slug
                  }`}
                >
                  Continue Learning
                  <ArrowRight className="ml-2 size-4" />
                </Link>
              </Button>
            ) : (
              <Button
                size="lg"
                className="w-full bg-cai-blue hover:bg-cai-blue/90"
              >
                Start Course
                <ArrowRight className="ml-2 size-4" />
              </Button>
            )}

            {/* Progress bar */}
            {course.enrolled && (
              <div className="w-full space-y-1">
                <Progress
                  value={course.progress}
                  className="h-2 bg-cai-blue/20 [&>[data-slot=progress-indicator]]:bg-cai-blue"
                />
              </div>
            )}
          </div>
        </div>
      </FadeIn>

      {/* ── Prerequisites ──────────────────────────────────────────── */}
      {course.prerequisites.length > 0 && (
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
                {course.prerequisites.map((pre) => (
                  <div
                    key={pre}
                    className="flex items-center gap-2 rounded-md border px-3 py-2"
                  >
                    <CheckCircle2 className="size-4 text-cai-emerald" />
                    <span className="text-sm">{pre}</span>
                    <Badge
                      variant="outline"
                      className="border-cai-emerald/40 text-cai-emerald text-xs"
                    >
                      Completed
                    </Badge>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </FadeIn>
      )}

      {/* ── Texas Law Callout ──────────────────────────────────────── */}
      {course.texasLawIntegrated && (
        <FadeIn delay={150}>
          <Card className="border-cai-red/20 bg-gradient-to-r from-cai-red/5 to-transparent">
            <CardContent className="flex items-start gap-4">
              <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-cai-red/10">
                <Scale className="size-5 text-cai-red" />
              </div>
              <div>
                <h3 className="font-semibold">
                  Texas Law Integration
                </h3>
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
                            Module {mod.number}: {mod.title}
                          </span>
                          <Badge
                            variant="secondary"
                            className="text-xs px-1.5 py-0"
                          >
                            {mod.examWeight}% of exam
                          </Badge>
                        </div>
                        <p className="text-xs text-muted-foreground mt-0.5">
                          {mod.lessonCount} lessons &bull;{' '}
                          {mod.lessons.filter((l) => l.completed).length}/
                          {mod.lessonCount} completed
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
                    <p className="mb-4 text-sm text-muted-foreground pl-9">
                      {mod.description}
                    </p>
                    <div className="space-y-2 pl-9">
                      {mod.lessons.map((lesson) => (
                        <Link
                          key={lesson.slug}
                          href={`/courses/${courseSlug}/modules/${mod.slug}`}
                          className="flex items-center gap-3 rounded-md px-3 py-2 text-sm transition-colors hover:bg-muted group"
                        >
                          {lesson.completed ? (
                            <CheckCircle2 className="size-4 text-cai-emerald shrink-0" />
                          ) : (
                            <Circle className="size-4 text-muted-foreground/40 shrink-0" />
                          )}
                          <span
                            className={`flex-1 ${lesson.completed ? 'text-muted-foreground' : ''}`}
                          >
                            {lesson.title}
                          </span>
                          <span className="text-xs text-muted-foreground">
                            {lesson.estimatedMinutes} min
                          </span>
                          <ArrowRight className="size-3.5 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                        </Link>
                      ))}
                    </div>
                  </AccordionContent>
                </AccordionItem>
              </motion.div>
            ))}
          </Accordion>
        </div>
      </FadeIn>

      {/* ── Domain Weight Summary ──────────────────────────────────── */}
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
                        animate={{ width: `${(mod.examWeight / 19) * 100}%` }}
                        transition={{
                          duration: 0.8,
                          ease: 'easeOut',
                          delay: 0.5,
                        }}
                      />
                    </div>
                  </div>
                  <span className="w-12 text-right text-sm font-medium">
                    {mod.examWeight}%
                  </span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </FadeIn>
    </div>
  )
}

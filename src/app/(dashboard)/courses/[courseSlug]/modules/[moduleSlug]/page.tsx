'use client'

import { use, useState } from 'react'
import Link from 'next/link'
import {
  Play,
  ChevronLeft,
  ChevronRight,
  CheckCircle2,
  Circle,
  Clock,
  BookOpen,
  ListChecks,
  Scale,
  HelpCircle,
  ArrowLeft,
  Volume2,
  Maximize2,
  Check,
} from 'lucide-react'
import { motion, AnimatePresence } from 'motion/react'

import { FadeIn } from '@/components/fade-in'
import { useSound } from '@/components/providers'
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
import { Checkbox } from '@/components/ui/checkbox'

// ---------------------------------------------------------------------------
// Mock Lesson Data
// ---------------------------------------------------------------------------

const mockModule = {
  slug: 'financial-management',
  number: 1,
  title: 'Financial Management',
  courseSlug: 'cmca',
  courseTitle: 'CMCA Certification Prep',
}

const mockLessons = [
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
    completed: false,
  },
  {
    slug: 'investment-guidelines',
    title: 'Investment Guidelines',
    estimatedMinutes: 20,
    completed: false,
  },
  {
    slug: 'audit-review',
    title: 'Audit & Review Process',
    estimatedMinutes: 25,
    completed: false,
  },
  {
    slug: 'texas-hoa-financials',
    title: 'Texas HOA Financial Requirements',
    estimatedMinutes: 20,
    completed: false,
  },
]

const mockCurrentLesson = {
  slug: 'assessments-collections',
  title: 'Assessments & Collections',
  estimatedMinutes: 25,
  contentMarkdown: `## Assessments & Collections

Community associations fund their operations through regular assessments (also called dues or fees) collected from homeowners. Understanding assessment authority, procedures, and collection strategies is critical for effective financial management.

### Assessment Authority

The authority to levy assessments comes from the community's governing documents — typically the Declaration of Covenants, Conditions, and Restrictions (CC&Rs). These documents specify:

- **Regular assessments**: Annual or monthly fees for ongoing operations
- **Special assessments**: One-time levies for unexpected expenses or capital projects
- **Individual assessments**: Charges to specific homeowners for rule violations or damage

### The Assessment Process

1. **Budget Preparation**: The board develops an annual budget estimating all operating expenses
2. **Assessment Calculation**: Total budget is divided among all units based on the allocation formula
3. **Notice Requirements**: Owners must receive proper notice of assessment amounts and due dates
4. **Collection Procedures**: Establish consistent, documented collection processes
5. **Delinquency Management**: Follow a progressive approach from friendly reminders to legal action

### Collection Best Practices

Effective collections require a balance between firmness and fairness:

- Implement **automatic payment options** (ACH, credit card)
- Send **courtesy reminders** before due dates
- Apply **late fees consistently** — no selective enforcement
- Establish a **payment plan policy** for hardship cases
- Document all **communication and agreements**
- Know when to **escalate to legal counsel**

### Financial Impact of Delinquencies

Uncollected assessments create a cascading impact:

- **Budget shortfalls** require cutting services or special assessments
- **Reserve fund underfunding** delays critical maintenance
- **Inequity** among homeowners who do pay on time
- **Property value decline** as community standards slip`,
  keyPoints: [
    'Assessment authority derives from the CC&Rs and governing documents',
    'Three types: regular, special, and individual assessments',
    'Consistent collection policies are essential — no selective enforcement',
    'Payment plans should be offered for documented hardship cases',
    'Delinquencies create cascading budget and community impact',
    'Texas law provides specific lien and foreclosure powers for HOAs',
    'Always document communications and follow the progressive collection process',
  ],
  texasLawCallouts: [
    {
      statute: 'Texas Property Code Section 209.0062',
      title: 'Priority of Payments',
      description:
        'Payments must be applied first to the current assessment, then to any delinquent assessments, before being applied to fees, costs, or attorney\'s fees.',
      severity: 'critical' as const,
    },
    {
      statute: 'Texas Property Code Section 209.009',
      title: 'Assessment Lien',
      description:
        'HOAs have a lien on a property for unpaid assessments, including interest, late fees, and collection costs. The lien is superior to most other liens except tax liens and first mortgage liens.',
      severity: 'warning' as const,
    },
    {
      statute: 'Texas Property Code Section 209.0091',
      title: 'Foreclosure Limitations',
      description:
        'An HOA may NOT foreclose on a homeowner\'s property solely for unpaid fines or fees. Foreclosure is only permitted for unpaid assessments (regular or special).',
      severity: 'critical' as const,
    },
  ],
  quiz: [
    {
      id: 'q1',
      question:
        'Which type of assessment is used for unexpected expenses or capital projects?',
      choices: [
        { text: 'Regular assessment', isCorrect: false },
        { text: 'Special assessment', isCorrect: true },
        { text: 'Individual assessment', isCorrect: false },
        { text: 'Emergency assessment', isCorrect: false },
      ],
    },
    {
      id: 'q2',
      question:
        'Under Texas Property Code 209.0062, how must HOA payments be applied?',
      choices: [
        {
          text: 'To attorney fees first, then assessments',
          isCorrect: false,
        },
        {
          text: 'To the oldest delinquent balance first',
          isCorrect: false,
        },
        {
          text: 'To current assessments first, then delinquent assessments',
          isCorrect: true,
        },
        { text: 'At the discretion of the board', isCorrect: false },
      ],
    },
    {
      id: 'q3',
      question:
        'Can a Texas HOA foreclose on a property solely for unpaid fines?',
      choices: [
        { text: 'Yes, for any amount over $1,000', isCorrect: false },
        {
          text: 'Yes, after 90 days of non-payment',
          isCorrect: false,
        },
        {
          text: 'No, foreclosure is only for unpaid assessments',
          isCorrect: true,
        },
        { text: 'Only with a court order', isCorrect: false },
      ],
    },
  ],
}

// ---------------------------------------------------------------------------
// Severity styling
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
// Lesson Player Page
// ---------------------------------------------------------------------------

export default function LessonPlayerPage({
  params,
}: {
  params: Promise<{ courseSlug: string; moduleSlug: string }>
}) {
  const { courseSlug, moduleSlug } = use(params)
  const { playSound } = useSound()

  // Current lesson index
  const currentIndex = mockLessons.findIndex(
    (l) => l.slug === mockCurrentLesson.slug
  )
  const [isCompleted, setIsCompleted] = useState(
    mockLessons[currentIndex]?.completed ?? false
  )
  const [selectedQuizAnswers, setSelectedQuizAnswers] = useState<
    Record<string, number>
  >({})
  const [quizSubmitted, setQuizSubmitted] = useState(false)

  const previousLesson =
    currentIndex > 0 ? mockLessons[currentIndex - 1] : null
  const nextLesson =
    currentIndex < mockLessons.length - 1
      ? mockLessons[currentIndex + 1]
      : null

  const completedCount = mockLessons.filter((l) => l.completed).length
  const moduleProgress = Math.round(
    ((completedCount + (isCompleted && !mockLessons[currentIndex]?.completed ? 1 : 0)) /
      mockLessons.length) *
      100
  )

  function handleMarkComplete() {
    setIsCompleted(true)
    playSound('correct')
  }

  function handleQuizSubmit() {
    setQuizSubmitted(true)
    const allCorrect = mockCurrentLesson.quiz.every(
      (q) => q.choices[selectedQuizAnswers[q.id]]?.isCorrect
    )
    if (allCorrect) {
      playSound('correct')
    } else {
      playSound('wrong')
    }
  }

  return (
    <div className="space-y-6">
      {/* ── Breadcrumb ─────────────────────────────────────────────── */}
      <FadeIn delay={0}>
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Link
            href={`/courses/${courseSlug}`}
            className="hover:text-foreground transition-colors flex items-center gap-1"
          >
            <ArrowLeft className="size-3.5" />
            {mockModule.courseTitle}
          </Link>
          <ChevronRight className="size-3.5" />
          <span>Module {mockModule.number}: {mockModule.title}</span>
          <ChevronRight className="size-3.5" />
          <span className="text-foreground font-medium truncate">
            {mockCurrentLesson.title}
          </span>
        </div>
      </FadeIn>

      <div className="flex flex-col gap-6 xl:flex-row">
        {/* ── Main Content Area ──────────────────────────────────── */}
        <div className="flex-1 space-y-6">
          {/* Video Player Placeholder */}
          <FadeIn delay={60}>
            <div className="relative aspect-video w-full overflow-hidden rounded-xl border bg-zinc-950">
              <div className="absolute inset-0 flex flex-col items-center justify-center gap-4">
                <motion.div
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.95 }}
                  className="flex size-20 cursor-pointer items-center justify-center rounded-full bg-cai-blue/20 backdrop-blur-sm border border-cai-blue/30 transition-colors hover:bg-cai-blue/30"
                >
                  <Play className="size-8 text-cai-blue ml-1" />
                </motion.div>
                <p className="text-sm text-zinc-500">
                  Video lesson coming soon
                </p>
              </div>
              {/* Video controls bar */}
              <div className="absolute bottom-0 left-0 right-0 flex items-center gap-3 bg-gradient-to-t from-black/80 to-transparent px-4 pb-3 pt-8">
                <Play className="size-4 text-white/80 cursor-pointer hover:text-white" />
                <div className="flex-1 h-1 rounded-full bg-white/20">
                  <div className="h-full w-0 rounded-full bg-cai-blue" />
                </div>
                <span className="text-xs text-white/60">0:00 / 25:00</span>
                <Volume2 className="size-4 text-white/60 cursor-pointer hover:text-white" />
                <Maximize2 className="size-4 text-white/60 cursor-pointer hover:text-white" />
              </div>
            </div>
          </FadeIn>

          {/* Lesson Title */}
          <FadeIn delay={120}>
            <div className="flex items-start justify-between gap-4">
              <div>
                <h1 className="text-2xl font-bold">{mockCurrentLesson.title}</h1>
                <p className="mt-1 text-sm text-muted-foreground">
                  Module {mockModule.number}: {mockModule.title} &bull;{' '}
                  <Clock className="inline size-3.5 mr-0.5" />
                  {mockCurrentLesson.estimatedMinutes} min
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
                  <motion.div key="mark" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                    <Button
                      onClick={handleMarkComplete}
                      className="bg-cai-emerald hover:bg-cai-emerald/90 text-white"
                    >
                      <Check className="mr-1 size-4" />
                      Mark Complete
                    </Button>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </FadeIn>

          {/* ── Tabbed Content ───────────────────────────────────── */}
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
                </TabsTrigger>
                <TabsTrigger value="texas-law" className="gap-1.5">
                  <Scale className="size-3.5" />
                  Texas Law
                  <Badge variant="secondary" className="ml-1 text-[10px] px-1 py-0">
                    {mockCurrentLesson.texasLawCallouts.length}
                  </Badge>
                </TabsTrigger>
                <TabsTrigger value="quiz" className="gap-1.5">
                  <HelpCircle className="size-3.5" />
                  Quiz
                </TabsTrigger>
              </TabsList>

              {/* Content Tab */}
              <TabsContent value="content" className="mt-6">
                <div className="prose prose-invert prose-sm max-w-none">
                  {mockCurrentLesson.contentMarkdown
                    .split('\n')
                    .map((line, i) => {
                      if (line.startsWith('## '))
                        return (
                          <h2
                            key={i}
                            className="text-xl font-bold mt-6 mb-3 text-foreground"
                          >
                            {line.replace('## ', '')}
                          </h2>
                        )
                      if (line.startsWith('### '))
                        return (
                          <h3
                            key={i}
                            className="text-lg font-semibold mt-5 mb-2 text-foreground"
                          >
                            {line.replace('### ', '')}
                          </h3>
                        )
                      if (line.startsWith('- **'))
                        return (
                          <li key={i} className="ml-4 mb-1 text-muted-foreground list-disc">
                            <span
                              dangerouslySetInnerHTML={{
                                __html: line
                                  .replace('- ', '')
                                  .replace(
                                    /\*\*(.*?)\*\*/g,
                                    '<strong class="text-foreground">$1</strong>'
                                  ),
                              }}
                            />
                          </li>
                        )
                      if (line.match(/^\d+\./))
                        return (
                          <li
                            key={i}
                            className="ml-4 mb-1 text-muted-foreground list-decimal"
                          >
                            <span
                              dangerouslySetInnerHTML={{
                                __html: line
                                  .replace(/^\d+\.\s*/, '')
                                  .replace(
                                    /\*\*(.*?)\*\*/g,
                                    '<strong class="text-foreground">$1</strong>'
                                  ),
                              }}
                            />
                          </li>
                        )
                      if (line.trim() === '') return <br key={i} />
                      return (
                        <p
                          key={i}
                          className="mb-2 text-muted-foreground leading-relaxed"
                        >
                          {line}
                        </p>
                      )
                    })}
                </div>
              </TabsContent>

              {/* Key Points Tab */}
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
                    <ul className="space-y-3">
                      {mockCurrentLesson.keyPoints.map((point, i) => (
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
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Texas Law Tab */}
              <TabsContent value="texas-law" className="mt-6 space-y-4">
                {mockCurrentLesson.texasLawCallouts.map((callout, i) => {
                  const style = severityStyles[callout.severity]
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
                              <h4 className="font-semibold">{callout.title}</h4>
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
                })}
              </TabsContent>

              {/* Quiz Tab */}
              <TabsContent value="quiz" className="mt-6 space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base flex items-center gap-2">
                      <HelpCircle className="size-5 text-cai-purple" />
                      Lesson Quiz
                    </CardTitle>
                    <CardDescription>
                      Test your understanding of Assessments & Collections
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-8">
                    {mockCurrentLesson.quiz.map((q, qi) => (
                      <div key={q.id} className="space-y-3">
                        <p className="font-medium">
                          {qi + 1}. {q.question}
                        </p>
                        <div className="space-y-2 pl-4">
                          {q.choices.map((choice, ci) => {
                            const isSelected =
                              selectedQuizAnswers[q.id] === ci
                            const isCorrect = choice.isCorrect
                            let choiceBg = ''
                            if (quizSubmitted && isSelected && isCorrect)
                              choiceBg =
                                'border-cai-emerald/50 bg-cai-emerald/10'
                            else if (
                              quizSubmitted &&
                              isSelected &&
                              !isCorrect
                            )
                              choiceBg = 'border-cai-red/50 bg-cai-red/10'
                            else if (
                              quizSubmitted &&
                              !isSelected &&
                              isCorrect
                            )
                              choiceBg =
                                'border-cai-emerald/30 bg-cai-emerald/5'

                            return (
                              <button
                                key={ci}
                                onClick={() => {
                                  if (!quizSubmitted) {
                                    setSelectedQuizAnswers((prev) => ({
                                      ...prev,
                                      [q.id]: ci,
                                    }))
                                  }
                                }}
                                disabled={quizSubmitted}
                                className={`w-full flex items-center gap-3 rounded-lg border px-4 py-3 text-left text-sm transition-colors ${
                                  choiceBg ||
                                  (isSelected
                                    ? 'border-cai-blue/50 bg-cai-blue/10'
                                    : 'hover:bg-muted/50')
                                } ${quizSubmitted ? 'cursor-default' : 'cursor-pointer'}`}
                              >
                                <div
                                  className={`flex size-6 shrink-0 items-center justify-center rounded-full border text-xs font-medium ${
                                    isSelected
                                      ? 'bg-cai-blue text-white border-cai-blue'
                                      : 'text-muted-foreground'
                                  }`}
                                >
                                  {String.fromCharCode(65 + ci)}
                                </div>
                                <span>{choice.text}</span>
                                {quizSubmitted && isCorrect && (
                                  <CheckCircle2 className="ml-auto size-4 text-cai-emerald" />
                                )}
                              </button>
                            )
                          })}
                        </div>
                      </div>
                    ))}

                    {!quizSubmitted && (
                      <Button
                        onClick={handleQuizSubmit}
                        disabled={
                          Object.keys(selectedQuizAnswers).length <
                          mockCurrentLesson.quiz.length
                        }
                        className="bg-cai-purple hover:bg-cai-purple/90 text-white"
                      >
                        Submit Answers
                      </Button>
                    )}

                    {quizSubmitted && (
                      <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="rounded-lg border p-4"
                      >
                        <p className="font-semibold">
                          Score:{' '}
                          {
                            mockCurrentLesson.quiz.filter(
                              (q) =>
                                q.choices[selectedQuizAnswers[q.id]]
                                  ?.isCorrect
                            ).length
                          }
                          /{mockCurrentLesson.quiz.length}
                        </p>
                        <p className="text-sm text-muted-foreground mt-1">
                          {mockCurrentLesson.quiz.every(
                            (q) =>
                              q.choices[selectedQuizAnswers[q.id]]?.isCorrect
                          )
                            ? 'Perfect score! Great job.'
                            : 'Review the incorrect answers and try again.'}
                        </p>
                      </motion.div>
                    )}
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
                      {completedCount + (isCompleted && !mockLessons[currentIndex]?.completed ? 1 : 0)}/
                      {mockLessons.length} lessons
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
                  {mockLessons.map((lesson, i) => {
                    const isCurrent =
                      lesson.slug === mockCurrentLesson.slug
                    const done =
                      lesson.completed ||
                      (isCurrent && isCompleted)
                    return (
                      <div
                        key={lesson.slug}
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
                    href={`/courses/${courseSlug}/modules/${moduleSlug}`}
                  >
                    <ChevronLeft className="mr-1 size-4" />
                    Previous
                  </Link>
                </Button>
              ) : (
                <Button variant="outline" size="sm" className="flex-1" disabled>
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
                    href={`/courses/${courseSlug}/modules/${moduleSlug}`}
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
                  <Link href={`/courses/${courseSlug}`}>
                    Finish Module
                    <CheckCircle2 className="ml-1 size-4" />
                  </Link>
                </Button>
              )}
            </div>

            {/* Mark Complete (redundant for mobile bottom) */}
            <div className="xl:hidden">
              {!isCompleted && (
                <Button
                  onClick={handleMarkComplete}
                  className="w-full bg-cai-emerald hover:bg-cai-emerald/90 text-white"
                >
                  <Check className="mr-1 size-4" />
                  Mark Complete
                </Button>
              )}
            </div>
          </div>
        </FadeIn>
      </div>
    </div>
  )
}

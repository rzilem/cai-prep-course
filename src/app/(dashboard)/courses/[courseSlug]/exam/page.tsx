'use client'

import { useState, useCallback, useMemo, useEffect, use } from 'react'
import { motion, AnimatePresence } from 'motion/react'
import {
  ArrowLeft, ArrowRight, Flag, CheckCircle, XCircle,
  BarChart3, Trophy, AlertTriangle, RotateCcw, Loader2,
  Clock,
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { ScrollArea } from '@/components/ui/scroll-area'
import { cn } from '@/lib/utils'
import { ExamTimer } from '@/components/quiz/exam-timer'
import { AnimatedCounter } from '@/components/animated-counter'
import { FadeIn } from '@/components/fade-in'
import { EXAM_DOMAINS } from '@/lib/types'
import { createClient } from '@/lib/supabase/client'

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface ExamChoice {
  text: string
  is_correct: boolean
  explanation: string
}

interface ExamQuestion {
  id: string
  question_text: string
  question_type: 'multiple_choice'
  choices: ExamChoice[]
  explanation: string
  texas_law_reference: string | null
  exam_domain: string
  difficulty: 1 | 2 | 3 | 4 | 5
  times_shown: number
  times_correct: number
  is_published: boolean
  created_at: string
  lesson_id: string | null
  module_id: string | null
  course_id: string | null
}

interface CourseInfo {
  id: string
  title: string
  credential_code: string
  slug: string
}

interface DomainScore {
  domain: string
  correct: number
  total: number
  percentage: number
}

interface SubmitResult {
  score: number
  total: number
  percentage: number
  passed: boolean
  domain_scores: DomainScore[]
  graded_answers: {
    question_id: string
    selected_answer: string
    correct_answer: string
    is_correct: boolean
    explanation: string
  }[]
  xp_earned: number
}

type ExamPhase = 'loading' | 'intro' | 'no-questions' | 'exam' | 'submitting' | 'results'

// ---------------------------------------------------------------------------
// Practice Exam Page
// ---------------------------------------------------------------------------

export default function PracticeExamPage({
  params,
}: {
  params: Promise<{ courseSlug: string }>
}) {
  const { courseSlug } = use(params)

  // Metadata
  const [courseInfo, setCourseInfo] = useState<CourseInfo | null>(null)
  const [questions, setQuestions] = useState<ExamQuestion[]>([])
  const [phase, setPhase] = useState<ExamPhase>('loading')
  const [loadError, setLoadError] = useState<string | null>(null)
  const [userEmail, setUserEmail] = useState<string>('')

  // Exam session state
  const [currentIndex, setCurrentIndex] = useState(0)
  const [answers, setAnswers] = useState<Record<string, string>>({})
  const [flagged, setFlagged] = useState<Set<string>>(new Set())
  const [startTime, setStartTime] = useState<number>(Date.now())
  const [submitResult, setSubmitResult] = useState<SubmitResult | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const currentQuestion = questions[currentIndex] ?? null
  const totalQuestions = questions.length
  const answeredCount = Object.keys(answers).length

  // ---------------------------------------------------------------------------
  // Load course info and questions on mount
  // ---------------------------------------------------------------------------
  useEffect(() => {
    async function load() {
      setPhase('loading')
      setLoadError(null)

      try {
        // Get authenticated user
        const supabase = createClient()
        const { data: { user } } = await supabase.auth.getUser()
        setUserEmail(user?.email ?? '')

        // Fetch course info
        const courseRes = await fetch(`/api/courses/${courseSlug}`)
        if (courseRes.ok) {
          const courseData = await courseRes.json()
          setCourseInfo(courseData)
        }

        // Attempt to fetch exam questions
        // The questions endpoint may not exist yet (Phase 7 generates them).
        // We handle the no-questions case gracefully.
        const questionsRes = await fetch(
          `/api/quiz/questions?course_slug=${encodeURIComponent(courseSlug)}&type=practice_exam`
        )
        if (questionsRes.ok) {
          const data = await questionsRes.json()
          const qs: ExamQuestion[] = data.questions ?? data ?? []
          if (qs.length === 0) {
            setPhase('no-questions')
          } else {
            setQuestions(qs)
            setPhase('intro')
          }
        } else if (questionsRes.status === 404) {
          // Endpoint does not exist yet — not an error, just no questions
          setPhase('no-questions')
        } else {
          // Unexpected API error
          setPhase('no-questions')
        }
      } catch {
        // Network error or missing endpoint — show no-questions placeholder
        setPhase('no-questions')
      }
    }

    load()
  }, [courseSlug])

  // ---------------------------------------------------------------------------
  // Exam interaction handlers
  // ---------------------------------------------------------------------------

  const handleAnswer = useCallback((questionId: string, choice: string) => {
    setAnswers((prev) => ({ ...prev, [questionId]: choice }))
  }, [])

  const handleFlag = useCallback(() => {
    if (!currentQuestion) return
    setFlagged((prev) => {
      const next = new Set(prev)
      if (next.has(currentQuestion.id)) next.delete(currentQuestion.id)
      else next.add(currentQuestion.id)
      return next
    })
  }, [currentQuestion])

  const handleStartExam = useCallback(() => {
    setStartTime(Date.now())
    setPhase('exam')
  }, [])

  const handleTimeUp = useCallback(() => {
    void doSubmit()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [answers])

  const doSubmit = useCallback(async () => {
    setIsSubmitting(true)
    setPhase('submitting')
    const timeTakenSeconds = Math.floor((Date.now() - startTime) / 1000)

    const payload = {
      user_email: userEmail,
      course_id: courseInfo?.id ?? courseSlug,
      quiz_type: 'practice_exam',
      answers: Object.entries(answers).map(([question_id, selected_answer]) => ({
        question_id,
        selected_answer,
      })),
      time_taken_seconds: timeTakenSeconds,
    }

    try {
      const res = await fetch('/api/quiz/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })

      if (res.ok) {
        const data: SubmitResult = await res.json()
        setSubmitResult(data)
        setPhase('results')
      } else {
        // API exists but returned an error — grade client-side as fallback
        setSubmitResult(gradeLocally(questions, answers, startTime))
        setPhase('results')
      }
    } catch {
      // No submit endpoint yet — grade locally
      setSubmitResult(gradeLocally(questions, answers, startTime))
      setPhase('results')
    } finally {
      setIsSubmitting(false)
    }
  }, [answers, courseInfo, courseSlug, questions, startTime, userEmail])

  const handleSubmit = useCallback(() => {
    void doSubmit()
  }, [doSubmit])

  const handleRetake = useCallback(() => {
    setAnswers({})
    setFlagged(new Set())
    setCurrentIndex(0)
    setSubmitResult(null)
    setStartTime(Date.now())
    setPhase('intro')
  }, [])

  // ---------------------------------------------------------------------------
  // LOADING phase
  // ---------------------------------------------------------------------------
  if (phase === 'loading') {
    return (
      <div className="flex h-[60vh] items-center justify-center">
        <div className="flex flex-col items-center gap-4 text-muted-foreground">
          <Loader2 className="size-8 animate-spin text-cai-blue" />
          <p className="text-sm">Loading exam…</p>
        </div>
      </div>
    )
  }

  // ---------------------------------------------------------------------------
  // SUBMITTING phase
  // ---------------------------------------------------------------------------
  if (phase === 'submitting') {
    return (
      <div className="flex h-[60vh] items-center justify-center">
        <div className="flex flex-col items-center gap-4 text-muted-foreground">
          <Loader2 className="size-8 animate-spin text-cai-blue" />
          <p className="text-sm">Grading your exam…</p>
        </div>
      </div>
    )
  }

  // ---------------------------------------------------------------------------
  // NO-QUESTIONS phase — placeholder until Phase 7 generates questions
  // ---------------------------------------------------------------------------
  if (phase === 'no-questions') {
    const displaySlug = courseSlug.toUpperCase().replace(/-PREP$/, '').replace(/-/g, ' ')
    return (
      <div className="max-w-2xl mx-auto py-12 px-4">
        <FadeIn>
          <Card className="border-border/50 bg-card/50 backdrop-blur">
            <CardContent className="py-12 text-center space-y-6">
              <div className="mx-auto w-16 h-16 rounded-full bg-cai-amber/20 flex items-center justify-center">
                <Clock className="h-8 w-8 text-cai-amber" />
              </div>
              <div>
                <h2 className="text-2xl font-bold mb-2">
                  Questions Coming Soon
                </h2>
                <p className="text-muted-foreground">
                  Practice exam questions for{' '}
                  <span className="font-medium text-foreground">{courseInfo?.title ?? displaySlug}</span>{' '}
                  are being generated. Check back soon.
                </p>
              </div>
              <div className="p-4 rounded-lg bg-amber-500/10 border border-amber-500/20 text-left">
                <div className="flex items-start gap-2">
                  <AlertTriangle className="h-5 w-5 text-amber-500 shrink-0 mt-0.5" />
                  <p className="text-sm text-muted-foreground">
                    Our AI is building a comprehensive question bank based on
                    official CAMICB domain weights. This typically completes
                    within 24 hours of course content being published.
                  </p>
                </div>
              </div>
              <Button asChild className="bg-cai-blue hover:bg-cai-blue/90">
                <a href={`/courses/${courseSlug}`}>Back to Course</a>
              </Button>
            </CardContent>
          </Card>
        </FadeIn>
      </div>
    )
  }

  // ---------------------------------------------------------------------------
  // INTRO phase
  // ---------------------------------------------------------------------------
  if (phase === 'intro') {
    const displayName =
      courseInfo?.title ??
      courseSlug.toUpperCase().replace(/-PREP$/, '').replace(/-/g, ' ')

    return (
      <div className="max-w-2xl mx-auto py-12 px-4">
        <FadeIn>
          <Card className="border-border/50 bg-card/50 backdrop-blur">
            <CardHeader className="text-center">
              <div className="mx-auto mb-4 w-16 h-16 rounded-full bg-cai-blue/20 flex items-center justify-center">
                <Trophy className="h-8 w-8 text-cai-blue" />
              </div>
              <CardTitle className="text-2xl">Practice Exam</CardTitle>
              <p className="text-muted-foreground mt-2">
                {displayName} Certification Practice Test
              </p>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div className="p-4 rounded-lg bg-muted/50 text-center">
                  <p className="text-2xl font-bold">{totalQuestions}</p>
                  <p className="text-sm text-muted-foreground">Questions</p>
                </div>
                <div className="p-4 rounded-lg bg-muted/50 text-center">
                  <p className="text-2xl font-bold">3:00:00</p>
                  <p className="text-sm text-muted-foreground">Time Limit</p>
                </div>
                <div className="p-4 rounded-lg bg-muted/50 text-center">
                  <p className="text-2xl font-bold">62.5%</p>
                  <p className="text-sm text-muted-foreground">Passing Score</p>
                </div>
                <div className="p-4 rounded-lg bg-muted/50 text-center">
                  <p className="text-2xl font-bold">{EXAM_DOMAINS.length}</p>
                  <p className="text-sm text-muted-foreground">Domains</p>
                </div>
              </div>

              <div className="p-4 rounded-lg bg-amber-500/10 border border-amber-500/20">
                <div className="flex items-start gap-2">
                  <AlertTriangle className="h-5 w-5 text-amber-500 shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm font-medium text-amber-400">Exam Rules</p>
                    <ul className="text-sm text-muted-foreground mt-1 space-y-1">
                      <li>Questions are weighted by CAMICB exam domain percentages</li>
                      <li>You can flag questions for review and navigate freely</li>
                      <li>The exam auto-submits when time expires</li>
                      <li>Results show domain-level performance breakdown</li>
                    </ul>
                  </div>
                </div>
              </div>

              <div className="text-sm text-muted-foreground">
                <p className="font-medium mb-2">Domain Weights:</p>
                <div className="space-y-1">
                  {EXAM_DOMAINS.map((d) => (
                    <div key={d.domain} className="flex justify-between">
                      <span>{d.domain}</span>
                      <span className="text-cai-blue">{Math.round(d.weight * 100)}%</span>
                    </div>
                  ))}
                </div>
              </div>

              <Button
                size="lg"
                className="w-full bg-cai-blue hover:bg-cai-blue/90"
                onClick={handleStartExam}
              >
                Start Practice Exam
              </Button>
            </CardContent>
          </Card>
        </FadeIn>
      </div>
    )
  }

  // ---------------------------------------------------------------------------
  // RESULTS phase
  // ---------------------------------------------------------------------------
  if (phase === 'results' && submitResult) {
    const r = submitResult
    const hours = Math.floor((r as unknown as { time_taken?: number } & SubmitResult).time_taken ?? 0 / 3600)
    const timeTakenSec = Math.floor((Date.now() - startTime) / 1000)
    const displayHours = Math.floor(timeTakenSec / 3600)
    const displayMins = Math.floor((timeTakenSec % 3600) / 60)

    return (
      <div className="max-w-4xl mx-auto py-8 px-4 space-y-6">
        <FadeIn>
          <Card className={cn(
            'border-2',
            r.passed ? 'border-green-500/50 bg-green-500/5' : 'border-red-500/50 bg-red-500/5'
          )}>
            <CardContent className="py-8 text-center">
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: 'spring', stiffness: 200, damping: 15, delay: 0.2 }}
              >
                {r.passed ? (
                  <CheckCircle className="h-16 w-16 text-green-500 mx-auto mb-4" />
                ) : (
                  <XCircle className="h-16 w-16 text-red-500 mx-auto mb-4" />
                )}
              </motion.div>
              <h2 className="text-3xl font-bold mb-2">
                {r.passed ? 'Congratulations!' : 'Keep Studying'}
              </h2>
              <p className="text-muted-foreground">
                {r.passed
                  ? 'You passed the practice exam!'
                  : 'You need 62.5% to pass. Review weak domains and try again.'}
              </p>
              {r.xp_earned > 0 && (
                <p className="text-cai-gold font-medium mt-2">
                  +{r.xp_earned} XP earned
                </p>
              )}
              <div className="flex justify-center gap-8 mt-6">
                <div>
                  <p className="text-4xl font-bold text-cai-blue">
                    <AnimatedCounter value={Math.round(r.percentage)} suffix="%" />
                  </p>
                  <p className="text-sm text-muted-foreground">Score</p>
                </div>
                <div>
                  <p className="text-4xl font-bold">
                    <AnimatedCounter value={r.score} />/{r.total}
                  </p>
                  <p className="text-sm text-muted-foreground">Correct</p>
                </div>
                <div>
                  <p className="text-4xl font-bold">
                    {displayHours > 0 && `${displayHours}h `}{displayMins}m
                  </p>
                  <p className="text-sm text-muted-foreground">Time</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </FadeIn>

        {/* Domain Breakdown */}
        <FadeIn delay={200}>
          <Card className="border-border/50 bg-card/50 backdrop-blur">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="h-5 w-5 text-cai-blue" />
                Domain Performance
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {r.domain_scores.map((ds) => {
                  const pct = ds.percentage
                  return (
                    <div key={ds.domain}>
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-sm">{ds.domain}</span>
                        <div className="flex items-center gap-2">
                          <span className="text-xs text-muted-foreground">
                            {ds.correct}/{ds.total}
                          </span>
                          <Badge
                            className={cn(
                              'text-xs',
                              pct >= 70 && 'bg-green-500/20 text-green-400',
                              pct >= 50 && pct < 70 && 'bg-yellow-500/20 text-yellow-400',
                              pct < 50 && 'bg-red-500/20 text-red-400',
                            )}
                          >
                            {Math.round(pct)}%
                          </Badge>
                        </div>
                      </div>
                      <Progress value={pct} className="h-2" />
                    </div>
                  )
                })}
              </div>
            </CardContent>
          </Card>
        </FadeIn>

        <div className="flex gap-3 justify-center">
          <Button variant="outline" onClick={handleRetake}>
            <RotateCcw className="h-4 w-4 mr-2" />
            Retake Exam
          </Button>
          <Button className="bg-cai-blue hover:bg-cai-blue/90" asChild>
            <a href={`/courses/${courseSlug}`}>Back to Course</a>
          </Button>
        </div>
      </div>
    )
  }

  // ---------------------------------------------------------------------------
  // EXAM phase
  // ---------------------------------------------------------------------------
  if (!currentQuestion) return null

  return (
    <div className="h-[calc(100vh-4rem)] flex">
      {/* Question navigator sidebar */}
      <motion.aside
        initial={{ width: 0, opacity: 0 }}
        animate={{ width: 240, opacity: 1 }}
        className="border-r border-border/50 bg-card/50 p-4 shrink-0 hidden lg:block"
      >
        <div className="flex items-center justify-between mb-3">
          <p className="text-sm font-medium">Questions</p>
          <Badge variant="outline" className="text-xs">
            {answeredCount}/{totalQuestions}
          </Badge>
        </div>
        <ScrollArea className="h-[calc(100vh-12rem)]">
          <div className="grid grid-cols-5 gap-1.5">
            {questions.map((q, i) => (
              <button
                key={q.id}
                onClick={() => setCurrentIndex(i)}
                className={cn(
                  'w-9 h-9 text-xs rounded-md flex items-center justify-center transition-colors font-medium',
                  i === currentIndex && 'ring-2 ring-cai-blue',
                  answers[q.id] && !flagged.has(q.id) && 'bg-cai-teal/20 text-cai-teal',
                  flagged.has(q.id) && 'bg-amber-500/20 text-amber-400',
                  !answers[q.id] && !flagged.has(q.id) && 'bg-muted/50 text-muted-foreground hover:bg-muted',
                )}
              >
                {i + 1}
              </button>
            ))}
          </div>
        </ScrollArea>
        <div className="mt-3 space-y-1 text-xs text-muted-foreground">
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 rounded bg-cai-teal/20" /> Answered
          </div>
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 rounded bg-amber-500/20" /> Flagged
          </div>
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 rounded bg-muted/50" /> Unanswered
          </div>
        </div>
      </motion.aside>

      {/* Main exam area */}
      <div className="flex-1 flex flex-col">
        {/* Top bar */}
        <div className="flex items-center justify-between px-4 py-2 border-b border-border/50 bg-card/50">
          <div className="flex items-center gap-3">
            <ExamTimer totalSeconds={10800} onTimeUp={handleTimeUp} />
            <Badge variant="outline" className="text-xs">
              {currentIndex + 1} / {totalQuestions}
            </Badge>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              className={cn(flagged.has(currentQuestion.id) && 'text-amber-400 border-amber-500/50')}
              onClick={handleFlag}
            >
              <Flag className="h-4 w-4 mr-1" />
              {flagged.has(currentQuestion.id) ? 'Unflag' : 'Flag'}
            </Button>
            <Button
              size="sm"
              variant="destructive"
              onClick={handleSubmit}
              disabled={answeredCount < totalQuestions * 0.5 || isSubmitting}
            >
              {isSubmitting ? (
                <Loader2 className="h-4 w-4 mr-1 animate-spin" />
              ) : null}
              Submit Exam ({answeredCount}/{totalQuestions})
            </Button>
          </div>
        </div>

        {/* Question */}
        <ScrollArea className="flex-1 p-6">
          <div className="max-w-3xl mx-auto">
            <AnimatePresence mode="wait">
              <motion.div
                key={currentQuestion.id}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.2 }}
              >
                <div className="flex items-center gap-2 mb-4">
                  <Badge className="bg-cai-blue/20 text-cai-blue text-xs">
                    {currentQuestion.exam_domain}
                  </Badge>
                  {currentQuestion.texas_law_reference && (
                    <Badge variant="outline" className="text-xs text-amber-400 border-amber-500/30">
                      {currentQuestion.texas_law_reference}
                    </Badge>
                  )}
                </div>

                <p className="text-lg font-medium mb-6 leading-relaxed">
                  {currentQuestion.question_text}
                </p>

                <div className="space-y-3">
                  {currentQuestion.choices.map((choice, idx) => {
                    const letter = String.fromCharCode(65 + idx)
                    const isSelected = answers[currentQuestion.id] === choice.text

                    return (
                      <button
                        key={idx}
                        onClick={() => handleAnswer(currentQuestion.id, choice.text)}
                        className={cn(
                          'w-full text-left p-4 rounded-lg border-2 transition-all',
                          'flex items-start gap-3',
                          isSelected
                            ? 'border-cai-blue bg-cai-blue/10'
                            : 'border-border/50 hover:border-border bg-background/50'
                        )}
                      >
                        <span className={cn(
                          'shrink-0 w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold',
                          isSelected ? 'bg-cai-blue text-white' : 'bg-muted text-muted-foreground'
                        )}>
                          {letter}
                        </span>
                        <p className="text-sm pt-1">{choice.text}</p>
                      </button>
                    )
                  })}
                </div>
              </motion.div>
            </AnimatePresence>
          </div>
        </ScrollArea>

        {/* Bottom nav */}
        <div className="flex items-center justify-between px-6 py-3 border-t border-border/50 bg-card/50">
          <Button
            variant="outline"
            size="sm"
            disabled={currentIndex === 0}
            onClick={() => setCurrentIndex((i) => Math.max(0, i - 1))}
          >
            <ArrowLeft className="h-4 w-4 mr-1" />
            Previous
          </Button>
          <Progress value={(answeredCount / totalQuestions) * 100} className="w-48 h-2 mx-4" />
          <Button
            variant="outline"
            size="sm"
            disabled={currentIndex === totalQuestions - 1}
            onClick={() => setCurrentIndex((i) => Math.min(totalQuestions - 1, i + 1))}
          >
            Next
            <ArrowRight className="h-4 w-4 ml-1" />
          </Button>
        </div>
      </div>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Local grading fallback (used when /api/quiz/submit is unavailable)
// ---------------------------------------------------------------------------

function gradeLocally(
  questions: ExamQuestion[],
  answers: Record<string, string>,
  startTime: number
): SubmitResult {
  let correct = 0
  const domainMap: Record<string, { correct: number; total: number }> = {}
  const graded_answers: SubmitResult['graded_answers'] = []

  questions.forEach((q) => {
    const domain = q.exam_domain
    if (!domainMap[domain]) domainMap[domain] = { correct: 0, total: 0 }
    domainMap[domain].total++

    const userAnswer = answers[q.id] ?? ''
    const correctChoice = q.choices.find((c) => c.is_correct)
    const correctText = correctChoice?.text ?? ''
    const isCorrect = userAnswer === correctText

    if (isCorrect) {
      correct++
      domainMap[domain].correct++
    }

    graded_answers.push({
      question_id: q.id,
      selected_answer: userAnswer,
      correct_answer: correctText,
      is_correct: isCorrect,
      explanation: q.explanation,
    })
  })

  const total = questions.length
  const percentage = total > 0 ? (correct / total) * 100 : 0
  const passed = percentage >= 62.5

  const domain_scores: DomainScore[] = Object.entries(domainMap).map(
    ([domain, ds]) => ({
      domain,
      correct: ds.correct,
      total: ds.total,
      percentage: ds.total > 0 ? (ds.correct / ds.total) * 100 : 0,
    })
  )

  return {
    score: correct,
    total,
    percentage,
    passed,
    domain_scores,
    graded_answers,
    xp_earned: passed ? 500 : 100,
  }
}

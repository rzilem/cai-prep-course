'use client'

import { useState, useCallback, useMemo } from 'react'
import { useParams } from 'next/navigation'
import { motion, AnimatePresence } from 'motion/react'
import {
  ArrowLeft, ArrowRight, Flag, CheckCircle, XCircle,
  BarChart3, Clock, Trophy, AlertTriangle, RotateCcw,
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { ScrollArea } from '@/components/ui/scroll-area'
import { cn } from '@/lib/utils'
import { ExamTimer } from '@/components/quiz/exam-timer'
import { ProgressRing } from '@/components/quiz/progress-ring'
import { AnimatedCounter } from '@/components/animated-counter'
import { FadeIn } from '@/components/fade-in'
import { EXAM_DOMAINS } from '@/lib/types'

// Mock exam questions for now
const MOCK_QUESTIONS = Array.from({ length: 120 }, (_, i) => ({
  id: `q-${i + 1}`,
  question_text: `Practice question ${i + 1}: What is the correct approach when dealing with ${
    ['financial audits', 'governance disputes', 'vendor contracts', 'fair housing complaints',
     'reserve studies', 'board elections', 'assessment collection'][i % 7]
  } in a community association?`,
  question_type: 'multiple_choice' as const,
  choices: [
    { text: 'Option A — Follow established procedures', is_correct: i % 4 === 0, explanation: 'This follows industry best practices.' },
    { text: 'Option B — Consult the governing documents', is_correct: i % 4 === 1, explanation: 'Always check governing documents first.' },
    { text: 'Option C — Seek legal counsel', is_correct: i % 4 === 2, explanation: 'Legal guidance ensures compliance.' },
    { text: 'Option D — Defer to the board', is_correct: i % 4 === 3, explanation: 'Board authority is paramount in governance.' },
  ],
  explanation: 'The correct approach balances legal requirements, governing documents, and practical considerations.',
  texas_law_reference: i % 3 === 0 ? 'Tex. Prop. Code §209.005' : null,
  exam_domain: EXAM_DOMAINS[i % EXAM_DOMAINS.length].domain,
  difficulty: ((i % 5) + 1) as 1 | 2 | 3 | 4 | 5,
  times_shown: 0,
  times_correct: 0,
  is_published: true,
  created_at: new Date().toISOString(),
  lesson_id: null,
  module_id: null,
  course_id: 'cmca',
}))

type ExamPhase = 'intro' | 'exam' | 'results'

export default function PracticeExamPage() {
  const params = useParams()
  const courseSlug = params.courseSlug as string

  const [phase, setPhase] = useState<ExamPhase>('intro')
  const [currentIndex, setCurrentIndex] = useState(0)
  const [answers, setAnswers] = useState<Record<string, string>>({})
  const [flagged, setFlagged] = useState<Set<string>>(new Set())
  const [startTime] = useState(Date.now())
  const [showNavigator, setShowNavigator] = useState(true)

  const currentQuestion = MOCK_QUESTIONS[currentIndex]
  const totalQuestions = MOCK_QUESTIONS.length
  const answeredCount = Object.keys(answers).length

  const handleAnswer = useCallback((questionId: string, choice: string) => {
    setAnswers((prev) => ({ ...prev, [questionId]: choice }))
  }, [])

  const handleFlag = useCallback(() => {
    setFlagged((prev) => {
      const next = new Set(prev)
      if (next.has(currentQuestion.id)) next.delete(currentQuestion.id)
      else next.add(currentQuestion.id)
      return next
    })
  }, [currentQuestion.id])

  const handleSubmit = useCallback(() => {
    setPhase('results')
  }, [])

  const handleTimeUp = useCallback(() => {
    setPhase('results')
  }, [])

  // Grade results
  const results = useMemo(() => {
    if (phase !== 'results') return null
    let correct = 0
    const domainScores: Record<string, { correct: number; total: number }> = {}

    MOCK_QUESTIONS.forEach((q) => {
      const domain = q.exam_domain
      if (!domainScores[domain]) domainScores[domain] = { correct: 0, total: 0 }
      domainScores[domain].total++

      const userAnswer = answers[q.id]
      const correctChoice = q.choices.find((c) => c.is_correct)
      if (userAnswer === correctChoice?.text) {
        correct++
        domainScores[domain].correct++
      }
    })

    const score = (correct / totalQuestions) * 100
    const passed = score >= 62.5
    const timeTaken = Math.floor((Date.now() - startTime) / 1000)

    return { correct, total: totalQuestions, score, passed, domainScores, timeTaken }
  }, [phase, answers, startTime, totalQuestions])

  // =========================================================================
  // INTRO PHASE
  // =========================================================================
  if (phase === 'intro') {
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
                {courseSlug.toUpperCase().replace('-PREP', '')} Certification Practice Test
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
                  <p className="text-2xl font-bold">7</p>
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
                onClick={() => setPhase('exam')}
              >
                Start Practice Exam
              </Button>
            </CardContent>
          </Card>
        </FadeIn>
      </div>
    )
  }

  // =========================================================================
  // RESULTS PHASE
  // =========================================================================
  if (phase === 'results' && results) {
    const hours = Math.floor(results.timeTaken / 3600)
    const mins = Math.floor((results.timeTaken % 3600) / 60)

    return (
      <div className="max-w-4xl mx-auto py-8 px-4 space-y-6">
        <FadeIn>
          <Card className={cn(
            'border-2',
            results.passed ? 'border-green-500/50 bg-green-500/5' : 'border-red-500/50 bg-red-500/5'
          )}>
            <CardContent className="py-8 text-center">
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: 'spring', stiffness: 200, damping: 15, delay: 0.2 }}
              >
                {results.passed ? (
                  <CheckCircle className="h-16 w-16 text-green-500 mx-auto mb-4" />
                ) : (
                  <XCircle className="h-16 w-16 text-red-500 mx-auto mb-4" />
                )}
              </motion.div>
              <h2 className="text-3xl font-bold mb-2">
                {results.passed ? 'Congratulations!' : 'Keep Studying'}
              </h2>
              <p className="text-muted-foreground">
                {results.passed
                  ? 'You passed the practice exam!'
                  : 'You need 62.5% to pass. Review weak domains and try again.'}
              </p>
              <div className="flex justify-center gap-8 mt-6">
                <div>
                  <p className="text-4xl font-bold text-cai-blue">
                    <AnimatedCounter value={Math.round(results.score)} suffix="%" />
                  </p>
                  <p className="text-sm text-muted-foreground">Score</p>
                </div>
                <div>
                  <p className="text-4xl font-bold">
                    <AnimatedCounter value={results.correct} />/{results.total}
                  </p>
                  <p className="text-sm text-muted-foreground">Correct</p>
                </div>
                <div>
                  <p className="text-4xl font-bold">
                    {hours > 0 && `${hours}h `}{mins}m
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
                {EXAM_DOMAINS.map((domain) => {
                  const ds = results.domainScores[domain.domain]
                  if (!ds) return null
                  const pct = ds.total > 0 ? (ds.correct / ds.total) * 100 : 0
                  return (
                    <div key={domain.domain}>
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-sm">{domain.domain}</span>
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
          <Button variant="outline" onClick={() => { setPhase('intro'); setAnswers({}); setFlagged(new Set()); setCurrentIndex(0) }}>
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

  // =========================================================================
  // EXAM PHASE
  // =========================================================================
  return (
    <div className="h-[calc(100vh-4rem)] flex">
      {/* Question navigator sidebar */}
      {showNavigator && (
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
              {MOCK_QUESTIONS.map((q, i) => (
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
      )}

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
              disabled={answeredCount < totalQuestions * 0.5}
            >
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

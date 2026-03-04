'use client'

import { useState, useCallback, useEffect } from 'react'
import {
  RotateCcw,
  Layers,
  Flame,
  CheckCircle2,
  BookOpen,
  Filter,
  Sparkles,
  Brain,
  Loader2,
} from 'lucide-react'
import { motion, AnimatePresence } from 'motion/react'

import { FadeIn } from '@/components/fade-in'
import { AnimatedCounter } from '@/components/animated-counter'
import { useSound } from '@/components/providers'
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { createClient } from '@/lib/supabase/client'

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface FlashcardQuestion {
  id: string
  question_text: string
  answer_text: string
  explanation: string | null
  course_id: string | null
  module_id: string | null
  lesson_id: string | null
  exam_domain: string | null
  difficulty: number
  question_type: string
}

interface FlashcardRecord {
  id: string
  question_id: string
  ease_factor: number
  interval: number
  repetitions: number
  next_review: string | null
  last_reviewed: string | null
  question: FlashcardQuestion
}

// Internal display shape used by the card UI
interface Flashcard {
  id: string
  question_id: string
  question: string
  answer: string
  course: string
  module: string
  difficulty: number
  easeFactor: number
  interval: number
  repetitions: number
}

// SM-2 rating labels and colors
const ratingButtons = [
  {
    label: 'Again',
    rating: 'again' as const,
    quality: 0,
    color: 'bg-cai-red hover:bg-cai-red/90 text-white',
    description: 'Complete blackout',
  },
  {
    label: 'Hard',
    rating: 'hard' as const,
    quality: 2,
    color: 'bg-cai-amber hover:bg-cai-amber/90 text-white',
    description: 'Incorrect, but recognized',
  },
  {
    label: 'Good',
    rating: 'good' as const,
    quality: 3,
    color: 'bg-cai-blue hover:bg-cai-blue/90 text-white',
    description: 'Correct with effort',
  },
  {
    label: 'Easy',
    rating: 'easy' as const,
    quality: 5,
    color: 'bg-cai-emerald hover:bg-cai-emerald/90 text-white',
    description: 'Instant recall',
  },
]

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function mapRecord(rec: FlashcardRecord): Flashcard {
  const q = rec.question
  return {
    id: rec.id,
    question_id: rec.question_id,
    question: q.question_text,
    // Prefer answer_text; fall back to explanation
    answer: q.answer_text || q.explanation || '',
    course: q.exam_domain ?? q.course_id ?? 'General',
    module: q.exam_domain ?? 'General',
    difficulty: q.difficulty ?? 3,
    easeFactor: rec.ease_factor,
    interval: rec.interval,
    repetitions: rec.repetitions,
  }
}

// ---------------------------------------------------------------------------
// Flashcard Page
// ---------------------------------------------------------------------------

export default function FlashcardsPage() {
  const { playSound } = useSound()

  // Data state
  const [queue, setQueue] = useState<Flashcard[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [loadError, setLoadError] = useState<string | null>(null)
  const [userEmail, setUserEmail] = useState<string>('')
  const [dueToday, setDueToday] = useState(0)

  // Session state
  const [currentIndex, setCurrentIndex] = useState(0)
  const [isFlipped, setIsFlipped] = useState(false)
  const [reviewedToday, setReviewedToday] = useState(0)
  const [correctToday, setCorrectToday] = useState(0)

  // Filter state (derived from loaded queue — no separate API call)
  const [selectedCourse, setSelectedCourse] = useState<string>('all')
  const [selectedModule, setSelectedModule] = useState<string>('all')
  const [fullQueue, setFullQueue] = useState<Flashcard[]>([])

  const currentCard = queue[currentIndex] ?? null
  const cardsRemaining = queue.length - currentIndex
  const isEmpty = !currentCard

  // Unique values for filters
  const uniqueCourses = [...new Set(fullQueue.map((c) => c.course))]
  const uniqueModules = [
    ...new Set(
      fullQueue
        .filter((c) => selectedCourse === 'all' || c.course === selectedCourse)
        .map((c) => c.module)
    ),
  ]

  // ---------------------------------------------------------------------------
  // Load flashcards on mount
  // ---------------------------------------------------------------------------
  useEffect(() => {
    async function loadCards() {
      setIsLoading(true)
      setLoadError(null)
      try {
        // Get authenticated user email
        const supabase = createClient()
        const { data: { user } } = await supabase.auth.getUser()
        const email = user?.email ?? ''
        setUserEmail(email)

        const url = email
          ? `/api/flashcards?user_email=${encodeURIComponent(email)}`
          : '/api/flashcards'

        const res = await fetch(url)
        if (!res.ok) {
          throw new Error(`Failed to load flashcards (${res.status})`)
        }

        const data = await res.json() as {
          cards: FlashcardRecord[]
          stats: { due_today: number; reviewed_today: number }
        }

        const mapped = (data.cards ?? []).map(mapRecord)
        setFullQueue(mapped)
        setQueue(mapped)
        setDueToday(data.stats?.due_today ?? mapped.length)
        setReviewedToday(data.stats?.reviewed_today ?? 0)
      } catch (err) {
        setLoadError(
          err instanceof Error ? err.message : 'Could not load flashcards'
        )
      } finally {
        setIsLoading(false)
      }
    }

    loadCards()
  }, [])

  // ---------------------------------------------------------------------------
  // Handlers
  // ---------------------------------------------------------------------------

  function handleFlip() {
    setIsFlipped(true)
    playSound('page_turn')
  }

  const handleRate = useCallback(
    async (rating: 'again' | 'hard' | 'good' | 'easy', quality: number) => {
      if (!currentCard) return

      setReviewedToday((prev) => prev + 1)
      if (quality >= 3) {
        setCorrectToday((prev) => prev + 1)
        playSound('correct')
      } else {
        playSound('wrong')
      }

      // Optimistically advance the card before the API call
      setIsFlipped(false)
      setTimeout(() => {
        setCurrentIndex((prev) => prev + 1)
      }, 200)

      // Fire-and-forget rating update
      try {
        await fetch('/api/flashcards', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            user_email: userEmail,
            question_id: currentCard.question_id,
            rating,
          }),
        })
      } catch {
        // Non-blocking — rating failure does not interrupt review session
      }
    },
    [currentCard, playSound, userEmail]
  )

  function handleReset() {
    setCurrentIndex(0)
    setIsFlipped(false)
  }

  function handleApplyFilter() {
    const filtered = fullQueue.filter((card) => {
      if (selectedCourse !== 'all' && card.course !== selectedCourse) return false
      if (selectedModule !== 'all' && card.module !== selectedModule) return false
      return true
    })
    setQueue(filtered)
    setCurrentIndex(0)
    setIsFlipped(false)
  }

  // ---------------------------------------------------------------------------
  // Loading state
  // ---------------------------------------------------------------------------
  if (isLoading) {
    return (
      <div className="flex h-[60vh] items-center justify-center">
        <div className="flex flex-col items-center gap-4 text-muted-foreground">
          <Loader2 className="size-8 animate-spin text-cai-purple" />
          <p className="text-sm">Loading your flashcards…</p>
        </div>
      </div>
    )
  }

  // ---------------------------------------------------------------------------
  // No questions state (cai_questions table empty — Phase 7 not yet run)
  // ---------------------------------------------------------------------------
  if (!isLoading && !loadError && fullQueue.length === 0) {
    return (
      <div className="space-y-8">
        <FadeIn delay={0}>
          <div>
            <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
              <Brain className="size-8 text-cai-purple" />
              Flashcard Review
            </h1>
            <p className="mt-1 text-muted-foreground">
              SM-2 spaced repetition — rate each card to optimize your review
              schedule
            </p>
          </div>
        </FadeIn>

        <FadeIn delay={80}>
          <Card>
            <CardContent className="flex flex-col items-center gap-6 py-16 text-center">
              <div className="flex size-20 items-center justify-center rounded-full bg-cai-purple/10">
                <Brain className="size-10 text-cai-purple" />
              </div>
              <div>
                <h3 className="text-xl font-semibold">
                  No flashcards available yet
                </h3>
                <p className="mt-2 text-muted-foreground max-w-md">
                  Flashcards are generated from quiz questions as you complete
                  lessons. Finish some lesson quizzes to populate your deck.
                </p>
              </div>
              <Button asChild className="bg-cai-blue hover:bg-cai-blue/90 gap-1">
                <a href="/courses">
                  <BookOpen className="size-4" />
                  Go to Courses
                </a>
              </Button>
            </CardContent>
          </Card>
        </FadeIn>
      </div>
    )
  }

  // ---------------------------------------------------------------------------
  // Error state
  // ---------------------------------------------------------------------------
  if (loadError) {
    return (
      <div className="flex h-[60vh] items-center justify-center">
        <Card className="max-w-md w-full">
          <CardContent className="flex flex-col items-center gap-4 py-12 text-center">
            <p className="text-muted-foreground text-sm">{loadError}</p>
            <Button
              variant="outline"
              onClick={() => window.location.reload()}
              className="gap-1"
            >
              <RotateCcw className="size-4" />
              Try Again
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  // ---------------------------------------------------------------------------
  // Main render
  // ---------------------------------------------------------------------------
  return (
    <div className="space-y-8">
      {/* ── Header ───────────────────────────────────────────────── */}
      <FadeIn delay={0}>
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
              <Brain className="size-8 text-cai-purple" />
              Flashcard Review
            </h1>
            <p className="mt-1 text-muted-foreground">
              SM-2 spaced repetition — rate each card to optimize your review
              schedule
            </p>
          </div>
        </div>
      </FadeIn>

      {/* ── Stats Bar ────────────────────────────────────────────── */}
      <FadeIn delay={60}>
        <div className="flex flex-wrap items-center gap-4">
          <div className="flex items-center gap-2 rounded-lg border px-4 py-2">
            <Layers className="size-4 text-cai-blue" />
            <div>
              <p className="text-xs text-muted-foreground">Cards Due</p>
              <p className="text-sm font-semibold">
                <AnimatedCounter value={cardsRemaining > 0 ? cardsRemaining : 0} />
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 rounded-lg border px-4 py-2">
            <CheckCircle2 className="size-4 text-cai-emerald" />
            <div>
              <p className="text-xs text-muted-foreground">Reviewed</p>
              <p className="text-sm font-semibold">
                <AnimatedCounter value={reviewedToday} />
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 rounded-lg border px-4 py-2">
            <Flame className="size-4 text-cai-amber" />
            <div>
              <p className="text-xs text-muted-foreground">Due Today</p>
              <p className="text-sm font-semibold">
                <AnimatedCounter value={dueToday} />
              </p>
            </div>
          </div>
          {reviewedToday > 0 && (
            <div className="flex items-center gap-2 rounded-lg border px-4 py-2">
              <Sparkles className="size-4 text-cai-gold" />
              <div>
                <p className="text-xs text-muted-foreground">Accuracy</p>
                <p className="text-sm font-semibold">
                  {Math.round((correctToday / reviewedToday) * 100)}%
                </p>
              </div>
            </div>
          )}
        </div>
      </FadeIn>

      {/* ── Filter ───────────────────────────────────────────────── */}
      {fullQueue.length > 0 && (
        <FadeIn delay={100}>
          <div className="flex flex-wrap items-center gap-3">
            <Filter className="size-4 text-muted-foreground" />
            <Select
              value={selectedCourse}
              onValueChange={(v) => {
                setSelectedCourse(v)
                setSelectedModule('all')
              }}
            >
              <SelectTrigger className="w-[160px] h-9">
                <SelectValue placeholder="Course" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Courses</SelectItem>
                {uniqueCourses.map((c) => (
                  <SelectItem key={c} value={c}>
                    {c}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={selectedModule} onValueChange={setSelectedModule}>
              <SelectTrigger className="w-[240px] h-9">
                <SelectValue placeholder="Module" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Modules</SelectItem>
                {uniqueModules.map((m) => (
                  <SelectItem key={m} value={m}>
                    {m}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button variant="outline" size="sm" onClick={handleApplyFilter}>
              Apply
            </Button>
          </div>
        </FadeIn>
      )}

      {/* ── Progress Bar ─────────────────────────────────────────── */}
      <FadeIn delay={130}>
        <div className="space-y-1">
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>
              Card {Math.min(currentIndex + 1, queue.length)} of {queue.length}
            </span>
            <span>
              {Math.round(
                (Math.min(currentIndex, queue.length) / Math.max(queue.length, 1)) * 100
              )}
              % complete
            </span>
          </div>
          <Progress
            value={
              (Math.min(currentIndex, queue.length) / Math.max(queue.length, 1)) * 100
            }
            className="h-2 bg-cai-purple/20 [&>[data-slot=progress-indicator]]:bg-cai-purple"
          />
        </div>
      </FadeIn>

      {/* ── Flashcard ────────────────────────────────────────────── */}
      <FadeIn delay={160}>
        <div className="flex justify-center">
          {isEmpty ? (
            /* Empty / session complete state */
            <Card className="w-full max-w-2xl">
              <CardContent className="flex flex-col items-center gap-6 py-16 text-center">
                <motion.div
                  initial={{ scale: 0.8, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ type: 'spring', stiffness: 200, damping: 15 }}
                >
                  <div className="flex size-20 items-center justify-center rounded-full bg-cai-emerald/10">
                    <CheckCircle2 className="size-10 text-cai-emerald" />
                  </div>
                </motion.div>
                <div>
                  <h3 className="text-xl font-semibold">
                    No cards due for review!
                  </h3>
                  <p className="mt-2 text-muted-foreground">
                    {reviewedToday > 0
                      ? `Great work! You reviewed ${reviewedToday} cards today. Come back tomorrow for your next session.`
                      : 'All caught up. Come back tomorrow for more cards.'}
                  </p>
                </div>
                <div className="flex gap-3">
                  <Button
                    variant="outline"
                    onClick={handleReset}
                    className="gap-1"
                  >
                    <RotateCcw className="size-4" />
                    Review Again
                  </Button>
                  <Button
                    asChild
                    className="bg-cai-blue hover:bg-cai-blue/90 gap-1"
                  >
                    <a href="/courses">
                      <BookOpen className="size-4" />
                      Study More
                    </a>
                  </Button>
                </div>
              </CardContent>
            </Card>
          ) : (
            /* Active flashcard */
            <div className="w-full max-w-2xl" style={{ perspective: 1200 }}>
              <motion.div
                onClick={!isFlipped ? handleFlip : undefined}
                animate={{ rotateY: isFlipped ? 180 : 0 }}
                transition={{ duration: 0.5, ease: 'easeInOut' }}
                style={{ transformStyle: 'preserve-3d' }}
                className={`relative min-h-[360px] cursor-pointer ${
                  !isFlipped ? 'hover:shadow-lg hover:shadow-cai-purple/10' : ''
                }`}
              >
                {/* Front (Question) */}
                <Card
                  className="absolute inset-0 border-cai-purple/20 overflow-hidden"
                  style={{ backfaceVisibility: 'hidden' }}
                >
                  <div className="absolute top-0 left-0 right-0 h-1 bg-cai-purple" />
                  <div className="p-6 pb-2 flex items-center justify-between">
                    <Badge
                      variant="outline"
                      className="border-cai-purple/30 text-cai-purple"
                    >
                      {currentCard.course} &bull; {currentCard.module}
                    </Badge>
                    <div className="flex gap-0.5">
                      {Array.from({ length: 5 }).map((_, i) => (
                        <div
                          key={i}
                          className={`size-1.5 rounded-full ${
                            i < currentCard.difficulty
                              ? 'bg-cai-purple'
                              : 'bg-muted'
                          }`}
                        />
                      ))}
                    </div>
                  </div>
                  <div className="flex flex-1 flex-col items-center justify-center gap-6 px-8 pt-8 pb-12 text-center">
                    <div className="flex size-12 items-center justify-center rounded-full bg-cai-purple/10">
                      <HelpCircleIcon className="size-6 text-cai-purple" />
                    </div>
                    <p className="text-lg font-medium leading-relaxed max-w-lg">
                      {currentCard.question}
                    </p>
                    <p className="text-xs text-muted-foreground animate-pulse">
                      Click to reveal answer
                    </p>
                  </div>
                </Card>

                {/* Back (Answer) */}
                <Card
                  className="absolute inset-0 border-cai-emerald/20 overflow-hidden"
                  style={{
                    backfaceVisibility: 'hidden',
                    transform: 'rotateY(180deg)',
                  }}
                >
                  <div className="absolute top-0 left-0 right-0 h-1 bg-cai-emerald" />
                  <div className="p-6 pb-2 flex items-center justify-between">
                    <Badge
                      variant="outline"
                      className="border-cai-emerald/30 text-cai-emerald"
                    >
                      Answer
                    </Badge>
                    <Badge variant="secondary" className="text-xs">
                      {currentCard.course}
                    </Badge>
                  </div>
                  <div className="px-6 pt-4 pb-8">
                    <div className="space-y-2 text-sm leading-relaxed">
                      {currentCard.answer.split('\n').map((line, i) => {
                        if (line.trim() === '') return <br key={i} />
                        if (line.match(/^\d+\./))
                          return (
                            <li key={i} className="ml-4 list-decimal">
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
                        if (line.startsWith('- **'))
                          return (
                            <li key={i} className="ml-4 list-disc">
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
                        return (
                          <p key={i}>
                            <span
                              dangerouslySetInnerHTML={{
                                __html: line.replace(
                                  /\*\*(.*?)\*\*/g,
                                  '<strong class="text-foreground">$1</strong>'
                                ),
                              }}
                            />
                          </p>
                        )
                      })}
                    </div>
                  </div>
                </Card>
              </motion.div>

              {/* ── Rating Buttons (shown after flip) ───────────── */}
              <AnimatePresence>
                {isFlipped && (
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 20 }}
                    transition={{ delay: 0.3, duration: 0.3 }}
                    className="mt-6"
                  >
                    <p className="text-center text-sm text-muted-foreground mb-3">
                      How well did you know this?
                    </p>
                    <div className="grid grid-cols-4 gap-3">
                      {ratingButtons.map((btn) => (
                        <Button
                          key={btn.label}
                          onClick={() => handleRate(btn.rating, btn.quality)}
                          className={`${btn.color} flex-col h-auto py-3 gap-0.5`}
                        >
                          <span className="font-semibold">{btn.label}</span>
                          <span className="text-[10px] opacity-80">
                            {btn.description}
                          </span>
                        </Button>
                      ))}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          )}
        </div>
      </FadeIn>

      {/* ── Session Stats ────────────────────────────────────────── */}
      {reviewedToday > 0 && (
        <FadeIn delay={200}>
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <Sparkles className="size-5 text-cai-gold" />
                Session Stats
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-3 gap-6 text-center">
                <div>
                  <p className="text-2xl font-bold">
                    <AnimatedCounter value={reviewedToday} />
                  </p>
                  <p className="text-xs text-muted-foreground">Cards Reviewed</p>
                </div>
                <div>
                  <p className="text-2xl font-bold text-cai-emerald">
                    <AnimatedCounter value={correctToday} />
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Correct (Good/Easy)
                  </p>
                </div>
                <div>
                  <p className="text-2xl font-bold">
                    {reviewedToday > 0
                      ? Math.round((correctToday / reviewedToday) * 100)
                      : 0}
                    %
                  </p>
                  <p className="text-xs text-muted-foreground">Accuracy</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </FadeIn>
      )}
    </div>
  )
}

// Inline HelpCircle icon alias to avoid import issues
function HelpCircleIcon({ className }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      <circle cx="12" cy="12" r="10" />
      <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3" />
      <path d="M12 17h.01" />
    </svg>
  )
}

'use client'

import { useState, useCallback } from 'react'
import {
  RotateCcw,
  ChevronRight,
  Layers,
  Clock,
  Flame,
  CheckCircle2,
  BookOpen,
  Filter,
  Sparkles,
  Brain,
} from 'lucide-react'
import { motion, AnimatePresence } from 'motion/react'

import { FadeIn } from '@/components/fade-in'
import { AnimatedCounter } from '@/components/animated-counter'
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

// ---------------------------------------------------------------------------
// Mock Flashcard Data (SM-2 system)
// ---------------------------------------------------------------------------

interface Flashcard {
  id: string
  question: string
  answer: string
  course: string
  module: string
  difficulty: number // 1-5
  easeFactor: number
  interval: number
  repetitions: number
}

const mockFlashcards: Flashcard[] = [
  {
    id: '1',
    question:
      'What are the three fiduciary duties that board members owe to the community association?',
    answer:
      'The three fiduciary duties are:\n\n1. **Duty of Care** - Making informed decisions through proper research and attending meetings\n2. **Duty of Loyalty** - Acting in the best interests of the association, avoiding conflicts of interest\n3. **Duty of Obedience** - Acting within the scope of authority granted by governing documents and law',
    course: 'CMCA',
    module: 'Legal, Ethics & Risk Management',
    difficulty: 3,
    easeFactor: 2.5,
    interval: 0,
    repetitions: 0,
  },
  {
    id: '2',
    question:
      'Under Texas Property Code Section 209.0062, how must HOA payments be applied?',
    answer:
      'Payments must be applied in this priority order:\n\n1. **Current assessments first**\n2. **Delinquent assessments** (oldest first)\n3. **Attorney fees, late charges, and other costs** last\n\nThe HOA cannot apply payments to fees and legal costs before satisfying assessment balances.',
    course: 'CMCA',
    module: 'Financial Management',
    difficulty: 4,
    easeFactor: 2.5,
    interval: 0,
    repetitions: 0,
  },
  {
    id: '3',
    question: 'What is the Business Judgment Rule and what protection does it provide?',
    answer:
      'The **Business Judgment Rule** protects board members from personal liability when they:\n\n- Act in **good faith**\n- Make **informed decisions** (review relevant data)\n- Act in the **association\'s best interest** (not personal gain)\n- Exercise **reasonable care**\n\nIt creates a presumption that the board acted properly unless a challenger can prove one of these elements was missing.',
    course: 'CMCA',
    module: 'Legal, Ethics & Risk Management',
    difficulty: 3,
    easeFactor: 2.5,
    interval: 0,
    repetitions: 0,
  },
  {
    id: '4',
    question:
      'What are the four reserve fund strategies and which is considered the gold standard?',
    answer:
      '1. **Full Funding** (Gold Standard) - Target 100% of estimated replacement costs\n2. **Threshold Funding** - Maintain reserves above a set minimum\n3. **Baseline Funding** - Keep reserves above $0 (high risk)\n4. **Statutory Funding** - Meet minimum state requirements\n\n**Full Funding** is the gold standard because it ensures the association can cover all projected replacement costs without special assessments.',
    course: 'CMCA',
    module: 'Financial Management',
    difficulty: 2,
    easeFactor: 2.5,
    interval: 0,
    repetitions: 0,
  },
  {
    id: '5',
    question:
      'Can a Texas HOA foreclose on a homeowner\'s property for unpaid fines? Cite the relevant statute.',
    answer:
      '**No.** Under **Texas Property Code Section 209.0091**, an HOA may NOT foreclose on a homeowner\'s property solely for:\n- Unpaid fines\n- Unpaid fees (other than assessments)\n\nForeclosure is **only permitted for unpaid assessments** (regular or special). This is a critical consumer protection in Texas law.',
    course: 'CMCA',
    module: 'Legal, Ethics & Risk Management',
    difficulty: 4,
    easeFactor: 2.5,
    interval: 0,
    repetitions: 0,
  },
  {
    id: '6',
    question:
      'What percentage of the CMCA exam is weighted toward Financial Management?',
    answer:
      '**19%** — Financial Management is the single highest-weighted domain on the CMCA exam.\n\nThe full domain breakdown:\n- Financial Management: 19%\n- Community Governance: 18%\n- Legal, Ethics & Risk: 18%\n- Facilities Management: 14%\n- Community Relations: 14%\n- Human Resources: 10%\n- Communications & Technology: 7%',
    course: 'CMCA',
    module: 'Financial Management',
    difficulty: 1,
    easeFactor: 2.5,
    interval: 0,
    repetitions: 0,
  },
  {
    id: '7',
    question:
      'What is the recommended frequency for updating a reserve study?',
    answer:
      'Reserve studies should be updated every **3-5 years**, with a full site inspection.\n\nAnnual updates to the financial projections (without full site visit) are also recommended between full studies. This ensures the funding plan stays current with changing costs, new components, and actual spending patterns.',
    course: 'CMCA',
    module: 'Financial Management',
    difficulty: 2,
    easeFactor: 2.5,
    interval: 0,
    repetitions: 0,
  },
  {
    id: '8',
    question:
      'Name four key provisions of the Fair Housing Act that apply to community associations.',
    answer:
      'The **Fair Housing Act** (Title VIII, Civil Rights Act 1968) prohibits discrimination based on:\n\n1. **Race or Color**\n2. **Religion**\n3. **National Origin**\n4. **Sex** (including gender identity and sexual orientation)\n5. **Familial Status** (families with children under 18)\n6. **Disability** (physical or mental)\n7. **Genetic Information**\n\nFor HOAs specifically:\n- Cannot deny access to common areas\n- Must allow reasonable accommodations for disabilities\n- Cannot restrict families with children (except 55+ communities)\n- Marketing materials must be non-discriminatory',
    course: 'CMCA',
    module: 'Legal, Ethics & Risk Management',
    difficulty: 3,
    easeFactor: 2.5,
    interval: 0,
    repetitions: 0,
  },
]

// SM-2 rating labels and colors
const ratingButtons = [
  {
    label: 'Again',
    quality: 0,
    color: 'bg-cai-red hover:bg-cai-red/90 text-white',
    description: 'Complete blackout',
  },
  {
    label: 'Hard',
    quality: 2,
    color: 'bg-cai-amber hover:bg-cai-amber/90 text-white',
    description: 'Incorrect, but recognized',
  },
  {
    label: 'Good',
    quality: 3,
    color: 'bg-cai-blue hover:bg-cai-blue/90 text-white',
    description: 'Correct with effort',
  },
  {
    label: 'Easy',
    quality: 5,
    color: 'bg-cai-emerald hover:bg-cai-emerald/90 text-white',
    description: 'Instant recall',
  },
]

// ---------------------------------------------------------------------------
// Flashcard Page
// ---------------------------------------------------------------------------

export default function FlashcardsPage() {
  const { playSound } = useSound()
  const [queue, setQueue] = useState<Flashcard[]>([...mockFlashcards])
  const [currentIndex, setCurrentIndex] = useState(0)
  const [isFlipped, setIsFlipped] = useState(false)
  const [reviewedToday, setReviewedToday] = useState(0)
  const [correctToday, setCorrectToday] = useState(0)
  const [selectedCourse, setSelectedCourse] = useState<string>('all')
  const [selectedModule, setSelectedModule] = useState<string>('all')

  const currentCard = queue[currentIndex] || null
  const cardsRemaining = queue.length - currentIndex
  const isEmpty = !currentCard

  // Filter cards
  const filteredQueue = mockFlashcards.filter((card) => {
    if (selectedCourse !== 'all' && card.course !== selectedCourse) return false
    if (selectedModule !== 'all' && card.module !== selectedModule) return false
    return true
  })

  const uniqueCourses = [...new Set(mockFlashcards.map((c) => c.course))]
  const uniqueModules = [
    ...new Set(
      mockFlashcards
        .filter(
          (c) => selectedCourse === 'all' || c.course === selectedCourse
        )
        .map((c) => c.module)
    ),
  ]

  function handleFlip() {
    setIsFlipped(true)
    playSound('page_turn')
  }

  function handleRate(quality: number) {
    setReviewedToday((prev) => prev + 1)
    if (quality >= 3) {
      setCorrectToday((prev) => prev + 1)
      playSound('correct')
    } else {
      playSound('wrong')
    }

    // Move to next card
    setIsFlipped(false)
    // Small delay so flip animation completes before showing next card
    setTimeout(() => {
      if (currentIndex < queue.length - 1) {
        setCurrentIndex((prev) => prev + 1)
      } else {
        // Reset the queue (in real app, SM-2 would reschedule)
        setCurrentIndex(queue.length) // Show empty state
      }
    }, 200)
  }

  function handleReset() {
    setCurrentIndex(0)
    setIsFlipped(false)
    setQueue([...filteredQueue])
  }

  function handleApplyFilter() {
    setQueue([...filteredQueue])
    setCurrentIndex(0)
    setIsFlipped(false)
  }

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
              <p className="text-xs text-muted-foreground">Streak</p>
              <p className="text-sm font-semibold">12 days</p>
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
      <FadeIn delay={100}>
        <div className="flex flex-wrap items-center gap-3">
          <Filter className="size-4 text-muted-foreground" />
          <Select value={selectedCourse} onValueChange={(v) => { setSelectedCourse(v); setSelectedModule('all') }}>
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

      {/* ── Progress Bar ─────────────────────────────────────────── */}
      <FadeIn delay={130}>
        <div className="space-y-1">
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>
              Card {Math.min(currentIndex + 1, queue.length)} of {queue.length}
            </span>
            <span>
              {Math.round(
                (Math.min(currentIndex, queue.length) / queue.length) * 100
              )}
              % complete
            </span>
          </div>
          <Progress
            value={
              (Math.min(currentIndex, queue.length) / queue.length) * 100
            }
            className="h-2 bg-cai-purple/20 [&>[data-slot=progress-indicator]]:bg-cai-purple"
          />
        </div>
      </FadeIn>

      {/* ── Flashcard ────────────────────────────────────────────── */}
      <FadeIn delay={160}>
        <div className="flex justify-center">
          {isEmpty ? (
            /* Empty State */
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
            /* Flashcard */
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
                  <CardHeader className="pb-2">
                    <div className="flex items-center justify-between">
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
                  </CardHeader>
                  <CardContent className="flex flex-1 flex-col items-center justify-center gap-6 pt-8 pb-12 text-center">
                    <div className="flex size-12 items-center justify-center rounded-full bg-cai-purple/10">
                      <HelpCircleIcon className="size-6 text-cai-purple" />
                    </div>
                    <p className="text-lg font-medium leading-relaxed max-w-lg">
                      {currentCard.question}
                    </p>
                    <p className="text-xs text-muted-foreground animate-pulse">
                      Click to reveal answer
                    </p>
                  </CardContent>
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
                  <CardHeader className="pb-2">
                    <div className="flex items-center justify-between">
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
                  </CardHeader>
                  <CardContent className="pt-4 pb-8">
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
                  </CardContent>
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
                          onClick={() => handleRate(btn.quality)}
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

// Inline HelpCircle icon alias to avoid import issues with the name used in the card
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

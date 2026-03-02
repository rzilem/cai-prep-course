// =============================================================================
// CAI Prep Course — Quiz Engine + SM-2 Spaced Repetition
// =============================================================================

import type { Question, FlashcardProgress } from './types'
import { EXAM_DOMAINS } from './types'

// ---------------------------------------------------------------------------
// Quiz Grading
// ---------------------------------------------------------------------------

export interface GradedAnswer {
  question_id: string
  selected: string
  correct_answer: string
  is_correct: boolean
  explanation: string
}

export interface QuizResult {
  score: number
  total: number
  percentage: number
  passed: boolean
  answers: GradedAnswer[]
  domain_scores: DomainScore[]
  time_taken_seconds: number
  xp_earned: number
}

export interface DomainScore {
  domain: string
  correct: number
  total: number
  percentage: number
  weight?: number
}

export function gradeQuiz(
  questions: Question[],
  userAnswers: Record<string, string>,
  quizType: 'lesson' | 'module' | 'practice_exam',
  timeTaken: number
): QuizResult {
  const answers: GradedAnswer[] = questions.map((q) => {
    const selected = userAnswers[q.id] ?? ''
    const correctChoice = q.choices.find((c) => c.is_correct)
    const correct_answer = correctChoice?.text ?? ''
    const is_correct = selected === correct_answer

    return {
      question_id: q.id,
      selected,
      correct_answer,
      is_correct,
      explanation: is_correct
        ? (correctChoice?.explanation ?? q.explanation)
        : q.explanation,
    }
  })

  const score = answers.filter((a) => a.is_correct).length
  const total = questions.length
  const percentage = total > 0 ? (score / total) * 100 : 0

  // Pass thresholds
  const passThreshold = quizType === 'practice_exam' ? 62.5 : 70
  const passed = percentage >= passThreshold

  // Domain breakdown (for practice exams)
  const domainMap = new Map<string, { correct: number; total: number }>()
  questions.forEach((q, i) => {
    const domain = q.exam_domain ?? 'General'
    const entry = domainMap.get(domain) ?? { correct: 0, total: 0 }
    entry.total++
    if (answers[i].is_correct) entry.correct++
    domainMap.set(domain, entry)
  })

  const domain_scores: DomainScore[] = Array.from(domainMap.entries()).map(
    ([domain, { correct, total }]) => {
      const examDomain = EXAM_DOMAINS.find((d) => d.domain === domain)
      return {
        domain,
        correct,
        total,
        percentage: total > 0 ? (correct / total) * 100 : 0,
        weight: examDomain?.weight,
      }
    }
  )

  // XP calculation
  let xp_earned = 0
  if (passed) {
    if (quizType === 'lesson') xp_earned = 50
    else if (quizType === 'module') xp_earned = 250
    else if (quizType === 'practice_exam') xp_earned = 1000
    if (percentage === 100) xp_earned += 500 // perfect bonus
  }

  return { score, total, percentage, passed, answers, domain_scores, time_taken_seconds: timeTaken, xp_earned }
}

// ---------------------------------------------------------------------------
// Adaptive Difficulty
// ---------------------------------------------------------------------------

export interface AdaptiveState {
  currentDifficulty: number // 1-5
  consecutiveCorrect: number
  consecutiveWrong: number
}

export function initialAdaptiveState(): AdaptiveState {
  return { currentDifficulty: 2, consecutiveCorrect: 0, consecutiveWrong: 0 }
}

export function updateAdaptiveDifficulty(
  state: AdaptiveState,
  wasCorrect: boolean
): AdaptiveState {
  if (wasCorrect) {
    const consecutiveCorrect = state.consecutiveCorrect + 1
    const currentDifficulty =
      consecutiveCorrect >= 3
        ? Math.min(state.currentDifficulty + 1, 5)
        : state.currentDifficulty
    return {
      currentDifficulty,
      consecutiveCorrect: consecutiveCorrect >= 3 ? 0 : consecutiveCorrect,
      consecutiveWrong: 0,
    }
  } else {
    const consecutiveWrong = state.consecutiveWrong + 1
    const currentDifficulty =
      consecutiveWrong >= 2
        ? Math.max(state.currentDifficulty - 1, 1)
        : state.currentDifficulty
    return {
      currentDifficulty,
      consecutiveCorrect: 0,
      consecutiveWrong: consecutiveWrong >= 2 ? 0 : consecutiveWrong,
    }
  }
}

export function selectNextQuestion(
  questions: Question[],
  answeredIds: Set<string>,
  difficulty: number
): Question | null {
  // Filter out already answered
  const remaining = questions.filter((q) => !answeredIds.has(q.id))
  if (remaining.length === 0) return null

  // Prefer questions matching current difficulty, but allow ±1
  const matched = remaining.filter(
    (q) => Math.abs(q.difficulty - difficulty) <= 1
  )
  const pool = matched.length > 0 ? matched : remaining

  // Random selection from pool
  return pool[Math.floor(Math.random() * pool.length)]
}

// ---------------------------------------------------------------------------
// Practice Exam Generator
// ---------------------------------------------------------------------------

export function generatePracticeExam(
  allQuestions: Question[],
  totalCount: number = 120
): Question[] {
  const selected: Question[] = []
  const usedIds = new Set<string>()

  // Distribute by CMCA domain weights
  for (const domain of EXAM_DOMAINS) {
    const domainCount = Math.round(domain.weight * totalCount)
    const domainQuestions = allQuestions
      .filter((q) => q.exam_domain === domain.domain && !usedIds.has(q.id))
      .sort(() => Math.random() - 0.5)
      .slice(0, domainCount)

    domainQuestions.forEach((q) => {
      selected.push(q)
      usedIds.add(q.id)
    })
  }

  // Fill remaining spots randomly
  while (selected.length < totalCount) {
    const remaining = allQuestions.filter((q) => !usedIds.has(q.id))
    if (remaining.length === 0) break
    const pick = remaining[Math.floor(Math.random() * remaining.length)]
    selected.push(pick)
    usedIds.add(pick.id)
  }

  // Shuffle final exam
  return selected.sort(() => Math.random() - 0.5)
}

// ---------------------------------------------------------------------------
// SM-2 Spaced Repetition Algorithm
// ---------------------------------------------------------------------------

export type FlashcardRating = 'again' | 'hard' | 'good' | 'easy'

const MIN_EASE_FACTOR = 1.3

export function calculateSM2(
  current: FlashcardProgress,
  rating: FlashcardRating
): Pick<FlashcardProgress, 'ease_factor' | 'interval' | 'repetitions' | 'next_review'> {
  let { ease_factor, interval, repetitions } = current

  switch (rating) {
    case 'again':
      ease_factor = Math.max(ease_factor - 0.2, MIN_EASE_FACTOR)
      interval = 0
      repetitions = 0
      break

    case 'hard':
      ease_factor = Math.max(ease_factor - 0.15, MIN_EASE_FACTOR)
      interval = Math.max(Math.round(interval * 1.2), 1)
      repetitions += 1
      break

    case 'good':
      if (repetitions === 0) {
        interval = 1
      } else if (repetitions === 1) {
        interval = 6
      } else {
        interval = Math.round(interval * ease_factor)
      }
      repetitions += 1
      break

    case 'easy':
      if (repetitions === 0) {
        interval = 4
      } else {
        interval = Math.round(interval * ease_factor * 1.3)
      }
      ease_factor += 0.15
      repetitions += 1
      break
  }

  // Calculate next review date
  const next = new Date()
  next.setDate(next.getDate() + interval)
  const next_review = next.toISOString().split('T')[0]

  return { ease_factor, interval, repetitions, next_review }
}

// ---------------------------------------------------------------------------
// Flashcard Scheduling
// ---------------------------------------------------------------------------

export function getDueCards(
  cards: FlashcardProgress[],
  today: string = new Date().toISOString().split('T')[0]
): FlashcardProgress[] {
  return cards
    .filter((c) => !c.next_review || c.next_review <= today)
    .sort((a, b) => {
      // New cards first (no next_review), then overdue
      if (!a.next_review) return -1
      if (!b.next_review) return 1
      return a.next_review.localeCompare(b.next_review)
    })
}

export function flashcardStats(cards: FlashcardProgress[], today: string = new Date().toISOString().split('T')[0]) {
  const due = cards.filter((c) => !c.next_review || c.next_review <= today).length
  const reviewed = cards.filter(
    (c) => c.last_reviewed && c.last_reviewed.startsWith(today)
  ).length
  const mastered = cards.filter((c) => c.interval >= 21).length // 3+ weeks interval
  const total = cards.length

  return { due, reviewed, mastered, total }
}

// ---------------------------------------------------------------------------
// Scenario Branching
// ---------------------------------------------------------------------------

export interface ScenarioNode {
  id: string
  text: string
  choices: ScenarioChoice[]
  isEnd?: boolean
  feedback?: string
}

export interface ScenarioChoice {
  text: string
  nextNodeId: string
  consequence: string
  score: number // 0-100, how good this choice is
  isPcamChoice?: boolean // "What would a PCAM do?"
}

export function evaluateScenarioPath(
  path: { nodeId: string; choiceIndex: number; score: number }[]
): { totalScore: number; maxScore: number; percentage: number; rating: string } {
  const totalScore = path.reduce((sum, step) => sum + step.score, 0)
  const maxScore = path.length * 100
  const percentage = maxScore > 0 ? (totalScore / maxScore) * 100 : 0

  let rating: string
  if (percentage >= 90) rating = 'Excellent — PCAM-level decision making!'
  else if (percentage >= 70) rating = 'Good — solid management judgment'
  else if (percentage >= 50) rating = 'Fair — room for improvement'
  else rating = 'Needs work — review the lesson material'

  return { totalScore, maxScore, percentage, rating }
}

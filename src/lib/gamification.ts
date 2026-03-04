// =============================================================================
// CAI Prep Course — Gamification Engine
// FSRS-5, Hearts/Lives, Coins Economy, Non-linear Levels, Achievements
// =============================================================================

import type { UserStats, QuizAttempt } from './types'
import { XP_VALUES } from './types'

// --- Gamification Types ---

export type FSRSRating = 1 | 2 | 3 | 4 // Again, Hard, Good, Easy
export type FSRSState = 'new' | 'learning' | 'review' | 'relearning'

export type CelebrationType =
  | 'xp'
  | 'coins'
  | 'level_up'
  | 'achievement'
  | 'perfect_score'
  | 'streak_milestone'
  | 'daily_goal'
  | 'heart_lost'
  | 'confetti'

export interface FSRSCard {
  stability: number
  difficulty: number
  elapsed_days: number
  scheduled_days: number
  reps: number
  lapses: number
  state: FSRSState
  last_review: string | null
}

export interface GamificationState {
  hearts: number
  max_hearts: number
  last_heart_regen: string | null
  coins: number
  daily_goal_target: number
  daily_goal_progress: number
  daily_goal_date: string | null
  streak_freezes: number
  xp_multiplier: number
}

export interface CelebrationEvent {
  id: string
  type: CelebrationType
  value?: number
  label?: string
}

// --- Hearts Constants ---

export const MAX_HEARTS = 5
export const HEART_REGEN_MINUTES = 30

// --- Coins Economy ---

export const COIN_REWARDS = {
  lesson_complete: 10,
  quiz_pass: 25,
  perfect_quiz: 50,
  flashcard_review: 5,
  daily_goal_complete: 50,
  streak_milestone: 100,
  first_login_today: 15,
} as const

export const COIN_COSTS = {
  streak_freeze: 200,
  quiz_hint: 50,
  skip_question: 100,
  double_xp_1hr: 300,
  heart_refill: 350,
} as const

export const DAILY_GOAL_OPTIONS = [1, 3, 5, 10] as const

// ---------------------------------------------------------------------------
// Level System (non-linear curve)
// Level 1: 0, Level 2: 200, Level 3: 500, Level 4: 900, Level 5: 1400...
// Formula: XP needed for level L = 50 * (L-1) * L
// ---------------------------------------------------------------------------

export function getLevel(totalXp: number): number {
  if (totalXp <= 0) return 1
  return Math.floor((-50 + Math.sqrt(2500 + 200 * totalXp)) / 100) + 1
}

export function getXpForLevel(level: number): number {
  if (level <= 1) return 0
  return 50 * (level - 1) * level
}

export function getLevelProgress(totalXp: number): {
  level: number
  current: number
  required: number
  percentage: number
} {
  const level = getLevel(totalXp)
  const currentLevelXp = getXpForLevel(level)
  const nextLevelXp = getXpForLevel(level + 1)
  const current = totalXp - currentLevelXp
  const required = nextLevelXp - currentLevelXp
  return {
    level,
    current,
    required,
    percentage: required > 0 ? Math.min(100, (current / required) * 100) : 100,
  }
}

export function getLevelTitle(level: number): string {
  if (level >= 50) return 'Grandmaster'
  if (level >= 40) return 'Master'
  if (level >= 30) return 'Expert'
  if (level >= 20) return 'Specialist'
  if (level >= 15) return 'Professional'
  if (level >= 10) return 'Practitioner'
  if (level >= 7) return 'Apprentice'
  if (level >= 4) return 'Student'
  if (level >= 2) return 'Novice'
  return 'Beginner'
}

// Backward compat — old linear system
export function calculateLevel(totalXp: number): number {
  return getLevel(totalXp)
}

export function xpToNextLevel(totalXp: number): number {
  const { required, current } = getLevelProgress(totalXp)
  return required - current
}

export function levelProgress(totalXp: number): number {
  return getLevelProgress(totalXp).percentage
}

export function xpForAction(
  action: keyof typeof XP_VALUES,
  extra?: { isPerfect?: boolean }
): number {
  let xp = XP_VALUES[action]
  if (action === 'module_quiz_pass' && extra?.isPerfect) {
    xp += XP_VALUES.perfect_quiz
  }
  return xp
}

// ---------------------------------------------------------------------------
// Hearts System
// ---------------------------------------------------------------------------

export function calculateHeartRegen(
  lastRegen: string | null,
  currentHearts: number
): number {
  if (currentHearts >= MAX_HEARTS || !lastRegen) return currentHearts
  const minutesElapsed =
    (Date.now() - new Date(lastRegen).getTime()) / 60000
  const heartsToRegen = Math.floor(minutesElapsed / HEART_REGEN_MINUTES)
  return Math.min(MAX_HEARTS, currentHearts + heartsToRegen)
}

export function getTimeUntilNextHeart(lastRegen: string | null): {
  minutes: number
  seconds: number
} {
  if (!lastRegen) return { minutes: 0, seconds: 0 }
  const elapsedMs = Date.now() - new Date(lastRegen).getTime()
  const elapsedInCycle = elapsedMs % (HEART_REGEN_MINUTES * 60000)
  const remainingMs = HEART_REGEN_MINUTES * 60000 - elapsedInCycle
  return {
    minutes: Math.floor(remainingMs / 60000),
    seconds: Math.floor((remainingMs % 60000) / 1000),
  }
}

// ---------------------------------------------------------------------------
// FSRS-5 Spaced Repetition Algorithm
// (Replaces SM-2 — better retention, optimized intervals)
// ---------------------------------------------------------------------------

const W = [
  0.4, 0.6, 2.4, 5.8, // w0-w3: initial stability per rating
  7.2, 0.53, 1.07, 0.06, // w4-w7: difficulty parameters
  1.53, 0.16, 1.02, // w8-w10: recall stability growth
  1.94, 0.11, 0.29, 2.23, // w11-w14: lapse stability
  0.23, 2.82, // w15-w16: hard penalty, easy bonus
]

export function createFSRSCard(): FSRSCard {
  return {
    stability: 0,
    difficulty: 0,
    elapsed_days: 0,
    scheduled_days: 0,
    reps: 0,
    lapses: 0,
    state: 'new',
    last_review: null,
  }
}

export function reviewFSRSCard(
  card: FSRSCard,
  rating: FSRSRating,
  now: Date = new Date()
): FSRSCard {
  const desiredRetention = 0.9
  const maxInterval = 36500

  const elapsedDays = card.last_review
    ? Math.max(
        0,
        (now.getTime() - new Date(card.last_review).getTime()) / 86400000
      )
    : 0

  const next: FSRSCard = {
    ...card,
    elapsed_days: elapsedDays,
    last_review: now.toISOString(),
  }

  if (card.state === 'new') {
    next.stability = W[rating - 1]
    next.difficulty = clamp(
      W[4] - Math.exp(W[5] * (rating - 1)) + 1,
      1,
      10
    )
    next.reps = 1

    if (rating === 1) {
      next.state = 'learning'
      next.scheduled_days = 0
      next.lapses = 1
    } else {
      next.state = 'review'
      next.scheduled_days = fsrsInterval(
        next.stability,
        desiredRetention,
        maxInterval
      )
    }
  } else {
    const retrievability = Math.pow(
      1 + elapsedDays / (9 * card.stability),
      -1
    )
    const d0 = W[4] - Math.exp(W[5] * (rating - 1)) + 1
    next.difficulty = clamp(
      W[6] * d0 + (1 - W[6]) * card.difficulty,
      1,
      10
    )

    if (rating === 1) {
      next.stability =
        W[11] *
        Math.pow(next.difficulty, -W[12]) *
        (Math.pow(card.stability + 1, W[13]) - 1) *
        Math.exp(W[14] * (1 - retrievability))
      next.state = 'relearning'
      next.scheduled_days = 0
      next.lapses += 1
      next.reps += 1
    } else {
      const hardPenalty = rating === 2 ? W[15] : 1
      const easyBonus = rating === 4 ? W[16] : 1
      next.stability =
        card.stability *
        (1 +
          Math.exp(W[8]) *
            (11 - next.difficulty) *
            Math.pow(card.stability, -W[9]) *
            (Math.exp(W[10] * (1 - retrievability)) - 1) *
            hardPenalty *
            easyBonus)
      next.state = 'review'
      next.scheduled_days = fsrsInterval(
        next.stability,
        desiredRetention,
        maxInterval
      )
      next.reps += 1
    }
  }

  return next
}

function fsrsInterval(
  stability: number,
  desiredRetention: number,
  maxInterval: number
): number {
  return clamp(
    Math.round(9 * stability * (1 / desiredRetention - 1)),
    1,
    maxInterval
  )
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value))
}

// ---------------------------------------------------------------------------
// Streak Tracking
// ---------------------------------------------------------------------------

export function isStreakActive(lastActivityDate: string | null): boolean {
  if (!lastActivityDate) return false
  const last = new Date(lastActivityDate)
  const now = new Date()
  const diffMs = now.getTime() - last.getTime()
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24))
  return diffDays <= 1
}

export function streakMessage(streak: number): string {
  if (streak === 0) return 'Start your streak today!'
  if (streak < 7) return `${streak} day streak — keep it up!`
  if (streak < 30) return `${streak} day streak — on fire!`
  if (streak < 60) return `${streak} day streak — unstoppable!`
  if (streak < 100) return `${streak} day streak — legendary!`
  return `${streak} day streak — THE MACHINE!`
}

// ---------------------------------------------------------------------------
// Study Time
// ---------------------------------------------------------------------------

export function formatStudyTime(minutes: number): string {
  if (minutes < 60) return `${minutes}m`
  const hours = Math.floor(minutes / 60)
  const mins = minutes % 60
  return mins > 0 ? `${hours}h ${mins}m` : `${hours}h`
}

export function dailyGoalProgress(
  todayMinutes: number,
  goalMinutes: number = 30
): number {
  return Math.min((todayMinutes / goalMinutes) * 100, 100)
}

// ---------------------------------------------------------------------------
// Celebration Triggers
// ---------------------------------------------------------------------------

export function getCelebrationEvents(params: {
  prevXp: number
  newXp: number
  prevStreak: number
  newStreak: number
  coinsEarned?: number
  quizPerfect?: boolean
  achievementLabel?: string
  dailyGoalMet?: boolean
  heartLost?: boolean
}): CelebrationEvent[] {
  const events: CelebrationEvent[] = []
  const uid = () => Math.random().toString(36).slice(2, 8)

  const xpGained = params.newXp - params.prevXp
  if (xpGained > 0) {
    events.push({ id: uid(), type: 'xp', value: xpGained })
  }

  if (params.coinsEarned && params.coinsEarned > 0) {
    events.push({ id: uid(), type: 'coins', value: params.coinsEarned })
  }

  const prevLevel = getLevel(params.prevXp)
  const newLevel = getLevel(params.newXp)
  if (newLevel > prevLevel) {
    events.push({ id: uid(), type: 'level_up', value: newLevel })
    events.push({ id: uid(), type: 'confetti' })
  }

  if (
    params.newStreak > params.prevStreak &&
    params.newStreak > 0 &&
    params.newStreak % 7 === 0
  ) {
    events.push({
      id: uid(),
      type: 'streak_milestone',
      value: params.newStreak,
    })
  }

  if (params.quizPerfect) {
    events.push({ id: uid(), type: 'perfect_score' })
    events.push({ id: uid(), type: 'confetti' })
  }

  if (params.achievementLabel) {
    events.push({
      id: uid(),
      type: 'achievement',
      label: params.achievementLabel,
    })
    events.push({ id: uid(), type: 'confetti' })
  }

  if (params.dailyGoalMet) {
    events.push({ id: uid(), type: 'daily_goal' })
  }

  if (params.heartLost) {
    events.push({ id: uid(), type: 'heart_lost' })
  }

  return events
}

// ---------------------------------------------------------------------------
// Default Gamification State
// ---------------------------------------------------------------------------

export function getDefaultGamificationState(): GamificationState {
  return {
    hearts: MAX_HEARTS,
    max_hearts: MAX_HEARTS,
    last_heart_regen: null,
    coins: 0,
    daily_goal_target: 3,
    daily_goal_progress: 0,
    daily_goal_date: null,
    streak_freezes: 0,
    xp_multiplier: 1.0,
  }
}

// ---------------------------------------------------------------------------
// Achievement Definitions (~47 badges)
// ---------------------------------------------------------------------------

export interface AchievementDef {
  slug: string
  title: string
  description: string
  icon: string
  xp_reward: number
  rarity: 'common' | 'uncommon' | 'rare' | 'epic' | 'legendary'
  category: 'completion' | 'score' | 'streak' | 'milestone'
  check: (stats: UserStats, quizHistory?: QuizAttempt[]) => boolean
}

export const ACHIEVEMENTS: AchievementDef[] = [
  // === COMPLETION ===
  { slug: 'first-lesson', title: 'First Steps', description: 'Complete your first lesson', icon: '👟', xp_reward: 50, rarity: 'common', category: 'completion', check: (s) => s.lessons_completed >= 1 },
  { slug: 'ten-lessons', title: 'Getting Serious', description: 'Complete 10 lessons', icon: '📚', xp_reward: 100, rarity: 'common', category: 'completion', check: (s) => s.lessons_completed >= 10 },
  { slug: 'twenty-five-lessons', title: 'Quarter Century', description: 'Complete 25 lessons', icon: '🎯', xp_reward: 200, rarity: 'uncommon', category: 'completion', check: (s) => s.lessons_completed >= 25 },
  { slug: 'fifty-lessons', title: 'Halfway There', description: 'Complete 50 lessons', icon: '⭐', xp_reward: 300, rarity: 'uncommon', category: 'completion', check: (s) => s.lessons_completed >= 50 },
  { slug: 'hundred-lessons', title: 'Century Scholar', description: 'Complete 100 lessons', icon: '💯', xp_reward: 500, rarity: 'rare', category: 'completion', check: (s) => s.lessons_completed >= 100 },
  { slug: 'two-hundred-lessons', title: 'Knowledge Seeker', description: 'Complete 200 lessons', icon: '🧠', xp_reward: 750, rarity: 'epic', category: 'completion', check: (s) => s.lessons_completed >= 200 },
  { slug: 'all-lessons', title: 'Completionist', description: 'Complete all 228 lessons', icon: '🏆', xp_reward: 2000, rarity: 'legendary', category: 'completion', check: (s) => s.lessons_completed >= 228 },
  { slug: 'cmca-scholar', title: 'CMCA Scholar', description: 'Complete all CMCA track modules', icon: '🎓', xp_reward: 500, rarity: 'rare', category: 'completion', check: () => false },
  { slug: 'ams-achiever', title: 'AMS Achiever', description: 'Complete all AMS track modules', icon: '🏅', xp_reward: 500, rarity: 'rare', category: 'completion', check: () => false },
  { slug: 'pcam-pioneer', title: 'PCAM Pioneer', description: 'Complete all PCAM track modules', icon: '👑', xp_reward: 1000, rarity: 'epic', category: 'completion', check: () => false },
  { slug: 'texas-expert', title: 'Texas Expert', description: 'Complete all Texas HOA Law modules', icon: '🤠', xp_reward: 500, rarity: 'rare', category: 'completion', check: () => false },
  { slug: 'board-whisperer', title: 'Board Whisperer', description: 'Complete Board Leader Certificate track', icon: '🤝', xp_reward: 300, rarity: 'uncommon', category: 'completion', check: () => false },
  { slug: 'renaissance-manager', title: 'Renaissance Manager', description: 'Complete 3 or more credential tracks', icon: '🌟', xp_reward: 1500, rarity: 'legendary', category: 'completion', check: () => false },
  { slug: 'reserve-specialist', title: 'Reserve Ready', description: 'Complete Reserve Specialist track', icon: '💰', xp_reward: 500, rarity: 'rare', category: 'completion', check: () => false },
  { slug: 'risk-manager', title: 'Risk Manager', description: 'Complete CIRMS track', icon: '🛡️', xp_reward: 500, rarity: 'rare', category: 'completion', check: () => false },

  // === SCORE ===
  { slug: 'first-quiz', title: 'Quiz Taker', description: 'Pass your first quiz', icon: '✅', xp_reward: 50, rarity: 'common', category: 'score', check: (s) => s.quizzes_passed >= 1 },
  { slug: 'ten-quizzes', title: 'Quiz Regular', description: 'Pass 10 quizzes', icon: '📝', xp_reward: 200, rarity: 'uncommon', category: 'score', check: (s) => s.quizzes_passed >= 10 },
  { slug: 'perfect-score', title: 'Perfect Score', description: 'Get 100% on any quiz', icon: '💎', xp_reward: 300, rarity: 'rare', category: 'score', check: (_, q) => q?.some(a => a.score === a.total_questions) ?? false },
  { slug: 'exam-ready', title: 'Exam Ready', description: 'Score >85% on a practice exam', icon: '🎯', xp_reward: 500, rarity: 'rare', category: 'score', check: (_, q) => q?.some(a => a.quiz_type === 'practice_exam' && (a.score / a.total_questions) > 0.85) ?? false },
  { slug: 'law-scholar', title: 'Law Scholar', description: 'Perfect score on a Texas Law quiz', icon: '⚖️', xp_reward: 300, rarity: 'rare', category: 'score', check: () => false },
  { slug: 'quick-thinker', title: 'Quick Thinker', description: 'Complete a quiz in under 5 minutes', icon: '⚡', xp_reward: 200, rarity: 'uncommon', category: 'score', check: (_, q) => q?.some(a => a.time_taken_seconds < 300) ?? false },
  { slug: 'high-scorer', title: 'High Scorer', description: 'Maintain >90% average quiz score', icon: '🌟', xp_reward: 400, rarity: 'epic', category: 'score', check: (s) => s.avg_quiz_score > 90 },
  { slug: 'financial-ace', title: 'Financial Ace', description: 'Score >90% on Financial Management domain', icon: '💲', xp_reward: 250, rarity: 'uncommon', category: 'score', check: () => false },
  { slug: 'governance-guru', title: 'Governance Guru', description: 'Score >90% on Community Governance domain', icon: '🏛️', xp_reward: 250, rarity: 'uncommon', category: 'score', check: () => false },
  { slug: 'legal-eagle', title: 'Legal Eagle', description: 'Score >90% on Legal/Ethics domain', icon: '🦅', xp_reward: 250, rarity: 'uncommon', category: 'score', check: () => false },

  // === STREAK ===
  { slug: 'three-day-streak', title: 'Getting Started', description: '3-day study streak', icon: '🔥', xp_reward: 50, rarity: 'common', category: 'streak', check: (s) => s.current_streak >= 3 },
  { slug: 'week-warrior', title: 'Week Warrior', description: '7-day study streak', icon: '🔥', xp_reward: 100, rarity: 'common', category: 'streak', check: (s) => s.current_streak >= 7 },
  { slug: 'two-week-streak', title: 'Fortnight Focus', description: '14-day study streak', icon: '🔥', xp_reward: 150, rarity: 'uncommon', category: 'streak', check: (s) => s.current_streak >= 14 },
  { slug: 'monthly-marathoner', title: 'Monthly Marathoner', description: '30-day study streak', icon: '🔥', xp_reward: 300, rarity: 'rare', category: 'streak', check: (s) => s.current_streak >= 30 },
  { slug: 'unstoppable', title: 'Unstoppable', description: '60-day study streak', icon: '🔥', xp_reward: 500, rarity: 'epic', category: 'streak', check: (s) => s.current_streak >= 60 },
  { slug: 'the-machine', title: 'The Machine', description: '100-day study streak', icon: '🤖', xp_reward: 1000, rarity: 'legendary', category: 'streak', check: (s) => s.current_streak >= 100 },

  // === MILESTONE ===
  { slug: 'first-hour', title: 'First Hour', description: 'Study for 1 hour total', icon: '⏱️', xp_reward: 50, rarity: 'common', category: 'milestone', check: (s) => s.study_minutes >= 60 },
  { slug: 'five-hours', title: 'Dedicated Learner', description: 'Study for 5 hours total', icon: '⏱️', xp_reward: 100, rarity: 'common', category: 'milestone', check: (s) => s.study_minutes >= 300 },
  { slug: 'twenty-hours', title: 'Committed', description: 'Study for 20 hours total', icon: '📖', xp_reward: 250, rarity: 'uncommon', category: 'milestone', check: (s) => s.study_minutes >= 1200 },
  { slug: 'fifty-hours', title: 'Scholar', description: 'Study for 50 hours total', icon: '🎓', xp_reward: 500, rarity: 'rare', category: 'milestone', check: (s) => s.study_minutes >= 3000 },
  { slug: 'hundred-hours', title: 'Master Student', description: 'Study for 100 hours total', icon: '🏆', xp_reward: 1000, rarity: 'epic', category: 'milestone', check: (s) => s.study_minutes >= 6000 },
  { slug: 'xp-1000', title: '1K Club', description: 'Earn 1,000 total XP', icon: '⚡', xp_reward: 100, rarity: 'common', category: 'milestone', check: (s) => s.total_xp >= 1000 },
  { slug: 'xp-5000', title: '5K Club', description: 'Earn 5,000 total XP', icon: '⚡', xp_reward: 250, rarity: 'uncommon', category: 'milestone', check: (s) => s.total_xp >= 5000 },
  { slug: 'xp-10000', title: '10K Club', description: 'Earn 10,000 total XP', icon: '⚡', xp_reward: 500, rarity: 'rare', category: 'milestone', check: (s) => s.total_xp >= 10000 },
  { slug: 'xp-25000', title: '25K Club', description: 'Earn 25,000 total XP', icon: '💫', xp_reward: 1000, rarity: 'epic', category: 'milestone', check: (s) => s.total_xp >= 25000 },
  { slug: 'xp-50000', title: 'XP Legend', description: 'Earn 50,000 total XP', icon: '🌟', xp_reward: 2500, rarity: 'legendary', category: 'milestone', check: (s) => s.total_xp >= 50000 },
  { slug: 'study-buddy', title: 'Study Buddy', description: 'Finish in the top 3 weekly leaderboard', icon: '🤝', xp_reward: 300, rarity: 'rare', category: 'milestone', check: () => false },
  { slug: 'flashcard-master', title: 'Flashcard Master', description: 'Review 500 flashcards', icon: '🃏', xp_reward: 300, rarity: 'rare', category: 'milestone', check: () => false },
  { slug: 'scenario-expert', title: 'Scenario Expert', description: 'Complete 20 interactive scenarios', icon: '🎭', xp_reward: 300, rarity: 'rare', category: 'milestone', check: () => false },
  { slug: 'early-bird', title: 'Early Bird', description: 'Study before 7 AM', icon: '🌅', xp_reward: 50, rarity: 'common', category: 'milestone', check: () => false },
  { slug: 'night-owl', title: 'Night Owl', description: 'Study after 10 PM', icon: '🦉', xp_reward: 50, rarity: 'common', category: 'milestone', check: () => false },
  { slug: 'weekend-warrior', title: 'Weekend Warrior', description: 'Study on both Saturday and Sunday', icon: '📅', xp_reward: 75, rarity: 'common', category: 'milestone', check: () => false },
]

// ---------------------------------------------------------------------------
// Rarity Colors
// ---------------------------------------------------------------------------

export const RARITY_COLORS: Record<
  string,
  { bg: string; text: string; border: string; glow: string }
> = {
  common: { bg: 'bg-zinc-800', text: 'text-zinc-300', border: 'border-zinc-600', glow: '' },
  uncommon: { bg: 'bg-green-900/50', text: 'text-green-400', border: 'border-green-600', glow: 'shadow-green-500/20' },
  rare: { bg: 'bg-blue-900/50', text: 'text-blue-400', border: 'border-blue-600', glow: 'shadow-blue-500/20' },
  epic: { bg: 'bg-purple-900/50', text: 'text-purple-400', border: 'border-purple-600', glow: 'shadow-purple-500/30' },
  legendary: { bg: 'bg-amber-900/50', text: 'text-amber-400', border: 'border-amber-500', glow: 'shadow-amber-500/40' },
}

// ---------------------------------------------------------------------------
// Check which achievements to award
// ---------------------------------------------------------------------------

export function checkNewAchievements(
  stats: UserStats,
  earnedSlugs: Set<string>,
  quizHistory?: QuizAttempt[]
): AchievementDef[] {
  return ACHIEVEMENTS.filter(
    (a) => !earnedSlugs.has(a.slug) && a.check(stats, quizHistory)
  )
}

// =============================================================================
// CAI Prep Course — Gamification Engine
// =============================================================================

import type { UserStats, Achievement, QuizAttempt } from './types'
import { XP_VALUES } from './types'

// ---------------------------------------------------------------------------
// XP & Level Calculations
// ---------------------------------------------------------------------------

const XP_PER_LEVEL = 1000

export function calculateLevel(totalXp: number): number {
  return Math.floor(totalXp / XP_PER_LEVEL) + 1
}

export function xpToNextLevel(totalXp: number): number {
  return XP_PER_LEVEL - (totalXp % XP_PER_LEVEL)
}

export function levelProgress(totalXp: number): number {
  return ((totalXp % XP_PER_LEVEL) / XP_PER_LEVEL) * 100
}

export function xpForAction(action: keyof typeof XP_VALUES, extra?: { quizScore?: number; isPerfect?: boolean }): number {
  let xp = XP_VALUES[action]
  if (action === 'module_quiz_pass' && extra?.isPerfect) {
    xp += XP_VALUES.perfect_quiz
  }
  return xp
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

export function dailyGoalProgress(todayMinutes: number, goalMinutes: number = 30): number {
  return Math.min((todayMinutes / goalMinutes) * 100, 100)
}

// ---------------------------------------------------------------------------
// Achievement Definitions (~50 badges)
// ---------------------------------------------------------------------------

export interface AchievementDef {
  slug: string
  title: string
  description: string
  icon: string // emoji for now, replaced with custom icons later
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
  { slug: 'all-lessons', title: 'Completionist', description: 'Complete all 300 lessons', icon: '🏆', xp_reward: 2000, rarity: 'legendary', category: 'completion', check: (s) => s.lessons_completed >= 300 },
  { slug: 'cmca-scholar', title: 'CMCA Scholar', description: 'Complete all CMCA track modules', icon: '🎓', xp_reward: 500, rarity: 'rare', category: 'completion', check: () => false }, // checked via course progress
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

export const RARITY_COLORS: Record<string, { bg: string; text: string; border: string; glow: string }> = {
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

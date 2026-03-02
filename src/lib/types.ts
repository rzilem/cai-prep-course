// =============================================================================
// CAI Prep Course — TypeScript Types
// =============================================================================

// -----------------------------------------------------------------------------
// Core Content Types
// -----------------------------------------------------------------------------

export interface Course {
  id: string
  slug: string
  title: string
  credential_code: string
  description: string
  prerequisites: string[]
  difficulty: 'beginner' | 'intermediate' | 'advanced' | 'expert'
  estimated_hours: number
  icon_url: string | null
  hero_url: string | null
  module_count: number
  lesson_count: number
  metadata: Record<string, unknown>
  is_published: boolean
  sort_order: number
  created_at: string
  updated_at: string
}

export interface Module {
  id: string
  course_id: string
  slug: string
  title: string
  description: string
  module_number: number
  video_url: string | null
  thumbnail_url: string | null
  lesson_count: number
  metadata: {
    exam_weight?: number
    cai_course_code?: string
    [key: string]: unknown
  }
  is_published: boolean
  created_at: string
  updated_at: string
}

export interface TexasLawCallout {
  statute: string
  title: string
  description: string
  severity: 'info' | 'warning' | 'critical'
}

export interface ScenarioChoice {
  text: string
  consequence: string
  is_correct: boolean
  explanation: string
}

export interface Scenario {
  title: string
  description: string
  choices: ScenarioChoice[]
}

export interface Lesson {
  id: string
  module_id: string
  slug: string
  title: string
  content_markdown: string
  video_url: string | null
  audio_url: string | null
  images: string[]
  texas_law_callouts: TexasLawCallout[]
  scenario: Scenario | null
  key_points: string[]
  estimated_minutes: number
  sort_order: number
  is_published: boolean
  created_at: string
  updated_at: string
}

// -----------------------------------------------------------------------------
// Questions & Quizzes
// -----------------------------------------------------------------------------

export type QuestionType =
  | 'multiple_choice'
  | 'true_false'
  | 'scenario'
  | 'fill_blank'
  | 'matching'

export interface QuestionChoice {
  text: string
  is_correct: boolean
  explanation: string
}

export interface Question {
  id: string
  lesson_id: string | null
  module_id: string | null
  course_id: string
  question_text: string
  question_type: QuestionType
  choices: QuestionChoice[]
  explanation: string
  texas_law_reference: string | null
  exam_domain: string | null
  difficulty: 1 | 2 | 3 | 4 | 5
  times_shown: number
  times_correct: number
  is_published: boolean
  created_at: string
}

export type QuizType = 'lesson' | 'module' | 'practice_exam'

export interface QuizAnswer {
  question_id: string
  selected: string | number
  is_correct: boolean
}

export interface DomainScore {
  domain: string
  correct: number
  total: number
  percentage: number
}

export interface QuizAttempt {
  id: string
  user_email: string
  quiz_type: QuizType
  course_id: string
  module_id: string | null
  lesson_id: string | null
  score: number
  total_questions: number
  answers: QuizAnswer[]
  domain_scores: DomainScore[]
  time_taken_seconds: number
  passed: boolean
  started_at: string
  completed_at: string | null
}

// -----------------------------------------------------------------------------
// User Progress & Gamification
// -----------------------------------------------------------------------------

export type ProgressStatus = 'not_started' | 'in_progress' | 'completed'

export interface UserProgress {
  id: string
  user_email: string
  course_id: string
  module_id: string | null
  lesson_id: string | null
  status: ProgressStatus
  progress_percent: number
  time_spent_seconds: number
  last_video_position: number
  completed_at: string | null
  updated_at: string
}

export type AchievementRarity = 'common' | 'uncommon' | 'rare' | 'epic' | 'legendary'

export interface Achievement {
  id: string
  slug: string
  title: string
  description: string
  icon: string
  criteria: Record<string, unknown>
  xp_reward: number
  rarity: AchievementRarity
  category: string
  is_active: boolean
  created_at: string
}

export interface UserAchievement {
  id: string
  user_email: string
  achievement_id: string
  earned_at: string
}

export interface UserStats {
  user_email: string
  display_name: string | null
  total_xp: number
  current_streak: number
  longest_streak: number
  last_activity_date: string | null
  study_minutes: number
  lessons_completed: number
  quizzes_passed: number
  avg_quiz_score: number
  created_at: string
  updated_at: string
}

// -----------------------------------------------------------------------------
// Spaced Repetition (Flashcards)
// -----------------------------------------------------------------------------

export interface FlashcardProgress {
  id: string
  user_email: string
  question_id: string
  ease_factor: number   // default 2.5
  interval: number      // default 0 (days)
  repetitions: number   // default 0
  next_review: string   // date (YYYY-MM-DD)
  last_reviewed: string | null
  created_at: string
}

// -----------------------------------------------------------------------------
// Content Pipeline (DAX Integration)
// -----------------------------------------------------------------------------

export type PipelineStatus =
  | 'pending'
  | 'researching'
  | 'generating'
  | 'reviewing'
  | 'approved'
  | 'published'

export interface ContentPipeline {
  id: string
  course_slug: string
  module_slug: string
  lesson_slug: string | null
  content_type: string
  status: PipelineStatus
  dax_task_id: string | null
  generated_content: Record<string, unknown> | null
  review_notes: string | null
  created_at: string
  updated_at: string
}

// -----------------------------------------------------------------------------
// Constants
// -----------------------------------------------------------------------------

/** XP values for each activity type */
export const XP_VALUES = {
  lesson_complete: 100,
  module_quiz_pass: 250,
  perfect_quiz: 500,
  practice_exam_pass: 1000,
  daily_login: 50,
  flashcard_review: 25,
  scenario_complete: 75,
} as const

/** CMCA exam domain weights */
export const EXAM_DOMAINS = [
  { domain: 'Financial Management', weight: 0.19, label: 'Financial Management (19%)' },
  { domain: 'Community Governance', weight: 0.18, label: 'Community Governance (18%)' },
  { domain: 'Legal Ethics Risk', weight: 0.18, label: 'Legal, Ethics & Risk Management (18%)' },
  { domain: 'Facilities', weight: 0.14, label: 'Facilities Management (14%)' },
  { domain: 'Community Relations', weight: 0.14, label: 'Community Relations (14%)' },
  { domain: 'Human Resources', weight: 0.10, label: 'Human Resources (10%)' },
  { domain: 'Communications Technology', weight: 0.07, label: 'Communications & Technology (7%)' },
] as const

/** CAI credential tracks */
export const CREDENTIAL_TRACKS = [
  {
    code: 'CMCA',
    name: 'Certified Manager of Community Associations',
    description: 'Foundation credential for community association managers',
    prerequisite: null,
  },
  {
    code: 'AMS',
    name: 'Association Management Specialist',
    description: 'Advanced management practices and leadership',
    prerequisite: 'CMCA',
  },
  {
    code: 'PCAM',
    name: 'Professional Community Association Manager',
    description: 'Highest individual manager credential',
    prerequisite: 'AMS',
  },
  {
    code: 'LSM',
    name: 'Large-Scale Manager',
    description: 'Specialized for large-scale community management',
    prerequisite: 'CMCA',
  },
  {
    code: 'RS',
    name: 'Reserve Specialist',
    description: 'Reserve fund planning and analysis',
    prerequisite: null,
  },
  {
    code: 'CIRMS',
    name: 'Community Insurance and Risk Management Specialist',
    description: 'Insurance and risk management for community associations',
    prerequisite: null,
  },
  {
    code: 'BOARD_LEADER',
    name: 'Board Leadership Certificate',
    description: 'Training for HOA board members and volunteer leaders',
    prerequisite: null,
  },
  {
    code: 'TEXAS_LAW',
    name: 'Texas HOA Law Essentials',
    description: 'Texas Property Code, deed restrictions, and state-specific compliance',
    prerequisite: null,
  },
] as const

// -----------------------------------------------------------------------------
// Derived / Utility Types
// -----------------------------------------------------------------------------

/** Course with its modules attached */
export type CourseWithModules = Course & { modules: Module[] }

/** Module with its lessons attached */
export type ModuleWithLessons = Module & { lessons: Lesson[] }

/** Full course tree for navigation */
export type CourseTree = Course & { modules: ModuleWithLessons[] }

/** Leaderboard entry for display */
export interface LeaderboardEntry {
  user_email: string
  display_name: string | null
  total_xp: number
  current_streak: number
  lessons_completed: number
  rank: number
}

/** Quiz result summary for display */
export interface QuizResultSummary {
  score: number
  total_questions: number
  percentage: number
  passed: boolean
  domain_scores: DomainScore[]
  time_taken_seconds: number
  xp_earned: number
}

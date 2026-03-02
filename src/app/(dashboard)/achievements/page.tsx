'use client'

import { useState } from 'react'
import {
  Trophy,
  Star,
  Lock,
  Flame,
  BookOpen,
  Target,
  Zap,
  Award,
  Crown,
  Clock,
  Shield,
  CheckCircle2,
  GraduationCap,
  Brain,
  Layers,
  BarChart3,
  Sparkles,
  Medal,
  Rocket,
  Heart,
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Progress } from '@/components/ui/progress'

// ---------------------------------------------------------------------------
// Types & Data
// ---------------------------------------------------------------------------

type AchievementCategory =
  | 'all'
  | 'completion'
  | 'score'
  | 'streak'
  | 'milestone'

type AchievementRarity = 'common' | 'uncommon' | 'rare' | 'epic' | 'legendary'

interface MockAchievement {
  id: string
  title: string
  description: string
  icon: typeof Trophy
  xpReward: number
  rarity: AchievementRarity
  category: AchievementCategory
  earned: boolean
  earnedAt?: string
  progressCurrent?: number
  progressTotal?: number
}

const rarityColors: Record<AchievementRarity, { border: string; bg: string; glow: string; text: string; badge: string }> = {
  common: {
    border: 'border-zinc-400/30',
    bg: 'bg-zinc-400/5',
    glow: 'shadow-zinc-400/20',
    text: 'text-zinc-400',
    badge: 'bg-zinc-400/15 text-zinc-400',
  },
  uncommon: {
    border: 'border-cai-emerald/30',
    bg: 'bg-cai-emerald/5',
    glow: 'shadow-cai-emerald/30',
    text: 'text-cai-emerald',
    badge: 'bg-cai-emerald/15 text-cai-emerald',
  },
  rare: {
    border: 'border-cai-blue/30',
    bg: 'bg-cai-blue/5',
    glow: 'shadow-cai-blue/30',
    text: 'text-cai-blue',
    badge: 'bg-cai-blue/15 text-cai-blue',
  },
  epic: {
    border: 'border-cai-purple/30',
    bg: 'bg-cai-purple/5',
    glow: 'shadow-cai-purple/30',
    text: 'text-cai-purple',
    badge: 'bg-cai-purple/15 text-cai-purple',
  },
  legendary: {
    border: 'border-cai-gold/30',
    bg: 'bg-cai-gold/5',
    glow: 'shadow-cai-gold/30',
    text: 'text-cai-gold',
    badge: 'bg-cai-gold/15 text-cai-gold',
  },
}

const mockAchievements: MockAchievement[] = [
  // Completion
  {
    id: 'first-lesson',
    title: 'First Steps',
    description: 'Complete your first lesson',
    icon: BookOpen,
    xpReward: 50,
    rarity: 'common',
    category: 'completion',
    earned: true,
    earnedAt: '2026-02-15',
  },
  {
    id: 'module-complete',
    title: 'Module Master',
    description: 'Complete an entire module',
    icon: CheckCircle2,
    xpReward: 200,
    rarity: 'uncommon',
    category: 'completion',
    earned: true,
    earnedAt: '2026-02-20',
  },
  {
    id: 'course-complete',
    title: 'Graduation Day',
    description: 'Complete an entire course',
    icon: GraduationCap,
    xpReward: 1000,
    rarity: 'epic',
    category: 'completion',
    earned: false,
    progressCurrent: 45,
    progressTotal: 100,
  },
  {
    id: 'all-courses',
    title: 'Grand Master',
    description: 'Complete all available courses',
    icon: Crown,
    xpReward: 5000,
    rarity: 'legendary',
    category: 'completion',
    earned: false,
    progressCurrent: 0,
    progressTotal: 8,
  },
  // Score
  {
    id: 'first-quiz',
    title: 'Quiz Taker',
    description: 'Complete your first quiz',
    icon: HelpCircle,
    xpReward: 50,
    rarity: 'common',
    category: 'score',
    earned: true,
    earnedAt: '2026-02-16',
  },
  {
    id: 'perfect-quiz',
    title: 'Perfect Score',
    description: 'Score 100% on any quiz',
    icon: Star,
    xpReward: 250,
    rarity: 'rare',
    category: 'score',
    earned: true,
    earnedAt: '2026-02-18',
  },
  {
    id: 'quiz-streak-5',
    title: 'On a Roll',
    description: 'Pass 5 quizzes in a row',
    icon: Zap,
    xpReward: 300,
    rarity: 'uncommon',
    category: 'score',
    earned: true,
    earnedAt: '2026-02-22',
  },
  {
    id: 'exam-ready',
    title: 'Exam Ready',
    description: 'Score 80%+ on a full practice exam',
    icon: Shield,
    xpReward: 500,
    rarity: 'epic',
    category: 'score',
    earned: false,
  },
  {
    id: 'top-scorer',
    title: 'Top of Class',
    description: 'Score 95%+ on a practice exam',
    icon: Award,
    xpReward: 1000,
    rarity: 'legendary',
    category: 'score',
    earned: false,
  },
  // Streak
  {
    id: 'streak-3',
    title: 'Getting Started',
    description: 'Maintain a 3-day study streak',
    icon: Flame,
    xpReward: 75,
    rarity: 'common',
    category: 'streak',
    earned: true,
    earnedAt: '2026-02-17',
  },
  {
    id: 'streak-7',
    title: 'Week Warrior',
    description: 'Maintain a 7-day study streak',
    icon: Flame,
    xpReward: 200,
    rarity: 'uncommon',
    category: 'streak',
    earned: true,
    earnedAt: '2026-02-21',
  },
  {
    id: 'streak-14',
    title: 'Two Week Champion',
    description: 'Maintain a 14-day study streak',
    icon: Flame,
    xpReward: 500,
    rarity: 'rare',
    category: 'streak',
    earned: false,
    progressCurrent: 12,
    progressTotal: 14,
  },
  {
    id: 'streak-30',
    title: 'Monthly Legend',
    description: 'Maintain a 30-day study streak',
    icon: Flame,
    xpReward: 1000,
    rarity: 'epic',
    category: 'streak',
    earned: false,
    progressCurrent: 12,
    progressTotal: 30,
  },
  // Milestone
  {
    id: 'xp-1000',
    title: 'Thousand Club',
    description: 'Earn 1,000 XP total',
    icon: Sparkles,
    xpReward: 100,
    rarity: 'common',
    category: 'milestone',
    earned: true,
    earnedAt: '2026-02-19',
  },
  {
    id: 'xp-5000',
    title: 'XP Powerhouse',
    description: 'Earn 5,000 XP total',
    icon: Rocket,
    xpReward: 500,
    rarity: 'rare',
    category: 'milestone',
    earned: false,
    progressCurrent: 4750,
    progressTotal: 5000,
  },
  {
    id: 'flashcard-100',
    title: 'Card Shark',
    description: 'Review 100 flashcards',
    icon: Layers,
    xpReward: 150,
    rarity: 'uncommon',
    category: 'milestone',
    earned: true,
    earnedAt: '2026-02-24',
  },
  {
    id: 'flashcard-500',
    title: 'Memory Master',
    description: 'Review 500 flashcards',
    icon: Brain,
    xpReward: 400,
    rarity: 'rare',
    category: 'milestone',
    earned: false,
    progressCurrent: 287,
    progressTotal: 500,
  },
  {
    id: 'study-10h',
    title: 'Dedicated Learner',
    description: 'Log 10 hours of study time',
    icon: Clock,
    xpReward: 200,
    rarity: 'uncommon',
    category: 'milestone',
    earned: true,
    earnedAt: '2026-02-23',
  },
  {
    id: 'study-50h',
    title: 'Scholar',
    description: 'Log 50 hours of study time',
    icon: Target,
    xpReward: 750,
    rarity: 'epic',
    category: 'milestone',
    earned: false,
    progressCurrent: 23,
    progressTotal: 50,
  },
  {
    id: 'texas-law',
    title: 'Texas Tough',
    description: 'Complete all Texas Law callout reviews',
    icon: Medal,
    xpReward: 300,
    rarity: 'rare',
    category: 'milestone',
    earned: false,
    progressCurrent: 8,
    progressTotal: 25,
  },
]

// Workaround for the HelpCircle import (used in quiz category)
import { HelpCircle } from 'lucide-react'

const mockUserStats = {
  totalXP: 4750,
  level: 4,
  xpToNextLevel: 250, // 5000 - 4750
  totalEarned: mockAchievements.filter((a) => a.earned).length,
  totalAvailable: mockAchievements.length,
}

// ---------------------------------------------------------------------------
// Achievement Card
// ---------------------------------------------------------------------------

function AchievementCard({
  achievement,
  index,
}: {
  achievement: MockAchievement
  index: number
}) {
  const rarity = rarityColors[achievement.rarity]

  return (
    <FadeIn delay={index * 60}>
      <motion.div
        whileHover={achievement.earned ? { scale: 1.03, y: -2 } : {}}
        transition={{ type: 'spring', stiffness: 300, damping: 20 }}
      >
        <Card
          className={`relative overflow-hidden transition-shadow ${
            achievement.earned
              ? `${rarity.border} ${rarity.bg} hover:shadow-lg ${rarity.glow}`
              : 'opacity-50 grayscale'
          }`}
        >
          {/* Rarity accent strip */}
          <div
            className={`absolute top-0 left-0 right-0 h-0.5 ${
              achievement.earned
                ? rarity.text.replace('text-', 'bg-')
                : 'bg-muted'
            }`}
          />

          <CardContent className="flex flex-col items-center gap-3 pt-6 text-center">
            {/* Icon */}
            <div className="relative">
              <div
                className={`flex size-14 items-center justify-center rounded-full ${
                  achievement.earned
                    ? `${rarity.text.replace('text-', 'bg-')}/15`
                    : 'bg-muted'
                }`}
              >
                {achievement.earned ? (
                  <achievement.icon
                    className={`size-7 ${rarity.text}`}
                  />
                ) : (
                  <Lock className="size-6 text-muted-foreground" />
                )}
              </div>
              {achievement.earned && (
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{
                    delay: 0.3 + index * 0.06,
                    type: 'spring',
                    stiffness: 400,
                    damping: 12,
                  }}
                  className="absolute -right-1 -top-1"
                >
                  <div className="flex size-5 items-center justify-center rounded-full bg-cai-emerald">
                    <CheckCircle2 className="size-3.5 text-white" />
                  </div>
                </motion.div>
              )}
            </div>

            {/* Info */}
            <div>
              <h3 className="font-semibold text-sm">{achievement.title}</h3>
              <p className="text-xs text-muted-foreground mt-1">
                {achievement.description}
              </p>
            </div>

            {/* XP & Rarity */}
            <div className="flex items-center gap-2">
              <Badge variant="outline" className={`text-xs ${rarity.badge}`}>
                {achievement.rarity}
              </Badge>
              <span className="text-xs font-medium text-cai-gold">
                +{achievement.xpReward} XP
              </span>
            </div>

            {/* Progress toward achievement */}
            {!achievement.earned &&
              achievement.progressCurrent !== undefined &&
              achievement.progressTotal !== undefined && (
                <div className="w-full space-y-1">
                  <Progress
                    value={
                      (achievement.progressCurrent /
                        achievement.progressTotal) *
                      100
                    }
                    className="h-1.5 bg-muted [&>[data-slot=progress-indicator]]:bg-cai-blue"
                  />
                  <p className="text-[10px] text-muted-foreground">
                    {achievement.progressCurrent} /{' '}
                    {achievement.progressTotal}
                  </p>
                </div>
              )}

            {/* Earned date */}
            {achievement.earned && achievement.earnedAt && (
              <p className="text-[10px] text-muted-foreground">
                Earned{' '}
                {new Date(achievement.earnedAt).toLocaleDateString('en-US', {
                  month: 'short',
                  day: 'numeric',
                  year: 'numeric',
                })}
              </p>
            )}
          </CardContent>
        </Card>
      </motion.div>
    </FadeIn>
  )
}

// ---------------------------------------------------------------------------
// Achievements Page
// ---------------------------------------------------------------------------

export default function AchievementsPage() {
  const [activeTab, setActiveTab] = useState<AchievementCategory>('all')

  const filteredAchievements =
    activeTab === 'all'
      ? mockAchievements
      : mockAchievements.filter((a) => a.category === activeTab)

  const nextLevelXP = (mockUserStats.level + 1) * 1000
  const currentLevelXP = mockUserStats.level * 1000
  const levelProgress =
    ((mockUserStats.totalXP - currentLevelXP) /
      (nextLevelXP - currentLevelXP)) *
    100

  return (
    <div className="space-y-8">
      {/* ── Header with XP & Level ───────────────────────────────── */}
      <FadeIn delay={0}>
        <div className="flex flex-col gap-6 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">
              Achievements
            </h1>
            <p className="mt-1 text-muted-foreground">
              Collect badges and earn XP as you learn
            </p>
          </div>
          <Card className="sm:w-[280px]">
            <CardContent className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="flex size-10 items-center justify-center rounded-full bg-cai-gold/10">
                    <Trophy className="size-5 text-cai-gold" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold">
                      Level <AnimatedCounter value={mockUserStats.level} />
                    </p>
                    <p className="text-xs text-muted-foreground">
                      <AnimatedCounter value={mockUserStats.totalXP} /> XP
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-xs text-muted-foreground">Next Level</p>
                  <p className="text-sm font-medium">
                    {mockUserStats.xpToNextLevel} XP to go
                  </p>
                </div>
              </div>
              <Progress
                value={levelProgress}
                className="h-2 bg-cai-gold/20 [&>[data-slot=progress-indicator]]:bg-cai-gold"
              />
            </CardContent>
          </Card>
        </div>
      </FadeIn>

      {/* ── Stats Bar ────────────────────────────────────────────── */}
      <FadeIn delay={80}>
        <div className="flex items-center gap-6 rounded-lg border px-6 py-3">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="size-4 text-cai-emerald" />
            <span className="text-sm">
              <span className="font-semibold">
                <AnimatedCounter value={mockUserStats.totalEarned} />
              </span>{' '}
              / {mockUserStats.totalAvailable} earned
            </span>
          </div>
          <div className="h-4 w-px bg-border" />
          <div className="flex-1">
            <Progress
              value={
                (mockUserStats.totalEarned / mockUserStats.totalAvailable) *
                100
              }
              className="h-1.5 bg-cai-emerald/20 [&>[data-slot=progress-indicator]]:bg-cai-emerald"
            />
          </div>
          <span className="text-sm font-medium text-muted-foreground">
            {Math.round(
              (mockUserStats.totalEarned / mockUserStats.totalAvailable) * 100
            )}
            %
          </span>
        </div>
      </FadeIn>

      {/* ── Category Tabs + Grid ─────────────────────────────────── */}
      <Tabs
        value={activeTab}
        onValueChange={(v) => setActiveTab(v as AchievementCategory)}
      >
        <FadeIn delay={140}>
          <TabsList variant="line" className="mb-6 w-full justify-start">
            <TabsTrigger value="all">All</TabsTrigger>
            <TabsTrigger value="completion" className="gap-1">
              <CheckCircle2 className="size-3.5" />
              Completion
            </TabsTrigger>
            <TabsTrigger value="score" className="gap-1">
              <BarChart3 className="size-3.5" />
              Score
            </TabsTrigger>
            <TabsTrigger value="streak" className="gap-1">
              <Flame className="size-3.5" />
              Streak
            </TabsTrigger>
            <TabsTrigger value="milestone" className="gap-1">
              <Star className="size-3.5" />
              Milestones
            </TabsTrigger>
          </TabsList>
        </FadeIn>

        <TabsContent value={activeTab}>
          <div className="grid gap-4 grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
            {filteredAchievements.map((achievement, i) => (
              <AchievementCard
                key={achievement.id}
                achievement={achievement}
                index={i}
              />
            ))}
          </div>

          {filteredAchievements.length === 0 && (
            <div className="flex flex-col items-center gap-4 py-16 text-center">
              <Trophy className="size-12 text-muted-foreground" />
              <p className="text-lg text-muted-foreground">
                No achievements in this category yet.
              </p>
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  )
}

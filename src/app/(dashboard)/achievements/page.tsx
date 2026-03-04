'use client'

import { useState, useEffect } from 'react'
import {
  Trophy,
  Lock,
  Flame,
  Star,
  CheckCircle2,
  BarChart3,
  Loader2,
} from 'lucide-react'
import { motion } from 'motion/react'
import { createClient } from '@/lib/supabase/client'

import { FadeIn } from '@/components/fade-in'
import { AnimatedCounter } from '@/components/animated-counter'
import {
  Card,
  CardContent,
} from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Progress } from '@/components/ui/progress'

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type AchievementCategory =
  | 'all'
  | 'completion'
  | 'score'
  | 'streak'
  | 'milestone'

type AchievementRarity = 'common' | 'uncommon' | 'rare' | 'epic' | 'legendary'

interface Achievement {
  id: string
  slug: string
  title: string
  description: string
  icon: string
  xp_reward: number
  rarity: AchievementRarity
  category: string
  earned_at: string | null
}

// ---------------------------------------------------------------------------
// Rarity Colors
// ---------------------------------------------------------------------------

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

// ---------------------------------------------------------------------------
// Achievement Card
// ---------------------------------------------------------------------------

function AchievementCard({
  achievement,
  index,
}: {
  achievement: Achievement
  index: number
}) {
  const rarity = rarityColors[achievement.rarity] ?? rarityColors.common
  const earned = achievement.earned_at !== null

  return (
    <FadeIn delay={index * 60}>
      <motion.div
        whileHover={earned ? { scale: 1.03, y: -2 } : {}}
        transition={{ type: 'spring', stiffness: 300, damping: 20 }}
      >
        <Card
          className={`relative overflow-hidden transition-shadow ${
            earned
              ? `${rarity.border} ${rarity.bg} hover:shadow-lg ${rarity.glow}`
              : 'opacity-50 grayscale'
          }`}
        >
          {/* Rarity accent strip */}
          <div
            className={`absolute top-0 left-0 right-0 h-0.5 ${
              earned
                ? rarity.text.replace('text-', 'bg-')
                : 'bg-muted'
            }`}
          />

          <CardContent className="flex flex-col items-center gap-3 pt-6 text-center">
            {/* Icon */}
            <div className="relative">
              <div
                className={`flex size-14 items-center justify-center rounded-full ${
                  earned
                    ? `${rarity.text.replace('text-', 'bg-')}/15`
                    : 'bg-muted'
                }`}
              >
                {earned ? (
                  <span className="text-2xl">{achievement.icon}</span>
                ) : (
                  <Lock className="size-6 text-muted-foreground" />
                )}
              </div>
              {earned && (
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
                +{achievement.xp_reward} XP
              </span>
            </div>

            {/* Earned date */}
            {earned && achievement.earned_at && (
              <p className="text-[10px] text-muted-foreground">
                Earned{' '}
                {new Date(achievement.earned_at).toLocaleDateString('en-US', {
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
  const [achievements, setAchievements] = useState<Achievement[]>([])
  const [stats, setStats] = useState({
    totalXP: 0,
    level: 0,
    earnedCount: 0,
    totalCount: 0,
  })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user?.email) {
        setLoading(false)
        return
      }

      try {
        const res = await fetch(
          `/api/achievements?user_email=${encodeURIComponent(user.email)}`
        )
        if (!res.ok) {
          setLoading(false)
          return
        }
        const data = await res.json()

        setAchievements(data.achievements ?? [])
        setStats({
          totalXP: data.total_xp ?? 0,
          level: data.level ?? 0,
          earnedCount: data.earned_count ?? 0,
          totalCount: data.total_count ?? 0,
        })
      } catch {
        // silently fail — page shows empty state
      }
      setLoading(false)
    }
    load()
  }, [])

  const filteredAchievements =
    activeTab === 'all'
      ? achievements
      : achievements.filter((a) => a.category === activeTab)

  const nextLevelXP = (stats.level + 1) * 1000
  const currentLevelXP = stats.level * 1000
  const levelProgress =
    nextLevelXP > currentLevelXP
      ? ((stats.totalXP - currentLevelXP) / (nextLevelXP - currentLevelXP)) * 100
      : 0

  if (loading) {
    return (
      <div className="flex items-center justify-center py-32">
        <Loader2 className="size-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

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
                      Level <AnimatedCounter value={stats.level} />
                    </p>
                    <p className="text-xs text-muted-foreground">
                      <AnimatedCounter value={stats.totalXP} /> XP
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-xs text-muted-foreground">Next Level</p>
                  <p className="text-sm font-medium">
                    {nextLevelXP - stats.totalXP > 0
                      ? `${nextLevelXP - stats.totalXP} XP to go`
                      : 'Max!'}
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
                <AnimatedCounter value={stats.earnedCount} />
              </span>{' '}
              / {stats.totalCount} earned
            </span>
          </div>
          <div className="h-4 w-px bg-border" />
          <div className="flex-1">
            <Progress
              value={
                stats.totalCount > 0
                  ? (stats.earnedCount / stats.totalCount) * 100
                  : 0
              }
              className="h-1.5 bg-cai-emerald/20 [&>[data-slot=progress-indicator]]:bg-cai-emerald"
            />
          </div>
          <span className="text-sm font-medium text-muted-foreground">
            {stats.totalCount > 0
              ? Math.round((stats.earnedCount / stats.totalCount) * 100)
              : 0}
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

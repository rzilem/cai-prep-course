import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/server'

// =============================================================================
// GET /api/achievements
// Fetch all achievements with user's earned status
// =============================================================================

export async function GET(request: NextRequest) {
  try {
    const supabase = await createServiceClient()
    const { searchParams } = new URL(request.url)
    const userEmail = searchParams.get('user_email')

    if (!userEmail) {
      return NextResponse.json(
        { error: 'user_email query param is required' },
        { status: 400 }
      )
    }

    // Fetch all active achievements
    const { data: achievements, error: achError } = await supabase
      .from('cai_achievements')
      .select('*')
      .eq('is_active', true)
      .order('rarity', { ascending: true })

    if (achError) {
      return NextResponse.json(
        { error: 'Failed to fetch achievements' },
        { status: 500 }
      )
    }

    // Fetch user's earned achievements
    const { data: userAchievements, error: userAchError } = await supabase
      .from('cai_user_achievements')
      .select('achievement_id, earned_at')
      .eq('user_email', userEmail)

    if (userAchError) {
      console.error('[GET /api/achievements] User achievements error:', userAchError)
    }

    // Build earned lookup map
    const earnedMap = new Map(
      (userAchievements ?? []).map((ua) => [ua.achievement_id, ua.earned_at])
    )

    // Merge achievements with earned status
    const merged = (achievements ?? []).map((ach) => ({
      ...ach,
      earned_at: earnedMap.get(ach.id) ?? null,
    }))

    // Fetch user stats for level calculation
    const { data: stats } = await supabase
      .from('cai_user_stats')
      .select('total_xp')
      .eq('user_email', userEmail)
      .single()

    const totalXp = stats?.total_xp ?? 0
    const level = Math.floor(totalXp / 1000)

    return NextResponse.json({
      achievements: merged,
      total_xp: totalXp,
      level,
      earned_count: earnedMap.size,
      total_count: (achievements ?? []).length,
    })
  } catch (err) {
    console.error('[GET /api/achievements]', err)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// =============================================================================
// POST /api/achievements
// Check criteria and award any newly earned achievements
// =============================================================================

export async function POST(request: NextRequest) {
  try {
    const supabase = await createServiceClient()
    const body = await request.json()
    const { user_email } = body

    if (!user_email) {
      return NextResponse.json(
        { error: 'user_email is required' },
        { status: 400 }
      )
    }

    // -------------------------------------------------------------------------
    // Gather user data for criteria checking
    // -------------------------------------------------------------------------
    const [statsResult, progressResult, quizResult, flashcardResult, earnedResult] =
      await Promise.all([
        supabase
          .from('cai_user_stats')
          .select('*')
          .eq('user_email', user_email)
          .single(),
        supabase
          .from('cai_user_progress')
          .select('*')
          .eq('user_email', user_email),
        supabase
          .from('cai_quiz_attempts')
          .select('*')
          .eq('user_email', user_email),
        supabase
          .from('cai_flashcard_progress')
          .select('*')
          .eq('user_email', user_email),
        supabase
          .from('cai_user_achievements')
          .select('achievement_id')
          .eq('user_email', user_email),
      ])

    const stats = statsResult.data
    const progress = progressResult.data ?? []
    const quizAttempts = quizResult.data ?? []
    const flashcards = flashcardResult.data ?? []
    const alreadyEarned = new Set(
      (earnedResult.data ?? []).map((e) => e.achievement_id)
    )

    if (!stats) {
      return NextResponse.json({ newly_awarded: [] })
    }

    // -------------------------------------------------------------------------
    // Fetch all active achievements
    // -------------------------------------------------------------------------
    const { data: achievements } = await supabase
      .from('cai_achievements')
      .select('*')
      .eq('is_active', true)

    if (!achievements?.length) {
      return NextResponse.json({ newly_awarded: [] })
    }

    // -------------------------------------------------------------------------
    // Check each achievement's criteria
    // -------------------------------------------------------------------------
    const newlyAwarded: Array<{
      id: string
      slug: string
      title: string
      xp_reward: number
      rarity: string
    }> = []

    for (const ach of achievements) {
      // Skip already earned
      if (alreadyEarned.has(ach.id)) continue

      const criteria = ach.criteria as Record<string, unknown>
      let met = true

      // Check each criterion
      for (const [key, value] of Object.entries(criteria)) {
        switch (key) {
          case 'lessons_completed':
            if (stats.lessons_completed < (value as number)) met = false
            break
          case 'quizzes_passed':
            if (stats.quizzes_passed < (value as number)) met = false
            break
          case 'total_xp':
            if (stats.total_xp < (value as number)) met = false
            break
          case 'current_streak':
            if (stats.current_streak < (value as number)) met = false
            break
          case 'study_minutes':
            if (stats.study_minutes < (value as number)) met = false
            break
          case 'avg_quiz_score':
            if (stats.avg_quiz_score < (value as number)) met = false
            break
          case 'flashcards_reviewed':
            if (flashcards.length < (value as number)) met = false
            break
          case 'perfect_quizzes': {
            const perfectCount = quizAttempts.filter(
              (q) => q.score === q.total_questions && q.total_questions > 0
            ).length
            if (perfectCount < (value as number)) met = false
            break
          }
          case 'courses_completed': {
            const completedCourses = progress.filter(
              (p) =>
                p.status === 'completed' &&
                p.module_id === null &&
                p.lesson_id === null
            ).length
            if (completedCourses < (value as number)) met = false
            break
          }
          case 'practice_exams_passed': {
            const passedExams = quizAttempts.filter(
              (q) => q.quiz_type === 'practice_exam' && q.passed
            ).length
            if (passedExams < (value as number)) met = false
            break
          }
          default:
            // Unknown criterion — skip (don't fail)
            break
        }

        if (!met) break
      }

      if (met) {
        newlyAwarded.push({
          id: ach.id,
          slug: ach.slug,
          title: ach.title,
          xp_reward: ach.xp_reward,
          rarity: ach.rarity,
        })
      }
    }

    // -------------------------------------------------------------------------
    // Award newly earned achievements
    // -------------------------------------------------------------------------
    if (newlyAwarded.length > 0) {
      const insertRows = newlyAwarded.map((ach) => ({
        user_email,
        achievement_id: ach.id,
        earned_at: new Date().toISOString(),
      }))

      const { error: insertError } = await supabase
        .from('cai_user_achievements')
        .insert(insertRows)

      if (insertError) {
        console.error('[POST /api/achievements] Insert error:', insertError)
      }

      // Add XP rewards
      const totalXpReward = newlyAwarded.reduce(
        (sum, a) => sum + a.xp_reward,
        0
      )

      if (totalXpReward > 0) {
        await supabase
          .from('cai_user_stats')
          .update({
            total_xp: stats.total_xp + totalXpReward,
            updated_at: new Date().toISOString(),
          })
          .eq('user_email', user_email)
      }
    }

    return NextResponse.json({
      newly_awarded: newlyAwarded,
      total_xp_earned: newlyAwarded.reduce((s, a) => s + a.xp_reward, 0),
    })
  } catch (err) {
    console.error('[POST /api/achievements]', err)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

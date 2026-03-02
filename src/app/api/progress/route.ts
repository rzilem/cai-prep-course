import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/server'
import { XP_VALUES } from '@/lib/types'

// =============================================================================
// GET /api/progress
// Fetch all user progress records + user stats
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

    // Fetch progress records
    const { data: progress, error: progressError } = await supabase
      .from('cai_user_progress')
      .select('*')
      .eq('user_email', userEmail)
      .order('updated_at', { ascending: false })

    if (progressError) {
      return NextResponse.json(
        { error: 'Failed to fetch progress' },
        { status: 500 }
      )
    }

    // Fetch user stats
    const { data: stats, error: statsError } = await supabase
      .from('cai_user_stats')
      .select('*')
      .eq('user_email', userEmail)
      .single()

    // Stats may not exist yet — that is fine
    if (statsError && statsError.code !== 'PGRST116') {
      console.error('[GET /api/progress] Stats error:', statsError)
    }

    return NextResponse.json({
      progress: progress ?? [],
      stats: stats ?? null,
    })
  } catch (err) {
    console.error('[GET /api/progress]', err)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// =============================================================================
// POST /api/progress
// Upsert progress and optionally update stats on completion
// =============================================================================

export async function POST(request: NextRequest) {
  try {
    const supabase = await createServiceClient()
    const body = await request.json()

    const {
      user_email,
      course_id,
      module_id,
      lesson_id,
      status,
      progress_percent,
      time_spent_seconds,
      last_video_position,
    } = body

    if (!user_email || !course_id || !status) {
      return NextResponse.json(
        { error: 'user_email, course_id, and status are required' },
        { status: 400 }
      )
    }

    // Build the upsert payload
    const progressRecord: Record<string, unknown> = {
      user_email,
      course_id,
      status,
      updated_at: new Date().toISOString(),
    }

    if (module_id) progressRecord.module_id = module_id
    if (lesson_id) progressRecord.lesson_id = lesson_id
    if (progress_percent !== undefined) progressRecord.progress_percent = progress_percent
    if (time_spent_seconds !== undefined) progressRecord.time_spent_seconds = time_spent_seconds
    if (last_video_position !== undefined) progressRecord.last_video_position = last_video_position
    if (status === 'completed') progressRecord.completed_at = new Date().toISOString()

    // Upsert into progress table
    // Conflict on (user_email, course_id, module_id, lesson_id) composite
    const { data: upserted, error: upsertError } = await supabase
      .from('cai_user_progress')
      .upsert(progressRecord, {
        onConflict: 'user_email,course_id,module_id,lesson_id',
      })
      .select()
      .single()

    if (upsertError) {
      console.error('[POST /api/progress] Upsert error:', upsertError)
      return NextResponse.json(
        { error: 'Failed to update progress' },
        { status: 500 }
      )
    }

    // -------------------------------------------------------------------------
    // On completion: update user stats
    // -------------------------------------------------------------------------
    if (status === 'completed' && lesson_id) {
      const xpToAdd = XP_VALUES.lesson_complete
      const studyMinutesToAdd = Math.round((time_spent_seconds ?? 0) / 60)

      // Ensure stats row exists
      await supabase
        .from('cai_user_stats')
        .upsert(
          {
            user_email,
            total_xp: 0,
            current_streak: 0,
            longest_streak: 0,
            study_minutes: 0,
            lessons_completed: 0,
            quizzes_passed: 0,
            avg_quiz_score: 0,
          },
          { onConflict: 'user_email', ignoreDuplicates: true }
        )

      // Increment stats via RPC or manual read-update
      const { data: currentStats } = await supabase
        .from('cai_user_stats')
        .select('*')
        .eq('user_email', user_email)
        .single()

      if (currentStats) {
        const today = new Date().toISOString().split('T')[0]
        const lastActivity = currentStats.last_activity_date
        let newStreak = currentStats.current_streak

        // Update streak logic
        if (lastActivity) {
          const lastDate = new Date(lastActivity)
          const todayDate = new Date(today)
          const diffDays = Math.floor(
            (todayDate.getTime() - lastDate.getTime()) / (1000 * 60 * 60 * 24)
          )
          if (diffDays === 1) {
            newStreak += 1
          } else if (diffDays > 1) {
            newStreak = 1
          }
          // diffDays === 0 means same day, streak unchanged
        } else {
          newStreak = 1
        }

        await supabase
          .from('cai_user_stats')
          .update({
            total_xp: currentStats.total_xp + xpToAdd,
            lessons_completed: currentStats.lessons_completed + 1,
            study_minutes: currentStats.study_minutes + studyMinutesToAdd,
            current_streak: newStreak,
            longest_streak: Math.max(currentStats.longest_streak, newStreak),
            last_activity_date: today,
            updated_at: new Date().toISOString(),
          })
          .eq('user_email', user_email)
      }
    }

    return NextResponse.json(upserted)
  } catch (err) {
    console.error('[POST /api/progress]', err)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

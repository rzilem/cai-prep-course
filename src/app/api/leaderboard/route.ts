import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/server'

export async function GET(request: NextRequest) {
  try {
    const supabase = await createServiceClient()
    const { searchParams } = new URL(request.url)
    const userEmail = searchParams.get('user_email')

    // Fetch all users ordered by total XP
    const { data: users, error } = await supabase
      .from('cai_user_stats')
      .select('user_email, display_name, total_xp, current_streak, longest_streak, lessons_completed, quizzes_passed, avg_quiz_score, study_minutes, last_activity_date')
      .order('total_xp', { ascending: false })
      .limit(50)

    if (error) {
      return NextResponse.json(
        { error: 'Failed to fetch leaderboard' },
        { status: 500 }
      )
    }

    // Map to leaderboard entries
    const leaderboard = (users ?? []).map((u, index) => {
      const name = u.display_name || u.user_email.split('@')[0]
      const initials = name
        .split(/[\s.]+/)
        .filter(Boolean)
        .slice(0, 2)
        .map((w: string) => w[0].toUpperCase())
        .join('')

      return {
        rank: index + 1,
        email: u.user_email,
        displayName: name,
        initials: initials || '??',
        totalXP: u.total_xp ?? 0,
        currentStreak: u.current_streak ?? 0,
        quizAverage: Math.round(u.avg_quiz_score ?? 0),
        lessonsCompleted: u.lessons_completed ?? 0,
        studyMinutes: u.study_minutes ?? 0,
        isCurrentUser: u.user_email === userEmail,
      }
    })

    return NextResponse.json({ leaderboard })
  } catch (err) {
    console.error('[GET /api/leaderboard]', err)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

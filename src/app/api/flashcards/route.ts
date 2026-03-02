import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/server'
import { XP_VALUES } from '@/lib/types'

// =============================================================================
// GET /api/flashcards
// Fetch today's due flashcards with question content
// =============================================================================

export async function GET(request: NextRequest) {
  try {
    const supabase = await createServiceClient()
    const { searchParams } = new URL(request.url)
    const userEmail = searchParams.get('user_email')
    const courseId = searchParams.get('course_id')

    if (!userEmail) {
      return NextResponse.json(
        { error: 'user_email query param is required' },
        { status: 400 }
      )
    }

    const today = new Date().toISOString().split('T')[0]

    // -------------------------------------------------------------------------
    // Fetch due flashcard progress records
    // -------------------------------------------------------------------------
    let query = supabase
      .from('cai_flashcard_progress')
      .select('*, cai_questions(*)')
      .eq('user_email', userEmail)
      .lte('next_review', today)
      .order('next_review', { ascending: true })

    // Optional course filter: join through cai_questions.course_id
    if (courseId) {
      query = query.eq('cai_questions.course_id', courseId)
    }

    const { data: dueCards, error: dueError } = await query

    if (dueError) {
      console.error('[GET /api/flashcards] Due cards error:', dueError)
      return NextResponse.json(
        { error: 'Failed to fetch flashcards' },
        { status: 500 }
      )
    }

    // Filter out cards where the join didn't match (course filter)
    const filteredCards = courseId
      ? (dueCards ?? []).filter((card) => card.cai_questions !== null)
      : dueCards ?? []

    // -------------------------------------------------------------------------
    // Stats: due today + reviewed today
    // -------------------------------------------------------------------------
    const { count: dueToday } = await supabase
      .from('cai_flashcard_progress')
      .select('*', { count: 'exact', head: true })
      .eq('user_email', userEmail)
      .lte('next_review', today)

    const { count: reviewedToday } = await supabase
      .from('cai_flashcard_progress')
      .select('*', { count: 'exact', head: true })
      .eq('user_email', userEmail)
      .eq('last_reviewed', today)

    return NextResponse.json({
      cards: filteredCards.map((card) => ({
        id: card.id,
        question_id: card.question_id,
        ease_factor: card.ease_factor,
        interval: card.interval,
        repetitions: card.repetitions,
        next_review: card.next_review,
        last_reviewed: card.last_reviewed,
        question: card.cai_questions,
      })),
      stats: {
        due_today: dueToday ?? 0,
        reviewed_today: reviewedToday ?? 0,
      },
    })
  } catch (err) {
    console.error('[GET /api/flashcards]', err)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// =============================================================================
// POST /api/flashcards
// Review a flashcard using SM-2 spaced repetition algorithm
// =============================================================================

export async function POST(request: NextRequest) {
  try {
    const supabase = await createServiceClient()
    const body = await request.json()

    const { user_email, question_id, rating } = body as {
      user_email: string
      question_id: string
      rating: 'again' | 'hard' | 'good' | 'easy'
    }

    if (!user_email || !question_id || !rating) {
      return NextResponse.json(
        { error: 'user_email, question_id, and rating are required' },
        { status: 400 }
      )
    }

    if (!['again', 'hard', 'good', 'easy'].includes(rating)) {
      return NextResponse.json(
        { error: 'rating must be one of: again, hard, good, easy' },
        { status: 400 }
      )
    }

    const today = new Date().toISOString().split('T')[0]

    // -------------------------------------------------------------------------
    // Fetch current flashcard state (or create if first review)
    // -------------------------------------------------------------------------
    let { data: card } = await supabase
      .from('cai_flashcard_progress')
      .select('*')
      .eq('user_email', user_email)
      .eq('question_id', question_id)
      .single()

    // Defaults for a new card
    let easeFactor = card?.ease_factor ?? 2.5
    let interval = card?.interval ?? 0
    let repetitions = card?.repetitions ?? 0

    // -------------------------------------------------------------------------
    // SM-2 Algorithm
    // -------------------------------------------------------------------------
    switch (rating) {
      case 'again':
        // Reset — card was forgotten
        easeFactor = Math.max(1.3, easeFactor - 0.2)
        interval = 0
        repetitions = 0
        break

      case 'hard':
        // Difficult recall — slight penalty, small interval bump
        easeFactor = Math.max(1.3, easeFactor - 0.15)
        if (interval === 0) {
          interval = 1
        } else {
          interval = Math.ceil(interval * 1.2)
        }
        repetitions += 1
        break

      case 'good':
        // Normal recall — standard SM-2 progression
        if (repetitions === 0) {
          interval = 1
        } else if (repetitions === 1) {
          interval = 6
        } else {
          interval = Math.ceil(interval * easeFactor)
        }
        repetitions += 1
        break

      case 'easy':
        // Perfect recall — boost interval and ease
        if (repetitions === 0) {
          interval = 4
        } else if (repetitions === 1) {
          interval = 10
        } else {
          interval = Math.ceil(interval * easeFactor * 1.3)
        }
        easeFactor += 0.15
        repetitions += 1
        break
    }

    // Calculate next review date
    const nextReview = new Date()
    nextReview.setDate(nextReview.getDate() + interval)
    const nextReviewStr = nextReview.toISOString().split('T')[0]

    // -------------------------------------------------------------------------
    // Upsert flashcard progress
    // -------------------------------------------------------------------------
    const { data: updated, error: upsertError } = await supabase
      .from('cai_flashcard_progress')
      .upsert(
        {
          ...(card?.id ? { id: card.id } : {}),
          user_email,
          question_id,
          ease_factor: Math.round(easeFactor * 100) / 100, // 2 decimal places
          interval,
          repetitions,
          next_review: nextReviewStr,
          last_reviewed: today,
        },
        { onConflict: 'user_email,question_id' }
      )
      .select()
      .single()

    if (upsertError) {
      console.error('[POST /api/flashcards] Upsert error:', upsertError)
      return NextResponse.json(
        { error: 'Failed to update flashcard' },
        { status: 500 }
      )
    }

    // -------------------------------------------------------------------------
    // Award flashcard review XP
    // -------------------------------------------------------------------------
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

    const { data: stats } = await supabase
      .from('cai_user_stats')
      .select('total_xp')
      .eq('user_email', user_email)
      .single()

    if (stats) {
      await supabase
        .from('cai_user_stats')
        .update({
          total_xp: stats.total_xp + XP_VALUES.flashcard_review,
          last_activity_date: today,
          updated_at: new Date().toISOString(),
        })
        .eq('user_email', user_email)
    }

    return NextResponse.json({
      ...updated,
      xp_earned: XP_VALUES.flashcard_review,
    })
  } catch (err) {
    console.error('[POST /api/flashcards]', err)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

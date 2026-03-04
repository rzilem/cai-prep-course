import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/server'

// =============================================================================
// GET /api/quiz/questions
// Fetch published questions for a course, module, or lesson
// =============================================================================

export async function GET(request: NextRequest) {
  try {
    const supabase = await createServiceClient()
    const { searchParams } = new URL(request.url)

    const courseSlug = searchParams.get('course_slug')
    const moduleSlug = searchParams.get('module_slug')
    const lessonId = searchParams.get('lesson_id')
    const type = searchParams.get('type') // 'practice_exam' | 'module_quiz' | 'lesson_quiz'
    const limitParam = searchParams.get('limit')

    // Need at least one filter
    if (!courseSlug && !lessonId) {
      return NextResponse.json(
        { error: 'course_slug or lesson_id is required' },
        { status: 400 }
      )
    }

    // Resolve course_id from slug
    let courseId: string | null = null
    if (courseSlug) {
      const { data: course } = await supabase
        .from('cai_courses')
        .select('id')
        .eq('slug', courseSlug)
        .single()

      if (!course) {
        return NextResponse.json(
          { error: 'Course not found' },
          { status: 404 }
        )
      }
      courseId = course.id
    }

    // Build query
    let query = supabase
      .from('cai_questions')
      .select('*')
      .eq('is_published', true)

    if (courseId) {
      query = query.eq('course_id', courseId)
    }

    if (lessonId) {
      query = query.eq('lesson_id', lessonId)
    }

    // For module quiz, resolve module_id from slug
    if (moduleSlug && courseId) {
      const { data: mod } = await supabase
        .from('cai_modules')
        .select('id')
        .eq('slug', moduleSlug)
        .eq('course_id', courseId)
        .single()

      if (mod) {
        query = query.eq('module_id', mod.id)
      }
    }

    // Practice exams get more questions, shuffled
    const limit = limitParam
      ? parseInt(limitParam, 10)
      : type === 'practice_exam'
        ? 100
        : 10

    query = query.limit(limit)

    const { data: questions, error } = await query

    if (error) {
      console.error('[GET /api/quiz/questions]', error)
      return NextResponse.json(
        { error: 'Failed to fetch questions' },
        { status: 500 }
      )
    }

    // Shuffle questions for randomness
    const shuffled = (questions ?? []).sort(() => Math.random() - 0.5)

    return NextResponse.json({
      questions: shuffled,
      total: shuffled.length,
      course_id: courseId,
    })
  } catch (err) {
    console.error('[GET /api/quiz/questions]', err)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

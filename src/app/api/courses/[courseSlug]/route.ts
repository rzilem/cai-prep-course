import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/server'

// =============================================================================
// GET /api/courses/[courseSlug]
// Fetch course by slug with all published modules + lesson counts
// =============================================================================

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ courseSlug: string }> }
) {
  try {
    const { courseSlug } = await params
    const supabase = await createServiceClient()

    // Fetch the course
    const { data: course, error: courseError } = await supabase
      .from('cai_courses')
      .select('*')
      .eq('slug', courseSlug)
      .eq('is_published', true)
      .single()

    if (courseError || !course) {
      return NextResponse.json(
        { error: 'Course not found' },
        { status: 404 }
      )
    }

    // Fetch published modules ordered by module_number
    const { data: modules, error: modulesError } = await supabase
      .from('cai_modules')
      .select('*')
      .eq('course_id', course.id)
      .eq('is_published', true)
      .order('module_number', { ascending: true })

    if (modulesError) {
      return NextResponse.json(
        { error: 'Failed to fetch modules' },
        { status: 500 }
      )
    }

    // For each module, count published lessons
    const modulesWithLessonCounts = await Promise.all(
      (modules ?? []).map(async (mod) => {
        const { count } = await supabase
          .from('cai_lessons')
          .select('*', { count: 'exact', head: true })
          .eq('module_id', mod.id)
          .eq('is_published', true)

        return {
          ...mod,
          lesson_count: count ?? 0,
        }
      })
    )

    return NextResponse.json({
      ...course,
      module_count: modulesWithLessonCounts.length,
      modules: modulesWithLessonCounts,
    })
  } catch (err) {
    console.error('[GET /api/courses/[courseSlug]]', err)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

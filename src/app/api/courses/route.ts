import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/server'

// =============================================================================
// GET /api/courses
// Fetch all published courses, or a single course by ?slug=
// =============================================================================

export async function GET(request: NextRequest) {
  try {
    const supabase = await createServiceClient()
    const { searchParams } = new URL(request.url)
    const slug = searchParams.get('slug')

    // -------------------------------------------------------------------------
    // Single course by slug — include modules
    // -------------------------------------------------------------------------
    if (slug) {
      const { data: course, error: courseError } = await supabase
        .from('cai_courses')
        .select('*')
        .eq('slug', slug)
        .eq('is_published', true)
        .single()

      if (courseError || !course) {
        return NextResponse.json(
          { error: 'Course not found' },
          { status: 404 }
        )
      }

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

      return NextResponse.json({
        ...course,
        modules: modules ?? [],
      })
    }

    // -------------------------------------------------------------------------
    // All published courses with module counts
    // -------------------------------------------------------------------------
    const { data: courses, error: coursesError } = await supabase
      .from('cai_courses')
      .select('*')
      .eq('is_published', true)
      .order('sort_order', { ascending: true })

    if (coursesError) {
      return NextResponse.json(
        { error: 'Failed to fetch courses' },
        { status: 500 }
      )
    }

    // Fetch module counts for each course
    const coursesWithCounts = await Promise.all(
      (courses ?? []).map(async (course) => {
        const { count } = await supabase
          .from('cai_modules')
          .select('*', { count: 'exact', head: true })
          .eq('course_id', course.id)
          .eq('is_published', true)

        return {
          ...course,
          module_count: count ?? 0,
        }
      })
    )

    return NextResponse.json(coursesWithCounts)
  } catch (err) {
    console.error('[GET /api/courses]', err)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

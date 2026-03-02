import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/server'

// =============================================================================
// GET /api/courses/[courseSlug]/modules/[moduleSlug]
// Fetch module by slug within a course, with all published lessons
// =============================================================================

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ courseSlug: string; moduleSlug: string }> }
) {
  try {
    const { courseSlug, moduleSlug } = await params
    const supabase = await createServiceClient()

    // Resolve the course first
    const { data: course, error: courseError } = await supabase
      .from('cai_courses')
      .select('id, slug, title, credential_code')
      .eq('slug', courseSlug)
      .eq('is_published', true)
      .single()

    if (courseError || !course) {
      return NextResponse.json(
        { error: 'Course not found' },
        { status: 404 }
      )
    }

    // Fetch the module within that course
    const { data: mod, error: modError } = await supabase
      .from('cai_modules')
      .select('*')
      .eq('course_id', course.id)
      .eq('slug', moduleSlug)
      .eq('is_published', true)
      .single()

    if (modError || !mod) {
      return NextResponse.json(
        { error: 'Module not found' },
        { status: 404 }
      )
    }

    // Fetch all published lessons in this module
    const { data: lessons, error: lessonsError } = await supabase
      .from('cai_lessons')
      .select('*')
      .eq('module_id', mod.id)
      .eq('is_published', true)
      .order('sort_order', { ascending: true })

    if (lessonsError) {
      return NextResponse.json(
        { error: 'Failed to fetch lessons' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      ...mod,
      course: {
        id: course.id,
        slug: course.slug,
        title: course.title,
        credential_code: course.credential_code,
      },
      lesson_count: (lessons ?? []).length,
      lessons: lessons ?? [],
    })
  } catch (err) {
    console.error('[GET /api/courses/[courseSlug]/modules/[moduleSlug]]', err)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

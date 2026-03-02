import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/server'

// =============================================================================
// GET /api/media/video/[id]
// Fetch signed URL for a video and redirect
// =============================================================================

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const supabase = await createServiceClient()

    // Try lessons first (most common case)
    let videoUrl: string | null = null

    const { data: lesson } = await supabase
      .from('cai_lessons')
      .select('video_url')
      .eq('id', id)
      .single()

    if (lesson?.video_url) {
      videoUrl = lesson.video_url
    } else {
      // Fall back to modules
      const { data: mod } = await supabase
        .from('cai_modules')
        .select('video_url')
        .eq('id', id)
        .single()

      if (mod?.video_url) {
        videoUrl = mod.video_url
      }
    }

    if (!videoUrl) {
      return NextResponse.json(
        { error: 'Video not found' },
        { status: 404 }
      )
    }

    // -------------------------------------------------------------------------
    // If the URL is already an external URL (e.g., YouTube, Vimeo), redirect
    // -------------------------------------------------------------------------
    if (videoUrl.startsWith('http://') || videoUrl.startsWith('https://')) {
      return NextResponse.redirect(videoUrl)
    }

    // -------------------------------------------------------------------------
    // Otherwise, it is a Supabase storage path — create signed URL
    // -------------------------------------------------------------------------
    const { data: signedUrl, error: signError } = await supabase.storage
      .from('cai-videos')
      .createSignedUrl(videoUrl, 60 * 60) // 1 hour expiry

    if (signError || !signedUrl) {
      console.error('[GET /api/media/video/[id]] Sign error:', signError)
      return NextResponse.json(
        { error: 'Failed to generate video URL' },
        { status: 500 }
      )
    }

    return NextResponse.redirect(signedUrl.signedUrl)
  } catch (err) {
    console.error('[GET /api/media/video/[id]]', err)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

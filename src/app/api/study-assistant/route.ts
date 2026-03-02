import { NextRequest } from 'next/server'

// =============================================================================
// POST /api/study-assistant
// Proxy to Spark AI Gateway for streaming CAI study assistance
// =============================================================================

const SYSTEM_PROMPT = `You are a CAI certification study assistant for PS Property Management staff. Your role is to help employees prepare for Community Associations Institute (CAI) credential exams including CMCA, AMS, PCAM, LSM, RS, CIRMS, and Board Leadership.

Guidelines:
- Cite specific CAI course modules and lesson titles when referencing content
- Reference Texas Property Code sections and Texas-specific HOA law when relevant
- Explain concepts clearly with real-world property management examples
- When discussing exam topics, mention which exam domain the topic falls under and its weight
- For CMCA prep, focus on the 7 exam domains: Financial Management (19%), Community Governance (18%), Legal Ethics & Risk (18%), Facilities (14%), Community Relations (14%), Human Resources (10%), Communications & Technology (7%)
- Be encouraging but accurate — never make up legal citations or exam details
- If you are unsure about something, say so rather than guessing
- Keep answers focused and practical for working property managers`

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { message, history, course_filter } = body as {
      message: string
      history?: { role: string; content: string }[]
      course_filter?: string
    }

    if (!message) {
      return new Response(
        JSON.stringify({ error: 'message is required' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      )
    }

    const gatewayUrl = process.env.GATEWAY_URL
    const gatewayKey = process.env.GATEWAY_API_KEY

    if (!gatewayUrl || !gatewayKey) {
      return new Response(
        JSON.stringify({ error: 'Study assistant is not configured' }),
        { status: 503, headers: { 'Content-Type': 'application/json' } }
      )
    }

    // Build messages array
    const messages = [
      { role: 'system', content: SYSTEM_PROMPT },
      ...(history ?? []),
      { role: 'user', content: message },
    ]

    // Build request body for Spark AI Gateway
    const gatewayBody: Record<string, unknown> = {
      messages,
      stream: true,
      model: 'pspm-standard',
    }

    // Add Qdrant filter if course_filter is provided
    if (course_filter) {
      gatewayBody.rag_filter = {
        course: course_filter,
      }
      gatewayBody.tier = 'internal'
    }

    // -------------------------------------------------------------------------
    // Stream from Spark AI Gateway
    // -------------------------------------------------------------------------
    const gatewayResponse = await fetch(`${gatewayUrl}/v1/chat`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${gatewayKey}`,
      },
      body: JSON.stringify(gatewayBody),
    })

    if (!gatewayResponse.ok) {
      const errorText = await gatewayResponse.text()
      console.error('[POST /api/study-assistant] Gateway error:', errorText)
      return new Response(
        JSON.stringify({ error: 'Study assistant temporarily unavailable' }),
        { status: 502, headers: { 'Content-Type': 'application/json' } }
      )
    }

    // Forward the SSE stream to the client
    if (!gatewayResponse.body) {
      return new Response(
        JSON.stringify({ error: 'No response stream' }),
        { status: 502, headers: { 'Content-Type': 'application/json' } }
      )
    }

    return new Response(gatewayResponse.body, {
      status: 200,
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        Connection: 'keep-alive',
        'X-Accel-Buffering': 'no',
      },
    })
  } catch (err) {
    console.error('[POST /api/study-assistant]', err)
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    )
  }
}

import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

// POST /api/agenda/set-result
// Allows setting AI analysis result (e.g., from WorkBuddy) for an event's agenda
export async function POST(request: NextRequest) {
  const cookieStore = await cookies()
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() { return cookieStore.getAll() },
        setAll(c) {
          try { c.forEach(cs => cookieStore.set(cs.name, cs.value, cs.options)) } catch {}
        },
      },
    }
  )

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: '未登錄' }, { status: 401 })

  const { data: profile } = await supabase
    .from('profiles').select('position').eq('id', user.id).single()
  if (!profile?.position) {
    return NextResponse.json({ error: '僅限執委會成員操作' }, { status: 403 })
  }

  const { eventId, analysis } = await request.json()
  if (!eventId || !analysis) {
    return NextResponse.json({ error: '缺少 eventId 或 analysis' }, { status: 400 })
  }

  const { error: updateError } = await supabase
    .from('events')
    .update({
      agenda_analysis: analysis,
      agenda_analysis_status: 'analyzed',
      agenda_analyzed_at: new Date().toISOString(),
    })
    .eq('id', eventId)

  if (updateError) {
    return NextResponse.json({ error: updateError.message }, { status: 500 })
  }

  return NextResponse.json({ success: true })
}

// GET /api/agenda/set-result?eventId=xxx
// Fetch raw text + analysis for a specific event
export async function GET(request: NextRequest) {
  const cookieStore = await cookies()
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() { return cookieStore.getAll() },
        setAll(c) {
          try { c.forEach(cs => cookieStore.set(cs.name, cs.value, cs.options)) } catch {}
        },
      },
    }
  )

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: '未登錄' }, { status: 401 })

  const { searchParams } = new URL(request.url)
  const eventId = searchParams.get('eventId')
  if (!eventId) {
    return NextResponse.json({ error: '缺少 eventId' }, { status: 400 })
  }

  const { data: event } = await supabase
    .from('events')
    .select('agenda_raw_text, agenda_analysis, agenda_analysis_status, agenda_doc_name')
    .eq('id', eventId)
    .single()

  if (!event) {
    return NextResponse.json({ error: '活動不存在' }, { status: 404 })
  }

  return NextResponse.json(event)
}

// GET with no eventId: list all events with pending agenda analysis
export async function PUT(request: NextRequest) {
  const cookieStore = await cookies()
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() { return cookieStore.getAll() },
        setAll(c) {
          try { c.forEach(cs => cookieStore.set(cs.name, cs.value, cs.options)) } catch {}
        },
      },
    }
  )

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: '未登錄' }, { status: 401 })

  // List all events that have extracted text but haven't been analyzed
  const { data: events } = await supabase
    .from('events')
    .select('id, title, agenda_doc_name, agenda_raw_text, agenda_analysis_status')
    .eq('agenda_analysis_status', 'text_extracted')
    .order('created_at', { ascending: false })
    .limit(20)

  return NextResponse.json({ events: events || [] })
}

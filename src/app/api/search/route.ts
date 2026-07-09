import { createServerSupabaseClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(req: NextRequest) {
  const q = req.nextUrl.searchParams.get('q') || ''
  if (q.length < 2) return NextResponse.json({ results: [] })

  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ results: [] })

  const { data: profile } = await supabase
    .from('profiles').select('role,position').eq('id', user.id).single()
  const isLeaderOrExec = profile?.role === 'leader' || !!profile?.position

  const results: any[] = []

  // Search events (filter by role)
  const eventQuery = supabase.from('events').select('id, title, event_date').ilike('title', `%${q}%`).limit(5)
  if (!isLeaderOrExec) {
    eventQuery.eq('is_exec_only', false)
  }
  const { data: events } = await eventQuery
  if (events) {
    results.push(...events.map(e => ({
      type: 'event', id: e.id, title: e.title,
      subtitle: e.event_date ? new Date(e.event_date).toLocaleDateString('zh-HK') : '日期待定',
      link: isLeaderOrExec ? `/dashboard/leader/attendance/${e.id}` : `/dashboard/attendance`,
    })))
  }

  // Search members (leader only)
  if (profile?.role === 'leader') {
    const { data: members } = await supabase.from('profiles')
      .select('id, full_name, position').ilike('full_name', `%${q}%`).limit(5)
    if (members) {
      results.push(...members.map(m => ({
        type: 'member', id: m.id, title: m.full_name,
        subtitle: m.position || '成員',
        link: `/dashboard/leader/members/${m.id}`,
      })))
    }
  }

  // Search documents
  let docQuery = supabase.from('documents').select('id, title').ilike('title', `%${q}%`).limit(5)
  if (!isLeaderOrExec) {
    docQuery = docQuery.eq('member_id', user.id)
  }
  const { data: docs } = await docQuery
  if (docs) {
    results.push(...docs.map(d => ({
      type: 'document', id: d.id, title: d.title, subtitle: '文檔',
      link: isLeaderOrExec ? `/dashboard/leader/documents/${d.id}` : '/dashboard/documents',
    })))
  }

  // Search announcements
  const { data: announcements } = await supabase.from('announcements')
    .select('id, title').ilike('title', `%${q}%`).limit(3)
  if (announcements) {
    results.push(...announcements.map(a => ({
      type: 'announcement', id: a.id, title: a.title, subtitle: '公告',
      link: '/dashboard',
    })))
  }

  return NextResponse.json({ results })
}

import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

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
  if (!eventId) return NextResponse.json({ error: '缺少 eventId' }, { status: 400 })

  const { data: event } = await supabase
    .from('events')
    .select('title, plan_formatted, plan_doc_name')
    .eq('id', eventId)
    .single()

  if (!event?.plan_formatted) {
    return NextResponse.json({ error: '尚未進行格式調整' }, { status: 400 })
  }

  // Convert markdown to HTML, then wrap as a Word-compatible doc
  const title = event.title || '計劃書'
  const formattedText = event.plan_formatted

  // Create a Word-compatible HTML document
  const html = `<!DOCTYPE html>
<html xmlns:o='urn:schemas-microsoft-com:office:office'
      xmlns:w='urn:schemas-microsoft-com:office:word'
      xmlns='http://www.w3.org/TR/REC-html40'>
<head>
<meta charset="utf-8">
<title>${title}</title>
<style>
  body { font-family: 'Microsoft JhengHei', 'Noto Sans TC', sans-serif; font-size: 12pt; line-height: 1.8; padding: 40px; }
  h2 { color: #1a56db; border-bottom: 2px solid #1a56db; padding-bottom: 4px; margin-top: 24px; font-size: 16pt; }
  h3 { color: #333; margin-top: 16px; font-size: 14pt; }
  ul, ol { margin-left: 20px; }
  li { margin-bottom: 4px; }
  p { margin: 6px 0; }
  .header { text-align: center; font-size: 20pt; font-weight: bold; margin-bottom: 30px; }
  .section { margin-bottom: 20px; }
</style>
</head>
<body>
<div class="header">${title}</div>
${convertMarkdownToHtml(formattedText)}
</body>
</html>`

  return new NextResponse(html, {
    headers: {
      'Content-Type': 'application/msword',
      'Content-Disposition': `attachment; filename="${encodeURIComponent(title)}_格式化計劃書.doc"`,
    },
  })
}

function convertMarkdownToHtml(md: string): string {
  let html = md
    // Headers
    .replace(/^### (.+)$/gm, '<h3>$1</h3>')
    .replace(/^## (.+)$/gm, '<h2>$1</h2>')
    .replace(/^# (.+)$/gm, '<h2>$1</h2>')
    // Bold
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    // Unordered list
    .replace(/^- (.+)$/gm, '<li>$1</li>')
    // Ordered list
    .replace(/^\d+\.\s(.+)$/gm, '<li>$1</li>')
    // Wrap consecutive <li> in <ul>
    .replace(/((?:<li>.*<\/li>\n?)+)/g, '<ul>$1</ul>')
    // Line breaks
    .replace(/\n\n/g, '</p><p>')
    .replace(/\n/g, '<br/>')

  return `<p>${html}</p>`
}

/**
 * Unified email sending module using Resend API.
 * Replaces nodemailer + 163 SMTP across all API routes.
 */
const RESEND_API_URL = 'https://api.resend.com/emails'

interface EmailOptions {
  to: string
  subject: string
  html: string
}

export async function sendEmail({ to, subject, html }: EmailOptions): Promise<{ success: boolean; error?: string }> {
  const apiKey = process.env.RESEND_API_KEY
  if (!apiKey) {
    return { success: false, error: 'RESEND_API_KEY not configured' }
  }

  try {
    const res = await fetch(RESEND_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        from: '澳门童军管理系统 <onboarding@resend.dev>',
        to,
        subject,
        html,
      }),
    })

    if (!res.ok) {
      const err = await res.json()
      return { success: false, error: err.message || `Resend returned ${res.status}` }
    }

    return { success: true }
  } catch (e: any) {
    return { success: false, error: e.message }
  }
}

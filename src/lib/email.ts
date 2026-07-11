/**
 * Unified email sending module using SendGrid API.
 * Replaces nodemailer + 163 SMTP across all API routes.
 */
const SENDGRID_API_URL = 'https://api.sendgrid.com/v3/mail/send'
const FROM_EMAIL = 'wenjiechen355@163.com'
const FROM_NAME = '澳門童軍管理系統'

interface EmailOptions {
  to: string
  subject: string
  html: string
}

export async function sendEmail({ to, subject, html }: EmailOptions): Promise<{ success: boolean; error?: string }> {
  const apiKey = process.env.SENDGRID_API_KEY
  if (!apiKey) {
    return { success: false, error: 'SENDGRID_API_KEY not configured' }
  }

  try {
    const res = await fetch(SENDGRID_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        personalizations: [{ to: [{ email: to }] }],
        from: { email: FROM_EMAIL, name: FROM_NAME },
        subject,
        content: [{ type: 'text/html', value: html }],
      }),
    })

    if (!res.ok) {
      const err = await res.json()
      const msg = err.errors?.[0]?.message || err.message || `SendGrid ${res.status}`
      return { success: false, error: msg }
    }

    return { success: true }
  } catch (e: any) {
    return { success: false, error: e.message }
  }
}

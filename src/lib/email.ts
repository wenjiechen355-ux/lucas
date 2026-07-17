/**
 * Unified email sending module using SendGrid API.
 * Replaces nodemailer + 163 SMTP across all API routes.
 *
 * Anti-spam measures:
 * - Always sends both text/plain and text/html (MIME multipart/alternative)
 * - Auto-generates plain text from HTML via tag stripping
 * - Disables SendGrid click tracking (rewritten links trigger spam filters)
 * - Uses proper From name and address
 */

const SENDGRID_API_URL = 'https://api.sendgrid.com/v3/mail/send'
const FROM_EMAIL = 'wenjiechen355@gmail.com'
const FROM_NAME = '澳門童軍管理系統'

interface EmailOptions {
  to: string
  subject: string
  html: string
  /** Plain-text version. Auto-generated from HTML if omitted. */
  text?: string
}

/** Strip HTML tags for plain text fallback */
function htmlToText(html: string): string {
  return html
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<\/p>/gi, '\n\n')
    .replace(/<\/div>/gi, '\n')
    .replace(/<\/h[1-6]>/gi, '\n\n')
    .replace(/<li>/gi, '- ')
    .replace(/<\/li>/gi, '\n')
    .replace(/<[^>]*>/g, '')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/\n{3,}/g, '\n\n')
    .trim()
}

export async function sendEmail({ to, subject, html, text }: EmailOptions): Promise<{ success: boolean; error?: string }> {
  const apiKey = process.env.SENDGRID_API_KEY
  if (!apiKey) {
    return { success: false, error: 'SENDGRID_API_KEY not configured' }
  }

  const plainText = text || htmlToText(html)

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
        // Multipart/alternative: both plain text and HTML
        content: [
          { type: 'text/plain', value: plainText },
          { type: 'text/html', value: html },
        ],
        // Disable click tracking to avoid spam filters flagging rewritten links
        tracking_settings: {
          click_tracking: { enable: false },
        },
        mail_settings: {
          // Use plain-text friendly spam check
          bypass_list_management: { enable: false },
        },
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

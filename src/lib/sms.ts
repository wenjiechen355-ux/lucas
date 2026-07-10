import twilio from 'twilio'

/**
 * Send an SMS message via Twilio.
 * Returns true if sent successfully, false if not configured or failed.
 */
export async function sendSms(to: string, body: string): Promise<boolean> {
  const accountSid = process.env.TWILIO_ACCOUNT_SID
  const authToken = process.env.TWILIO_AUTH_TOKEN
  const fromNumber = process.env.TWILIO_PHONE_NUMBER

  if (!accountSid || !authToken || !fromNumber) {
    console.warn('Twilio not configured, SMS skipped')
    return false
  }

  try {
    const client = twilio(accountSid, authToken)
    await client.messages.create({ body, to, from: fromNumber })
    return true
  } catch (e) {
    console.error('SMS send failed:', e)
    return false
  }
}

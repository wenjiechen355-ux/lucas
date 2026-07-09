import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { persistSession: false } }
)

export async function createNotification(params: {
  user_id: string
  type: string
  title: string
  message?: string
  link?: string
}) {
  try {
    await supabase.from('notifications').insert({
      user_id: params.user_id,
      type: params.type,
      title: params.title,
      message: params.message || '',
      link: params.link || '',
    })
  } catch {
    // Silently ignore notification failures
  }
}

export async function notifyAdmins(params: {
  type: string
  title: string
  message?: string
  link?: string
}) {
  try {
    const { data: admins } = await supabase
      .from('profiles')
      .select('id')
      .or('role.eq.leader,position.not.is.null')

    if (!admins) return

    await Promise.all(
      admins.map(a =>
        createNotification({ ...params, user_id: a.id })
      )
    )
  } catch {
    // Silently ignore
  }
}

export async function notifyAll(params: {
  type: string
  title: string
  message?: string
  link?: string
  exclude_user_id?: string
}) {
  try {
    let query = supabase.from('profiles').select('id')
    if (params.exclude_user_id) {
      query = query.neq('id', params.exclude_user_id)
    }
    const { data: users } = await query

    if (!users) return

    await Promise.all(
      users.map(u =>
        createNotification({ ...params, user_id: u.id, message: params.message || '', link: params.link || '', type: params.type, title: params.title })
      )
    )
  } catch {
    // Silently ignore
  }
}

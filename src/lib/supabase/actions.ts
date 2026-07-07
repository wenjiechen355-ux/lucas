'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { createServerSupabaseClient } from './server'

/**
 * 用户登入
 */
export async function login(formData: FormData) {
  const supabase = await createServerSupabaseClient()
  const email = formData.get('email') as string
  const password = formData.get('password') as string

  const { error } = await supabase.auth.signInWithPassword({ email, password })
  if (error) throw new Error(error.message)

  revalidatePath('/dashboard')
  redirect('/dashboard')
}

/**
 * 用户注册（由领䄂操作）
 */
export async function signUp(formData: FormData) {
  const supabase = await createServerSupabaseClient()
  const email = formData.get('email') as string
  const password = formData.get('password') as string
  const fullName = formData.get('full_name') as string
  const role = formData.get('role') as string || 'member'

  const { error: authError, data } = await supabase.auth.signUp({
    email,
    password,
    options: { data: { full_name: fullName, role } },
  })
  if (authError) throw new Error(authError.message)

  // 等待 auth trigger 创建 profile
  revalidatePath('/dashboard/leader/members')
}

/**
 * 登出
 */
export async function logout() {
  const supabase = await createServerSupabaseClient()
  const { error } = await supabase.auth.signOut()
  if (error) throw new Error(error.message)

  redirect('/login')
}

/**
 * 获取当前用户 profile
 */
export async function getCurrentProfile() {
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single()

  return profile
}

// ===== 出席操作 =====

export async function checkIn(eventId: string) {
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('未登录')

  const { error } = await supabase.from('attendance').insert({
    event_id: eventId,
    member_id: user.id,
    status: 'present',
    checkin_time: new Date().toISOString(),
  })
  if (error) throw new Error(error.message)

  revalidatePath('/dashboard/attendance')
}

export async function recordAttendance(eventId: string, memberIds: string[], status: 'present' | 'absent' | 'excused') {
  const supabase = await createServerSupabaseClient()
  
  const records = memberIds.map(memberId => ({
    event_id: eventId,
    member_id: memberId,
    status,
    checkin_time: status === 'present' ? new Date().toISOString() : null,
  }))

  const { error } = await supabase.from('attendance').insert(records)
  if (error) throw new Error(error.message)

  revalidatePath('/dashboard/leader/attendance')
}

// ===== 进度操作 =====

export async function updateProgress(itemId: string, status: 'not_started' | 'in_progress' | 'completed') {
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('未登录')

  const updateData: any = { status }
  if (status === 'completed') {
    updateData.completed_date = new Date().toISOString()
    updateData.completed_by = user.id
  }

  const { error } = await supabase
    .from('progress_items')
    .update(updateData)
    .eq('id', itemId)
  if (error) throw new Error(error.message)

  revalidatePath('/dashboard/progress')
}

export async function addProgressItem(formData: FormData) {
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('未登录')

  const { error } = await supabase.from('progress_items').insert({
    member_id: formData.get('member_id') || user.id,
    title: formData.get('title') as string,
    description: formData.get('description') as string,
    category: formData.get('category') as string,
    status: 'not_started',
  })
  if (error) throw new Error(error.message)

  revalidatePath('/dashboard/progress')
}

// ===== 文档操作 =====

export async function uploadDocument(formData: FormData) {
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('未登录')

  const file = formData.get('file') as File
  const title = formData.get('title') as string
  const description = formData.get('description') as string

  if (!file || !title) throw new Error('请填写文档标题并选择文件')

  // 上传到 Supabase Storage
  const filePath = `${user.id}/${Date.now()}_${file.name}`
  const { error: uploadError } = await supabase.storage
    .from('documents')
    .upload(filePath, file)
  if (uploadError) throw new Error(uploadError.message)

  // 创建文档记录
  const { error: dbError } = await supabase.from('documents').insert({
    member_id: user.id,
    title,
    description,
    file_path: filePath,
    file_name: file.name,
    file_size: file.size,
    file_type: file.type,
    status: 'pending',
  })
  if (dbError) throw new Error(dbError.message)

  revalidatePath('/dashboard/documents')
}

export async function reviewDocument(docId: string, status: 'approved' | 'rejected', comment: string) {
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('未登录')

  const { error } = await supabase
    .from('documents')
    .update({
      status,
      review_comment: comment,
      reviewer_id: user.id,
      reviewed_at: new Date().toISOString(),
    })
    .eq('id', docId)
  if (error) throw new Error(error.message)

  revalidatePath('/dashboard/documents')
}

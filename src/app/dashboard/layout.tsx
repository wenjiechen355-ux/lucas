import { createServerSupabaseClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import DashboardShell from './dashboard-shell'

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/auth/login')
  }

  // 用 maybeSingle 避免 .single() 出错时抛异常
  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .maybeSingle()

  if (!profile) {
    // profile 不存在 → 尝试手动创建
    const { error: insertError } = await supabase.from('profiles').insert({
      id: user.id,
      email: user.email || '',
      full_name: user.user_metadata?.full_name || '',
      role: user.user_metadata?.role || 'member',
    })
    if (insertError) {
      redirect('/auth/login')
    }
    // 重新获取
    const { data: newProfile } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .maybeSingle()
    if (!newProfile) redirect('/auth/login')

    return (
      <DashboardShell profile={newProfile}>
        {children}
      </DashboardShell>
    )
  }

  return (
    <DashboardShell profile={profile}>
      {children}
    </DashboardShell>
  )
}

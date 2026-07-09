'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Megaphone, Plus, X, Pencil, Trash2, Pin, PinOff, RefreshCw, Loader2, CheckCircle } from 'lucide-react'

export default function AnnouncementsPage() {
  const router = useRouter()
  const supabase = createClient()
  const [announcements, setAnnouncements] = useState<any[]>([])
  const [profile, setProfile] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  const [showCreate, setShowCreate] = useState(false)
  const [editId, setEditId] = useState<string | null>(null)
  const [formTitle, setFormTitle] = useState('')
  const [formContent, setFormContent] = useState('')
  const [formPinned, setFormPinned] = useState(false)
  const [saving, setSaving] = useState(false)

  useEffect(() => { loadData() }, [])

  async function loadData() {
    setLoading(true)
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { router.push('/auth/login'); return }
    const { data: prof } = await supabase.from('profiles').select('*').eq('id', user.id).single()
    setProfile(prof)
    const { data } = await supabase.from('announcements').select('*, profiles!announcements_created_by_fkey(full_name,position)').order('is_pinned', { ascending: false }).order('created_at', { ascending: false })
    setAnnouncements(data || [])
    setLoading(false)
  }

  const isExec = !!profile?.position

  function resetForm() { setFormTitle(''); setFormContent(''); setFormPinned(false); setEditId(null) }

  function openEdit(a: any) { setFormTitle(a.title); setFormContent(a.content); setFormPinned(a.is_pinned); setEditId(a.id); setShowCreate(true) }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault()
    if (!formTitle.trim() || !formContent.trim()) return
    setSaving(true)

    if (editId) {
      await supabase.from('announcements').update({ title: formTitle, content: formContent, is_pinned: formPinned, updated_at: new Date().toISOString() }).eq('id', editId)
    } else {
      await supabase.from('announcements').insert({ title: formTitle, content: formContent, is_pinned: formPinned, created_by: profile?.id })
      // Notify all users
      fetch('/api/announcements/notify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: formTitle, message: formContent.slice(0, 200) }),
      }).catch(() => {})
    }
    resetForm(); setShowCreate(false); loadData(); setSaving(false)
  }

  async function handleDelete(id: string) {
    if (!confirm('確定刪除此公告？')) return
    await supabase.from('announcements').delete().eq('id', id)
    loadData()
  }

  async function handleTogglePin(a: any) {
    await supabase.from('announcements').update({ is_pinned: !a.is_pinned }).eq('id', a.id)
    loadData()
  }

  if (loading) return <div className="flex items-center justify-center py-20"><RefreshCw className="w-6 h-6 animate-spin text-gray-400" /></div>

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <Megaphone className="w-6 h-6" /> 公告管理
          </h1>
          <p className="text-gray-500 mt-1">發佈通告俾所有團員</p>
        </div>
        {isExec && (
          <button onClick={() => { resetForm(); setShowCreate(!showCreate) }}
            className="flex items-center gap-1 px-4 py-2 bg-green-600 text-white rounded-lg text-sm font-medium hover:bg-green-700">
            {showCreate ? <X className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
            {showCreate ? '取消' : '新公告'}
          </button>
        )}
      </div>

      {/* Create/Edit form */}
      {showCreate && isExec && (
        <form onSubmit={handleSave} className="bg-white rounded-xl border border-gray-200 p-6 mb-6 space-y-4">
          <h2 className="font-semibold text-gray-900">{editId ? '編輯公告' : '發佈新公告'}</h2>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">標題 *</label>
            <input type="text" value={formTitle} onChange={e => setFormTitle(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-green-500 outline-none" placeholder="公告標題" required />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">內容 *</label>
            <textarea value={formContent} onChange={e => setFormContent(e.target.value)} rows={4}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-green-500 outline-none resize-none" placeholder="輸入公告內容..." required />
          </div>
          <label className="flex items-center gap-2 text-sm text-gray-600 cursor-pointer">
            <input type="checkbox" checked={formPinned} onChange={e => setFormPinned(e.target.checked)}
              className="w-4 h-4 rounded border-gray-300 text-green-600 focus:ring-green-500" />
            <Pin className="w-3.5 h-3.5" /> 置頂
          </label>
          <button type="submit" disabled={saving || !formTitle.trim() || !formContent.trim()}
            className="w-full bg-green-600 text-white py-2.5 rounded-lg text-sm font-medium hover:bg-green-700 disabled:opacity-50">
            {saving ? '儲存中...' : editId ? '更新公告' : '發佈公告'}
          </button>
        </form>
      )}

      {/* Announcement list */}
      {announcements.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
          <Megaphone className="w-12 h-12 text-gray-300 mx-auto mb-4" />
          <p className="text-gray-500">未有公告</p>
        </div>
      ) : (
        <div className="space-y-3">
          {announcements.map(a => (
            <div key={a.id} className={`bg-white rounded-xl border p-5 ${a.is_pinned ? 'border-amber-200 bg-amber-50/30' : 'border-gray-200'}`}>
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    {a.is_pinned && (
                      <span className="flex items-center gap-0.5 px-1.5 py-0.5 rounded text-[10px] font-medium bg-amber-100 text-amber-700">
                        <Pin className="w-3 h-3" /> 置頂
                      </span>
                    )}
                    <h3 className="font-semibold text-gray-900">{a.title}</h3>
                  </div>
                  <p className="text-sm text-gray-600 mt-1 whitespace-pre-wrap">{a.content}</p>
                  <div className="flex items-center gap-3 mt-2 text-xs text-gray-400">
                    <span>{a.profiles?.full_name}{a.profiles?.position ? `（${a.profiles.position}）` : ''}</span>
                    <span>{new Date(a.created_at).toLocaleDateString('zh-HK')}</span>
                    {a.updated_at !== a.created_at && <span>（已編輯）</span>}
                  </div>
                </div>
                {isExec && (
                  <div className="flex items-center gap-1 flex-shrink-0">
                    <button onClick={() => handleTogglePin(a)} className="p-1.5 text-gray-300 hover:text-amber-500" title={a.is_pinned ? '取消置頂' : '置頂'}>
                      {a.is_pinned ? <PinOff className="w-4 h-4" /> : <Pin className="w-4 h-4" />}
                    </button>
                    <button onClick={() => openEdit(a)} className="p-1.5 text-gray-300 hover:text-blue-500"><Pencil className="w-4 h-4" /></button>
                    <button onClick={() => handleDelete(a.id)} className="p-1.5 text-gray-300 hover:text-red-500"><Trash2 className="w-4 h-4" /></button>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { DollarSign, Upload, CheckCircle, Clock, FileText, X, Loader2, RefreshCw } from 'lucide-react'

export default function PaymentsPage() {
  const router = useRouter()
  const supabase = createClient()
  const [payments, setPayments] = useState<any[]>([])
  const [profile, setProfile] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [uploadingId, setUploadingId] = useState<string | null>(null)

  useEffect(() => { loadData() }, [])

  async function loadData() {
    setLoading(true)
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { router.push('/auth/login'); return }
    const { data: prof } = await supabase.from('profiles').select('*').eq('id', user.id).single()
    setProfile(prof)

    const { data } = await supabase
      .from('event_payments')
      .select('*, events(title, event_date, payment_type, status)')
      .eq('member_id', user.id)
      .order('created_at', { ascending: false })

    setPayments(data || [])
    setLoading(false)
  }

  async function handleUploadReceipt(paymentId: string) {
    const input = document.createElement('input')
    input.type = 'file'
    input.accept = '.pdf,.jpg,.jpeg,.png,.gif,.webp'
    input.onchange = async () => {
      const file = input.files?.[0]
      if (!file) return
      setUploadingId(paymentId)
      const formData = new FormData()
      formData.append('paymentId', paymentId)
      formData.append('file', file)
      try {
        const res = await fetch('/api/payments/upload-receipt', { method: 'POST', body: formData })
        const data = await res.json()
        if (data.success) { loadData() }
        else { alert(data.error || '上載失敗') }
      } catch { alert('網絡錯誤') }
      setUploadingId(null)
    }
    input.click()
  }

  async function handleMarkPaid(paymentId: string) {
    if (!confirm('確認已付款？')) return
    const res = await fetch('/api/payments/mark-paid', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ paymentId }),
    })
    const data = await res.json()
    if (data.success) { loadData() }
    else { alert(data.error || '操作失敗') }
  }

  if (loading) return <div className="flex items-center justify-center py-20"><RefreshCw className="w-6 h-6 animate-spin text-gray-400" /></div>

  const pendingPayments = payments.filter(p => p.status === 'pending')
  const paidPayments = payments.filter(p => p.status === 'paid')

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <DollarSign className="w-6 h-6" /> 活動付款
          </h1>
          <p className="text-gray-500 mt-1">查看需要付款嘅活動、上載付款證明</p>
        </div>
        <button onClick={loadData} className="p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100">
          <RefreshCw className="w-4 h-4" />
        </button>
      </div>

      {/* 未付款 */}
      {pendingPayments.length > 0 && (
        <div className="mb-8">
          <h2 className="font-semibold text-gray-700 mb-3 text-sm uppercase tracking-wide flex items-center gap-2">
            <Clock className="w-4 h-4 text-amber-500" /> 待付款
          </h2>
          <div className="space-y-3">
            {pendingPayments.map(p => (
              <div key={p.id} className="bg-white rounded-xl border border-gray-200 p-5">
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="font-semibold text-gray-900">{p.events?.title || '活動'}</h3>
                    <div className="flex items-center gap-3 mt-1 text-xs text-gray-500">
                      <span>📅 {p.events?.event_date ? new Date(p.events.event_date).toLocaleDateString('zh-HK') : '待定'}</span>
                      <span className={`px-1.5 py-0.5 rounded text-[10px] font-medium ${
                        p.events?.payment_type === 'post' ? 'bg-blue-50 text-blue-600' : 'bg-amber-50 text-amber-600'
                      }`}>
                        {p.events?.payment_type === 'post' ? '事後付款' : '事前付款'}
                      </span>
                    </div>
                  </div>
                  <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-amber-50 text-amber-600">未付款</span>
                </div>

                {p.receipt_path ? (
                  <div className="mt-3 flex items-center gap-3">
                    <div className="flex items-center gap-1.5 text-xs text-green-600 bg-green-50 px-3 py-1.5 rounded-lg">
                      <FileText className="w-3.5 h-3.5" />
                      已上載：{p.receipt_name}
                    </div>
                    <button onClick={() => handleMarkPaid(p.id)}
                      className="px-3 py-1.5 text-xs font-medium text-white bg-green-600 rounded-lg hover:bg-green-700 flex items-center gap-1">
                      <CheckCircle className="w-3.5 h-3.5" /> 已付款
                    </button>
                  </div>
                ) : (
                  <button onClick={() => handleUploadReceipt(p.id)}
                    disabled={uploadingId === p.id}
                    className="mt-3 px-3 py-1.5 text-xs font-medium text-green-600 bg-green-50 rounded-lg hover:bg-green-100 flex items-center gap-1">
                    {uploadingId === p.id ? (
                      <><Loader2 className="w-3.5 h-3.5 animate-spin" /> 上載中...</>
                    ) : (
                      <><Upload className="w-3.5 h-3.5" /> 上載付款證明</>
                    )}
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 已付款 */}
      {paidPayments.length > 0 && (
        <div>
          <h2 className="font-semibold text-gray-700 mb-3 text-sm uppercase tracking-wide flex items-center gap-2">
            <CheckCircle className="w-4 h-4 text-green-500" /> 已付款
          </h2>
          <div className="space-y-3">
            {paidPayments.map(p => (
              <div key={p.id} className="bg-white rounded-xl border border-gray-200 p-5">
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="font-semibold text-gray-900">{p.events?.title || '活動'}</h3>
                    <p className="text-xs text-gray-500 mt-1">📅 {p.events?.event_date ? new Date(p.events.event_date).toLocaleDateString('zh-HK') : '待定'}</p>
                  </div>
                  <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-green-50 text-green-600 flex items-center gap-1">
                    <CheckCircle className="w-3 h-3" /> 已付款
                  </span>
                </div>
                {p.receipt_name && (
                  <p className="text-xs text-gray-400 mt-2">📎 單據：{p.receipt_name}</p>
                )}
                {p.paid_at && (
                  <p className="text-xs text-gray-400 mt-0.5">✅ 付款時間：{new Date(p.paid_at).toLocaleString('zh-HK')}</p>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {payments.length === 0 && (
        <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
          <DollarSign className="w-12 h-12 text-gray-300 mx-auto mb-4" />
          <p className="text-gray-500">目前冇需要付款嘅活動</p>
        </div>
      )}
    </div>
  )
}

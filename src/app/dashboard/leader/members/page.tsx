import { createServerSupabaseClient } from '@/lib/supabase/server'
import { Users } from 'lucide-react'
import Link from 'next/link'

export default async function MembersPage() {
  const supabase = await createServerSupabaseClient()

  const { data: members } = await supabase
    .from('profiles')
    .select('*')
    .order('created_at', { ascending: false })

  const positionOrder = ['主席', '副主席', '文書', '財政', '總務', '物資', '網頁管理', '攝影']
  
  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">成員管理</h1>
          <p className="text-gray-500 mt-1">檢視及管理所有成員 — 點擊姓名查看詳細檔案</p>
        </div>
        <span className="bg-green-50 text-green-700 px-3 py-1 rounded-full text-sm font-medium">
          共 {members?.length || 0} 人
        </span>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-200">
                <th className="text-left px-4 py-3 text-sm font-medium text-gray-500">姓名</th>
                <th className="text-left px-4 py-3 text-sm font-medium text-gray-500">職位</th>
                <th className="text-left px-4 py-3 text-sm font-medium text-gray-500 hidden sm:table-cell">電郵</th>
                <th className="text-left px-4 py-3 text-sm font-medium text-gray-500">角色</th>
                <th className="text-left px-4 py-3 text-sm font-medium text-gray-500 hidden md:table-cell">旅團</th>
                <th className="text-left px-4 py-3 text-sm font-medium text-gray-500 hidden lg:table-cell">註冊日期</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {members?.map(member => (
                <tr key={member.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-4 py-3">
                    <Link href={`/dashboard/leader/members/${member.id}`} className="flex items-center gap-3 group">
                      <div className="w-8 h-8 rounded-full bg-green-100 flex items-center justify-center group-hover:bg-green-200 transition-colors">
                        <span className="text-sm font-medium text-green-700">
                          {member.full_name?.charAt(0) || '?'}
                        </span>
                      </div>
                      <span className="font-medium text-gray-900 text-sm group-hover:text-green-600 transition-colors">{member.full_name}</span>
                    </Link>
                  </td>
                  <td className="px-4 py-3">
                    {member.position ? (
                      <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${
                        member.position === '主席' ? 'bg-red-50 text-red-700' :
                        member.position === '副主席' ? 'bg-orange-50 text-orange-700' :
                        'bg-purple-50 text-purple-700'
                      }`}>{member.position}</span>
                    ) : <span className="text-xs text-gray-400">-</span>}
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-600 hidden sm:table-cell">{member.email}</td>
                  <td className="px-4 py-3">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      member.role === 'leader'
                        ? 'bg-amber-50 text-amber-700'
                        : 'bg-blue-50 text-blue-700'
                    }`}>
                      {member.role === 'leader' ? '領袖' : '成員'}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-500 hidden md:table-cell">{member.scout_unit || '-'}</td>
                  <td className="px-4 py-3 text-sm text-gray-500 hidden lg:table-cell">
                    {new Date(member.created_at).toLocaleDateString('zh-HK')}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {(!members || members.length === 0) && (
          <div className="p-12 text-center">
            <Users className="w-12 h-12 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500">暫無成員</p>
          </div>
        )}
      </div>
    </div>
  )
}

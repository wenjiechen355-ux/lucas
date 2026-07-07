import { createServerSupabaseClient } from '@/lib/supabase/server'
import { Users, Shield, Mail, Calendar } from 'lucide-react'

export default async function MembersPage() {
  const supabase = await createServerSupabaseClient()

  const { data: members } = await supabase
    .from('profiles')
    .select('*')
    .order('created_at', { ascending: false })

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">成員管理</h1>
          <p className="text-gray-500 mt-1">檢視及管理所有成員</p>
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
                <th className="text-left px-4 py-3 text-sm font-medium text-gray-500">電郵</th>
                <th className="text-left px-4 py-3 text-sm font-medium text-gray-500">角色</th>
                <th className="text-left px-4 py-3 text-sm font-medium text-gray-500">旅團</th>
                <th className="text-left px-4 py-3 text-sm font-medium text-gray-500">註冊日期</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {members?.map(member => (
                <tr key={member.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-green-100 flex items-center justify-center">
                        <span className="text-sm font-medium text-green-700">
                          {member.full_name?.charAt(0) || '?'}
                        </span>
                      </div>
                      <span className="font-medium text-gray-900 text-sm">{member.full_name}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-600">{member.email}</td>
                  <td className="px-4 py-3">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      member.role === 'leader'
                        ? 'bg-amber-50 text-amber-700'
                        : 'bg-blue-50 text-blue-700'
                    }`}>
                      {member.role === 'leader' ? '領袖' : '成員'}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-500">{member.scout_unit || '-'}</td>
                  <td className="px-4 py-3 text-sm text-gray-500">
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

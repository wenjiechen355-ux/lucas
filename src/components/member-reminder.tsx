'use client'

import { useState } from 'react'
import { Mail, X, CheckSquare, Square, Loader2, Send, UserCheck, Vote, CalendarCheck, CalendarX, CalendarMinus } from 'lucide-react'

export interface MemberStatus {
  memberId: string
  fullName: string
  position?: string
  // Poll status
  hasVoted?: boolean
  // Attendance status
  attendanceStatus?: 'present' | 'absent' | 'excused' | null
}

interface MemberReminderProps {
  targetTitle: string
  link: string
  type: 'poll' | 'attendance'
  members: MemberStatus[]
}

export default function MemberReminder({ targetTitle, link, type, members }: MemberReminderProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
  const [sending, setSending] = useState<Set<string>>(new Set())
  const [sent, setSent] = useState<Set<string>>(new Set())

  function toggleMember(memberId: string) {
    setSelectedIds(prev => {
      const next = new Set(prev)
      if (next.has(memberId)) next.delete(memberId)
      else next.add(memberId)
      return next
    })
  }

  function toggleAll() {
    const allIds = new Set(members.map(m => m.memberId))
    if (selectedIds.size === allIds.size) {
      setSelectedIds(new Set())
    } else {
      setSelectedIds(allIds)
    }
  }

  async function sendReminder(memberId: string, fullName: string) {
    setSending(prev => new Set([...prev, memberId]))
    try {
      const res = await fetch('/api/send-member-reminder', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ memberId, type, targetTitle, link }),
      })
      if (res.ok) {
        setSent(prev => new Set([...prev, memberId]))
      } else {
        const d = await res.json()
        alert(`發送失敗: ${d.error}`)
      }
    } catch {
      alert('網絡錯誤')
    }
    setSending(prev => {
      const next = new Set(prev)
      next.delete(memberId)
      return next
    })
  }

  async function sendSelected() {
    // Use batch API — one request for all selected members
    const ids = Array.from(selectedIds)
    if (ids.length === 1) {
      // Single member: use individual API
      const member = members.find(m => m.memberId === ids[0])
      if (member) {
        await sendReminder(member.memberId, member.fullName)
        return
      }
    }

    // Multiple members: use batch API
    try {
      const res = await fetch('/api/send-member-reminder-batch', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ memberIds: ids, type, targetTitle, link }),
      })
      const data = await res.json()
      if (res.ok) {
        // Mark all as sent
        setSent(prev => { const next = new Set(prev); ids.forEach(id => next.add(id)); return next })
        alert(`✅ 已發送 ${data.sent} 封郵件${data.failed > 0 ? `，${data.failed} 封失敗` : ''}`)
      } else {
        alert(`發送失敗: ${data.error}`)
      }
    } catch {
      alert('網絡錯誤')
    }
  }

  const allSelected = members.length > 0 && selectedIds.size === members.length
  const votedCount = members.filter(m => m.hasVoted).length
  const checkedInCount = members.filter(m => m.attendanceStatus === 'present').length

  return (
    <>
      {/* Trigger Button */}
      <button
        onClick={() => setIsOpen(true)}
        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors bg-blue-50 text-blue-700 border-blue-200 hover:bg-blue-100"
      >
        <Mail className="w-3.5 h-3.5" />
        提醒成員
      </button>

      {/* Modal Overlay */}
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/40" onClick={() => setIsOpen(false)} />
          <div className="relative bg-white rounded-xl shadow-xl border border-gray-200 max-w-lg w-full max-h-[80vh] flex flex-col">
            {/* Header */}
            <div className="flex items-center justify-between px-5 py-4 border-b border-gray-200">
              <div>
                <h2 className="text-base font-semibold text-gray-900">提醒成員</h2>
                <p className="text-xs text-gray-500 mt-0.5">{targetTitle}</p>
              </div>
              <button onClick={() => setIsOpen(false)} className="p-1.5 hover:bg-gray-100 rounded-lg">
                <X className="w-4 h-4 text-gray-400" />
              </button>
            </div>

            {/* Stats */}
            <div className="px-5 py-3 border-b border-gray-100 bg-gray-50 flex gap-4 text-xs">
              <span className="text-gray-500">
                共 <b className="text-gray-700">{members.length}</b> 人
              </span>
              {type === 'poll' && (
                <span className="flex items-center gap-1 text-green-600">
                  <Vote className="w-3 h-3" /> 已投票: <b>{votedCount}</b>
                </span>
              )}
              {type === 'attendance' && (
                <span className="flex items-center gap-1 text-green-600">
                  <UserCheck className="w-3 h-3" /> 已出席: <b>{checkedInCount}</b>
                </span>
              )}
              <span className="text-blue-600">
                已選: <b>{selectedIds.size}</b>
              </span>
            </div>

            {/* Member List */}
            <div className="flex-1 overflow-y-auto px-5 py-2">
              {/* Select All */}
              <label className="flex items-center gap-2 py-2 px-1 cursor-pointer hover:bg-gray-50 rounded text-sm">
                <div onClick={toggleAll}>
                  {allSelected
                    ? <CheckSquare className="w-4 h-4 text-blue-600" />
                    : <Square className="w-4 h-4 text-gray-300" />
                  }
                </div>
                <span className="text-gray-500 font-medium">全部選擇</span>
              </label>

              <div className="border-t border-gray-100 my-1" />

              {members.map(member => (
                <div
                  key={member.memberId}
                  className="flex items-center justify-between py-2 px-1 hover:bg-gray-50 rounded group"
                >
                  <label className="flex items-center gap-2 flex-1 min-w-0 cursor-pointer">
                    <div onClick={() => toggleMember(member.memberId)}>
                      {selectedIds.has(member.memberId)
                        ? <CheckSquare className="w-4 h-4 text-blue-600 flex-shrink-0" />
                        : <Square className="w-4 h-4 text-gray-300 flex-shrink-0" />
                      }
                    </div>
                    <span className="text-sm text-gray-800 truncate">{member.fullName}</span>
                    {member.position && (
                      <span className="text-xs text-gray-400">({member.position})</span>
                    )}
                  </label>

                  <div className="flex items-center gap-2 ml-2">
                    {/* Poll status */}
                    {type === 'poll' && (
                      member.hasVoted
                        ? <span className="text-xs text-green-600 bg-green-50 px-2 py-0.5 rounded-full">已投票</span>
                        : <span className="text-xs text-gray-400 bg-gray-50 px-2 py-0.5 rounded-full">未投票</span>
                    )}

                    {/* Attendance status */}
                    {type === 'attendance' && (
                      member.attendanceStatus === 'present'
                        ? <span className="flex items-center gap-0.5 text-xs text-green-600 bg-green-50 px-2 py-0.5 rounded-full"><CalendarCheck className="w-3 h-3" />出席</span>
                        : member.attendanceStatus === 'absent'
                          ? <span className="flex items-center gap-0.5 text-xs text-red-600 bg-red-50 px-2 py-0.5 rounded-full"><CalendarX className="w-3 h-3" />缺席</span>
                          : member.attendanceStatus === 'excused'
                            ? <span className="flex items-center gap-0.5 text-xs text-amber-600 bg-amber-50 px-2 py-0.5 rounded-full"><CalendarMinus className="w-3 h-3" />請假</span>
                            : <span className="text-xs text-gray-400 bg-gray-50 px-2 py-0.5 rounded-full">無記錄</span>
                    )}

                    {/* Per-member send button */}
                    <button
                      onClick={() => sendReminder(member.memberId, member.fullName)}
                      disabled={sending.has(member.memberId) || sent.has(member.memberId)}
                      className="p-1.5 rounded-lg hover:bg-blue-50 transition-colors opacity-30 group-hover:opacity-100 disabled:opacity-100"
                      title={sent.has(member.memberId) ? '已發送' : '發送提醒'}
                    >
                      {sending.has(member.memberId)
                        ? <Loader2 className="w-3.5 h-3.5 animate-spin text-blue-500" />
                        : sent.has(member.memberId)
                          ? <span className="text-xs text-green-600">✓</span>
                          : <Send className="w-3.5 h-3.5 text-blue-400" />
                      }
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {/* Footer */}
            <div className="px-5 py-3 border-t border-gray-200 flex justify-between items-center">
              <span className="text-xs text-gray-400">
                已選擇 {selectedIds.size} 位成員
              </span>
              <button
                onClick={sendSelected}
                disabled={selectedIds.size === 0}
                className="flex items-center gap-1.5 px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-40 transition-colors"
              >
                <Send className="w-3.5 h-3.5" />
                發送提醒
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}

'use client'

import { useState, useRef, useEffect } from 'react'
import { MessageCircle, X, Send, Loader2, ShieldCheck, ShieldOff, Sparkles } from 'lucide-react'

interface Message {
  role: 'user' | 'assistant'
  content: string
  toolsUsed?: string[]
}

export default function AIAssistant() {
  const [isOpen, setIsOpen] = useState(false)
  const [authorized, setAuthorized] = useState(false)
  const [messages, setMessages] = useState<Message[]>([
    { role: 'assistant', content: '👋 你好！我係澳門童軍執委會 AI 助手。\n\n我可以幫你：\n• 查詢活動/成員/投票統計\n• 創建新活動\n• 發送通知提醒\n• 解答系統使用問題\n\n需要執行操作請先點擊 🔐 授權。' },
  ])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  async function sendMessage() {
    if (!input.trim() || loading) return
    const userMsg = input.trim()
    setInput('')
    setMessages(prev => [...prev, { role: 'user', content: userMsg }])
    setLoading(true)

    try {
      const chatMessages = messages.concat([{ role: 'user', content: userMsg }])
        .map(m => ({ role: m.role, content: m.content }))

      const res = await fetch('/api/assistant', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: chatMessages, authorized }),
      })
      const data = await res.json()
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: data.reply || '抱歉，請重試。',
        toolsUsed: data.toolsUsed,
      }])
    } catch {
      setMessages(prev => [...prev, { role: 'assistant', content: '網絡錯誤，請重試。' }])
    }
    setLoading(false)
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      sendMessage()
    }
  }

  return (
    <>
      {/* Floating Button */}
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className="fixed bottom-5 right-5 z-50 w-14 h-14 rounded-full shadow-lg flex items-center justify-center transition-all hover:scale-110"
          style={{
            background: 'linear-gradient(135deg, #22c55e, #16a34a)',
            boxShadow: '0 4px 20px rgba(22,163,74,.4)',
          }}
        >
          <MessageCircle className="w-6 h-6 text-white" />
        </button>
      )}

      {/* Chat Panel */}
      {isOpen && (
        <div className="fixed bottom-5 right-5 z-50 w-80 sm:w-96 h-[500px] bg-white rounded-2xl shadow-2xl border border-gray-200 flex flex-col overflow-hidden"
          style={{ boxShadow: '0 8px 40px rgba(0,0,0,.12), 0 2px 8px rgba(0,0,0,.06)' }}>
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100"
            style={{ background: 'linear-gradient(135deg, #f0fdf4, #dcfce7)' }}>
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full flex items-center justify-center"
                style={{ background: 'linear-gradient(135deg, #22c55e, #16a34a)' }}>
                <Sparkles className="w-4 h-4 text-white" />
              </div>
              <div>
                <p className="text-sm font-semibold text-gray-900">AI 助手</p>
                <p className="text-[10px] text-gray-500">澳門童軍執委會</p>
              </div>
            </div>
            <div className="flex items-center gap-1">
              <button
                onClick={() => setAuthorized(!authorized)}
                className={`p-1.5 rounded-lg transition-colors ${authorized ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-400 hover:text-gray-600'}`}
                title={authorized ? '已授權 — 點擊取消' : '點擊授權 AI 助手執行操作'}
              >
                {authorized ? <ShieldCheck className="w-4 h-4" /> : <ShieldOff className="w-4 h-4" />}
              </button>
              <button onClick={() => setIsOpen(false)} className="p-1.5 hover:bg-black/5 rounded-lg">
                <X className="w-4 h-4 text-gray-400" />
              </button>
            </div>
          </div>

          {/* Authorization notice */}
          {!authorized && (
            <div className="px-4 py-2 bg-amber-50 border-b border-amber-100 text-xs text-amber-700 flex items-center gap-2">
              <ShieldOff className="w-3 h-3" />
              未授權 — AI 只能回答問題，無法執行操作
            </div>
          )}
          {authorized && (
            <div className="px-4 py-2 bg-green-50 border-b border-green-100 text-xs text-green-700 flex items-center gap-2">
              <ShieldCheck className="w-3 h-3" />
              已授權 — AI 可以直接執行系統操作
            </div>
          )}

          {/* Messages */}
          <div className="flex-1 overflow-y-auto px-4 py-3 space-y-3">
            {messages.map((msg, i) => (
              <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[85%] rounded-2xl px-3.5 py-2.5 text-sm whitespace-pre-wrap ${
                  msg.role === 'user'
                    ? 'bg-green-600 text-white rounded-br-md'
                    : 'bg-gray-100 text-gray-800 rounded-bl-md'
                }`}>
                  {msg.content}
                  {msg.toolsUsed?.length && (
                    <div className="mt-1.5 pt-1.5 border-t border-white/20">
                      <span className="text-[10px] opacity-70">🔧 {msg.toolsUsed.join(', ')}</span>
                    </div>
                  )}
                </div>
              </div>
            ))}
            {loading && (
              <div className="flex justify-start">
                <div className="bg-gray-100 rounded-2xl rounded-bl-md px-4 py-3">
                  <Loader2 className="w-4 h-4 animate-spin text-gray-400" />
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input */}
          <div className="px-4 py-3 border-t border-gray-100">
            <div className="flex items-center gap-2">
              <textarea
                value={input}
                onChange={e => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                rows={1}
                className="flex-1 resize-none text-sm px-3 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-green-500 outline-none"
                placeholder={authorized ? '輸入指令，我可以幫你操作系統...' : '問我任何問題...'}
                disabled={loading}
              />
              <button
                onClick={sendMessage}
                disabled={!input.trim() || loading}
                className="w-9 h-9 rounded-full flex items-center justify-center transition-colors disabled:opacity-40"
                style={{ background: 'linear-gradient(135deg, #22c55e, #16a34a)' }}
              >
                <Send className="w-4 h-4 text-white" />
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}

import Link from 'next/link'

export default function LandingPage() {
  return (
    <div className="min-h-screen flex flex-col">
      {/* 导航栏 */}
      <header className="bg-white border-b border-gray-200">
        <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-green-600 flex items-center justify-center text-white font-bold text-lg">
              童
            </div>
            <div>
              <h1 className="font-semibold text-gray-900 text-sm leading-tight">澳門童軍第一旅深資童軍團</h1>
              <p className="text-xs text-gray-500">執行委員會</p>
            </div>
          </div>
          <Link
            href="/auth/login"
            className="bg-green-600 text-white px-5 py-2 rounded-lg text-sm font-medium hover:bg-green-700 transition-colors"
          >
            登入系統
          </Link>
        </div>
      </header>

      {/* Hero */}
      <section className="flex-1 flex flex-col items-center justify-center px-4 py-20 text-center bg-gradient-to-b from-green-50 to-white">
        <div className="max-w-2xl">
          <div className="w-20 h-20 rounded-full bg-green-600 flex items-center justify-center text-white text-3xl font-bold mx-auto mb-6">
            童
          </div>
          <h2 className="text-4xl font-bold text-gray-900 mb-4">
            澳門童軍第一旅深資童軍團<br />
            <span className="text-green-600">管理系統</span>
          </h2>
          <p className="text-lg text-gray-600 mb-8 max-w-lg mx-auto">
            一站式追蹤成員進度、管理活動出席、處理文檔簽批，提升執委會工作效率
          </p>
          <div className="flex gap-4 justify-center">
          <Link
            href="/auth/login"
            className="bg-green-600 text-white px-8 py-3 rounded-lg font-medium hover:bg-green-700 transition-colors"
          >
            立即登入
          </Link>
          </div>
        </div>
      </section>

      {/* 功能特點 */}
      <section className="bg-white py-16 border-t border-gray-100">
        <div className="max-w-5xl mx-auto px-4">
          <h3 className="text-2xl font-bold text-center text-gray-900 mb-12">核心功能</h3>
          <div className="grid md:grid-cols-3 gap-8">
            {/* 出席打卡 */}
            <div className="bg-green-50 rounded-2xl p-8 text-center">
              <div className="w-14 h-14 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-4">
                <svg className="w-7 h-7 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h4 className="font-semibold text-gray-900 mb-2">出席打卡</h4>
              <p className="text-sm text-gray-600">活動簽到、出席記錄追蹤、缺席管理，自動生成統計報表</p>
            </div>

            {/* 進度記錄 */}
            <div className="bg-amber-50 rounded-2xl p-8 text-center">
              <div className="w-14 h-14 rounded-full bg-amber-100 flex items-center justify-center mx-auto mb-4">
                <svg className="w-7 h-7 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                </svg>
              </div>
              <h4 className="font-semibold text-gray-900 mb-2">進度記錄</h4>
              <p className="text-sm text-gray-600">成員技能進度可視化、任務狀態管理、完成認證一覽無遺</p>
            </div>

            {/* 文檔簽批 */}
            <div className="bg-blue-50 rounded-2xl p-8 text-center">
              <div className="w-14 h-14 rounded-full bg-blue-100 flex items-center justify-center mx-auto mb-4">
                <svg className="w-7 h-7 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              <h4 className="font-semibold text-gray-900 mb-2">文檔簽批</h4>
              <p className="text-sm text-gray-600">線上提交申請、領袖審閱批核、電子簽名存檔，流程透明可追溯</p>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-gray-400 py-8 text-center text-sm">
        <p>© {new Date().getFullYear()} 澳門童軍第一旅深資童軍團執行委員會</p>
      </footer>
    </div>
  )
}

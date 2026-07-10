export default function DashboardLoading() {
  return (
    <div className="min-h-screen flex shell-bg">
      <div className="w-64 glass-sidebar animate-pulse" />
      <div className="flex-1 p-8">
        <div className="h-8 w-48 bg-gray-200 dark:bg-slate-700 rounded mb-6 animate-pulse" />
        <div className="grid grid-cols-4 gap-4 mb-8">
          {[1,2,3,4].map(i => (
            <div key={i} className="glass-card rounded-xl p-5 h-24 animate-pulse" />
          ))}
        </div>
        <div className="grid grid-cols-2 gap-6">
          <div className="glass-card rounded-xl p-5 h-64 animate-pulse" />
          <div className="glass-card rounded-xl p-5 h-64 animate-pulse" />
        </div>
      </div>
    </div>
  )
}

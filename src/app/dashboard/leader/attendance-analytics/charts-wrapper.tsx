'use client'

import dynamic from 'next/dynamic'

const AttendanceCharts = dynamic(() => import('./charts'), {
  loading: () => (
    <div className="space-y-6">
      <div className="grid grid-cols-4 gap-3">
        {[1,2,3,4].map(i => <div key={i} className="glass-card rounded-xl p-5 h-24 animate-pulse" />)}
      </div>
      <div className="grid grid-cols-2 gap-6">
        {[1,2,3,4].map(i => <div key={i} className="glass-card rounded-xl p-5 h-64 animate-pulse" />)}
      </div>
    </div>
  ),
  ssr: false,
})

export default function ChartsWrapper(props: any) {
  return <AttendanceCharts {...props} />
}

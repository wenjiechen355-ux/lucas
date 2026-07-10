'use client'

import {
  Chart as ChartJS,
  CategoryScale, LinearScale, PointElement, LineElement,
  BarElement, ArcElement, RadialLinearScale,
  Title, Tooltip, Legend, Filler,
} from 'chart.js'
import { Line, Bar, Doughnut } from 'react-chartjs-2'

ChartJS.register(
  CategoryScale, LinearScale, PointElement, LineElement,
  BarElement, ArcElement, RadialLinearScale,
  Title, Tooltip, Legend, Filler
)

interface EventData {
  id: string; title: string; event_date: string
  event_type: string; total: number; present: number
  excused: number; absent: number; rate: number
}

interface Props {
  totalEvents: number; avgRate: number; monthRate: number; latestRate: number
  maxRate: number; minRate: number
  totalPresent: number; totalExcused: number; totalAbsent: number
  eventData: EventData[]
  categoryData: { name: string; avgRate: number; count: number }[]
  heatmapData: { month: string; avgRate: number; count: number }[]
}

const colors = {
  emerald: '#059669', green: '#10b981', amber: '#f59e0b',
  red: '#ef4444', blue: '#3b82f6', purple: '#8b5cf6',
  slate: '#64748b', gray: '#94a3b8',
}

export default function AttendanceCharts(p: Props) {
  // ③ 趋势折线图
  const lineData = {
    labels: p.eventData.map(e => new Date(e.event_date).toLocaleDateString('zh-HK', { month: 'short', day: 'numeric' })),
    datasets: [{
      label: '出勤率 %',
      data: p.eventData.map(e => e.rate),
      borderColor: colors.emerald,
      backgroundColor: 'rgba(5,150,105,0.1)',
      fill: true,
      tension: 0.3,
      pointRadius: 5,
      pointHoverRadius: 8,
      pointBackgroundColor: p.eventData.map(e => e.rate < 60 ? colors.red : e.rate >= 90 ? colors.emerald : colors.amber),
    }, {
      label: '平均線',
      data: Array(p.eventData.length).fill(p.avgRate),
      borderColor: colors.slate,
      borderDash: [6, 4],
      borderWidth: 1.5,
      pointRadius: 0,
      fill: false,
    }],
  }

  const lineOptions = {
    responsive: true,
    plugins: {
      legend: { display: true, position: 'bottom' as const, labels: { usePointStyle: true, boxWidth: 8 } },
      tooltip: { callbacks: { label: (c: any) => `出勤率: ${c.raw}%` } },
    },
    scales: {
      y: { min: 0, max: 100, ticks: { callback: (v: any) => v + '%' } },
    },
  }

  // ④ 分类柱状图
  const barData = {
    labels: p.categoryData.map(c => c.name),
    datasets: [{
      label: '平均出勤率 %',
      data: p.categoryData.map(c => c.avgRate),
      backgroundColor: p.categoryData.map((_, i) =>
        ['rgba(5,150,105,0.7)', 'rgba(59,130,246,0.7)', 'rgba(139,92,246,0.7)', 'rgba(245,158,11,0.7)', 'rgba(239,68,68,0.7)'][i % 5]
      ),
      borderRadius: 6,
      barThickness: 36,
    }],
  }

  const barOptions = {
    responsive: true,
    plugins: {
      legend: { display: false },
    },
    scales: {
      y: { min: 0, max: 100, ticks: { callback: (v: any) => v + '%' } },
    },
  }

  // ⑤ 环形图
  const donutData = {
    labels: ['實到', '請假', '缺席'],
    datasets: [{
      data: [p.totalPresent, p.totalExcused, p.totalAbsent],
      backgroundColor: [colors.emerald, colors.amber, colors.red],
      borderWidth: 0,
      hoverOffset: 6,
    }],
  }

  const donutOptions = {
    responsive: true,
    cutout: '65%',
    plugins: {
      legend: { position: 'bottom' as const, labels: { usePointStyle: true, boxWidth: 8, padding: 16 } },
      tooltip: {
        callbacks: {
          label: (c: any) => {
            const total = p.totalPresent + p.totalExcused + p.totalAbsent
            const pct = total > 0 ? Math.round((c.raw / total) * 100) : 0
            return `${c.label}: ${c.raw} 人 (${pct}%)`
          },
        },
      },
    },
  }

  // ⑥ 月度热力图（用水平柱状图模拟）
  const heatBarData = {
    labels: p.heatmapData.map(d => d.month),
    datasets: [{
      label: '出勤率 %',
      data: p.heatmapData.map(d => d.avgRate),
      backgroundColor: p.heatmapData.map(d =>
        d.avgRate >= 90 ? 'rgba(5,150,105,0.8)' :
        d.avgRate >= 75 ? 'rgba(16,185,129,0.7)' :
        d.avgRate >= 60 ? 'rgba(245,158,11,0.7)' :
        'rgba(239,68,68,0.7)'
      ),
      borderRadius: 4,
      barThickness: 28,
    }],
  }

  const heatBarOptions = {
    indexAxis: 'y' as const,
    responsive: true,
    plugins: { legend: { display: false } },
    scales: {
      x: { min: 0, max: 100, ticks: { callback: (v: any) => v + '%' } },
    },
  }

  return (
    <div className="space-y-6">
      {/* ① KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <KpiCard label="總活動場次" value={p.totalEvents} unit="場" color="gray" />
        <KpiCard label="整體平均出勤率" value={p.avgRate} unit="%" color="emerald" />
        <KpiCard label="本月出勤率" value={p.monthRate} unit="%" color="blue" />
        <KpiCard label="最新場次出勤率" value={p.latestRate} unit="%" color="purple" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* ② 趋势折线图 */}
        <div className="glass-card rounded-xl p-5">
          <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">近10場出勤率走勢</h3>
          <Line data={lineData} options={lineOptions} />
          <p className="text-xs text-gray-400 mt-3 text-center">
            最高 {p.maxRate}% · 最低 {p.minRate}% · 平均 {p.avgRate}%
          </p>
        </div>

        {/* ③ 分类柱状图 */}
        <div className="glass-card rounded-xl p-5">
          <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">按活動類型對比</h3>
          <Bar data={barData} options={barOptions} />
          <div className="flex gap-4 justify-center mt-3 text-xs text-gray-400">
            {p.categoryData.map(c => (
              <span key={c.name}>{c.name}: {c.avgRate}% ({c.count}場)</span>
            ))}
          </div>
        </div>

        {/* ④ 环形图 + ⑤ 月度热力（水平柱） */}
        <div className="glass-card rounded-xl p-5">
          <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">出勤結構佔比</h3>
          <div className="max-w-xs mx-auto">
            <Doughnut data={donutData} options={donutOptions} />
          </div>
          <p className="text-xs text-gray-400 mt-3 text-center">
            總出席人次 {p.totalPresent + p.totalExcused + p.totalAbsent} · 實到 {p.totalPresent} · 請假 {p.totalExcused} · 缺席 {p.totalAbsent}
          </p>
        </div>

        <div className="glass-card rounded-xl p-5">
          <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">月度出勤熱力分佈</h3>
          <Bar data={heatBarData} options={heatBarOptions} />
          <div className="flex gap-2 justify-center mt-3 text-xs">
            <span className="flex items-center gap-1"><span className="w-3 h-3 rounded-sm bg-emerald-500 inline-block" /> 90%+</span>
            <span className="flex items-center gap-1"><span className="w-3 h-3 rounded-sm bg-green-400 inline-block" /> 75%+</span>
            <span className="flex items-center gap-1"><span className="w-3 h-3 rounded-sm bg-amber-400 inline-block" /> 60%+</span>
            <span className="flex items-center gap-1"><span className="w-3 h-3 rounded-sm bg-red-400 inline-block" /> &lt;60%</span>
          </div>
        </div>
      </div>

      {/* Anomaly alert */}
      {p.eventData.some(e => e.rate < 60) && (
        <div className="glass-card rounded-xl p-4 border-l-4 border-l-red-500">
          <p className="text-sm font-medium text-red-600 dark:text-red-400">⚠️ 異常預警：以下活動出勤率低於 60%</p>
          <div className="flex gap-2 mt-1 flex-wrap">
            {p.eventData.filter(e => e.rate < 60).map(e => (
              <span key={e.id} className="text-xs px-2 py-1 bg-red-50 dark:bg-red-900/30 text-red-700 dark:text-red-400 rounded">
                {e.title}: {e.rate}%
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

function KpiCard({ label, value, unit, color }: { label: string; value: number; unit: string; color: string }) {
  const colorMap: Record<string, string> = {
    emerald: 'bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600',
    blue: 'bg-blue-50 dark:bg-blue-900/20 text-blue-600',
    purple: 'bg-purple-50 dark:bg-purple-900/20 text-purple-600',
    gray: 'bg-gray-50 dark:bg-gray-900/20 text-gray-600 dark:text-gray-400',
  }
  return (
    <div className="glass-card rounded-xl p-4 text-center">
      <p className="text-xs text-gray-400 mb-1">{label}</p>
      <p className={`text-2xl font-bold ${colorMap[color]}`}>
        {value}<span className="text-sm font-normal ml-0.5">{unit}</span>
      </p>
    </div>
  )
}

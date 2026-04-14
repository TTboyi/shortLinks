import React from 'react'
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts'
import type { GroupStats } from '../types/api'

type Period = '7日' | '30日'

interface AccessTrendChartProps {
  stats: GroupStats | null
  loading: boolean
  period: Period
  onPeriodChange: (p: Period) => void
}

const AccessTrendChart: React.FC<AccessTrendChartProps> = ({
  stats,
  loading,
  period,
  onPeriodChange,
}) => {
  const chartData = (stats?.daily ?? []).map((d) => ({
    date: d.date.slice(5),
    访问次数: d.pv,
    访问人数: d.uv,
    访问IP数: d.uip,
  }))

  const totalPv = stats?.daily?.reduce((s, d) => s + d.pv, 0) ?? 0
  const totalUv = stats?.daily?.reduce((s, d) => s + d.uv, 0) ?? 0
  const totalUip = stats?.daily?.reduce((s, d) => s + d.uip, 0) ?? 0

  const maxVal = Math.max(
    ...(stats?.daily ?? []).flatMap((d) => [d.pv, d.uv, d.uip]),
    5
  )

  return (
    <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100 flex-1">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-semibold text-gray-700">访问趋势</h3>
        <div className="flex items-center rounded-lg border border-gray-200 overflow-hidden text-xs">
          {(['7日', '30日'] as Period[]).map((p) => (
            <button
              key={p}
              onClick={() => onPeriodChange(p)}
              className={`px-3 py-1.5 font-medium transition-colors ${
                period === p
                  ? 'bg-blue-500 text-white'
                  : 'text-gray-500 hover:bg-gray-50'
              }`}
            >
              {p}
            </button>
          ))}
        </div>
      </div>

      <div
        className={`flex items-center gap-5 mb-4 text-xs text-gray-500 transition-opacity ${
          loading ? 'opacity-50' : ''
        }`}
      >
        <span className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-full bg-blue-500 inline-block" />
          访问次数：{totalPv}
        </span>
        <span className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-full bg-purple-500 inline-block" />
          访问人数：{totalUv}
        </span>
        <span className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-full bg-pink-400 inline-block" />
          访问 IP 数：{totalUip}
        </span>
      </div>

      <ResponsiveContainer width="100%" height={220}>
        <LineChart data={chartData} margin={{ top: 5, right: 10, left: -20, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
          <XAxis
            dataKey="date"
            tick={{ fontSize: 10, fill: '#9ca3af' }}
            tickLine={false}
            axisLine={{ stroke: '#e5e7eb' }}
          />
          <YAxis
            tick={{ fontSize: 10, fill: '#9ca3af' }}
            tickLine={false}
            axisLine={false}
            domain={[0, maxVal]}
          />
          <Tooltip
            contentStyle={{
              borderRadius: '10px',
              border: '1px solid #e5e7eb',
              fontSize: 12,
              boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
            }}
          />
          <Line
            type="monotone"
            dataKey="访问次数"
            stroke="#3b82f6"
            strokeWidth={2}
            dot={{ r: 3, fill: '#3b82f6', strokeWidth: 0 }}
            activeDot={{ r: 5 }}
          />
          <Line
            type="monotone"
            dataKey="访问人数"
            stroke="#a855f7"
            strokeWidth={2}
            dot={{ r: 3, fill: '#a855f7', strokeWidth: 0 }}
            activeDot={{ r: 5 }}
          />
          <Line
            type="monotone"
            dataKey="访问IP数"
            stroke="#f472b6"
            strokeWidth={2}
            dot={{ r: 3, fill: '#f472b6', strokeWidth: 0 }}
            activeDot={{ r: 5 }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  )
}

export default AccessTrendChart

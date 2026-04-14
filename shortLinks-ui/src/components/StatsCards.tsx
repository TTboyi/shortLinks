import React from 'react'
import { Eye, Users, Monitor, TrendingUp, TrendingDown } from 'lucide-react'
import { useAuth } from '../contexts/AuthContext'
import type { GroupStats } from '../types/api'

interface StatsCardsProps {
  stats: GroupStats | null
  loading: boolean
}

interface StatCardProps {
  icon: React.ReactNode
  iconBg: string
  label: string
  value: number
  delta: number
}

const StatCard: React.FC<StatCardProps> = ({ icon, iconBg, label, value, delta }) => (
  <div className="flex flex-col gap-2">
    <div className="flex items-center gap-2">
      <div className={`w-7 h-7 rounded-full ${iconBg} flex items-center justify-center`}>
        {icon}
      </div>
      <span className="text-sm text-gray-500">{label}</span>
    </div>
    <div className="flex items-center gap-3">
      <span className="text-2xl font-bold text-gray-800">{value}</span>
      <span
        className={`flex items-center gap-0.5 text-xs font-medium ${
          delta >= 0 ? 'text-green-500' : 'text-red-400'
        }`}
      >
        {delta >= 0 ? <TrendingUp size={11} /> : <TrendingDown size={11} />}
        {delta >= 0 ? '+' : ''}
        {delta}
      </span>
    </div>
  </div>
)

const StatsCards: React.FC<StatsCardsProps> = ({ stats, loading }) => {
  const { username } = useAuth()

  const daily = stats?.daily ?? []
  const yesterday = daily[daily.length - 1]
  const dayBefore = daily[daily.length - 2]

  const pv = yesterday?.pv ?? 0
  const uv = yesterday?.uv ?? 0
  const uip = yesterday?.uip ?? 0
  const pvDelta = pv - (dayBefore?.pv ?? 0)
  const uvDelta = uv - (dayBefore?.uv ?? 0)
  const uipDelta = uip - (dayBefore?.uip ?? 0)

  const displayDate = yesterday?.date
    ? yesterday.date.slice(5).replace('-', ' 月 ') + ' 日'
    : '--'

  return (
    <div className="flex flex-row gap-4 w-full">
      <div className="w-1/3 bg-white rounded-2xl p-6 shadow-sm border border-gray-100 flex flex-col justify-between">
        <div>
          <p className="text-base font-semibold text-gray-800 mb-2">
            Hi，{username ?? '用户'}
          </p>
          <p className="text-sm text-gray-500">
            昨日创建短链：
            <span className="font-semibold text-blue-600 text-base">0</span> 条
          </p>
        </div>
      </div>

      <div
        className={`flex-1 bg-white rounded-2xl p-6 shadow-sm border border-gray-100 flex flex-col justify-between transition-opacity ${
          loading ? 'opacity-50' : ''
        }`}
      >
        <div className="flex items-center justify-around flex-1 mb-6">
          <StatCard
            icon={<Eye size={14} className="text-purple-500" />}
            iconBg="bg-purple-100"
            label="昨日访问次数"
            value={pv}
            delta={pvDelta}
          />
          <div className="w-px h-12 bg-gray-100" />
          <StatCard
            icon={<Users size={14} className="text-blue-500" />}
            iconBg="bg-blue-100"
            label="昨日访问人数"
            value={uv}
            delta={uvDelta}
          />
          <div className="w-px h-12 bg-gray-100" />
          <StatCard
            icon={<Monitor size={14} className="text-green-500" />}
            iconBg="bg-green-100"
            label="昨日访问 IP 数"
            value={uip}
            delta={uipDelta}
          />
        </div>

        <div className="flex items-center justify-end">
          <div className="flex items-center gap-2 text-xs text-gray-400 bg-gray-50 px-3 py-1.5 rounded-md">
            <div className="w-6 h-3 bg-gray-200 rounded-full flex items-center px-0.5">
              <div className="w-2 h-2 bg-white rounded-full shadow" />
            </div>
            <span>
              数据统计时间：{displayDate} 00:00-24:00 数据对比时间：前日
            </span>
          </div>
        </div>
      </div>
    </div>
  )
}

export default StatsCards

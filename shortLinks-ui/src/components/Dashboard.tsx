import React, { useState, useEffect } from 'react'
import StatsCards from './StatsCards'
import AccessTrendChart from './AccessTrendChart'
import { Top5Panel, DataInsightsPanel } from './InsightPanels'
import { getGroupStats } from '../api/stats'
import type { Group, GroupStats } from '../types/api'

type Period = '7日' | '30日'

function formatDate(d: Date): string {
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

function getDateRange(days: number): { startDate: string; endDate: string } {
  const today = new Date()
  const end = new Date(today)
  end.setDate(today.getDate() - 1)
  const start = new Date(end)
  start.setDate(end.getDate() - days + 1)
  return { startDate: formatDate(start), endDate: formatDate(end) }
}

interface DashboardProps {
  activeGroup: Group | null
}

const Dashboard: React.FC<DashboardProps> = ({ activeGroup }) => {
  const [period, setPeriod] = useState<Period>('7日')
  const [stats, setStats] = useState<GroupStats | null>(null)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (!activeGroup) return
    const days = period === '7日' ? 7 : 30
    const { startDate, endDate } = getDateRange(days)
    setLoading(true)
    getGroupStats({ gid: activeGroup.gid, startDate, endDate })
      .then(setStats)
      .catch(() => setStats(null))
      .finally(() => setLoading(false))
  }, [activeGroup, period])

  if (!activeGroup) {
    return (
      <div className="flex items-center justify-center h-64 text-gray-400 text-sm">
        请在左侧选择一个分组查看数据
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-5 max-w-[1400px]">
      <StatsCards stats={stats} loading={loading} />

      <div className="flex gap-5">
        <AccessTrendChart
          stats={stats}
          loading={loading}
          period={period}
          onPeriodChange={setPeriod}
        />
        <Top5Panel activeGroup={activeGroup} />
      </div>

      <DataInsightsPanel
        stats={stats}
        loading={loading}
        period={period}
        onPeriodChange={setPeriod}
      />
    </div>
  )
}

export default Dashboard

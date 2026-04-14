import React, { useState, useEffect } from 'react'
import { MapPin, Clock, Globe, Monitor } from 'lucide-react'
import { getLinks } from '../api/link'
import type { GroupStats, Group, ShortLink } from '../types/api'

type Period = '7日' | '30日'

// ─── Top5 Panel ───────────────────────────────────────────────────────────────

const EmptyIllustration: React.FC = () => (
  <div className="flex flex-col items-center justify-center h-48 gap-3">
    <svg width="100" height="100" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
      <circle cx="52" cy="58" r="28" fill="#EEF2FF" />
      <rect x="40" y="38" width="20" height="28" rx="4" fill="#c7d2fe" />
      <circle cx="50" cy="32" r="8" fill="#a5b4fc" />
      <rect x="52" y="42" width="10" height="16" rx="2" fill="#6366f1" />
      <rect x="54" y="45" width="6" height="8" rx="1" fill="#e0e7ff" />
      <circle cx="30" cy="45" r="2" fill="#c7d2fe" />
      <circle cx="75" cy="38" r="3" fill="#e0e7ff" />
      <circle cx="72" cy="52" r="1.5" fill="#c7d2fe" />
      <line x1="78" y1="34" x2="84" y2="28" stroke="#c7d2fe" strokeWidth="1.5" strokeLinecap="round" />
      <line x1="26" y1="40" x2="20" y2="35" stroke="#c7d2fe" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
    <span className="text-sm text-gray-400">暂无数据</span>
  </div>
)

interface Top5ItemProps {
  rank: number
  link: ShortLink
}

const Top5Item: React.FC<Top5ItemProps> = ({ rank, link }) => {
  const rankColors = ['text-yellow-500', 'text-gray-400', 'text-orange-400']
  const rankColor = rank <= 3 ? rankColors[rank - 1] : 'text-gray-300'

  return (
    <div className="flex items-center gap-3 py-2">
      <span className={`w-5 text-sm font-bold text-center ${rankColor}`}>{rank}</span>
      {link.favicon ? (
        <img
          src={link.favicon}
          alt=""
          className="w-5 h-5 rounded object-cover flex-shrink-0"
          onError={(e) => { (e.target as HTMLImageElement).style.display = 'none' }}
        />
      ) : (
        <div className="w-5 h-5 rounded bg-gray-100 flex-shrink-0" />
      )}
      <div className="flex-1 min-w-0">
        <p className="text-xs text-blue-500 truncate">{link.fullShortUrl}</p>
        <p className="text-xs text-gray-400 truncate">{link.originUrl}</p>
      </div>
      <span className="text-xs font-medium text-gray-600 flex-shrink-0">
        {link.totalPv} PV
      </span>
    </div>
  )
}

interface Top5PanelProps {
  activeGroup: Group
}

export const Top5Panel: React.FC<Top5PanelProps> = ({ activeGroup }) => {
  const [links, setLinks] = useState<ShortLink[]>([])
  const [loading, setLoading] = useState(false)
  const [period, setPeriod] = useState<Period>('7日')

  useEffect(() => {
    setLoading(true)
    getLinks({ gid: activeGroup.gid, current: 1, size: 5, orderTag: 'totalPv' })
      .then((data) => setLinks(data.records))
      .catch(() => setLinks([]))
      .finally(() => setLoading(false))
  }, [activeGroup.gid, period])

  return (
    <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100 w-[380px] shrink-0">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-semibold text-gray-700">短链访问 Top5</h3>
        <div className="flex items-center rounded-lg border border-gray-200 overflow-hidden text-xs">
          {(['7日', '30日'] as Period[]).map((p) => (
            <button
              key={p}
              onClick={() => setPeriod(p)}
              className={`px-3 py-1.5 font-medium transition-colors ${
                period === p ? 'bg-blue-500 text-white' : 'text-gray-500 hover:bg-gray-50'
              }`}
            >
              {p}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-48 text-gray-300 text-sm">
          加载中...
        </div>
      ) : links.length === 0 ? (
        <EmptyIllustration />
      ) : (
        <div className="divide-y divide-gray-50">
          {links.map((link, i) => (
            <Top5Item key={link.id} rank={i + 1} link={link} />
          ))}
        </div>
      )}
    </div>
  )
}

// ─── Data Insights Panel ──────────────────────────────────────────────────────

interface InsightItemProps {
  icon: React.ReactNode
  label: string
  value: string
}

const InsightItem: React.FC<InsightItemProps> = ({ icon, label, value }) => (
  <div className="flex flex-col items-center gap-2 flex-1">
    <div className="w-10 h-10 rounded-xl bg-gray-50 flex items-center justify-center text-gray-400">
      {icon}
    </div>
    <span className="text-lg font-semibold text-gray-700">{value}</span>
    <span className="text-xs text-gray-400 text-center">{label}</span>
  </div>
)

interface DataInsightsPanelProps {
  stats: GroupStats | null
  loading: boolean
  period: Period
  onPeriodChange: (p: Period) => void
}

export const DataInsightsPanel: React.FC<DataInsightsPanelProps> = ({
  stats,
  loading,
  period,
  onPeriodChange,
}) => {
  const topLocale = stats?.localeCnStats?.[0]?.locale ?? '-'
  const topBrowser = stats?.browserStats?.[0]?.browser ?? '-'
  const topOs = stats?.osStats?.[0]?.os ?? '-'

  const topHour = (() => {
    const hours = stats?.hourStats
    if (!hours || hours.length === 0) return '-'
    const maxIdx = hours.indexOf(Math.max(...hours))
    return `${String(maxIdx).padStart(2, '0')}:00`
  })()

  return (
    <div className={`bg-white rounded-2xl p-5 shadow-sm border border-gray-100 transition-opacity ${loading ? 'opacity-50' : ''}`}>
      <div className="flex items-center justify-between mb-5">
        <h3 className="text-sm font-semibold text-gray-700">数据洞察</h3>
        <div className="flex items-center rounded-lg border border-gray-200 overflow-hidden text-xs">
          {(['7日', '30日'] as Period[]).map((p) => (
            <button
              key={p}
              onClick={() => onPeriodChange(p)}
              className={`px-3 py-1.5 font-medium transition-colors ${
                period === p ? 'bg-blue-500 text-white' : 'text-gray-500 hover:bg-gray-50'
              }`}
            >
              {p}
            </button>
          ))}
        </div>
      </div>

      <div className="flex items-start gap-4 divide-x divide-gray-100">
        <InsightItem
          icon={<MapPin size={18} />}
          label="访问最多的地区"
          value={topLocale}
        />
        <div className="pl-4 flex-1">
          <InsightItem
            icon={<Clock size={18} />}
            label="最常访问时间段"
            value={topHour}
          />
        </div>
        <div className="pl-4 flex-1">
          <InsightItem
            icon={<Globe size={18} />}
            label="最常访问浏览器"
            value={topBrowser}
          />
        </div>
        <div className="pl-4 flex-1">
          <InsightItem
            icon={<Monitor size={18} />}
            label="最常访问操作系统"
            value={topOs}
          />
        </div>
      </div>
    </div>
  )
}

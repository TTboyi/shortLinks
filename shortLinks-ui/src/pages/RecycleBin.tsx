import React, { useState, useEffect, useCallback } from 'react'
import { RotateCcw, Trash2 } from 'lucide-react'
import { getRecycleBinLinks, recoverLink, removeLink } from '../api/recycleBin'
import type { RecycleBinLink } from '../types/api'

const PAGE_SIZE = 10

interface PaginationProps {
  current: number
  total: number
  size: number
  onChange: (page: number) => void
}

const Pagination: React.FC<PaginationProps> = ({ current, total, size, onChange }) => {
  const pages = Math.ceil(total / size)
  if (pages <= 1) return null

  return (
    <div className="flex items-center justify-between px-1 mt-4">
      <span className="text-xs text-gray-400">共 {total} 条</span>
      <div className="flex items-center gap-1">
        <button
          onClick={() => onChange(current - 1)}
          disabled={current === 1}
          className="px-3 py-1.5 text-xs text-gray-500 border border-gray-200 rounded-lg hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed"
        >
          上一页
        </button>
        <span className="px-3 py-1.5 text-xs text-blue-600 font-medium">
          {current} / {pages}
        </span>
        <button
          onClick={() => onChange(current + 1)}
          disabled={current >= pages}
          className="px-3 py-1.5 text-xs text-gray-500 border border-gray-200 rounded-lg hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed"
        >
          下一页
        </button>
      </div>
    </div>
  )
}

const RecycleBin: React.FC = () => {
  const [links, setLinks] = useState<RecycleBinLink[]>([])
  const [total, setTotal] = useState(0)
  const [current, setCurrent] = useState(1)
  const [loading, setLoading] = useState(false)

  const fetchLinks = useCallback(async (page: number) => {
    setLoading(true)
    try {
      const data = await getRecycleBinLinks({ current: page, size: PAGE_SIZE })
      setLinks(data.records)
      setTotal(data.total)
    } catch {
      setLinks([])
      setTotal(0)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchLinks(1)
  }, [fetchLinks])

  const handlePageChange = (page: number) => {
    setCurrent(page)
    fetchLinks(page)
  }

  const handleRecover = async (link: RecycleBinLink) => {
    if (!confirm('确认恢复该短链接？')) return
    try {
      await recoverLink(link.gid, link.fullShortUrl)
      fetchLinks(current)
    } catch {
      // silent
    }
  }

  const handleRemove = async (link: RecycleBinLink) => {
    if (!confirm('确认永久删除该短链接？此操作不可撤销。')) return
    try {
      await removeLink(link.gid, link.fullShortUrl)
      fetchLinks(current)
    } catch {
      // silent
    }
  }

  return (
    <div className="max-w-[1400px]">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-sm font-semibold text-gray-700">
          回收站
          <span className="ml-2 text-xs font-normal text-gray-400">共 {total} 条</span>
        </h2>
      </div>

      <div
        className={`bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden transition-opacity ${
          loading ? 'opacity-60' : ''
        }`}
      >
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-100 text-xs text-gray-400 bg-gray-50">
              <th className="text-left px-5 py-3 font-medium">短链接</th>
              <th className="text-left px-4 py-3 font-medium">原始链接</th>
              <th className="text-left px-4 py-3 font-medium">描述</th>
              <th className="text-left px-4 py-3 font-medium">所属分组</th>
              <th className="text-left px-4 py-3 font-medium">有效期</th>
              <th className="text-left px-4 py-3 font-medium">创建时间</th>
              <th className="text-center px-4 py-3 font-medium">操作</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {links.length === 0 ? (
              <tr>
                <td colSpan={7} className="text-center py-16 text-gray-400 text-sm">
                  {loading ? '加载中...' : '回收站为空'}
                </td>
              </tr>
            ) : (
              links.map((link) => (
                <tr key={link.id} className="hover:bg-gray-50 transition-colors">
                  {/* Short URL */}
                  <td className="px-5 py-3">
                    <div className="flex items-center gap-2">
                      {link.favicon ? (
                        <img
                          src={link.favicon}
                          alt=""
                          className="w-4 h-4 rounded object-cover flex-shrink-0"
                          onError={(e) => {
                            ;(e.target as HTMLImageElement).style.display = 'none'
                          }}
                        />
                      ) : (
                        <div className="w-4 h-4 rounded bg-gray-100 flex-shrink-0" />
                      )}
                      <span className="text-xs text-gray-500">{link.fullShortUrl}</span>
                    </div>
                  </td>

                  {/* Origin URL */}
                  <td className="px-4 py-3 max-w-[200px]">
                    <p
                      className="text-xs text-gray-600 truncate"
                      title={link.originUrl}
                    >
                      {link.originUrl}
                    </p>
                  </td>

                  {/* Description */}
                  <td className="px-4 py-3 max-w-[140px]">
                    <p className="text-xs text-gray-500 truncate">
                      {link.describe || '-'}
                    </p>
                  </td>

                  {/* Group */}
                  <td className="px-4 py-3">
                    <span className="text-xs text-gray-400">{link.gid}</span>
                  </td>

                  {/* Valid Date */}
                  <td className="px-4 py-3">
                    <span className="text-xs text-gray-500">
                      {link.validDateType === 0
                        ? '永久'
                        : link.validDate?.slice(0, 10) ?? '-'}
                    </span>
                  </td>

                  {/* Create Time */}
                  <td className="px-4 py-3">
                    <span className="text-xs text-gray-400">
                      {link.createTime?.slice(0, 10) ?? '-'}
                    </span>
                  </td>

                  {/* Actions */}
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-center gap-2">
                      <button
                        onClick={() => handleRecover(link)}
                        className="p-1.5 text-gray-400 hover:text-green-500 hover:bg-green-50 rounded-lg transition-colors"
                        title="恢复"
                      >
                        <RotateCcw size={14} />
                      </button>
                      <button
                        onClick={() => handleRemove(link)}
                        className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                        title="永久删除"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <Pagination
        current={current}
        total={total}
        size={PAGE_SIZE}
        onChange={handlePageChange}
      />
    </div>
  )
}

export default RecycleBin

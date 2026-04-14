import React, { useState, useEffect, useCallback } from 'react'
import { Plus, Pencil, Trash2, ExternalLink, RefreshCw } from 'lucide-react'
import { getLinks, createLink, updateLink, getWebTitle } from '../api/link'
import { moveToRecycleBin } from '../api/recycleBin'
import { getGroups } from '../api/group'
import type { Group, ShortLink, CreateLinkParams, UpdateLinkParams } from '../types/api'

interface LinksPageProps {
  activeGroup: Group | null
  activeTab: 'normal' | 'api'
  searchKeyword: string
}

type ModalMode = 'create' | 'edit'

interface LinkFormState {
  originUrl: string
  describe: string
  gid: string
  validDateType: 0 | 1
  validDate: string
}

const defaultForm = (gid: string): LinkFormState => ({
  originUrl: '',
  describe: '',
  gid,
  validDateType: 0,
  validDate: '',
})

// ─── Modal ────────────────────────────────────────────────────────────────────

interface LinkModalProps {
  mode: ModalMode
  form: LinkFormState
  groups: Group[]
  submitting: boolean
  onFormChange: (f: LinkFormState) => void
  onFetchTitle: () => void
  fetchingTitle: boolean
  onSubmit: () => void
  onClose: () => void
}

const LinkModal: React.FC<LinkModalProps> = ({
  mode,
  form,
  groups,
  submitting,
  onFormChange,
  onFetchTitle,
  fetchingTitle,
  onSubmit,
  onClose,
}) => {
  const set = (patch: Partial<LinkFormState>) =>
    onFormChange({ ...form, ...patch })

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div
        className="absolute inset-0 bg-black/30 backdrop-blur-sm"
        onClick={onClose}
      />
      <div className="relative bg-white rounded-2xl shadow-xl border border-gray-100 w-full max-w-lg mx-4 p-6">
        <h2 className="text-base font-semibold text-gray-800 mb-5">
          {mode === 'create' ? '新建短链接' : '编辑短链接'}
        </h2>

        <div className="flex flex-col gap-4">
          {/* Original URL */}
          <div>
            <label className="block text-sm text-gray-600 mb-1.5">原始链接</label>
            <div className="flex gap-2">
              <input
                type="url"
                value={form.originUrl}
                onChange={(e) => set({ originUrl: e.target.value })}
                placeholder="https://example.com"
                className="flex-1 px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-400"
              />
              <button
                type="button"
                onClick={onFetchTitle}
                disabled={fetchingTitle || !form.originUrl}
                className="px-3 py-2 text-xs text-blue-500 border border-blue-200 rounded-lg hover:bg-blue-50 transition-colors disabled:opacity-40 flex items-center gap-1"
              >
                <RefreshCw size={12} className={fetchingTitle ? 'animate-spin' : ''} />
                获取标题
              </button>
            </div>
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm text-gray-600 mb-1.5">描述</label>
            <input
              type="text"
              value={form.describe}
              onChange={(e) => set({ describe: e.target.value })}
              placeholder="请输入描述"
              className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-400"
            />
          </div>

          {/* Group */}
          <div>
            <label className="block text-sm text-gray-600 mb-1.5">所属分组</label>
            <select
              value={form.gid}
              onChange={(e) => set({ gid: e.target.value })}
              className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-400 bg-white"
            >
              {groups.map((g) => (
                <option key={g.gid} value={g.gid}>
                  {g.name}
                </option>
              ))}
            </select>
          </div>

          {/* Valid Date Type */}
          <div>
            <label className="block text-sm text-gray-600 mb-1.5">有效期</label>
            <div className="flex gap-3">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  checked={form.validDateType === 0}
                  onChange={() => set({ validDateType: 0, validDate: '' })}
                  className="text-blue-500"
                />
                <span className="text-sm text-gray-700">永久有效</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  checked={form.validDateType === 1}
                  onChange={() => set({ validDateType: 1 })}
                  className="text-blue-500"
                />
                <span className="text-sm text-gray-700">自定义</span>
              </label>
            </div>
            {form.validDateType === 1 && (
              <input
                type="datetime-local"
                value={form.validDate}
                onChange={(e) => set({ validDate: e.target.value })}
                className="mt-2 w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-400"
              />
            )}
          </div>
        </div>

        {/* Actions */}
        <div className="flex justify-end gap-3 mt-6">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm text-gray-500 hover:text-gray-700 transition-colors"
          >
            取消
          </button>
          <button
            onClick={onSubmit}
            disabled={submitting}
            className="px-5 py-2 bg-blue-500 hover:bg-blue-600 text-white text-sm font-medium rounded-lg transition-colors disabled:opacity-60"
          >
            {submitting ? '提交中...' : mode === 'create' ? '创建' : '保存'}
          </button>
        </div>
      </div>
    </div>
  )
}

// ─── Pagination ───────────────────────────────────────────────────────────────

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

// ─── Main Page ────────────────────────────────────────────────────────────────

const PAGE_SIZE = 10
const DEFAULT_DOMAIN = 'nurl.ink'

const LinksPage: React.FC<LinksPageProps> = ({
  activeGroup,
  activeTab,
  searchKeyword,
}) => {
  const [links, setLinks] = useState<ShortLink[]>([])
  const [total, setTotal] = useState(0)
  const [current, setCurrent] = useState(1)
  const [loading, setLoading] = useState(false)

  const [groups, setGroups] = useState<Group[]>([])
  const [modalMode, setModalMode] = useState<ModalMode | null>(null)
  const [editingLink, setEditingLink] = useState<ShortLink | null>(null)
  const [form, setForm] = useState<LinkFormState>(defaultForm(''))
  const [submitting, setSubmitting] = useState(false)
  const [fetchingTitle, setFetchingTitle] = useState(false)

  const fetchLinks = useCallback(async (page: number) => {
    if (!activeGroup) return
    setLoading(true)
    try {
      const data = await getLinks({ gid: activeGroup.gid, current: page, size: PAGE_SIZE })
      setLinks(data.records)
      setTotal(data.total)
    } catch {
      setLinks([])
      setTotal(0)
    } finally {
      setLoading(false)
    }
  }, [activeGroup])

  useEffect(() => {
    setCurrent(1)
    fetchLinks(1)
  }, [fetchLinks])

  useEffect(() => {
    getGroups().then(setGroups).catch(() => setGroups([]))
  }, [])

  const handlePageChange = (page: number) => {
    setCurrent(page)
    fetchLinks(page)
  }

  const openCreate = () => {
    setForm(defaultForm(activeGroup?.gid ?? ''))
    setEditingLink(null)
    setModalMode('create')
  }

  const openEdit = (link: ShortLink) => {
    setForm({
      originUrl: link.originUrl,
      describe: link.describe,
      gid: link.gid,
      validDateType: link.validDateType,
      validDate: link.validDate
        ? link.validDate.replace(' ', 'T').slice(0, 16)
        : '',
    })
    setEditingLink(link)
    setModalMode('edit')
  }

  const handleFetchTitle = async () => {
    if (!form.originUrl) return
    setFetchingTitle(true)
    try {
      const title = await getWebTitle(form.originUrl)
      setForm((f) => ({ ...f, describe: title }))
    } catch {
      // silent
    } finally {
      setFetchingTitle(false)
    }
  }

  const handleSubmit = async () => {
    if (!form.originUrl.trim()) return
    setSubmitting(true)
    try {
      const validDate =
        form.validDateType === 1 && form.validDate
          ? form.validDate.replace('T', ' ') + ':00'
          : null

      if (modalMode === 'create') {
        const params: CreateLinkParams = {
          domain: DEFAULT_DOMAIN,
          originUrl: form.originUrl.trim(),
          gid: form.gid,
          createdType: 1,
          validDateType: form.validDateType,
          validDate,
          describe: form.describe.trim(),
        }
        await createLink(params)
      } else if (editingLink) {
        const params: UpdateLinkParams = {
          fullShortUrl: editingLink.fullShortUrl,
          domain: editingLink.domain,
          originUrl: form.originUrl.trim(),
          gid: form.gid,
          createdType: 1,
          validDateType: form.validDateType,
          validDate,
          describe: form.describe.trim(),
        }
        await updateLink(params)
      }

      setModalMode(null)
      fetchLinks(current)
    } catch {
      // silent
    } finally {
      setSubmitting(false)
    }
  }

  const handleMoveToRecycle = async (link: ShortLink) => {
    if (!confirm('确认将该短链接移至回收站？')) return
    try {
      await moveToRecycleBin(link.gid, link.fullShortUrl)
      fetchLinks(current)
    } catch {
      // silent
    }
  }

  // Client-side filter by keyword and tab
  const filteredLinks = links.filter((link) => {
    const kw = searchKeyword.toLowerCase()
    const matchKw =
      !kw ||
      link.originUrl.toLowerCase().includes(kw) ||
      link.fullShortUrl.toLowerCase().includes(kw) ||
      link.describe.toLowerCase().includes(kw)
    // createdType not in response; tab is display-only for now
    const matchTab = activeTab === 'normal' ? true : true
    return matchKw && matchTab
  })

  if (!activeGroup) {
    return (
      <div className="flex items-center justify-center h-64 text-gray-400 text-sm">
        请在左侧选择一个分组
      </div>
    )
  }

  return (
    <div className="max-w-[1400px]">
      {/* Header row */}
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-sm font-semibold text-gray-700">
          {activeGroup.name}
          <span className="ml-2 text-xs font-normal text-gray-400">共 {total} 条</span>
        </h2>
        <button
          onClick={openCreate}
          className="flex items-center gap-1.5 px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white text-sm font-medium rounded-lg transition-colors"
        >
          <Plus size={15} />
          新建短链接
        </button>
      </div>

      {/* Table */}
      <div className={`bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden transition-opacity ${loading ? 'opacity-60' : ''}`}>
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-100 text-xs text-gray-400 bg-gray-50">
              <th className="text-left px-5 py-3 font-medium">短链接</th>
              <th className="text-left px-4 py-3 font-medium">原始链接</th>
              <th className="text-left px-4 py-3 font-medium">描述</th>
              <th className="text-left px-4 py-3 font-medium">有效期</th>
              <th className="text-center px-4 py-3 font-medium">今日 PV/UV/IP</th>
              <th className="text-center px-4 py-3 font-medium">总计 PV/UV/IP</th>
              <th className="text-center px-4 py-3 font-medium">操作</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {filteredLinks.length === 0 ? (
              <tr>
                <td colSpan={7} className="text-center py-16 text-gray-400 text-sm">
                  {loading ? '加载中...' : '暂无数据'}
                </td>
              </tr>
            ) : (
              filteredLinks.map((link) => (
                <tr key={link.id} className="hover:bg-gray-50 transition-colors">
                  {/* Short URL */}
                  <td className="px-5 py-3">
                    <div className="flex items-center gap-2">
                      {link.favicon ? (
                        <img
                          src={link.favicon}
                          alt=""
                          className="w-4 h-4 rounded object-cover flex-shrink-0"
                          onError={(e) => { (e.target as HTMLImageElement).style.display = 'none' }}
                        />
                      ) : (
                        <div className="w-4 h-4 rounded bg-gray-100 flex-shrink-0" />
                      )}
                      <a
                        href={`https://${link.fullShortUrl}`}
                        target="_blank"
                        rel="noreferrer"
                        className="text-blue-500 hover:underline flex items-center gap-1 text-xs"
                      >
                        {link.fullShortUrl}
                        <ExternalLink size={11} />
                      </a>
                    </div>
                  </td>

                  {/* Origin URL */}
                  <td className="px-4 py-3 max-w-[200px]">
                    <p className="text-xs text-gray-600 truncate" title={link.originUrl}>
                      {link.originUrl}
                    </p>
                  </td>

                  {/* Description */}
                  <td className="px-4 py-3 max-w-[140px]">
                    <p className="text-xs text-gray-500 truncate">{link.describe || '-'}</p>
                  </td>

                  {/* Valid Date */}
                  <td className="px-4 py-3">
                    <span className="text-xs text-gray-500">
                      {link.validDateType === 0
                        ? '永久'
                        : link.validDate?.slice(0, 10) ?? '-'}
                    </span>
                  </td>

                  {/* Today stats */}
                  <td className="px-4 py-3 text-center">
                    <span className="text-xs text-gray-600">
                      {link.todayPv} / {link.todayUv} / {link.todayUip}
                    </span>
                  </td>

                  {/* Total stats */}
                  <td className="px-4 py-3 text-center">
                    <span className="text-xs text-gray-600">
                      {link.totalPv} / {link.totalUv} / {link.totalUip}
                    </span>
                  </td>

                  {/* Actions */}
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-center gap-2">
                      <button
                        onClick={() => openEdit(link)}
                        className="p-1.5 text-gray-400 hover:text-blue-500 hover:bg-blue-50 rounded-lg transition-colors"
                        title="编辑"
                      >
                        <Pencil size={14} />
                      </button>
                      <button
                        onClick={() => handleMoveToRecycle(link)}
                        className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                        title="移至回收站"
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

      {modalMode && (
        <LinkModal
          mode={modalMode}
          form={form}
          groups={groups}
          submitting={submitting}
          onFormChange={setForm}
          onFetchTitle={handleFetchTitle}
          fetchingTitle={fetchingTitle}
          onSubmit={handleSubmit}
          onClose={() => setModalMode(null)}
        />
      )}
    </div>
  )
}

export default LinksPage

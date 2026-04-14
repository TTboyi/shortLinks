import React, { useState, useEffect } from 'react'
import {
  LayoutDashboard,
  Link2,
  Settings,
  Trash2,
  ChevronRight,
  Plus,
  Pencil,
  Trash,
  Check,
  X,
} from 'lucide-react'
import { getGroups, createGroup, updateGroup, deleteGroup } from '../api/group'
import type { Group } from '../types/api'
import UserSettingsModal from './UserSettingsModal'

type View = 'dashboard' | 'links' | 'recycle'

interface SidebarProps {
  activeView: View
  activeGroup: Group | null
  onViewChange: (view: View) => void
  onGroupSelect: (group: Group) => void
}

const Sidebar: React.FC<SidebarProps> = ({
  activeView,
  activeGroup,
  onViewChange,
  onGroupSelect,
}) => {
  const [groups, setGroups] = useState<Group[]>([])
  const [addingGroup, setAddingGroup] = useState(false)
  const [newGroupName, setNewGroupName] = useState('')
  const [editingGid, setEditingGid] = useState<string | null>(null)
  const [editingName, setEditingName] = useState('')
  const [showSettings, setShowSettings] = useState(false)
  const [initialized, setInitialized] = useState(false)

  const fetchGroups = async () => {
    try {
      const data = await getGroups()
      setGroups(data)
      return data
    } catch {
      return []
    }
  }

  useEffect(() => {
    fetchGroups().then((data) => {
      if (!initialized && data.length > 0) {
        onGroupSelect(data[0])
        setInitialized(true)
      }
    })
  }, [])

  const handleAddGroup = async () => {
    if (!newGroupName.trim()) return
    try {
      await createGroup(newGroupName.trim())
      setNewGroupName('')
      setAddingGroup(false)
      await fetchGroups()
    } catch {
      // silent
    }
  }

  const handleUpdateGroup = async (gid: string) => {
    if (!editingName.trim()) return
    try {
      await updateGroup(gid, editingName.trim())
      setEditingGid(null)
      setEditingName('')
      await fetchGroups()
    } catch {
      setEditingGid(null)
    }
  }

  const handleDeleteGroup = async (gid: string) => {
    if (!confirm('确认删除该分组？')) return
    try {
      await deleteGroup(gid)
      await fetchGroups()
    } catch {
      // silent
    }
  }

  return (
    <>
      <aside className="w-[240px] bg-white border-r border-gray-100 flex flex-col h-full shadow-sm">
        {/* Logo */}
        <div className="flex items-center gap-2 px-5 py-4 border-b border-gray-100">
          <div className="w-8 h-8 bg-blue-500 rounded-lg flex items-center justify-center">
            <Link2 size={16} className="text-white" />
          </div>
          <span className="font-semibold text-gray-800 text-base">短链</span>
        </div>

        {/* Nav */}
        <nav className="flex-1 px-3 py-2 space-y-1 overflow-y-auto">
          {/* Project Settings */}
          <button
            onClick={() => setShowSettings(true)}
            className="w-full flex items-center justify-between px-3 py-2 text-sm text-gray-500 hover:bg-gray-50 rounded-lg cursor-pointer transition-colors"
          >
            <div className="flex items-center gap-2">
              <div className="w-5 h-5 rounded-full bg-blue-100 flex items-center justify-center">
                <Settings size={11} className="text-blue-500" />
              </div>
              <span>用户设置</span>
            </div>
            <ChevronRight size={14} className="text-gray-400" />
          </button>

          {/* Dashboard */}
          <div
            onClick={() => onViewChange('dashboard')}
            className={`flex items-center gap-2 px-3 py-2 text-sm font-medium rounded-lg cursor-pointer ${
              activeView === 'dashboard'
                ? 'text-blue-600 bg-blue-50'
                : 'text-gray-600 hover:bg-gray-50'
            }`}
          >
            <LayoutDashboard
              size={16}
              className={activeView === 'dashboard' ? 'text-blue-500' : 'text-gray-400'}
            />
            <span>数据看板</span>
          </div>

          {/* Groups */}
          <div className="mt-3">
            <div className="flex items-center justify-between px-3 py-1.5">
              <span className="text-xs font-semibold text-gray-400 uppercase tracking-wide">
                短链分组
              </span>
              <button
                onClick={() => setAddingGroup(true)}
                className="w-5 h-5 rounded flex items-center justify-center text-gray-400 hover:text-blue-500 hover:bg-blue-50 transition-colors"
              >
                <Plus size={14} />
              </button>
            </div>

            {/* New group input */}
            {addingGroup && (
              <div className="flex items-center gap-1 px-3 py-1.5">
                <input
                  autoFocus
                  type="text"
                  value={newGroupName}
                  onChange={(e) => setNewGroupName(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') handleAddGroup()
                    if (e.key === 'Escape') {
                      setAddingGroup(false)
                      setNewGroupName('')
                    }
                  }}
                  placeholder="分组名称"
                  className="flex-1 text-sm px-2 py-1 border border-gray-200 rounded focus:outline-none focus:border-blue-400"
                />
                <button
                  onClick={handleAddGroup}
                  className="text-blue-500 hover:text-blue-600 p-0.5"
                >
                  <Check size={14} />
                </button>
                <button
                  onClick={() => {
                    setAddingGroup(false)
                    setNewGroupName('')
                  }}
                  className="text-gray-400 hover:text-gray-600 p-0.5"
                >
                  <X size={14} />
                </button>
              </div>
            )}

            {/* Group list */}
            {groups.map((group) => (
              <div
                key={group.gid}
                className={`group/item flex items-center justify-between px-3 py-2 text-sm rounded-lg cursor-pointer ${
                  activeView === 'links' && activeGroup?.gid === group.gid
                    ? 'bg-blue-50 text-blue-600'
                    : 'text-gray-600 hover:bg-gray-50'
                }`}
              >
                {editingGid === group.gid ? (
                  <div className="flex items-center gap-1 flex-1">
                    <input
                      autoFocus
                      type="text"
                      value={editingName}
                      onChange={(e) => setEditingName(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') handleUpdateGroup(group.gid)
                        if (e.key === 'Escape') {
                          setEditingGid(null)
                          setEditingName('')
                        }
                      }}
                      className="flex-1 text-sm px-2 py-0.5 border border-gray-200 rounded focus:outline-none focus:border-blue-400"
                    />
                    <button
                      onClick={() => handleUpdateGroup(group.gid)}
                      className="text-blue-500 p-0.5"
                    >
                      <Check size={13} />
                    </button>
                    <button
                      onClick={() => {
                        setEditingGid(null)
                        setEditingName('')
                      }}
                      className="text-gray-400 p-0.5"
                    >
                      <X size={13} />
                    </button>
                  </div>
                ) : (
                  <>
                    <span
                      onClick={() => onGroupSelect(group)}
                      className="flex-1 truncate"
                    >
                      {group.name}
                    </span>
                    <div className="flex items-center gap-1">
                      {(group.linkCount ?? 0) > 0 && (
                        <span className="text-xs text-gray-400 group-hover/item:hidden">
                          {group.linkCount}
                        </span>
                      )}
                      <div className="hidden group-hover/item:flex items-center gap-0.5">
                        <button
                          onClick={(e) => {
                            e.stopPropagation()
                            setEditingGid(group.gid)
                            setEditingName(group.name)
                          }}
                          className="text-gray-400 hover:text-blue-500 p-0.5 rounded"
                        >
                          <Pencil size={12} />
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation()
                            handleDeleteGroup(group.gid)
                          }}
                          className="text-gray-400 hover:text-red-500 p-0.5 rounded"
                        >
                          <Trash size={12} />
                        </button>
                      </div>
                    </div>
                  </>
                )}
              </div>
            ))}
          </div>
        </nav>

        {/* Bottom */}
        <div className="border-t border-gray-100 px-3 py-3">
          <button
            onClick={() => onViewChange('recycle')}
            className={`w-full flex items-center gap-3 px-3 py-2 text-sm rounded-lg transition-colors ${
              activeView === 'recycle'
                ? 'bg-red-50 text-red-500'
                : 'text-red-400 hover:bg-red-50'
            }`}
          >
            <Trash2 size={16} />
            <span>回收站</span>
          </button>
        </div>
      </aside>

      {showSettings && <UserSettingsModal onClose={() => setShowSettings(false)} />}
    </>
  )
}

export default Sidebar

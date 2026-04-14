import React from 'react'
import { Search, LogOut } from 'lucide-react'
import { useAuth } from '../contexts/AuthContext'
import { logoutUser } from '../api/user'

type View = 'dashboard' | 'links' | 'recycle'

interface HeaderProps {
  activeTab: 'normal' | 'api'
  onTabChange: (tab: 'normal' | 'api') => void
  activeView: View
  searchKeyword: string
  onSearchChange: (keyword: string) => void
}

const Header: React.FC<HeaderProps> = ({
  activeTab,
  onTabChange,
  activeView,
  searchKeyword,
  onSearchChange,
}) => {
  const { username, logout } = useAuth()

  const handleLogout = async () => {
    try {
      await logoutUser()
    } catch {
      // proceed regardless
    }
    logout()
  }

  return (
    <header className="bg-white border-b border-gray-100 px-6 py-0 flex items-center justify-between h-14 shadow-sm">
      {/* Left */}
      <div className="flex items-center gap-6">
        {activeView === 'links' && (
          <>
            <nav className="flex items-center gap-0">
              <button
                onClick={() => onTabChange('normal')}
                className={`px-4 h-14 text-sm font-medium border-b-2 transition-colors ${
                  activeTab === 'normal'
                    ? 'text-blue-600 border-blue-500'
                    : 'text-gray-500 border-transparent hover:text-gray-700'
                }`}
              >
                普通短链
              </button>
              <button
                onClick={() => onTabChange('api')}
                className={`px-4 h-14 text-sm font-medium border-b-2 transition-colors ${
                  activeTab === 'api'
                    ? 'text-blue-600 border-blue-500'
                    : 'text-gray-500 border-transparent hover:text-gray-700'
                }`}
              >
                API短链
              </button>
            </nav>

            <div className="relative">
              <Search
                size={14}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
              />
              <input
                type="text"
                value={searchKeyword}
                onChange={(e) => onSearchChange(e.target.value)}
                placeholder="请输入关键词搜索"
                className="pl-9 pr-4 py-1.5 text-sm bg-gray-50 border border-gray-200 rounded-lg w-52 focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-400 transition-all placeholder-gray-400"
              />
            </div>
          </>
        )}
      </div>

      {/* Right */}
      <div className="flex items-center gap-4">
        {username && (
          <span className="text-sm text-gray-600">
            Hi,{' '}
            <span className="font-medium text-gray-800">{username}</span>
          </span>
        )}
        <button
          onClick={handleLogout}
          className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-red-500 transition-colors"
        >
          <LogOut size={15} />
          <span>退出</span>
        </button>
      </div>
    </header>
  )
}

export default Header

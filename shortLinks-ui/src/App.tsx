import React, { useState } from 'react'
import { useAuth } from './contexts/AuthContext'
import Sidebar from './components/Sidebar'
import Header from './components/Header'
import Dashboard from './components/Dashboard'
import Login from './pages/Login'
import LinksPage from './pages/LinksPage'
import RecycleBin from './pages/RecycleBin'
import type { Group } from './types/api'

type View = 'dashboard' | 'links' | 'recycle'

const App: React.FC = () => {
  const { isLoggedIn, checking } = useAuth()
  const [activeTab, setActiveTab] = useState<'normal' | 'api'>('normal')
  const [activeView, setActiveView] = useState<View>('dashboard')
  const [activeGroup, setActiveGroup] = useState<Group | null>(null)
  const [searchKeyword, setSearchKeyword] = useState('')

  if (checking) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <span className="text-gray-400 text-sm">加载中...</span>
      </div>
    )
  }

  if (!isLoggedIn) {
    return <Login />
  }

  const handleGroupSelect = (group: Group) => {
    setActiveGroup(group)
    setActiveView('links')
  }

  return (
    <div className="flex h-screen bg-gray-50 font-sans overflow-hidden">
      <Sidebar
        activeView={activeView}
        activeGroup={activeGroup}
        onViewChange={setActiveView}
        onGroupSelect={handleGroupSelect}
      />
      <div className="flex flex-col flex-1 overflow-hidden">
        <Header
          activeTab={activeTab}
          onTabChange={setActiveTab}
          activeView={activeView}
          searchKeyword={searchKeyword}
          onSearchChange={setSearchKeyword}
        />
        <main className="flex-1 overflow-y-auto p-6">
          {activeView === 'dashboard' && (
            <Dashboard activeGroup={activeGroup} />
          )}
          {activeView === 'links' && (
            <LinksPage
              activeGroup={activeGroup}
              activeTab={activeTab}
              searchKeyword={searchKeyword}
            />
          )}
          {activeView === 'recycle' && <RecycleBin />}
        </main>
      </div>
    </div>
  )
}

export default App

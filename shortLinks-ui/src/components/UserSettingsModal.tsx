import React, { useState, useEffect } from 'react'
import { X, User, Lock, Mail, Phone, Save } from 'lucide-react'
import { getUserInfo, updateUser } from '../api/user'
import { useAuth } from '../contexts/AuthContext'

interface UserSettingsModalProps {
  onClose: () => void
}

const UserSettingsModal: React.FC<UserSettingsModalProps> = ({ onClose }) => {
  const { username } = useAuth()
  const [realName, setRealName] = useState('')
  const [phone, setPhone] = useState('')
  const [mail, setMail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [fetching, setFetching] = useState(true)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  useEffect(() => {
    if (!username) return
    getUserInfo(username)
      .then((info) => {
        setRealName(info.realName || '')
        setPhone(info.phone || '')
        setMail(info.mail || '')
      })
      .catch(() => {})
      .finally(() => setFetching(false))
  }, [username])

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!username) return
    if (password && password.length < 6) return setError('新密码至少 6 位')
    if (password && password !== confirmPassword) return setError('两次密码不一致')
    if (mail && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(mail)) return setError('邮箱格式不正确')

    setLoading(true)
    setError('')
    setSuccess('')
    try {
      await updateUser({
        username,
        password: password || undefined as unknown as string,
        realName,
        phone,
        mail,
      })
      setSuccess('保存成功')
      setPassword('')
      setConfirmPassword('')
    } catch (err) {
      setError(err instanceof Error ? err.message : '保存失败')
    } finally {
      setLoading(false)
    }
  }

  const inputCls =
    'flex-1 px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-400 transition-all'

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/30 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white rounded-2xl shadow-xl border border-gray-100 w-full max-w-md mx-4 p-6">
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-base font-semibold text-gray-800">用户设置</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 p-1">
            <X size={18} />
          </button>
        </div>

        {fetching ? (
          <div className="text-center py-8 text-gray-400 text-sm">加载中...</div>
        ) : (
          <form onSubmit={handleSave} className="flex flex-col gap-4">
            {/* Username (read-only) */}
            <div className="flex items-center gap-3">
              <div className="w-8 flex-shrink-0 flex justify-center">
                <User size={16} className="text-gray-400" />
              </div>
              <div className="flex-1">
                <label className="block text-xs text-gray-500 mb-1">用户名</label>
                <div className="px-3 py-2 text-sm bg-gray-50 border border-gray-200 rounded-lg text-gray-500">
                  {username}
                </div>
              </div>
            </div>

            {/* Real name */}
            <div className="flex items-center gap-3">
              <div className="w-8 flex-shrink-0 flex justify-center">
                <User size={16} className="text-gray-400" />
              </div>
              <div className="flex-1">
                <label className="block text-xs text-gray-500 mb-1">昵称</label>
                <input
                  type="text"
                  value={realName}
                  onChange={(e) => setRealName(e.target.value)}
                  placeholder="请输入昵称"
                  className={inputCls}
                />
              </div>
            </div>

            {/* Email */}
            <div className="flex items-center gap-3">
              <div className="w-8 flex-shrink-0 flex justify-center">
                <Mail size={16} className="text-gray-400" />
              </div>
              <div className="flex-1">
                <label className="block text-xs text-gray-500 mb-1">邮箱</label>
                <input
                  type="email"
                  value={mail}
                  onChange={(e) => setMail(e.target.value)}
                  placeholder="请输入邮箱"
                  className={inputCls}
                />
              </div>
            </div>

            {/* Phone */}
            <div className="flex items-center gap-3">
              <div className="w-8 flex-shrink-0 flex justify-center">
                <Phone size={16} className="text-gray-400" />
              </div>
              <div className="flex-1">
                <label className="block text-xs text-gray-500 mb-1">手机号</label>
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="请输入手机号"
                  className={inputCls}
                />
              </div>
            </div>

            {/* Password divider */}
            <div className="border-t border-gray-100 pt-3">
              <p className="text-xs text-gray-400 mb-3">修改密码（不填则不修改）</p>
            </div>

            {/* New password */}
            <div className="flex items-center gap-3">
              <div className="w-8 flex-shrink-0 flex justify-center">
                <Lock size={16} className="text-gray-400" />
              </div>
              <div className="flex-1">
                <label className="block text-xs text-gray-500 mb-1">新密码</label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="留空则不修改密码"
                  className={inputCls}
                  autoComplete="new-password"
                />
              </div>
            </div>

            {/* Confirm password */}
            <div className="flex items-center gap-3">
              <div className="w-8 flex-shrink-0 flex justify-center">
                <Lock size={16} className="text-gray-400" />
              </div>
              <div className="flex-1">
                <label className="block text-xs text-gray-500 mb-1">确认新密码</label>
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="再次输入新密码"
                  className={inputCls}
                  autoComplete="new-password"
                />
              </div>
            </div>

            {error && <p className="text-xs text-red-500 ml-11">{error}</p>}
            {success && <p className="text-xs text-green-500 ml-11">{success}</p>}

            <div className="flex justify-end gap-3 mt-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-sm text-gray-500 hover:text-gray-700 transition-colors"
              >
                取消
              </button>
              <button
                type="submit"
                disabled={loading}
                className="px-5 py-2 bg-blue-500 hover:bg-blue-600 text-white text-sm font-medium rounded-lg transition-colors disabled:opacity-60 flex items-center gap-1.5"
              >
                <Save size={14} />
                {loading ? '保存中...' : '保存'}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  )
}

export default UserSettingsModal

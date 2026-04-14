import React, { useState } from 'react'
import { Link2, Eye, EyeOff } from 'lucide-react'
import { loginUser, registerUser } from '../api/user'
import { useAuth } from '../contexts/AuthContext'

type Mode = 'login' | 'register'

const Login: React.FC = () => {
  const { login } = useAuth()
  const [mode, setMode] = useState<Mode>('login')

  // Login fields
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)

  // Register extra fields
  const [realName, setRealName] = useState('')
  const [phone, setPhone] = useState('')
  const [mail, setMail] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')

  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [loading, setLoading] = useState(false)

  const switchMode = (m: Mode) => {
    setMode(m)
    setError('')
    setSuccess('')
  }

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!username.trim() || !password.trim()) {
      setError('请输入用户名和密码')
      return
    }
    setLoading(true)
    setError('')
    try {
      const result = await loginUser(username.trim(), password)
      login(result.token, username.trim())
    } catch (err) {
      setError(err instanceof Error ? err.message : '登录失败，请重试')
    } finally {
      setLoading(false)
    }
  }

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!username.trim()) return setError('用户名不能为空')
    if (username.trim().length < 4) return setError('用户名至少 4 位')
    if (!password) return setError('密码不能为空')
    if (password.length < 6) return setError('密码至少 6 位')
    if (password !== confirmPassword) return setError('两次密码不一致')
    if (mail && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(mail)) return setError('邮箱格式不正确')

    setLoading(true)
    setError('')
    try {
      await registerUser({
        username: username.trim(),
        password,
        realName: realName.trim(),
        phone: phone.trim(),
        mail: mail.trim(),
      })
      setSuccess('注册成功！请登录')
      setPassword('')
      setConfirmPassword('')
      setRealName('')
      setPhone('')
      setMail('')
      setTimeout(() => switchMode('login'), 1200)
    } catch (err) {
      setError(err instanceof Error ? err.message : '注册失败，请重试')
    } finally {
      setLoading(false)
    }
  }

  const inputCls =
    'w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-400 transition-all'

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-gray-100 flex items-center justify-center">
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8 w-full max-w-sm">
        {/* Logo */}
        <div className="flex items-center justify-center gap-2 mb-6">
          <div className="w-9 h-9 bg-blue-500 rounded-xl flex items-center justify-center">
            <Link2 size={18} className="text-white" />
          </div>
          <span className="text-xl font-semibold text-gray-800">短链管理</span>
        </div>

        {/* Mode tabs */}
        <div className="flex mb-6 border border-gray-200 rounded-xl overflow-hidden">
          <button
            type="button"
            onClick={() => switchMode('login')}
            className={`flex-1 py-2 text-sm font-medium transition-colors ${
              mode === 'login'
                ? 'bg-blue-500 text-white'
                : 'text-gray-500 hover:bg-gray-50'
            }`}
          >
            登录
          </button>
          <button
            type="button"
            onClick={() => switchMode('register')}
            className={`flex-1 py-2 text-sm font-medium transition-colors ${
              mode === 'register'
                ? 'bg-blue-500 text-white'
                : 'text-gray-500 hover:bg-gray-50'
            }`}
          >
            注册
          </button>
        </div>

        {/* Login Form */}
        {mode === 'login' && (
          <form onSubmit={handleLogin} className="flex flex-col gap-4">
            <div>
              <label className="block text-sm text-gray-600 mb-1.5">用户名</label>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="请输入用户名"
                className={inputCls}
                autoComplete="username"
              />
            </div>
            <div>
              <label className="block text-sm text-gray-600 mb-1.5">密码</label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="请输入密码"
                  className={`${inputCls} pr-10`}
                  autoComplete="current-password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
                </button>
              </div>
            </div>

            {error && <p className="text-xs text-red-500">{error}</p>}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-blue-500 hover:bg-blue-600 text-white text-sm font-medium py-2.5 rounded-lg transition-colors disabled:opacity-60 mt-1"
            >
              {loading ? '登录中...' : '登录'}
            </button>
          </form>
        )}

        {/* Register Form */}
        {mode === 'register' && (
          <form onSubmit={handleRegister} className="flex flex-col gap-3.5">
            <div>
              <label className="block text-sm text-gray-600 mb-1.5">
                用户名 <span className="text-red-400">*</span>
              </label>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="4-20位字母数字"
                className={inputCls}
                autoComplete="username"
              />
            </div>
            <div>
              <label className="block text-sm text-gray-600 mb-1.5">
                密码 <span className="text-red-400">*</span>
              </label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="至少6位"
                  className={`${inputCls} pr-10`}
                  autoComplete="new-password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
                </button>
              </div>
            </div>
            <div>
              <label className="block text-sm text-gray-600 mb-1.5">
                确认密码 <span className="text-red-400">*</span>
              </label>
              <input
                type={showPassword ? 'text' : 'password'}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="再次输入密码"
                className={inputCls}
                autoComplete="new-password"
              />
            </div>
            <div>
              <label className="block text-sm text-gray-600 mb-1.5">昵称</label>
              <input
                type="text"
                value={realName}
                onChange={(e) => setRealName(e.target.value)}
                placeholder="选填"
                className={inputCls}
              />
            </div>
            <div>
              <label className="block text-sm text-gray-600 mb-1.5">邮箱</label>
              <input
                type="email"
                value={mail}
                onChange={(e) => setMail(e.target.value)}
                placeholder="选填"
                className={inputCls}
              />
            </div>
            <div>
              <label className="block text-sm text-gray-600 mb-1.5">手机号</label>
              <input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="选填"
                className={inputCls}
              />
            </div>

            {error && <p className="text-xs text-red-500">{error}</p>}
            {success && <p className="text-xs text-green-500">{success}</p>}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-blue-500 hover:bg-blue-600 text-white text-sm font-medium py-2.5 rounded-lg transition-colors disabled:opacity-60 mt-1"
            >
              {loading ? '注册中...' : '立即注册'}
            </button>
          </form>
        )}
      </div>
    </div>
  )
}

export default Login


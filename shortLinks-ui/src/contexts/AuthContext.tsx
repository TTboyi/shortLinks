import React, { createContext, useContext, useState, useEffect } from 'react'
import { checkLogin } from '../api/user'

type AuthContextType = {
  username: string | null
  isLoggedIn: boolean
  checking: boolean
  login: (token: string, username: string) => void
  logout: () => void
}

const AuthContext = createContext<AuthContextType | null>(null)

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [username, setUsername] = useState<string | null>(localStorage.getItem('username'))
  const [isLoggedIn, setIsLoggedIn] = useState(false)
  const [checking, setChecking] = useState(true)

  useEffect(() => {
    const token = localStorage.getItem('token')
    const storedUsername = localStorage.getItem('username')
    if (token && storedUsername) {
      checkLogin()
        .then(setIsLoggedIn)
        .finally(() => setChecking(false))
    } else {
      setChecking(false)
    }
  }, [])

  const login = (token: string, newUsername: string) => {
    localStorage.setItem('token', token)
    localStorage.setItem('username', newUsername)
    setUsername(newUsername)
    setIsLoggedIn(true)
  }

  const logout = () => {
    localStorage.removeItem('token')
    localStorage.removeItem('username')
    setUsername(null)
    setIsLoggedIn(false)
  }

  return (
    <AuthContext.Provider value={{ username, isLoggedIn, checking, login, logout }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth(): AuthContextType {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}

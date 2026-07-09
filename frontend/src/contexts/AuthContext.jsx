import { createContext, useContext, useState, useEffect, useCallback } from 'react'
import api from '../api/client'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [token, setToken]   = useState(() => localStorage.getItem('jp_token'))
  const [user,  setUser]    = useState(() => {
    try { return JSON.parse(localStorage.getItem('jp_user') || 'null') }
    catch { return null }
  })
  const [loading, setLoading] = useState(true)

  // Verify token on mount
  useEffect(() => {
    const verify = async () => {
      if (!token) { setLoading(false); return }
      try {
        const res = await api.get('/api/auth/me')
        setUser(res.data.user)
      } catch {
        // Token expired or invalid — clear it
        logout()
      } finally {
        setLoading(false)
      }
    }
    verify()
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  const login = useCallback(async (username, password) => {
    const res = await api.post('/api/auth/login', { username, password })
    const { token: newToken, username: uname } = res.data
    localStorage.setItem('jp_token', newToken)
    localStorage.setItem('jp_user', JSON.stringify({ username: uname }))
    setToken(newToken)
    setUser({ username: uname })
    return res.data
  }, [])

  const logout = useCallback(() => {
    localStorage.removeItem('jp_token')
    localStorage.removeItem('jp_user')
    setToken(null)
    setUser(null)
  }, [])

  return (
    <AuthContext.Provider value={{ token, user, loading, login, logout, isAuthenticated: !!token }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}

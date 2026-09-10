import { createContext, useContext, useState, useEffect } from 'react'
import { api } from '../lib/api'

const AuthContext = createContext(null)

function loadStoredUser() {
  try {
    const saved = localStorage.getItem('auth_user')
    return saved ? JSON.parse(saved) : null
  } catch {
    return null
  }
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(loadStoredUser)
  const [isLoading, setIsLoading] = useState(!loadStoredUser())

  useEffect(() => {
    // Nếu đã có token trong localStorage, xác thực lại với server
    const token = localStorage.getItem('auth_token')
    if (!token) {
      setIsLoading(false)
      return
    }
    api.get('/api/auth/me')
      .then((r) => {
        const userData = r.data.user || r.data
        setUser(userData)
        localStorage.setItem('auth_user', JSON.stringify(userData))
      })
      .catch(() => {
        localStorage.removeItem('auth_token')
        localStorage.removeItem('auth_user')
        setUser(null)
      })
      .finally(() => setIsLoading(false))
  }, [])

  const setAuth = (userData, token) => {
    setUser(userData)
    localStorage.setItem('auth_user', JSON.stringify(userData))
    if (token) localStorage.setItem('auth_token', token)
  }

  const logout = async () => {
    try { await api.post('/api/auth/logout') } catch {}
    localStorage.removeItem('auth_token')
    localStorage.removeItem('auth_user')
    setUser(null)
    window.location.href = '/login'
  }

  return (
    <AuthContext.Provider value={{ user, isLoading, logout, setAuth }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => useContext(AuthContext)

import React, { createContext, useContext, useEffect, useState } from 'react'
import axios from 'axios'

type User = { id: string; name: string; email: string; role?: string } | null

type AuthContextType = {
    user: User
    token: string | null
    login: (email: string, password: string) => Promise<void>
    logout: () => void
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
    const [user, setUser] = useState<User>(null)
    const [token, setToken] = useState<string | null>(() => localStorage.getItem('token'))

    useEffect(() => {
        if (token) {
            axios.defaults.headers.common['Authorization'] = `Bearer ${token}`
            localStorage.setItem('token', token)
            // fetch current user
            axios.get('/api/auth/me').then(r => setUser(r.data)).catch(() => { setUser(null); setToken(null); delete axios.defaults.headers.common['Authorization']; localStorage.removeItem('token') })
        } else {
            delete axios.defaults.headers.common['Authorization']
            localStorage.removeItem('token')
            setUser(null)
        }
    }, [token])

    async function login(email: string, password: string) {
        const res = await axios.post('/api/auth/login', { email, password })
        setToken(res.data.token)
        setUser(res.data.user)
    }

    function logout() {
        setToken(null)
        setUser(null)
    }

    return (
        <AuthContext.Provider value={{ user, token, login, logout }}>
            {children}
        </AuthContext.Provider>
    )
}

export function useAuth() {
    const ctx = useContext(AuthContext)
    if (!ctx) throw new Error('useAuth must be used within AuthProvider')
    return ctx
}

export default AuthContext

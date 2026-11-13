import React, { createContext, useContext, useEffect, useState } from 'react'
import axios from 'axios'

type User = { id: string; name: string; email: string; role?: string } | null

type AuthContextType = {
    user: User
    token: string | null
    login: () => void                          // redirects to GitHub
    completeLogin: (token: string) => void     // called by the callback page
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
            axios.get('/api/auth/me')
                .then(r => setUser(r.data))
                .catch(() => {
                    setUser(null)
                    setToken(null)
                    delete axios.defaults.headers.common['Authorization']
                    localStorage.removeItem('token')
                })
        } else {
            delete axios.defaults.headers.common['Authorization']
            localStorage.removeItem('token')
            setUser(null)
        }
    }, [token])

    function login() {
        const state = crypto.randomUUID()          // CSRF protection
        sessionStorage.setItem('oauth_state', state)

        const params = new URLSearchParams({
            client_id: import.meta.env.VITE_GITHUB_CLIENT_ID,
            redirect_uri: `${window.location.origin}/auth/github/callback`,
            // scope: 'read:user user:email',
            scope: 'user:email',
            state,
        })
        window.location.href = `https://github.com/login/oauth/authorize?${params}`
    }

    // Setting the token triggers the effect above, which fetches /api/auth/me
    function completeLogin(newToken: string) {
        setToken(newToken)
    }

    function logout() {
        setToken(null)
        setUser(null)
    }

    return (
        <AuthContext.Provider value={{ user, token, login, completeLogin, logout }}>
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
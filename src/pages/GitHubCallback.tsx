// src/pages/GitHubCallback.tsx
import { useEffect, useRef } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import axios from 'axios'
import { useAuth } from '../auth'

export default function GitHubCallback() {
    const [params] = useSearchParams()
    const navigate = useNavigate()
    const { completeLogin } = useAuth()
    const ran = useRef(false) // StrictMode runs effects twice; a GitHub code is single-use

    useEffect(() => {
        if (ran.current) return
        ran.current = true

        const code = params.get('code')
        const state = params.get('state')
        const expected = sessionStorage.getItem('oauth_state')
        sessionStorage.removeItem('oauth_state')

        if (!code || !state || state !== expected) {
            navigate('/login?error=state', { replace: true })
            return
        }

        axios
            .post('/api/auth/github', { code })
            .then((r) => {
                completeLogin(r.data.token)
                navigate('/', { replace: true })
            })
            .catch(() => navigate('/login?error=auth', { replace: true }))
    }, [params, navigate, completeLogin])

    return <p>Signing you in…</p>
}
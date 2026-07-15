import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../auth'

export default function Login() {
    const [email, setEmail] = useState('')
    const [password, setPassword] = useState('')
    const [error, setError] = useState<string | null>(null)
    const auth = useAuth()
    const navigate = useNavigate()

    async function submit(e: React.FormEvent) {
        e.preventDefault()
        try {
            await auth.login(email, password)
            navigate('/')
        } catch (err: any) {
            setError(err?.response?.data?.error || 'Login failed')
        }
    }

    return (
        <div className="max-w-md mx-auto mt-8">
            <h2 className="text-2xl font-semibold mb-4">Sign in</h2>
            <form onSubmit={submit} className="space-y-4">
                {error && <div className="text-red-600">{error}</div>}
                <input className="w-full p-2 border rounded" placeholder="Email" value={email} onChange={e => setEmail(e.target.value)} />
                <input className="w-full p-2 border rounded" type="password" placeholder="Password" value={password} onChange={e => setPassword(e.target.value)} />
                <div className="flex gap-2">
                    <button className="px-4 py-2 bg-slate-900 text-white rounded">Sign in</button>
                </div>
            </form>
        </div>
    )
}

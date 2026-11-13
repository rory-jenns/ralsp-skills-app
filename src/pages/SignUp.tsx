// pages/SignUp.tsx
import React, { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import axios from 'axios'
import { useAuth } from '../auth'

import GitHubSignInButton from '../components/GitHubSignInButton'

export default function SignUp() {
    const [name, setName] = useState('')
    const [email, setEmail] = useState('')
    const [password, setPassword] = useState('')
    const [confirm, setConfirm] = useState('')
    const [error, setError] = useState<string | null>(null)
    const [submitting, setSubmitting] = useState(false)
    const auth = useAuth()
    const navigate = useNavigate()

    async function submit(e: React.FormEvent) {
        e.preventDefault()
        setError(null)

        if (!name.trim()) return setError('Name is required')
        if (!email.trim()) return setError('Email is required')
        if (password.length < 8) return setError('Password must be at least 8 characters')
        if (password !== confirm) return setError('Passwords do not match')

        setSubmitting(true)
        try {
            await axios.post('/api/auth/register', {
                name: name.trim(),
                email: email.trim(),
                password,
            })
            // Sign in with the new account so the auth context stores the session
            await auth.login(email.trim(), password)
            navigate('/')
        } catch (err: any) {
            setError(err?.response?.data?.error || 'Sign up failed')
        } finally {
            setSubmitting(false)
        }
    }

    return (
        <div className="max-w-md mx-auto mt-8">
            <h2 className="text-2xl font-semibold mb-4">Create an account</h2>
            <form onSubmit={submit} className="space-y-4">
                {error && <div className="text-red-600">{error}</div>}
                <input
                    className="w-full p-2 border rounded"
                    placeholder="Name"
                    autoComplete="name"
                    value={name}
                    onChange={e => setName(e.target.value)}
                />
                <input
                    className="w-full p-2 border rounded"
                    placeholder="Email"
                    type="email"
                    autoComplete="email"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                />
                <input
                    className="w-full p-2 border rounded"
                    type="password"
                    placeholder="Password (at least 8 characters)"
                    autoComplete="new-password"
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                />
                <input
                    className="w-full p-2 border rounded"
                    type="password"
                    placeholder="Confirm password"
                    autoComplete="new-password"
                    value={confirm}
                    onChange={e => setConfirm(e.target.value)}
                />
                <div className="flex gap-2 items-center">
                    <button
                        type="submit"
                        disabled={submitting}
                        className="px-4 py-2 bg-slate-900 text-white rounded disabled:opacity-50"
                    >
                        {submitting ? 'Creating account…' : 'Sign up'}
                    </button>
                    <Link to="/login" className="text-sm text-slate-600 underline">
                        Already have an account?
                    </Link>
                </div>
                <div className="flex gap-2 items-center">
                    <GitHubSignInButton onClick={auth.login} />
                </div>
            </form>
        </div>
    )
}
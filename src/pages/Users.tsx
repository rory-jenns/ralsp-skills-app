import React, { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import axios from 'axios'
import { useAuth } from '../auth'
import Alert from '../components/Alert'

export default function Users() {
    const auth = useAuth()
    const [users, setUsers] = useState<any[]>([])
    const [teams, setTeams] = useState<any[]>([])
    const [name, setName] = useState('')
    const [email, setEmail] = useState('')
    const [teamId, setTeamId] = useState('')
    const [message, setMessage] = useState<string | null>(null)
    const [messageType, setMessageType] = useState<'error' | 'success' | 'info' | null>(null)

    useEffect(() => {
        axios.get('/api/users').then(res => setUsers(res.data))
        axios.get('/api/teams').then(res => setTeams(res.data))
    }, [])

    const createUser = async (event: React.FormEvent) => {
        event.preventDefault()
        try {
            const res = await axios.post('/api/users', { name, email, team_id: teamId })
            setUsers(prev => [...prev, res.data])
            setName('')
            setEmail('')
            setTeamId('')
            setMessage('Created user successfully.')
            setMessageType('success')
        } catch (error: any) {
            setMessage(error.response?.data?.error || 'Failed to create user.')
            setMessageType('error')
        }
    }

    return (
        <div className="space-y-8">
            <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
                <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                    <div>
                        <h2 className="text-3xl font-semibold text-slate-900">Users</h2>
                        <p className="mt-2 text-slate-600">Manage user profiles and assign team membership with ease.</p>
                    </div>
                </div>
            </div>

            <div className="grid gap-6 lg:grid-cols-[1fr_0.35fr]">
                <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm order-1 lg:order-1">
                    <h3 className="text-xl font-semibold text-slate-900">User directory</h3>
                    <div className="mt-6 space-y-4">
                        {users.length ? users.map(user => (
                            <div key={user.id} className="flex items-start justify-between">
                                <Link key={user.id} to={`/users/${user.id}`} className="block flex-1 overflow-hidden rounded-3xl border border-slate-200 bg-slate-50 p-5 transition hover:border-slate-300 hover:bg-white mr-3">
                                    <div className="flex items-center justify-between gap-3">
                                        <div>
                                            <div className="font-semibold text-slate-900">{user.name}</div>
                                            <div className="text-sm text-slate-500">{user.email}</div>
                                        </div>
                                        <div className="rounded-full bg-slate-100 px-3 py-1 text-xs uppercase tracking-[0.2em] text-slate-600">{teams.find(team => team.id === user.team_id)?.name || 'No team'}</div>
                                    </div>
                                </Link>
                                {(auth.user && (auth.user.role === 'admin' || auth.user.id === user.id)) && (
                                    <button onClick={async (e) => {
                                        e.preventDefault()
                                        if (!confirm(`Delete user "${user.name}"? This cannot be undone.`)) return
                                        try {
                                            await axios.delete(`/api/users/${user.id}`)
                                            setUsers(prev => prev.filter(u => u.id !== user.id))
                                            setMessage('User deleted')
                                            setMessageType('success')
                                        } catch (err: any) {
                                            setMessage(err.response?.data?.error || 'Failed to delete user')
                                            setMessageType('error')
                                        }
                                    }} className="inline-flex items-center rounded-full bg-transparent p-2 text-red-600 hover:bg-red-50">
                                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6M1 7h22M10 3h4l1 4H9l1-4z" />
                                        </svg>
                                    </button>
                                )}
                            </div>
                        )) : <div className="text-slate-500">No users yet.</div>}
                    </div>
                </div>

                <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm order-2 lg:order-2">
                    <h3 className="text-xl font-semibold text-slate-900">Create new user</h3>
                    {auth.user?.role === 'admin' ? (
                        <form onSubmit={createUser} className="mt-6 space-y-5">
                            <label className="block">
                                <span className="text-sm font-medium text-slate-700">Name</span>
                                <input
                                    value={name}
                                    onChange={e => setName(e.target.value)}
                                    className="mt-2 block w-full rounded-3xl border border-slate-300 bg-slate-50 px-4 py-3 text-slate-900 focus:border-slate-900 focus:outline-none"
                                    required
                                />
                            </label>
                            <label className="block">
                                <span className="text-sm font-medium text-slate-700">Email</span>
                                <input
                                    value={email}
                                    onChange={e => setEmail(e.target.value)}
                                    type="email"
                                    className="mt-2 block w-full rounded-3xl border border-slate-300 bg-slate-50 px-4 py-3 text-slate-900 focus:border-slate-900 focus:outline-none"
                                    required
                                />
                            </label>
                            <label className="block">
                                <span className="text-sm font-medium text-slate-700">Team</span>
                                <select
                                    value={teamId}
                                    onChange={e => setTeamId(e.target.value)}
                                    className="mt-2 block w-full rounded-3xl border border-slate-300 bg-slate-50 px-4 py-3 text-slate-900 focus:border-slate-900 focus:outline-none"
                                >
                                    <option value="">Unassigned</option>
                                    {teams.map(team => (
                                        <option key={team.id} value={team.id}>{team.name}</option>
                                    ))}
                                </select>
                            </label>
                            <button type="submit" className="rounded-full bg-slate-900 px-6 py-3 text-sm font-semibold text-white transition hover:bg-slate-800">Create user</button>
                            {message && <Alert type={messageType ?? 'info'} message={message} />}
                        </form>
                    ) : (
                        <div className="mt-6 text-sm text-slate-600">Only admins can create users.</div>
                    )}
                </div>
            </div>
        </div>
    )
}

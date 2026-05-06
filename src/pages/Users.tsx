import React, { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import axios from 'axios'

export default function Users() {
    const [users, setUsers] = useState<any[]>([])
    const [teams, setTeams] = useState<any[]>([])
    const [name, setName] = useState('')
    const [email, setEmail] = useState('')
    const [teamId, setTeamId] = useState('')
    const [message, setMessage] = useState<string | null>(null)

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
        } catch (error: any) {
            setMessage(error.response?.data?.error || 'Failed to create user.')
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

            <div className="grid gap-6 lg:grid-cols-[1.25fr_1fr]">
                <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
                    <h3 className="text-xl font-semibold text-slate-900">Create new user</h3>
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
                        {message && <div className="rounded-3xl bg-slate-50 p-4 text-sm text-slate-700">{message}</div>}
                    </form>
                </div>

                <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
                    <h3 className="text-xl font-semibold text-slate-900">User directory</h3>
                    <div className="mt-6 space-y-4">
                        {users.length ? users.map(user => (
                            <Link key={user.id} to={`/users/${user.id}`} className="block overflow-hidden rounded-3xl border border-slate-200 bg-slate-50 p-5 transition hover:border-slate-300 hover:bg-white">
                                <div className="flex items-center justify-between gap-3">
                                    <div>
                                        <div className="font-semibold text-slate-900">{user.name}</div>
                                        <div className="text-sm text-slate-500">{user.email}</div>
                                    </div>
                                    <div className="rounded-full bg-slate-100 px-3 py-1 text-xs uppercase tracking-[0.2em] text-slate-600">{teams.find(team => team.id === user.team_id)?.name || 'No team'}</div>
                                </div>
                            </Link>
                        )) : <div className="text-slate-500">No users yet.</div>}
                    </div>
                </div>
            </div>
        </div>
    )
}

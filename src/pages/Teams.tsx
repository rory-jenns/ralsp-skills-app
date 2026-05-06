import React, { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import axios from 'axios'

export default function Teams() {
    const [teams, setTeams] = useState<any[]>([])
    const [message, setMessage] = useState<string | null>(null)
    const [name, setName] = useState('')
    const [description, setDescription] = useState('')

    useEffect(() => {
        axios.get('/api/teams').then(res => setTeams(res.data))
    }, [])

    const createTeam = async (event: React.FormEvent) => {
        event.preventDefault()
        try {
            const res = await axios.post('/api/teams', { name, description })
            setTeams(prev => [...prev, res.data])
            setName('')
            setDescription('')
            setMessage('Team created successfully.')
        } catch (error: any) {
            setMessage(error.response?.data?.error || 'Failed to create team.')
        }
    }

    return (
        <div className="space-y-8">
            <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
                <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                    <div>
                        <h2 className="text-3xl font-semibold text-slate-900">Teams</h2>
                        <p className="mt-2 text-slate-600">Create and manage teams, view membership, and track owned projects.</p>
                    </div>
                </div>
            </div>

            <div className="grid gap-6 lg:grid-cols-[1.5fr_1fr]">
                <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
                    <h3 className="text-xl font-semibold text-slate-900">Team directory</h3>
                    <div className="mt-6 grid gap-4">
                        {teams.length ? teams.map(team => (
                            <Link key={team.id} to={`/teams/${team.id}`} className="block overflow-hidden rounded-3xl border border-slate-200 bg-slate-50 p-5 transition hover:border-slate-300 hover:bg-white">
                                <div className="flex items-center justify-between gap-3">
                                    <div>
                                        <div className="font-semibold text-slate-900">{team.name}</div>
                                        <div className="text-sm text-slate-500">{team.description}</div>
                                    </div>
                                    <div className="rounded-full bg-slate-100 px-3 py-1 text-xs uppercase tracking-[0.2em] text-slate-600">View</div>
                                </div>
                            </Link>
                        )) : <div className="text-slate-500">No teams yet.</div>}
                    </div>
                </div>
                <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
                    <h3 className="text-xl font-semibold text-slate-900">Create new team</h3>
                    <form onSubmit={createTeam} className="mt-6 space-y-5">
                        <label className="block">
                            <span className="text-sm font-medium text-slate-700">Team name</span>
                            <input
                                value={name}
                                onChange={e => setName(e.target.value)}
                                className="mt-2 block w-full rounded-3xl border border-slate-300 bg-slate-50 px-4 py-3 text-slate-900 focus:border-slate-900 focus:outline-none"
                                required
                            />
                        </label>
                        <label className="block">
                            <span className="text-sm font-medium text-slate-700">Description</span>
                            <textarea
                                value={description}
                                onChange={e => setDescription(e.target.value)}
                                className="mt-2 block w-full rounded-3xl border border-slate-300 bg-slate-50 px-4 py-3 text-slate-900 focus:border-slate-900 focus:outline-none"
                                rows={4}
                            />
                        </label>
                        <button type="submit" className="rounded-full bg-slate-900 px-6 py-3 text-sm font-semibold text-white transition hover:bg-slate-800">Create team</button>
                        {message && <div className="rounded-3xl bg-slate-50 p-4 text-sm text-slate-700">{message}</div>}
                    </form>
                </div>
            </div>
        </div>
    )
}

import React, { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import axios from 'axios'
import { useAuth } from '../../auth'
import Alert from '../../components/Alert'

export default function Teams() {
    const [teams, setTeams] = useState<any[]>([])
    const [message, setMessage] = useState<string | null>(null)
    const [messageType, setMessageType] = useState<'error' | 'success' | 'info' | null>(null)
    const [name, setName] = useState('')
    const [description, setDescription] = useState('')
    const auth = useAuth()

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
            setMessageType('success')
        } catch (error: any) {
            setMessage(error.response?.data?.error || 'Failed to create team.')
            setMessageType('error')
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
                            <div key={team.id} className="flex items-start justify-between">
                                <Link to={`/teams/${team.id}`} className="block flex-1 overflow-hidden rounded-3xl border border-slate-200 bg-slate-50 p-5 transition hover:border-slate-300 hover:bg-white mr-3">
                                    <div className="flex items-center justify-between gap-3">
                                        <div>
                                            <div className="font-semibold text-slate-900">{team.name}</div>
                                            <div className="text-sm text-slate-500">{team.description}</div>
                                        </div>
                                        <div className="rounded-full bg-slate-100 px-3 py-1 text-xs uppercase tracking-[0.2em] text-slate-600">View</div>
                                    </div>
                                </Link>
                                {(auth.user && (auth.user.role === 'admin' || auth.user.id === team.owner_id)) && (
                                    <button onClick={async (e) => {
                                        e.preventDefault()
                                        if (!confirm(`Delete team "${team.name}"? This cannot be undone.`)) return
                                        try {
                                            await axios.delete(`/api/teams/${team.id}`)
                                            setTeams(prev => prev.filter(t => t.id !== team.id))
                                            setMessage('Team deleted')
                                            setMessageType('success')
                                        } catch (err: any) {
                                            setMessage(err.response?.data?.error || 'Failed to delete team')
                                            setMessageType('error')
                                        }
                                    }} className="inline-flex items-center rounded-full bg-transparent p-2 text-red-600 hover:bg-red-50">
                                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6M1 7h22M10 3h4l1 4H9l1-4z" />
                                        </svg>
                                    </button>
                                )}
                            </div>
                        )) : <div className="text-slate-500">No teams yet.</div>}
                    </div>
                </div>
                <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
                    <h3 className="text-xl font-semibold text-slate-900">Create new team</h3>
                    {auth.user ? (
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
                            {message && <Alert type={messageType ?? 'info'} message={message} />}
                        </form>
                    ) : (
                        <div className="mt-6 text-sm text-slate-600">Sign in to create teams.</div>
                    )}
                </div>
            </div>
        </div>
    )
}

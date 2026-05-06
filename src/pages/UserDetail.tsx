import React, { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import axios from 'axios'

const LEVELS = ['beginner', 'intermediate', 'advanced', 'expert']

export default function UserDetail() {
    const { id } = useParams()
    const navigate = useNavigate()
    const [user, setUser] = useState<any>(null)
    const [teams, setTeams] = useState<any[]>([])
    const [skills, setSkills] = useState<any[]>([])
    const [userSkills, setUserSkills] = useState<any[]>([])
    const [selectedSkill, setSelectedSkill] = useState('')
    const [selectedLevel, setSelectedLevel] = useState('intermediate')
    const [message, setMessage] = useState<string | null>(null)

    useEffect(() => {
        if (!id) return
        Promise.all([
            axios.get(`/api/users/${id}`),
            axios.get('/api/teams'),
            axios.get('/api/skills'),
            axios.get(`/api/users/${id}/skills`)
        ]).then(([userRes, teamsRes, skillsRes, userSkillsRes]) => {
            setUser(userRes.data)
            setTeams(teamsRes.data)
            setSkills(skillsRes.data)
            setUserSkills(userSkillsRes.data)
            setSelectedSkill(skillsRes.data[0]?.id || '')
        })
    }, [id])

    const assignSkill = async (event: React.FormEvent) => {
        event.preventDefault()
        if (!id) return
        try {
            const res = await axios.post(`/api/users/${id}/skills`, { skill_id: selectedSkill, level: selectedLevel })
            setUserSkills(prev => [...prev, res.data])
            setMessage('Skill assigned successfully.')
        } catch (error: any) {
            setMessage(error.response?.data?.error || 'Failed to assign skill.')
        }
    }

    const updateProfile = async (field: string, value: string) => {
        if (!id || !user) return
        const updatedUser = { ...user, [field]: value }
        try {
            const res = await axios.put(`/api/users/${id}`, updatedUser)
            setUser(res.data)
            setMessage('Profile updated.')
        } catch (error: any) {
            setMessage(error.response?.data?.error || 'Failed to update profile.')
        }
    }

    if (!user) {
        return <div className="rounded bg-white p-6 shadow-sm border border-slate-200">Loading...</div>
    }

    return (
        <div className="space-y-6">
            <div className="rounded bg-white p-6 shadow-sm border border-slate-200">
                <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                    <div>
                        <h2 className="text-2xl font-bold">{user.name}</h2>
                        <p className="text-slate-600">{user.email}</p>
                    </div>
                    <button onClick={() => navigate('/users')} className="rounded bg-slate-100 px-4 py-2 text-slate-700 hover:bg-slate-200">Back to users</button>
                </div>
            </div>

            <div className="grid gap-4 lg:grid-cols-2">
                <div className="rounded bg-white p-6 shadow-sm border border-slate-200">
                    <h3 className="text-lg font-semibold">Profile</h3>
                    <div className="mt-4 space-y-3">
                        <div>
                            <label className="block text-sm font-medium text-slate-700">Name</label>
                            <input
                                value={user.name}
                                onChange={e => setUser({ ...user, name: e.target.value })}
                                onBlur={e => updateProfile('name', e.target.value)}
                                className="mt-1 block w-full rounded border border-slate-300 bg-white px-3 py-2"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-slate-700">Email</label>
                            <input
                                value={user.email}
                                onChange={e => setUser({ ...user, email: e.target.value })}
                                onBlur={e => updateProfile('email', e.target.value)}
                                className="mt-1 block w-full rounded border border-slate-300 bg-white px-3 py-2"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-slate-700">Team</label>
                            <select
                                value={user.team_id || ''}
                                onChange={e => {
                                    setUser({ ...user, team_id: e.target.value })
                                    updateProfile('team_id', e.target.value)
                                }}
                                className="mt-1 block w-full rounded border border-slate-300 bg-white px-3 py-2"
                            >
                                <option value="">Unassigned</option>
                                {teams.map(team => (
                                    <option key={team.id} value={team.id}>{team.name}</option>
                                ))}
                            </select>
                        </div>
                    </div>
                </div>

                <div className="rounded bg-white p-6 shadow-sm border border-slate-200">
                    <h3 className="text-lg font-semibold">Add skill</h3>
                    <form onSubmit={assignSkill} className="mt-4 space-y-4">
                        <label className="block">
                            <span className="text-sm font-medium text-slate-700">Skill</span>
                            <select
                                value={selectedSkill}
                                onChange={e => setSelectedSkill(e.target.value)}
                                className="mt-1 block w-full rounded border border-slate-300 bg-white px-3 py-2"
                            >
                                {skills.map(skill => (
                                    <option key={skill.id} value={skill.id}>{skill.name}</option>
                                ))}
                            </select>
                        </label>
                        <label className="block">
                            <span className="text-sm font-medium text-slate-700">Level</span>
                            <select
                                value={selectedLevel}
                                onChange={e => setSelectedLevel(e.target.value)}
                                className="mt-1 block w-full rounded border border-slate-300 bg-white px-3 py-2"
                            >
                                {LEVELS.map(level => (
                                    <option key={level} value={level}>{level}</option>
                                ))}
                            </select>
                        </label>
                        <button type="submit" className="rounded bg-blue-600 px-4 py-2 text-white hover:bg-blue-700">Assign skill</button>
                    </form>
                    {message && <div className="mt-4 rounded bg-slate-50 p-3 text-sm text-slate-700">{message}</div>}
                </div>
            </div>

            <div className="rounded bg-white p-6 shadow-sm border border-slate-200">
                <h3 className="text-lg font-semibold">Skills</h3>
                <div className="mt-4 grid gap-3">
                    {userSkills.length === 0 ? (
                        <div className="text-slate-500">No skills assigned yet.</div>
                    ) : (
                        userSkills.map(skill => (
                            <div key={`${skill.user_id}-${skill.skill_id}`} className="rounded-md border border-slate-200 bg-slate-50 p-3">
                                <div className="font-medium">{skills.find(s => s.id === skill.skill_id)?.name || skill.skill_id}</div>
                                <div className="text-sm text-slate-500">Level: {skill.level}</div>
                            </div>
                        ))
                    )}
                </div>
            </div>
        </div>
    )
}

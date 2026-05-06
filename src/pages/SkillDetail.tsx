import React, { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import axios from 'axios'

export default function SkillDetail() {
    const { id } = useParams()
    const navigate = useNavigate()
    const [skill, setSkill] = useState<any>(null)
    const [users, setUsers] = useState<any[]>([])
    const [userSkills, setUserSkills] = useState<any[]>([])
    const [projects, setProjects] = useState<any[]>([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)

    useEffect(() => {
        if (!id) return
        setLoading(true)
        setError(null)
        Promise.all([
            axios.get(`/api/skills/${id}`),
            axios.get('/api/users'),
            axios.get(`/api/user-skills?skill_id=${id}`),
            axios.get('/api/projects')
        ]).then(([skillRes, usersRes, userSkillsRes, projectsRes]) => {
            setSkill(skillRes.data)
            setUsers(usersRes.data)
            setUserSkills(userSkillsRes.data)
            setProjects(projectsRes.data)
            setLoading(false)
        }).catch(err => {
            setError(err.response?.data?.error || 'Unable to load skill details.')
            setLoading(false)
        })
    }, [id])

    if (loading) {
        return <div className="rounded bg-white p-6 shadow-sm border border-slate-200">Loading skill details…</div>
    }

    if (error) {
        return <div className="rounded bg-white p-6 shadow-sm border border-slate-200 text-red-600">{error}</div>
    }

    const skillUsers = userSkills.map(entry => ({
        ...entry,
        user: users.find(u => u.id === entry.user_id)
    }))

    const relatedProjects = projects.filter(project => project.required_skills?.some((req: any) => req.skill_id === id))

    return (
        <div className="space-y-6">
            <div className="rounded bg-white p-6 shadow-sm border border-slate-200">
                <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                    <div>
                        <h2 className="text-2xl font-bold">{skill.name}</h2>
                        <p className="text-slate-600">Category: {skill.category_id}</p>
                    </div>
                    <button onClick={() => navigate('/skills')} className="rounded bg-slate-100 px-4 py-2 text-slate-700 hover:bg-slate-200">Back to skills</button>
                </div>
            </div>

            <div className="grid gap-4 lg:grid-cols-2">
                <div className="rounded bg-white p-6 shadow-sm border border-slate-200">
                    <h3 className="text-lg font-semibold">Users with this skill</h3>
                    <div className="mt-4 grid gap-3">
                        {skillUsers.length === 0 ? (
                            <div className="text-slate-500">No users yet.</div>
                        ) : (
                            skillUsers.map(entry => (
                                <div key={entry.id} className="rounded border border-slate-200 bg-slate-50 p-3">
                                    <div className="font-medium">{entry.user?.name || entry.user_id}</div>
                                    <div className="text-sm text-slate-500">Level: {entry.level}</div>
                                </div>
                            ))
                        )}
                    </div>
                </div>
                <div className="rounded bg-white p-6 shadow-sm border border-slate-200">
                    <h3 className="text-lg font-semibold">Projects requiring this skill</h3>
                    <div className="mt-4 grid gap-3">
                        {relatedProjects.length === 0 ? (
                            <div className="text-slate-500">No projects require this skill yet.</div>
                        ) : (
                            relatedProjects.map(project => (
                                <div key={project.id} className="rounded border border-slate-200 bg-slate-50 p-3">
                                    <div className="font-medium">{project.name}</div>
                                    <div className="text-sm text-slate-500">{project.summary}</div>
                                </div>
                            ))
                        )}
                    </div>
                </div>
            </div>
        </div>
    )
}

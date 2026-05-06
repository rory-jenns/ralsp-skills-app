import React, { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import axios from 'axios'

export default function TeamDetail() {
    const { id } = useParams()
    const navigate = useNavigate()
    const [team, setTeam] = useState<any>(null)
    const [users, setUsers] = useState<any[]>([])
    const [projects, setProjects] = useState<any[]>([])

    useEffect(() => {
        if (!id) return
        Promise.all([
            axios.get(`/api/teams/${id}`),
            axios.get(`/api/users?team_id=${id}`),
            axios.get('/api/projects')
        ]).then(([teamRes, usersRes, projectsRes]) => {
            setTeam(teamRes.data)
            setUsers(usersRes.data)
            setProjects(projectsRes.data.filter((project: any) => project.owner_team_id === id))
        })
    }, [id])

    if (!team) {
        return <div className="rounded bg-white p-6 shadow-sm border border-slate-200">Loading...</div>
    }

    return (
        <div className="space-y-6">
            <div className="rounded bg-white p-6 shadow-sm border border-slate-200">
                <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                    <div>
                        <h2 className="text-2xl font-bold">{team.name}</h2>
                        <p className="text-slate-600">{team.description}</p>
                    </div>
                    <button onClick={() => navigate('/teams')} className="rounded bg-slate-100 px-4 py-2 text-slate-700 hover:bg-slate-200">Back to teams</button>
                </div>
            </div>

            <div className="grid gap-4 lg:grid-cols-2">
                <div className="rounded bg-white p-6 shadow-sm border border-slate-200">
                    <h3 className="text-lg font-semibold">Team members</h3>
                    <div className="mt-4 space-y-3">
                        {users.length === 0 ? (
                            <div className="text-slate-500">No members assigned yet.</div>
                        ) : (
                            users.map(user => (
                                <div key={user.id} className="rounded border border-slate-200 bg-slate-50 p-3">
                                    <div className="font-medium">{user.name}</div>
                                    <div className="text-sm text-slate-600">{user.email}</div>
                                </div>
                            ))
                        )}
                    </div>
                </div>
                <div className="rounded bg-white p-6 shadow-sm border border-slate-200">
                    <h3 className="text-lg font-semibold">Owned projects</h3>
                    <div className="mt-4 space-y-3">
                        {projects.length === 0 ? (
                            <div className="text-slate-500">No projects owned yet.</div>
                        ) : (
                            projects.map(project => (
                                <div key={project.id} className="rounded border border-slate-200 bg-slate-50 p-3">
                                    <div className="font-medium">{project.name}</div>
                                    <div className="text-sm text-slate-600">{project.summary}</div>
                                </div>
                            ))
                        )}
                    </div>
                </div>
            </div>
        </div>
    )
}

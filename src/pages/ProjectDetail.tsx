import React, { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import axios from 'axios'

interface Project {
    id: string
    name: string
    summary: string
    status: string
    owner_team_id: string
    required_skills?: Array<{ skill_id: string; min_level: string }>
}

interface Skill {
    id: string
    name: string
}

interface Team {
    id: string
    name: string
}

interface MatchResult {
    user: { id: string; name: string }
    score: number
    matched?: Array<{ skill_id: string }>
    matched_skills?: Array<{ skill_id: string; skill_name: string; min_level: string; user_level: string }>
}

export default function ProjectDetail() {
    const { id } = useParams<{ id: string }>()
    const [project, setProject] = useState<Project | null>(null)
    const [skills, setSkills] = useState<Skill[]>([])
    const [teams, setTeams] = useState<Team[]>([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)
    const [matchResults, setMatchResults] = useState<MatchResult[]>([])

    useEffect(() => {
        if (!id) return
        setLoading(true)
        Promise.all([axios.get(`/api/projects/${id}`), axios.get('/api/skills'), axios.get('/api/teams')])
            .then(([projectRes, skillsRes, teamsRes]) => {
                setProject(projectRes.data)
                setSkills(skillsRes.data)
                setTeams(teamsRes.data)
            })
            .catch(err => {
                setError(err.response?.data?.error || 'Failed to load project.')
            })
            .finally(() => setLoading(false))
    }, [id])

    const skillName = (skillId: string) => skills.find(skill => skill.id === skillId)?.name || skillId
    const teamName = teams.find(team => team.id === project?.owner_team_id)?.name || 'Unknown team'

    const runMatch = () => {
        if (!id) return
        axios.post(`/api/projects/${id}/match`)
            .then(res => setMatchResults(res.data))
            .catch(() => setMatchResults([]))
    }

    if (loading) {
        return <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">Loading project…</div>
    }

    if (error) {
        return <div className="rounded-3xl border border-slate-200 bg-red-50 p-6 text-red-700 shadow-sm">{error}</div>
    }

    if (!project) {
        return <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">Project not found.</div>
    }

    return (
        <div className="space-y-8">
            <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
                <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                    <div>
                        <h2 className="text-3xl font-semibold text-slate-900">{project.name}</h2>
                        <p className="mt-2 text-slate-600">{project.summary}</p>
                        <div className="mt-3 flex flex-wrap items-center gap-3 text-sm text-slate-600">
                            <span className="rounded-full bg-slate-100 px-3 py-1">Status: {project.status}</span>
                            <span className="rounded-full bg-slate-100 px-3 py-1">Owner team: {teamName}</span>
                        </div>
                    </div>
                    <div className="flex flex-wrap gap-3">
                        <Link to="/projects" className="rounded-full border border-slate-200 bg-white px-5 py-3 text-sm font-semibold text-slate-700 transition hover:border-slate-300 hover:bg-slate-50">Back to projects</Link>
                        <button onClick={runMatch} className="rounded-full bg-blue-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-blue-700">Run match</button>
                    </div>
                </div>
            </div>

            <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
                <h3 className="text-xl font-semibold text-slate-900">Required skills</h3>
                {project.required_skills?.length ? (
                    <div className="mt-6 grid gap-4 sm:grid-cols-2">
                        {project.required_skills.map(skill => (
                            <div key={skill.skill_id} className="rounded-3xl border border-slate-200 bg-slate-50 p-4">
                                <div className="font-semibold text-slate-900">{skillName(skill.skill_id)}</div>
                                <div className="mt-1 text-xs">Minimum: {skill.min_level}</div>
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="mt-4 text-slate-500">No required skills listed.</div>
                )}
            </div>

            <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
                <h3 className="text-xl font-semibold text-slate-900">Match results</h3>
                {matchResults.length === 0 ? (
                    <div className="mt-4 text-slate-500">Run match to see matching users.</div>
                ) : (
                    <div className="mt-6 grid gap-4">
                        {matchResults.map(match => (
                            <div key={match.user.id} className="rounded-3xl border border-slate-200 bg-slate-50 p-4">
                                <div className="flex items-center justify-between gap-3">
                                    <div>
                                        <div className="font-semibold text-slate-900">{match.user.name}</div>
                                        <div className="text-sm text-slate-600">Score: {match.score}</div>
                                    </div>
                                </div>
                                {match.matched_skills?.length ? (
                                    <div className="mt-4 grid gap-2">
                                        {match.matched_skills.map(skill => (
                                            <div key={skill.skill_id} className="rounded-2xl bg-white p-3 text-sm text-slate-700 border border-slate-200">
                                                <div className="font-medium">{skill.skill_name}</div>
                                                <div className="text-xs text-slate-500">Your level: {skill.user_level}, required: {skill.min_level}</div>
                                            </div>
                                        ))}
                                    </div>
                                ) : match.matched?.length ? (
                                    <div className="mt-4 grid gap-2">
                                        {match.matched.map(skill => (
                                            <div key={skill.skill_id} className="rounded-2xl bg-white p-3 text-sm text-slate-700 border border-slate-200">
                                                <div className="font-medium">{skillName(skill.skill_id)}</div>
                                            </div>
                                        ))}
                                    </div>
                                ) : null}
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    )
}

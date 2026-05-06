import React, { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import axios from 'axios'

interface Project {
    id: string
    name: string
    summary: string
    status: string
    required_skills?: Array<{ skill_id: string; min_level: string }>
}

interface Skill {
    id: string
    name: string
}

interface MatchResult {
    user: { id: string; name: string }
    score: number
    matched?: Array<{ skill_id: string }>
    matched_skills?: Array<{ skill_id: string; skill_name: string; min_level: string; user_level: string }>
}

export default function Projects() {
    const [projects, setProjects] = useState<Project[]>([])
    const [skills, setSkills] = useState<Skill[]>([])
    const [loading, setLoading] = useState(true)
    const [matchResults, setMatchResults] = useState<Record<string, MatchResult[]>>({})

    useEffect(() => {
        Promise.all([axios.get('/api/projects'), axios.get('/api/skills')])
            .then(([projectsRes, skillsRes]) => {
                setProjects(projectsRes.data)
                setSkills(skillsRes.data)
            })
            .finally(() => setLoading(false))
    }, [])

    function skillName(skillId: string) {
        return skills.find(skill => skill.id === skillId)?.name || skillId
    }

    function runMatch(projectId: string) {
        axios.post(`/api/projects/${projectId}/match`).then(res => {
            setMatchResults(prev => ({ ...prev, [projectId]: res.data }))
        }).catch(() => {
            setMatchResults(prev => ({ ...prev, [projectId]: [] }))
        })
    }

    return (
        <div className="space-y-8">
            <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
                <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                    <div>
                        <h2 className="text-3xl font-semibold text-slate-900">Projects</h2>
                        <p className="mt-2 text-slate-600">Browse active projects and run match suggestions for your team.</p>
                    </div>
                    <div className="flex flex-wrap gap-3">
                        <Link to="/projects/create" className="rounded-full bg-slate-900 px-5 py-3 text-sm font-semibold text-white transition hover:bg-slate-800">Create project</Link>
                        <Link to="/search" className="rounded-full border border-slate-200 bg-white px-5 py-3 text-sm font-semibold text-slate-700 transition hover:border-slate-300 hover:bg-slate-50">Search</Link>
                    </div>
                </div>
            </div>

            {loading ? (
                <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">Loading projects…</div>
            ) : projects.length === 0 ? (
                <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">No projects found.</div>
            ) : (
                <div className="grid gap-6">
                    {projects.map(project => (
                        <div key={project.id} className="overflow-hidden rounded-[2rem] border border-slate-200 bg-white shadow-sm">
                            <div className="bg-slate-950/5 px-6 py-5 sm:flex sm:items-center sm:justify-between">
                                <div>
                                    <h3 className="text-2xl font-semibold text-slate-900">{project.name}</h3>
                                    <p className="mt-2 text-slate-600">{project.summary}</p>
                                </div>
                                <div className="flex flex-wrap items-center gap-3 pt-4 sm:pt-0">
                                    <span className={`rounded-full px-3 py-1 text-sm font-medium ${project.status === 'active' ? 'bg-emerald-100 text-emerald-700' : project.status === 'planning' ? 'bg-sky-100 text-sky-700' : project.status === 'backlog' ? 'bg-amber-100 text-amber-700' : 'bg-slate-100 text-slate-700'}`}>{project.status}</span>
                                    <Link to={`/projects/${project.id}`} className="rounded-full bg-slate-900 px-4 py-2 text-sm font-semibold text-white transition hover:bg-slate-800">View project</Link>
                                    <button onClick={() => runMatch(project.id)} className="rounded-full bg-blue-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-blue-700">Run match</button>
                                </div>
                            </div>
                            <div className="p-6">
                                {project.required_skills?.length ? (
                                    <div className="grid gap-3 sm:grid-cols-2">
                                        {project.required_skills.map(skill => (
                                            <div key={skill.skill_id} className="rounded-3xl border border-slate-200 bg-slate-50 p-4">
                                                <div className="text-sm font-semibold text-slate-900">{skillName(skill.skill_id)}</div>
                                                <div className="mt-1 text-xs text-slate-500">Minimum: {skill.min_level}</div>
                                            </div>
                                        ))}
                                    </div>
                                ) : null}
                                {matchResults[project.id] && (
                                    <div className="mt-6 rounded-3xl border border-slate-200 bg-slate-50 p-4">
                                        <h4 className="text-lg font-semibold text-slate-900">Match results</h4>
                                        {matchResults[project.id].length === 0 ? (
                                            <div className="mt-3 text-slate-500">No matches found yet.</div>
                                        ) : (
                                            <div className="mt-4 grid gap-3">
                                                {matchResults[project.id].map(match => (
                                                    <div key={match.user.id} className="rounded-3xl bg-white p-4 shadow-sm border border-slate-200">
                                                        <div className="font-semibold text-slate-900">{match.user.name}</div>
                                                        <div className="text-sm text-slate-600">Score: {match.score}</div>
                                                        {match.matched_skills?.length ? (
                                                            <div className="mt-3 space-y-2">
                                                                <div className="text-sm font-semibold text-slate-900">Matched skills</div>
                                                                <div className="grid gap-2">
                                                                    {match.matched_skills.map(skill => (
                                                                        <div key={skill.skill_id} className="rounded-2xl bg-slate-50 p-3 text-sm text-slate-700">
                                                                            <div className="font-medium">{skill.skill_name}</div>
                                                                            <div className="text-xs text-slate-500">Your level: {skill.user_level}, required: {skill.min_level}</div>
                                                                        </div>
                                                                    ))}
                                                                </div>
                                                            </div>
                                                        ) : match.matched?.length ? (
                                                            <div className="mt-3 space-y-2">
                                                                <div className="text-sm font-semibold text-slate-900">Matched skills</div>
                                                                <div className="grid gap-2">
                                                                    {match.matched.map(skill => (
                                                                        <div key={skill.skill_id} className="rounded-2xl bg-slate-50 p-3 text-sm text-slate-700">
                                                                            <div className="font-medium">{skillName(skill.skill_id)}</div>
                                                                        </div>
                                                                    ))}
                                                                </div>
                                                            </div>
                                                        ) : null}
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    )
}

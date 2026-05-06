import React, { useEffect, useState } from 'react'
import axios from 'axios'
import { Link } from 'react-router-dom'

interface Metrics {
    teams: number
    users: number
    skills: number
    projects: number
}

const cards = [
    { label: 'Teams', field: 'teams', accent: 'from-sky-500 to-indigo-500' },
    { label: 'Users', field: 'users', accent: 'from-emerald-500 to-teal-500' },
    { label: 'Skills', field: 'skills', accent: 'from-violet-500 to-fuchsia-500' },
    { label: 'Projects', field: 'projects', accent: 'from-amber-500 to-orange-500' }
]

export default function Home() {
    const [metrics, setMetrics] = useState<Metrics | null>(null)
    const [topSkills, setTopSkills] = useState<string[]>([])

    useEffect(() => {
        Promise.all([
            axios.get('/api/teams'),
            axios.get('/api/users'),
            axios.get('/api/skills'),
            axios.get('/api/projects')
        ]).then(([teams, users, skills, projects]) => {
            setMetrics({
                teams: teams.data.length,
                users: users.data.length,
                skills: skills.data.length,
                projects: projects.data.length
            })

            const counts: Record<string, number> = {}
            const skillMap: Record<string, string> = {}
            skills.data.forEach((skill: any) => {
                skillMap[skill.id] = skill.name
            })
            projects.data.forEach((project: any) => {
                project.required_skills?.forEach((req: any) => {
                    counts[req.skill_id] = (counts[req.skill_id] || 0) + 1
                })
            })
            const sorted = Object.entries(counts)
                .sort((a, b) => b[1] - a[1])
                .slice(0, 6)
                .map(([skillId]) => skillMap[skillId] || skillId)
            setTopSkills(sorted)
        })
    }, [])

    return (
        <div className="space-y-8">
            <section className="rounded-[2rem] bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 p-10 text-white shadow-2xl shadow-slate-500/10">
                <div className="max-w-3xl space-y-4">
                    <p className="text-sm uppercase tracking-[0.35em] text-sky-300">Team skills dashboard</p>
                    <h1 className="text-4xl font-semibold tracking-tight">Beautifully manage skills, projects, and matches.</h1>
                    <p className="max-w-2xl text-slate-200">A modern, lightweight workspace for teams to track users, skills, projects and find candidates who fit requirements quickly.</p>
                    <div className="mt-6 flex flex-wrap gap-3">
                        <Link to="/projects" className="rounded-full bg-white/10 px-5 py-3 text-sm font-semibold text-white shadow hover:bg-white/20">Browse projects</Link>
                        <Link to="/users" className="rounded-full bg-slate-800/70 px-5 py-3 text-sm font-semibold text-slate-100 shadow hover:bg-slate-700/80">Browse users</Link>
                    </div>
                </div>
            </section>

            <section className="grid gap-6 lg:grid-cols-4">
                {cards.map(card => (
                    <div key={card.field} className={`rounded-[1.5rem] border border-white/10 bg-white/80 p-6 shadow-lg shadow-slate-500/5 backdrop-blur-sm`}>
                        <div className="text-sm font-semibold uppercase tracking-[0.24em] text-slate-500">{card.label}</div>
                        <div className="mt-4 flex items-end gap-3">
                            <div className={`h-12 w-12 rounded-3xl bg-gradient-to-br ${card.accent} shadow-inner shadow-slate-700/10`} />
                            <div>
                                <div className="text-4xl font-semibold text-slate-900">{metrics ? (metrics as any)[card.field] : '-'}</div>
                                <div className="text-sm text-slate-500">Total {card.label.toLowerCase()}</div>
                            </div>
                        </div>
                    </div>
                ))}
            </section>

            <section className="grid gap-6 lg:grid-cols-[1.4fr_0.8fr]">
                <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
                    <div className="flex items-center justify-between gap-4">
                        <div>
                            <h2 className="text-2xl font-semibold text-slate-900">Top needed skills</h2>
                            <p className="mt-1 text-slate-500">From active project requirements.</p>
                        </div>
                        <span className="rounded-full bg-slate-100 px-3 py-1 text-sm text-slate-700">Updated now</span>
                    </div>
                    <div className="mt-6 flex flex-wrap gap-3">
                        {topSkills.length > 0 ? topSkills.map(skill => (
                            <span key={skill} className="rounded-full bg-slate-100 px-4 py-2 text-sm font-medium text-slate-700 shadow-sm">{skill}</span>
                        )) : (
                            <span className="text-slate-500">Loading top skills...</span>
                        )}
                    </div>
                </div>

                <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
                    <h2 className="text-2xl font-semibold text-slate-900">Quick actions</h2>
                    <div className="mt-6 grid gap-3">
                        {[
                            { label: 'Users', path: '/users' },
                            { label: 'Skills', path: '/skills' },
                            { label: 'Projects', path: '/projects' },
                            { label: 'Search', path: '/search' }
                        ].map(action => (
                            <Link key={action.path} to={action.path} className="rounded-3xl border border-slate-200 bg-slate-50 px-5 py-4 text-sm font-medium text-slate-700 transition hover:border-slate-300 hover:bg-slate-100">
                                {action.label}
                            </Link>
                        ))}
                    </div>
                </div>
            </section>
        </div>
    )
}

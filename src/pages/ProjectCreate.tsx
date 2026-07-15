import React, { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import axios from 'axios'
import { useAuth } from '../auth'
import Alert from '../components/Alert'

interface SkillOption {
    id: string
    name: string
    category_id: string
}

interface Category {
    id: string
    name: string
}

interface Team {
    id: string
    name: string
}

const LEVELS = ['beginner', 'intermediate', 'advanced', 'expert']

export default function ProjectCreate() {
    const navigate = useNavigate()
    const auth = useAuth()
    const [teams, setTeams] = useState<Team[]>([])
    const [skills, setSkills] = useState<SkillOption[]>([])
    const [categories, setCategories] = useState<Category[]>([])
    const [name, setName] = useState('')
    const [summary, setSummary] = useState('')
    const [ownerTeamId, setOwnerTeamId] = useState('')
    const [status, setStatus] = useState('planning')
    const [requiredSkills, setRequiredSkills] = useState<Array<{ skill_id: string; min_level: string }>>([])
    const [newSkillName, setNewSkillName] = useState('')
    const [newSkillCategoryId, setNewSkillCategoryId] = useState('')
    const [message, setMessage] = useState<string | null>(null)
    const [messageType, setMessageType] = useState<'error' | 'success' | 'info' | null>(null)

    useEffect(() => {
        if (!auth.user) navigate('/login')
        Promise.all([axios.get('/api/teams'), axios.get('/api/skills'), axios.get('/api/categories')]).then(
            ([teamsRes, skillsRes, categoriesRes]) => {
                setTeams(teamsRes.data)
                setSkills(skillsRes.data)
                setCategories(categoriesRes.data)
                setOwnerTeamId(teamsRes.data[0]?.id || '')
                setNewSkillCategoryId(categoriesRes.data[0]?.id || '')
            }
        )
    }, [])

    const addSkillRow = () => {
        setRequiredSkills(prev => [...prev, { skill_id: skills[0]?.id || '', min_level: 'intermediate' }])
    }

    const updateSkillRow = (index: number, field: 'skill_id' | 'min_level', value: string) => {
        setRequiredSkills(prev => prev.map((item, idx) => (idx === index ? { ...item, [field]: value } : item)))
    }

    const removeSkillRow = (index: number) => {
        setRequiredSkills(prev => prev.filter((_, idx) => idx !== index))
    }

    const createNewSkill = async () => {
        if (!newSkillName || !newSkillCategoryId) return
        try {
            const res = await axios.post('/api/skills', { name: newSkillName, category_id: newSkillCategoryId, tags: [] })
            setSkills(prev => [...prev, res.data])
            setMessage(`Created skill ${res.data.name}`)
            setMessageType('success')
            setNewSkillName('')
        } catch (error: any) {
            setMessage(error.response?.data?.error || 'Failed to create skill')
            setMessageType('error')
        }
    }

    const submit = async (event: React.FormEvent) => {
        event.preventDefault()
        const project = { name, summary, owner_team_id: ownerTeamId, status, required_skills: requiredSkills }
        try {
            const res = await axios.post('/api/projects', project)
            navigate(`/projects/${res.data.id}`)
        } catch (error: any) {
            setMessage(error.response?.data?.error || 'Failed to create project')
            setMessageType('error')
        }
    }

    return (
        <div className="space-y-6">
            <div className="rounded bg-white p-6 shadow-sm border border-slate-200">
                <h2 className="text-2xl font-bold">Create Project</h2>
                <p className="mt-2 text-slate-600">Add a new project with required skills and match candidates automatically.</p>
            </div>

            <form onSubmit={submit} className="grid gap-6">
                <div className="grid gap-4 md:grid-cols-2">
                    <label className="block">
                        <span className="text-sm font-medium text-slate-700">Project name</span>
                        <input
                            value={name}
                            onChange={e => setName(e.target.value)}
                            className="mt-1 block w-full rounded border border-slate-300 bg-white px-3 py-2"
                            required
                        />
                    </label>
                    <label className="block">
                        <span className="text-sm font-medium text-slate-700">Owner team</span>
                        <select
                            value={ownerTeamId}
                            onChange={e => setOwnerTeamId(e.target.value)}
                            className="mt-1 block w-full rounded border border-slate-300 bg-white px-3 py-2"
                            required
                        >
                            {teams.map(team => (
                                <option key={team.id} value={team.id}>{team.name}</option>
                            ))}
                        </select>
                    </label>
                </div>

                <label className="block">
                    <span className="text-sm font-medium text-slate-700">Summary</span>
                    <textarea
                        value={summary}
                        onChange={e => setSummary(e.target.value)}
                        rows={4}
                        className="mt-1 block w-full rounded border border-slate-300 bg-white px-3 py-2"
                        required
                    />
                </label>

                <label className="block w-40">
                    <span className="text-sm font-medium text-slate-700">Status</span>
                    <select
                        value={status}
                        onChange={e => setStatus(e.target.value)}
                        className="mt-1 block w-full rounded border border-slate-300 bg-white px-3 py-2"
                    >
                        <option value="planning">Planning</option>
                        <option value="active">Active</option>
                        <option value="backlog">Backlog</option>
                        <option value="completed">Completed</option>
                    </select>
                </label>

                <div className="rounded-xl bg-slate-50 p-4 border border-slate-200">
                    <div className="flex items-center justify-between">
                        <h3 className="text-lg font-semibold">Required skills</h3>
                        <button type="button" onClick={addSkillRow} className="rounded bg-blue-600 px-3 py-1 text-white hover:bg-blue-700">Add skill</button>
                    </div>

                    {requiredSkills.map((item, index) => (
                        <div key={`${item.skill_id}-${index}`} className="mt-4 grid gap-3 md:grid-cols-[1fr_160px_120px_80px] items-end">
                            <label className="block">
                                <span className="text-sm font-medium text-slate-700">Skill</span>
                                <select
                                    value={item.skill_id}
                                    onChange={e => updateSkillRow(index, 'skill_id', e.target.value)}
                                    className="mt-1 block w-full rounded border border-slate-300 bg-white px-3 py-2"
                                >
                                    {skills.map(skill => (
                                        <option key={skill.id} value={skill.id}>{skill.name}</option>
                                    ))}
                                </select>
                            </label>
                            <label className="block">
                                <span className="text-sm font-medium text-slate-700">Min level</span>
                                <select
                                    value={item.min_level}
                                    onChange={e => updateSkillRow(index, 'min_level', e.target.value)}
                                    className="mt-1 block w-full rounded border border-slate-300 bg-white px-3 py-2"
                                >
                                    {LEVELS.map(level => (
                                        <option key={level} value={level}>{level}</option>
                                    ))}
                                </select>
                            </label>
                            <button type="button" onClick={() => removeSkillRow(index)} className="rounded bg-red-600 px-3 py-2 text-white hover:bg-red-700">Remove</button>
                        </div>
                    ))}

                    <div className="mt-6 rounded-xl bg-white p-4 border border-slate-200">
                        <h4 className="font-semibold">Create skill on the fly</h4>
                        <div className="grid gap-4 md:grid-cols-3 mt-4">
                            <label className="block">
                                <span className="text-sm font-medium text-slate-700">Skill name</span>
                                <input
                                    value={newSkillName}
                                    onChange={e => setNewSkillName(e.target.value)}
                                    className="mt-1 block w-full rounded border border-slate-300 bg-white px-3 py-2"
                                />
                            </label>
                            <label className="block">
                                <span className="text-sm font-medium text-slate-700">Category</span>
                                <select
                                    value={newSkillCategoryId}
                                    onChange={e => setNewSkillCategoryId(e.target.value)}
                                    className="mt-1 block w-full rounded border border-slate-300 bg-white px-3 py-2"
                                >
                                    {categories.map(category => (
                                        <option key={category.id} value={category.id}>{category.name}</option>
                                    ))}
                                </select>
                            </label>
                            <div className="flex items-end">
                                <button type="button" onClick={createNewSkill} className="w-full rounded bg-emerald-600 px-4 py-2 text-white hover:bg-emerald-700">Create skill</button>
                            </div>
                        </div>
                    </div>
                </div>

                {message && <Alert type={messageType ?? 'info'} message={message} />}

                <button type="submit" className="rounded bg-blue-600 px-6 py-3 text-white hover:bg-blue-700">Create project</button>
            </form>
        </div>
    )
}

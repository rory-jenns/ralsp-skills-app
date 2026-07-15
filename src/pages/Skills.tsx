import React, { useEffect, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import axios from 'axios'
import { useAuth } from '../auth'
import Alert from '../components/Alert'

export default function Skills() {
    const auth = useAuth()
    const [skills, setSkills] = useState<any[]>([])
    const [categories, setCategories] = useState<any[]>([])
    const [name, setName] = useState('')
    const [selectedCategoryId, setSelectedCategoryId] = useState('')
    const [message, setMessage] = useState<string | null>(null)
    const [messageType, setMessageType] = useState<'error' | 'success' | 'info' | null>(null)
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)

    const [searchParams] = useSearchParams()

    useEffect(() => {
        setLoading(true)
        setError(null)
        Promise.all([
            axios.get('/api/skills'),
            axios.get('/api/categories')
        ])
            .then(([skillsRes, categoriesRes]) => {
                setSkills(skillsRes.data)
                setCategories(categoriesRes.data)
                setSelectedCategoryId(categoriesRes.data[0]?.id || '')
            })
            .catch(err => {
                setError(err.response?.data?.error || 'Failed to load skills.')
            })
            .finally(() => setLoading(false))
    }, [])

    const filterCategoryId = searchParams.get('category') || ''
    const getCategoryName = (id: string) => categories.find(category => category.id === id)?.name || id
    const filterCategoryName = filterCategoryId ? getCategoryName(filterCategoryId) : ''
    const filteredSkills = filterCategoryId ? skills.filter(skill => skill.category_id === filterCategoryId) : skills

    useEffect(() => {
        if (filterCategoryId) {
            setSelectedCategoryId(filterCategoryId)
            return
        }
        // default to first category only if nothing selected yet
        if (!selectedCategoryId && categories.length > 0) {
            setSelectedCategoryId(categories[0].id)
        }
    }, [filterCategoryId, categories, selectedCategoryId])

    const createSkill = async (event: React.FormEvent) => {
        event.preventDefault()
        try {
            const res = await axios.post('/api/skills', { name, category_id: selectedCategoryId, tags: [] })
            setSkills(prev => [...prev, res.data])
            setName('')
            setMessage('Created skill successfully.')
            setMessageType('success')
        } catch (error: any) {
            setMessage(error.response?.data?.error || 'Failed to create skill.')
            setMessageType('error')
        }
    }

    return (
        <div className="space-y-8">
            <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
                <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                    <div>
                        <h2 className="text-3xl font-semibold text-slate-900">Skills</h2>
                        <p className="mt-2 text-slate-600">Manage skills, categories, and connections across your teams.</p>
                    </div>
                    <div className="flex items-center gap-3">
                        <Link to="/categories" className="rounded-full border border-slate-200 bg-slate-50 px-5 py-3 text-sm font-semibold text-slate-700 transition hover:border-slate-300 hover:bg-white">Manage categories</Link>
                    </div>
                </div>
            </div>

            <div className="grid gap-6 lg:grid-cols-[1fr_0.35fr]">
                        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm order-1 lg:order-1">
                            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                                <h3 className="text-xl font-semibold text-slate-900">Skill library</h3>
                                {filterCategoryId && (
                                    <div className="rounded-3xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-700">
                                        Viewing category: <span className="font-semibold text-slate-900">{filterCategoryName}</span>
                                    </div>
                                )}
                            </div>
                            <div className="mt-6 grid gap-4">
                                {loading ? (
                                    <div className="text-slate-500">Loading skills…</div>
                                ) : error ? (
                                    <div className="text-red-600">{error}</div>
                                ) : filteredSkills.length ? (
                                    filteredSkills.map(skill => (
                                        <div key={skill.id} className="flex items-start justify-between">
                                            <Link to={`/skills/${skill.id}`} className="block flex-1 overflow-hidden rounded-3xl border border-slate-200 bg-slate-50 p-5 transition hover:border-slate-300 hover:bg-white mr-3">
                                                <div className="flex items-center justify-between gap-3">
                                                    <div>
                                                        <div className="font-semibold text-slate-900">{skill.name}</div>
                                                        <div className="text-sm text-slate-500">Category: {getCategoryName(skill.category_id)}</div>
                                                    </div>
                                                    <div className="rounded-full bg-slate-100 px-3 py-1 text-xs uppercase tracking-[0.2em] text-slate-600">View</div>
                                                </div>
                                            </Link>
                                            {(auth.user && (auth.user.role === 'admin' || auth.user.id === skill.owner_id)) && (
                                                <button onClick={async (e) => {
                                                    e.preventDefault()
                                                    if (!confirm(`Delete skill "${skill.name}"? This cannot be undone.`)) return
                                                    try {
                                                        await axios.delete(`/api/skills/${skill.id}`)
                                                        setSkills(prev => prev.filter(s => s.id !== skill.id))
                                                        setMessage(`Deleted skill ${skill.name}`)
                                                        setMessageType('success')
                                                    } catch (err: any) {
                                                        setMessage(err.response?.data?.error || 'Failed to delete skill')
                                                        setMessageType('error')
                                                    }
                                                }} className="inline-flex items-center rounded-full bg-transparent p-2 text-red-600 hover:bg-red-50">
                                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6M1 7h22M10 3h4l1 4H9l1-4z" />
                                                    </svg>
                                                </button>
                                            )}
                                        </div>
                                    ))
                                ) : (
                                    <div className="text-slate-500">No skills yet.</div>
                                )}
                            </div>
                        </div>

                        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm order-2 lg:order-2">
                            <h3 className="text-xl font-semibold text-slate-900">Create new skill</h3>
                            {auth.user ? (
                                <form onSubmit={createSkill} className="mt-6 space-y-5">
                                    <label className="block">
                                        <span className="text-sm font-medium text-slate-700">Skill name</span>
                                        <input
                                            value={name}
                                            onChange={e => setName(e.target.value)}
                                            className="mt-2 block w-full rounded-3xl border border-slate-300 bg-slate-50 px-4 py-3 text-slate-900 focus:border-slate-900 focus:outline-none"
                                            required
                                        />
                                    </label>
                                    <label className="block">
                                        <span className="text-sm font-medium text-slate-700">Category</span>
                                        <select
                                            value={selectedCategoryId}
                                            onChange={e => setSelectedCategoryId(e.target.value)}
                                            className="mt-2 block w-full rounded-3xl border border-slate-300 bg-slate-50 px-4 py-3 text-slate-900 focus:border-slate-900 focus:outline-none"
                                        >
                                            {categories.map(category => (
                                                <option key={category.id} value={category.id}>{category.name}</option>
                                            ))}
                                        </select>
                                    </label>
                                    <button type="submit" className="rounded-full bg-slate-900 px-6 py-3 text-sm font-semibold text-white transition hover:bg-slate-800">Create skill</button>
                                    {message && <Alert type={messageType ?? 'info'} message={message} />}
                                </form>
                            ) : (
                                <div className="mt-6 text-sm text-slate-600">Sign in to create skills.</div>
                            )}
                        </div>
                    </div>
        </div>
    )
}

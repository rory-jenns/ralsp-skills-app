import React, { useEffect, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import axios from 'axios'

export default function Skills() {
    const [skills, setSkills] = useState<any[]>([])
    const [categories, setCategories] = useState<any[]>([])
    const [name, setName] = useState('')
    const [selectedCategoryId, setSelectedCategoryId] = useState('')
    const [message, setMessage] = useState<string | null>(null)
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

    const createSkill = async (event: React.FormEvent) => {
        event.preventDefault()
        try {
            const res = await axios.post('/api/skills', { name, category_id: selectedCategoryId, tags: [] })
            setSkills(prev => [...prev, res.data])
            setName('')
            setMessage('Created skill successfully.')
        } catch (error: any) {
            setMessage(error.response?.data?.error || 'Failed to create skill.')
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

            <div className="grid gap-6 lg:grid-cols-[1.5fr_1fr]">
                <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
                    <h3 className="text-xl font-semibold text-slate-900">Create new skill</h3>
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
                        {message && <div className="rounded-3xl bg-slate-50 p-4 text-sm text-slate-700">{message}</div>}
                    </form>
                </div>

                <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
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
                                <Link key={skill.id} to={`/skills/${skill.id}`} className="block overflow-hidden rounded-3xl border border-slate-200 bg-slate-50 p-5 transition hover:border-slate-300 hover:bg-white">
                                    <div className="flex items-center justify-between gap-3">
                                        <div>
                                            <div className="font-semibold text-slate-900">{skill.name}</div>
                                            <div className="text-sm text-slate-500">Category: {getCategoryName(skill.category_id)}</div>
                                        </div>
                                        <div className="rounded-full bg-slate-100 px-3 py-1 text-xs uppercase tracking-[0.2em] text-slate-600">View</div>
                                    </div>
                                </Link>
                            ))
                        ) : (
                            <div className="text-slate-500">No skills yet.</div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    )
}

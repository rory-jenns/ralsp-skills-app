import React, { useEffect, useState } from 'react'
import axios from 'axios'
import { Link } from 'react-router-dom'

interface Category {
    id: string
    name: string
}

interface Skill {
    id: string
    name: string
    category_id: string
}

export default function Categories() {
    const [categories, setCategories] = useState<Category[]>([])
    const [skills, setSkills] = useState<Skill[]>([])
    const [name, setName] = useState('')
    const [message, setMessage] = useState<string | null>(null)
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)

    useEffect(() => {
        setLoading(true)
        axios
            .all([axios.get('/api/categories'), axios.get('/api/skills')])
            .then(axios.spread((categoriesRes, skillsRes) => {
                setCategories(categoriesRes.data)
                setSkills(skillsRes.data)
            }))
            .catch(err => {
                setError(err.response?.data?.error || 'Failed to load categories.')
            })
            .finally(() => setLoading(false))
    }, [])

    const createCategory = async (event: React.FormEvent) => {
        event.preventDefault()
        if (!name.trim()) return
        try {
            const res = await axios.post('/api/categories', { name: name.trim() })
            setCategories(prev => [...prev, res.data])
            setName('')
            setMessage('Category created successfully.')
        } catch (error: any) {
            setMessage(error.response?.data?.error || 'Failed to create category.')
        }
    }

    const countSkills = (categoryId: string) => skills.filter(skill => skill.category_id === categoryId).length

    return (
        <div className="space-y-8">
            <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
                <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                    <div>
                        <h2 className="text-3xl font-semibold text-slate-900">Skill categories</h2>
                        <p className="mt-2 text-slate-600">Organize your skill library by category and add new groups on the fly.</p>
                    </div>
                    <Link to="/skills" className="rounded-full border border-slate-200 bg-white px-5 py-3 text-sm font-semibold text-slate-700 transition hover:border-slate-300 hover:bg-slate-50">Back to skills</Link>
                </div>
            </div>

            <div className="grid gap-6 lg:grid-cols-[1.5fr_1fr]">
                <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
                    <h3 className="text-xl font-semibold text-slate-900">Create category</h3>
                    <form onSubmit={createCategory} className="mt-6 space-y-5">
                        <label className="block">
                            <span className="text-sm font-medium text-slate-700">Category name</span>
                            <input
                                value={name}
                                onChange={e => setName(e.target.value)}
                                className="mt-2 block w-full rounded-3xl border border-slate-300 bg-slate-50 px-4 py-3 text-slate-900 focus:border-slate-900 focus:outline-none"
                                placeholder="e.g. Frontend"
                                required
                            />
                        </label>
                        <button type="submit" className="rounded-full bg-slate-900 px-6 py-3 text-sm font-semibold text-white transition hover:bg-slate-800">Add category</button>
                        {message && <div className="rounded-3xl bg-slate-50 p-4 text-sm text-slate-700">{message}</div>}
                    </form>
                </div>

                <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
                    <h3 className="text-xl font-semibold text-slate-900">Category library</h3>
                    <div className="mt-6 grid gap-4">
                        {loading ? (
                            <div className="text-slate-500">Loading categories…</div>
                        ) : error ? (
                            <div className="text-red-600">{error}</div>
                        ) : categories.length === 0 ? (
                            <div className="text-slate-500">No categories created yet.</div>
                        ) : (
                            categories.map(category => (
                                <Link
                                    key={category.id}
                                    to={`/skills?category=${category.id}`}
                                    className="block overflow-hidden rounded-3xl border border-slate-200 bg-slate-50 p-5 transition hover:border-slate-300 hover:bg-white"
                                >
                                    <div className="flex items-center justify-between gap-4">
                                        <div>
                                            <div className="font-semibold text-slate-900">{category.name}</div>
                                            <div className="text-sm text-slate-500">{countSkills(category.id)} skills</div>
                                        </div>
                                        <div className="rounded-full bg-slate-100 px-3 py-1 text-xs uppercase tracking-[0.24em] text-slate-600">{category.id}</div>
                                    </div>
                                </Link>
                            ))
                        )}
                    </div>
                </div>
            </div>
        </div>
    )
}

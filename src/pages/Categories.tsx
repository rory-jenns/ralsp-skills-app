import React, { useEffect, useState } from 'react'
import axios from 'axios'
import { Link } from 'react-router-dom'
import Alert from '../components/Alert'
import { useAuth } from '../auth'

interface Category {
    id: string
    name: string
    owner_id?: string
}

interface Skill {
    id: string
    name: string
    category_id: string
}

export default function Categories() {
    const auth = useAuth()
    const [categories, setCategories] = useState<Category[]>([])
    const [skills, setSkills] = useState<Skill[]>([])
    const [name, setName] = useState('')
    const [message, setMessage] = useState<string | null>(null)
    const [messageType, setMessageType] = useState<'error' | 'success' | 'info' | null>(null)
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
            setMessageType('success')
        } catch (error: any) {
            setMessage(error.response?.data?.error || 'Failed to create category.')
            setMessageType('error')
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

            <div className="grid gap-6 lg:grid-cols-[1fr_0.35fr]">
                <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm order-1 lg:order-1">
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
                                <div key={category.id} className="flex items-start justify-between">
                                    <Link
                                        to={`/skills?category=${category.id}`}
                                        className="block flex-1 overflow-hidden rounded-3xl border border-slate-200 bg-slate-50 p-5 transition hover:border-slate-300 hover:bg-white mr-3"
                                    >
                                        <div className="flex items-center justify-between gap-4">
                                            <div>
                                                <div className="font-semibold text-slate-900">{category.name}</div>
                                                <div className="text-sm text-slate-500">{countSkills(category.id)} skills</div>
                                            </div>
                                            <div className="rounded-full bg-slate-100 px-3 py-1 text-xs uppercase tracking-[0.24em] text-slate-600">{category.id}</div>
                                        </div>
                                    </Link>
                                    {(auth.user && (auth.user.role === 'admin' || auth.user.id === category.owner_id)) && (
                                        <button onClick={async (e) => {
                                            e.preventDefault()
                                            if (!confirm(`Delete category "${category.name}"? This cannot be undone.`)) return
                                            try {
                                                await axios.delete(`/api/categories/${category.id}`)
                                                setCategories(prev => prev.filter(c => c.id !== category.id))
                                                setMessage(`Deleted category ${category.name}`)
                                                setMessageType('success')
                                            } catch (err: any) {
                                                setMessage(err.response?.data?.error || 'Failed to delete category')
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
                        )}
                    </div>
                </div>

                <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm order-2 lg:order-2">
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
                        {message && <Alert type={messageType ?? 'info'} message={message} />}
                    </form>
                </div>
            </div>
        </div>
    )
}

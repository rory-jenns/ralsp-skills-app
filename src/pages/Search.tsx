import React, { useEffect, useState, useRef } from 'react'
import { Link } from 'react-router-dom'
import axios from 'axios'

const TABS = ['all', 'users', 'skills', 'projects', 'teams', 'categories'] as const

type SearchTab = (typeof TABS)[number]

export default function Search() {
    const [query, setQuery] = useState('')
    const [tab, setTab] = useState<SearchTab>('all')
    const [results, setResults] = useState<any>([])
    const [loading, setLoading] = useState(false)
    const debounceRef = useRef<number | null>(null)
    const abortRef = useRef<AbortController | null>(null)

    useEffect(() => {
        // clear any pending debounce
        if (debounceRef.current) {
            window.clearTimeout(debounceRef.current)
            debounceRef.current = null
        }
        // if there's an in-flight request, abort it
        if (abortRef.current) {
            try { abortRef.current.abort() } catch (e) {}
            abortRef.current = null
        }

        if (!query) {
            setResults([])
            setLoading(false)
            return
        }

        setLoading(true)
        // debounce the query to avoid firing on every keystroke
        debounceRef.current = window.setTimeout(() => {
            const controller = new AbortController()
            abortRef.current = controller
            axios.get('/api/search', { params: { q: query, type: tab }, signal: controller.signal })
                .then(res => setResults(res.data))
                .catch(err => {
                    if (err.name === 'CanceledError' || err.name === 'AbortError') return
                })
                .finally(() => {
                    setLoading(false)
                    abortRef.current = null
                })
        }, 300)

        return () => {
            if (debounceRef.current) {
                window.clearTimeout(debounceRef.current)
                debounceRef.current = null
            }
            if (abortRef.current) {
                try { abortRef.current.abort() } catch (e) {}
                abortRef.current = null
            }
        }
    }, [query, tab])

    const tabResults = Array.isArray(results) ? results : (results[tab] || [])

    const getItemLink = (category: string, item: any) => {
        const id = item?.id
        if (!id) return undefined
        switch (category) {
            case 'users': return `/users/${id}`
            case 'skills': return `/skills/${id}`
            case 'projects': return `/projects/${id}`
            case 'teams': return `/teams/${id}`
            case 'categories': return `/categories/${id}`
            default: return undefined
        }
    }

    return (
        <div className="space-y-8">
            <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
                <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                    <div>
                        <h2 className="text-3xl font-semibold text-slate-900">Search</h2>
                        <p className="mt-2 text-slate-600">Search across users, skills, projects, teams, and categories instantly.</p>
                    </div>
                </div>
            </div>

            <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
                <div className="grid gap-4 lg:grid-cols-[1.5fr_0.8fr]">
                    <label className="block">
                        <span className="text-sm font-medium text-slate-700">Search query</span>
                        <input
                            value={query}
                            onChange={e => setQuery(e.target.value)}
                            placeholder="Search name, email, skill, project, category..."
                            className="mt-2 block w-full rounded-3xl border border-slate-300 bg-slate-50 px-4 py-3 text-slate-900 focus:border-slate-900 focus:outline-none"
                        />
                    </label>
                    <label className="block">
                        <span className="text-sm font-medium text-slate-700">Scope</span>
                        <select
                            value={tab}
                            onChange={e => setTab(e.target.value as SearchTab)}
                            className="mt-2 block w-full rounded-3xl border border-slate-300 bg-slate-50 px-4 py-3 text-slate-900 focus:border-slate-900 focus:outline-none"
                        >
                            {TABS.map(value => (
                                <option key={value} value={value}>{value}</option>
                            ))}
                        </select>
                    </label>
                </div>
            </div>

            <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
                <h3 className="text-xl font-semibold text-slate-900">Results</h3>
                {loading ? (
                    <div className="mt-4 text-slate-500">Searching…</div>
                ) : !query ? (
                    <div className="mt-4 text-slate-500">Enter a search term to begin.</div>
                ) : tab === 'all' ? (
                    <div className="mt-6 grid gap-6">
                        {['users', 'skills', 'projects', 'teams', 'categories'].map(category => (
                            <div key={category}>
                                <div className="mb-4 text-sm font-semibold uppercase tracking-[0.3em] text-slate-500">{category}</div>
                                {Array.isArray(results[category]) && results[category].length > 0 ? (
                                    <div className="grid gap-3">
                                        {results[category].map((item: any) => {
                                            const to = getItemLink(category, item)
                                            const content = (
                                                <>
                                                    <div className="font-semibold text-slate-900">{item.name || item.email || 'Result'}</div>
                                                    <div className="mt-1 text-sm text-slate-600">{item.summary || item.description || item.email || item.category_id || 'Category'}</div>
                                                </>
                                            )
                                            return to ? (
                                                <Link key={item.id || item.name || JSON.stringify(item)} to={to} className="block overflow-hidden rounded-3xl border border-slate-200 bg-slate-50 p-4 transition hover:border-slate-300 hover:bg-white">
                                                    {content}
                                                </Link>
                                            ) : (
                                                <div key={item.id || item.name || JSON.stringify(item)} className="rounded-3xl border border-slate-200 bg-slate-50 p-4">
                                                    {content}
                                                </div>
                                            )
                                        })}
                                    </div>
                                ) : (
                                    <div className="rounded-3xl bg-slate-50 p-4 text-slate-500">No {category} results.</div>
                                )}
                            </div>
                        ))}
                    </div>
                ) : tabResults.length === 0 ? (
                    <div className="mt-4 text-slate-500">No results found.</div>
                ) : (
                    <div className="mt-4 grid gap-3">
                        {tabResults.map((item: any) => {
                            const to = getItemLink(tab, item)
                            const content = (
                                <>
                                    <div className="font-semibold text-slate-900">{item.name || item.email || 'Result'}</div>
                                    <div className="mt-1 text-sm text-slate-600">{item.summary || item.description || item.email || item.category_id || 'Category'}</div>
                                </>
                            )
                            return to ? (
                                <Link key={item.id || item.name || JSON.stringify(item)} to={to} className="block overflow-hidden rounded-3xl border border-slate-200 bg-slate-50 p-4 transition hover:border-slate-300 hover:bg-white">
                                    {content}
                                </Link>
                            ) : (
                                <div key={item.id || item.name || JSON.stringify(item)} className="rounded-3xl border border-slate-200 bg-slate-50 p-4">
                                    {content}
                                </div>
                            )
                        })}
                    </div>
                )}
            </div>
        </div>
    )
}

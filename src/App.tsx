import React from 'react'
import { BrowserRouter, Routes, Route, NavLink } from 'react-router-dom'
import Home from './pages/Home'
import Users from './pages/Users'
import Skills from './pages/Skills'
import Projects from './pages/Projects'
import ProjectCreate from './pages/ProjectCreate'
import UserDetail from './pages/UserDetail'
import SkillDetail from './pages/SkillDetail'
import Teams from './pages/Teams'
import TeamDetail from './pages/TeamDetail'
import Search from './pages/Search'
import Categories from './pages/Categories'
import ProjectDetail from './pages/ProjectDetail'

export default function App() {
    return (
        <BrowserRouter>
            <div className="min-h-screen bg-slate-50">
                <header className="sticky top-0 z-20 border-b border-slate-200 bg-white/90 backdrop-blur-xl shadow-sm">
                    <div className="max-w-6xl mx-auto px-4 py-4 flex flex-wrap items-center justify-between gap-4">
                        <div className="flex items-center gap-3">
                            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-900 text-white shadow">
                                <span className="text-lg font-semibold">S</span>
                            </div>
                            <div>
                                <div className="text-xl font-bold tracking-tight text-slate-900">Skills App</div>
                                <div className="text-sm text-slate-500">Team skills, projects, and matching in one beautiful workspace.</div>
                            </div>
                        </div>
                        <nav className="flex flex-wrap gap-2">
                            <NavLink to="/" className={({ isActive }) => `rounded-full px-4 py-2 text-sm transition ${isActive ? 'bg-slate-900 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`} end>Home</NavLink>
                            <NavLink to="/projects" className={({ isActive }) => `rounded-full px-4 py-2 text-sm transition ${isActive ? 'bg-slate-900 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}>Projects</NavLink>
                            <NavLink to="/teams" className={({ isActive }) => `rounded-full px-4 py-2 text-sm transition ${isActive ? 'bg-slate-900 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}>Teams</NavLink>
                            <NavLink to="/users" className={({ isActive }) => `rounded-full px-4 py-2 text-sm transition ${isActive ? 'bg-slate-900 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}>Users</NavLink>
                            <NavLink to="/skills" className={({ isActive }) => `rounded-full px-4 py-2 text-sm transition ${isActive ? 'bg-slate-900 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}>Skills</NavLink>
                            <NavLink to="/categories" className={({ isActive }) => `rounded-full px-4 py-2 text-sm transition ${isActive ? 'bg-slate-900 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}>Categories</NavLink>
                            <NavLink to="/search" className={({ isActive }) => `rounded-full px-4 py-2 text-sm transition ${isActive ? 'bg-slate-900 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}>Search</NavLink>
                        </nav>
                    </div>
                </header>

                <main className="max-w-6xl mx-auto p-4">
                    <Routes>
                        <Route path="/" element={<Home />} />
                        <Route path="/projects" element={<Projects />} />
                        <Route path="/projects/create" element={<ProjectCreate />} />
                        <Route path="/teams" element={<Teams />} />
                        <Route path="/teams/:id" element={<TeamDetail />} />
                        <Route path="/users" element={<Users />} />
                        <Route path="/users/:id" element={<UserDetail />} />
                        <Route path="/skills" element={<Skills />} />
                        <Route path="/categories" element={<Categories />} />
                        <Route path="/projects/:id" element={<ProjectDetail />} />
                        <Route path="/skills/:id" element={<SkillDetail />} />
                        <Route path="/search" element={<Search />} />
                    </Routes>
                </main>
            </div>
        </BrowserRouter>
    )
}

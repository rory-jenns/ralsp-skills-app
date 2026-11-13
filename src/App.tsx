import React, { useState } from 'react'
import { BrowserRouter, Routes, Route, NavLink } from 'react-router-dom'
import Home from './pages/Home'
import Skills from './pages/Skills'
import SkillDetail from './pages/SkillDetail'
import Categories from './pages/Categories'
import Login from './pages/Login'
import SignUp from './pages/SignUp'
import MySkills from './pages/MySkills'
import { AuthProvider, useAuth } from './auth'


import Users from './pages/manager/Users'
import Projects from './pages/manager/Projects'
import ProjectCreate from './pages/manager/ProjectCreate'
import UserDetail from './pages/manager/UserDetail'
import Teams from './pages/manager/Teams'
import TeamDetail from './pages/manager/TeamDetail'
import Search from './pages/manager/Search'
import ProjectDetail from './pages/manager/ProjectDetail'

export default function App() {
    function Header() {
        const auth = useAuth()
        const [menuOpen, setMenuOpen] = useState(false)

        const NavLinks = ({ onClick }: { onClick?: () => void }) => (
            <>
                {[
                    ['/', 'Home'],
                    ['/register', 'SignUp'],
                    ['/my-skills', 'MySkills'],
                    ['/projects', 'Projects'],
                    ['/teams', 'Teams'],
                    ['/users', 'Users'],
                    ['/skills', 'Skills'],
                    ['/categories', 'Categories'],
                    ['/search', 'Search'],
                ].map(([to, label]) => (
                    <NavLink
                        key={to}
                        to={String(to)}
                        onClick={onClick}
                        className={({ isActive }) => `px-3 py-2 rounded-md text-sm font-medium transition ${isActive ? 'bg-slate-900 text-white' : 'text-slate-700 hover:bg-slate-100'}`}
                    >{String(label)}</NavLink>
                ))}
            </>
        )

        return (
            <header className="sticky top-0 z-20 border-b border-slate-200 bg-white/90 backdrop-blur-xl shadow-sm">
                <div className="max-w-6xl mx-auto px-4 py-4 flex items-center gap-4">
                    <div className="flex items-center gap-3">
                        <div title="Skills App — Link teams, projects, skills, and people within one simple app." role="img" aria-label="Skills App" className="relative h-10 w-10 flex items-center justify-center rounded-lg bg-gradient-to-br from-slate-800 to-slate-600 text-white shadow">
                            <div className="absolute top-1 -translate-y-1/2 px-2 py-0.5 text-[10px] font-bold text-white rounded-md bg-slate-700/60 uppercase tracking-widest">skills</div>
                            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" className="h-5 w-5 mt-1" fill="none" stroke="currentColor" aria-hidden>
                                <rect x="3" y="11" width="3" height="10" rx="0.5" fill="currentColor" />
                                <rect x="10.5" y="7" width="3" height="14" rx="0.5" fill="currentColor" />
                                <rect x="18" y="3" width="3" height="18" rx="0.5" fill="currentColor" />
                            </svg>
                        </div>
                    </div>

                    <div className="flex items-center gap-4 flex-1">
                        <nav className="hidden md:flex flex-1 justify-center gap-3 items-center">
                            <NavLinks />
                        </nav>

                        <button onClick={() => setMenuOpen(v => !v)} aria-expanded={menuOpen} aria-label="Toggle menu" className="md:hidden p-2 rounded-lg text-slate-700 hover:bg-slate-100">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={menuOpen ? "M6 18L18 6M6 6l12 12" : "M4 6h16M4 12h16M4 18h16"} />
                            </svg>
                        </button>

                        <div className="ml-auto flex items-center gap-4">
                            {auth.user ? (
                                <div className="flex items-center gap-3">
                                    <div className="h-9 w-9 flex items-center justify-center rounded-full bg-slate-900 text-white text-sm font-semibold">
                                        {auth.user.name ? auth.user.name.split(' ').map(n => n[0]).slice(0, 2).join('').toUpperCase() : 'U'}
                                    </div>
                                    <div className="hidden sm:flex flex-col text-sm leading-tight">
                                        <span className="font-medium text-slate-900">{auth.user.name}</span>
                                        {auth.user.role === 'admin' && <span className="text-xs text-yellow-800">Admin</span>}
                                    </div>
                                    <button onClick={() => auth.logout()} className="ml-2 rounded-md bg-red-600 px-3 py-1 text-sm text-white hover:bg-red-700 transition">Sign out</button>
                                </div>
                            ) : (
                                <NavLink to="/login" className="rounded-md px-3 py-2 text-sm bg-slate-100 text-slate-700 hover:bg-slate-50">Sign in</NavLink>
                            )}
                        </div>
                    </div>

                    {menuOpen && (
                        <div className="md:hidden border-t border-slate-200 bg-white px-4 pb-4 pt-3 w-full">
                            <nav className="flex flex-col gap-2">
                                <NavLinks onClick={() => setMenuOpen(false)} />
                            </nav>
                        </div>
                    )}
                </div>
            </header>
        )
    }

    return (
        <AuthProvider>
            <BrowserRouter>
                <div className="min-h-screen bg-slate-50">
                    <Header />

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
                            <Route path="/login" element={<Login />} />
                            <Route path="/register" element={<SignUp />} />
                            <Route path="/my-skills" element={<MySkills />} />
                        </Routes>
                    </main>
                </div>
            </BrowserRouter>
        </AuthProvider>
    )
}

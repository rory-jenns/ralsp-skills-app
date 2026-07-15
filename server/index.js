const path = require('path')
const express = require('express')
const cors = require('cors')
const { Low } = require('lowdb')
const { JSONFile } = require('lowdb/node')
const { nanoid } = require('nanoid')
const bcrypt = require('bcryptjs')
const jwt = require('jsonwebtoken')
require('dotenv').config()

const JWT_SECRET = process.env.JWT_SECRET || 'dev-secret'

const app = express()
const FRONTEND_ORIGIN = process.env.FRONTEND_ORIGIN || 'http://localhost:5173'
app.use(cors({ origin: FRONTEND_ORIGIN }))
app.use(express.json())

const file = path.resolve(__dirname, 'db.json')
console.log('Using DB file:', file)
const adapter = new JSONFile(file)
const db = new Low(adapter)

async function init() {
    await db.read()
    const empty = !db.data || Object.keys(db.data).length === 0
    db.data ||= { teams: [], users: [], categories: [], skills: [], user_skills: [], projects: [] }
    if (empty) {
        console.log('DB file was empty or missing; initializing default data structure')
        await db.write()
    } else {
        console.log('DB file loaded successfully, entries:', {
            teams: db.data.teams.length,
            users: db.data.users.length,
            categories: db.data.categories.length,
            skills: db.data.skills.length,
            projects: db.data.projects.length
        })
    }
}

init()

// Restrict API access so only the frontend app (or XHR requests) can call it.
function requireAppAccess(req, res, next) {
    const origin = (req.get('origin') || req.get('referer') || '')
    if (origin && origin.includes(FRONTEND_ORIGIN)) return next()
    if ((req.get('x-requested-with') || '').toLowerCase() === 'xmlhttprequest') return next()
    return res.status(403).json({ error: 'Forbidden: API accessible only via the web app' })
}

app.use('/api', requireAppAccess)

function id(len = 8) {
    return nanoid(len)
}

// deep equality check for duplicate detection
function deepEqual(a, b) {
    if (a === b) return true
    if (a && b && typeof a === 'object' && typeof b === 'object') {
        if (Array.isArray(a) !== Array.isArray(b)) return false
        if (Array.isArray(a)) {
            if (a.length !== b.length) return false
            for (let i = 0; i < a.length; i++) if (!deepEqual(a[i], b[i])) return false
            return true
        }
        const keysA = Object.keys(a).filter(k => k !== 'id' && k !== 'created_at' && k !== 'updated_at')
        const keysB = Object.keys(b).filter(k => k !== 'id' && k !== 'created_at' && k !== 'updated_at')
        if (keysA.length !== keysB.length) return false
        keysA.sort(); keysB.sort()
        for (let i = 0; i < keysA.length; i++) if (keysA[i] !== keysB[i]) return false
        for (const k of keysA) if (!deepEqual(a[k], b[k])) return false
        return true
    }
    return false
}

function isExactDuplicate(collection, candidate) {
    return collection.some(item => deepEqual(item, candidate))
}

// Authentication middleware
async function getUserFromPayload(payload) {
    await db.read()
    if (!payload || !payload.id) return null
    return db.data.users.find(u => u.id === payload.id) || null
}

function isAuthenticated(req, res, next) {
    const auth = (req.headers.authorization || '').split(' ')
    if (auth[0] !== 'Bearer' || !auth[1]) return res.status(401).json({ error: 'Missing token' })
    try {
        const payload = jwt.verify(auth[1], JWT_SECRET)
        req.userPayload = payload
        return getUserFromPayload(payload).then(user => {
            if (!user) return res.status(401).json({ error: 'Invalid token user' })
            req.user = user
            next()
        }).catch(err => res.status(500).json({ error: 'Server error' }))
    } catch (err) {
        return res.status(401).json({ error: 'Invalid token' })
    }
}

function isOwnerOrAdmin(getResource) {
    return async (req, res, next) => {
        await db.read()
        const resource = getResource(req, db)
        if (!resource) return res.status(404).json({ error: 'Resource not found' })
        if (req.user.role === 'admin' || resource.owner_id === req.user.id) return next()
        return res.status(403).json({ error: 'Forbidden' })
    }
}

// Auth endpoints
app.post('/api/auth/register', async (req, res) => {
    await db.read()
    const { name, email, password, team_id } = req.body
    if (!email || !password) return res.status(400).json({ error: 'email and password required' })
    if (db.data.users.find(u => u.email === email)) return res.status(409).json({ error: 'User exists' })
    const hash = bcrypt.hashSync(password, 10)
    const user = { id: id(), name, email, team_id: team_id || null, password_hash: hash, role: 'user', created_at: new Date().toISOString(), updated_at: new Date().toISOString() }
    db.data.users.push(user)
    await db.write()
    const token = jwt.sign({ id: user.id, email: user.email, role: user.role }, JWT_SECRET)
    res.status(201).json({ user: { id: user.id, name: user.name, email: user.email, role: user.role }, token })
})

app.post('/api/auth/login', async (req, res) => {
    await db.read()
    const { email, password } = req.body
    const user = db.data.users.find(u => u.email === email)
    if (!user || !user.password_hash) return res.status(401).json({ error: 'Invalid credentials' })
    const ok = bcrypt.compareSync(password, user.password_hash)
    if (!ok) return res.status(401).json({ error: 'Invalid credentials' })
    const token = jwt.sign({ id: user.id, email: user.email, role: user.role }, JWT_SECRET)
    res.json({ token, user: { id: user.id, name: user.name, email: user.email, role: user.role } })
})

app.get('/api/auth/me', isAuthenticated, async (req, res) => {
    res.json({ id: req.user.id, name: req.user.name, email: req.user.email, role: req.user.role })
})

// Teams
app.get('/api/teams', async (req, res) => {
    await db.read()
    res.json(db.data.teams)
})

app.get('/api/teams/:id', async (req, res) => {
    await db.read()
    const team = db.data.teams.find(t => t.id === req.params.id)
    if (!team) return res.status(404).json({ error: 'Team not found' })
    res.json(team)
})

app.post('/api/teams', async (req, res) => {
    // only authenticated users can create teams
    await isAuthenticated(req, res, async () => {
        await db.read()
        const team = { id: id(), owner_id: req.user.id, created_at: new Date().toISOString(), updated_at: new Date().toISOString(), ...req.body }
        if (isExactDuplicate(db.data.teams, team)) return res.status(409).json({ error: 'Duplicate team' })
        db.data.teams.push(team)
        await db.write()
        res.status(201).json(team)
    })
})

// Users
app.get('/api/users', async (req, res) => {
    await db.read()
    let results = db.data.users
    if (req.query.team_id) {
        results = results.filter(u => u.team_id === req.query.team_id)
    }
    res.json(results)
})

app.post('/api/users', async (req, res) => {
    // only admin users may create users via this endpoint; public registration uses /api/auth/register
    await isAuthenticated(req, res, async () => {
        if (req.user.role !== 'admin') return res.status(403).json({ error: 'Forbidden' })
        await db.read()
        const { password, role, ...rest } = req.body
        if (rest.email && db.data.users.find(u => u.email === rest.email)) return res.status(409).json({ error: 'User exists' })
        const password_hash = password ? bcrypt.hashSync(password, 10) : null
        const user = { id: id(), password_hash, role: role || 'user', created_at: new Date().toISOString(), updated_at: new Date().toISOString(), ...rest }
        if (isExactDuplicate(db.data.users, user)) return res.status(409).json({ error: 'Duplicate user' })
        db.data.users.push(user)
        await db.write()
        res.status(201).json({ id: user.id, name: user.name, email: user.email, role: user.role })
    })
})

app.get('/api/users/:id', async (req, res) => {
    await db.read()
    const user = db.data.users.find(u => u.id === req.params.id)
    if (!user) return res.status(404).json({ error: 'User not found' })
    res.json(user)
})

app.put('/api/users/:id', async (req, res) => {
    // only the user themselves or an admin can update a user
    await isAuthenticated(req, res, async () => {
        await db.read()
        const idx = db.data.users.findIndex(u => u.id === req.params.id)
        if (idx === -1) return res.status(404).json({ error: 'User not found' })
        if (req.user.role !== 'admin' && req.user.id !== req.params.id) return res.status(403).json({ error: 'Forbidden' })
        const updates = { ...req.body }
        if (updates.password) {
            updates.password_hash = bcrypt.hashSync(updates.password, 10)
            delete updates.password
        }
        db.data.users[idx] = { ...db.data.users[idx], ...updates, updated_at: new Date().toISOString() }
        await db.write()
        const u = db.data.users[idx]
        res.json({ id: u.id, name: u.name, email: u.email, role: u.role })
    })
})

// Skills
app.get('/api/skills', async (req, res) => {
    await db.read()
    const q = (req.query.q || '').toLowerCase()
    let results = db.data.skills
    if (req.query.category_id) {
        results = results.filter(s => s.category_id === req.query.category_id)
    }
    if (q) {
        results = results.filter(s => s.name.toLowerCase().includes(q) || (s.tags || []).some(t => t.toLowerCase().includes(q)))
    }
    res.json(results)
})

app.post('/api/skills', async (req, res) => {
    // authenticated users can create skills; owner_id set to creator
    await isAuthenticated(req, res, async () => {
        await db.read()
        const skill = { id: id(), owner_id: req.user.id, created_at: new Date().toISOString(), updated_at: new Date().toISOString(), ...req.body }
        if (isExactDuplicate(db.data.skills, skill)) return res.status(409).json({ error: 'Duplicate skill' })
        db.data.skills.push(skill)
        await db.write()
        res.status(201).json(skill)
    })
})

app.get('/api/skills/:id', async (req, res) => {
    await db.read()
    const skill = db.data.skills.find(s => s.id === req.params.id)
    if (!skill) return res.status(404).json({ error: 'Skill not found' })
    res.json(skill)
})

app.put('/api/skills/:id', async (req, res) => {
    await isAuthenticated(req, res, async () => {
        await db.read()
        const idx = db.data.skills.findIndex(s => s.id === req.params.id)
        if (idx === -1) return res.status(404).json({ error: 'Skill not found' })
        const skill = db.data.skills[idx]
        if (req.user.role !== 'admin' && skill.owner_id !== req.user.id) return res.status(403).json({ error: 'Forbidden' })
        db.data.skills[idx] = { ...skill, ...req.body, updated_at: new Date().toISOString() }
        await db.write()
        res.json(db.data.skills[idx])
    })
})

// Projects
app.get('/api/projects', async (req, res) => {
    await db.read()
    res.json(db.data.projects)
})

app.post('/api/projects', async (req, res) => {
    // authenticated users can create projects; owner_id set to creator
    await isAuthenticated(req, res, async () => {
        await db.read()
        const project = { id: id(), owner_id: req.user.id, created_at: new Date().toISOString(), updated_at: new Date().toISOString(), ...req.body }
        if (isExactDuplicate(db.data.projects, project)) return res.status(409).json({ error: 'Duplicate project' })
        db.data.projects.push(project)
        await db.write()
        res.status(201).json(project)
    })
})

app.get('/api/projects/:id', async (req, res) => {
    await db.read()
    const project = db.data.projects.find(p => p.id === req.params.id)
    if (!project) return res.status(404).json({ error: 'Project not found' })
    res.json(project)
})

app.put('/api/projects/:id', async (req, res) => {
    await isAuthenticated(req, res, async () => {
        await db.read()
        const idx = db.data.projects.findIndex(p => p.id === req.params.id)
        if (idx === -1) return res.status(404).json({ error: 'Project not found' })
        const project = db.data.projects[idx]
        if (req.user.role !== 'admin' && project.owner_id !== req.user.id) return res.status(403).json({ error: 'Forbidden' })
        db.data.projects[idx] = { ...project, ...req.body, updated_at: new Date().toISOString() }
        await db.write()
        res.json(db.data.projects[idx])
    })
})

// Categories
app.get('/api/categories', async (req, res) => {
    await db.read()
    res.json(db.data.categories)
})

app.post('/api/categories', async (req, res) => {
    await isAuthenticated(req, res, async () => {
        await db.read()
        const category = { id: id(), owner_id: req.user.id, created_at: new Date().toISOString(), updated_at: new Date().toISOString(), ...req.body }
        if (isExactDuplicate(db.data.categories, category)) return res.status(409).json({ error: 'Duplicate category' })
        db.data.categories.push(category)
        await db.write()
        res.status(201).json(category)
    })
})

// Add a user skill
app.post('/api/users/:id/skills', async (req, res) => {
    // only the user themselves or an admin can add user skills
    await isAuthenticated(req, res, async () => {
        const userId = req.params.id
        if (req.user.role !== 'admin' && req.user.id !== userId) return res.status(403).json({ error: 'Forbidden' })
        await db.read()
        const { skill_id, level } = req.body
        const entry = { id: id(), user_id: userId, skill_id, level }
        if (isExactDuplicate(db.data.user_skills, entry)) return res.status(409).json({ error: 'User skill already exists, so taking no action' })
        db.data.user_skills.push(entry)
        await db.write()
        res.json(entry)
    })
})

// Matching endpoint: naive scoring based on levels
const LEVELS = { beginner: 1, intermediate: 2, advanced: 3, expert: 4 }
app.post('/api/projects/:id/match', async (req, res) => {
    await db.read()
    const project = db.data.projects.find(p => p.id === req.params.id)
    if (!project) return res.status(404).json({ error: 'Project not found' })
    const skillMap = Object.fromEntries(db.data.skills.map(skill => [skill.id, skill.name]))
    const matches = db.data.users.map(u => {
        const userSkills = db.data.user_skills.filter(us => us.user_id === u.id)
        let score = 0
        let matched = 0
        const matched_skills = []
        for (const reqSkill of project.required_skills || []) {
            const us = userSkills.find(s => s.skill_id === reqSkill.skill_id)
            if (us) {
                matched++
                matched_skills.push({
                    skill_id: reqSkill.skill_id,
                    skill_name: skillMap[reqSkill.skill_id] || reqSkill.skill_id,
                    min_level: reqSkill.min_level,
                    user_level: us.level
                })
                score += Math.max(0, LEVELS[us.level] - LEVELS[reqSkill.min_level] + 1)
            }
        }
        return { user: u, matched, score, matched_skills }
    })
    matches.sort((a, b) => b.score - a.score || b.matched - a.matched)
    res.json(matches.filter(m => m.score > 0))
})

// Import seed
app.post('/api/import', async (req, res) => {
    // admin-only import
    await isAuthenticated(req, res, async () => {
        if (req.user.role !== 'admin') return res.status(403).json({ error: 'Forbidden' })
        await db.read()
        const data = req.body
        for (const k of Object.keys(data)) {
            if (!db.data[k] || db.data[k].length === 0) db.data[k] = data[k]
        }
        await db.write()
        res.json({ ok: true })
    })
})

app.get('/api/users/:id/skills', async (req, res) => {
    await db.read()
    const result = db.data.user_skills.filter(us => us.user_id === req.params.id)
    res.json(result)
})

app.get('/api/user-skills', async (req, res) => {
    await db.read()
    let entries = db.data.user_skills
    if (req.query.user_id) {
        entries = entries.filter(us => us.user_id === req.query.user_id)
    }
    if (req.query.skill_id) {
        entries = entries.filter(us => us.skill_id === req.query.skill_id)
    }
    res.json(entries)
})

app.get('/api/search', async (req, res) => {
    await db.read()
    const q = (req.query.q || '').toLowerCase()
    const type = req.query.type || 'all'
    const categoryNameById = Object.fromEntries(db.data.categories.map(c => [c.id, (c.name || '').toLowerCase()]))
    const results = {
        users: db.data.users.filter(u => u.name.toLowerCase().includes(q) || (u.email || '').toLowerCase().includes(q)),
        skills: db.data.skills.filter(s =>
            s.name.toLowerCase().includes(q) ||
            (s.tags || []).some(t => t.toLowerCase().includes(q)) ||
            (categoryNameById[s.category_id] || '').includes(q)
        ),
        projects: db.data.projects.filter(p => p.name.toLowerCase().includes(q) || (p.summary || '').toLowerCase().includes(q)),
        teams: db.data.teams.filter(t => t.name.toLowerCase().includes(q) || (t.description || '').toLowerCase().includes(q)),
        categories: db.data.categories.filter(c => c.name.toLowerCase().includes(q))
    }
    if (type === 'all') {
        return res.json(results)
    }
    res.json(results[type] || [])
})

// Delete endpoints (owner or admin)
app.delete('/api/teams/:id', async (req, res) => {
    await isAuthenticated(req, res, async () => {
        await isOwnerOrAdmin((req, db) => db.data.teams.find(t => t.id === req.params.id))(req, res, async () => {
            await db.read()
            const idx = db.data.teams.findIndex(t => t.id === req.params.id)
            if (idx === -1) return res.status(404).json({ error: 'Team not found' })
            db.data.teams.splice(idx, 1)
            await db.write()
            res.json({ ok: true })
        })
    })
})

app.delete('/api/users/:id', async (req, res) => {
    await isAuthenticated(req, res, async () => {
        await isOwnerOrAdmin((req, db) => db.data.users.find(u => u.id === req.params.id))(req, res, async () => {
            await db.read()
            const idx = db.data.users.findIndex(u => u.id === req.params.id)
            if (idx === -1) return res.status(404).json({ error: 'User not found' })
            db.data.users.splice(idx, 1)
            await db.write()
            res.json({ ok: true })
        })
    })
})

app.delete('/api/skills/:id', async (req, res) => {
    await isAuthenticated(req, res, async () => {
        await isOwnerOrAdmin((req, db) => db.data.skills.find(s => s.id === req.params.id))(req, res, async () => {
            await db.read()
            const idx = db.data.skills.findIndex(s => s.id === req.params.id)
            if (idx === -1) return res.status(404).json({ error: 'Skill not found' })
            db.data.skills.splice(idx, 1)
            await db.write()
            res.json({ ok: true })
        })
    })
})

app.delete('/api/projects/:id', async (req, res) => {
    await isAuthenticated(req, res, async () => {
        await isOwnerOrAdmin((req, db) => db.data.projects.find(p => p.id === req.params.id))(req, res, async () => {
            await db.read()
            const idx = db.data.projects.findIndex(p => p.id === req.params.id)
            if (idx === -1) return res.status(404).json({ error: 'Project not found' })
            db.data.projects.splice(idx, 1)
            await db.write()
            res.json({ ok: true })
        })
    })
})

app.delete('/api/categories/:id', async (req, res) => {
    await isAuthenticated(req, res, async () => {
        await isOwnerOrAdmin((req, db) => db.data.categories.find(c => c.id === req.params.id))(req, res, async () => {
            await db.read()
            const idx = db.data.categories.findIndex(c => c.id === req.params.id)
            if (idx === -1) return res.status(404).json({ error: 'Category not found' })
            db.data.categories.splice(idx, 1)
            await db.write()
            res.json({ ok: true })
        })
    })
})

// Delete a user_skill entry (owner or admin)
app.delete('/api/user-skills/:id', async (req, res) => {
    await isAuthenticated(req, res, async () => {
        await db.read()
        const idx = db.data.user_skills.findIndex(us => us.id === req.params.id)
        if (idx === -1) return res.status(404).json({ error: 'User skill entry not found' })
        const entry = db.data.user_skills[idx]
        if (req.user.role !== 'admin' && entry.user_id !== req.user.id) return res.status(403).json({ error: 'Forbidden' })
        db.data.user_skills.splice(idx, 1)
        await db.write()
        res.json({ ok: true })
    })
})

const PORT = process.env.PORT || 4000
app.listen(PORT, () => console.log('API listening on', PORT))

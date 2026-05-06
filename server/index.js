const path = require('path')
const express = require('express')
const cors = require('cors')
const { Low } = require('lowdb')
const { JSONFile } = require('lowdb/node')
const { nanoid } = require('nanoid')

const app = express()
app.use(cors())
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

function id(len = 8) {
    return nanoid(len)
}

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
    await db.read()
    const existing = db.data.teams.find(t => t.name === req.body.name)
    if (existing) return res.status(409).json({ error: 'Team already exists' })
    const team = { id: id(), created_at: new Date().toISOString(), updated_at: new Date().toISOString(), ...req.body }
    db.data.teams.push(team)
    await db.write()
    res.status(201).json(team)
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
    await db.read()
    const user = { id: id(), created_at: new Date().toISOString(), updated_at: new Date().toISOString(), ...req.body }
    db.data.users.push(user)
    await db.write()
    res.status(201).json(user)
})

app.get('/api/users/:id', async (req, res) => {
    await db.read()
    const user = db.data.users.find(u => u.id === req.params.id)
    if (!user) return res.status(404).json({ error: 'User not found' })
    res.json(user)
})

app.put('/api/users/:id', async (req, res) => {
    await db.read()
    const idx = db.data.users.findIndex(u => u.id === req.params.id)
    if (idx === -1) return res.status(404).json({ error: 'User not found' })
    db.data.users[idx] = { ...db.data.users[idx], ...req.body, updated_at: new Date().toISOString() }
    await db.write()
    res.json(db.data.users[idx])
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
    await db.read()
    const existing = db.data.skills.find(s => s.name === req.body.name && s.category_id === req.body.category_id)
    if (existing) return res.status(409).json({ error: 'Skill already exists in category' })
    const skill = { id: id(), created_at: new Date().toISOString(), updated_at: new Date().toISOString(), ...req.body }
    db.data.skills.push(skill)
    await db.write()
    res.status(201).json(skill)
})

app.get('/api/skills/:id', async (req, res) => {
    await db.read()
    const skill = db.data.skills.find(s => s.id === req.params.id)
    if (!skill) return res.status(404).json({ error: 'Skill not found' })
    res.json(skill)
})

app.put('/api/skills/:id', async (req, res) => {
    await db.read()
    const idx = db.data.skills.findIndex(s => s.id === req.params.id)
    if (idx === -1) return res.status(404).json({ error: 'Skill not found' })
    db.data.skills[idx] = { ...db.data.skills[idx], ...req.body, updated_at: new Date().toISOString() }
    await db.write()
    res.json(db.data.skills[idx])
})

// Projects
app.get('/api/projects', async (req, res) => {
    await db.read()
    res.json(db.data.projects)
})

app.post('/api/projects', async (req, res) => {
    await db.read()
    const project = { id: id(), created_at: new Date().toISOString(), updated_at: new Date().toISOString(), ...req.body }
    db.data.projects.push(project)
    await db.write()
    res.status(201).json(project)
})

app.get('/api/projects/:id', async (req, res) => {
    await db.read()
    const project = db.data.projects.find(p => p.id === req.params.id)
    if (!project) return res.status(404).json({ error: 'Project not found' })
    res.json(project)
})

app.put('/api/projects/:id', async (req, res) => {
    await db.read()
    const idx = db.data.projects.findIndex(p => p.id === req.params.id)
    if (idx === -1) return res.status(404).json({ error: 'Project not found' })
    db.data.projects[idx] = { ...db.data.projects[idx], ...req.body, updated_at: new Date().toISOString() }
    await db.write()
    res.json(db.data.projects[idx])
})

// Categories
app.get('/api/categories', async (req, res) => {
    await db.read()
    res.json(db.data.categories)
})

app.post('/api/categories', async (req, res) => {
    await db.read()
    const existing = db.data.categories.find(c => c.name === req.body.name)
    if (existing) return res.status(409).json({ error: 'Category already exists' })
    const category = { id: id(), created_at: new Date().toISOString(), updated_at: new Date().toISOString(), ...req.body }
    db.data.categories.push(category)
    await db.write()
    res.status(201).json(category)
})

// Add a user skill
app.post('/api/users/:id/skills', async (req, res) => {
    await db.read()
    const userId = req.params.id
    const { skill_id, level } = req.body
    const entry = { id: id(), user_id: userId, skill_id, level }
    db.data.user_skills.push(entry)
    await db.write()
    res.json(entry)
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
    await db.read()
    const data = req.body
    for (const k of Object.keys(data)) {
        if (!db.data[k] || db.data[k].length === 0) db.data[k] = data[k]
    }
    await db.write()
    res.json({ ok: true })
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

const PORT = process.env.PORT || 4000
app.listen(PORT, () => console.log('API listening on', PORT))

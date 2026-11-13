require('dotenv').config()
const express = require('express')
const cors = require('cors')
const bcrypt = require('bcryptjs')
const jwt = require('jsonwebtoken')
const { pool, initSchema, newId } = require('./db')

const JWT_SECRET = process.env.JWT_SECRET
if (!JWT_SECRET) {
    console.error('JWT_SECRET is not set')
    process.exit(1)
}

const PORT = process.env.PORT || 4000
const FRONTEND_ORIGIN = process.env.FRONTEND_ORIGIN || 'http://localhost:5173'
const LEVEL_RANK = { beginner: 1, intermediate: 2, advanced: 3, expert: 4 }

// Columns that are safe to send to clients. password_hash is never included.
const USER_COLS = 'id, name, email, role, team_id, created_at, updated_at'

const app = express()
app.use(cors({ origin: FRONTEND_ORIGIN }))
app.use(express.json())

// Same origin check as before. This is not authentication: any client can set these headers.
function requireAppAccess(req, res, next) {
    const origin = (req.get('origin') || req.get('referer') || '')
    if (origin && origin.includes(FRONTEND_ORIGIN)) return next()
    if ((req.get('x-requested-with') || '').toLowerCase() === 'xmlhttprequest') return next()
    return res.status(403).json({ error: 'Forbidden: API accessible only via the web app' })
}
app.use('/api', requireAppAccess)

// ---------- helpers ----------

// Wraps async handlers so errors reach the error handler (Express 4 doesn't do this itself)
const h = fn => (req, res, next) => Promise.resolve(fn(req, res, next)).catch(next)

const signToken = user => jwt.sign({ id: user.id, email: user.email, role: user.role }, JWT_SECRET)
const publicUser = ({ password_hash, ...rest }) => rest
const canEdit = (user, row) => user.role === 'admin' || row.owner_id === user.id
const likePattern = q => `%${String(q).replace(/[\\%_]/g, c => '\\' + c)}%`

async function listAll(table) {
    const { rows } = await pool.query(`SELECT * FROM ${table} ORDER BY created_at, id`)
    return rows
}

async function getRow(table, id) {
    const { rows } = await pool.query(`SELECT * FROM ${table} WHERE id = $1`, [id])
    return rows[0] || null
}

async function insertRow(table, data) {
    const cols = Object.keys(data)
    const sql = `INSERT INTO ${table} (${cols.join(', ')}) VALUES (${cols.map((_, i) => `$${i + 1}`).join(', ')}) RETURNING *`
    const { rows } = await pool.query(sql, Object.values(data))
    return rows[0]
}

async function updateRow(table, id, changes) {
    const cols = Object.keys(changes)
    if (cols.length === 0) return getRow(table, id)
    const sets = cols.map((c, i) => `${c} = $${i + 2}`).join(', ')
    const { rows } = await pool.query(
        `UPDATE ${table} SET ${sets}, updated_at = now() WHERE id = $1 RETURNING *`,
        [id, ...Object.values(changes)]
    )
    return rows[0] || null
}

// Only whitelisted fields from the request body reach the database.
const EDITABLE = {
    teams: ['name', 'description'],
    categories: ['name'],
    skills: ['name', 'category_id', 'tags'],
    projects: ['name', 'summary', 'owner_team_id', 'status', 'required_skills'],
}

function editable(table, body) {
    const out = {}
    for (const f of EDITABLE[table]) {
        if (body[f] === undefined) continue
        let v = body[f]
        if (v === '' && f.endsWith('_id')) v = null
        if (f === 'tags') v = Array.isArray(v) ? v : []
        if (f === 'required_skills') v = JSON.stringify(Array.isArray(v) ? v : [])
        out[f] = v
    }
    return out
}

async function requireAuth(req, res, next) {
    const [scheme, token] = (req.headers.authorization || '').split(' ')
    if (scheme !== 'Bearer' || !token) return res.status(401).json({ error: 'Missing token' })
    let payload
    try {
        payload = jwt.verify(token, JWT_SECRET)
    } catch {
        return res.status(401).json({ error: 'Invalid token' })
    }
    try {
        const { rows } = await pool.query(`SELECT ${USER_COLS} FROM users WHERE id = $1`, [payload.id])
        if (!rows[0]) return res.status(401).json({ error: 'Invalid token user' })
        req.user = rows[0]
        next()
    } catch (err) {
        next(err)
    }
}

function getOne(table, label) {
    return h(async (req, res) => {
        const row = await getRow(table, req.params.id)
        if (!row) return res.status(404).json({ error: `${label} not found` })
        res.json(row)
    })
}

function createOwned(table) {
    return [requireAuth, h(async (req, res) => {
        const data = editable(table, req.body)
        if (!data.name) return res.status(400).json({ error: 'name is required' })
        const row = await insertRow(table, { id: newId(), owner_id: req.user.id, ...data })
        res.status(201).json(row)
    })]
}

function updateOwned(table, label) {
    return [requireAuth, h(async (req, res) => {
        const row = await getRow(table, req.params.id)
        if (!row) return res.status(404).json({ error: `${label} not found` })
        if (!canEdit(req.user, row)) return res.status(403).json({ error: 'Forbidden' })
        res.json(await updateRow(table, row.id, editable(table, req.body)))
    })]
}

function deleteOwned(table, label) {
    return [requireAuth, h(async (req, res) => {
        const row = await getRow(table, req.params.id)
        if (!row) return res.status(404).json({ error: `${label} not found` })
        if (!canEdit(req.user, row)) return res.status(403).json({ error: 'Forbidden' })
        await pool.query(`DELETE FROM ${table} WHERE id = $1`, [row.id])
        res.json({ ok: true })
    })]
}

// ---------- auth ----------

app.post('/api/auth/register', h(async (req, res) => {
    const { name, email, password, team_id } = req.body
    if (!email || !password) return res.status(400).json({ error: 'email and password required' })
    const exists = await pool.query('SELECT 1 FROM users WHERE email = $1', [email])
    if (exists.rowCount) return res.status(409).json({ error: 'User exists' })
    const user = await insertRow('users', {
        id: newId(),
        name: name ?? null,
        email,
        team_id: team_id || null,
        password_hash: bcrypt.hashSync(password, 10),
        role: 'user',
    })
    res.status(201).json({ user: publicUser(user), token: signToken(user) })
}))

app.post('/api/auth/login', h(async (req, res) => {
    const { email, password } = req.body
    const { rows } = await pool.query('SELECT * FROM users WHERE email = $1', [email])
    const user = rows[0]
    if (!user || !user.password_hash || !bcrypt.compareSync(password || '', user.password_hash)) {
        return res.status(401).json({ error: 'Invalid credentials' })
    }
    res.json({ token: signToken(user), user: publicUser(user) })
}))

app.get('/api/auth/me', requireAuth, (req, res) => {
    res.json(req.user)
})

// ---------- GitHub SSO ----------

const GITHUB_CLIENT_ID = process.env.GITHUB_CLIENT_ID
const GITHUB_CLIENT_SECRET = process.env.GITHUB_CLIENT_SECRET

app.post('/api/auth/github', h(async (req, res) => {
    const { code } = req.body
    if (!code) return res.status(400).json({ error: 'code required' })
    if (!GITHUB_CLIENT_ID || !GITHUB_CLIENT_SECRET) {
        return res.status(500).json({ error: 'GitHub login is not configured' })
    }

    // 1. Exchange the one-time code for a GitHub access token
    const tokenRes = await fetch('https://github.com/login/oauth/access_token', {
        method: 'POST',
        headers: { Accept: 'application/json', 'Content-Type': 'application/json' },
        body: JSON.stringify({
            client_id: GITHUB_CLIENT_ID,
            client_secret: GITHUB_CLIENT_SECRET,
            code,
        }),
    })
    const { access_token } = await tokenRes.json()
    if (!access_token) return res.status(401).json({ error: 'GitHub login failed' })

    const ghHeaders = {
        Authorization: `Bearer ${access_token}`,
        Accept: 'application/vnd.github+json',
        'User-Agent': 'your-app-name', // GitHub requires a User-Agent
    }

    // 2. Fetch the GitHub profile and emails
    const [profile, emails] = await Promise.all([
        fetch('https://api.github.com/user', { headers: ghHeaders }).then(r => r.json()),
        fetch('https://api.github.com/user/emails', { headers: ghHeaders }).then(r => r.json()),
    ])
    if (!profile.id) return res.status(401).json({ error: 'GitHub profile fetch failed' })

    const email = emails.find(e => e.primary && e.verified)?.email
    if (!email) return res.status(400).json({ error: 'GitHub account has no verified email' })

    const githubId = String(profile.id)

    // 3. Find the user by GitHub id, then by email (links an existing account), else create one
    let user = (await pool.query('SELECT * FROM users WHERE github_id = $1', [githubId])).rows[0]

    if (!user) {
        const byEmail = (await pool.query('SELECT * FROM users WHERE email = $1', [email])).rows[0]
        if (byEmail) {
            user = await updateRow('users', byEmail.id, { github_id: githubId })
        } else {
            user = await insertRow('users', {
                id: newId(),
                name: profile.name || profile.login,
                email,
                role: 'user',
                github_id: githubId,
            })
        }
    }

    // 4. Issue the same JWT as the password login
    res.json({ token: signToken(user), user: publicUser(user) })
}))



// ---------- teams ----------

app.get('/api/teams', h(async (req, res) => res.json(await listAll('teams'))))
app.get('/api/teams/:id', getOne('teams', 'Team'))
app.post('/api/teams', ...createOwned('teams'))
app.delete('/api/teams/:id', ...deleteOwned('teams', 'Team'))

// ---------- users ----------

app.get('/api/users', h(async (req, res) => {
    const { rows } = await pool.query(
        `SELECT ${USER_COLS} FROM users WHERE ($1::text IS NULL OR team_id = $1) ORDER BY created_at, id`,
        [req.query.team_id || null]
    )
    res.json(rows)
}))

app.get('/api/users/:id', h(async (req, res) => {
    const { rows } = await pool.query(`SELECT ${USER_COLS} FROM users WHERE id = $1`, [req.params.id])
    if (!rows[0]) return res.status(404).json({ error: 'User not found' })
    res.json(rows[0])
}))

app.post('/api/users', requireAuth, h(async (req, res) => {
    if (req.user.role !== 'admin') return res.status(403).json({ error: 'Forbidden' })
    const { name, email, password, role, team_id } = req.body
    if (!email) return res.status(400).json({ error: 'email required' })
    const user = await insertRow('users', {
        id: newId(),
        name: name ?? null,
        email,
        role: role === 'admin' ? 'admin' : 'user',
        team_id: team_id || null,
        password_hash: password ? bcrypt.hashSync(password, 10) : null,
    })
    res.status(201).json(publicUser(user))
}))

app.put('/api/users/:id', requireAuth, h(async (req, res) => {
    const isSelf = req.user.id === req.params.id
    if (!isSelf && req.user.role !== 'admin') return res.status(403).json({ error: 'Forbidden' })

    const { name, email, team_id, password, role } = req.body
    if (role !== undefined && req.user.role !== 'admin') {
        return res.status(403).json({ error: 'Only admins can change roles' })
    }

    const changes = {}
    if (name !== undefined) changes.name = name
    if (email !== undefined) changes.email = email
    if (team_id !== undefined) changes.team_id = team_id || null
    if (role !== undefined) changes.role = role === 'admin' ? 'admin' : 'user'
    if (password) changes.password_hash = bcrypt.hashSync(password, 10)

    const user = await updateRow('users', req.params.id, changes)
    if (!user) return res.status(404).json({ error: 'User not found' })
    res.json(publicUser(user))
}))

app.delete('/api/users/:id', requireAuth, h(async (req, res) => {
    if (req.user.role !== 'admin') return res.status(403).json({ error: 'Forbidden' })
    const { rowCount } = await pool.query('DELETE FROM users WHERE id = $1', [req.params.id])
    if (!rowCount) return res.status(404).json({ error: 'User not found' })
    res.json({ ok: true })
}))

// ---------- categories ----------

app.get('/api/categories', h(async (req, res) => res.json(await listAll('categories'))))
app.post('/api/categories', ...createOwned('categories'))
app.delete('/api/categories/:id', ...deleteOwned('categories', 'Category'))

// ---------- skills ----------

app.get('/api/skills', h(async (req, res) => {
    const where = []
    const params = []
    if (req.query.category_id) {
        params.push(req.query.category_id)
        where.push(`category_id = $${params.length}`)
    }
    if (req.query.q) {
        params.push(likePattern(req.query.q))
        const n = params.length
        where.push(`(name ILIKE $${n} OR EXISTS (SELECT 1 FROM unnest(tags) AS t WHERE t ILIKE $${n}))`)
    }
    const whereSql = where.length ? `WHERE ${where.join(' AND ')}` : ''
    const { rows } = await pool.query(`SELECT * FROM skills ${whereSql} ORDER BY created_at, id`, params)
    res.json(rows)
}))

app.get('/api/skills/:id', getOne('skills', 'Skill'))
app.post('/api/skills', ...createOwned('skills'))
app.put('/api/skills/:id', ...updateOwned('skills', 'Skill'))
app.delete('/api/skills/:id', ...deleteOwned('skills', 'Skill'))

// ---------- projects ----------

app.get('/api/projects', h(async (req, res) => res.json(await listAll('projects'))))
app.get('/api/projects/:id', getOne('projects', 'Project'))
app.post('/api/projects', ...createOwned('projects'))
app.put('/api/projects/:id', ...updateOwned('projects', 'Project'))
app.delete('/api/projects/:id', ...deleteOwned('projects', 'Project'))

// Matching: score each user against a project's required skills
app.post('/api/projects/:id/match', h(async (req, res) => {
    const project = await getRow('projects', req.params.id)
    if (!project) return res.status(404).json({ error: 'Project not found' })

    const [skillsRes, usersRes, userSkillsRes] = await Promise.all([
        pool.query('SELECT id, name FROM skills'),
        pool.query(`SELECT ${USER_COLS} FROM users`),
        pool.query('SELECT user_id, skill_id, level FROM user_skills'),
    ])

    const skillName = Object.fromEntries(skillsRes.rows.map(s => [s.id, s.name]))
    const byUser = new Map()
    for (const us of userSkillsRes.rows) {
        if (!byUser.has(us.user_id)) byUser.set(us.user_id, [])
        byUser.get(us.user_id).push(us)
    }

    const matches = usersRes.rows.map(u => {
        const userSkills = byUser.get(u.id) || []
        let score = 0
        let matched = 0
        const matched_skills = []
        for (const need of project.required_skills || []) {
            const us = userSkills.find(s => s.skill_id === need.skill_id)
            if (!us) continue
            matched++
            matched_skills.push({
                skill_id: need.skill_id,
                skill_name: skillName[need.skill_id] || need.skill_id,
                min_level: need.min_level,
                user_level: us.level,
            })
            score += Math.max(0, (LEVEL_RANK[us.level] ?? 0) - (LEVEL_RANK[need.min_level] ?? 0) + 1)
        }
        return { user: publicUser(u), matched, score, matched_skills }
    })

    matches.sort((a, b) => b.score - a.score || b.matched - a.matched)
    res.json(matches.filter(m => m.score > 0))
}))

// ---------- user skills ----------

app.get('/api/users/:id/skills', h(async (req, res) => {
    const { rows } = await pool.query('SELECT * FROM user_skills WHERE user_id = $1', [req.params.id])
    res.json(rows)
}))

app.post('/api/users/:id/skills', requireAuth, h(async (req, res) => {
    if (req.user.role !== 'admin' && req.user.id !== req.params.id) {
        return res.status(403).json({ error: 'Forbidden' })
    }
    const { skill_id, level } = req.body
    const entry = await insertRow('user_skills', { id: newId(), user_id: req.params.id, skill_id, level })
    res.json(entry)
}))

app.get('/api/user-skills', h(async (req, res) => {
    const { rows } = await pool.query(
        `SELECT * FROM user_skills
         WHERE ($1::text IS NULL OR user_id = $1)
           AND ($2::text IS NULL OR skill_id = $2)`,
        [req.query.user_id || null, req.query.skill_id || null]
    )
    res.json(rows)
}))

app.delete('/api/user-skills/:id', requireAuth, h(async (req, res) => {
    const entry = (await pool.query('SELECT * FROM user_skills WHERE id = $1', [req.params.id])).rows[0]
    if (!entry) return res.status(404).json({ error: 'User skill entry not found' })
    if (req.user.role !== 'admin' && entry.user_id !== req.user.id) {
        return res.status(403).json({ error: 'Forbidden' })
    }
    await pool.query('DELETE FROM user_skills WHERE id = $1', [entry.id])
    res.json({ ok: true })
}))

app.put('/api/user-skills/:id', requireAuth, h(async (req, res) => {
    const { level } = req.body
    if (!LEVEL_RANK[level]) return res.status(400).json({ error: 'Invalid level' })

    const entry = (await pool.query('SELECT * FROM user_skills WHERE id = $1', [req.params.id])).rows[0]
    if (!entry) return res.status(404).json({ error: 'User skill entry not found' })
    if (req.user.role !== 'admin' && entry.user_id !== req.user.id) {
        return res.status(403).json({ error: 'Forbidden' })
    }

    const { rows } = await pool.query(
        'UPDATE user_skills SET level = $1 WHERE id = $2 RETURNING *',
        [level, entry.id]
    )
    res.json(rows[0])
}))

// ---------- ignored skills ----------

app.get('/api/users/:id/ignored-skills', h(async (req, res) => {
    const { rows } = await pool.query(
        'SELECT skill_id FROM user_ignored_skills WHERE user_id = $1',
        [req.params.id]
    )
    res.json(rows.map(r => r.skill_id))
}))

app.post('/api/users/:id/ignored-skills', requireAuth, h(async (req, res) => {
    if (req.user.role !== 'admin' && req.user.id !== req.params.id) {
        return res.status(403).json({ error: 'Forbidden' })
    }
    const { skill_id } = req.body
    if (!skill_id) return res.status(400).json({ error: 'skill_id required' })
    await pool.query(
        'INSERT INTO user_ignored_skills (user_id, skill_id) VALUES ($1, $2) ON CONFLICT DO NOTHING',
        [req.params.id, skill_id]
    )
    res.status(201).json({ user_id: req.params.id, skill_id })
}))

app.delete('/api/users/:id/ignored-skills/:skillId', requireAuth, h(async (req, res) => {
    if (req.user.role !== 'admin' && req.user.id !== req.params.id) {
        return res.status(403).json({ error: 'Forbidden' })
    }
    await pool.query(
        'DELETE FROM user_ignored_skills WHERE user_id = $1 AND skill_id = $2',
        [req.params.id, req.params.skillId]
    )
    res.json({ ok: true })
}))

app.delete('/api/users/:id/ignored-skills', requireAuth, h(async (req, res) => {
    if (req.user.role !== 'admin' && req.user.id !== req.params.id) {
        return res.status(403).json({ error: 'Forbidden' })
    }
    const { rowCount } = await pool.query(
        'DELETE FROM user_ignored_skills WHERE user_id = $1',
        [req.params.id]
    )
    res.json({ ok: true, restored: rowCount })
}))

// ---------- search ----------

app.get('/api/search', h(async (req, res) => {
    const q = likePattern(req.query.q || '')
    const searches = {
        users: async () => (await pool.query(
            `SELECT ${USER_COLS} FROM users WHERE name ILIKE $1 OR email ILIKE $1`, [q])).rows,
        skills: async () => (await pool.query(
            `SELECT s.* FROM skills s
             LEFT JOIN categories c ON c.id = s.category_id
             WHERE s.name ILIKE $1 OR c.name ILIKE $1
                OR EXISTS (SELECT 1 FROM unnest(s.tags) AS t WHERE t ILIKE $1)`, [q])).rows,
        projects: async () => (await pool.query(
            'SELECT * FROM projects WHERE name ILIKE $1 OR summary ILIKE $1', [q])).rows,
        teams: async () => (await pool.query(
            'SELECT * FROM teams WHERE name ILIKE $1 OR description ILIKE $1', [q])).rows,
        categories: async () => (await pool.query(
            'SELECT * FROM categories WHERE name ILIKE $1', [q])).rows,
    }

    const type = req.query.type || 'all'
    if (type !== 'all') return res.json(searches[type] ? await searches[type]() : [])

    const out = {}
    for (const [key, fn] of Object.entries(searches)) out[key] = await fn()
    res.json(out)
}))

// ---------- errors & startup ----------

const PG_ERRORS = {
    '23505': [409, 'Already exists'],
    '23503': [400, 'Referenced record does not exist'],
    '23514': [400, 'Invalid value'],
    '23502': [400, 'Missing required field'],
}

app.use((err, req, res, next) => {
    if (err.type === 'entity.parse.failed') return res.status(400).json({ error: 'Invalid JSON' })
    const mapped = PG_ERRORS[err.code]
    if (mapped) return res.status(mapped[0]).json({ error: mapped[1] })
    console.error(err)
    res.status(500).json({ error: 'Server error' })
})

async function start() {
    await initSchema()
    app.listen(PORT, () => console.log('API listening on', PORT))
}

start().catch(err => {
    console.error('Startup failed:', err)
    process.exit(1)
})
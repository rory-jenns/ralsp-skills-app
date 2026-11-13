#!/usr/bin/env node
// One-time import of the old lowdb db.json into PostgreSQL.
// Re-running is safe: rows that already exist are skipped.
// Usage: node migrate-json-to-pg.js [path/to/db.json]
require('dotenv').config()
const fs = require('fs')
const path = require('path')
const bcrypt = require('bcryptjs')
const { pool, initSchema } = require('./db')

const LEVELS = new Set(['beginner', 'intermediate', 'advanced', 'expert'])
const file = process.argv[2] || path.join(__dirname, 'db.json')
const warnings = []
const warn = msg => {
    warnings.push(msg)
    console.warn('WARN:', msg)
}

// Return the id if it points at a real record, otherwise null (with a warning).
function fk(value, validIds, what) {
    if (value === undefined || value === null || value === '') return null
    if (validIds.has(value)) return value
    warn(`${what}: "${value}" does not exist, storing NULL`)
    return null
}

async function insert(client, table, row) {
    const cols = Object.keys(row)
    const sql = `INSERT INTO ${table} (${cols.join(', ')})
                 VALUES (${cols.map((_, i) => `$${i + 1}`).join(', ')})
                 ON CONFLICT DO NOTHING`
    const { rowCount } = await client.query(sql, Object.values(row))
    return rowCount
}

async function main() {
    const db = JSON.parse(fs.readFileSync(file, 'utf8'))
    const list = key => (Array.isArray(db[key]) ? db[key] : [])
    const users = list('users')
    const teams = list('teams')
    const categories = list('categories')
    const skills = list('skills')
    const userSkills = list('user_skills')
    const projects = list('projects')

    const idSet = arr => new Set(arr.map(x => x.id))
    const userIds = idSet(users)
    const teamIds = idSet(teams)
    const categoryIds = idSet(categories)
    const skillIds = idSet(skills)

    const now = () => new Date().toISOString()
    const counts = {}
    const add = (table, n) => { counts[table] = (counts[table] || 0) + n }

    await initSchema()
    const client = await pool.connect()
    try {
        await client.query('BEGIN')

        for (const u of users) {
            if (!u.password_hash) {
                warn(`user ${u.email || u.id} has no password; they cannot log in until one is set`)
            }
            add('users', await insert(client, 'users', {
                id: u.id,
                name: u.name ?? null,
                email: u.email,
                role: u.role === 'admin' ? 'admin' : 'user',
                password_hash: u.password_hash || null,
                team_id: fk(u.team_id, teamIds, `user ${u.id} team`),
                created_at: u.created_at || now(),
                updated_at: u.updated_at || u.created_at || now(),
            }))
        }

        for (const t of teams) {
            add('teams', await insert(client, 'teams', {
                id: t.id,
                name: t.name,
                description: t.description ?? null,
                owner_id: fk(t.owner_id, userIds, `team ${t.id} owner`),
                created_at: t.created_at || now(),
                updated_at: t.updated_at || t.created_at || now(),
            }))
        }

        for (const c of categories) {
            add('categories', await insert(client, 'categories', {
                id: c.id,
                name: c.name,
                owner_id: fk(c.owner_id, userIds, `category ${c.id} owner`),
                created_at: c.created_at || now(),
                updated_at: c.updated_at || c.created_at || now(),
            }))
        }

        for (const s of skills) {
            add('skills', await insert(client, 'skills', {
                id: s.id,
                name: s.name,
                category_id: fk(s.category_id, categoryIds, `skill ${s.id} category`),
                tags: Array.isArray(s.tags) ? s.tags : [],
                owner_id: fk(s.owner_id, userIds, `skill ${s.id} owner`),
                created_at: s.created_at || now(),
                updated_at: s.updated_at || s.created_at || now(),
            }))
        }

        for (const us of userSkills) {
            if (!userIds.has(us.user_id) || !skillIds.has(us.skill_id)) {
                warn(`user_skill ${us.id} points at a missing user or skill; skipped`)
                continue
            }
            if (!LEVELS.has(us.level)) {
                warn(`user_skill ${us.id} has invalid level "${us.level}"; skipped`)
                continue
            }
            add('user_skills', await insert(client, 'user_skills', {
                id: us.id || newId(),
                user_id: us.user_id,
                skill_id: us.skill_id,
                level: us.level,
            }))
        }

        for (const p of projects) {
            add('projects', await insert(client, 'projects', {
                id: p.id,
                name: p.name,
                summary: p.summary ?? null,
                status: p.status ?? null,
                owner_team_id: fk(p.owner_team_id, teamIds, `project ${p.id} team`),
                required_skills: JSON.stringify(Array.isArray(p.required_skills) ? p.required_skills : []),
                owner_id: fk(p.owner_id, userIds, `project ${p.id} owner`),
                created_at: p.created_at || now(),
                updated_at: p.updated_at || p.created_at || now(),
            }))
        }

        // Optional: set the first admin's password explicitly
        if (process.env.ADMIN_PASSWORD) {
            await client.query(
                `UPDATE users SET password_hash = $1, updated_at = now()
                 WHERE id = (SELECT id FROM users WHERE role = 'admin' ORDER BY created_at LIMIT 1)`,
                [bcrypt.hashSync(process.env.ADMIN_PASSWORD, 10)]
            )
            console.log('Set password for the first admin from ADMIN_PASSWORD')
        }

        await client.query('COMMIT')
        console.log('Rows inserted (new rows only):', counts)
        console.log(`Finished with ${warnings.length} warning(s).`)
    } catch (err) {
        await client.query('ROLLBACK')
        throw err
    } finally {
        client.release()
    }
}

// newId is needed for user_skills entries without an id
const { newId } = require('./db')

main()
    .then(() => pool.end())
    .catch(err => {
        console.error('Migration failed; nothing was written:', err.message)
        process.exit(1)
    })
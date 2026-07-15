#!/usr/bin/env node
const fs = require('fs')
const path = require('path')
const { nanoid } = require('nanoid')
const bcrypt = require('bcryptjs')

const dbPath = path.resolve(__dirname, 'db.json')
const backupPath = dbPath + '.bak.' + Date.now()

if (!fs.existsSync(dbPath)) {
  console.error('DB file not found at', dbPath)
  process.exit(1)
}

const raw = fs.readFileSync(dbPath, 'utf8')
const db = JSON.parse(raw)

db.teams ||= []
db.users ||= []
db.categories ||= []
db.skills ||= []
db.user_skills ||= []
db.projects ||= []

let changed = false

// Ensure users have role and timestamps
for (const u of db.users) {
  if (!('role' in u)) { u.role = 'user'; changed = true }
  if (!('created_at' in u)) { u.created_at = new Date().toISOString(); changed = true }
  if (!('updated_at' in u)) { u.updated_at = u.created_at; changed = true }
}

// Ensure there is at least one admin
let admin = db.users.find(u => u.role === 'admin')
if (!admin) {
  const adminId = nanoid(8)
  admin = {
    id: adminId,
    name: 'admin',
    email: 'admin@example.com',
    role: 'admin',
    password_hash: null,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  }
  db.users.unshift(admin)
  changed = true
  console.log('Seeded admin user:', admin.email, 'id', admin.id)
  console.log('NOTE: password_hash is null — set a secure password hash before using in production.')
}

// Ensure users have a password_hash. Set a default hashed password if missing.
const DEFAULT_PASSWORD = process.env.DEFAULT_PASSWORD || 'password12'
for (const u of db.users) {
  if (!('password_hash' in u) || !u.password_hash) {
    u.password_hash = bcrypt.hashSync(DEFAULT_PASSWORD, 10)
    u.updated_at = new Date().toISOString()
    changed = true
    console.log('Set default password for user:', u.email || u.id)
  }
}

// Resources that should have owner_id set. Default to admin if missing.
const ownerable = ['projects', 'skills', 'categories', 'teams']
for (const key of ownerable) {
  if (!Array.isArray(db[key])) continue
  for (const item of db[key]) {
    if (!item.owner_id) {
      item.owner_id = admin.id
      changed = true
    }
  }
}

// Ensure user_skills entries have ids and timestamps
for (const us of db.user_skills) {
  if (!us.id) { us.id = nanoid(8); changed = true }
}

if (changed) {
  fs.writeFileSync(backupPath, raw, 'utf8')
  fs.writeFileSync(dbPath, JSON.stringify(db, null, 2), 'utf8')
  console.log('Migration applied. Backup written to', backupPath)
  console.log('Next steps:')
  console.log(' - The migration sets a default password hash for any users missing one.')
  console.log("   Default password: 'password12' (override by setting DEFAULT_PASSWORD before running this script)")
  console.log(' - To set a secure password for the admin user specifically, use the helper script:')
  console.log('     node set-admin-password.js <password>')
  console.log('   or set the ADMIN_PASSWORD env var and run the script.')
  console.log(' - If you prefer to generate a bcrypt hash manually, you can run:')
  console.log('     node -e "console.log(require(\'bcryptjs\').hashSync(\'your-password\', 10))"')
  console.log(' - Ensure `bcryptjs` is installed in the `server` folder:')
  console.log('     cd server && npm install bcryptjs')
} else {
  console.log('No migration changes needed.')
}

process.exit(0)

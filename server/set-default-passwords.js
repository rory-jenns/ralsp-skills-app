#!/usr/bin/env node
const fs = require('fs')
const path = require('path')
const bcrypt = require('bcryptjs')

const dbPath = path.resolve(__dirname, 'db.json')
if (!fs.existsSync(dbPath)) {
  console.error('db.json not found in server directory')
  process.exit(1)
}

const raw = fs.readFileSync(dbPath, 'utf8')
const db = JSON.parse(raw)
db.users ||= []

const PASSWORD = 'password12'
let changed = false

for (const u of db.users) {
  if (!u.password_hash) {
    u.password_hash = bcrypt.hashSync(PASSWORD, 10)
    u.updated_at = new Date().toISOString()
    changed = true
    console.log('Set password for user:', u.email || u.id)
  }
}

if (changed) {
  const backup = dbPath + '.bak.' + Date.now()
  fs.writeFileSync(backup, raw, 'utf8')
  fs.writeFileSync(dbPath, JSON.stringify(db, null, 2), 'utf8')
  console.log('Updated db.json with default password hashes. Backup at', backup)
} else {
  console.log('No users needed updating')
}

process.exit(0)

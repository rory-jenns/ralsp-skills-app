#!/usr/bin/env node
const fs = require('fs')
const path = require('path')
const bcrypt = require('bcryptjs')

const dbPath = path.resolve(__dirname, 'db.json')
if (!fs.existsSync(dbPath)) {
  console.error('db.json not found in server directory')
  process.exit(1)
}

const password = process.argv[2] || process.env.ADMIN_PASSWORD
if (!password) {
  console.error('Usage: node set-admin-password.js <password>  OR set ADMIN_PASSWORD env var')
  process.exit(1)
}

const raw = fs.readFileSync(dbPath, 'utf8')
const db = JSON.parse(raw)
db.users ||= []

const admin = db.users.find(u => u.role === 'admin') || db.users[0]
if (!admin) {
  console.error('No users found in db.json to set as admin')
  process.exit(1)
}

admin.password_hash = bcrypt.hashSync(password, 10)
admin.updated_at = new Date().toISOString()

fs.writeFileSync(dbPath, JSON.stringify(db, null, 2), 'utf8')
console.log('Set password for admin user:', admin.email || admin.id)

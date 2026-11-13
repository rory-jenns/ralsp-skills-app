const fs = require('fs')
const path = require('path')
const crypto = require('crypto')
const { Pool } = require('pg')

const pool = new Pool({ connectionString: process.env.DATABASE_URL })

// Creates any missing tables. Safe to run on every startup.
async function initSchema() {
    await pool.query(fs.readFileSync(path.join(__dirname, 'schema.sql'), 'utf8'))
}

const ALPHABET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789_-'

// 8-character IDs in the same style as the old nanoid IDs
function newId(len = 8) {
    let s = ''
    for (const b of crypto.randomBytes(len)) s += ALPHABET[b & 63]
    return s
}

module.exports = { pool, initSchema, newId }
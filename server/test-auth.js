#!/usr/bin/env node
const axios = require('axios')

const BASE = process.env.API_BASE || 'http://localhost:4000'
const email = process.argv[2] || process.env.ADMIN_EMAIL || 'admin@example.com'
const password = process.argv[3] || process.env.ADMIN_PASSWORD

if (!password) {
  console.error('Usage: node test-auth.js <admin-email> <admin-password>   OR set ADMIN_PASSWORD env var')
  process.exit(1)
}

async function run() {
  try {
    const login = await axios.post(`${BASE}/api/auth/login`, { email, password })
    const token = login.data.token
    console.log('Login succeeded, token length', token.length)

    // try protected route
    const res = await axios.post(`${BASE}/api/teams`, { name: 'Test Team from script', description: 'Created by test-auth' }, { headers: { Authorization: `Bearer ${token}` } })
    console.log('Protected POST /api/teams succeeded:', res.data.id)
    console.log('Test passed')
  } catch (err) {
    if (err.response) {
      console.error('Request failed:', err.response.status, err.response.data)
    } else {
      console.error('Error:', err.message)
    }
    process.exit(2)
  }
}

run()

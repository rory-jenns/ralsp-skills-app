import React from 'react'
import { createRoot } from 'react-dom/client'
import axios from 'axios'
import App from './App'
import './index.css'

const apiBaseUrl = import.meta.env.VITE_API_URL || (import.meta.env.MODE === 'development' ? '' : '')
if (import.meta.env.MODE === 'production' && !import.meta.env.VITE_API_URL) {
    console.warn('Warning: VITE_API_URL environment variable is not set. API calls may fail.')
}
axios.defaults.baseURL = apiBaseUrl

const root = createRoot(document.getElementById('root')!)
root.render(
    <React.StrictMode>
        <App />
    </React.StrictMode>
)

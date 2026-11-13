import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
    plugins: [react()],
    server: {
        proxy: {
            '/api': {
                target: process.env.API_PROXY_TARGET ?? 'http://localhost:4000',
                changeOrigin: true,
                // Only needed if the server routes don't already include /api:
                // rewrite: (path) => path.replace(/^\/api/, ''),
            },
        },
    },
})
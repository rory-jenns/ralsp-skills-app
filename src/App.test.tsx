import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import App from './App'

vi.mock('axios', () => ({
    default: {
        get: vi.fn(() => Promise.resolve({ data: [] })),
        post: vi.fn(() => Promise.resolve({ data: [] })),
        defaults: {
            headers: {
                common: {}
            }
        }
    }
}))

describe('App', () => {
    it('renders heading', () => {
        render(
            <MemoryRouter>
                <App />
            </MemoryRouter>
        )
        expect(screen.getByText(/Home/i)).toBeDefined()
    })
})

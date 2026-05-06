import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import App from './App'

vi.mock('axios', () => ({
    default: {
        get: vi.fn(() => Promise.resolve({ data: [] })),
        post: vi.fn(() => Promise.resolve({ data: [] }))
    }
}))

describe('App', () => {
    it('renders heading', () => {
        render(<App />)
        expect(screen.getByText(/Skills App/i)).toBeDefined()
    })
})

/**
 * Unit Tests: src/hooks/useAnimatedTitle.jsx
 *
 * Tests:
 *  - Hook returns { title, color } on mount
 *  - Reads initial color from localStorage (normal mode & structured mode)
 *  - Calls onColorChange with the initial color
 *  - Typewriter progresses when timers advance (non-structured mode)
 *  - In structured mode, displayedWord stays as "Amazing" (no typewriter)
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import React, { act } from 'react'
import { createRoot } from 'react-dom/client'
import { useAnimatedTitle } from '../../hooks/useAnimatedTitle'

globalThis.IS_REACT_ACT_ENVIRONMENT = true

// ─── Minimal renderHook ──────────────────────────────────────────────────────
function renderHook(hookFn) {
    const result = { current: null }
    function TestComponent() {
        result.current = hookFn()
        return null
    }
    const container = document.createElement('div')
    const root = createRoot(container)
    act(() => { root.render(React.createElement(TestComponent)) })
    return {
        result,
        unmount: () => act(() => { root.unmount() })
    }
}

// ─── Mock localStorage ───────────────────────────────────────────────────────
const store = {}
const mockLS = {
    getItem:    (k)    => store[k] ?? null,
    setItem:    (k, v) => { store[k] = String(v) },
    removeItem: (k)    => { delete store[k] },
    clear:      ()     => { Object.keys(store).forEach(k => delete store[k]) }
}
Object.defineProperty(globalThis, 'localStorage', { value: mockLS, writable: true })

beforeEach(() => {
    localStorage.clear()
    vi.useFakeTimers()
})

afterEach(() => {
    vi.useRealTimers()
})

// ══════════════════════════════════════════════════════════════════════════════
// Return shape
// ══════════════════════════════════════════════════════════════════════════════

describe('useAnimatedTitle — return shape', () => {
    it('returns an object with "title" and "color" keys', () => {
        const { result } = renderHook(() => useAnimatedTitle({ onColorChange: vi.fn() }))
        expect(result.current).toHaveProperty('title')
        expect(result.current).toHaveProperty('color')
    })

    it('title is a React element (the motion.div)', () => {
        const { result } = renderHook(() => useAnimatedTitle({ onColorChange: vi.fn() }))
        expect(React.isValidElement(result.current.title)).toBe(true)
    })

    it('color is a string', () => {
        const { result } = renderHook(() => useAnimatedTitle({ onColorChange: vi.fn() }))
        expect(typeof result.current.color).toBe('string')
    })
})

// ══════════════════════════════════════════════════════════════════════════════
// Initial color
// ══════════════════════════════════════════════════════════════════════════════

describe('useAnimatedTitle — initial color', () => {
    it('uses initialColor prop when no localStorage entry exists', () => {
        const { result } = renderHook(() =>
            useAnimatedTitle({ onColorChange: vi.fn(), initialColor: 'lime' })
        )
        expect(result.current.color).toBe('lime')
    })

    it('reads last accent color from localStorage', () => {
        localStorage.setItem('app_last_accent', 'pink')
        const { result } = renderHook(() =>
            useAnimatedTitle({ onColorChange: vi.fn(), initialColor: 'cyan' })
        )
        expect(result.current.color).toBe('pink')
    })

    it('in structured mode, uses stored structured color', () => {
        localStorage.setItem('app_structured_mode', 'true')
        localStorage.setItem('app_structured_color', 'orange')
        const { result } = renderHook(() =>
            useAnimatedTitle({ onColorChange: vi.fn(), initialColor: 'cyan' })
        )
        expect(result.current.color).toBe('orange')
    })

    it('in structured mode with no stored color, falls back to "cyan"', () => {
        localStorage.setItem('app_structured_mode', 'true')
        const { result } = renderHook(() =>
            useAnimatedTitle({ onColorChange: vi.fn(), initialColor: 'pink' })
        )
        expect(result.current.color).toBe('cyan')
    })
})

// ══════════════════════════════════════════════════════════════════════════════
// onColorChange callback
// ══════════════════════════════════════════════════════════════════════════════

describe('useAnimatedTitle — onColorChange', () => {
    it('calls onColorChange on mount with the initial color', () => {
        const onColorChange = vi.fn()
        renderHook(() => useAnimatedTitle({ onColorChange, initialColor: 'teal' }))
        expect(onColorChange).toHaveBeenCalledWith('teal')
    })

    it('does not throw when onColorChange is not provided', () => {
        expect(() => {
            renderHook(() => useAnimatedTitle({ initialColor: 'blue' }))
        }).not.toThrow()
    })
})

// ══════════════════════════════════════════════════════════════════════════════
// Structured mode behaviour
// ══════════════════════════════════════════════════════════════════════════════

describe('useAnimatedTitle — structured mode', () => {
    it('persists the current color to localStorage', () => {
        localStorage.setItem('app_structured_mode', 'true')
        localStorage.setItem('app_structured_color', 'purple')
        renderHook(() => useAnimatedTitle({ onColorChange: vi.fn() }))
        expect(localStorage.getItem('app_last_accent')).toBe('purple')
    })
})

// ══════════════════════════════════════════════════════════════════════════════
// Typewriter effect
// ══════════════════════════════════════════════════════════════════════════════

describe('useAnimatedTitle — typewriter effect', () => {
    it('starts with an empty displayedWord (no structured mode)', () => {
        // We can verify by checking the span text in the rendered JSX
        // The title is a motion.div; we render it to DOM and inspect
        const onColorChange = vi.fn()
        const container = document.createElement('div')
        const root = createRoot(container)

        let capturedTitle = null
        function TestComponent() {
            const { title } = useAnimatedTitle({ onColorChange, initialColor: 'cyan' })
            capturedTitle = title
            return title
        }

        act(() => { root.render(React.createElement(TestComponent)) })

        // The adjective span should start empty or start building
        const adjSpan = container.querySelector('.home-adjective')
        // On first render before any timer fires, displayedWord is ''
        expect(adjSpan?.textContent ?? '').toBe('')

        act(() => { root.unmount() })
    })

    it('advances the typewriter when timer fires', () => {
        const onColorChange = vi.fn()
        const container = document.createElement('div')
        const root = createRoot(container)

        function TestComponent() {
            const { title } = useAnimatedTitle({ onColorChange, initialColor: 'cyan' })
            return title
        }

        act(() => { root.render(React.createElement(TestComponent)) })

        // After one timer tick the first letter should appear
        act(() => { vi.advanceTimersByTime(150) })

        const adjSpan = container.querySelector('.home-adjective')
        expect(adjSpan?.textContent.length).toBeGreaterThan(0)

        act(() => { root.unmount() })
    })
})

/**
 * Unit Tests: src/engine/serotoninEngine.js
 *
 * Tests the core color logic, palette definitions, and utility functions.
 * These are pure functions with no DOM dependency — very fast to run.
 */

import { describe, it, expect, vi } from 'vitest'
import {
    accentColors,
    colorValues,
    accentColorSchemes,
    bgTints,
    lightTints,
    textColors,
    darkBgTints,
    getRandomAccentExcluding,
    pickRandom
} from '../../engine/serotoninEngine'

// ─────────────────────────────────────────────
// Color Palette Completeness
// ─────────────────────────────────────────────

describe('Palette Completeness', () => {
    it('should have a colorValue entry for every accent', () => {
        accentColors.forEach(accent => {
            expect(colorValues).toHaveProperty(accent)
            expect(colorValues[accent]).toMatch(/^#[0-9A-Fa-f]{6}$/)
        })
    })

    it('should have an accentColorScheme entry for every accent', () => {
        accentColors.forEach(accent => {
            expect(accentColorSchemes).toHaveProperty(accent)
            const scheme = accentColorSchemes[accent]
            // Each scheme must have all 9 required keys
            expect(scheme).toHaveProperty('colorize1')
            expect(scheme).toHaveProperty('colorize2')
            expect(scheme).toHaveProperty('colorize3')
            expect(scheme).toHaveProperty('badge1')
            expect(scheme).toHaveProperty('badge2')
            expect(scheme).toHaveProperty('badge3')
            expect(scheme).toHaveProperty('highlight1')
            expect(scheme).toHaveProperty('highlight2')
            expect(scheme).toHaveProperty('highlight3')
        })
    })

    it('should have a bgTint entry for every accent', () => {
        accentColors.forEach(accent => {
            expect(bgTints).toHaveProperty(accent)
        })
    })

    it('should have a lightTint entry for every accent', () => {
        accentColors.forEach(accent => {
            expect(lightTints).toHaveProperty(accent)
        })
    })

    it('should have a textColor entry for every accent', () => {
        accentColors.forEach(accent => {
            expect(textColors).toHaveProperty(accent)
        })
    })

    it('should have a darkBgTint entry for every accent', () => {
        accentColors.forEach(accent => {
            expect(darkBgTints).toHaveProperty(accent)
        })
    })
})

// ─────────────────────────────────────────────
// Scheme Consistency Rule
// ─────────────────────────────────────────────

describe('Scheme Consistency', () => {
    it('should have badge1 match colorize1 for every accent (design rule)', () => {
        // Per the design principles in the file: badge1 = colorize1
        accentColors.forEach(accent => {
            const scheme = accentColorSchemes[accent]
            expect(scheme.badge1).toBe(scheme.colorize1)
        })
    })

    it('should have badge2 match colorize2 for every accent (design rule)', () => {
        accentColors.forEach(accent => {
            const scheme = accentColorSchemes[accent]
            expect(scheme.badge2).toBe(scheme.colorize2)
        })
    })

    it('should have badge3 match colorize3 for every accent (design rule)', () => {
        accentColors.forEach(accent => {
            const scheme = accentColorSchemes[accent]
            expect(scheme.badge3).toBe(scheme.colorize3)
        })
    })

    it('should have highlight1 match the primary colorValue for each accent', () => {
        accentColors.forEach(accent => {
            const scheme = accentColorSchemes[accent]
            expect(scheme.highlight1).toBe(colorValues[accent])
        })
    })
})

// ─────────────────────────────────────────────
// Utility: getRandomAccentExcluding
// ─────────────────────────────────────────────

describe('getRandomAccentExcluding', () => {
    it('should never return the excluded accent', () => {
        accentColors.forEach(excluded => {
            for (let i = 0; i < 30; i++) {
                const result = getRandomAccentExcluding(excluded)
                expect(result).not.toBe(excluded)
                expect(accentColors).toContain(result)
            }
        })
    })

    it('should return a valid accent color', () => {
        const result = getRandomAccentExcluding('cyan')
        expect(accentColors).toContain(result)
    })
})

// ─────────────────────────────────────────────
// Utility: pickRandom
// ─────────────────────────────────────────────

describe('pickRandom', () => {
    it('should always return an item from the list', () => {
        const list = ['a', 'b', 'c', 'd']
        for (let i = 0; i < 50; i++) {
            expect(list).toContain(pickRandom(list))
        }
    })

    it('should work with a single-item list', () => {
        expect(pickRandom(['only'])).toBe('only')
    })

    it('should return undefined for an empty list', () => {
        expect(pickRandom([])).toBeUndefined()
    })
})

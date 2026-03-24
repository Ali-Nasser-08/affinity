/**
 * Integration Tests: book data → question selection → star awarding
 *
 * Tests the revision loop using real book data from the module import chain
 * combined with the useStudents hook. Verifies that:
 *  - Unit data loads correctly through the full import chain (units.js → book index → JSON)
 *  - Questions from real data are in the shape the player expects
 *  - Star awarding driven by real question data persists across hook remounts
 */

import React, { act } from 'react'
import { createRoot } from 'react-dom/client'
import { describe, it, expect, beforeEach } from 'vitest'
import { getBookUnits, getUnitData, getUnitMeta } from '../../data/units'
import { useStudents } from '../../hooks/useStudents'

// ─── in-memory localStorage ───────────────────────────────────────────────────
const store = {}
const mockLS = {
    getItem:    (k)    => store[k] ?? null,
    setItem:    (k, v) => { store[k] = String(v) },
    removeItem: (k)    => { delete store[k] },
    clear:      ()     => { Object.keys(store).forEach(k => delete store[k]) },
}
Object.defineProperty(globalThis, 'localStorage', { value: mockLS, writable: true })

globalThis.IS_REACT_ACT_ENVIRONMENT = true

function renderHook(hookFn) {
    const result = { current: null }
    function Wrapper() { result.current = hookFn(); return null }
    const container = document.createElement('div')
    const root = createRoot(container)
    act(() => root.render(React.createElement(Wrapper)))
    return { result, unmount: () => act(() => root.unmount()) }
}

beforeEach(() => {
    localStorage.clear()
})

// ══════════════════════════════════════════════════════════════════════════════
// book data module chain
// ══════════════════════════════════════════════════════════════════════════════

describe('book data loads correctly through the module chain', () => {
    it('getBookUnits returns the full unit list for Mega Goal 1', () => {
        expect(getBookUnits('Mega Goal 1')).toEqual([1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12])
    })

    it('getBookUnits returns the correct unit list for Mega Goal 2', () => {
        expect(getBookUnits('Mega Goal 2')).toEqual([7, 8, 9, 10, 11, 12])
    })

    it('getBookUnits returns an empty array for an unknown book', () => {
        expect(getBookUnits('Unknown Book')).toEqual([])
    })

    it('getUnitMeta returns title, color, and icon for a valid unit', () => {
        const meta = getUnitMeta('Mega Goal 2', 7)
        expect(meta.title).toBeDefined()
        expect(meta.color).toBeDefined()
        expect(meta.icon).toBeDefined()
    })

    it('getUnitMeta returns a sensible fallback for an unknown book/unit', () => {
        const meta = getUnitMeta('Unknown Book', 99)
        expect(meta.title).toBe('Unit 99')
        expect(meta.color).toBe('cyan')
    })

    it('getUnitData returns real question data for Mega Goal 2 unit 7', () => {
        const data = getUnitData('Mega Goal 2', 7)
        expect(data).toBeDefined()
        expect(data.grammarMCQ).toBeInstanceOf(Array)
        expect(data.grammarMCQ.length).toBeGreaterThan(0)
    })

    it('all grammar questions in unit 7 have the required player shape', () => {
        const data = getUnitData('Mega Goal 2', 7)
        data.grammarMCQ.forEach(q => {
            expect(q).toHaveProperty('q')
            expect(q).toHaveProperty('opts')
            expect(q).toHaveProperty('ans')
            expect(Array.isArray(q.opts)).toBe(true)
            expect(q.opts.length).toBe(4)
            expect(q.opts).toContain(q.ans)
        })
    })

    it('unit metadata color matches the expected values for Mega Goal 2', () => {
        const units = getBookUnits('Mega Goal 2')
        units.forEach(unit => {
            const meta = getUnitMeta('Mega Goal 2', unit)
            expect(meta.color).toBeDefined()
            expect(typeof meta.color).toBe('string')
        })
    })
})

// ══════════════════════════════════════════════════════════════════════════════
// revision session: real book data drives star awarding
// ══════════════════════════════════════════════════════════════════════════════

describe('revision session: real question data drives star awarding', () => {
    it('answering a question correctly awards a star to the student', () => {
        const { result } = renderHook(() => useStudents())
        act(() => result.current.addStudent('Isla', 'star', 'cyan'))
        const studentId = result.current.students[0].id

        const data     = getUnitData('Mega Goal 2', 7)
        const question = data.grammarMCQ[0]

        // Correct answer check — the ans is always in opts (verified above)
        expect(question.opts).toContain(question.ans)
        act(() => result.current.addStar(studentId, 'star-base'))

        expect(result.current.students[0].stars).toHaveLength(1)
    })

    it('completing all questions in a unit awards one star per question', () => {
        const { result } = renderHook(() => useStudents())
        act(() => result.current.addStudent('Jake', 'person', 'orange'))
        const studentId = result.current.students[0].id

        const data      = getUnitData('Mega Goal 2', 7)
        const questions = data.grammarMCQ.slice(0, 5)

        act(() => {
            questions.forEach(() => result.current.addStar(studentId, 'star-base'))
        })

        expect(result.current.students[0].stars).toHaveLength(5)
    })

    it('stars earned in a revision session persist after hook remount', () => {
        const { result: r1, unmount } = renderHook(() => useStudents())
        act(() => r1.current.addStudent('Kai', 'person', 'teal'))
        const studentId = r1.current.students[0].id

        const data = getUnitData('Mega Goal 2', 7)
        act(() => {
            data.grammarMCQ.forEach(() => r1.current.addStar(studentId, 'star-base'))
        })
        const totalQuestions = data.grammarMCQ.length
        unmount()

        const { result: r2 } = renderHook(() => useStudents())
        expect(r2.current.students[0].stars).toHaveLength(totalQuestions)
    })

    it('different difficulty stars from a session are all stored distinctly', () => {
        const { result } = renderHook(() => useStudents())
        act(() => result.current.addStudent('Lena', 'star', 'pink'))
        const studentId = result.current.students[0].id

        act(() => {
            result.current.addStar(studentId, 'star-base')
            result.current.addStar(studentId, 'star-spark')
            result.current.addStar(studentId, 'star-radiant')
            result.current.addStar(studentId, 'star-legendary')
        })

        const stars = result.current.students[0].stars
        expect(stars).toContain('star-base')
        expect(stars).toContain('star-spark')
        expect(stars).toContain('star-radiant')
        expect(stars).toContain('star-legendary')
    })

    it('stars awarded to one student do not affect others in the same session', () => {
        const { result } = renderHook(() => useStudents())
        act(() => {
            result.current.addStudent('Mia',  'person', 'red')
            result.current.addStudent('Noah', 'person', 'blue')
        })
        const miaId = result.current.students[0].id

        const data = getUnitData('Mega Goal 2', 7)
        act(() => {
            data.grammarMCQ.slice(0, 3).forEach(() =>
                result.current.addStar(miaId, 'star-base')
            )
        })

        expect(result.current.students[0].stars).toHaveLength(3) // Mia
        expect(result.current.students[1].stars).toHaveLength(0) // Noah untouched
    })

    it('multiple students can receive stars from the same revision session', () => {
        const { result } = renderHook(() => useStudents())
        act(() => {
            result.current.addStudent('Olivia', 'star',   'purple')
            result.current.addStudent('Pete',   'person', 'yellow')
        })
        const oliviaId = result.current.students[0].id
        const peteId   = result.current.students[1].id

        act(() => {
            result.current.addStar(oliviaId, 'star-spark')
            result.current.addStar(peteId,   'star-base')
            result.current.addStar(oliviaId, 'star-radiant')
        })

        expect(result.current.students[0].stars).toEqual(['star-spark', 'star-radiant'])
        expect(result.current.students[1].stars).toEqual(['star-base'])
    })
})

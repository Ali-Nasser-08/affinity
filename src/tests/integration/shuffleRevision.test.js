/**
 * Integration Tests: shuffle helper ↔ revision question data
 *
 * shuffle() is the only function in helpers.js and is called every time
 * a question's options are randomised for display. Verifies:
 *  - Core correctness properties (no elements lost/duplicated)
 *  - The answer is always present after shuffling (player correctness contract)
 *  - Works correctly on real unit data from the book module chain
 *  - Edge cases: empty array, single element, already-sorted input
 */

import { describe, it, expect } from 'vitest'
import { shuffle } from '../../utils/helpers'
import { getBookUnits, getUnitData } from '../../data/units'

// ══════════════════════════════════════════════════════════════════════════════
// core correctness
// ══════════════════════════════════════════════════════════════════════════════

describe('shuffle — core correctness', () => {
    it('returns an array of the same length', () => {
        expect(shuffle([1, 2, 3, 4])).toHaveLength(4)
    })

    it('contains all the original elements', () => {
        const input    = ['a', 'b', 'c', 'd', 'e']
        const result   = shuffle(input)
        expect(result.sort()).toEqual([...input].sort())
    })

    it('does not mutate the original array', () => {
        const input  = [1, 2, 3, 4]
        const copy   = [...input]
        shuffle(input)
        expect(input).toEqual(copy)
    })

    it('returns a new array reference, not the original', () => {
        const input = [1, 2, 3]
        expect(shuffle(input)).not.toBe(input)
    })

    it('handles an empty array without throwing', () => {
        expect(shuffle([])).toEqual([])
    })

    it('handles a single-element array', () => {
        expect(shuffle(['only'])).toEqual(['only'])
    })

    it('handles duplicate values without losing any', () => {
        const input  = ['a', 'a', 'b', 'b']
        const result = shuffle(input)
        expect(result).toHaveLength(4)
        expect(result.filter(x => x === 'a')).toHaveLength(2)
        expect(result.filter(x => x === 'b')).toHaveLength(2)
    })

    it('produces a different order on repeated calls (statistical)', () => {
        // With 4 elements there are 24 possible orders.
        // The chance of getting the same order 8 times in a row is (1/24)^7 ≈ negligible.
        const input   = ['A', 'B', 'C', 'D']
        const results = Array.from({ length: 8 }, () => shuffle(input).join(''))
        const unique  = new Set(results)
        expect(unique.size).toBeGreaterThan(1)
    })
})

// ══════════════════════════════════════════════════════════════════════════════
// revision player contract: answer is always in the shuffled options
// ══════════════════════════════════════════════════════════════════════════════

describe('shuffle + revision contract: answer survives shuffle', () => {
    it('the correct answer is always present after shuffling options', () => {
        const data = getUnitData('Mega Goal 2', 7)
        data.grammarMCQ.forEach(q => {
            const shuffled = shuffle(q.opts)
            expect(shuffled).toContain(q.ans)
        })
    })

    it('shuffled options always contain exactly 4 items (player expects 4)', () => {
        const data = getUnitData('Mega Goal 2', 7)
        data.grammarMCQ.forEach(q => {
            expect(shuffle(q.opts)).toHaveLength(4)
        })
    })

    it('shuffled options contain no duplicates for any question', () => {
        const data = getUnitData('Mega Goal 2', 7)
        data.grammarMCQ.forEach(q => {
            const shuffled = shuffle(q.opts)
            expect(new Set(shuffled).size).toBe(shuffled.length)
        })
    })

    it('answer is still present after shuffling the same question multiple times', () => {
        const data     = getUnitData('Mega Goal 2', 7)
        const question = data.grammarMCQ[0]
        for (let i = 0; i < 20; i++) {
            expect(shuffle(question.opts)).toContain(question.ans)
        }
    })
})

// ══════════════════════════════════════════════════════════════════════════════
// shuffle across all units in all books
// ══════════════════════════════════════════════════════════════════════════════

describe('shuffle across every unit in the book data', () => {
    const books = ['Mega Goal 2']

    books.forEach(book => {
        it(`every question in ${book} keeps its answer after shuffle`, () => {
            getBookUnits(book).forEach(unitNum => {
                const data = getUnitData(book, unitNum)
                if (!data?.grammarMCQ) return
                data.grammarMCQ.forEach(q => {
                    const shuffled = shuffle(q.opts)
                    expect(shuffled).toContain(q.ans)
                    expect(shuffled).toHaveLength(q.opts.length)
                })
            })
        })
    })
})

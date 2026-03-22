/**
 * Unit Tests: src/utils/helpers.js
 *
 * Tests the Fisher-Yates shuffle utility used throughout the app
 * for randomizing question order.
 */

import { describe, it, expect } from 'vitest'
import { shuffle } from '../../utils/helpers'

describe('shuffle()', () => {
    it('should return an array of the same length', () => {
        const input = [1, 2, 3, 4, 5]
        expect(shuffle(input)).toHaveLength(input.length)
    })

    it('should return an array with the same elements', () => {
        const input = [1, 2, 3, 4, 5]
        const result = shuffle(input)
        expect(result.sort()).toEqual([...input].sort())
    })

    it('should NOT mutate the original array', () => {
        const input = [1, 2, 3, 4, 5]
        const original = [...input]
        shuffle(input)
        expect(input).toEqual(original)
    })

    it('should handle an empty array', () => {
        expect(shuffle([])).toEqual([])
    })

    it('should handle a single-element array', () => {
        expect(shuffle(['only'])).toEqual(['only'])
    })

    it('should produce different orderings over many runs (statistical)', () => {
        const input = [1, 2, 3, 4, 5, 6, 7, 8]
        const results = new Set()
        for (let i = 0; i < 100; i++) {
            results.add(JSON.stringify(shuffle(input)))
        }
        // With 8! = 40320 possible orderings, 100 runs should produce many unique ones
        expect(results.size).toBeGreaterThan(5)
    })
})

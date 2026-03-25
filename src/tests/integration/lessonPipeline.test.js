/**
 * Integration Tests: generateLesson → localStorage → cloudSync
 *
 * Verifies that:
 *  - generateLesson() output has the structure LessonCreator expects
 *  - Lessons stored in app_custom_lessons have a top-level title that cloudSync
 *    can read without falling back to 'Untitled Lesson'
 *  - The full pipeline from generation to storage is consistent
 *  - Forbidden content is intercepted before anything touches localStorage
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { generateLesson } from '../../utils/geminiService'

// ─── helpers ──────────────────────────────────────────────────────────────────
function makeFetchResponse(body, ok = true) {
    return Promise.resolve({
        ok,
        status: ok ? 200 : 400,
        text: () => Promise.resolve(typeof body === 'string' ? body : JSON.stringify(body)),
        json: () => Promise.resolve(body),
    })
}

function geminiResponse(text) {
    return { candidates: [{ content: { parts: [{ text }] } }] }
}

const VALID_LESSON_JSON = JSON.stringify({
    lesson: {
        id: 'custom_999',
        title: 'Present Perfect',
        items: [
            { type: 'general',  title_badges: ['Grammar'], english: 'Use present perfect for recent events.', arabic: 'نستخدمه للأحداث الحديثة.' },
            { type: 'vocab',    word: 'achieve', word_type: 'verb', definition: 'To succeed in doing something.', arabic: 'يحقق', synonyms: ['accomplish', 'attain'], example: 'She has achieved her goal.' },
            { type: 'question', question: 'I _____ never been to Paris.', options: ['has', 'have', 'had', 'having'], answer: 'have', explanation: 'First person uses "have".', arabic_hint: 'المتكلم مفرد' },
        ],
    },
})

// ─── in-memory localStorage ───────────────────────────────────────────────────
const store = {}
const mockLS = {
    getItem:    (k)    => store[k] ?? null,
    setItem:    (k, v) => { store[k] = String(v) },
    removeItem: (k)    => { delete store[k] },
    clear:      ()     => { Object.keys(store).forEach(k => delete store[k]) },
}
Object.defineProperty(globalThis, 'localStorage', { value: mockLS, writable: true })

// ─── simulates what LessonCreator.jsx does after generateLesson() returns ─────
function storeLessonEntry(result, lessonName = '') {
    const title = lessonName.trim() || result.lesson?.title || 'Untitled Lesson'
    const entry = {
        id:        `lesson_${Date.now()}`,
        title,
        type:      'auto',
        colorKey:  'cyan',
        logoId:    'star',
        data:      result,
        createdAt: new Date().toISOString(),
    }
    const raw     = localStorage.getItem('app_custom_lessons')
    const lessons = raw ? JSON.parse(raw) : []
    lessons.unshift(entry)
    localStorage.setItem('app_custom_lessons', JSON.stringify(lessons))
    return entry
}

beforeEach(() => {
    vi.stubGlobal('fetch', vi.fn())
    localStorage.clear()
})

afterEach(() => {
    vi.unstubAllGlobals()
})

// ══════════════════════════════════════════════════════════════════════════════
// generateLesson output → LessonCreator expectations
// ══════════════════════════════════════════════════════════════════════════════

describe('generateLesson output → LessonCreator expectations', () => {
    it('lesson title is accessible at result.lesson.title', async () => {
        fetch.mockReturnValue(makeFetchResponse(geminiResponse(VALID_LESSON_JSON)))
        const result = await generateLesson('present perfect')
        expect(result.lesson.title).toBe('Present Perfect')
    })

    it('all items have a type field matching the allowed set', async () => {
        fetch.mockReturnValue(makeFetchResponse(geminiResponse(VALID_LESSON_JSON)))
        const result = await generateLesson('present perfect')
        result.lesson.items.forEach(item => {
            expect(item.type).toMatch(/^(general|vocab|question)$/)
        })
    })

    it('question items have the fields the question player requires', async () => {
        fetch.mockReturnValue(makeFetchResponse(geminiResponse(VALID_LESSON_JSON)))
        const result = await generateLesson('present perfect', 'questions')
        result.lesson.items.forEach(q => {
            expect(q).toHaveProperty('question')
            expect(q).toHaveProperty('options')
            expect(q).toHaveProperty('answer')
            expect(Array.isArray(q.options)).toBe(true)
            expect(q.options).toContain(q.answer)
        })
    })

    it('vocab items have the fields the vocab card player requires', async () => {
        fetch.mockReturnValue(makeFetchResponse(geminiResponse(VALID_LESSON_JSON)))
        const result = await generateLesson('vocabulary', 'vocab')
        result.lesson.items.forEach(v => {
            expect(v).toHaveProperty('word')
            expect(v).toHaveProperty('definition')
            expect(v).toHaveProperty('arabic')
        })
    })
})

// ══════════════════════════════════════════════════════════════════════════════
// localStorage storage → cloudSync expectations
// ══════════════════════════════════════════════════════════════════════════════

describe('lesson storage → cloudSync expectations', () => {
    it('stored entry has a top-level title that cloudSync can read directly', async () => {
        fetch.mockReturnValue(makeFetchResponse(geminiResponse(VALID_LESSON_JSON)))
        const result = await generateLesson('present perfect')
        storeLessonEntry(result)

        const stored = JSON.parse(localStorage.getItem('app_custom_lessons'))
        expect(stored[0].title).toBe('Present Perfect')
    })

    it('custom lesson name overrides the generated title', async () => {
        fetch.mockReturnValue(makeFetchResponse(geminiResponse(VALID_LESSON_JSON)))
        const result = await generateLesson('present perfect')
        storeLessonEntry(result, 'My Custom Name')

        const stored = JSON.parse(localStorage.getItem('app_custom_lessons'))
        expect(stored[0].title).toBe('My Custom Name')
    })

    it('full lesson data is preserved under .data in the stored entry', async () => {
        fetch.mockReturnValue(makeFetchResponse(geminiResponse(VALID_LESSON_JSON)))
        const result = await generateLesson('present perfect')
        storeLessonEntry(result)

        const stored = JSON.parse(localStorage.getItem('app_custom_lessons'))
        expect(stored[0].data.lesson.title).toBe(result.lesson.title)
        expect(stored[0].data.lesson.items).toHaveLength(result.lesson.items.length)
    })

    it('multiple lessons stack newest-first in app_custom_lessons', async () => {
        fetch.mockReturnValue(makeFetchResponse(geminiResponse(VALID_LESSON_JSON)))
        storeLessonEntry(await generateLesson('first topic'), 'Lesson One')

        fetch.mockReturnValue(makeFetchResponse(geminiResponse(VALID_LESSON_JSON)))
        storeLessonEntry(await generateLesson('second topic'), 'Lesson Two')

        const stored = JSON.parse(localStorage.getItem('app_custom_lessons'))
        expect(stored).toHaveLength(2)
        expect(stored[0].title).toBe('Lesson Two')
        expect(stored[1].title).toBe('Lesson One')
    })
})

// ══════════════════════════════════════════════════════════════════════════════
// forbidden content: blocked before any storage occurs
// ══════════════════════════════════════════════════════════════════════════════

describe('forbidden content: nothing reaches localStorage or fetch', () => {
    it('rejected topic never calls fetch', async () => {
        await expect(generateLesson('alcohol and drugs')).rejects.toThrow()
        expect(fetch).not.toHaveBeenCalled()
    })

    it('rejected topic leaves app_custom_lessons untouched', async () => {
        await expect(generateLesson('killing and violence')).rejects.toThrow()
        expect(localStorage.getItem('app_custom_lessons')).toBeNull()
    })

    it('safe lesson stores successfully after a previously rejected attempt', async () => {
        await expect(generateLesson('gambling strategies')).rejects.toThrow()

        fetch.mockReturnValue(makeFetchResponse(geminiResponse(VALID_LESSON_JSON)))
        storeLessonEntry(await generateLesson('daily routines'))

        const stored = JSON.parse(localStorage.getItem('app_custom_lessons'))
        expect(stored).toHaveLength(1)
        expect(stored[0].title).toBe('Present Perfect')
    })
})

// ══════════════════════════════════════════════════════════════════════════════
// cloudSync ↔ lessons
// ══════════════════════════════════════════════════════════════════════════════

import { vi as viSync } from 'vitest'
import { saveToCloud, retrieveFromCloud } from '../../utils/cloudSync'

viSync.mock('../../utils/supabaseClient', () => ({
    supabase: { from: viSync.fn() }
}))
import { supabase } from '../../utils/supabaseClient'

const USER_ID = 'lesson-cloud-user'

function makeMultiTableMock({ lessonInsert = { error: null }, lessonSelect = { data: [], error: null } } = {}) {
    return viSync.fn().mockImplementation((table) => {
        if (table === 'lessons') return {
            delete: viSync.fn().mockReturnValue({ eq: viSync.fn().mockResolvedValue({ error: null }) }),
            insert: viSync.fn().mockResolvedValue(lessonInsert),
            select: viSync.fn().mockReturnValue({ eq: viSync.fn().mockResolvedValue(lessonSelect) }),
        }
        // student_data + canvases — passthrough
        return {
            upsert:  viSync.fn().mockResolvedValue({ error: null }),
            delete:  viSync.fn().mockReturnValue({ eq: viSync.fn().mockResolvedValue({ error: null }) }),
            insert:  viSync.fn().mockResolvedValue({ error: null }),
            select:  viSync.fn().mockReturnValue({
                eq: viSync.fn().mockReturnValue({
                    maybeSingle: viSync.fn().mockResolvedValue({ data: null, error: null }),
                    then: (res, rej) => Promise.resolve({ data: [], error: null }).then(res, rej),
                    catch: (rej) => Promise.resolve({ data: [], error: null }).catch(rej),
                })
            }),
        }
    })
}

describe('cloudSync — lesson insert path', () => {
    it('lessons in localStorage are inserted into Supabase on saveToCloud', async () => {
        fetch.mockReturnValue(makeFetchResponse(geminiResponse(VALID_LESSON_JSON)))
        const result = await generateLesson('present perfect')
        storeLessonEntry(result)

        let insertedRows
        const mock = makeMultiTableMock()
        mock.mockImplementation((table) => {
            if (table === 'lessons') return {
                delete: viSync.fn().mockReturnValue({ eq: viSync.fn().mockResolvedValue({ error: null }) }),
                insert: viSync.fn().mockImplementation(async (rows) => { insertedRows = rows; return { error: null } }),
                select: viSync.fn().mockReturnValue({ eq: viSync.fn().mockResolvedValue({ data: [], error: null }) }),
            }
            return {
                upsert: viSync.fn().mockResolvedValue({ error: null }),
                delete: viSync.fn().mockReturnValue({ eq: viSync.fn().mockResolvedValue({ error: null }) }),
                insert: viSync.fn().mockResolvedValue({ error: null }),
                select: viSync.fn().mockReturnValue({
                    eq: viSync.fn().mockReturnValue({
                        maybeSingle: viSync.fn().mockResolvedValue({ data: null, error: null }),
                        then: (res, rej) => Promise.resolve({ data: [], error: null }).then(res, rej),
                        catch: (rej) => Promise.resolve({ data: [], error: null }).catch(rej),
                    })
                }),
            }
        })
        supabase.from = mock

        await saveToCloud(USER_ID)

        expect(insertedRows).toHaveLength(1)
        expect(insertedRows[0].user_id).toBe(USER_ID)
        expect(insertedRows[0].title).toBe('Present Perfect')
        expect(insertedRows[0].content.data.lesson.title).toBe('Present Perfect')
    })

    it('lesson title falls back to topic when title is missing from stored entry', async () => {
        const raw = [{ topic: 'conditionals', title: undefined, data: { lesson: { items: [] } } }]
        localStorage.setItem('app_custom_lessons', JSON.stringify(raw))

        let insertedRows
        supabase.from = viSync.fn().mockImplementation((table) => {
            if (table === 'lessons') return {
                delete: viSync.fn().mockReturnValue({ eq: viSync.fn().mockResolvedValue({ error: null }) }),
                insert: viSync.fn().mockImplementation(async (rows) => { insertedRows = rows; return { error: null } }),
                select: viSync.fn().mockReturnValue({ eq: viSync.fn().mockResolvedValue({ data: [], error: null }) }),
            }
            return {
                upsert: viSync.fn().mockResolvedValue({ error: null }),
                delete: viSync.fn().mockReturnValue({ eq: viSync.fn().mockResolvedValue({ error: null }) }),
                insert: viSync.fn().mockResolvedValue({ error: null }),
                select: viSync.fn().mockReturnValue({
                    eq: viSync.fn().mockReturnValue({
                        maybeSingle: viSync.fn().mockResolvedValue({ data: null, error: null }),
                        then: (res, rej) => Promise.resolve({ data: [], error: null }).then(res, rej),
                        catch: (rej) => Promise.resolve({ data: [], error: null }).catch(rej),
                    })
                }),
            }
        })

        await saveToCloud(USER_ID)

        expect(insertedRows[0].title).toBe('conditionals')
    })
})

describe('cloudSync — lesson retrieve path', () => {
    it('lessons from cloud are written to app_custom_lessons in localStorage', async () => {
        const cloudLesson = { id: 'l1', title: 'Conditionals', lesson: { items: [] } }
        supabase.from = makeMultiTableMock({
            lessonSelect: { data: [{ content: cloudLesson }], error: null },
        })

        await retrieveFromCloud(USER_ID)

        const stored = JSON.parse(localStorage.getItem('app_custom_lessons'))
        expect(stored).toHaveLength(1)
        expect(stored[0]).toEqual(cloudLesson)
    })

    it('empty cloud lesson list does not overwrite existing local lessons', async () => {
        const local = [{ id: 'local-1', title: 'Local Lesson' }]
        localStorage.setItem('app_custom_lessons', JSON.stringify(local))

        supabase.from = makeMultiTableMock({ lessonSelect: { data: [], error: null } })

        await retrieveFromCloud(USER_ID)

        const stored = JSON.parse(localStorage.getItem('app_custom_lessons'))
        expect(stored[0].title).toBe('Local Lesson')
    })
})

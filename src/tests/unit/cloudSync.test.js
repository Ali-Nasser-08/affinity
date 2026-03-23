/**
 * Unit Tests: src/utils/cloudSync.js
 *
 * Tests saveToCloud and retrieveFromCloud with a fully mocked Supabase client.
 * localStorage is mocked in-memory so no real browser APIs are needed.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'

// ─── Mock supabaseClient ────────────────────────────────────────────────────
vi.mock('../../utils/supabaseClient', () => ({
    supabase: { from: vi.fn() }
}))

import { supabase } from '../../utils/supabaseClient'
import { saveToCloud, retrieveFromCloud } from '../../utils/cloudSync'

// ─── Mock localStorage ──────────────────────────────────────────────────────
const store = {}
const mockLS = {
    getItem:    (k)    => store[k] ?? null,
    setItem:    (k, v) => { store[k] = String(v) },
    removeItem: (k)    => { delete store[k] },
    clear:      ()     => { Object.keys(store).forEach(k => delete store[k]) }
}
Object.defineProperty(globalThis, 'localStorage', { value: mockLS, writable: true })

// ─── Helpers ────────────────────────────────────────────────────────────────

/**
 * Build a fluent Supabase table mock.
 * Shape mirrors the real client: from(table) → { upsert, delete, insert, select }
 */
function makeTableMock({
    upsertResult  = { error: null },
    deleteEqResult = { error: null },
    insertResult  = { error: null },
    selectResult  = { data: null, error: null },     // for .select().eq() chains
    maybeSingleResult = { data: null, error: null }, // for .select().eq().maybeSingle()
} = {}) {
    return {
        upsert: vi.fn().mockResolvedValue(upsertResult),
        delete: vi.fn().mockReturnValue({
            eq: vi.fn().mockResolvedValue(deleteEqResult)
        }),
        insert: vi.fn().mockResolvedValue(insertResult),
        select: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
                // resolves directly (lessons / canvases in retrieve)
                then: (res, rej) => Promise.resolve(selectResult).then(res, rej),
                catch: (rej) => Promise.resolve(selectResult).catch(rej),
                // resolves via maybeSingle (student_data in retrieve)
                maybeSingle: vi.fn().mockResolvedValue(maybeSingleResult),
            })
        })
    }
}

const USER_ID = 'user-abc-123'

beforeEach(() => {
    localStorage.clear()
    vi.clearAllMocks()
})

// ══════════════════════════════════════════════════════════════════════════════
// saveToCloud
// ══════════════════════════════════════════════════════════════════════════════

describe('saveToCloud — student data', () => {
    it('upserts student data from localStorage', async () => {
        const classes = [{ id: '1', name: 'Class 1', students: [] }]
        localStorage.setItem('app_classes', JSON.stringify(classes))
        localStorage.setItem('app_current_class_id', '1')

        const tableMock = makeTableMock()
        supabase.from.mockReturnValue(tableMock)

        await saveToCloud(USER_ID)

        expect(supabase.from).toHaveBeenCalledWith('student_data')
        expect(tableMock.upsert).toHaveBeenCalledWith(
            expect.objectContaining({ user_id: USER_ID, classes }),
            { onConflict: 'user_id' }
        )
    })

    it('throws a descriptive error when student upsert fails', async () => {
        localStorage.setItem('app_classes', '[]')
        const tableMock = makeTableMock({ upsertResult: { error: { message: 'upsert failed' } } })
        supabase.from.mockReturnValue(tableMock)

        await expect(saveToCloud(USER_ID)).rejects.toThrow('Students: upsert failed')
    })
})

describe('saveToCloud — lessons', () => {
    it('deletes then inserts lessons when lessons exist', async () => {
        const lessons = [{ title: 'Past Simple', topic: 'grammar' }]
        localStorage.setItem('app_classes', '[]')
        localStorage.setItem('app_custom_lessons', JSON.stringify(lessons))

        const tableMock = makeTableMock()
        supabase.from.mockReturnValue(tableMock)

        await saveToCloud(USER_ID)

        expect(tableMock.delete).toHaveBeenCalled()
        expect(tableMock.insert).toHaveBeenCalledWith(
            expect.arrayContaining([
                expect.objectContaining({ user_id: USER_ID, title: 'Past Simple' })
            ])
        )
    })

    it('skips lesson insert when lessons array is empty', async () => {
        localStorage.setItem('app_classes', '[]')
        localStorage.setItem('app_custom_lessons', '[]')

        const tableMock = makeTableMock()
        supabase.from.mockReturnValue(tableMock)

        await saveToCloud(USER_ID)

        // delete still runs, insert does NOT
        expect(tableMock.delete).toHaveBeenCalled()
        expect(tableMock.insert).not.toHaveBeenCalledWith(
            expect.arrayContaining([expect.objectContaining({ title: expect.any(String) })])
        )
    })

    it('falls back to "Untitled Lesson" when lesson has no title or topic', async () => {
        localStorage.setItem('app_classes', '[]')
        localStorage.setItem('app_custom_lessons', JSON.stringify([{ content: 'x' }]))

        const tableMock = makeTableMock()
        supabase.from.mockReturnValue(tableMock)

        await saveToCloud(USER_ID)

        expect(tableMock.insert).toHaveBeenCalledWith(
            expect.arrayContaining([
                expect.objectContaining({ title: 'Untitled Lesson' })
            ])
        )
    })

    it('throws when lesson delete fails', async () => {
        localStorage.setItem('app_classes', '[]')
        localStorage.setItem('app_custom_lessons', '[]')

        // First call (student_data) → ok, subsequent calls (lessons) → delete error
        supabase.from
            .mockReturnValueOnce(makeTableMock())                                          // student_data
            .mockReturnValueOnce(makeTableMock({ deleteEqResult: { error: { message: 'delete err' } } })) // lessons

        await expect(saveToCloud(USER_ID)).rejects.toThrow('Lessons (delete): delete err')
    })

    it('throws when lesson insert fails', async () => {
        localStorage.setItem('app_classes', '[]')
        localStorage.setItem('app_custom_lessons', JSON.stringify([{ title: 'Lesson A' }]))

        supabase.from
            .mockReturnValueOnce(makeTableMock())  // student_data upsert
            .mockReturnValueOnce(makeTableMock())  // lessons delete
            .mockReturnValueOnce(makeTableMock({ insertResult: { error: { message: 'insert err' } } })) // lessons insert

        await expect(saveToCloud(USER_ID)).rejects.toThrow('Lessons (insert): insert err')
    })
})

describe('saveToCloud — canvases', () => {
    it('deletes then inserts canvases when canvases exist', async () => {
        const canvases = [{ title: 'My Canvas', shapes: [] }]
        localStorage.setItem('app_classes', '[]')
        localStorage.setItem('affinity_canvases', JSON.stringify(canvases))

        const tableMock = makeTableMock()
        supabase.from.mockReturnValue(tableMock)

        await saveToCloud(USER_ID)

        expect(tableMock.insert).toHaveBeenCalledWith(
            expect.arrayContaining([
                expect.objectContaining({ user_id: USER_ID, title: 'My Canvas' })
            ])
        )
    })

    it('uses canvas.name as fallback title', async () => {
        localStorage.setItem('app_classes', '[]')
        localStorage.setItem('affinity_canvases', JSON.stringify([{ name: 'Canvas B' }]))

        const tableMock = makeTableMock()
        supabase.from.mockReturnValue(tableMock)

        await saveToCloud(USER_ID)

        expect(tableMock.insert).toHaveBeenCalledWith(
            expect.arrayContaining([expect.objectContaining({ title: 'Canvas B' })])
        )
    })

    it('throws when canvas delete fails', async () => {
        localStorage.setItem('app_classes', '[]')
        localStorage.setItem('app_custom_lessons', '[]')
        localStorage.setItem('affinity_canvases', '[]')

        supabase.from
            .mockReturnValueOnce(makeTableMock())  // student_data
            .mockReturnValueOnce(makeTableMock())  // lessons delete
            .mockReturnValueOnce(makeTableMock({ deleteEqResult: { error: { message: 'canvas del err' } } })) // canvases

        await expect(saveToCloud(USER_ID)).rejects.toThrow('Canvases (delete): canvas del err')
    })
})

// ══════════════════════════════════════════════════════════════════════════════
// retrieveFromCloud
// ══════════════════════════════════════════════════════════════════════════════

describe('retrieveFromCloud — student data', () => {
    it('writes classes and currentClassId to localStorage', async () => {
        const studentData = { classes: [{ id: '1', name: 'Class A', students: [] }], current_class_id: '1' }

        supabase.from.mockReturnValue(makeTableMock({
            maybeSingleResult: { data: studentData, error: null },
            selectResult:      { data: [], error: null }
        }))

        const result = await retrieveFromCloud(USER_ID)

        expect(localStorage.getItem('app_classes')).toBe(JSON.stringify(studentData.classes))
        expect(localStorage.getItem('app_current_class_id')).toBe('1')
        expect(result.classes).toEqual(studentData.classes)
        expect(result.currentClassId).toBe('1')
    })

    it('does not write current_class_id when it is null', async () => {
        const studentData = { classes: [], current_class_id: null }

        supabase.from.mockReturnValue(makeTableMock({
            maybeSingleResult: { data: studentData, error: null },
            selectResult:      { data: [], error: null }
        }))

        await retrieveFromCloud(USER_ID)

        expect(localStorage.getItem('app_current_class_id')).toBeNull()
    })

    it('returns empty defaults when no student data exists in cloud', async () => {
        supabase.from.mockReturnValue(makeTableMock({
            maybeSingleResult: { data: null, error: null },
            selectResult:      { data: [], error: null }
        }))

        const result = await retrieveFromCloud(USER_ID)

        expect(result.classes).toEqual([])
        expect(result.currentClassId).toBeNull()
    })

    it('throws a descriptive error when student fetch fails', async () => {
        supabase.from.mockReturnValue(makeTableMock({
            maybeSingleResult: { data: null, error: { message: 'db error' } },
            selectResult:      { data: [], error: null }
        }))

        await expect(retrieveFromCloud(USER_ID)).rejects.toThrow('Students: db error')
    })
})

describe('retrieveFromCloud — lessons', () => {
    it('writes lessons to localStorage when cloud has data', async () => {
        const lessonRows = [{ content: { title: 'Lesson 1' } }, { content: { title: 'Lesson 2' } }]

        supabase.from
            .mockReturnValueOnce(makeTableMock({ maybeSingleResult: { data: null, error: null }, selectResult: { data: [], error: null } }))  // student_data
            .mockReturnValueOnce(makeTableMock({ selectResult: { data: lessonRows, error: null } }))  // lessons
            .mockReturnValueOnce(makeTableMock({ selectResult: { data: [], error: null } }))          // canvases

        await retrieveFromCloud(USER_ID)

        const stored = JSON.parse(localStorage.getItem('app_custom_lessons'))
        expect(stored).toHaveLength(2)
        expect(stored[0].title).toBe('Lesson 1')
    })

    it('does NOT overwrite localStorage when cloud lessons are empty', async () => {
        localStorage.setItem('app_custom_lessons', JSON.stringify([{ title: 'Local Lesson' }]))

        supabase.from
            .mockReturnValueOnce(makeTableMock({ maybeSingleResult: { data: null, error: null }, selectResult: { data: [], error: null } }))
            .mockReturnValueOnce(makeTableMock({ selectResult: { data: [], error: null } }))
            .mockReturnValueOnce(makeTableMock({ selectResult: { data: [], error: null } }))

        await retrieveFromCloud(USER_ID)

        const stored = JSON.parse(localStorage.getItem('app_custom_lessons'))
        expect(stored[0].title).toBe('Local Lesson')
    })

    it('throws when lesson fetch fails', async () => {
        supabase.from
            .mockReturnValueOnce(makeTableMock({ maybeSingleResult: { data: null, error: null }, selectResult: { data: [], error: null } }))
            .mockReturnValueOnce(makeTableMock({ selectResult: { data: null, error: { message: 'lessons err' } } }))

        await expect(retrieveFromCloud(USER_ID)).rejects.toThrow('Lessons: lessons err')
    })
})

describe('retrieveFromCloud — canvases', () => {
    it('writes canvases to localStorage when cloud has data', async () => {
        const canvasRows = [{ content: { title: 'Canvas 1' } }]

        supabase.from
            .mockReturnValueOnce(makeTableMock({ maybeSingleResult: { data: null, error: null }, selectResult: { data: [], error: null } }))
            .mockReturnValueOnce(makeTableMock({ selectResult: { data: [], error: null } }))
            .mockReturnValueOnce(makeTableMock({ selectResult: { data: canvasRows, error: null } }))

        await retrieveFromCloud(USER_ID)

        const stored = JSON.parse(localStorage.getItem('affinity_canvases'))
        expect(stored[0].title).toBe('Canvas 1')
    })

    it('does NOT overwrite localStorage when cloud canvases are empty', async () => {
        localStorage.setItem('affinity_canvases', JSON.stringify([{ title: 'Local Canvas' }]))

        supabase.from
            .mockReturnValueOnce(makeTableMock({ maybeSingleResult: { data: null, error: null }, selectResult: { data: [], error: null } }))
            .mockReturnValueOnce(makeTableMock({ selectResult: { data: [], error: null } }))
            .mockReturnValueOnce(makeTableMock({ selectResult: { data: [], error: null } }))

        await retrieveFromCloud(USER_ID)

        const stored = JSON.parse(localStorage.getItem('affinity_canvases'))
        expect(stored[0].title).toBe('Local Canvas')
    })

    it('throws when canvas fetch fails', async () => {
        supabase.from
            .mockReturnValueOnce(makeTableMock({ maybeSingleResult: { data: null, error: null }, selectResult: { data: [], error: null } }))
            .mockReturnValueOnce(makeTableMock({ selectResult: { data: [], error: null } }))
            .mockReturnValueOnce(makeTableMock({ selectResult: { data: null, error: { message: 'canvas err' } } }))

        await expect(retrieveFromCloud(USER_ID)).rejects.toThrow('Canvases: canvas err')
    })
})

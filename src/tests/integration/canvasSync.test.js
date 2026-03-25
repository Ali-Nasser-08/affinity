/**
 * Integration Tests: canvas localStorage ↔ cloudSync
 *
 * Canvases are stored under the key `affinity_canvases` and synced via
 * saveToCloud / retrieveFromCloud. No dedicated hook — cloudSync reads
 * localStorage directly. Verifies the full pipeline:
 *   localStorage write → saveToCloud → retrieveFromCloud → localStorage read
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { saveToCloud, retrieveFromCloud } from '../../utils/cloudSync'

vi.mock('../../utils/supabaseClient', () => ({
    supabase: { from: vi.fn() }
}))

import { supabase } from '../../utils/supabaseClient'

// ─── in-memory localStorage ───────────────────────────────────────────────────
const store = {}
const mockLS = {
    getItem:    (k)    => store[k] ?? null,
    setItem:    (k, v) => { store[k] = String(v) },
    removeItem: (k)    => { delete store[k] },
    clear:      ()     => { Object.keys(store).forEach(k => delete store[k]) },
}
Object.defineProperty(globalThis, 'localStorage', { value: mockLS, writable: true })

const USER_ID = 'canvas-test-user'

function makeSupabaseMock({
    studentUpsert  = { error: null },
    lessonDelete   = { error: null },
    canvasDelete   = { error: null },
    canvasInsert   = { error: null },
    studentSelect  = { data: null, error: null },
    lessonSelect   = { data: [], error: null },
    canvasSelect   = { data: [], error: null },
} = {}) {
    return vi.fn().mockImplementation((table) => {
        if (table === 'student_data') return {
            upsert: vi.fn().mockResolvedValue(studentUpsert),
            select: vi.fn().mockReturnValue({
                eq: vi.fn().mockReturnValue({
                    maybeSingle: vi.fn().mockResolvedValue(studentSelect),
                })
            }),
        }
        if (table === 'lessons') return {
            delete: vi.fn().mockReturnValue({ eq: vi.fn().mockResolvedValue(lessonDelete) }),
            insert: vi.fn().mockResolvedValue({ error: null }),
            select: vi.fn().mockReturnValue({ eq: vi.fn().mockResolvedValue(lessonSelect) }),
        }
        if (table === 'canvases') return {
            delete: vi.fn().mockReturnValue({ eq: vi.fn().mockResolvedValue(canvasDelete) }),
            insert: vi.fn().mockResolvedValue(canvasInsert),
            select: vi.fn().mockReturnValue({ eq: vi.fn().mockResolvedValue(canvasSelect) }),
        }
    })
}

const SAMPLE_CANVAS = {
    id: 'canvas-1',
    title: 'Unit 7 Diagram',
    strokes: [{ x: 10, y: 20 }, { x: 30, y: 40 }],
    createdAt: '2025-01-01T00:00:00.000Z',
}

beforeEach(() => {
    localStorage.clear()
    vi.clearAllMocks()
})

// ══════════════════════════════════════════════════════════════════════════════
// save → Supabase shape
// ══════════════════════════════════════════════════════════════════════════════

describe('canvas save → Supabase shape', () => {
    it('canvas stored in localStorage is included in the saveToCloud insert', async () => {
        localStorage.setItem('affinity_canvases', JSON.stringify([SAMPLE_CANVAS]))

        let insertedRows
        const fromMock = makeSupabaseMock()
        fromMock.mockImplementation((table) => {
            if (table === 'canvases') return {
                delete: vi.fn().mockReturnValue({ eq: vi.fn().mockResolvedValue({ error: null }) }),
                insert: vi.fn().mockImplementation(async (rows) => { insertedRows = rows; return { error: null } }),
                select: vi.fn().mockReturnValue({ eq: vi.fn().mockResolvedValue({ data: [], error: null }) }),
            }
            // passthrough for other tables
            return {
                upsert: vi.fn().mockResolvedValue({ error: null }),
                delete: vi.fn().mockReturnValue({ eq: vi.fn().mockResolvedValue({ error: null }) }),
                insert: vi.fn().mockResolvedValue({ error: null }),
                select: vi.fn().mockReturnValue({ eq: vi.fn().mockResolvedValue({ data: null, error: null }) }),
            }
        })
        supabase.from = fromMock

        await saveToCloud(USER_ID)

        expect(insertedRows).toHaveLength(1)
        expect(insertedRows[0].user_id).toBe(USER_ID)
        expect(insertedRows[0].title).toBe('Unit 7 Diagram')
        expect(insertedRows[0].content).toEqual(SAMPLE_CANVAS)
    })

    it('canvas without a title falls back to "Untitled Canvas"', async () => {
        const untitled = { id: 'canvas-2', strokes: [] }
        localStorage.setItem('affinity_canvases', JSON.stringify([untitled]))

        let insertedRows
        const fromMock = makeSupabaseMock()
        fromMock.mockImplementation((table) => {
            if (table === 'canvases') return {
                delete: vi.fn().mockReturnValue({ eq: vi.fn().mockResolvedValue({ error: null }) }),
                insert: vi.fn().mockImplementation(async (rows) => { insertedRows = rows; return { error: null } }),
                select: vi.fn().mockReturnValue({ eq: vi.fn().mockResolvedValue({ data: [], error: null }) }),
            }
            return {
                upsert: vi.fn().mockResolvedValue({ error: null }),
                delete: vi.fn().mockReturnValue({ eq: vi.fn().mockResolvedValue({ error: null }) }),
                insert: vi.fn().mockResolvedValue({ error: null }),
                select: vi.fn().mockReturnValue({ eq: vi.fn().mockResolvedValue({ data: null, error: null }) }),
            }
        })
        supabase.from = fromMock

        await saveToCloud(USER_ID)

        expect(insertedRows[0].title).toBe('Untitled Canvas')
    })

    it('empty canvas list skips the insert call entirely', async () => {
        localStorage.setItem('affinity_canvases', JSON.stringify([]))

        let insertCalled = false
        const fromMock = makeSupabaseMock()
        fromMock.mockImplementation((table) => {
            if (table === 'canvases') return {
                delete: vi.fn().mockReturnValue({ eq: vi.fn().mockResolvedValue({ error: null }) }),
                insert: vi.fn().mockImplementation(async () => { insertCalled = true; return { error: null } }),
                select: vi.fn().mockReturnValue({ eq: vi.fn().mockResolvedValue({ data: [], error: null }) }),
            }
            return {
                upsert: vi.fn().mockResolvedValue({ error: null }),
                delete: vi.fn().mockReturnValue({ eq: vi.fn().mockResolvedValue({ error: null }) }),
                insert: vi.fn().mockResolvedValue({ error: null }),
                select: vi.fn().mockReturnValue({ eq: vi.fn().mockResolvedValue({ data: null, error: null }) }),
            }
        })
        supabase.from = fromMock

        await saveToCloud(USER_ID)

        expect(insertCalled).toBe(false)
    })

    it('multiple canvases are all inserted as separate rows', async () => {
        const canvases = [
            { id: 'c1', title: 'Board A', strokes: [] },
            { id: 'c2', title: 'Board B', strokes: [] },
            { id: 'c3', title: 'Board C', strokes: [] },
        ]
        localStorage.setItem('affinity_canvases', JSON.stringify(canvases))

        let insertedRows
        const fromMock = makeSupabaseMock()
        fromMock.mockImplementation((table) => {
            if (table === 'canvases') return {
                delete: vi.fn().mockReturnValue({ eq: vi.fn().mockResolvedValue({ error: null }) }),
                insert: vi.fn().mockImplementation(async (rows) => { insertedRows = rows; return { error: null } }),
                select: vi.fn().mockReturnValue({ eq: vi.fn().mockResolvedValue({ data: [], error: null }) }),
            }
            return {
                upsert: vi.fn().mockResolvedValue({ error: null }),
                delete: vi.fn().mockReturnValue({ eq: vi.fn().mockResolvedValue({ error: null }) }),
                insert: vi.fn().mockResolvedValue({ error: null }),
                select: vi.fn().mockReturnValue({ eq: vi.fn().mockResolvedValue({ data: null, error: null }) }),
            }
        })
        supabase.from = fromMock

        await saveToCloud(USER_ID)

        expect(insertedRows).toHaveLength(3)
        expect(insertedRows.map(r => r.title)).toEqual(['Board A', 'Board B', 'Board C'])
    })
})

// ══════════════════════════════════════════════════════════════════════════════
// retrieve → localStorage
// ══════════════════════════════════════════════════════════════════════════════

describe('canvas retrieve → localStorage', () => {
    it('canvas data returned from cloud is written to affinity_canvases', async () => {
        supabase.from = makeSupabaseMock({
            studentSelect: { data: null, error: null },
            lessonSelect:  { data: [], error: null },
            canvasSelect:  { data: [{ content: SAMPLE_CANVAS }], error: null },
        })

        await retrieveFromCloud(USER_ID)

        const stored = JSON.parse(localStorage.getItem('affinity_canvases'))
        expect(stored).toHaveLength(1)
        expect(stored[0]).toEqual(SAMPLE_CANVAS)
    })

    it('multiple canvases from cloud are all written to localStorage', async () => {
        const cloudCanvases = [
            { content: { id: 'c1', title: 'Alpha', strokes: [] } },
            { content: { id: 'c2', title: 'Beta',  strokes: [] } },
        ]
        supabase.from = makeSupabaseMock({
            studentSelect: { data: null, error: null },
            lessonSelect:  { data: [], error: null },
            canvasSelect:  { data: cloudCanvases, error: null },
        })

        await retrieveFromCloud(USER_ID)

        const stored = JSON.parse(localStorage.getItem('affinity_canvases'))
        expect(stored).toHaveLength(2)
        expect(stored[0].title).toBe('Alpha')
        expect(stored[1].title).toBe('Beta')
    })

    it('empty cloud canvas list does not overwrite existing local canvases', async () => {
        localStorage.setItem('affinity_canvases', JSON.stringify([SAMPLE_CANVAS]))

        supabase.from = makeSupabaseMock({
            studentSelect: { data: null, error: null },
            lessonSelect:  { data: [], error: null },
            canvasSelect:  { data: [], error: null },
        })

        await retrieveFromCloud(USER_ID)

        const stored = JSON.parse(localStorage.getItem('affinity_canvases'))
        expect(stored).toHaveLength(1)
        expect(stored[0].title).toBe('Unit 7 Diagram')
    })
})

// ══════════════════════════════════════════════════════════════════════════════
// full round-trip
// ══════════════════════════════════════════════════════════════════════════════

describe('canvas full round-trip: save → clear → retrieve', () => {
    it('canvas strokes survive a full cloud sync cycle', async () => {
        const canvas = { id: 'rt-1', title: 'Round Trip Board', strokes: [{ x: 5, y: 15 }] }
        localStorage.setItem('affinity_canvases', JSON.stringify([canvas]))

        // Capture what gets inserted
        let capturedContent
        const fromMock = vi.fn().mockImplementation((table) => {
            if (table === 'canvases') return {
                delete: vi.fn().mockReturnValue({ eq: vi.fn().mockResolvedValue({ error: null }) }),
                insert: vi.fn().mockImplementation(async (rows) => { capturedContent = rows[0].content; return { error: null } }),
                select: vi.fn().mockReturnValue({ eq: vi.fn().mockResolvedValue({ data: [], error: null }) }),
            }
            return {
                upsert: vi.fn().mockResolvedValue({ error: null }),
                delete: vi.fn().mockReturnValue({ eq: vi.fn().mockResolvedValue({ error: null }) }),
                insert: vi.fn().mockResolvedValue({ error: null }),
                select: vi.fn().mockReturnValue({ eq: vi.fn().mockResolvedValue({ data: null, error: null }) }),
            }
        })
        supabase.from = fromMock
        await saveToCloud(USER_ID)

        localStorage.clear()

        supabase.from = makeSupabaseMock({
            studentSelect: { data: null, error: null },
            lessonSelect:  { data: [], error: null },
            canvasSelect:  { data: [{ content: capturedContent }], error: null },
        })
        await retrieveFromCloud(USER_ID)

        const stored = JSON.parse(localStorage.getItem('affinity_canvases'))
        expect(stored[0].strokes).toEqual([{ x: 5, y: 15 }])
        expect(stored[0].title).toBe('Round Trip Board')
    })
})

// ══════════════════════════════════════════════════════════════════════════════
// error handling
// ══════════════════════════════════════════════════════════════════════════════

describe('canvas cloudSync error handling', () => {
    it('canvas delete error causes saveToCloud to throw', async () => {
        localStorage.setItem('affinity_canvases', JSON.stringify([SAMPLE_CANVAS]))

        supabase.from = vi.fn().mockImplementation((table) => {
            if (table === 'canvases') return {
                delete: vi.fn().mockReturnValue({ eq: vi.fn().mockResolvedValue({ error: { message: 'DB error' } }) }),
            }
            return {
                upsert: vi.fn().mockResolvedValue({ error: null }),
                delete: vi.fn().mockReturnValue({ eq: vi.fn().mockResolvedValue({ error: null }) }),
                insert: vi.fn().mockResolvedValue({ error: null }),
                select: vi.fn().mockReturnValue({ eq: vi.fn().mockResolvedValue({ data: null, error: null }) }),
            }
        })

        await expect(saveToCloud(USER_ID)).rejects.toThrow('Canvases (delete)')
    })

    it('canvas retrieve error causes retrieveFromCloud to throw', async () => {
        supabase.from = makeSupabaseMock({
            studentSelect: { data: null, error: null },
            lessonSelect:  { data: [], error: null },
            canvasSelect:  { data: null, error: { message: 'fetch failed' } },
        })

        await expect(retrieveFromCloud(USER_ID)).rejects.toThrow('Canvases')
    })
})

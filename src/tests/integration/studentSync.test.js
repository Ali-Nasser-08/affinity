/**
 * Integration Tests: useStudents ↔ cloudSync
 *
 * Neither module is mocked — they run together against a mocked Supabase client
 * and in-memory localStorage. Verifies that the data shape flowing between them
 * is correct: what the hook writes is what cloudSync can consume, and vice versa.
 */

import React, { act } from 'react'
import { createRoot } from 'react-dom/client'
import { vi, describe, it, expect, beforeEach } from 'vitest'
import { useStudents } from '../../hooks/useStudents'
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

globalThis.IS_REACT_ACT_ENVIRONMENT = true

function renderHook(hookFn) {
    const result = { current: null }
    function Wrapper() { result.current = hookFn(); return null }
    const container = document.createElement('div')
    const root = createRoot(container)
    act(() => root.render(React.createElement(Wrapper)))
    return { result, unmount: () => act(() => root.unmount()) }
}

function makeTableMock({
    upsertResult      = { error: null },
    deleteEqResult    = { error: null },
    insertResult      = { error: null },
    selectResult      = { data: null, error: null },
    maybeSingleResult = { data: null, error: null },
} = {}) {
    return {
        upsert: vi.fn().mockResolvedValue(upsertResult),
        delete: vi.fn().mockReturnValue({ eq: vi.fn().mockResolvedValue(deleteEqResult) }),
        insert: vi.fn().mockResolvedValue(insertResult),
        select: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
                then:         (res, rej) => Promise.resolve(selectResult).then(res, rej),
                catch:        (rej)      => Promise.resolve(selectResult).catch(rej),
                maybeSingle:  vi.fn().mockResolvedValue(maybeSingleResult),
            })
        })
    }
}

const USER_ID = 'integration-test-user'

beforeEach(() => {
    localStorage.clear()
    vi.clearAllMocks()
})

// ══════════════════════════════════════════════════════════════════════════════
// hook → cloudSync shape contract
// ══════════════════════════════════════════════════════════════════════════════

describe('useStudents → cloudSync: shape contract', () => {
    it('hook-written localStorage is consumed correctly by saveToCloud', async () => {
        const { result } = renderHook(() => useStudents())
        act(() => {
            result.current.addStudent('Alice', 'star', 'cyan')
            result.current.addStudent('Bob', 'person', 'pink')
        })

        const tableMock = makeTableMock()
        supabase.from.mockReturnValue(tableMock)

        await saveToCloud(USER_ID)

        const upsertCall = tableMock.upsert.mock.calls[0][0]
        expect(upsertCall.user_id).toBe(USER_ID)
        expect(upsertCall.classes).toBeInstanceOf(Array)
        expect(upsertCall.classes[0].students).toHaveLength(2)
        expect(upsertCall.classes[0].students[0]).toMatchObject({
            name: 'Alice', logoId: 'star', colorKey: 'cyan', stars: [],
        })
    })

    it('current class id written by hook matches what cloudSync upserts', async () => {
        const { result } = renderHook(() => useStudents())
        act(() => result.current.addClass())
        const secondId = result.current.classes[1].id
        act(() => result.current.setCurrentClassId(secondId))

        const tableMock = makeTableMock()
        supabase.from.mockReturnValue(tableMock)

        await saveToCloud(USER_ID)

        const upsertCall = tableMock.upsert.mock.calls[0][0]
        expect(upsertCall.current_class_id).toBe(secondId)
    })

    it('stars accumulated in hook are preserved through saveToCloud', async () => {
        const { result } = renderHook(() => useStudents())
        act(() => result.current.addStudent('Carol', 'person', 'teal'))
        const id = result.current.students[0].id
        act(() => {
            result.current.addStar(id, 'star-base')
            result.current.addStar(id, 'star-spark')
            result.current.addStar(id, 'star-radiant')
        })

        const tableMock = makeTableMock()
        supabase.from.mockReturnValue(tableMock)

        await saveToCloud(USER_ID)

        const upsertCall  = tableMock.upsert.mock.calls[0][0]
        const carol = upsertCall.classes[0].students[0]
        expect(carol.stars).toEqual(['star-base', 'star-spark', 'star-radiant'])
    })

    it('all classes are included in the upsert payload', async () => {
        const { result } = renderHook(() => useStudents())
        act(() => result.current.addStudent('Dan', 'person', 'blue'))
        act(() => result.current.addClass())
        act(() => result.current.addStudent('Eve', 'star', 'lime'))

        const tableMock = makeTableMock()
        supabase.from.mockReturnValue(tableMock)

        await saveToCloud(USER_ID)

        const upsertCall = tableMock.upsert.mock.calls[0][0]
        expect(upsertCall.classes).toHaveLength(2)
        expect(upsertCall.classes[0].students[0].name).toBe('Dan')
        expect(upsertCall.classes[1].students[0].name).toBe('Eve')
    })
})

// ══════════════════════════════════════════════════════════════════════════════
// cloudSync → hook shape contract
// ══════════════════════════════════════════════════════════════════════════════

describe('cloudSync → useStudents: shape contract', () => {
    it('data retrieved from cloud loads correctly into a fresh hook instance', async () => {
        const cloudData = {
            classes: [{
                id: 'cls-1', name: 'Morning Class',
                students: [{ id: 'stu-1', name: 'Frank', logoId: 'person', colorKey: 'orange', stars: ['star-base'] }],
            }],
            current_class_id: 'cls-1',
        }

        supabase.from.mockReturnValue(makeTableMock({
            maybeSingleResult: { data: cloudData, error: null },
            selectResult:      { data: [], error: null },
        }))

        await retrieveFromCloud(USER_ID)

        const { result } = renderHook(() => useStudents())
        expect(result.current.classes).toHaveLength(1)
        expect(result.current.currentClassId).toBe('cls-1')
        expect(result.current.students[0].name).toBe('Frank')
        expect(result.current.students[0].stars).toEqual(['star-base'])
    })

    it('hook reflects the correct active class and its students after retrieve', async () => {
        const cloudData = {
            classes: [
                { id: 'cls-a', name: 'Class A', students: [{ id: 'stu-a', name: 'Grace', logoId: 'star', colorKey: 'red', stars: [] }] },
                { id: 'cls-b', name: 'Class B', students: [] },
            ],
            current_class_id: 'cls-a',
        }

        supabase.from.mockReturnValue(makeTableMock({
            maybeSingleResult: { data: cloudData, error: null },
            selectResult:      { data: [], error: null },
        }))

        await retrieveFromCloud(USER_ID)

        const { result } = renderHook(() => useStudents())
        expect(result.current.currentClassId).toBe('cls-a')
        expect(result.current.students[0].name).toBe('Grace')
        expect(result.current.classes).toHaveLength(2)
    })
})

// ══════════════════════════════════════════════════════════════════════════════
// full round-trip
// ══════════════════════════════════════════════════════════════════════════════

describe('full round-trip: hook → save → clear → retrieve → fresh hook', () => {
    it('student data is fully preserved across a cloud sync cycle', async () => {
        // 1. Build state via hook
        const { result: r1, unmount } = renderHook(() => useStudents())
        act(() => r1.current.addStudent('Hana', 'person', 'purple'))
        const studentId = r1.current.students[0].id
        const classId   = r1.current.currentClassId
        act(() => {
            r1.current.addStar(studentId, 'star-base')
            r1.current.addStar(studentId, 'star-legendary')
        })
        unmount()

        // 2. Capture what saveToCloud upserts
        let capturedPayload
        const saveMock = makeTableMock()
        saveMock.upsert.mockImplementation(async (data) => {
            capturedPayload = data
            return { error: null }
        })
        supabase.from.mockReturnValue(saveMock)
        await saveToCloud(USER_ID)

        // 3. Wipe localStorage (simulate a fresh device / session)
        localStorage.clear()

        // 4. Retrieve from cloud using the captured payload
        supabase.from.mockReturnValue(makeTableMock({
            maybeSingleResult: {
                data: {
                    classes:          capturedPayload.classes,
                    current_class_id: capturedPayload.current_class_id,
                },
                error: null,
            },
            selectResult: { data: [], error: null },
        }))
        await retrieveFromCloud(USER_ID)

        // 5. Fresh hook should have Hana with both stars intact
        const { result: r2 } = renderHook(() => useStudents())
        expect(r2.current.currentClassId).toBe(classId)
        expect(r2.current.students[0].name).toBe('Hana')
        expect(r2.current.students[0].stars).toEqual(['star-base', 'star-legendary'])
    })
})

// ══════════════════════════════════════════════════════════════════════════════
// hook operations: update, delete student / rename, delete class
// ══════════════════════════════════════════════════════════════════════════════

describe('useStudents — updateStudent', () => {
    it('updates the student name, logoId, and colorKey', () => {
        const { result } = renderHook(() => useStudents())
        act(() => result.current.addStudent('Old Name', 'person', 'cyan'))
        const id = result.current.students[0].id

        act(() => result.current.updateStudent(id, 'New Name', 'star', 'pink'))

        const s = result.current.students[0]
        expect(s.name).toBe('New Name')
        expect(s.logoId).toBe('star')
        expect(s.colorKey).toBe('pink')
    })

    it('trims whitespace from the updated name', () => {
        const { result } = renderHook(() => useStudents())
        act(() => result.current.addStudent('Alice', 'person', 'cyan'))
        const id = result.current.students[0].id

        act(() => result.current.updateStudent(id, '  Trimmed  ', 'person', 'cyan'))

        expect(result.current.students[0].name).toBe('Trimmed')
    })

    it('ignores update when the new name is blank', () => {
        const { result } = renderHook(() => useStudents())
        act(() => result.current.addStudent('Bob', 'person', 'teal'))
        const id = result.current.students[0].id

        act(() => result.current.updateStudent(id, '   ', 'person', 'teal'))

        expect(result.current.students[0].name).toBe('Bob')
    })

    it('does not affect other students when one is updated', () => {
        const { result } = renderHook(() => useStudents())
        act(() => {
            result.current.addStudent('Alice', 'person', 'cyan')
            result.current.addStudent('Bob',   'person', 'teal')
        })
        const aliceId = result.current.students[0].id

        act(() => result.current.updateStudent(aliceId, 'Alice Updated', 'star', 'pink'))

        expect(result.current.students[1].name).toBe('Bob')
    })
})

describe('useStudents — deleteStudent', () => {
    it('removes the student from the list', () => {
        const { result } = renderHook(() => useStudents())
        act(() => result.current.addStudent('Carol', 'person', 'red'))
        const id = result.current.students[0].id

        act(() => result.current.deleteStudent(id))

        expect(result.current.students).toHaveLength(0)
    })

    it('only removes the targeted student, leaving others intact', () => {
        const { result } = renderHook(() => useStudents())
        act(() => {
            result.current.addStudent('Dan',  'person', 'blue')
            result.current.addStudent('Eve',  'star',   'lime')
            result.current.addStudent('Fred', 'person', 'orange')
        })
        const eveId = result.current.students[1].id

        act(() => result.current.deleteStudent(eveId))

        expect(result.current.students).toHaveLength(2)
        expect(result.current.students.map(s => s.name)).toEqual(['Dan', 'Fred'])
    })

    it('deleted student is absent after hook remount', () => {
        const { result: r1, unmount: u1 } = renderHook(() => useStudents())
        act(() => r1.current.addStudent('Ghost', 'person', 'cyan'))
        const id = r1.current.students[0].id
        act(() => r1.current.deleteStudent(id))
        u1()

        const { result: r2 } = renderHook(() => useStudents())
        expect(r2.current.students.find(s => s.id === id)).toBeUndefined()
    })
})

describe('useStudents — renameClass', () => {
    it('renames the current class', () => {
        const { result } = renderHook(() => useStudents())
        const id = result.current.currentClassId

        act(() => result.current.renameClass(id, 'Morning Group'))

        expect(result.current.classes[0].name).toBe('Morning Group')
    })

    it('does not rename when newName is null', () => {
        const { result } = renderHook(() => useStudents())
        const id   = result.current.currentClassId
        const name = result.current.classes[0].name

        act(() => result.current.renameClass(id, null))

        expect(result.current.classes[0].name).toBe(name)
    })

    it('does not rename when newName is undefined', () => {
        const { result } = renderHook(() => useStudents())
        const id   = result.current.currentClassId
        const name = result.current.classes[0].name

        act(() => result.current.renameClass(id, undefined))

        expect(result.current.classes[0].name).toBe(name)
    })

    it('only renames the targeted class', () => {
        const { result } = renderHook(() => useStudents())
        act(() => result.current.addClass())
        const firstId = result.current.classes[0].id

        act(() => result.current.renameClass(firstId, 'Renamed'))

        expect(result.current.classes[0].name).toBe('Renamed')
        expect(result.current.classes[1].name).not.toBe('Renamed')
    })
})

describe('useStudents — deleteClass', () => {
    it('removes the class from the list', () => {
        const { result } = renderHook(() => useStudents())
        act(() => result.current.addClass())
        const secondId = result.current.classes[1].id
        act(() => result.current.setCurrentClassId(secondId))

        act(() => result.current.deleteClass(secondId))

        expect(result.current.classes).toHaveLength(1)
    })

    it('switches currentClassId to the first remaining class when active class is deleted', () => {
        const { result } = renderHook(() => useStudents())
        act(() => result.current.addClass())
        const secondId = result.current.classes[1].id
        const firstId  = result.current.classes[0].id
        act(() => result.current.setCurrentClassId(secondId))

        act(() => result.current.deleteClass(secondId))

        expect(result.current.currentClassId).toBe(firstId)
    })

    it('does not delete the last remaining class', () => {
        const { result } = renderHook(() => useStudents())
        const onlyId = result.current.classes[0].id

        act(() => result.current.deleteClass(onlyId))

        expect(result.current.classes).toHaveLength(1)
    })

    it('deleted class is absent after hook remount', () => {
        const { result: r1, unmount } = renderHook(() => useStudents())
        act(() => r1.current.addClass())
        const secondId = r1.current.classes[1].id
        act(() => r1.current.deleteClass(secondId))
        unmount()

        const { result: r2 } = renderHook(() => useStudents())
        expect(r2.current.classes.find(c => c.id === secondId)).toBeUndefined()
    })
})

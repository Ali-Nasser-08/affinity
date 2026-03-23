/**
 * Unit Tests: src/hooks/useStudents.js
 *
 * Tests the core student data management hook.
 * Uses renderHook from @testing-library/react to run the hook in isolation.
 *
 * Key areas tested:
 *  - Initial state bootstrapping
 *  - Class management (add, delete, rename, switch)
 *  - Student management (add, update, delete)
 *  - Star awarding
 *  - localStorage persistence
 *  - Edge cases (deleting last class, empty names, etc.)
 */

// Vitest imports removed, relying on globals: true
import React, { act } from 'react'
import { createRoot } from 'react-dom/client'
import { useStudents } from '../../hooks/useStudents'

globalThis.IS_REACT_ACT_ENVIRONMENT = true;

function renderHook(hookFn) {
    const result = { current: null };
    function TestComponent() {
        result.current = hookFn();
        return null;
    }
    const container = document.createElement('div');
    const root = createRoot(container);
    act(() => {
        root.render(React.createElement(TestComponent));
    });
    
    return { 
        result,
        unmount: () => {
             act(() => {
                 root.unmount();
             });
        }
    };
}

// Minimal mock for localStorage
const mockStorage = (() => {
    let store = {};
    return {
        getItem: (key) => store[key] || null,
        setItem: (key, value) => { store[key] = value.toString(); },
        removeItem: (key) => { delete store[key]; },
        clear: () => { store = {}; },
        get length() { return Object.keys(store).length; },
        key: (i) => Object.keys(store)[i] || null
    };
})();
Object.defineProperty(globalThis, 'localStorage', {
    value: mockStorage,
    writable: true
});

// Clear localStorage before each test to ensure test isolation
beforeEach(() => {
    localStorage.clear()
})

// ─────────────────────────────────────────────
// Initial State
// ─────────────────────────────────────────────

describe('useStudents — Initial State', () => {
    it('should initialize with one default class', () => {
        const { result } = renderHook(() => useStudents())
        expect(result.current.classes).toHaveLength(1)
        expect(result.current.classes[0].name).toBe('Class 1')
    })

    it('should have an empty students list in the default class', () => {
        const { result } = renderHook(() => useStudents())
        expect(result.current.students).toHaveLength(0)
    })

    it('should set a valid currentClassId on init', () => {
        const { result } = renderHook(() => useStudents())
        expect(result.current.currentClassId).toBeDefined()
        expect(result.current.classes.some(c => c.id === result.current.currentClassId)).toBe(true)
    })
})

// ─────────────────────────────────────────────
// Student CRUD Operations
// ─────────────────────────────────────────────

describe('useStudents — Student Management', () => {
    it('should add a student to the current class', () => {
        const { result } = renderHook(() => useStudents())
        act(() => {
            result.current.addStudent('Alice', 'person', 'cyan')
        })
        expect(result.current.students).toHaveLength(1)
        expect(result.current.students[0].name).toBe('Alice')
        expect(result.current.students[0].stars).toEqual([])
    })

    it('should not add a student with an empty name', () => {
        const { result } = renderHook(() => useStudents())
        act(() => {
            result.current.addStudent('   ', 'person', 'cyan')
        })
        expect(result.current.students).toHaveLength(0)
    })

    it('should trim whitespace from student names', () => {
        const { result } = renderHook(() => useStudents())
        act(() => {
            result.current.addStudent('  Bob  ', 'person', 'pink')
        })
        expect(result.current.students[0].name).toBe('Bob')
    })

    it('should update an existing student', () => {
        const { result } = renderHook(() => useStudents())
        act(() => { result.current.addStudent('Carol', 'star', 'lime') })
        const studentId = result.current.students[0].id
        act(() => { result.current.updateStudent(studentId, 'Carol Updated', 'heart', 'blue') })
        expect(result.current.students[0].name).toBe('Carol Updated')
        expect(result.current.students[0].logoId).toBe('heart')
        expect(result.current.students[0].colorKey).toBe('blue')
    })

    it('should delete a student by id', () => {
        const { result } = renderHook(() => useStudents())
        act(() => { result.current.addStudent('Dave', 'person', 'purple') })
        const studentId = result.current.students[0].id
        act(() => { result.current.deleteStudent(studentId) })
        expect(result.current.students).toHaveLength(0)
    })

    it('should assign a unique id to each student', () => {
        const { result } = renderHook(() => useStudents())
        act(() => {
            result.current.addStudent('Eve', 'person', 'cyan')
            result.current.addStudent('Frank', 'person', 'pink')
        })
        const ids = result.current.students.map(s => s.id)
        expect(new Set(ids).size).toBe(ids.length)
    })
})

// ─────────────────────────────────────────────
// Star Awarding
// ─────────────────────────────────────────────

describe('useStudents — Star Awarding', () => {
    it('should add a star to a specific student', () => {
        const { result } = renderHook(() => useStudents())
        act(() => { result.current.addStudent('Grace', 'person', 'teal') })
        const studentId = result.current.students[0].id
        act(() => { result.current.addStar(studentId, 'star-base') })
        expect(result.current.students[0].stars).toEqual(['star-base'])
    })

    it('should accumulate multiple stars', () => {
        const { result } = renderHook(() => useStudents())
        act(() => { result.current.addStudent('Henry', 'person', 'orange') })
        const studentId = result.current.students[0].id
        act(() => {
            result.current.addStar(studentId, 'star-base')
            result.current.addStar(studentId, 'star-spark')
            result.current.addStar(studentId, 'star-legendary')
        })
        expect(result.current.students[0].stars).toHaveLength(3)
    })

    it('should not affect other students when adding a star', () => {
        const { result } = renderHook(() => useStudents())
        act(() => {
            result.current.addStudent('Iris', 'person', 'red')
            result.current.addStudent('Jack', 'person', 'yellow')
        })
        const iris = result.current.students[0]
        const jack = result.current.students[1]
        act(() => { result.current.addStar(iris.id, 'star-radiant') })
        expect(result.current.students.find(s => s.id === jack.id).stars).toHaveLength(0)
    })
})

// ─────────────────────────────────────────────
// Class Management
// ─────────────────────────────────────────────

describe('useStudents — Class Management', () => {
    it('should add a new class and switch to it', () => {
        const { result } = renderHook(() => useStudents())
        act(() => { result.current.addClass() })
        expect(result.current.classes).toHaveLength(2)
        expect(result.current.currentClassId).toBe(result.current.classes[1].id)
    })

    it('should not delete the last class', () => {
        const { result } = renderHook(() => useStudents())
        const firstId = result.current.classes[0].id
        act(() => { result.current.deleteClass(firstId) })
        expect(result.current.classes).toHaveLength(1)
    })

    it('should rename a class', () => {
        const { result } = renderHook(() => useStudents())
        const firstId = result.current.classes[0].id
        act(() => { result.current.renameClass(firstId, 'Advanced English') })
        expect(result.current.classes[0].name).toBe('Advanced English')
    })

    it('should switch current class with setCurrentClassId', () => {
        const { result } = renderHook(() => useStudents())
        act(() => { result.current.addClass() })
        const secondId = result.current.classes[1].id
        act(() => { result.current.setCurrentClassId(secondId) })
        expect(result.current.currentClassId).toBe(secondId)
    })

    it('should scope students to the current class', () => {
        const { result } = renderHook(() => useStudents())
        // Add a student to Class 1
        act(() => { result.current.addStudent('Kimberley', 'person', 'lime') })
        // Add Class 2 and switch to it
        act(() => { result.current.addClass() })
        // Class 2 should have 0 students
        expect(result.current.students).toHaveLength(0)
    })
})

// ─────────────────────────────────────────────
// Multi-class branch coverage (lines 116, 136, 146, 161)
// These hit the "return cls" branch in map() for non-current classes
// ─────────────────────────────────────────────

describe('useStudents — multi-class isolation', () => {
    it('addStudent only modifies the current class, not others', () => {
        const { result } = renderHook(() => useStudents())
        act(() => { result.current.addClass() }) // now two classes
        const firstId = result.current.classes[0].id
        const secondId = result.current.classes[1].id
        // Switch back to first class and add a student
        act(() => { result.current.setCurrentClassId(firstId) })
        act(() => { result.current.addStudent('Nina', 'person', 'pink') })
        // Second class should still be empty
        const secondClass = result.current.classes.find(c => c.id === secondId)
        expect(secondClass.students).toHaveLength(0)
    })

    it('updateStudent only modifies the current class, not others', () => {
        const { result } = renderHook(() => useStudents())
        act(() => { result.current.addStudent('Omar', 'person', 'cyan') })
        const studentId = result.current.students[0].id
        act(() => { result.current.addClass() }) // second class, switch to it
        const firstClassId = result.current.classes[0].id
        act(() => { result.current.setCurrentClassId(firstClassId) })
        act(() => { result.current.updateStudent(studentId, 'Omar Updated', 'star', 'lime') })
        // Second class is unaffected
        const secondClass = result.current.classes[1]
        expect(secondClass.students).toHaveLength(0)
    })

    it('deleteStudent only modifies the current class, not others', () => {
        const { result } = renderHook(() => useStudents())
        act(() => { result.current.addStudent('Pam', 'person', 'orange') })
        const studentId = result.current.students[0].id
        act(() => { result.current.addClass() }) // creates second class
        const firstClassId = result.current.classes[0].id
        act(() => { result.current.setCurrentClassId(firstClassId) })
        act(() => { result.current.deleteStudent(studentId) })
        expect(result.current.students).toHaveLength(0)
        // Second class still exists with 0 students (was never touched)
        expect(result.current.classes).toHaveLength(2)
    })

    it('addStar only modifies the current class, not others', () => {
        const { result } = renderHook(() => useStudents())
        act(() => { result.current.addStudent('Quinn', 'person', 'teal') })
        const studentId = result.current.students[0].id
        act(() => { result.current.addClass() }) // second class
        const firstClassId = result.current.classes[0].id
        act(() => { result.current.setCurrentClassId(firstClassId) })
        act(() => { result.current.addStar(studentId, 'star-base') })
        const updatedStudent = result.current.students.find(s => s.id === studentId)
        expect(updatedStudent.stars).toHaveLength(1)
        // Second class still empty
        expect(result.current.classes[1].students).toHaveLength(0)
    })
})

// ─────────────────────────────────────────────
// localStorage Persistence
// ─────────────────────────────────────────────

describe('useStudents — localStorage Persistence', () => {
    it('should persist classes to localStorage on change', () => {
        const { result } = renderHook(() => useStudents())
        act(() => { result.current.addStudent('Liam', 'person', 'blue') })
        const stored = JSON.parse(localStorage.getItem('app_classes'))
        expect(stored).toBeDefined()
        expect(stored[0].students).toHaveLength(1)
        expect(stored[0].students[0].name).toBe('Liam')
    })

    it('should persist currentClassId to localStorage', () => {
        const { result } = renderHook(() => useStudents())
        act(() => { result.current.addClass() })
        const stored = localStorage.getItem('app_current_class_id')
        expect(stored).toBe(result.current.currentClassId)
    })

    it('should restore state from localStorage on re-mount', () => {
        // First mount — add a student
        const { result: r1, unmount } = renderHook(() => useStudents())
        act(() => { r1.current.addStudent('Maya', 'person', 'pink') })
        unmount()

        // Second mount — should restore Maya
        const { result: r2 } = renderHook(() => useStudents())
        expect(r2.current.students[0].name).toBe('Maya')
    })
})

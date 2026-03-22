import { useState, useEffect, useCallback, useRef, useMemo } from 'react'
import { colorValues, pickRandom } from '../engine/serotoninEngine'
import { logoOptions } from '../data/logos'

export function useStudents() {
    const colorKeys = useMemo(() => Object.keys(colorValues), [])

    const [classes, setClasses] = useState(() => {
        const storedClasses = localStorage.getItem('app_classes')
        if (storedClasses) {
            return JSON.parse(storedClasses)
        }

        // Migration from old single-list format
        const storedStudents = localStorage.getItem('app_students')
        const initialStudents = storedStudents ? JSON.parse(storedStudents) : []

        // Ensure migrated students have necessary fields
        const processedStudents = initialStudents.map((student) => ({
            ...student,
            logoId: student.logoId || pickRandom(logoOptions).id,
            colorKey: student.colorKey || pickRandom(colorKeys),
            stars: student.stars || []
        }))

        return [{
            id: 'class-1',
            name: 'Class 1',
            students: processedStudents
        }]
    })

    const [currentClassId, setCurrentClassId] = useState(() => {
        const storedCurrent = localStorage.getItem('app_current_class_id')
        if (storedCurrent && classes.some(c => c.id === storedCurrent)) {
            return storedCurrent
        }
        return classes[0]?.id || 'class-1'
    })

    const currentClass = classes.find(c => c.id === currentClassId) || classes[0]
    const students = currentClass?.students || []

    const [pulseId, setPulseId] = useState(null)
    const pulseTimeout = useRef(null)

    useEffect(() => {
        localStorage.setItem('app_classes', JSON.stringify(classes))
    }, [classes])

    useEffect(() => {
        localStorage.setItem('app_current_class_id', currentClassId)
    }, [currentClassId])

    // Cleanup pulse timeout
    useEffect(() => {
        return () => {
            if (pulseTimeout.current) {
                clearTimeout(pulseTimeout.current)
            }
        }
    }, [])

    const triggerPulse = useCallback((studentId) => {
        setPulseId(studentId)
        if (pulseTimeout.current) {
            clearTimeout(pulseTimeout.current)
        }
        pulseTimeout.current = setTimeout(() => {
            setPulseId(null)
        }, 500)
    }, [])

    const addClass = useCallback(() => {
        const newId = `class-${Date.now()}`
        const newName = `Class ${classes.length + 1}`
        setClasses(prev => [...prev, { id: newId, name: newName, students: [] }])
        setCurrentClassId(newId)
    }, [classes.length])

    const deleteClass = useCallback((id) => {
        if (classes.length <= 1) return
        setClasses(prev => {
            const newClasses = prev.filter(c => c.id !== id)
            // If we deleted the current class, switch to the first one available
            if (id === currentClassId) {
                setCurrentClassId(newClasses[0].id)
            }
            return newClasses
        })
    }, [classes.length, currentClassId])

    const renameClass = useCallback((id, newName) => {
        // Allow un-trimmed names so user can type spaces
        if (newName === undefined || newName === null) return
        setClasses(prev => prev.map(c =>
            c.id === id ? { ...c, name: newName } : c
        ))
    }, [])

    const addStudent = useCallback((name, logoId, colorKey) => {
        const trimmed = name.trim()
        if (!trimmed) return
        const newStudent = {
            id: `${Date.now()}-${Math.random().toString(16).slice(2)}`,
            name: trimmed,
            logoId: logoId,
            colorKey: colorKey,
            stars: []
        }

        setClasses(prev => prev.map(cls => {
            if (cls.id === currentClassId) {
                return { ...cls, students: [...cls.students, newStudent] }
            }
            return cls
        }))
        triggerPulse(newStudent.id)
    }, [currentClassId, triggerPulse])

    const updateStudent = useCallback((id, name, logoId, colorKey) => {
        const trimmed = name.trim()
        if (!trimmed) return

        setClasses(prev => prev.map(cls => {
            if (cls.id === currentClassId) {
                return {
                    ...cls,
                    students: cls.students.map(s =>
                        s.id === id
                            ? { ...s, name: trimmed, logoId, colorKey }
                            : s
                    )
                }
            }
            return cls
        }))
        triggerPulse(id)
    }, [currentClassId, triggerPulse])

    const deleteStudent = useCallback((id) => {
        setClasses(prev => prev.map(cls => {
            if (cls.id === currentClassId) {
                return { ...cls, students: cls.students.filter(s => s.id !== id) }
            }
            return cls
        }))
    }, [currentClassId])

    const addStar = useCallback((studentId, starId) => {
        setClasses(prev => prev.map(cls => {
            if (cls.id === currentClassId) {
                return {
                    ...cls,
                    students: cls.students.map(s => {
                        if (s.id !== studentId) return s
                        return { ...s, stars: [...s.stars, starId] }
                    })
                }
            }
            return cls
        }))
        triggerPulse(studentId)
    }, [currentClassId, triggerPulse])

    return {
        students,
        classes,
        currentClassId,
        setCurrentClassId,
        addClass,
        deleteClass,
        renameClass,
        addStudent,
        updateStudent,
        deleteStudent,
        addStar,
        pulseId
    }
}

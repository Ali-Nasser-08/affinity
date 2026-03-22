import { useState, useEffect, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { colorValues, textColors, lightTints, accentColors } from '../engine/serotoninEngine'
import { useStudents } from '../hooks/useStudents'

// ============================================================
// DIFFICULTY CONFIG
// ============================================================
const difficultyConfig = {
    easy: {
        label: 'Easy',
        icon: 'sentiment_satisfied',
        value: 1,
        tone: '#7CB518'
    },
    medium: {
        label: 'Medium',
        icon: 'psychology',
        value: 2,
        tone: '#FFBF00'
    },
    hard: {
        label: 'Hard',
        icon: 'local_fire_department',
        value: 3,
        tone: '#FF006E'
    }
}

// ============================================================
// OPTION ROW — horizontal chip selector
// ============================================================
function OptionRow({ label, icon, color, children }) {
    return (
        <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '16px',
            width: '100%'
        }}>
            {/* Label */}
            <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                minWidth: '110px',
                flexShrink: 0
            }}>
                <span className="material-symbols-rounded" style={{
                    fontSize: 24,
                    color,
                    fontVariationSettings: "'FILL' 1"
                }}>{icon}</span>
                <span style={{
                    fontSize: '17px',
                    fontWeight: 700,
                    color: '#334155',
                    fontFamily: 'var(--font-display)'
                }}>{label}</span>
            </div>
            {/* Chips */}
            <div style={{
                display: 'flex',
                gap: '8px',
                flexWrap: 'wrap',
                flex: 1
            }}>
                {children}
            </div>
        </div>
    )
}

// ============================================================
// CHIP BUTTON
// ============================================================
function Chip({ selected, onClick, color, children, gradient, disabled, style: extraStyle }) {
    const colorValue = colorValues[color] || color
    return (
        <motion.button
            whileHover={!disabled ? { scale: 1.04, y: -1 } : {}}
            whileTap={!disabled ? { scale: 0.96 } : {}}
            onClick={onClick}
            disabled={disabled}
            style={{
                padding: '10px 18px',
                borderRadius: '14px',
                border: selected
                    ? (gradient ? '2.5px solid transparent' : `2.5px solid ${colorValue}`)
                    : '2px solid #e2e8f0',
                background: selected
                    ? (gradient || colorValue)
                    : 'white',
                color: selected ? 'white' : '#64748b',
                fontSize: '15px',
                fontWeight: 700,
                cursor: disabled ? 'default' : 'pointer',
                fontFamily: 'var(--font-display)',
                boxShadow: selected ? `0 4px 16px ${colorValue}35` : '0 1px 4px rgba(0,0,0,0.04)',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                transition: 'all 0.25s ease',
                opacity: disabled ? 0.4 : 1,
                ...extraStyle
            }}
        >
            {children}
        </motion.button>
    )
}

// ============================================================
// MAIN REVISE MENU
// ============================================================
export function ReviseMenu({ onBack, onStart, onAccentChange, userName }) {
    // Pick ONE random accent on mount — stays fixed
    const [accent] = useState(() => {
        if (localStorage.getItem('app_structured_mode') === 'true') {
            return localStorage.getItem('app_structured_color') || 'cyan'
        }
        const safe = accentColors.filter(c => c !== 'red' && c !== 'lime')
        return safe[Math.floor(Math.random() * safe.length)]
    })

    const [selectedUnit, setSelectedUnit] = useState(1)
    const [selectedDifficulty, setSelectedDifficulty] = useState(null)
    const [selectedClassId, setSelectedClassId] = useState(null)
    const [questionCount, setQuestionCount] = useState(10)
    const [unitData, setUnitData] = useState(null)
    const [viewport, setViewport] = useState(() => ({
        width: typeof window !== 'undefined' ? window.innerWidth : 1200,
        height: typeof window !== 'undefined' ? window.innerHeight : 800
    }))

    const { classes } = useStudents()

    useEffect(() => { onAccentChange?.(accent) }, [accent, onAccentChange])
    useEffect(() => {
        const handleResize = () => {
            setViewport({ width: window.innerWidth, height: window.innerHeight })
        }
        window.addEventListener('resize', handleResize)
        return () => window.removeEventListener('resize', handleResize)
    }, [])

    // Load unit data
    useEffect(() => {
        setUnitData(null)
        import(`../data/books/megaGoal1/revision/unit${selectedUnit}.json`)
            .then(mod => {
                const raw = mod?.default ?? mod
                if (!raw) {
                    console.error(`[ReviseMenu] No data for unit ${selectedUnit}`)
                    setUnitData(null)
                    return
                }
                setUnitData(raw)
            })
            .catch(err => {
                console.error(`[ReviseMenu] Failed to load unit ${selectedUnit}:`, err)
                setUnitData(null)
            })
    }, [selectedUnit])

    const selectedClass = selectedClassId ? classes.find(c => c.id === selectedClassId) : null
    const classStudents = selectedClass?.students || []

    useEffect(() => {
        if (selectedClassId && classStudents.length > 0) {
            setQuestionCount(classStudents.length)
        }
    }, [selectedClassId, classStudents.length])

    const filteredQuestions = useMemo(() => {
        if (!unitData) return []
        // Support sectioned format { sections: [{ questions: [] }] } or flat { questions: [] }
        let all = []
        if (Array.isArray(unitData.sections) && unitData.sections.length > 0) {
            all = unitData.sections.flatMap(s => s.questions ?? [])
        } else if (Array.isArray(unitData.questions)) {
            all = unitData.questions
        }
        if (!selectedDifficulty) return all
        return all.filter(q => q.difficulty === difficultyConfig[selectedDifficulty].value)
    }, [unitData, selectedDifficulty])

    const maxQuestions = filteredQuestions.length
    const effectiveCount = selectedClassId ? classStudents.length : Math.min(questionCount, maxQuestions)

    const handleStart = () => {
        if (effectiveCount <= 0 || filteredQuestions.length === 0) return
        const shuffled = [...filteredQuestions].sort(() => Math.random() - 0.5)
        const picked = shuffled.slice(0, effectiveCount)

        let questionsToPlay = picked
        if (selectedClassId && classStudents.length > 0) {
            questionsToPlay = picked.map((q, i) => ({
                ...q,
                student: classStudents[i] || null
            }))
        }

        onStart?.({
            questions: questionsToPlay,
            unit: selectedUnit,
            difficulty: selectedDifficulty,
            classId: selectedClassId,
            className: selectedClass?.name || null,
            accent
        })
    }

    const colorValue = colorValues[accent]
    const isStarChallenge = !!selectedClassId && classStudents.length > 0
    const canStart = effectiveCount > 0 && filteredQuestions.length > 0 && (!isStarChallenge || classStudents.length <= filteredQuestions.length)
    const isNarrow = viewport.width < 980
    const isShort = viewport.height < 720

    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            style={{
                position: 'fixed',
                inset: 0,
                background: '#f8fafc',
                display: 'flex',
                flexDirection: 'column',
                overflow: 'hidden',
                zIndex: 100,
                fontFamily: 'var(--font-display)'
            }}
        >
            {/* Ambient background blobs */}
            <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none', overflow: 'hidden' }}>
                <div style={{
                    position: 'absolute', top: '-10%', right: '-5%',
                    width: '800px', height: '800px', borderRadius: '50%',
                    background: `${colorValue}18`,
                    filter: 'blur(80px)'
                }} />
                <div style={{
                    position: 'absolute', bottom: '-10%', left: '-5%',
                    width: '600px', height: '600px', borderRadius: '50%',
                    background: `${colorValue}15`,
                    filter: 'blur(80px)'
                }} />
            </div>

            {/* Content Full Screen */}
            <div style={{
                flex: 1,
                position: 'relative',
                zIndex: 1,
                overflowY: 'auto'
            }}>
                <motion.div
                    initial={{ y: 20, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ type: 'spring', stiffness: 200, damping: 25 }}
                    style={{
                        minHeight: '100%',
                        padding: isNarrow ? '24px 20px' : '40px 60px',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: isNarrow ? '24px' : '40px',
                        maxWidth: '1400px',
                        margin: '0 auto'
                    }}
                >
                    {/* Header Row */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
                        <motion.button
                            whileHover={{ scale: 1.05, x: -3 }}
                            whileTap={{ scale: 0.95 }}
                            onClick={onBack}
                            style={{
                                alignSelf: 'flex-start',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '8px',
                                padding: '12px 20px',
                                borderRadius: '16px',
                                border: 'none',
                                background: 'white',
                                color: '#475569',
                                fontSize: '15px',
                                fontWeight: 700,
                                cursor: 'pointer',
                                fontFamily: 'var(--font-display)',
                                boxShadow: '0 8px 24px rgba(0,0,0,0.06)'
                            }}
                        >
                            <span className="material-symbols-rounded" style={{ fontSize: 22 }}>arrow_back</span>
                            Back to Menu
                        </motion.button>

                        <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between' }}>
                            <div>
                                <div style={{
                                    fontSize: isNarrow ? 32 : 44,
                                    fontWeight: 900,
                                    color: colorValue,
                                    lineHeight: 1,
                                    letterSpacing: '-1px',
                                    marginBottom: '6px'
                                }}>
                                    Setup Revision
                                </div>
                                <div style={{
                                    fontSize: isNarrow ? 14 : 16,
                                    color: '#64748b',
                                    fontWeight: 600
                                }}>
                                    Configure your next learning session
                                </div>
                            </div>
                            {!isNarrow && (
                                <div style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '10px',
                                    padding: '14px 20px',
                                    borderRadius: '16px',
                                    background: 'white',
                                    border: `1.5px solid ${colorValue}20`,
                                    color: colorValue,
                                    fontSize: '16px',
                                    fontWeight: 800,
                                    boxShadow: `0 8px 24px ${colorValue}15`
                                }}>
                                    <span className="material-symbols-rounded material-filled">check_circle</span>
                                    {effectiveCount} / {maxQuestions} Questions Ready
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Divider */}
                    <div style={{ height: '2px', background: `${colorValue}15`, borderRadius: '1px' }} />

                    {/* Config Area */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>

                        {/* Box 1: Questions */}
                        <div style={{
                            display: 'flex',
                            flexDirection: 'column',
                            gap: '12px',
                            background: 'white',
                            borderRadius: '24px',
                            padding: isNarrow ? '20px' : '32px',
                            border: `1.5px solid ${colorValue}15`,
                            boxShadow: '0 12px 30px rgba(0,0,0,0.03)'
                        }}>
                            <div style={{ fontSize: '15px', color: '#64748b', fontWeight: 800 }}>Question Count</div>
                            <OptionRow label="Questions" icon="quiz" color={colorValue}>
                                {selectedClassId ? (
                                    <div style={{
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '8px',
                                        padding: '12px 20px',
                                        borderRadius: '16px',
                                        background: `${colorValue}10`,
                                        border: `1.5px solid ${colorValue}20`,
                                        color: colorValue,
                                        fontWeight: 800,
                                        fontSize: '16px'
                                    }}>
                                        <span className="material-symbols-rounded" style={{ fontSize: 18 }}>lock</span>
                                        {classStudents.length} (1 per student)
                                    </div>
                                ) : (
                                    <>
                                        <div style={{
                                            display: 'flex',
                                            alignItems: 'center',
                                            gap: '12px'
                                        }}>
                                            <motion.button
                                                whileTap={{ scale: 0.9 }}
                                                onClick={() => setQuestionCount(prev => Math.max(1, prev - 1))}
                                                disabled={questionCount <= 1}
                                                style={{
                                                    width: '44px', height: '44px', borderRadius: '16px',
                                                    border: `2px solid ${colorValue}`,
                                                    background: `${colorValue}08`, color: colorValue,
                                                    fontSize: '22px', fontWeight: 800, cursor: 'pointer',
                                                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                                                    opacity: questionCount <= 1 ? 0.3 : 1
                                                }}
                                            >-</motion.button>

                                            <motion.span
                                                key={questionCount}
                                                initial={{ scale: 0.8, opacity: 0 }}
                                                animate={{ scale: 1, opacity: 1 }}
                                                style={{
                                                    fontSize: '36px', fontWeight: 900,
                                                    color: colorValue, minWidth: '60px',
                                                    textAlign: 'center'
                                                }}
                                            >{questionCount}</motion.span>

                                            <motion.button
                                                whileTap={{ scale: 0.9 }}
                                                onClick={() => setQuestionCount(prev => Math.min(maxQuestions, prev + 1))}
                                                disabled={questionCount >= maxQuestions}
                                                style={{
                                                    width: '44px', height: '44px', borderRadius: '16px',
                                                    border: `2px solid ${colorValue}`,
                                                    background: `${colorValue}08`, color: colorValue,
                                                    fontSize: '22px', fontWeight: 800, cursor: 'pointer',
                                                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                                                    opacity: questionCount >= maxQuestions ? 0.3 : 1
                                                }}
                                            >+</motion.button>
                                        </div>

                                        {[1, 5, 10, 20].filter(n => n <= maxQuestions).map(n => (
                                            <Chip
                                                key={n}
                                                selected={questionCount === n}
                                                onClick={() => setQuestionCount(n)}
                                                color={accent}
                                                style={{ padding: '8px 18px', fontSize: '15px' }}
                                            >
                                                {n}
                                            </Chip>
                                        ))}

                                        <span style={{ fontSize: '14px', color: '#94a3b8', fontWeight: 700 }}>
                                            / {maxQuestions}
                                        </span>
                                    </>
                                )}
                            </OptionRow>
                        </div>

                        {/* Box 2: Filters */}
                        <div style={{
                            display: 'flex',
                            flexDirection: 'column',
                            gap: '24px',
                            background: 'rgba(255,255,255,0.6)',
                            borderRadius: '24px',
                            padding: isNarrow ? '20px' : '32px',
                            border: `1.5px solid ${colorValue}15`,
                            backdropFilter: 'blur(20px)'
                        }}>
                            <OptionRow label="Unit" icon="menu_book" color={colorValue}>
                                {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map(u => (
                                    <Chip
                                        key={u}
                                        selected={selectedUnit === u}
                                        onClick={() => setSelectedUnit(u)}
                                        color={accent}
                                    >
                                        Unit {u}
                                    </Chip>
                                ))}
                            </OptionRow>

                            <OptionRow label="Difficulty" icon="speed" color={colorValue}>
                                <Chip
                                    selected={!selectedDifficulty}
                                    onClick={() => setSelectedDifficulty(null)}
                                    color={accent}
                                >
                                    All
                                </Chip>
                                {Object.entries(difficultyConfig).map(([key, cfg]) => (
                                    <Chip
                                        key={key}
                                        selected={selectedDifficulty === key}
                                        onClick={() => setSelectedDifficulty(key)}
                                        color={selectedDifficulty === key ? cfg.tone : accent}
                                    >
                                        <span className="material-symbols-rounded" style={{
                                            fontSize: 16,
                                            fontVariationSettings: "'FILL' 1"
                                        }}>{cfg.icon}</span>
                                        {cfg.label}
                                    </Chip>
                                ))}
                            </OptionRow>

                            <OptionRow label="Class" icon="school" color={colorValue}>
                                <Chip
                                    selected={!selectedClassId}
                                    onClick={() => setSelectedClassId(null)}
                                    color={accent}
                                >
                                    No Class
                                </Chip>
                                {classes.map(cls => (
                                    <Chip
                                        key={cls.id}
                                        selected={selectedClassId === cls.id}
                                        onClick={() => setSelectedClassId(cls.id)}
                                        color={accent}
                                    >
                                        <span className="material-symbols-rounded" style={{
                                            fontSize: 16,
                                            fontVariationSettings: "'FILL' 1"
                                        }}>groups</span>
                                        {cls.name}
                                        <span style={{ fontSize: '12px', opacity: 0.7 }}>
                                            ({cls.students?.length || 0})
                                        </span>
                                    </Chip>
                                ))}
                            </OptionRow>

                            <AnimatePresence>
                                {isStarChallenge && (
                                    <motion.div
                                        initial={{ height: 0, opacity: 0 }}
                                        animate={{ height: 'auto', opacity: 1 }}
                                        exit={{ height: 0, opacity: 0 }}
                                        style={{
                                            overflow: 'hidden',
                                            borderRadius: '14px',
                                            background: `${colorValue}06`,
                                            border: `1px solid ${colorValue}15`,
                                            padding: '10px 14px'
                                        }}
                                    >
                                        <div style={{
                                            display: 'flex',
                                            alignItems: 'center',
                                            gap: '6px',
                                            fontSize: '13px',
                                            color: colorValue,
                                            fontWeight: 700,
                                            marginBottom: '8px'
                                        }}>
                                            <span className="material-symbols-rounded material-filled" style={{ fontSize: 16 }}>star</span>
                                            Each student earns a star for correct answers
                                        </div>
                                        <div style={{ display: 'flex', gap: '5px', flexWrap: 'wrap' }}>
                                            {classStudents.map(student => (
                                                <span
                                                    key={student.id}
                                                    style={{
                                                        background: colorValues[student.colorKey] || colorValue,
                                                        color: 'white',
                                                        padding: '3px 9px',
                                                        borderRadius: '8px',
                                                        fontSize: '12px',
                                                        fontWeight: 700,
                                                        fontFamily: 'var(--font-display)',
                                                        display: 'flex',
                                                        alignItems: 'center',
                                                        gap: '3px'
                                                    }}
                                                >
                                                    <span className="material-symbols-rounded material-filled" style={{ fontSize: 12 }}>
                                                        {student.logoId || 'person'}
                                                    </span>
                                                    {student.name}
                                                </span>
                                            ))}
                                        </div>
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </div>

                        {/* Divider */}
                        <div style={{ height: '1.5px', background: `${colorValue}12`, borderRadius: '1px' }} />

                        {/* === START BUTTON === */}
                        <div style={{ textAlign: 'center', marginTop: '20px', marginBottom: '60px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '16px' }}>
                            <motion.button
                                whileHover={canStart ? { scale: 1.04, y: -4 } : {}}
                                whileTap={canStart ? { scale: 0.97 } : {}}
                                onClick={handleStart}
                                disabled={!canStart}
                                style={{
                                    padding: '24px 64px',
                                    borderRadius: '24px',
                                    border: 'none',
                                    background: canStart
                                        ? (isStarChallenge
                                            ? '#f59e0b'
                                            : colorValue)
                                        : '#e2e8f0',
                                    color: canStart ? 'white' : '#94a3b8',
                                    fontSize: '24px',
                                    fontWeight: 800,
                                    cursor: canStart ? 'pointer' : 'not-allowed',
                                    fontFamily: 'var(--font-display)',
                                    boxShadow: canStart
                                        ? (isStarChallenge
                                            ? '0 16px 40px rgba(251, 191, 36, 0.45)'
                                            : `0 16px 40px ${colorValue}40`)
                                        : 'none',
                                    display: 'inline-flex',
                                    alignItems: 'center',
                                    gap: '12px',
                                    transition: 'all 0.3s ease'
                                }}
                            >
                                {isStarChallenge ? (
                                    <>
                                        <span className="material-symbols-rounded material-filled" style={{
                                            fontSize: 32,
                                            filter: 'drop-shadow(0 0 12px rgba(255,255,255,0.4))'
                                        }}>
                                            {classStudents.length > filteredQuestions.length ? 'error' : 'star'}
                                        </span>
                                        {classStudents.length > filteredQuestions.length
                                            ? `Not enough questions (${filteredQuestions.length}) for students (${classStudents.length})`
                                            : 'Start Star Challenge'}
                                    </>
                                ) : (
                                    <>
                                        <span className="material-symbols-rounded" style={{ fontSize: 32 }}>play_arrow</span>
                                        Start Revision
                                    </>
                                )}
                            </motion.button>
                        </div>
                    </div>
                </motion.div>
            </div>
        </motion.div>
    )
}

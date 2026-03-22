import { useState, useEffect, useCallback, useMemo, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { colorValues, accentColors } from '../engine/serotoninEngine'
import { Confetti } from '../components/Confetti'
import { useStudents } from '../hooks/useStudents'
import { useStarAnimation, GlobalStarEffects, StarBadgeContainer } from './StarAnimation'

const safeAccents = accentColors.filter(c => c !== 'red' && c !== 'lime')
const ANSWER_LABELS = ['A', 'B', 'C', 'D']
const HINT_DELAY = 15000
const HINT_DURATION = 7000
const DIFFICULTY_STAR_MAP = { 1: 'star-base', 2: 'star-spark', 3: 'star-radiant' }

// ============================================================
// DYNAMIC FONT SIZE — measures text length to pick optimal size
// ============================================================
function getDynamicFontSize(text, isExpanded) {
    if (!text) return isExpanded ? 48 : 40
    const len = text.length
    if (len < 30) return isExpanded ? 54 : 46
    if (len < 50) return isExpanded ? 48 : 40
    if (len < 80) return isExpanded ? 40 : 34
    if (len < 120) return isExpanded ? 34 : 28
    return isExpanded ? 28 : 24
}

// ============================================================
// QUOTE FORMATTER
// ============================================================
function FormatTextWithQuotes({ text, color }) {
    if (!text || typeof text !== 'string') return <>{text}</>;
    // Splits using lookbehinds to match text within single quotes
    // e.g. "Use 'when' to..." -> split matches "when"
    const parts = text.split(/(?<!\w)'(.*?)'(?!\w)/g);
    if (parts.length === 1) return <>{text}</>;

    return (
        <>
            {parts.map((part, i) => {
                // The captured quoted string is at odd indices
                if (i % 2 === 1) {
                    return <span key={i} style={{ color: color }}>{part}</span>;
                }
                return <span key={i}>{part}</span>;
            })}
        </>
    );
}

// ============================================================
// PROMPT RENDERER
// ============================================================
function PromptText({ segments, color, fontSize, filledAnswers }) {
    if (!segments?.length) return null
    let blankIndex = 0

    return (
        <span style={{ fontSize, lineHeight: 1.45 }}>
            {segments.map((seg, i) => {
                // Determine styles for the segment
                const style = {}
                if (seg.underline) {
                    style.textDecoration = 'underline'
                    style.textDecorationColor = color
                    style.textUnderlineOffset = '5px'
                    style.textDecorationThickness = '3px'
                    style.fontWeight = 700
                    style.color = color
                }
                if (seg.highlight) {
                    style.background = `${color}25`
                    style.padding = '2px 8px'
                    style.borderRadius = '8px'
                    style.fontWeight = 700
                }
                if (seg.bold) {
                    style.fontWeight = 800
                }
                if (seg.colorize) {
                    style.color = color
                }

                // If legacy empty string for blank:
                if (seg.text === "") {
                    if (filledAnswers) {
                        const answerText = filledAnswers[blankIndex] || ''
                        blankIndex++
                        return (
                            <span key={i} style={{ ...style, color: '#22c55e', textDecoration: 'underline', fontWeight: 800, padding: '0 4px' }}>
                                {answerText}
                            </span>
                        )
                    }
                    return (
                        <span key={i} style={{ ...style, display: 'inline-block', minWidth: '80px', height: '4px', borderRadius: '2px', background: color, opacity: 0.4, verticalAlign: '-4px', margin: '0 8px' }} />
                    )
                }

                // Split text by 2 or more underscores
                const parts = (seg.text || '').split(/(_{2,})/g);

                return (
                    <span key={i} style={style}>
                        {parts.map((part, j) => {
                            if (/^_{2,}$/.test(part)) {
                                if (filledAnswers) {
                                    const answerText = filledAnswers[blankIndex] || ''
                                    blankIndex++
                                    return (
                                        <span key={`${i}-${j}`} style={{
                                            color: '#22c55e',
                                            textDecoration: 'underline',
                                            fontWeight: 800,
                                            padding: '0 4px'
                                        }}>
                                            {answerText}
                                        </span>
                                    )
                                }
                                return (
                                    <span key={`${i}-${j}`} style={{
                                        display: 'inline-block',
                                        minWidth: '80px',
                                        height: '4px',
                                        borderRadius: '2px',
                                        background: color,
                                        opacity: 0.4,
                                        verticalAlign: '-4px',
                                        margin: '0 8px',
                                    }} />
                                )
                            }
                            return <FormatTextWithQuotes key={`${i}-${j}`} text={part} color={color} />
                        })}
                    </span>
                )
            })}
        </span>
    )
}

// ============================================================
// SYMBOL PATTERN
// ============================================================
function SymbolBackground({ logoId }) {
    if (!logoId) return null
    return (
        <div style={{
            position: 'absolute', inset: 0, zIndex: 0,
            opacity: 0.07, pointerEvents: 'none', overflow: 'hidden'
        }}>
            <svg width="100%" height="100%">
                <defs>
                    <pattern id="sBg" x="0" y="0" width="90" height="90"
                        patternUnits="userSpaceOnUse" patternTransform="rotate(15)">
                        <text x="45" y="55" fontSize="40" fill="white"
                            fontFamily="'Material Symbols Rounded'"
                            textAnchor="middle" dominantBaseline="middle">{logoId}</text>
                    </pattern>
                </defs>
                <rect width="100%" height="100%" fill="url(#sBg)" />
            </svg>
        </div>
    )
}

// ============================================================
// DIFFICULTY STARS
// ============================================================
function DifficultyStars({ difficulty }) {
    const filled = difficulty || 1
    return (
        <div style={{ display: 'flex', gap: '3px' }}>
            {Array.from({ length: 3 }, (_, i) => (
                <motion.span
                    key={i}
                    className="material-symbols-rounded material-filled"
                    animate={i < filled ? { scale: [1, 1.2, 1], opacity: [0.9, 1, 0.9] } : {}}
                    transition={{ duration: 2, repeat: Infinity, delay: i * 0.3, ease: 'easeInOut' }}
                    style={{
                        fontSize: 18,
                        color: i < filled ? '#fbbf24' : 'rgba(255,255,255,0.3)',
                        filter: i < filled ? 'drop-shadow(0 0 3px rgba(251,191,36,0.5))' : 'none'
                    }}
                >star</motion.span>
            ))}
        </div>
    )
}

// ============================================================
// MAIN QUESTION PLAYER
// ============================================================
export function QuestionPlayer({ questions, unit, difficulty, classId, className, accent: initialAccent, onBack }) {
    // Randomize questions (and thus students), prioritizing unseen ones first
    const shuffledQuestions = useMemo(() => {
        if (!questions?.length) return []

        const storageKey = `seen_${unit}`
        let seenIds = []
        try { seenIds = JSON.parse(localStorage.getItem(storageKey) || '[]') } catch (e) { }

        // Split questions into seen and unseen lists
        let unseen = questions.filter(q => !seenIds.includes(q.id))
        let seen = questions.filter(q => seenIds.includes(q.id))

        // If all available questions are seen, reset the tracker for these questions
        if (unseen.length === 0) {
            unseen = [...seen]
            seen = []
            try {
                // Keep the IDs that belong to other lists, but clear the ones for this list so it cycles
                const updatedSeenIds = seenIds.filter(id => !questions.some(q => q.id === id))
                localStorage.setItem(storageKey, JSON.stringify(updatedSeenIds))
            } catch (e) { }
        }

        // Fisher-Yates shuffle helper
        const shuffle = (array) => {
            const arr = [...array]
            for (let i = arr.length - 1; i > 0; i--) {
                const j = Math.floor(Math.random() * (i + 1));
                [arr[i], arr[j]] = [arr[j], arr[i]];
            }
            return arr
        }

        // Shuffle both groups independently, then join them (unseen first)
        return [...shuffle(unseen), ...shuffle(seen)]
    }, [questions, unit])

    const [currentIndex, setCurrentIndex] = useState(0)
    const [selectedAnswer, setSelectedAnswer] = useState(null)
    const [showResult, setShowResult] = useState(false)
    const [showConfetti, setShowConfetti] = useState(false)
    const [isExpanded, setIsExpanded] = useState(false)
    const [showHint, setShowHint] = useState(false)
    const [hintAvailable, setHintAvailable] = useState(false)
    const [score, setScore] = useState(0)
    const [showExplanation, setShowExplanation] = useState(false)
    const [isComplete, setIsComplete] = useState(false)

    const starAnim = useStarAnimation()
    const hintTimerRef = useRef(null)
    const hintHideTimerRef = useRef(null)
    const studentBadgeRef = useRef(null)
    const answerRefs = useRef({})

    const { addStar } = useStudents()
    const currentQuestion = shuffledQuestions[currentIndex]
    const totalQuestions = shuffledQuestions.length
    const student = currentQuestion?.student

    // Mark current question as seen
    useEffect(() => {
        if (!currentQuestion?.id || !unit) return
        const key = `seen_${unit}`
        try {
            const seen = JSON.parse(localStorage.getItem(key) || '[]')
            if (!seen.includes(currentQuestion.id)) {
                seen.push(currentQuestion.id)
                localStorage.setItem(key, JSON.stringify(seen))
            }
        } catch (e) { }
    }, [currentQuestion, unit])

    // Accent
    const questionAccent = useMemo(() => {
        if (localStorage.getItem('app_structured_mode') === 'true') {
            return initialAccent || localStorage.getItem('app_structured_color') || 'cyan'
        }
        if (student?.colorKey) {
            const sc = student.colorKey
            if (sc === 'red' || sc === 'lime') return safeAccents[currentIndex % safeAccents.length]
            return sc
        }
        return safeAccents[currentIndex % safeAccents.length]
    }, [currentIndex, student, initialAccent])

    const colorValue = colorValues[questionAccent]

    // Text for dynamic sizing
    const promptFullText = useMemo(() => {
        if (!currentQuestion?.prompt) return ''
        if (typeof currentQuestion.prompt === 'string') return currentQuestion.prompt.trim()
        return currentQuestion.prompt.map(s => s.text).join('').trim()
    }, [currentQuestion])

    const questionText = (currentQuestion?.question || '').trim()
    const isDuplicate = promptFullText && questionText && promptFullText === questionText
    const displayText = promptFullText || questionText
    const dynamicFontSize = getDynamicFontSize(displayText, isExpanded)

    const isCorrect = showResult && selectedAnswer === currentQuestion?.answer

    const bgColor = useMemo(() => {
        if (showResult) return isCorrect ? '#22c55e' : '#ef4444'
        return colorValue
    }, [showResult, isCorrect, colorValue])

    const resultColor = useMemo(() => {
        if (!showResult) return colorValue
        return isCorrect ? '#22c55e' : '#ef4444'
    }, [showResult, isCorrect, colorValue])

    // Hint timer
    useEffect(() => {
        setHintAvailable(false)
        setShowHint(false)
        if (hintTimerRef.current) clearTimeout(hintTimerRef.current)
        if (hintHideTimerRef.current) clearTimeout(hintHideTimerRef.current)
        if (!showResult && currentQuestion?.arabicHint) {
            hintTimerRef.current = setTimeout(() => setHintAvailable(true), HINT_DELAY)
        }
        return () => {
            if (hintTimerRef.current) clearTimeout(hintTimerRef.current)
            if (hintHideTimerRef.current) clearTimeout(hintHideTimerRef.current)
        }
    }, [currentIndex, showResult, currentQuestion])

    const handleShowHint = () => {
        setShowHint(true)
        if (hintHideTimerRef.current) clearTimeout(hintHideTimerRef.current)
    }

    // Answer handler
    const handleAnswer = useCallback((answer, answerIndex) => {
        if (showResult) return
        setSelectedAnswer(answer)
        setShowResult(true)
        setHintAvailable(false)
        setShowHint(false)

        if (answer === currentQuestion?.answer) {
            setScore(prev => prev + 1)
            setShowConfetti(true)
            setTimeout(() => setShowConfetti(false), 2500)

            const diff = currentQuestion?.difficulty || 1
            const starId = DIFFICULTY_STAR_MAP[diff] || 'star-base'

            if (student?.id && classId) {
                addStar(student.id, starId)
                const answerEl = answerRefs.current[answerIndex]
                const badgeEl = studentBadgeRef.current
                starAnim.triggerFlight(answerEl, badgeEl, starId)
            }
        }
    }, [showResult, currentQuestion, addStar, classId, student, starAnim])

    // Navigate next
    const handleNext = useCallback(() => {
        if (currentIndex < totalQuestions - 1) {
            setCurrentIndex(prev => prev + 1)
            setSelectedAnswer(null)
            setShowResult(false)
            setShowExplanation(false)
            starAnim.reset()
        } else {
            setIsComplete(true)
        }
    }, [currentIndex, totalQuestions, starAnim])

    // Auto Answer
    const handleAutoAnswer = useCallback(() => {
        if (showResult || !currentQuestion) return
        const opts = currentQuestion.options || []
        const answerIndex = opts.findIndex(o => o === currentQuestion.answer)
        if (answerIndex !== -1) {
            handleAnswer(currentQuestion.answer, answerIndex)
        }
    }, [showResult, currentQuestion, handleAnswer])

    // Keyboard
    useEffect(() => {
        const handleKey = (e) => {
            if (isComplete) return
            if (e.key === 'Escape') {
                if (isExpanded) setIsExpanded(false)
                else onBack?.()
            }
            if (!showResult) {
                const opts = currentQuestion?.options || []
                if (e.key === '1' || e.key === 'a') handleAnswer(opts[0], 0)
                if (e.key === '2' || e.key === 'b') handleAnswer(opts[1], 1)
                if (e.key === '3' || e.key === 'c') handleAnswer(opts[2], 2)
                if (e.key === '4' || e.key === 'd') handleAnswer(opts[3], 3)
                if (e.key === ' ') {
                    e.preventDefault()
                    handleAutoAnswer()
                }
            }
            if (showResult && (e.key === ' ' || e.key === 'Enter' || e.key === 'ArrowRight')) {
                e.preventDefault()
                handleNext()
            }
        }
        window.addEventListener('keydown', handleKey)
        return () => window.removeEventListener('keydown', handleKey)
    }, [showResult, currentQuestion, handleAnswer, handleAutoAnswer, handleNext, isExpanded, isComplete, onBack])

    // Font sizes
    const answerFontSize = isExpanded ? 26 : 24
    const headerFontSize = isExpanded ? 22 : 18

    // ============================================================
    // COMPLETION SCREEN
    // ============================================================
    if (isComplete) {
        const percentage = Math.round((score / totalQuestions) * 100)
        const message = percentage >= 80 ? 'Excellent!' : percentage >= 60 ? 'Good Job!' : 'Keep Practicing!'
        const icon = percentage >= 80 ? 'emoji_events' : percentage >= 60 ? 'thumb_up' : 'school'

        return (
            <motion.div
                initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                style={{
                    position: 'fixed', inset: 0,
                    background: `linear-gradient(135deg, ${colorValue}dd, ${colorValue})`,
                    display: 'flex', flexDirection: 'column',
                    alignItems: 'center', justifyContent: 'center',
                    zIndex: 100, fontFamily: 'var(--font-display)'
                }}
            >
                <motion.div
                    initial={{ scale: 0, rotate: -20 }}
                    animate={{ scale: 1, rotate: 0 }}
                    transition={{ type: 'spring', stiffness: 200, damping: 15, delay: 0.2 }}
                    style={{ textAlign: 'center' }}
                >
                    <span className="material-symbols-rounded material-filled" style={{
                        fontSize: 120, color: 'white', display: 'block', marginBottom: 24,
                        filter: 'drop-shadow(0 8px 24px rgba(0,0,0,0.2))'
                    }}>{icon}</span>
                    <div style={{
                        fontSize: 52, fontWeight: 800, color: 'white', marginBottom: 12,
                        textShadow: '0 2px 12px rgba(0,0,0,0.15)'
                    }}>{message}</div>
                    <div style={{ fontSize: 80, fontWeight: 900, color: 'white', marginBottom: 8 }}>
                        {score} / {totalQuestions}
                    </div>
                    <div style={{ fontSize: 28, color: 'rgba(255,255,255,0.8)', fontWeight: 600, marginBottom: 40 }}>
                        {percentage}% correct
                    </div>
                    <motion.button
                        whileHover={{ scale: 1.05, y: -3 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={onBack}
                        style={{
                            padding: '18px 50px', borderRadius: '18px', border: 'none',
                            background: 'white', color: colorValue, fontSize: 22, fontWeight: 700,
                            cursor: 'pointer', fontFamily: 'var(--font-display)',
                            boxShadow: '0 12px 40px rgba(0,0,0,0.15)',
                            display: 'inline-flex', alignItems: 'center', gap: 10
                        }}
                    >
                        <span className="material-symbols-rounded" style={{ fontSize: 24 }}>arrow_back</span>
                        Back to Menu
                    </motion.button>
                </motion.div>
                <Confetti show={true} />
            </motion.div>
        )
    }

    // ============================================================
    // MAIN QUESTION VIEW
    // ============================================================
    return (
        <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            style={{
                position: 'fixed', inset: 0,
                background: bgColor,
                display: 'flex', flexDirection: 'column',
                overflow: 'hidden', zIndex: 100,
                transition: 'background 0.6s ease',
                fontFamily: 'var(--font-display)'
            }}
        >
            {student && <SymbolBackground logoId={student.logoId} />}
            <div style={{
                position: 'absolute', inset: 0,
                background: 'linear-gradient(180deg, rgba(0,0,0,0.05) 0%, transparent 30%, transparent 70%, rgba(0,0,0,0.1) 100%)',
                pointerEvents: 'none', zIndex: 1
            }} />

            <Confetti show={showConfetti} />

            {/* Global Star Effects */}
            <GlobalStarEffects state={starAnim} />

            {/* Top Bar */}
            <div style={{
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                padding: '14px 24px', position: 'relative', zIndex: 20
            }}>
                <motion.button
                    whileHover={{ scale: 1.05, x: -3 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={onBack}
                    style={{
                        display: 'flex', alignItems: 'center', gap: '8px',
                        padding: '10px 20px', borderRadius: '14px', border: 'none',
                        background: 'rgba(255,255,255,0.2)', backdropFilter: 'blur(10px)',
                        color: 'white', fontSize: '16px', fontWeight: 700,
                        cursor: 'pointer', fontFamily: 'var(--font-display)'
                    }}
                >
                    <span className="material-symbols-rounded" style={{ fontSize: 22 }}>close</span>
                    Exit
                </motion.button>

                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <AnimatePresence>
                        {(hintAvailable && !showHint && !showResult) && (
                            <motion.button
                                initial={{ scale: 0, opacity: 0, width: 0 }}
                                animate={{ scale: 1, opacity: 1, width: 'auto' }}
                                exit={{ scale: 0, opacity: 0, width: 0 }}
                                whileHover={{ scale: 1.05 }}
                                whileTap={{ scale: 0.95 }}
                                onClick={handleShowHint}
                                style={{
                                    padding: '8px 16px', borderRadius: '14px', border: 'none',
                                    background: 'rgba(255,255,255,0.25)', backdropFilter: 'blur(10px)',
                                    cursor: 'pointer', color: 'white', fontWeight: 700,
                                    fontSize: '20px', fontFamily: '"Fredoka", sans-serif',
                                    display: 'flex', alignItems: 'center', gap: '8px',
                                    boxShadow: '0 0 20px rgba(253, 224, 71, 0.6)',
                                    marginRight: '8px', overflow: 'hidden', whiteSpace: 'nowrap'
                                }}
                            >
                                <span className="material-symbols-rounded material-filled" style={{ fontSize: 24, color: '#facc15' }}>lightbulb</span>
                                Hint
                            </motion.button>
                        )}
                    </AnimatePresence>
                    <div style={{
                        display: 'flex', alignItems: 'center', gap: '6px',
                        padding: '8px 16px', borderRadius: '12px',
                        background: 'rgba(255,255,255,0.2)', backdropFilter: 'blur(10px)',
                        fontWeight: 700, fontSize: '17px', color: 'white'
                    }}>
                        <span className="material-symbols-rounded material-filled" style={{ fontSize: 20 }}>star</span>
                        {score}
                    </div>
                    <div style={{
                        padding: '8px 16px', borderRadius: '12px',
                        background: 'rgba(255,255,255,0.2)', backdropFilter: 'blur(10px)',
                        fontWeight: 700, fontSize: '17px', color: 'white'
                    }}>
                        {currentIndex + 1} / {totalQuestions}
                    </div>
                    <motion.button
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.9 }}
                        onClick={() => setIsExpanded(prev => !prev)}
                        style={{
                            width: '42px', height: '42px', borderRadius: '12px',
                            border: 'none', background: 'rgba(255,255,255,0.2)',
                            backdropFilter: 'blur(10px)', cursor: 'pointer',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            color: 'white'
                        }}
                    >
                        <span className="material-symbols-rounded" style={{ fontSize: 22 }}>
                            {isExpanded ? 'close_fullscreen' : 'open_in_full'}
                        </span>
                    </motion.button>
                </div>
            </div>

            {/* Progress bar */}
            <div style={{ padding: '0 24px', position: 'relative', zIndex: 10 }}>
                <div style={{
                    height: '5px', borderRadius: '10px',
                    background: 'rgba(255,255,255,0.2)', overflow: 'hidden'
                }}>
                    <motion.div
                        animate={{ width: `${((currentIndex + (showResult ? 1 : 0)) / totalQuestions) * 100}%` }}
                        transition={{ duration: 0.5, ease: 'easeInOut' }}
                        style={{ height: '100%', borderRadius: '10px', background: 'rgba(255,255,255,0.7)' }}
                    />
                </div>
            </div>

            {/* Main Content */}
            <div style={{
                flex: 1, display: 'flex', flexDirection: 'column',
                alignItems: 'center', justifyContent: 'center',
                padding: isExpanded ? '8px 12px' : '12px 28px',
                position: 'relative', zIndex: 10, minHeight: 0
            }}>
                <AnimatePresence mode="wait">
                    <motion.div
                        key={currentIndex}
                        initial={{ opacity: 0, y: 30, scale: 0.97 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: -30, scale: 0.97 }}
                        transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
                        style={{
                            width: '100%',
                            maxWidth: isExpanded ? '100%' : '1050px',
                            height: isExpanded ? '100%' : 'auto',
                            display: 'flex', flexDirection: 'column',
                            gap: isExpanded ? '10px' : '16px'
                        }}
                    >
                        {/* Question Card */}
                        <motion.div layout style={{
                            width: '100%',
                            background: 'rgba(255,255,255,0.95)',
                            backdropFilter: 'blur(20px)',
                            borderRadius: isExpanded ? '18px' : '24px',
                            padding: isExpanded ? '20px 28px' : '28px 36px',
                            position: 'relative',
                            boxShadow: '0 12px 40px rgba(0,0,0,0.1)',
                            overflow: 'visible'
                        }}>
                            {/* Top: student badge + difficulty */}
                            <div style={{
                                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                                marginBottom: '16px'
                            }}>
                                {student ? (
                                    <StarBadgeContainer
                                        ref={studentBadgeRef}
                                        starState={starAnim}
                                        color={colorValue}
                                    >
                                        <span className="material-symbols-rounded material-filled" style={{
                                            fontSize: 32, color: colorValue
                                        }}>{student.logoId || 'person'}</span>
                                        <span style={{
                                            fontSize: 28,
                                            fontWeight: 800,
                                            fontFamily: 'var(--font-display)'
                                        }}>{student.name}</span>
                                    </StarBadgeContainer>
                                ) : (
                                    <div style={{
                                        fontSize: headerFontSize, fontWeight: 700, color: '#94a3b8',
                                        letterSpacing: '0.5px', textTransform: 'uppercase'
                                    }}>Question {currentIndex + 1}</div>
                                )}

                                <div style={{
                                    display: 'flex', alignItems: 'center', gap: '6px',
                                    padding: '4px 10px', borderRadius: '10px',
                                    background: 'rgba(0,0,0,0.04)'
                                }}>
                                    <DifficultyStars difficulty={currentQuestion?.difficulty} />
                                </div>
                            </div>

                            {/* Question header (skip if duplicate) */}
                            {!isDuplicate && currentQuestion?.prompt && (
                                <div style={{
                                    fontSize: headerFontSize, fontWeight: 700,
                                    color: '#94a3b8', marginBottom: '8px'
                                }}>
                                    <FormatTextWithQuotes text={currentQuestion.question} color={colorValue} />
                                </div>
                            )}

                            {/* Main question — DYNAMIC FONT SIZE */}
                            <div style={{
                                fontSize: dynamicFontSize, fontWeight: 700,
                                color: '#1e293b', lineHeight: 1.4,
                                textAlign: 'center'
                            }}>
                                {currentQuestion?.prompt ? (
                                    <PromptText
                                        segments={typeof currentQuestion.prompt === 'string' ? [{ text: currentQuestion.prompt }] : currentQuestion.prompt}
                                        color={showResult ? resultColor : colorValue}
                                        fontSize={dynamicFontSize}
                                    />
                                ) : (
                                    <FormatTextWithQuotes text={currentQuestion?.question} color={showResult ? resultColor : colorValue} />
                                )}
                            </div>
                        </motion.div>

                        {/* Answer Options */}
                        <div style={{
                            display: 'grid', gridTemplateColumns: '1fr 1fr',
                            gap: isExpanded ? '8px' : '12px',
                            width: '100%', flex: isExpanded ? 1 : 'none'
                        }}>
                            {(currentQuestion?.options || []).map((option, i) => {
                                const label = ANSWER_LABELS[i]
                                const isSelected = selectedAnswer === option
                                const isCorrectOpt = option === currentQuestion?.answer
                                const isWrong = showResult && isSelected && !isCorrectOpt

                                let optBg = 'rgba(255,255,255,0.92)'
                                let optBorder = '2px solid rgba(255,255,255,0.6)'
                                let optColor = '#334155'
                                let optShadow = '0 4px 16px rgba(0,0,0,0.08)'
                                let lblBg = `${colorValue}20`
                                let lblColor = colorValue

                                if (showResult) {
                                    if (isCorrectOpt) {
                                        optBg = '#f0fdf4'; optBorder = '3px solid #22c55e'
                                        optColor = '#166534'; optShadow = '0 8px 30px rgba(34,197,94,0.25)'
                                        lblBg = '#22c55e'; lblColor = 'white'
                                    } else if (isWrong) {
                                        optBg = '#fef2f2'; optBorder = '3px solid #ef4444'
                                        optColor = '#991b1b'; optShadow = '0 8px 30px rgba(239,68,68,0.2)'
                                        lblBg = '#ef4444'; lblColor = 'white'
                                    } else {
                                        optBg = 'rgba(255,255,255,0.5)'; optBorder = '2px solid rgba(255,255,255,0.3)'
                                        optColor = '#94a3b8'; optShadow = 'none'
                                        lblBg = '#f1f5f9'; lblColor = '#94a3b8'
                                    }
                                }

                                return (
                                    <motion.button
                                        key={i}
                                        ref={el => answerRefs.current[i] = el}
                                        whileHover={!showResult ? { scale: 1.02, y: -2 } : {}}
                                        whileTap={!showResult ? { scale: 0.98 } : {}}
                                        onClick={() => handleAnswer(option, i)}
                                        disabled={showResult}
                                        animate={showResult && isCorrectOpt ? { scale: [1, 1.03, 1] } : {}}
                                        style={{
                                            padding: isExpanded ? '14px 18px' : '18px 22px',
                                            borderRadius: '18px', border: optBorder,
                                            background: optBg, backdropFilter: 'blur(10px)',
                                            color: optColor, fontSize: answerFontSize, fontWeight: 700,
                                            cursor: showResult ? 'default' : 'pointer',
                                            fontFamily: 'var(--font-display)',
                                            boxShadow: optShadow,
                                            display: 'flex', alignItems: 'center',
                                            gap: '14px', textAlign: 'left',
                                            transition: 'all 0.3s ease',
                                            minHeight: isExpanded ? 0 : '64px'
                                        }}
                                    >
                                        <div style={{
                                            width: '44px', height: '44px', borderRadius: '12px',
                                            background: lblBg, color: lblColor,
                                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                                            fontSize: answerFontSize - 2, fontWeight: 800, flexShrink: 0
                                        }}>
                                            {showResult && isCorrectOpt ? (
                                                <span className="material-symbols-rounded" style={{ fontSize: 26 }}>check</span>
                                            ) : showResult && isWrong ? (
                                                <span className="material-symbols-rounded" style={{ fontSize: 26 }}>close</span>
                                            ) : label}
                                        </div>
                                        <span style={{ lineHeight: 1.3 }}>
                                            <FormatTextWithQuotes text={option} color={showResult ? (isCorrectOpt ? 'white' : (isWrong ? 'white' : '#94a3b8')) : colorValue} />
                                        </span>
                                    </motion.button>
                                )
                            })}
                        </div>
                    </motion.div>
                </AnimatePresence>
            </div>

            {/* Floating bottom bar */}
            <AnimatePresence>
                {showResult && (
                    <motion.div
                        initial={{ y: 80, opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        exit={{ y: 80, opacity: 0 }}
                        transition={{ type: 'spring', stiffness: 300, damping: 28 }}
                        style={{
                            position: 'absolute', bottom: 0, left: 0, right: 0, zIndex: 50,
                            padding: '16px 24px 24px',
                            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '12px',
                            background: 'linear-gradient(0deg, rgba(0,0,0,0.2), transparent)'
                        }}
                    >
                        {currentQuestion?.explanation && (
                            <motion.button
                                whileHover={{ scale: 1.04 }}
                                whileTap={{ scale: 0.96 }}
                                onClick={() => setShowExplanation(prev => !prev)}
                                style={{
                                    padding: '14px 24px', borderRadius: '14px', border: 'none',
                                    background: 'rgba(255,255,255,0.25)', backdropFilter: 'blur(10px)',
                                    color: 'white', fontSize: '17px', fontWeight: 700,
                                    cursor: 'pointer', fontFamily: 'var(--font-display)',
                                    display: 'flex', alignItems: 'center', gap: '6px'
                                }}
                            >
                                <span className="material-symbols-rounded" style={{ fontSize: 20 }}>
                                    {showExplanation ? 'expand_more' : 'info'}
                                </span>
                                {showExplanation ? 'Hide' : 'Why?'}
                            </motion.button>
                        )}
                        <motion.button
                            whileHover={{ scale: 1.04, y: -2 }}
                            whileTap={{ scale: 0.96 }}
                            onClick={handleNext}
                            style={{
                                padding: '16px 40px', borderRadius: '16px', border: 'none',
                                background: 'white',
                                color: isCorrect ? '#16a34a' : '#dc2626',
                                fontSize: '20px', fontWeight: 800,
                                cursor: 'pointer', fontFamily: 'var(--font-display)',
                                boxShadow: '0 8px 30px rgba(0,0,0,0.15)',
                                display: 'flex', alignItems: 'center', gap: '8px'
                            }}
                        >
                            {currentIndex < totalQuestions - 1 ? (
                                <>Next<span className="material-symbols-rounded" style={{ fontSize: 22 }}>arrow_forward</span></>
                            ) : (
                                <>Results<span className="material-symbols-rounded" style={{ fontSize: 22 }}>emoji_events</span></>
                            )}
                        </motion.button>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Explanation popup */}
            <AnimatePresence>
                {showExplanation && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={() => setShowExplanation(false)}
                        style={{
                            position: 'fixed', inset: 0, zIndex: 200,
                            background: 'rgba(255,255,255,0.65)',
                            backdropFilter: 'blur(12px)',
                            display: 'flex', flexDirection: 'column',
                            alignItems: 'center', justifyContent: 'center',
                            cursor: 'pointer',
                            padding: '40px',
                            textAlign: 'center'
                        }}
                    >
                        <motion.div
                            initial={{ scale: 0.9, y: 20 }}
                            animate={{ scale: 1, y: 0 }}
                            exit={{ scale: 0.9, y: 20 }}
                            style={{ maxWidth: '900px', width: '100%' }}
                        >
                            {/* Question & Answer */}
                            <div style={{
                                fontSize: '32px', fontWeight: 800, color: '#334155',
                                marginBottom: '32px', lineHeight: 1.4
                            }}>
                                {currentQuestion?.prompt ? (
                                    <PromptText
                                        segments={typeof currentQuestion.prompt === 'string' ? [{ text: currentQuestion.prompt }] : currentQuestion.prompt}
                                        color="#334155"
                                        fontSize={32}
                                        filledAnswers={currentQuestion?.answer?.split(/\s*\/\s*/) || []}
                                    />
                                ) : (
                                    <>
                                        <FormatTextWithQuotes text={currentQuestion?.question} color={colorValue} />{' '}
                                        <span style={{ color: '#22c55e', textDecoration: 'underline' }}>
                                            {currentQuestion?.answer}
                                        </span>
                                    </>
                                )}
                            </div>

                            {/* Divider */}
                            <div style={{
                                width: '80px', height: '6px', borderRadius: '3px',
                                background: (student?.colorKey && colorValues[student.colorKey]) ? colorValues[student.colorKey] : colorValue,
                                opacity: 0.3,
                                margin: '0 auto 32px'
                            }} />

                            {/* Explanation */}
                            <div style={{
                                fontSize: '28px', fontWeight: 700,
                                color: (student?.colorKey && colorValues[student.colorKey]) ? colorValues[student.colorKey] : colorValue,
                                lineHeight: 1.5,
                                fontFamily: 'var(--font-display)'
                            }}>
                                <FormatTextWithQuotes
                                    text={currentQuestion?.explanation}
                                    color={(student?.colorKey && colorValues[student.colorKey]) ? colorValues[student.colorKey] : colorValue}
                                />
                            </div>
                        </motion.div>

                        <div style={{
                            position: 'absolute', bottom: '40px',
                            fontSize: '18px', fontWeight: 600,
                            color: 'rgba(0,0,0,0.4)',
                            fontFamily: 'var(--font-display)'
                        }}>
                            Tap anywhere to close
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {(hintAvailable || showHint) && !showResult && (
                <>
                    <AnimatePresence>
                        {showHint && (
                            <motion.div
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                exit={{ opacity: 0 }}
                                onClick={() => setShowHint(false)}
                                style={{
                                    position: 'fixed', inset: 0, zIndex: 200,
                                    background: 'rgba(255,255,255,0.65)',
                                    backdropFilter: 'blur(12px)',
                                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                                    cursor: 'pointer'
                                }}
                            >
                                <motion.div
                                    dir="rtl"
                                    initial={{ scale: 0.9, y: 20 }}
                                    animate={{ scale: 1, y: 0 }}
                                    exit={{ scale: 0.9, y: 20 }}
                                    style={{
                                        maxWidth: '90%',
                                        textAlign: 'center',
                                        color: '#1e293b',
                                        fontFamily: 'var(--font-arabic)',
                                        fontWeight: 800,
                                        fontSize: 'clamp(40px, 8vw, 80px)',
                                        lineHeight: 1.3,
                                        textShadow: '0 4px 20px rgba(0,0,0,0.1)',
                                        padding: '40px'
                                    }}
                                >
                                    {currentQuestion?.arabicHint}
                                </motion.div>
                                <div style={{
                                    position: 'absolute', bottom: '40px',
                                    fontSize: '18px', fontWeight: 600,
                                    color: 'rgba(0,0,0,0.4)',
                                    fontFamily: 'var(--font-display)'
                                }}>
                                    Tap anywhere to close
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>


                </>
            )}
        </motion.div>
    )
}

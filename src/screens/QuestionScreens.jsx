import { useState, useEffect, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { colorValues, getRandomAccentExcluding } from '../engine/serotoninEngine'
import { shuffle } from '../utils/helpers'
import { useAnimatedTitle } from '../hooks/useAnimatedTitle'
import { BackArrow } from '../components/BackArrow'
import { ListScreenWithTitle } from '../components/ListScreenWithTitle'
import { Confetti } from '../components/Confetti'
import { getBookUnits, getUnitData, getUnitMeta } from '../data/units'
import { TopBar } from '../components/TopBar'

// ============================================================
// UNIT SELECT - With animated title
// ============================================================

export function UnitSelect({ onSelect, onBack, onAccentChange, userName, selectedBook, currentUnit, screenClassName }) {
    const { title, color } = useAnimatedTitle({
        onColorChange: onAccentChange,
        initialColor: 'cyan',
        userName
    })

    // Part selection state with persistence
    const [selectedPart, setSelectedPart] = useState(() => localStorage.getItem('app_selected_part') || '1')

    useEffect(() => {
        localStorage.setItem('app_selected_part', selectedPart)
    }, [selectedPart])

    const allUnits = useMemo(() => getBookUnits(selectedBook), [selectedBook])

    // Filter units based on part
    // Part 1: Units 1-6
    // Part 2: Units 7-12
    const unitCards = useMemo(() => {
        const filtered = allUnits.filter(u => {
            const unitNum = parseInt(u, 10)
            if (selectedPart === '1') return unitNum >= 1 && unitNum <= 6
            if (selectedPart === '2') return unitNum >= 7 && unitNum <= 12
            return true
        })

        return filtered.map((u) => {
            const meta = getUnitMeta(selectedBook, u)
            const unitColor = meta.color || 'cyan'
            const unitTitle = meta.title || `Unit ${u}`
            const unitIcon = meta.icon || 'star'

            return { u, unitColor, unitTitle, unitIcon }
        })
    }, [allUnits, selectedBook, selectedPart])

    return (
        <motion.div
            className={`main-content students-screen ${screenClassName || ''}`}
            initial={{ opacity: 0 }}
            animate={{
                opacity: 1,
                '--accent': colorValues[color],
                '--accent-soft': `${colorValues[color]}33`,
                '--accent-softer': `${colorValues[color]}1f`,
                '--accent-grid': `${colorValues[color]}66`,
                '--blob-a-color': `${colorValues[color]}40`,
                '--blob-b-color': `${colorValues[color]}30`,
                '--blob-c-color': `${colorValues[color]}35`
            }}
            transition={{ duration: 0.22, ease: 'easeOut' }}
            exit={{ opacity: 0, transition: { duration: 0.12, ease: 'easeIn' } }}
        >
            <div className="students-blobs is-paused">
                <span className="students-blob blob-a" style={{ background: `radial-gradient(circle at 30% 30%, var(--blob-a-color), transparent 60%)` }} />
                <span className="students-blob blob-b" style={{ background: `radial-gradient(circle at 40% 40%, var(--blob-b-color), transparent 65%)` }} />
                <span className="students-blob blob-c" style={{ background: `radial-gradient(circle at 50% 30%, var(--blob-c-color), transparent 60%)` }} />
            </div>

            <TopBar title={title} onBack={onBack} color={color}>
                <div style={{ display: 'flex', gap: '8px' }}>
                    <button
                        onClick={() => setSelectedPart('1')}
                        className={`top-bar-button ${selectedPart === '1' ? 'active' : ''}`}
                        style={{
                            '--bar-accent': colorValues[color],
                            '--bar-base-bg': 'white',
                            '--bar-base-text': colorValues[color],
                            '--bar-shadow': `${colorValues[color]}33`,
                            minWidth: '100px'
                        }}
                    >
                        Part 1
                    </button>
                    <button
                        onClick={() => setSelectedPart('2')}
                        className={`top-bar-button ${selectedPart === '2' ? 'active' : ''}`}
                        style={{
                            '--bar-accent': colorValues[color],
                            '--bar-base-bg': 'white',
                            '--bar-base-text': colorValues[color],
                            '--bar-shadow': `${colorValues[color]}33`,
                            minWidth: '100px'
                        }}
                    >
                        Part 2
                    </button>
                </div>
            </TopBar>

            <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
                gap: '24px',
                width: '100%',
                maxWidth: '1400px',
                margin: '20px auto',
                padding: '0 20px 40px'
            }}>
                {unitCards.length > 0 ? (
                    unitCards.map(({ u, unitColor, unitTitle, unitIcon }) => (
                        <button
                            key={u}
                            className="unit-select-card"
                            onClick={() => onSelect(u, unitColor)}
                            style={{ '--unit-color': `var(--${unitColor})` }}
                            data-selected={currentUnit != null && String(currentUnit) === String(u) ? 'true' : 'false'}
                        >
                            <div className="unit-select-bg-icon">
                                <span className="material-symbols-rounded unit-select-icon">
                                    {unitIcon}
                                </span>
                            </div>

                            <div className="unit-select-content">
                                <h3 className="unit-select-unit">Unit {u}</h3>
                                <p className="unit-select-title">{unitTitle}</p>
                            </div>
                        </button>
                    ))
                ) : (
                    <div style={{
                        gridColumn: '1 / -1',
                        textAlign: 'center',
                        padding: '40px',
                        color: 'var(--text-muted)',
                        fontSize: '24px',
                        fontFamily: 'var(--font-display)'
                    }}>
                        No units available for Part {selectedPart}
                    </div>
                )}
            </div>
        </motion.div>
    )
}

// ============================================================
// QUESTION TYPE SELECT - With animated title
// ============================================================

export function QuestionTypeSelect({ unit, onSelect, onBack, onAccentChange, userName, selectedBook }) {
    const unitData = getUnitData(selectedBook, unit) || {}

    const questionTypes = [
        { key: 'grammarMCQ', label: 'Grammar', data: unitData.grammarMCQ, hasScore: true },
        { key: 'fillInBlank', label: 'Fill in the Blank', data: unitData.fillInBlank, hasScore: false },
        { key: 'oddOneOut', label: 'Odd One Out', data: unitData.oddOneOut, hasScore: true },
        { key: 'translateToArabic', label: 'Translate to Arabic', data: unitData.translateToArabic, hasScore: false },
        { key: 'translateToEnglish', label: 'Translate to English', data: unitData.translateToEnglish, hasScore: false }
    ].filter(t => t.data && t.data.length > 0)

    return (
        <ListScreenWithTitle
            items={questionTypes}
            onBack={onBack}
            onAccentChange={onAccentChange}
            userName={userName}
            renderItem={(item, color) => (
                <button
                    className={`btn btn-${color}`}
                    style={{ width: '100%', height: '100%' }}
                    onClick={() => onSelect(item.key, item.data, item.hasScore, color)}
                >
                    {item.label}
                </button>
            )}
        />
    )
}

// ============================================================
// QUESTION DISPLAY
// ============================================================

export function QuestionDisplay({ unit, questionType, questions, hasScore, onBack, staticColor: initialColor, onAccentChange }) {
    const [shuffledQuestions, setShuffledQuestions] = useState([])
    const [currentIndex, setCurrentIndex] = useState(0)
    const [selectedAnswer, setSelectedAnswer] = useState(null)
    const [showResult, setShowResult] = useState(false)
    const [showConfetti, setShowConfetti] = useState(false)
    const [score, setScore] = useState(0)
    const [revealedAnswer, setRevealedAnswer] = useState(false)
    const [questionColor, setQuestionColor] = useState(initialColor)

    useEffect(() => {
        setShuffledQuestions(shuffle(questions))
    }, [questions])

    // Sync background color with questionColor
    useEffect(() => {
        onAccentChange?.(questionColor)
    }, [questionColor, onAccentChange])

    if (shuffledQuestions.length === 0) return null

    const currentQuestion = shuffledQuestions[currentIndex]
    const progress = ((currentIndex + 1) / shuffledQuestions.length) * 100

    const checkAnswer = (answer) => {
        setSelectedAnswer(answer)
        setShowResult(true)

        let isCorrect = false

        if (questionType === 'grammarMCQ') {
            isCorrect = answer === currentQuestion.ans
        } else if (questionType === 'oddOneOut') {
            isCorrect = answer === currentQuestion.a
        }

        if (isCorrect && hasScore) {
            setScore(s => s + 1)
            setShowConfetti(true)
            setTimeout(() => setShowConfetti(false), 1800)
        }
    }

    const revealAnswer = () => {
        setRevealedAnswer(true)
    }

    const nextQuestion = () => {
        if (currentIndex < shuffledQuestions.length - 1) {
            setCurrentIndex(i => i + 1)
            setSelectedAnswer(null)
            setShowResult(false)
            setRevealedAnswer(false)
            if (localStorage.getItem('app_structured_mode') !== 'true') {
                setQuestionColor(getRandomAccentExcluding(questionColor))
            }
        }
    }

    const prevQuestion = () => {
        if (currentIndex > 0) {
            setCurrentIndex(i => i - 1)
            setSelectedAnswer(null)
            setShowResult(false)
            setRevealedAnswer(false)
            if (localStorage.getItem('app_structured_mode') !== 'true') {
                setQuestionColor(getRandomAccentExcluding(questionColor))
            }
        }
    }

    return (
        <motion.div
            className="idle-container"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
        >
            <BackArrow onClick={onBack} color={questionColor} />
            <Confetti show={showConfetti} />

            <div className="progress-container">
                <div className="progress-bar">
                    <motion.div
                        className="progress-fill"
                        style={{ backgroundColor: colorValues[questionColor] }}
                        animate={{ width: `${progress}%` }}
                    />
                </div>
                <div className="progress-text">
                    Question {currentIndex + 1} of {shuffledQuestions.length}
                    {hasScore && ` • Score: ${score}`}
                </div>
            </div>

            <div className="question-container">
                <AnimatePresence mode="wait">
                    <motion.div
                        key={currentIndex}
                        initial={{ x: 40, opacity: 0 }}
                        animate={{ x: 0, opacity: 1 }}
                        exit={{ x: -40, opacity: 0 }}
                        className="question-container"
                    >
                        {questionType === 'grammarMCQ' && (
                            <>
                                <div className="question-text">
                                    {currentQuestion.q.split('_____').map((part, i, arr) => (
                                        <span key={i}>
                                            {part}
                                            {i < arr.length - 1 && <span className="blank" style={{ borderColor: colorValues[questionColor] }} />}
                                        </span>
                                    ))}
                                </div>

                                <div className="options-grid">
                                    {currentQuestion.opts.map((opt, i) => {
                                        let className = 'option-btn'
                                        if (showResult) {
                                            if (opt === currentQuestion.ans) className += ' correct'
                                            else if (opt === selectedAnswer) className += ' incorrect'
                                        } else if (opt === selectedAnswer) {
                                            className += ' selected'
                                        }

                                        return (
                                            <motion.button
                                                key={i}
                                                className={className}
                                                onClick={() => !showResult && checkAnswer(opt)}
                                                whileHover={{ scale: showResult ? 1 : 1.02 }}
                                                whileTap={{ scale: showResult ? 1 : 0.98 }}
                                            >
                                                {opt}
                                            </motion.button>
                                        )
                                    })}
                                </div>
                            </>
                        )}

                        {questionType === 'fillInBlank' && (
                            <>
                                <div className="question-text">
                                    {currentQuestion.s.split('_____').map((part, i, arr) => (
                                        <span key={i}>
                                            {part}
                                            {i < arr.length - 1 && (
                                                revealedAnswer ? (
                                                    <span style={{ color: colorValues[questionColor], fontWeight: 700 }}>
                                                        {currentQuestion.a}
                                                    </span>
                                                ) : (
                                                    <span className="blank" style={{ borderColor: colorValues[questionColor] }} />
                                                )
                                            )}
                                        </span>
                                    ))}
                                </div>

                                {!revealedAnswer && (
                                    <button
                                        className={`btn btn-solid-${questionColor}`}
                                        onClick={revealAnswer}
                                    >
                                        Reveal Answer
                                    </button>
                                )}

                                {revealedAnswer && (
                                    <motion.div
                                        initial={{ scale: 0.9, opacity: 0 }}
                                        animate={{ scale: 1, opacity: 1 }}
                                        className="reveal-answer"
                                        style={{
                                            backgroundColor: `${colorValues[questionColor]}20`,
                                            border: `3px solid ${colorValues[questionColor]}`,
                                            color: colorValues[questionColor]
                                        }}
                                    >
                                        {currentQuestion.a}
                                    </motion.div>
                                )}
                            </>
                        )}

                        {questionType === 'oddOneOut' && (
                            <>
                                <div className="question-text">
                                    Which word doesn't belong?
                                </div>

                                <div className="options-grid">
                                    {currentQuestion.w.map((word, i) => {
                                        let className = 'option-btn'
                                        if (showResult) {
                                            if (word === currentQuestion.a) className += ' correct'
                                            else if (word === selectedAnswer) className += ' incorrect'
                                        } else if (word === selectedAnswer) {
                                            className += ' selected'
                                        }

                                        return (
                                            <motion.button
                                                key={i}
                                                className={className}
                                                onClick={() => !showResult && checkAnswer(word)}
                                                whileHover={{ scale: showResult ? 1 : 1.02 }}
                                                whileTap={{ scale: showResult ? 1 : 0.98 }}
                                            >
                                                {word}
                                            </motion.button>
                                        )
                                    })}
                                </div>
                            </>
                        )}

                        {questionType === 'translateToArabic' && (
                            <>
                                <div className="question-text">
                                    {currentQuestion.en}
                                </div>

                                {!revealedAnswer ? (
                                    <button
                                        className={`btn btn-solid-${questionColor}`}
                                        onClick={revealAnswer}
                                    >
                                        Show Translation / أظهر الترجمة
                                    </button>
                                ) : (
                                    <motion.div
                                        initial={{ scale: 0.9, opacity: 0 }}
                                        animate={{ scale: 1, opacity: 1 }}
                                        className={`arabic-text card card-${questionColor}`}
                                        style={{ padding: 'var(--space-lg)', maxWidth: '850px' }}
                                    >
                                        {currentQuestion.ar}
                                    </motion.div>
                                )}
                            </>
                        )}

                        {questionType === 'translateToEnglish' && (
                            <>
                                <div className="question-text arabic-text" style={{ fontSize: 'var(--text-lg)' }}>
                                    {currentQuestion.ar}
                                </div>

                                {!revealedAnswer ? (
                                    <button
                                        className={`btn btn-solid-${questionColor}`}
                                        onClick={revealAnswer}
                                    >
                                        Show Translation
                                    </button>
                                ) : (
                                    <motion.div
                                        initial={{ scale: 0.9, opacity: 0 }}
                                        animate={{ scale: 1, opacity: 1 }}
                                        className={`body-text card card-${questionColor}`}
                                        style={{ padding: 'var(--space-lg)', maxWidth: '850px', textAlign: 'center' }}
                                    >
                                        {currentQuestion.en}
                                    </motion.div>
                                )}
                            </>
                        )}
                    </motion.div>
                </AnimatePresence>

                <div className="nav-buttons">
                    <button
                        className={`btn btn-sm btn-${questionColor}`}
                        onClick={prevQuestion}
                        disabled={currentIndex === 0}
                        style={{ opacity: currentIndex === 0 ? 0.4 : 1 }}
                    >
                        ← Previous
                    </button>
                    <button
                        className={`btn btn-sm btn-${questionColor}`}
                        onClick={nextQuestion}
                        disabled={currentIndex === shuffledQuestions.length - 1}
                        style={{ opacity: currentIndex === shuffledQuestions.length - 1 ? 0.4 : 1 }}
                    >
                        Next →
                    </button>
                </div>
            </div>
        </motion.div>
    )
}

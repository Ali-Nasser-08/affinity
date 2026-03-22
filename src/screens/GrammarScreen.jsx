import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { colorValues, bgTints, getRandomAccentExcluding, textColors, lightTints } from '../engine/serotoninEngine'
import { shuffle } from '../utils/helpers'
import { BackArrow } from '../components/BackArrow'
import { Confetti } from '../components/Confetti'
import { TopBar } from '../components/TopBar'
import { useAnimatedTitle } from '../hooks/useAnimatedTitle'
import { GrammarCardPlayer } from '../components/GrammarCardPlayer'
import { unit8GrammarContent, unit8Examples, unit8Questions } from '../data/unit8_grammar'
import unit1GrammarData from '../data/books/megaGoal1/grammar/unit1/grammar.json'
import unit1FmnData from '../data/books/megaGoal1/grammar/unit1/fmn.json'
import unit2GrammarData from '../data/books/megaGoal1/grammar/unit2/grammar.json'
import unit2FmnData from '../data/books/megaGoal1/grammar/unit2/fmn.json'
import unit3GrammarData from '../data/books/megaGoal1/grammar/unit3/grammar.json'
import unit3FmnData from '../data/books/megaGoal1/grammar/unit3/fmn.json'
import unit4GrammarData from '../data/books/megaGoal1/grammar/unit4/grammar.json'
import unit4FmnData from '../data/books/megaGoal1/grammar/unit4/fmn.json'
import unit5GrammarData from '../data/books/megaGoal1/grammar/unit5/grammar.json'
import unit5FmnData from '../data/books/megaGoal1/grammar/unit5/fmn.json'
import unit6GrammarData from '../data/books/megaGoal1/grammar/unit6/grammar.json'
import unit6FmnData from '../data/books/megaGoal1/grammar/unit6/fmn.json'
import unit7GrammarData from '../data/books/megaGoal1/grammar/unit7/grammar.json'
import unit7FmnData from '../data/books/megaGoal1/grammar/unit7/fmn.json'
import unit8GrammarData from '../data/books/megaGoal1/grammar/unit8/grammar.json'
import unit8FmnData from '../data/books/megaGoal1/grammar/unit8/fmn.json'
import unit9GrammarData from '../data/books/megaGoal1/grammar/unit9/grammar.json'
import unit9FmnData from '../data/books/megaGoal1/grammar/unit9/fmn.json'
import unit10GrammarData from '../data/books/megaGoal1/grammar/unit10/grammar.json'
import unit10FmnData from '../data/books/megaGoal1/grammar/unit10/fmn.json'
import unit11GrammarData from '../data/books/megaGoal1/grammar/unit11/grammar.json'
import unit11FmnData from '../data/books/megaGoal1/grammar/unit11/fmn.json'
import unit12GrammarData from '../data/books/megaGoal1/grammar/unit12/grammar.json'
import unit12FmnData from '../data/books/megaGoal1/grammar/unit12/fmn.json'

export function GrammarUnitLanding({ unit, selectedBook, onBack, onAccentChange, staticColor, userName }) {
    const unitNumber = typeof unit === 'string' ? parseInt(unit, 10) : unit
    const accentColor = staticColor || 'cyan'
    const [activeDataset, setActiveDataset] = useState(null)
    const { title, color } = useAnimatedTitle({
        onColorChange: onAccentChange,
        initialColor: accentColor,
        userName
    })
    const activeColor = color || accentColor

    useEffect(() => {
        onAccentChange?.(accentColor)
    }, [accentColor, onAccentChange])

    // Get grammar data based on book and unit
    const getGrammarData = () => {
        if (selectedBook === 'Mega Goal 1') {
            if (unitNumber === 1) return unit1GrammarData
            if (unitNumber === 2) return unit2GrammarData
            if (unitNumber === 3) return unit3GrammarData
            if (unitNumber === 4) return unit4GrammarData
            if (unitNumber === 5) return unit5GrammarData
            if (unitNumber === 6) return unit6GrammarData
            if (unitNumber === 7) return unit7GrammarData
            if (unitNumber === 8) return unit8GrammarData
            if (unitNumber === 9) return unit9GrammarData
            if (unitNumber === 10) return unit10GrammarData
            if (unitNumber === 11) return unit11GrammarData
            if (unitNumber === 12) return unit12GrammarData
        }
        return null
    }

    // Get FMN data based on book and unit
    const getFmnData = () => {
        if (selectedBook === 'Mega Goal 1') {
            if (unitNumber === 1) return unit1FmnData
            if (unitNumber === 2) return unit2FmnData
            if (unitNumber === 3) return unit3FmnData
            if (unitNumber === 4) return unit4FmnData
            if (unitNumber === 5) return unit5FmnData
            if (unitNumber === 6) return unit6FmnData
            if (unitNumber === 7) return unit7FmnData
            if (unitNumber === 8) return unit8FmnData
            if (unitNumber === 9) return unit9FmnData
            if (unitNumber === 10) return unit10FmnData
            if (unitNumber === 11) return unit11FmnData
            if (unitNumber === 12) return unit12FmnData
        }
        return null
    }

    const grammarData = getGrammarData()
    const fmnData = getFmnData()
    const clusters = grammarData?.clusters || []
    const accentValue = colorValues[activeColor]
    const textColor = textColors[activeColor]
    const lightTint = lightTints[activeColor]

    // Handle player completion
    const handlePlayerComplete = () => {
        setActiveDataset(null)
    }

    // Show the Grammar Card Player
    if (activeDataset) {
        return (
            <AnimatePresence mode="wait">
                <GrammarCardPlayer
                    grammarData={activeDataset}
                    accentColor={accentColor}
                    onComplete={handlePlayerComplete}
                    onBack={() => setActiveDataset(null)}
                />
            </AnimatePresence>
        )
    }

    return (
        <motion.div
            className="main-content students-screen"
            initial={{ opacity: 0 }}
            animate={{
                opacity: 1,
                '--accent': colorValues[activeColor],
                '--accent-soft': `${colorValues[activeColor]}33`,
                '--accent-softer': `${colorValues[activeColor]}1f`,
                '--accent-grid': `${colorValues[activeColor]}66`,
                '--blob-a-color': `${colorValues[activeColor]}40`,
                '--blob-b-color': `${colorValues[activeColor]}30`,
                '--blob-c-color': `${colorValues[activeColor]}35`
            }}
            transition={{ duration: 0.22, ease: 'easeOut' }}
            exit={{ opacity: 0, transition: { duration: 0.12, ease: 'easeIn' } }}
        >
            <div className="students-blobs is-paused">
                <span className="students-blob blob-a" style={{ background: `radial-gradient(circle at 30% 30%, var(--blob-a-color), transparent 60%)` }} />
                <span className="students-blob blob-b" style={{ background: `radial-gradient(circle at 40% 40%, var(--blob-b-color), transparent 65%)` }} />
                <span className="students-blob blob-c" style={{ background: `radial-gradient(circle at 50% 30%, var(--blob-c-color), transparent 60%)` }} />
            </div>

            <TopBar title={title} onBack={onBack} color={activeColor} />

            <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
                gap: '24px',
                width: '100%',
                maxWidth: '1200px',
                margin: '20px auto',
                padding: '0 20px 40px'
            }}>
                {/* Grammar Card - Clickable to open player */}
                <motion.div
                    style={{
                        background: '#ffffff',
                        border: `3px solid ${accentValue}`,
                        borderRadius: '28px',
                        padding: '28px',
                        minHeight: '320px',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '18px',
                        boxShadow: '0 12px 32px -8px rgba(0,0,0,0.12)',
                        cursor: clusters.length > 0 ? 'pointer' : 'default',
                        transition: 'all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1)'
                    }}
                    whileHover={clusters.length > 0 ? {
                        scale: 1.02,
                        boxShadow: `0 20px 50px ${accentValue}30`
                    } : {}}
                    whileTap={clusters.length > 0 ? { scale: 0.98 } : {}}
                    onClick={() => clusters.length > 0 && setActiveDataset(grammarData)}
                >
                    <div style={{
                        fontSize: '32px',
                        fontWeight: 900,
                        fontFamily: 'var(--font-display)',
                        color: accentValue
                    }}>
                        Grammar
                    </div>
                    <div style={{
                        display: 'flex',
                        flexWrap: 'wrap',
                        gap: '10px'
                    }}>
                        {clusters.map((cluster) => (
                            <span
                                key={cluster.clusterId}
                                style={{
                                    background: accentValue,
                                    color: 'white',
                                    fontWeight: 700,
                                    fontSize: '14px',
                                    padding: '6px 12px',
                                    borderRadius: '999px'
                                }}
                            >
                                {cluster.title}
                            </span>
                        ))}
                    </div>

                    {/* Start Learning Button */}
                    {clusters.length > 0 && (
                        <motion.button
                            className={`btn btn-${activeColor}`}
                            style={{
                                marginTop: 'auto',
                                width: '100%',
                                minHeight: '50px',
                                padding: '8px 20px',
                                fontSize: '28px',
                                borderRadius: '16px'
                            }}
                            whileHover={{ scale: 1.05, y: -2 }}
                            whileTap={{ scale: 0.95 }}
                        >
                            <span className="material-symbols-rounded" style={{ fontSize: '36px' }}>play_arrow</span>
                            <span>Start Learning</span>
                        </motion.button>
                    )}
                </motion.div>

                {/* FMN Card */}
                <motion.div
                    style={{
                        background: '#ffffff',
                        border: `3px solid ${accentValue}`,
                        borderRadius: '28px',
                        padding: '28px',
                        minHeight: '320px',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '18px',
                        boxShadow: '0 12px 32px -8px rgba(0,0,0,0.12)',
                        cursor: fmnData?.clusters?.length > 0 ? 'pointer' : 'default',
                        transition: 'all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1)'
                    }}
                    whileHover={fmnData?.clusters?.length > 0 ? {
                        scale: 1.02,
                        boxShadow: `0 20px 50px ${accentValue}30`
                    } : {}}
                    whileTap={fmnData?.clusters?.length > 0 ? { scale: 0.98 } : {}}
                    onClick={() => fmnData?.clusters?.length > 0 && setActiveDataset(fmnData)}
                >
                    <div style={{
                        fontSize: '32px',
                        fontWeight: 900,
                        fontFamily: 'var(--font-display)',
                        color: accentValue
                    }}>
                        Form, Meaning and Function
                    </div>

                    <div style={{
                        display: 'flex',
                        flexWrap: 'wrap',
                        gap: '10px'
                    }}>
                        {fmnData?.clusters?.map((cluster) => (
                            <span
                                key={cluster.clusterId}
                                style={{
                                    background: accentValue,
                                    color: 'white',
                                    fontWeight: 700,
                                    fontSize: '14px',
                                    padding: '6px 12px',
                                    borderRadius: '999px'
                                }}
                            >
                                {cluster.title}
                            </span>
                        ))}
                    </div>

                    {/* Start Learning Button */}
                    {fmnData?.clusters?.length > 0 && (
                        <motion.button
                            className={`btn btn-${activeColor}`}
                            style={{
                                marginTop: 'auto',
                                width: '100%',
                                minHeight: '50px',
                                padding: '8px 20px',
                                fontSize: '28px',
                                borderRadius: '16px'
                            }}
                            whileHover={{ scale: 1.05, y: -2 }}
                            whileTap={{ scale: 0.95 }}
                        >
                            <span className="material-symbols-rounded" style={{ fontSize: '36px' }}>play_arrow</span>
                            <span>Start Learning</span>
                        </motion.button>
                    )}
                </motion.div>
            </div>
        </motion.div>
    )
}


// ============================================================
// MENU
// ============================================================
export function Unit8GrammarMenu({ onNavigate, onBack, onAccentChange, userName }) {
    const menuItems = [
        { key: 'explain', label: 'Explanation', color: 'cyan' },
        { key: 'examples', label: 'Examples', color: 'pink' },
        { key: 'questions', label: 'Quiz', color: 'lime' }
    ]

    useEffect(() => {
        onAccentChange?.('cyan')
    }, [onAccentChange])

    return (
        <motion.div
            className="idle-container"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
        >
            <BackArrow onClick={onBack} color="cyan" />

            <div className="flex flex-col items-center justify-center h-full w-full max-w-4xl gap-xl p-lg">
                <motion.h1
                    className="text-4xl font-bold mb-lg text-center"
                    style={{ color: colorValues.cyan }}
                    initial={{ y: -20, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                >
                    Unit 8 Grammar
                </motion.h1>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-lg w-full">
                    {menuItems.map((item, index) => (
                        <motion.button
                            key={item.key}
                            className={`btn btn-${item.color} flex flex-col items-center justify-center p-xl h-64 gap-md`}
                            onClick={() => onNavigate(item.key)}
                            initial={{ scale: 0.9, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            transition={{ delay: index * 0.1 }}
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                        >
                            <span className="text-2xl font-bold">{item.label}</span>
                        </motion.button>
                    ))}
                </div>
            </div>
        </motion.div>
    )
}

// ============================================================
// EXPLAIN
// ============================================================
export function Unit8GrammarExplain({ onBack, onAccentChange }) {
    const [activeTab, setActiveTab] = useState('suchSoThat')
    const [color, setColor] = useState('cyan')

    useEffect(() => {
        onAccentChange?.(color)
    }, [color, onAccentChange])

    const content = unit8GrammarContent[activeTab]

    return (
        <motion.div
            className="idle-container"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
        >
            <BackArrow onClick={onBack} color={color} />

            <div className="flex flex-col h-full w-full max-w-5xl p-lg gap-lg overflow-hidden">
                <div className="flex justify-center gap-md mb-md">
                    <button
                        className={`btn btn-sm ${activeTab === 'suchSoThat' ? `btn-${color}` : 'btn-outline'}`}
                        onClick={() => { setActiveTab('suchSoThat'); setColor('cyan'); }}
                    >
                        Such...That / So...That
                    </button>
                    <button
                        className={`btn btn-sm ${activeTab === 'reducingAdverbClauses' ? `btn-${color}` : 'btn-outline'}`}
                        onClick={() => { setActiveTab('reducingAdverbClauses'); setColor('pink'); }}
                    >
                        Reducing Adverb Clauses
                    </button>
                </div>

                <motion.div
                    key={activeTab}
                    className="flex-1 overflow-y-auto p-lg rounded-xl"
                    style={{ backgroundColor: bgTints[color] }}
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.3 }}
                >
                    <h2 className="text-3xl font-bold mb-md" style={{ color: colorValues[color] }}>
                        {content.title}
                    </h2>
                    <h3 className="text-xl mb-lg opacity-75" style={{ color: colorValues[color] }}>
                        {content.titleAr}
                    </h3>

                    <div className="mb-xl space-y-md">
                        <p className="text-lg">{content.introduction.en}</p>
                        <p className="text-lg text-right" dir="rtl">{content.introduction.ar}</p>
                    </div>

                    {content.note && (
                        <div className="p-md rounded-lg mb-xl border-l-4" style={{ borderColor: colorValues[color], backgroundColor: 'rgba(255,255,255,0.5)' }}>
                            <p className="mb-sm"><strong>Note:</strong> {content.note.en}</p>
                            <p className="mb-sm text-right" dir="rtl"><strong>ملاحظة:</strong> {content.note.ar}</p>
                            {content.note.example && <p className="italic opacity-80">Ex: {content.note.example}</p>}
                        </div>
                    )}

                    {content.patterns && (
                        <div className="space-y-xl">
                            {content.patterns.map((pat, i) => (
                                <div key={i} className="bg-white/50 p-lg rounded-lg">
                                    <code className="block text-xl font-bold mb-md p-sm rounded bg-black/5" style={{ color: colorValues[color] }}>
                                        {pat.pattern}
                                    </code>
                                    <ul className="list-disc list-inside space-y-sm">
                                        {pat.examples.map((ex, j) => (
                                            <li key={j} className="text-lg">{ex}</li>
                                        ))}
                                    </ul>
                                </div>
                            ))}
                        </div>
                    )}

                    {content.examples && (
                        <div className="space-y-lg">
                            {content.examples.map((ex, i) => (
                                <div key={i} className="bg-white/50 p-lg rounded-lg">
                                    <p className="mb-sm"><strong>Original:</strong> {ex.original}</p>
                                    <p className="font-bold" style={{ color: colorValues[color] }}>
                                        <strong>Reduced:</strong> {ex.reduced}
                                    </p>
                                </div>
                            ))}
                        </div>
                    )}
                </motion.div>
            </div>
        </motion.div>
    )
}

// ============================================================
// EXAMPLES
// ============================================================
export function Unit8GrammarExamples({ onBack, onAccentChange }) {
    const [shuffledExamples, setShuffledExamples] = useState([])
    const isStructured = localStorage.getItem('app_structured_mode') === 'true'
    const [color, setColor] = useState(isStructured ? (localStorage.getItem('app_structured_color') || 'cyan') : 'lime')

    useEffect(() => {
        setShuffledExamples(shuffle(unit8Examples))
    }, [])

    useEffect(() => {
        onAccentChange?.(color)
    }, [color, onAccentChange])

    return (
        <motion.div
            className="idle-container"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
        >
            <BackArrow onClick={onBack} color={color} />

            <div className="flex flex-col h-full w-full max-w-4xl p-lg">
                <h1 className="text-3xl font-bold mb-lg text-center" style={{ color: colorValues[color] }}>
                    Grammar Examples
                </h1>

                <div className="flex-1 overflow-y-auto space-y-md pr-sm custom-scrollbar">
                    {shuffledExamples.map((ex, i) => (
                        <motion.div
                            key={i}
                            className="p-lg rounded-lg bg-white shadow-sm border-l-4"
                            style={{ borderColor: colorValues[color] }}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: i * 0.05 }}
                        >
                            <div className="text-sm font-bold uppercase tracking-wider mb-xs opacity-50">
                                {ex.grammar}
                            </div>
                            <div className="text-xl">
                                {ex.text.split(ex.highlight).map((part, idx, arr) => (
                                    <span key={idx}>
                                        {part}
                                        {idx < arr.length - 1 && (
                                            <span style={{ color: colorValues[color], fontWeight: 'bold' }}>
                                                {ex.highlight}
                                            </span>
                                        )}
                                    </span>
                                ))}
                            </div>
                        </motion.div>
                    ))}
                </div>

                <div className="mt-lg text-center">
                    <button
                        className={`btn btn-${color}`}
                        onClick={() => {
                            setShuffledExamples(shuffle(unit8Examples))
                            if (!isStructured) setColor(getRandomAccentExcluding(color))
                        }}
                    >
                        Shuffle Examples
                    </button>
                </div>
            </div>
        </motion.div>
    )
}

// ============================================================
// QUESTIONS
// ============================================================
export function Unit8GrammarQuestions({ onBack, onAccentChange }) {
    const [shuffledQuestions, setShuffledQuestions] = useState([])
    const [currentIndex, setCurrentIndex] = useState(0)
    const [selectedAnswer, setSelectedAnswer] = useState(null)
    const [showResult, setShowResult] = useState(false)
    const [score, setScore] = useState(0)
    const [showConfetti, setShowConfetti] = useState(false)
    const isStructured = localStorage.getItem('app_structured_mode') === 'true'
    const [questionColor, setQuestionColor] = useState(isStructured ? (localStorage.getItem('app_structured_color') || 'cyan') : 'pink')

    useEffect(() => {
        setShuffledQuestions(shuffle(unit8Questions))
    }, [])

    useEffect(() => {
        onAccentChange?.(questionColor)
    }, [questionColor, onAccentChange])

    if (shuffledQuestions.length === 0) return null

    const currentQuestion = shuffledQuestions[currentIndex]
    const progress = ((currentIndex + 1) / shuffledQuestions.length) * 100
    const isComplete = currentIndex === shuffledQuestions.length - 1 && showResult

    const checkAnswer = (optionIndex) => {
        if (showResult) return
        setSelectedAnswer(optionIndex)
        setShowResult(true)

        if (optionIndex === currentQuestion.correct) {
            setScore(s => s + 1)
            setShowConfetti(true)
            setTimeout(() => setShowConfetti(false), 1800)
        }
    }

    const nextQuestion = () => {
        if (currentIndex < shuffledQuestions.length - 1) {
            setCurrentIndex(i => i + 1)
            setSelectedAnswer(null)
            setShowResult(false)
            if (!isStructured) setQuestionColor(getRandomAccentExcluding(questionColor))
        }
    }

    const prevQuestion = () => {
        if (currentIndex > 0) {
            setCurrentIndex(i => i - 1)
            setSelectedAnswer(null)
            setShowResult(false)
            if (!isStructured) setQuestionColor(getRandomAccentExcluding(questionColor))
        }
    }

    const restartQuiz = () => {
        setShuffledQuestions(shuffle(unit8Questions))
        setCurrentIndex(0)
        setSelectedAnswer(null)
        setShowResult(false)
        setScore(0)
        if (!isStructured) setQuestionColor(getRandomAccentExcluding(questionColor))
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

            {/* Progress bar */}
            <div className="progress-container">
                <div className="progress-bar">
                    <motion.div
                        className="progress-fill"
                        style={{ backgroundColor: colorValues[questionColor] }}
                        animate={{ width: `${progress}%` }}
                    />
                </div>
                <div className="progress-text">
                    Question {currentIndex + 1} of {shuffledQuestions.length} • Score: {score}
                </div>
            </div>

            <div className="question-container">
                <AnimatePresence mode="wait">
                    {!isComplete ? (
                        <motion.div
                            key={currentIndex}
                            initial={{ x: 40, opacity: 0 }}
                            animate={{ x: 0, opacity: 1 }}
                            exit={{ x: -40, opacity: 0 }}
                            className="question-container"
                        >
                            {/* Question text with blank highlighting */}
                            <div className="question-text">
                                {currentQuestion.question.split('___').map((part, i, arr) => (
                                    <span key={i}>
                                        {part}
                                        {i < arr.length - 1 && <span className="blank" style={{ borderColor: colorValues[questionColor] }} />}
                                    </span>
                                ))}
                            </div>

                            {/* Options grid */}
                            <div className="options-grid">
                                {currentQuestion.options.map((option, i) => {
                                    const isSelected = selectedAnswer === i
                                    const isCorrect = i === currentQuestion.correct
                                    let className = 'option-btn'

                                    if (showResult) {
                                        if (isCorrect) className += ' correct'
                                        else if (isSelected && !isCorrect) className += ' incorrect'
                                    } else if (isSelected) {
                                        className += ' selected'
                                    }

                                    return (
                                        <motion.button
                                            key={i}
                                            className={className}
                                            onClick={() => !showResult && checkAnswer(i)}
                                            whileHover={{ scale: showResult ? 1 : 1.02 }}
                                            whileTap={{ scale: showResult ? 1 : 0.98 }}
                                        >
                                            {option}
                                        </motion.button>
                                    )
                                })}
                            </div>
                        </motion.div>
                    ) : (
                        <motion.div
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            style={{
                                textAlign: 'center',
                                display: 'flex',
                                flexDirection: 'column',
                                alignItems: 'center',
                                gap: 20
                            }}
                        >
                            <motion.div
                                animate={{ scale: [1, 1.1, 1] }}
                                transition={{ duration: 1.5, repeat: Infinity }}
                                style={{
                                    width: 100,
                                    height: 100,
                                    borderRadius: '50%',
                                    backgroundColor: colorValues[questionColor],
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    marginBottom: 20
                                }}
                            >
                                <svg width="50" height="50" viewBox="0 0 24 24" fill="white">
                                    <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41L9 16.17z" />
                                </svg>
                            </motion.div>
                            <h2 style={{ fontSize: 48, color: colorValues[questionColor] }}>Quiz Complete!</h2>
                            <p style={{ fontSize: 32 }}>
                                Your Score: <strong style={{ color: colorValues[questionColor] }}>{score}</strong> / {shuffledQuestions.length}
                            </p>
                            <p style={{ fontSize: 24, opacity: 0.8 }}>
                                {score === shuffledQuestions.length ? 'Perfect!' :
                                    score >= shuffledQuestions.length * 0.8 ? 'Excellent work!' :
                                        score >= shuffledQuestions.length * 0.6 ? 'Good job! Keep practicing!' :
                                            'Keep studying and try again!'}
                            </p>
                            <motion.button
                                className={`btn btn-${questionColor}`}
                                onClick={restartQuiz}
                                style={{ fontSize: 24, padding: '15px 50px' }}
                                whileHover={{ scale: 1.05 }}
                            >
                                Try Again
                            </motion.button>
                        </motion.div>
                    )}
                </AnimatePresence>

                {/* Navigation buttons */}
                {!isComplete && (
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
                            disabled={currentIndex === shuffledQuestions.length - 1 || !showResult}
                            style={{ opacity: (currentIndex === shuffledQuestions.length - 1 || !showResult) ? 0.4 : 1 }}
                        >
                            Next →
                        </button>
                    </div>
                )}
            </div>
        </motion.div>
    )
}

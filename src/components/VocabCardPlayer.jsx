import { useState, useEffect, useCallback, useRef, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { colorValues, textColors, lightTints, getRandomAccentExcluding, accentColorSchemes } from '../engine/serotoninEngine'

// ============================================================
// TYPEWRITER HOOK - For example text animation
// ============================================================
function useTypewriter(text, speed = 35, enabled = true, delay = 200) {
    const [displayedText, setDisplayedText] = useState('')
    const [isComplete, setIsComplete] = useState(false)

    useEffect(() => {
        if (!enabled || !text) {
            setDisplayedText('')
            setIsComplete(false)
            return
        }

        if (localStorage.getItem('app_structured_mode') === 'true') {
            setDisplayedText(text)
            setIsComplete(true)
            return
        }

        const timeout = setTimeout(() => {
            let currentIndex = 0
            const interval = setInterval(() => {
                if (currentIndex <= text.length) {
                    setDisplayedText(text.slice(0, currentIndex))
                    currentIndex++
                } else {
                    setIsComplete(true)
                    clearInterval(interval)
                }
            }, speed)

            return () => clearInterval(interval)
        }, delay)

        return () => clearTimeout(timeout)
    }, [text, speed, enabled, delay])

    return { displayedText, isComplete }
}

// ============================================================
// HELPER UTILITIES  (shared with Grammar)
// ============================================================
function hexToRgba(hex, alpha = 0.15) {
    if (!hex || typeof hex !== 'string' || hex[0] !== '#') return hex
    const r = parseInt(hex.slice(1, 3), 16)
    const g = parseInt(hex.slice(3, 5), 16)
    const b = parseInt(hex.slice(5, 7), 16)
    return `rgba(${r}, ${g}, ${b}, ${alpha})`
}

// ============================================================
// SEGMENT RENDERER
// Renders text with colorize / highlight / badge
// Same logic as GrammarCardPlayer's ContentSegment
// ============================================================
const getSegmentStyle = (segment, scheme) => {
    let style = {
        fontFamily: 'var(--font-display)',
        whiteSpace: 'pre-wrap',
    }

    // --- Colorize ---
    if (segment.colorize || segment.colorize2 || segment.colorize3) {
        const c = segment.colorize3 ? scheme.colorize3
            : (segment.colorize2 ? scheme.colorize2 : scheme.colorize1)
        style = { ...style, color: c, fontWeight: 700 }
    }

    // --- Highlight ---
    if (segment.highlight || segment.highlight2 || segment.highlight3) {
        const h = segment.highlight3 ? scheme.highlight3
            : (segment.highlight2 ? scheme.highlight2 : scheme.highlight1)
        style = {
            ...style,
            background: hexToRgba(h, 0.15),
            color: h,
            fontWeight: 800,
            padding: '2px 10px',
            borderRadius: '10px',
            display: 'inline-block',
            margin: '0 2px',
        }
    }

    // --- Badge ---
    if (segment.badge || segment.badge2 || segment.badge3) {
        const b = segment.badge3 ? scheme.badge3
            : (segment.badge2 ? scheme.badge2 : scheme.badge1)
        style = {
            ...style,
            background: b,
            color: '#ffffff',
            fontWeight: 700,
            padding: '1px 8px',
            borderRadius: '12px',
            display: 'inline-block',
            margin: '0 2px',
            fontSize: '0.95em',
            boxShadow: `0 2px 4px ${b}40`,
        }
    }
    return style
}

function ExampleSegment({ segment, accentColor, animatedText = null }) {
    const scheme = accentColorSchemes[accentColor] || accentColorSchemes.cyan
    const style = getSegmentStyle(segment, scheme)
    const displayText = animatedText !== null ? animatedText : segment.text
    return <span style={style}>{displayText}</span>
}

function TypewriterContent({ segments, displayedText, isComplete, accentColor }) {
    let remainingChars = displayedText.length
    const colorValue = colorValues[accentColor]

    return (
        <>
            {segments.map((segment, idx) => {
                const segmentText = segment.text || ''
                const segmentLength = segmentText.length

                if (remainingChars <= 0) {
                    return null
                }

                const charsToShow = Math.min(remainingChars, segmentLength)
                remainingChars -= charsToShow

                return (
                    <ExampleSegment
                        key={idx}
                        segment={segment}
                        accentColor={accentColor}
                        animatedText={segmentText.slice(0, charsToShow)}
                    />
                )
            })}
            {!isComplete && (
                <motion.span
                    initial={{ opacity: 0 }}
                    animate={{ opacity: [1, 0, 1] }}
                    transition={{ duration: 0.8, repeat: Infinity }}
                    style={{
                        display: 'inline-block',
                        width: '2px',
                        height: '1.2em',
                        backgroundColor: colorValue,
                        marginLeft: '2px',
                        verticalAlign: 'text-bottom'
                    }}
                />
            )}
        </>
    )
}

// Helper component to control the typewriter effect
function ExampleTypewriterControl({ example, accentColor, isFlipped }) {
    const fullText = example.map(s => s.text || '').join('')
    const { displayedText, isComplete } = useTypewriter(fullText, 25, isFlipped, 300)

    return (
        <TypewriterContent
            segments={example}
            displayedText={displayedText}
            isComplete={isComplete}
            accentColor={accentColor}
        />
    )
}

// ============================================================
// WORD SIDEBAR  –  lists every word for quick jump (collapsible)
// ============================================================
function WordSidebar({ words, currentIndex, accentColor, onSelect, isOpen, onToggle }) {
    const colorValue = colorValues[accentColor]
    const textColor = textColors[accentColor]
    const lightTint = lightTints[accentColor]
    const listRef = useRef(null)

    // Auto-scroll active item into view
    useEffect(() => {
        if (!isOpen) return
        const container = listRef.current
        if (!container) return
        const activeItem = container.querySelector('[data-active="true"]')
        if (activeItem) {
            activeItem.scrollIntoView({ behavior: 'smooth', block: 'nearest' })
        }
    }, [currentIndex, isOpen])

    return (
        <>
            {/* Collapsed toggle button (visible when sidebar is closed) */}
            {!isOpen && (
                <motion.button
                    className="vocab-sidebar-toggle-collapsed"
                    onClick={onToggle}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -10 }}
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                    style={{
                        color: textColor,
                        backgroundColor: lightTint,
                        borderColor: colorValue,
                        borderWidth: '3px',
                        borderStyle: 'solid',
                        borderRadius: '16px',
                        width: '52px',
                        height: '52px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        cursor: 'pointer',
                        transition: 'all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1)',
                    }}
                >
                    <span className="material-symbols-rounded" style={{ fontSize: 26 }}>menu</span>
                </motion.button>
            )}

            {/* Sidebar panel */}
            <motion.div
                className="vocab-sidebar"
                initial={false}
                animate={{
                    width: isOpen ? 280 : 0,
                    minWidth: isOpen ? 280 : 0,
                    opacity: isOpen ? 1 : 0,
                }}
                transition={{ type: 'spring', stiffness: 350, damping: 32 }}
                style={{ overflow: 'hidden' }}
            >
                <div className="vocab-sidebar-header" style={{ color: colorValue }}>
                    <span className="material-symbols-rounded" style={{ fontSize: 20 }}>list</span>
                    <span>Words</span>
                    <span className="vocab-sidebar-count">{words.length}</span>
                    <motion.button
                        className="vocab-sidebar-collapse-btn"
                        onClick={onToggle}
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.9 }}
                        style={{
                            color: textColor,
                            backgroundColor: lightTint,
                            borderColor: colorValue,
                            borderWidth: '3px',
                            borderStyle: 'solid',
                            borderRadius: '14px',
                            width: '44px',
                            height: '44px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            cursor: 'pointer',
                            transition: 'all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1)',
                        }}
                    >
                        <span className="material-symbols-rounded" style={{ fontSize: 20 }}>chevron_left</span>
                    </motion.button>
                </div>
                <div className="vocab-sidebar-list" ref={listRef}>
                    {words.map((w, i) => {
                        const isActive = i === currentIndex
                        return (
                            <motion.button
                                key={i}
                                className="vocab-sidebar-item"
                                data-active={isActive ? 'true' : 'false'}
                                onClick={() => onSelect(i)}
                                animate={{
                                    backgroundColor: isActive ? hexToRgba(colorValue, 0.12) : 'transparent',
                                    color: isActive ? colorValue : '#64748b',
                                }}
                                whileHover={{ backgroundColor: hexToRgba(colorValue, 0.08) }}
                                transition={{ duration: 0.2 }}
                                style={{
                                    borderLeft: isActive ? `3px solid ${colorValue}` : '3px solid transparent',
                                }}
                            >
                                <span className="vocab-sidebar-number">{i + 1}</span>
                                <span className="vocab-sidebar-word">{w.word}</span>
                            </motion.button>
                        )
                    })}
                </div>
            </motion.div>
        </>
    )
}

// ============================================================
// CARD FRONT  –  large word + pronunciation + word type
// ============================================================
function CardFront({ word, accentColor, sidebarOpen }) {
    const colorValue = colorValues[accentColor]
    const rawWord = (word?.word ?? '').trim()

    // Split by spaces to find the longest uninterrupted word (determines effective width)
    const wordsParts = rawWord.split(/\s+/)
    const longestWordLength = Math.max(...wordsParts.map(w => w.length))
    const totalLength = rawWord.length

    let scale = 1.0

    // visual adjustment: shorter text = bigger font
    // 1. If we have a single massive word (e.g. "Organizational"), we shrink it aggressively to fit width.
    if (longestWordLength > 11) {
        const extra = longestWordLength - 11
        // Make the shrinking more aggressive when the word is longer to avoid overflow
        // E.g., for "Unemployment" (12 chars): extra = 1, scale = 1 - 0.15 = 0.85
        // E.g., for "Organizational" (14 chars): extra = 3, scale = 1 - 0.45 = 0.55
        scale = Math.max(0.35, 1 - (extra * 0.15))
    }
    // 2. If it's a phrase (e.g. "work ethic"), we let it be big unless it's REALLY long overall
    else if (totalLength > 20) {
        // Long phrase, likely to wrap 2-3 lines, so shrink a bit
        scale = 0.75
    }

    // Apply scale to base values (MATCHING ORIGINAL "LARGE" SIZES)
    // Sidebar Open: Base ~7rem (112px)
    // Sidebar Closed: Base ~16rem (260px) - huge!

    const wordFontSize = sidebarOpen
        ? `clamp(${3.5 * scale}rem, ${8 * scale}vw, ${7 * scale}rem)`
        : `clamp(${5.25 * scale}rem, ${12 * scale}vw, ${16 * scale}rem)`

    return (
        <div className="vocab-card-face vocab-card-front">
            <div className="vocab-front-content">


                {/* The big word */}
                <motion.div
                    className="vocab-word-big"
                    initial={{ opacity: 0, scale: 0.92, fontSize: wordFontSize }}
                    animate={{
                        opacity: 1,
                        scale: 1,
                        fontSize: wordFontSize,
                        textShadow: [
                            `0 0 15px ${colorValue}10`,
                            `0 0 50px ${colorValue}80`,
                            `0 0 15px ${colorValue}10`,
                        ],
                    }}
                    transition={{
                        default: { type: 'spring', stiffness: 240, damping: 18 },
                        textShadow: { duration: 3, repeat: Infinity, ease: 'easeInOut' },
                    }}
                    style={{ color: colorValue }}
                >
                    {word.word}
                </motion.div>

                {/* Tap hint */}
                <motion.div
                    className="vocab-flip-hint"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 0.4 }}
                    transition={{ delay: 0.6, duration: 0.5 }}
                    style={{ color: colorValue }}
                >
                    <span className="material-symbols-rounded" style={{ fontSize: 18 }}>swipe</span>
                    <span>tap to reveal</span>
                </motion.div>
            </div>
        </div>
    )
}

// ============================================================
// HIDDEN CONTENT WRAPPER
// ============================================================
function HiddenContent({ children, isRevealed, onReveal, accentColor }) {
    const colorValue = colorValues[accentColor]

    if (isRevealed) {
        return <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>{children}</motion.div>
    }

    return (
        <div style={{
            background: hexToRgba(colorValue, 0.08),
            borderRadius: '16px',
            padding: '24px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            border: `2px dashed ${hexToRgba(colorValue, 0.3)}`,
            minHeight: '80px'
        }}>
            <motion.button
                onClick={(e) => {
                    e.stopPropagation()
                    onReveal()
                }}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                style={{
                    background: colorValue,
                    color: 'white',
                    border: 'none',
                    padding: '8px 20px',
                    borderRadius: '12px',
                    fontFamily: 'var(--font-display)',
                    fontWeight: 700,
                    fontSize: '14px',
                    cursor: 'pointer',
                    boxShadow: `0 4px 12px ${colorValue}40`,
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px'
                }}
            >
                <span className="material-symbols-rounded" style={{ fontSize: 18 }}>visibility</span>
                Reveal
            </motion.button>
        </div>
    )
}

// ============================================================
// CARD BACK  –  arabic, definition, example, synonyms, tips
// ============================================================
function CardBack({ word, accentColor, isFlipped, sidebarOpen }) {
    const colorValue = colorValues[accentColor]
    const scheme = accentColorSchemes[accentColor] || accentColorSchemes.cyan

    // Determine if definition is an array of segments or a plain string
    const definitionIsSegments = Array.isArray(word.definition)
    const rawWord = (word?.word ?? '').trim()
    const isSingleWord = rawWord !== '' && !/\s/.test(rawWord)
    const letterCount = isSingleWord ? ((rawWord.match(/[A-Za-z]/g) || []).length) : 0
    const isLongSingleWord = isSingleWord && letterCount >= 12

    // Dynamic text size based on sidebar state
    const textSize = sidebarOpen ? 20 : 24

    // --- Reveal State ---
    const [revealDef, setRevealDef] = useState(true)
    const [revealEx, setRevealEx] = useState(true)
    const [revealTip, setRevealTip] = useState(false)

    useEffect(() => {
        // Reset reveal state when word changes, based on settings
        // Default: Def=ON, Ex=ON, Tip=OFF (if not set in storage)
        const defSetting = localStorage.getItem('vocab_allow_definition')
        const exSetting = localStorage.getItem('vocab_allow_example')
        const tipSetting = localStorage.getItem('vocab_allow_tip')

        setRevealDef(defSetting !== null ? defSetting === 'true' : true)
        setRevealEx(exSetting !== null ? exSetting === 'true' : true)
        setRevealTip(tipSetting !== null ? tipSetting === 'true' : false)
    }, [word])

    return (
        <div className="vocab-card-face vocab-card-back">
            <div className="vocab-back-content">
                {/* Arabic meaning – first thing on back */}
                {word.arabicMeaning && (
                    <div className="vocab-back-arabic" style={{
                        color: colorValue,
                        borderColor: hexToRgba(colorValue, 0.2),
                        backgroundColor: hexToRgba(colorValue, 0.06),
                    }}>
                        {word.arabicMeaning}
                    </div>
                )}

                {/* Word header (smaller, colored) */}
                <div className="vocab-back-word" style={{ color: colorValue, fontSize: isLongSingleWord ? 24 : undefined }}>
                    {word.word}
                    {word.wordType && (
                        <span className="vocab-back-wordtype" style={{
                            color: hexToRgba(colorValue, 0.6),
                        }}>
                            {word.wordType}
                        </span>
                    )}
                </div>

                {/* Definition (segments or plain text) */}
                <div className="vocab-back-section">
                    <HiddenContent isRevealed={revealDef} onReveal={() => setRevealDef(true)} accentColor={accentColor}>
                        <div className="vocab-back-text" style={{ fontSize: textSize }}>
                            {definitionIsSegments
                                ? word.definition.map((seg, idx) => (
                                    <ExampleSegment
                                        key={idx}
                                        segment={seg}
                                        accentColor={accentColor}
                                    />
                                ))
                                : word.definition
                            }
                        </div>
                    </HiddenContent>
                </div>

                {/* Example with typewriter */}
                {word.example && (
                    <div className="vocab-back-section">
                        <HiddenContent isRevealed={revealEx} onReveal={() => setRevealEx(true)} accentColor={accentColor}>
                            <div className="vocab-back-example" style={{ borderLeftColor: hexToRgba(colorValue, 0.4), fontSize: textSize }}>
                                <ExampleTypewriterControl
                                    example={word.example}
                                    accentColor={accentColor}
                                    isFlipped={isFlipped && revealEx} // Only type when revealed
                                />
                            </div>
                        </HiddenContent>
                    </div>
                )}

                {/* Synonyms */}
                {word.synonyms && word.synonyms.length > 0 && (
                    <div className="vocab-back-section">
                        <div className="vocab-back-label" style={{ color: colorValue }}>
                            <span className="material-symbols-rounded" style={{ fontSize: 18 }}>swap_horiz</span>
                            Synonyms
                        </div>
                        <div className="vocab-back-synonyms">
                            {word.synonyms.map((syn, idx) => (
                                <span
                                    key={idx}
                                    className="vocab-synonym-chip"
                                    style={{
                                        backgroundColor: hexToRgba(colorValue, 0.1),
                                        color: colorValue,
                                        borderColor: hexToRgba(colorValue, 0.2),
                                        padding: '6px 14px',
                                        fontSize: '1.3rem',
                                        lineHeight: '1.4',
                                        borderRadius: '14px',
                                        display: 'inline-block',
                                    }}
                                >
                                    {syn.charAt(0).toUpperCase() + syn.slice(1)}
                                </span>
                            ))}
                        </div>
                    </div>
                )}

                {/* Tips */}
                {word.tips && (
                    <div className="vocab-back-section">
                        <div className="vocab-back-label" style={{ color: colorValue }}>
                            <span className="material-symbols-rounded" style={{ fontSize: 18 }}>lightbulb</span>
                            Tip
                        </div>
                        <HiddenContent isRevealed={revealTip} onReveal={() => setRevealTip(true)} accentColor={accentColor}>
                            <div className="vocab-back-tip" style={{
                                backgroundColor: hexToRgba(colorValue, 0.06),
                                borderColor: hexToRgba(colorValue, 0.15),
                                fontSize: 17,
                            }}>
                                {word.tips}
                            </div>
                        </HiddenContent>
                    </div>
                )}
            </div>
        </div>
    )
}

// ============================================================
// MAIN VOCAB CARD PLAYER
// ============================================================
export function VocabCardPlayer({
    vocabData,
    accentColor = 'cyan',
    onComplete,
    onBack,
}) {
    const words = vocabData?.words || []
    const [currentIndex, setCurrentIndex] = useState(0)
    const [isFlipped, setIsFlipped] = useState(false)
    const [flipDirection, setFlipDirection] = useState(1) // 1 = next, -1 = prev
    const [sidebarOpen, setSidebarOpen] = useState(true)
    const hasNavigatedRef = useRef(false)
    const [currentAccentColor, setCurrentAccentColor] = useState(accentColor)

    const currentWord = words[currentIndex]
    const totalWords = words.length

    // Change color on card navigation
    useEffect(() => {
        if (!hasNavigatedRef.current) {
            hasNavigatedRef.current = true
            return
        }
        const isStructured = localStorage.getItem('app_structured_mode') === 'true'
        if (!isStructured) {
            setCurrentAccentColor((prev) => getRandomAccentExcluding(prev))
        }
    }, [currentIndex])

    const goToCard = useCallback((index) => {
        if (index < 0 || index >= totalWords) return
        setFlipDirection(index > currentIndex ? 1 : -1)
        setIsFlipped(false)
        setCurrentIndex(index)
    }, [totalWords, currentIndex])

    const handleNext = useCallback(() => {
        if (currentIndex < totalWords - 1) {
            setFlipDirection(1)
            setIsFlipped(false)
            setCurrentIndex(prev => prev + 1)
        } else {
            onComplete?.()
        }
    }, [currentIndex, totalWords, onComplete])

    const handlePrevious = useCallback(() => {
        if (currentIndex > 0) {
            setFlipDirection(-1)
            setIsFlipped(false)
            setCurrentIndex(prev => prev - 1)
        }
    }, [currentIndex])

    const handleFlip = useCallback(() => {
        const selection = window.getSelection()
        if (selection && selection.toString().trim().length > 0) {
            return
        }
        setIsFlipped(prev => !prev)
    }, [])

    // Keyboard navigation
    useEffect(() => {
        const handleKeyDown = (e) => {
            if (e.key === 'ArrowRight' || e.key === ' ') {
                e.preventDefault()
                handleNext()
            } else if (e.key === 'ArrowLeft') {
                e.preventDefault()
                handlePrevious()
            } else if (e.key === 'ArrowUp' || e.key === 'ArrowDown' || e.key === 'Enter') {
                e.preventDefault()
                handleFlip()
            } else if (e.key === 'Escape') {
                onBack?.()
            }
        }
        window.addEventListener('keydown', handleKeyDown)
        return () => window.removeEventListener('keydown', handleKeyDown)
    }, [handleNext, handlePrevious, handleFlip, onBack])

    const isPreviousDisabled = currentIndex === 0
    const isLastCard = currentIndex === totalWords - 1
    const colorValue = colorValues[currentAccentColor]
    const textColor = textColors[currentAccentColor]
    const lightTint = lightTints[currentAccentColor]
    const cardMaxWidth = sidebarOpen ? 680 : 920
    const stageMaxWidth = sidebarOpen ? 760 : 1040
    const layoutTransition = useMemo(() => ({ type: 'spring', stiffness: 260, damping: 22 }), [])

    if (!currentWord) return null

    return (
        <motion.div
            className="vocab-player-container"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            style={{
                '--accent': colorValue,
                '--accent-soft': `${colorValue}33`,
                '--accent-softer': `${colorValue}1f`,
                '--accent-grid': `${colorValue}40`,
                // Override scrollbar colors to match current card accent
                '--scrollbar-thumb': `color-mix(in srgb, ${colorValue} 82%, #000 18%)`,
                '--scrollbar-thumb-hover': `color-mix(in srgb, ${colorValue} 78%, #000 22%)`,
                '--scrollbar-thumb-active': `color-mix(in srgb, ${colorValue} 74%, #000 26%)`,
                '--scrollbar-track': `color-mix(in srgb, ${colorValue} 22%, rgba(255, 255, 255, 0.78))`,
                transition: 'all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1)',
            }}
        >
            {/* Notebook Grid Background */}
            <div className="vocab-player-background" />

            {/* Sidebar */}
            <WordSidebar
                words={words}
                currentIndex={currentIndex}
                accentColor={currentAccentColor}
                onSelect={goToCard}
                isOpen={sidebarOpen}
                onToggle={() => setSidebarOpen(prev => !prev)}
            />

            {/* Main Card Area */}
            <div className="vocab-player-main">
                {/* Progress bar at top */}
                <div className="vocab-progress-area">
                    <div className="vocab-progress-bar-container">
                        <motion.div
                            className="vocab-progress-bar-fill"
                            animate={{
                                width: `${((currentIndex + 1) / totalWords) * 100}%`,
                                backgroundColor: colorValue,
                            }}
                            transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                        />
                    </div>
                    <div className="vocab-progress-text" style={{ color: textColor }}>
                        {currentIndex + 1} / {totalWords}
                    </div>
                </div>

                {/* Flip Card */}
                <motion.div className="vocab-flip-stage" style={{ maxWidth: stageMaxWidth }} layout transition={layoutTransition}>
                    <AnimatePresence mode="wait" initial={false}>
                        <motion.div
                            key={currentIndex}
                            className="vocab-flip-card-outer"
                            style={{ maxWidth: cardMaxWidth }}
                            layout

                            initial={{
                                opacity: 0,
                                x: flipDirection * 60,
                                rotateY: flipDirection * 15,
                                scale: 0.92,
                            }}
                            animate={{
                                opacity: 1,
                                x: 0,
                                rotateY: 0,
                                scale: 1,
                            }}
                            exit={{
                                opacity: 0,
                                x: flipDirection * -60,
                                rotateY: flipDirection * -15,
                                scale: 0.92,
                            }}
                            transition={{
                                type: 'spring',
                                stiffness: 280,
                                damping: 26,
                                mass: 0.8,
                            }}
                        >
                            <div
                                className={`vocab-flip-card-inner ${isFlipped ? 'is-flipped' : ''}`}
                                onClick={handleFlip}
                                style={{
                                    boxShadow: `0 20px 60px ${colorValue}20, 0 8px 25px rgba(0,0,0,0.08)`,
                                }}
                            >
                                <CardFront word={currentWord} accentColor={currentAccentColor} sidebarOpen={sidebarOpen} />
                                <CardBack word={currentWord} accentColor={currentAccentColor} isFlipped={isFlipped} sidebarOpen={sidebarOpen} />

                            </div>
                        </motion.div>
                    </AnimatePresence>
                </motion.div>

                {/* Navigation */}
                <motion.div className="vocab-nav-area" style={{ maxWidth: cardMaxWidth }} layout transition={layoutTransition}>
                    <motion.button
                        className="vocab-nav-btn vocab-nav-prev"
                        onClick={handlePrevious}
                        disabled={isPreviousDisabled}
                        style={{
                            borderColor: colorValue,
                            color: isPreviousDisabled ? '#BDBDBD' : textColor,
                            backgroundColor: isPreviousDisabled ? '#F5F5F5' : lightTint,
                            opacity: isPreviousDisabled ? 0.5 : 1,
                        }}
                        whileHover={!isPreviousDisabled ? { scale: 1.03, y: -2 } : {}}
                        whileTap={!isPreviousDisabled ? { scale: 0.97 } : {}}
                    >
                        <span className="material-symbols-rounded">arrow_back</span>
                        <span>Previous</span>
                    </motion.button>

                    <motion.button
                        className="vocab-nav-btn vocab-nav-next"
                        onClick={handleNext}
                        style={{
                            borderColor: colorValue,
                            color: 'white',
                            backgroundColor: isLastCard ? '#BDBDBD' : colorValue,
                        }}
                        whileHover={!isLastCard ? { scale: 1.03, y: -2 } : {}}
                        whileTap={!isLastCard ? { scale: 0.97 } : {}}
                    >
                        <span>{isLastCard ? 'Complete' : 'Next'}</span>
                        <span className="material-symbols-rounded">
                            {isLastCard ? 'check' : 'arrow_forward'}
                        </span>
                    </motion.button>
                </motion.div>
            </div>

            {/* Close Button */}
            <motion.button
                className="vocab-close-btn"
                onClick={onBack}
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                style={{
                    color: textColor,
                    backgroundColor: lightTint,
                    borderColor: colorValue,
                    transition: 'all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1)',
                }}
            >
                <span className="material-symbols-rounded">close</span>
            </motion.button>
        </motion.div>
    )
}

export default VocabCardPlayer

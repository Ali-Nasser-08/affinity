import { useState, useEffect, useCallback, useMemo, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { colorValues, textColors, lightTints, getRandomAccentExcluding, accentColorSchemes, bgTints } from '../engine/serotoninEngine'

// ============================================================
// HELPERS
// ============================================================
function hexToRgba(hex, alpha = 0.15) {
    if (!hex || typeof hex !== 'string' || hex[0] !== '#') return hex
    const r = parseInt(hex.slice(1, 3), 16)
    const g = parseInt(hex.slice(3, 5), 16)
    const b = parseInt(hex.slice(5, 7), 16)
    return `rgba(${r}, ${g}, ${b}, ${alpha})`
}

// ============================================================
// IN-TEXT FORMATTING TAG PARSER
// Parses text like "The /c1brown/c1 fox" into segments
// Supports: c1, c2, c3, h1, h2, h3, b1, b2, b3
// ============================================================
function parseFormattedText(text) {
    if (!text || typeof text !== 'string') return [{ text: text || '', type: 'plain' }]

    const segments = []
    const tagRegex = /\/(c[1-3]|h[1-3]|b[1-3])(.*?)\/\1/g
    let lastIndex = 0

    let match
    while ((match = tagRegex.exec(text)) !== null) {
        if (match.index > lastIndex) {
            segments.push({ text: text.slice(lastIndex, match.index), type: 'plain' })
        }

        const tag = match[1]
        const content = match[2]
        const category = tag[0]
        const level = parseInt(tag[1])

        segments.push({
            text: content,
            type: category === 'c' ? 'colorize' : category === 'h' ? 'highlight' : 'badge',
            level
        })

        lastIndex = tagRegex.lastIndex
    }

    if (lastIndex < text.length) {
        segments.push({ text: text.slice(lastIndex), type: 'plain' })
    }

    return segments.length > 0 ? segments : [{ text, type: 'plain' }]
}

// ============================================================
// QUOTE FORMATTER
// ============================================================
function FormatTextWithQuotes({ text, color }) {
    if (!text || typeof text !== 'string') return <>{text}</>;
    const parts = text.split(/(?<!\w)'(.*?)'(?!\w)/g);
    if (parts.length === 1) return <>{text}</>;

    return (
        <>
            {parts.map((part, i) => {
                if (i % 2 === 1) {
                    return <span key={i} style={{ color: color, fontWeight: 700 }}>{part}</span>;
                }
                return <span key={i}>{part}</span>;
            })}
        </>
    );
}

// ============================================================
// FORMATTED TEXT RENDERER
// ============================================================
function FormattedText({ text, accentColor, style: outerStyle = {}, isArabic = false, mainColor, filledAnswers }) {
    const scheme = accentColorSchemes[accentColor] || accentColorSchemes.cyan
    const segments = useMemo(() => parseFormattedText(text), [text])
    const cVal = mainColor || colorValues[accentColor] || '#0ea5e9';
    let blankIndex = 0;

    const renderTextContent = (textContent, innerColor, styleObj, keyPrefix) => {
        const parts = (textContent || '').split(/(_{2,})/g);
        return (
            <span key={keyPrefix} style={styleObj}>
                {parts.map((part, j) => {
                    if (/^_{2,}$/.test(part)) {
                        if (filledAnswers) {
                            const answerText = filledAnswers[blankIndex] || ''
                            blankIndex++
                            return (
                                <span key={`${keyPrefix}-${j}`} style={{
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
                            <span key={`${keyPrefix}-${j}`} style={{
                                display: 'inline-block',
                                minWidth: '80px',
                                height: '4px',
                                borderRadius: '2px',
                                background: innerColor,
                                opacity: 0.4,
                                verticalAlign: '-4px',
                                margin: '0 8px',
                            }} />
                        )
                    }
                    const quoteColor = styleObj.color === '#ffffff' ? '#ffffff' : innerColor;
                    return <FormatTextWithQuotes key={`${keyPrefix}-${j}`} text={part} color={quoteColor} />
                })}
            </span>
        )
    };

    return (
        <span style={{
            fontFamily: isArabic ? 'var(--font-arabic)' : 'var(--font-display)',
            direction: isArabic ? 'rtl' : 'ltr',
            ...outerStyle
        }}>
            {segments.map((seg, i) => {
                if (seg.type === 'plain') {
                    return renderTextContent(seg.text, cVal, {}, i);
                }

                if (seg.type === 'colorize') {
                    const color = seg.level === 3 ? scheme.colorize3
                        : seg.level === 2 ? scheme.colorize2 : scheme.colorize1
                    return renderTextContent(seg.text, color, { color, fontWeight: 700 }, i);
                }

                if (seg.type === 'highlight') {
                    const color = seg.level === 3 ? scheme.highlight3
                        : seg.level === 2 ? scheme.highlight2 : scheme.highlight1
                    return renderTextContent(seg.text, color, {
                        background: hexToRgba(color, 0.15),
                        color, fontWeight: 800,
                        padding: '2px 10px', borderRadius: '10px',
                        display: 'inline-block', margin: '0 2px'
                    }, i);
                }

                if (seg.type === 'badge') {
                    const color = seg.level === 3 ? scheme.badge3
                        : seg.level === 2 ? scheme.badge2 : scheme.badge1
                    return renderTextContent(seg.text, color, {
                        background: color, color: '#ffffff',
                        fontWeight: 700, padding: '1px 8px',
                        borderRadius: '12px', display: 'inline-block',
                        margin: '0 2px', fontSize: '0.95em',
                        boxShadow: `0 2px 4px ${color}40`
                    }, i);
                }

                return <span key={i}>{seg.text}</span>
            })}
        </span>
    )
}

// ============================================================
// TYPEWRITER HOOK & COMPONENT
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

function TypewriterFormattedText({ text, accentColor, isFlipped, style: outerStyle = {}, mainColor }) {
    const scheme = accentColorSchemes[accentColor] || accentColorSchemes.cyan
    const segments = useMemo(() => parseFormattedText(text), [text])
    const visibleText = useMemo(() => segments.map(s => s.text).join(''), [segments])
    const cVal = mainColor || colorValues[accentColor] || '#0ea5e9'

    // Typewriter effect triggers when enabled (isFlipped)
    const { displayedText, isComplete } = useTypewriter(visibleText, 25, isFlipped, 300)

    let remainingChars = displayedText.length

    const renderTextContent = (textContent, innerColor, styleObj, keyPrefix) => {
        const parts = (textContent || '').split(/(_{2,})/g)
        return (
            <span key={keyPrefix} style={styleObj}>
                {parts.map((part, j) => {
                    if (/^_{2,}$/.test(part)) {
                        return (
                            <span key={`${keyPrefix}-${j}`} style={{
                                display: 'inline-block',
                                minWidth: '80px',
                                height: '4px',
                                borderRadius: '2px',
                                background: innerColor,
                                opacity: 0.4,
                                verticalAlign: '-4px',
                                margin: '0 8px',
                            }} />
                        )
                    }
                    const quoteColor = styleObj.color === '#ffffff' ? '#ffffff' : innerColor
                    return <FormatTextWithQuotes key={`${keyPrefix}-${j}`} text={part} color={quoteColor} />
                })}
            </span>
        )
    }

    return (
        <span style={{
            fontFamily: 'var(--font-display)',
            direction: 'ltr',
            ...outerStyle
        }}>
            {segments.map((seg, i) => {
                if (remainingChars <= 0) return null

                const segmentText = seg.text || ''
                const segmentLength = segmentText.length
                const charsToShow = Math.min(remainingChars, segmentLength)
                remainingChars -= charsToShow

                // Cut the text up to what's currently revealed
                const slicedText = segmentText.slice(0, charsToShow)

                if (seg.type === 'plain') {
                    return renderTextContent(slicedText, cVal, {}, i)
                }

                if (seg.type === 'colorize') {
                    const color = seg.level === 3 ? scheme.colorize3
                        : seg.level === 2 ? scheme.colorize2 : scheme.colorize1
                    return renderTextContent(slicedText, color, { color, fontWeight: 700 }, i)
                }

                if (seg.type === 'highlight') {
                    const color = seg.level === 3 ? scheme.highlight3
                        : seg.level === 2 ? scheme.highlight2 : scheme.highlight1
                    return renderTextContent(slicedText, color, {
                        background: hexToRgba(color, 0.15),
                        color, fontWeight: 800,
                        padding: '2px 10px', borderRadius: '10px',
                        display: 'inline-block', margin: '0 2px'
                    }, i)
                }

                if (seg.type === 'badge') {
                    const color = seg.level === 3 ? scheme.badge3
                        : seg.level === 2 ? scheme.badge2 : scheme.badge1
                    return renderTextContent(slicedText, color, {
                        background: color, color: '#ffffff',
                        fontWeight: 700, padding: '1px 8px',
                        borderRadius: '12px', display: 'inline-block',
                        margin: '0 2px', fontSize: '0.95em',
                        boxShadow: `0 2px 4px ${color}40`
                    }, i)
                }

                return <span key={i}>{slicedText}</span>
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
                        backgroundColor: colorValues[accentColor],
                        marginLeft: '2px',
                        verticalAlign: 'text-bottom'
                    }}
                />
            )}
        </span>
    )
}

// ============================================================
// HIDDEN CONTENT WRAPPER
// ============================================================
function HiddenContent({ children, isRevealed, onReveal, accentColor }) {
    const colorValue = colorValues[accentColor] || colorValues['cyan']

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
// GENERAL ITEM CARD
// ============================================================
function GeneralItemCard({ item, accentColor }) {
    const colorValue = colorValues[accentColor]
    const lightTint = lightTints[accentColor]

    const [revealTranslation, setRevealTranslation] = useState(true)

    useEffect(() => {
        const setting = localStorage.getItem('ll_auto_reveal_translation')
        setRevealTranslation(setting !== null ? setting === 'true' : true)
    }, [item])

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.4 }}
            style={{
                width: '100%', maxWidth: '900px', margin: '0 auto',
                display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '16px',
            }}
        >
            <motion.div style={{
                width: '100%', background: 'white',
                borderRadius: '28px', padding: '36px 40px',
                boxShadow: `0 20px 60px ${colorValue}20, 0 8px 25px rgba(0,0,0,0.08)`,
                position: 'relative', overflow: 'hidden'
            }}>
                {/* Badges */}
                {item.title_badges && item.title_badges.length > 0 && (
                    <div style={{ display: 'flex', gap: '8px', marginBottom: '20px', flexWrap: 'wrap' }}>
                        {item.title_badges.map((badge, i) => (
                            <motion.div
                                key={i}
                                initial={{ scale: 0.9, opacity: 0 }}
                                animate={{ scale: 1, opacity: 1 }}
                                transition={{ delay: i * 0.1 }}
                                style={{
                                    border: `2px solid ${colorValue}`,
                                    backgroundColor: lightTint,
                                    color: colorValue,
                                    padding: '4px 14px', borderRadius: '12px',
                                    fontWeight: 700, fontSize: '0.9em',
                                    fontFamily: 'var(--font-display)',
                                }}
                            >
                                {badge}
                            </motion.div>
                        ))}
                    </div>
                )}

                {/* English Content */}
                <div style={{
                    fontSize: '26px', fontWeight: 600, lineHeight: 1.7,
                    color: '#1e293b', marginBottom: item.arabic ? '24px' : 0,
                    fontFamily: 'var(--font-display)'
                }}>
                    <FormattedText text={item.english} accentColor={accentColor} />
                </div>

                {/* Arabic Content */}
                {item.arabic && (
                    <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.3 }}
                        style={{
                            fontSize: '24px', fontWeight: 600, lineHeight: 1.8,
                            color: '#64748b', direction: 'rtl', textAlign: 'right',
                            borderTop: `2px solid ${hexToRgba(colorValue, 0.15)}`,
                            paddingTop: '20px', fontFamily: 'var(--font-arabic)'
                        }}
                    >
                        <HiddenContent isRevealed={revealTranslation} onReveal={() => setRevealTranslation(true)} accentColor={accentColor}>
                            <FormattedText text={item.arabic} accentColor={accentColor} isArabic={true} />
                        </HiddenContent>
                    </motion.div>
                )}
            </motion.div>
        </motion.div>
    )
}

// ============================================================
// VOCAB ITEM CARD (flip card)
// ============================================================
function VocabItemCard({ item, accentColor }) {
    const [isFlipped, setIsFlipped] = useState(false)
    const colorValue = colorValues[accentColor]

    const [revealDef, setRevealDef] = useState(true)
    const [revealEx, setRevealEx] = useState(true)

    useEffect(() => {
        setIsFlipped(false)
        const defSetting = localStorage.getItem('ll_auto_reveal_definition')
        const exSetting = localStorage.getItem('ll_auto_reveal_example')
        setRevealDef(defSetting !== null ? defSetting === 'true' : true)
        setRevealEx(exSetting !== null ? exSetting === 'true' : true)
    }, [item])

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.4 }}
            style={{ width: '100%', maxWidth: '800px', margin: '0 auto', perspective: '1200px' }}
        >
            <div
                onClick={() => {
                    const selection = window.getSelection()
                    if (selection && selection.toString().trim().length > 0) {
                        return
                    }
                    setIsFlipped(prev => !prev)
                }}
                style={{
                    width: '100%', minHeight: '400px', position: 'relative',
                    transformStyle: 'preserve-3d',
                    transition: 'transform 0.6s cubic-bezier(0.34, 1.56, 0.64, 1)',
                    transform: isFlipped ? 'rotateY(180deg)' : 'rotateY(0deg)',
                    cursor: 'pointer',
                }}
            >
                {/* FRONT */}
                <div style={{
                    position: 'absolute', width: '100%', minHeight: '400px',
                    backfaceVisibility: 'hidden',
                    background: 'white', borderRadius: '28px',
                    boxShadow: `0 20px 60px ${colorValue}20, 0 8px 25px rgba(0,0,0,0.08)`,
                    display: 'flex', flexDirection: 'column',
                    alignItems: 'center', justifyContent: 'center', padding: '40px',
                }}>
                    {item.word_type && (
                        <div style={{
                            background: hexToRgba(colorValue, 0.1), color: colorValue,
                            padding: '4px 14px', borderRadius: '20px', fontSize: '14px',
                            fontWeight: 700, fontFamily: 'var(--font-display)',
                            marginBottom: '16px', textTransform: 'uppercase', letterSpacing: '1px'
                        }}>
                            {item.word_type}
                        </div>
                    )}

                    <motion.div
                        animate={{
                            textShadow: [
                                `0 0 15px ${colorValue}10`,
                                `0 0 50px ${colorValue}80`,
                                `0 0 15px ${colorValue}10`,
                            ],
                        }}
                        transition={{ textShadow: { duration: 3, repeat: Infinity, ease: 'easeInOut' } }}
                        style={{
                            fontSize: 'clamp(3rem, 10vw, 7rem)',
                            fontWeight: 800, color: colorValue,
                            fontFamily: 'var(--font-display)',
                            textAlign: 'center', lineHeight: 1.1,
                        }}
                    >
                        {item.word}
                    </motion.div>

                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 0.4 }}
                        transition={{ delay: 0.6 }}
                        style={{
                            display: 'flex', alignItems: 'center', gap: '6px',
                            marginTop: '24px', color: colorValue,
                            fontSize: '14px', fontFamily: 'var(--font-display)',
                        }}
                    >
                        <span className="material-symbols-rounded" style={{ fontSize: 18 }}>swipe</span>
                        <span>tap to reveal</span>
                    </motion.div>
                </div>

                {/* BACK */}
                <div style={{
                    position: 'absolute', width: '100%', minHeight: '400px',
                    backfaceVisibility: 'hidden', transform: 'rotateY(180deg)',
                    background: 'white', borderRadius: '28px',
                    boxShadow: `0 20px 60px ${colorValue}20, 0 8px 25px rgba(0,0,0,0.08)`,
                    padding: '36px 40px', overflow: 'auto',
                }}>
                    {item.arabic && (
                        <div style={{
                            color: colorValue, backgroundColor: hexToRgba(colorValue, 0.06),
                            padding: '12px 20px', borderRadius: '16px', fontSize: '22px',
                            fontWeight: 700, fontFamily: 'var(--font-arabic)',
                            direction: 'rtl', textAlign: 'center', marginBottom: '16px',
                        }}>
                            {item.arabic}
                        </div>
                    )}

                    <div style={{
                        display: 'flex', alignItems: 'baseline', gap: '10px', marginBottom: '16px',
                    }}>
                        <span style={{
                            fontSize: '28px', fontWeight: 800, color: colorValue,
                            fontFamily: 'var(--font-display)',
                        }}>{item.word}</span>
                        {item.word_type && (
                            <span style={{
                                fontSize: '15px', color: hexToRgba(colorValue, 0.6),
                                fontFamily: 'var(--font-display)', fontWeight: 600, fontStyle: 'italic',
                            }}>{item.word_type}</span>
                        )}
                    </div>

                    {item.definition && (
                        <div style={{
                            fontSize: '20px', lineHeight: 1.6, color: '#334155',
                            marginBottom: '16px', fontFamily: 'var(--font-display)',
                        }}>
                            <HiddenContent isRevealed={revealDef} onReveal={() => setRevealDef(true)} accentColor={accentColor}>
                                <FormattedText text={item.definition} accentColor={accentColor} />
                            </HiddenContent>
                        </div>
                    )}

                    {item.example && (
                        <div style={{
                            fontSize: '18px', lineHeight: 1.6, color: '#475569',
                            borderLeft: `3px solid ${hexToRgba(colorValue, 0.4)}`,
                            paddingLeft: '16px', marginBottom: '16px',
                            fontFamily: 'var(--font-display)', fontStyle: 'italic',
                        }}>
                            <HiddenContent isRevealed={revealEx} onReveal={() => setRevealEx(true)} accentColor={accentColor}>
                                <TypewriterFormattedText
                                    text={item.example}
                                    accentColor={accentColor}
                                    isFlipped={isFlipped && revealEx}
                                />
                            </HiddenContent>
                        </div>
                    )}

                    {item.synonyms && item.synonyms.length > 0 && (
                        <div>
                            <div style={{
                                display: 'flex', alignItems: 'center', gap: '6px',
                                color: colorValue, fontSize: '14px', fontWeight: 700,
                                fontFamily: 'var(--font-display)', marginBottom: '8px',
                            }}>
                                <span className="material-symbols-rounded" style={{ fontSize: 18 }}>swap_horiz</span>
                                Synonyms
                            </div>
                            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                                {item.synonyms.map((syn, i) => (
                                    <span key={i} style={{
                                        backgroundColor: hexToRgba(colorValue, 0.1),
                                        color: colorValue, padding: '6px 14px',
                                        fontSize: '15px', borderRadius: '14px',
                                        fontFamily: 'var(--font-display)', fontWeight: 600,
                                        border: `1px solid ${hexToRgba(colorValue, 0.2)}`,
                                    }}>
                                        {syn.charAt(0).toUpperCase() + syn.slice(1)}
                                    </span>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </motion.div>
    )
}

// ============================================================
// QUESTION ITEM CARD
// ============================================================
function QuestionItemCard({ item, accentColor, onAnswer, onOverlayChange }) {
    const [selectedAnswer, setSelectedAnswer] = useState(null)
    const [showResult, setShowResult] = useState(false)
    const [showExplanationOverlay, setShowExplanationOverlay] = useState(false)
    const colorValue = colorValues[accentColor]
    const ANSWER_LABELS = ['A', 'B', 'C', 'D']

    useEffect(() => {
        if (onOverlayChange) onOverlayChange(showExplanationOverlay)
    }, [showExplanationOverlay, onOverlayChange])

    useEffect(() => {
        setSelectedAnswer(null)
        setShowResult(false)
        setShowExplanationOverlay(false)
    }, [item])

    const handleAnswer = (option) => {
        if (showResult) return
        setSelectedAnswer(option)
        setShowResult(true)
        onAnswer?.(option === item.answer)
    }

    const isCorrect = showResult && selectedAnswer === item.answer

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.4 }}
            style={{
                width: '100%', maxWidth: '900px', margin: '0 auto',
                display: 'flex', flexDirection: 'column', gap: '16px',
            }}
        >
            {/* Question */}
            <div style={{
                background: 'rgba(255,255,255,0.95)',
                borderRadius: '24px', padding: '32px 36px',
                color: '#1e293b', position: 'relative',
                boxShadow: '0 12px 40px rgba(0,0,0,0.1)',
                transition: 'all 0.5s ease',
            }}>
                {showResult && (item.explanation || item.arabic_hint) && (
                    <motion.button
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={{ opacity: 1, scale: 1 }}
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.9 }}
                        onClick={() => setShowExplanationOverlay(true)}
                        style={{
                            position: 'absolute', top: '16px', right: '16px',
                            width: '36px', height: '36px', borderRadius: '50%',
                            background: isCorrect ? '#22c55e20' : '#ef444420',
                            color: isCorrect ? '#166534' : '#991b1b',
                            border: 'none', cursor: 'pointer',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: '18px',
                            zIndex: 10
                        }}
                    >
                        ?
                    </motion.button>
                )}
                <div style={{
                    fontSize: '28px', fontWeight: 700, lineHeight: 1.5,
                    fontFamily: 'var(--font-display)', textAlign: 'center',
                }}>
                    <FormattedText
                        text={item.question}
                        accentColor={accentColor}
                        mainColor={showResult ? (isCorrect ? '#22c55e' : '#ef4444') : colorValue}
                    />
                </div>
            </div>

            {/* Options */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                {(item.options || []).map((option, i) => {
                    const isSelected = selectedAnswer === option
                    const isCorrectOpt = option === item.answer
                    const isWrong = showResult && isSelected && !isCorrectOpt

                    let optBg = 'rgba(255,255,255,0.95)'
                    let optBorder = '2px solid rgba(0,0,0,0.06)'
                    let optColor = '#334155'
                    let optShadow = '0 4px 16px rgba(0,0,0,0.06)'
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
                            optBg = 'rgba(255,255,255,0.5)'; optBorder = '2px solid rgba(0,0,0,0.04)'
                            optColor = '#94a3b8'; optShadow = 'none'
                            lblBg = '#f1f5f9'; lblColor = '#94a3b8'
                        }
                    }

                    return (
                        <motion.button
                            key={i}
                            whileHover={!showResult ? { scale: 1.02, y: -2 } : {}}
                            whileTap={!showResult ? { scale: 0.98 } : {}}
                            onClick={() => handleAnswer(option)}
                            disabled={showResult}
                            animate={showResult && isCorrectOpt ? { scale: [1, 1.03, 1] } : {}}
                            style={{
                                padding: '18px 22px', borderRadius: '18px',
                                border: optBorder, background: optBg,
                                color: optColor, fontSize: '20px', fontWeight: 700,
                                cursor: showResult ? 'default' : 'pointer',
                                fontFamily: 'var(--font-display)',
                                boxShadow: optShadow,
                                display: 'flex', alignItems: 'center', gap: '14px',
                                textAlign: 'left', transition: 'all 0.3s ease',
                                minHeight: '64px',
                            }}
                        >
                            <div style={{
                                width: '44px', height: '44px', borderRadius: '12px',
                                background: lblBg, color: lblColor,
                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                fontSize: '18px', fontWeight: 800, flexShrink: 0,
                            }}>
                                {showResult && isCorrectOpt ? (
                                    <span className="material-symbols-rounded" style={{ fontSize: 26 }}>check</span>
                                ) : showResult && isWrong ? (
                                    <span className="material-symbols-rounded" style={{ fontSize: 26 }}>close</span>
                                ) : ANSWER_LABELS[i]}
                            </div>
                            <span style={{ lineHeight: 1.3 }}>
                                <FormatTextWithQuotes
                                    text={option}
                                    color={showResult ? (isCorrectOpt ? '#166534' : (isWrong ? '#991b1b' : '#94a3b8')) : colorValue}
                                />
                            </span>
                        </motion.button>
                    )
                })}
            </div>

            {/* Explanation Overlay */}
            <AnimatePresence>
                {showExplanationOverlay && (item.explanation || item.arabic_hint) && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={() => setShowExplanationOverlay(false)}
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
                            style={{
                                maxWidth: '900px', width: '100%',
                            }}
                        >
                            {/* Question & Answer (from QuestionPlayer style) */}
                            <div style={{
                                fontSize: '32px', fontWeight: 800, color: '#334155',
                                marginBottom: '32px', lineHeight: 1.4
                            }}>
                                {(item.question && item.question.includes('__')) ? (
                                    <FormattedText
                                        text={item.question}
                                        accentColor={accentColor}
                                        mainColor={colorValue}
                                        filledAnswers={item.answer ? item.answer.split(/\s*\/\s*/) : []}
                                    />
                                ) : (
                                    <>
                                        <FormattedText text={item.question} accentColor={accentColor} mainColor={colorValue} />{' '}
                                        <span style={{ color: '#22c55e', textDecoration: 'underline' }}>
                                            <FormattedText text={item.answer} accentColor={accentColor} mainColor={colorValue} />
                                        </span>
                                    </>
                                )}
                            </div>

                            {/* Divider */}
                            <div style={{
                                width: '80px', height: '6px', borderRadius: '3px',
                                background: colorValue,
                                opacity: 0.3,
                                margin: '0 auto 32px'
                            }} />

                            {/* Main Explanation / Hint */}
                            {item.explanation && (
                                <div style={{
                                    fontSize: '28px', fontWeight: 700,
                                    color: colorValue,
                                    lineHeight: 1.5,
                                    fontFamily: 'var(--font-display)',
                                    marginBottom: item.arabic_hint ? '24px' : 0,
                                }}>
                                    <FormattedText text={item.explanation} accentColor={accentColor} mainColor={colorValue} />
                                </div>
                            )}

                            {/* Fallback or secondary Arabic Hint display */}
                            {item.arabic_hint && (
                                <div style={{
                                    fontSize: '26px', lineHeight: 1.8, color: '#64748b',
                                    fontFamily: 'var(--font-arabic)', direction: 'rtl', textAlign: 'center',
                                    borderTop: item.explanation ? `2px solid ${hexToRgba(colorValue, 0.1)}` : 'none',
                                    paddingTop: item.explanation ? '24px' : 0,
                                    fontWeight: 700
                                }}>
                                    {item.arabic_hint}
                                </div>
                            )}
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
        </motion.div>
    )
}


// ============================================================
// PAGINATION DOTS (grammar-player style, single accent color)
// ============================================================
function PaginationDots({ items, currentIndex, accentColor, onNavigate }) {
    const colorValue = colorValues[accentColor]
    const lightTint = lightTints[accentColor]

    return (
        <div style={{
            display: 'flex', justifyContent: 'center', gap: '5px',
            flexWrap: 'wrap', maxWidth: '500px', margin: '0 auto',
        }}>
            {items.map((_, i) => {
                const isActive = i === currentIndex
                const isPast = i < currentIndex

                return (
                    <motion.button
                        key={i}
                        onClick={() => onNavigate(i)}
                        animate={{
                            scale: isActive ? 1.4 : 1,
                            backgroundColor: isActive ? colorValue : (isPast ? colorValue : '#D1D5DB'),
                            opacity: isPast ? 0.45 : 1,
                        }}
                        whileHover={{ scale: 1.25 }}
                        whileTap={{ scale: 0.9 }}
                        transition={{ type: 'spring', stiffness: 400, damping: 25 }}
                        style={{
                            width: '9px', height: '9px', borderRadius: '50%',
                            border: 'none', cursor: 'pointer', padding: 0,
                        }}
                        title={`Item ${i + 1}`}
                    />
                )
            })}
        </div>
    )
}

// ============================================================
// NAVIGATION BUTTONS (grammar-player style)
// ============================================================
function NavigationButtons({ onPrevious, onNext, isPreviousDisabled, isLastCard, accentColor }) {
    const colorValue = colorValues[accentColor]
    const textColor = textColors[accentColor]
    const lightTint = lightTints[accentColor]

    return (
        <div style={{
            display: 'flex', gap: '16px', alignItems: 'center',
        }}>
            <motion.button
                onClick={onPrevious}
                disabled={isPreviousDisabled}
                whileHover={!isPreviousDisabled ? { scale: 1.05, x: -3 } : {}}
                whileTap={!isPreviousDisabled ? { scale: 0.95 } : {}}
                style={{
                    padding: '14px 28px', borderRadius: '16px',
                    border: `2px solid ${colorValue}`,
                    background: isPreviousDisabled ? '#f5f5f5' : lightTint,
                    color: isPreviousDisabled ? '#bbb' : textColor,
                    fontSize: '17px', fontWeight: 700,
                    cursor: isPreviousDisabled ? 'default' : 'pointer',
                    fontFamily: 'var(--font-display)',
                    display: 'flex', alignItems: 'center', gap: '6px',
                    opacity: isPreviousDisabled ? 0.5 : 1,
                    boxShadow: isPreviousDisabled ? 'none' : '0 4px 16px rgba(0,0,0,0.06)',
                    transition: 'all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1)',
                }}
            >
                <span className="material-symbols-rounded" style={{ fontSize: 22 }}>arrow_back</span>
            </motion.button>

            <motion.button
                onClick={onNext}
                whileHover={{ scale: 1.05, x: 3 }}
                whileTap={{ scale: 0.95 }}
                style={{
                    padding: '14px 28px', borderRadius: '16px',
                    border: `2px solid ${colorValue}`,
                    background: lightTint,
                    color: textColor,
                    fontSize: '17px', fontWeight: 700,
                    cursor: 'pointer',
                    fontFamily: 'var(--font-display)',
                    display: 'flex', alignItems: 'center', gap: '6px',
                    boxShadow: '0 4px 16px rgba(0,0,0,0.06)',
                    transition: 'all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1)',
                }}
            >
                {isLastCard ? (
                    <span className="material-symbols-rounded" style={{ fontSize: 22 }}>check</span>
                ) : (
                    <span className="material-symbols-rounded" style={{ fontSize: 22 }}>arrow_forward</span>
                )}
            </motion.button>
        </div>
    )
}


// ============================================================
// MAIN UNIFIED PLAYER
// ============================================================
export function UnifiedPlayer({ lessonData, accentColor = 'cyan', onBack }) {
    const items = lessonData?.lesson?.items || []
    const title = lessonData?.lesson?.title || 'Custom Lesson'

    const [currentIndex, setCurrentIndex] = useState(0)
    const [score, setScore] = useState(0)
    const [questionsAnswered, setQuestionsAnswered] = useState(0)
    const [currentAccentColor, setCurrentAccentColor] = useState(accentColor)
    const [isOverlayActive, setIsOverlayActive] = useState(false)
    const hasNavigatedRef = useRef(false)
    const [isComplete, setIsComplete] = useState(false)

    const currentItem = items[currentIndex]
    const totalItems = items.length
    const totalQuestions = useMemo(() => items.filter(i => i.type === 'question').length, [items])

    // Change color on navigation (matching GrammarCardPlayer behavior)
    useEffect(() => {
        if (!hasNavigatedRef.current) {
            hasNavigatedRef.current = true
            return
        }
        const isStructured = localStorage.getItem('app_structured_mode') === 'true'
        if (!isStructured) {
            setCurrentAccentColor(prev => getRandomAccentExcluding(prev))
        }
    }, [currentIndex])

    const colorValue = colorValues[currentAccentColor]
    const textColor = textColors[currentAccentColor]
    const lightTint = lightTints[currentAccentColor]

    const handleNext = useCallback(() => {
        if (currentIndex < totalItems - 1) {
            setCurrentIndex(prev => prev + 1)
        } else {
            setIsComplete(true)
        }
    }, [currentIndex, totalItems])

    const handlePrevious = useCallback(() => {
        if (currentIndex > 0) {
            setCurrentIndex(prev => prev - 1)
        }
    }, [currentIndex])

    const handleAnswer = useCallback((correct) => {
        setQuestionsAnswered(prev => prev + 1)
        if (correct) setScore(prev => prev + 1)
    }, [])

    // Keyboard navigation
    useEffect(() => {
        const handleKey = (e) => {
            if (isComplete) {
                if (e.key === 'Escape') onBack?.()
                return
            }
            if (e.key === 'Escape') onBack?.()
            if (e.key === 'ArrowRight' || e.key === ' ') {
                e.preventDefault()
                handleNext()
            }
            if (e.key === 'ArrowLeft') {
                e.preventDefault()
                handlePrevious()
            }
        }
        window.addEventListener('keydown', handleKey)
        return () => window.removeEventListener('keydown', handleKey)
    }, [handleNext, handlePrevious, onBack, isComplete])

    const isPreviousDisabled = currentIndex === 0
    const isLastCard = currentIndex === totalItems - 1

    // ============================================================
    // COMPLETION SCREEN
    // ============================================================
    if (isComplete) {
        const percentage = totalQuestions > 0 ? Math.round((score / totalQuestions) * 100) : 100
        const message = totalQuestions === 0
            ? 'Lesson Complete!'
            : (percentage >= 80 ? 'Excellent!' : percentage >= 60 ? 'Good Job!' : 'Keep Practicing!')
        const icon = totalQuestions === 0
            ? 'school'
            : (percentage >= 80 ? 'emoji_events' : percentage >= 60 ? 'thumb_up' : 'school')

        return (
            <motion.div
                initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                style={{
                    position: 'fixed', inset: 0,
                    background: colorValue,
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
                    {totalQuestions > 0 && (
                        <>
                            <div style={{ fontSize: 80, fontWeight: 900, color: 'white', marginBottom: 8 }}>
                                {score} / {totalQuestions}
                            </div>
                            <div style={{ fontSize: 28, color: 'rgba(255,255,255,0.8)', fontWeight: 600, marginBottom: 40 }}>
                                {percentage}% correct
                            </div>
                        </>
                    )}
                    {totalQuestions === 0 && (
                        <div style={{ fontSize: 28, color: 'rgba(255,255,255,0.8)', fontWeight: 600, marginBottom: 40 }}>
                            {totalItems} items reviewed
                        </div>
                    )}
                    <motion.button
                        whileHover={{ scale: 1.05, y: -3 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={onBack}
                        style={{
                            padding: '18px 50px', borderRadius: '18px', border: 'none',
                            background: 'white', color: colorValue, fontSize: 22, fontWeight: 700,
                            cursor: 'pointer', fontFamily: 'var(--font-display)',
                            boxShadow: '0 12px 40px rgba(0,0,0,0.15)',
                            display: 'inline-flex', alignItems: 'center', gap: 10,
                        }}
                    >
                        <span className="material-symbols-rounded" style={{ fontSize: 24 }}>arrow_back</span>
                        Done
                    </motion.button>
                </motion.div>
            </motion.div>
        )
    }

    if (!currentItem) return null

    // ============================================================
    // MAIN PLAYER VIEW (GrammarCardPlayer-inspired)
    // ============================================================
    return (
        <motion.div
            className="grammar-player-container"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            style={{
                '--accent': colorValue,
                '--accent-soft': `${colorValue}33`,
                '--accent-softer': `${colorValue}1f`,
                '--accent-grid': `${colorValue}40`,
                transition: 'all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1)',
            }}
        >
            {/* Notebook Grid Background (same as GrammarCardPlayer) */}
            <div className="grammar-player-background" />

            {/* Pagination Dots - Fixed Top */}
            {!isOverlayActive && (
                <div style={{
                    position: 'fixed', top: '40px', zIndex: 50,
                    width: '100%', display: 'flex', justifyContent: 'center',
                    pointerEvents: 'none',
                }}>
                    <div style={{ pointerEvents: 'auto' }}>
                        <PaginationDots
                            items={items}
                            currentIndex={currentIndex}
                            accentColor={currentAccentColor}
                            onNavigate={setCurrentIndex}
                        />
                    </div>
                </div>
            )}

            {/* Counter badge */}
            {!isOverlayActive && (
                <div style={{
                    position: 'fixed', top: '36px', right: '100px', zIndex: 50,
                    display: 'flex', alignItems: 'center', gap: '8px',
                }}>
                    {totalQuestions > 0 && (
                        <div style={{
                            display: 'flex', alignItems: 'center', gap: '5px',
                            padding: '6px 12px', borderRadius: '10px',
                            background: lightTint,
                            border: `2px solid ${colorValue}`,
                            fontWeight: 700, fontSize: '13px', color: textColor,
                            fontFamily: 'var(--font-display)',
                            transition: 'all 0.3s ease',
                        }}>
                            <span className="material-symbols-rounded material-filled" style={{ fontSize: 16 }}>star</span>
                            {score}/{totalQuestions}
                        </div>
                    )}
                    <div style={{
                        padding: '6px 12px', borderRadius: '10px',
                        background: lightTint,
                        border: `2px solid ${colorValue}`,
                        fontWeight: 700, fontSize: '13px', color: textColor,
                        fontFamily: 'var(--font-display)',
                        transition: 'all 0.3s ease',
                    }}>
                        {currentIndex + 1} / {totalItems}
                    </div>
                </div>
            )}

            {/* Main Content */}
            <motion.div
                className="grammar-player-card-wrapper"
                layout
                transition={{ type: 'spring', stiffness: 220, damping: 25 }}
                style={{
                    display: 'flex', flexDirection: 'column',
                    alignItems: 'center', gap: '24px',
                    width: '100%', maxWidth: '900px',
                }}
            >
                <AnimatePresence mode="wait">
                    <motion.div
                        key={currentIndex}
                        initial={{ opacity: 0, x: 60 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -60 }}
                        transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
                        style={{ width: '100%' }}
                    >
                        {currentItem.type === 'general' && (
                            <GeneralItemCard item={currentItem} accentColor={currentAccentColor} />
                        )}
                        {currentItem.type === 'vocab' && (
                            <VocabItemCard item={currentItem} accentColor={currentAccentColor} />
                        )}
                        {currentItem.type === 'question' && (
                            <QuestionItemCard
                                item={currentItem}
                                accentColor={currentAccentColor}
                                onAnswer={handleAnswer}
                                onOverlayChange={setIsOverlayActive}
                            />
                        )}
                    </motion.div>
                </AnimatePresence>
            </motion.div>

            {/* Navigation Buttons - Fixed Bottom */}
            {!isOverlayActive && (
                <div style={{
                    position: 'fixed', bottom: '40px', zIndex: 50,
                    width: '100%', display: 'flex', justifyContent: 'center',
                    pointerEvents: 'none',
                }}>
                    <div style={{ pointerEvents: 'auto' }}>
                        <NavigationButtons
                            onPrevious={handlePrevious}
                            onNext={handleNext}
                            isPreviousDisabled={isPreviousDisabled}
                            isLastCard={isLastCard}
                            accentColor={currentAccentColor}
                        />
                    </div>
                </div>
            )}

            {/* Close Button (matching GrammarCardPlayer) */}
            {!isOverlayActive && (
                <motion.button
                    className="grammar-close-btn"
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
            )}
        </motion.div>
    )
}

export default UnifiedPlayer

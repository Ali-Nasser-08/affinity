import React, { useState, useEffect, useCallback, useRef } from 'react'
import { motion, AnimatePresence, animate } from 'framer-motion'
import { colorValues, accentColorSchemes, getRandomAccentExcluding } from '../engine/serotoninEngine'
import vocabData from '../data/idle/idlevocab.json'

// ─────────────────────────────────────────────
// HELPERS
// ─────────────────────────────────────────────
function hexToRgba(hex, alpha = 0.15) {
    if (!hex || typeof hex !== 'string' || hex[0] !== '#') return hex
    const r = parseInt(hex.slice(1, 3), 16)
    const g = parseInt(hex.slice(3, 5), 16)
    const b = parseInt(hex.slice(5, 7), 16)
    return `rgba(${r}, ${g}, ${b}, ${alpha})`
}

function shuffleIndices(length) {
    const arr = Array.from({ length }, (_, i) => i)
    for (let i = arr.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [arr[i], arr[j]] = [arr[j], arr[i]]
    }
    return arr
}

// Phase durations (ms)
const FRONT_DURATION = 4000  // show front face
const BACK_DURATION = 6500  // show back face

// ─────────────────────────────────────────────
// COUNTDOWN RING
// ─────────────────────────────────────────────
function CountdownRing({ duration, color, onDone, running, phase }) {
    const [displayProgress, setDisplayProgress] = useState(phase === 'front' ? 0 : 1)

    useEffect(() => {
        if (!running || phase === 'exiting') return

        const controls = animate(phase === 'front' ? 0 : 1, phase === 'front' ? 1 : 0, {
            duration: duration / 1000,
            ease: "linear",
            onUpdate: (latest) => setDisplayProgress(latest),
            onComplete: () => {
                // Delay slightly to feel "softer"
                setTimeout(() => onDone?.(), 50)
            }
        })

        return () => controls.stop()
    }, [duration, running, phase, onDone])

    const radius = 23
    const circ = 2 * Math.PI * radius
    const dashOffset = circ * displayProgress

    return (
        <div style={{ position: 'relative', width: 56, height: 56 }}>
            {/* Soft background glow */}
            <div style={{
                position: 'absolute', inset: 4,
                borderRadius: '50%',
                boxShadow: `0 0 12px ${color}15`,
                pointerEvents: 'none'
            }} />

            <svg width={56} height={56} style={{ transform: 'rotate(-90deg)', display: 'block' }}>
                <circle cx={28} cy={28} r={radius}
                    fill="none"
                    stroke={hexToRgba(color, 0.1)}
                    strokeWidth={4}
                />
                <motion.circle cx={28} cy={28} r={radius}
                    fill="none"
                    stroke={color}
                    strokeWidth={4.5}
                    strokeLinecap="round"
                    strokeDasharray={circ}
                    animate={{ strokeDashoffset: dashOffset, stroke: color }}
                    transition={{
                        strokeDashoffset: { type: "tween", ease: "linear", duration: 0.1 },
                        stroke: { duration: 0.6 }
                    }}
                    style={{
                        filter: `drop-shadow(0 0 3px ${color}40)`,
                    }}
                />
            </svg>
        </div>
    )
}

// ─────────────────────────────────────────────
// SEGMENT RENDERER
// ─────────────────────────────────────────────
function SegmentText({ segments, accentColor }) {
    const scheme = accentColorSchemes[accentColor] || accentColorSchemes.cyan

    return (
        <>
            {segments.map((seg, idx) => {
                let style = { whiteSpace: 'pre-wrap' }

                if (seg.colorize || seg.colorize2 || seg.colorize3) {
                    const c = seg.colorize3 ? scheme.colorize3 : (seg.colorize2 ? scheme.colorize2 : scheme.colorize1)
                    style = { ...style, color: c, fontWeight: 700 }
                }
                if (seg.highlight || seg.highlight2 || seg.highlight3) {
                    const h = seg.highlight3 ? scheme.highlight3 : (seg.highlight2 ? scheme.highlight2 : scheme.highlight1)
                    style = {
                        ...style,
                        background: hexToRgba(h, 0.16),
                        color: h,
                        fontWeight: 800,
                        padding: '2px 10px',
                        borderRadius: '10px',
                        display: 'inline-block',
                        margin: '0 2px',
                    }
                }
                if (seg.badge || seg.badge2 || seg.badge3) {
                    const b = seg.badge3 ? scheme.badge3 : (seg.badge2 ? scheme.badge2 : scheme.badge1)
                    style = {
                        ...style,
                        background: b,
                        color: '#fff',
                        fontWeight: 700,
                        padding: '1px 8px',
                        borderRadius: '12px',
                        display: 'inline-block',
                        margin: '0 2px',
                        fontSize: '0.93em',
                    }
                }

                return <span key={idx} style={style}>{seg.text}</span>
            })}
        </>
    )
}

// ─────────────────────────────────────────────
// CARD FRONT (Word only)
// ─────────────────────────────────────────────
function CardFront({ word, colorValue, accentColor }) {
    const rawWord = (word?.word ?? '').trim()
    const parts = rawWord.split(/\s+/)
    const longest = Math.max(...parts.map(w => w.length))
    const total = rawWord.length

    let scale = 1.0
    if (longest > 11) scale = Math.max(0.35, 1 - (longest - 11) * 0.15)
    else if (total > 20) scale = 0.78

    const wordSize = `clamp(${4 * scale}rem, ${11 * scale}vw, ${11 * scale}rem)`

    return (
        <div style={{
            position: 'absolute', inset: 0,
            display: 'flex', flexDirection: 'column',
            alignItems: 'center', justifyContent: 'center',
            padding: '52px 44px',
            backfaceVisibility: 'hidden',
            WebkitBackfaceVisibility: 'hidden',
            background: 'rgba(255,255,255,0.97)',
            backdropFilter: 'blur(20px)',
            borderRadius: 32,
            border: '3px solid rgba(255,255,255,0.85)',
            overflow: 'hidden',
            boxSizing: 'border-box',
        }}>
            {/* Big word only */}
            <motion.div
                key={word.word + '-front'}
                initial={{ opacity: 0, scale: 0.88, y: 18 }}
                animate={{
                    opacity: 1, scale: 1, y: 0,
                    fontSize: wordSize,
                    textShadow: [
                        `0 0 20px ${colorValue}10`,
                        `0 0 70px ${colorValue}80`,
                        `0 0 20px ${colorValue}10`,
                    ],
                }}
                transition={{
                    default: { type: 'spring', stiffness: 220, damping: 18 },
                    textShadow: { duration: 3.5, repeat: Infinity, ease: 'easeInOut' },
                }}
                style={{
                    color: colorValue,
                    fontFamily: 'var(--font-display)',
                    fontWeight: 800,
                    letterSpacing: '-1.5px',
                    lineHeight: 1.1,
                    textAlign: 'center',
                    textTransform: 'capitalize',
                    fontSize: wordSize,
                }}
            >
                {word.word}
            </motion.div>

            {/* Flip hint */}
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 0.35 }}
                transition={{ delay: 0.9 }}
                style={{
                    position: 'absolute', bottom: 22, right: 28,
                    display: 'flex', alignItems: 'center', gap: 5,
                    fontSize: '0.78rem', color: colorValue,
                    fontFamily: 'var(--font-display)', fontWeight: 600,
                    letterSpacing: '1.2px', textTransform: 'uppercase',
                }}
            >
                <span className="material-symbols-rounded" style={{ fontSize: 15 }}>flip</span>
                flipping soon
            </motion.div>
        </div>
    )
}

// ─────────────────────────────────────────────
// CARD BACK
// ─────────────────────────────────────────────
function CardBack({ word, colorValue, accentColor }) {
    const definitionIsSegments = Array.isArray(word.definition)

    return (
        <div style={{
            position: 'absolute', inset: 0,
            backfaceVisibility: 'hidden',
            WebkitBackfaceVisibility: 'hidden',
            transform: 'rotateY(180deg)',
            background: 'rgba(255,255,255,0.97)',
            backdropFilter: 'blur(20px)',
            borderRadius: 32,
            border: '3px solid rgba(255,255,255,0.85)',
            overflow: 'hidden auto',
            boxSizing: 'border-box',
        }}>
            <div style={{
                padding: '44px 40px 40px',
                display: 'flex',
                flexDirection: 'column',
                gap: 20,
                minHeight: '100%',
                boxSizing: 'border-box',
                position: 'relative',
            }}>
                {/* Arabic */}
                {word.arabicMeaning && (
                    <div style={{
                        fontFamily: 'var(--font-arabic, serif)',
                        fontSize: 22, fontWeight: 600,
                        padding: '8px 20px',
                        borderRadius: 16,
                        border: `1.5px solid ${hexToRgba(colorValue, 0.22)}`,
                        color: colorValue,
                        backgroundColor: hexToRgba(colorValue, 0.06),
                        direction: 'rtl', textAlign: 'center',
                    }}>
                        {word.arabicMeaning}
                    </div>
                )}

                {/* Word + type */}
                <div style={{
                    fontFamily: 'var(--font-display)',
                    fontSize: 30, fontWeight: 800,
                    color: colorValue,
                    textTransform: 'capitalize',
                    letterSpacing: '-0.5px',
                    display: 'flex', alignItems: 'baseline', gap: 10,
                }}>
                    {word.word}
                    {word.wordType && (
                        <span style={{
                            fontSize: 13, fontWeight: 600,
                            textTransform: 'uppercase',
                            letterSpacing: '1px',
                            opacity: 0.5,
                        }}>
                            {word.wordType}
                        </span>
                    )}
                </div>

                {/* Definition */}
                <div style={{
                    fontFamily: 'var(--font-display)',
                    fontSize: 22, fontWeight: 450,
                    lineHeight: 1.65, color: '#334155',
                }}>
                    {definitionIsSegments
                        ? <SegmentText segments={word.definition} accentColor={accentColor} />
                        : word.definition
                    }
                </div>

                {/* Example */}
                {word.example && (
                    <div style={{
                        fontFamily: 'var(--font-display)',
                        fontSize: 20, fontWeight: 450,
                        lineHeight: 1.7, color: '#475569',
                        fontStyle: 'italic',
                        paddingLeft: 16,
                        borderLeft: `3.5px solid ${hexToRgba(colorValue, 0.45)}`,
                    }}>
                        <SegmentText segments={word.example} accentColor={accentColor} />
                    </div>
                )}

                {/* Synonyms */}
                {word.synonyms && word.synonyms.length > 0 && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                        <div style={{
                            fontFamily: 'var(--font-display)',
                            fontSize: 11, fontWeight: 800,
                            textTransform: 'uppercase', letterSpacing: '1.5px',
                            color: colorValue, display: 'flex', alignItems: 'center', gap: 5,
                        }}>
                            <span className="material-symbols-rounded" style={{ fontSize: 15 }}>swap_horiz</span>
                            Synonyms
                        </div>
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                            {word.synonyms.map((syn, idx) => (
                                <span key={idx} style={{
                                    fontFamily: 'var(--font-display)',
                                    fontSize: 15, fontWeight: 600,
                                    padding: '5px 16px',
                                    borderRadius: 999,
                                    border: `1.5px solid ${hexToRgba(colorValue, 0.22)}`,
                                    backgroundColor: hexToRgba(colorValue, 0.08),
                                    color: colorValue,
                                }}>
                                    {syn.charAt(0).toUpperCase() + syn.slice(1)}
                                </span>
                            ))}
                        </div>
                    </div>
                )}
            </div>
        </div>
    )
}

// ─────────────────────────────────────────────
// ISOLATED FLIP CARD
// ─────────────────────────────────────────────
// Keeping this outside the main component ensures that when Framer Motion
// triggers an exit, the frozen React element retains its last known prop (isFlipped=true)
// and doesn't get updated by the parent's state reset.
function FlippableCard({ isFlipped, word, colorValue, accentColor }) {
    return (
        <div style={{ width: '100%', maxWidth: 860, position: 'relative' }}>
            {/* Flip container */}
            <motion.div
                initial={{ rotateY: 0 }}
                animate={{ rotateY: isFlipped ? 180 : 0 }}
                exit={{ rotateY: 180 }}
                transition={{ duration: 0.6, ease: [0.4, 0.2, 0.2, 1] }}
                style={{
                    width: '100%',
                    minHeight: 580,
                    position: 'relative',
                    transformStyle: 'preserve-3d',
                    borderRadius: 32,
                    boxShadow: `0 28px 80px ${colorValue}22, 0 10px 30px rgba(0,0,0,0.07)`,
                }}
            >
                <CardFront word={word} colorValue={colorValue} accentColor={accentColor} />
                <CardBack word={word} colorValue={colorValue} accentColor={accentColor} />
            </motion.div>
        </div>
    )
}

// ─────────────────────────────────────────────
// MAIN IDLE SCREEN
// ─────────────────────────────────────────────
export function VocabCarouselIdleScreen({ onBack, color, onAccentChange }) {
    // Shuffled playlist
    const [playlist, setPlaylist] = useState(() => shuffleIndices(vocabData.length))
    const [playlistIndex, setPlaylistIndex] = useState(0)
    const [phase, setPhase] = useState('front')  // 'front' | 'back' | 'exiting'
    const [isFlipped, setIsFlipped] = useState(false)
    const [isMouseIdle, setIsMouseIdle] = useState(false)

    const currentWord = vocabData[playlist[playlistIndex]]
    const colorValue = colorValues[color]

    // Mouse-idle detection
    useEffect(() => {
        let t
        const reset = () => {
            setIsMouseIdle(false)
            clearTimeout(t)
            t = setTimeout(() => setIsMouseIdle(true), 3000)
        }
        window.addEventListener('mousemove', reset)
        reset()
        return () => { window.removeEventListener('mousemove', reset); clearTimeout(t) }
    }, [])

    // Reset card state when word changes
    useEffect(() => {
        setIsFlipped(false)
        setPhase('front')
    }, [playlistIndex, playlist])

    // Front countdown done → flip
    const handleFrontDone = useCallback(() => {
        setIsFlipped(true)
        setTimeout(() => setPhase('back'), 620)
    }, [])

    // Back countdown done → advance to next word
    const handleBackDone = useCallback(() => {
        setPhase('exiting')

        setTimeout(() => {
            const nextColor = getRandomAccentExcluding(color)
            onAccentChange?.(nextColor)

            setPlaylistIndex(prev => {
                if (prev + 1 >= playlist.length) {
                    setPlaylist(shuffleIndices(vocabData.length))
                    return 0
                }
                return prev + 1
            })
        }, 600) // generous transition out time
    }, [color, onAccentChange, playlist.length])

    if (!currentWord) return null

    return (
        <motion.div
            className="idle-screen"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
        >
            {/* Ambient blobs */}
            <div className="idle-blobs">
                <motion.div
                    className="idle-blob"
                    style={{ top: '5%', left: '5%', width: 700, height: 700, backgroundColor: colorValue, opacity: 0.18 }}
                    animate={{ backgroundColor: colorValue }}
                    transition={{ duration: 0.7, ease: 'easeInOut' }}
                />
                <motion.div
                    className="idle-blob"
                    style={{ bottom: '5%', right: '5%', width: 560, height: 560, backgroundColor: colorValue, opacity: 0.14 }}
                    animate={{ backgroundColor: colorValue }}
                    transition={{ duration: 0.7, delay: 0.1, ease: 'easeInOut' }}
                />
            </div>

            {/* Back button */}
            <AnimatePresence>
                {!isMouseIdle && (
                    <motion.button
                        key="back-btn"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.3 }}
                        onClick={onBack}
                        style={{
                            position: 'absolute', top: 40, left: 40,
                            width: 56, height: 56, borderRadius: '50%',
                            background: hexToRgba(colorValue, 0.1),
                            color: colorValue,
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            border: `2px solid ${hexToRgba(colorValue, 0.2)}`,
                            cursor: 'pointer', zIndex: 50,
                        }}
                    >
                        <span className="material-symbols-rounded" style={{ fontSize: 32 }}>close</span>
                    </motion.button>
                )}
            </AnimatePresence>

            {/* Symmetrical countdown ring at top right */}
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.3 }}
                style={{
                    position: 'absolute', top: 40, right: 40,
                    width: 56, height: 56, borderRadius: '50%',
                    background: hexToRgba(colorValue, 0.05),
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    zIndex: 50,
                }}
            >
                <CountdownRing
                    duration={phase === 'front' ? FRONT_DURATION : BACK_DURATION}
                    color={colorValue}
                    onDone={phase === 'front' ? handleFrontDone : handleBackDone}
                    running={phase !== 'exiting'}
                    phase={phase}
                />
            </motion.div>

            <div style={{
                position: 'relative',
                width: '100%', height: '100%',
                zIndex: 10,
                overflow: 'hidden', // hides horizontal sliding bits
            }}>
                <AnimatePresence custom={isFlipped}>
                    <motion.div
                        key={`word-${playlistIndex}`}
                        initial={{ x: '100vw', scale: 0.98 }}
                        animate={{ x: 0, scale: 1 }}
                        exit={{ x: '-100vw', scale: 0.98 }}
                        transition={{ type: 'spring', stiffness: 220, damping: 26, mass: 1 }}
                        style={{
                            position: 'absolute', inset: 0,
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            padding: '80px 60px', boxSizing: 'border-box'
                        }}
                    >
                        <FlippableCard
                            isFlipped={isFlipped}
                            word={currentWord}
                            colorValue={colorValue}
                            accentColor={color}
                        />
                    </motion.div>
                </AnimatePresence>
            </div>
        </motion.div>
    )
}

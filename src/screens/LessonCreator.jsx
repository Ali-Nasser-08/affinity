import { useState, useCallback, useRef, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { colorValues, lightTints } from '../engine/serotoninEngine'
import { generateLesson } from '../utils/geminiService'
import promptsArray from '../data/prompts.json'

const MAX_PROMPT_LENGTH = 500

// ============================================================
// CHEMISTRY FLASK SVG
// ============================================================
function FlaskIcon({ size = 24, color = '#64748b', filled = false }) {
    return (
        <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={filled ? 'none' : color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
            {filled ? (
                <path d="M9 2h6v6l5.5 9.5a2 2 0 01-1.73 3H5.23a2 2 0 01-1.73-3L9 8V2z" fill={color} />
            ) : (
                <>
                    <path d="M17.1 14C15 12.5 9 15.5 6.9 14L4.5 17.5a2 2 0 0 0 1.73 3h11.54a2 2 0 0 0 1.73-3Z" fill={color} stroke="none" />
                    <path d="M12 7.5C12 7.5 10.5 9 10.5 10.5C10.5 11.33 11.17 12 12 12C12.83 12 13.5 11.33 13.5 10.5C13.5 9 12 7.5 12 7.5Z" fill={color} stroke="none" />
                    <path d="M9 3h6" />
                    <path d="M10 3v6.5L4.5 17.5a2 2 0 001.73 3h11.54a2 2 0 001.73-3L14 9.5V3" />
                </>
            )}
        </svg>
    )
}

// ============================================================
// BREW PARTICLE ANIMATION
// ============================================================
const BrewParticle = ({ color }) => {
    const angle = Math.random() * 360
    const distance = 50 + Math.random() * 200
    const size = 3 + Math.random() * 7
    const duration = 1.0 + Math.random() * 2.0
    const chaosX = (Math.random() - 0.5) * 50
    const chaosY = (Math.random() - 0.5) * 50

    return (
        <motion.div
            initial={{ x: 0, y: 0, scale: 0, opacity: 1, rotate: 0 }}
            animate={{
                x: Math.cos(angle * (Math.PI / 180)) * distance + chaosX,
                y: Math.sin(angle * (Math.PI / 180)) * distance + chaosY,
                scale: [0, 1.5, 0],
                opacity: [1, 1, 0],
                rotate: Math.random() * 720 - 360
            }}
            transition={{
                duration: duration,
                ease: "easeOut",
                repeat: Infinity,
                repeatType: "loop",
                delay: Math.random() * 2 // stagger start
            }}
            style={{
                position: 'absolute',
                top: '50%',
                left: '50%',
                width: size,
                height: size,
                borderRadius: '50%',
                backgroundColor: color,
                boxShadow: `0 0 ${size * 1.5}px ${color}`,
                zIndex: 0,
                pointerEvents: 'none'
            }}
        />
    )
}

// ============================================================
// EXPERIMENTAL BADGE
// ============================================================
function UnifiedBadge({ label, icon, accentColor }) {
    const colorValue = colorValues[accentColor]
    const lightTint = lightTints[accentColor]

    return (
        <motion.div
            layout
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{
                scale: 1,
                opacity: 1,
                borderColor: colorValue,
                backgroundColor: lightTint,
                color: colorValue
            }}
            transition={{ duration: 0.3 }}
            style={{
                border: `1.5px solid ${colorValue}`,
                padding: '4px 10px',
                borderRadius: '10px',
                fontWeight: 800,
                fontSize: '13px',
                whiteSpace: 'nowrap',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '4px',
                boxShadow: `0 2px 6px ${colorValue}20`,
                marginLeft: '6px',
                marginTop: '4px',
                letterSpacing: '0.5px',
                textTransform: 'uppercase'
            }}
        >
            {icon && (
                <span className="material-symbols-rounded" style={{
                    fontSize: 14,
                    fontVariationSettings: "'FILL' 1"
                }}>
                    {icon}
                </span>
            )}
            {label}
        </motion.div>
    )
}

// ============================================================
// STORAGE UTILITIES
// ============================================================
function getSavedLessons() {
    try {
        const raw = localStorage.getItem('app_custom_lessons')
        return raw ? JSON.parse(raw) : []
    } catch { return [] }
}

function saveLesson(lesson) {
    const lessons = getSavedLessons()
    lessons.unshift(lesson)
    localStorage.setItem('app_custom_lessons', JSON.stringify(lessons))
}

function deleteSavedLesson(id) {
    const lessons = getSavedLessons().filter(l => l.id !== id)
    localStorage.setItem('app_custom_lessons', JSON.stringify(lessons))
}

// ============================================================
// TYPEWRITER PLACEHOLDER (Extracted to prevent full component re-renders)
// ============================================================
const TypewriterPlaceholder = ({ activeColorHex }) => {
    const [pIndex, setPIndex] = useState(() => Math.floor(Math.random() * promptsArray.length))
    const [charIndex, setCharIndex] = useState(0)
    const [isDeleting, setIsDeleting] = useState(false)

    useEffect(() => {
        const currentText = promptsArray[pIndex] || ''
        let timeout

        if (!isDeleting) {
            if (charIndex < currentText.length) {
                let speed = 35 + Math.random() * 25
                if (charIndex >= currentText.length - 3 && currentText.endsWith('...')) {
                    speed = 150
                }
                timeout = setTimeout(() => {
                    setCharIndex(prev => prev + 1)
                }, speed)
            } else {
                timeout = setTimeout(() => {
                    setIsDeleting(true)
                }, 2500)
            }
        } else {
            if (charIndex > 0) {
                timeout = setTimeout(() => {
                    setCharIndex(prev => prev - 1)
                }, 18)
            } else {
                timeout = setTimeout(() => {
                    setIsDeleting(false)
                    setPIndex(Math.floor(Math.random() * promptsArray.length))
                }, 500)
            }
        }

        return () => clearTimeout(timeout)
    }, [charIndex, isDeleting, pIndex])

    return (
        <div style={{
            position: 'absolute', top: '23px', left: '23px', right: '23px',
            color: '#94a3b8', fontSize: '22px', fontFamily: 'var(--font-display)', fontWeight: 500,
            pointerEvents: 'none', zIndex: 2, lineHeight: 1.5
        }}>
            <span style={{ marginRight: '8px' }}>e.g.</span>
            {(promptsArray[pIndex] || '').slice(0, charIndex).split('').map((char, i) => (
                <motion.span
                    key={`${pIndex}-${i}`}
                    initial={{ opacity: 0, y: 3 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.12 }}
                >
                    {char}
                </motion.span>
            ))}
            <motion.span
                animate={{ opacity: [1, 0, 1] }}
                transition={{ duration: 0.8, repeat: Infinity }}
                style={{
                    display: 'inline-block',
                    width: '3px',
                    height: '1em',
                    background: activeColorHex,
                    marginLeft: '4px',
                    verticalAlign: 'bottom',
                    marginBottom: '2px',
                    borderRadius: '2px'
                }}
            />
        </div>
    )
}

// ============================================================
// MAIN COMPONENT
// ============================================================
export function LessonCreator({ onBack, onPlay, onBrew, onBrewError }) {
    const [prompt, setPrompt] = useState('')
    const [lessonName, setLessonName] = useState('')
    const [lessonType, setLessonType] = useState('auto')
    const [selectedColor, setSelectedColor] = useState('cyan')
    const [selectedLogo, setSelectedLogo] = useState('science')

    const [isGenerating, setIsGenerating] = useState(false)
    const [error, setError] = useState(null)
    const [savedLessons, setSavedLessons] = useState(getSavedLessons)
    const [view, setView] = useState('lab') // 'lab' or 'library'

    const colorKeys = Object.keys(colorValues)
    const activeColorHex = colorValues[selectedColor]

    const logoOptions = [
        'science', 'biotech', 'psychology', 'experiment', 'menu_book',
        'school', 'eco', 'public', 'rocket_launch', 'memory', 'terminal',
        'lightbulb', 'star', 'electric_bolt', 'local_fire_department'
    ]

    const lessonTypes = [
        { id: 'auto', label: 'Mixed Lesson', icon: 'auto_awesome' },
        { id: 'questions', label: 'Questions', icon: 'quiz' },
        { id: 'vocab', label: 'Vocabulary', icon: 'dictionary' },
        { id: 'general', label: 'Explaination', icon: 'auto_stories' },
    ]

    const [confirmDeleteId, setConfirmDeleteId] = useState(null)

    useEffect(() => {
        const handleKey = (e) => {
            if (e.key === 'Escape' && !isGenerating) onBack?.()
        }
        window.addEventListener('keydown', handleKey)
        return () => window.removeEventListener('keydown', handleKey)
    }, [onBack, isGenerating])

    const handleGenerate = async () => {
        if (!prompt.trim()) return
        // Navigate to brewing screen immediately
        onBrew?.()
        setIsGenerating(true)
        setError(null)
        try {
            const result = await generateLesson(prompt.trim(), lessonType)
            const lessonEntry = {
                id: `lesson_${Date.now()}`,
                title: lessonName.trim() || result.lesson?.title || 'Untitled Lesson',
                type: lessonType,
                colorKey: selectedColor,
                logoId: selectedLogo,
                data: result,
                createdAt: new Date().toISOString(),
            }
            if (lessonName.trim() && result.lesson) result.lesson.title = lessonName.trim()
            saveLesson(lessonEntry)
            setSavedLessons(getSavedLessons())
            setIsGenerating(false)
            onPlay?.(result)
        } catch (err) {
            setIsGenerating(false)
            const msg = err.message || 'Generation failed.'
            setError(msg)
            onBrewError?.(msg)
        }
    }

    const handleDelete = (id) => {
        deleteSavedLesson(id)
        setSavedLessons(getSavedLessons())
    }

    return (
        <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            style={{
                position: 'fixed', inset: 0,
                backgroundColor: 'white',
                '--accent': activeColorHex,
                '--accent-soft': `${activeColorHex}33`,
                '--accent-softer': `${activeColorHex}1f`,
                '--accent-grid': `${activeColorHex}40`,
                transition: 'all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1)',
                fontFamily: 'var(--font-display)',
                overflow: 'hidden', zIndex: 100,
                color: '#334155', display: 'flex', flexDirection: 'column'
            }}
        >
            {/* HEADER */}
            <div style={{
                padding: '16px 40px', display: 'flex', justifyContent: 'space-between',
                alignItems: 'center', position: 'relative', zIndex: 10
            }}>
                <button
                    onClick={onBack}
                    style={{
                        display: 'flex', alignItems: 'center', gap: '8px',
                        background: 'white', border: '3px solid #e2e8f0',
                        color: '#475569', padding: '8px 16px', borderRadius: '16px',
                        cursor: 'pointer', fontSize: '18px', fontWeight: 700, fontFamily: 'var(--font-display)',
                        boxShadow: '0 2px 4px rgba(0,0,0,0.02)'
                    }}
                >
                    <span className="material-symbols-rounded" style={{ fontSize: 24 }}>arrow_back</span>
                    Back
                </button>

                <div style={{ display: 'flex', gap: '8px', background: '#f1f5f9', padding: '4px', borderRadius: '20px', border: '2px solid #e2e8f0' }}>
                    <button
                        onClick={() => setView('lab')}
                        style={{
                            padding: '10px 20px', borderRadius: '16px', cursor: 'pointer',
                            background: view === 'lab' ? 'white' : 'transparent',
                            color: view === 'lab' ? activeColorHex : '#64748b',
                            border: 'none', fontWeight: 800, fontSize: '18px', fontFamily: 'var(--font-display)',
                            boxShadow: view === 'lab' ? '0 2px 4px rgba(0,0,0,0.05)' : 'none',
                            display: 'flex', alignItems: 'center', gap: '8px'
                        }}
                    >
                        <FlaskIcon size={22} color={view === 'lab' ? activeColorHex : '#64748b'} />
                        Lesson Lab
                    </button>
                    <button
                        onClick={() => setView('library')}
                        style={{
                            padding: '10px 20px', borderRadius: '16px', cursor: 'pointer',
                            background: view === 'library' ? 'white' : 'transparent',
                            color: view === 'library' ? activeColorHex : '#64748b',
                            border: 'none', fontWeight: 800, fontSize: '18px', fontFamily: 'var(--font-display)',
                            boxShadow: view === 'library' ? '0 2px 4px rgba(0,0,0,0.05)' : 'none',
                            display: 'flex', alignItems: 'center', gap: '8px'
                        }}
                    >
                        <span className="material-symbols-rounded" style={{ fontSize: 22 }}>history_edu</span>
                        Library
                        <span style={{ background: view === 'library' ? `${activeColorHex}20` : '#e2e8f0', color: view === 'library' ? activeColorHex : '#475569', padding: '4px 10px', borderRadius: '12px', fontSize: '14px', fontWeight: 800 }}>
                            {savedLessons.length}
                        </span>
                    </button>
                </div>
            </div>

            {/* MAIN CONTENT ZONE */}
            <div style={{ flex: 1, position: 'relative', zIndex: 10, display: 'flex', justifyContent: 'center', alignItems: 'flex-start', overflowY: 'auto', overflowX: 'hidden', paddingTop: '10px', paddingBottom: '40px' }}>
                <AnimatePresence mode="wait">
                    {view === 'lab' ? (
                        <motion.div
                            key="lab"
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: 20 }}
                            transition={{ duration: 0.2 }}
                            style={{
                                width: '100%', maxWidth: '1200px', display: 'grid', gridTemplateColumns: 'minmax(0, 1.5fr) 350px', gap: '24px', padding: '0 40px'
                            }}
                        >
                            {/* LEFT: Prompt & Settings */}
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', width: '100%' }}>
                                <div style={{
                                    background: 'white', border: '3px solid #e2e8f0',
                                    borderRadius: '24px', padding: '24px',
                                    boxShadow: '0 10px 30px rgba(0,0,0,0.03)'
                                }}>
                                    <h2 style={{ margin: '0 0 16px 0', fontSize: '32px', fontWeight: 800, color: '#1e293b', fontFamily: 'var(--font-display)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                        <span style={{ color: activeColorHex }}>Create a lesson.</span>
                                        <UnifiedBadge
                                            label="Experimental"
                                            icon="science"
                                            accentColor={selectedColor}
                                        />
                                    </h2>
                                    <div style={{ position: 'relative' }}>
                                        <textarea
                                            value={prompt}
                                            onChange={e => setPrompt(e.target.value.slice(0, MAX_PROMPT_LENGTH))}
                                            style={{
                                                width: '100%', minHeight: '160px', background: '#f8fafc',
                                                border: `3px solid ${prompt ? activeColorHex : '#e2e8f0'}`, borderRadius: '16px',
                                                padding: '20px', color: '#1e293b', fontSize: '22px', fontFamily: 'var(--font-display)', fontWeight: 500,
                                                resize: 'vertical', outline: 'none', transition: 'border-color 0.2s', boxSizing: 'border-box',
                                                position: 'relative', zIndex: 1
                                            }}
                                        />
                                        {!prompt && <TypewriterPlaceholder activeColorHex={activeColorHex} />}
                                    </div>
                                    <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '6px' }}>
                                        <span style={{ color: prompt.length > MAX_PROMPT_LENGTH * 0.9 ? '#ef4444' : '#94a3b8', fontSize: '15px', fontWeight: 700 }}>
                                            {prompt.length}/{MAX_PROMPT_LENGTH} characters
                                        </span>
                                    </div>

                                    <div style={{ marginTop: '16px', display: 'flex', flexDirection: 'column', gap: '24px' }}>
                                        <div>
                                            <label style={{ fontSize: '16px', color: '#64748b', fontWeight: 800, display: 'block', marginBottom: '8px', fontFamily: 'var(--font-display)' }}>Lesson Name</label>
                                            <input
                                                value={lessonName} onChange={e => setLessonName(e.target.value)}
                                                placeholder="e.g. Past Tense Review"
                                                maxLength={40}
                                                style={{
                                                    width: '100%', background: '#f8fafc', border: `3px solid ${lessonName ? activeColorHex : '#e2e8f0'}`,
                                                    padding: '14px 16px', borderRadius: '16px', color: '#1e293b', outline: 'none',
                                                    fontFamily: 'var(--font-display)', fontSize: '18px', fontWeight: 500, transition: 'border-color 0.2s', boxSizing: 'border-box'
                                                }}
                                            />
                                        </div>
                                        <div>
                                            <label style={{ fontSize: '16px', color: '#64748b', fontWeight: 800, display: 'block', marginBottom: '8px', fontFamily: 'var(--font-display)' }}>Lesson Type</label>
                                            <div style={{ display: 'flex', gap: '6px', background: '#f8fafc', padding: '6px', borderRadius: '16px', border: '2px solid #e2e8f0' }}>
                                                {lessonTypes.map(t => (
                                                    <button
                                                        key={t.id} onClick={() => setLessonType(t.id)}
                                                        title={t.label}
                                                        style={{
                                                            flex: lessonType === t.id ? 2 : 1, display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '8px',
                                                            padding: '12px 10px', border: 'none', borderRadius: '12px', cursor: 'pointer', fontSize: '18px',
                                                            background: lessonType === t.id ? `${activeColorHex}20` : 'transparent',
                                                            color: lessonType === t.id ? activeColorHex : '#94a3b8',
                                                            transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)', fontWeight: 800, overflow: 'hidden', whiteSpace: 'nowrap', fontFamily: 'var(--font-display)'
                                                        }}
                                                    >
                                                        <span className="material-symbols-rounded" style={{ fontSize: 24 }}>{t.icon}</span>
                                                        {lessonType === t.id && <motion.span initial={{ opacity: 0, width: 0 }} animate={{ opacity: 1, width: 'auto' }}>{t.label}</motion.span>}
                                                    </button>
                                                ))}
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                <button
                                    onClick={handleGenerate}
                                    disabled={!prompt.trim()}
                                    style={{
                                        background: prompt.trim() ? activeColorHex : '#e2e8f0',
                                        color: prompt.trim() ? 'white' : '#94a3b8',
                                        border: 'none', padding: '16px', borderRadius: '24px',
                                        fontSize: '24px', fontWeight: 800, cursor: prompt.trim() ? 'pointer' : 'not-allowed',
                                        display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '12px',
                                        fontFamily: 'var(--font-display)',
                                        boxShadow: prompt.trim() ? `0 10px 20px ${activeColorHex}40` : 'none'
                                    }}
                                >
                                    Craft lesson
                                </button>
                                <div style={{ textAlign: 'center', opacity: 0.6, fontSize: '14px', fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', fontFamily: 'var(--font-display)' }}>
                                    <span className="material-symbols-rounded" style={{ fontSize: 18 }}>info</span>
                                    AI-generated lessons may need review for perfect accuracy.
                                </div>
                            </div>

                            {/* RIGHT: Aesthetics Palette */}
                            <div style={{
                                background: 'white', border: '3px solid #e2e8f0',
                                borderRadius: '24px', padding: '24px',
                                display: 'flex', flexDirection: 'column', gap: '24px',
                                boxShadow: '0 10px 30px rgba(0,0,0,0.03)'
                            }}>
                                <div>
                                    <label style={{ fontSize: '16px', color: '#64748b', fontWeight: 800, display: 'block', marginBottom: '12px', fontFamily: 'var(--font-display)' }}>Theme Color</label>
                                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '12px' }}>
                                        {colorKeys.map(key => (
                                            <button key={key}
                                                onClick={() => setSelectedColor(key)}
                                                style={{
                                                    aspectRatio: '1', borderRadius: '50%', border: 'none', cursor: 'pointer',
                                                    background: colorValues[key], padding: 0,
                                                    boxShadow: selectedColor === key ? `0 0 0 3px white, 0 0 0 5px ${colorValues[key]}` : 'none',
                                                    transform: selectedColor === key ? 'scale(1.05)' : 'scale(1)',
                                                    transition: 'all 0.1s'
                                                }}
                                            />
                                        ))}
                                    </div>
                                </div>

                                <div>
                                    <label style={{ fontSize: '16px', color: '#64748b', fontWeight: 800, display: 'block', marginBottom: '12px', fontFamily: 'var(--font-display)' }}>Icon</label>
                                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '12px' }}>
                                        {logoOptions.map(icon => (
                                            <button key={icon}
                                                onClick={() => setSelectedLogo(icon)}
                                                style={{
                                                    aspectRatio: '1', borderRadius: '14px', cursor: 'pointer',
                                                    background: selectedLogo === icon ? `${activeColorHex}15` : '#f8fafc',
                                                    border: selectedLogo === icon ? `3px solid ${activeColorHex}` : '2px solid #e2e8f0',
                                                    color: selectedLogo === icon ? activeColorHex : '#94a3b8',
                                                    display: 'flex', justifyContent: 'center', alignItems: 'center',
                                                    transition: 'all 0.1s'
                                                }}
                                            >
                                                <span className="material-symbols-rounded material-filled" style={{ fontSize: 32 }}>{icon}</span>
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        </motion.div>
                    ) : (
                        <motion.div
                            key="library"
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: -20 }}
                            transition={{ duration: 0.25 }}
                            style={{ width: '100%', maxWidth: '960px', padding: '0 32px 32px', display: 'flex', flexDirection: 'column' }}
                        >
                            {/* Library Header */}
                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '24px' }}>
                                <div>
                                    <h2 style={{ margin: 0, fontSize: '34px', fontWeight: 900, color: '#1e293b', fontFamily: 'var(--font-display)', letterSpacing: '-0.5px' }}>
                                        Lesson Library
                                    </h2>
                                    <p style={{ margin: '4px 0 0', fontSize: '16px', color: '#94a3b8', fontWeight: 600, fontFamily: 'var(--font-display)' }}>
                                        {savedLessons.length === 0 ? 'No lessons brewed yet' : `${savedLessons.length} lesson${savedLessons.length !== 1 ? 's' : ''} saved`}
                                    </p>
                                </div>
                                {savedLessons.length > 0 && (
                                    <div style={{
                                        background: `${activeColorHex}15`, border: `2px solid ${activeColorHex}30`,
                                        borderRadius: '16px', padding: '10px 18px',
                                        display: 'flex', alignItems: 'center', gap: '8px',
                                        color: activeColorHex, fontWeight: 800, fontSize: '16px',
                                        fontFamily: 'var(--font-display)'
                                    }}>
                                        <span className="material-symbols-rounded" style={{ fontSize: 20 }}>history_edu</span>
                                        Archive
                                    </div>
                                )}
                            </div>

                            {savedLessons.length === 0 ? (
                                /* ── EMPTY STATE ── */
                                <motion.div
                                    initial={{ opacity: 0, scale: 0.96 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    transition={{ delay: 0.1, type: 'spring', stiffness: 300, damping: 25 }}
                                    style={{
                                        background: 'white', border: '3px solid #e2e8f0',
                                        borderRadius: '28px', padding: '64px 40px',
                                        display: 'flex', flexDirection: 'column', alignItems: 'center',
                                        gap: '16px', position: 'relative', overflow: 'hidden'
                                    }}
                                >
                                    {/* Decorative blobs */}
                                    <div style={{ position: 'absolute', top: '-40px', right: '-40px', width: '160px', height: '160px', borderRadius: '50%', background: `${activeColorHex}12`, pointerEvents: 'none' }} />
                                    <div style={{ position: 'absolute', bottom: '-30px', left: '-30px', width: '120px', height: '120px', borderRadius: '50%', background: `${activeColorHex}0d`, pointerEvents: 'none' }} />

                                    <motion.div
                                        animate={{ y: [0, -8, 0] }}
                                        transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
                                        style={{
                                            width: '96px', height: '96px', borderRadius: '28px',
                                            background: `${activeColorHex}12`,
                                            border: `3px dashed ${activeColorHex}30`,
                                            display: 'flex', alignItems: 'center', justifyContent: 'center'
                                        }}
                                    >
                                        <FlaskIcon size={48} color={`${activeColorHex}60`} />
                                    </motion.div>

                                    <div style={{ textAlign: 'center', zIndex: 1 }}>
                                        <h3 style={{ margin: '0', fontSize: '26px', fontWeight: 900, color: '#1e293b', fontFamily: 'var(--font-display)' }}>
                                            Empty Lab
                                        </h3>
                                        <p style={{ margin: '10px 0 0', fontSize: '17px', fontWeight: 600, color: '#94a3b8', fontFamily: 'var(--font-display)', maxWidth: '320px' }}>
                                            Head to Lesson Lab and brew your<br />first AI-powered lesson.
                                        </p>
                                    </div>

                                    <motion.button
                                        whileHover={{ scale: 1.04 }}
                                        whileTap={{ scale: 0.97 }}
                                        onClick={() => setView('lab')}
                                        style={{
                                            marginTop: '8px', padding: '14px 28px',
                                            background: activeColorHex, color: 'white', border: 'none',
                                            borderRadius: '18px', cursor: 'pointer',
                                            fontSize: '18px', fontWeight: 800, fontFamily: 'var(--font-display)',
                                            display: 'flex', alignItems: 'center', gap: '10px',
                                            boxShadow: `0 8px 24px ${activeColorHex}40`, zIndex: 1
                                        }}
                                    >
                                        <FlaskIcon size={22} color="white" filled />
                                        Open Lesson Lab
                                    </motion.button>
                                </motion.div>
                            ) : (
                                /* ── LESSON GRID ── */
                                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '16px', paddingTop: '16px', marginTop: '-16px', paddingBottom: '16px', paddingRight: '4px' }}>
                                    {savedLessons.map((lesson, idx) => {
                                        const lessonColor = colorValues[lesson.colorKey] || activeColorHex
                                        const itemCount = lesson.data?.lesson?.items?.length || 0
                                        const typeLabel = lesson.type === 'auto' ? 'Mixed Lesson'
                                            : lesson.type === 'questions' ? 'Questions'
                                                : lesson.type === 'vocab' ? 'Vocabulary'
                                                    : lesson.type === 'general' ? 'Explaination'
                                                        : lesson.type
                                        const typeIcon = lesson.type === 'auto' ? 'auto_awesome'
                                            : lesson.type === 'questions' ? 'quiz'
                                                : lesson.type === 'vocab' ? 'dictionary'
                                                    : lesson.type === 'general' ? 'auto_stories'
                                                        : 'category'

                                        // Format relative date
                                        const createdDate = new Date(lesson.createdAt)
                                        const now = new Date()
                                        const diffMs = now - createdDate
                                        const diffDays = Math.floor(diffMs / 86400000)
                                        const relDate = diffDays === 0 ? 'Today'
                                            : diffDays === 1 ? 'Yesterday'
                                                : diffDays < 7 ? `${diffDays} days ago`
                                                    : createdDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })

                                        return (
                                            <motion.div
                                                key={lesson.id}
                                                initial={{ opacity: 0, y: 20 }}
                                                animate={{ opacity: 1, y: 0 }}
                                                transition={{ delay: idx * 0.05, type: 'spring', stiffness: 300, damping: 28 }}
                                                whileHover={{ y: -4, boxShadow: `0 16px 40px ${lessonColor}25` }}
                                                onClick={() => onPlay?.(lesson.data)}
                                                style={{
                                                    background: 'white',
                                                    borderRadius: '22px',
                                                    border: '2px solid #f1f5f9',
                                                    overflow: 'hidden',
                                                    cursor: 'pointer',
                                                    position: 'relative',
                                                    boxShadow: '0 4px 12px rgba(0,0,0,0.04)',
                                                    transition: 'border-color 0.2s',
                                                    display: 'flex', flexDirection: 'column'
                                                }}
                                            >
                                                {/* Colored top strip */}
                                                <div style={{
                                                    height: '6px',
                                                    background: `linear-gradient(90deg, ${lessonColor}, ${lessonColor}88)`,
                                                    width: '100%'
                                                }} />

                                                {/* Card body */}
                                                <div style={{ padding: '18px 20px 16px', display: 'flex', flexDirection: 'column', gap: '12px', flex: 1 }}>
                                                    {/* Icon + Type badge row */}
                                                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                                                        <div style={{
                                                            width: '50px', height: '50px', borderRadius: '16px',
                                                            background: `${lessonColor}15`,
                                                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                                                            color: lessonColor, flexShrink: 0
                                                        }}>
                                                            <span className="material-symbols-rounded material-filled" style={{ fontSize: 28 }}>{lesson.logoId || 'science'}</span>
                                                        </div>

                                                        <div style={{
                                                            background: `${lessonColor}12`,
                                                            border: `1.5px solid ${lessonColor}30`,
                                                            color: lessonColor, borderRadius: '10px',
                                                            padding: '5px 10px', display: 'flex', alignItems: 'center',
                                                            gap: '5px', fontSize: '13px', fontWeight: 800,
                                                            fontFamily: 'var(--font-display)'
                                                        }}>
                                                            <span className="material-symbols-rounded" style={{ fontSize: 15 }}>{typeIcon}</span>
                                                            {typeLabel}
                                                        </div>
                                                    </div>

                                                    {/* Title */}
                                                    <div>
                                                        <h3 style={{
                                                            margin: 0, fontSize: '18px', fontWeight: 900,
                                                            color: '#1e293b', fontFamily: 'var(--font-display)',
                                                            lineHeight: 1.3, letterSpacing: '-0.2px',
                                                            display: '-webkit-box', WebkitLineClamp: 2,
                                                            WebkitBoxOrient: 'vertical', overflow: 'hidden'
                                                        }}>
                                                            {lesson.title}
                                                        </h3>
                                                    </div>

                                                    {/* Bottom meta row */}
                                                    <div style={{
                                                        marginTop: 'auto', paddingTop: '10px',
                                                        borderTop: '2px solid #f1f5f9',
                                                        display: 'flex', alignItems: 'center',
                                                        justifyContent: 'space-between'
                                                    }}>
                                                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                                            <span style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '13px', color: '#94a3b8', fontWeight: 700, fontFamily: 'var(--font-display)' }}>
                                                                <span className="material-symbols-rounded" style={{ fontSize: 15 }}>format_list_bulleted</span>
                                                                {itemCount} item{itemCount !== 1 ? 's' : ''}
                                                            </span>
                                                            <span style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '13px', color: '#94a3b8', fontWeight: 700, fontFamily: 'var(--font-display)' }}>
                                                                <span className="material-symbols-rounded" style={{ fontSize: 15 }}>schedule</span>
                                                                {relDate}
                                                            </span>
                                                        </div>

                                                        <AnimatePresence mode="wait">
                                                            {confirmDeleteId === lesson.id ? (
                                                                <motion.div
                                                                    key="confirm"
                                                                    initial={{ opacity: 0, x: 10 }}
                                                                    animate={{ opacity: 1, x: 0 }}
                                                                    exit={{ opacity: 0, x: -10 }}
                                                                    style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
                                                                >
                                                                    <span style={{ fontSize: '13px', fontWeight: 800, color: '#f87171', fontFamily: 'var(--font-display)', marginRight: '4px' }}>Sure?</span>
                                                                    <motion.button
                                                                        whileHover={{ scale: 1.1, background: '#fef2f2' }}
                                                                        whileTap={{ scale: 0.92 }}
                                                                        onClick={(e) => { e.stopPropagation(); setConfirmDeleteId(null); }}
                                                                        style={{ width: '28px', height: '28px', borderRadius: '8px', background: '#f1f5f9', border: 'none', color: '#64748b', display: 'flex', justifyContent: 'center', alignItems: 'center', cursor: 'pointer' }}
                                                                    >
                                                                        <span className="material-symbols-rounded" style={{ fontSize: 16 }}>close</span>
                                                                    </motion.button>
                                                                    <motion.button
                                                                        whileHover={{ scale: 1.1, background: '#fecaca' }}
                                                                        whileTap={{ scale: 0.92 }}
                                                                        onClick={(e) => { e.stopPropagation(); handleDelete(lesson.id); setConfirmDeleteId(null); }}
                                                                        style={{ width: '28px', height: '28px', borderRadius: '8px', background: '#fee2e2', border: 'none', color: '#ef4444', display: 'flex', justifyContent: 'center', alignItems: 'center', cursor: 'pointer' }}
                                                                    >
                                                                        <span className="material-symbols-rounded" style={{ fontSize: 16 }}>check</span>
                                                                    </motion.button>
                                                                </motion.div>
                                                            ) : (
                                                                <motion.button
                                                                    key="delete"
                                                                    initial={{ opacity: 0, x: -10 }}
                                                                    animate={{ opacity: 1, x: 0 }}
                                                                    exit={{ opacity: 0, x: 10 }}
                                                                    whileHover={{ scale: 1.1, background: '#fee2e2' }}
                                                                    whileTap={{ scale: 0.92 }}
                                                                    onClick={(e) => { e.stopPropagation(); setConfirmDeleteId(lesson.id); }}
                                                                    style={{
                                                                        width: '34px', height: '34px', borderRadius: '10px',
                                                                        background: '#fef2f2', border: 'none',
                                                                        color: '#f87171', display: 'flex',
                                                                        justifyContent: 'center', alignItems: 'center',
                                                                        cursor: 'pointer', flexShrink: 0
                                                                    }}
                                                                >
                                                                    <span className="material-symbols-rounded" style={{ fontSize: 18 }}>delete</span>
                                                                </motion.button>
                                                            )}
                                                        </AnimatePresence>
                                                    </div>
                                                </div>

                                                {/* Play overlay on hover */}
                                                <motion.div
                                                    initial={{ opacity: 0 }}
                                                    whileHover={{ opacity: 1 }}
                                                    style={{
                                                        position: 'absolute', inset: 0,
                                                        background: `${lessonColor}08`,
                                                        borderRadius: '22px',
                                                        border: `2px solid ${lessonColor}40`,
                                                        pointerEvents: 'none'
                                                    }}
                                                />
                                            </motion.div>
                                        )
                                    })}
                                </div>
                            )}
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        </motion.div>
    )
}
export default LessonCreator;

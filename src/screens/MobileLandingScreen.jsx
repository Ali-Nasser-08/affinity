import { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { colorValues, getRandomAccentExcluding } from '../engine/serotoninEngine'
import { infoSections } from '../data/content'

// Features shown as white cards
const features = [
    {
        icon: 'groups',
        titles: ['Your Classes', 'Student Roster', 'Class Management', 'Know Your Students'],
        body: 'Organise your students into classes. Give every student a name, a colour, and a logo. Track their stars across sessions.'
    },
    {
        icon: 'auto_stories',
        titles: ['Lesson Creator', 'Build Your Lessons', 'Custom Lessons', 'Teach Your Way'],
        body: 'Write and save your own lessons. Play them live in class with a built-in presenter that keeps students engaged.'
    },
    {
        icon: 'draw',
        titles: ['Canvas', 'Live Drawing Board', 'Explain Visually', 'Sketch & Teach'],
        body: 'An infinite whiteboard for live explanations. Draw, annotate, and illustrate ideas right in front of your class.'
    },
    {
        icon: 'quiz',
        titles: ['Questions & Revision', 'Test Your Class', 'Practice Mode', 'Quick Fire Rounds'],
        body: 'Vocabulary and grammar question banks built in. Run revision rounds or quick-fire quizzes with one tap.'
    },
    {
        icon: 'self_improvement',
        titles: ['Breathing Tools', 'Reset the Room', 'Calm the Class', 'Teacher Wellness'],
        body: 'Built-in guided breathing exercises. Settle the class or reset yourself between sessions.'
    },
    {
        icon: 'menu_book',
        titles: ['Vocabulary Builder', 'Word Banks', 'Vocab by Unit', 'Learn the Words'],
        body: 'Unit-by-unit vocabulary banks from the curriculum. Present new words, run drills, and build retention across the term.'
    },
    {
        icon: 'rule',
        titles: ['Grammar Lessons', 'Grammar Explainer', 'Rules Made Clear', 'Grammar in Context'],
        body: 'Structured grammar explanations with examples and interactive questions. Walk students through rules step by step on the big screen.'
    },
    {
        icon: 'palette',
        titles: ['Serotonin Engine', 'Color-Driven UX', 'Designed to Engage', 'Alive with Color'],
        body: 'A custom color and motion system that keeps the room visually alive — without distraction. Every color shift is intentional.'
    }
]

// All accent keys in order for staggered blobs
const accentKeys = Object.keys(colorValues)

function useIsMobile() {
    const [isMobile, setIsMobile] = useState(window.innerWidth < 768)
    useEffect(() => {
        const handler = () => setIsMobile(window.innerWidth < 768)
        window.addEventListener('resize', handler)
        return () => window.removeEventListener('resize', handler)
    }, [])
    return isMobile
}

export function MobileLandingScreen() {
    const [accent, setAccent] = useState('cyan')
    const accentRef = useRef('cyan')

    // Each card has its own title cycling state
    const allTitles = [
        ...infoSections.map(s => s.titles),
        ...features.map(f => f.titles)
    ]
    const totalCards = allTitles.length

    const [titleIndices, setTitleIndices] = useState(new Array(totalCards).fill(0))
    const [charCounts, setCharCounts] = useState(() => allTitles.map(t => t[0].length))
    const [isDeleting, setIsDeleting] = useState(false)
    const [cycleCount, setCycleCount] = useState(0)

    // Typewriter effect shared across all cards
    useEffect(() => {
        const maxLength = Math.max(...allTitles.map((titles, i) => titles[titleIndices[i]].length))
        const currentMax = Math.max(...charCounts)
        let timeout

        if (!isDeleting) {
            if (currentMax < maxLength) {
                timeout = setTimeout(() => {
                    setCharCounts(prev => prev.map((c, i) => {
                        const target = allTitles[i][titleIndices[i]]
                        return Math.min(c + 1, target.length)
                    }))
                }, 65)
            } else {
                const pause = cycleCount === 0 ? 1500 : 2800
                timeout = setTimeout(() => setIsDeleting(true), pause)
            }
        } else {
            if (currentMax > 0) {
                timeout = setTimeout(() => {
                    setCharCounts(prev => prev.map(c => Math.max(0, c - 1)))
                }, 22)
            } else {
                setIsDeleting(false)
                setTitleIndices(prev => prev.map((idx, i) => (idx + 1) % allTitles[i].length))
                setCycleCount(c => c + 1)
                const next = getRandomAccentExcluding(accentRef.current)
                accentRef.current = next
                setAccent(next)
            }
        }
        return () => clearTimeout(timeout)
    }, [charCounts, isDeleting, titleIndices, cycleCount])

    const displayedTitles = allTitles.map((titles, i) =>
        titles[titleIndices[i]].slice(0, charCounts[i])
    )

    const color = colorValues[accent]

    const cardVariants = {
        hidden: { opacity: 0, y: 40 },
        visible: (i) => ({ opacity: 1, y: 0, transition: { delay: 0.15 + i * 0.08, duration: 0.5, ease: 'easeOut' } })
    }

    return (
        <div style={{
            minHeight: '100dvh',
            width: '100%',
            background: color,
            transition: 'background 0.8s ease',
            overflowX: 'hidden',
            position: 'relative',
            fontFamily: 'Fredoka, sans-serif'
        }}>
            {/* Subtle blobs */}
            <div style={{ position: 'fixed', inset: 0, pointerEvents: 'none', overflow: 'hidden', zIndex: 0 }}>
                {[0, 1, 2].map(i => (
                    <motion.div
                        key={i}
                        animate={{
                            x: [0, 20, -15, 10, 0],
                            y: [0, -20, 15, -10, 0],
                            scale: [1, 1.07, 0.95, 1.03, 1]
                        }}
                        transition={{ duration: 14 + i * 5, repeat: Infinity, ease: 'easeInOut' }}
                        style={{
                            position: 'absolute',
                            borderRadius: '50%',
                            background: `radial-gradient(circle, rgba(255,255,255,0.18) 0%, transparent 70%)`,
                            width: i === 0 ? '70vw' : i === 1 ? '55vw' : '45vw',
                            height: i === 0 ? '70vw' : i === 1 ? '55vw' : '45vw',
                            top: i === 0 ? '-15vw' : i === 1 ? '40vh' : '70vh',
                            left: i === 0 ? '-20vw' : i === 1 ? '30vw' : '-10vw',
                            filter: 'blur(24px)'
                        }}
                    />
                ))}
            </div>

            {/* Scrollable content */}
            <div style={{ position: 'relative', zIndex: 1, padding: '0 20px 60px' }}>

                {/* Header */}
                <motion.div
                    initial={{ opacity: 0, y: -30 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.7 }}
                    style={{ textAlign: 'center', paddingTop: '72px', paddingBottom: '16px' }}
                >
                    <div style={{
                        fontSize: 72,
                        fontWeight: 700,
                        color: 'white',
                        letterSpacing: '-1px',
                        lineHeight: 1,
                        textShadow: '0 4px 24px rgba(0,0,0,0.15)'
                    }}>
                        Affinity
                    </div>
                    <div style={{
                        marginTop: 14,
                        fontSize: 18,
                        fontWeight: 500,
                        color: 'rgba(255,255,255,0.9)',
                        letterSpacing: '0.3px'
                    }}>
                        A live classroom tool for English teachers
                    </div>
                </motion.div>

                {/* Divider pill */}
                <motion.div
                    initial={{ scaleX: 0 }}
                    animate={{ scaleX: 1 }}
                    transition={{ delay: 0.4, duration: 0.6 }}
                    style={{
                        width: 60, height: 4, borderRadius: 99,
                        background: 'rgba(255,255,255,0.55)',
                        margin: '28px auto 40px'
                    }}
                />

                {/* About sections (from infoSections) */}
                {infoSections.map((section, i) => (
                    <motion.div
                        key={`info-${i}`}
                        custom={i}
                        initial="hidden"
                        animate="visible"
                        variants={cardVariants}
                        style={{
                            background: 'white',
                            borderRadius: 24,
                            padding: '28px 24px',
                            marginBottom: 20,
                            boxShadow: '0 8px 32px rgba(0,0,0,0.12)'
                        }}
                    >
                        <h3 style={{
                            fontSize: 22,
                            fontWeight: 700,
                            color: color,
                            marginBottom: 12,
                            transition: 'color 0.8s ease',
                            minHeight: 32,
                            display: 'flex',
                            alignItems: 'center',
                            gap: 6
                        }}>
                            {displayedTitles[i]}
                            <span style={{
                                display: 'inline-block',
                                width: 2,
                                height: 20,
                                background: color,
                                borderRadius: 2,
                                animation: 'blink 0.8s infinite',
                                transition: 'background 0.8s ease',
                                flexShrink: 0
                            }} />
                        </h3>
                        <p style={{
                            fontSize: 16,
                            lineHeight: 1.65,
                            color: '#555',
                            fontWeight: 500,
                            margin: 0
                        }}>
                            {section.content}
                        </p>
                    </motion.div>
                ))}

                {/* Section label */}
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.6 }}
                    style={{
                        textAlign: 'center',
                        color: 'rgba(255,255,255,0.8)',
                        fontSize: 13,
                        fontWeight: 600,
                        textTransform: 'uppercase',
                        letterSpacing: 2,
                        margin: '36px 0 24px'
                    }}
                >
                    What's inside
                </motion.div>

                {/* Feature cards */}
                {features.map((feat, i) => {
                    const cardIndex = infoSections.length + i
                    return (
                        <motion.div
                            key={`feat-${i}`}
                            custom={infoSections.length + i}
                            initial="hidden"
                            animate="visible"
                            variants={cardVariants}
                            style={{
                                background: 'white',
                                borderRadius: 24,
                                padding: '24px 22px',
                                marginBottom: 18,
                                boxShadow: '0 8px 32px rgba(0,0,0,0.10)'
                            }}
                        >
                            <div style={{ display: 'flex', alignItems: 'flex-start', gap: 14 }}>
                                <div style={{
                                    width: 44, height: 44, borderRadius: 14, flexShrink: 0,
                                    background: `${color}18`,
                                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                                    transition: 'background 0.8s ease'
                                }}>
                                    <span className="material-symbols-rounded" style={{
                                        fontSize: 24,
                                        color: color,
                                        fontVariationSettings: "'FILL' 1",
                                        transition: 'color 0.8s ease'
                                    }}>
                                        {feat.icon}
                                    </span>
                                </div>
                                <div style={{ flex: 1, minWidth: 0 }}>
                                    <h3 style={{
                                        fontSize: 19,
                                        fontWeight: 700,
                                        color: color,
                                        marginBottom: 8,
                                        transition: 'color 0.8s ease',
                                        minHeight: 28,
                                        display: 'flex', alignItems: 'center', gap: 5
                                    }}>
                                        {displayedTitles[cardIndex]}
                                        <span style={{
                                            display: 'inline-block',
                                            width: 2, height: 17,
                                            background: color,
                                            borderRadius: 2,
                                            animation: 'blink 0.8s infinite',
                                            transition: 'background 0.8s ease',
                                            flexShrink: 0
                                        }} />
                                    </h3>
                                    <p style={{
                                        fontSize: 15,
                                        lineHeight: 1.6,
                                        color: '#555',
                                        fontWeight: 500,
                                        margin: 0
                                    }}>
                                        {feat.body}
                                    </p>
                                </div>
                            </div>
                        </motion.div>
                    )
                })}

                {/* Desktop CTA */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 1.2 }}
                    style={{
                        marginTop: 48,
                        background: 'rgba(255,255,255,0.18)',
                        backdropFilter: 'blur(12px)',
                        borderRadius: 24,
                        padding: '32px 24px',
                        textAlign: 'center',
                        border: '2px solid rgba(255,255,255,0.35)'
                    }}
                >
                    <span className="material-symbols-rounded" style={{
                        fontSize: 48, color: 'white',
                        fontVariationSettings: "'FILL' 1",
                        display: 'block', marginBottom: 14
                    }}>
                        laptop_mac
                    </span>
                    <div style={{ fontSize: 20, fontWeight: 700, color: 'white', marginBottom: 8 }}>
                        Built for the classroom screen
                    </div>
                    <div style={{ fontSize: 15, color: 'rgba(255,255,255,0.85)', lineHeight: 1.6, fontWeight: 500 }}>
                        Affinity is designed for desktop use during live lessons. Open it on your laptop or classroom computer to get started.
                    </div>
                </motion.div>

                {/* Footer */}
                <div style={{
                    marginTop: 48,
                    textAlign: 'center',
                    color: 'rgba(255,255,255,0.55)',
                    fontSize: 13,
                    fontWeight: 500
                }}>
                    © Affinity English · Designed by Ali Alghamdi
                </div>
            </div>
        </div>
    )
}

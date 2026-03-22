import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { colorValues, getRandomAccentExcluding } from '../engine/serotoninEngine'
import { infoSections } from '../data/content'
import { BackArrow } from '../components/BackArrow'

export function InfoScreen({ onBack, onAccentChange, userName, setUserName }) {
    const [titleIndices, setTitleIndices] = useState([0, 0, 0, 0])
    const [charCount, setCharCount] = useState([0, 0, 0, 0])
    const [isDeleting, setIsDeleting] = useState(false)
    const isStructured = localStorage.getItem('app_structured_mode') === 'true'
    const structuredColor = localStorage.getItem('app_structured_color') || 'cyan'
    const [accent, setAccent] = useState(isStructured ? structuredColor : 'cyan')

    // Typewriter effect for all titles simultaneously
    useEffect(() => {
        if (isStructured) {
            setCharCount(infoSections.map(s => s.titles[0].length))
            return
        }

        const maxLength = Math.max(...infoSections.map((s, i) => s.titles[titleIndices[i]].length))
        const currentMaxDisplay = Math.max(...charCount)

        let timeout

        if (!isDeleting) {
            // Writing phase
            if (currentMaxDisplay < maxLength) {
                timeout = setTimeout(() => {
                    setCharCount(prev => prev.map((c, i) => {
                        const target = infoSections[i].titles[titleIndices[i]]
                        return Math.min(c + 1, target.length)
                    }))
                }, 70)
            } else {
                // Finished writing - pause then start deleting
                timeout = setTimeout(() => setIsDeleting(true), 2500)
            }
        } else {
            // Deleting phase
            if (currentMaxDisplay > 0) {
                timeout = setTimeout(() => {
                    setCharCount(prev => prev.map(c => Math.max(0, c - 1)))
                }, 25)
            } else {
                // Finished deleting - change color and move to next titles
                setIsDeleting(false)
                setTitleIndices(prev => prev.map((idx, i) => (idx + 1) % infoSections[i].titles.length))
                setAccent(getRandomAccentExcluding(accent))
            }
        }

        return () => clearTimeout(timeout)
    }, [charCount, isDeleting, titleIndices, accent])

    // Get displayed titles
    const displayedTitles = infoSections.map((s, i) =>
        s.titles[titleIndices[i]].slice(0, charCount[i])
    )

    // Sync global accent
    useEffect(() => {
        onAccentChange?.(accent)
    }, [accent, onAccentChange])

    return (
        <motion.div
            className="idle-container"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            style={{
                height: '100%',
                overflowY: 'auto'
            }}
        >
            <BackArrow onClick={onBack} color={accent} />

            <div style={{
                maxWidth: 900,
                margin: '0 auto',
                padding: '100px 50px 60px'
            }}>
                <motion.div
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    style={{ textAlign: 'center', marginBottom: 20 }}
                >
                    <label style={{
                        display: 'block',
                        fontSize: 16,
                        marginBottom: 8,
                        opacity: 0.7,
                        fontFamily: 'var(--font-display)',
                        letterSpacing: 1
                    }}>YOUR NAME</label>
                    <input
                        type="text"
                        value={userName || ''}
                        onChange={(e) => setUserName(e.target.value)}
                        placeholder="Enter your name"
                        style={{
                            fontSize: 32,
                            textAlign: 'center',
                            background: 'transparent',
                            border: 'none',
                            borderBottom: `2px solid ${colorValues[accent]}`,
                            color: colorValues[accent],
                            fontFamily: 'var(--font-display)',
                            outline: 'none',
                            width: '100%',
                            maxWidth: 300,
                            padding: '4px 0'
                        }}
                    />
                </motion.div>

                <motion.h1
                    initial={{ y: -20, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    style={{
                        fontSize: 64,
                        color: colorValues[accent],
                        marginBottom: 60,
                        textAlign: 'center',
                        fontFamily: 'var(--font-display)'
                    }}
                >
                    About This App
                </motion.h1>

                {infoSections.map((section, i) => (
                    <motion.div
                        key={i}
                        initial={{ y: 30, opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        transition={{ delay: 0.1 * i }}
                        style={{ marginBottom: 50 }}
                    >
                        <h2 style={{
                            fontSize: 38,
                            color: colorValues[accent],
                            marginBottom: 16,
                            fontFamily: 'var(--font-display)',
                            display: 'flex',
                            alignItems: 'center',
                            gap: 10,
                            height: 60,
                            lineHeight: '60px',
                            overflow: 'hidden'
                        }}>
                            {displayedTitles[i]}
                            <span
                                style={{
                                    width: 4,
                                    height: 36,
                                    backgroundColor: colorValues[accent],
                                    display: 'inline-block',
                                    animation: 'blink 0.8s infinite'
                                }}
                            />
                        </h2>
                        <p style={{
                            fontSize: 24,
                            lineHeight: 1.8,
                            opacity: 0.85,
                            color: 'inherit'
                        }}>
                            {section.content}
                        </p>
                    </motion.div>
                ))}
            </div>
        </motion.div>
    )
}

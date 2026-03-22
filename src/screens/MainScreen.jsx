import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useAnimatedTitle } from '../hooks/useAnimatedTitle'
import { colorValues, lightTints, textColors } from '../engine/serotoninEngine'
import { CardSparkles } from '../components/CardSparkles'

export function MainScreen({ onNavigate, onAccentChange, isDarkMode, userName, selectedBook, onBookChange }) {
    const { title, color } = useAnimatedTitle({
        onColorChange: onAccentChange,
        initialColor: 'cyan',
        userName
    })

    const [isBookMenuOpen, setIsBookMenuOpen] = useState(false)

    const accent = colorValues[color]
    const neutralBase = isDarkMode ? 'rgba(255,255,255,0.07)' : lightTints[color]
    const neutralHover = isDarkMode ? `${accent}1f` : `${accent}22`

    const neutralCardVars = {
        '--card-bg': neutralBase,
        '--card-bg-hover': neutralHover,
        '--card-border': accent,
        '--card-text': textColors[color],
        '--card-shadow': `${accent}30`,
        '--card-glow': `${accent}45`,
        '--card-highlight': `${accent}55`,
        '--card-sheen': `${accent}66`
    }

    const solidCardVars = {
        '--card-bg': accent,
        '--card-bg-hover': `${accent}e6`,
        '--card-border': accent,
        '--card-text': 'white',
        '--card-shadow': `${textColors[color]}55`,
        '--card-glow': `${accent}55`,
        '--card-highlight': 'rgba(255,255,255,0.35)',
        '--card-sheen': 'rgba(255,255,255,0.5)'
    }

    const iconBaseStyle = {
        width: 120,
        height: 120,
        borderRadius: '50%',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        transition: 'background-color 700ms ease, transform 300ms ease'
    }

    const actionVars = {
        '--neo-bg': isDarkMode ? 'rgba(255,255,255,0.12)' : `${accent}1f`,
        '--neo-bg-hover': isDarkMode ? `${accent}2a` : `${accent}2b`,
        '--neo-border': accent,
        '--neo-shadow': `${accent}35`,
        '--neo-glow': `${accent}55`,
        '--neo-icon': isDarkMode ? '#ffffff' : textColors[color]
    }

    return (
        <motion.div
            className="main-content main-screen"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
        >
            <div className="neo-top-left-actions">
                <motion.button
                    type="button"
                    className="neo-action"
                    style={{
                        ...actionVars,
                        position: 'relative',
                        width: 'auto',
                        padding: '0 24px',
                        fontFamily: 'var(--font-display)',
                        fontSize: '18px',
                        fontWeight: '700',
                        gap: '8px'
                    }}
                    whileHover={{ y: -4, scale: 1.04, transition: { type: 'spring', stiffness: 240, damping: 20, mass: 0.6 } }}
                    whileTap={{ y: 1, scale: 0.97 }}
                    onClick={() => setIsBookMenuOpen(!isBookMenuOpen)}
                >
                    <span className="material-symbols-rounded" style={{ fontSize: 22 }}>menu_book</span>
                    {selectedBook || 'Mega Goal 1'}
                    <span className="material-symbols-rounded" style={{
                        fontSize: 20,
                        marginLeft: '4px',
                        opacity: 0.7,
                        transform: isBookMenuOpen ? 'rotate(180deg)' : 'rotate(0deg)',
                        transition: 'transform 0.3s ease'
                    }}>expand_more</span>
                </motion.button>

                <AnimatePresence>
                    {isBookMenuOpen && (
                        <motion.div
                            initial={{ opacity: 0, y: -10, scale: 0.95 }}
                            animate={{ opacity: 1, y: 0, scale: 1 }}
                            exit={{ opacity: 0, y: -10, scale: 0.95 }}
                            transition={{ type: 'spring', stiffness: 300, damping: 25 }}
                            style={{
                                position: 'absolute',
                                top: 'calc(100% + 12px)',
                                left: 0,
                                background: actionVars['--neo-bg'],
                                border: `2px solid ${actionVars['--neo-border']}`,
                                borderRadius: '16px',
                                padding: '8px',
                                display: 'flex',
                                flexDirection: 'column',
                                gap: '8px',
                                minWidth: '220px',
                                zIndex: 100,
                                backdropFilter: 'blur(20px)',
                                WebkitBackdropFilter: 'blur(20px)',
                                boxShadow: `0 8px 32px ${actionVars['--neo-shadow']}`
                            }}
                        >
                            {[2, 3].map(num => (
                                <div
                                    key={`mg${num}`}
                                    style={{
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'space-between',
                                        padding: '12px 16px',
                                        borderRadius: '10px',
                                        background: isDarkMode ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.03)',
                                        color: actionVars['--neo-icon'],
                                        fontFamily: 'var(--font-display)',
                                        fontWeight: '600',
                                        fontSize: '16px',
                                        opacity: 0.6,
                                        cursor: 'not-allowed'
                                    }}
                                >
                                    <span>Mega Goal {num}</span>
                                    <span style={{
                                        fontSize: '10px',
                                        fontWeight: '800',
                                        textTransform: 'uppercase',
                                        background: actionVars['--neo-border'],
                                        color: isDarkMode ? '#000' : '#fff',
                                        padding: '4px 8px',
                                        borderRadius: '20px',
                                        letterSpacing: '0.5px'
                                    }}>
                                        Soon
                                    </span>
                                </div>
                            ))}
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>

            <div className="neo-top-actions">
                <motion.button
                    type="button"
                    className="neo-action"
                    style={actionVars}
                    whileHover={{ y: -4, scale: 1.06, transition: { type: 'spring', stiffness: 240, damping: 20, mass: 0.6 } }}
                    whileTap={{ y: 1, scale: 0.97 }}
                    onClick={() => onNavigate('settings', color)}
                >
                    <motion.span
                        className="neo-action-icon"
                        whileHover={{ rotate: 18, scale: 1.05 }}
                        transition={{ type: 'spring', stiffness: 240, damping: 18, mass: 0.6 }}
                    >
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                            <circle cx="12" cy="12" r="3.2" />
                            <path d="M19.4 15a1.6 1.6 0 0 0 .3 1.8l.1.1a2 2 0 0 1-2.9 2.9l-.1-.1a1.6 1.6 0 0 0-1.8-.3 1.6 1.6 0 0 0-1 1.4V21a2 2 0 0 1-4 0v-.2a1.6 1.6 0 0 0-1-1.4 1.6 1.6 0 0 0-1.8.3l-.1.1a2 2 0 0 1-2.9-2.9l.1-.1a1.6 1.6 0 0 0 .3-1.8 1.6 1.6 0 0 0-1.4-1H3a2 2 0 0 1 0-4h.2a1.6 1.6 0 0 0 1.4-1 1.6 1.6 0 0 0-.3-1.8l-.1-.1a2 2 0 0 1 2.9-2.9l.1.1a1.6 1.6 0 0 0 1.8.3H9a1.6 1.6 0 0 0 1-1.4V3a2 2 0 0 1 4 0v.2a1.6 1.6 0 0 0 1 1.4 1.6 1.6 0 0 0 1.8-.3l.1-.1a2 2 0 0 1 2.9 2.9l-.1.1a1.6 1.6 0 0 0-.3 1.8V9c0 .7.4 1.2 1 1.4H21a2 2 0 0 1 0 4h-.2a1.6 1.6 0 0 0-1.4 1z" />
                        </svg>
                    </motion.span>
                </motion.button>
            </div>

            {title}

            <div className="home-menu-grid">
                <motion.div
                    className="menu-item"
                    animate={{ y: [0, -4, 0] }}
                    transition={{ duration: 4.8, repeat: Infinity, ease: 'easeInOut', repeatType: 'mirror' }}
                >
                    <motion.button
                        type="button"
                        className="premium-button"
                        style={neutralCardVars}
                        whileHover={{ y: -6, scale: 1.03, transition: { type: 'spring', stiffness: 240, damping: 22, mass: 0.6 } }}
                        whileTap={{ scale: 0.985 }}
                        onClick={() => onNavigate('grammar-units', color)}
                    >
                        <CardSparkles color={color} />
                        <motion.div
                            style={{ ...iconBaseStyle, background: `${colorValues[color]}1a` }}
                            whileHover={{ scale: 1.08, rotate: -3 }}
                        >
                            <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke={colorValues[color]} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" style={{ transition: 'stroke 700ms ease' }}>
                                <path d="M4 4h12a4 4 0 0 1 4 4v12H8a4 4 0 0 0-4 4V4z" />
                                <path d="M8 8h8M8 12h8M8 16h5" />
                            </svg>
                        </motion.div>
                        <div style={{ textAlign: 'center' }}>
                            <div style={{ fontSize: 34, fontWeight: 700, fontFamily: 'var(--font-display)' }}>Grammar</div>
                            <div style={{ fontSize: 18, opacity: 0.7 }}>Master the rules</div>
                        </div>
                    </motion.button>
                </motion.div>

                <motion.div
                    className="menu-item"
                    animate={{ y: [0, -6, 0] }}
                    transition={{ duration: 4.2, repeat: Infinity, ease: 'easeInOut', repeatType: 'mirror', delay: 0.2 }}
                >
                    <motion.button
                        type="button"
                        className="premium-button"
                        style={solidCardVars}
                        whileHover={{ y: -8, scale: 1.035, transition: { type: 'spring', stiffness: 240, damping: 22, mass: 0.6 } }}
                        whileTap={{ scale: 0.985 }}
                        onClick={() => onNavigate('revise-menu', color)}
                    >
                        <CardSparkles color={color} />
                        <motion.div
                            style={{ ...iconBaseStyle, background: 'rgba(255,255,255,0.22)' }}
                            whileHover={{ scale: 1.08, rotate: 4 }}
                        >
                            <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" style={{ transition: 'stroke 700ms ease' }}>
                                <path d="M3 12a9 9 0 1 0 3-6.7" />
                                <path d="M3 4v5h5" />
                                <path d="M12 7v6l4 2" />
                            </svg>
                        </motion.div>
                        <div style={{ textAlign: 'center' }}>
                            <div style={{ fontSize: 34, fontWeight: 700, fontFamily: 'var(--font-display)' }}>Revise</div>
                            <div style={{ fontSize: 18, opacity: 0.85 }}>Test your knowledge</div>
                        </div>
                    </motion.button>
                </motion.div>

                <motion.div
                    className="menu-item"
                    animate={{ y: [0, -3, 0] }}
                    transition={{ duration: 5, repeat: Infinity, ease: 'easeInOut', repeatType: 'mirror', delay: 0.35 }}
                >
                    <motion.button
                        type="button"
                        className="premium-button"
                        style={neutralCardVars}
                        whileHover={{ y: -6, scale: 1.03, transition: { type: 'spring', stiffness: 240, damping: 22, mass: 0.6 } }}
                        whileTap={{ scale: 0.985 }}
                        onClick={() => onNavigate('vocab-units', color)}
                    >
                        <CardSparkles color={color} />
                        <motion.div
                            style={{ ...iconBaseStyle, background: `${colorValues[color]}1a` }}
                            whileHover={{ scale: 1.08, rotate: 2 }}
                        >
                            <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke={colorValues[color]} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" style={{ transition: 'stroke 700ms ease' }}>
                                <path d="M4 5h7a3 3 0 0 1 3 3v11H7a3 3 0 0 0-3 3V5z" />
                                <path d="M14 5h6v16h-6" />
                                <path d="M9 9h3M9 13h3M9 17h3" />
                            </svg>
                        </motion.div>
                        <div style={{ textAlign: 'center' }}>
                            <div style={{ fontSize: 34, fontWeight: 700, fontFamily: 'var(--font-display)' }}>Vocab</div>
                            <div style={{ fontSize: 18, opacity: 0.7 }}>Learn new words</div>
                        </div>
                    </motion.button>
                </motion.div>
            </div>

            <div className="main-bottom-bar">
                <button
                    className="bar-primary"
                    style={{
                        borderColor: colorValues[color],
                        '--bar-accent': colorValues[color],
                        '--bar-base-bg': 'white',
                        '--bar-base-text': colorValues[color],
                        '--bar-shadow': `${colorValues[color]}33`
                    }}
                    onClick={() => onNavigate('students', color)}
                >
                    {(userName ? `${userName}'s class` : 'Your class')}
                </button>

                <div style={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '11px',
                    opacity: 0.8,
                    color: colorValues[color],
                    fontFamily: 'var(--font-display)',
                    lineHeight: 1.3,
                    textAlign: 'center',
                    flex: 1
                }}>
                    <div style={{ fontWeight: 600 }}>&copy; Affinity English. Designed by Ali Alghamdi. All rights reserved.</div>
                    <div>Version 0.0.1 Beta</div>
                </div>

                <div className="bar-actions">
                    <button
                        className="bar-secondary"
                        style={{
                            borderColor: colorValues[color],
                            '--bar-accent': colorValues[color],
                            '--bar-base-bg': 'white',
                            '--bar-base-text': colorValues[color],
                            '--bar-shadow': `${colorValues[color]}2b`,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: '6px'
                        }}
                        onClick={() => onNavigate('canvas', color)}
                        title="Canvas"
                    >
                        <span className="material-symbols-rounded material-filled" style={{ fontSize: 24 }}>palette</span>
                        <span>Canvas</span>
                    </button>
                    <button
                        className="bar-secondary"
                        style={{
                            borderColor: colorValues[color],
                            '--bar-accent': colorValues[color],
                            '--bar-base-bg': 'white',
                            '--bar-base-text': colorValues[color],
                            '--bar-shadow': `${colorValues[color]}2b`,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: '6px'
                        }}
                        onClick={() => onNavigate('lesson-creator', color)}
                        title="Lesson Lab"
                    >
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M17.1 14C15 12.5 9 15.5 6.9 14L4.5 17.5a2 2 0 0 0 1.73 3h11.54a2 2 0 0 0 1.73-3Z" fill="currentColor" stroke="none" />
                            <path d="M12 7.5C12 7.5 10.5 9 10.5 10.5C10.5 11.33 11.17 12 12 12C12.83 12 13.5 11.33 13.5 10.5C13.5 9 12 7.5 12 7.5Z" fill="currentColor" stroke="none" />
                            <path d="M9 3h6" />
                            <path d="M10 3v6.5L4.5 17.5a2 2 0 001.73 3h11.54a2 2 0 001.73-3L14 9.5V3" />
                        </svg>
                        <span>Lab</span>
                    </button>
                    <button
                        className="bar-secondary"
                        style={{
                            borderColor: colorValues[color],
                            '--bar-accent': colorValues[color],
                            '--bar-base-bg': 'white',
                            '--bar-base-text': colorValues[color],
                            '--bar-shadow': `${colorValues[color]}2b`,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: '6px'
                        }}
                        onClick={() => onNavigate('idle', color)}
                    >
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                            <path d="M12 3c.132 0 .263 0 .393 0a7.5 7.5 0 0 0 7.92 12.446a9 9 0 1 1-8.313-12.454z" />
                        </svg>
                        <span>Idle</span>
                    </button>
                    <button
                        className="bar-secondary"
                        style={{
                            borderColor: colorValues[color],
                            '--bar-accent': colorValues[color],
                            '--bar-base-bg': 'white',
                            '--bar-base-text': colorValues[color],
                            '--bar-shadow': `${colorValues[color]}2b`,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: '6px'
                        }}
                        onClick={() => onNavigate('breathing', color)}
                    >
                        <span className="material-symbols-rounded" style={{ fontSize: 24 }}>air</span>
                        <span>Breathing</span>
                    </button>
                </div>
            </div>
        </motion.div >
    )
}

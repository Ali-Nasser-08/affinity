import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { colorValues, getRandomAccentExcluding, textColors, lightTints } from '../engine/serotoninEngine'
import { BackArrow } from '../components/BackArrow'
import { infoSections } from '../data/content'
import { useStudents } from '../hooks/useStudents'

// ============================================================
// AFFINITY PARTICLE ANIMATION (PRESERVED)
// ============================================================
function hexToRgba(hex, alpha = 0.15) {
    if (!hex || typeof hex !== 'string' || hex[0] !== '#') return hex
    const r = parseInt(hex.slice(1, 3), 16)
    const g = parseInt(hex.slice(3, 5), 16)
    const b = parseInt(hex.slice(5, 7), 16)
    return `rgba(${r}, ${g}, ${b}, ${alpha})`
}

const Particle = ({ color }) => {
    // Increased randomness for "entropy" effect
    const angle = Math.random() * 360
    const distance = 50 + Math.random() * 200 // Much wider spread
    const size = 3 + Math.random() * 7       // Varied sizes (max 10px)
    const duration = 1.0 + Math.random() * 2.0 // Last longer (1s to 3s)
    // Random chaotic offset for end position
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
                rotate: Math.random() * 720 - 360 // Spin while moving
            }}
            transition={{
                duration: duration,
                ease: "easeOut",
            }}
            style={{
                position: 'absolute',
                top: '50%',
                left: '50%',
                width: size,
                height: size,
                borderRadius: '50%',
                backgroundColor: color,
                boxShadow: `0 0 ${size * 1.5}px ${color}`, // Glow proportional to size
                zIndex: 0,
                pointerEvents: 'none'
            }}
        />
    )
}

// ============================================================
// UNIFIED BADGE (MATCHING GRAMMAR CARD PLAYER)
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
                border: `2px solid ${colorValue}`,
                padding: '6px 14px',
                borderRadius: '12px',
                fontWeight: 700,
                fontSize: '0.85em',
                whiteSpace: 'nowrap',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '6px',
                boxShadow: `0 2px 8px ${colorValue}20`
            }}
        >
            {icon && (
                <span className="material-symbols-rounded" style={{
                    fontSize: 18,
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
// SETTINGS CARD (MATCHING GRAMMAR CARD PLAYER STYLE)
// ============================================================
function SettingsCard({ title, icon, accentColor, children, delay = 0 }) {
    const colorValue = colorValues[accentColor]

    return (
        <motion.div
            initial={{ y: 30, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay, type: 'spring', stiffness: 200, damping: 25 }}
            style={{
                background: 'white',
                borderRadius: '24px',
                padding: '28px',
                boxShadow: `0 20px 60px ${colorValue}15, 0 8px 25px rgba(0,0,0,0.08)`,
                border: `2px solid ${colorValue}20`,
                display: 'flex',
                flexDirection: 'column',
                gap: '24px'
            }}
        >
            {/* Card Header */}
            <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                paddingBottom: '16px',
                borderBottom: `2px solid ${colorValue}15`
            }}>
                <span className="material-symbols-rounded" style={{
                    fontSize: 32,
                    color: colorValue,
                    fontVariationSettings: "'FILL' 1"
                }}>
                    {icon}
                </span>
                <h2 style={{
                    fontSize: '28px',
                    fontWeight: 700,
                    fontFamily: 'var(--font-display)',
                    color: colorValue,
                    margin: 0
                }}>
                    {title}
                </h2>
            </div>

            {/* Card Content */}
            {children}
        </motion.div>
    )
}

// ============================================================
// MAIN SETTINGS SCREEN
// ============================================================
export function SettingsScreen({
    onBack,
    onAccentChange,
    userName,
    onNameChange,
    isDarkMode,
    onToggleDarkMode,
    initialAccent,
    onNavigate,
    cursorEnabled,
    onToggleCursor,
    cursorColor,
    onCursorColorChange,
    cursorSize,
    onCursorSizeChange,
    structuredMode,
    onToggleStructuredMode,
    structuredColor,
    onStructuredColorChange,
    colorBlindMode,
    onColorBlindModeChange,
    dyslexiaMode,
    onDyslexiaModeChange,
    authUser,
    onSignOut
}) {
    // --- Affinity Reaction State ---
    const [exploding, setExploding] = useState(false)
    const [cycleCount, setCycleCount] = useState(0)

    // --- Info / Sections State ---
    const [titleIndices, setTitleIndices] = useState(new Array(infoSections.length).fill(0))
    // Initialize text fully typed so it can sit before deleting
    const [charCount, setCharCount] = useState(() => infoSections.map(s => s.titles[0].length))
    const [isDeletingInfo, setIsDeletingInfo] = useState(false)

    // Shared accent state
    const [internalAccent, setInternalAccent] = useState(initialAccent || 'cyan')
    const accent = structuredMode ? structuredColor : internalAccent

    const {
        classes,
        addClass,
        deleteClass,
        renameClass
    } = useStudents()

    // --- Info Sections Typewriter Effect ---
    useEffect(() => {
        const maxLength = Math.max(...infoSections.map((s, i) => s.titles[titleIndices[i]].length))
        const currentMaxDisplay = Math.max(...charCount)

        let timeout

        if (structuredMode) {
            setCharCount(prev => prev.map((_, i) => infoSections[i].titles[titleIndices[i]].length))
            return
        }

        if (!isDeletingInfo) {
            if (currentMaxDisplay < maxLength) {
                timeout = setTimeout(() => {
                    setCharCount(prev => prev.map((c, i) => {
                        const target = infoSections[i].titles[titleIndices[i]]
                        return Math.min(c + 1, target.length)
                    }))
                }, 70)
            } else {
                // First cycle pauses 1.5s (meaning explosion at ~2.0s after 500ms delete)
                const pauseDuration = cycleCount === 0 ? 1500 : 2500
                timeout = setTimeout(() => setIsDeletingInfo(true), pauseDuration)
            }
        } else {
            if (currentMaxDisplay > 0) {
                timeout = setTimeout(() => {
                    setCharCount(prev => prev.map(c => Math.max(0, c - 1)))
                }, 25)
            } else {
                setIsDeletingInfo(false)
                setTitleIndices(prev => prev.map((idx, i) => (idx + 1) % infoSections[i].titles.length))

                // Synchronization: Trigger explosion and color change here
                setExploding(true)
                setCycleCount(c => c + 1)
                setTimeout(() => setExploding(false), 2500)

                const newColor = getRandomAccentExcluding(internalAccent)
                setInternalAccent(newColor)
                onAccentChange?.(newColor)
            }
        }

        return () => clearTimeout(timeout)
    }, [charCount, isDeletingInfo, titleIndices, internalAccent, onAccentChange, cycleCount])

    // Displayed titles derivation
    const displayedTitles = infoSections.map((s, i) =>
        s.titles[titleIndices[i]].slice(0, charCount[i])
    )

    return (
        <motion.div
            className="main-content"
            initial={{ opacity: 0 }}
            animate={{
                opacity: 1,
                '--accent': colorValues[accent],
                '--accent-soft': `${colorValues[accent]}33`,
                '--accent-softer': `${colorValues[accent]}1f`,
                '--blob-a-color': `${colorValues[accent]}40`,
                '--blob-b-color': `${colorValues[accent]}30`,
                '--blob-c-color': `${colorValues[accent]}35`
            }}
            transition={{ duration: 0.5, ease: 'easeInOut' }}
            exit={{ opacity: 0 }}
            style={{
                height: '100%',
                overflowY: 'auto',
                display: 'block', // Overrides main-content flex centering to prevent top clipping
                background: '#ffffff',
                backgroundImage: `
                    radial-gradient(circle at 20% 20%, var(--accent-soft) 0%, transparent 45%),
                    radial-gradient(circle at 85% 15%, var(--accent-softer) 0%, transparent 52%),
                    radial-gradient(circle at 15% 85%, var(--accent-softer) 0%, transparent 48%),
                    linear-gradient(var(--accent-grid) 1px, transparent 1px),
                    linear-gradient(90deg, var(--accent-grid) 1px, transparent 1px)
                `,
                backgroundSize: 'auto, auto, auto, 42px 42px, 42px 42px',
                backgroundPosition: 'center',
                position: 'relative'
            }}
        >
            {/* Background Blobs for Chemical Effect */}
            <div className="settings-blobs">
                <span className="settings-blob blob-a" style={{ background: 'radial-gradient(circle at 30% 30%, var(--blob-a-color), transparent 60%)' }} />
                <span className="settings-blob blob-b" style={{ background: 'radial-gradient(circle at 40% 40%, var(--blob-b-color), transparent 65%)' }} />
                <span className="settings-blob blob-c" style={{ background: 'radial-gradient(circle at 50% 30%, var(--blob-c-color), transparent 60%)' }} />
            </div>

            <BackArrow onClick={onBack} color={accent} />


            <div style={{
                maxWidth: '1000px',
                margin: '0 auto',
                padding: '40px 20px 100px',
                width: '100%',
                position: 'relative',
                zIndex: 2
            }}>
                {/* Affinity Hero Section */}
                <motion.div
                    initial={{ y: 20, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ delay: 0.1 }}
                    style={{
                        marginBottom: '60px',
                        textAlign: 'center',
                        position: 'relative'
                    }}
                >
                    <div style={{
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        justifyContent: 'center',
                        marginBottom: 20
                    }}>
                        <div className="settings-title" style={{
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: 'center',
                            marginBottom: 20,
                            position: 'relative',
                            zIndex: 1
                        }}>
                            {/* Particles System */}
                            <div style={{
                                position: 'absolute',
                                top: '40%',
                                left: '50%',
                                transform: 'translate(-50%, -50%)',
                                zIndex: -1
                            }}>
                                {exploding && !structuredMode && [...Array(60)].map((_, i) => (
                                    <Particle key={`${cycleCount}-${i}`} color={colorValues[accent]} />
                                ))}
                            </div>

                            <motion.div style={{ position: 'relative', display: 'inline-block' }}>
                                {/* RGB Glitch Layers */}
                                <AnimatePresence>
                                    {exploding && !structuredMode && (
                                        <>
                                            <motion.span
                                                initial={{ opacity: 0, x: 0 }}
                                                animate={{ opacity: [0, 0.8, 0.8, 0], x: [0, -8, -8, 0], y: [0, 2, 2, 0] }}
                                                transition={{ duration: 2.0, times: [0, 0.1, 0.9, 1], ease: "easeInOut" }}
                                                exit={{ opacity: 0, x: 0 }}
                                                style={{
                                                    position: 'absolute',
                                                    top: 0,
                                                    left: 0,
                                                    color: '#ff0055',
                                                    fontSize: 96,
                                                    fontWeight: 800,
                                                    lineHeight: 1,
                                                    mixBlendMode: 'screen',
                                                    pointerEvents: 'none'
                                                }}
                                            >
                                                Affinity
                                            </motion.span>
                                            <motion.span
                                                initial={{ opacity: 0, x: 0 }}
                                                animate={{ opacity: [0, 0.8, 0.8, 0], x: [0, 8, 8, 0], y: [0, -2, -2, 0] }}
                                                transition={{ duration: 2.0, times: [0, 0.1, 0.9, 1], ease: "easeInOut" }}
                                                exit={{ opacity: 0, x: 0 }}
                                                style={{
                                                    position: 'absolute',
                                                    top: 0,
                                                    left: 0,
                                                    color: '#00ccff',
                                                    fontSize: 96,
                                                    fontWeight: 800,
                                                    lineHeight: 1,
                                                    mixBlendMode: 'screen',
                                                    pointerEvents: 'none'
                                                }}
                                            >
                                                Affinity
                                            </motion.span>
                                        </>
                                    )}
                                </AnimatePresence>

                                {/* Main Text */}
                                <motion.span
                                    animate={(exploding && !structuredMode) ? {
                                        scale: [1, 1.1, 1.1, 1],
                                        rotate: [0, -3, 3, 0],
                                        filter: ['blur(0px)', 'blur(2px)', 'blur(2px)', 'blur(0px)']
                                    } : {
                                        scale: 1,
                                        rotate: 0,
                                        filter: 'blur(0px)'
                                    }}
                                    transition={{ duration: 2.0, times: [0, 0.1, 0.9, 1] }}
                                    style={{
                                        color: colorValues[accent],
                                        display: 'inline-block',
                                        fontSize: 96,
                                        lineHeight: 1,
                                        fontWeight: 800,
                                        fontFamily: 'var(--font-display)'
                                    }}
                                >
                                    Affinity
                                </motion.span>
                            </motion.div>

                            <span style={{
                                fontSize: 32,
                                opacity: 0.6,
                                letterSpacing: 6,
                                fontWeight: 600,
                                textTransform: 'uppercase',
                                marginTop: 8,
                                color: '#5A5A5A',
                                fontFamily: 'var(--font-display)'
                            }}>
                                English
                            </span>
                        </div>

                        <UnifiedBadge
                            label="Experimental"
                            icon="science"
                            accentColor={accent}
                        />
                    </div>
                </motion.div>

                {/* Settings Cards Grid */}
                <div style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))',
                    gap: '32px',
                    marginBottom: '40px'
                }}>
                    {/* Profile Card */}
                    <SettingsCard
                        title="Profile"
                        icon="badge"
                        accentColor={accent}
                        delay={0.2}
                    >
                        <div>
                            <label style={{
                                display: 'block',
                                fontSize: 14,
                                fontWeight: 700,
                                color: '#888',
                                marginBottom: 10,
                                textTransform: 'uppercase',
                                letterSpacing: 1
                            }}>
                                Teacher Name
                            </label>
                            <input
                                type="text"
                                value={userName}
                                onChange={(e) => {
                                    const val = e.target.value
                                    if (/^[a-zA-Z]*$/.test(val)) {
                                        onNameChange(val)
                                    }
                                }}
                                maxLength={12}
                                placeholder="Enter Name"
                                style={{
                                    width: '100%',
                                    padding: '16px 20px',
                                    borderRadius: '16px',
                                    border: `3px solid ${colorValues[accent]}`,
                                    background: 'transparent',
                                    fontSize: 22,
                                    fontWeight: 800,
                                    color: colorValues[accent],
                                    textAlign: 'center',
                                    outline: 'none',
                                    fontFamily: 'var(--font-display)',
                                    transition: 'all 0.3s ease'
                                }}
                            />
                            <div style={{
                                marginTop: 8,
                                fontSize: 13,
                                opacity: 0.6,
                                textAlign: 'center'
                            }}>
                                English characters only (max 12)
                            </div>
                        </div>
                    </SettingsCard>


                    {/* Follow Along Pointer Card */}
                    <SettingsCard
                        title="Follow Pointer"
                        icon="near_me"
                        accentColor={accent}
                        delay={0.35}
                    >
                        <div>
                            <div style={{
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'space-between',
                                marginBottom: 20
                            }}>
                                <div>
                                    <div style={{ fontSize: 18, fontWeight: 700, color: '#334155', fontFamily: 'var(--font-display)' }}>
                                        Enable Pointer
                                    </div>
                                    <div style={{ fontSize: 13, color: '#64748b', marginTop: 4 }}>
                                        Show a large cursor for students to see
                                    </div>
                                </div>

                                <motion.button
                                    onClick={onToggleCursor}
                                    whileHover={{ scale: 1.05 }}
                                    whileTap={{ scale: 0.95 }}
                                    style={{
                                        width: 60,
                                        height: 34,
                                        borderRadius: 999,
                                        backgroundColor: cursorEnabled ? colorValues[accent] : '#e2e8f0',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: cursorEnabled ? 'flex-end' : 'flex-start',
                                        padding: '4px',
                                        border: `2px solid ${cursorEnabled ? colorValues[accent] : '#cbd5e1'}`,
                                        cursor: 'pointer',
                                        boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.06)',
                                        transition: 'background-color 0.3s'
                                    }}
                                >
                                    <motion.div
                                        layout
                                        transition={{ type: "spring", stiffness: 500, damping: 30 }}
                                        style={{
                                            width: 24,
                                            height: 24,
                                            borderRadius: '50%',
                                            backgroundColor: 'white',
                                            boxShadow: '0 2px 6px rgba(0,0,0,0.15)',
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center'
                                        }}
                                    >
                                        {cursorEnabled && (
                                            <motion.span
                                                initial={{ scale: 0 }}
                                                animate={{ scale: 1 }}
                                                className="material-symbols-rounded"
                                                style={{ fontSize: 16, color: colorValues[accent], fontWeight: 'bold' }}
                                            >
                                                check
                                            </motion.span>
                                        )}
                                    </motion.div>
                                </motion.button>
                            </div>

                            <AnimatePresence>
                                {cursorEnabled && (
                                    <motion.div
                                        initial={{ height: 0, opacity: 0 }}
                                        animate={{ height: 'auto', opacity: 1 }}
                                        exit={{ height: 0, opacity: 0 }}
                                        style={{ overflow: 'hidden' }}
                                    >
                                        <label style={{
                                            display: 'block',
                                            fontSize: 14,
                                            fontWeight: 700,
                                            color: '#888',
                                            marginBottom: 12,
                                            textTransform: 'uppercase',
                                            letterSpacing: 1,
                                            paddingTop: 10,
                                            borderTop: '1px solid #eee'
                                        }}>
                                            Cursor Size
                                        </label>
                                        <div style={{
                                            display: 'flex',
                                            gap: 12,
                                            marginBottom: 24,
                                            background: '#f1f5f9',
                                            padding: 4,
                                            borderRadius: 12
                                        }}>
                                            {['small', 'medium', 'large'].map((size) => (
                                                <motion.button
                                                    key={size}
                                                    onClick={() => onCursorSizeChange(size)}
                                                    whileHover={{ scale: 1.02 }}
                                                    whileTap={{ scale: 0.98 }}
                                                    style={{
                                                        flex: 1,
                                                        padding: '10px',
                                                        borderRadius: 8,
                                                        border: 'none',
                                                        background: cursorSize === size ? 'white' : 'transparent',
                                                        color: cursorSize === size ? colorValues[accent] : '#64748b',
                                                        fontWeight: 700,
                                                        fontSize: 14,
                                                        cursor: 'pointer',
                                                        boxShadow: cursorSize === size ? '0 2px 4px rgba(0,0,0,0.05)' : 'none',
                                                        textTransform: 'capitalize',
                                                        fontFamily: 'var(--font-display)',
                                                        transition: 'all 0.2s ease'
                                                    }}
                                                >
                                                    {size}
                                                </motion.button>
                                            ))}
                                        </div>

                                        <label style={{
                                            display: 'block',
                                            fontSize: 14,
                                            fontWeight: 700,
                                            color: '#888',
                                            marginBottom: 12,
                                            textTransform: 'uppercase',
                                            letterSpacing: 1,
                                            paddingTop: 10,
                                            borderTop: '1px solid #eee'
                                        }}>
                                            Cursor Color
                                        </label>
                                        <div style={{
                                            display: 'flex',
                                            gap: 16, // Increased gap for cleaner look
                                            flexWrap: 'wrap',
                                            justifyContent: 'center', // Center the colors
                                            padding: '8px 0' // Add some vertical padding
                                        }}>
                                            {Object.entries(colorValues).map(([key, value]) => (
                                                <motion.button
                                                    key={key}
                                                    onClick={() => onCursorColorChange(value)}
                                                    whileHover={{ scale: 1.2 }}
                                                    whileTap={{ scale: 0.9 }}
                                                    style={{
                                                        width: 42, // Slightly larger touch target
                                                        height: 42,
                                                        borderRadius: '50%',
                                                        backgroundColor: value,
                                                        border: cursorColor === value
                                                            ? `4px solid white`
                                                            : '4px solid transparent',
                                                        boxShadow: cursorColor === value
                                                            ? `0 0 0 2px ${value}, 0 4px 12px ${value}60`
                                                            : `0 2px 6px rgba(0,0,0,0.1)`,
                                                        cursor: 'pointer',
                                                        position: 'relative',
                                                        padding: 0, // Reset default button padding
                                                        outline: 'none' // Remove focus outline
                                                    }}
                                                />
                                            ))}
                                        </div>
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </div>
                    </SettingsCard>

                    {/* Cloud Sync Card */}
                    <SettingsCard title="Cloud Sync" icon="cloud_sync" accentColor={accent} delay={0.4}>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                            <div style={{ fontSize: 15, color: '#64748b', lineHeight: 1.5 }}>
                                Manually back up your classes, students, lessons, and canvases to the cloud — or restore them on a new device.
                            </div>
                            <motion.button
                                onClick={() => onNavigate('cloud-sync')}
                                whileHover={{ scale: 1.03 }}
                                whileTap={{ scale: 0.97 }}
                                style={{
                                    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10,
                                    width: '100%', padding: '18px 24px',
                                    borderRadius: 'var(--radius-md)', border: 'none',
                                    background: colorValues[accent], color: '#ffffff',
                                    cursor: 'pointer', fontFamily: 'var(--font-body)',
                                    fontWeight: 700, fontSize: 20,
                                    boxShadow: `0 6px 24px ${colorValues[accent]}44`
                                }}
                            >
                                <span className="material-symbols-rounded" style={{ fontSize: 24, fontVariationSettings: "'FILL' 1" }}>cloud_sync</span>
                                Open Sync Menu
                            </motion.button>
                        </div>
                    </SettingsCard>

                    {/* Account Card */}
                    <SettingsCard title="Account" icon="account_circle" accentColor={accent} delay={0.45}>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                            {authUser && (
                                <div style={{
                                    display: 'flex', alignItems: 'center', gap: 12,
                                    padding: '14px 18px', borderRadius: 'var(--radius-md)',
                                    background: `${colorValues[accent]}10`,
                                    border: `2px solid ${colorValues[accent]}25`
                                }}>
                                    <span className="material-symbols-rounded" style={{ fontSize: 22, color: colorValues[accent], fontVariationSettings: "'FILL' 1" }}>person</span>
                                    <span style={{ fontSize: 16, fontWeight: 600, color: '#374151', wordBreak: 'break-all' }}>
                                        {authUser.email}
                                    </span>
                                </div>
                            )}
                            <motion.button
                                onClick={onSignOut}
                                whileHover={{ scale: 1.03 }}
                                whileTap={{ scale: 0.97 }}
                                style={{
                                    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10,
                                    width: '100%', padding: '18px 24px',
                                    borderRadius: 'var(--radius-md)',
                                    border: '2.5px solid #ef4444', background: '#ef444412',
                                    color: '#ef4444', cursor: 'pointer',
                                    fontFamily: 'var(--font-body)', fontWeight: 700, fontSize: 20
                                }}
                            >
                                <span className="material-symbols-rounded" style={{ fontSize: 24, fontVariationSettings: "'FILL' 1" }}>logout</span>
                                Sign Out
                            </motion.button>
                        </div>
                    </SettingsCard>

                </div>

                {/* ======================================================== */}
                {/* ACCESSIBILITY SECTION – Full Width                        */}
                {/* ======================================================== */}
                <div style={{ marginTop: '40px', marginBottom: '40px' }}>
                    <h2 style={{
                        fontSize: 28,
                        fontFamily: 'var(--font-display)',
                        fontWeight: 700,
                        color: colorValues[accent],
                        marginBottom: 24,
                        display: 'flex',
                        alignItems: 'center',
                        gap: 10
                    }}>
                        <span className="material-symbols-rounded" style={{ fontSize: 32, fontVariationSettings: "'FILL' 1" }}>accessibility_new</span>
                        Accessibility
                    </h2>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>

                        {/* --- Structured Mode Card --- */}
                        <SettingsCard title="Structured Mode" icon="tune" accentColor={accent} delay={0.32}>
                            <div style={{
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'space-between',
                                marginBottom: 8
                            }}>
                                <div>
                                    <div style={{ fontSize: 18, fontWeight: 700, color: '#334155', fontFamily: 'var(--font-display)' }}>
                                        Enable Structured Mode
                                    </div>
                                    <div style={{ fontSize: 13, color: '#64748b', marginTop: 4 }}>
                                        Disables animations and locks color for a predictable, routine experience.
                                    </div>
                                </div>
                                <motion.button
                                    onClick={onToggleStructuredMode}
                                    whileHover={{ scale: 1.05 }}
                                    whileTap={{ scale: 0.95 }}
                                    style={{
                                        width: 60, height: 34, borderRadius: 999, flexShrink: 0,
                                        backgroundColor: structuredMode ? colorValues[accent] : '#e2e8f0',
                                        display: 'flex', alignItems: 'center',
                                        justifyContent: structuredMode ? 'flex-end' : 'flex-start',
                                        padding: '4px',
                                        border: `2px solid ${structuredMode ? colorValues[accent] : '#cbd5e1'}`,
                                        cursor: 'pointer', boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.06)'
                                    }}
                                >
                                    <motion.div layout transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                                        style={{ width: 24, height: 24, borderRadius: '50%', backgroundColor: 'white', boxShadow: '0 2px 6px rgba(0,0,0,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                                    >
                                        {structuredMode && (
                                            <motion.span initial={{ scale: 0 }} animate={{ scale: 1 }} className="material-symbols-rounded" style={{ fontSize: 16, color: colorValues[accent], fontWeight: 'bold' }}>check</motion.span>
                                        )}
                                    </motion.div>
                                </motion.button>
                            </div>

                            <AnimatePresence>
                                {structuredMode && (
                                    <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} style={{ overflow: 'hidden' }}>
                                        <label style={{ display: 'block', fontSize: 14, fontWeight: 700, color: '#888', marginBottom: 12, textTransform: 'uppercase', letterSpacing: 1, paddingTop: 10, borderTop: '1px solid #eee' }}>Structured App Color</label>
                                        <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap', justifyContent: 'center', padding: '8px 0' }}>
                                            {Object.entries(colorValues).map(([key, value]) => (
                                                <motion.button key={key} onClick={() => { onStructuredColorChange(key); onAccentChange(key) }} whileHover={{ scale: 1.2 }} whileTap={{ scale: 0.9 }}
                                                    style={{ width: 42, height: 42, borderRadius: '50%', backgroundColor: value, border: structuredColor === key ? '4px solid white' : '4px solid transparent', boxShadow: structuredColor === key ? `0 0 0 2px ${value}, 0 4px 12px ${value}60` : '0 2px 6px rgba(0,0,0,0.1)', cursor: 'pointer', position: 'relative', padding: 0, outline: 'none' }}
                                                />
                                            ))}
                                        </div>
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </SettingsCard>

                        {/* --- Color Vision Card --- */}
                        <SettingsCard title="Color Vision" icon="palette" accentColor={accent} delay={0.35}>
                            <div style={{ fontSize: 13, color: '#64748b', marginBottom: 16 }}>
                                Adjust colors for different types of color vision deficiency.
                            </div>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                                {[
                                    { key: 'none', label: 'Normal Vision', desc: 'Default color palette', colors: ['#00D9FF', '#FF006E', '#7CB518'] },
                                    { key: 'protanopia', label: 'Protanopia', desc: 'Red-blind — difficulty seeing reds', colors: ['#B3A000', '#6688CC', '#7CB518'] },
                                    { key: 'deuteranopia', label: 'Deuteranopia', desc: 'Green-blind — difficulty seeing greens', colors: ['#D4A017', '#5577BB', '#CCAA00'] },
                                    { key: 'tritanopia', label: 'Tritanopia', desc: 'Blue-blind — difficulty seeing blues', colors: ['#FF006E', '#00B8A9', '#CC5500'] },
                                ].map(opt => {
                                    const isActive = colorBlindMode === opt.key
                                    return (
                                        <motion.button key={opt.key} onClick={() => onColorBlindModeChange(opt.key)} whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.99 }}
                                            style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '14px 16px', borderRadius: 16, border: isActive ? `3px solid ${colorValues[accent]}` : '3px solid #e2e8f0', background: isActive ? `${colorValues[accent]}10` : 'white', cursor: 'pointer', width: '100%', textAlign: 'left', outline: 'none', boxShadow: isActive ? `0 4px 12px ${colorValues[accent]}20` : 'none' }}
                                        >
                                            <div style={{ display: 'flex', gap: 4, flexShrink: 0 }}>
                                                {opt.colors.map((c, i) => (
                                                    <div key={i} style={{ width: 16, height: 16, borderRadius: '50%', backgroundColor: c, border: '2px solid white', boxShadow: '0 1px 3px rgba(0,0,0,0.15)' }} />
                                                ))}
                                            </div>
                                            <div style={{ flex: 1 }}>
                                                <div style={{ fontSize: 15, fontWeight: 700, color: isActive ? colorValues[accent] : '#334155', fontFamily: 'var(--font-display)' }}>{opt.label}</div>
                                                <div style={{ fontSize: 12, color: '#94a3b8', marginTop: 2 }}>{opt.desc}</div>
                                            </div>
                                            {isActive && (
                                                <span className="material-symbols-rounded" style={{ fontSize: 22, color: colorValues[accent], fontVariationSettings: "'FILL' 1" }}>check_circle</span>
                                            )}
                                        </motion.button>
                                    )
                                })}
                            </div>
                        </SettingsCard>

                        {/* --- Dyslexia-Friendly Font Card --- */}
                        <SettingsCard title="Dyslexia-Friendly Font" icon="text_fields" accentColor={accent} delay={0.38}>
                            <div style={{ fontSize: 13, color: '#64748b', marginBottom: 16 }}>
                                Choose a font designed for easier reading. These fonts feature distinct letter shapes and weighted bottoms.
                            </div>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                                {[
                                    { key: 'none', label: 'Default (Fredoka)', desc: 'Standard app font', fontFamily: 'var(--font-display)', sampleStyle: {} },
                                    { key: 'opendyslexic', label: 'OpenDyslexic', desc: 'Weighted bottoms to prevent letter rotation', fontFamily: "'Open Dyslexic', sans-serif", sampleStyle: { fontSizeAdjust: 0.47 } },
                                    { key: 'atkinson', label: 'Atkinson Hyperlegible', desc: 'Maximum character distinction for low vision', fontFamily: "'Atkinson Hyperlegible Mono', sans-serif", sampleStyle: {} },
                                ].map(opt => {
                                    const isActive = dyslexiaMode === opt.key
                                    return (
                                        <motion.button key={opt.key} onClick={() => onDyslexiaModeChange(opt.key)} whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.99 }}
                                            style={{ display: 'flex', flexDirection: 'column', gap: 10, padding: '16px 18px', borderRadius: 16, border: isActive ? `3px solid ${colorValues[accent]}` : '3px solid #e2e8f0', background: isActive ? `${colorValues[accent]}08` : 'white', cursor: 'pointer', width: '100%', textAlign: 'left', outline: 'none', boxShadow: isActive ? `0 4px 12px ${colorValues[accent]}20` : 'none' }}
                                        >
                                            <div style={{ display: 'flex', alignItems: 'center', width: '100%' }}>
                                                <div style={{ flex: 1 }}>
                                                    <div style={{ fontSize: 15, fontWeight: 700, color: isActive ? colorValues[accent] : '#334155', fontFamily: 'var(--font-display)' }}>{opt.label}</div>
                                                    <div style={{ fontSize: 12, color: '#94a3b8', marginTop: 2 }}>{opt.desc}</div>
                                                </div>
                                                {isActive && (
                                                    <span className="material-symbols-rounded" style={{ fontSize: 22, color: colorValues[accent], fontVariationSettings: "'FILL' 1", flexShrink: 0 }}>check_circle</span>
                                                )}
                                            </div>
                                            {/* Font sample */}
                                            <div style={{
                                                padding: '10px 14px', borderRadius: 10, background: '#f8fafc', border: '1.5px solid #e2e8f0', width: '100%',
                                                fontFamily: opt.fontFamily, fontSize: 16, color: '#334155', lineHeight: 1.5, letterSpacing: '0.03em', ...opt.sampleStyle
                                            }}>
                                                The quick brown fox jumps over the lazy dog.
                                            </div>
                                        </motion.button>
                                    )
                                })}
                            </div>
                        </SettingsCard>

                    </div>
                </div>

                {/* ======================================================== */}
                {/* CLASS CONFIGURATION SECTION – Full Width                  */}
                {/* ======================================================== */}
                <div style={{ marginBottom: '40px' }}>
                    <h2 style={{
                        fontSize: 28,
                        fontFamily: 'var(--font-display)',
                        fontWeight: 700,
                        color: colorValues[accent],
                        marginBottom: 24,
                        display: 'flex',
                        alignItems: 'center',
                        gap: 10
                    }}>
                        <span className="material-symbols-rounded" style={{ fontSize: 32, fontVariationSettings: "'FILL' 1" }}>meeting_room</span>
                        Class Configuration
                    </h2>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>

                        {/* Class Management Card (Full Width) */}
                        <SettingsCard
                            title="Class Management"
                            icon="school"
                            accentColor={accent}
                            delay={0.4}
                        >
                            <div style={{
                                display: 'flex',
                                flexDirection: 'column',
                                gap: '16px',
                                maxHeight: '400px',
                                overflowY: 'auto',
                                paddingRight: '8px'
                            }}>
                                {classes.map((cls, index) => (
                                    <motion.div
                                        key={cls.id}
                                        initial={{ x: -20, opacity: 0 }}
                                        animate={{ x: 0, opacity: 1 }}
                                        transition={{ delay: 0.5 + (index * 0.05) }}
                                        style={{
                                            display: 'flex',
                                            justifyContent: 'space-between',
                                            alignItems: 'center',
                                            padding: '14px 18px',
                                            background: `${colorValues[accent]}08`,
                                            borderRadius: '16px',
                                            border: `2px solid ${colorValues[accent]}20`,
                                            gap: '16px',
                                            transition: 'all 0.3s ease'
                                        }}
                                    >
                                        <div style={{
                                            display: 'flex',
                                            alignItems: 'center',
                                            gap: '12px',
                                            flex: 1
                                        }}>
                                            <span className="material-symbols-rounded" style={{
                                                fontSize: 24,
                                                color: colorValues[accent],
                                                fontVariationSettings: "'FILL' 1"
                                            }}>
                                                groups
                                            </span>
                                            <input
                                                value={cls.name || ''}
                                                onChange={(e) => renameClass(cls.id, e.target.value)}
                                                placeholder="Class Name"
                                                style={{
                                                    fontWeight: 700,
                                                    color: colorValues[accent],
                                                    border: 'none',
                                                    background: 'transparent',
                                                    fontSize: '18px',
                                                    width: '100%',
                                                    outline: 'none',
                                                    fontFamily: 'var(--font-display)'
                                                }}
                                            />
                                        </div>
                                        {classes.length > 1 && (
                                            <motion.button
                                                whileHover={{ scale: 1.1 }}
                                                whileTap={{ scale: 0.9 }}
                                                onClick={() => deleteClass(cls.id)}
                                                style={{
                                                    border: 'none',
                                                    background: '#ff006e20',
                                                    color: '#ff006e',
                                                    borderRadius: '12px',
                                                    padding: '8px',
                                                    cursor: 'pointer',
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    justifyContent: 'center',
                                                    flexShrink: 0,
                                                    transition: 'all 0.2s ease'
                                                }}
                                                title="Delete Class"
                                            >
                                                <span className="material-symbols-rounded" style={{ fontSize: 20 }}>
                                                    delete
                                                </span>
                                            </motion.button>
                                        )}
                                    </motion.div>
                                ))}
                            </div>

                            {/* Add New Class Button */}
                            <motion.button
                                whileHover={{ scale: 1.02, y: -2 }}
                                whileTap={{ scale: 0.98 }}
                                onClick={addClass}
                                style={{
                                    marginTop: '8px',
                                    padding: '16px',
                                    borderRadius: '16px',
                                    border: `2px dashed ${colorValues[accent]}`,
                                    background: 'transparent',
                                    color: colorValues[accent],
                                    fontWeight: 700,
                                    fontSize: 16,
                                    cursor: 'pointer',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    gap: '10px',
                                    transition: 'all 0.3s ease',
                                    fontFamily: 'var(--font-display)'
                                }}
                            >
                                <span className="material-symbols-rounded" style={{ fontSize: 24 }}>
                                    add_circle
                                </span>
                                Add New Class
                            </motion.button>
                        </SettingsCard>

                        {/* Class Pace Controls Card */}
                        <SettingsCard title="Class Pace Controls" icon="speed" accentColor={accent} delay={0.5}>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>

                                {/* Vocabulary Subsection */}
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                                    <div style={{
                                        fontSize: '14px',
                                        fontWeight: 700,
                                        textTransform: 'uppercase',
                                        letterSpacing: '1px',
                                        color: hexToRgba(colorValues[accent], 0.7),
                                        borderBottom: `2px solid ${hexToRgba(colorValues[accent], 0.1)}`,
                                        paddingBottom: '8px',
                                        marginBottom: '4px'
                                    }}>
                                        Vocabulary
                                    </div>

                                    {[
                                        { key: 'vocab_allow_definition', label: 'Auto Reveal Definition', default: true },
                                        { key: 'vocab_allow_example', label: 'Auto Reveal Example', default: true },
                                        { key: 'vocab_allow_tip', label: 'Auto Reveal Tip', default: false },
                                    ].map((setting) => {
                                        const [enabled, setEnabled] = useState(() => {
                                            const stored = localStorage.getItem(setting.key)
                                            return stored !== null ? stored === 'true' : setting.default
                                        })

                                        const toggle = () => {
                                            const newValue = !enabled
                                            setEnabled(newValue)
                                            localStorage.setItem(setting.key, String(newValue))
                                        }

                                        return (
                                            <div key={setting.key} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                                                <span style={{ fontSize: 18, fontWeight: 600, color: '#334155', fontFamily: 'var(--font-display)' }}>
                                                    {setting.label}
                                                </span>
                                                <motion.button
                                                    onClick={toggle}
                                                    whileHover={{ scale: 1.05 }}
                                                    whileTap={{ scale: 0.95 }}
                                                    style={{
                                                        width: 60,
                                                        height: 34,
                                                        borderRadius: 999,
                                                        backgroundColor: enabled ? colorValues[accent] : '#e2e8f0',
                                                        display: 'flex',
                                                        alignItems: 'center',
                                                        justifyContent: enabled ? 'flex-end' : 'flex-start',
                                                        padding: '4px',
                                                        border: `2px solid ${enabled ? colorValues[accent] : '#cbd5e1'}`,
                                                        cursor: 'pointer',
                                                        boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.06)',
                                                        transition: 'background-color 0.3s'
                                                    }}
                                                >
                                                    <motion.div
                                                        layout
                                                        transition={{ type: "spring", stiffness: 500, damping: 30 }}
                                                        style={{
                                                            width: 24,
                                                            height: 24,
                                                            borderRadius: '50%',
                                                            backgroundColor: 'white',
                                                            boxShadow: '0 2px 6px rgba(0,0,0,0.15)',
                                                            display: 'flex',
                                                            alignItems: 'center',
                                                            justifyContent: 'center'
                                                        }}
                                                    >
                                                        {enabled && (
                                                            <motion.span
                                                                initial={{ scale: 0 }}
                                                                animate={{ scale: 1 }}
                                                                className="material-symbols-rounded"
                                                                style={{ fontSize: 16, color: colorValues[accent], fontWeight: 'bold' }}
                                                            >
                                                                check
                                                            </motion.span>
                                                        )}
                                                    </motion.div>
                                                </motion.button>
                                            </div>
                                        )
                                    })}
                                </div>

                                {/* Lesson Lab Subsection */}
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                                    <div style={{
                                        fontSize: '14px',
                                        fontWeight: 700,
                                        textTransform: 'uppercase',
                                        letterSpacing: '1px',
                                        color: hexToRgba(colorValues[accent], 0.7),
                                        borderBottom: `2px solid ${hexToRgba(colorValues[accent], 0.1)}`,
                                        paddingBottom: '8px',
                                        marginBottom: '4px'
                                    }}>
                                        Lesson Lab
                                    </div>

                                    {[
                                        { key: 'll_auto_reveal_translation', label: 'Auto Reveal Translation (Explanation Cards)', default: true },
                                        { key: 'll_auto_reveal_definition', label: 'Auto Reveal Definition (Vocabulary Cards)', default: true },
                                        { key: 'll_auto_reveal_example', label: 'Auto Reveal Example (Vocabulary Cards)', default: true },
                                    ].map((setting) => {
                                        const [enabled, setEnabled] = useState(() => {
                                            const stored = localStorage.getItem(setting.key)
                                            return stored !== null ? stored === 'true' : setting.default
                                        })

                                        const toggle = () => {
                                            const newValue = !enabled
                                            setEnabled(newValue)
                                            localStorage.setItem(setting.key, String(newValue))
                                        }

                                        return (
                                            <div key={setting.key} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                                                <span style={{ fontSize: 18, fontWeight: 600, color: '#334155', fontFamily: 'var(--font-display)' }}>
                                                    {setting.label}
                                                </span>
                                                <motion.button
                                                    onClick={toggle}
                                                    whileHover={{ scale: 1.05 }}
                                                    whileTap={{ scale: 0.95 }}
                                                    style={{
                                                        width: 60,
                                                        height: 34,
                                                        borderRadius: 999,
                                                        backgroundColor: enabled ? colorValues[accent] : '#e2e8f0',
                                                        display: 'flex',
                                                        alignItems: 'center',
                                                        justifyContent: enabled ? 'flex-end' : 'flex-start',
                                                        padding: '4px',
                                                        border: `2px solid ${enabled ? colorValues[accent] : '#cbd5e1'}`,
                                                        cursor: 'pointer',
                                                        boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.06)',
                                                        transition: 'background-color 0.3s'
                                                    }}
                                                >
                                                    <motion.div
                                                        layout
                                                        transition={{ type: "spring", stiffness: 500, damping: 30 }}
                                                        style={{
                                                            width: 24,
                                                            height: 24,
                                                            borderRadius: '50%',
                                                            backgroundColor: 'white',
                                                            boxShadow: '0 2px 6px rgba(0,0,0,0.15)',
                                                            display: 'flex',
                                                            alignItems: 'center',
                                                            justifyContent: 'center'
                                                        }}
                                                    >
                                                        {enabled && (
                                                            <motion.span
                                                                initial={{ scale: 0 }}
                                                                animate={{ scale: 1 }}
                                                                className="material-symbols-rounded"
                                                                style={{ fontSize: 16, color: colorValues[accent], fontWeight: 'bold' }}
                                                            >
                                                                check
                                                            </motion.span>
                                                        )}
                                                    </motion.div>
                                                </motion.button>
                                            </div>
                                        )
                                    })}
                                </div>
                            </div>
                        </SettingsCard>

                    </div>
                </div>

                {/* About This App Section */}
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.6 }}
                    style={{
                        marginTop: '60px',
                        marginBottom: '40px'
                    }}
                >
                    <h2 style={{
                        textAlign: 'center',
                        fontSize: 36,
                        marginBottom: 50,
                        fontFamily: 'var(--font-display)',
                        fontWeight: 700,
                        color: colorValues[accent],
                        transition: 'color 0.5s ease'
                    }}>
                        About This App
                    </h2>

                    {infoSections.map((section, i) => (
                        <motion.div
                            key={i}
                            initial={{ y: 30, opacity: 0 }}
                            animate={{ y: 0, opacity: 1 }}
                            transition={{ delay: 0.7 + (0.1 * i) }}
                            style={{
                                marginBottom: 50,
                                background: 'white',
                                borderRadius: '24px',
                                padding: '32px',
                                boxShadow: `0 12px 40px ${colorValues[accent]}12, 0 4px 15px rgba(0,0,0,0.06)`,
                                border: `2px solid ${colorValues[accent]}15`
                            }}
                        >
                            <h3 style={{
                                fontSize: 32,
                                color: colorValues[accent],
                                marginBottom: 20,
                                fontFamily: 'var(--font-display)',
                                fontWeight: 700,
                                display: 'flex',
                                alignItems: 'center',
                                gap: 10,
                                minHeight: 50,
                                lineHeight: '50px',
                                overflow: 'hidden',
                                transition: 'color 0.5s ease'
                            }}>
                                {displayedTitles[i]}
                                <span
                                    style={{
                                        width: 3,
                                        height: 30,
                                        backgroundColor: colorValues[accent],
                                        display: 'inline-block',
                                        animation: 'blink 0.8s infinite',
                                        transition: 'background-color 0.5s ease'
                                    }}
                                />
                            </h3>

                            <p style={{
                                fontSize: 20,
                                lineHeight: 1.7,
                                opacity: 0.85,
                                color: '#5A5A5A',
                                fontFamily: 'var(--font-display)',
                                fontWeight: 500
                            }}>
                                {i === 2 && section.content.includes("Serotonin Engine") ? (
                                    <>
                                        {section.content.split("Serotonin Engine")[0]}
                                        <motion.span
                                            whileHover={{ scale: 1.05, y: -2 }}
                                            whileTap={{ scale: 0.95 }}
                                            onClick={() => onNavigate('serotonin-engine', accent)}
                                            style={{
                                                display: 'inline-flex',
                                                verticalAlign: 'middle',
                                                margin: '0 4px',
                                                cursor: 'pointer',
                                                position: 'relative'
                                            }}
                                        >
                                            <UnifiedBadge
                                                label="Serotonin Engine"
                                                icon="palette"
                                                accentColor={accent}
                                            />
                                        </motion.span>
                                        {section.content.split("Serotonin Engine")[1]}
                                    </>
                                ) : (
                                    section.content
                                )}
                            </p>
                        </motion.div>
                    ))}
                </motion.div>

                <div style={{
                    textAlign: 'center',
                    marginTop: '60px',
                    marginBottom: '20px',
                    color: colorValues[accent],
                    opacity: 0.6,
                    fontSize: '13px',
                    fontFamily: 'var(--font-display)'
                }}>
                    <div style={{ fontWeight: 600, marginBottom: 4 }}>&copy; Affinity English. Designed by Ali Alghamdi. All rights reserved.</div>
                    <div>Version 0.0.1 Beta</div>
                </div>
            </div>
        </motion.div >
    )
}

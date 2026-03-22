import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { colorValues, accentColors, accentColorSchemes, darkBgTints, bgTints, lightTints, textColors } from '../engine/serotoninEngine'
import { BackArrow } from '../components/BackArrow'

const EngineParticle = ({ coreColor }) => {
    const angle = Math.random() * Math.PI * 2
    const radius = 200 + Math.random() * 400
    const duration = 2 + Math.random() * 4
    const startX = Math.cos(angle) * radius
    const startY = Math.sin(angle) * radius

    return (
        <motion.div
            initial={{ opacity: 0, x: startX, y: startY, scale: 0 }}
            animate={{
                opacity: [0, 1, 0],
                x: 0,
                y: 0,
                scale: [0, 2, 0.5]
            }}
            transition={{
                duration,
                repeat: Infinity,
                ease: 'easeIn',
                delay: Math.random() * 3
            }}
            style={{
                position: 'absolute',
                top: '50%',
                left: '50%',
                width: 4,
                height: 4,
                borderRadius: '50%',
                backgroundColor: coreColor,
                boxShadow: `0 0 15px ${coreColor}, 0 0 30px ${coreColor}`,
                zIndex: 1,
                pointerEvents: 'none'
            }}
        />
    )
}

const ValueCircle = ({ label, colorValue, delay, alignRight = false }) => (
    <motion.div
        initial={{ x: alignRight ? 20 : -20, opacity: 0 }}
        animate={{ x: 0, opacity: 1 }}
        transition={{ delay, duration: 0.5 }}
        style={{
            marginBottom: 16,
            display: 'flex',
            alignItems: 'center',
            justifyContent: alignRight ? 'flex-end' : 'flex-start',
            gap: 16,
            flexDirection: alignRight ? 'row-reverse' : 'row'
        }}
    >
        <div style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: alignRight ? 'flex-end' : 'flex-start',
            gap: 4
        }}>
            <span style={{ fontSize: 10, color: 'rgba(255,255,255,0.6)', letterSpacing: 1, fontFamily: 'monospace' }}>
                {label}
            </span>
            <span style={{ fontSize: 10, color: 'rgba(255,255,255,0.3)', fontFamily: 'monospace' }}>
                {colorValue.toUpperCase()}
            </span>
        </div>
        <motion.div
            layout
            initial={{ scale: 0 }}
            animate={{ scale: 1, backgroundColor: colorValue }}
            transition={{ duration: 0.8, delay: delay + 0.2, type: 'spring' }}
            style={{
                width: 18,
                height: 18,
                borderRadius: '50%',
                boxShadow: `0 0 12px ${colorValue}`,
                border: '1px solid rgba(255,255,255,0.2)'
            }}
        />
    </motion.div>
)

export function SerotoninScreen({ onBack, currentAccent, onAccentChange }) {
    const bg = darkBgTints[currentAccent] || '#0a0a0a'
    const coreColor = colorValues[currentAccent]
    const scheme = accentColorSchemes[currentAccent]

    const [particles, setParticles] = useState([])

    useEffect(() => {
        // Generate stable keys for particles so they don't rerender abruptly
        const p = Array.from({ length: 40 }).map((_, i) => i)
        setParticles(p)
    }, [])

    useEffect(() => {
        const intervalId = setInterval(() => {
            const currentIndex = accentColors.indexOf(currentAccent)
            const nextIndex = (currentIndex + 1) % accentColors.length
            onAccentChange(accentColors[nextIndex])
        }, 10000)

        return () => clearInterval(intervalId)
    }, [currentAccent, onAccentChange])

    return (
        <motion.div
            className="serotonin-container"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1, backgroundColor: bg }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.8 }}
            style={{
                height: '100%',
                width: '100%',
                overflow: 'hidden',
                position: 'relative',
                display: 'flex',
                flexDirection: 'column',
                fontFamily: 'monospace',
                color: 'white'
            }}
        >
            {/* Top Bar Navigation */}
            <div style={{ position: 'absolute', top: 30, left: 30, zIndex: 100 }}>
                <BackArrow onClick={onBack} color={currentAccent} />
            </div>

            <div style={{
                position: 'absolute',
                top: 36,
                left: 0,
                width: '100%',
                textAlign: 'center',
                zIndex: 50,
                pointerEvents: 'none'
            }}>
                <motion.h1
                    layout
                    style={{
                        margin: 0,
                        fontSize: 28,
                        fontWeight: 300,
                        letterSpacing: 8,
                        color: coreColor,
                        textShadow: `0 0 20px ${coreColor}80`
                    }}
                >
                    SEROTONIN_ENGINE
                </motion.h1>
                <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.4)', letterSpacing: 4, marginTop: 4 }}>
                    beta 0.0.1 // AFFINITY ENGLISH
                </div>
            </div>

            {/* Synthwave Horizon Grid */}
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                style={{
                    position: 'absolute',
                    top: '50%',
                    left: 0,
                    right: 0,
                    bottom: 0,
                    background: `linear-gradient(rgba(0,0,0,0) 0%, ${coreColor}15 100%)`,
                    borderTop: `2px solid ${coreColor}60`,
                    transformOrigin: 'top',
                    transform: 'perspective(600px) rotateX(70deg)',
                    zIndex: 0,
                    boxShadow: `0 -5px 40px ${coreColor}40`
                }}
            >
                <div style={{
                    position: 'absolute',
                    top: 0, left: 0, right: 0, bottom: 0,
                    backgroundImage: `
                        linear-gradient(90deg, ${coreColor}30 1px, transparent 1px),
                        linear-gradient(${coreColor}30 1px, transparent 1px)
                    `,
                    backgroundSize: '40px 40px',
                    animation: 'gridMove 3s linear infinite'
                }} />
            </motion.div>

            <style>
                {`
                .serotonin-container * {
                    transition: color 1.5s ease, background-color 1.5s ease, border-color 1.5s ease, box-shadow 1.5s ease, text-shadow 1.5s ease, text-decoration-color 1.5s ease, background-image 1.5s ease, background 1.5s ease !important;
                }
                @keyframes gridMove {
                    0% { background-position: 0 0; }
                    100% { background-position: 0 40px; }
                }
                @keyframes spin {
                    100% { transform: translate(-50%, -50%) rotate(360deg); }
                }
                @keyframes spinReverse {
                    100% { transform: translate(-50%, -50%) rotate(-360deg); }
                }
                `}
            </style>

            {/* Core Orb System */}
            <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', zIndex: 10 }}>
                {particles.map(i => (
                    <EngineParticle key={i} coreColor={coreColor} />
                ))}

                {/* Outer Ring */}
                <motion.div
                    layout
                    style={{
                        position: 'absolute',
                        top: '50%', left: '50%',
                        transform: 'translate(-50%, -50%)',
                        width: 320, height: 320,
                        borderRadius: '50%',
                        border: `1px dashed ${coreColor}40`,
                        animation: 'spin 20s linear infinite'
                    }}
                />

                {/* Inner Ring */}
                <motion.div
                    layout
                    style={{
                        position: 'absolute',
                        top: '50%', left: '50%',
                        transform: 'translate(-50%, -50%)',
                        width: 200, height: 200,
                        borderRadius: '50%',
                        border: `2px solid ${coreColor}80`,
                        borderLeftColor: 'transparent',
                        borderRightColor: 'transparent',
                        animation: 'spinReverse 10s linear infinite'
                    }}
                />

                {/* Core Sphere */}
                <motion.div
                    layout
                    animate={{
                        boxShadow: [
                            `0 0 40px ${coreColor}40, inset 0 0 20px ${coreColor}`,
                            `0 0 80px ${coreColor}80, inset 0 0 40px ${coreColor}`,
                            `0 0 40px ${coreColor}40, inset 0 0 20px ${coreColor}`
                        ]
                    }}
                    transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
                    style={{
                        position: 'absolute',
                        top: '50%', left: '50%',
                        transform: 'translate(-50%, -50%)',
                        width: 100,
                        height: 100,
                        borderRadius: '50%',
                        background: `radial-gradient(circle at 30% 30%, #fff, ${coreColor} 40%, ${darkBgTints[currentAccent]} 90%)`,
                        zIndex: 20
                    }}
                />
            </div>

            {/* HUD Dashboard Left - Schemes */}
            <div style={{ position: 'absolute', top: '20%', left: 40, width: 250, zIndex: 50 }}>
                <div style={{ fontSize: 12, color: coreColor, letterSpacing: 2, marginBottom: 20, borderBottom: `1px solid ${coreColor}40`, paddingBottom: 8 }}>
                    // SCHEME_MATRIX
                </div>

                <h3 style={{ fontSize: 10, color: 'rgba(255,255,255,0.4)', letterSpacing: 2, marginBottom: 16 }}>COLORIZE_VARIANTS</h3>
                <ValueCircle label="COLORIZE_1" colorValue={scheme.colorize1} delay={0.1} />
                <ValueCircle label="COLORIZE_2" colorValue={scheme.colorize2} delay={0.2} />
                <ValueCircle label="COLORIZE_3" colorValue={scheme.colorize3} delay={0.3} />

                <h3 style={{ fontSize: 10, color: 'rgba(255,255,255,0.4)', letterSpacing: 2, marginBottom: 16, marginTop: 28 }}>BADGE_MODULATORS</h3>
                <ValueCircle label="BADGE_1" colorValue={scheme.badge1} delay={0.4} />
                <ValueCircle label="BADGE_2" colorValue={scheme.badge2} delay={0.5} />
                <ValueCircle label="BADGE_3" colorValue={scheme.badge3} delay={0.6} />
            </div>

            {/* HUD Dashboard Right - Tints */}
            <div style={{ position: 'absolute', top: '20%', right: 40, width: 250, zIndex: 50 }}>
                <div style={{ fontSize: 12, color: coreColor, letterSpacing: 2, marginBottom: 20, borderBottom: `1px solid ${coreColor}40`, paddingBottom: 8, textAlign: 'right' }}>
                    ENVIRONMENT_VARS //
                </div>

                <h3 style={{ fontSize: 10, color: 'rgba(255,255,255,0.4)', letterSpacing: 2, marginBottom: 16, textAlign: 'right' }}>BASE_TINTS</h3>
                <ValueCircle label="BG_TINT" colorValue={bgTints[currentAccent]} delay={0.1} alignRight={true} />
                <ValueCircle label="DARK_BG" colorValue={darkBgTints[currentAccent]} delay={0.2} alignRight={true} />

                <h3 style={{ fontSize: 10, color: 'rgba(255,255,255,0.4)', letterSpacing: 2, marginBottom: 16, marginTop: 28, textAlign: 'right' }}>UI_ELEMENTS</h3>
                <ValueCircle label="TEXT_COLOR" colorValue={textColors[currentAccent]} delay={0.4} alignRight={true} />

                <div style={{ marginTop: 24, padding: 16, background: lightTints[currentAccent], borderRadius: 8, border: `1px solid ${coreColor}40` }}>
                    <div style={{ fontSize: 10, color: coreColor, letterSpacing: 1, marginBottom: 8 }}>LIGHT_TINT_PREVIEW</div>
                    <div style={{ fontSize: 14, color: textColors[currentAccent], fontWeight: 'bold', fontFamily: 'var(--font-display)' }}>
                        Affinity Engine Active
                    </div>
                </div>
            </div>

            {/* Auto-cycling colors (Injectors removed) */}

            {/* Definition Showcase */}
            <div style={{
                position: 'absolute',
                bottom: 40,
                left: 0,
                width: '100%',
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                gap: 40,
                zIndex: 250
            }}>
                {/* Ugly Box - OFF */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                    <div style={{
                        fontSize: 10,
                        color: '#666',
                        fontFamily: 'monospace',
                        letterSpacing: 2,
                        textTransform: 'uppercase'
                    }}>
                        [ SEROTONIN_ENGINE: OFF ]
                    </div>
                    <div style={{
                        background: 'white',
                        padding: '24px',
                        borderRadius: 20,
                        width: 520,
                        height: 180,
                        boxSizing: 'border-box',
                        display: 'flex',
                        flexDirection: 'column',
                        justifyContent: 'center',
                        boxShadow: '0 4px 6px rgba(0,0,0,0.3)',
                        border: '2px solid #ccc'
                    }}>
                        <div style={{
                            color: 'black',
                            fontFamily: '"Comic Sans MS", "Comic Sans", cursive',
                            fontSize: 16,
                            textAlign: 'left',
                            lineHeight: '1.7'
                        }}>
                            <strong>affinity (noun):</strong> a spontaneous or natural liking or sympathy for someone or something; a close similarity, connection, or relationship between things; a tendency to combine with or be attracted to something.
                        </div>
                    </div>
                </div>

                {/* Beautiful Box - ON */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                    <div style={{
                        fontSize: 10,
                        color: coreColor,
                        fontFamily: 'monospace',
                        letterSpacing: 2,
                        fontWeight: 'bold'
                    }}>
                        [ SEROTONIN_ENGINE: ON ]
                    </div>
                    <div style={{
                        background: 'white',
                        padding: '24px',
                        borderRadius: 20,
                        width: 520,
                        height: 180,
                        boxSizing: 'border-box',
                        display: 'flex',
                        flexDirection: 'column',
                        justifyContent: 'center',
                        boxShadow: `0 10px 30px rgba(0,0,0,0.5), 0 0 20px ${coreColor}30`,
                        border: `2px solid ${coreColor}80`
                    }}>
                        <div style={{
                            color: '#333',
                            fontFamily: 'var(--font-display), sans-serif',
                            fontSize: 19,
                            textAlign: 'left',
                            lineHeight: '1.7'
                        }}>
                            <motion.span animate={{ backgroundColor: scheme.badge1, color: 'white' }} transition={{ duration: 1 }} style={{ padding: '5px 14px', borderRadius: 12, fontWeight: '700', marginRight: 10, display: 'inline-block', boxShadow: `0 4px 10px ${scheme.badge1}40` }}>affinity</motion.span>
                            A <motion.span animate={{ color: scheme.colorize1 }} transition={{ duration: 1 }} style={{ fontWeight: '700' }}>spontaneous</motion.span> or <motion.span animate={{ color: scheme.colorize2 }} transition={{ duration: 1 }} style={{ fontWeight: '700' }}>natural</motion.span> liking or <motion.span animate={{ color: scheme.colorize3 }} transition={{ duration: 1 }} style={{ fontWeight: '700' }}>sympathy</motion.span> for <motion.span animate={{ backgroundColor: scheme.highlight1, color: 'white' }} transition={{ duration: 1 }} style={{ padding: '2px 8px', borderRadius: 5, fontWeight: '600' }}>someone</motion.span> or something; a <motion.span animate={{ backgroundColor: scheme.highlight2, color: 'white' }} transition={{ duration: 1 }} style={{ padding: '2px 8px', borderRadius: 5, fontWeight: '600' }}>close connection</motion.span> between things; a <motion.span animate={{ backgroundColor: scheme.highlight3, color: 'white' }} transition={{ duration: 1 }} style={{ padding: '2px 8px', borderRadius: 5, fontWeight: '600' }}>tendency</motion.span> to be attracted.
                        </div>
                    </div>
                </div>
            </div>

            {/* Scanlines Effect */}
            <div style={{
                position: 'absolute',
                top: 0, left: 0, right: 0, bottom: 0,
                background: `linear-gradient(rgba(18, 16, 16, 0) 50%, rgba(0, 0, 0, 0.25) 50%), linear-gradient(90deg, rgba(255, 0, 0, 0.06), rgba(0, 255, 0, 0.02), rgba(0, 0, 255, 0.06))`,
                backgroundSize: '100% 4px, 3px 100%',
                zIndex: 200,
                pointerEvents: 'none'
            }} />
        </motion.div>
    )
}

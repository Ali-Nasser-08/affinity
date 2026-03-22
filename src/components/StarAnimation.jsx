import { useState, useCallback, useRef, useEffect, forwardRef, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

// ═══════════════════════════════════════════════════════════
// STAR ANIMATION SYSTEM
// ═══════════════════════════════════════════════════════════
//
// 3 exports consumed by QuestionPlayer:
//   1. useStarAnimation()        → hook  { triggerFlight, reset, ...state }
//   2. <GlobalStarEffects />     → fixed overlay (flying star + trail)
//   3. <StarBadgeContainer />    → wrapper around student badge
// ═══════════════════════════════════════════════════════════

// ── Helpers ──────────────────────────────────────────────
const rand = (min, max) => Math.random() * (max - min) + min
const randInt = (min, max) => Math.floor(rand(min, max + 1))
const pick = arr => arr[Math.floor(Math.random() * arr.length)]

const PARTICLE_COLORS = [
    '#FFD700', '#FFF176', '#FFEB3B', '#FFC107',   // golds/yellows
    '#FF80AB', '#F06292', '#BA68C8', '#CE93D8',   // pinks/purples
    '#80DEEA', '#4DD0E1', '#00BCD4', '#26C6DA',   // cyans
    '#FFFFFF', '#FFF9C4',                          // whites
]

const GRADIENT_COLORS = ['#FFD700', '#00E5FF', '#FF4081', '#D500F9', '#FFEA00', '#00E676']

// ── Cubic Bézier evaluator ──────────────────────────────
function bezier(t, p0, p1, p2, p3) {
    const u = 1 - t
    return {
        x: u * u * u * p0.x + 3 * u * u * t * p1.x + 3 * u * t * t * p2.x + t * t * t * p3.x,
        y: u * u * u * p0.y + 3 * u * u * t * p1.y + 3 * u * t * t * p2.y + t * t * t * p3.y,
    }
}

// ══════════════════════════════════════════════════════════
// 1.  useStarAnimation — hook
// ══════════════════════════════════════════════════════════
export function useStarAnimation() {
    const [phase, setPhase] = useState('idle')   // idle | flying | landed
    const [starType, setStarType] = useState('star-base')
    const [origin, setOrigin] = useState(null)
    const [target, setTarget] = useState(null)
    const timerRef = useRef(null)

    const triggerFlight = useCallback((answerEl, badgeEl, type = 'star-base') => {
        if (!answerEl || !badgeEl) return
        const aRect = answerEl.getBoundingClientRect()
        const bRect = badgeEl.getBoundingClientRect()

        setOrigin({ x: aRect.left + aRect.width / 2, y: aRect.top + aRect.height / 2 })
        setTarget({ x: bRect.left + bRect.width / 2, y: bRect.top + bRect.height / 2 })
        setStarType(type)
        setPhase('flying')
    }, [])

    const reset = useCallback(() => {
        setPhase('idle')
        setOrigin(null)
        setTarget(null)
        if (timerRef.current) clearTimeout(timerRef.current)
    }, [])

    const land = useCallback(() => setPhase('landed'), [])

    return { phase, starType, origin, target, triggerFlight, reset, land }
}

// ══════════════════════════════════════════════════════════
// 2.  GlobalStarEffects — overlay that renders flying star
// ══════════════════════════════════════════════════════════
export function GlobalStarEffects({ state }) {
    const { phase, origin, target, land, starType } = state
    if (phase !== 'flying' || !origin || !target) return null
    return (
        <div style={{ position: 'fixed', inset: 0, zIndex: 9999, pointerEvents: 'none' }}>
            <FlyingStar origin={origin} target={target} onLand={land} type={starType} />
        </div>
    )
}

// ── FlyingStar sub-component ────────────────────────────
function FlyingStar({ origin, target, onLand, type }) {
    const [pos, setPos] = useState(origin)
    const [trail, setTrail] = useState([])
    const [visible, setVisible] = useState(true)
    const rafRef = useRef(null)
    const startRef = useRef(null)
    const trailIdRef = useRef(0)

    // Config based on type
    const config = useMemo(() => {
        if (type === 'star-radiant') return { color: '#D500F9', size: 60, rgb: '213,0,249' }
        if (type === 'star-spark') return { color: '#00E5FF', size: 54, rgb: '0,229,255' }
        return { color: '#FFD700', size: 48, rgb: '255,215,0' }
    }, [type])

    // Build an oval bézier path
    const path = useMemo(() => {
        const dx = target.x - origin.x
        const dy = target.y - origin.y
        // Control points create a slight oval arc
        const cp1 = {
            x: origin.x + dx * 0.25 + dy * 0.55,
            y: origin.y + dy * 0.15 - Math.abs(dx) * 0.35 - 120,
        }
        const cp2 = {
            x: origin.x + dx * 0.75 + dy * 0.15,
            y: origin.y + dy * 0.70 - Math.abs(dx) * 0.15 - 60,
        }
        return { p0: origin, p1: cp1, p2: cp2, p3: target }
    }, [origin, target])

    const FLIGHT_DURATION = 1400 // ms

    useEffect(() => {
        startRef.current = performance.now()
        let lastParticleTime = 0

        const tick = (now) => {
            const elapsed = now - startRef.current
            const t = Math.min(elapsed / FLIGHT_DURATION, 1) // 0 to 1

            // Ease-in-out cubic
            const ease = t < 0.5
                ? 4 * t * t * t
                : 1 - Math.pow(-2 * t + 2, 3) / 2

            const p = bezier(ease, path.p0, path.p1, path.p2, path.p3)
            setPos(p)

            // Emit particles more frequently/organically
            if (now - lastParticleTime > 25) { // every ~25ms
                lastParticleTime = now
                // Spawn 1-3 particles per tick for density
                const count = randInt(1, 3)
                const newParticles = []
                for (let i = 0; i < count; i++) {
                    trailIdRef.current++
                    const life = rand(1000, 2200) // Linger longer
                    const size = rand(4, 12)
                    newParticles.push({
                        id: trailIdRef.current,
                        x: p.x + rand(-10, 10),
                        y: p.y + rand(-10, 10),
                        color: pick(PARTICLE_COLORS),
                        size,
                        life,
                        // Gentle drift
                        vx: rand(-0.5, 0.5),
                        vy: rand(-0.5, 0.5),
                        startRotation: rand(0, 360),
                        rotSpeed: rand(-60, 60),
                        type: Math.random() > 0.3 ? 'star' : 'sparkle', // mostly stars/sparkles
                    })
                }

                setTrail(prev => {
                    const next = [...prev, ...newParticles]
                    // Cleanup old particles to prevent memory issues, generally keep last 80
                    return next.length > 80 ? next.slice(next.length - 80) : next
                })
            }

            if (t < 1) {
                rafRef.current = requestAnimationFrame(tick)
            } else {
                setVisible(false)
                onLand()
            }
        }

        rafRef.current = requestAnimationFrame(tick)
        return () => {
            if (rafRef.current) cancelAnimationFrame(rafRef.current)
        }
    }, [path, onLand])

    return (
        <>
            {/* Trail particles */}
            {trail.map(p => (
                <TrailParticle key={p.id} {...p} />
            ))}

            {/* The flying star itself */}
            {visible && (
                <div style={{
                    position: 'fixed',
                    left: pos.x - config.size / 2,
                    top: pos.y - config.size / 2,
                    width: config.size,
                    height: config.size,
                    pointerEvents: 'none',
                    zIndex: 10001,
                    filter: `drop-shadow(0 0 16px rgba(${config.rgb},0.8)) drop-shadow(0 0 32px rgba(${config.rgb},0.4))`,
                }}>
                    <span
                        className="material-symbols-rounded material-filled"
                        style={{
                            fontSize: config.size,
                            color: config.color,
                            display: 'block',
                            animation: 'starSpin 0.7s linear infinite',
                        }}
                    >star</span>
                </div>
            )}

            {/* Inline keyframes */}
            <style>{`
                @keyframes starSpin {
                    0%   { transform: rotate(0deg)   scale(1); }
                    50%  { transform: rotate(180deg) scale(1.15); }
                    100% { transform: rotate(360deg) scale(1); }
                }
            `}</style>
        </>
    )
}

// ── Trail Particle ──────────────────────────────────────
function TrailParticle({ x, y, color, size, life, vx, vy, startRotation, rotSpeed, type }) {
    const [gone, setGone] = useState(false)

    useEffect(() => {
        const t = setTimeout(() => setGone(true), life)
        return () => clearTimeout(t)
    }, [life])

    if (gone) return null

    const isStar = type === 'star' || type === 'sparkle'
    // Sparkle uses a different icon or shape if strictly 'sparkle',
    // but for now we'll stick to 'star' icon vs dot, or maybe 'auto_awesome' for sparkle?
    const iconName = type === 'sparkle' ? 'auto_awesome' : 'star'

    return (
        <div style={{
            position: 'fixed',
            left: x - size / 2,
            top: y - size / 2,
            width: isStar ? undefined : size,
            height: isStar ? undefined : size,
            borderRadius: isStar ? 0 : '50%',
            background: isStar ? 'none' : color,
            pointerEvents: 'none',
            zIndex: 10000,
            // Combined animation: fade + drift + twist
            animation: `trailLinger ${life}ms ease-out forwards`,
            filter: `drop-shadow(0 0 ${size * 0.8}px ${color})`,
            '--vx': `${vx * 30}px`,
            '--vy': `${vy * 30}px`,
            '--rot': `${startRotation}deg`,
            '--rot-end': `${startRotation + rotSpeed}deg`,
        }}>
            {isStar && (
                <span
                    className="material-symbols-rounded material-filled"
                    style={{ fontSize: size * 2.2, color, display: 'block' }}
                >{iconName}</span>
            )}

            <style>{`
                @keyframes trailLinger {
                    0% {
                        opacity: 0;
                        transform: translate(0, 0) rotate(var(--rot)) scale(0);
                    }
                    15% {
                        opacity: 1;
                        transform: translate(0, 0) rotate(var(--rot)) scale(1.2);
                    }
                    40% {
                         opacity: 0.9;
                         transform: translate(calc(var(--vx) * 0.4), calc(var(--vy) * 0.4)) rotate(var(--rot)) scale(1);
                    }
                    100% {
                        opacity: 0;
                        transform: translate(var(--vx), var(--vy)) rotate(var(--rot-end)) scale(0);
                    }
                }
            `}</style>
        </div>
    )
}

// ══════════════════════════════════════════════════════════
// 3.  StarBadgeContainer — wraps the name badge
// ══════════════════════════════════════════════════════════
export const StarBadgeContainer = forwardRef(function StarBadgeContainer(
    { children, starState, color },
    ref
) {
    const { phase } = starState
    const isLanded = phase === 'landed'
    const [burstParticles, setBurstParticles] = useState([])
    const [continuousParticles, setContinuousParticles] = useState([])
    const contIntervalRef = useRef(null)
    const burstIdRef = useRef(0)

    // --- BURST particles on land ---
    useEffect(() => {
        if (!isLanded) {
            setBurstParticles([])
            setContinuousParticles([])
            if (contIntervalRef.current) clearInterval(contIntervalRef.current)
            return
        }

        // Burst: lots of particles shoot out
        const burst = []
        for (let i = 0; i < 45; i++) {
            burstIdRef.current++
            const angle = rand(0, Math.PI * 2)
            const speed = rand(60, 180) // Faster burst
            burst.push({
                id: burstIdRef.current,
                angle,
                speed,
                color: pick(PARTICLE_COLORS),
                size: rand(5, 14),
                // Delay distinct from flight time, just for the burst sequence
                delay: rand(0, 200),
                duration: rand(1200, 2400), // Linger longer
                type: Math.random() > 0.4 ? (Math.random() > 0.5 ? 'star' : 'sparkle') : 'dot',
                startRotation: rand(0, 360),
                rotSpeed: rand(-60, 60),
            })
        }
        setBurstParticles(burst)

        // Continuous particles — emit slowly
        contIntervalRef.current = setInterval(() => {
            burstIdRef.current++
            const angle = rand(0, Math.PI * 2)
            setContinuousParticles(prev => [
                ...prev.slice(-30),
                {
                    id: burstIdRef.current,
                    angle,
                    speed: rand(40, 120),
                    color: pick(PARTICLE_COLORS),
                    size: rand(4, 10),
                    delay: 0,
                    duration: rand(1500, 3000), // Very long linger
                    type: Math.random() > 0.5 ? 'star' : (Math.random() > 0.5 ? 'sparkle' : 'dot'),
                    startRotation: rand(0, 360),
                    rotSpeed: rand(-40, 40),
                }
            ])
        }, 300) // Slower emission

        return () => {
            if (contIntervalRef.current) clearInterval(contIntervalRef.current)
        }
    }, [isLanded])

    // Gradient rotation angle
    const [gradAngle, setGradAngle] = useState(0)
    useEffect(() => {
        if (!isLanded) return
        let raf
        let start = performance.now()
        const spin = (now) => {
            setGradAngle(((now - start) / 8) % 360)
            raf = requestAnimationFrame(spin)
        }
        raf = requestAnimationFrame(spin)
        return () => cancelAnimationFrame(raf)
    }, [isLanded])

    const badgeStyle = useMemo(() => {
        const base = {
            display: 'inline-flex',
            alignItems: 'center',
            gap: '10px',
            padding: '6px 16px',
            borderRadius: '14px',
            position: 'relative',
            transition: 'all 0.5s cubic-bezier(.34,1.56,.64,1)',
            background: isLanded
                ? `linear-gradient(#fff, #fff) padding-box, conic-gradient(from ${gradAngle}deg, ${GRADIENT_COLORS.join(', ')}, ${GRADIENT_COLORS[0]}) border-box`
                : `${color}15`,
            border: isLanded ? '3px solid transparent' : `2px solid ${color}30`,
            color: '#334155',
            transform: isLanded ? 'scale(1.22) rotate(-3deg)' : 'scale(1) rotate(0deg)',
            boxShadow: isLanded
                ? `0 0 24px rgba(255,215,0,0.35), 0 0 48px rgba(255,215,0,0.15), 0 8px 32px rgba(0,0,0,0.10)`
                : '0 2px 8px rgba(0,0,0,0.06)',
            zIndex: isLanded ? 100 : 1,
            overflow: 'visible',
        }
        return base
    }, [isLanded, gradAngle, color])

    // ─────────────────────────────────────────────────────────────
    // NEW: Separate background styles to allow particles BEHIND it
    // ─────────────────────────────────────────────────────────────
    const backgroundLayerStyle = useMemo(() => {
        return {
            position: 'absolute',
            inset: 0,
            borderRadius: '14px',
            zIndex: -1, // Behind content
            transition: 'all 0.5s cubic-bezier(.34,1.56,.64,1)',
            background: isLanded
                ? `linear-gradient(#fff, #fff) padding-box, conic-gradient(from ${gradAngle}deg, ${GRADIENT_COLORS.join(', ')}, ${GRADIENT_COLORS[0]}) border-box`
                : `${color}15`,
            border: isLanded ? '3px solid transparent' : `2px solid ${color}30`,
            boxShadow: isLanded
                ? `0 0 24px rgba(255,215,0,0.35), 0 0 48px rgba(255,215,0,0.15), 0 8px 32px rgba(0,0,0,0.10)`
                : '0 2px 8px rgba(0,0,0,0.06)',
            pointerEvents: 'none',
        }
    }, [isLanded, gradAngle, color])

    // Container only handles layout + transform now
    const containerStyle = useMemo(() => {
        return {
            display: 'inline-flex',
            alignItems: 'center',
            gap: '10px',
            padding: '6px 16px',
            position: 'relative',
            zIndex: isLanded ? 100 : 1,
            transition: 'transform 0.5s cubic-bezier(.34,1.56,.64,1)',
            transform: isLanded ? 'scale(1.22) rotate(-3deg)' : 'scale(1) rotate(0deg)',
            overflow: 'visible',
            color: '#334155',
            // Note: Visual styles moved to backgroundLayerStyle
        }
    }, [isLanded])

    return (
        <div ref={ref} style={containerStyle}>
            {/* Background Layer */}
            <div style={backgroundLayerStyle} />

            {children}

            {/* Dancing star icon inside badge when landed */}
            {isLanded && (
                <>
                    <span
                        className="material-symbols-rounded material-filled"
                        style={{
                            fontSize: starState.starType === 'star-radiant' ? 50 : starState.starType === 'star-spark' ? 40 : 30,
                            color: starState.starType === 'star-radiant' ? '#D500F9' : starState.starType === 'star-spark' ? '#00E5FF' : '#FFD700',
                            filter: starState.starType === 'star-radiant'
                                ? 'drop-shadow(0 0 16px rgba(213,0,249,0.7))'
                                : starState.starType === 'star-spark'
                                    ? 'drop-shadow(0 0 12px rgba(0,229,255,0.7))'
                                    : 'drop-shadow(0 0 8px rgba(255,215,0,0.7))',
                            marginLeft: 2,
                            display: 'inline-block',
                            animation: 'starLandedDance 2s ease-in-out infinite, starLandedPop 0.5s ease-out forwards'
                        }}
                    >star</span>
                    <style>{`
                        @keyframes starLandedPop {
                            0% { transform: scale(0) rotate(-90deg); }
                            60% { transform: scale(1.5) rotate(10deg); }
                            100% { transform: scale(1) rotate(0deg); }
                        }
                        @keyframes starLandedDance {
                            0% { transform: scale(1) rotate(0deg); }
                            25% { transform: scale(1) rotate(20deg); }
                            50% { transform: scale(1) rotate(-15deg); }
                            75% { transform: scale(1) rotate(10deg); }
                            85% { transform: scale(1) rotate(-10deg); }
                            95% { transform: scale(1) rotate(5deg); }
                            100% { transform: scale(1) rotate(0deg); }
                        }
                    `}</style>
                </>
            )}

            {/* Burst particles on landing */}
            {burstParticles.map(p => (
                <BadgeParticle key={`b${p.id}`} {...p} />
            ))}

            {/* Continuous particles */}
            {continuousParticles.map(p => (
                <BadgeParticle key={`c${p.id}`} {...p} />
            ))}

            {/* Inline keyframe for badge glow pulse */}
            {isLanded && (
                <style>{`
                    @keyframes badgePulse {
                        0%, 100% { box-shadow: 0 0 18px rgba(255,215,0,0.3), 0 0 36px rgba(255,215,0,0.1); }
                        50%      { box-shadow: 0 0 30px rgba(255,215,0,0.5), 0 0 60px rgba(255,215,0,0.2); }
                    }
                `}</style>
            )}
        </div>
    )
})

// ── Badge Particle (burst + continuous) ─────────────────
function BadgeParticle({ angle, speed, color, size, delay, duration, type, startRotation, rotSpeed }) {
    const [gone, setGone] = useState(false)

    useEffect(() => {
        const t = setTimeout(() => setGone(true), delay + duration)
        return () => clearTimeout(t)
    }, [delay, duration])

    if (gone) return null

    const dx = Math.cos(angle) * speed
    const dy = Math.sin(angle) * speed
    const isStar = type === 'star' || type === 'sparkle'
    const iconName = type === 'sparkle' ? 'auto_awesome' : 'star'

    return (
        <div style={{
            position: 'absolute',
            left: '50%',
            top: '50%',
            width: isStar ? undefined : size,
            height: isStar ? undefined : size,
            marginLeft: isStar ? -size : -size / 2,
            marginTop: isStar ? -size : -size / 2,
            borderRadius: isStar ? 0 : '50%',
            background: isStar ? 'none' : color,
            pointerEvents: 'none',
            zIndex: -2, // Behind background 
            animation: `badgeLinger ${duration}ms ease-out ${delay}ms both`,
            filter: `drop-shadow(0 0 ${size * 0.8}px ${color})`,
            '--tx': `${dx}px`,
            '--ty': `${dy}px`,
            '--rot': `${startRotation}deg`,
            '--rot-end': `${startRotation + rotSpeed}deg`,
        }}>
            {isStar && (
                <span
                    className="material-symbols-rounded material-filled"
                    style={{ fontSize: size * 2.2, color, display: 'block' }}
                >{iconName}</span>
            )}

            <style>{`
                @keyframes badgeLinger {
                    0% {
                        opacity: 0;
                        transform: translate(0, 0) rotate(var(--rot)) scale(0);
                    }
                    10% {
                        opacity: 1;
                        transform: translate(0, 0) rotate(var(--rot)) scale(1.1);
                    }
                    30% {
                         opacity: 1;
                         /* Move slightly out */
                         transform: translate(calc(var(--tx) * 0.3), calc(var(--ty) * 0.3)) rotate(var(--rot)) scale(1);
                    }
                    100% {
                        opacity: 0;
                        /* Final destination */
                        transform: translate(var(--tx), var(--ty)) rotate(var(--rot-end)) scale(0);
                    }
                }
            `}</style>
        </div>
    )
}

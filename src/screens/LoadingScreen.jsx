import { useEffect, useRef, useState, useCallback } from 'react'  // eslint-disable-line no-unused-vars
import { bgTints, colorValues, textColors, getRandomAccentExcluding } from '../engine/serotoninEngine'

/* ─── Word Pool ─────────────────────────────────────────────────────────── */
const loadingWords = [
    'brewing', 'creating', 'mixing', 'reacting', 'forming',
    'blending', 'crafting', 'fusing', 'sparking', 'building',
    'shaping', 'merging', 'evolving', 'growing', 'stirring',
    'combining', 'composing', 'designing', 'developing', 'generating',
    'igniting', 'kindling', 'making', 'preparing', 'synthesizing',
    'transforming', 'weaving', 'working', 'assembling', 'conjuring',
]

/* ─── Timing ─────────────────────────────────────────────────────────────── */
const CYCLE_MS = 3000   // Total cycle: drop forms → lands → ripple → pause
const DROP_FALL_MS = 1800   // Drop travel duration
const LAND_OFFSET_MS = 1550   // When droplet hits the word (within cycle)
const RIPPLE_MS = 950    // Ripple expansion duration
const WORD_DELAY_MS = 200    // Word changes this many ms after ripple starts
const COLOR_DELAY_MS = 200    // Accent color changes this many ms after ripple starts

/* ─── Helpers ────────────────────────────────────────────────────────────── */
const pick = (arr, exclude) => {
    const pool = arr.filter((_, i) => i !== exclude)
    return pool[Math.floor(Math.random() * pool.length)]
}

/* ─────────────────────────────────────────────────────────────────────────── */
export function LoadingScreen({ error, onDismissError }) {
    const [accent, setAccent] = useState('cyan')
    const [nextAccent, setNextAccent] = useState(() => getRandomAccentExcluding('cyan'))
    const [wordIndex, setWordIndex] = useState(0)
    const [dropPhase, setDropPhase] = useState('idle') // idle | forming | falling | absorbed
    const [dropScale, setDropScale] = useState(0)
    const [dropY, setDropY] = useState(0)
    const [dropStretch, setDropStretch] = useState(1)
    const [rippleActive, setRippleActive] = useState(false)
    const [rippleKey, setRippleKey] = useState(0)
    const [wordKey, setWordKey] = useState(0)
    const [isExiting, setIsExiting] = useState(false)
    const [swayAngle, setSwayAngle] = useState(0)
    const [liquidLevel, setLiquidLevel] = useState(0.55)

    const rafRef = useRef(null)
    const timersRef = useRef([])
    const cycleStart = useRef(null)
    const accentRef = useRef('cyan')
    const nextAccentRef = useRef(getRandomAccentExcluding('cyan'))
    const wordIndexRef = useRef(0)
    const unusedIndicesRef = useRef([])

    // Sync refs so RAF callbacks can read latest state without stale closures
    useEffect(() => { accentRef.current = accent }, [accent])
    useEffect(() => { nextAccentRef.current = nextAccent }, [nextAccent])
    useEffect(() => { wordIndexRef.current = wordIndex }, [wordIndex])

    const clearTimers = () => {
        timersRef.current.forEach(id => clearTimeout(id))
        timersRef.current = []
    }

    const addTimer = (fn, ms) => {
        const id = setTimeout(fn, ms)
        timersRef.current.push(id)
        return id
    }

    /* ── Idle sway animation ──────────────────────────────────────────────── */
    useEffect(() => {
        let t = 0
        const swayRaf = () => {
            t += 0.018
            setSwayAngle(Math.sin(t) * 3.5)
            rafRef.current = requestAnimationFrame(swayRaf)
        }
        rafRef.current = requestAnimationFrame(swayRaf)
        return () => cancelAnimationFrame(rafRef.current)
    }, [])

    /* ── Drop physics RAF ────────────────────────────────────────────────────
        Separate from sway so both can run independently.                     */
    const dropRafRef = useRef(null)
    const runDropAnimation = useCallback((startTime) => {
        const animate = (now) => {
            const elapsed = now - startTime

            if (elapsed < 300) {
                // Phase 1: forming (0–300 ms) — grow from 0 → 1
                const t = elapsed / 300
                const eased = 1 - Math.pow(1 - t, 2)
                setDropPhase('forming')
                setDropScale(eased * 0.9 + Math.sin(t * Math.PI) * 0.1)
                setDropStretch(1)
                setDropY(0)
                dropRafRef.current = requestAnimationFrame(animate)
            } else if (elapsed < DROP_FALL_MS) {
                // Phase 2: surface tension break then fall (300–1800 ms)
                const t = (elapsed - 300) / (DROP_FALL_MS - 300)
                const eased = t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2
                // Slight elongation stretch during fall, max at mid-fall
                const stretch = 1 + Math.sin(t * Math.PI) * 0.35
                setDropPhase('falling')
                setDropScale(1)
                setDropY(eased * 100) // 0–100% of fall distance (CSS handles px)
                setDropStretch(stretch)
                dropRafRef.current = requestAnimationFrame(animate)
            } else {
                // Phase 3: absorbed
                setDropPhase('absorbed')
                setDropScale(0)
                setDropY(0)
                setDropStretch(1)
            }
        }
        dropRafRef.current = requestAnimationFrame(animate)
    }, [])

    /* ── Main cycle ──────────────────────────────────────────────────────── */
    useEffect(() => {
        const runCycle = () => {
            const start = performance.now()
            cycleStart.current = start

            // Slightly randomize liquid level each cycle for realism
            setLiquidLevel(prev => Math.max(0.35, Math.min(0.75, prev + (Math.random() - 0.5) * 0.05)))

            // Start drop animation
            runDropAnimation(start)

            // Trigger word exit animation early
            addTimer(() => {
                setIsExiting(true)
            }, LAND_OFFSET_MS - 550)

            // On landing → trigger ripple + schedule state changes
            addTimer(() => {
                // Absorb flash
                setDropPhase('absorbed')

                // Ripple starts immediately at landing
                setRippleKey(k => k + 1)
                setRippleActive(true)

                // Word changes slightly after ripple starts
                addTimer(() => {
                    let bag = unusedIndicesRef.current
                    if (bag.length === 0) {
                        // Refill bag with all possible indices
                        bag = Array.from({ length: loadingWords.length }, (_, i) => i)
                        // Make sure we don't immediately repeat the very last word from the previous bag
                        const currentInBag = bag.indexOf(wordIndexRef.current)
                        if (currentInBag !== -1) {
                            bag.splice(currentInBag, 1)
                        }
                    }

                    const pickIndex = Math.floor(Math.random() * bag.length)
                    const nextIdx = bag.splice(pickIndex, 1)[0]
                    unusedIndicesRef.current = bag

                    setWordIndex(nextIdx)
                    setIsExiting(false)
                    setWordKey(k => k + 1)
                }, WORD_DELAY_MS)

                // Accent color shifts as ripple reaches the edges
                addTimer(() => {
                    const newNext = getRandomAccentExcluding(nextAccentRef.current)
                    setAccent(nextAccentRef.current)
                    setNextAccent(newNext)
                }, COLOR_DELAY_MS)

                // Ripple fades out
                addTimer(() => {
                    setRippleActive(false)
                }, RIPPLE_MS + 50)

            }, LAND_OFFSET_MS)
        }

        runCycle()
        const intervalId = setInterval(runCycle, CYCLE_MS)
        return () => {
            clearInterval(intervalId)
            clearTimers()
            cancelAnimationFrame(dropRafRef.current)
        }
    }, [runDropAnimation]) // eslint-disable-line

    /* ── Derived colors ─────────────────────────────────────────────────── */
    const accentHex = colorValues[accent]
    const bgColor = bgTints[accent]
    const baseText = textColors[accent]
    // Mix the dark text color with the pure saturated accent color to make it brighter & more saturated
    const textColor = `color-mix(in srgb, ${accentHex} 55%, ${baseText})`
    const word = loadingWords[wordIndex]

    /* ── Drop visual position ─────────────────────────────────────────────
        The flask is at top-center. The drop starts at the flask spout
        and falls to the vertical center of the screen.                     */
    const FLASK_TIP_X = 0        // relative to drop container center (0 = center)
    const FLASK_TIP_Y = -42      // px above center (within a centered absolute div)
    const DROP_FALL_PX = 'calc(38vh)'  // how far it falls (to center word)

    const dropTranslateY = dropPhase === 'falling' ? `calc(${dropY / 100} * ${DROP_FALL_PX})` : '0px'

    return (
        <div
            className="ls-root"
            style={{
                '--accent': accentHex,
                '--bg': bgColor,
                '--text': textColor,
                '--ripple-dur': `${RIPPLE_MS}ms`,
            }}
        >
            {/* ── Embedded Styles ─────────────────────────────────────────── */}
            <style>{`
                @import url('https://fonts.googleapis.com/css2?family=Fredoka:wght@400;600;700&display=swap');

                @property --accent { syntax: '<color>'; inherits: true; initial-value: transparent; }
                @property --bg { syntax: '<color>'; inherits: true; initial-value: transparent; }
                @property --text { syntax: '<color>'; inherits: true; initial-value: transparent; }

                .ls-root {
                    position: fixed;
                    inset: 0;
                    background-color: var(--bg);
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    justify-content: center;
                    font-family: 'Fredoka', 'Nunito', sans-serif;
                    overflow: hidden;
                    transition: background-color 0.8s ease, --bg 0.8s ease, --accent 0.8s ease, --text 0.8s ease;
                    z-index: 9000;
                }

                /* ── Background particle shimmer ───────────────────────────── */
                .ls-root::before {
                    content: '';
                    position: absolute;
                    inset: 0;
                    background: radial-gradient(
                        ellipse at 50% 0%,
                        color-mix(in srgb, var(--accent) 18%, transparent) 0%,
                        transparent 60%
                    );
                    transition: background 0.7s ease;
                    pointer-events: none;
                }

                /* ── Flask wrapper (top-center) ─────────────────────────────── */
                .ls-flask-wrapper {
                    position: absolute;
                    top: 6vh;
                    left: 50%;
                    transform: translateX(-50%);
                    width: 160px;
                    height: 200px;
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    z-index: 10;
                    filter: drop-shadow(0 6px 24px color-mix(in srgb, var(--accent) 40%, transparent));
                    transition: filter 0.7s ease;
                }

                /* ── Flask SVG itself (tilted) ──────────────────────────────── */
                .ls-flask-svg {
                    /* gentle idle breathing */
                    animation: ls-flask-breathe 3s ease-in-out infinite;
                    transform-origin: center bottom;
                }

                @keyframes ls-flask-breathe {
                    0%   { transform: rotate(-4deg) translateY(0px); }
                    50%  { transform: rotate(-4deg) translateY(-4px); }
                    100% { transform: rotate(-4deg) translateY(0px); }
                }

                /* ── Liquid fill inside flask ───────────────────────────────── */
                .ls-liquid {
                    transition: fill 0.7s ease;
                    animation: ls-liquid-wave 2.5s ease-in-out infinite;
                    transform-origin: center center;
                }
                @keyframes ls-liquid-wave {
                    0%   { d: path("M22 72 Q38 68 54 72 Q70 76 82 72 L82 105 Q54 108 22 105 Z"); }
                    50%  { d: path("M22 72 Q38 76 54 72 Q70 68 82 72 L82 105 Q54 108 22 105 Z"); }
                    100% { d: path("M22 72 Q38 68 54 72 Q70 76 82 72 L82 105 Q54 108 22 105 Z"); }
                }

                /* ── Drop container (full-screen overlay for positioning) ───── */
                .ls-drop-layer {
                    position: absolute;
                    inset: 0;
                    pointer-events: none;
                    z-index: 8;
                    display: flex;
                    align-items: flex-start;
                    justify-content: center;
                }

                .ls-drop {
                    position: absolute;
                    /* start position: just below flask spout (top-center area) */
                    top: calc(6vh + 150px);
                    left: 50%;
                    margin-left: -7px;
                    width: 14px;
                    border-radius: 50% 50% 55% 55%;
                    background: radial-gradient(
                        ellipse at 35% 30%,
                        rgba(255, 255, 255, 0.85) 0%,
                        var(--accent) 60%,
                        color-mix(in srgb, var(--accent) 70%, #000) 100%
                    );
                    box-shadow:
                        0 0 12px var(--accent),
                        0 0 30px color-mix(in srgb, var(--accent) 50%, transparent),
                        inset 0 -2px 4px rgba(0,0,0,0.15);
                    transform-origin: top center;
                    transition: background 0.7s ease, box-shadow 0.7s ease;
                }

                /* ── Drop forming phase ─────────────────────────────────────── */
                .ls-drop[data-phase="forming"] {
                    /* surface tension wobble */
                    animation: ls-drop-tension 0.4s ease-in-out infinite alternate;
                }
                @keyframes ls-drop-tension {
                    from { border-radius: 50% 50% 55% 55%; }
                    to   { border-radius: 45% 45% 60% 60%; }
                }

                .ls-drop[data-phase="absorbed"] {
                    opacity: 0;
                    transform: scaleX(1.8) scaleY(0.3) !important;
                    transition: opacity 0.12s ease, transform 0.12s ease;
                }

                /* ── Splash particles ───────────────────────────────────────── */
                .ls-splash {
                    position: absolute;
                    top: 50%;
                    left: 50%;
                    width: 6px;
                    height: 6px;
                    border-radius: 50%;
                    background: var(--accent);
                    opacity: 0;
                    pointer-events: none;
                    z-index: 9;
                }
                .ls-splash.active {
                    animation: ls-splash-fly var(--dur, 0.5s) ease-out forwards;
                }
                @keyframes ls-splash-fly {
                    0%   { transform: translate(var(--sx,0px), var(--sy,0px)) scale(1); opacity: 0.9; }
                    100% { transform: translate(var(--ex,0px), var(--ey,-40px)) scale(0.2); opacity: 0; }
                }

                /* ── Center word ─────────────────────────────────────────────── */
                .ls-center {
                    position: relative;
                    z-index: 6;
                    text-align: center;
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    justify-content: center;
                    gap: 0;
                }
                .ls-word {
                    font-size: clamp(72px, 10vw, 140px);
                    font-weight: 700;
                    letter-spacing: 2px;
                    color: var(--text);
                    line-height: 1;
                    perspective: 1000px;
                }
                .ls-letter-in {
                    display: inline-block;
                    animation: ls-letter-flip 0.6s cubic-bezier(0.175, 0.885, 0.32, 1.275) both;
                    transform-origin: center;
                }
                .ls-letter-out {
                    display: inline-block;
                    animation: ls-letter-exit 0.35s cubic-bezier(0.6, -0.28, 0.735, 0.045) forwards;
                    transform-origin: center;
                }
                @keyframes ls-letter-flip {
                    0%  { transform: rotateY(90deg) scale(0.9); opacity: 0; filter: blur(2px); }
                    100%{ transform: rotateY(0deg) scale(1); opacity: 1; filter: blur(0px); }
                }
                @keyframes ls-letter-exit {
                    0%  { transform: rotateY(0deg) scale(1); opacity: 1; filter: blur(0px); }
                    100%{ transform: rotateY(-90deg) scale(0.9); opacity: 0; filter: blur(2px); }
                }

                /* ── Ellipsis dots ──────────────────────────────────────────── */
                .ls-dots {
                    display: flex;
                    gap: 8px;
                    margin-top: 20px;
                    align-items: center;
                }
                .ls-dot {
                    width: 10px;
                    height: 10px;
                    border-radius: 50%;
                    background: var(--accent);
                    opacity: 0.6;
                    animation: ls-dot-pulse 1.4s ease-in-out infinite;
                }
                .ls-dot:nth-child(2) { animation-delay: 0.2s; }
                .ls-dot:nth-child(3) { animation-delay: 0.4s; }
                @keyframes ls-dot-pulse {
                    0%, 80%, 100% { transform: scale(0.8); opacity: 0.4; }
                    40%           { transform: scale(1.2); opacity: 1;   }
                }

                /* ════════════════════════════════════════════════════════════
                   RIPPLE — The glitchy chromatic-aberration chemical reaction
                   ════════════════════════════════════════════════════════════ */
                .ls-ripple-host {
                    position: absolute;
                    top: 50%;
                    left: 50%;
                    transform: translate(-50%, -50%);
                    pointer-events: none;
                    z-index: 7;
                }

                /* Base expanding ring */
                .ls-ripple {
                    position: absolute;
                    top: 0; left: 0;
                    width: 120px; height: 120px;
                    margin: -60px 0 0 -60px;
                    border-radius: 50%;
                    opacity: 0;
                    pointer-events: none;
                }
                .ls-ripple.active {
                    animation: ls-ripple-expand var(--ripple-dur) cubic-bezier(0.1, 0.6, 0.3, 1) forwards;
                }

                /* Primary luminous ring */
                .ls-ripple-core {
                    border: 3px solid var(--accent);
                    box-shadow:
                        0 0 20px var(--accent),
                        0 0 60px color-mix(in srgb, var(--accent) 50%, transparent),
                        inset 0 0 30px color-mix(in srgb, var(--accent) 20%, transparent);
                    background: radial-gradient(
                        circle,
                        color-mix(in srgb, var(--accent) 15%, transparent) 0%,
                        transparent 70%
                    );
                }
                @keyframes ls-ripple-expand {
                    0%   { transform: scale(0.05); opacity: 1; }
                    60%  { opacity: 0.8; }
                    100% { transform: scale(9);   opacity: 0; }
                }

                /* Chromatic aberration — red channel offset */
                .ls-ripple-r {
                    border: 2px solid rgba(255, 40, 80, 0.8);
                    box-shadow: 0 0 14px rgba(255, 40, 80, 0.6);
                    mix-blend-mode: screen;
                }
                .ls-ripple-r.active {
                    animation: ls-ripple-r-expand var(--ripple-dur) cubic-bezier(0.1, 0.6, 0.3, 1) forwards;
                }
                @keyframes ls-ripple-r-expand {
                    0%   { transform: scale(0.05) translate(-6px, -3px); opacity: 0.9; }
                    30%  { transform: scale(3)    translate(-10px,-5px); opacity: 0.7; }
                    60%  { transform: scale(6)    translate(-4px, -2px); opacity: 0.4; }
                    100% { transform: scale(9)    translate(0, 0);       opacity: 0;   }
                }

                /* Chromatic aberration — blue channel offset */
                .ls-ripple-b {
                    border: 2px solid rgba(30, 140, 255, 0.8);
                    box-shadow: 0 0 14px rgba(30, 140, 255, 0.6);
                    mix-blend-mode: screen;
                }
                .ls-ripple-b.active {
                    animation: ls-ripple-b-expand var(--ripple-dur) cubic-bezier(0.1, 0.6, 0.3, 1) forwards;
                }
                @keyframes ls-ripple-b-expand {
                    0%   { transform: scale(0.05) translate(6px, 3px); opacity: 0.9; }
                    30%  { transform: scale(3)    translate(10px,5px); opacity: 0.7; }
                    60%  { transform: scale(6)    translate(4px, 2px); opacity: 0.4; }
                    100% { transform: scale(9)    translate(0, 0);     opacity: 0;   }
                }

                /* Distortion shockwave ring */
                .ls-ripple-shock {
                    border: 6px solid color-mix(in srgb, var(--accent) 30%, white);
                    background: transparent;
                    filter: blur(2px);
                }
                .ls-ripple-shock.active {
                    animation: ls-ripple-shock-expand var(--ripple-dur) ease-out forwards;
                }
                @keyframes ls-ripple-shock-expand {
                    0%   { transform: scale(0.05); opacity: 0.6; filter: blur(1px); }
                    40%  { opacity: 0.4; filter: blur(3px); }
                    100% { transform: scale(10);  opacity: 0;   filter: blur(8px); }
                }

                /* Glitch scanline sweep */
                .ls-ripple-scan {
                    background: repeating-linear-gradient(
                        0deg,
                        transparent 0px,
                        transparent 5px,
                        color-mix(in srgb, var(--accent) 30%, transparent) 5px,
                        color-mix(in srgb, var(--accent) 30%, transparent) 7px
                    );
                    border-radius: 50%;
                    mix-blend-mode: overlay;
                }
                .ls-ripple-scan.active {
                    animation: ls-ripple-scan-expand var(--ripple-dur) ease-out forwards;
                }
                @keyframes ls-ripple-scan-expand {
                    0%   { transform: scale(0.05) rotate(0deg);   opacity: 0.7; }
                    50%  { transform: scale(4)    rotate(15deg);  opacity: 0.4; }
                    100% { transform: scale(9)    rotate(30deg);  opacity: 0;   }
                }

                /* ── Error banner ─────────────────────────────────────────── */
                .ls-error {
                    position: absolute;
                    bottom: 32px;
                    left: 50%;
                    transform: translateX(-50%);
                    background: rgba(255, 255, 255, 0.9);
                    border: 2.5px solid var(--accent);
                    color: #1f2937;
                    border-radius: 20px;
                    padding: 16px 24px;
                    font-size: 18px;
                    font-weight: 600;
                    display: flex;
                    gap: 16px;
                    align-items: center;
                    z-index: 20;
                    box-shadow: 0 8px 32px color-mix(in srgb, var(--accent) 25%, transparent);
                    backdrop-filter: blur(8px);
                }
                .ls-error button {
                    background: var(--accent);
                    color: #fff;
                    border: none;
                    border-radius: 14px;
                    padding: 10px 20px;
                    font-family: 'Fredoka', sans-serif;
                    font-size: 16px;
                    font-weight: 700;
                    cursor: pointer;
                    transition: transform 0.15s ease, filter 0.15s ease;
                }
                .ls-error button:hover {
                    transform: scale(1.05);
                    filter: brightness(1.1);
                }

                /* ── Bubble rise in the flask liquid ───────────────────────── */
                @keyframes ls-bubble-a {
                    0%   { transform: translateY(0) scale(1);    opacity: 0.7; }
                    50%  { transform: translateY(-8px) scale(1.1); opacity: 0.9; }
                    100% { transform: translateY(-16px) scale(0.6); opacity: 0; }
                }
                @keyframes ls-bubble-b {
                    0%   { transform: translateY(0) scale(1.1);  opacity: 0.6; }
                    60%  { transform: translateY(-10px) scale(0.9); opacity: 0.8; }
                    100% { transform: translateY(-20px) scale(0.5); opacity: 0; }
                }

                /* ── Mist / vapor from spout ─────────────────────────────── */
                .ls-mist {
                    position: absolute;
                    top: calc(6vh + 8px);
                    left: 50%;
                    width: 6px;
                    height: 6px;
                    border-radius: 50%;
                    background: var(--accent);
                    opacity: 0;
                    pointer-events: none;
                    z-index: 9;
                    animation: ls-mist-rise 2.5s ease-out infinite;
                    filter: blur(2px);
                }
                .ls-mist:nth-child(2) { animation-delay: 0.6s;  left: calc(50% - 5px); }
                .ls-mist:nth-child(3) { animation-delay: 1.2s;  left: calc(50% + 6px); }
                @keyframes ls-mist-rise {
                    0%   { transform: translateY(0)    scale(0.5); opacity: 0.4; }
                    60%  { transform: translateY(-30px) scale(1.8); opacity: 0.2; }
                    100% { transform: translateY(-55px) scale(2.5); opacity: 0;   }
                }
            `}</style>



            {/* ── Center Word ─────────────────────────────────────────────── */}
            <div className="ls-center">
                <div className="ls-word">
                    {word.split('').map((char, i) => (
                        <span
                            key={`${wordKey}-span-${i}`}
                            className={isExiting ? "ls-letter-out" : "ls-letter-in"}
                            style={{
                                animationDelay: isExiting ? `${i * 0.03}s` : `${i * 0.04}s`,
                                textTransform: i === 0 ? 'capitalize' : 'none'
                            }}
                        >
                            {char}
                        </span>
                    ))}
                </div>
                <div className="ls-dots">
                    <div className="ls-dot" />
                    <div className="ls-dot" />
                    <div className="ls-dot" />
                </div>
            </div>



            {/* ── Error Panel ─────────────────────────────────────────────── */}
            {error && (
                <div className="ls-error">
                    <span>{error}</span>
                    {onDismissError && (
                        <button type="button" onClick={onDismissError}>Back</button>
                    )}
                </div>
            )}
        </div>
    )
}


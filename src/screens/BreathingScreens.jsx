import { motion, AnimatePresence } from 'framer-motion'
import { useEffect, useRef, useCallback, useState } from 'react'
import { colorValues } from '../engine/serotoninEngine'

import coherentBg from '../assets/breathing/backgrounds/coherent-gradient-bg.png'
import coherentGraphic from '../assets/breathing/graphics/coherent.png'
import psychosighBg from '../assets/breathing/backgrounds/psychosigh-gradient-bg.png'
import psychosighGraphic from '../assets/breathing/graphics/psychosigh.png'
import boxBg from '../assets/breathing/backgrounds/box-gradient-bg.png'
import boxGraphic from '../assets/breathing/graphics/box.png'

/* ─────────────────────────────────────────────
   SHARED STYLES (injected once)
───────────────────────────────────────────── */
const SHARED_STYLE = `
@import url('https://fonts.googleapis.com/css2?family=Fredoka:wght@400;500;600;700&display=swap');

.br-wrap {
    width: 100%; height: 100%; position: relative;
    display: flex; flex-direction: column;
    background: #0a0a0f;
    font-family: 'Fredoka', sans-serif;
    overflow: hidden;
}

/* ── top bar ── */
.br-topbar {
    position: absolute; top: 0; left: 0; right: 0;
    display: flex; align-items: center; justify-content: space-between;
    padding: 20px 28px;
    z-index: 20;
}
.br-back-btn {
    width: 44px; height: 44px; border-radius: 50%;
    border: 1.5px solid rgba(255,255,255,0.25);
    background: rgba(255,255,255,0.06);
    backdrop-filter: blur(8px);
    display: flex; align-items: center; justify-content: center;
    cursor: pointer; transition: all 0.25s;
    flex-shrink: 0;
}
.br-back-btn:hover { background: rgba(255,255,255,0.14); transform: scale(1.07); }
.br-back-btn svg { width: 20px; height: 20px; stroke: rgba(255,255,255,0.85); fill: none; stroke-width: 2.2; stroke-linecap: round; stroke-linejoin: round; }

/* ── menu grid ── */
.br-menu {
    flex: 1; display: flex; flex-direction: column;
    align-items: center; justify-content: center;
    gap: 0; padding: 0 32px 64px;
}
.br-menu-title {
    font-family: 'Fredoka', sans-serif;
    font-size: clamp(28px, 4vw, 46px);
    font-weight: 600;
    color: rgba(255,255,255,0.92);
    letter-spacing: 0.5px;
    margin-bottom: 36px;
    text-align: center;
}
.br-cards-row {
    display: flex; gap: 24px; align-items: stretch;
    width: 100%; max-width: 960px;
}

/* ── card ── */
.br-card {
    flex: 1; min-width: 0;
    border-radius: 28px;
    border: 1px solid rgba(255,255,255,0.1);
    position: relative; overflow: hidden;
    cursor: pointer; aspect-ratio: 1 / 1.45;
}
.br-card-bg, .br-card-graphic {
    position: absolute; inset: 0; width: 100%; height: 100%;
    object-fit: cover; pointer-events: none;
    transition: transform 0.6s cubic-bezier(0.34, 1.56, 0.64, 1);
}
.br-card:hover .br-card-bg {
    transform: scale(1.05);
}
.br-card:hover .br-card-graphic {
    transform: scale(1.12) translateY(-6px);
}
.br-card-bg { filter: saturate(1.8) brightness(0.9); }
.br-card-bg.br-pink { filter: saturate(1.8) hue-rotate(-40deg) brightness(0.85); }
.br-card-bg.br-cyan { filter: saturate(2) hue-rotate(15deg) brightness(0.95); }
.br-card-bg.br-purple { filter: saturate(3) hue-rotate(25deg) brightness(0.9); }
.br-card-glow {
    position: absolute; inset: 8%; border-radius: 24px;
    filter: blur(36px); opacity: 0.45; z-index: 0;
    transition: opacity 0.3s;
}
.br-card:hover .br-card-glow { opacity: 0.7; }
.br-card-info {
    position: absolute; top: 24px; left: 24px; right: 24px;
    z-index: 3; pointer-events: none; color: white;
}
.br-card-label {
    font-family: 'Fredoka', sans-serif;
    font-size: clamp(22px, 2.2vw, 30px);
    font-weight: 600;
    line-height: 1.15;
    text-shadow: 0 2px 14px rgba(0,0,0,0.45);
    white-space: pre-line;
    margin-bottom: 10px;
}
.br-card-pill {
    display: inline-block;
    padding: 5px 14px;
    background: rgba(255,255,255,0.18);
    border: 1px solid rgba(255,255,255,0.28);
    border-radius: 50px;
    font-size: 13px; font-weight: 500;
    backdrop-filter: blur(10px);
    letter-spacing: 0.2px;
}
.br-card-arrow {
    position: absolute; bottom: 20px; right: 20px;
    z-index: 3; width: 36px; height: 36px; border-radius: 50%;
    background: rgba(255,255,255,0.18);
    border: 1px solid rgba(255,255,255,0.28);
    display: flex; align-items: center; justify-content: center;
    backdrop-filter: blur(8px);
    transition: all 0.4s cubic-bezier(0.34, 1.56, 0.64, 1);
}
.br-card:hover .br-card-arrow { 
    background: rgba(255,255,255,0.4); 
    transform: translate(-4px, -4px) scale(1.15);
}
.br-card-arrow svg { width: 16px; height: 16px; stroke: white; fill: none; stroke-width: 2.5; stroke-linecap: round; stroke-linejoin: round; }

@media (max-width: 700px) {
    .br-cards-row { flex-direction: column; align-items: center; max-width: 340px; }
    .br-card { width: 100%; aspect-ratio: 1 / 1.3; min-width: unset; }
}

/* ── exercise screens (canvas-based) ── */
.br-exercise {
    width: 100%; height: 100%; position: relative; overflow: hidden;
    background: #000;
}
.br-exercise canvas {
    position: absolute; inset: 0; width: 100%; height: 100%;
}
.br-exercise-ui {
    position: absolute; inset: 0; z-index: 10;
    pointer-events: none;
    display: flex; flex-direction: column; justify-content: flex-end;
}
.br-exercise-text {
    text-align: center;
    padding-bottom: 12%;
    pointer-events: none;
}
.br-exercise-countdown {
    font-family: 'Fredoka', sans-serif;
    font-size: clamp(80px, 12vw, 130px);
    font-weight: 600;
    color: white;
    line-height: 1;
    margin-bottom: 6px;
    text-shadow: 0 4px 24px rgba(0,0,0,0.5);
}
.br-exercise-phase {
    font-family: 'Fredoka', sans-serif;
    font-size: clamp(30px, 5vw, 52px);
    font-weight: 500;
    color: white;
    text-shadow: 0 2px 16px rgba(0,0,0,0.5);
    letter-spacing: 0.5px;
}

/* ── countdown pre-screen ── */
.br-cd-pre {
    position: fixed; inset: 0; z-index: 200;
    display: flex; align-items: center; justify-content: center;
    flex-direction: column;
    background: #05050f;
    font-family: 'Fredoka', sans-serif;
}
.br-cd-number {
    font-size: clamp(160px, 30vw, 280px);
    font-weight: 700;
    line-height: 1;
    color: #fff;
    text-align: center;
    text-shadow:
        0 0 60px rgba(255,255,255,0.35),
        0 0 120px rgba(140,100,255,0.5),
        0 0 200px rgba(80,200,255,0.3);
}
.br-cd-begin {
    font-size: clamp(48px, 8vw, 90px);
    font-weight: 600;
    color: #fff;
    letter-spacing: 4px;
    text-shadow:
        0 0 40px rgba(255,255,255,0.5),
        0 0 100px rgba(100,220,255,0.6);
}
.br-cd-hint {
    position: absolute;
    bottom: 12%;
    font-size: clamp(16px, 2vw, 22px);
    color: rgba(255,255,255,0.35);
    font-weight: 400;
    letter-spacing: 0.5px;
}

/* ── finished overlay ── */
.br-finished {
    position: absolute; inset: 0; z-index: 50;
    display: flex; align-items: center; justify-content: center;
    flex-direction: column; gap: 16px;
    background: rgba(5,5,15,0.85);
    backdrop-filter: blur(12px);
    pointer-events: none;
}
.br-finished-title {
    font-size: clamp(48px, 8vw, 80px);
    font-weight: 700;
    color: #fff;
    text-align: center;
    text-shadow: 0 0 50px rgba(140,100,255,0.7);
}
.br-finished-sub {
    font-size: clamp(18px, 3vw, 28px);
    color: rgba(255,255,255,0.5);
    font-weight: 400;
    letter-spacing: 0.5px;
}
`;

/* ─────────────────────────────────────────────
   BREATHING MENU
───────────────────────────────────────────── */
/* ─────────────────────────────────────────────
   BREATHING COUNTDOWN SCREEN (3 → 2 → 1 → Begin)
───────────────────────────────────────────── */
export function BreathingCountdown({ onDone }) {
    const [step, setStep] = useState(0); // 0=3, 1=2, 2=1, 3=Begin
    const steps = ['3', '2', '1', 'Begin'];

    useEffect(() => {
        if (step < steps.length - 1) {
            const t = setTimeout(() => setStep(s => s + 1), 900);
            return () => clearTimeout(t);
        } else {
            // "Begin" shows briefly then fires onDone
            const t = setTimeout(() => onDone(), 700);
            return () => clearTimeout(t);
        }
    }, [step]);

    return (
        <motion.div
            className="br-cd-pre"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0, scale: 1.06 }}
            transition={{ duration: 0.35 }}
        >
            <style>{SHARED_STYLE}</style>
            {/* Radial glow background pulse */}
            <motion.div
                style={{
                    position: 'absolute', inset: 0, zIndex: 0,
                    background: 'radial-gradient(ellipse 70% 60% at 50% 50%, rgba(100,80,220,0.18) 0%, transparent 70%)'
                }}
                animate={{ opacity: [0.6, 1, 0.6] }}
                transition={{ duration: 0.9, repeat: Infinity }}
            />
            <AnimatePresence mode="wait">
                <motion.div
                    key={step}
                    style={{ position: 'relative', zIndex: 1 }}
                    initial={{ opacity: 0, scale: 1.5, y: 30 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.55, y: -40 }}
                    transition={{ type: 'spring', stiffness: 320, damping: 22, mass: 0.8 }}
                >
                    {step < 3
                        ? <div className="br-cd-number">{steps[step]}</div>
                        : <div className="br-cd-begin">{steps[step]}</div>
                    }
                </motion.div>
            </AnimatePresence>
            <div className="br-cd-hint">Breathe in through your nose</div>
        </motion.div>
    );
}

export function BreathingMenu({ onNavigate, onBack, color }) {
    const cards = [
        {
            id: 'breathing-resonant',
            title: 'Resonant\nBreathing',
            bg: coherentBg, graphic: coherentGraphic,
            glow: '#00E5FF', pink: false, cyan: true,
            pill: 'Calm'
        },
        {
            id: 'breathing-sigh',
            title: 'Psychological\nSigh',
            bg: psychosighBg, graphic: psychosighGraphic,
            glow: '#FF80AB', pink: true,
            pill: 'Reset'
        },
        {
            id: 'breathing-box',
            title: 'Box\nBreathing',
            bg: boxBg, graphic: boxGraphic,
            glow: '#7C4DFF', pink: false, purple: true,
            pill: 'Focus'
        }
    ];

    return (
        <motion.div
            style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', zIndex: 100 }}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
        >
            <style>{SHARED_STYLE}</style>
            <div className="br-wrap">
                {/* top bar */}
                <div className="br-topbar">
                    <button className="br-back-btn" onClick={onBack}>
                        <svg viewBox="0 0 24 24"><line x1="19" y1="12" x2="5" y2="12" /><polyline points="12 19 5 12 12 5" /></svg>
                    </button>
                    <div style={{ width: 44 }} />
                </div>

                {/* content */}
                <div className="br-menu">
                    <div className="br-menu-title">Choose a practice</div>
                    <div className="br-cards-row">
                        {cards.map((card, i) => (
                            <motion.div
                                key={card.id}
                                className="br-card"
                                initial={{ opacity: 0, y: 28 }}
                                animate={{ opacity: 1, y: 0, transition: { delay: i * 0.12, type: 'spring', stiffness: 260, damping: 22 } }}
                                whileHover={{ y: -8, scale: 1.025, boxShadow: '0 24px 50px rgba(0,0,0,0.6)' }}
                                whileTap={{ scale: 0.96, y: -2 }}
                                transition={{ type: 'spring', stiffness: 350, damping: 24 }}
                                onClick={() => onNavigate(card.id)}
                            >
                                <div className="br-card-glow" style={{ background: card.glow }} />
                                <img className={`br-card-bg${card.pink ? ' br-pink' : ''}${card.cyan ? ' br-cyan' : ''}${card.purple ? ' br-purple' : ''}`} src={card.bg} alt="" />
                                <img className="br-card-graphic" src={card.graphic} alt="" />
                                <div className="br-card-info">
                                    <div className="br-card-label">{card.title}</div>
                                    <div className="br-card-pill">{card.pill}</div>
                                </div>
                                <div className="br-card-arrow">
                                    <svg viewBox="0 0 24 24"><line x1="5" y1="12" x2="19" y2="12" /><polyline points="12 5 19 12 12 19" /></svg>
                                </div>
                            </motion.div>
                        ))}
                    </div>
                </div>
            </div>
        </motion.div>
    );
}

/* ─────────────────────────────────────────────
   SHARED CANVAS HOOK
───────────────────────────────────────────── */
function useAnimLoop(engineFactory, deps) {
    const canvasRef = useRef(null);
    const rafRef = useRef(null);
    const engineRef = useRef(null);

    const start = useCallback(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d', { alpha: false });
        let width = canvas.offsetWidth, height = canvas.offsetHeight;
        canvas.width = width; canvas.height = height;

        const onResize = () => {
            width = canvas.offsetWidth; height = canvas.offsetHeight;
            canvas.width = width; canvas.height = height;
            if (engineRef.current?.onResize) engineRef.current.onResize(width, height);
        };
        window.addEventListener('resize', onResize);

        engineRef.current = engineFactory(ctx, width, height);
        const sessionStart = performance.now();
        let last = performance.now();

        const loop = (ts) => {
            const dt = (ts - last) / 1000;
            last = ts;
            const elapsed = (ts - sessionStart) / 1000;
            ctx.clearRect(0, 0, width, height);
            engineRef.current.update(dt, elapsed);
            rafRef.current = requestAnimationFrame(loop);
        };
        rafRef.current = requestAnimationFrame(loop);

        return () => {
            window.removeEventListener('resize', onResize);
            cancelAnimationFrame(rafRef.current);
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, deps);

    useEffect(() => { return start(); }, [start]);
    return canvasRef;
}

/* ─────────────────────────────────────────────
   RESONANT BREATHING SCREEN
───────────────────────────────────────────── */
/* ─────────────────────────────────────────────
   SESSION TIMER HOOK  (5 minutes)
───────────────────────────────────────────── */
const SESSION_SECONDS = 5 * 60;

function useSessionTimer(onFinished) {
    const [finished, setFinished] = useState(false);
    const [remainingDisplay, setRemainingDisplay] = useState(SESSION_SECONDS);
    const startRef = useRef(null);
    const rafRef2 = useRef(null);

    useEffect(() => {
        startRef.current = performance.now();
        const tick = (ts) => {
            const elapsed = (ts - startRef.current) / 1000;
            const rem = Math.max(0, SESSION_SECONDS - elapsed);
            setRemainingDisplay(Math.ceil(rem));
            if (rem <= 0) {
                setFinished(true);
                setTimeout(() => onFinished(), 2400);
                return;
            }
            rafRef2.current = requestAnimationFrame(tick);
        };
        rafRef2.current = requestAnimationFrame(tick);
        return () => cancelAnimationFrame(rafRef2.current);
    }, []);

    return { finished, remainingDisplay };
}

export function ResonantBreathingScreen({ onBack }) {
    const cdRef = useRef(null);
    const phRef = useRef(null);
    const { finished: resFinished } = useSessionTimer(onBack);

    const factory = useCallback((ctx, w, h) => {
        let width = w, height = h;

        const lerp = (a, b, t) => a + (b - a) * t;
        const hexToRgb = hex => [
            parseInt(hex.slice(1, 3), 16),
            parseInt(hex.slice(3, 5), 16),
            parseInt(hex.slice(5, 7), 16)
        ];
        const lerpColor = (c1, c2, t) => {
            const [r1, g1, b1] = hexToRgb(c1), [r2, g2, b2] = hexToRgb(c2);
            return `rgb(${Math.round(lerp(r1, r2, t))},${Math.round(lerp(g1, g2, t))},${Math.round(lerp(b1, b2, t))})`;
        };
        const lerpRgba = (c1, c2, t, a) => {
            const [r1, g1, b1] = hexToRgb(c1), [r2, g2, b2] = hexToRgb(c2);
            return `rgba(${Math.round(lerp(r1, r2, t))},${Math.round(lerp(g1, g2, t))},${Math.round(lerp(b1, b2, t))},${a})`;
        };

        const COLORS = { dark: '#006064', mid: '#0097A7', light: '#00BFA5' };
        let particles = [], circles = [], motionValue = 0, prevPhase = 'inhale';

        const explode = () => {
            const newP = [];
            for (const p of particles) {
                if (!p.isStar && p.y < height) {
                    for (let i = 0; i < 8 + Math.floor(Math.random() * 5); i++) {
                        const angle = Math.random() * 2 * Math.PI, spd = 2 + Math.random() * 6;
                        newP.push({ x: p.x, y: p.y, vx: Math.cos(angle) * spd, vy: Math.sin(angle) * spd, life: 0.8 + Math.random() * 0.4, size: 2 + Math.random() * 2, isRising: false, isStar: true });
                    }
                    p.life = 0;
                }
            }
            particles.push(...newP);
        };

        const drawWaveLayer = (yBase, color, ampMult, phase) => {
            ctx.beginPath(); ctx.moveTo(0, height); ctx.lineTo(0, yBase);
            for (let x = 0; x <= width; x += 10) {
                const nx = x / width;
                const y = yBase + Math.sin(nx * 2 * Math.PI + phase * 2 * Math.PI) * 15 * ampMult + Math.sin(nx * 4 * Math.PI - phase * 4 * Math.PI) * 5;
                ctx.lineTo(x, y);
            }
            ctx.lineTo(width, height); ctx.closePath(); ctx.fillStyle = color; ctx.fill();
        };

        const drawGlowLine = (yBase, color, phase) => {
            ctx.beginPath();
            for (let x = 0; x <= width; x += 10) {
                const nx = x / width;
                const y = yBase + Math.sin(nx * 2 * Math.PI + phase * 2 * Math.PI) * 15 + Math.sin(nx * 4 * Math.PI - phase * 4 * Math.PI) * 5;
                if (x === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
            }
            ctx.strokeStyle = color; ctx.lineWidth = 4; ctx.stroke();
            ctx.strokeStyle = color; ctx.lineWidth = 15; ctx.globalAlpha = 0.3; ctx.stroke();
            ctx.globalAlpha = 1.0;
        };

        return {
            onResize(nw, nh) { width = nw; height = nh; },
            update(dt, time) {
                const cycleTime = time % 12.0, phase = cycleTime < 6.0 ? 'inhale' : 'exhale';
                const phaseTime = cycleTime < 6.0 ? cycleTime : cycleTime - 6.0;
                const sineValue = (Math.sin((time / 12.0) * 2 * Math.PI - Math.PI / 2) + 1) / 2;
                motionValue += dt * 0.2;

                if (phase !== prevPhase) {
                    if (phase === 'exhale') explode();
                    prevPhase = phase;
                }

                if (phase === 'inhale') {
                    if (Math.random() < 0.15) {
                        particles.push({ x: width * 0.2 + Math.random() * width * 0.6, y: height + 20, vx: (Math.random() - 0.5) * 1.5, vy: -2 - Math.random() * 4, life: 1.0, size: 3 + Math.random() * 5, isRising: true, isStar: false });
                    }
                    if (circles.length === 0 || (circles[circles.length - 1].radius > 60 && Math.random() < 0.05)) {
                        circles.push({ radius: 0, maxRadius: Math.max(width, height) * 0.7, opacity: 0.5 });
                    }
                }

                const targetWaveY = height * 0.5 - (sineValue * height * 0.25);
                for (let i = particles.length - 1; i >= 0; i--) {
                    const p = particles[i];
                    if (p.isRising && !p.isStar) {
                        p.x += p.vx + Math.sin(time * 5) * 0.3; p.y += p.vy; p.vy *= 0.99;
                        if (p.y < targetWaveY) { p.y = targetWaveY; p.vy = 0; p.life -= 0.01; }
                    } else if (p.isStar) {
                        p.x += p.vx; p.y += p.vy; p.vx *= 0.92; p.vy *= 0.92; p.life -= 0.02;
                    }
                    if (p.life <= 0) particles.splice(i, 1);
                }

                for (let i = circles.length - 1; i >= 0; i--) {
                    const c = circles[i];
                    if (phase === 'inhale') { c.radius += 2.0; c.opacity = 0.5 * (1.0 - c.radius / c.maxRadius); }
                    else { c.radius -= 3.0; if (c.radius < 0) c.radius = 0; c.opacity *= 0.9; }
                    if (c.opacity <= 0.01 || (c.radius <= 0.1 && phase === 'exhale')) circles.splice(i, 1);
                }

                // Draw
                ctx.fillStyle = COLORS.dark; ctx.fillRect(0, 0, width, height);
                ctx.save(); ctx.lineCap = 'round';
                const waveColor = lerpColor(COLORS.dark, COLORS.light, sineValue);

                for (const c of circles) {
                    if (c.radius < 1) continue;
                    ctx.beginPath(); ctx.arc(width / 2, height / 2, c.radius, 0, Math.PI * 2);
                    ctx.strokeStyle = lerpRgba(COLORS.dark, COLORS.light, sineValue, c.opacity);
                    ctx.lineWidth = 2 + c.opacity * 2; ctx.stroke();
                }

                const dy = lerp(height * 0.75, height * 0.25, sineValue);
                drawWaveLayer(dy, lerpRgba(COLORS.dark, COLORS.light, sineValue, 0.2), 1.0, motionValue);
                drawWaveLayer(dy + 10, lerpRgba(COLORS.dark, COLORS.light, sineValue, 0.4), 0.8, motionValue + 0.3);
                drawWaveLayer(dy + 20, waveColor, 1.0, motionValue + 0.6);
                drawGlowLine(dy + 20, waveColor, motionValue + 0.6);

                for (const p of particles) {
                    if (p.life <= 0) continue;
                    ctx.beginPath(); ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
                    if (p.isStar) {
                        ctx.fillStyle = `rgba(255,255,255,${Math.max(0, Math.min(1, p.life))})`;
                    } else {
                        const [r, g, b] = hexToRgb(COLORS.light);
                        ctx.fillStyle = `rgba(${r},${g},${b},0.6)`;
                    }
                    ctx.fill();
                }
                ctx.restore();

                // UI
                const rem = Math.max(0, 6 - Math.floor(phaseTime));
                if (cdRef.current) cdRef.current.textContent = rem;
                if (phRef.current) phRef.current.textContent = phase === 'inhale' ? 'Breathe in' : 'Breathe out';
            }
        };
    }, []);

    const canvasRef = useAnimLoop(factory, [factory]);

    return (
        <motion.div
            style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', zIndex: 100 }}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
        >
            <style>{SHARED_STYLE}</style>
            <div className="br-exercise">
                <canvas ref={canvasRef} />
                <div className="br-topbar" style={{ position: 'absolute' }}>
                    <button className="br-back-btn" onClick={onBack}>
                        <svg viewBox="0 0 24 24"><line x1="19" y1="12" x2="5" y2="12" /><polyline points="12 19 5 12 12 5" /></svg>
                    </button>
                    <div style={{ width: 44 }} />
                </div>
                <div className="br-exercise-ui">
                    <div className="br-exercise-text">
                        <div className="br-exercise-countdown" ref={cdRef}>0</div>
                        <div className="br-exercise-phase" ref={phRef}>Breathe in</div>
                    </div>
                </div>
                <AnimatePresence>
                    {resFinished && (
                        <motion.div
                            className="br-finished"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ duration: 0.8 }}
                        >
                            <div className="br-finished-title">Well done 🌿</div>
                            <div className="br-finished-sub">5 minutes complete</div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        </motion.div>
    );
}

/* ─────────────────────────────────────────────
   PSYCHOLOGICAL SIGH SCREEN
───────────────────────────────────────────── */
export function PsychologicalSighScreen({ onBack }) {
    const cdRef = useRef(null);
    const phRef = useRef(null);
    const { finished: sighFinished } = useSessionTimer(onBack);

    const factory = useCallback((ctx, w, h) => {
        let width = w, height = h;

        const random = (mn, mx) => Math.random() * (mx - mn) + mn;
        const lerp = (a, b, t) => a + (b - a) * t;
        const hexToRgb = hex => [parseInt(hex.slice(1, 3), 16), parseInt(hex.slice(3, 5), 16), parseInt(hex.slice(5, 7), 16)];
        const lerpRgba = (c1, c2, t, a) => {
            const [r1, g1, b1] = hexToRgb(c1), [r2, g2, b2] = hexToRgb(c2);
            return `rgba(${Math.round(lerp(r1, r2, t))},${Math.round(lerp(g1, g2, t))},${Math.round(lerp(b1, b2, t))},${a})`;
        };
        const easeOut = t => 1 - Math.pow(1 - t, 3);
        const COLORS = { red: '#FFA0A0', pink: '#FF7EC7' };
        const CYCLE = 11.5, I1 = 3.0, I2 = 2.0;

        let particles = [];
        let outlines = [{ maxRadius: 0, currentRadius: 0, opacity: 0 }, { maxRadius: 0, currentRadius: 0, opacity: 0 }, { maxRadius: 0, currentRadius: 0, opacity: 0 }];
        let wavyLines = [];
        let prevPhase = 'inhale1';

        const init = () => {
            const maxR = Math.max(width, height) * 0.45;
            outlines = [
                { maxRadius: maxR, currentRadius: 0, opacity: 0 },
                { maxRadius: maxR + 40, currentRadius: 0, opacity: 0 },
                { maxRadius: maxR + 80, currentRadius: 0, opacity: 0 }
            ];
            wavyLines = Array.from({ length: 5 }, () => ({
                phase: random(0, Math.PI * 2), amplitude: random(15, 35), speed: random(0.005, 0.015), opacity: 0
            }));
        };
        init();

        const explodeCircles = () => {
            const cx = width / 2, cy = height / 2;
            const maxR1 = Math.min(width, height) * 0.35, maxR2 = Math.min(width, height) * 0.45;
            const gen = (count, maxR, baseSpd) => {
                for (let i = 0; i < count; i++) {
                    const r = Math.sqrt(Math.random()) * maxR, theta = Math.random() * 2 * Math.PI;
                    const spd = baseSpd + Math.random() * 1.5;
                    particles.push({ x: cx + r * Math.cos(theta), y: cy + r * Math.sin(theta), vx: Math.cos(theta) * spd, vy: Math.sin(theta) * spd, life: 1.2 + Math.random() * 0.5, size: 1 + Math.random() * 2 });
                }
            };
            gen(600, maxR1, 0.2); gen(900, maxR2, 0.5);
        };

        return {
            onResize(nw, nh) { width = nw; height = nh; init(); },
            update(dt, time) {
                const cycleTime = time % CYCLE;
                let phase = 'inhale1';
                if (cycleTime >= I1 && cycleTime < I1 + I2) phase = 'inhale2';
                else if (cycleTime >= I1 + I2) phase = 'exhale';

                if (phase !== prevPhase) {
                    if (phase === 'exhale') explodeCircles();
                    prevPhase = phase;
                }

                for (let i = particles.length - 1; i >= 0; i--) {
                    const p = particles[i];
                    p.x += p.vx; p.y += p.vy; p.vx *= 0.98; p.vy *= 0.98;
                    p.x += (Math.random() - 0.5) * 0.5; p.y += (Math.random() - 0.5) * 0.5;
                    p.life -= 1 / (60 * 7.5);
                    if (p.life <= 0) particles.splice(i, 1);
                }

                for (const o of outlines) {
                    if (phase.startsWith('inhale')) { o.currentRadius += (o.maxRadius - o.currentRadius) * 0.02; o.opacity += (0.3 - o.opacity) * 0.05; }
                    else { o.currentRadius *= 0.99; o.opacity *= 0.95; }
                }
                for (const wl of wavyLines) {
                    wl.phase += wl.speed;
                    if (phase.startsWith('inhale')) wl.opacity += (0.4 - wl.opacity) * 0.05;
                    else wl.opacity *= 0.98;
                }

                let prog1 = 0, prog2 = 0;
                if (phase === 'inhale1') prog1 = easeOut(cycleTime / I1);
                else if (phase === 'inhale2') { prog1 = 1; prog2 = easeOut((cycleTime - I1) / I2); }

                // Draw
                ctx.fillStyle = '#110a11'; ctx.fillRect(0, 0, width, height);
                ctx.save();
                const cx = width / 2, cy = height / 2;

                ctx.lineCap = 'round'; ctx.lineWidth = 2;
                for (const wl of wavyLines) {
                    if (wl.opacity <= 0.01) continue;
                    ctx.strokeStyle = `rgba(255,255,255,${wl.opacity})`;
                    ctx.beginPath();
                    const scale = Math.min(width, height) * 0.35;
                    for (let theta = 0; theta <= Math.PI * 2 + 0.1; theta += 0.05) {
                        const r = Math.min(width, height) * 0.15 + scale * 0.5 * (0.5 + 0.5 * Math.sin(4 * theta + wl.phase));
                        const x = cx + r * Math.cos(theta), y = cy + r * Math.sin(theta);
                        if (theta === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
                    }
                    ctx.closePath(); ctx.stroke();
                }

                ctx.lineWidth = 1;
                for (const o of outlines) {
                    if (o.opacity <= 0.01) continue;
                    ctx.strokeStyle = lerpRgba(COLORS.pink, COLORS.pink, 0, o.opacity);
                    ctx.beginPath(); ctx.arc(cx, cy, Math.max(0.1, o.currentRadius), 0, Math.PI * 2); ctx.stroke();
                }

                const maxR1 = Math.min(width, height) * 0.28, maxR2 = Math.min(width, height) * 0.45;

                if (phase !== 'exhale' && prog2 > 0) {
                    ctx.lineWidth = 1.5;
                    for (let i = 1; i <= 10; i++) {
                        const targetR = maxR1 + (maxR2 * 1.2 - maxR1) * (i / 10);
                        const currentR = maxR1 + (targetR - maxR1) * prog2;
                        const op = Math.max(0, Math.min(1, 0.5 * prog2));
                        ctx.strokeStyle = lerpRgba(COLORS.red, '#000000', 0, op);
                        ctx.beginPath(); ctx.arc(cx, cy, Math.max(0.1, currentR), 0, Math.PI * 2); ctx.stroke();
                    }
                }

                if (phase !== 'exhale') {
                    const r1 = maxR1 * prog1;
                    ctx.fillStyle = COLORS.red;
                    ctx.beginPath(); ctx.arc(cx, cy, Math.max(0.1, r1), 0, Math.PI * 2); ctx.fill();

                    // Safe radial gradient — ensure r0 >= 0
                    const innerR = Math.max(0, r1 * 0.8);
                    const outerR = Math.max(innerR + 1, r1 * 1.5);
                    const glowGrad = ctx.createRadialGradient(cx, cy, innerR, cx, cy, outerR);
                    glowGrad.addColorStop(0, lerpRgba(COLORS.red, '#000000', 0, 0.6));
                    glowGrad.addColorStop(1, 'rgba(0,0,0,0)');
                    ctx.fillStyle = glowGrad;
                    ctx.beginPath(); ctx.arc(cx, cy, Math.max(0.1, outerR), 0, Math.PI * 2); ctx.fill();
                }

                for (const p of particles) {
                    if (p.life <= 0) continue;
                    ctx.fillStyle = lerpRgba(COLORS.red, '#000000', 0, Math.min(1, Math.max(0, p.life)));
                    ctx.beginPath(); ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2); ctx.fill();
                }
                ctx.restore();

                // UI
                let rem = 0;
                if (phase === 'inhale1') rem = Math.ceil(I1 - cycleTime);
                else if (phase === 'inhale2') rem = Math.ceil(I2 - (cycleTime - I1));
                else rem = Math.ceil(6.5 - (cycleTime - I1 - I2));
                if (cdRef.current) cdRef.current.textContent = Math.max(1, rem);
                if (phRef.current) {
                    if (phase === 'inhale1') phRef.current.textContent = 'Inhale (1)';
                    else if (phase === 'inhale2') phRef.current.textContent = 'Inhale again';
                    else phRef.current.textContent = 'Breathe out';
                }
            }
        };
    }, []);

    const canvasRef = useAnimLoop(factory, [factory]);

    return (
        <motion.div
            style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', zIndex: 100 }}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
        >
            <style>{SHARED_STYLE}</style>
            <div className="br-exercise">
                <canvas ref={canvasRef} />
                <div className="br-topbar" style={{ position: 'absolute' }}>
                    <button className="br-back-btn" onClick={onBack}>
                        <svg viewBox="0 0 24 24"><line x1="19" y1="12" x2="5" y2="12" /><polyline points="12 19 5 12 12 5" /></svg>
                    </button>
                    <div style={{ width: 44 }} />
                </div>
                <div className="br-exercise-ui">
                    <div className="br-exercise-text">
                        <div className="br-exercise-countdown" ref={cdRef}>0</div>
                        <div className="br-exercise-phase" ref={phRef}>Inhale (1)</div>
                    </div>
                </div>
                <AnimatePresence>
                    {sighFinished && (
                        <motion.div
                            className="br-finished"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ duration: 0.8 }}
                        >
                            <div className="br-finished-title">Well done 🌿</div>
                            <div className="br-finished-sub">5 minutes complete</div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        </motion.div>
    );
}

/* ─────────────────────────────────────────────
   BOX BREATHING SCREEN
───────────────────────────────────────────── */
export function BoxBreathingScreen({ onBack }) {
    const cdRef = useRef(null);
    const phRef = useRef(null);
    const { finished: boxFinished } = useSessionTimer(onBack);

    const factory = useCallback((ctx, w, h) => {
        let width = w, height = h;

        const random = (mn, mx) => Math.random() * (mx - mn) + mn;
        const lerp = (a, b, t) => a + (b - a) * t;
        const hexToRgb = hex => [parseInt(hex.slice(1, 3), 16), parseInt(hex.slice(3, 5), 16), parseInt(hex.slice(5, 7), 16)];
        const easeInOut = t => t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2;
        const COLORS = { p: '#7C4DFF', dp: '#311B92', lp: '#B388FF' };
        const [dpr, dpg, dpb] = hexToRgb(COLORS.dp), [lpr, lpg, lpb] = hexToRgb(COLORS.lp), [pr, pg, pb] = hexToRgb(COLORS.p);

        let stars = [], glows = [], shapes = [], lines = [], expandingSquares = [];
        let globalRot = 0;
        let prevPhase = 'inhale';

        const init = () => {
            stars = Array.from({ length: 80 }, () => ({
                x: random(0, width), y: random(0, height), op: random(0, 0.5), tgOp: random(0.3, 1), spd: random(0.01, 0.03)
            }));
            glows = Array.from({ length: 6 }, () => ({
                x: random(0, width), y: random(0, height), r: random(80, 230), op: random(0.1, 0.3), tgOp: random(0.15, 0.35)
            }));
            const sidesList = [0, 3, 4, 5, 6, 8, 12];
            shapes = Array.from({ length: 80 }, () => ({
                x: random(0, width), y: random(0, height),
                vx: random(-0.4, 0.4), vy: random(-0.4, 0.4),
                size: random(15, 115), sides: sidesList[Math.floor(Math.random() * sidesList.length)],
                rot: random(0, Math.PI * 2), rs: random(-0.01, 0.01), op: random(0.05, 0.25)
            }));
            lines = Array.from({ length: 12 }, () => ({
                ph: random(0, Math.PI * 2), amp: random(20, 60), yPos: random(0, 1), op: random(0.1, 0.3), spd: random(0.008, 0.023), wc: Math.floor(random(2, 5))
            }));
        };
        init();

        const spawnSquares = () => {
            if (expandingSquares.length > 30) expandingSquares.splice(0, 10);
            for (let i = 0; i < 12; i++) {
                expandingSquares.push({ r: 30 + i * 12, maxR: Math.max(width, height) * 0.8 + i * 50, baseOp: 0.7 - i * 0.04, curOp: 0, rot: i * 0.1, life: 1.0 });
            }
        };

        return {
            onResize(nw, nh) { width = nw; height = nh; init(); },
            update(dt, time) {
                const cycleTime = time % 16, phaseTime = cycleTime % 4;
                let phase = 'inhale', phaseIndex = 0;
                if (cycleTime < 4) { phase = 'inhale'; phaseIndex = 0; }
                else if (cycleTime < 8) { phase = 'hold1'; phaseIndex = 1; }
                else if (cycleTime < 12) { phase = 'exhale'; phaseIndex = 2; }
                else { phase = 'hold2'; phaseIndex = 3; }
                const isHold = phase.startsWith('hold');

                if (phase !== prevPhase) {
                    if (phase === 'inhale' || phase === 'exhale') spawnSquares();
                    prevPhase = phase;
                }

                const phaseProg = phaseTime / 4, traceProg = phaseIndex + phaseProg;
                let sqScale = 1;
                if (phase === 'inhale') sqScale = 1 + 0.15 * easeInOut(phaseProg);
                else if (phase === 'exhale') sqScale = 1.15 - 0.15 * easeInOut(phaseProg);
                else if (phase === 'hold1') sqScale = 1.15;

                if (!isHold) {
                    globalRot += dt * 0.05;
                    for (const s of stars) {
                        if (Math.abs(s.op - s.tgOp) < 0.05) s.tgOp = 0.2 + Math.random() * 0.8;
                        s.op += (s.tgOp - s.op) * s.spd;
                    }
                    for (const g of glows) {
                        g.op += (g.tgOp - g.op) * 0.01;
                        if (Math.random() < 0.005) g.tgOp = 0.1 + Math.random() * 0.25;
                    }
                    for (const s of shapes) {
                        s.x += s.vx; s.y += s.vy; s.rot += s.rs;
                        if (s.x < -s.size) s.x = width + s.size; if (s.x > width + s.size) s.x = -s.size;
                        if (s.y < -s.size) s.y = height + s.size; if (s.y > height + s.size) s.y = -s.size;
                    }
                    for (const l of lines) l.ph += l.spd;
                }

                for (let i = expandingSquares.length - 1; i >= 0; i--) {
                    const sq = expandingSquares[i];
                    if (phase === 'inhale') { sq.r += (sq.maxR - sq.r) * 0.015; sq.rot += 0.001; sq.life -= 0.003; }
                    else if (phase === 'exhale') { sq.r *= 0.985; sq.rot -= 0.001; sq.life -= 0.002; }
                    else { sq.life -= 0.001; }
                    sq.curOp = sq.baseOp * Math.max(0, sq.life);
                    if (sq.life <= 0.01 || sq.curOp < 0.01) expandingSquares.splice(i, 1);
                }

                // Draw
                ctx.fillStyle = '#0a0515'; ctx.fillRect(0, 0, width, height);
                ctx.save();

                for (const g of glows) {
                    const grad = ctx.createRadialGradient(g.x, g.y, 0, g.x, g.y, g.r);
                    grad.addColorStop(0, `rgba(${dpr},${dpg},${dpb},${g.op})`); grad.addColorStop(1, 'rgba(0,0,0,0)');
                    ctx.fillStyle = grad; ctx.beginPath(); ctx.arc(g.x, g.y, g.r, 0, Math.PI * 2); ctx.fill();
                }

                ctx.lineWidth = 1;
                for (const s of shapes) {
                    ctx.strokeStyle = `rgba(${lpr},${lpg},${lpb},${s.op})`;
                    ctx.save(); ctx.translate(s.x, s.y); ctx.rotate(s.rot); ctx.beginPath();
                    if (s.sides === 0) { ctx.arc(0, 0, s.size / 2, 0, Math.PI * 2); }
                    else { for (let i2 = 0; i2 <= s.sides; i2++) { const a = (i2 / s.sides) * Math.PI * 2 - Math.PI / 2; if (i2 === 0) ctx.moveTo((s.size / 2) * Math.cos(a), (s.size / 2) * Math.sin(a)); else ctx.lineTo((s.size / 2) * Math.cos(a), (s.size / 2) * Math.sin(a)); } }
                    ctx.stroke(); ctx.restore();
                }

                ctx.lineWidth = 1.5; ctx.lineCap = 'round';
                for (const l of lines) {
                    ctx.strokeStyle = `rgba(${lpr},${lpg},${lpb},${l.op})`;
                    ctx.beginPath();
                    for (let x = 0; x <= width; x += 10) {
                        const nx = x / width, y = height * l.yPos + Math.sin(nx * Math.PI * l.wc + l.ph) * l.amp + Math.sin(nx * Math.PI * l.wc * 2 - l.ph * 0.7) * (l.amp * 0.5);
                        if (x === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
                    }
                    ctx.stroke();
                }

                ctx.fillStyle = '#FFF';
                for (const s of stars) { ctx.globalAlpha = s.op * 0.5; ctx.beginPath(); ctx.arc(s.x, s.y, 1.5, 0, Math.PI * 2); ctx.fill(); }
                ctx.globalAlpha = 1;

                const cx = width / 2, cy = height / 2;
                for (const sq of expandingSquares) {
                    if (sq.curOp <= 0.01) continue;
                    ctx.save(); ctx.translate(cx, cy); ctx.rotate(sq.rot);
                    ctx.strokeStyle = `rgba(${lpr},${lpg},${lpb},${sq.curOp * 0.3})`; ctx.lineWidth = 8;
                    ctx.strokeRect(-sq.r / 2, -sq.r / 2, sq.r, sq.r);
                    ctx.strokeStyle = `rgba(${pr},${pg},${pb},${sq.curOp})`; ctx.lineWidth = 3.5;
                    ctx.strokeRect(-sq.r / 2, -sq.r / 2, sq.r, sq.r); ctx.restore();
                }

                const baseSz = Math.min(width, height) * 0.45, sz = baseSz * sqScale, half = sz / 2;
                ctx.save(); ctx.translate(cx, cy); ctx.rotate(globalRot);
                const p1 = { x: -half, y: -half }, p2 = { x: half, y: -half }, p3 = { x: half, y: half }, p4 = { x: -half, y: half };
                ctx.strokeStyle = 'rgba(255,255,255,0.3)'; ctx.lineWidth = 5; ctx.lineJoin = 'round';
                ctx.strokeRect(-half, -half, sz, sz);
                ctx.strokeStyle = COLORS.p; ctx.lineWidth = 7;
                ctx.beginPath(); ctx.moveTo(p1.x, p1.y);
                const lp2 = (a, b, t2) => ({ x: lerp(a.x, b.x, t2), y: lerp(a.y, b.y, t2) });
                let cPos;
                if (traceProg >= 0) { const tp = Math.min(1, traceProg); cPos = lp2(p1, p2, tp); ctx.lineTo(cPos.x, cPos.y); }
                if (traceProg >= 1) { const tp = Math.min(1, traceProg - 1); cPos = lp2(p2, p3, tp); ctx.lineTo(cPos.x, cPos.y); }
                if (traceProg >= 2) { const tp = Math.min(1, traceProg - 2); cPos = lp2(p3, p4, tp); ctx.lineTo(cPos.x, cPos.y); }
                if (traceProg >= 3) { const tp = Math.min(1, traceProg - 3); cPos = lp2(p4, p1, tp); ctx.lineTo(cPos.x, cPos.y); }
                ctx.stroke();
                if (cPos) {
                    ctx.beginPath();
                    const grad = ctx.createRadialGradient(cPos.x, cPos.y, 0, cPos.x, cPos.y, 15);
                    grad.addColorStop(0, `rgba(${lpr},${lpg},${lpb},0.8)`); grad.addColorStop(1, 'rgba(0,0,0,0)');
                    ctx.fillStyle = grad; ctx.arc(cPos.x, cPos.y, 20, 0, Math.PI * 2); ctx.fill();
                    ctx.fillStyle = '#FFF'; ctx.beginPath(); ctx.arc(cPos.x, cPos.y, 10, 0, Math.PI * 2); ctx.fill();
                }
                ctx.restore(); ctx.restore();

                // UI
                const rem = Math.ceil(4 - phaseTime) || 1;
                if (cdRef.current) cdRef.current.textContent = rem;
                if (phRef.current) {
                    if (phase === 'inhale') phRef.current.textContent = 'Breathe in';
                    else if (phase === 'exhale') phRef.current.textContent = 'Breathe out';
                    else phRef.current.textContent = 'Hold';
                }
            }
        };
    }, []);

    const canvasRef = useAnimLoop(factory, [factory]);

    return (
        <motion.div
            style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', zIndex: 100 }}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
        >
            <style>{SHARED_STYLE}</style>
            <div className="br-exercise">
                <canvas ref={canvasRef} />
                <div className="br-topbar" style={{ position: 'absolute' }}>
                    <button className="br-back-btn" onClick={onBack}>
                        <svg viewBox="0 0 24 24"><line x1="19" y1="12" x2="5" y2="12" /><polyline points="12 19 5 12 12 5" /></svg>
                    </button>
                    <div style={{ width: 44 }} />
                </div>
                <div className="br-exercise-ui">
                    <div className="br-exercise-text">
                        <div className="br-exercise-countdown" ref={cdRef}>0</div>
                        <div className="br-exercise-phase" ref={phRef}>Breathe in</div>
                    </div>
                </div>
                <AnimatePresence>
                    {boxFinished && (
                        <motion.div
                            className="br-finished"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ duration: 0.8 }}
                        >
                            <div className="br-finished-title">Well done 🌿</div>
                            <div className="br-finished-sub">5 minutes complete</div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        </motion.div>
    );
}

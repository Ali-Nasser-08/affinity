import { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { supabase } from '../utils/supabaseClient'

// ─── Accent palette ───────────────────────────────────────────────────────────
const ALL_ACCENTS = [
    '#00D9FF', '#FF006E', '#A855F7', '#FF8A00',
    '#7CB518', '#FFBF00', '#4A90E2', '#FF0000', '#2ED9C3'
]

function randomAccent(excludeHex) {
    const pool = ALL_ACCENTS.filter(h => h !== excludeHex)
    return pool[Math.floor(Math.random() * pool.length)]
}

// ─── Password strength rules ─────────────────────────────────────────────────
const RULES = [
    { id: 'length', label: 'At least 12 characters', test: (p) => p.length >= 12 },
    { id: 'upper', label: 'One uppercase letter (A–Z)', test: (p) => /[A-Z]/.test(p) },
    { id: 'lower', label: 'One lowercase letter (a–z)', test: (p) => /[a-z]/.test(p) },
    { id: 'number', label: 'One number (0–9)', test: (p) => /[0-9]/.test(p) },
    { id: 'special', label: 'One special character (!@#…)', test: (p) => /[^A-Za-z0-9]/.test(p) },
]

// ─── Left cosmetic panel ─────────────────────────────────────────────────────
function LeftPanel({ accentHex }) {
    return (
        <motion.div
            className="login-left"
            animate={{ backgroundColor: accentHex }}
            transition={{ duration: 0.65, ease: 'easeInOut' }}
        >
            {/* Subtle grid mesh */}
            <div className="login-left-mesh" />

            {/* Chemical blobs — white, heavily blurred, low opacity */}
            <div className="login-left-blob login-left-blob-a" />
            <div className="login-left-blob login-left-blob-b" />
            <div className="login-left-blob login-left-blob-c" />

            {/* Brand */}
            <div className="login-brand">
                <motion.span
                    className="material-symbols-rounded login-brand-icon"
                    animate={{ color: accentHex, filter: `drop-shadow(0 0 24px #ffffff88)` }}
                    transition={{ duration: 0.65 }}
                    style={{ fontVariationSettings: "'FILL' 1" }}
                >
                    auto_awesome
                </motion.span>

                {/* Shimmer re-triggers on every accent change via key */}
                <h1 className="login-brand-name" key={accentHex}>
                    Affinity
                </h1>

                <p className="login-brand-tagline">For Teachers Who Care</p>
            </div>
        </motion.div>
    )
}

// ─── Password strength indicator ─────────────────────────────────────────────
function StrengthMeter({ password, accentHex }) {
    if (!password) return null
    const passed = RULES.filter(r => r.test(password)).length
    const pct = (passed / RULES.length) * 100
    const barColor = passed <= 1 ? '#FF0000' : passed <= 2 ? '#FF8A00' : passed <= 3 ? '#FFBF00' : passed <= 4 ? '#7CB518' : accentHex

    return (
        <motion.div
            className="login-strength"
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
        >
            <div className="login-strength-track">
                <motion.div
                    className="login-strength-fill"
                    animate={{ width: `${pct}%`, backgroundColor: barColor }}
                    transition={{ duration: 0.35 }}
                />
            </div>
            <ul className="login-strength-rules">
                {RULES.map(rule => {
                    const ok = rule.test(password)
                    return (
                        <motion.li key={rule.id} animate={{ color: ok ? '#22c55e' : '#9ca3af' }} transition={{ duration: 0.2 }} className="login-strength-rule">
                            <span className="material-symbols-rounded" style={{ fontSize: 18, fontVariationSettings: "'FILL' 1", color: ok ? '#22c55e' : '#d1d5db' }}>
                                {ok ? 'check_circle' : 'radio_button_unchecked'}
                            </span>
                            {rule.label}
                        </motion.li>
                    )
                })}
            </ul>
        </motion.div>
    )
}

// ─── Email confirmation overlay ───────────────────────────────────────────────
function EmailConfirmOverlay({ email, accentHex, onBackToLogin }) {
    return (
        <motion.div
            className="login-confirm-overlay"
            initial={{ opacity: 0, scale: 0.97 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.97 }}
            transition={{ duration: 0.35, ease: 'easeOut' }}
        >
            <motion.div
                className="login-confirm-card"
                initial={{ y: 24, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.1, duration: 0.4, ease: 'easeOut' }}
            >
                {/* Animated icon */}
                <motion.div
                    className="login-confirm-icon-wrap"
                    animate={{
                        boxShadow: [`0 0 0 0px ${accentHex}44`, `0 0 0 18px ${accentHex}00`],
                        background: `${accentHex}18`,
                    }}
                    transition={{ duration: 1.4, repeat: Infinity, ease: 'easeOut' }}
                >
                    <motion.span
                        className="material-symbols-rounded"
                        animate={{ color: accentHex }}
                        transition={{ duration: 0.5 }}
                        style={{ fontSize: 64, fontVariationSettings: "'FILL' 1" }}
                    >
                        mark_email_unread
                    </motion.span>
                </motion.div>

                <h2 className="login-confirm-title">Check your inbox</h2>

                <p className="login-confirm-body">
                    We've sent a confirmation link to<br />
                    <strong>{email}</strong>
                </p>

                <p className="login-confirm-hint">
                    Click the link in the email to activate your account, then come back here to log in.
                </p>

                <motion.button
                    className="login-submit"
                    style={{ marginTop: 8 }}
                    animate={{ background: accentHex, boxShadow: `0 6px 32px ${accentHex}66` }}
                    transition={{ duration: 0.4 }}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={onBackToLogin}
                >
                    <span className="material-symbols-rounded" style={{ fontSize: 22, fontVariationSettings: "'FILL' 1" }}>login</span>
                    Back to Log In
                </motion.button>
            </motion.div>
        </motion.div>
    )
}

// ─── Main LoginScreen ─────────────────────────────────────────────────────────
export function LoginScreen({ onAuth }) {
    const [mode, setMode] = useState('login')
    const [email, setEmail] = useState('')
    const [password, setPassword] = useState('')
    const [confirm, setConfirm] = useState('')
    const [showPass, setShowPass] = useState(false)
    const [showConfirm, setShowConfirm] = useState(false)
    const [error, setError] = useState('')
    const [loading, setLoading] = useState(false)
    const [accentHex, setAccentHex] = useState(() => randomAccent(null))
    const [emailConfirmVisible, setEmailConfirmVisible] = useState(false)
    const [confirmedEmail, setConfirmedEmail] = useState('')

    const emailRef = useRef(null)

    const changeAccent = (currentHex) => setAccentHex(randomAccent(currentHex))

    // Focus email on mount
    useEffect(() => {
        const t = setTimeout(() => emailRef.current?.focus(), 400)
        return () => clearTimeout(t)
    }, [])

    // Change accent + reset fields when switching modes
    const switchMode = (newMode) => {
        setMode(newMode)
        setError('')
        setPassword('')
        setConfirm('')
        changeAccent(accentHex)
    }

    const passwordStrong = RULES.every(r => r.test(password))

    // ── Submit ────────────────────────────────────────────────────────────────
    async function handleSubmit(e) {
        e.preventDefault()
        setError('')

        if (!email.trim()) return setError('Please enter your email address.')
        if (!password) return setError('Please enter your password.')

        if (mode === 'signup') {
            if (!passwordStrong) return setError('Please satisfy all password requirements.')
            if (password !== confirm) return setError('Passwords do not match.')
        }

        setLoading(true)
        try {
            if (mode === 'signup') {
                const { error: signUpError } = await supabase.auth.signUp({ email: email.trim(), password })
                if (signUpError) throw signUpError
                setConfirmedEmail(email.trim())
                setEmailConfirmVisible(true)
            } else {
                const { data, error: signInError } = await supabase.auth.signInWithPassword({ email: email.trim(), password })
                if (signInError) throw signInError
                onAuth(data.user)
            }
        } catch (err) {
            setError(err.message || 'Something went wrong. Please try again.')
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="login-root">
            <LeftPanel accentHex={accentHex} />

            {/* ── Right panel ──────────────────────────────────────────────── */}
            <div
                className="login-right"
                style={{ '--accent': accentHex, '--scrollbar-thumb': accentHex, '--scrollbar-track': `${accentHex}28` }}
            >
                <div className="login-form-wrap">

                    {/* Mode toggle */}
                    <div className="login-toggle">
                        <button
                            className={`login-toggle-btn ${mode === 'login' ? 'active' : ''}`}
                            style={mode === 'login' ? { background: accentHex, color: '#fff', borderColor: accentHex } : {}}
                            onClick={() => switchMode('login')}
                            type="button"
                        >
                            Log In
                        </button>
                        <button
                            className={`login-toggle-btn ${mode === 'signup' ? 'active' : ''}`}
                            style={mode === 'signup' ? { background: accentHex, color: '#fff', borderColor: accentHex } : {}}
                            onClick={() => switchMode('signup')}
                            type="button"
                        >
                            Sign Up
                        </button>
                    </div>

                    {/* Heading */}
                    <AnimatePresence mode="wait">
                        <motion.div
                            key={mode}
                            initial={{ opacity: 0, y: 12 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -12 }}
                            transition={{ duration: 0.25 }}
                        >
                            <h2 className="login-heading">
                                {mode === 'login' ? 'Welcome back' : 'Create your account'}
                            </h2>
                            <p className="login-subheading">
                                {mode === 'login'
                                    ? 'Sign in to access your classes and lessons.'
                                    : 'Get started with Affinity in seconds.'}
                            </p>
                        </motion.div>
                    </AnimatePresence>

                    {/* Form */}
                    <form className="login-form" onSubmit={handleSubmit} noValidate>

                        {/* Email */}
                        <div className="login-field-group">
                            <label className="login-label">Email address</label>
                            <div className="login-input-wrap">
                                <span className="material-symbols-rounded login-input-icon" style={{ color: accentHex }}>
                                    mail
                                </span>
                                <input
                                    ref={emailRef}
                                    className="login-input"
                                    type="email"
                                    placeholder="your@email.com"
                                    value={email}
                                    onChange={e => setEmail(e.target.value)}
                                    onFocus={() => changeAccent(accentHex)}
                                    style={{ '--field-accent': accentHex }}
                                    autoComplete="email"
                                />
                            </div>
                        </div>

                        {/* Password */}
                        <div className="login-field-group">
                            <label className="login-label">Password</label>
                            <div className="login-input-wrap">
                                <span className="material-symbols-rounded login-input-icon" style={{ color: accentHex }}>
                                    lock
                                </span>
                                <input
                                    className="login-input"
                                    type={showPass ? 'text' : 'password'}
                                    placeholder={mode === 'signup' ? 'Create a strong password' : 'Enter your password'}
                                    value={password}
                                    onChange={e => setPassword(e.target.value)}
                                    onFocus={() => changeAccent(accentHex)}
                                    style={{ '--field-accent': accentHex }}
                                    autoComplete={mode === 'signup' ? 'new-password' : 'current-password'}
                                />
                                <button type="button" className="login-eye-btn" onClick={() => setShowPass(v => !v)} tabIndex={-1}>
                                    <span className="material-symbols-rounded" style={{ fontSize: 22, color: '#9ca3af' }}>
                                        {showPass ? 'visibility_off' : 'visibility'}
                                    </span>
                                </button>
                            </div>
                            <AnimatePresence>
                                {mode === 'signup' && password && (
                                    <StrengthMeter password={password} accentHex={accentHex} />
                                )}
                            </AnimatePresence>
                        </div>

                        {/* Confirm password — signup only */}
                        <AnimatePresence>
                            {mode === 'signup' && (
                                <motion.div
                                    className="login-field-group"
                                    initial={{ opacity: 0, height: 0 }}
                                    animate={{ opacity: 1, height: 'auto' }}
                                    exit={{ opacity: 0, height: 0 }}
                                    transition={{ duration: 0.3 }}
                                >
                                    <label className="login-label">Confirm password</label>
                                    <div className="login-input-wrap">
                                        <span className="material-symbols-rounded login-input-icon" style={{ color: accentHex }}>
                                            lock_reset
                                        </span>
                                        <input
                                            className="login-input"
                                            type={showConfirm ? 'text' : 'password'}
                                            placeholder="Re-enter your password"
                                            value={confirm}
                                            onChange={e => setConfirm(e.target.value)}
                                            onFocus={() => changeAccent(accentHex)}
                                            style={{ '--field-accent': accentHex }}
                                            autoComplete="new-password"
                                        />
                                        <button type="button" className="login-eye-btn" onClick={() => setShowConfirm(v => !v)} tabIndex={-1}>
                                            <span className="material-symbols-rounded" style={{ fontSize: 22, color: '#9ca3af' }}>
                                                {showConfirm ? 'visibility_off' : 'visibility'}
                                            </span>
                                        </button>
                                    </div>
                                    {confirm && (
                                        <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="login-match"
                                            style={{ color: password === confirm ? '#22c55e' : '#ef4444' }}>
                                            <span className="material-symbols-rounded" style={{ fontSize: 16, fontVariationSettings: "'FILL' 1" }}>
                                                {password === confirm ? 'check_circle' : 'cancel'}
                                            </span>
                                            {password === confirm ? 'Passwords match' : 'Passwords do not match'}
                                        </motion.p>
                                    )}
                                </motion.div>
                            )}
                        </AnimatePresence>

                        {/* Error */}
                        <AnimatePresence>
                            {error && (
                                <motion.div
                                    className="login-message login-message-error"
                                    initial={{ opacity: 0, y: -8 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0 }}
                                >
                                    <span className="material-symbols-rounded" style={{ fontSize: 20, fontVariationSettings: "'FILL' 1" }}>error</span>
                                    {error}
                                </motion.div>
                            )}
                        </AnimatePresence>

                        {/* Submit */}
                        <motion.button
                            type="submit"
                            className="login-submit"
                            disabled={loading}
                            animate={{ background: accentHex, boxShadow: `0 6px 32px ${accentHex}66` }}
                            transition={{ duration: 0.5 }}
                            whileHover={{ scale: loading ? 1 : 1.02, boxShadow: `0 8px 40px ${accentHex}88` }}
                            whileTap={{ scale: loading ? 1 : 0.98 }}
                        >
                            {loading ? (
                                <span className="login-spinner" />
                            ) : (
                                <>
                                    <span className="material-symbols-rounded" style={{ fontSize: 22, fontVariationSettings: "'FILL' 1" }}>
                                        {mode === 'login' ? 'login' : 'person_add'}
                                    </span>
                                    {mode === 'login' ? 'Log In' : 'Create Account'}
                                </>
                            )}
                        </motion.button>
                    </form>

                    {/* Switch mode */}
                    <p className="login-switch">
                        {mode === 'login' ? "Don't have an account? " : 'Already have an account? '}
                        <button
                            type="button"
                            className="login-switch-link"
                            style={{ color: accentHex }}
                            onClick={() => switchMode(mode === 'login' ? 'signup' : 'login')}
                        >
                            {mode === 'login' ? 'Sign Up' : 'Log In'}
                        </button>
                    </p>
                </div>
            </div>

            {/* ── Email confirmation overlay ────────────────────────────────── */}
            <AnimatePresence>
                {emailConfirmVisible && (
                    <EmailConfirmOverlay
                        email={confirmedEmail}
                        accentHex={accentHex}
                        onBackToLogin={() => {
                            setEmailConfirmVisible(false)
                            switchMode('login')
                        }}
                    />
                )}
            </AnimatePresence>
        </div>
    )
}

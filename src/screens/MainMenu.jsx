import { motion } from 'framer-motion'
import { useAnimatedTitle } from '../hooks/useAnimatedTitle'
import { colorValues, lightTints, textColors } from '../engine/serotoninEngine'
import { FloatingStars } from '../components/FloatingStars'

export function MainMenu({ onNavigate, onAccentChange, isDarkMode, onToggleDarkMode, userName }) {
    const { title, color } = useAnimatedTitle({
        onColorChange: onAccentChange,
        initialColor: 'cyan',
        userName
    })

    const buttonStyle = {
        '--btn-bg': lightTints[color],
        '--btn-color': colorValues[color],
        '--btn-text': textColors[color],
        '--btn-hover-bg': `${colorValues[color]}40`
    }

    return (
        <motion.div
            className="main-content"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
        >
            {/* Top Bar with Icons */}
            <div style={{
                position: 'absolute',
                top: 24,
                right: 24,
                display: 'flex',
                gap: 16,
                zIndex: 100
            }}>
                {/* Dark Mode Toggle */}
                <motion.button
                    onClick={onToggleDarkMode}
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.95 }}
                    style={{
                        width: 44,
                        height: 44,
                        borderRadius: '50%',
                        border: `2px solid ${colorValues[color]}`,
                        backgroundColor: isDarkMode ? colorValues[color] : 'transparent',
                        color: isDarkMode ? '#111' : colorValues[color],
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: 20
                    }}
                    title={isDarkMode ? 'Light Mode' : 'Dark Mode'}
                >
                    {isDarkMode ? (
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                            <circle cx="12" cy="12" r="5" />
                            <path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42" />
                        </svg>
                    ) : (
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                            <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
                        </svg>
                    )}
                </motion.button>

                {/* Info Icon */}
                <motion.button
                    onClick={() => onNavigate('settings', color)}
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.95 }}
                    style={{
                        width: 44,
                        height: 44,
                        borderRadius: '50%',
                        border: `2px solid ${colorValues[color]}`,
                        backgroundColor: 'transparent',
                        color: colorValues[color],
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: 24,
                        fontWeight: 'bold',
                        fontFamily: 'serif'
                    }}
                    title="About this app"
                >
                    <span
                        aria-hidden="true"
                        style={{
                            fontFamily: 'var(--font-display)',
                            fontSize: 18,
                            fontWeight: 800
                        }}
                    >
                        i
                    </span>
                </motion.button>
            </div>

            {title}

            <div className="home-menu-grid">
                <motion.div
                    className="menu-item"
                    initial={{ y: 40, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ delay: 0.3 }}
                >
                    <button
                        className="btn btn-dynamic"
                        style={{ width: '100%', height: '100%', ...buttonStyle }}
                        onClick={() => onNavigate('revise', color)}
                    >
                        Revise
                    </button>
                </motion.div>

                <motion.div
                    className="menu-item"
                    initial={{ y: 40, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ delay: 0.4 }}
                    style={{ position: 'relative' }}
                >
                    <FloatingStars color={color} />
                    <button
                        className="btn btn-dynamic"
                        style={{ width: '100%', height: '100%', ...buttonStyle, position: 'relative', zIndex: 1 }}
                        onClick={() => onNavigate('unit8-grammar', color)}
                    >
                        Unit 8 Grammar
                    </button>
                </motion.div>

                <motion.div
                    className="menu-item"
                    initial={{ y: 40, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ delay: 0.5 }}
                >
                    <button
                        className="btn btn-dynamic"
                        style={{ width: '100%', height: '100%', ...buttonStyle }}
                        onClick={() => onNavigate('idle', color)}
                    >
                        Idle Animations
                    </button>
                </motion.div>

                <motion.div
                    className="menu-item"
                    initial={{ y: 40, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ delay: 0.6 }}
                >
                    <button
                        className="btn btn-dynamic"
                        style={{ width: '100%', height: '100%', ...buttonStyle }}
                        onClick={() => onNavigate('vocab-units', color)}
                    >
                        Vocab
                    </button>
                </motion.div>
            </div>
        </motion.div>
    )
}

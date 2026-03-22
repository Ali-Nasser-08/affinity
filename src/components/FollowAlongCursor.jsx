import { useEffect, useState } from 'react'
import { motion, useSpring, useMotionValue, AnimatePresence } from 'framer-motion'

export function FollowAlongCursor({ color = '#FF0088', enabled = false, size = 'medium' }) {
    const cursorX = useMotionValue(-100)
    const cursorY = useMotionValue(-100)
    const [ripples, setRipples] = useState([])

    const sizes = {
        small: 32,
        medium: 64,
        large: 96
    }

    const currentSize = sizes[size] || sizes.medium

    // Optimized for ultra-responsive feel while maintaining smoothness
    // High stiffness = fast response, low mass = nimble, sufficient damping = no wobble
    const springConfig = { damping: 25, stiffness: 1200, mass: 0.2 }
    const x = useSpring(cursorX, springConfig)
    const y = useSpring(cursorY, springConfig)
    const [isClicking, setIsClicking] = useState(false)

    useEffect(() => {
        if (!enabled) return

        const handleMove = (e) => {
            cursorX.set(e.clientX)
            cursorY.set(e.clientY)
        }

        const handleDown = () => setIsClicking(true)

        const handleUp = () => setIsClicking(false)

        const handleClick = (e) => {
            // Don't ripple if the user is highlighting text
            const selection = window.getSelection()
            if (selection && selection.toString().trim().length > 0) {
                return
            }

            const id = Date.now() + Math.random()
            setRipples(prev => [...prev, { id, x: e.clientX, y: e.clientY }])
            setTimeout(() => {
                setRipples(prev => prev.filter(r => r.id !== id))
            }, 1000)
        }

        window.addEventListener('mousemove', handleMove)
        window.addEventListener('mousedown', handleDown)
        window.addEventListener('mouseup', handleUp)
        window.addEventListener('click', handleClick)

        // Hide default cursor
        document.body.style.cursor = 'none'

        return () => {
            window.removeEventListener('mousemove', handleMove)
            window.removeEventListener('mousedown', handleDown)
            window.removeEventListener('mouseup', handleUp)
            window.removeEventListener('click', handleClick)
            document.body.style.cursor = 'auto' // Restore default cursor
        }
    }, [enabled, cursorX, cursorY])

    if (!enabled) return null

    return (
        <>
            <style>{`
        * {
          cursor: none !important;
        }
        body.hide-custom-cursor .follow-cursor-element {
            display: none !important;
        }
      `}</style>

            <AnimatePresence>
                {ripples.map(ripple => (
                    <div
                        key={ripple.id}
                        style={{
                            position: 'fixed',
                            left: ripple.x - 70,
                            top: ripple.y - 70,
                            width: 140,
                            height: 140,
                            pointerEvents: 'none',
                            zIndex: 9998,
                        }}
                    >
                        {/* Primary expanding ring */}
                        <motion.div
                            initial={{ scale: 0, opacity: 0.9 }}
                            animate={{ scale: 1.2, opacity: 0 }}
                            transition={{ duration: 0.7, ease: "easeOut" }}
                            style={{
                                position: 'absolute',
                                left: 10, top: 10, right: 10, bottom: 10,
                                borderRadius: '50%',
                                border: `6px solid ${color}`,
                            }}
                        />
                        {/* Secondary trailing softer expanding ring */}
                        <motion.div
                            initial={{ scale: 0, opacity: 0.6 }}
                            animate={{ scale: 1.5, opacity: 0 }}
                            transition={{ duration: 0.9, ease: "easeOut", delay: 0.1 }}
                            style={{
                                position: 'absolute',
                                left: 20, top: 20, right: 20, bottom: 20,
                                borderRadius: '50%',
                                border: `3px solid ${color}`,
                            }}
                        />

                        {/* Splashing small droplets */}
                        {Array.from({ length: 12 }).map((_, i) => {
                            const angle = (i / 12) * Math.PI * 2;
                            const distance = 80;
                            const dx = Math.cos(angle) * distance;
                            const dy = Math.sin(angle) * distance;

                            return (
                                <motion.div
                                    key={i}
                                    initial={{ x: 0, y: 0, scale: 1.2, opacity: 1 }}
                                    animate={{ x: dx, y: dy, scale: 0, opacity: 0 }}
                                    transition={{ duration: 0.6, ease: "easeOut" }}
                                    style={{
                                        position: 'absolute',
                                        left: '50%',
                                        top: '50%',
                                        width: 10,
                                        height: 10,
                                        marginLeft: -5,
                                        marginTop: -5,
                                        backgroundColor: color,
                                        borderRadius: '50%',
                                    }}
                                />
                            );
                        })}
                    </div>
                ))}
            </AnimatePresence>

            <motion.div
                className="follow-cursor-element"
                style={{
                    position: 'fixed',
                    left: 0,
                    top: 0,
                    x,
                    y,
                    pointerEvents: 'none',
                    zIndex: 9999,
                    // Using translate to center the "tip" or modify hotspot
                    // Figma cursor tip is top-left.
                    // Adjust margin based on size to keep the tip (approx 6.5, 4.5 in viewbox) aligned.
                    // The viewbox is 32x32. The tip is at roughly (6, 5).
                    // So -6/32 * size and -5/32 * size would work better, but the original -8 worked for 64.
                    // Let's scale the offset roughly with size.
                    marginLeft: -(currentSize * 0.125),
                    marginTop: -(currentSize * 0.125),
                    willChange: 'transform', // Hardware acceleration hint
                }}
            >
                <motion.div
                    animate={{ scale: isClicking ? 0.8 : 1 }}
                    transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                >
                    <svg
                        width={currentSize}
                        height={currentSize}
                        viewBox="0 0 32 32"
                        fill="none"
                        xmlns="http://www.w3.org/2000/svg"
                        style={{
                            filter: 'drop-shadow(0px 4px 8px rgba(0,0,0,0.15))'
                        }}
                    >
                        {/* 
                  Cute cursor shape:
                  A slightly rounded, chubby arrow/wedge.
                  No tail.
                */}
                        <path
                            d="M6.5 4.5C5.8 4.5 5.5 5.2 5.8 5.8L12.5 24.5C12.8 25.2 13.8 25.2 14.0 24.5L16.5 17.5L23.5 15.0C24.2 14.8 24.2 13.8 23.5 13.5L6.5 4.5Z"
                            fill={color}
                            stroke="white"
                            strokeWidth="2.5"
                            strokeLinejoin="round"
                            rx="2"
                        />
                    </svg>
                </motion.div>
            </motion.div>
        </>
    )
}

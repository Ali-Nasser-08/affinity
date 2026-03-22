import { useMemo } from 'react'
import { motion } from 'framer-motion'
import { colorValues } from '../engine/serotoninEngine'

export function FloatingStars({ color }) {
    const stars = useMemo(() => Array.from({ length: 8 }, (_, i) => ({
        id: i,
        size: 12 + Math.random() * 10,
        x: Math.random() * 100,
        y: Math.random() * 100,
        delay: Math.random() * 2,
        duration: 3 + Math.random() * 2
    })), [])

    return (
        <div style={{ position: 'absolute', inset: 0, overflow: 'hidden', pointerEvents: 'none' }}>
            {stars.map(star => (
                <motion.svg
                    key={star.id}
                    width={star.size}
                    height={star.size}
                    viewBox="0 0 24 24"
                    style={{
                        position: 'absolute',
                        left: `${star.x}%`,
                        top: `${star.y}%`,
                    }}
                    initial={{ opacity: 0, scale: 0, rotate: 0 }}
                    animate={{
                        opacity: [0, 1, 1, 0],
                        scale: [0.5, 1, 1, 0.5],
                        rotate: [0, 180, 360],
                        y: [0, -20, 0, 20, 0]
                    }}
                    transition={{
                        duration: star.duration,
                        delay: star.delay,
                        repeat: Infinity,
                        ease: "easeInOut"
                    }}
                >
                    <motion.path
                        d="M12 2L14.5 9.5L22 12L14.5 14.5L12 22L9.5 14.5L2 12L9.5 9.5L12 2Z"
                        animate={{ fill: colorValues[color] }}
                        transition={{ duration: 0.3 }}
                    />
                </motion.svg>
            ))}
        </div>
    )
}

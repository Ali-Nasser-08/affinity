import { motion } from 'framer-motion'
import { colorValues } from '../engine/serotoninEngine'

export function CardSparkles({ color }) {
    const sparkleColor = `${colorValues[color]}40`
    const sparkleColorSoft = `${colorValues[color]}20`

    return (
        <>
            <motion.span
                style={{
                    position: 'absolute',
                    top: 22,
                    right: 26,
                    width: 10,
                    height: 10,
                    borderRadius: '50%',
                    background: sparkleColor,
                    filter: 'blur(0.2px)',
                    pointerEvents: 'none'
                }}
                animate={{ scale: [1, 1.4, 1], opacity: [0.5, 0.9, 0.5] }}
                transition={{ duration: 2.6, repeat: Infinity, ease: 'easeInOut' }}
            />
            <motion.span
                style={{
                    position: 'absolute',
                    bottom: 24,
                    left: 24,
                    width: 14,
                    height: 14,
                    borderRadius: '50%',
                    background: sparkleColorSoft,
                    filter: 'blur(1px)',
                    pointerEvents: 'none'
                }}
                animate={{ scale: [1, 1.6, 1], opacity: [0.4, 0.8, 0.4] }}
                transition={{ duration: 3.2, repeat: Infinity, ease: 'easeInOut', delay: 0.4 }}
            />
        </>
    )
}

import { motion } from 'framer-motion'
import { colorValues } from '../engine/serotoninEngine'

export function BackArrow({ onClick, color }) {
    return (
        <motion.div
            className="back-arrow"
            onClick={onClick}
            style={{ color: colorValues[color] || colorValues.cyan }}
            whileHover={{ scale: 1.1, x: -4 }}
            whileTap={{ scale: 0.95 }}
            initial={{ opacity: 0, x: -30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ type: 'spring', damping: 20 }}
        >
            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round">
                <path d="M19 12H5" />
                <path d="M12 19l-7-7 7-7" />
            </svg>
        </motion.div>
    )
}

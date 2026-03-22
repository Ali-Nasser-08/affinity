import React from 'react'
import { motion } from 'framer-motion'
import { BackArrow } from '../components/BackArrow'

// Placeholder for new idle animations
export function PlaceholderIdle({ onBack, title }) {
    return (
        <motion.div
            className="idle-container"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
        >
            <BackArrow onClick={onBack} color="cyan" />
            <div className="flex flex-col items-center justify-center h-full">
                <h1 className="text-4xl font-bold text-white mb-4">{title}</h1>
                <p className="text-xl text-white/60">Coming soon...</p>
            </div>
        </motion.div>
    )
}

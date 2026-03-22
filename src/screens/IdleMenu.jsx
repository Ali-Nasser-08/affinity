import React, { useEffect } from 'react'
import { motion } from 'framer-motion'
import { BackArrow } from '../components/BackArrow'
import { colorValues, lightTints } from '../engine/serotoninEngine'
import { useAnimatedTitle } from '../hooks/useAnimatedTitle'

const menuItems = [
    {
        key: 'grammar',
        label: 'Grammar',
        icon: 'auto_stories'
    },
    {
        key: 'vocab-carousel',
        label: 'Vocabulary Carousel',
        icon: 'view_carousel'
    },
    {
        key: 'idioms',
        label: 'Idioms',
        icon: 'chat'
    },
    {
        key: 'spot-error',
        label: 'Spot The Error',
        icon: 'search'
    }
]

export function IdleMenu({ onNavigate, onBack, onAccentChange, userName }) {
    const { title, color } = useAnimatedTitle({
        onColorChange: onAccentChange,
        initialColor: 'cyan',
        userName
    })

    return (
        <motion.div
            className="idle-screen"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
        >
            <div className="idle-blobs">
                <motion.div
                    className="idle-blob"
                    style={{
                        top: '10%', left: '10%', width: '400px', height: '400px',
                        backgroundColor: colorValues[color]
                    }}
                    animate={{ backgroundColor: colorValues[color] }}
                    transition={{ duration: 2 }}
                />
                <motion.div
                    className="idle-blob"
                    style={{
                        bottom: '10%', right: '10%', width: '300px', height: '300px',
                        backgroundColor: colorValues[color]
                    }}
                    animate={{ backgroundColor: colorValues[color] }}
                    transition={{ duration: 3, delay: 0.5 }}
                />
            </div>

            <BackArrow onClick={onBack} color={color} />

            <div className="idle-header">
                {title}
            </div>

            <div className="idle-cards-container">
                {menuItems.map((item, i) => (
                    <motion.div
                        key={item.key}
                        className="idle-card"
                        style={{
                            '--card-color': colorValues[color],
                            '--card-light': lightTints[color]
                        }}
                        initial={{ scale: 0.9, opacity: 0, y: 30 }}
                        animate={{ scale: 1, opacity: 1, y: 0 }}
                        transition={{
                            delay: 0.3 + (i * 0.1),
                            duration: 0.6,
                            ease: [0.16, 1, 0.3, 1]
                        }}
                        onClick={() => onNavigate(item.key)}
                    >
                        <div className="idle-card-icon-container">
                            <span className="material-symbols-rounded idle-card-icon material-filled">
                                {item.icon}
                            </span>
                        </div>

                        <h2 className="idle-card-title">{item.label}</h2>
                    </motion.div>
                ))}
            </div>
        </motion.div>
    )
}

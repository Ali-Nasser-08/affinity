import { useMemo, useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import adjectivesData from '../../adjectives.json'
import { colorValues, getRandomAccentExcluding } from '../engine/serotoninEngine'
import { shuffle } from '../utils/helpers'

export function useAnimatedTitle({ onColorChange, initialColor = 'cyan', userName }) {
    const [shuffledAdjectives, setShuffledAdjectives] = useState([])
    const [adjIndex, setAdjIndex] = useState(0)
    const [displayedWord, setDisplayedWord] = useState('')
    const [isDeleting, setIsDeleting] = useState(false)
    const [currentColor, setCurrentColor] = useState(() => {
        if (localStorage.getItem('app_structured_mode') === 'true') {
            return localStorage.getItem('app_structured_color') || 'cyan'
        }
        const storedColor = localStorage.getItem('app_last_accent')
        return storedColor || initialColor
    })

    // Shuffle adjectives on mount
    useEffect(() => {
        setShuffledAdjectives(shuffle(adjectivesData))
    }, [])

    const currentAdjective = shuffledAdjectives[adjIndex] || 'Amazing'

    // Typewriter effect + notify parent of color changes
    useEffect(() => {
        if (localStorage.getItem('app_structured_mode') === 'true') {
            setDisplayedWord('Amazing')
            return
        }

        if (shuffledAdjectives.length === 0) return

        let timeout

        if (!isDeleting) {
            if (displayedWord.length < currentAdjective.length) {
                timeout = setTimeout(() => {
                    setDisplayedWord(currentAdjective.slice(0, displayedWord.length + 1))
                }, 80 + Math.random() * 40)
            } else {
                timeout = setTimeout(() => {
                    setIsDeleting(true)
                }, 2500)
            }
        } else {
            if (displayedWord.length > 0) {
                timeout = setTimeout(() => {
                    setDisplayedWord(displayedWord.slice(0, -1))
                }, 40)
            } else {
                setIsDeleting(false)
                // Get a different color - never the same as current
                const newColor = getRandomAccentExcluding(currentColor)
                setCurrentColor(newColor)
                onColorChange?.(newColor)

                if (adjIndex >= shuffledAdjectives.length - 1) {
                    setShuffledAdjectives(shuffle(adjectivesData))
                    setAdjIndex(0)
                } else {
                    setAdjIndex(prev => prev + 1)
                }
            }
        }

        return () => clearTimeout(timeout)
    }, [displayedWord, isDeleting, currentAdjective, shuffledAdjectives, adjIndex, onColorChange, currentColor])

    // Also notify on initial color
    useEffect(() => {
        onColorChange?.(currentColor)
        localStorage.setItem('app_last_accent', currentColor)
    }, [currentColor, onColorChange])

    return {
        title: (
            <motion.div
                className="home-title mb-lg"
                initial={{ y: -40, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.2 }}
            >
                <span className="home-title-line">
                    <span className="home-title-text">
                        {userName}'s{' '}
                        <span
                            className="home-adjective"
                            style={{ color: colorValues[currentColor] }}
                        >
                            {displayedWord}
                        </span>
                        <span
                            className="home-cursor"
                            style={{ backgroundColor: colorValues[currentColor] }}
                        />
                        {' '}class
                    </span>
                </span>
            </motion.div>
        ),
        color: currentColor
    }
}

import { useState, useEffect, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { accentColors, bgTints, colorValues, textColors } from '../engine/serotoninEngine'
import { TopBar } from '../components/TopBar'
import { useAnimatedTitle } from '../hooks/useAnimatedTitle'
import { getBookUnits, getUnitMeta } from '../data/units'
import { VocabCardPlayer } from '../components/VocabCardPlayer'

// Vocab set data imports - Dynamic loading
const vocabModules = import.meta.glob('../data/books/megaGoal1/vocab/**/*.json', { eager: true })

// Icon mapping for specific sets to maintain consistent UI
const VOCAB_ICONS = {
    '1-1': 'auto_stories', '1-2': 'quiz', '1-3': 'email', '1-4': 'record_voice_over', '1-5': 'school',
    '2-1': 'work', '2-2': 'handshake', '2-3': 'business_center', '2-4': 'contact_page',
    '3-1': 'rocket_launch', '3-2': 'quiz', '3-3': 'home', '3-4': 'inventory_2', '3-5': 'diamond',
    '4-1': 'shopping_bag', '4-2': 'category'
}

// Playful card rotations for a hand-placed scrappy feel
const CARD_ROTATIONS = [-2.2, 1.4, -0.8, 2.1, -1.6, 0.9, -2.5, 1.8]

export function VocabUnitsScreen({ selectedBook, onBack, onAccentChange, userName, selectedUnit, onSelectUnit, staticColor }) {
    const unitNumber = typeof selectedUnit === 'string' ? parseInt(selectedUnit, 10) : selectedUnit
    const selectedMeta = unitNumber ? getUnitMeta(selectedBook, unitNumber) : null
    const accentColor = staticColor || 'cyan'

    const [selectedPart, setSelectedPart] = useState(() => localStorage.getItem('vocab_selected_part') || '1')
    const [activeVocabSet, setActiveVocabSet] = useState(null)

    useEffect(() => {
        localStorage.setItem('vocab_selected_part', selectedPart)
    }, [selectedPart])

    const { title, color } = useAnimatedTitle({
        onColorChange: onAccentChange,
        initialColor: accentColor,
        userName
    })
    const activeColor = color || accentColor

    useEffect(() => {
        onAccentChange?.(accentColor)
    }, [accentColor, onAccentChange])

    const accentValue = colorValues[activeColor]
    const unitsInBook = useMemo(() => getBookUnits(selectedBook), [selectedBook])

    const barUnits = useMemo(() => {
        const filtered = unitsInBook.filter((u) => {
            const n = typeof u === 'string' ? parseInt(u, 10) : u
            if (selectedPart === '1') return n >= 1 && n <= 6
            if (selectedPart === '2') return n >= 7 && n <= 12
            return true
        })
        return filtered
    }, [unitsInBook, selectedPart])

    useEffect(() => {
        if (selectedUnit == null && barUnits.length > 0) {
            const first = barUnits[0]
            const meta = getUnitMeta(selectedBook, first)
            onSelectUnit?.(first, meta.color || 'cyan')
        }
    }, [barUnits, onSelectUnit, selectedBook, selectedUnit])

    const vocabSets = useMemo(() => {
        if (selectedBook === 'Mega Goal 1') {
            const currentUnitSets = []
            for (const path in vocabModules) {
                const match = path.match(/\/unit(\d+)\/set(\d+)\.json$/)
                if (match) {
                    const uNum = parseInt(match[1], 10)
                    if (uNum === unitNumber) {
                        const sNum = parseInt(match[2], 10)
                        const mod = vocabModules[path]
                        const data = mod.default || mod
                        const iconKey = `${uNum}-${sNum}`
                        let icon = VOCAB_ICONS[iconKey]
                        if (!icon) {
                            const defaults = ['auto_stories', 'quiz', 'edit_note', 'campaign', 'school', 'language']
                            icon = defaults[(sNum - 1) % defaults.length]
                        }
                        currentUnitSets.push({
                            id: `u${uNum}-set-${sNum}`,
                            title: data.setTitle || `Set ${sNum}`,
                            subtitle: data.unit || `Unit ${uNum}`,
                            icon: icon,
                            wordCount: data.words?.length || 0,
                            data: data,
                            setNum: sNum
                        })
                    }
                }
            }
            return currentUnitSets.sort((a, b) => a.setNum - b.setNum)
        }
        return []
    }, [selectedBook, unitNumber])

    const selectedUnitMeta = unitNumber ? getUnitMeta(selectedBook, unitNumber) : null
    const unitAccent = selectedUnitMeta?.color || activeColor

    const cardPalette = useMemo(() => {
        const base = accentColors.includes(unitAccent) ? unitAccent : activeColor
        const startIndex = accentColors.indexOf(base)
        if (startIndex < 0) return accentColors
        return [...accentColors.slice(startIndex), ...accentColors.slice(0, startIndex)]
    }, [activeColor, unitAccent])

    if (activeVocabSet) {
        return (
            <AnimatePresence mode="wait">
                <VocabCardPlayer
                    vocabData={activeVocabSet}
                    accentColor={accentColor}
                    onComplete={() => setActiveVocabSet(null)}
                    onBack={() => setActiveVocabSet(null)}
                />
            </AnimatePresence>
        )
    }

    return (
        <motion.div
            className="main-content students-screen vocab-units-screen"
            style={{ paddingInline: 0 }}
            initial={{ opacity: 0 }}
            animate={{
                opacity: 1,
                '--accent': accentValue,
                '--accent-soft': `${accentValue}33`,
                '--accent-softer': `${accentValue}1f`,
            }}
            transition={{ duration: 0.22, ease: 'easeOut' }}
            exit={{ opacity: 0, transition: { duration: 0.12, ease: 'easeIn' } }}
        >

            {/* Top Bar */}
            <TopBar title={title} onBack={onBack} color={activeColor}>
                <div style={{ display: 'flex', gap: '8px' }}>
                    <button
                        onClick={() => setSelectedPart('1')}
                        className={`top-bar-button ${selectedPart === '1' ? 'active' : ''}`}
                        style={{
                            '--bar-accent': colorValues[activeColor],
                            '--bar-base-bg': 'white',
                            '--bar-base-text': colorValues[activeColor],
                            '--bar-shadow': `${colorValues[activeColor]}33`,
                            minWidth: '100px'
                        }}
                    >
                        Part 1
                    </button>
                    <button
                        onClick={() => setSelectedPart('2')}
                        className={`top-bar-button ${selectedPart === '2' ? 'active' : ''}`}
                        style={{
                            '--bar-accent': colorValues[activeColor],
                            '--bar-base-bg': 'white',
                            '--bar-base-text': colorValues[activeColor],
                            '--bar-shadow': `${colorValues[activeColor]}33`,
                            minWidth: '100px'
                        }}
                    >
                        Part 2
                    </button>
                </div>
            </TopBar>

            {/* Unit Selector - Sticky Tab Dividers */}
            <div className="vocab-units-bar">
                <div className="vocab-units-bar-grid">
                    {barUnits.map((u) => {
                        const unitMeta = getUnitMeta(selectedBook, u)
                        const unitColor = unitMeta.color || 'cyan'
                        const isActive = selectedUnit != null && String(selectedUnit) === String(u)

                        return (
                            <motion.button
                                key={u}
                                type="button"
                                className="vocab-unit-btn"
                                data-active={isActive ? 'true' : 'false'}
                                style={{ '--unit-color': colorValues[unitColor] }}
                                whileHover={{ y: -3, rotate: -1 }}
                                whileTap={{ scale: 0.95 }}
                                onClick={() => onSelectUnit?.(u, unitColor)}
                            >
                                <div className="vocab-unit-btn-top">
                                    <div className="vocab-unit-btn-number">Unit {u}</div>
                                    <span className="material-symbols-rounded vocab-unit-btn-icon">
                                        {unitMeta.icon || 'star'}
                                    </span>
                                </div>
                                <div className="vocab-unit-btn-title">{unitMeta.title || `Unit ${u}`}</div>
                            </motion.button>
                        )
                    })}
                </div>
            </div>

            {/* Content Area - Flashcard Grid */}
            <div className="vocab-content-area">
                {vocabSets.length > 0 ? (
                    <div className="vocab-sets-grid">
                        {vocabSets.map((set, i) => {
                            const cardAccent = cardPalette[i % cardPalette.length]
                            const cardColor = colorValues[cardAccent]
                            const rotation = CARD_ROTATIONS[i % CARD_ROTATIONS.length]


                            return (
                                <motion.div
                                    key={set.id}
                                    className="vocab-set-card"
                                    initial={{ opacity: 0, y: 30, rotate: rotation * 1.5 }}
                                    animate={{ opacity: 1, y: 0, rotate: rotation }}
                                    transition={{ duration: 0.45, delay: i * 0.07, ease: [0.22, 1, 0.36, 1] }}
                                    whileHover={{ y: -10, rotate: 0, scale: 1.04 }}
                                    whileTap={{ scale: 0.97 }}
                                    style={{
                                        '--card-color': cardColor,
                                        '--card-bg': bgTints[cardAccent],
                                        '--card-text': textColors[cardAccent],
                                        cursor: 'pointer',
                                    }}
                                    onClick={() => set.data && setActiveVocabSet(set.data)}
                                >
                                    {/* Washi tape decoration */}
                                    <div className="vocab-card-tape" style={{ '--tape-color': `${cardColor}88` }} />

                                    <div className="vocab-set-card-content">

                                        <div className="vocab-set-card-icon" style={{ background: cardColor }}>
                                            <span className="material-symbols-rounded">{set.icon}</span>
                                        </div>

                                        <div className="vocab-set-card-title" style={{ color: `color-mix(in srgb, ${cardColor} 72%, #1a1a2e 28%)` }}>
                                            {set.title}
                                        </div>

                                        <div className="vocab-set-card-badges">
                                            <div className="vocab-set-card-badge" style={{
                                                background: `${cardColor}15`,
                                                borderColor: `${cardColor}30`,
                                                color: `color-mix(in srgb, ${cardColor} 68%, #000 32%)`
                                            }}>
                                                <span className="material-symbols-rounded" style={{ fontSize: '15px' }}>style</span>
                                                {set.wordCount} cards
                                            </div>
                                        </div>
                                    </div>

                                    {/* Colored bottom edge like index card divider */}
                                    <div className="vocab-card-edge" style={{ background: cardColor }} />
                                </motion.div>
                            )
                        })}
                    </div>
                ) : (
                    <motion.div
                        className="vocab-sets-empty"
                        initial={{ opacity: 0, y: 12, rotate: -1 }}
                        animate={{ opacity: 1, y: 0, rotate: -1 }}
                        transition={{ duration: 0.25 }}
                    >
                        <span className="material-symbols-rounded" style={{ fontSize: '48px', color: accentValue, marginBottom: '12px', display: 'block', opacity: 0.5 }}>edit_note</span>
                        No vocabulary flashcards for this unit yet!
                    </motion.div>
                )}
            </div>
        </motion.div>
    )
}

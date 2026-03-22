import { useState, useEffect, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { colorValues, textColors } from '../engine/serotoninEngine'
import { logoOptions } from '../data/logos'

// Group logos by category for easier browsing
const logoCategories = [
    { name: 'Science', icons: ['science', 'biotech', 'psychology', 'functions', 'experiment', 'neurology'] },
    { name: 'School', icons: ['menu_book', 'school', 'backpack', 'edit', 'brush', 'palette', 'history_edu', 'local_library'] },
    { name: 'Nature', icons: ['eco', 'local_florist', 'park', 'water_drop', 'landscape', 'forest', 'volcano', 'air'] },
    { name: 'Cosmos', icons: ['rocket_launch', 'public', 'wb_sunny', 'nightlight', 'cyclone', 'storm'] },
    { name: 'Animals', icons: ['cruelty_free', 'pets', 'flutter_dash', 'emoji_nature', 'set_meal', 'hearing'] },
    { name: 'Tech', icons: ['smart_toy', 'memory', 'terminal', 'dataset', 'code', 'dns'] },
    { name: 'Sports', icons: ['sports_soccer', 'sports_basketball', 'sports_tennis', 'directions_bike', 'skateboarding', 'sports_esports', 'hiking'] },
    { name: 'Fun', icons: ['videogame_asset', 'extension', 'casino', 'celebration', 'theater_comedy', 'cookie'] },
    { name: 'Objects', icons: ['lightbulb', 'key', 'diamond', 'emoji_events', 'star', 'favorite', 'cake', 'icecream', 'anchor', 'bolt'] }
]

export function StudentEditorScreen({ mode, initialData, onSave, onBack, accentColor, userName }) {
    const [name, setName] = useState(initialData?.name || '')
    const [logoId, setLogoId] = useState(() => {
        if (initialData?.logoId) return initialData.logoId
        const allIcons = logoCategories.flatMap(c => c.icons)
        return allIcons[Math.floor(Math.random() * allIcons.length)]
    })
    const [colorKey, setColorKey] = useState(initialData?.colorKey || accentColor || 'cyan')
    const [activeCategory, setActiveCategory] = useState(0)
    const [isShaking, setIsShaking] = useState(false)

    const colorKeys = Object.keys(colorValues)
    const currentColor = colorValues[colorKey]
    const currentTextColor = textColors[colorKey]

    // Handle name change and filter out Arabic characters
    const handleNameChange = (e) => {
        const value = e.target.value
        // Regex for Arabic characters
        const arabicRegex = /[\u0600-\u06FF\u0750-\u077F\u08A0-\u08FF\uFB50-\uFDFF\uFE70-\uFEFF]/g
        setName(value.replace(arabicRegex, ''))
    }

    // Generate static sparkles based on logoId to avoid re-renders moving them


    // Shake animation when trying to save without name
    const handleSave = () => {
        if (!name.trim()) {
            setIsShaking(true)
            setTimeout(() => setIsShaking(false), 500)
            return
        }
        onSave({ name: name.trim(), logoId, colorKey })
    }

    // Keyboard shortcuts
    useEffect(() => {
        const handleKey = (e) => {
            if (e.key === 'Escape') onBack()
            if (e.key === 'Enter' && e.metaKey) handleSave()
        }
        window.addEventListener('keydown', handleKey)
        return () => window.removeEventListener('keydown', handleKey)
    }, [name, logoId, colorKey])

    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            style={{
                position: 'fixed',
                inset: 0,
                background: '#fff',
                display: 'flex',
                flexDirection: 'column',
                overflow: 'hidden',
                zIndex: 200
            }}
        >
            {/* Floating Background Orbs */}
            <div style={{ position: 'absolute', inset: 0, overflow: 'hidden', pointerEvents: 'none' }}>
                <motion.div
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 1 }}
                    style={{
                        position: 'absolute',
                        top: '10%',
                        left: '5%',
                        width: '400px',
                        height: '400px',
                        borderRadius: '50%',
                        background: `radial-gradient(circle, ${currentColor}20 0%, transparent 70%)`,
                        filter: 'blur(40px)'
                    }}
                />
                <motion.div
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 1, delay: 0.2 }}
                    style={{
                        position: 'absolute',
                        bottom: '10%',
                        right: '10%',
                        width: '500px',
                        height: '500px',
                        borderRadius: '50%',
                        background: `radial-gradient(circle, ${currentColor}15 0%, transparent 70%)`,
                        filter: 'blur(60px)'
                    }}
                />
            </div>

            {/* Top Bar */}
            <div style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '20px 40px',
                position: 'relative',
                zIndex: 10
            }}>
                <motion.button
                    whileHover={{ scale: 1.05, x: -4 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={onBack}
                    style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '10px',
                        padding: '14px 24px',
                        borderRadius: '16px',
                        border: 'none',
                        background: 'white',
                        color: '#666',
                        fontSize: '18px',
                        fontWeight: 700,
                        cursor: 'pointer',
                        boxShadow: '0 4px 20px rgba(0,0,0,0.08)'
                    }}
                >
                    <span className="material-symbols-rounded" style={{ fontSize: '24px' }}>arrow_back</span>
                    Back
                </motion.button>



                <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={handleSave}
                    style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '10px',
                        padding: '14px 32px',
                        borderRadius: '16px',
                        border: 'none',
                        background: currentColor,
                        color: 'white',
                        fontSize: '18px',
                        fontWeight: 700,
                        cursor: 'pointer',
                        boxShadow: `0 8px 30px ${currentColor}50`
                    }}
                >
                    <span className="material-symbols-rounded" style={{ fontSize: '24px' }}>check</span>
                    {mode === 'add' ? 'Create' : 'Save'}
                </motion.button>
            </div>

            {/* Main Content */}
            <div style={{
                flex: 1,
                display: 'flex',
                gap: '60px',
                padding: '20px 60px 40px',
                minHeight: 0,
                position: 'relative',
                zIndex: 5
            }}>
                {/* LEFT: Giant Preview Card */}
                <div style={{
                    flex: 1.2,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    position: 'relative'
                }}>
                    {/* Glow Ring */}
                    <motion.div
                        animate={{ rotate: 360 }}
                        transition={{ duration: 20, repeat: Infinity, ease: 'linear' }}
                        style={{
                            position: 'absolute',
                            width: 'min(500px, 80vh)',
                            height: 'min(500px, 80vh)',
                            borderRadius: '50%',
                            background: `conic-gradient(from 0deg, ${currentColor}00, ${currentColor}30, ${currentColor}00)`,
                            filter: 'blur(30px)'
                        }}
                    />

                    {/* The Card */}
                    <motion.div
                        key={colorKey}
                        initial={{ scale: 0.9, opacity: 0, rotateY: -10 }}
                        animate={{ scale: 1, opacity: 1, rotateY: 0 }}
                        transition={{ type: 'spring', stiffness: 200, damping: 20 }}
                        style={{
                            width: 'min(380px, 45vh)',
                            height: 'min(580px, 75vh)',
                            background: `linear-gradient(135deg, #ffffff 0%, #f8f9fa 100%)`,
                            borderRadius: '32px',
                            border: `1px solid rgba(255,255,255,0.8)`,
                            boxShadow: `
                                0 40px 100px -20px ${currentColor}50,
                                0 0 0 6px rgba(255,255,255,0.4),
                                0 0 0 1px rgba(255,255,255,0.5) inset
                            `,
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: 'center',
                            padding: '0',
                            position: 'relative',
                            overflow: 'hidden'
                        }}
                    >
                        {/* Top Gradient Header */}
                        <div style={{
                            width: '100%',
                            height: '140px',
                            background: `linear-gradient(135deg, ${currentColor} 0%, ${currentColor}dd 100%)`,
                            position: 'relative',
                            display: 'flex',
                            justifyContent: 'center',
                            alignItems: 'flex-start',
                            paddingTop: '20px',
                            overflow: 'hidden'
                        }}>
                            {/* Decorative Circles in Header */}
                            <div style={{
                                position: 'absolute',
                                top: '-20px',
                                right: '-20px',
                                width: '100px',
                                height: '100px',
                                borderRadius: '50%',
                                background: 'white',
                                opacity: 0.1
                            }} />
                            <div style={{
                                position: 'absolute',
                                bottom: '-40px',
                                left: '-20px',
                                width: '150px',
                                height: '150px',
                                borderRadius: '50%',
                                background: 'white',
                                opacity: 0.05
                            }} />

                            {/* Card Hole */}
                            <div style={{
                                width: '60px',
                                height: '6px',
                                borderRadius: '99px',
                                background: 'rgba(0,0,0,0.2)',
                                backdropFilter: 'blur(4px)'
                            }} />
                        </div>

                        {/* Repeated Symbol Pattern Background */}
                        <div style={{
                            position: 'absolute',
                            inset: 0,
                            zIndex: 0,
                            opacity: 0.1,
                            pointerEvents: 'none',
                            overflow: 'hidden'
                        }}>
                            <svg width="100%" height="100%">
                                <defs>
                                    <pattern id="symbolPattern" x="0" y="0" width="60" height="60" patternUnits="userSpaceOnUse" patternTransform="rotate(20)">
                                        <text
                                            x="30"
                                            y="40"
                                            fontSize="30"
                                            fill={currentColor}
                                            fontFamily="'Material Symbols Rounded'"
                                            textAnchor="middle"
                                            dominantBaseline="middle"
                                        >
                                            {logoId}
                                        </text>
                                    </pattern>
                                </defs>
                                <rect width="100%" height="100%" fill="url(#symbolPattern)" />
                            </svg>
                        </div>

                        {/* Profile Content Container - overlaps header */}
                        <div style={{
                            marginTop: '-70px',
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: 'center',
                            width: '100%',
                            padding: '0 30px',
                            flex: 1,
                            position: 'relative', // Ensure content is above background logo
                            zIndex: 1
                        }}>
                            {/* Icon Container with Glass Effect */}
                            <motion.div
                                key={logoId}
                                initial={{ scale: 0, rotate: -180 }}
                                animate={{ scale: 1, rotate: 0 }}
                                transition={{ type: 'spring', stiffness: 300, damping: 15 }}
                                style={{
                                    width: '140px',
                                    height: '140px',
                                    borderRadius: '50%',
                                    background: 'rgba(255,255,255,0.9)',
                                    backdropFilter: 'blur(20px)',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    marginBottom: '24px',
                                    boxShadow: `0 20px 40px -10px rgba(0,0,0,0.15)`,
                                    border: '4px solid white',
                                    position: 'relative' // For badge/decor
                                }}
                            >
                                <span className="material-symbols-rounded material-filled" style={{
                                    fontSize: '70px',
                                    background: `linear-gradient(135deg, ${currentColor} 0%, ${currentColor}aa 100%)`,
                                    WebkitBackgroundClip: 'text',
                                    WebkitTextFillColor: 'transparent',
                                    filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.1))'
                                }}>
                                    {logoId}
                                </span>
                            </motion.div>

                            {/* Name Display */}
                            <motion.div
                                animate={isShaking ? { x: [-10, 10, -10, 10, 0] } : {}}
                                transition={{ duration: 0.4 }}
                                style={{
                                    textAlign: 'center',
                                    width: '100%',
                                    display: 'flex',
                                    flexDirection: 'column',
                                    justifyContent: 'flex-start',
                                    alignItems: 'center',
                                    paddingTop: '10px'
                                }}
                            >
                                <div style={{
                                    fontSize: name.length > 12 ? 'min(28px, 3.5vh)' : 'min(36px, 4.5vh)',
                                    fontWeight: 800,
                                    color: '#2d3436',
                                    fontFamily: 'var(--font-display)',
                                    wordBreak: 'break-word',
                                    lineHeight: 1.1,
                                    transition: 'font-size 0.3s ease',
                                    marginBottom: '8px',
                                    letterSpacing: '-0.5px'
                                }}>
                                    {name || 'Student Name'}
                                </div>

                                <div style={{
                                    padding: '6px 16px',
                                    borderRadius: '20px',
                                    background: `${currentColor}15`,
                                    color: currentColor,
                                    fontSize: '14px',
                                    fontWeight: 700,
                                    textTransform: 'uppercase',
                                    letterSpacing: '1px'
                                }}>
                                    {userName ? `${userName}'s Stellar Class` : "Stellar Class"}
                                </div>
                            </motion.div>

                            {/* ID Details / Barcode Aesthetic */}
                            <div style={{
                                marginTop: 'auto',
                                marginBottom: '40px',
                                width: '100%',
                                display: 'flex',
                                flexDirection: 'column',
                                alignItems: 'center',
                                gap: '15px',
                                opacity: 0.6
                            }}>
                                <div style={{
                                    display: 'flex',
                                    gap: '4px',
                                    alignItems: 'center'
                                }}>
                                    <span className="material-symbols-rounded" style={{ fontSize: '16px' }}>verified</span>
                                    <span style={{ fontSize: '12px', fontWeight: 600 }}>Official Student ID</span>
                                </div>

                                {/* Faux Barcode */}
                                <div style={{
                                    display: 'flex',
                                    gap: '6px',
                                    height: '24px',
                                    alignItems: 'center',
                                    opacity: 0.5
                                }}>
                                    {[...Array(12)].map((_, i) => (
                                        <div key={i} style={{
                                            width: i % 3 === 0 ? '4px' : '2px',
                                            height: '100%',
                                            background: '#000',
                                            borderRadius: '1px'
                                        }} />
                                    ))}
                                </div>
                            </div>
                        </div>
                    </motion.div>
                </div>

                {/* RIGHT: Editor Panel */}
                <div style={{
                    flex: 1,
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '16px',
                    maxWidth: '500px',
                    paddingTop: '10px'
                }}>
                    {/* Compact Name Input */}
                    <div>
                        <div style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '10px',
                            marginBottom: '4px'
                        }}>
                            <span className="material-symbols-rounded" style={{ fontSize: '18px', color: '#999' }}>badge</span>
                            <span style={{ fontSize: '12px', fontWeight: 700, textTransform: 'uppercase', color: '#999', letterSpacing: '1px' }}>Name</span>
                        </div>
                        <motion.input
                            whileFocus={{ scale: 1.01 }}
                            value={name}
                            onChange={handleNameChange}
                            placeholder="Enter name..."
                            maxLength={20}
                            style={{
                                width: '100%',
                                fontSize: '20px',
                                fontWeight: 700,
                                padding: '12px 16px',
                                borderRadius: '14px',
                                border: `2px solid ${name ? currentColor : '#eee'}`,
                                background: 'white',
                                outline: 'none',
                                fontFamily: 'var(--font-display)',
                                color: '#333',
                                boxShadow: name ? `0 4px 15px ${currentColor}15` : 'none',
                                transition: 'all 0.3s ease'
                            }}
                        />
                    </div>

                    {/* Compact Color Picker */}
                    <div>
                        <div style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '10px',
                            marginBottom: '4px'
                        }}>
                            <span className="material-symbols-rounded" style={{ fontSize: '18px', color: '#999' }}>palette</span>
                            <span style={{ fontSize: '12px', fontWeight: 700, textTransform: 'uppercase', color: '#999', letterSpacing: '1px' }}>Color</span>
                        </div>
                        <div style={{
                            display: 'flex',
                            gap: '8px',
                            flexWrap: 'wrap',
                            background: 'white',
                            padding: '10px',
                            borderRadius: '16px',
                            boxShadow: '0 2px 10px rgba(0,0,0,0.04)'
                        }}>
                            {colorKeys.map((key) => (
                                <motion.button
                                    key={key}
                                    whileHover={{ scale: 1.15, y: -2 }}
                                    whileTap={{ scale: 0.9 }}
                                    onClick={() => setColorKey(key)}
                                    style={{
                                        width: '32px',
                                        height: '32px',
                                        borderRadius: '50%',
                                        background: colorValues[key],
                                        border: colorKey === key ? '3px solid white' : 'none',
                                        boxShadow: colorKey === key
                                            ? `0 0 0 2px ${colorValues[key]}, 0 4px 10px ${colorValues[key]}40`
                                            : `0 2px 6px ${colorValues[key]}20`,
                                        cursor: 'pointer',
                                        transition: 'box-shadow 0.2s',
                                        flex: '0 0 auto'
                                    }}
                                />
                            ))}
                        </div>
                    </div>

                    {/* Logo Picker */}
                    <div style={{ flex: 1, minHeight: 0, display: 'flex', flexDirection: 'column' }}>
                        <label style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '8px',
                            fontSize: '14px',
                            fontWeight: 700,
                            textTransform: 'uppercase',
                            color: '#999',
                            marginBottom: '12px',
                            letterSpacing: '1.5px'
                        }}>
                            <span className="material-symbols-rounded" style={{ fontSize: '20px' }}>category</span>
                            Pick a Symbol
                        </label>

                        {/* Category Tabs */}
                        <div style={{
                            display: 'flex',
                            gap: '8px',
                            marginBottom: '12px',
                            overflowX: 'auto',
                            paddingBottom: '4px'
                        }}>
                            {logoCategories.map((cat, idx) => (
                                <motion.button
                                    key={cat.name}
                                    whileHover={{ y: -2 }}
                                    whileTap={{ scale: 0.95 }}
                                    onClick={() => setActiveCategory(idx)}
                                    style={{
                                        padding: '10px 16px',
                                        borderRadius: '12px',
                                        border: 'none',
                                        background: activeCategory === idx ? currentColor : 'white',
                                        color: activeCategory === idx ? 'white' : '#666',
                                        fontSize: '14px',
                                        fontWeight: 700,
                                        cursor: 'pointer',
                                        whiteSpace: 'nowrap',
                                        boxShadow: activeCategory === idx
                                            ? `0 4px 15px ${currentColor}40`
                                            : '0 2px 8px rgba(0,0,0,0.06)'
                                    }}
                                >
                                    {cat.name}
                                </motion.button>
                            ))}
                        </div>

                        {/* Icons Grid */}
                        <div style={{
                            flex: 1,
                            overflowY: 'auto',
                            background: 'white',
                            borderRadius: '20px',
                            padding: '16px',
                            display: 'grid',
                            gridTemplateColumns: 'repeat(auto-fill, minmax(60px, 1fr))',
                            gap: '10px',
                            alignContent: 'start',
                            boxShadow: '0 4px 20px rgba(0,0,0,0.06)'
                        }}>
                            {logoCategories[activeCategory].icons.map((icon) => (
                                <motion.button
                                    key={icon}
                                    whileHover={{ scale: 1.1, y: -4 }}
                                    whileTap={{ scale: 0.9 }}
                                    onClick={() => setLogoId(icon)}
                                    style={{
                                        width: '60px',
                                        height: '60px',
                                        borderRadius: '16px',
                                        border: logoId === icon ? `3px solid ${currentColor}` : '2px solid #eee',
                                        background: logoId === icon ? `${currentColor}15` : 'white',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        cursor: 'pointer',
                                        transition: 'all 0.2s',
                                        padding: 0,
                                        boxShadow: logoId === icon ? `0 6px 20px ${currentColor}30` : 'none'
                                    }}
                                >
                                    <span className="material-symbols-rounded material-filled" style={{
                                        fontSize: '32px',
                                        color: logoId === icon ? currentColor : '#888'
                                    }}>
                                        {icon}
                                    </span>
                                </motion.button>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        </motion.div>
    )
}

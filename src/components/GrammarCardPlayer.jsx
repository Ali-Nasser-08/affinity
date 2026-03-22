import { useState, useEffect, useCallback, useRef, useMemo } from 'react'
import { motion } from 'framer-motion'
import { colorValues, textColors, lightTints, getRandomAccentExcluding, accentColorSchemes } from '../engine/serotoninEngine'

function lightenHex(hex, amount = 0.48) {
    if (typeof hex !== 'string' || hex[0] !== '#') return hex

    const h = hex.length === 4
        ? `#${hex[1]}${hex[1]}${hex[2]}${hex[2]}${hex[3]}${hex[3]}`
        : hex

    const r = parseInt(h.slice(1, 3), 16)
    const g = parseInt(h.slice(3, 5), 16)
    const b = parseInt(h.slice(5, 7), 16)

    const mix = (c) => Math.round(c + (255 - c) * amount)
    return `rgb(${mix(r)}, ${mix(g)}, ${mix(b)})`
}

function hexToRgba(hex, alpha = 0.15) {
    if (!hex || typeof hex !== 'string' || hex[0] !== '#') return hex;
    const r = parseInt(hex.slice(1, 3), 16);
    const g = parseInt(hex.slice(3, 5), 16);
    const b = parseInt(hex.slice(5, 7), 16);
    return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

// ============================================================
// TYPEWRITER HOOK - For example text animation
// ============================================================
function useTypewriter(text, speed = 35, enabled = true, delay = 200) {
    const [displayedText, setDisplayedText] = useState('')
    const [isComplete, setIsComplete] = useState(false)

    useEffect(() => {
        if (!enabled || !text) {
            setDisplayedText(text || '')
            setIsComplete(true)
            return
        }

        if (localStorage.getItem('app_structured_mode') === 'true') {
            setDisplayedText(text || '')
            setIsComplete(true)
            return
        }

        setDisplayedText('')
        setIsComplete(false)

        const timeout = setTimeout(() => {
            let currentIndex = 0
            const interval = setInterval(() => {
                if (currentIndex <= text.length) {
                    setDisplayedText(text.slice(0, currentIndex))
                    currentIndex++
                } else {
                    setIsComplete(true)
                    clearInterval(interval)
                }
            }, speed)

            return () => clearInterval(interval)
        }, delay)

        return () => clearTimeout(timeout)
    }, [text, speed, enabled, delay])

    return { displayedText, isComplete }
}

// ============================================================
// CONTENT SEGMENT RENDERER
// Handles colorize, highlight, underline text formatting
// ============================================================
function ContentSegment({
    segment,
    accentColor,
    isExample = false,
    animatedText = null,
    underlineEnabled = true
}) {
    const colorValue = colorValues[accentColor]


    // Get the complex scheme for the current accent
    const scheme = accentColorSchemes[accentColor] || accentColorSchemes.cyan

    const chalkColor = useMemo(() => lightenHex(colorValue, 0.56), [colorValue])

    // Check if this is Arabic text (has text2/text3 format or contains Arabic characters)
    const isArabic = segment.text2 || /[\u0600-\u06FF]/.test(segment.text || '')

    // Resolve Styles based on segment flags
    let segmentStyle = {
        fontFamily: isArabic ? 'var(--font-arabic)' : 'var(--font-display)',
        direction: isArabic ? 'rtl' : 'ltr',
        whiteSpace: 'pre-wrap', // Preserve formatting (newlines, spaces)
    }

    // --- Colorize Logic ---
    if (segment.colorize || segment.colorize2 || segment.colorize3) {
        const cColor = segment.colorize3 ? scheme.colorize3
            : (segment.colorize2 ? scheme.colorize2 : scheme.colorize1);
        segmentStyle = {
            ...segmentStyle,
            color: cColor,
            fontWeight: 700
        }
    }

    // --- Highlight Logic ---
    // Highlights use a tinted background of the chosen color
    if (segment.highlight || segment.highlight2 || segment.highlight3) {
        const hColor = segment.highlight3 ? scheme.highlight3
            : (segment.highlight2 ? scheme.highlight2 : scheme.highlight1);

        // Grouping logic for connected highlights
        let borderRadius = '10px'
        let margin = '0 2px'
        let padding = '2px 10px'

        if (segment.highlightGroupPosition) {
            margin = '0' // Remove margin for connected parts
            if (segment.highlightGroupPosition === 'start') {
                borderRadius = '10px 0 0 10px'
                margin = '0 0 0 2px'
            } else if (segment.highlightGroupPosition === 'end') {
                borderRadius = '0 10px 10px 0'
                margin = '0 2px 0 0'
            } else if (segment.highlightGroupPosition === 'middle') {
                borderRadius = '0'
                margin = '0'
            }
        }

        segmentStyle = {
            ...segmentStyle,
            background: hexToRgba(hColor, 0.15),
            color: hColor,
            fontWeight: 800,
            padding: padding,
            borderRadius: borderRadius,
            display: 'inline-block',
            margin: margin
        }
    }

    // --- Badge Logic ---
    // Badges use a solid background with white text
    if (segment.badge || segment.badge2 || segment.badge3) {
        const bColor = segment.badge3 ? scheme.badge3
            : (segment.badge2 ? scheme.badge2 : scheme.badge1);

        segmentStyle = {
            ...segmentStyle,
            background: bColor,
            color: '#ffffff',
            fontWeight: 700,
            padding: '1px 8px',
            borderRadius: '12px',
            display: 'inline-block',
            margin: '0 2px',
            fontSize: '0.95em', // Slightly smaller for badges
            boxShadow: `0 2px 4px ${bColor}40`
        }

        // Translation support for badges
        if (segment.translation) {
            return (
                <div style={{
                    display: 'inline-flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    verticalAlign: 'middle',
                    margin: '28px 4px 8px 4px',
                    position: 'relative'
                }}>
                    <span style={{
                        position: 'absolute',
                        bottom: '100%',
                        left: '50%',
                        transform: 'translateX(-50%)',
                        fontSize: '0.8em',
                        color: bColor,
                        marginBottom: '4px',
                        fontFamily: 'var(--font-arabic)',
                        fontWeight: 600,
                        whiteSpace: 'nowrap',
                        pointerEvents: 'none'
                    }}>
                        {segment.translation}
                    </span>
                    <span style={segmentStyle}>
                        {segment.text}
                    </span>
                </div>
            )
        }
    }

    // --- Underline Logic ---
    if (segment.underline) {
        segmentStyle = { ...segmentStyle, fontWeight: 650 }
    }

    const shouldChalkUnderline = underlineEnabled && segment.underline

    // Handle compound Arabic segments with text, text2, text3 structure
    if (segment.text2) {
        // For compound segments, we need to apply specific logic relative to the inner span
        // Usually colorize/highlight applies to the middle part (text2)

        let innerStyle = {
            fontFamily: segmentStyle.fontFamily,
            direction: segmentStyle.direction,
        }

        // Apply formatting flags to the inner span (text2) if present on the parent object
        // NOTE: The JSON structure usually puts flags on the segment object itself.
        // If text2 is present, usually the flags apply to the middle part.

        if (segment.colorize || segment.colorize2 || segment.colorize3) {
            const cColor = segment.colorize3 ? scheme.colorize3
                : (segment.colorize2 ? scheme.colorize2 : scheme.colorize1);
            innerStyle = { ...innerStyle, color: cColor, fontWeight: 700 };
        }

        if (segment.highlight || segment.highlight2 || segment.highlight3) {
            const hColor = segment.highlight3 ? scheme.highlight3
                : (segment.highlight2 ? scheme.highlight2 : scheme.highlight1);

            // Grouping logic for connected highlights
            let borderRadius = '10px'
            let margin = '0 2px'
            let padding = '2px 10px'

            if (segment.highlightGroupPosition) {
                margin = '0' // Remove margin for connected parts
                if (segment.highlightGroupPosition === 'start') {
                    borderRadius = '10px 0 0 10px'
                    margin = '0 0 0 2px'
                } else if (segment.highlightGroupPosition === 'end') {
                    borderRadius = '0 10px 10px 0'
                    margin = '0 2px 0 0'
                } else if (segment.highlightGroupPosition === 'middle') {
                    borderRadius = '0'
                    margin = '0'
                }
            }

            innerStyle = {
                ...innerStyle,
                background: hexToRgba(hColor, 0.15),
                color: hColor,
                fontWeight: 800,
                padding: padding,
                borderRadius: borderRadius,
                margin: margin
            };
        }

        const compound = (
            <>
                {segment.text}
                <span style={innerStyle}>
                    {segment.text2}
                </span>
                {segment.text3}
            </>
        )

        if (!shouldChalkUnderline) return <span style={segmentStyle}>{compound}</span>

        // If the whole block is underlined (unlikely but possible if `underline: true` is on the object)
        return (
            <span
                className="grammar-chalk-underline-wrap chalk-on"
                style={{ ...segmentStyle, '--chalk-color': chalkColor }}
            >
                <span className="grammar-chalk-underline-text">{compound}</span>
            </span>
        )
    }

    // For examples with typewriter animation, use the animated text
    const displayText = animatedText !== null ? animatedText : segment.text

    // Helper to render text with styled check/x symbols
    const renderWithSymbols = (text, style, key = '') => {
        if (!text) return null

        // Split text by ✓ and ✗ symbols, keeping the delimiters
        const parts = String(text).split(/(✓|✗|✓:|✗:)/)

        return parts.map((part, idx) => {
            if (part === '✓' || part === '✓:') {
                return (
                    <span
                        key={`${key}-check-${idx}`}
                        style={{
                            color: 'rgba(34, 197, 94, 0.7)', // Faint green
                            fontWeight: 600,
                            marginRight: '2px'
                        }}
                    >
                        ✓{part === '✓:' ? ':' : ''}
                    </span>
                )
            }
            if (part === '✗' || part === '✗:') {
                return (
                    <span
                        key={`${key}-x-${idx}`}
                        style={{
                            color: 'rgba(239, 68, 68, 0.7)', // Faint red
                            fontWeight: 600,
                            marginRight: '2px'
                        }}
                    >
                        ✗{part === '✗:' ? ':' : ''}
                    </span>
                )
            }
            return <span key={`${key}-text-${idx}`} style={style}>{part}</span>
        })
    }

    const renderTextWithDividers = (text) => {
        if (!text) return null

        // Split by pipe to find dividers
        const parts = String(text).split('|')

        return parts.map((part, index) => {
            const isLast = index === parts.length - 1
            const key = `part-${index}`

            // Render the content part
            let content

            if (!shouldChalkUnderline) {
                // If no chalk underline, just render the text with segment styles
                // We preserve whitespace and apply special symbol styling
                content = renderWithSymbols(part, segmentStyle, key)
            } else {
                // Apply chalk underline logic to this part
                content = String(part ?? '').split(/(\s+)/).filter(p => p.length > 0).map((chunk, chunkIdx) => {
                    if (/^\s+$/.test(chunk)) {
                        return (
                            <span key={`${key}-ws-${chunkIdx}`} style={segmentStyle}>
                                {chunk}
                            </span>
                        )
                    }

                    // Check if chunk contains ✓ or ✗ symbols - render with symbol styling
                    if (/[✓✗]/.test(chunk)) {
                        return renderWithSymbols(chunk, segmentStyle, `${key}-${chunkIdx}`)
                    }

                    return (
                        <span
                            key={`${key}-w-${chunkIdx}`}
                            className="grammar-chalk-underline-wrap chalk-on"
                            style={{ ...segmentStyle, '--chalk-color': chalkColor }}
                        >
                            <span className="grammar-chalk-underline-text">{chunk}</span>
                        </span>
                    )
                })
            }

            return (
                <span key={key}>
                    {content}
                    {!isLast && (
                        <span style={{
                            display: 'inline-block',
                            width: '4px',
                            height: '50px',
                            backgroundColor: hexToRgba(scheme.colorize1 || colorValue, 0.4),
                            margin: '0 10px',
                            borderRadius: '4px',
                            verticalAlign: 'middle',
                            transform: 'translateY(-2px)'
                        }} />
                    )}
                </span>
            )
        })
    }

    return (
        <>
            {renderTextWithDividers(displayText)}
        </>
    )
}

// ============================================================
// CARD CONTENT DISPLAY
// Renders all segments with proper formatting
// ============================================================
function CardContent({ content, accentColor, cardType }) {
    // Separate English and Arabic content
    const englishContent = []
    const arabicContent = []
    let isExampleCard = cardType === 'example'

    // First pass: Find the index where Arabic content starts
    // We look for the first segment with Arabic characters, then look backward
    // to include any non-Arabic segments that are likely part of the Arabic section
    let firstArabicIndex = -1
    for (let i = 0; i < content.length; i++) {
        const segment = content[i]
        // Skip example indicators
        if (segment.text === 'Example:' || segment.text === 'مثال:') continue

        // Check if this segment has Arabic characters
        const hasArabicChars = /[\u0600-\u06FF]/.test(segment.text || '')
        if (hasArabicChars) {
            firstArabicIndex = i
            break
        }
    }

    // Now find where the Arabic section truly starts by looking backward
    // from firstArabicIndex to find segments that might be English words
    // used in the Arabic context (like "Because" or "So" preceding Arabic text)
    let arabicStartIndex = firstArabicIndex

    if (firstArabicIndex > 0) {
        // Look backward from firstArabicIndex to find duplicated English words
        // These are likely the start of the Arabic section
        for (let i = firstArabicIndex - 1; i >= 0; i--) {
            const segment = content[i]
            const text = segment.text?.trim()

            // Skip empty/whitespace segments
            if (!text || text.length === 0) continue

            // If this text appeared earlier in the content (duplicate),
            // it's likely the start of the Arabic section
            let isDuplicate = false
            for (let j = 0; j < i; j++) {
                if (content[j].text?.trim() === text) {
                    isDuplicate = true
                    break
                }
            }

            if (isDuplicate) {
                arabicStartIndex = i
            } else {
                // If we hit a non-duplicate, stop looking backward
                break
            }
        }
    }

    // Second pass: Split content based on the found index
    content.forEach((segment, index) => {
        // Check if this is an example indicator
        if (segment.text === 'Example:' || segment.text === 'مثال:') {
            isExampleCard = true
            return
        }

        // Detect highlights for grouping logic
        const isHighlighted = segment.highlight || segment.highlight2 || segment.highlight3

        // If we found an Arabic start index, use it to split
        // All segments at or after that index go to Arabic section
        if (arabicStartIndex !== -1 && index >= arabicStartIndex) {
            arabicContent.push({ ...segment, originalIndex: index, isHighlighted })
        } else {
            englishContent.push({ ...segment, originalIndex: index, isHighlighted })
        }
    })

    // Helper to process highlight groups within a content array
    const processHighlightGroups = (arr) => {
        return arr.map((item, idx, array) => {
            if (!item.isHighlighted) return item

            const prev = array[idx - 1]
            const next = array[idx + 1]

            const prevHighlighted = prev && (prev.highlight || prev.highlight2 || prev.highlight3)
            const nextHighlighted = next && (next.highlight || next.highlight2 || next.highlight3)

            let position = 'single'
            if (prevHighlighted && nextHighlighted) position = 'middle'
            else if (!prevHighlighted && nextHighlighted) position = 'start'
            else if (prevHighlighted && !nextHighlighted) position = 'end'

            // Only assign if it's not single
            if (position !== 'single') {
                return { ...item, highlightGroupPosition: position }
            }
            return item
        })
    }

    // Process groups for both languages
    const processedEnglish = processHighlightGroups(englishContent)
    const processedArabic = processHighlightGroups(arabicContent)

    // Build the full English text for typewriter
    const fullEnglishText = processedEnglish.map(s => s.text || '').join('')

    // Use typewriter for examples
    const { displayedText, isComplete } = useTypewriter(
        fullEnglishText,
        30,
        isExampleCard,
        300
    )

    const underlineEnabled = !isExampleCard || isComplete

    return (
        <div className="grammar-card-content">
            {/* English Section */}
            <div className="grammar-card-english">
                {isExampleCard ? (
                    <TypewriterContent
                        segments={processedEnglish}
                        displayedText={displayedText}
                        isComplete={isComplete}
                        accentColor={accentColor}
                        underlineEnabled={underlineEnabled}
                    />
                ) : (
                    processedEnglish.map((segment, idx) => (
                        <ContentSegment
                            key={idx}
                            segment={segment}
                            accentColor={accentColor}
                            underlineEnabled={underlineEnabled}
                        />
                    ))
                )}
            </div>

            {/* Arabic Section */}
            {arabicContent.length > 0 && (
                <motion.div
                    className="grammar-card-arabic"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: isExampleCard ? (isComplete ? 1 : 0) : 1, y: 0 }}
                    transition={{ duration: 0.4, delay: 0.1 }}
                >
                    {processedArabic.map((segment, idx) => (
                        <ContentSegment
                            key={idx}
                            segment={segment}
                            accentColor={accentColor}
                            underlineEnabled={underlineEnabled}
                        />
                    ))}
                </motion.div>
            )}
        </div>
    )
}

// ============================================================
// TYPEWRITER CONTENT - Progressive reveal with formatting
// ============================================================
function TypewriterContent({
    segments,
    displayedText,
    isComplete,
    accentColor,
    underlineEnabled
}) {
    // Calculate how much of each segment to show
    let remainingChars = displayedText.length

    return (
        <>
            {segments.map((segment, idx) => {
                const segmentText = segment.text || ''
                const segmentLength = segmentText.length

                if (remainingChars <= 0) {
                    return null
                }

                const charsToShow = Math.min(remainingChars, segmentLength)
                remainingChars -= charsToShow

                return (
                    <ContentSegment
                        key={idx}
                        segment={segment}
                        accentColor={accentColor}
                        animatedText={segmentText.slice(0, charsToShow)}
                        underlineEnabled={underlineEnabled && isComplete}
                    />
                )
            })}
            {!isComplete && (
                <motion.span
                    className="typewriter-cursor-grammar"
                    animate={{ opacity: [1, 0, 1] }}
                    transition={{ duration: 0.8, repeat: Infinity }}
                    style={{ backgroundColor: colorValues[accentColor] }}
                />
            )}
        </>
    )
}

// ============================================================
// UNIFIED BADGE
// Consistent design for all badges (Title, Type, etc.)
// ============================================================
function UnifiedBadge({ label, accentColor }) {
    const colorValue = colorValues[accentColor]
    const lightTint = lightTints[accentColor]

    return (
        <motion.div
            layout
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{
                scale: 1,
                opacity: 1,
                borderColor: colorValue,
                backgroundColor: lightTint,
                color: colorValue
            }}
            transition={{ duration: 0.3 }}
            style={{
                border: `2px solid ${colorValue}`,
                padding: '4px 12px',
                borderRadius: '12px',
                fontWeight: 700,
                fontSize: '0.9em',
                whiteSpace: 'nowrap',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: `0 2px 8px ${colorValue}20`
            }}
        >
            {label}
        </motion.div>
    )
}

// ============================================================
// PAGINATION DOTS
// Grouped by cluster with visual separation
// ============================================================
// ============================================================
// PAGINATION DOTS
// Grouped by cluster with visual separation
// ============================================================
function PaginationDots({ clusters, currentClusterIndex, currentCardIndex, accentColor, onNavigate }) {
    const colorValue = colorValues[accentColor]

    return (
        <div className="grammar-pagination-container">
            <div className="grammar-pagination-dots">
                {clusters.map((cluster, clusterIdx) => (
                    <div
                        key={cluster.clusterId}
                        className="grammar-pagination-cluster-group"
                    >
                        {cluster.cards.map((card, cardIdx) => {
                            const isActive = clusterIdx === currentClusterIndex && cardIdx === currentCardIndex
                            const isPast = clusterIdx < currentClusterIndex ||
                                (clusterIdx === currentClusterIndex && cardIdx < currentCardIndex)

                            return (
                                <motion.button
                                    key={card.id}
                                    className={`grammar-pagination-dot ${isActive ? 'active' : ''} ${isPast ? 'past' : ''}`}
                                    onClick={() => onNavigate(clusterIdx, cardIdx)}
                                    initial={false}
                                    animate={{
                                        scale: isActive ? 1.4 : 1,
                                        backgroundColor: isActive ? colorValue : (isPast ? colorValue : '#D1D5DB'),
                                        opacity: isPast ? 0.5 : 1
                                    }}
                                    whileHover={{ scale: 1.2 }}
                                    whileTap={{ scale: 0.9 }}
                                    transition={{ type: 'spring', stiffness: 400, damping: 25 }}
                                    aria-label={`Go to card ${cardIdx + 1} of cluster ${clusterIdx + 1}`}
                                />
                            )
                        })}
                    </div>
                ))}
            </div>
        </div>
    )
}

// ============================================================
// NAVIGATION BUTTONS
// ============================================================
function NavigationButtons({
    onPrevious,
    onNext,
    isPreviousDisabled,
    isNextDisabled,
    accentColor,
    isLastCard
}) {
    const colorValue = colorValues[accentColor]
    const textColor = textColors[accentColor]
    const lightTint = lightTints[accentColor]

    return (
        <div className="grammar-navigation-buttons">
            <motion.button
                className="grammar-nav-btn grammar-nav-prev"
                onClick={onPrevious}
                disabled={isPreviousDisabled}
                style={{
                    borderColor: colorValue,
                    color: isPreviousDisabled ? '#BDBDBD' : textColor,
                    backgroundColor: isPreviousDisabled ? '#F5F5F5' : lightTint,
                    opacity: isPreviousDisabled ? 0.5 : 1
                }}
                whileHover={!isPreviousDisabled ? { scale: 1.03, y: -2 } : {}}
                whileTap={!isPreviousDisabled ? { scale: 0.97 } : {}}
            >
                <span className="material-symbols-rounded">arrow_back</span>
                <span>Previous</span>
            </motion.button>

            <motion.button
                className="grammar-nav-btn grammar-nav-next"
                onClick={onNext}
                disabled={isNextDisabled}
                style={{
                    borderColor: colorValue,
                    color: 'white',
                    backgroundColor: isNextDisabled ? '#BDBDBD' : colorValue,
                    opacity: isNextDisabled ? 0.5 : 1
                }}
                whileHover={!isNextDisabled ? { scale: 1.03, y: -2 } : {}}
                whileTap={!isNextDisabled ? { scale: 0.97 } : {}}
            >
                <span>{isLastCard ? 'Complete' : 'Next'}</span>
                <span className="material-symbols-rounded">
                    {isLastCard ? 'check' : 'arrow_forward'}
                </span>
            </motion.button>
        </div>
    )
}

// ============================================================
// MAIN GRAMMAR CARD PLAYER
// ============================================================
export function GrammarCardPlayer({
    grammarData,
    accentColor = 'cyan',
    onComplete,
    onBack
}) {
    const [currentClusterIndex, setCurrentClusterIndex] = useState(0)
    const [currentCardIndex, setCurrentCardIndex] = useState(0)
    const containerRef = useRef(null)
    const hasNavigatedRef = useRef(false)

    const clusters = grammarData?.clusters || []
    const currentCluster = clusters[currentClusterIndex]
    const currentCard = currentCluster?.cards[currentCardIndex]

    // Calculate total cards and current position
    const totalCards = useMemo(() => {
        return clusters.reduce((sum, cluster) => sum + cluster.cards.length, 0)
    }, [clusters])

    const currentCardNumber = useMemo(() => {
        let count = 0
        for (let i = 0; i < currentClusterIndex; i++) {
            count += clusters[i].cards.length
        }
        return count + currentCardIndex + 1
    }, [clusters, currentClusterIndex, currentCardIndex])

    // Navigation logic
    const handleNext = useCallback(() => {
        if (currentCardIndex < currentCluster.cards.length - 1) {
            setCurrentCardIndex(prev => prev + 1)
        } else if (currentClusterIndex < clusters.length - 1) {
            setCurrentClusterIndex(prev => prev + 1)
            setCurrentCardIndex(0)
        } else {
            // Last card - trigger complete
            onComplete?.()
        }
    }, [currentCardIndex, currentClusterIndex, currentCluster, clusters, onComplete])

    const handlePrevious = useCallback(() => {
        if (currentCardIndex > 0) {
            setCurrentCardIndex(prev => prev - 1)
        } else if (currentClusterIndex > 0) {
            const prevClusterIndex = currentClusterIndex - 1
            setCurrentClusterIndex(prevClusterIndex)
            setCurrentCardIndex(clusters[prevClusterIndex].cards.length - 1)
        }
    }, [currentCardIndex, currentClusterIndex, clusters])

    const handleNavigate = useCallback((clusterIdx, cardIdx) => {
        setCurrentClusterIndex(clusterIdx)
        setCurrentCardIndex(cardIdx)
    }, [clusters, currentCardNumber])

    // Keyboard navigation
    useEffect(() => {
        const handleKeyDown = (e) => {
            if (e.key === 'ArrowRight' || e.key === ' ') {
                e.preventDefault()
                handleNext()
            } else if (e.key === 'ArrowLeft') {
                e.preventDefault()
                handlePrevious()
            } else if (e.key === 'Escape') {
                onBack?.()
            }
        }

        window.addEventListener('keydown', handleKeyDown)
        return () => window.removeEventListener('keydown', handleKeyDown)
    }, [handleNext, handlePrevious, onBack])

    const isPreviousDisabled = currentClusterIndex === 0 && currentCardIndex === 0
    const isLastCard = currentClusterIndex === clusters.length - 1 &&
        currentCardIndex === currentCluster?.cards.length - 1

    // Color transition state for smooth color changes
    const [currentAccentColor, setCurrentAccentColor] = useState(accentColor)

    // Update current accent color when navigating between cards
    useEffect(() => {
        if (!hasNavigatedRef.current) {
            hasNavigatedRef.current = true
            return
        }
        const isStructured = localStorage.getItem('app_structured_mode') === 'true'
        if (!isStructured) {
            setCurrentAccentColor((prev) => getRandomAccentExcluding(prev))
        }
    }, [currentClusterIndex, currentCardIndex])

    if (!currentCard) {
        return null
    }

    return (
        <motion.div
            className="grammar-player-container"
            ref={containerRef}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            style={{
                '--accent': colorValues[currentAccentColor],
                '--accent-soft': `${colorValues[currentAccentColor]}33`,
                '--accent-softer': `${colorValues[currentAccentColor]}1f`,
                '--accent-grid': `${colorValues[currentAccentColor]}40`,
                transition: 'all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1)'
            }}
        >
            {/* Notebook Grid Background */}
            <div className="grammar-player-background" />

            {/* Pagination Dots - Fixed Top */}
            <div style={{
                position: 'fixed',
                top: '40px',
                zIndex: 50,
                width: '100%',
                display: 'flex',
                justifyContent: 'center',
                pointerEvents: 'none'
            }}>
                <div style={{ pointerEvents: 'auto' }}>
                    <PaginationDots
                        clusters={clusters}
                        currentClusterIndex={currentClusterIndex}
                        currentCardIndex={currentCardIndex}
                        accentColor={currentAccentColor}
                        onNavigate={handleNavigate}
                    />
                </div>
            </div>

            {/* Main Card - Static with color transitions */}
            <motion.div
                className="grammar-player-card-wrapper"
                layout
                transition={{ type: 'spring', stiffness: 220, damping: 25 }}
                style={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    gap: '24px',
                    width: '100%',
                    maxWidth: currentCard.wide ? '95vw' : '900px'
                }}
            >

                <motion.div
                    className="grammar-player-card"
                    layout
                    transition={{ type: 'spring', stiffness: 280, damping: 30 }}
                    style={{
                        boxShadow: `0 20px 60px ${colorValues[currentAccentColor]}20, 0 8px 25px rgba(0,0,0,0.08)`,
                        maxWidth: currentCard.wide ? 'none' : '800px', // Explicit default to match CSS
                        width: currentCard.wide ? 'fit-content' : '100%'
                    }}
                >
                    {/* Card Header with Dual Badges */}
                    <div className="grammar-card-header">
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                            {/* Badge 1: Cluster Title */}
                            <UnifiedBadge
                                label={currentCluster.title}
                                accentColor={currentAccentColor}
                            />

                            {/* Badge 2: Type/Context */}
                            {(() => {
                                // Determine the secondary badge
                                const contentText = currentCard.content.map(s => s.text).join(' ');
                                const types = ['Affirmative', 'Negative', 'Questions', 'Short Answers', 'Time Expressions'];
                                const foundType = types.find(t => contentText.includes(t));

                                if (foundType) {
                                    return (
                                        <UnifiedBadge
                                            label={foundType}
                                            accentColor={currentAccentColor}
                                        />
                                    )
                                }

                                if (currentCard.type === 'example') {
                                    return (
                                        <UnifiedBadge
                                            label="Example"
                                            accentColor={currentAccentColor}
                                        />
                                    )
                                }

                                if (currentCard.type === 'structure') {
                                    return (
                                        <UnifiedBadge
                                            label="Structure"
                                            accentColor={currentAccentColor}
                                        />
                                    )
                                }

                                return null
                            })()}
                        </div>


                        <div
                            className="grammar-card-counter"
                            style={{
                                color: textColors[currentAccentColor],
                                transition: 'color 0.3s cubic-bezier(0.34, 1.56, 0.64, 1)'
                            }}
                        >
                            {currentCardNumber} / {totalCards}
                        </div>
                    </div>

                    {/* Card Body with content transition */}
                    <div className="grammar-card-body">
                        <motion.div
                            key={`${currentClusterIndex}-${currentCardIndex}`}
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ duration: 0.2 }}
                        >
                            <CardContent
                                content={currentCard.content.filter(s => {
                                    // Remove the keyword text that became a badge
                                    // Use exact match to avoid hiding "Information Questions" or "Tag Questions"
                                    const isKeyword = ['Affirmative', 'Negative', 'Questions', 'Short Answers', 'Time Expressions'].some(k => s.text.trim() === k);

                                    // Remove Arabic translation lines ONLY if this is a structure card
                                    // (identified by type="structure" or containing structural elements)
                                    const isTranslation = s.translation && s.translation === s.text; // Heuristic: pure translation lines often have text===translation in previous edits, or we check if it's purely Arabic

                                    // Better heuristic: if the card is a structure types, remove standalone translation strings (usually the last item)
                                    // We can check if the segment text contains Arabic characters and matches the translation field of a previous badge, 
                                    // BUT the user request is specific: "Remove the arabic translations from all of the structures"

                                    const containsArabic = /[\u0600-\u06FF]/.test(s.text);

                                    if (currentCard.type === 'structure' && containsArabic) return false;

                                    return !isKeyword;
                                })}
                                accentColor={currentAccentColor}
                                cardType={currentCard.type}
                            />
                        </motion.div>
                    </div>
                </motion.div>


            </motion.div>

            {/* Navigation Buttons - Fixed Bottom */}
            <div style={{
                position: 'fixed',
                bottom: '40px',
                zIndex: 50,
                width: '100%',
                display: 'flex',
                justifyContent: 'center',
                pointerEvents: 'none' // Let clicks pass through container
            }}>
                <div style={{ pointerEvents: 'auto' }}>
                    <NavigationButtons
                        onPrevious={handlePrevious}
                        onNext={handleNext}
                        isPreviousDisabled={isPreviousDisabled}
                        isNextDisabled={false}
                        isLastCard={isLastCard}
                        accentColor={currentAccentColor}
                    />
                </div>
            </div>

            {/* Close Button */}
            <motion.button
                className="grammar-close-btn"
                onClick={onBack}
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                style={{
                    color: textColors[currentAccentColor],
                    backgroundColor: lightTints[currentAccentColor],
                    borderColor: colorValues[currentAccentColor],
                    transition: 'all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1)'
                }}
            >
                <span className="material-symbols-rounded">close</span>
            </motion.button>
        </motion.div >
    )
}

export default GrammarCardPlayer

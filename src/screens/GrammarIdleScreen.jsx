import React, { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { colorValues, accentColorSchemes, getRandomAccentExcluding } from '../engine/serotoninEngine'
import grammarData from '../data/idle/idlegrammar.json'

function parseSentence(sentenceStr) {
    const segments = [];
    const regex = /\/g\[(.*?)\](.*?)\/g/g;
    let lastIndex = 0;
    let match;

    while ((match = regex.exec(sentenceStr)) !== null) {
        if (match.index > lastIndex) {
            segments.push({ text: sentenceStr.substring(lastIndex, match.index) });
        }
        segments.push({ name: match[1], text: match[2] });
        lastIndex = regex.lastIndex;
    }

    if (lastIndex < sentenceStr.length) {
        segments.push({ text: sentenceStr.substring(lastIndex) });
    }

    return { segments };
}

const parsedSentences = grammarData.sentences.map(parseSentence);

function shuffleIndices(length) {
    const arr = Array.from({ length }, (_, i) => i);
    for (let i = arr.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    return arr;
}

function hexToRgba(hex, alpha = 0.15) {
    if (!hex || typeof hex !== 'string' || hex[0] !== '#') return hex;
    const r = parseInt(hex.slice(1, 3), 16);
    const g = parseInt(hex.slice(3, 5), 16);
    const b = parseInt(hex.slice(5, 7), 16);
    return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

export function GrammarIdleScreen({ onBack, color, onAccentChange }) {
    const [playlist, setPlaylist] = useState(() => shuffleIndices(parsedSentences.length));
    const [playlistIndex, setPlaylistIndex] = useState(0);

    // We will manage the sub-states inside the component
    const currentSentence = parsedSentences[playlist[playlistIndex]];
    const fullText = currentSentence.segments.map(s => s.text).join('');

    const [displayedLength, setDisplayedLength] = useState(0);
    const [phase, setPhase] = useState('typing'); // typing, highlighting, erasing, waiting
    const [activeStructureIndex, setActiveStructureIndex] = useState(-1);
    const [isMouseIdle, setIsMouseIdle] = useState(false);

    useEffect(() => {
        let mouseTimeout;
        const resetMouseIdle = () => {
            setIsMouseIdle(false);
            clearTimeout(mouseTimeout);
            mouseTimeout = setTimeout(() => setIsMouseIdle(true), 3000);
        };

        window.addEventListener('mousemove', resetMouseIdle);
        resetMouseIdle(); // Initialize timeout

        return () => {
            window.removeEventListener('mousemove', resetMouseIdle);
            clearTimeout(mouseTimeout);
        };
    }, []);

    useEffect(() => {
        // Reset when sentence changes
        setDisplayedLength(0);
        setPhase('typing');
        setActiveStructureIndex(-1);
    }, [playlistIndex, playlist]);

    useEffect(() => {
        let timeout;
        if (phase === 'typing') {
            if (displayedLength < fullText.length) {
                timeout = setTimeout(() => {
                    setDisplayedLength(prev => prev + 1);
                }, Math.floor(Math.random() * 20) + 15);
            } else {
                timeout = setTimeout(() => {
                    setPhase('highlighting');
                    setActiveStructureIndex(0);
                }, 2000); // 2s delay so user can read sentence
            }
        } else if (phase === 'highlighting') {
            const structuresCount = currentSentence.segments.filter(s => s.name).length;

            if (activeStructureIndex < structuresCount - 1) {
                // Reveal next badge
                timeout = setTimeout(() => {
                    setActiveStructureIndex(prev => prev + 1);
                }, 3000); // 3s between badges so it's not rushed
            } else {
                timeout = setTimeout(() => {
                    setPhase('erasing');
                }, 4000); // Wait 4s before erasing
            }
        } else if (phase === 'erasing') {
            if (displayedLength > 0) {
                timeout = setTimeout(() => {
                    setDisplayedLength(prev => prev - 1);
                }, 25);
            } else {
                setPhase('waiting');
            }
        } else if (phase === 'waiting') {
            timeout = setTimeout(() => {
                const nextColor = getRandomAccentExcluding(color);
                if (onAccentChange) onAccentChange(nextColor);

                setPlaylistIndex(prev => {
                    if (prev + 1 >= playlist.length) {
                        setPlaylist(shuffleIndices(parsedSentences.length));
                        return 0;
                    }
                    return prev + 1;
                });
            }, 0);
        }

        return () => clearTimeout(timeout);
    }, [phase, displayedLength, fullText.length, activeStructureIndex, currentSentence, color, onAccentChange, playlist]);

    const scheme = accentColorSchemes[color] || accentColorSchemes.cyan;
    const getStructureColor = (index) => {
        // Enforce exact color matching between highlight and badge per user request
        if (index === 0) return { badge: scheme.badge1, highlight: scheme.badge1 };
        if (index === 1) return { badge: scheme.badge3, highlight: scheme.badge3 };
        return { badge: scheme.badge2, highlight: scheme.badge2 };
    };

    const renderSegments = () => {
        let currentChars = 0;
        let structureCount = 0;
        const renderedTextElements = [];
        const renderedBadges = [];

        currentSentence.segments.forEach((seg, i) => {
            const segText = seg.text;
            const segLength = segText.length;

            let isStructure = !!seg.name;
            let currentStructureIdx = -1;

            if (isStructure) {
                currentStructureIdx = structureCount;
                structureCount++;
            }

            const isHighlighted = isStructure && (phase === 'highlighting' || phase === 'erasing') && activeStructureIndex >= currentStructureIdx;

            // To prevent UI jumping and extra spaces, we apply font-weight structurally immediately without massive paddings.
            // We use a linear-gradient trick that animates background-position to swipe left-to-right.
            let style = {};
            if (isStructure) {
                const colors = getStructureColor(currentStructureIdx);

                let highlightPercentage = 0;
                if (isHighlighted) {
                    if (phase === 'erasing') {
                        const visibleCharsInSeg = Math.max(0, Math.min(segLength, displayedLength - currentChars));
                        highlightPercentage = (visibleCharsInSeg / segLength) * 100;
                    } else {
                        highlightPercentage = 100;
                    }
                }

                style = {
                    display: 'inline',
                    fontWeight: 'inherit',
                    textShadow: isHighlighted ? '0.5px 0 0 currentColor, -0.5px 0 0 currentColor' : 'none',
                    borderRadius: '8px',
                    padding: '2px 4px', // Tighter padding
                    margin: '0',
                    transition: phase === 'erasing' ? 'none' : 'background-size 1.2s cubic-bezier(0.25, 1, 0.5, 1), color 1.2s ease, text-shadow 1.2s ease',
                    backgroundImage: `linear-gradient(to right, ${hexToRgba(colors.highlight, 0.2)}, ${hexToRgba(colors.highlight, 0.2)})`,
                    backgroundRepeat: 'no-repeat',
                    backgroundSize: `${highlightPercentage}% 100%`,
                    color: isHighlighted ? colors.highlight : 'inherit'
                };
            } else {
                style = {
                    display: 'inline',
                    color: 'inherit',
                    fontWeight: 'inherit',
                    transition: phase === 'erasing' ? 'none' : 'color 0.6s ease',
                    backgroundImage: 'none',
                    backgroundSize: '0% 100%',
                    textShadow: 'none'
                };
            }

            // To prevent absolutely any layout shifts or word jumping, we render the entire string structure statically.
            // But instead of breaking words by splitting strings, we establish a robust hidden-span skeleton.
            // This natively reserves 100% of the exact bounding box and calculates line breaks perfectly before we even start typing.
            const chars = segText.split('').map((char, charIdx) => {
                const globalIdx = currentChars + charIdx;
                const visible = globalIdx < displayedLength;

                // The caret sits precisely BEFORE the current character if it matches displayedLength
                const isCaretHere = globalIdx === displayedLength;

                return (
                    <span key={`char-${playlistIndex}-${globalIdx}`} style={{ position: 'relative', display: 'inline', whiteSpace: 'pre-wrap' }}>
                        {isCaretHere && phase !== 'waiting' && phase !== 'erasing' && (
                            <span style={{
                                position: 'absolute',
                                left: 0,
                                bottom: -2,
                                width: 0,
                                height: '0.9em',
                                display: 'inline-block',
                                zIndex: 10
                            }}>
                                <motion.span
                                    animate={{ opacity: [1, 0, 1] }}
                                    transition={{ duration: 0.8, repeat: Infinity }}
                                    style={{
                                        position: 'absolute',
                                        left: 0,
                                        bottom: 0,
                                        width: '3px',
                                        height: '100%',
                                        backgroundColor: colorValues[color],
                                        borderRadius: '2px',
                                        transition: 'background-color 0.7s ease',
                                        pointerEvents: 'none'
                                    }}
                                />
                            </span>
                        )}
                        <span style={{ visibility: visible ? 'visible' : 'hidden' }}>
                            {char}
                        </span>
                    </span>
                );
            });

            renderedTextElements.push(
                <span key={`seg-${playlistIndex}-${i}`} style={{ ...style, position: 'relative' }}>
                    {chars}
                </span>
            );

            currentChars += segLength;

            if (isHighlighted && phase !== 'erasing') {
                const colors = getStructureColor(currentStructureIdx);
                renderedBadges.push(
                    <motion.div
                        layout
                        key={`badge-${playlistIndex}-${currentStructureIdx}`}
                        initial={{ opacity: 0, y: 15, scale: 0.9 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 15, scale: 0.9 }}
                        transition={{ duration: 0.8, ease: "easeInOut" }}
                        style={{
                            background: colors.badge,
                            color: '#ffffff',
                            fontWeight: 700,
                            padding: '10px 28px',
                            borderRadius: '28px',
                            fontSize: '26px',
                            boxShadow: `0 8px 24px ${colors.badge}40`,
                            margin: '0 12px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            whiteSpace: 'nowrap'
                        }}
                    >
                        {seg.name}
                    </motion.div>
                );
            }
        });

        return { text: renderedTextElements, badges: renderedBadges };
    };

    const { text, badges } = renderSegments();

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
                        top: '5%', left: '5%', width: '600px', height: '600px',
                        backgroundColor: colorValues[color],
                        opacity: 0.20
                    }}
                    animate={{ backgroundColor: colorValues[color] }}
                    transition={{ duration: 0.7, ease: "easeInOut" }}
                />
                <motion.div
                    className="idle-blob"
                    style={{
                        bottom: '5%', right: '5%', width: '500px', height: '500px',
                        backgroundColor: colorValues[color],
                        opacity: 0.20
                    }}
                    animate={{ backgroundColor: colorValues[color] }}
                    transition={{ duration: 0.7, delay: 0.1, ease: "easeInOut" }}
                />
            </div>

            <AnimatePresence>
                {!isMouseIdle && (
                    <motion.button
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.3 }}
                        onClick={onBack}
                        style={{
                            position: 'absolute',
                            top: '40px',
                            left: '40px',
                            width: '56px',
                            height: '56px',
                            borderRadius: '50%',
                            background: hexToRgba(colorValues[color], 0.1),
                            color: colorValues[color],
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            border: `2px solid ${hexToRgba(colorValues[color], 0.2)}`,
                            cursor: 'pointer',
                            zIndex: 50,
                        }}
                    >
                        <span className="material-symbols-rounded" style={{ fontSize: '32px' }}>close</span>
                    </motion.button>
                )}
            </AnimatePresence>

            <div className="flex flex-col items-center justify-center w-full h-full relative z-10 p-12">
                <div
                    className="flex flex-wrap justify-center items-center text-center font-display leading-tight"
                    style={{
                        fontSize: '64px',
                        maxWidth: '85%',
                        minHeight: '280px',
                        color: 'var(--text)',
                        position: 'relative' // Parent context for caret
                    }}
                >
                    <div style={{ display: 'inline', position: 'relative' }}>
                        {text}

                        {/* Final Caret for End of Sentence (Fallback for when typing is completely done) */}
                        {phase !== 'waiting' && phase !== 'erasing' && displayedLength >= fullText.length && (
                            <span style={{ position: 'relative', display: 'inline-block', width: 0 }}>
                                <motion.span
                                    animate={{ opacity: [1, 0, 1] }}
                                    transition={{ duration: 0.8, repeat: Infinity }}
                                    style={{
                                        position: 'absolute',
                                        left: 0,
                                        bottom: -2,
                                        width: '3px',
                                        height: '0.9em',
                                        backgroundColor: colorValues[color],
                                        borderRadius: '2px',
                                        transition: 'background-color 0.7s ease',
                                        pointerEvents: 'none'
                                    }}
                                />
                            </span>
                        )}
                    </div>
                </div>

                {/* Badges container */}
                <motion.div
                    layout
                    className="flex flex-row justify-center items-center mt-12 w-full"
                    style={{ minHeight: '80px' }}
                >
                    <AnimatePresence mode="popLayout">
                        {badges}
                    </AnimatePresence>
                </motion.div>
            </div>
        </motion.div>
    );
}

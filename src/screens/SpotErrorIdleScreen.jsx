import React, { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { colorValues, accentColors, getRandomAccentExcluding } from '../engine/serotoninEngine'
import errorData from '../data/idle/idleerrors.json'

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

// Get a safe accent color that is never red or green
const safeAccents = accentColors.filter(c => c !== 'red' && c !== 'lime' && c !== 'teal');

function getRandomSafeAccent(current) {
    const others = safeAccents.filter(c => c !== current);
    return others[Math.floor(Math.random() * others.length)];
}

const ERROR_RED = colorValues.red;
const CORRECT_GREEN = colorValues.lime;

/*
 * Phases:
 * 1. 'typing'        – type out the full sentence with the wrong word
 * 2. 'showError'     – highlight the wrong part red, show reason badge
 * 3. 'caretMoving'   – animate caret to the wrong word position
 * 4. 'deleting'      – erase the wrong word char by char
 * 5. 'inserting'     – type the correct word char by char (green)
 * 6. 'stew'          – let it sit for 5 s
 * 7. 'erasing'       – erase the full sentence
 * 8. 'waiting'       – move to next
 */

export function SpotErrorIdleScreen({ onBack, color, onAccentChange }) {
    const [playlist, setPlaylist] = useState(() => shuffleIndices(errorData.errors.length));
    const [playlistIndex, setPlaylistIndex] = useState(0);

    const entry = errorData.errors[playlist[playlistIndex]];
    const fullSentence = entry.sentence;
    const wrongWord = entry.wrong;
    const correctWord = entry.correct;
    const reason = entry.reason;

    // Find the index of the wrong word in the sentence
    const wrongStart = fullSentence.indexOf(wrongWord);
    const wrongEnd = wrongStart + wrongWord.length;

    const [displayedLength, setDisplayedLength] = useState(0);
    const [phase, setPhase] = useState('typing');
    const [deleteProgress, setDeleteProgress] = useState(0); // chars deleted from wrong word
    const [insertProgress, setInsertProgress] = useState(0); // chars inserted of correct word
    const [isMouseIdle, setIsMouseIdle] = useState(false);
    const [caretPos, setCaretPos] = useState(null); // 'end' or index

    useEffect(() => {
        let mouseTimeout;
        const resetMouseIdle = () => {
            setIsMouseIdle(false);
            clearTimeout(mouseTimeout);
            mouseTimeout = setTimeout(() => setIsMouseIdle(true), 3000);
        };

        window.addEventListener('mousemove', resetMouseIdle);
        resetMouseIdle();

        return () => {
            window.removeEventListener('mousemove', resetMouseIdle);
            clearTimeout(mouseTimeout);
        };
    }, []);

    useEffect(() => {
        setDisplayedLength(0);
        setPhase('typing');
        setDeleteProgress(0);
        setInsertProgress(0);
        setCaretPos(null);
    }, [playlistIndex, playlist]);

    useEffect(() => {
        let timeout;

        if (phase === 'typing') {
            if (displayedLength < fullSentence.length) {
                timeout = setTimeout(() => {
                    setDisplayedLength(prev => prev + 1);
                }, Math.floor(Math.random() * 20) + 15);
            } else {
                // Done typing, wait then show error
                timeout = setTimeout(() => {
                    setPhase('showError');
                }, 1500);
            }
        } else if (phase === 'showError') {
            // Show the error highlighted for a moment, then move caret there
            timeout = setTimeout(() => {
                setPhase('caretMoving');
            }, 2000);
        } else if (phase === 'caretMoving') {
            // Animate caret position to wrong word end — just a short delay
            timeout = setTimeout(() => {
                setPhase('deleting');
            }, 800);
        } else if (phase === 'deleting') {
            if (deleteProgress < wrongWord.length) {
                timeout = setTimeout(() => {
                    setDeleteProgress(prev => prev + 1);
                }, 60);
            } else {
                timeout = setTimeout(() => {
                    setPhase('inserting');
                }, 300);
            }
        } else if (phase === 'inserting') {
            if (insertProgress < correctWord.length) {
                timeout = setTimeout(() => {
                    setInsertProgress(prev => prev + 1);
                }, 60);
            } else {
                timeout = setTimeout(() => {
                    setPhase('stew');
                }, 500);
            }
        } else if (phase === 'stew') {
            timeout = setTimeout(() => {
                setPhase('erasing');
            }, 5000);
        } else if (phase === 'erasing') {
            // We erase the entire constructed sentence
            const constructedLength = fullSentence.length - wrongWord.length + correctWord.length;
            if (displayedLength > 0) {
                timeout = setTimeout(() => {
                    setDisplayedLength(prev => prev - 1);
                }, 20);
            } else {
                setPhase('waiting');
            }
        } else if (phase === 'waiting') {
            timeout = setTimeout(() => {
                const nextColor = getRandomSafeAccent(color);
                if (onAccentChange) onAccentChange(nextColor);

                setPlaylistIndex(prev => {
                    if (prev + 1 >= playlist.length) {
                        setPlaylist(shuffleIndices(errorData.errors.length));
                        return 0;
                    }
                    return prev + 1;
                });
            }, 0);
        }

        return () => clearTimeout(timeout);
    }, [phase, displayedLength, deleteProgress, insertProgress, fullSentence, wrongWord, correctWord, color, onAccentChange, playlist]);

    // Build the rendered characters
    const renderSentence = () => {
        const elements = [];
        const accentColor = colorValues[color];

        // During erasing phase, we work with the corrected sentence
        const isPostCorrection = phase === 'inserting' || phase === 'stew' || phase === 'erasing';
        const isDeletingPhase = phase === 'deleting';
        const isShowingError = phase === 'showError' || phase === 'caretMoving' || phase === 'deleting';

        // Build the character array depending on phase
        let chars = [];

        if (!isPostCorrection && !isDeletingPhase) {
            // Before correction: show original sentence
            for (let i = 0; i < fullSentence.length; i++) {
                const isWrongChar = i >= wrongStart && i < wrongEnd;
                chars.push({
                    char: fullSentence[i],
                    type: isWrongChar && isShowingError ? 'wrong' : 'normal',
                    globalIdx: i
                });
            }
        } else {
            // During/after correction: build modified sentence
            // Part before wrong word
            for (let i = 0; i < wrongStart; i++) {
                chars.push({ char: fullSentence[i], type: 'normal', globalIdx: i });
            }

            // The wrong word (partially deleted)
            if (isDeletingPhase) {
                const remainingWrongChars = wrongWord.length - deleteProgress;
                for (let i = 0; i < remainingWrongChars; i++) {
                    chars.push({
                        char: wrongWord[i],
                        type: 'wrong',
                        globalIdx: wrongStart + i
                    });
                }
            }

            // The correct word (partially or fully inserted)
            if (isPostCorrection || isDeletingPhase) {
                const charsToShow = isDeletingPhase ? 0 : insertProgress;
                for (let i = 0; i < charsToShow; i++) {
                    chars.push({
                        char: correctWord[i],
                        type: 'correct',
                        globalIdx: wrongStart + i + 1000 // offset to make unique
                    });
                }
            }

            // Part after wrong word
            for (let i = wrongEnd; i < fullSentence.length; i++) {
                chars.push({ char: fullSentence[i], type: 'normal', globalIdx: i + 2000 });
            }
        }

        // During erasing, we need to adjust displayedLength for the modified sentence
        let effectiveDisplayedLength = displayedLength;
        if (phase === 'erasing') {
            // displayedLength counts down from full constructed length
            effectiveDisplayedLength = displayedLength;
        } else if (!isPostCorrection && !isDeletingPhase) {
            effectiveDisplayedLength = displayedLength;
        } else {
            // All chars visible during correction phases
            effectiveDisplayedLength = chars.length;
        }

        // Figure out where caret should be
        let caretGlobalIdx = -1;
        if (phase === 'typing') {
            caretGlobalIdx = displayedLength;
        } else if (phase === 'showError') {
            caretGlobalIdx = fullSentence.length; // end of sentence
        } else if (phase === 'caretMoving' || phase === 'deleting') {
            // Caret is at the end of remaining wrong chars
            if (isDeletingPhase) {
                const remainingWrong = wrongWord.length - deleteProgress;
                caretGlobalIdx = wrongStart + remainingWrong;
            } else {
                caretGlobalIdx = wrongEnd; // at end of wrong word
            }
        } else if (phase === 'inserting') {
            // Caret after inserted chars
            caretGlobalIdx = wrongStart + insertProgress;
        }

        // Build skeleton: full sentence length for stable layout
        // We render all chars but hide/show based on phase
        const skeletonChars = [];
        for (let i = 0; i < fullSentence.length; i++) {
            skeletonChars.push(fullSentence[i]);
        }

        chars.forEach((c, idx) => {
            const visible = idx < effectiveDisplayedLength;
            const isCaretHere = (phase === 'typing' && c.globalIdx === displayedLength) ||
                (phase === 'caretMoving' && idx === chars.findIndex(ch => ch.type === 'wrong' && ch.globalIdx === wrongEnd - 1) + 1) ||
                (phase === 'deleting' && idx === (wrongStart + wrongWord.length - deleteProgress)) ||
                (phase === 'inserting' && c.globalIdx === wrongStart + insertProgress + 1000);

            let charColor = 'inherit';
            if (c.type === 'wrong') {
                charColor = ERROR_RED;
            } else if (c.type === 'correct') {
                charColor = CORRECT_GREEN;
            }

            let charStyle = {
                position: 'relative',
                display: 'inline',
                whiteSpace: 'pre-wrap',
            };

            const isCorrectChar = c.type === 'correct';
            const isWrongShowingError = c.type === 'wrong' && (phase === 'showError' || phase === 'caretMoving');

            elements.push(
                <span key={`char-${playlistIndex}-${idx}-${c.globalIdx}`} style={charStyle}>
                    {isCaretHere && phase !== 'waiting' && phase !== 'erasing' && phase !== 'stew' && (
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
                                    backgroundColor: accentColor,
                                    borderRadius: '2px',
                                    transition: 'background-color 0.7s ease',
                                    pointerEvents: 'none'
                                }}
                            />
                        </span>
                    )}
                    <span style={{
                        visibility: visible ? 'visible' : 'hidden',
                        color: visible ? charColor : 'inherit',
                        transition: c.type !== 'normal' ? 'color 0.3s ease, background-color 0.3s ease' : 'none',
                        textDecoration: isWrongShowingError ? 'underline' : 'none',
                        textDecorationStyle: isWrongShowingError ? 'wavy' : 'solid',
                        textDecorationColor: isWrongShowingError ? hexToRgba(ERROR_RED, 0.8) : 'inherit',
                        textDecorationThickness: isWrongShowingError ? '4px' : 'auto',
                        textUnderlineOffset: isWrongShowingError ? '8px' : 'auto',
                        fontWeight: isCorrectChar ? '600' : 'inherit',
                        backgroundColor: isCorrectChar && visible ? hexToRgba(CORRECT_GREEN, 0.2) : 'transparent',
                        textShadow: isCorrectChar && visible ? '0.5px 0 0 currentColor, -0.5px 0 0 currentColor' : 'none'
                    }}>
                        {c.char}
                    </span>
                </span>
            );
        });

        return elements;
    };

    // The reason badge
    const showReason = phase === 'showError' || phase === 'caretMoving' || phase === 'deleting' || phase === 'inserting' || phase === 'stew';
    const accentColor = colorValues[color];

    // Determine what the end-of-sentence caret position should look like
    const showEndCaret = phase === 'typing' && displayedLength >= fullSentence.length;

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
                        backgroundColor: accentColor,
                        opacity: 0.20
                    }}
                    animate={{ backgroundColor: accentColor }}
                    transition={{ duration: 0.7, ease: "easeInOut" }}
                />
                <motion.div
                    className="idle-blob"
                    style={{
                        bottom: '5%', right: '5%', width: '500px', height: '500px',
                        backgroundColor: accentColor,
                        opacity: 0.20
                    }}
                    animate={{ backgroundColor: accentColor }}
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
                            background: hexToRgba(accentColor, 0.1),
                            color: accentColor,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            border: `2px solid ${hexToRgba(accentColor, 0.2)}`,
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
                        position: 'relative'
                    }}
                >
                    <div style={{ display: 'inline', position: 'relative' }}>
                        {renderSentence()}

                        {/* End caret when typing is complete */}
                        {showEndCaret && (
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
                                        backgroundColor: accentColor,
                                        borderRadius: '2px',
                                        transition: 'background-color 0.7s ease',
                                        pointerEvents: 'none'
                                    }}
                                />
                            </span>
                        )}
                    </div>
                </div>

                {/* Reason badge */}
                <motion.div
                    layout
                    className="flex flex-row justify-center items-center mt-12 w-full"
                    style={{ minHeight: '80px' }}
                >
                    <AnimatePresence mode="popLayout">
                        {showReason && (
                            <motion.div
                                layout
                                key={`reason-${playlistIndex}`}
                                initial={{ opacity: 0, y: 15, scale: 0.9 }}
                                animate={{ opacity: 1, y: 0, scale: 1 }}
                                exit={{ opacity: 0, y: 15, scale: 0.9 }}
                                transition={{ duration: 0.8, ease: "easeInOut" }}
                                style={{
                                    background: accentColor,
                                    color: '#ffffff',
                                    fontWeight: 700,
                                    padding: '10px 28px',
                                    borderRadius: '28px',
                                    fontSize: '26px',
                                    boxShadow: `0 8px 24px ${hexToRgba(accentColor, 0.4)}`,
                                    margin: '0 12px',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    whiteSpace: 'nowrap'
                                }}
                            >
                                {reason}
                            </motion.div>
                        )}
                    </AnimatePresence>
                </motion.div>
            </div>
        </motion.div>
    );
}

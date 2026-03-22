import { useState, useEffect, useCallback } from 'react'
import { AnimatePresence, MotionGlobalConfig } from 'framer-motion'
import { MobileLandingScreen } from './screens/MobileLandingScreen'
import { colorValues, bgTints, darkBgTints, getRandomAccentExcluding } from './engine/serotoninEngine'
import { supabase } from './utils/supabaseClient'
import { WelcomeModal } from './components/WelcomeModal'
import { LoginScreen } from './screens/LoginScreen'
import { CloudSyncScreen } from './screens/CloudSyncScreen'
import { MainScreen } from './screens/MainScreen'
import { SettingsScreen } from './screens/SettingsScreen'
import { StudentsScreen } from './screens/StudentsScreen'
import { MainMenu } from './screens/MainMenu'
import { InfoScreen } from './screens/InfoScreen'
import { IdleMenu } from './screens/IdleMenu'
import { PlaceholderIdle } from './screens/IdleScreens'
import { ReportsScreen } from './screens/ReportsScreen'
import { VocabCarouselIdleScreen } from './screens/VocabCarouselIdleScreen'
import { GrammarIdleScreen } from './screens/GrammarIdleScreen'
import { IdiomsIdleScreen } from './screens/IdiomsIdleScreen'
import { SpotErrorIdleScreen } from './screens/SpotErrorIdleScreen'
import { UnitSelect, QuestionTypeSelect, QuestionDisplay } from './screens/QuestionScreens'
import { GrammarUnitLanding, Unit8GrammarMenu, Unit8GrammarExplain, Unit8GrammarExamples, Unit8GrammarQuestions } from './screens/GrammarScreen'
import { VocabUnitsScreen } from './screens/VocabScreen'
import { FollowAlongCursor } from './components/FollowAlongCursor'
import { ReviseMenu } from './screens/ReviseMenu'
import { QuestionPlayer } from './components/QuestionPlayer'
import { LessonCreator } from './screens/LessonCreator'
import { LoadingScreen } from './screens/LoadingScreen'
import { UnifiedPlayer } from './components/UnifiedPlayer'
import { BreathingMenu, BreathingCountdown, ResonantBreathingScreen, PsychologicalSighScreen, BoxBreathingScreen } from './screens/BreathingScreens'
import { CanvasScreen } from './screens/CanvasScreen'
import { SerotoninScreen } from './screens/SerotoninScreen'

import './index.css'

export default function App() {
    // ── Auth state ───────────────────────────────────────────────────────────
    const [authUser, setAuthUser] = useState(null)
    const [authLoading, setAuthLoading] = useState(true)

    useEffect(() => {
        // Check for existing session on mount
        supabase.auth.getSession().then(({ data: { session } }) => {
            setAuthUser(session?.user ?? null)
            setAuthLoading(false)
        })

        // Listen for auth state changes (login / logout)
        const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
            setAuthUser(session?.user ?? null)
        })

        return () => subscription.unsubscribe()
    }, [])

    const handleSignOut = async () => {
        await supabase.auth.signOut()
        setAuthUser(null)
    }

    // ── App screen state ─────────────────────────────────────────────────────
    const [screen, setScreen] = useState('start')
    const [selectedUnit, setSelectedUnit] = useState(null)
    const [selectedGrammarUnit, setSelectedGrammarUnit] = useState(null)
    const [selectedVocabUnit, setSelectedVocabUnit] = useState(null)
    const [selectedQuestionType, setSelectedQuestionType] = useState(null)
    const [questions, setQuestions] = useState([])
    const [hasScore, setHasScore] = useState(true)
    const [reviseSession, setReviseSession] = useState(null)
    const [lessonData, setLessonData] = useState(null)
    const [brewError, setBrewError] = useState(null)
    const [staticColor, setStaticColor] = useState('cyan')
    const [globalAccent, setGlobalAccent] = useState('cyan')
    const [pendingBreathingScreen, setPendingBreathingScreen] = useState(null)
    const [isDarkMode, setIsDarkMode] = useState(false)
    const [selectedBook, setSelectedBook] = useState(() => localStorage.getItem('app_selected_book') || 'Mega Goal 1')
    const [cursorEnabled, setCursorEnabled] = useState(() => localStorage.getItem('app_cursor_enabled') === 'true')
    const [cursorColor, setCursorColor] = useState(() => localStorage.getItem('app_cursor_color') || '#FF0088')
    const [cursorSize, setCursorSize] = useState(() => localStorage.getItem('app_cursor_size') || 'medium')

    const [structuredMode, setStructuredMode] = useState(() => localStorage.getItem('app_structured_mode') === 'true')
    const [structuredColor, setStructuredColor] = useState(() => localStorage.getItem('app_structured_color') || 'cyan')
    const [colorBlindMode, setColorBlindMode] = useState(() => localStorage.getItem('app_color_blind_mode') || 'none')
    const [dyslexiaMode, setDyslexiaMode] = useState(() => localStorage.getItem('app_dyslexia_mode') || 'none')

    // Persist selected book
    useEffect(() => {
        localStorage.setItem('app_selected_book', selectedBook)
    }, [selectedBook])

    useEffect(() => {
        localStorage.setItem('app_cursor_enabled', cursorEnabled)
    }, [cursorEnabled])

    useEffect(() => {
        localStorage.setItem('app_cursor_color', cursorColor)
    }, [cursorColor])

    useEffect(() => {
        localStorage.setItem('app_cursor_size', cursorSize)
    }, [cursorSize])

    useEffect(() => {
        localStorage.setItem('app_structured_mode', structuredMode)
        MotionGlobalConfig.skipAnimations = structuredMode
    }, [structuredMode])

    useEffect(() => {
        localStorage.setItem('app_structured_color', structuredColor)
    }, [structuredColor])

    useEffect(() => {
        localStorage.setItem('app_color_blind_mode', colorBlindMode)
    }, [colorBlindMode])

    useEffect(() => {
        localStorage.setItem('app_dyslexia_mode', dyslexiaMode)
    }, [dyslexiaMode])

    // Current accent incorporates structured mode override
    const activeAccent = structuredMode ? structuredColor : globalAccent

    // Update CSS accent variable
    useEffect(() => {
        document.documentElement.style.setProperty('--accent', colorValues[activeAccent])
    }, [activeAccent])

    const activeStaticColor = structuredMode ? activeAccent : staticColor

    const handleAccentChange = (color) => {
        if (!structuredMode) {
            setGlobalAccent(color)
        }
    }

    // User Name State
    const [userName, setUserName] = useState(() => localStorage.getItem('app_user_name') || '')
    const [showWelcome, setShowWelcome] = useState(() => !localStorage.getItem('app_user_name'))

    const handleNameChange = (name) => {
        setUserName(name)
        localStorage.setItem('app_user_name', name)
    }

    const handleWelcomeSave = (name) => {
        handleNameChange(name)
        setShowWelcome(false)
    }

    useEffect(() => {
        const handleKeyDown = (e) => {
            if (e.key === 'Escape') {
                if (screen === 'idle' || screen === 'revise' || screen === 'revise-menu' || screen === 'info' || screen === 'unit8-grammar' || screen === 'vocab-units' || screen === 'home' || screen === 'settings' || screen === 'students' || screen === 'reports' || screen === 'lesson-creator' || screen === 'lesson-brewing' || screen === 'lesson-player' || screen === 'breathing' || screen === 'canvas') {
                    setScreen('start')
                } else if (screen === 'serotonin-engine' || screen === 'cloud-sync') {
                    setScreen('settings')
                } else if (screen === 'breathing-countdown') {
                    setScreen('breathing')
                } else if (screen === 'breathing-resonant' || screen === 'breathing-sigh' || screen === 'breathing-box') {
                    setScreen('breathing')
                } else if (screen === 'grammar-units') {
                    setScreen('start')
                } else if (screen === 'grammar-unit') {
                    setScreen('grammar-units')
                } else if (screen.startsWith('idle-')) {
                    setScreen('idle')
                } else if (screen === 'revise-questions') {
                    setScreen('revise-types')
                } else if (screen === 'revise-types') {
                    setScreen('revise')
                } else if (screen.startsWith('unit8-grammar-')) {
                    setScreen('unit8-grammar')
                }
            }
        }

        window.addEventListener('keydown', handleKeyDown)
        return () => window.removeEventListener('keydown', handleKeyDown)
    }, [screen])

    const navigate = (newScreen, color) => {
        if (color) {
            setStaticColor(color)
        }
        if (newScreen === 'vocab-units') {
            setSelectedVocabUnit(null)
        }
        setScreen(newScreen)
    }

    const selectUnit = (unit, color) => {
        setSelectedUnit(unit)
        if (color) setStaticColor(color)
        setScreen('revise-types')
    }

    const selectGrammarUnit = (unit, color) => {
        setSelectedGrammarUnit(unit)
        if (color) setStaticColor(color)
        setScreen('grammar-unit')
    }

    const selectQuestionType = (type, data, scoreEnabled, color) => {
        setSelectedQuestionType(type)
        setQuestions(data)
        setHasScore(scoreEnabled)
        if (color) setStaticColor(color)
        setScreen('revise-questions')
    }

    // Background color based on current global accent and dark mode
    let appBgColor = isDarkMode ? darkBgTints[activeAccent] : bgTints[activeAccent]
    if (screen === 'lesson-creator' || screen === 'lesson-brewing' || screen === 'lesson-player' || screen === 'canvas' || screen === 'reports') {
        appBgColor = '#ffffff'
    } else if (screen === 'breathing' || screen === 'breathing-countdown' || screen === 'breathing-resonant' || screen === 'breathing-sigh' || screen === 'breathing-box') {
        appBgColor = '#000000'
    } else if (screen === 'serotonin-engine') {
        appBgColor = darkBgTints[activeAccent]
    }

    const cbFilterStyle = colorBlindMode !== 'none' ? { filter: `url(#cb-${colorBlindMode})` } : {}

    // ── Mobile gate ──────────────────────────────────────────────────────────
    const [isMobile, setIsMobile] = useState(() => window.innerWidth < 768)
    useEffect(() => {
        const handler = () => setIsMobile(window.innerWidth < 768)
        window.addEventListener('resize', handler)
        return () => window.removeEventListener('resize', handler)
    }, [])

    if (isMobile) return <MobileLandingScreen />

    // ── Auth gate ────────────────────────────────────────────────────────────
    if (authLoading) {
        return (
            <div style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f8f9fa' }}>
                <span className="login-spinner" style={{ width: 40, height: 40, borderWidth: 4 }} />
            </div>
        )
    }

    if (!authUser) {
        return <LoginScreen onAuth={setAuthUser} />
    }

    return (
        <div className={`app ${structuredMode ? 'app-structured-mode' : ''} ${dyslexiaMode !== 'none' ? `app-dyslexia-mode app-dyslexia-${dyslexiaMode}` : ''}`} style={{ backgroundColor: appBgColor, color: isDarkMode ? '#e8e8e8' : 'inherit', ...cbFilterStyle }}>
            {/* Color Blindness SVG Filters */}
            <svg style={{ position: 'absolute', width: 0, height: 0 }} aria-hidden="true">
                <defs>
                    <filter id="cb-protanopia">
                        <feColorMatrix type="matrix" values="
                            0.567, 0.433, 0,     0, 0
                            0.558, 0.442, 0,     0, 0
                            0,     0.242, 0.758, 0, 0
                            0,     0,     0,     1, 0
                        "/>
                    </filter>
                    <filter id="cb-deuteranopia">
                        <feColorMatrix type="matrix" values="
                            0.625, 0.375, 0,     0, 0
                            0.7,   0.3,   0,     0, 0
                            0,     0.3,   0.7,   0, 0
                            0,     0,     0,     1, 0
                        "/>
                    </filter>
                    <filter id="cb-tritanopia">
                        <feColorMatrix type="matrix" values="
                            0.95, 0.05,  0,     0, 0
                            0,    0.433, 0.567, 0, 0
                            0,    0.475, 0.525, 0, 0
                            0,    0,     0,     1, 0
                        "/>
                    </filter>
                </defs>
            </svg>
            <FollowAlongCursor enabled={cursorEnabled} color={cursorColor} size={cursorSize} />
            <WelcomeModal onSave={handleWelcomeSave} isOpen={showWelcome} />
            <AnimatePresence mode="wait">
                {screen === 'start' && (
                    <MainScreen
                        key="start"
                        onNavigate={navigate}
                        onAccentChange={handleAccentChange}
                        isDarkMode={isDarkMode}
                        userName={userName}
                        selectedBook={selectedBook}
                        onBookChange={setSelectedBook}
                    />
                )}

                {screen === 'settings' && (
                    <SettingsScreen
                        key="settings"
                        onBack={() => navigate('start')}
                        onAccentChange={handleAccentChange}
                        userName={userName}
                        onNameChange={handleNameChange}
                        isDarkMode={isDarkMode}
                        onToggleDarkMode={() => setIsDarkMode(!isDarkMode)}
                        initialAccent={activeAccent}
                        onNavigate={navigate}
                        cursorEnabled={cursorEnabled}
                        onToggleCursor={() => setCursorEnabled(!cursorEnabled)}
                        cursorColor={cursorColor}
                        onCursorColorChange={setCursorColor}
                        cursorSize={cursorSize}
                        onCursorSizeChange={setCursorSize}
                        structuredMode={structuredMode}
                        onToggleStructuredMode={() => setStructuredMode(!structuredMode)}
                        structuredColor={structuredColor}
                        onStructuredColorChange={setStructuredColor}
                        colorBlindMode={colorBlindMode}
                        onColorBlindModeChange={setColorBlindMode}
                        dyslexiaMode={dyslexiaMode}
                        onDyslexiaModeChange={setDyslexiaMode}
                        authUser={authUser}
                        onSignOut={handleSignOut}
                    />
                )}

                {screen === 'cloud-sync' && (
                    <CloudSyncScreen
                        key="cloud-sync"
                        onBack={() => navigate('settings')}
                        authUser={authUser}
                        accentColor={activeAccent}
                    />
                )}



                {screen === 'students' && (
                    <StudentsScreen
                        key="students"
                        onBack={() => navigate('start')}
                        onNavigate={navigate}
                        onAccentChange={handleAccentChange}
                        userName={userName}
                    />
                )}

                {screen === 'reports' && (
                    <ReportsScreen
                        key="reports"
                        onBack={() => navigate('students')}
                        onAccentChange={handleAccentChange}
                        userName={userName}
                    />
                )}

                {screen === 'home' && (
                    <MainMenu
                        key="home"
                        onNavigate={navigate}
                        onAccentChange={handleAccentChange}
                        isDarkMode={isDarkMode}
                        onToggleDarkMode={() => setIsDarkMode(!isDarkMode)}
                        userName={userName}
                    />
                )}

                {screen === 'info' && (
                    <InfoScreen
                        key="info"
                        onBack={() => navigate('start')}
                        onAccentChange={handleAccentChange}
                        userName={userName}
                        setUserName={handleNameChange}
                    />
                )}

                {screen === 'idle' && (
                    <IdleMenu
                        key="idle"
                        onNavigate={(type) => navigate(`idle-${type}`)}
                        onBack={() => navigate('start')}
                        onAccentChange={handleAccentChange}
                        userName={userName}
                    />
                )}

                {screen === 'idle-grammar' && (
                    <GrammarIdleScreen
                        key="idle-grammar"
                        onBack={() => navigate('idle')}
                        color={activeAccent}
                        onAccentChange={handleAccentChange}
                    />
                )}

                {screen === 'idle-vocab-carousel' && (
                    <VocabCarouselIdleScreen
                        key="idle-vocab-carousel"
                        onBack={() => navigate('idle')}
                        color={activeAccent}
                        onAccentChange={handleAccentChange}
                    />
                )}

                {screen === 'idle-idioms' && (
                    <IdiomsIdleScreen
                        key="idle-idioms"
                        onBack={() => navigate('idle')}
                        color={activeAccent}
                        onAccentChange={handleAccentChange}
                    />
                )}

                {screen === 'idle-spot-error' && (
                    <SpotErrorIdleScreen
                        key="idle-spot-error"
                        onBack={() => navigate('idle')}
                        color={activeAccent}
                        onAccentChange={handleAccentChange}
                    />
                )}

                {screen.startsWith('idle-') && screen !== 'idle-grammar' && screen !== 'idle-vocab-carousel' && screen !== 'idle-idioms' && screen !== 'idle-spot-error' && (
                    <PlaceholderIdle
                        key="idle-placeholder"
                        title={screen.replace('idle-', '').replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                        onBack={() => navigate('idle')}
                    />
                )}

                {screen === 'breathing' && (
                    <BreathingMenu
                        key="breathing"
                        onNavigate={(target) => {
                            setPendingBreathingScreen(target)
                            navigate('breathing-countdown')
                        }}
                        onBack={() => navigate('start')}
                        color={activeAccent}
                    />
                )}

                {screen === 'breathing-countdown' && (
                    <BreathingCountdown
                        key="breathing-countdown"
                        onDone={() => navigate(pendingBreathingScreen)}
                    />
                )}

                {screen === 'breathing-resonant' && (
                    <ResonantBreathingScreen
                        key="breathing-resonant"
                        onBack={() => navigate('breathing')}
                    />
                )}

                {screen === 'breathing-sigh' && (
                    <PsychologicalSighScreen
                        key="breathing-sigh"
                        onBack={() => navigate('breathing')}
                    />
                )}

                {screen === 'breathing-box' && (
                    <BoxBreathingScreen
                        key="breathing-box"
                        onBack={() => navigate('breathing')}
                    />
                )}

                {screen === 'vocab-units' && (
                    <VocabUnitsScreen
                        key="vocab-units"
                        onBack={() => navigate('start')}
                        onAccentChange={handleAccentChange}
                        userName={userName}
                        selectedBook={selectedBook}
                        staticColor={activeStaticColor}
                        selectedUnit={selectedVocabUnit}
                        onSelectUnit={(unit, unitColor) => {
                            setSelectedVocabUnit(unit)
                        }}
                    />
                )}

                {screen === 'revise-menu' && (
                    <ReviseMenu
                        key="revise-menu"
                        onBack={() => navigate('start')}
                        onAccentChange={handleAccentChange}
                        userName={userName}
                        onStart={(session) => {
                            setReviseSession(session)
                            setScreen('revise-player')
                        }}
                    />
                )}

                {screen === 'revise-player' && reviseSession && (
                    <QuestionPlayer
                        key="revise-player"
                        questions={reviseSession.questions}
                        unit={reviseSession.unit}
                        difficulty={reviseSession.difficulty}
                        classId={reviseSession.classId}
                        className={reviseSession.className}
                        accent={reviseSession.accent}
                        onBack={() => {
                            setReviseSession(null)
                            navigate('revise-menu')
                        }}
                    />
                )}

                {screen === 'lesson-creator' && (
                    <LessonCreator
                        key="lesson-creator"
                        onBack={() => navigate('start')}
                        onBrew={() => {
                            setBrewError(null)
                            setScreen('lesson-brewing')
                        }}
                        onBrewError={(msg) => {
                            setBrewError(msg)
                        }}
                        onPlay={(data) => {
                            setLessonData(data)
                            setBrewError(null)
                            setScreen('lesson-player')
                        }}
                    />
                )}

                {screen === 'lesson-brewing' && (
                    <LoadingScreen
                        key="lesson-brewing"
                        accentColor="#06b6d4"
                        error={brewError}
                        onDismissError={() => {
                            setBrewError(null)
                            setScreen('lesson-creator')
                        }}
                    />
                )}

                {screen === 'lesson-player' && lessonData && (
                    <UnifiedPlayer
                        key="lesson-player"
                        lessonData={lessonData}
                        accentColor={activeAccent}
                        onBack={() => {
                            setLessonData(null)
                            navigate('lesson-creator')
                        }}
                    />
                )}

                {screen === 'revise' && (
                    <UnitSelect
                        key="revise"
                        onSelect={selectUnit}
                        onBack={() => navigate('start')}
                        onAccentChange={handleAccentChange}
                        userName={userName}
                        selectedBook={selectedBook}
                        currentUnit={selectedUnit}
                    />
                )}

                {screen === 'grammar-units' && (
                    <UnitSelect
                        key="grammar-units"
                        onSelect={selectGrammarUnit}
                        onBack={() => navigate('start')}
                        onAccentChange={handleAccentChange}
                        userName={userName}
                        selectedBook={selectedBook}
                        currentUnit={selectedGrammarUnit}
                    />
                )}

                {screen === 'grammar-unit' && (
                    <GrammarUnitLanding
                        key="grammar-unit"
                        unit={selectedGrammarUnit}
                        selectedBook={selectedBook}
                        staticColor={activeStaticColor}
                        onBack={() => navigate('grammar-units')}
                        onAccentChange={handleAccentChange}
                        userName={userName}
                    />
                )}

                {screen === 'revise-types' && (
                    <QuestionTypeSelect
                        key="types"
                        unit={selectedUnit}
                        selectedBook={selectedBook}
                        onSelect={selectQuestionType}
                        onBack={() => navigate('revise')}
                        onAccentChange={handleAccentChange}
                        userName={userName}
                    />
                )}

                {screen === 'revise-questions' && (
                    <QuestionDisplay
                        key="questions"
                        unit={selectedUnit}
                        questionType={selectedQuestionType}
                        questions={questions}
                        hasScore={hasScore}
                        onBack={() => navigate('revise-types')}
                        staticColor={activeStaticColor}
                        onAccentChange={handleAccentChange}
                    />
                )}

                {/* Unit 8 Grammar Routes */}
                {screen === 'unit8-grammar' && (
                    <Unit8GrammarMenu
                        key="unit8-grammar"
                        onNavigate={(type) => navigate(`unit8-grammar-${type}`)}
                        onBack={() => navigate('start')}
                        onAccentChange={handleAccentChange}
                        userName={userName}
                    />
                )}

                {screen === 'unit8-grammar-explain' && (
                    <Unit8GrammarExplain
                        key="unit8-explain"
                        onBack={() => navigate('unit8-grammar')}
                        onAccentChange={handleAccentChange}
                    />
                )}

                {screen === 'unit8-grammar-examples' && (
                    <Unit8GrammarExamples
                        key="unit8-examples"
                        onBack={() => navigate('unit8-grammar')}
                        onAccentChange={handleAccentChange}
                    />
                )}

                {screen === 'unit8-grammar-questions' && (
                    <Unit8GrammarQuestions
                        key="unit8-questions"
                        onBack={() => navigate('unit8-grammar')}
                        onAccentChange={handleAccentChange}
                    />
                )}

                {screen === 'canvas' && (
                    <CanvasScreen
                        key="canvas"
                        onBack={() => navigate('start')}
                    />
                )}

                {screen === 'serotonin-engine' && (
                    <SerotoninScreen
                        key="serotonin-engine"
                        onBack={() => navigate('settings')}
                        currentAccent={activeAccent}
                        onAccentChange={handleAccentChange}
                    />
                )}
            </AnimatePresence>
        </div>
    )
}

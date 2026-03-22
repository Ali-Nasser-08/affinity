import { useState, useMemo, useCallback, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { colorValues, textColors, pickRandom } from '../engine/serotoninEngine'
import { logoOptions } from '../data/logos'
import { useAnimatedTitle } from '../hooks/useAnimatedTitle'
import { useStudents } from '../hooks/useStudents'
import { StudentTile } from '../components/StudentTile'
import { TopBar } from '../components/TopBar'
import { StudentEditorScreen } from './StudentEditorScreen'
import { ReportGenerator } from '../components/ReportGenerator'

const starItems = [
    {
        id: 'star-base',
        label: 'Normal',
        iconColor: '#fbbf24', // Yellow
        glowColor: '#fbbf24',
        shadow: '0 4px 12px rgba(251, 191, 36, 0.3)',
        tier: 1
    },
    {
        id: 'star-spark',
        label: 'Spark',
        gradient: 'linear-gradient(135deg, #22d3ee 0%, #06b6d4 100%)', // Cyan
        glowColor: '#22d3ee',
        shadow: '0 4px 15px rgba(6, 182, 212, 0.4)',
        tier: 2
    },
    {
        id: 'star-radiant',
        label: 'Radiant',
        gradient: 'linear-gradient(135deg, #fb7185 0%, #c084fc 100%)', // Coral -> Purple
        glowColor: '#f472b6',
        shadow: '0 4px 20px rgba(192, 132, 252, 0.5)',
        tier: 3
    },
    {
        id: 'star-legendary',
        label: 'Legendary',
        gradient: 'linear-gradient(45deg, #c084fc, #fbbf24, #22d3ee, #c084fc)', // Purple -> Yellow -> Cyan -> Loop
        shadow: '0 0 20px rgba(192, 132, 252, 0.6)',
        tier: 4,
        isRainbow: true
    }
]

const starMap = starItems.reduce((acc, item) => {
    acc[item.id] = item
    return acc
}, {})

export function StudentsScreen({ onBack, onNavigate, onAccentChange, userName }) {
    const { title, color } = useAnimatedTitle({
        onColorChange: onAccentChange,
        initialColor: 'cyan',
        userName
    })
    const colorKeys = useMemo(() => Object.keys(colorValues), [])

    // Use the custom hook for student data management
    const {
        students,
        addStudent,
        updateStudent,
        deleteStudent,
        addStar,
        pulseId,
        classes,
        currentClassId,
        setCurrentClassId,
        addClass,
        deleteClass,
        renameClass
    } = useStudents()

    const [menuOpenId, setMenuOpenId] = useState(null)
    const [editorMode, setEditorMode] = useState(null) // 'add' | 'edit' | null
    const [activeStudent, setActiveStudent] = useState(null)
    const [deleteConfirm, setDeleteConfirm] = useState(null)
    const [showStarHint, setShowStarHint] = useState(false)
    const [showSettings, setShowSettings] = useState(false)
    const [starKeys, setStarKeys] = useState({})

    const [draggedItemId, setDraggedItemId] = useState(null)

    const openAddEditor = useCallback(() => {
        setActiveStudent(null)
        setEditorMode('add')
    }, [])

    const openEditEditor = useCallback((student) => {
        setActiveStudent(student)
        setEditorMode('edit')
    }, [])

    const openDeleteConfirm = useCallback((studentId) => {
        setDeleteConfirm(studentId)
    }, [])

    const handleEditorSave = useCallback((data) => {
        if (editorMode === 'add') {
            addStudent(data.name, data.logoId, data.colorKey)
        } else if (editorMode === 'edit' && activeStudent) {
            updateStudent(activeStudent.id, data.name, data.logoId, data.colorKey)
        }
        setEditorMode(null)
        setActiveStudent(null)
    }, [editorMode, activeStudent, addStudent, updateStudent])

    const handleDeleteStudent = useCallback(() => {
        if (deleteConfirm) {
            deleteStudent(deleteConfirm)
            setDeleteConfirm(null)
        }
    }, [deleteStudent, deleteConfirm])

    const handleStarDrop = useCallback((studentId, starId) => {
        addStar(studentId, starId)
    }, [addStar])

    // If editor is open, show the editor screen
    if (editorMode) {
        return (
            <StudentEditorScreen
                mode={editorMode}
                initialData={activeStudent}
                onSave={handleEditorSave}
                onBack={() => {
                    setEditorMode(null)
                    setActiveStudent(null)
                }}
                accentColor={color}
                userName={userName}
            />
        )
    }

    return (
        <div
            className="main-content students-screen"
            style={{
                '--accent': colorValues[color],
                '--accent-soft': `${colorValues[color]}33`,
                '--accent-softer': `${colorValues[color]}1f`,
                '--accent-grid': `${colorValues[color]}66`,
                '--blob-a-color': `${colorValues[color]}40`,
                '--blob-b-color': `${colorValues[color]}30`,
                '--blob-c-color': `${colorValues[color]}35`,
                justifyContent: 'flex-start',
                paddingTop: '130px'
            }}
        >
            <div className={`students-blobs`}>
                <span className="students-blob blob-a" style={{ background: `radial-gradient(circle at 30% 30%, var(--blob-a-color), transparent 60%)` }} />
                <span className="students-blob blob-b" style={{ background: `radial-gradient(circle at 40% 40%, var(--blob-b-color), transparent 65%)` }} />
                <span className="students-blob blob-c" style={{ background: `radial-gradient(circle at 50% 30%, var(--blob-c-color), transparent 60%)` }} />
            </div>

            <TopBar title={title} onBack={onBack} color={color}>
                {showStarHint && <span className="students-drag-hint">drag to award</span>}



                <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                    {starItems.map((item) => (
                        <motion.button
                            key={`${item.id}-${starKeys[item.id] || 0}`}
                            type="button"
                            className="star-source-btn"
                            whileHover={{ scale: 1.1, y: -2 }}
                            whileTap={{ scale: 0.95 }}
                            whileDrag={{ 
                                scale: 1.35, 
                                zIndex: 9999, 
                                pointerEvents: 'none',
                                rotate: [0, -5, 5, 0],
                                transition: { rotate: { repeat: Infinity, duration: 0.2 } }
                            }}
                            drag
                            dragSnapToOrigin
                            onDragStart={() => {
                                setShowStarHint(true)
                                setDraggedItemId(item.id)
                                document.body.classList.add('hide-custom-cursor')
                            }}
                            onDragEnd={(e, info) => {
                                setShowStarHint(false)
                                setDraggedItemId(null)
                                document.body.classList.remove('hide-custom-cursor')
                                const elements = document.elementsFromPoint(info.point.x, info.point.y)
                                const dropZone = elements.find(el => el.closest && el.closest('.student-tile'))
                                if (dropZone) {
                                    const tile = dropZone.closest('.student-tile')
                                    const studentId = tile.getAttribute('data-student-id')
                                    if (studentId) {
                                        handleStarDrop(studentId, item.id)
                                        setStarKeys(prev => ({ ...prev, [item.id]: (prev[item.id] || 0) + 1 }))
                                    }
                                }
                            }}
                            style={{
                                width: '44px',
                                height: '44px',
                                borderRadius: '12px',
                                background: 'white',
                                border: 'none',
                                cursor: 'grab',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                boxShadow: item.shadow,
                                position: 'relative',
                                overflow: 'visible'
                            }}
                        >
                            {/* Rainbow Halo for Legendary */}
                            {item.isRainbow && (
                                <div
                                    className="star-source-rainbow-halo"
                                    style={{
                                        position: 'absolute',
                                        inset: -2,
                                        borderRadius: '14px',
                                        background: item.gradient,
                                        zIndex: -1,
                                        opacity: 0.4,
                                        filter: 'blur(4px)',
                                        animation: 'spin-linear 3s linear infinite'
                                    }}
                                />
                            )}

                            {/* Standard Glow for other tiers */}
                            {!item.isRainbow && item.glowColor && (
                                <div
                                    style={{
                                        position: 'absolute',
                                        inset: -2,
                                        borderRadius: '12px',
                                        background: item.glowColor,
                                        zIndex: -1,
                                        opacity: 0.25,
                                        filter: 'blur(4px)'
                                    }}
                                />
                            )}

                            {/* The Star Icon */}
                            <span
                                className="material-symbols-rounded material-filled"
                                style={{
                                    fontSize: '28px',
                                    color: item.gradient ? 'transparent' : item.iconColor,
                                    backgroundImage: item.gradient,
                                    backgroundSize: item.isRainbow ? '200% 200%' : '100% 100%',
                                    WebkitBackgroundClip: 'text',
                                    backgroundClip: 'text',
                                    filter: item.tier === 3 ? 'drop-shadow(0 0 2px rgba(251, 113, 133, 0.4))' : 'none',
                                    display: 'inline-block',
                                    animation: item.isRainbow ? 'gradientPan 3s linear infinite' : 'none'
                                }}
                            >
                                star
                            </span>

                            {/* Particles for Tier 2+ */}
                            {item.tier >= 2 && (
                                <>
                                    {[...Array(draggedItemId === item.id ? 8 : 2)].map((_, i) => (
                                        <div
                                            key={i}
                                            style={{
                                                position: 'absolute',
                                                top: '40%',
                                                left: '50%',
                                                width: draggedItemId === item.id ? '6px' : '4px',
                                                height: draggedItemId === item.id ? '6px' : '4px',
                                                borderRadius: '50%',
                                                background: item.tier === 4 ? '#FFD700' : item.color,
                                                transform: `translate(-50%, -50%) translate(${(i - 0.5) * 6}px, 0) scale(0)`,
                                                pointerEvents: 'none',
                                                zIndex: 2,
                                                '--px': `${(i - 0.5) * (draggedItemId === item.id ? 20 : 6)}px`,
                                                animation: `floatParticle ${draggedItemId === item.id ? 0.8 : 1.5}s ease-out infinite`,
                                                animationDelay: `${i * 0.2}s`,
                                                filter: 'blur(0.5px)'
                                            }}
                                        />
                                    ))}
                                </>
                            )}

                            {draggedItemId === item.id && item.tier >= 3 && (
                                <motion.div
                                    layoutId="halo"
                                    style={{
                                        position: 'absolute',
                                        inset: -10,
                                        borderRadius: '50%',
                                        border: `2px solid ${item.color}`,
                                        opacity: 0.3,
                                        zIndex: -1
                                    }}
                                    animate={{ scale: [1, 1.5], opacity: [0.3, 0] }}
                                    transition={{ repeat: Infinity, duration: 0.8 }}
                                />
                            )}
                        </motion.button>
                    ))}
                    <motion.button
                        onClick={() => onNavigate('reports', color)}
                        whileHover={{ scale: 1.1, rotate: -15 }}
                        whileTap={{ scale: 0.95 }}
                        style={{
                            width: '44px',
                            height: '44px',
                            borderRadius: '12px',
                            background: 'white',
                            border: 'none',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            boxShadow: '0 4px 12px rgba(0,0,0,0.05)',
                            color: '#666'
                        }}
                    >
                        <span className="material-symbols-rounded" style={{ fontSize: '24px' }}>description</span>
                    </motion.button>
                    <motion.button
                        onClick={() => setShowSettings(true)}
                        whileHover={{ scale: 1.1, rotate: 30 }}
                        whileTap={{ scale: 0.95 }}
                        style={{
                            width: '44px',
                            height: '44px',
                            borderRadius: '12px',
                            background: 'white',
                            border: 'none',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            boxShadow: '0 4px 12px rgba(0,0,0,0.05)',
                            color: '#666'
                        }}
                    >
                        <span className="material-symbols-rounded" style={{ fontSize: '24px' }}>settings</span>
                    </motion.button>
                </div>
            </TopBar>

            <div style={{
                padding: '0 32px',
                display: 'flex',
                gap: '12px',
                flexWrap: 'wrap',
                justifyContent: 'flex-start',
                alignItems: 'center',
                maxWidth: '1200px',
                margin: '0 auto 24px',
                width: '100%',
                boxSizing: 'border-box'
            }}>
                {classes && classes.map(cls => (
                    <motion.button
                        key={cls.id}
                        onClick={() => setCurrentClassId(cls.id)}
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        style={{
                            padding: '10px 20px',
                            borderRadius: '24px',
                            border: 'none',
                            background: currentClassId === cls.id ? colorValues[color] : 'white',
                            color: currentClassId === cls.id ? 'white' : '#666',
                            fontWeight: 700,
                            fontSize: '15px',
                            cursor: 'pointer',
                            whiteSpace: 'nowrap',
                            boxShadow: currentClassId === cls.id ? `0 4px 12px ${colorValues[color]}40` : '0 2px 8px rgba(0,0,0,0.03)',
                            transition: 'background 0.2s, color 0.2s',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '8px'
                        }}
                    >
                        {cls.name}
                        {currentClassId === cls.id && (
                            <motion.div
                                layoutId="active-dot"
                                style={{ width: 6, height: 6, borderRadius: '50%', background: 'white' }}
                            />
                        )}
                    </motion.button>
                ))}
                <motion.button
                    onClick={addClass}
                    whileHover={{ scale: 1.1, rotate: 90 }}
                    whileTap={{ scale: 0.9 }}
                    style={{
                        width: '40px',
                        height: '40px',
                        borderRadius: '50%',
                        border: '2px dashed rgba(0,0,0,0.1)',
                        background: 'transparent',
                        color: '#666',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        cursor: 'pointer',
                        flexShrink: 0
                    }}
                >
                    <span className="material-symbols-rounded" style={{ fontSize: '24px' }}>add</span>
                </motion.button>
            </div>

            <div className="students-grid" onClick={() => setMenuOpenId(null)}>

                {students.map((student, index) => (
                    <StudentTile
                        key={student.id}
                        student={student}
                        index={index}
                        color={color}
                        menuOpenId={menuOpenId}
                        setMenuOpenId={setMenuOpenId}
                        pulseId={pulseId}
                        onDrop={handleStarDrop}
                        onEdit={openEditEditor}
                        onDelete={openDeleteConfirm}
                        starMap={starMap}
                    />
                ))}

                <div className="student-tile add-tile" style={{ borderColor: colorValues[color] }}>
                    <button
                        className="add-student-btn"
                        onClick={openAddEditor}
                        style={{
                            color: colorValues[color],
                            borderColor: colorValues[color]
                        }}
                    >
                        +
                    </button>
                    <div className="add-student-label" style={{ color: colorValues[color] }}>
                        Add student
                    </div>
                </div>
            </div>

            {/* Settings Modal */}
            {
                showSettings && (
                    <div
                        className="student-modal-backdrop is-open"
                        onClick={() => setShowSettings(false)}
                        style={{ zIndex: 2000 }}
                    >
                        <div
                            className="student-modal"
                            onClick={(e) => e.stopPropagation()}
                            style={{ maxWidth: '500px', width: '90%', padding: '40px', maxHeight: '85vh', overflowY: 'auto' }}
                        >
                            <h2 style={{ margin: '0 0 24px', fontSize: '28px', fontFamily: 'var(--font-display)', color: '#333' }}>Class Settings</h2>

                            <div style={{ marginBottom: '32px' }}>
                                <h3 style={{ fontSize: '18px', marginBottom: '16px', color: '#666', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                    <span className="material-symbols-rounded">school</span> Manage Classes
                                </h3>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                    {classes.map(cls => (
                                        <div key={cls.id} style={{
                                            display: 'flex',
                                            justifyContent: 'space-between',
                                            alignItems: 'center',
                                            padding: '8px 16px',
                                            background: '#f8fafc',
                                            borderRadius: '12px',
                                            border: currentClassId === cls.id ? `1px solid ${colorValues[color]}` : '1px solid transparent',
                                            gap: '12px'
                                        }}>
                                            <input
                                                value={cls.name || ''}
                                                onChange={(e) => renameClass(cls.id, e.target.value)}
                                                placeholder="Class Name"
                                                style={{
                                                    fontWeight: 600,
                                                    color: '#333',
                                                    border: 'none',
                                                    background: 'transparent',
                                                    fontSize: '16px',
                                                    width: '100%',
                                                    outline: 'none',
                                                    fontFamily: 'inherit'
                                                }}
                                            />
                                            {classes.length > 1 && (
                                                <button
                                                    onClick={() => deleteClass(cls.id)}
                                                    style={{
                                                        border: 'none',
                                                        background: `${textColors.red}15`,
                                                        color: textColors.red,
                                                        borderRadius: '8px',
                                                        padding: '6px 12px',
                                                        cursor: 'pointer',
                                                        fontSize: '12px',
                                                        fontWeight: 700,
                                                        flexShrink: 0
                                                    }}
                                                >
                                                    Delete
                                                </button>
                                            )}
                                        </div>
                                    ))}
                                    <button
                                        onClick={addClass}
                                        style={{
                                            marginTop: '8px',
                                            padding: '12px',
                                            borderRadius: '12px',
                                            border: `2px dashed ${colorValues[color]}40`,
                                            background: 'transparent',
                                            color: colorValues[color],
                                            fontWeight: 700,
                                            cursor: 'pointer',
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            gap: '8px'
                                        }}
                                    >
                                        <span className="material-symbols-rounded">add</span> Add New Class
                                    </button>
                                </div>
                            </div>

                            <div style={{ marginBottom: '32px' }}>
                                <h3 style={{ fontSize: '18px', marginBottom: '16px', color: '#666', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                    <span className="material-symbols-rounded">hotel_class</span> Star Guide
                                </h3>
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '12px' }}>
                                    {starItems.map(item => (
                                        <div key={item.id} style={{ display: 'flex', alignItems: 'center', gap: '16px', padding: '12px', background: '#f8fafc', borderRadius: '12px' }}>
                                            <div style={{
                                                width: '40px',
                                                height: '40px',
                                                display: 'flex',
                                                alignItems: 'center',
                                                justifyContent: 'center',
                                                background: 'white',
                                                borderRadius: '8px',
                                                boxShadow: '0 2px 8px rgba(0,0,0,0.05)',
                                                position: 'relative'
                                            }}>
                                                {item.isRainbow && (
                                                    <div style={{ position: 'absolute', inset: -2, borderRadius: '10px', background: item.gradient, zIndex: 0, opacity: 0.4, filter: 'blur(3px)', animation: 'spin-linear 3s linear infinite' }} />
                                                )}
                                                <span
                                                    className="material-symbols-rounded material-filled"
                                                    style={{
                                                        fontSize: '24px',
                                                        color: item.gradient ? 'transparent' : item.iconColor,
                                                        backgroundImage: item.gradient,
                                                        backgroundSize: item.isRainbow ? '200% 200%' : '100% 100%',
                                                        WebkitBackgroundClip: 'text',
                                                        backgroundClip: 'text',
                                                        display: 'inline-block',
                                                        zIndex: 1,
                                                        animation: item.isRainbow ? 'gradientPan 3s linear infinite' : 'none'
                                                    }}
                                                >
                                                    star
                                                </span>
                                            </div>
                                            <div>
                                                <div style={{ fontWeight: 700, fontSize: '16px', color: '#333' }}>{item.label}</div>
                                                <div style={{ fontSize: '13px', color: '#888' }}>Tier {item.tier} Reward</div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            <button
                                onClick={() => setShowSettings(false)}
                                style={{
                                    width: '100%',
                                    padding: '16px',
                                    borderRadius: '14px',
                                    border: 'none',
                                    background: '#f0f0f0',
                                    color: '#666',
                                    fontSize: '16px',
                                    fontWeight: 700,
                                    cursor: 'pointer'
                                }}
                            >
                                Close Settings
                            </button>
                        </div>
                    </div>
                )
            }

            {/* Delete Confirmation Modal */}
            {
                deleteConfirm && (
                    <div
                        className="student-modal-backdrop is-open"
                        onClick={() => setDeleteConfirm(null)}
                    >
                        <div
                            className="student-modal"
                            onClick={(e) => e.stopPropagation()}
                            style={{ maxWidth: '400px', padding: '40px' }}
                        >
                            <div style={{ textAlign: 'center' }}>
                                <div style={{
                                    width: '80px',
                                    height: '80px',
                                    borderRadius: '50%',
                                    background: `${textColors.red}15`,
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    margin: '0 auto 24px'
                                }}>
                                    <span className="material-symbols-rounded" style={{ fontSize: '40px', color: textColors.red }}>
                                        warning
                                    </span>
                                </div>
                                <div style={{
                                    fontSize: '24px',
                                    fontWeight: 800,
                                    color: textColors.red,
                                    marginBottom: '12px',
                                    fontFamily: 'var(--font-display)'
                                }}>
                                    Delete Student?
                                </div>
                                <div style={{
                                    color: '#888',
                                    marginBottom: '32px',
                                    fontSize: '16px'
                                }}>
                                    This will remove all their stars and data. This action cannot be undone.
                                </div>
                                <div style={{ display: 'flex', gap: '16px', justifyContent: 'center' }}>
                                    <motion.button
                                        whileHover={{ scale: 1.05 }}
                                        whileTap={{ scale: 0.95 }}
                                        onClick={() => setDeleteConfirm(null)}
                                        style={{
                                            padding: '14px 32px',
                                            borderRadius: '14px',
                                            border: 'none',
                                            background: '#f0f0f0',
                                            color: '#666',
                                            fontSize: '16px',
                                            fontWeight: 700,
                                            cursor: 'pointer'
                                        }}
                                    >
                                        Cancel
                                    </motion.button>
                                    <motion.button
                                        whileHover={{ scale: 1.05 }}
                                        whileTap={{ scale: 0.95 }}
                                        onClick={handleDeleteStudent}
                                        style={{
                                            padding: '14px 32px',
                                            borderRadius: '14px',
                                            border: 'none',
                                            background: textColors.red,
                                            color: 'white',
                                            fontSize: '16px',
                                            fontWeight: 700,
                                            cursor: 'pointer',
                                            boxShadow: `0 8px 20px ${textColors.red}40`
                                        }}
                                    >
                                        Delete
                                    </motion.button>
                                </div>
                            </div>
                        </div>
                    </div>
                )
            }
        </div >
    )
}

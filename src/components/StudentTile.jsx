import { useState, memo } from 'react'
import { motion } from 'framer-motion'
import { colorValues } from '../engine/serotoninEngine'

export const StudentTile = memo(({ student, index, color, menuOpenId, setMenuOpenId, pulseId, onDrop, onEdit, onDelete, starMap }) => {
    const [isHovered, setIsHovered] = useState(false)
    const studentColor = colorValues[student.colorKey] || colorValues[color]
    const isMenuOpen = menuOpenId === student.id
    const starCount = student.stars.length
    const starSize = starCount <= 6 ? 28 : Math.max(16, 28 - Math.max(0, starCount - 6) * 1.5)
    const nameLength = student.name.length
    const nameClassName = nameLength > 15 ? 'student-name student-name-xs' : nameLength > 9 ? 'student-name student-name-sm' : 'student-name'

    const handleDrop = (e) => {
        e.preventDefault()
        const starId = e.dataTransfer.getData('text/plain')
        onDrop(student.id, starId)
    }

    return (
        <motion.div
            className="student-tile"
            data-student-id={student.id}
            style={{
                borderColor: studentColor,
                backgroundColor: isHovered ? studentColor : 'white',
                '--tile-glow': studentColor,
                '--tile-shadow': `${studentColor}1f`
            }}
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{
                opacity: 1,
                scale: pulseId === student.id ? 1.12 : 1,
                rotate: pulseId === student.id ? [0, -2, 2, 0] : 0,
                y: 0,
                transition: { type: 'spring', stiffness: 400, damping: 25, mass: 0.8, delay: Math.min(index * 0.01, 0.2) }
            }}
            exit={{
                opacity: 0,
                scale: 0.9,
                transition: { duration: 0.15 }
            }}
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
            onClick={(e) => {
                e.stopPropagation()
                setMenuOpenId(student.id === menuOpenId ? null : student.id)
            }}
            onDragOver={(e) => e.preventDefault()}
            onDrop={handleDrop}
        >
            {isMenuOpen ? (
                <div className="student-menu student-menu-inline">
                    <button
                        style={{ color: studentColor }}
                        onClick={(e) => {
                            e.stopPropagation()
                            onEdit(student)
                            setMenuOpenId(null)
                        }}
                    >
                        Change Name
                    </button>
                    <button
                        style={{ color: studentColor }}
                        onClick={(e) => {
                            e.stopPropagation()
                            onEdit(student)
                            setMenuOpenId(null)
                        }}
                    >
                        Change Icon/Color
                    </button>
                    <button
                        style={{ color: studentColor }}
                        onClick={(e) => {
                            e.stopPropagation()
                            onDelete(student.id)
                            setMenuOpenId(null)
                        }}
                    >
                        Delete Student
                    </button>
                </div>
            ) : (
                <>
                    <div className="student-header">
                        <div
                            className={nameClassName}
                            style={{ color: isHovered ? '#fff' : studentColor }}
                            onClick={(e) => {
                                e.stopPropagation()
                                setMenuOpenId(student.id === menuOpenId ? null : student.id)
                            }}
                            role="button"
                            tabIndex={0}
                        >
                            {student.name}
                        </div>
                        <div className="student-icon-shell" style={{ background: isHovered ? 'rgba(255, 255, 255, 0.28)' : `${studentColor}26` }}>
                            <span className="material-symbols-rounded material-filled student-icon student-icon-tile" style={{ color: isHovered ? '#fff' : studentColor }}>
                                {student.logoId}
                            </span>
                        </div>
                    </div>
                    {student.stars.length > 0 && (
                        <div className="student-stars">
                            {student.stars.map((starId, idx) => {
                                const starItem = starMap[starId] || {}
                                return (
                                    <div
                                        key={`${starId}-${idx}`}
                                        style={{
                                            position: 'relative',
                                            display: 'inline-flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            width: `${starSize}px`,
                                            height: `${starSize}px`
                                        }}
                                    >
                                        {/* Rainbow Halo for Legendary */}
                                        {starItem.isRainbow && (
                                            <div
                                                style={{
                                                    position: 'absolute',
                                                    inset: -1,
                                                    borderRadius: '50%',
                                                    background: starItem.gradient,
                                                    opacity: 0.5,
                                                    filter: 'blur(2px)',
                                                    zIndex: 0,
                                                    animation: 'spin-linear 3s linear infinite'
                                                }}
                                            />
                                        )}

                                        {/* Standard Glow for other tiers */}
                                        {!starItem.isRainbow && starItem.glowColor && (
                                            <div
                                                style={{
                                                    position: 'absolute',
                                                    inset: -1,
                                                    borderRadius: '50%',
                                                    background: starItem.glowColor,
                                                    opacity: 0.25,
                                                    filter: 'blur(2px)',
                                                    zIndex: 0
                                                }}
                                            />
                                        )}

                                        {/* Star Icon */}
                                        <span
                                            className="material-symbols-rounded material-filled student-star"
                                            style={{
                                                fontSize: `${starSize}px`,
                                                color: starItem.gradient ? 'transparent' : starItem.iconColor,
                                                backgroundImage: starItem.gradient,
                                                backgroundSize: starItem.isRainbow ? '200% 200%' : '100% 100%',
                                                WebkitBackgroundClip: 'text',
                                                backgroundClip: 'text',
                                                zIndex: 1,
                                                filter: starItem.tier === 3 ? 'drop-shadow(0 0 1px rgba(251, 113, 133, 0.6))' : 'none',
                                                display: 'inline-block',
                                                animation: starItem.isRainbow ? 'gradientPan 3s linear infinite' : 'none'
                                            }}
                                        >
                                            star
                                        </span>

                                        {/* Particles for Tier 2+ */}
                                        {starItem.tier >= 2 && (
                                            <>
                                                {[...Array(2)].map((_, i) => (
                                                    <div
                                                        key={i}
                                                        style={{
                                                            position: 'absolute',
                                                            top: '40%',
                                                            left: '50%',
                                                            width: `${starSize * 0.08}px`,
                                                            height: `${starSize * 0.08}px`,
                                                            borderRadius: '50%',
                                                            background: starItem.tier === 4 ? '#fbbf24' : starItem.glowColor,
                                                            transform: `translate(-50%, -50%) translate(${(i - 0.5) * 4}px, 0) scale(0)`,
                                                            pointerEvents: 'none',
                                                            zIndex: 2,
                                                            '--px': `${(i - 0.5) * 4}px`,
                                                            animation: `floatParticle 2s ease-out infinite`,
                                                            animationDelay: `${(idx % 3) * 0.6 + i * 0.3}s`
                                                        }}
                                                    />
                                                ))}
                                            </>
                                        )}
                                    </div>
                                )
                            })}
                        </div>
                    )}
                </>
            )}
        </motion.div>
    )
}, (prev, next) => {
    return prev.student === next.student &&
        prev.color === next.color &&
        prev.menuOpenId === next.menuOpenId &&
        prev.pulseId === next.pulseId &&
        prev.index === next.index;
})

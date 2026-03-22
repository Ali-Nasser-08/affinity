import { colorValues } from '../engine/serotoninEngine'

export function Confetti({ show, colors }) {
    if (!show) return null

    const confettiColors = colors || Object.values(colorValues)
    const pieces = Array.from({ length: 40 }, (_, i) => ({
        id: i,
        left: Math.random() * 100,
        color: confettiColors[Math.floor(Math.random() * confettiColors.length)],
        delay: Math.random() * 0.4,
        size: 6 + Math.random() * 6
    }))

    return (
        <div className="confetti">
            {pieces.map(p => (
                <div
                    key={p.id}
                    className="confetti-piece"
                    style={{
                        left: `${p.left}%`,
                        backgroundColor: p.color,
                        width: p.size,
                        height: p.size,
                        animationDelay: `${p.delay}s`,
                        borderRadius: Math.random() > 0.5 ? '50%' : '0'
                    }}
                />
            ))}
        </div>
    )
}

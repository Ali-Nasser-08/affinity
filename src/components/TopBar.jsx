import { motion } from 'framer-motion'
import { colorValues } from '../engine/serotoninEngine'

export function TopBar({ title, onBack, color, children }) {
    return (
        <div className="students-top-bar">
            <button
                className="bar-primary"
                style={{
                    borderColor: colorValues[color],
                    '--bar-accent': colorValues[color],
                    '--bar-base-bg': 'white',
                    '--bar-base-text': colorValues[color],
                    '--bar-shadow': `${colorValues[color]}33`,
                    padding: '12px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    aspectRatio: '1 / 1',
                    borderRadius: '50%'
                }}
                onClick={onBack}
            >
                <span
                    className="material-symbols-rounded"
                    style={{
                        fontSize: 32,
                        fontVariationSettings: "'wght' 700"
                    }}
                >
                    arrow_back
                </span>
            </button>
            <div className="students-title">{title}</div>
            <div className="students-stars">
                {children}
            </div>
        </div>
    )
}

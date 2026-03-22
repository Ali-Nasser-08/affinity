import { motion } from 'framer-motion'
import { useAnimatedTitle } from '../hooks/useAnimatedTitle'
import { BackArrow } from './BackArrow'

export function ListScreenWithTitle({ items, onSelect, onBack, renderItem, onAccentChange, userName }) {
    const { title, color } = useAnimatedTitle({
        onColorChange: onAccentChange,
        initialColor: 'cyan',
        userName
    })

    return (
        <motion.div
            className="main-content"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
        >
            <BackArrow onClick={onBack} color={color} />

            {title}

            <div className="menu-grid">
                {items.map((item, i) => (
                    <motion.div
                        key={item.key || i}
                        className="menu-item"
                        initial={{ scale: 0.8, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        transition={{ delay: 0.2 + i * 0.08 }}
                    >
                        {renderItem(item, color, i)}
                    </motion.div>
                ))}
            </div>
        </motion.div>
    )
}

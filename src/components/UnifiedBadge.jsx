
// ... (existing imports)

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
                justifyContent: 'center'
            }}
        >
            {label}
        </motion.div>
    )
}

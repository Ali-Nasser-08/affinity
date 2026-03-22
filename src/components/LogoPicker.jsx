import { memo } from 'react'

// Memoized LogoItem component
const LogoItem = memo(({ logo, isActive, activeBg, inactiveBg, inactiveBorder, inactiveColor, onClick }) => {
    return (
        <button
            className={`logo-choice ${isActive ? 'active' : ''}`}
            onClick={onClick}
            style={{
                background: isActive ? activeBg : inactiveBg,
                borderColor: isActive ? activeBg : inactiveBorder,
                transform: isActive ? 'scale(1.1)' : 'none'
            }}
        >
            <span
                className="material-symbols-rounded material-filled student-icon"
                style={{ 
                    color: isActive ? '#fff' : inactiveColor,
                    transition: 'color 0.2s ease'
                }}
            >
                {logo.id}
            </span>
        </button>
    )
}, (prev, next) => {
    return prev.isActive === next.isActive && 
           prev.activeBg === next.activeBg && 
           prev.inactiveBg === next.inactiveBg && 
           prev.inactiveBorder === next.inactiveBorder && 
           prev.inactiveColor === next.inactiveColor &&
           prev.logo.id === next.logo.id;
})

// Memoized LogoPicker component
export const LogoPicker = memo(({ options, selectedId, onSelect, activeColor, baseColor }) => {
    return (
        <div className="logo-picker">
            {options.map((logo) => (
                <LogoItem
                    key={logo.id}
                    logo={logo}
                    isActive={selectedId === logo.id}
                    activeBg={activeColor}
                    inactiveBg={baseColor ? `${baseColor}1a` : '#fafafa'}
                    inactiveBorder={baseColor ? `${baseColor}33` : '#eee'}
                    inactiveColor={baseColor || '#666'}
                    onClick={() => onSelect(logo.id)}
                />
            ))}
        </div>
    )
})

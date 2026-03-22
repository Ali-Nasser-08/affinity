// Serotonin Engine - Color Logic & Palettes

export const accentColors = ['cyan', 'pink', 'lime', 'purple', 'red', 'yellow', 'blue', 'orange', 'teal']

// Color Scheme Configuration for Grammar Cards
// Each accent has coordinated colorize, badge, and highlight variants

export const colorValues = {
    cyan: '#00D9FF',
    pink: '#FF006E',
    lime: '#7CB518',
    purple: '#A855F7',
    red: '#FF0000',
    yellow: '#FFBF00',
    blue: '#4A90E2',
    orange: '#FF8A00',
    teal: '#2ED9C3'
}

export const accentColorSchemes = {
    cyan: {
        // Colorize variants (for text coloring - verbs, key terms)
        colorize1: '#00D9FF',  // cyan - primary accent (matches current accent)
        colorize2: '#FF006E',  // pink - vibrant contrast
        colorize3: '#7CB518',  // lime - fresh, energetic

        // Badge variants (for pill-shaped backgrounds - grammar structures)
        // MUST match colorize variants for consistent structure-example color pairing
        badge1: '#00D9FF',     // cyan - matches colorize1
        badge2: '#FF006E',     // pink - matches colorize2
        badge3: '#7CB518',     // lime - matches colorize3

        // Highlight variants (for background highlights - tense names)
        highlight1: '#00D9FF', // cyan - primary (matches current accent)
        highlight2: '#2ED9C3', // teal - harmonious neighbor
        highlight3: '#4A90E2'  // blue - cooler cousin
    },

    pink: {
        // Colorize variants
        colorize1: '#FF006E',  // pink - primary accent (matches current accent)
        colorize2: '#A855F7',  // purple - rich complement
        colorize3: '#FF8A00',  // orange - warm harmony

        // Badge variants - MUST match colorize variants
        badge1: '#FF006E',     // pink - matches colorize1
        badge2: '#A855F7',     // purple - matches colorize2
        badge3: '#FF8A00',     // orange - matches colorize3

        // Highlight variants
        highlight1: '#FF006E', // pink - primary (matches current accent)
        highlight2: '#FF0000', // red - intense neighbor
        highlight3: '#A855F7'  // purple - softer alternative
    },

    lime: {
        // Colorize variants
        colorize1: '#7CB518',  // lime - primary accent (matches current accent)
        colorize2: '#FF8A00',  // orange - warm complement
        colorize3: '#00D9FF',  // cyan - fresh contrast

        // Badge variants - MUST match colorize variants
        badge1: '#7CB518',     // lime - matches colorize1
        badge2: '#FF8A00',     // orange - matches colorize2
        badge3: '#00D9FF',     // cyan - matches colorize3

        // Highlight variants
        highlight1: '#7CB518', // lime - primary (matches current accent)
        highlight2: '#2ED9C3', // teal - aquatic cousin
        highlight3: '#FFBF00'  // yellow - sunny neighbor
    },

    purple: {
        // Colorize variants
        colorize1: '#A855F7',  // purple - primary accent (matches current accent)
        colorize2: '#00D9FF',  // cyan - electric contrast
        colorize3: '#FF006E',  // pink - vibrant harmony

        // Badge variants - MUST match colorize variants
        badge1: '#A855F7',     // purple - matches colorize1
        badge2: '#00D9FF',     // cyan - matches colorize2
        badge3: '#FF006E',     // pink - matches colorize3

        // Highlight variants
        highlight1: '#A855F7', // purple - primary (matches current accent)
        highlight2: '#FF006E', // pink - warmer side
        highlight3: '#4A90E2'  // blue - cooler side
    },

    red: {
        // Colorize variants
        colorize1: '#FF0000',  // red - primary accent (matches current accent)
        colorize2: '#FFBF00',  // yellow - classic combo
        colorize3: '#FF8A00',  // orange - warm gradient

        // Badge variants - MUST match colorize variants
        badge1: '#FF0000',     // red - matches colorize1
        badge2: '#FFBF00',     // yellow - matches colorize2
        badge3: '#FF8A00',     // orange - matches colorize3

        // Highlight variants
        highlight1: '#FF0000', // red - primary (matches current accent)
        highlight2: '#FF006E', // pink - cooler version
        highlight3: '#FF8A00'  // orange - warmer version
    },

    yellow: {
        // Colorize variants
        colorize1: '#FFBF00',  // yellow - primary accent (matches current accent)
        colorize2: '#FF8A00',  // orange - warm neighbor
        colorize3: '#A855F7',  // purple - complementary

        // Badge variants - MUST match colorize variants
        badge1: '#FFBF00',     // yellow - matches colorize1
        badge2: '#FF8A00',     // orange - matches colorize2
        badge3: '#A855F7',     // purple - matches colorize3

        // Highlight variants
        highlight1: '#FFBF00', // yellow - primary (matches current accent)
        highlight2: '#FF8A00', // orange - richer
        highlight3: '#7CB518'  // lime - fresh complement
    },

    blue: {
        // Colorize variants
        colorize1: '#4A90E2',  // blue - primary accent (matches current accent)
        colorize2: '#FF8A00',  // orange - complementary
        colorize3: '#00D9FF',  // cyan - brighter cousin

        // Badge variants - MUST match colorize variants
        badge1: '#4A90E2',     // blue - matches colorize1
        badge2: '#FF8A00',     // orange - matches colorize2
        badge3: '#00D9FF',     // cyan - matches colorize3

        // Highlight variants
        highlight1: '#4A90E2', // blue - primary (matches current accent)
        highlight2: '#00D9FF', // cyan - electric
        highlight3: '#A855F7'  // purple - deeper
    },

    orange: {
        // Colorize variants
        colorize1: '#FF8A00',  // orange - primary accent (matches current accent)
        colorize2: '#4A90E2',  // blue - complementary
        colorize3: '#A855F7',  // purple - rich contrast

        // Badge variants - MUST match colorize variants
        badge1: '#FF8A00',     // orange - matches colorize1
        badge2: '#4A90E2',     // blue - matches colorize2
        badge3: '#A855F7',     // purple - matches colorize3

        // Highlight variants
        highlight1: '#FF8A00', // orange - primary (matches current accent)
        highlight2: '#FF0000', // red - bolder
        highlight3: '#FFBF00'  // yellow - lighter
    },

    teal: {
        // Colorize variants
        colorize1: '#2ED9C3',  // teal - primary accent (matches current accent)
        colorize2: '#FF8A00',  // orange - warm complement
        colorize3: '#FF006E',  // pink - vibrant contrast

        // Badge variants - MUST match colorize variants
        badge1: '#2ED9C3',     // teal - matches colorize1
        badge2: '#FF8A00',     // orange - matches colorize2
        badge3: '#FF006E',     // pink - matches colorize3

        // Highlight variants
        highlight1: '#2ED9C3', // teal - primary (matches current accent)
        highlight2: '#00D9FF', // cyan - electric
        highlight3: '#7CB518'  // lime - natural pair
    }
}

// Usage example:
// const currentAccent = 'cyan';
// const scheme = accentColorSchemes[currentAccent];
// 
// For verbs: use scheme.colorize1, colorize2, colorize3
// For grammar structures (badges): use scheme.badge1, badge2, badge3
// For tense names (highlights): use scheme.highlight1, highlight2, highlight3

/* 
DESIGN PRINCIPLES APPLIED:

1. Colorize variants prioritize CONTRAST and LEGIBILITY
   - Always choose colors that are visually distinct from the primary
   - Mix warm and cool tones for variety
   - Include at least one complementary color

2. Badge variants create VISUAL HIERARCHY
   - badge1 = primary accent (most important)
   - badge2 = strong secondary (emphasis)
   - badge3 = supporting accent (additional context)

3. Highlight variants maintain COHESION
   - Stay within the same color family when possible
   - Use analogous colors (neighbors on color wheel)
   - Provide tonal variation (lighter/darker/shifted hue)

4. All schemes use EXISTING palette colors only
   - Ensures consistency across the entire system
   - No random colors introduced
   - Works harmoniously with the established design system
*/

export const bgTints = {
    cyan: '#D3F4FB',
    pink: '#F9D3E5',
    lime: '#E5EFD8',
    purple: '#ECE0FA',
    red: '#F9D5D5',
    yellow: '#FFF5D6',
    blue: '#DCEBFA',
    orange: '#FFE8CF',
    teal: '#D7F6F1'
}

export const lightTints = {
    cyan: 'rgba(0, 217, 255, 0.15)',
    pink: 'rgba(255, 0, 110, 0.15)',
    lime: 'rgba(124, 181, 24, 0.15)',
    purple: 'rgba(168, 85, 247, 0.15)',
    red: 'rgba(255, 0, 0, 0.15)',
    yellow: 'rgba(255, 191, 0, 0.15)',
    blue: 'rgba(74, 144, 226, 0.15)',
    orange: 'rgba(255, 138, 0, 0.15)',
    teal: 'rgba(46, 217, 195, 0.15)'
}

export const textColors = {
    cyan: '#0099b3',
    pink: '#cc0058',
    lime: '#5a8a10',
    purple: '#7c3aed',
    red: '#DD0000',
    yellow: '#E68A00',
    blue: '#2b6cb0',
    orange: '#D96C00',
    teal: '#148F7F'
}

export const darkBgTints = {
    cyan: '#0a1a1f',
    pink: '#1a0a12',
    lime: '#0a1a0a',
    orange: '#1a120a',
    purple: '#120a1a',
    red: '#1a0a0a',
    yellow: '#1a1608',
    blue: '#0c1322',
    teal: '#0a1a18'
}

// Helper to get a random accent that isn't the current one
export const getRandomAccentExcluding = (current) => {
    const others = accentColors.filter(c => c !== current)
    return others[Math.floor(Math.random() * others.length)]
}

// Helper to pick a random item from a list
export const pickRandom = (list) => list[Math.floor(Math.random() * list.length)]

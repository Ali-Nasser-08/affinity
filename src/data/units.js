import * as megaGoal1 from './books/megaGoal1'
import * as megaGoal2 from './books/megaGoal2'
import * as megaGoal3 from './books/megaGoal3'

export const bookData = {
    'Mega Goal 1': megaGoal1,
    'Mega Goal 2': megaGoal2,
    'Mega Goal 3': megaGoal3
}

export const unitDataMap = megaGoal2.data // Backward compatibility if needed, but we should migrate

// Helper to get available units for a book
export const getBookUnits = (bookName) => {
    return bookData[bookName]?.units || []
}

// Helper to get data for a specific book and unit
export const getUnitData = (bookName, unit) => {
    return bookData[bookName]?.data[unit]
}

// Helper to get unit metadata (title, color, icon)
export const getUnitMeta = (bookName, unit) => {
    return bookData[bookName]?.unitDetails?.[unit] || {
        title: `Unit ${unit}`,
        color: 'cyan',
        icon: 'star'
    }
}

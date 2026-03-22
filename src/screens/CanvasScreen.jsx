import { useState, useEffect, useRef, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { colorValues, textColors } from '../engine/serotoninEngine'
import { Confetti } from '../components/Confetti'
import { generateWhiteboardContent } from '../utils/geminiService'

// ── Fixed color mapping: index → color name ──
const COLOR_ORDER = ['pink', 'yellow', 'lime', 'cyan', 'purple', 'orange', 'blue', 'teal', 'red']

// ── Callout type definitions ──
const CALLOUT_TYPES = [
    { id: 'vocab', label: 'Vocab', icon: 'translate', color: 'pink' },
    { id: 'tip', label: 'Tip', icon: 'lightbulb', color: 'yellow' },
    { id: 'caution', label: 'Caution', icon: 'warning', color: 'orange' },
    { id: 'grammar', label: 'Grammar Rule', icon: 'history_edu', color: 'purple' },
    { id: 'example', label: 'Example', icon: 'format_quote', color: 'cyan' },
    { id: 'practice', label: 'Practice', icon: 'bolt', color: 'lime' },
    { id: 'question', label: 'Question', icon: 'help', color: 'red' },
    { id: 'pronunciation', label: 'Pronunciation', icon: 'volume_up', color: 'teal' },
]

function hexToRgba(hex, alpha) {
    const r = parseInt(hex.slice(1, 3), 16)
    const g = parseInt(hex.slice(3, 5), 16)
    const b = parseInt(hex.slice(5, 7), 16)
    return `rgba(${r}, ${g}, ${b}, ${alpha})`
}

function generateId() {
    return 'canvas_' + Date.now().toString(36) + '_' + Math.random().toString(36).slice(2, 7)
}

const LS_KEY = 'affinity_canvases'

function loadAllCanvases() {
    try {
        const raw = localStorage.getItem(LS_KEY)
        return raw ? JSON.parse(raw) : []
    } catch { return [] }
}

function saveAllCanvases(canvases) {
    localStorage.setItem(LS_KEY, JSON.stringify(canvases))
}

// ══════════════════════════════════════════════════
//  FLAGGER ↔ HTML conversion
// ══════════════════════════════════════════════════

function flaggersToHtml(content, forReading = false) {
    if (!content) return ''
    let html = content

    // Use loop to handle multiple tags
    for (let i = 1; i <= 9; i++) {
        const colorName = COLOR_ORDER[i - 1]
        // Match /c1[optional space]content[optional space]/c1 -> more flexible
        const re = new RegExp(`\\/c${i}\\s*([\\s\\S]*?)\\s*\\/c${i}`, 'g')
        html = html.replace(re, `<span data-type="color" data-idx="${i}" style="color:${textColors[colorName]}">$1</span>`)
    }
    for (let i = 1; i <= 9; i++) {
        const colorName = COLOR_ORDER[i - 1]
        const re = new RegExp(`\\/h${i}\\s*([\\s\\S]*?)\\s*\\/h${i}`, 'g')
        html = html.replace(re, `<span data-type="highlight" data-idx="${i}" style="background-color:${hexToRgba(colorValues[colorName], 0.6)};border-radius:8px;padding:3px 8px;font-weight:500;margin:0 2px">$1</span>`)
    }
    for (let i = 1; i <= 9; i++) {
        const colorName = COLOR_ORDER[i - 1]
        const re = new RegExp(`\\/b${i}\\s*([\\s\\S]*?)\\s*\\/b${i}`, 'g')
        html = html.replace(re, `<span data-type="badge" data-idx="${i}" style="background-color:${colorValues[colorName]};color:white;border-radius:8px;padding:4px 14px;font-weight:600;display:inline-block">$1</span>`)
    }

    html = html.replace(/\/bold\s*([\s\S]*?)\s*\/bold/g, '<strong data-type="bold">$1</strong>')
    html = html.replace(/\/u\s*([\s\S]*?)\s*\/u/g, '<u data-type="u" style="text-decoration:underline;text-decoration-thickness:3px;text-underline-offset:6px">$1</u>')

    // Callout blocks — /callout1:type[Title] body /callout1 (type & title are optional)
    for (let i = 1; i <= 9; i++) {
        const colorName = COLOR_ORDER[i - 1]
        const accent = colorValues[colorName]
        const border = hexToRgba(accent, 0.35)
        const bg = hexToRgba(accent, 0.07)
        const re = new RegExp(`\\/callout${i}(?::([a-z]+))?(?:\\[([^\\]]*?)\\])?\\s*([\\s\\S]*?)\\s*\\/callout${i}`, 'g')
        html = html.replace(re, (_, ctype, title, body) => {
            const calloutType = ctype || ''
            const typeAttr = calloutType ? ` data-callout-type="${calloutType}"` : ''
            const typeInfo = CALLOUT_TYPES.find(t => t.id === calloutType)
            const vars = `--callout-accent:${accent};--callout-border:${border};--callout-bg:${bg};`

            // Build icon HTML for the title (Example has no logo)
            let iconHtml = ''
            if (typeInfo && calloutType !== 'example') {
                iconHtml = `<span data-type="callout-icon" class="material-symbols-rounded" contenteditable="false" style="color:${accent};font-size:1.3em;display:inline-flex;align-items:center;justify-content:center;width:36px;height:36px;background:${hexToRgba(accent, 0.12)};border-radius:11px;margin-right:32px;user-select:none;flex-shrink:0;">${typeInfo.icon}</span>`
            }

            const isExplicit = title !== undefined
            const displayTitle = isExplicit ? title : (typeInfo ? typeInfo.label : '')
            const isDefault = !isExplicit
            const titleHtml = `<div data-type="callout-title" style="color:${accent};font-family:'Fredoka', sans-serif;">${iconHtml}<span data-type="callout-title-text" data-is-default="${isDefault}">${displayTitle}</span></div>`

            // Practice type: includes done button
            if (calloutType === 'practice') {
                const doneBtn = `<div data-type="callout-done-wrap" contenteditable="false"><button data-type="callout-done-btn" style="--btn-color:${accent}"><span class="material-symbols-rounded" style="font-size:16px;">check_circle</span>Done</button></div>`
                return `<div data-type="callout" data-idx="${i}"${typeAttr} style="${vars}">${titleHtml}<span data-type="callout-body">${body}</span>${doneBtn}</div>`
            }

            return `<div data-type="callout" data-idx="${i}"${typeAttr} style="${vars}">${titleHtml}<span data-type="callout-body">${body}</span></div>`
        })
    }

    return html
}

function htmlToFlaggers(htmlString) {
    if (!htmlString) return ''
    let text = htmlString

    // Convert callout divs (must come before other replacements to avoid nested conflicts)
    // First strip callout-icon spans, reveal buttons, done buttons, and answer wrappers from the HTML
    text = text.replace(/<span data-type="callout-icon"[^>]*>[\s\S]*?<\/span>/g, '')
    text = text.replace(/<button data-type="callout-reveal-btn"[^>]*>[\s\S]*?<\/button>/g, '')
    text = text.replace(/<button data-type="callout-done-btn"[^>]*>[\s\S]*?<\/button>/g, '')
    text = text.replace(/<div data-type="callout-done-wrap"[^>]*>[\s\S]*?<\/div>/g, '')
    // Convert callout divs
    text = text.replace(/<div data-type="callout" data-idx="(\d+)"([^>]*)>(?:<div data-type="callout-title"[^>]*>([\s\S]*?)<\/div>)?<span data-type="callout-body">([\s\S]*?)<\/span><\/div>/g,
        (_, idx, attrs, titleHtml, bodyHtml) => {
            const typeMatch = attrs.match(/data-callout-type="([a-z]+)"/)
            const ctype = typeMatch ? typeMatch[1] : ''
            const typeInfo = CALLOUT_TYPES.find(t => t.id === ctype)
            const typeSuffix = ctype ? `:${ctype}` : ''

            // Extract pure text title and check if it's default
            const titleSpanMatch = (titleHtml || "").match(/<span data-type="callout-title-text"[^>]+data-is-default="([^"]+)"[^>]*>([\s\S]*?)<\/span>/)
            const isDefault = titleSpanMatch ? titleSpanMatch[1] === 'true' : false
            let cleanTitle = titleSpanMatch ? titleSpanMatch[2] : (titleHtml || "")
            cleanTitle = cleanTitle.replace(/<[^>]+>/g, '').replace(/\u200B/g, '').trim()

            // If it was default and hasn't changed, don't save brackets
            // If it was changed or empty, save with brackets []
            const titleFlaggerPart = isDefault && (cleanTitle === (typeInfo ? typeInfo.label : ''))
                ? ''
                : `[${cleanTitle}]`

            // Clean the body of interactive elements
            const cleanBody = (bodyHtml || "")
                .replace(/<button data-type="callout-reveal-btn"[^>]*>[\s\S]*?<\/button>/g, '')
                .replace(/<div data-type="callout-done-wrap"[^>]*>[\s\S]*?<\/div>/g, '')
                .replace(/\u200B/g, '')
                .trim()

            return `/callout${idx}${typeSuffix}${titleFlaggerPart} ${cleanBody} /callout${idx}`
        }
    )
    // Convert colored spans
    text = text.replace(/<span data-type="color" data-idx="(\d+)"[^>]*>([\s\S]*?)<\/span>/g, '/c$1 $2 /c$1')
    // Convert highlight spans
    text = text.replace(/<span data-type="highlight" data-idx="(\d+)"[^>]*>([\s\S]*?)<\/span>/g, '/h$1 $2 /h$1')
    // Convert badge spans
    text = text.replace(/<span data-type="badge" data-idx="(\d+)"[^>]*>([\s\S]*?)<\/span>/g, '/b$1 $2 /b$1')
    // Convert bold
    text = text.replace(/<strong data-type="bold">([\s\S]*?)<\/strong>/g, '/bold $1 /bold')
    // Convert underline
    text = text.replace(/<u data-type="u"[^>]*>([\s\S]*?)<\/u>/g, '/u $1 /u')

    return text
}

// ── Color button component ──
function ColorBtn({ color, onClick, label, size = 30 }) {
    return (
        <motion.button
            type="button"
            title={label}
            whileHover={{ scale: 1.25, y: -2 }}
            whileTap={{ scale: 0.85 }}
            onClick={onClick}
            style={{
                width: size,
                height: size,
                borderRadius: '50%',
                backgroundColor: color,
                border: '2px solid rgba(255,255,255,0.5)',
                cursor: 'pointer',
                boxShadow: `0 3px 10px ${hexToRgba(color, 0.4)}`,
                transition: 'box-shadow 0.2s ease',
                flexShrink: 0
            }}
        />
    )
}


// ══════════════════════════════════════════════════
//  CANVAS SCREEN
// ══════════════════════════════════════════════════

export function CanvasScreen({ onBack }) {
    const [canvasId, setCanvasId] = useState(null)
    const [canvasName, setCanvasName] = useState('Untitled Canvas')
    const [rawContent, setRawContent] = useState('') // flagger string, source of truth
    const [savedCanvases, setSavedCanvases] = useState(loadAllCanvases)
    const [showDrawer, setShowDrawer] = useState(false)

    const [showToolbar, setShowToolbar] = useState(false)
    const [toolbarPos, setToolbarPos] = useState({ x: 0, y: 0 })
    const [hasSelection, setHasSelection] = useState(false)
    const [editingName, setEditingName] = useState(false)
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(null)
    const [showMenu, setShowMenu] = useState(false)
    const [toolbarSection, setToolbarSection] = useState(null)
    const [isTyping, setIsTyping] = useState(false)
    const [fontSizeIndex, setFontSizeIndex] = useState(0) // 0: 42px, 1: 64px, 2: 86px, 3: 110px
    const [showSaved, setShowSaved] = useState(false)
    const [showAiModal, setShowAiModal] = useState(false)
    const [aiPrompt, setAiPrompt] = useState('')
    const [aiGenerating, setAiGenerating] = useState(false)
    const [aiError, setAiError] = useState(null)
    const [showTopCalloutPicker, setShowTopCalloutPicker] = useState(false)
    const [showConfetti, setShowConfetti] = useState(false)

    const canvasRef = useRef(null)
    const autoSaveTimer = useRef(null)
    const isComposing = useRef(false)
    const suppressSync = useRef(false)
    const typingTimeoutRef = useRef(null)
    const saveTimeoutRef = useRef(null)

    const FONT_SIZES = [42, 64, 86, 110]



    // ── Initialize ──
    useEffect(() => {
        if (!canvasId) setCanvasId(generateId())
    }, [])

    useEffect(() => {
        if (!canvasRef.current) return
        canvasRef.current.innerHTML = flaggersToHtml(rawContent, false)
    }, [canvasId])

    // ── Handle double-click to select word without trailing space ──
    useEffect(() => {
        const el = canvasRef.current
        if (!el) return

        const handleDblClick = () => {
            setTimeout(() => {
                const sel = window.getSelection()
                if (!sel || sel.rangeCount === 0) return
                const text = sel.toString()
                // If selection ends with whitespace, trim it
                if (text && /\s$/.test(text)) {
                    const range = sel.getRangeAt(0)
                    // Move end back by the number of trailing whitespace chars
                    const trimmed = text.replace(/\s+$/, '')
                    const diff = text.length - trimmed.length
                    if (diff > 0 && range.endContainer.nodeType === Node.TEXT_NODE) {
                        range.setEnd(range.endContainer, range.endOffset - diff)
                        sel.removeAllRanges()
                        sel.addRange(range)
                    }
                }
            }, 0)
        }

        el.addEventListener('dblclick', handleDblClick)
        return () => el.removeEventListener('dblclick', handleDblClick)
    }, [])

    // ── Click delegation for callout interactive buttons ──
    useEffect(() => {
        const handleCalloutClicks = (e) => {
            // Done button: trigger confetti
            const doneBtn = e.target.closest('[data-type="callout-done-btn"]')
            if (doneBtn) {
                e.preventDefault()
                e.stopPropagation()
                doneBtn.classList.add('callout-done-clicked')
                doneBtn.innerHTML = '<span class="material-symbols-rounded" style="font-size:16px;">check_circle</span>Done!'
                setShowConfetti(true)
                setTimeout(() => setShowConfetti(false), 2000)
                return
            }
            // Reveal button: toggle answer visibility
            const revealBtn = e.target.closest('[data-type="callout-reveal-btn"]')
            if (revealBtn) {
                e.preventDefault()
                e.stopPropagation()
                const answerWrap = revealBtn.parentNode
                if (answerWrap) {
                    const current = answerWrap.getAttribute('data-revealed')
                    answerWrap.setAttribute('data-revealed', current === 'true' ? 'false' : 'true')
                    if (current === 'true') {
                        revealBtn.innerHTML = '<span class="material-symbols-rounded" style="font-size:16px;">visibility</span>Reveal Answer'
                    } else {
                        revealBtn.innerHTML = '<span class="material-symbols-rounded" style="font-size:16px;">visibility_off</span>Hide Answer'
                    }
                }
                return
            }
        }
        document.addEventListener('click', handleCalloutClicks)
        return () => document.removeEventListener('click', handleCalloutClicks)
    }, [])

    // ── Handle contentEditable input → update rawContent ──
    const handleInput = useCallback(() => {
        if (!canvasRef.current || isComposing.current) return
        // Check for data-flag spans and reconstruct flaggers
        const flagged = htmlToFlaggers(canvasRef.current.innerHTML)
        suppressSync.current = true
        setRawContent(flagged)
        // Allow sync to happen again after React re-renders
        requestAnimationFrame(() => { suppressSync.current = false })
    }, [])

    // ── Save ──
    const handleSave = useCallback((isManual = false) => {
        const all = loadAllCanvases()
        const now = new Date().toISOString()
        const existing = all.findIndex(c => c.id === canvasId)

        const data = {
            id: canvasId,
            name: canvasName,
            content: rawContent,
            createdAt: existing >= 0 ? all[existing].createdAt : now,
            updatedAt: now
        }

        if (existing >= 0) {
            all[existing] = data
        } else {
            all.unshift(data)
        }

        saveAllCanvases(all)
        setSavedCanvases(all)

        // Manual save trigger (when called from keyboard shortcut or button)
        if (isManual === true) {
            setShowSaved(true)
            if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current)
            saveTimeoutRef.current = setTimeout(() => setShowSaved(false), 1200)
        }
    }, [canvasId, canvasName, rawContent])

    // ── Auto-save every 30s ──
    useEffect(() => {
        autoSaveTimer.current = setInterval(() => {
            if (rawContent.trim()) handleSave()
        }, 30000)
        return () => clearInterval(autoSaveTimer.current)
    }, [handleSave, rawContent])



    // ── Selection detection ──
    const checkSelection = useCallback(() => {
        const sel = window.getSelection()
        if (sel && sel.rangeCount > 0 && !sel.isCollapsed) {
            const range = sel.getRangeAt(0)
            const rect = range.getBoundingClientRect()
            if (rect.width > 0) {
                setToolbarPos({
                    x: Math.min(Math.max(rect.left + rect.width / 2 - 190, 16), window.innerWidth - 400),
                    y: Math.max(rect.top - 70, 10)
                })
                setHasSelection(true)
                setShowToolbar(true)
                return
            }
        }
        setHasSelection(false)
        setShowToolbar(false)
        setToolbarSection(null)
    }, [])

    useEffect(() => {
        document.addEventListener('selectionchange', checkSelection)
        return () => document.removeEventListener('selectionchange', checkSelection)
    }, [checkSelection])

    // ── Apply styles directly to DOM (WYSIWYG) ──
    const applyStyle = useCallback((type, styleStr, tag = 'span', idx = null) => {
        const sel = window.getSelection()
        if (!sel || sel.isCollapsed || !canvasRef.current) return

        const range = sel.getRangeAt(0)
        const container = document.createElement("div")
        container.appendChild(range.cloneContents())
        const innerHtml = container.innerHTML

        if (!innerHtml.trim()) return

        let htmlToInsert = ''
        const idxAttr = idx !== null ? ` data-idx="${idx}"` : ''

        if (tag === 'strong') {
            htmlToInsert = `<strong data-type="bold">${innerHtml}</strong>`
        } else if (tag === 'u') {
            htmlToInsert = `<u data-type="u" style="${styleStr}">${innerHtml}</u>`
        } else {
            htmlToInsert = `<span data-type="${type}"${idxAttr} style="${styleStr}">${innerHtml}</span>`
        }

        document.execCommand('insertHTML', false, htmlToInsert)

        // Convert DOM -> Flaggers to keep state in sync and persistent
        const flagged = htmlToFlaggers(canvasRef.current.innerHTML)

        suppressSync.current = true
        setRawContent(flagged)
        requestAnimationFrame(() => { suppressSync.current = false })

        sel.removeAllRanges()
        setShowToolbar(false)
        setToolbarSection(null)
    }, [])

    const applyColorize = useCallback((index) => applyStyle('color', `color:${textColors[COLOR_ORDER[index]]}`, 'span', index + 1), [applyStyle])
    const applyHighlight = useCallback((index) => applyStyle('highlight', `background-color:${hexToRgba(colorValues[COLOR_ORDER[index]], 0.6)};border-radius:8px;padding:3px 8px;font-weight:500;margin:0 2px`, 'span', index + 1), [applyStyle])
    const applyBadge = useCallback((index) => applyStyle('badge', `background-color:${colorValues[COLOR_ORDER[index]]};color:white;border-radius:8px;padding:4px 14px;font-weight:600;display:inline-block`, 'span', index + 1), [applyStyle])
    const applyBold = useCallback(() => applyStyle('bold', '', 'strong'), [applyStyle])
    const applyUnderline = useCallback(() => applyStyle('u', 'text-decoration:underline;text-decoration-thickness:3px;text-underline-offset:6px', 'u'), [applyStyle])

    const applyCallout = useCallback((calloutTypeId) => {
        const sel = window.getSelection()
        if (!sel || !canvasRef.current || sel.rangeCount === 0) return

        let range = sel.getRangeAt(0)
        let parentCallout = range.startContainer.parentElement?.closest('[data-type="callout"]')

        // If inside a callout, move selection to after it to prevent nesting
        if (parentCallout) {
            range = document.createRange()
            range.setStartAfter(parentCallout)
            range.collapse(true)
            sel.removeAllRanges()
            sel.addRange(range)
        }

        const typeInfo = CALLOUT_TYPES.find(t => t.id === calloutTypeId)
        if (!typeInfo) return

        let body = ''
        if (!sel.isCollapsed) {
            const range = sel.getRangeAt(0)
            const container = document.createElement('div')
            container.appendChild(range.cloneContents())
            body = container.innerHTML
        }

        if (!body.trim()) body = 'Enter text here...'

        const colorName = typeInfo.color
        const colorIdx = COLOR_ORDER.indexOf(colorName) + 1
        const accent = colorValues[colorName]
        const border = hexToRgba(accent, 0.35)
        const bg = hexToRgba(accent, 0.07)
        const vars = `--callout-accent:${accent};--callout-border:${border};--callout-bg:${bg};`
        const typeAttr = ` data-callout-type="${typeInfo.id}"`

        // Build icon
        let iconHtml = `<span data-type="callout-icon" class="material-symbols-rounded" contenteditable="false" style="color:${accent};font-size:1.3em;display:inline-flex;align-items:center;justify-content:center;width:36px;height:36px;background:${hexToRgba(accent, 0.12)};border-radius:11px;margin-right:32px;user-select:none;flex-shrink:0;">${typeInfo.icon}</span>`


        let htmlToInsert = ''
        const titleText = typeInfo.label
        const titleHtml = `<div data-type="callout-title" style="color:${accent};font-family:'Fredoka', sans-serif;">${iconHtml}<span data-type="callout-title-text" data-is-default="true">${titleText}</span></div>`

        if (typeInfo.id === 'practice') {
            const doneBtn = `<div data-type="callout-done-wrap" contenteditable="false"><button data-type="callout-done-btn" style="--btn-color:${accent}"><span class="material-symbols-rounded" style="font-size:16px;">check_circle</span>Done</button></div>`
            htmlToInsert = `<div data-type="callout" data-idx="${colorIdx}"${typeAttr} style="${vars}">${titleHtml}<span data-type="callout-body">${body}</span>${doneBtn}</div><div><br></div>`
        } else if (typeInfo.id === 'vocab') {
            const tableHtml = `<div data-type="vocab-grid" style="display:grid;grid-template-columns:1fr 1fr;gap:12px;margin-top:8px;"><div style="font-weight:700;border-bottom:2px solid ${hexToRgba(accent, 0.2)};padding-bottom:4px;">Word</div><div style="font-weight:700;border-bottom:2px solid ${hexToRgba(accent, 0.2)};padding-bottom:4px;">Translation</div><div>New Word</div><div>Meaning...</div></div>`
            htmlToInsert = `<div data-type="callout" data-idx="${colorIdx}"${typeAttr} style="${vars}">${titleHtml}<span data-type="callout-body">${tableHtml}</span></div><div><br></div>`
        } else if (typeInfo.id === 'example') {
            // Examples have the title row but usually it's empty/placeholder
            const exampleTitleHtml = `<div data-type="callout-title" style="color:${accent};font-family:'Fredoka', sans-serif;"><span data-type="callout-title-text" data-is-default="false"></span></div>`
            htmlToInsert = `<div data-type="callout" data-idx="${colorIdx}"${typeAttr} style="${vars}">${exampleTitleHtml}<span data-type="callout-body">${body}</span></div><div><br></div>`
        } else {
            htmlToInsert = `<div data-type="callout" data-idx="${colorIdx}"${typeAttr} style="${vars}">${titleHtml}<span data-type="callout-body">${body}</span></div><div><br></div>`
        }

        document.execCommand('insertHTML', false, htmlToInsert)

        const flagged = htmlToFlaggers(canvasRef.current.innerHTML)
        suppressSync.current = true
        setRawContent(flagged)
        requestAnimationFrame(() => { suppressSync.current = false })

        sel.removeAllRanges()
        setShowToolbar(false)
        setToolbarSection(null)
        setShowTopCalloutPicker(false)
    }, [])

    const clearFormatting = useCallback(() => {
        const sel = window.getSelection()
        if (!sel || !canvasRef.current) return

        let node = sel.anchorNode
        let unwrapDone = false
        while (node && node !== canvasRef.current) {
            if (node.nodeType === Node.ELEMENT_NODE && (node.hasAttribute('data-type') || node.tagName === 'STRONG' || node.tagName === 'U' || node.tagName === 'SPAN' || node.tagName === 'DIV')) {
                const parent = node.parentNode
                while (node.firstChild) parent.insertBefore(node.firstChild, node)
                parent.removeChild(node)
                unwrapDone = true
                break
            }
            node = node.parentNode
        }

        if (!unwrapDone && !sel.isCollapsed) {
            document.execCommand('insertText', false, sel.toString())
        }

        suppressSync.current = true
        setRawContent(canvasRef.current.innerHTML)
        requestAnimationFrame(() => { suppressSync.current = false })

        sel.removeAllRanges()
        setShowToolbar(false)
        setToolbarSection(null)
    }, [])

    // ── Keyboard shortcuts ──
    useEffect(() => {
        const handleKey = (e) => {
            const isMod = e.ctrlKey || e.metaKey
            const isAlt = e.altKey
            const isShift = e.shiftKey

            if (isMod && e.key === 's') {
                e.preventDefault()
                handleSave(true)
                return
            }

            if (isMod && e.key === 'b') {
                e.preventDefault()
                applyBold()
                return
            }

            if (isMod && e.key === 'u') {
                e.preventDefault()
                applyUnderline()
                return
            }

            if (isMod && e.key === '\\') {
                e.preventDefault()
                clearFormatting()
                return
            }

            // --- Numbered Gestures (1-9) ---
            const num = parseInt(e.key)
            if (num >= 1 && num <= 9) {
                const idx = num - 1

                // Ctrl + Alt + Num -> Badge
                if (isMod && isAlt) {
                    e.preventDefault()
                    applyBadge(idx)
                    return
                }

                // Alt + Shift + Num -> Highlight
                if (isAlt && isShift) {
                    e.preventDefault()
                    applyHighlight(idx)
                    return
                }

                // Alt + Num -> Colorize
                if (isAlt) {
                    e.preventDefault()
                    applyColorize(idx)
                    return
                }
            }

            // Undo/Redo (Z, Y) are handled natively by contentEditable
        }
        window.addEventListener('keydown', handleKey)
        return () => window.removeEventListener('keydown', handleKey)
    }, [handleSave, applyBold, applyUnderline, clearFormatting, applyBadge, applyHighlight, applyColorize, applyCallout])

    // ── Load ──
    const handleLoad = useCallback((canvas) => {
        setCanvasId(canvas.id)
        setCanvasName(canvas.name)
        setRawContent(canvas.content)
        setShowDrawer(false)
    }, [])

    // ── New canvas ──
    const handleNew = useCallback(() => {
        if (rawContent.trim()) handleSave()
        setCanvasId(generateId())
        setCanvasName('Untitled Canvas')
        setRawContent('')
        if (canvasRef.current) canvasRef.current.innerHTML = ''
        setShowDrawer(false)
    }, [handleSave, rawContent])

    // ── Delete ──
    const handleDelete = useCallback((id) => {
        const all = loadAllCanvases().filter(c => c.id !== id)
        saveAllCanvases(all)
        setSavedCanvases(all)
        setShowDeleteConfirm(null)
        if (canvasId === id) handleNew()
    }, [canvasId, handleNew])

    // ── AI Whiteboard Generation ──
    const handleAiGenerate = useCallback(async () => {
        if (!aiPrompt.trim() || aiGenerating) return
        setAiGenerating(true)
        setAiError(null)
        try {
            const content = await generateWhiteboardContent(aiPrompt.trim())
            setRawContent(content)
            if (canvasRef.current) {
                canvasRef.current.innerHTML = flaggersToHtml(content)
            }
            setShowAiModal(false)
            setAiPrompt('')
        } catch (err) {
            setAiError(err.message || 'Generation failed. Please try again.')
        } finally {
            setAiGenerating(false)
        }
    }, [aiPrompt, aiGenerating])



    return (
        <motion.div
            className="canvas-screen"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
        >
            {/* ══ EDIT MODE ══ */}
            <>
                {/* ── Floating Controls ── */}
                <AnimatePresence>
                    {!isTyping && (
                        <motion.div
                            className="canvas-floating-top"
                            initial={{ opacity: 0, y: -20 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -20 }}
                            transition={{ duration: 0.2 }}
                        >
                            <div className="canvas-top-left">
                                <motion.button
                                    className="canvas-top-btn"
                                    onClick={onBack}
                                    whileHover={{ scale: 1.08 }}
                                    whileTap={{ scale: 0.95 }}
                                    title="Back"
                                >
                                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                        <path d="M19 12H5" /><path d="M12 19l-7-7 7-7" />
                                    </svg>
                                </motion.button>

                                <div className="canvas-name-area" onClick={() => setEditingName(true)}>
                                    {editingName ? (
                                        <input
                                            className="canvas-name-input"
                                            value={canvasName}
                                            onChange={e => setCanvasName(e.target.value)}
                                            onBlur={() => setEditingName(false)}
                                            onKeyDown={e => { if (e.key === 'Enter') setEditingName(false) }}
                                            autoFocus
                                        />
                                    ) : (
                                        <span className="canvas-name-display">{canvasName}</span>
                                    )}
                                </div>

                                <div className="canvas-header-callout-picker-wrap">
                                    <motion.button
                                        className="canvas-top-btn"
                                        onClick={() => setShowTopCalloutPicker(!showTopCalloutPicker)}
                                        whileHover={{ scale: 1.08 }}
                                        whileTap={{ scale: 0.95 }}
                                        title="Insert Callout"
                                        style={{ width: 34, height: 34, background: showTopCalloutPicker ? 'var(--purple)' : 'var(--purple-light)', color: showTopCalloutPicker ? 'white' : 'var(--purple)' }}
                                    >
                                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                            <rect x="3" y="5" width="18" height="14" rx="3" />
                                            <line x1="3" y1="9" x2="21" y2="9" strokeWidth="2.5" />
                                            <path d="M12 12v4" /><path d="M10 14h4" />
                                        </svg>
                                    </motion.button>

                                    <AnimatePresence>
                                        {showTopCalloutPicker && (
                                            <>
                                                <div className="canvas-menu-backdrop" onClick={() => setShowTopCalloutPicker(false)} style={{ zIndex: 190 }} />
                                                <motion.div
                                                    className="canvas-top-callout-type-picker"
                                                    initial={{ opacity: 0, y: 10, scale: 0.9 }}
                                                    animate={{ opacity: 1, y: 0, scale: 1 }}
                                                    exit={{ opacity: 0, y: 10, scale: 0.9 }}
                                                    transition={{ type: 'spring', stiffness: 400, damping: 25 }}
                                                >
                                                    <div className="callout-picker-title">Insert Callout</div>
                                                    <div className="callout-picker-grid">
                                                        {CALLOUT_TYPES.map((ct) => {
                                                            const accent = colorValues[ct.color]
                                                            return (
                                                                <motion.button
                                                                    key={ct.id}
                                                                    className="callout-picker-item"
                                                                    onClick={() => applyCallout(ct.id)}
                                                                    whileHover={{ scale: 1.04, y: -2 }}
                                                                    whileTap={{ scale: 0.96 }}
                                                                    style={{ '--picker-accent': accent }}
                                                                >
                                                                    <span className="callout-picker-icon-wrap" style={{ background: hexToRgba(accent, 0.12), color: accent }}>
                                                                        {ct.icon === 'G'
                                                                            ? <span style={{ fontWeight: 900, fontSize: 18, fontFamily: 'var(--font-display)' }}>G</span>
                                                                            : <span className="material-symbols-rounded" style={{ fontSize: 20 }}>{ct.icon}</span>
                                                                        }
                                                                    </span>
                                                                    <span className="callout-picker-label">{ct.label}</span>
                                                                    <span className="callout-picker-color-dot" style={{ background: accent }} />
                                                                </motion.button>
                                                            )
                                                        })}
                                                    </div>
                                                </motion.div>
                                            </>
                                        )}
                                    </AnimatePresence>
                                </div>
                            </div>

                            <div className="canvas-top-actions">
                                <motion.button
                                    className="canvas-top-btn"
                                    onClick={() => setFontSizeIndex(prev => (prev + 1) % FONT_SIZES.length)}
                                    whileHover={{ scale: 1.08 }}
                                    whileTap={{ scale: 0.95 }}
                                    title="Change Text Size"
                                >
                                    <span className="material-symbols-rounded" style={{ fontSize: 24 }}>format_size</span>
                                </motion.button>

                                <motion.button
                                    className="canvas-top-btn canvas-save-btn"
                                    onClick={() => handleSave(true)}
                                    whileHover={{ scale: 1.08 }}
                                    whileTap={{ scale: 0.95 }}
                                    title="Save (Ctrl+S)"
                                >
                                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                                        <path d="M19 21H5a2 2 0 01-2-2V5a2 2 0 012-2h11l5 5v11a2 2 0 01-2 2z" />
                                        <polyline points="17 21 17 13 7 13 7 21" />
                                        <polyline points="7 3 7 8 15 8" />
                                    </svg>
                                </motion.button>

                                <motion.button
                                    className="canvas-top-btn canvas-ai-star-btn"
                                    onClick={() => setShowAiModal(true)}
                                    whileHover={{ scale: 1.12 }}
                                    whileTap={{ scale: 0.92 }}
                                    title="Create a lesson"
                                    style={{ background: 'rgba(168, 85, 247, 0.12)', color: '#A855F7', position: 'relative', overflow: 'hidden' }}
                                >
                                    <span className="material-symbols-rounded" style={{ fontSize: 24 }}>science</span>
                                </motion.button>

                                <motion.button
                                    className="canvas-top-btn"
                                    onClick={() => setShowDrawer(true)}
                                    whileHover={{ scale: 1.08 }}
                                    whileTap={{ scale: 0.95 }}
                                    title="Saved Canvases"
                                >
                                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                                        <path d="M22 19a2 2 0 01-2 2H4a2 2 0 01-2-2V5a2 2 0 012-2h5l2 3h9a2 2 0 012 2z" />
                                    </svg>
                                </motion.button>

                                <div className="canvas-menu-wrapper">
                                    <motion.button
                                        className="canvas-top-btn"
                                        onClick={() => setShowMenu(!showMenu)}
                                        whileHover={{ scale: 1.08 }}
                                        whileTap={{ scale: 0.95 }}
                                        title="Options"
                                    >
                                        <svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor">
                                            <circle cx="12" cy="5" r="2" />
                                            <circle cx="12" cy="12" r="2" />
                                            <circle cx="12" cy="19" r="2" />
                                        </svg>
                                    </motion.button>

                                    <AnimatePresence>
                                        {showMenu && (
                                            <>
                                                <div className="canvas-menu-backdrop" onClick={() => setShowMenu(false)} />
                                                <motion.div
                                                    className="canvas-menu-dropdown"
                                                    initial={{ opacity: 0, y: -8, scale: 0.95 }}
                                                    animate={{ opacity: 1, y: 0, scale: 1 }}
                                                    exit={{ opacity: 0, y: -8, scale: 0.95 }}
                                                    transition={{ type: 'spring', stiffness: 400, damping: 25 }}
                                                >
                                                    <button onClick={() => { handleNew(); setShowMenu(false) }}>
                                                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" /></svg>
                                                        New Canvas
                                                    </button>
                                                    <button onClick={() => { setRawContent(''); if (canvasRef.current) canvasRef.current.innerHTML = ''; setShowMenu(false) }}>
                                                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></svg>
                                                        Clear All
                                                    </button>
                                                </motion.div>
                                            </>
                                        )}
                                    </AnimatePresence>
                                </div>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>

                <AnimatePresence>
                    {showSaved && (
                        <motion.div
                            className="canvas-save-pill"
                            initial={{ opacity: 0, y: -60, scale: 0.4 }}
                            animate={{ opacity: 1, y: 0, scale: 1 }}
                            exit={{ opacity: 0, y: -20, scale: 1.2 }}
                            transition={{ type: 'spring', stiffness: 600, damping: 25 }}
                            style={{
                                position: 'fixed',
                                top: '40px',
                                left: '50%',
                                translateX: '-50%',
                                zIndex: 5000,
                                background: '#7CB518',
                                color: 'white',
                                padding: '10px 28px',
                                borderRadius: '24px',
                                fontFamily: 'var(--font-display)',
                                fontWeight: 800,
                                fontSize: '15px',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '10px',
                                boxShadow: '0 10px 40px rgba(124, 181, 24, 0.45)',
                                pointerEvents: 'none',
                                overflow: 'hidden'
                            }}
                        >
                            {/* Cute Ripple Effect */}
                            <motion.div
                                initial={{ scale: 0, opacity: 0.6 }}
                                animate={{ scale: 4, opacity: 0 }}
                                transition={{ duration: 0.6, ease: "easeOut" }}
                                style={{
                                    position: 'absolute',
                                    inset: 0,
                                    background: 'rgba(255,255,255,0.4)',
                                    borderRadius: 'inherit',
                                    zIndex: -1
                                }}
                            />
                            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round">
                                <polyline points="20 6 9 17 4 12" />
                            </svg>
                            <span>SAVED</span>
                        </motion.div>
                    )}
                </AnimatePresence>

                {/* ── FULL-SCREEN Editable Canvas ── */}
                <div
                    ref={canvasRef}
                    className="canvas-editable"
                    style={{ fontSize: FONT_SIZES[fontSizeIndex] }}
                    contentEditable
                    suppressContentEditableWarning
                    data-placeholder="Start typing here..."
                    spellCheck={false}
                    onInput={handleInput}
                    onMouseDown={(e) => {
                        if (e.target === canvasRef.current) {
                            // If clicking empty space at bottom, ensure caret isn't trapped
                            setTimeout(() => {
                                if (!canvasRef.current) return
                                const last = canvasRef.current.lastElementChild

                                // If already ends in a plain div, just focus it
                                if (last && !last.hasAttribute('data-type') && last.tagName === 'DIV') {
                                    const sel = window.getSelection()
                                    const range = document.createRange()
                                    range.selectNodeContents(last)
                                    range.collapse(false)
                                    sel.removeAllRanges()
                                    sel.addRange(range)
                                    return
                                }

                                // If ends in a callout, add a clean bridge
                                if (last && last.getAttribute('data-type') === 'callout') {
                                    const buffer = document.createElement('div')
                                    buffer.innerHTML = '<br>'
                                    canvasRef.current.appendChild(buffer)
                                    const sel = window.getSelection()
                                    const range = document.createRange()
                                    range.setStart(buffer, 0)
                                    range.collapse(true)
                                    sel.removeAllRanges()
                                    sel.addRange(range)
                                }
                            }, 10)
                        }
                    }}
                    onKeyDown={(e) => {
                        // Typing feedback
                        setIsTyping(true)
                        if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current)
                        typingTimeoutRef.current = setTimeout(() => setIsTyping(false), 1500)

                        // Handle deleting the entire callout box via logo removal
                        if (e.key === 'Backspace') {
                            const sel = window.getSelection()
                            if (sel && sel.isCollapsed) {
                                const range = sel.getRangeAt(0)
                                let node = range.startContainer
                                let offset = range.startOffset

                                // Check if the cursor is at the beginning of the title text segment (just after the logo)
                                if (node.nodeType === Node.TEXT_NODE && offset === 0) {
                                    const titleDiv = node.parentElement.closest('[data-type="callout-title"]')
                                    if (titleDiv) {
                                        // The text comes directly after the icon node.
                                        // Since the icon is atomic, if we are at offset 0, backspacing would delete the icon.
                                        // Instead, we remove the whole box.
                                        const callout = titleDiv.closest('[data-type="callout"]')
                                        if (callout) {
                                            e.preventDefault()
                                            callout.remove()
                                            handleInput()
                                        }
                                    }
                                } else if (node.nodeType === Node.ELEMENT_NODE && node.getAttribute('data-type') === 'callout-title') {
                                    // Sometimes selection targets the div itself if empty
                                    if (offset === 0 || (offset === 1 && node.querySelector('[data-type="callout-icon"]'))) {
                                        const callout = node.closest('[data-type="callout"]')
                                        if (callout) {
                                            e.preventDefault()
                                            callout.remove()
                                            handleInput()
                                        }
                                    }
                                }
                            }
                        }
                    }}
                    onCompositionStart={() => { isComposing.current = true }}
                    onCompositionEnd={() => { isComposing.current = false; handleInput() }}
                />

                {/* ── Floating Toolbar ── */}
                <AnimatePresence>
                    {showToolbar && hasSelection && (
                        <motion.div
                            className="canvas-toolbar"
                            initial={{ opacity: 0, y: 8, scale: 0.92 }}
                            animate={{ opacity: 1, y: 0, scale: 1 }}
                            exit={{ opacity: 0, y: 8, scale: 0.92 }}
                            transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                            style={{ left: toolbarPos.x, top: toolbarPos.y }}
                            onMouseDown={e => e.preventDefault()}
                        >
                            <div className="canvas-toolbar-main">
                                <motion.button
                                    className={`canvas-tb-btn ${toolbarSection === 'text' ? 'canvas-tb-btn-active' : ''}`}
                                    onClick={() => setToolbarSection(toolbarSection === 'text' ? null : 'text')}
                                    whileHover={{ scale: 1.05 }}
                                    whileTap={{ scale: 0.95 }}
                                >
                                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 1 }}>
                                        <span style={{ fontSize: 16, fontWeight: 800 }}>A</span>
                                        <div className="canvas-tb-color-bar" style={{ background: 'linear-gradient(90deg, #FF006E, #FFBF00, #7CB518, #00D9FF, #A855F7)' }} />
                                    </div>
                                </motion.button>

                                <motion.button
                                    className={`canvas-tb-btn ${toolbarSection === 'fill' ? 'canvas-tb-btn-active' : ''}`}
                                    onClick={() => setToolbarSection(toolbarSection === 'fill' ? null : 'fill')}
                                    whileHover={{ scale: 1.05 }}
                                    whileTap={{ scale: 0.95 }}
                                >
                                    <span style={{ backgroundColor: '#FFBF00', color: 'black', padding: '1px 6px', borderRadius: '4px', fontWeight: 800 }}>H</span>
                                </motion.button>

                                <motion.button
                                    className={`canvas-tb-btn ${toolbarSection === 'badge' ? 'canvas-tb-btn-active' : ''}`}
                                    onClick={() => setToolbarSection(toolbarSection === 'badge' ? null : 'badge')}
                                    whileHover={{ scale: 1.05 }}
                                    whileTap={{ scale: 0.95 }}
                                >
                                    <span style={{ backgroundColor: '#A855F7', color: 'white', padding: '2px 8px', borderRadius: '8px', fontWeight: 800, fontSize: '11px' }}>B</span>
                                </motion.button>

                                <motion.button
                                    className={`canvas-tb-btn ${toolbarSection === 'callout' ? 'canvas-tb-btn-active' : ''}`}
                                    onClick={() => setToolbarSection(toolbarSection === 'callout' ? null : 'callout')}
                                    whileHover={{ scale: 1.05 }}
                                    whileTap={{ scale: 0.95 }}
                                >
                                    <span style={{ border: '2.5px solid #FF006E', color: '#FF006E', padding: '1px 6px', borderRadius: '7px', fontWeight: 800 }}>C</span>
                                </motion.button>

                                <div className="canvas-tb-sep" />

                                <motion.button className="canvas-tb-btn" onClick={applyBold}
                                    whileHover={{ scale: 1.08 }} whileTap={{ scale: 0.92 }} title="Bold">
                                    <strong style={{ fontSize: 16 }}>B</strong>
                                </motion.button>

                                <motion.button className="canvas-tb-btn" onClick={applyUnderline}
                                    whileHover={{ scale: 1.08 }} whileTap={{ scale: 0.92 }} title="Underline">
                                    <span style={{ textDecoration: 'underline', fontSize: 16, fontWeight: 600 }}>U</span>
                                </motion.button>

                                <div className="canvas-tb-sep" />

                                <motion.button className="canvas-tb-btn canvas-tb-clear" onClick={clearFormatting}
                                    whileHover={{ scale: 1.08 }} whileTap={{ scale: 0.92 }} title="Clear Formatting">
                                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></svg>
                                </motion.button>
                            </div>

                            <AnimatePresence>
                                {toolbarSection === 'text' && (
                                    <motion.div className="canvas-toolbar-colors-row"
                                        initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }}
                                        exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.2 }}>
                                        {COLOR_ORDER.map((name, i) => (
                                            <ColorBtn key={i} color={textColors[name]} label={`Text: ${name}`} size={32} onClick={() => applyColorize(i)} />
                                        ))}
                                    </motion.div>
                                )}
                                {toolbarSection === 'fill' && (
                                    <motion.div className="canvas-toolbar-colors-row"
                                        initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }}
                                        exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.2 }}>
                                        {COLOR_ORDER.map((name, i) => (
                                            <ColorBtn key={i} color={colorValues[name]} label={`Highlight: ${name}`} size={32} onClick={() => applyHighlight(i)} />
                                        ))}
                                    </motion.div>
                                )}
                                {toolbarSection === 'badge' && (
                                    <motion.div className="canvas-toolbar-colors-row"
                                        initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }}
                                        exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.2 }}>
                                        {COLOR_ORDER.map((name, i) => (
                                            <ColorBtn key={i} color={colorValues[name]} label={`Badge: ${name}`} size={32} onClick={() => applyBadge(i)} />
                                        ))}
                                    </motion.div>
                                )}
                                {toolbarSection === 'callout' && (
                                    <motion.div className="canvas-toolbar-callout-types"
                                        initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }}
                                        exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.2 }}>
                                        {CALLOUT_TYPES.map((ct) => {
                                            const accent = colorValues[ct.color]
                                            return (
                                                <motion.button
                                                    key={ct.id}
                                                    className="canvas-tb-callout-type-btn"
                                                    onClick={() => applyCallout(ct.id)}
                                                    whileHover={{ scale: 1.08 }}
                                                    whileTap={{ scale: 0.92 }}
                                                    title={ct.label}
                                                    style={{ color: accent, background: hexToRgba(accent, 0.1) }}
                                                >
                                                    {ct.icon === 'G'
                                                        ? <span style={{ fontWeight: 900, fontSize: 13, fontFamily: 'var(--font-display)' }}>G</span>
                                                        : <span className="material-symbols-rounded" style={{ fontSize: 16 }}>{ct.icon}</span>
                                                    }
                                                </motion.button>
                                            )
                                        })}
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </motion.div>
                    )}
                </AnimatePresence>
            </>

            {/* ── Saved Canvases Drawer ── */}
            <AnimatePresence>
                {showDrawer && (
                    <>
                        <motion.div className="canvas-drawer-overlay"
                            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                            onClick={() => setShowDrawer(false)} />
                        <motion.div className="canvas-drawer"
                            initial={{ x: '100%' }} animate={{ x: 0 }} exit={{ x: '100%' }}
                            transition={{ type: 'spring', stiffness: 300, damping: 30 }}>
                            <div className="canvas-drawer-header">
                                <h3>Saved Canvases</h3>
                                <motion.button className="canvas-top-btn" onClick={() => setShowDrawer(false)}
                                    whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}>
                                    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></svg>
                                </motion.button>
                            </div>

                            <motion.button className="canvas-new-btn" onClick={handleNew}
                                whileHover={{ scale: 1.02, y: -2 }} whileTap={{ scale: 0.98 }}>
                                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" /></svg>
                                New Canvas
                            </motion.button>

                            <div className="canvas-drawer-list">
                                {savedCanvases.length === 0 ? (
                                    <div className="canvas-empty-state">
                                        <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#ccc" strokeWidth="1.5">
                                            <rect x="3" y="3" width="18" height="18" rx="2" />
                                            <line x1="3" y1="9" x2="21" y2="9" />
                                            <line x1="9" y1="21" x2="9" y2="9" />
                                        </svg>
                                        <p>No saved canvases yet</p>
                                    </div>
                                ) : (
                                    savedCanvases.map(canvas => (
                                        <motion.div key={canvas.id}
                                            className={`canvas-saved-item ${canvas.id === canvasId ? 'canvas-saved-active' : ''}`}
                                            whileHover={{ scale: 1.01 }}
                                            onClick={() => handleLoad(canvas)}
                                            onContextMenu={(e) => { e.preventDefault(); setShowDeleteConfirm(canvas.id) }}>
                                            <div className="canvas-saved-name">{canvas.name}</div>
                                            <div className="canvas-saved-preview">
                                                {canvas.content.replace(/\/(callout[1-9](\[[^\]]*\])?|c[1-9]|h[1-9]|b[1-9]|bold|u|s[1-3]) ?/g, '').slice(0, 80)}
                                                {canvas.content.length > 80 ? '...' : ''}
                                            </div>
                                            <div className="canvas-saved-date">
                                                {new Date(canvas.updatedAt).toLocaleDateString('en-US', {
                                                    month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit'
                                                })}
                                            </div>
                                            {showDeleteConfirm === canvas.id && (
                                                <motion.div className="canvas-delete-confirm"
                                                    initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}
                                                    onClick={e => e.stopPropagation()}>
                                                    <span>Delete?</span>
                                                    <button onClick={() => handleDelete(canvas.id)}>Yes</button>
                                                    <button onClick={() => setShowDeleteConfirm(null)}>No</button>
                                                </motion.div>
                                            )}
                                        </motion.div>
                                    ))
                                )}
                            </div>
                        </motion.div>
                    </>
                )}
            </AnimatePresence>

            {/* ── AI Generation Modal ── */}
            <AnimatePresence>
                {showAiModal && (
                    <>
                        <motion.div className="canvas-drawer-overlay"
                            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                            onClick={() => { if (!aiGenerating) { setShowAiModal(false); setAiError(null) } }}
                            style={{ zIndex: 6000 }}
                        />
                        <motion.div
                            className="canvas-ai-modal"
                            initial={{ opacity: 0, scale: 0.9, x: '-50%', y: '-40%' }}
                            animate={{ opacity: 1, scale: 1, x: '-50%', y: '-50%' }}
                            exit={{ opacity: 0, scale: 0.9, x: '-50%', y: '-40%' }}
                            transition={{ type: 'spring', stiffness: 400, damping: 28 }}
                            style={{
                                position: 'fixed',
                                top: '50%',
                                left: '50%',
                                background: 'white',
                                width: '520px',
                                maxWidth: '92vw',
                                padding: '28px 28px 24px',
                                borderRadius: '28px',
                                boxShadow: '0 25px 80px rgba(168, 85, 247, 0.18), 0 8px 32px rgba(0,0,0,0.08)',
                                zIndex: 7000,
                                display: 'flex',
                                flexDirection: 'column',
                                gap: '18px',
                                border: '1.5px solid rgba(168, 85, 247, 0.12)',
                            }}
                        >
                            {/* Header */}
                            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                <div style={{
                                    width: 44, height: 44, borderRadius: 14,
                                    background: 'linear-gradient(135deg, #A855F7, #7C3AED)',
                                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                                    flexShrink: 0
                                }}>
                                    <span className="material-symbols-rounded" style={{ color: 'white', fontSize: 24 }}>science</span>
                                </div>
                                <div>
                                    <h3 style={{ fontFamily: 'var(--font-display)', margin: 0, fontSize: '20px', fontWeight: 800, color: '#1a1a2e' }}>Create a lesson</h3>
                                    <p style={{ margin: 0, fontSize: '14px', color: '#888', fontWeight: 500 }}>Brew a beautiful whiteboard instantly</p>
                                </div>
                            </div>

                            {/* Input */}
                            <div style={{ position: 'relative' }}>
                                <textarea
                                    value={aiPrompt}
                                    onChange={e => setAiPrompt(e.target.value)}
                                    onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleAiGenerate() } }}
                                    placeholder='What would you like to teach today?'
                                    disabled={aiGenerating}
                                    autoFocus
                                    style={{
                                        width: '100%', minHeight: '140px', background: aiGenerating ? 'rgba(168, 85, 247, 0.03)' : '#f8fafc',
                                        border: `3px solid ${aiPrompt ? '#A855F7' : '#e2e8f0'}`, borderRadius: '16px',
                                        padding: '18px', color: '#1e293b', fontSize: '18px', fontFamily: 'var(--font-display)', fontWeight: 500,
                                        resize: 'vertical', outline: 'none', transition: 'border-color 0.2s', boxSizing: 'border-box',
                                    }}
                                    onFocus={e => { e.target.style.borderColor = '#A855F7'; e.target.style.boxShadow = '0 0 0 4px rgba(168, 85, 247, 0.1)' }}
                                    onBlur={e => { e.target.style.borderColor = aiPrompt ? '#A855F7' : '#e2e8f0'; e.target.style.boxShadow = 'none' }}
                                />
                            </div>

                            {/* Error */}
                            <AnimatePresence>
                                {aiError && (
                                    <motion.div
                                        initial={{ opacity: 0, height: 0 }}
                                        animate={{ opacity: 1, height: 'auto' }}
                                        exit={{ opacity: 0, height: 0 }}
                                        style={{
                                            background: 'rgba(255, 0, 0, 0.06)',
                                            borderRadius: '12px',
                                            padding: '10px 14px',
                                            color: '#cc0000',
                                            fontSize: '13px',
                                            fontWeight: 500,
                                            display: 'flex',
                                            alignItems: 'center',
                                            gap: '8px',
                                        }}
                                    >
                                        <span className="material-symbols-rounded" style={{ fontSize: 18 }}>error</span>
                                        {aiError}
                                    </motion.div>
                                )}
                            </AnimatePresence>

                            {/* Actions */}
                            <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end', alignItems: 'center' }}>
                                <button
                                    onClick={() => { setShowAiModal(false); setAiError(null) }}
                                    disabled={aiGenerating}
                                    style={{
                                        background: 'rgba(0,0,0,0.04)',
                                        border: 'none',
                                        padding: '12px 24px',
                                        borderRadius: '14px',
                                        cursor: aiGenerating ? 'default' : 'pointer',
                                        fontFamily: 'var(--font-display)',
                                        fontWeight: 600,
                                        fontSize: '15px',
                                        color: '#666',
                                        opacity: aiGenerating ? 0.5 : 1,
                                    }}
                                >Cancel</button>
                                <motion.button
                                    onClick={handleAiGenerate}
                                    disabled={!aiPrompt.trim() || aiGenerating}
                                    whileHover={!aiGenerating && aiPrompt.trim() ? { scale: 1.03 } : {}}
                                    whileTap={!aiGenerating && aiPrompt.trim() ? { scale: 0.97 } : {}}
                                    style={{
                                        background: (!aiPrompt.trim() || aiGenerating) ? '#e2e8f0' : 'linear-gradient(135deg, #A855F7, #7C3AED)',
                                        color: (!aiPrompt.trim() || aiGenerating) ? '#94a3b8' : 'white',
                                        border: 'none',
                                        padding: '12px 28px',
                                        borderRadius: '14px',
                                        cursor: (!aiPrompt.trim() || aiGenerating) ? 'not-allowed' : 'pointer',
                                        fontFamily: 'var(--font-display)',
                                        fontWeight: 800,
                                        fontSize: '15px',
                                        boxShadow: (!aiPrompt.trim() || aiGenerating) ? 'none' : '0 6px 20px rgba(168, 85, 247, 0.35)',
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '8px',
                                        transition: 'all 0.2s ease',
                                        justifyContent: 'center',
                                    }}
                                >
                                    {aiGenerating ? (
                                        <>
                                            <motion.span
                                                className="material-symbols-rounded"
                                                animate={{ rotate: 360 }}
                                                transition={{ repeat: Infinity, duration: 1.5, ease: 'linear' }}
                                                style={{ fontSize: 20 }}
                                            >
                                                autorenew
                                            </motion.span>
                                            Brewing...
                                        </>
                                    ) : (
                                        <>
                                            <span className="material-symbols-rounded" style={{ fontSize: 20 }}>science</span>
                                            Craft lesson
                                        </>
                                    )}
                                </motion.button>
                            </div>
                        </motion.div>
                    </>
                )}
            </AnimatePresence>

            {/* ── Confetti for Practice callout Done button ── */}
            <Confetti show={showConfetti} />
        </motion.div>
    )
}




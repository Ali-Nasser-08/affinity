/**
 * Unit Tests: src/utils/geminiService.js
 *
 * Tests:
 *  - containsForbiddenContent (via generateLesson / generateWhiteboardContent)
 *  - generateLesson: fetch mocking, JSON parsing, markdown-fence stripping,
 *    type enforcement, error cases
 *  - generateWhiteboardContent: fetch mocking, cleanup, error cases
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { generateLesson, generateWhiteboardContent } from '../../utils/geminiService'

// ─── Helper: build a mock fetch response ────────────────────────────────────
function makeFetchResponse(body, ok = true, status = 200) {
    return Promise.resolve({
        ok,
        status,
        text: () => Promise.resolve(typeof body === 'string' ? body : JSON.stringify(body)),
        json: () => Promise.resolve(body)
    })
}

function geminiResponse(text) {
    return {
        candidates: [{ content: { parts: [{ text }] } }]
    }
}

const VALID_LESSON_JSON = JSON.stringify({
    lesson: {
        id: 'custom_123',
        title: 'Present Simple',
        items: [
            { type: 'general', title_badges: ['Grammar'], english: 'We use present simple for habits.', arabic: 'نستخدم المضارع البسيط للعادات.' },
            { type: 'vocab', word: 'habit', word_type: 'noun', definition: 'Something done regularly.', arabic: 'عادة', synonyms: ['routine', 'practice'], example: 'Exercise is a good habit.' },
            { type: 'question', question: 'She _____ to school every day.', options: ['go', 'goes', 'going', 'gone'], answer: 'goes', explanation: 'Third person singular takes -s.', arabic_hint: 'الفاعل مفرد غائب' }
        ]
    }
})

beforeEach(() => {
    vi.stubGlobal('fetch', vi.fn())
})

afterEach(() => {
    vi.unstubAllGlobals()
})

// ══════════════════════════════════════════════════════════════════════════════
// Forbidden content filter
// ══════════════════════════════════════════════════════════════════════════════

describe('generateLesson — forbidden content filter', () => {
    const FORBIDDEN_TOPICS = [
        'sex education',
        'alcohol consumption',
        'gambling strategies',
        'weapons training',
        'drug use',
        'romantic relationships',
        'lgbtq rights',
        'religion class',
        'political elections',
        'kill the mosquito',
    ]

    it.each(FORBIDDEN_TOPICS)('rejects forbidden topic: "%s"', async (topic) => {
        await expect(generateLesson(topic)).rejects.toThrow(
            "This topic isn't suitable for classroom content"
        )
    })

    it('does not flag safe educational topics', async () => {
        fetch.mockReturnValue(makeFetchResponse(geminiResponse(VALID_LESSON_JSON)))
        await expect(generateLesson('present simple tense')).resolves.toBeDefined()
    })

    it('does not flag partial word matches (between ≠ bet)', async () => {
        fetch.mockReturnValue(makeFetchResponse(geminiResponse(VALID_LESSON_JSON)))
        await expect(generateLesson('the space between planets')).resolves.toBeDefined()
    })

    it('does not flag partial word matches (making ≠ king)', async () => {
        fetch.mockReturnValue(makeFetchResponse(geminiResponse(VALID_LESSON_JSON)))
        await expect(generateLesson('making friends at school')).resolves.toBeDefined()
    })
})

// ══════════════════════════════════════════════════════════════════════════════
// generateLesson — happy paths
// ══════════════════════════════════════════════════════════════════════════════

describe('generateLesson — happy path', () => {
    it('returns parsed lesson object on success', async () => {
        fetch.mockReturnValue(makeFetchResponse(geminiResponse(VALID_LESSON_JSON)))
        const result = await generateLesson('present simple')
        expect(result.lesson).toBeDefined()
        expect(result.lesson.items).toHaveLength(3)
    })

    it('strips leading ```json fence from response', async () => {
        const fenced = '```json\n' + VALID_LESSON_JSON + '\n```'
        fetch.mockReturnValue(makeFetchResponse(geminiResponse(fenced)))
        const result = await generateLesson('vocabulary')
        expect(result.lesson.title).toBe('Present Simple')
    })

    it('strips leading ``` fence from response', async () => {
        const fenced = '```\n' + VALID_LESSON_JSON + '\n```'
        fetch.mockReturnValue(makeFetchResponse(geminiResponse(fenced)))
        const result = await generateLesson('vocabulary')
        expect(result.lesson.title).toBe('Present Simple')
    })

    it('passes correct lessonType in the request body', async () => {
        fetch.mockReturnValue(makeFetchResponse(geminiResponse(VALID_LESSON_JSON)))
        await generateLesson('vocabulary', 'vocab')
        const body = JSON.parse(fetch.mock.calls[0][1].body)
        const promptText = body.contents[0].parts[1].text
        expect(promptText).toContain('vocab')
    })

    it('defaults to auto lessonType when not specified', async () => {
        fetch.mockReturnValue(makeFetchResponse(geminiResponse(VALID_LESSON_JSON)))
        await generateLesson('daily routines')
        const body = JSON.parse(fetch.mock.calls[0][1].body)
        const promptText = body.contents[0].parts[1].text
        expect(promptText).toContain('auto')
    })
})

// ══════════════════════════════════════════════════════════════════════════════
// generateLesson — type enforcement
// ══════════════════════════════════════════════════════════════════════════════

describe('generateLesson — type enforcement (post-processing)', () => {
    it('filters out non-question items when type is "questions"', async () => {
        fetch.mockReturnValue(makeFetchResponse(geminiResponse(VALID_LESSON_JSON)))
        const result = await generateLesson('grammar', 'questions')
        result.lesson.items.forEach(item => expect(item.type).toBe('question'))
    })

    it('filters out non-vocab items when type is "vocab"', async () => {
        fetch.mockReturnValue(makeFetchResponse(geminiResponse(VALID_LESSON_JSON)))
        const result = await generateLesson('vocabulary', 'vocab')
        result.lesson.items.forEach(item => expect(item.type).toBe('vocab'))
    })

    it('filters out non-general items when type is "general"', async () => {
        fetch.mockReturnValue(makeFetchResponse(geminiResponse(VALID_LESSON_JSON)))
        const result = await generateLesson('reading', 'general')
        result.lesson.items.forEach(item => expect(item.type).toBe('general'))
    })

    it('throws when type enforcement produces zero items', async () => {
        const noMatchLesson = JSON.stringify({
            lesson: { id: 'x', title: 'Test', items: [{ type: 'general', english: 'x', arabic: 'x', title_badges: [] }] }
        })
        fetch.mockReturnValue(makeFetchResponse(geminiResponse(noMatchLesson)))
        await expect(generateLesson('test', 'questions')).rejects.toThrow(
            'No valid items generated for the requested type'
        )
    })

    it('does not filter items when type is "auto"', async () => {
        fetch.mockReturnValue(makeFetchResponse(geminiResponse(VALID_LESSON_JSON)))
        const result = await generateLesson('mixed topic', 'auto')
        expect(result.lesson.items).toHaveLength(3)
    })
})

// ══════════════════════════════════════════════════════════════════════════════
// generateLesson — error handling
// ══════════════════════════════════════════════════════════════════════════════

describe('generateLesson — error handling', () => {
    it('throws when API returns non-ok status', async () => {
        fetch.mockReturnValue(makeFetchResponse('Bad Request', false, 400))
        await expect(generateLesson('past simple')).rejects.toThrow('API request failed: 400')
    })

    it('throws when response has no text content', async () => {
        fetch.mockReturnValue(makeFetchResponse(geminiResponse(null)))
        await expect(generateLesson('past simple')).rejects.toThrow('No content received from API')
    })

    it('throws when response is not valid JSON', async () => {
        fetch.mockReturnValue(makeFetchResponse(geminiResponse('not json at all')))
        await expect(generateLesson('past simple')).rejects.toThrow('Failed to parse lesson JSON')
    })

    it('throws when lesson structure is missing "items" array', async () => {
        const bad = JSON.stringify({ lesson: { id: 'x', title: 'Bad' } })
        fetch.mockReturnValue(makeFetchResponse(geminiResponse(bad)))
        await expect(generateLesson('past simple')).rejects.toThrow('Failed to parse lesson JSON')
    })

    it('throws when lesson key is missing entirely', async () => {
        const bad = JSON.stringify({ something: 'else' })
        fetch.mockReturnValue(makeFetchResponse(geminiResponse(bad)))
        await expect(generateLesson('past simple')).rejects.toThrow('Failed to parse lesson JSON')
    })
})

// ══════════════════════════════════════════════════════════════════════════════
// generateWhiteboardContent
// ══════════════════════════════════════════════════════════════════════════════

describe('generateWhiteboardContent — forbidden content', () => {
    it('rejects forbidden topics', async () => {
        await expect(generateWhiteboardContent('alcohol and beer')).rejects.toThrow(
            "This topic isn't suitable for classroom content"
        )
    })
})

describe('generateWhiteboardContent — happy path', () => {
    it('returns flagger-formatted string on success', async () => {
        const whiteboardText = '/b1 Present Simple /b1\n\nWe use it for habits.'
        fetch.mockReturnValue(makeFetchResponse(geminiResponse(whiteboardText)))
        const result = await generateWhiteboardContent('present simple')
        expect(result).toContain('Present Simple')
    })

    it('strips accidental markdown fences from whiteboard response', async () => {
        const fenced = '```\n/b1 Grammar /b1\nKey rule here.\n```'
        fetch.mockReturnValue(makeFetchResponse(geminiResponse(fenced)))
        const result = await generateWhiteboardContent('grammar')
        expect(result).not.toContain('```')
        expect(result).toContain('/b1 Grammar /b1')
    })
})

describe('generateWhiteboardContent — error handling', () => {
    it('throws when API returns non-ok status', async () => {
        fetch.mockReturnValue(makeFetchResponse('Server Error', false, 500))
        await expect(generateWhiteboardContent('school')).rejects.toThrow('API request failed: 500')
    })

    it('throws when response has no text content', async () => {
        fetch.mockReturnValue(makeFetchResponse(geminiResponse(null)))
        await expect(generateWhiteboardContent('school')).rejects.toThrow('No content received from API')
    })
})

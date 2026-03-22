// Gemini Service - Lesson Generation
// This module handles AI-powered lesson content generation

const _dk = () => import.meta.env.VITE_GEMINI_API_KEY

const GEMINI_API_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-3-flash-preview:generateContent';

const containsForbiddenContent = (text) => {
    const forbiddenKeywords = [
        // Sexual
        'sex', 'sexual', 'romantic', 'dating', 'boyfriend', 'girlfriend', 'intimate', 'kiss', 'kisses', 'kissing',
        // Religious
        'god', 'gods', 'allah', 'jesus', 'prophet', 'prophets', 'muhammad', 'quran', 'bible', 'church', 'mosque', 'prayer', 'prayers', 'religion', 'religions', 'christian', 'christians', 'muslim', 'muslims', 'jew', 'jews',
        // Political
        'politics', 'political', 'government', 'governments', 'election', 'elections', 'democracy', 'king', 'kings', 'prince', 'princes',
        // Substances
        'alcohol', 'beer', 'beers', 'wine', 'wines', 'drug', 'drugs', 'smoke', 'smoking', 'cigarette', 'cigarettes',
        // Violence
        'weapon', 'weapons', 'gun', 'guns', 'kill', 'kills', 'killing', 'killed', 'murder', 'murders', 'murdering', 'murdered', 'war', 'wars', 'fight', 'fights', 'fighting', 'fought',
        // Other sensitive
        'gambling', 'bet', 'bets', 'betting', 'casino', 'casinos', 'lgbt', 'lgbtq', 'gay', 'gays', 'lesbian', 'lesbians'
    ];

    // Use regular expression with word boundaries (\b) to prevent partial matches
    // e.g. preventing 'between' from matching 'bet', or 'making' from matching 'king'
    const pattern = new RegExp('\\b(' + forbiddenKeywords.join('|') + ')\\b', 'i');
    return pattern.test(text);
};

const SYSTEM_PROMPT = `You are an educational assistant for Saudi Arabian English classrooms. You are a lesson content generator for an English language learning app. You create structured lesson content in JSON format.

IMPORTANT RULES:
1. You MUST respond with ONLY valid JSON - no markdown, no code fences, no explanation text.
2. The JSON must follow the exact structure shown below.
3. Use in-text formatting tags for rich display:
   - /c1text/c1 = colorize style 1 (primary accent color, bold)
   - /c2text/c2 = colorize style 2 (secondary color)
   - /c3text/c3 = colorize style 3 (tertiary color)
   - /h1text/h1 = highlight style 1 (tinted background, primary)
   - /h2text/h2 = highlight style 2 (tinted background, secondary)
   - /h3text/h3 = highlight style 3 (tinted background, tertiary)
   - /b1text/b1 = badge style 1 (solid background, white text)
   - /b2text/b2 = badge style 2
   - /b3text/b3 = badge style 3
4. Use formatting tags meaningfully - highlight key terms, colorize important grammar points, badge grammatical categories.
5. Always include both English and Arabic content where applicable.
6. For questions, always provide exactly 4 options.

ALLOWED TOPICS:
- English grammar, vocabulary, and language learning
- School subjects (math, science, history, geography, etc.)
- Daily life activities (routines, hobbies, family, friends)
- Food, sports, travel, weather, technology
- Jobs, professions, health, shopping
- Describing people, places, and things
- General knowledge suitable for students

STRICTLY FORBIDDEN - NEVER discuss, mention, or create content about:
- Any sexual content or romantic relationships
- Dating, attraction, or intimate relationships
- Any religious content (Islam, Christianity, Judaism, etc.)
- Religious figures, prophets, holy books, or religious practices
- Political topics, politicians, or government
- Alcohol, drugs, or substances
- Violence, weapons, or harmful activities
- Gambling or betting
- LGBTQ+ topics
- Controversial social issues
- Content that contradicts Islamic values

CONTENT GUIDELINES FOR SYSTEM ASSISTANT:
- Keep all content age-appropriate for middle/high school students
- Use examples about school, family (parents, siblings), friends, and learning
- When creating vocabulary about people, use neutral professional contexts
- Avoid any content that could be culturally sensitive in Saudi Arabia
- If a request touches forbidden topics, politely redirect to appropriate educational content in valid JSON format. Provide an alternative topic instead.

ALWAYS prioritize educational value and cultural appropriateness for Saudi classrooms.

JSON STRUCTURE:
{
  "lesson": {
    "id": "custom_<timestamp>",
    "title": "<descriptive title>",
    "items": [
      {
        "type": "general",
        "title_badges": ["Badge1", "Badge2"],
        "english": "Text with /c1formatting/c1 tags...",
        "arabic": "Arabic text with /c1تنسيق/c1..."
      },
      {
        "type": "vocab",
        "word": "word",
        "word_type": "noun/verb/adjective/adverb/etc",
        "definition": "Definition with /h1key parts/h1 highlighted...",
        "arabic": "Arabic meaning",
        "synonyms": ["syn1", "syn2"],
        "example": "Example sentence using /c1word/c1 in context."
      },
      {
        "type": "question",
        "question": "The question text with blanks as _____",
        "options": ["option1", "option2", "option3", "option4"],
        "answer": "correct_option",
        "explanation": "Why this is correct, with /b1grammar terms/b1 highlighted...",
        "arabic_hint": "Arabic hint text"
      }
    ]
  }
}

LESSON TYPE RULES (STRICTLY ENFORCED):
- "questions": ALL items MUST have type "question". Do NOT include any "general" or "vocab" items. Every single item must be a question.
- "vocab": ALL items MUST have type "vocab". Do NOT include any "general" or "question" items. Every single item must be a vocab card.
- "general": ALL items MUST have type "general". Do NOT include any "vocab" or "question" items. Every single item must be a general explanation.
- "auto": Create a balanced, dynamic mix of all three types. Start with general explanation, then vocab, then questions. Make it feel like a complete mini-lesson.

This is critical. If the lesson type is "questions", generating even a single "general" or "vocab" item is a VIOLATION. The same applies for "vocab" and "general" types.

CONTENT GUIDELINES:
- If the user provides specific questions/words, use them exactly but format them properly with tags.
- If the user provides a topic/prompt, create original content about that topic.
- Generate 18-25 items per lesson depending on complexity.
- Make content educational, clear, and engaging.
- Arabic translations should be accurate and natural.
- Use formatting tags generously but meaningfully - they make the content visually engaging.
- For vocab items, always include at least 2 synonyms and a clear example sentence.
- For question items, make distractors plausible but clearly wrong to an informed student.
- For general items, always include title_badges that categorize the content.`

/**
 * Generate a lesson using the Gemini API
 * @param {string} inputText - The teacher's input (topic, words, questions, etc.)
 * @param {string} lessonType - One of: 'questions', 'vocab', 'general', 'auto'
 * @returns {Promise<object>} - The generated lesson JSON
 */
export async function generateLesson(inputText, lessonType = 'auto') {
    if (containsForbiddenContent(inputText)) {
        throw new Error("This topic isn't suitable for classroom content. Please try an educational topic like grammar, vocabulary, or school subjects.");
    }

    const typeInstructions = {
        questions: 'CRITICAL: Generate ONLY "question" type items. Every item must have "type": "question". Do NOT include any "general" or "vocab" items. Generate 18-25 questions.',
        vocab: 'CRITICAL: Generate ONLY "vocab" type items. Every item must have "type": "vocab". Do NOT include any "general" or "question" items. Generate 18-25 vocab cards.',
        general: 'CRITICAL: Generate ONLY "general" type items. Every item must have "type": "general". Do NOT include any "vocab" or "question" items. Create 18-25 thorough explanations.',
        auto: 'Create a balanced, dynamic lesson mixing "general", "vocab", and "question" types. Start with explanations, then vocabulary, then questions. MUST generate a total of 18-25 items.'
    }

    const userPrompt = `Create a lesson based on this input:

"${inputText}"

Lesson type requested: ${lessonType}

${typeInstructions[lessonType] || typeInstructions.auto}

Respond with ONLY the JSON object. No markdown, no code fences, no extra text.`

    const response = await fetch(`${GEMINI_API_URL}?key=${_dk()}`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            contents: [
                {
                    parts: [
                        { text: SYSTEM_PROMPT },
                        { text: userPrompt }
                    ]
                }
            ],
            generationConfig: {
                temperature: 0.7,
                topP: 0.9,
                topK: 40,
                maxOutputTokens: 8192,
            }
        })
    })

    if (!response.ok) {
        const errorText = await response.text()
        throw new Error(`API request failed: ${response.status} - ${errorText}`)
    }

    const data = await response.json()

    // Extract the text content from Gemini's response
    const textContent = data?.candidates?.[0]?.content?.parts?.[0]?.text

    if (!textContent) {
        throw new Error('No content received from API')
    }

    // Clean up the response - remove any markdown code fences if present
    let cleanedText = textContent.trim()
    if (cleanedText.startsWith('```json')) {
        cleanedText = cleanedText.slice(7)
    } else if (cleanedText.startsWith('```')) {
        cleanedText = cleanedText.slice(3)
    }
    if (cleanedText.endsWith('```')) {
        cleanedText = cleanedText.slice(0, -3)
    }
    cleanedText = cleanedText.trim()

    try {
        const parsed = JSON.parse(cleanedText)
        // Validate basic structure
        if (!parsed.lesson || !parsed.lesson.items || !Array.isArray(parsed.lesson.items)) {
            throw new Error('Invalid lesson structure')
        }

        // Post-processing: strictly enforce item type when not "auto"
        if (lessonType !== 'auto') {
            const allowedType = lessonType === 'questions' ? 'question' : lessonType
            parsed.lesson.items = parsed.lesson.items.filter(item => item.type === allowedType)
            if (parsed.lesson.items.length === 0) {
                throw new Error('No valid items generated for the requested type')
            }
        }

        return parsed
    } catch (e) {
        throw new Error(`Failed to parse lesson JSON: ${e.message}`)
    }
}

// ══════════════════════════════════════════════════
//  WHITEBOARD CONTENT GENERATION
// ══════════════════════════════════════════════════

const WHITEBOARD_SYSTEM_PROMPT = `You are a whiteboard content generator for an English language learning app used in Saudi Arabian classrooms. You create beautifully formatted whiteboard lesson content using a special "flagger" syntax.

FLAGGER SYNTAX REFERENCE:
You MUST use these exact tags to format the output. They are the ONLY way to style content on this whiteboard.

TEXT FORMATTING:
- /c1 text /c1 = Colorize with color 1 (pink - #FF006E)
- /c2 text /c2 = Colorize with color 2 (yellow - #FFBF00)
- /c3 text /c3 = Colorize with color 3 (lime - #7CB518)
- /c4 text /c4 = Colorize with color 4 (cyan - #00D9FF)
- /c5 text /c5 = Colorize with color 5 (purple - #A855F7)
- /c6 text /c6 = Colorize with color 6 (orange - #FF8A00)
- /c7 text /c7 = Colorize with color 7 (blue - #4A90E2)
- /c8 text /c8 = Colorize with color 8 (teal - #2ED9C3)
- /c9 text /c9 = Colorize with color 9 (red - #FF0000)

- /h1 text /h1 = Highlight with tinted background (pink)
- /h2 text /h2 = Highlight with tinted background (yellow)
- /h3 text /h3 = Highlight with tinted background (lime)
- /h4 text /h4 = Highlight with tinted background (cyan)
- /h5 text /h5 = Highlight with tinted background (purple)
- /h6 text /h6 = Highlight with tinted background (orange)
- /h7 text /h7 = Highlight with tinted background (blue)
- /h8 text /h8 = Highlight with tinted background (teal)

- /b1 text /b1 = Badge (solid pink background, white text)
- /b2 text /b2 = Badge (solid yellow background, white text)
- /b3 text /b3 = Badge (solid lime background, white text)
- /b4 text /b4 = Badge (solid cyan background, white text)
- /b5 text /b5 = Badge (solid purple background, white text)
- /b6 text /b6 = Badge (solid orange background, white text)
- /b7 text /b7 = Badge (solid blue background, white text)

- /bold text /bold = Bold text
- /u text /u = Underlined text

CALLOUT BLOCKS (structured content boxes):
- /callout1:vocab[Title] body content /callout1 = Pink vocab callout
- /callout2:tip[Title] body content /callout2 = Yellow tip callout
- /callout6:caution[Title] body content /callout6 = Orange caution callout
- /callout5:grammar[Title] body content /callout5 = Purple grammar rule callout
- /callout4:example[Title] body content /callout4 = Cyan example callout
- /callout3:practice[Title] body content /callout3 = Lime practice callout
- /callout9:question[Title] body content /callout9 = Red question callout
- /callout8:pronunciation[Title] body content /callout8 = Teal pronunciation callout

IMPORTANT OUTPUT RULES:
1. Output ONLY the flagger-formatted text. NO JSON, NO markdown, NO code fences, NO explanations.
2. The output should look like a beautiful, well-structured whiteboard lesson.
3. Use a generous mix of formatting: colorize key terms, highlight important phrases, use badges for categories, and use callout blocks for structured sections.
4. Start with a prominent title using badges or colorized text.
5. Use blank lines between sections for visual breathing room.
6. Structure the content so it flows naturally: title → introduction → key concepts → examples → practice.
7. Make it visually rich but NOT overwhelming — every formatting choice should serve a teaching purpose.
8. Include Arabic translations where helpful (for vocabulary items especially).
9. Use callouts strategically: grammar rules in grammar callouts, examples in example callouts, practice exercises in practice callouts, vocabulary in vocab callouts, tips in tip callouts.
10. Keep paragraphs short and punchy — this is a whiteboard, not a textbook.

CONTENT DESIGN PRINCIPLES:
- Lead with an eye-catching title section using a badge
- Break content into clear, scannable sections
- Use colorize for key vocabulary and grammar terms inline
- Use highlights for emphasis on important phrases
- Use badges sparingly for category labels and section markers
- Use callouts for structured content blocks (rules, examples, exercises)
- Include at least 2-3 callout blocks per lesson for visual variety
- Mix formatting types within callouts too (colorize terms inside callout bodies)
- Add practice exercises or questions near the end when appropriate
- The whiteboard should feel alive, engaging, and easy to follow

ALLOWED TOPICS:
- English grammar, vocabulary, and language learning
- School subjects (math, science, history, geography, etc.)
- Daily life activities (routines, hobbies, family, friends)
- Food, sports, travel, weather, technology
- Jobs, professions, health, shopping
- Describing people, places, and things
- General knowledge suitable for students

STRICTLY FORBIDDEN - NEVER discuss or mention:
- Any sexual content or romantic relationships
- Religious content of any kind
- Political topics
- Alcohol, drugs, or substances
- Violence, weapons, or harmful activities
- Gambling or betting
- LGBTQ+ topics
- Controversial social issues
- Content that contradicts Islamic values

CONTENT GUIDELINES:
- Keep all content age-appropriate for middle/high school students
- Use examples about school, family (parents, siblings), friends, and learning
- If a request touches forbidden topics, politely redirect with a note and provide an alternative educational whiteboard instead`

/**
 * Generate whiteboard content using the Gemini API
 * @param {string} topic - The topic to generate whiteboard content for
 * @returns {Promise<string>} - The generated flagger-formatted content
 */
export async function generateWhiteboardContent(topic) {
    if (containsForbiddenContent(topic)) {
        throw new Error("This topic isn't suitable for classroom content. Please try an educational topic like grammar, vocabulary, or school subjects.")
    }

    const userPrompt = `Create a beautiful, comprehensive whiteboard lesson about:

"${topic}"

Generate rich whiteboard content using flagger syntax. Make it visually stunning with a mix of colorized text, highlights, badges, and callout blocks. Output ONLY the flagger text — no JSON, no markdown fences, no commentary.`

    const response = await fetch(`${GEMINI_API_URL}?key=${_dk()}`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            contents: [
                {
                    parts: [
                        { text: WHITEBOARD_SYSTEM_PROMPT },
                        { text: userPrompt }
                    ]
                }
            ],
            generationConfig: {
                temperature: 0.8,
                topP: 0.92,
                topK: 40,
                maxOutputTokens: 8192,
            }
        })
    })

    if (!response.ok) {
        const errorText = await response.text()
        throw new Error(`API request failed: ${response.status} - ${errorText}`)
    }

    const data = await response.json()

    const textContent = data?.candidates?.[0]?.content?.parts?.[0]?.text

    if (!textContent) {
        throw new Error('No content received from API')
    }

    // Clean up — remove any accidental markdown fences
    let cleaned = textContent.trim()
    if (cleaned.startsWith('```')) {
        cleaned = cleaned.replace(/^```[a-z]*\n?/, '').replace(/\n?```$/, '')
    }

    return cleaned.trim()
}

import { supabase } from './supabaseClient'

// ─── Save all teacher data to Supabase ───────────────────────────────────────
export async function saveToCloud(userId) {
    // ── Student / class data ─────────────────────────────────────────────────
    const classes = JSON.parse(localStorage.getItem('app_classes') || '[]')
    const currentClassId = localStorage.getItem('app_current_class_id') || null

    const { error: studentError } = await supabase
        .from('student_data')
        .upsert(
            { user_id: userId, classes, current_class_id: currentClassId, saved_at: new Date().toISOString() },
            { onConflict: 'user_id' }
        )
    if (studentError) throw new Error(`Students: ${studentError.message}`)

    // ── Lessons (key: app_custom_lessons) ────────────────────────────────────
    const lessons = JSON.parse(localStorage.getItem('app_custom_lessons') || '[]')

    // Delete existing rows then re-insert so we always have a clean snapshot
    const { error: lessonDelErr } = await supabase
        .from('lessons')
        .delete()
        .eq('user_id', userId)
    if (lessonDelErr) throw new Error(`Lessons (delete): ${lessonDelErr.message}`)

    if (lessons.length > 0) {
        const lessonRows = lessons.map(lesson => ({
            user_id: userId,
            title: lesson.title || lesson.topic || 'Untitled Lesson',
            content: lesson
        }))
        const { error: lessonInsErr } = await supabase.from('lessons').insert(lessonRows)
        if (lessonInsErr) throw new Error(`Lessons (insert): ${lessonInsErr.message}`)
    }

    // ── Canvases (key: affinity_canvases) ────────────────────────────────────
    const canvases = JSON.parse(localStorage.getItem('affinity_canvases') || '[]')

    const { error: canvasDelErr } = await supabase
        .from('canvases')
        .delete()
        .eq('user_id', userId)
    if (canvasDelErr) throw new Error(`Canvases (delete): ${canvasDelErr.message}`)

    if (canvases.length > 0) {
        const canvasRows = canvases.map(canvas => ({
            user_id: userId,
            title: canvas.title || canvas.name || 'Untitled Canvas',
            content: canvas
        }))
        const { error: canvasInsErr } = await supabase.from('canvases').insert(canvasRows)
        if (canvasInsErr) throw new Error(`Canvases (insert): ${canvasInsErr.message}`)
    }
}

// ─── Retrieve all teacher data from Supabase ─────────────────────────────────
export async function retrieveFromCloud(userId) {
    // ── Student data ─────────────────────────────────────────────────────────
    const { data: studentData, error: studentError } = await supabase
        .from('student_data')
        .select('*')
        .eq('user_id', userId)
        .maybeSingle()
    if (studentError) throw new Error(`Students: ${studentError.message}`)

    if (studentData) {
        localStorage.setItem('app_classes', JSON.stringify(studentData.classes || []))
        if (studentData.current_class_id) {
            localStorage.setItem('app_current_class_id', studentData.current_class_id)
        }
    }

    // ── Lessons ──────────────────────────────────────────────────────────────
    const { data: lessons, error: lessonsError } = await supabase
        .from('lessons')
        .select('content')
        .eq('user_id', userId)
    if (lessonsError) throw new Error(`Lessons: ${lessonsError.message}`)

    // Only overwrite local data when the cloud actually has content
    if (lessons && lessons.length > 0) {
        localStorage.setItem('app_custom_lessons', JSON.stringify(lessons.map(r => r.content)))
    }

    // ── Canvases ─────────────────────────────────────────────────────────────
    const { data: canvases, error: canvasesError } = await supabase
        .from('canvases')
        .select('content')
        .eq('user_id', userId)
    if (canvasesError) throw new Error(`Canvases: ${canvasesError.message}`)

    if (canvases && canvases.length > 0) {
        localStorage.setItem('affinity_canvases', JSON.stringify(canvases.map(r => r.content)))
    }

    return {
        classes: studentData?.classes || [],
        currentClassId: studentData?.current_class_id || null
    }
}

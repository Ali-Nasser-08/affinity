import { useState, useRef, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { ReportGenerator } from '../components/ReportGenerator'
import { useStudents } from '../hooks/useStudents'
import JSZip from 'jszip'
import { jsPDF } from 'jspdf'

export function ReportsScreen({ onBack, userName }) {
    const title = 'Reports'
    const mainColor = '#A855F7'

    const { classes } = useStudents()
    const [selectedClassId, setSelectedClassId] = useState(classes[0]?.id || '')
    const [reportStudentId, setReportStudentId] = useState('')
    const [isGenerating, setIsGenerating] = useState(false)
    const [progress, setProgress] = useState(0)
    const [statusText, setStatusText] = useState('')

    // Custom Dropdown State
    const [classMenuOpen, setClassMenuOpen] = useState(false)
    const [studentMenuOpen, setStudentMenuOpen] = useState(false)

    const reportGenRef = useRef(null)

    const currentClass = classes.find(c => c.id === selectedClassId)
    const sortedStudents = useMemo(() => {
        const list = currentClass?.students || []
        return [...list].sort((a, b) => (b.stars || []).length - (a.stars || []).length)
    }, [currentClass])

    const handleSingleReport = () => {
        if (!reportStudentId) return
        const selectedSt = sortedStudents.find(s => s.id === reportStudentId)
        if (selectedSt) {
            const rank = sortedStudents.findIndex(s => s.id === reportStudentId) + 1
            reportGenRef.current?.generateStudentReport(selectedSt, rank, sortedStudents.length, selectedSt.stars, currentClass?.name || 'Class', userName)
        }
    }

    const handleAllZip = async () => {
        setIsGenerating(true)
        setProgress(0)
        try {
            const zip = new JSZip()
            const className = currentClass?.name || 'Class'

            for (let i = 0; i < sortedStudents.length; i++) {
                const s = sortedStudents[i]
                setStatusText(`Generating ${s.name} (${i + 1}/${sortedStudents.length})...`)

                const blob = await reportGenRef.current.getStudentReportBlob(s, i + 1, sortedStudents.length, s.stars, className, userName)
                if (blob) {
                    zip.file(`${s.name}_Report.pdf`, blob)
                }
                setProgress(((i + 1) / sortedStudents.length) * 100)
            }
            reportGenRef.current.clearReportData()

            setStatusText('Zipping files...')
            const content = await zip.generateAsync({ type: 'blob' })

            const url = URL.createObjectURL(content)
            const a = document.createElement('a')
            a.href = url
            a.download = `${className}_All_Reports.zip`
            a.click()
            URL.revokeObjectURL(url)
        } catch (e) {
            console.error(e)
        }
        setIsGenerating(false)
        setStatusText('')
        setProgress(0)
    }

    const handleAllPdf = async () => {
        setIsGenerating(true)
        setProgress(0)
        try {
            const className = currentClass?.name || 'Class'
            const finalPdf = new jsPDF('p', 'mm', 'a4')

            for (let i = 0; i < sortedStudents.length; i++) {
                const s = sortedStudents[i]
                setStatusText(`Generating ${s.name} (${i + 1}/${sortedStudents.length})...`)

                const data = await reportGenRef.current.getStudentReportImageData(s, i + 1, sortedStudents.length, s.stars, className, userName)
                if (data) {
                    const pdfWidth = finalPdf.internal.pageSize.getWidth()
                    const pdfHeight = (data.height * pdfWidth) / data.width

                    // If not the first page, add a new page
                    if (i > 0) {
                        finalPdf.addPage()
                    }

                    finalPdf.addImage(data.imgData, 'PNG', 0, 0, pdfWidth, pdfHeight)
                }
                setProgress(((i + 1) / sortedStudents.length) * 100)
            }
            reportGenRef.current.clearReportData()

            setStatusText('Saving PDF...')
            finalPdf.save(`${className}_All_Reports.pdf`)
        } catch (e) {
            console.error(e)
        }
        setIsGenerating(false)
        setStatusText('')
        setProgress(0)
    }

    return (
        <div
            className="main-content reports-screen-container"
            style={{
                '--accent': mainColor,
                backgroundColor: 'white',
                justifyContent: 'flex-start',
                paddingTop: '40px',
                paddingBottom: '40px',
                minHeight: '100vh',
                position: 'relative',
                overflow: 'hidden'
            }}
        >
            <div style={{ maxWidth: '1200px', width: '100%', margin: '0 auto', padding: '0 32px' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '48px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '24px' }}>
                        <button
                            onClick={onBack}
                            style={{
                                background: 'white',
                                border: '2px solid #eaeaea',
                                padding: '12px',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                aspectRatio: '1 / 1',
                                borderRadius: '50%',
                                color: mainColor,
                                cursor: 'pointer',
                                boxShadow: '0 4px 12px rgba(0,0,0,0.05)'
                            }}
                        >
                            <span className="material-symbols-rounded" style={{ fontSize: '32px', fontWeight: 'bold' }}>arrow_back</span>
                        </button>
                        <h1 style={{ margin: 0, fontSize: '36px', fontWeight: 800, color: '#333', fontFamily: 'var(--font-display)' }}>{title}</h1>
                    </div>

                    {/* Improved Custom Dropdown for Class Selection */}
                    <div style={{ position: 'relative', width: '320px' }}>
                        <div
                            onClick={() => !isGenerating && setClassMenuOpen(!classMenuOpen)}
                            style={{
                                padding: '14px 24px',
                                borderRadius: '16px',
                                border: `2px solid ${classMenuOpen ? mainColor : '#eaeaea'}`,
                                backgroundColor: 'white',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'space-between',
                                cursor: isGenerating ? 'not-allowed' : 'pointer',
                                transition: 'all 0.2s ease',
                                boxShadow: classMenuOpen ? `0 0 0 4px ${mainColor}15` : '0 4px 12px rgba(0,0,0,0.02)'
                            }}
                        >
                            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                <span className="material-symbols-rounded" style={{ color: mainColor }}>school</span>
                                <span style={{ fontWeight: 700, fontSize: '16px', color: '#333' }}>{currentClass?.name || 'Select Class'}</span>
                            </div>
                            <span className="material-symbols-rounded" style={{ 
                                transition: 'transform 0.3s ease',
                                transform: classMenuOpen ? 'rotate(180deg)' : 'rotate(0)'
                            }}>expand_more</span>
                        </div>

                        <AnimatePresence>
                            {classMenuOpen && (
                                <>
                                    <div 
                                        style={{ position: 'fixed', inset: 0, zIndex: 100 }} 
                                        onClick={() => setClassMenuOpen(false)} 
                                    />
                                    <motion.div
                                        initial={{ opacity: 0, y: 10, scale: 0.95 }}
                                        animate={{ opacity: 1, y: 0, scale: 1 }}
                                        exit={{ opacity: 0, y: 10, scale: 0.95 }}
                                        style={{
                                            position: 'absolute', top: '120%', left: 0, right: 0,
                                            background: 'white', borderRadius: '16px', padding: '8px',
                                            boxShadow: '0 12px 48px rgba(0,0,0,0.12)', border: '1px solid #eee',
                                            zIndex: 101, overflow: 'hidden'
                                        }}
                                    >
                                        {classes.map(c => (
                                            <div
                                                key={c.id}
                                                onClick={() => {
                                                    setSelectedClassId(c.id)
                                                    setClassMenuOpen(false)
                                                }}
                                                style={{
                                                    padding: '12px 16px', borderRadius: '10px', cursor: 'pointer',
                                                    display: 'flex', alignItems: 'center', gap: '12px',
                                                    backgroundColor: selectedClassId === c.id ? `${mainColor}10` : 'transparent',
                                                    color: selectedClassId === c.id ? mainColor : '#444',
                                                    fontWeight: selectedClassId === c.id ? 700 : 500,
                                                    transition: 'all 0.15s ease'
                                                }}
                                            >
                                                <span className="material-symbols-rounded" style={{ fontSize: '20px', opacity: selectedClassId === c.id ? 1 : 0.4 }}>
                                                    {selectedClassId === c.id ? 'check_circle' : 'circle'}
                                                </span>
                                                {c.name}
                                            </div>
                                        ))}
                                    </motion.div>
                                </>
                            )}
                        </AnimatePresence>
                    </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1.2fr) minmax(0, 1fr)', gap: '40px', alignItems: 'start' }}>
                    {/* Individual Report section */}
                    <div style={{ background: 'white', padding: '40px', borderRadius: '32px', border: '1px solid #f0f0f0', boxShadow: '0 8px 32px rgba(0,0,0,0.02)' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '32px' }}>
                            <div style={{ width: '56px', height: '56px', borderRadius: '20px', background: `${mainColor}15`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                <span className="material-symbols-rounded" style={{ color: mainColor, fontSize: '32px' }}>person</span>
                            </div>
                            <div>
                                <h2 style={{ margin: 0, fontSize: '24px', color: '#1a1a1a', fontWeight: 800 }}>Individual Report</h2>
                                <p style={{ margin: '4px 0 0', color: '#777', fontSize: '15px' }}>Generate a progress report for a student</p>
                            </div>
                        </div>

                        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                            <div style={{ position: 'relative' }}>
                                <div
                                    onClick={() => !isGenerating && setStudentMenuOpen(!studentMenuOpen)}
                                    style={{
                                        width: '100%', padding: '18px 24px', borderRadius: '16px', border: `2px solid ${studentMenuOpen ? mainColor : '#eaeaea'}`,
                                        fontSize: '18px', fontFamily: 'var(--font-display)', fontWeight: 600, color: '#333',
                                        backgroundColor: 'white', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                                        cursor: isGenerating ? 'not-allowed' : 'pointer', transition: 'all 0.2s ease'
                                    }}
                                >
                                    <span>{sortedStudents.find(s => s.id === reportStudentId)?.name || 'Select student...'}</span>
                                    <span className="material-symbols-rounded">search</span>
                                </div>

                                <AnimatePresence>
                                    {studentMenuOpen && (
                                        <>
                                            <div style={{ position: 'fixed', inset: 0, zIndex: 100 }} onClick={() => setStudentMenuOpen(false)} />
                                            <motion.div
                                                initial={{ opacity: 0, y: 10 }}
                                                animate={{ opacity: 1, y: 0 }}
                                                exit={{ opacity: 0, y: 10 }}
                                                style={{
                                                    position: 'absolute', top: '110%', left: 0, right: 0, maxHeight: '280px',
                                                    background: 'white', borderRadius: '16px', padding: '8px', zIndex: 101,
                                                    boxShadow: '0 12px 48px rgba(0,0,0,0.12)', border: '1px solid #eee',
                                                    overflowY: 'auto'
                                                }}
                                            >
                                                {sortedStudents.map(s => (
                                                    <div
                                                        key={s.id}
                                                        onClick={() => {
                                                            setReportStudentId(s.id)
                                                            setStudentMenuOpen(false)
                                                        }}
                                                        style={{
                                                            padding: '12px 16px', borderRadius: '10px', cursor: 'pointer',
                                                            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                                                            backgroundColor: reportStudentId === s.id ? `${mainColor}10` : 'transparent',
                                                            transition: 'all 0.1s ease'
                                                        }}
                                                    >
                                                        <span style={{ fontWeight: 600, color: '#333' }}>{s.name}</span>
                                                        <span style={{ fontSize: '13px', color: mainColor, background: `${mainColor}15`, padding: '4px 10px', borderRadius: '20px', fontWeight: 700 }}>
                                                            {s.stars?.length || 0} stars
                                                        </span>
                                                    </div>
                                                ))}
                                            </motion.div>
                                        </>
                                    )}
                                </AnimatePresence>
                            </div>

                            <motion.button
                                onClick={handleSingleReport}
                                disabled={!reportStudentId || isGenerating}
                                whileHover={{ scale: 1.01, y: -2 }}
                                whileTap={{ scale: 0.99 }}
                                style={{
                                    width: '100%', padding: '22px', borderRadius: '18px', border: 'none', background: mainColor, color: 'white',
                                    fontWeight: 800, fontSize: '18px', cursor: (!reportStudentId || isGenerating) ? 'not-allowed' : 'pointer',
                                    opacity: (!reportStudentId || isGenerating) ? 0.5 : 1,
                                    boxShadow: `0 8px 24px ${mainColor}33`
                                }}
                            >
                                Generate Certificate
                            </motion.button>
                        </div>
                    </div>

                    {/* Bulk Generation Section */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
                        <div style={{ background: 'white', padding: '32px', borderRadius: '32px', border: '2px dashed #eaeaea' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '8px' }}>
                                <span className="material-symbols-rounded" style={{ color: mainColor, fontSize: '24px' }}>info</span>
                                <h3 style={{ margin: 0, fontSize: '18px', color: '#444', fontWeight: 700 }}>Class Summary</h3>
                            </div>
                            <p style={{ margin: 0, color: '#777', fontSize: '15px' }}>
                                You are about to generate reports for <strong style={{color: '#333'}}>{sortedStudents.length}</strong> students in <strong style={{color: '#333'}}>{currentClass?.name}</strong>.
                            </p>
                        </div>

                        <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '16px' }}>
                            <motion.button
                                onClick={handleAllZip}
                                disabled={isGenerating || sortedStudents.length === 0}
                                whileHover={{ scale: 1.02, x: 4 }}
                                whileTap={{ scale: 0.98 }}
                                style={{
                                    padding: '24px 32px', borderRadius: '24px', border: `2px solid ${mainColor}20`,
                                    background: 'white', color: '#333',
                                    fontWeight: 700, fontSize: '17px', cursor: (isGenerating || sortedStudents.length === 0) ? 'not-allowed' : 'pointer',
                                    opacity: (isGenerating || sortedStudents.length === 0) ? 0.5 : 1,
                                    display: 'flex', alignItems: 'center', gap: '20px',
                                    boxShadow: '0 4px 12px rgba(0,0,0,0.03)'
                                }}
                            >
                                <div style={{ width: '48px', height: '48px', borderRadius: '14px', background: `${mainColor}15`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                    <span className="material-symbols-rounded" style={{ fontSize: '28px', color: mainColor }}>folder_zip</span>
                                </div>
                                <div style={{ textAlign: 'left' }}>
                                    <div style={{ fontSize: '18px', fontWeight: 800 }}>Download as ZIP</div>
                                    <div style={{ fontSize: '13px', color: '#888', fontWeight: 500 }}>Individual PDF for each student</div>
                                </div>
                                <span className="material-symbols-rounded" style={{ marginLeft: 'auto', opacity: 0.3 }}>chevron_right</span>
                            </motion.button>

                            <motion.button
                                onClick={handleAllPdf}
                                disabled={isGenerating || sortedStudents.length === 0}
                                whileHover={{ scale: 1.02, x: 4 }}
                                whileTap={{ scale: 0.98 }}
                                style={{
                                    padding: '24px 32px', borderRadius: '24px', border: `2px solid ${mainColor}20`,
                                    background: 'white', color: '#333',
                                    fontWeight: 700, fontSize: '17px', cursor: (isGenerating || sortedStudents.length === 0) ? 'not-allowed' : 'pointer',
                                    opacity: (isGenerating || sortedStudents.length === 0) ? 0.5 : 1,
                                    display: 'flex', alignItems: 'center', gap: '20px',
                                    boxShadow: '0 4px 12px rgba(0,0,0,0.03)'
                                }}
                            >
                                <div style={{ width: '48px', height: '48px', borderRadius: '14px', background: `${mainColor}15`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                    <span className="material-symbols-rounded" style={{ fontSize: '28px', color: mainColor }}>picture_as_pdf</span>
                                </div>
                                <div style={{ textAlign: 'left' }}>
                                    <div style={{ fontSize: '18px', fontWeight: 800 }}>Download BIG PDF</div>
                                    <div style={{ fontSize: '13px', color: '#888', fontWeight: 500 }}>All reports combined in one file</div>
                                </div>
                                <span className="material-symbols-rounded" style={{ marginLeft: 'auto', opacity: 0.3 }}>chevron_right</span>
                            </motion.button>
                        </div>
                    </div>
                </div>
            </div>

            {/* Generation Overlay */}
            <AnimatePresence>
                {isGenerating && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        style={{
                            position: 'fixed', inset: 0, zIndex: 9999,
                            background: 'rgba(255,255,255,0.95)', backdropFilter: 'blur(12px)',
                            display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column'
                        }}
                    >
                        <motion.div
                            animate={{ rotate: 360, scale: [1, 1.1, 1] }}
                            transition={{ rotate: { ease: 'linear', duration: 1.5, repeat: Infinity }, scale: { duration: 2, repeat: Infinity } }}
                            style={{
                                width: '80px', height: '80px', borderRadius: '50%',
                                border: `8px solid ${mainColor}15`,
                                borderTopColor: mainColor,
                                marginBottom: '32px'
                            }}
                        />
                        <h2 style={{ fontFamily: 'var(--font-display)', color: '#1a1a1a', fontSize: '32px', margin: '0 0 12px', fontWeight: 900 }}>Crafting Reports</h2>
                        <div style={{ fontSize: '18px', color: '#666', fontWeight: 600, letterSpacing: '0.02em' }}>{statusText}</div>

                        <div style={{ marginTop: '40px', width: '400px', height: '12px', background: '#f0f0f0', borderRadius: '6px', overflow: 'hidden', boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.05)' }}>
                            <motion.div
                                style={{ height: '100%', background: `linear-gradient(90deg, ${mainColor}, #c084fc)`, borderRadius: '6px' }}
                                animate={{ width: `${progress}%` }}
                                transition={{ ease: 'linear', duration: 0.2 }}
                            />
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            <ReportGenerator ref={reportGenRef} />
        </div>
    )
}

import React, { useRef, useState, useImperativeHandle, forwardRef } from 'react';
import html2canvas from 'html2canvas';
import { jsPDF } from 'jspdf';
import { colorValues, accentColorSchemes } from '../engine/serotoninEngine';

// Mapping identical to StudentsScreen starItems for correct display
const starDetails = {
    'star-base': { color: '#fbbf24', label: 'Normal' },
    'star-spark': { gradient: 'linear-gradient(135deg, #22d3ee 0%, #06b6d4 100%)', color: '#22d3ee', label: 'Spark' },
    'star-radiant': { gradient: 'linear-gradient(135deg, #fb7185 0%, #c084fc 100%)', color: '#fb7185', label: 'Radiant' },
    'star-legendary': { gradient: 'linear-gradient(45deg, #c084fc, #fbbf24, #22d3ee, #c084fc)', color: '#c084fc', label: 'Legendary', isRainbow: true }
};

function hexToRgba(hex, alpha = 0.15) {
    if (!hex || typeof hex !== 'string' || hex[0] !== '#') return hex;
    const r = parseInt(hex.slice(1, 3), 16);
    const g = parseInt(hex.slice(3, 5), 16);
    const b = parseInt(hex.slice(5, 7), 16);
    return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

// Build an inline SVG data URL for a star handling different tiers
function createStarSvgUrl(starId) {
    let fillContent = `<path d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z" fill="${starDetails[starId]?.color || '#fbbf24'}" />`;
    let defs = '';

    if (starId === 'star-spark') {
        defs = `<defs><linearGradient id="g-spark" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" stop-color="#22d3ee"/><stop offset="100%" stop-color="#06b6d4"/></linearGradient></defs>`;
        fillContent = `<path d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z" fill="url(#g-spark)" />`;
    } else if (starId === 'star-radiant') {
        defs = `<defs><linearGradient id="g-rad" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" stop-color="#fb7185"/><stop offset="100%" stop-color="#c084fc"/></linearGradient></defs>`;
        fillContent = `<path d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z" fill="url(#g-rad)" />`;
    } else if (starId === 'star-legendary') {
        defs = `<defs><linearGradient id="g-leg" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" stop-color="#c084fc"/><stop offset="33%" stop-color="#fbbf24"/><stop offset="66%" stop-color="#22d3ee"/><stop offset="100%" stop-color="#c084fc"/></linearGradient></defs>`;
        fillContent = `<path d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z" fill="url(#g-leg)" />`;
    }

    const svgString = `<svg width="32" height="32" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">${defs}${fillContent}</svg>`;
    return `data:image/svg+xml;base64,${btoa(svgString)}`;
}

// Parse the report text markup into styled spans
// Format in strings: /c1[text] /c2[text] /c3[text]  (colorize)
//                    /h1[text] /h2[text] /h3[text]  (highlight)
// Closing tags like /c1 are not required in the raw string.
function parseReportText(text, scheme) {
    const tagStyles = {
        c1: { color: scheme.colorize1, fontWeight: 800 },
        c2: { color: scheme.colorize2, fontWeight: 800 },
        c3: { color: scheme.colorize3, fontWeight: 800 },
        h1: {
            color: scheme.colorize1,
            backgroundColor: hexToRgba(scheme.colorize1, 0.18),
            borderRadius: '4px',
            padding: '0 2px',
            fontWeight: 800,
        },
        h2: {
            color: scheme.colorize2,
            backgroundColor: hexToRgba(scheme.colorize2, 0.18),
            borderRadius: '4px',
            padding: '0 2px',
            fontWeight: 800,
        },
        h3: {
            color: scheme.colorize3,
            fontWeight: 800,
        },
        t1: {
            color: scheme.colorize1,
            fontWeight: 900,
            fontSize: '34px',
            WebkitTextStroke: '1px currentColor',
            display: 'block',
            marginBottom: '-6px'
        },
    };

    // Match /(tag)[content] — greedy but stopping at ] 
    const TOKEN = /\/(c1|c2|c3|h1|h2|h3|t1)\[([^\]]*)\]/g;
    const result = [];
    let lastIndex = 0;
    let key = 0;
    let match;

    while ((match = TOKEN.exec(text)) !== null) {
        // Plain text before this token
        if (match.index > lastIndex) {
            result.push(<span key={key++}>{text.slice(lastIndex, match.index)}</span>);
        }
        const tag = match[1];
        const content = match[2];
        result.push(
            <span key={key++} style={tagStyles[tag] || {}}>
                {content}
            </span>
        );
        lastIndex = TOKEN.lastIndex;
    }

    // Remaining plain text after the last token
    if (lastIndex < text.length) {
        result.push(<span key={key++}>{text.slice(lastIndex)}</span>);
    }

    return result;
}

// Build letter report paragraphs with the parser applied
function buildReportContent(student, totalStars, scheme, className) {
    const name = student.name;

    const paragraphs = [
        `/t1[Dear ${name},]I wanted to take a moment to recognize the /h1[wonderful progress] you've made in our English class this term.`,

        `Learning a new language isn't always easy, but you've shown up with a /h2[positive attitude] and a /h2[willingness to try], and /h3[that's what makes all the difference]. Whether you were practicing new vocabulary, working through grammar concepts, or participating in class activities, your effort has been /c3[evident and appreciated].`,

        `You've earned /h3[${totalStars} stars] along the way, and each one represents a moment where you /h1[challenged yourself] and grew. Your /h2[curiosity], /h2[questions], and /h2[contributions] have made our classroom a /h2[better learning environment] for everyone.`,

        `As you continue your English learning journey, remember that progress isn't always about /h1[being perfect]. Instead, it's about /h2[showing up], /h2[trying your best], and /h3[never giving up]. You're doing exactly that, and I'm excited to see where your efforts will take you.`,

        `Keep learning, keep growing, and /h1[keep being the curious and dedicated student you are!]`,
    ];

    return paragraphs;
}

// Render a row of stars as small inline images
function StarsDisplay({ stars, scheme }) {
    if (!stars || stars.length === 0) {
        return (
            <div style={{ color: '#aaa', fontSize: '16px', fontStyle: 'italic', textAlign: 'center' }}>
                No stars earned yet!
            </div>
        );
    }

    // Determine star size - shrink if many
    const total = stars.length;
    // Max size 34px, min 18px
    const starSize = Math.max(18, Math.min(34, Math.floor(520 / total)));

    return (
        <div style={{
            display: 'flex',
            flexWrap: 'wrap',
            justifyContent: 'center',
            alignItems: 'center',
            gap: '2px',
            maxWidth: '620px',
            margin: '0 auto',
        }}>
            {stars.map((starId, idx) => {
                return (
                    <img
                        key={idx}
                        src={createStarSvgUrl(starId)}
                        alt="★"
                        style={{ width: `${starSize}px`, height: `${starSize}px` }}
                    />
                );
            })}
        </div>
    );
}

export const ReportGenerator = forwardRef((props, ref) => {
    const [reportData, setReportData] = useState(null);

    const generatePdf = async (type, data) => {
        setReportData({ type, ...data });

        await document.fonts.ready;
        await new Promise(r => setTimeout(r, 900));

        const element = document.getElementById('pdf-report-content');
        if (!element) {
            setReportData(null);
            return;
        }

        try {
            const canvas = await html2canvas(element, {
                scale: 2,
                useCORS: true,
                logging: false,
                backgroundColor: '#ffffff'
            });

            const imgData = canvas.toDataURL('image/png');
            const pdf = new jsPDF('p', 'mm', 'a4');
            const pdfWidth = pdf.internal.pageSize.getWidth();
            const pdfHeight = (canvas.height * pdfWidth) / canvas.width;

            pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);

            const filename = type === 'class' ? 'Class_Report.pdf' : `${data.student.name}_Report.pdf`;
            pdf.save(filename);

        } catch (error) {
            console.error('Failed to generate PDF', error);
        } finally {
            setReportData(null);
        }
    };

    const getPdfImageData = async () => {
        await document.fonts.ready;
        await new Promise(r => setTimeout(r, 900));
        const element = document.getElementById('pdf-report-content');
        if (!element) return null;
        const canvas = await html2canvas(element, { scale: 2, useCORS: true, backgroundColor: '#ffffff' });
        return {
            imgData: canvas.toDataURL('image/png'),
            width: canvas.width,
            height: canvas.height
        };
    };

    useImperativeHandle(ref, () => ({
        generateClassReport: (students, className, appColor) => {
            generatePdf('class', { students, className, appColor });
        },
        generateStudentReport: (student, rank, totalStudents, stars, className, teacherName) => {
            generatePdf('student', { student, rank, totalStudents, stars, className, teacherName });
        },
        getStudentReportBlob: async (student, rank, totalStudents, stars, className, teacherName) => {
            setReportData({ type: 'student', student, rank, totalStudents, stars, className, teacherName });
            const data = await getPdfImageData();
            if (!data) return null;
            const pdf = new jsPDF('p', 'mm', 'a4');
            const pdfWidth = pdf.internal.pageSize.getWidth();
            const pdfHeight = (data.height * pdfWidth) / data.width;
            pdf.addImage(data.imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
            return pdf.output('blob');
        },
        getStudentReportImageData: async (student, rank, totalStudents, stars, className, teacherName) => {
            setReportData({ type: 'student', student, rank, totalStudents, stars, className, teacherName });
            return await getPdfImageData();
        },
        clearReportData: () => setReportData(null)
    }));

    if (!reportData) return null;

    // ─── CLASS REPORT ───────────────────────────────────────────
    if (reportData.type === 'class') {
        const { students, className, appColor } = reportData;
        const mainColor = colorValues[appColor] || '#4A90E2';

        const sortedStudents = [...students].sort((a, b) =>
            (b.stars || []).length - (a.stars || []).length
        );

        return (
            <div style={{ position: 'absolute', top: '-9999px', left: '-9999px' }}>
                <div id="pdf-report-content" style={{
                    width: '800px',
                    minHeight: '1131px',
                    backgroundColor: 'white',
                    fontFamily: '"Fredoka", sans-serif',
                    color: '#333',
                    boxSizing: 'border-box'
                }}>
                    <div style={{
                        backgroundColor: mainColor,
                        height: '140px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        flexDirection: 'column',
                        color: 'white'
                    }}>
                        <h1 style={{ margin: 0, fontSize: '36px', fontWeight: 600 }}>Affinity English</h1>
                        <h2 style={{ margin: '8px 0 0', fontSize: '22px', fontWeight: 400, opacity: 0.9 }}>Class Report: {className}</h2>
                    </div>

                    <div style={{ padding: '40px 60px' }}>
                        <table style={{
                            width: '100%',
                            borderCollapse: 'collapse',
                            border: '2px solid #eaeaea',
                            fontFamily: 'sans-serif',
                            fontSize: '14px'
                        }}>
                            <thead>
                                <tr style={{ backgroundColor: '#f8fafc', borderBottom: '2px solid #ddd' }}>
                                    <th style={{ padding: '16px', textAlign: 'center', width: '80px', borderRight: '1px solid #eaeaea' }}>Rank</th>
                                    <th style={{ padding: '16px', textAlign: 'left', borderRight: '1px solid #eaeaea' }}>Student</th>
                                    <th style={{ padding: '16px', textAlign: 'center', width: '120px' }}>Stars Earned</th>
                                </tr>
                            </thead>
                            <tbody>
                                {sortedStudents.map((s, idx) => {
                                    const starsCount = (s.stars || []).length;
                                    const isTop3 = idx < 3;
                                    const sColor = colorValues[s.colorKey] || '#666';

                                    return (
                                        <tr key={s.id} style={{ borderBottom: '1px solid #eaeaea' }}>
                                            <td style={{ padding: '16px', textAlign: 'center', fontWeight: 'bold', color: '#666', borderRight: '1px solid #eaeaea' }}>
                                                #{idx + 1}
                                            </td>
                                            <td style={{ padding: '16px', display: 'flex', alignItems: 'center', gap: '16px', borderRight: '1px solid #eaeaea' }}>
                                                <div style={{
                                                    backgroundColor: `${sColor}20`,
                                                    color: sColor,
                                                    width: '36px', height: '36px',
                                                    borderRadius: '8px',
                                                    display: 'flex', alignItems: 'center', justifyContent: 'center'
                                                }}>
                                                    <span className="material-symbols-rounded material-filled" style={{ fontSize: '20px' }}>
                                                        {s.logoId || 'face'}
                                                    </span>
                                                </div>
                                                <span style={{
                                                    color: sColor,
                                                    fontFamily: '"Fredoka", sans-serif',
                                                    fontWeight: isTop3 ? 700 : 500,
                                                    fontSize: '18px',
                                                    textShadow: isTop3 ? `0 0 10px ${sColor}80` : 'none'
                                                }}>
                                                    {s.name}
                                                </span>
                                            </td>
                                            <td style={{ padding: '16px', textAlign: 'center', fontSize: '18px', fontWeight: 'bold', color: '#fbbf24' }}>
                                                {starsCount}
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        );
    }

    // ─── STUDENT REPORT ─────────────────────────────────────────
    if (reportData.type === 'student') {
        const { student, rank, className, teacherName } = reportData;
        const sColor = colorValues[student.colorKey] || '#A855F7';
        const scheme = accentColorSchemes[student.colorKey] || accentColorSchemes.purple;
        const stars = student.stars || [];
        const totalStars = stars.length;

        // Date: Month DD, YYYY
        const now = new Date();
        const dateStr = now.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });

        const paragraphs = buildReportContent(student, totalStars, scheme, className);

        // Symbol divider: fill bottom border with the student logo
        const logoIcon = student.logoId || 'nightlight';

        return (
            <div style={{ position: 'absolute', top: '-9999px', left: '-9999px' }}>
                <div id="pdf-report-content" style={{
                    width: '794px',           // 210mm at 96dpi ≈ 794px
                    minHeight: '1123px',      // 297mm
                    backgroundColor: 'white',
                    fontFamily: '"Recoleta", "Fredoka", sans-serif',
                    color: '#222',
                    boxSizing: 'border-box',
                    position: 'relative',
                    overflow: 'hidden',
                }}>

                    {/* ── TOP HEADER BAND ── */}
                    <div style={{
                        backgroundColor: sColor,
                        width: '100%',
                        height: '140px',
                        position: 'relative',
                        overflow: 'hidden',
                    }}>
                        {/* Symbol pattern — tiled icons */}
                        <div style={{
                            position: 'absolute',
                            inset: 0,
                            display: 'flex',
                            flexWrap: 'wrap',
                            gap: '0px',
                            overflow: 'hidden',
                            opacity: 0.22,
                        }}>
                            {Array(80).fill(0).map((_, i) => (
                                <span
                                    key={i}
                                    className="material-symbols-rounded material-filled"
                                    style={{
                                        fontFamily: '"Material Symbols Rounded", sans-serif',
                                        fontSize: '52px',
                                        color: 'white',
                                        lineHeight: '52px',
                                        width: '52px',
                                        textAlign: 'center',
                                        flexShrink: 0,
                                    }}
                                >
                                    {logoIcon}
                                </span>
                            ))}
                        </div>

                        {/* Affinity left / Class right */}
                        <div style={{
                            position: 'absolute',
                            inset: 0,
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                            padding: '0 32px',
                        }}>
                            <span style={{
                                fontFamily: '"Fredoka", sans-serif',
                                fontSize: '32px',
                                fontWeight: 800,
                                color: 'white',
                                letterSpacing: '-0.5px',
                            }}>
                                Affinity
                            </span>
                            <span style={{
                                fontFamily: '"Fredoka", sans-serif',
                                fontSize: '24px',
                                fontWeight: 800,
                                color: 'white',
                            }}>
                                {teacherName ? `${teacherName}'s Class` : (className || "Student's Class")}
                            </span>
                        </div>
                    </div>

                    {/* ── NAME CARD ── centred, overlapping the header */}
                    <div style={{
                        display: 'flex',
                        justifyContent: 'center',
                        marginTop: '-40px',
                        position: 'relative',
                        zIndex: 2,
                        paddingBottom: '8px',
                    }}>
                        <div style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '16px',
                            backgroundColor: 'white',
                            border: `3px solid ${sColor}`,
                            borderRadius: '60px',
                            padding: '12px 36px 12px 16px',
                            boxShadow: `0 8px 32px ${hexToRgba(sColor, 0.25)}`,
                        }}>
                            {/* Icon chip */}
                            <div style={{
                                width: '60px', height: '60px',
                                borderRadius: '18px',
                                backgroundColor: hexToRgba(sColor, 0.12),
                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                flexShrink: 0,
                            }}>
                                <span
                                    className="material-symbols-rounded material-filled"
                                    style={{
                                        fontFamily: '"Material Symbols Rounded", sans-serif',
                                        fontSize: '38px',
                                        color: sColor,
                                    }}
                                >
                                    {logoIcon}
                                </span>
                            </div>
                            {/* Name */}
                            <span style={{
                                fontFamily: '"Recoleta", "Fredoka", sans-serif',
                                fontSize: '42px',
                                fontWeight: 900,
                                WebkitTextStroke: '1px currentColor',
                                color: sColor,
                                letterSpacing: '-0.5px',
                                lineHeight: 1,
                            }}>
                                {student.name}
                            </span>
                        </div>
                    </div>

                    {/* ── COLLECTED STARS LABEL ── */}
                    <div style={{
                        textAlign: 'center',
                        marginTop: '20px',
                    }}>
                        <span style={{
                            display: 'inline-block',
                            backgroundColor: hexToRgba(sColor, 0.12),
                            color: sColor,
                            fontFamily: '"Recoleta", "Fredoka", sans-serif',
                            fontSize: '16px',
                            fontWeight: 900,
                            WebkitTextStroke: '0.4px currentColor',
                            padding: '6px 20px',
                            borderRadius: '999px',
                            letterSpacing: '0.02em',
                        }}>
                            Collected Stars
                        </span>
                    </div>

                    {/* ── STARS ── */}
                    <div style={{ marginTop: '12px', padding: '0 40px 0' }}>
                        <StarsDisplay stars={stars} scheme={scheme} />
                    </div>

                    {/* ── LETTER BODY ── */}
                    <div style={{
                        padding: '32px 52px 0',
                    }}>
                        {paragraphs.map((para, pIdx) => (
                            <p
                                key={pIdx}
                                style={{
                                    fontFamily: '"Recoleta", "Fredoka", sans-serif',
                                    fontSize: '18px',
                                    fontWeight: 900,
                                    WebkitTextStroke: '0.4px currentColor',
                                    lineHeight: 1.76,
                                    color: '#1a1a2e',
                                    margin: '0 0 18px',
                                    whiteSpace: 'pre-wrap',
                                }}
                            >
                                {parseReportText(para, scheme)}
                            </p>
                        ))}
                    </div>

                    {/* ── SYMBOL DIVIDER ── */}
                    <div style={{
                        margin: '28px 40px 0',
                        display: 'flex',
                        flexWrap: 'nowrap',
                        overflow: 'hidden',
                        justifyContent: 'center',
                        color: sColor,
                        opacity: 0.55,
                    }}>
                        {Array(32).fill(0).map((_, i) => (
                            <span
                                key={i}
                                className="material-symbols-rounded material-filled"
                                style={{
                                    fontFamily: '"Material Symbols Rounded", sans-serif',
                                    fontSize: '22px',
                                    color: sColor,
                                    lineHeight: '26px',
                                }}
                            >
                                {logoIcon}
                            </span>
                        ))}
                    </div>

                    {/* ── FOOTER ── */}
                    <div style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        padding: '14px 52px 28px',
                        fontFamily: '"Recoleta", "Fredoka", sans-serif',
                        fontSize: '16px',
                        fontWeight: 900,
                        WebkitTextStroke: '0.4px currentColor',
                        color: '#333',
                    }}>
                        <span>{teacherName ? `${teacherName}'s Stellar Class` : "Stellar Class"}</span>
                        <span>{dateStr}</span>
                    </div>

                </div>
            </div>
        );
    }

    return null;
});

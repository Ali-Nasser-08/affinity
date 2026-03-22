import { useState } from 'react'
import { motion } from 'framer-motion'
import { colorValues } from '../engine/serotoninEngine'

export function WelcomeModal({ onSave, isOpen }) {
    const [name, setName] = useState('')

    return (
        <div style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(0,0,0,0.95)',
            zIndex: 9999,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: 20,
            opacity: isOpen ? 1 : 0,
            pointerEvents: isOpen ? 'auto' : 'none',
            transition: 'opacity 200ms ease'
        }}>
            <motion.div
                initial={false}
                animate={{ scale: isOpen ? 1 : 0.98, opacity: isOpen ? 1 : 0 }}
                style={{
                    background: '#1a1a1a',
                    padding: '40px 30px',
                    borderRadius: 25,
                    textAlign: 'center',
                    width: '100%',
                    maxWidth: 400,
                    border: '1px solid #333',
                    boxShadow: '0 20px 50px rgba(0,0,0,0.5)'
                }}
            >
                <h2 style={{
                    marginBottom: 10,
                    color: colorValues.cyan,
                    fontFamily: 'var(--font-display)',
                    fontSize: 32
                }}>Welcome!</h2>
                <p style={{ marginBottom: 30, color: '#aaa', fontSize: 18 }}>
                    What should we call you?
                </p>
                <input
                    autoFocus
                    value={name}
                    onChange={e => {
                        const val = e.target.value
                        if (/^[a-zA-Z]*$/.test(val)) {
                            setName(val)
                        }
                    }}
                    maxLength={12}
                    placeholder="First Name (English Only)"
                    onKeyDown={(e) => {
                        if (e.key === 'Enter' && name.trim()) onSave(name.trim())
                    }}
                    style={{
                        width: '100%',
                        padding: '15px 20px',
                        fontSize: 20,
                        borderRadius: 15,
                        border: '2px solid #333',
                        marginBottom: 10,
                        background: '#5A5A5A',
                        color: 'white',
                        textAlign: 'center',
                        outline: 'none'
                    }}
                />
                <p style={{ fontSize: 12, color: '#888', marginBottom: 25, maxWidth: '280px', margin: '0 auto 25px' }}>
                    Please use your English first name only (max 12 chars) so it fits perfectly in the UI.
                </p>
                <button
                    onClick={() => {
                        if (name.trim()) onSave(name.trim())
                    }}
                    style={{
                        width: '100%',
                        padding: 15,
                        backgroundColor: colorValues.cyan,
                        color: '#5A5A5A',
                        border: 'none',
                        borderRadius: 15,
                        fontSize: 18,
                        fontWeight: 'bold',
                        cursor: 'pointer',
                        opacity: name.trim() ? 1 : 0.5,
                        pointerEvents: name.trim() ? 'auto' : 'none',
                        transition: 'opacity 0.2s'
                    }}
                >
                    Get Started
                </button>
            </motion.div>
        </div>
    )
}

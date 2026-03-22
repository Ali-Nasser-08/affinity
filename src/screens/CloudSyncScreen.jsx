import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { colorValues } from '../engine/serotoninEngine'
import { saveToCloud, retrieveFromCloud } from '../utils/cloudSync'

// ─── Confirmation modal ───────────────────────────────────────────────────────
function ConfirmModal({ accent, onConfirm, onCancel }) {
    return (
        <motion.div
            className="cloudsync-modal-backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={onCancel}
        >
            <motion.div
                className="cloudsync-modal"
                initial={{ opacity: 0, scale: 0.93, y: 16 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.93, y: 16 }}
                transition={{ duration: 0.25, ease: 'easeOut' }}
                onClick={e => e.stopPropagation()}
            >
                <span className="material-symbols-rounded cloudsync-modal-icon"
                    style={{ color: '#f59e0b', fontVariationSettings: "'FILL' 1" }}>
                    warning
                </span>
                <h3 className="cloudsync-modal-title">Replace local data?</h3>
                <p className="cloudsync-modal-body">
                    This will overwrite <strong>all</strong> current data on this device
                    with your cloud backup. This cannot be undone.
                </p>
                <div className="cloudsync-modal-btns">
                    <button className="cloudsync-modal-cancel" onClick={onCancel}>
                        Cancel
                    </button>
                    <motion.button
                        className="cloudsync-modal-confirm"
                        style={{ background: accent }}
                        whileHover={{ opacity: 0.88 }}
                        whileTap={{ scale: 0.97 }}
                        onClick={onConfirm}
                    >
                        Yes, retrieve
                    </motion.button>
                </div>
            </motion.div>
        </motion.div>
    )
}

// ─── Toast notification ───────────────────────────────────────────────────────
function Toast({ status, message, onDismiss }) {
    return (
        <motion.div
            className={`cloudsync-toast ${status === 'ok' ? 'cloudsync-toast-ok' : 'cloudsync-toast-err'}`}
            initial={{ opacity: 0, y: -12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -12 }}
            transition={{ duration: 0.25 }}
        >
            <span className="material-symbols-rounded"
                style={{ fontSize: 20, fontVariationSettings: "'FILL' 1", flexShrink: 0 }}>
                {status === 'ok' ? 'check_circle' : 'error'}
            </span>
            <span style={{ flex: 1 }}>{message}</span>
            <button className="cloudsync-toast-close" onClick={onDismiss} aria-label="Dismiss">
                <span className="material-symbols-rounded" style={{ fontSize: 18 }}>close</span>
            </button>
        </motion.div>
    )
}

// ─── Main screen ─────────────────────────────────────────────────────────────
export function CloudSyncScreen({ onBack, authUser, accentColor }) {
    const accent = colorValues[accentColor] || colorValues.cyan

    const [saveLoading, setSaveLoading] = useState(false)
    const [retrieveLoading, setRetrieveLoading] = useState(false)
    const [showConfirm, setShowConfirm] = useState(false)
    const [toast, setToast] = useState(null) // { status: 'ok'|'error', message: string }

    function showToast(status, message) {
        setToast({ status, message })
        if (status === 'ok') setTimeout(() => setToast(null), 4000)
    }

    async function handleSave() {
        setSaveLoading(true)
        try {
            await saveToCloud(authUser.id)
            showToast('ok', 'Saved! Classes, lessons, and canvases are backed up.')
        } catch (err) {
            showToast('error', err.message || 'Save failed. Please try again.')
        } finally {
            setSaveLoading(false)
        }
    }

    async function handleRetrieve() {
        setShowConfirm(false)
        setRetrieveLoading(true)
        try {
            await retrieveFromCloud(authUser.id)
            showToast('ok', 'Retrieved! Reload the page to see your restored data.')
        } catch (err) {
            showToast('error', err.message || 'Retrieve failed. Please try again.')
        } finally {
            setRetrieveLoading(false)
        }
    }

    return (
        <motion.div
            className="cloudsync-root"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
        >
            {/* Back */}
            <button className="cloudsync-back" onClick={onBack} aria-label="Back">
                <span className="material-symbols-rounded" style={{ fontSize: 28, color: accent }}>arrow_back</span>
            </button>

            {/* Toast */}
            <div className="cloudsync-toast-area">
                <AnimatePresence>
                    {toast && (
                        <Toast
                            status={toast.status}
                            message={toast.message}
                            onDismiss={() => setToast(null)}
                        />
                    )}
                </AnimatePresence>
            </div>

            {/* Header */}
            <div className="cloudsync-header">
                <motion.span
                    className="material-symbols-rounded cloudsync-icon"
                    animate={{ color: accent }}
                    transition={{ duration: 0.4 }}
                    style={{ fontVariationSettings: "'FILL' 1" }}
                >
                    cloud_sync
                </motion.span>
                <h2 className="cloudsync-title">Cloud Sync</h2>
                <p className="cloudsync-subtitle">
                    Your data lives in the browser by default.<br />
                    Manually back it up or restore it here.
                </p>
                <p className="cloudsync-user">
                    <span className="material-symbols-rounded" style={{ fontSize: 16 }}>person</span>
                    {authUser?.email}
                </p>
            </div>

            {/* Action cards */}
            <div className="cloudsync-actions">

                {/* Save */}
                <motion.button
                    className="cloudsync-btn"
                    animate={{ background: accent, boxShadow: `0 8px 40px ${accent}44` }}
                    transition={{ duration: 0.4 }}
                    whileHover={{ scale: saveLoading ? 1 : 1.03, boxShadow: `0 12px 50px ${accent}66` }}
                    whileTap={{ scale: saveLoading ? 1 : 0.97 }}
                    onClick={handleSave}
                    disabled={saveLoading || retrieveLoading}
                >
                    {saveLoading ? (
                        <span className="cloudsync-spinner" style={{ borderColor: 'rgba(255,255,255,0.3)', borderTopColor: '#fff' }} />
                    ) : (
                        <span className="material-symbols-rounded cloudsync-btn-icon"
                            style={{ fontVariationSettings: "'FILL' 1" }}>
                            cloud_upload
                        </span>
                    )}
                    <span className="cloudsync-btn-label">Save to Cloud</span>
                    <span className="cloudsync-btn-sub">
                        Classes · Students · Lessons · Canvases
                    </span>
                </motion.button>

                {/* Retrieve */}
                <motion.button
                    className="cloudsync-btn cloudsync-btn-outline"
                    animate={{ borderColor: accent, color: accent }}
                    transition={{ duration: 0.4 }}
                    whileHover={{ scale: retrieveLoading ? 1 : 1.03, backgroundColor: `${accent}10` }}
                    whileTap={{ scale: retrieveLoading ? 1 : 0.97 }}
                    onClick={() => setShowConfirm(true)}
                    disabled={saveLoading || retrieveLoading}
                    style={{ borderColor: accent }}
                >
                    {retrieveLoading ? (
                        <span className="cloudsync-spinner" style={{ borderColor: `${accent}33`, borderTopColor: accent }} />
                    ) : (
                        <span className="material-symbols-rounded cloudsync-btn-icon"
                            style={{ color: accent, fontVariationSettings: "'FILL' 1" }}>
                            cloud_download
                        </span>
                    )}
                    <span className="cloudsync-btn-label" style={{ color: accent }}>Retrieve from Cloud</span>
                    <span className="cloudsync-btn-sub" style={{ color: '#9ca3af' }}>
                        Replaces all local data with your backup
                    </span>
                </motion.button>
            </div>

            {/* Confirmation modal */}
            <AnimatePresence>
                {showConfirm && (
                    <ConfirmModal
                        accent={accent}
                        onConfirm={handleRetrieve}
                        onCancel={() => setShowConfirm(false)}
                    />
                )}
            </AnimatePresence>
        </motion.div>
    )
}

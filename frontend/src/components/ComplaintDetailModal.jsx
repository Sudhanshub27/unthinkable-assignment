import { useState, useEffect } from 'react';
import SVGIcon from './SVGIcon';
import Timeline from './Timeline';
import { StatusBadge, PriorityBadge, OverdueBadge } from './Badges';
import { formatFlatNumber, getCategoryIconName, formatDateTime } from '../utils/formatters';

export default function ComplaintDetailModal({
  isOpen,
  onClose,
  complaint,
  history = [],
  loadingHistory = false,
  mode = 'resident', // 'resident' | 'admin'
  onUpdateStatus, // (complaintId, patchPayload) => Promise
}) {
  const [status, setStatus] = useState('Open');
  const [priority, setPriority] = useState('Low');
  const [isOverdueFlag, setIsOverdueFlag] = useState(false);
  const [note, setNote] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [photoError, setPhotoError] = useState(false);

  const [showReopenConfirm, setShowReopenConfirm] = useState(false);
  const [reopenReason, setReopenReason] = useState('');
  const [reopening, setReopening] = useState(false);

  const isResolved = complaint?.status === 'Resolved';

  useEffect(() => {
    if (complaint) {
      setStatus(complaint.status || 'Open');
      setPriority(complaint.priority || 'Low');
      setIsOverdueFlag(Boolean(complaint.is_overdue));
      setNote('');
      setPhotoError(false);
      setShowReopenConfirm(false);
      setReopenReason('');
      setReopening(false);
    }
  }, [complaint]);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    if (isOpen) {
      window.addEventListener('keydown', handleKeyDown);
    }
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen || !complaint) return null;

  const categoryIconName = getCategoryIconName(complaint.category);

  async function handleSubmitTriage(e) {
    e.preventDefault();
    if (!onUpdateStatus) return;

    setSubmitting(true);
    try {
      await onUpdateStatus(complaint.id, {
        status,
        priority,
        is_overdue: isOverdueFlag,
        note: note.trim() || undefined,
      });
      setNote('');
      onClose();
    } catch (err) {
      // Error handled by parent toast context
    } finally {
      setSubmitting(false);
    }
  }

  async function handleConfirmReopen() {
    if (!onUpdateStatus) return;
    setReopening(true);
    try {
      await onUpdateStatus(complaint.id, {
        status: 'Open',
        priority,
        is_overdue: isOverdueFlag,
        note: reopenReason.trim() || 'Complaint reopened by admin',
      });
      setReopenReason('');
      setShowReopenConfirm(false);
      onClose();
    } catch (err) {
      // Error handled by parent toast context
    } finally {
      setReopening(false);
    }
  }

  const backendUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000';
  const photoFullUrl = complaint.photo_url
    ? complaint.photo_url.startsWith('http')
      ? complaint.photo_url
      : `${backendUrl}${complaint.photo_url}`
    : null;

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div
        className="modal-dialog modal-lg"
        role="dialog"
        aria-modal="true"
        aria-labelledby="complaint-modal-title"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="modal-header">
          <div className="modal-header-title-box">
            <span className="modal-complaint-id">Complaint #{complaint.id}</span>
            <h2 id="complaint-modal-title" className="modal-title">
              {complaint.category} Request
            </h2>
          </div>
          <button
            className="modal-close-btn"
            onClick={onClose}
            aria-label="Close dialog"
          >
            <SVGIcon name="x" size={18} />
          </button>
        </div>

        {/* Modal Body */}
        <div className="modal-body modal-scrollable">
          <div className="detail-modal-grid">
            {/* Left Column: Complaint Specs & Audit Timeline */}
            <div className="detail-main-col">
              <div className="detail-meta-card">
                <div className="detail-badges-row">
                  <StatusBadge status={complaint.status} />
                  <PriorityBadge priority={complaint.priority} />
                  {complaint.is_overdue && <OverdueBadge ageDays={complaint.age_days} />}
                </div>

                <div className="detail-info-grid">
                  <div className="detail-info-item">
                    <span className="info-label">Category</span>
                    <span className="info-value">
                      <SVGIcon name={categoryIconName} size={14} className="cat-icon-svg" />
                      {complaint.category}
                    </span>
                  </div>

                  <div className="detail-info-item">
                    <span className="info-label">Flat Number</span>
                    <span className="info-value">{formatFlatNumber(complaint.flat_number)}</span>
                  </div>

                  {complaint.user_name && (
                    <div className="detail-info-item">
                      <span className="info-label">Submitted By</span>
                      <span className="info-value">{complaint.user_name}</span>
                    </div>
                  )}

                  <div className="detail-info-item">
                    <span className="info-label">Submitted Date</span>
                    <span className="info-value">{formatDateTime(complaint.created_at)}</span>
                  </div>
                </div>

                <div className="detail-desc-box">
                  <span className="info-label">Description</span>
                  <p className="desc-text">{complaint.description}</p>
                </div>

                {/* Attached Photo Display */}
                {photoFullUrl && !photoError && (
                  <div className="detail-photo-box">
                    <span className="info-label">Attached Photo</span>
                    <div className="photo-attachment-card">
                      <img
                        src={photoFullUrl}
                        alt={`Attachment for complaint #${complaint.id}`}
                        className="attached-photo-img"
                        onError={() => setPhotoError(true)}
                      />
                      <a
                        href={photoFullUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="photo-view-link"
                      >
                        <SVGIcon name="image" size={14} />
                        View Full Image
                      </a>
                    </div>
                  </div>
                )}
              </div>

              {/* Audit Timeline Section */}
              <div className="detail-timeline-card">
                {loadingHistory ? (
                  <div className="loading-spinner-box">
                    <div className="loading-spinner" />
                    <span>Loading audit history...</span>
                  </div>
                ) : (
                  <Timeline history={history} />
                )}
              </div>
            </div>

            {/* Right Column: Admin Triage Control Panel (Admin Mode Only) */}
            {mode === 'admin' && (
              <div className="detail-admin-col">
                <form onSubmit={handleSubmitTriage} className="admin-triage-panel">
                  <h3 className="triage-panel-title">Triage Operations</h3>

                  <div className="form-group">
                    <label htmlFor="triage-status" className="form-label" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span>Status</span>
                      {isResolved && (
                        <span style={{ fontSize: '0.75rem', color: '#64748b', display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                          <SVGIcon name="lock" size={12} /> Locked (Resolved)
                        </span>
                      )}
                    </label>
                    <select
                      id="triage-status"
                      className="form-control"
                      value={status}
                      onChange={(e) => setStatus(e.target.value)}
                      disabled={isResolved}
                    >
                      {isResolved ? (
                        <option value="Resolved">Resolved (Locked)</option>
                      ) : (
                        <>
                          <option value="Open">Open</option>
                          <option value="In Progress">In Progress</option>
                          <option value="Resolved">Resolved</option>
                        </>
                      )}
                    </select>
                  </div>

                  {isResolved && (
                    <div className="reopen-section">
                      {!showReopenConfirm ? (
                        <button
                          type="button"
                          className="btn btn-outline-warning btn-block flex-center"
                          onClick={() => setShowReopenConfirm(true)}
                          style={{ marginBottom: '1rem', width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}
                        >
                          <SVGIcon name="rotate-ccw" size={15} />
                          Reopen Complaint
                        </button>
                      ) : (
                        <div
                          className="reopen-confirm-card"
                          style={{
                            marginBottom: '1rem',
                            padding: '12px',
                            border: '1px solid #f59e0b',
                            borderRadius: '8px',
                            background: 'rgba(245, 158, 11, 0.05)',
                          }}
                        >
                          <p style={{ fontSize: '0.85rem', fontWeight: 600, color: '#d97706', marginBottom: '8px' }}>
                            Confirm Reopening Complaint?
                          </p>
                          <input
                            type="text"
                            className="form-control"
                            placeholder="Reason for reopening (optional)..."
                            value={reopenReason}
                            onChange={(e) => setReopenReason(e.target.value)}
                            style={{ marginBottom: '8px', fontSize: '0.85rem' }}
                          />
                          <div style={{ display: 'flex', gap: '8px' }}>
                            <button
                              type="button"
                              className="btn btn-warning btn-sm"
                              style={{ flex: 1 }}
                              disabled={reopening}
                              onClick={handleConfirmReopen}
                            >
                              {reopening ? 'Reopening...' : 'Confirm Reopen'}
                            </button>
                            <button
                              type="button"
                              className="btn btn-secondary btn-sm"
                              disabled={reopening}
                              onClick={() => {
                                setShowReopenConfirm(false);
                                setReopenReason('');
                              }}
                            >
                              Cancel
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  <div className="form-group">
                    <label htmlFor="triage-priority" className="form-label">
                      Priority Level
                    </label>
                    <select
                      id="triage-priority"
                      className="form-control"
                      value={priority}
                      onChange={(e) => setPriority(e.target.value)}
                    >
                      <option value="Low">Low Priority</option>
                      <option value="Medium">Medium Priority</option>
                      <option value="High">High Priority</option>
                    </select>
                  </div>

                  <div className="form-group">
                    <label className="checkbox-label">
                      <input
                        type="checkbox"
                        checked={isOverdueFlag}
                        onChange={(e) => setIsOverdueFlag(e.target.checked)}
                      />
                      <span>Flag as Overdue (SLA Breach)</span>
                    </label>
                  </div>

                  <div className="form-group">
                    <label htmlFor="triage-note" className="form-label">
                      Audit Note (Optional)
                    </label>
                    <textarea
                      id="triage-note"
                      className="form-control"
                      rows={3}
                      placeholder="Add an internal note or status update rationale..."
                      value={note}
                      onChange={(e) => setNote(e.target.value)}
                    />
                  </div>

                  <div className="triage-actions">
                    <button
                      type="submit"
                      className="btn btn-primary btn-block"
                      disabled={submitting}
                    >
                      {submitting ? 'Saving Changes...' : 'Save Triage Update'}
                    </button>
                  </div>
                </form>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

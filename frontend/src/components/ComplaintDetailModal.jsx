import { useState, useEffect } from 'react';
import { X, Lock, RotateCcw } from 'lucide-react';
import Timeline from './Timeline';
import { StatusBadge, PriorityBadge, OverdueBadge } from './Badges';
import { Button } from './UIComponents';
import { formatFlatNumber, formatDateTime, getPhotoUrl } from '../utils/formatters';

export default function ComplaintDetailModal({
  isOpen,
  onClose,
  complaint,
  history = [],
  loadingHistory = false,
  mode = 'resident', // 'resident' | 'admin'
  onUpdateStatus,
}) {
  const [status, setStatus] = useState('Open');
  const [priority, setPriority] = useState('Low');
  const [isOverdueFlag, setIsOverdueFlag] = useState(false);
  const [note, setNote] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [photoError, setPhotoError] = useState(false);
  const [lightboxOpen, setLightboxOpen] = useState(false);

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
      setLightboxOpen(false);
    }
  }, [complaint]);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && isOpen) {
        if (lightboxOpen) {
          setLightboxOpen(false);
        } else {
          onClose();
        }
      }
    };
    if (isOpen) {
      window.addEventListener('keydown', handleKeyDown);
    }
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, lightboxOpen, onClose]);

  if (!isOpen || !complaint) return null;

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
      // Error handled by parent toast
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
      // Error handled by parent toast
    } finally {
      setReopening(false);
    }
  }

  const photoFullUrl = getPhotoUrl(complaint.photo_url);

  return (
    <div
      className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto"
      onClick={onClose}
    >
      <div
        className="bg-paper-card rounded-2xl shadow-card w-full max-w-3xl max-h-[90vh] flex flex-col overflow-hidden relative border border-line my-auto"
        role="dialog"
        aria-modal="true"
        aria-labelledby="complaint-modal-title"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-6 py-4 border-b border-line flex items-center justify-between bg-paper-card">
          <div className="flex items-center gap-2">
            <span className="font-mono text-sm font-semibold text-ink-muted">#{complaint.id}</span>
            <h2 id="complaint-modal-title" className="font-display font-semibold text-lg text-ink">
              {complaint.category} Request
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-ink-muted hover:text-ink hover:bg-paper-hover rounded-lg transition-colors"
            aria-label="Close dialog"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Body */}
        <div className="px-6 py-5 overflow-y-auto space-y-5 flex-1">
          {/* Header Row: Category / Badges */}
          <div className="flex items-center justify-between gap-3 flex-wrap">
            <div className="flex items-center gap-2">
              <span className="font-semibold text-base text-ink">{complaint.category}</span>
              {complaint.flat_number && (
                <span className="text-xs px-2 py-0.5 rounded bg-paper-hover font-medium text-ink-secondary">
                  Flat {formatFlatNumber(complaint.flat_number)}
                </span>
              )}
            </div>
            <div className="flex items-center gap-2 flex-wrap">
              <StatusBadge status={complaint.status} />
              <PriorityBadge priority={complaint.priority} />
              {complaint.is_overdue && <OverdueBadge ageDays={complaint.age_days} />}
            </div>
          </div>

          {/* User & Date info */}
          <div className="text-xs text-ink-muted">
            Submitted by <span className="font-medium text-ink">{complaint.user_name || 'Resident'}</span> on{' '}
            {formatDateTime(complaint.created_at)}
          </div>

          {/* Description */}
          <div className="space-y-1">
            <div className="text-xs font-semibold uppercase tracking-wide text-ink-muted">Description</div>
            <p className="text-sm text-ink-secondary leading-relaxed whitespace-pre-wrap">
              {complaint.description}
            </p>
          </div>

          {/* Photo attachment with Lightbox preview */}
          {photoFullUrl && !photoError && (
            <div className="space-y-1.5">
              <div className="text-xs font-semibold uppercase tracking-wide text-ink-muted">Attached Photo</div>
              <img
                src={photoFullUrl}
                alt={`Attachment for complaint #${complaint.id}`}
                className="rounded-lg max-h-64 object-cover cursor-zoom-in border border-line hover:opacity-95 transition-opacity"
                onClick={() => setLightboxOpen(true)}
                onError={() => setPhotoError(true)}
              />
            </div>
          )}

          {/* Full Screen Lightbox Overlay */}
          {lightboxOpen && photoFullUrl && (
            <div
              className="fixed inset-0 z-[100] bg-black/80 flex items-center justify-center p-4 cursor-zoom-out"
              onClick={() => setLightboxOpen(false)}
            >
              <img
                src={photoFullUrl}
                alt="Enlarged complaint attachment"
                className="max-w-full max-h-[90vh] object-contain rounded-lg shadow-2xl"
              />
              <button
                onClick={() => setLightboxOpen(false)}
                className="absolute top-4 right-4 p-2 text-white/80 hover:text-white hover:bg-white/10 rounded-full transition-colors"
                aria-label="Close photo preview"
              >
                <X className="w-6 h-6" />
              </button>
            </div>
          )}

          {/* Divider */}
          <div className="border-t border-line my-4" />

          {/* History & Admin Operations Section */}
          <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
            {/* History Timeline */}
            <div className={mode === 'admin' ? 'lg:col-span-3' : 'w-full'}>
              <h4 className="text-sm font-semibold uppercase tracking-wide text-ink-muted mb-3">
                History
              </h4>
              {loadingHistory ? (
                <div className="flex items-center gap-2 text-sm text-ink-muted py-4">
                  <div className="w-4 h-4 border-2 border-terracotta-400/30 border-t-terracotta-400 rounded-full animate-spin" />
                  <span>Loading audit history...</span>
                </div>
              ) : (
                <Timeline history={history} />
              )}
            </div>

            {/* Admin Triage Controls */}
            {mode === 'admin' && (
              <div className="lg:col-span-2 bg-paper-hover/50 rounded-xl p-4 border border-line h-fit">
                <h4 className="text-sm font-semibold uppercase tracking-wide text-ink mb-3">
                  Triage Operations
                </h4>
                <form onSubmit={handleSubmitTriage} className="space-y-4">
                  {/* Status Select */}
                  <div>
                    <label
                      htmlFor="triage-status"
                      className="block text-xs font-semibold text-ink-muted mb-1 flex items-center justify-between"
                    >
                      <span>Status</span>
                      {isResolved && (
                        <span className="text-[11px] text-ink-muted flex items-center gap-1 font-normal">
                          <Lock className="w-3 h-3" /> Locked
                        </span>
                      )}
                    </label>
                    <select
                      id="triage-status"
                      className="w-full rounded-lg border border-line bg-paper px-3 py-2 text-sm text-ink focus:ring-2 focus:ring-terracotta-400/40 focus:border-terracotta-400 transition-colors disabled:opacity-60"
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

                  {/* Reopen Workflow if Resolved */}
                  {isResolved && (
                    <div className="my-2">
                      {!showReopenConfirm ? (
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          isFullWidth
                          icon={<RotateCcw className="w-3.5 h-3.5" />}
                          onClick={() => setShowReopenConfirm(true)}
                        >
                          Reopen Complaint
                        </Button>
                      ) : (
                        <div className="p-3 border border-mustard-400/40 rounded-lg bg-mustard-50/50 space-y-2">
                          <p className="text-xs font-semibold text-mustard-500">Confirm Reopening Complaint?</p>
                          <input
                            type="text"
                            className="w-full rounded-lg border border-line bg-paper px-3 py-1.5 text-xs text-ink focus:ring-2 focus:ring-terracotta-400/40 focus:border-terracotta-400"
                            placeholder="Reason for reopening (optional)..."
                            value={reopenReason}
                            onChange={(e) => setReopenReason(e.target.value)}
                          />
                          <div className="flex gap-2">
                            <Button
                              type="button"
                              variant="primary"
                              size="xs"
                              className="flex-1"
                              isLoading={reopening}
                              onClick={handleConfirmReopen}
                            >
                              Confirm Reopen
                            </Button>
                            <Button
                              type="button"
                              variant="secondary"
                              size="xs"
                              onClick={() => {
                                setShowReopenConfirm(false);
                                setReopenReason('');
                              }}
                            >
                              Cancel
                            </Button>
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Priority Select */}
                  <div>
                    <label htmlFor="triage-priority" className="block text-xs font-semibold text-ink-muted mb-1">
                      Priority Level
                    </label>
                    <select
                      id="triage-priority"
                      className="w-full rounded-lg border border-line bg-paper px-3 py-2 text-sm text-ink focus:ring-2 focus:ring-terracotta-400/40 focus:border-terracotta-400 transition-colors"
                      value={priority}
                      onChange={(e) => setPriority(e.target.value)}
                    >
                      <option value="Low">Low Priority</option>
                      <option value="Medium">Medium Priority</option>
                      <option value="High">High Priority</option>
                    </select>
                  </div>

                  {/* Flag as Overdue Checkbox */}
                  <label className="flex items-center gap-2 cursor-pointer text-xs font-medium text-ink-secondary">
                    <input
                      type="checkbox"
                      checked={isOverdueFlag}
                      onChange={(e) => setIsOverdueFlag(e.target.checked)}
                      className="rounded border-line text-terracotta-400 focus:ring-terracotta-400/40"
                    />
                    <span>Flag as Overdue (SLA Breach)</span>
                  </label>

                  {/* Audit Note Input */}
                  <div>
                    <label htmlFor="triage-note" className="block text-xs font-semibold text-ink-muted mb-1">
                      Audit Note (Optional)
                    </label>
                    <textarea
                      id="triage-note"
                      rows={3}
                      className="w-full rounded-lg border border-line bg-paper px-3 py-2 text-sm text-ink focus:ring-2 focus:ring-terracotta-400/40 focus:border-terracotta-400 transition-colors"
                      placeholder="Add an internal note or status update rationale..."
                      value={note}
                      onChange={(e) => setNote(e.target.value)}
                    />
                  </div>

                  <Button
                    type="submit"
                    variant="primary"
                    isFullWidth
                    isLoading={submitting}
                  >
                    Save Triage Update
                  </Button>
                </form>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

import { useState, useEffect } from 'react';
import { X, Lock, RotateCcw, ChevronDown, History, AlignLeft, Image as ImageIcon, User, Calendar } from 'lucide-react';
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
  const [showTimeline, setShowTimeline] = useState(false);

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
      setShowTimeline(false);
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
        {/* Modal Top Bar */}
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
        <div className="px-6 py-6 overflow-y-auto space-y-6 flex-1">
          {/* SECTION 1: HEADER & METADATA */}
          <div className="space-y-2 pb-1 border-b border-line/60">
            <div className="flex items-center justify-between gap-3 flex-wrap">
              <div className="flex items-center gap-2.5 flex-wrap">
                <span className="font-display font-bold text-lg text-ink">{complaint.category}</span>
                {complaint.flat_number && (
                  <span className="text-xs px-2.5 py-0.5 rounded-full bg-paper-hover font-semibold text-ink border border-line">
                    {formatFlatNumber(complaint.flat_number)}
                  </span>
                )}
              </div>
              <div className="flex items-center gap-2 flex-wrap">
                <StatusBadge status={complaint.status} />
                <PriorityBadge priority={complaint.priority} />
                {complaint.is_overdue && <OverdueBadge ageDays={complaint.age_days} />}
              </div>
            </div>

            {/* Submitter details */}
            <div className="flex items-center gap-3 text-xs text-ink-muted flex-wrap pt-0.5">
              <span className="flex items-center gap-1">
                <User className="w-3.5 h-3.5 text-ink-muted" />
                Submitted by <strong className="font-semibold text-ink ml-0.5">{complaint.user_name || 'Resident'}</strong>
              </span>
              <span>•</span>
              <span className="flex items-center gap-1">
                <Calendar className="w-3.5 h-3.5 text-ink-muted" />
                {formatDateTime(complaint.created_at)}
              </span>
            </div>
          </div>

          {/* SECTION 2: ISSUE DESCRIPTION */}
          <div className="space-y-2">
            <h3 className="text-xs font-bold uppercase tracking-wider text-ink-muted flex items-center gap-1.5 border-b border-line/50 pb-1.5">
              <AlignLeft className="w-3.5 h-3.5 text-terracotta-400 shrink-0" />
              <span>Issue Description</span>
            </h3>
            <p className="text-sm md:text-[15px] text-ink font-sans leading-relaxed whitespace-pre-wrap pt-1 pl-0.5">
              {complaint.description}
            </p>
          </div>

          {/* SECTION 3: ATTACHED PHOTO */}
          {photoFullUrl && !photoError && (
            <div className="space-y-2 pt-1">
              <h3 className="text-xs font-bold uppercase tracking-wider text-ink-muted flex items-center gap-1.5 border-b border-line/50 pb-1.5">
                <ImageIcon className="w-3.5 h-3.5 text-terracotta-400 shrink-0" />
                <span>Attached Photo</span>
              </h3>
              <div className="inline-block group cursor-zoom-in pt-1" onClick={() => setLightboxOpen(true)}>
                <img
                  src={photoFullUrl}
                  alt={`Attachment for complaint #${complaint.id}`}
                  className="rounded-xl border border-line max-h-64 max-w-full object-contain shadow-card hover:shadow-lifted transition-all duration-150"
                  onError={() => setPhotoError(true)}
                />
                <div className="mt-1.5 text-xs text-terracotta-400 font-medium group-hover:underline">
                  Click to enlarge photo
                </div>
              </div>
            </div>
          )}

          {/* Lightbox Overlay */}
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

          <div className="border-t border-line my-5" />

          {/* SECTION 4: AUDIT HISTORY & TIMELINE */}
          {mode === 'admin' ? (
            <div className="grid grid-cols-1 lg:grid-cols-5 gap-6 items-start">
              {/* History Timeline Side */}
              <div className="lg:col-span-3 space-y-3">
                <div className="flex items-center justify-between gap-2 border-b border-line/50 pb-1.5">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-ink-muted flex items-center gap-1.5">
                    <History className="w-3.5 h-3.5 text-terracotta-400 shrink-0" />
                    <span>Audit History</span>
                  </h3>
                  <button
                    type="button"
                    onClick={() => setShowTimeline(!showTimeline)}
                    className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-paper-hover hover:bg-terracotta-50 hover:text-terracotta-500 border border-line text-xs font-semibold text-ink transition-all cursor-pointer shadow-xs"
                  >
                    <span>{showTimeline ? 'Hide Timeline' : 'View Timeline'}</span>
                    <ChevronDown className={`w-3.5 h-3.5 transition-transform duration-200 ${showTimeline ? 'rotate-180 text-terracotta-500' : ''}`} />
                  </button>
                </div>

                {showTimeline && (
                  <div className="pt-2">
                    {loadingHistory ? (
                      <div className="flex items-center gap-2 text-xs text-ink-muted py-4">
                        <div className="w-4 h-4 border-2 border-terracotta-400/30 border-t-terracotta-400 rounded-full animate-spin" />
                        <span>Loading audit history...</span>
                      </div>
                    ) : (
                      <Timeline history={history} />
                    )}
                  </div>
                )}
              </div>

              {/* Admin Triage Controls Side */}
              <div className="lg:col-span-2 bg-paper-hover/40 rounded-xl p-4 border border-line h-fit">
                <h4 className="text-xs font-bold uppercase tracking-wide text-ink mb-3">
                  Triage Operations
                </h4>
                <form onSubmit={handleSubmitTriage} className="space-y-4">
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
                          <p className="text-xs font-semibold text-mustard-600">Confirm Reopening Complaint?</p>
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

                  <label className="flex items-center gap-2 cursor-pointer text-xs font-medium text-ink-secondary">
                    <input
                      type="checkbox"
                      checked={isOverdueFlag}
                      onChange={(e) => setIsOverdueFlag(e.target.checked)}
                      className="rounded border-line text-terracotta-400 focus:ring-terracotta-400/40"
                    />
                    <span>Flag as Overdue (SLA Breach)</span>
                  </label>

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
            </div>
          ) : (
            /* Resident Mode: Distinct Section Header + Action Button */
            <div className="space-y-3">
              <div className="flex items-center justify-between gap-2 flex-wrap border-b border-line/50 pb-1.5">
                <h3 className="text-xs font-bold uppercase tracking-wider text-ink-muted flex items-center gap-1.5">
                  <History className="w-3.5 h-3.5 text-terracotta-400 shrink-0" />
                  <span>Audit History & Activity Log</span>
                  <span className="text-[11px] font-mono text-ink-muted ml-1 font-normal">
                    ({history.length} {history.length === 1 ? 'event' : 'events'})
                  </span>
                </h3>

                <button
                  type="button"
                  onClick={() => setShowTimeline(!showTimeline)}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-paper-hover hover:bg-terracotta-50 hover:text-terracotta-500 border border-line text-xs font-semibold text-ink transition-all cursor-pointer shadow-xs"
                >
                  <span>{showTimeline ? 'Hide History Timeline' : 'View Audit History Timeline'}</span>
                  <ChevronDown className={`w-3.5 h-3.5 transition-transform duration-200 ${showTimeline ? 'rotate-180 text-terracotta-500' : ''}`} />
                </button>
              </div>

              {showTimeline && (
                <div className="pt-2">
                  {loadingHistory ? (
                    <div className="flex items-center gap-2 text-xs text-ink-muted py-4">
                      <div className="w-4 h-4 border-2 border-terracotta-400/30 border-t-terracotta-400 rounded-full animate-spin" />
                      <span>Loading audit history...</span>
                    </div>
                  ) : (
                    <Timeline history={history} />
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

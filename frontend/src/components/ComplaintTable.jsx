import { useState, useEffect } from 'react';
import { Calendar, ChevronLeft, ChevronRight } from 'lucide-react';
import { StatusBadge, PriorityBadge, OverdueBadge } from './Badges';
import { formatDate, formatFlatNumber, getPhotoUrl } from '../utils/formatters';
import { SkeletonTable } from './Skeletons';
import EmptyState from './EmptyState';
import { ErrorState } from './UIComponents';
import emptyComplaintsIllustration from '../assets/empty-complaints-new.webp';

const CATEGORIES_COLOR_MAP = {
  Plumbing: { border: 'border-teal-400', text: 'text-teal-500' },
  Electrical: { border: 'border-mustard-400', text: 'text-mustard-500' },
  Cleaning: { border: 'border-plum-400', text: 'text-plum-400' },
  Security: { border: 'border-clay-400', text: 'text-clay-500' },
  Lift: { border: 'border-olive-400', text: 'text-olive-500' },
  Parking: { border: 'border-terracotta-400', text: 'text-terracotta-500' },
  Other: { border: 'border-line-dark', text: 'text-ink-secondary' },
};

const COLOR_PALETTE = [
  { border: 'border-teal-400', text: 'text-teal-500' },
  { border: 'border-mustard-400', text: 'text-mustard-500' },
  { border: 'border-plum-400', text: 'text-plum-400' },
  { border: 'border-clay-400', text: 'text-clay-500' },
  { border: 'border-olive-400', text: 'text-olive-500' },
  { border: 'border-terracotta-400', text: 'text-terracotta-500' },
  { border: 'border-line-dark', text: 'text-ink-secondary' },
];

function getCategoryStyle(category, index) {
  if (category && CATEGORIES_COLOR_MAP[category]) {
    return CATEGORIES_COLOR_MAP[category];
  }
  return COLOR_PALETTE[index % COLOR_PALETTE.length];
}

export default function ComplaintTable({
  complaints = [],
  loading = false,
  error = null,
  emptyMessage = 'No complaints found.',
  emptyDescription = 'Try adjusting your search query or status filters.',
  onEmptyAction,
  emptyActionText,
  onSelectComplaint,
  mode = 'admin',
  onRetry,
  illustration,
  layout = 'list', // 'list' (default vertical stack) or 'grid' (2-col grid)
  pageSize = 8,
  paginate = true,
}) {
  const [currentPage, setCurrentPage] = useState(1);

  // Reset to page 1 whenever complaints list changes
  useEffect(() => {
    setCurrentPage(1);
  }, [complaints.length]);

  if (loading) {
    return <SkeletonTable rows={4} cols={4} />;
  }

  if (error) {
    return (
      <ErrorState
        title="Failed to load complaints"
        message={error}
        onRetry={onRetry}
      />
    );
  }

  if (!complaints || complaints.length === 0) {
    return (
      <EmptyState
        illustration={illustration || emptyComplaintsIllustration}
        icon="clipboard"
        title={emptyMessage}
        description={emptyDescription}
        actionText={emptyActionText}
        onAction={onEmptyAction}
      />
    );
  }

  const isGrid = layout === 'grid';
  const totalPages = paginate ? Math.ceil(complaints.length / pageSize) : 1;
  const displayedComplaints = paginate
    ? complaints.slice((currentPage - 1) * pageSize, currentPage * pageSize)
    : complaints;

  return (
    <div className="space-y-4">
      {/* COMPLAINT CARDS CONTAINER */}
      <div className={isGrid ? 'grid grid-cols-1 sm:grid-cols-2 gap-4 items-stretch' : 'flex flex-col space-y-3.5'}>
        {displayedComplaints.map((c, index) => {
          const globalIndex = paginate ? (currentPage - 1) * pageSize + index : index;
          const catStyle = getCategoryStyle(c.category, globalIndex);
          const isLatest = globalIndex === 0;

          return (
            <div
              key={c.id}
              onClick={() => onSelectComplaint && onSelectComplaint(c)}
              className={`bg-paper-card rounded-xl border border-line shadow-card hover:shadow-lifted hover:-translate-y-0.5 transition-all duration-200 p-4 border-l-4 ${catStyle.border} cursor-pointer flex flex-col justify-between space-y-3 group ${
                isLatest && !isGrid ? 'ring-1 ring-terracotta-400/30' : ''
              }`}
            >
              {/* Top Row: Category + ID + Flat + Status */}
              <div className="flex items-center justify-between gap-2 border-b border-line/60 pb-2.5 flex-wrap sm:flex-nowrap">
                <div className="flex items-center gap-2 flex-wrap min-w-0">
                  <span className={`text-[11px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-paper-hover border border-line/50 ${catStyle.text}`}>
                    {c.category}
                  </span>
                  <span className="text-xs text-ink-muted font-mono font-bold">#{c.id}</span>
                  {c.flat_number && (
                    <span className="text-xs font-medium px-1.5 py-0.5 rounded bg-paper-hover text-ink-secondary">
                      {formatFlatNumber(c.flat_number)}
                    </span>
                  )}
                  {isLatest && (
                    <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-terracotta-400/10 text-terracotta-500 border border-terracotta-400/20">
                      Latest Submission
                    </span>
                  )}
                </div>
                <div className="shrink-0">
                  <StatusBadge status={c.status} />
                </div>
              </div>

              {/* Middle Row: Description + Photo Attachment */}
              <div className="flex items-start justify-between gap-3 flex-1 py-0.5">
                <p className="text-xs md:text-sm text-ink-secondary line-clamp-2 leading-relaxed font-sans flex-1">
                  {c.description}
                </p>
                {c.photo_url && (
                  <img
                    src={getPhotoUrl(c.photo_url)}
                    alt="Attachment"
                    className="w-12 h-12 rounded-lg object-cover border border-line shrink-0 shadow-xs group-hover:border-terracotta-400/40 transition-colors"
                    onError={(e) => {
                      e.target.style.display = 'none';
                    }}
                  />
                )}
              </div>

              {/* Bottom Row: Date + Priority + Overdue */}
              <div className="flex items-center justify-between gap-2 text-xs text-ink-muted pt-2.5 border-t border-line/60 mt-auto flex-wrap sm:flex-nowrap">
                <div className="flex items-center gap-1.5 min-w-0 text-ink-muted text-[11px] sm:text-xs">
                  <Calendar className="w-3.5 h-3.5 shrink-0 text-ink-muted" />
                  <span className="truncate">{formatDate(c.created_at)}</span>
                  {mode === 'admin' && c.user_name && (
                    <span className="text-ink-muted truncate hidden sm:inline font-medium">
                      • {c.user_name}
                    </span>
                  )}
                </div>

                <div className="flex items-center gap-1.5 flex-wrap justify-end shrink-0">
                  <PriorityBadge priority={c.priority} />
                  {c.is_overdue && <OverdueBadge ageDays={c.age_days} />}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* PAGINATION CONTROLS */}
      {paginate && totalPages > 1 && (
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-4 border-t border-line mt-4 px-1">
          <span className="text-xs text-ink-muted">
            Showing <span className="font-semibold text-ink">{(currentPage - 1) * pageSize + 1}</span> to{' '}
            <span className="font-semibold text-ink">{Math.min(currentPage * pageSize, complaints.length)}</span> of{' '}
            <span className="font-semibold text-ink">{complaints.length}</span> complaints
          </span>

          <div className="flex items-center gap-1.5">
            <button
              type="button"
              disabled={currentPage === 1}
              onClick={() => {
                setCurrentPage((p) => Math.max(1, p - 1));
                window.scrollTo({ top: 0, behavior: 'smooth' });
              }}
              className="px-2.5 py-1.5 rounded-lg border border-line bg-paper-card text-xs font-semibold text-ink-secondary hover:bg-paper-hover disabled:opacity-40 disabled:cursor-not-allowed transition-all flex items-center gap-1 shadow-xs"
            >
              <ChevronLeft className="w-4 h-4" />
              <span>Previous</span>
            </button>

            <div className="flex items-center gap-1">
              {Array.from({ length: totalPages }, (_, i) => i + 1).map((pageNum) => (
                <button
                  key={pageNum}
                  type="button"
                  onClick={() => {
                    setCurrentPage(pageNum);
                    window.scrollTo({ top: 0, behavior: 'smooth' });
                  }}
                  className={`w-7 h-7 rounded-lg text-xs font-semibold transition-all ${
                    currentPage === pageNum
                      ? 'bg-terracotta-400 text-white shadow-xs font-bold'
                      : 'bg-paper-card text-ink-secondary hover:bg-paper-hover border border-line'
                  }`}
                >
                  {pageNum}
                </button>
              ))}
            </div>

            <button
              type="button"
              disabled={currentPage === totalPages}
              onClick={() => {
                setCurrentPage((p) => Math.min(totalPages, p + 1));
                window.scrollTo({ top: 0, behavior: 'smooth' });
              }}
              className="px-2.5 py-1.5 rounded-lg border border-line bg-paper-card text-xs font-semibold text-ink-secondary hover:bg-paper-hover disabled:opacity-40 disabled:cursor-not-allowed transition-all flex items-center gap-1 shadow-xs"
            >
              <span>Next</span>
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

import { Calendar } from 'lucide-react';
import { StatusBadge, PriorityBadge, OverdueBadge } from './Badges';
import { formatDate, formatFlatNumber, getPhotoUrl } from '../utils/formatters';
import { SkeletonTable } from './Skeletons';
import EmptyState from './EmptyState';
import { ErrorState } from './UIComponents';
import emptyComplaintsIllustration from '../assets/empty-complaints-new.webp';

const CATEGORIES_COLOR_MAP = {
  Plumbing: { border: 'border-terracotta-400', text: 'text-terracotta-500' },
  Electrical: { border: 'border-mustard-400', text: 'text-mustard-600' },
  Cleaning: { border: 'border-teal-400', text: 'text-teal-600' },
  Security: { border: 'border-olive-400', text: 'text-olive-600' },
  Lift: { border: 'border-plum-400', text: 'text-plum-600' },
  Parking: { border: 'border-terracotta-400', text: 'text-terracotta-500' },
  Other: { border: 'border-teal-400', text: 'text-teal-600' },
};

const COLOR_PALETTE = [
  { border: 'border-terracotta-400', text: 'text-terracotta-500' },
  { border: 'border-olive-400', text: 'text-olive-600' },
  { border: 'border-mustard-400', text: 'text-mustard-600' },
  { border: 'border-teal-400', text: 'text-teal-600' },
  { border: 'border-plum-400', text: 'text-plum-600' },
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
}) {
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

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 items-stretch">
      {complaints.map((c, index) => {
        const catStyle = getCategoryStyle(c.category, index);

        return (
          <div
            key={c.id}
            onClick={() => onSelectComplaint && onSelectComplaint(c)}
            className={`bg-paper-card rounded-xl border border-line shadow-card hover:shadow-lifted hover:-translate-y-0.5 transition-all duration-200 p-4 border-l-4 ${catStyle.border} cursor-pointer flex flex-col justify-between space-y-3 group`}
          >
            {/* Top Row: Category + ID + Flat + Status */}
            <div className="flex items-start sm:items-center justify-between gap-2 border-b border-line/60 pb-2.5">
              <div className="flex items-center gap-1.5 flex-wrap min-w-0 flex-1">
                <span className={`text-[10px] sm:text-[11px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-paper-hover border border-line/50 ${catStyle.text}`}>
                  {c.category}
                </span>
                <span className="text-xs text-ink-muted font-mono font-medium">#{c.id}</span>
                {c.flat_number && (
                  <span className="text-[10px] sm:text-[11px] font-medium px-1.5 py-0.5 rounded bg-paper-hover text-ink-secondary">
                    {formatFlatNumber(c.flat_number)}
                  </span>
                )}
              </div>
              <div className="shrink-0">
                <StatusBadge status={c.status} />
              </div>
            </div>

            {/* Middle Row: Description + Photo Attachment */}
            <div className="flex items-start justify-between gap-3 flex-1 py-1">
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
                  <span className="text-ink-muted truncate hidden sm:inline">
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
  );
}

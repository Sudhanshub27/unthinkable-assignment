import { Calendar } from 'lucide-react';
import { StatusBadge, PriorityBadge, OverdueBadge } from './Badges';
import { formatDate, formatFlatNumber } from '../utils/formatters';
import { SkeletonTable } from './Skeletons';
import EmptyState from './EmptyState';
import { ErrorState } from './UIComponents';
import emptyComplaintsIllustration from '../assets/empty-complaints-new.png';

const CATEGORIES_COLOR_MAP = {
  Plumbing: { border: 'border-terracotta-400', text: 'text-terracotta-400' },
  Electrical: { border: 'border-mustard-400', text: 'text-mustard-400' },
  Cleaning: { border: 'border-teal-400', text: 'text-teal-400' },
  Security: { border: 'border-olive-400', text: 'text-olive-400' },
  Lift: { border: 'border-plum-400', text: 'text-plum-400' },
  Parking: { border: 'border-terracotta-400', text: 'text-terracotta-400' },
  Other: { border: 'border-teal-400', text: 'text-teal-400' },
};

const COLOR_PALETTE = [
  { border: 'border-terracotta-400', text: 'text-terracotta-400' },
  { border: 'border-olive-400', text: 'text-olive-400' },
  { border: 'border-mustard-400', text: 'text-mustard-400' },
  { border: 'border-teal-400', text: 'text-teal-400' },
  { border: 'border-plum-400', text: 'text-plum-400' },
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
    return <SkeletonTable rows={5} cols={7} />;
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
    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
      {complaints.map((c, index) => {
        const catStyle = getCategoryStyle(c.category, index);

        return (
          <div
            key={c.id}
            onClick={() => onSelectComplaint && onSelectComplaint(c)}
            className={`bg-paper-card rounded-xl shadow-soft hover:shadow-card transition-all p-4 border-l-4 ${catStyle.border} cursor-pointer hover:-translate-y-0.5 flex flex-col justify-between`}
          >
            {/* Top Row */}
            <div>
              <div className="flex items-center justify-between gap-2 mb-2.5">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className={`text-xs font-semibold uppercase tracking-wide ${catStyle.text}`}>
                    {c.category}
                  </span>
                  <span className="text-xs text-ink-muted font-mono font-medium">#{c.id}</span>
                  {c.flat_number && (
                    <span className="text-xs font-medium px-1.5 py-0.5 rounded bg-paper-hover text-ink-secondary">
                      {formatFlatNumber(c.flat_number)}
                    </span>
                  )}
                </div>
                <StatusBadge status={c.status} />
              </div>

              {/* Middle Row (Description + Photo Thumbnail) */}
              <div className="flex items-start justify-between gap-3 mb-3">
                <p className="text-sm text-ink-secondary line-clamp-2 flex-1">
                  {c.description}
                </p>
                {c.photo_url && (
                  <img
                    src={c.photo_url}
                    alt="Attachment"
                    className="w-11 h-11 rounded-lg object-cover border border-line shrink-0"
                  />
                )}
              </div>
            </div>

            {/* Bottom Row */}
            <div className="flex items-center justify-between text-xs text-ink-muted pt-3 border-t border-line mt-auto">
              <div className="flex items-center gap-1.5 min-w-0">
                <Calendar className="w-3.5 h-3.5 shrink-0 text-ink-muted" />
                <span className="truncate">{formatDate(c.created_at)}</span>
                {mode === 'admin' && c.user_name && (
                  <span className="text-ink-muted truncate hidden sm:inline">
                    • {c.user_name}
                  </span>
                )}
              </div>

              <div className="flex items-center gap-1.5 flex-wrap justify-end shrink-0 ml-2">
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

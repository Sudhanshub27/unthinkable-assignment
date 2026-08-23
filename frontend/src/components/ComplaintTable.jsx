import SVGIcon from './SVGIcon';
import { StatusBadge, PriorityBadge, OverdueBadge } from './Badges';
import { formatFlatNumber, getCategoryIconName, formatDate } from '../utils/formatters';
import { SkeletonTable } from './Skeletons';
import EmptyState from './EmptyState';
import { ErrorState } from './UIComponents';
import emptyComplaintsIllustration from '../assets/empty-complaints.png';

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
    <div className="complaint-table-container">
      {/* Desktop Table View */}
      <div className="table-responsive desktop-table-only">
        <table className="data-table app-table">
          <thead>
            <tr>
              <th style={{ width: '70px' }}>ID</th>
              {mode === 'admin' && <th>Resident</th>}
              <th>Flat</th>
              <th>Category</th>
              <th>Status</th>
              <th>Priority</th>
              <th>Age</th>
              <th>Created</th>
              <th style={{ textAlign: 'right' }}>Action</th>
            </tr>
          </thead>
          <tbody>
            {complaints.map((c) => {
              const iconName = getCategoryIconName(c.category);
              return (
                <tr key={c.id} className={`table-row ${c.is_overdue ? 'table-row-overdue' : ''}`}>
                  <td className="font-mono font-medium">#{c.id}</td>
                  {mode === 'admin' && (
                    <td>
                      <div className="table-user-name">{c.user_name || 'Resident'}</div>
                      {c.user_email && <div className="table-user-email text-xs text-muted">{c.user_email}</div>}
                    </td>
                  )}
                  <td>
                    <span className="flat-badge-text">{formatFlatNumber(c.flat_number)}</span>
                  </td>
                  <td>
                    <div className="table-cat-pill">
                      <SVGIcon name={iconName} size={14} className="cat-icon-svg" />
                      <span>{c.category}</span>
                    </div>
                  </td>
                  <td>
                    <StatusBadge status={c.status} />
                  </td>
                  <td>
                    <PriorityBadge priority={c.priority} />
                  </td>
                  <td>
                    <div className="age-cell" style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                      <span>{c.age_days !== undefined && c.age_days !== null ? `${c.age_days}d` : '-'}</span>
                      {c.is_overdue && <OverdueBadge ageDays={c.age_days} />}
                    </div>
                  </td>
                  <td className="text-muted text-sm">{formatDate(c.created_at)}</td>
                  <td style={{ textAlign: 'right' }}>
                    <button
                      className="btn btn-outline btn-xs"
                      onClick={() => onSelectComplaint && onSelectComplaint(c)}
                    >
                      <span>{mode === 'admin' ? 'Manage' : 'View'}</span>
                      <SVGIcon name="file-text" size={12} className="btn-icon-right" />
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Mobile Responsive Cards View */}
      <div className="mobile-cards-only">
        {complaints.map((c) => {
          const iconName = getCategoryIconName(c.category);
          return (
            <div
              key={c.id}
              className={`complaint-mobile-card ${c.is_overdue ? 'mobile-card-overdue' : ''}`}
              onClick={() => onSelectComplaint && onSelectComplaint(c)}
            >
              <div className="mobile-card-header">
                <div className="mobile-card-id-group">
                  <span className="mobile-card-id">#{c.id}</span>
                  <span className="mobile-card-flat">{formatFlatNumber(c.flat_number)}</span>
                </div>
                <div className="mobile-card-badges">
                  {c.is_overdue && <OverdueBadge ageDays={c.age_days} />}
                  <StatusBadge status={c.status} />
                </div>
              </div>

              <div className="mobile-card-category">
                <SVGIcon name={iconName} size={14} className="cat-icon-svg" />
                <span>{c.category}</span>
                {mode === 'admin' && c.user_name && (
                  <span className="mobile-card-user">• {c.user_name}</span>
                )}
              </div>

              <p className="mobile-card-desc">{c.description}</p>

              <div className="mobile-card-footer">
                <PriorityBadge priority={c.priority} />
                <span className="mobile-card-date">{formatDate(c.created_at)}</span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

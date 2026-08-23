function getDotColor(item) {
  const status = item.new_value || item.status || (item.change_type === 'created' ? 'Open' : '');
  if (status === 'Open' || item.change_type === 'created') return 'bg-terracotta-400';
  if (status === 'In Progress') return 'bg-mustard-400';
  if (status === 'Resolved') return 'bg-olive-400';
  if (status === 'Reopened' || item.change_type === 'reopened') return 'bg-clay-500';
  return 'bg-terracotta-400';
}

function getActionLabel(h) {
  if (h.change_type === 'created') return 'Complaint Created';
  if (h.change_type === 'reopened') return `Complaint Reopened (${h.old_value || 'Resolved'} → ${h.new_value})`;
  if (h.change_type === 'status_change') return `Status changed to ${h.new_value}`;
  if (h.change_type === 'priority_change') return `Priority updated to ${h.new_value}`;
  if (h.change_type === 'overdue_flag') return `Overdue flag set to ${h.new_value}`;
  if (h.change_type === 'note_added') return 'Audit Note Added';
  return h.change_type || 'Event Logged';
}

export default function Timeline({ history }) {
  if (!history || history.length === 0) {
    return <p className="text-xs text-ink-muted italic py-2">No history entries recorded yet.</p>;
  }

  return (
    <div className="relative pl-6 space-y-0">
      {/* Vertical Line */}
      <div className="absolute left-2 top-1.5 bottom-1.5 w-0.5 bg-line" />

      {history.map((h, idx) => {
        const isFirst = idx === 0;
        const dotColor = getDotColor(h);
        const label = getActionLabel(h);

        return (
          <div className="relative pb-6 last:pb-0" key={h.id || idx}>
            {/* Dot */}
            <div
              className={`absolute -left-6 top-1 w-3 h-3 rounded-full border-2 border-paper-card ${dotColor}`}
            />

            {/* Entry Content */}
            <div className={isFirst ? 'bg-paper-hover rounded-lg p-3' : 'py-0.5'}>
              <div className="text-sm font-semibold text-ink">{label}</div>
              <div className="text-xs text-ink-muted mt-0.5 flex items-center gap-2 flex-wrap">
                <span>
                  {h.actor_name || 'System'} ({h.actor_role || 'system'})
                </span>
                <span>•</span>
                <span>
                  {new Date(h.created_at).toLocaleString('en-US', {
                    month: 'short',
                    day: 'numeric',
                    year: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </span>
              </div>

              {h.note && (
                <div className="text-sm text-ink-secondary italic mt-2 pl-3 border-l-2 border-line">
                  {h.note}
                </div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}

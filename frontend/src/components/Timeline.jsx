export default function Timeline({ history }) {
  if (!history || history.length === 0) {
    return <p className="timeline-empty">No history entries recorded yet.</p>;
  }

  const getEventIcon = (type) => {
    switch (type) {
      case 'created':
        return '📋';
      case 'status_change':
        return '🔄';
      case 'priority_change':
        return '⚡';
      case 'overdue_flag':
        return '⚠️';
      default:
        return '📌';
    }
  };

  return (
    <div className="timeline-container">
      <h4 className="timeline-title">Audit History Timeline</h4>
      <div className="timeline-list">
        {history.map((h, idx) => (
          <div className="timeline-item" key={h.id || idx}>
            <div className="timeline-badge-icon">{getEventIcon(h.change_type)}</div>
            <div className="timeline-content">
              <div className="timeline-header-row">
                <span className="timeline-action">
                  {h.change_type === 'created'
                    ? 'Complaint Created'
                    : h.change_type === 'status_change'
                    ? `Status updated: ${h.old_value || 'None'} → ${h.new_value}`
                    : h.change_type === 'priority_change'
                    ? `Priority updated: ${h.old_value || 'Low'} → ${h.new_value}`
                    : h.change_type === 'overdue_flag'
                    ? `Overdue flag set to ${h.new_value}`
                    : h.change_type}
                </span>
                <span className="timeline-date">
                  {new Date(h.created_at).toLocaleString('en-US', {
                    month: 'short',
                    day: 'numeric',
                    year: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </span>
              </div>

              <div className="timeline-actor">
                Logged by <span className="actor-name">{h.actor_name || 'System'}</span> ({h.actor_role})
              </div>

              {h.note && <div className="timeline-note-box">💬 {h.note}</div>}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

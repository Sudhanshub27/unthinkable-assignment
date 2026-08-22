export function StatusBadge({ status }) {
  const map = {
    Open: { class: 'badge-status-open', icon: '🔴' },
    'In Progress': { class: 'badge-status-progress', icon: '⏳' },
    Resolved: { class: 'badge-status-resolved', icon: '🟢' },
  };
  const config = map[status] || { class: 'badge-status-open', icon: '•' };
  return (
    <span className={`badge ${config.class}`}>
      <span className="badge-dot">{config.icon}</span> {status}
    </span>
  );
}

export function PriorityBadge({ priority }) {
  const map = {
    Low: { class: 'badge-priority-low', icon: '🟢' },
    Medium: { class: 'badge-priority-medium', icon: '🟡' },
    High: { class: 'badge-priority-high', icon: '🔴' },
  };
  const config = map[priority] || { class: 'badge-priority-low', icon: '•' };
  return (
    <span className={`badge ${config.class}`}>
      <span className="badge-dot">{config.icon}</span> {priority} Priority
    </span>
  );
}

export function OverdueBadge({ ageDays }) {
  return (
    <span className="badge badge-overdue">
      ⚠️ OVERDUE {ageDays !== undefined ? `(${ageDays}d)` : ''}
    </span>
  );
}

export function ImportantBadge() {
  return (
    <span className="badge badge-important">
      📌 IMPORTANT ANNOUNCEMENT
    </span>
  );
}

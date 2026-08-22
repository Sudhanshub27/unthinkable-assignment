export function StatusBadge({ status }) {
  const map = {
    Open: { class: 'badge-open', icon: '🔴' },
    'In Progress': { class: 'badge-progress', icon: '⏳' },
    Resolved: { class: 'badge-resolved', icon: '✅' },
  };
  const config = map[status] || { class: 'badge-open', icon: '•' };
  return (
    <span className={`badge ${config.class}`}>
      <span>{config.icon}</span> {status}
    </span>
  );
}

export function PriorityBadge({ priority }) {
  const map = {
    Low: { class: 'badge-priority-low', icon: '🟢' },
    Medium: { class: 'badge-priority-medium', icon: '🟡' },
    High: { class: 'badge-priority-high', icon: '🔥' },
  };
  const config = map[priority] || { class: 'badge-priority-low', icon: '•' };
  return (
    <span className={`badge ${config.class}`}>
      <span>{config.icon}</span> {priority}
    </span>
  );
}

export function OverdueBadge() {
  return (
    <span className="badge badge-overdue">
      ⚠️ OVERDUE
    </span>
  );
}

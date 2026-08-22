export function StatusBadge({ status }) {
  const cls = { Open: 'badge-open', 'In Progress': 'badge-progress', Resolved: 'badge-resolved' }[status];
  return <span className={`badge ${cls}`}>{status}</span>;
}

export function PriorityBadge({ priority }) {
  const cls = { Low: 'badge-priority-low', Medium: 'badge-priority-medium', High: 'badge-priority-high' }[priority];
  return <span className={`badge ${cls}`}>{priority}</span>;
}

export function OverdueBadge() {
  return <span className="badge badge-overdue">OVERDUE</span>;
}

import SVGIcon from './SVGIcon';

export function StatusBadge({ status }) {
  const map = {
    Open: { class: 'badge-status-open', icon: 'clock' },
    'In Progress': { class: 'badge-status-progress', icon: 'clock' },
    Resolved: { class: 'badge-status-resolved', icon: 'check-circle' },
  };
  const config = map[status] || { class: 'badge-status-open', icon: 'clock' };
  return (
    <span className={`badge ${config.class}`}>
      <SVGIcon name={config.icon} size={12} className="badge-icon-svg" /> {status}
    </span>
  );
}

export function PriorityBadge({ priority }) {
  const map = {
    Low: { class: 'badge-priority-low' },
    Medium: { class: 'badge-priority-medium' },
    High: { class: 'badge-priority-high' },
  };
  const config = map[priority] || { class: 'badge-priority-low' };
  return (
    <span className={`badge ${config.class}`}>
      {priority} Priority
    </span>
  );
}

export function OverdueBadge({ ageDays }) {
  return (
    <span className="badge badge-overdue">
      <SVGIcon name="alert-triangle" size={12} className="badge-icon-svg" />
      OVERDUE {ageDays !== undefined && ageDays !== null ? `(${ageDays}d)` : ''}
    </span>
  );
}

export function ImportantBadge() {
  return (
    <span className="badge badge-important">
      <SVGIcon name="megaphone" size={12} className="badge-icon-svg" />
      IMPORTANT ANNOUNCEMENT
    </span>
  );
}

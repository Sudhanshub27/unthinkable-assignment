import { Clock, CheckCircle2, Megaphone } from 'lucide-react';

export function StatusBadge({ status }) {
  const map = {
    Open: {
      className: 'bg-terracotta-50 text-terracotta-500',
      icon: Clock,
    },
    'In Progress': {
      className: 'bg-mustard-50 text-mustard-500',
      icon: Clock,
    },
    Resolved: {
      className: 'bg-olive-50 text-olive-500',
      icon: CheckCircle2,
    },
    Reopened: {
      className: 'bg-mustard-50 text-mustard-500',
      icon: Clock,
    },
  };

  const config = map[status] || {
    className: 'bg-terracotta-50 text-terracotta-500',
    icon: Clock,
  };
  const Icon = config.icon;

  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold ${config.className}`}>
      <Icon className="w-3.5 h-3.5 shrink-0" />
      <span>{status}</span>
    </span>
  );
}

export function PriorityBadge({ priority }) {
  const map = {
    Low: 'bg-teal-50 text-teal-500',
    Medium: 'bg-mustard-50 text-mustard-500',
    High: 'bg-terracotta-50 text-clay-500',
  };

  const className = map[priority] || 'bg-teal-50 text-teal-500';

  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold ${className}`}>
      <span>{priority} Priority</span>
    </span>
  );
}

export function OverdueBadge({ ageDays }) {
  return (
    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-clay-500/10 text-clay-500">
      <span className="w-1.5 h-1.5 rounded-full bg-clay-500 animate-pulse shrink-0" />
      <span>OVERDUE {ageDays !== undefined && ageDays !== null ? `(${ageDays}d)` : ''}</span>
    </span>
  );
}

export function ImportantBadge() {
  return (
    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-mustard-50 text-mustard-500">
      <Megaphone className="w-3.5 h-3.5 shrink-0" />
      <span>IMPORTANT ANNOUNCEMENT</span>
    </span>
  );
}

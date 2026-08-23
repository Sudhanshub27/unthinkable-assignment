import { Clock, CheckCircle2, Megaphone } from 'lucide-react';

export function StatusBadge({ status }) {
  const map = {
    Open: {
      className: 'bg-terracotta-50 text-terracotta-500 border border-terracotta-100',
      icon: Clock,
    },
    'In Progress': {
      className: 'bg-mustard-50 text-mustard-600 border border-mustard-200',
      icon: Clock,
    },
    Resolved: {
      className: 'bg-olive-50 text-olive-600 border border-olive-100',
      icon: CheckCircle2,
    },
    Reopened: {
      className: 'bg-mustard-50 text-mustard-600 border border-mustard-200',
      icon: Clock,
    },
  };

  const config = map[status] || {
    className: 'bg-terracotta-50 text-terracotta-500 border border-terracotta-100',
    icon: Clock,
  };
  const Icon = config.icon;

  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium whitespace-nowrap shrink-0 ${config.className}`}>
      <Icon className="w-3.5 h-3.5 shrink-0" />
      <span>{status}</span>
    </span>
  );
}

export function PriorityBadge({ priority }) {
  const map = {
    Low: 'bg-teal-50 text-teal-600 border border-teal-100',
    Medium: 'bg-mustard-50 text-mustard-600 border border-mustard-100',
    High: 'bg-clay-500/10 text-clay-500 border border-clay-500/20',
  };

  const className = map[priority] || 'bg-teal-50 text-teal-600 border border-teal-100';

  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium whitespace-nowrap shrink-0 ${className}`}>
      <span>{priority} Priority</span>
    </span>
  );
}

export function OverdueBadge({ ageDays }) {
  return (
    <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[11px] font-medium whitespace-nowrap shrink-0 bg-clay-500/10 text-clay-500 border border-clay-500/20">
      <span className="w-1.5 h-1.5 rounded-full bg-clay-500 animate-pulse shrink-0" />
      <span>OVERDUE {ageDays !== undefined && ageDays !== null ? `(${ageDays}d)` : ''}</span>
    </span>
  );
}

export function ImportantBadge() {
  return (
    <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold whitespace-nowrap shrink-0 bg-mustard-50 text-mustard-600 border border-mustard-200">
      <Megaphone className="w-3.5 h-3.5 shrink-0" />
      <span>IMPORTANT ANNOUNCEMENT</span>
    </span>
  );
}

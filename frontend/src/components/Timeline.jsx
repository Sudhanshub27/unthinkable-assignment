import { User, Shield, MessageSquare, Clock } from 'lucide-react';

function getDotStyle(item) {
  const status = item.new_value || item.status || (item.change_type === 'created' ? 'Open' : '');
  if (status === 'Open' || item.change_type === 'created') {
    return { dot: 'bg-terracotta-400 ring-4 ring-terracotta-50', badge: 'bg-terracotta-50 text-terracotta-500 border-terracotta-100' };
  }
  if (status === 'In Progress') {
    return { dot: 'bg-mustard-400 ring-4 ring-mustard-50', badge: 'bg-mustard-50 text-mustard-500 border-mustard-100' };
  }
  if (status === 'Resolved') {
    return { dot: 'bg-olive-400 ring-4 ring-olive-50', badge: 'bg-olive-50 text-olive-600 border-olive-100' };
  }
  if (status === 'Reopened' || item.change_type === 'reopened') {
    return { dot: 'bg-clay-500 ring-4 ring-clay-50', badge: 'bg-clay-50 text-clay-500 border-clay-100' };
  }
  return { dot: 'bg-terracotta-400 ring-4 ring-terracotta-50', badge: 'bg-terracotta-50 text-terracotta-500 border-terracotta-100' };
}

function getActionLabel(h) {
  if (h.change_type === 'created') return 'Complaint Created';
  if (h.change_type === 'reopened') return `Complaint Reopened (${h.old_value || 'Resolved'} → ${h.new_value})`;
  if (h.change_type === 'status_change') {
    return h.old_value ? `Status: ${h.old_value} → ${h.new_value}` : `Status updated to ${h.new_value}`;
  }
  if (h.change_type === 'priority_change') {
    return h.old_value ? `Priority: ${h.old_value} → ${h.new_value}` : `Priority updated to ${h.new_value}`;
  }
  if (h.change_type === 'overdue_flag') return `Overdue Flag: ${h.new_value}`;
  if (h.change_type === 'note_added') return 'Audit Note Added';
  return h.change_type || 'Event Logged';
}

function formatTimelineDate(dateStr) {
  if (!dateStr) return '';
  const date = new Date(dateStr);
  return date.toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export default function Timeline({ history }) {
  if (!history || history.length === 0) {
    return (
      <div className="p-4 rounded-xl bg-paper-hover/40 border border-line text-center">
        <p className="text-xs text-ink-muted italic">No audit history recorded for this complaint yet.</p>
      </div>
    );
  }

  return (
    <div className="relative pl-7 space-y-4 pt-1 pb-1">
      {/* Vertical Timeline Track */}
      <div className="absolute left-2.5 top-3 bottom-3 w-0.5 bg-line" />

      {history.map((h, idx) => {
        const style = getDotStyle(h);
        const label = getActionLabel(h);
        const isLatest = idx === history.length - 1 || idx === 0;

        return (
          <div className="relative group" key={h.id || idx}>
            {/* Timeline Node Dot */}
            <div
              className={`absolute -left-7 top-3.5 w-3.5 h-3.5 rounded-full border-2 border-paper-card ${style.dot} transition-transform duration-150 group-hover:scale-110`}
            />

            {/* History Card Container */}
            <div className="bg-paper-card rounded-xl border border-line p-3.5 shadow-card hover:border-terracotta-400/30 transition-all">
              {/* Event Header Row */}
              <div className="flex items-start justify-between gap-2 flex-wrap">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-sm font-semibold text-ink leading-snug">{label}</span>
                  {isLatest && (
                    <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-terracotta-50 text-terracotta-500 border border-terracotta-100">
                      Latest
                    </span>
                  )}
                </div>

                {/* Date & Time */}
                <div className="flex items-center gap-1 text-[11px] font-medium text-ink-muted shrink-0">
                  <Clock className="w-3 h-3 text-ink-muted shrink-0" />
                  <span>{formatTimelineDate(h.created_at)}</span>
                </div>
              </div>

              {/* Actor Meta info */}
              <div className="flex items-center gap-2 mt-1.5 text-xs text-ink-secondary flex-wrap">
                <div className="flex items-center gap-1">
                  {h.actor_role === 'admin' ? (
                    <Shield className="w-3.5 h-3.5 text-olive-500 shrink-0" />
                  ) : (
                    <User className="w-3.5 h-3.5 text-terracotta-400 shrink-0" />
                  )}
                  <span className="font-medium text-ink">{h.actor_name || 'System User'}</span>
                </div>
                <span className="text-ink-muted">•</span>
                <span className="capitalize px-1.5 py-0.2 text-[11px] rounded bg-paper-hover text-ink-muted border border-line font-mono">
                  {h.actor_role || 'system'}
                </span>
              </div>

              {/* Attached Note / Comment */}
              {h.note && (
                <div className="mt-2.5 p-2.5 rounded-lg bg-terracotta-50/50 border-l-3 border-terracotta-400 text-xs text-ink space-y-1">
                  <div className="flex items-center gap-1 text-[11px] font-semibold text-terracotta-500 uppercase tracking-wider">
                    <MessageSquare className="w-3 h-3" />
                    <span>Note</span>
                  </div>
                  <p className="text-ink-secondary leading-relaxed font-sans whitespace-pre-wrap">{h.note}</p>
                </div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}

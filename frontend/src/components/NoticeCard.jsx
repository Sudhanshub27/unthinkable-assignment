import { ImportantBadge } from './Badges';
import { formatDate } from '../utils/formatters';
import { User, Calendar, Trash2 } from 'lucide-react';

export default function NoticeCard({ notice, onDelete, isAdmin }) {
  if (!notice) return null;
  const { id, title, body, is_important, posted_by_name, created_at } = notice;

  return (
    <div
      className={`rounded-xl p-4 transition-shadow space-y-3 ${
        is_important
          ? 'bg-mustard-50/80 border border-mustard-400/30 shadow-soft'
          : 'bg-paper-card border border-line shadow-soft hover:shadow-card'
      }`}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="space-y-1">
          {is_important && (
            <div className="mb-1">
              <ImportantBadge />
            </div>
          )}
          <h3 className="font-display font-semibold text-base text-ink leading-snug">{title}</h3>
        </div>
        {isAdmin && onDelete && (
          <button
            className="text-clay-500 hover:text-clay-600 hover:bg-clay-500/10 p-1.5 rounded-lg text-xs font-semibold transition-colors flex items-center gap-1 shrink-0"
            onClick={() => onDelete(id)}
            title="Delete notice"
            aria-label={`Delete notice ${title}`}
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Delete</span>
          </button>
        )}
      </div>

      <p className="text-sm text-ink-secondary leading-relaxed whitespace-pre-line">{body}</p>

      <div className="flex flex-wrap items-center gap-4 pt-2 border-t border-line/60 text-xs text-ink-muted">
        <span className="flex items-center gap-1.5">
          <User className="w-3.5 h-3.5 text-ink-muted" />
          <span>Posted by {posted_by_name || 'Society Admin'}</span>
        </span>
        <span className="flex items-center gap-1.5">
          <Calendar className="w-3.5 h-3.5 text-ink-muted" />
          <span>{formatDate(created_at)}</span>
        </span>
      </div>
    </div>
  );
}

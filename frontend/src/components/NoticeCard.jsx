import SVGIcon from './SVGIcon';
import { ImportantBadge } from './Badges';
import { formatDate } from '../utils/formatters';

export default function NoticeCard({ notice, onDelete, isAdmin }) {
  if (!notice) return null;
  const { id, title, body, is_important, posted_by_name, created_at } = notice;

  return (
    <div className={`notice-card ${is_important ? 'notice-card-important' : ''}`}>
      <div className="notice-card-header">
        <div className="notice-card-title-group">
          {is_important && (
            <div className="notice-badge-wrapper">
              <ImportantBadge />
            </div>
          )}
          <h3 className="notice-card-title">{title}</h3>
        </div>
        {isAdmin && onDelete && (
          <button
            className="btn btn-ghost btn-xs text-danger"
            onClick={() => onDelete(id)}
            title="Delete notice"
            aria-label={`Delete notice ${title}`}
          >
            <SVGIcon name="trash" size={14} className="btn-icon-left" />
            <span>Delete</span>
          </button>
        )}
      </div>

      <p className="notice-card-body">{body}</p>

      <div className="notice-card-footer">
        <span className="notice-author">
          <SVGIcon name="user" size={13} className="meta-icon" />
          <span>Posted by {posted_by_name || 'Society Admin'}</span>
        </span>
        <span className="notice-date">
          <SVGIcon name="calendar" size={13} className="meta-icon" />
          <span>{formatDate(created_at)}</span>
        </span>
      </div>
    </div>
  );
}

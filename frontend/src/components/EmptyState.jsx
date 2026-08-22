export default function EmptyState({ icon = '📂', title, description, actionText, onAction }) {
  return (
    <div className="empty-state-box">
      <div className="empty-state-icon">{icon}</div>
      <h3 className="empty-state-title">{title}</h3>
      {description && <p className="empty-state-desc">{description}</p>}
      {actionText && onAction && (
        <button className="btn btn-primary btn-sm" onClick={onAction} style={{ marginTop: '16px' }}>
          {actionText}
        </button>
      )}
    </div>
  );
}

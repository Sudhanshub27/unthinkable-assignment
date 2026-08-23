import SVGIcon from './SVGIcon';

export default function EmptyState({ illustration, icon = 'clipboard', title, description, actionText, onAction }) {
  return (
    <div className="empty-state-box">
      {illustration ? (
        <img
          src={illustration}
          alt=""
          style={{ width: '200px', height: 'auto', display: 'block', margin: '0 auto 16px auto', objectFit: 'contain' }}
          className="empty-state-illustration"
        />
      ) : (
        <div className="empty-state-icon">
          <SVGIcon name={icon} size={36} color="#64748B" />
        </div>
      )}
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

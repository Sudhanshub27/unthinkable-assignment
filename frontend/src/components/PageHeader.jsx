import SVGIcon from './SVGIcon';

export default function PageHeader({
  title,
  subtitle,
  breadcrumb,
  actionText,
  onAction,
  actionIcon = 'plus',
  actionVariant = 'primary',
  children,
}) {
  return (
    <div className="page-header-container">
      <div className="page-header-text">
        {breadcrumb && <div className="page-header-breadcrumb">{breadcrumb}</div>}
        <h1 className="page-header-title">{title}</h1>
        {subtitle && <p className="page-header-subtitle">{subtitle}</p>}
      </div>

      {(actionText && onAction || children) && (
        <div className="page-header-action">
          {children}
          {actionText && onAction && (
            <button className={`btn btn-${actionVariant}`} onClick={onAction}>
              {actionIcon && <SVGIcon name={actionIcon} size={16} className="btn-icon-left" />}
              <span>{actionText}</span>
            </button>
          )}
        </div>
      )}
    </div>
  );
}

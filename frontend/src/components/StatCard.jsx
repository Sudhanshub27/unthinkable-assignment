import SVGIcon from './SVGIcon';

export default function StatCard({
  title,
  label,
  value,
  icon,
  variant = 'primary',
  subtitle,
  alert = false,
  onClick,
}) {
  const displayTitle = title || label;
  const variantClass = `stat-card-${variant}`;

  return (
    <div
      className={`stat-card ${variantClass} ${alert ? 'stat-card-alert' : ''} ${onClick ? 'stat-card-clickable' : ''}`}
      onClick={onClick}
    >
      <div className="stat-card-body">
        <div className="stat-card-info">
          <div className="stat-card-title">{displayTitle}</div>
          <div className="stat-card-value">{value !== undefined && value !== null ? value : 0}</div>
          {subtitle && <div className="stat-card-subtitle">{subtitle}</div>}
        </div>

        {icon && (
          <div className="stat-card-icon-wrapper">
            {typeof icon === 'string' ? <SVGIcon name={icon} size={20} /> : icon}
          </div>
        )}
      </div>

      {alert && <div className="stat-card-alert-indicator" title="Action Required" />}
    </div>
  );
}

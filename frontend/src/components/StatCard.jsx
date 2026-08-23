import SVGIcon from './SVGIcon';

export default function StatCard({
  title,
  label,
  value,
  icon,
  variant = 'primary',
  color,
  subtitle,
  alert = false,
  onClick,
  className = '',
}) {
  const displayTitle = title || label;

  // Resolve color prop ('blue', 'green', 'orange', 'red', 'purple', 'cyan') or map variant to color
  const resolvedColor = color || (
    variant === 'danger' ? 'red' :
    variant === 'warning' ? 'orange' :
    variant === 'success' ? 'green' :
    variant === 'purple' ? 'purple' :
    variant === 'cyan' ? 'cyan' :
    'blue'
  );

  return (
    <div
      className={`stat-card stat-card-${resolvedColor} ${alert ? 'stat-card-alert' : ''} ${onClick ? 'stat-card-clickable' : ''} ${className}`.trim()}
      onClick={onClick}
    >
      {icon && (
        <div className={`stat-card-chip stat-card-chip-${resolvedColor}`}>
          {typeof icon === 'string' ? <SVGIcon name={icon} size={20} color="currentColor" /> : icon}
        </div>
      )}

      <div className="stat-card-content">
        <div className="stat-card-title">{displayTitle}</div>
        <div className="stat-card-value">{value !== undefined && value !== null ? value : 0}</div>
        {subtitle && <div className="stat-card-subtitle">{subtitle}</div>}
      </div>

      {alert && <div className="stat-card-alert-indicator" title="Action Required" />}
    </div>
  );
}

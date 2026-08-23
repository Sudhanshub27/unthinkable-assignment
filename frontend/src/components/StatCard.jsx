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

  const resolvedColor =
    color ||
    (variant === 'danger' || variant === 'red' || variant === 'terracotta'
      ? 'terracotta'
      : variant === 'warning' || variant === 'orange' || variant === 'mustard'
      ? 'mustard'
      : variant === 'success' || variant === 'green' || variant === 'olive'
      ? 'olive'
      : 'teal');

  const chipStyles = {
    terracotta: 'bg-terracotta-50 text-terracotta-400',
    red: 'bg-terracotta-50 text-terracotta-400',
    olive: 'bg-olive-50 text-olive-400',
    green: 'bg-olive-50 text-olive-400',
    mustard: 'bg-mustard-50 text-mustard-400',
    orange: 'bg-mustard-50 text-mustard-400',
    teal: 'bg-teal-50 text-teal-400',
    blue: 'bg-teal-50 text-teal-400',
    cyan: 'bg-teal-50 text-teal-400',
    purple: 'bg-plum-400/10 text-plum-400',
  };

  const chipClass = chipStyles[resolvedColor] || chipStyles.teal;

  return (
    <div
      className={`bg-paper-card rounded-xl shadow-card p-5 flex items-start gap-4 transition-all relative ${
        onClick ? 'cursor-pointer hover:shadow-lifted' : ''
      } ${className}`.trim()}
      onClick={onClick}
    >
      {icon && (
        <div className={`w-11 h-11 rounded-lg flex items-center justify-center shrink-0 ${chipClass}`}>
          {typeof icon === 'string' ? <SVGIcon name={icon} size={22} color="currentColor" /> : icon}
        </div>
      )}

      <div className="flex-1 min-w-0">
        <div className="font-display text-3xl font-bold text-ink leading-tight">
          {value !== undefined && value !== null ? value : 0}
        </div>
        <div className="text-xs uppercase tracking-wide text-ink-muted font-semibold mt-1 truncate">
          {displayTitle}
        </div>
        {subtitle && <div className="text-xs text-ink-secondary mt-1">{subtitle}</div>}
      </div>

      {alert && (
        <span
          className="absolute top-3 right-3 w-2.5 h-2.5 rounded-full bg-clay-500 animate-pulse"
          title="Action Required"
        />
      )}
    </div>
  );
}

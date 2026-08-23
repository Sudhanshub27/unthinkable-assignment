import { ClipboardList, Clock, RotateCw, CheckCircle2, AlertTriangle, Mail } from 'lucide-react';

const ICON_MAP = {
  clipboard: ClipboardList,
  clock: Clock,
  'rotate-cw': RotateCw,
  'check-circle': CheckCircle2,
  'alert-triangle': AlertTriangle,
  mail: Mail,
};

const VARIANT_STYLES = {
  primary: 'bg-terracotta-50 text-terracotta-400',
  danger: 'bg-clay-500/10 text-clay-500',
  warning: 'bg-mustard-50 text-mustard-400',
  success: 'bg-olive-50 text-olive-400',
};

export default function StatCard({
  title,
  label,
  value,
  icon,
  variant = 'primary',
  subtitle,
  alert = false,
  onClick,
  className = '',
}) {
  const displayTitle = title || label;
  const chipClass = VARIANT_STYLES[variant] || VARIANT_STYLES.primary;

  const renderIcon = () => {
    if (!icon) return null;
    if (typeof icon === 'string') {
      const IconComponent = ICON_MAP[icon] || ClipboardList;
      return <IconComponent className="w-5 h-5" />;
    }
    return icon;
  };

  return (
    <div
      className={`bg-paper-card rounded-xl border border-line shadow-card p-4 flex items-start gap-4 transition-all duration-150 relative ${
        onClick ? 'cursor-pointer hover:shadow-lifted hover:-translate-y-0.5 hover:border-terracotta-400/30' : ''
      } ${className}`.trim()}
      onClick={onClick}
    >
      {icon && (
        <div className={`w-10 h-10 rounded-lg flex items-center justify-center shrink-0 ${chipClass}`}>
          {renderIcon()}
        </div>
      )}

      <div className="flex-1 min-w-0">
        <div className="font-display text-2xl font-bold text-ink leading-tight">
          {value !== undefined && value !== null ? value : 0}
        </div>
        <div className="text-[11px] uppercase tracking-wider text-ink-muted font-semibold mt-0.5 truncate">
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

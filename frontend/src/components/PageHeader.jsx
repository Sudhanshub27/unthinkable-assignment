import { Button } from './UIComponents';

export default function PageHeader({
  title,
  subtitle,
  breadcrumb,
  actionText,
  onAction,
  actionIcon,
  actionVariant = 'primary',
  children,
}) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-2 border-b border-line/50">
      <div className="space-y-1">
        {breadcrumb && <div className="text-xs text-ink-muted">{breadcrumb}</div>}
        <h1 className="font-display font-bold text-2xl md:text-3xl text-ink tracking-tight">{title}</h1>
        {subtitle && <p className="text-sm text-ink-secondary leading-relaxed">{subtitle}</p>}
      </div>

      {(actionText && onAction || children) && (
        <div className="flex items-center gap-3 shrink-0">
          {children}
          {actionText && onAction && (
            <Button variant={actionVariant} onClick={onAction} icon={actionIcon}>
              {actionText}
            </Button>
          )}
        </div>
      )}
    </div>
  );
}

import React from 'react';
import { ClipboardList, Megaphone, CheckCircle2, Mail, AlertCircle, Bell } from 'lucide-react';
import { Button } from './UIComponents';

const ICON_MAP = {
  clipboard: ClipboardList,
  megaphone: Megaphone,
  'check-circle': CheckCircle2,
  mail: Mail,
  alert: AlertCircle,
  bell: Bell,
};

export default function EmptyState({
  variant = 'full',
  illustration,
  icon = 'clipboard',
  title,
  description,
  actionText,
  onAction,
}) {
  const IconComponent = typeof icon === 'string' ? (ICON_MAP[icon] || ClipboardList) : icon;

  if (variant === 'compact') {
    return (
      <div className="py-6 px-4 text-center flex flex-col items-center justify-center">
        <div className="w-12 h-12 rounded-full bg-paper-hover border border-line flex items-center justify-center text-ink-muted mx-auto mb-2 shrink-0">
          {React.isValidElement(IconComponent) ? (
            IconComponent
          ) : (
            <IconComponent className="w-5 h-5 text-ink-muted" />
          )}
        </div>
        <h4 className="text-sm font-semibold text-ink">{title}</h4>
        {description && (
          <p className="text-xs text-ink-muted mt-1 max-w-[220px] mx-auto leading-normal">{description}</p>
        )}
        {actionText && onAction && (
          <button
            type="button"
            onClick={onAction}
            className="text-xs font-semibold text-terracotta-400 hover:underline mt-2 cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-terracotta-400/40 rounded"
          >
            {actionText}
          </button>
        )}
      </div>
    );
  }

  return (
    <div className="py-10 px-4 text-center flex flex-col items-center justify-center">
      {illustration ? (
        <div className="w-40 h-40 md:w-48 md:h-48 rounded-full bg-terracotta-50 flex items-center justify-center mx-auto mb-4 shrink-0">
          <img
            src={illustration}
            alt=""
            className="w-28 md:w-32 max-w-[140px] h-auto object-contain"
          />
        </div>
      ) : (
        <div className="w-16 h-16 rounded-full bg-terracotta-50 flex items-center justify-center mx-auto mb-4 text-terracotta-400 shrink-0">
          {React.isValidElement(IconComponent) ? (
            IconComponent
          ) : (
            <IconComponent className="w-8 h-8 text-terracotta-400" />
          )}
        </div>
      )}
      <div className="space-y-1 max-w-md mt-2">
        <h3 className="font-display font-semibold text-lg text-ink">{title}</h3>
        {description && <p className="text-sm text-ink-secondary leading-relaxed">{description}</p>}
      </div>
      {actionText && onAction && (
        <div className="pt-4">
          <Button variant="primary" size="sm" onClick={onAction}>
            {actionText}
          </Button>
        </div>
      )}
    </div>
  );
}

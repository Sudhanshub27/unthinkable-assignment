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

const ICON_THEMES = {
  'check-circle': {
    bg: 'bg-olive-500/10 border-olive-500/25',
    ring: 'ring-olive-500/10',
    iconColor: 'text-olive-600',
  },
  clipboard: {
    bg: 'bg-terracotta-500/10 border-terracotta-500/25',
    ring: 'ring-terracotta-500/10',
    iconColor: 'text-terracotta-500',
  },
  megaphone: {
    bg: 'bg-amber-500/10 border-amber-500/25',
    ring: 'ring-amber-500/10',
    iconColor: 'text-amber-600',
  },
  mail: {
    bg: 'bg-blue-500/10 border-blue-500/25',
    ring: 'ring-blue-500/10',
    iconColor: 'text-blue-600',
  },
  alert: {
    bg: 'bg-clay-500/10 border-clay-500/25',
    ring: 'ring-clay-500/10',
    iconColor: 'text-clay-500',
  },
  bell: {
    bg: 'bg-amber-500/10 border-amber-500/25',
    ring: 'ring-amber-500/10',
    iconColor: 'text-amber-600',
  },
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
  const themeKey = typeof icon === 'string' ? icon : 'clipboard';
  const theme = ICON_THEMES[themeKey] || ICON_THEMES.clipboard;

  if (variant === 'compact') {
    return (
      <div className="py-4 px-4 text-center flex flex-col items-center justify-center">
        <div className={`w-10 h-10 rounded-xl border ${theme.bg} flex items-center justify-center mx-auto mb-2 shrink-0`}>
          {React.isValidElement(IconComponent) ? (
            IconComponent
          ) : (
            <IconComponent className={`w-4.5 h-4.5 ${theme.iconColor}`} />
          )}
        </div>
        <h4 className="text-xs font-bold text-ink">{title}</h4>
        {description && (
          <p className="text-[11px] text-ink-muted mt-0.5 max-w-[200px] mx-auto leading-tight">{description}</p>
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
    <div className="py-6 px-4 text-center flex flex-col items-center justify-center">
      {illustration ? (
        <div className="relative mb-3 flex items-center justify-center">
          <div className="w-20 h-20 rounded-2xl bg-gradient-to-b from-paper-hover to-paper-card border border-line/80 shadow-xs p-3 flex items-center justify-center relative group hover:scale-105 transition-transform duration-200">
            <img
              src={illustration}
              alt=""
              className="w-full h-full object-contain"
            />
            <div className="absolute -bottom-1.5 -right-1.5 w-6 h-6 rounded-md bg-paper border border-line shadow-xs flex items-center justify-center text-terracotta-500">
              {React.isValidElement(IconComponent) ? (
                IconComponent
              ) : (
                <IconComponent className="w-3.5 h-3.5" />
              )}
            </div>
          </div>
        </div>
      ) : (
        <div className="relative mb-3 flex items-center justify-center">
          <div className={`w-13 h-13 rounded-2xl border ${theme.bg} flex items-center justify-center shadow-xs relative ring-4 ${theme.ring} transition-transform duration-200 hover:scale-105`}>
            {React.isValidElement(IconComponent) ? (
              IconComponent
            ) : (
              <IconComponent className={`w-6 h-6 ${theme.iconColor}`} />
            )}
          </div>
        </div>
      )}
      <div className="space-y-1 max-w-sm mx-auto">
        <h3 className="font-display font-semibold text-base text-ink">{title}</h3>
        {description && <p className="text-xs text-ink-muted leading-relaxed">{description}</p>}
      </div>
      {actionText && onAction && (
        <div className="pt-3">
          <Button variant="primary" size="sm" onClick={onAction}>
            {actionText}
          </Button>
        </div>
      )}
    </div>
  );
}

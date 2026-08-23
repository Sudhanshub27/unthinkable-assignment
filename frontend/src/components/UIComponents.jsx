import React from 'react';
import { Link } from 'react-router-dom';
import { AlertTriangle } from 'lucide-react';

/* ==========================================================================
   1. BUTTON COMPONENT
   ========================================================================== */
export function Button({
  variant = 'primary', // 'primary' | 'secondary' | 'outline' | 'danger' | 'ghost'
  size = 'md',         // 'sm' | 'md' | 'lg' | 'xs'
  isFullWidth = false,
  isLoading = false,
  icon,
  children,
  className = '',
  disabled,
  href,
  to,
  ...props
}) {
  const variantClasses = {
    primary: 'bg-terracotta-400 text-white hover:bg-terracotta-500 shadow-soft',
    secondary: 'bg-paper-hover text-ink border border-line hover:bg-line shadow-soft',
    outline: 'bg-transparent border-2 border-terracotta-400 text-terracotta-400 hover:bg-terracotta-50',
    danger: 'bg-clay-500 text-white hover:bg-clay-400 shadow-soft',
    ghost: 'bg-transparent text-ink-secondary hover:bg-paper-hover hover:text-ink',
  };

  const sizeClasses = {
    xs: 'px-2.5 py-1 text-xs',
    sm: 'px-3 py-1.5 text-sm',
    md: 'px-4 py-2.5 text-sm',
    lg: 'px-6 py-3 text-base',
  };

  const variantClass = variantClasses[variant] || variantClasses.primary;
  const sizeClass = sizeClasses[size] || sizeClasses.md;
  const widthClass = isFullWidth ? 'w-full' : '';
  const combinedClassName = `inline-flex items-center justify-center gap-2 rounded-lg font-semibold transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-terracotta-400/40 disabled:opacity-50 disabled:cursor-not-allowed ${variantClass} ${sizeClass} ${widthClass} ${className}`.trim();

  const content = (
    <>
      {isLoading ? (
        <span className="border-2 border-current/30 border-t-current rounded-full w-4 h-4 animate-spin shrink-0" aria-hidden="true" />
      ) : icon ? (
        <span className="inline-flex items-center justify-center shrink-0">{icon}</span>
      ) : null}
      {children && <span>{children}</span>}
    </>
  );

  const targetHref = href || to;

  if (targetHref) {
    if (targetHref.startsWith('#')) {
      return (
        <a href={targetHref} className={combinedClassName} {...props}>
          {content}
        </a>
      );
    }
    return (
      <Link to={targetHref} className={combinedClassName} {...props}>
        {content}
      </Link>
    );
  }

  return (
    <button
      className={combinedClassName}
      disabled={disabled || isLoading}
      {...props}
    >
      {content}
    </button>
  );
}

/* ==========================================================================
   2. ERROR STATE COMPONENT
   ========================================================================== */
export function ErrorState({ title = 'Failed to load data', message, onRetry }) {
  return (
    <div className="bg-paper-card rounded-xl border border-line p-8 text-center max-w-md mx-auto space-y-4">
      <div className="w-12 h-12 rounded-full bg-clay-500/10 text-clay-500 flex items-center justify-center mx-auto">
        <AlertTriangle className="w-6 h-6" />
      </div>
      <div className="space-y-1">
        <h3 className="font-display font-semibold text-base text-clay-500">{title}</h3>
        {message && <p className="text-sm text-ink-secondary leading-relaxed">{message}</p>}
      </div>
      {onRetry && (
        <Button variant="outline" size="sm" onClick={onRetry}>
          Retry Loading
        </Button>
      )}
    </div>
  );
}

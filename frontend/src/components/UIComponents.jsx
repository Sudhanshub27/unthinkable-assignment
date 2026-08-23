import React from 'react';
import SVGIcon from './SVGIcon';

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

  return (
    <button
      className={`inline-flex items-center justify-center gap-2 rounded-lg font-semibold transition-colors focus:outline-none disabled:opacity-50 disabled:cursor-not-allowed ${variantClass} ${sizeClass} ${widthClass} ${className}`.trim()}
      disabled={disabled || isLoading}
      {...props}
    >
      {isLoading ? (
        <span className="border-2 border-current/30 border-t-current rounded-full w-4 h-4 animate-spin shrink-0" aria-hidden="true" />
      ) : icon ? (
        <span className="inline-flex items-center justify-center shrink-0">{icon}</span>
      ) : null}
      {children && <span>{children}</span>}
    </button>
  );
}

/* ==========================================================================
   2. INPUT COMPONENT
   ========================================================================== */
export function Input({ label, error, helperText, icon, className = '', id, ...props }) {
  const inputId = id || (label ? label.toLowerCase().replace(/\s+/g, '-') : undefined);
  return (
    <div className={`form-group ${error ? 'has-error' : ''}`}>
      {label && (
        <label className="form-label" htmlFor={inputId}>
          {label}
        </label>
      )}
      <div className="input-relative-wrapper">
        {icon && <span className="input-icon-prefix">{icon}</span>}
        <input
          id={inputId}
          className={`form-control ${icon ? 'input-has-icon' : ''} ${className}`}
          {...props}
        />
      </div>
      {error && <span className="form-error-text">{error}</span>}
      {!error && helperText && <span className="form-helper-text">{helperText}</span>}
    </div>
  );
}

/* ==========================================================================
   3. SELECT COMPONENT
   ========================================================================== */
export function Select({ label, error, helperText, options = [], children, className = '', id, ...props }) {
  const selectId = id || (label ? label.toLowerCase().replace(/\s+/g, '-') : undefined);
  return (
    <div className={`form-group ${error ? 'has-error' : ''}`}>
      {label && (
        <label className="form-label" htmlFor={selectId}>
          {label}
        </label>
      )}
      <select id={selectId} className={`form-control ${className}`} {...props}>
        {children
          ? children
          : options.map((opt) => (
              <option key={opt.value || opt} value={opt.value || opt}>
                {opt.label || opt}
              </option>
            ))}
      </select>
      {error && <span className="form-error-text">{error}</span>}
      {!error && helperText && <span className="form-helper-text">{helperText}</span>}
    </div>
  );
}

/* ==========================================================================
   4. TEXTAREA COMPONENT
   ========================================================================== */
export function Textarea({ label, error, helperText, className = '', rows = 3, id, ...props }) {
  const textareaId = id || (label ? label.toLowerCase().replace(/\s+/g, '-') : undefined);
  return (
    <div className={`form-group ${error ? 'has-error' : ''}`}>
      {label && (
        <label className="form-label" htmlFor={textareaId}>
          {label}
        </label>
      )}
      <textarea id={textareaId} className={`form-control ${className}`} rows={rows} {...props} />
      {error && <span className="form-error-text">{error}</span>}
      {!error && helperText && <span className="form-helper-text">{helperText}</span>}
    </div>
  );
}

/* ==========================================================================
   5. CARD COMPONENT
   ========================================================================== */
export function Card({ title, subtitle, action, className = '', children, ...props }) {
  return (
    <div className={`content-card ${className}`} {...props}>
      {(title || subtitle || action) && (
        <div className="card-header-row">
          <div>
            {title && <h3 className="card-title">{title}</h3>}
            {subtitle && <p className="card-subtitle">{subtitle}</p>}
          </div>
          {action && <div className="card-header-action">{action}</div>}
        </div>
      )}
      {children}
    </div>
  );
}

/* ==========================================================================
   6. GENERIC BADGE COMPONENT
   ========================================================================== */
export function Badge({ variant = 'neutral', icon, children, className = '', ...props }) {
  const variantClass = `badge-${variant}`;
  return (
    <span className={`badge ${variantClass} ${className}`} {...props}>
      {icon && <span className="badge-dot">{icon}</span>}
      {children}
    </span>
  );
}

/* ==========================================================================
   7. LOADING STATE COMPONENT
   ========================================================================== */
export function LoadingState({ message = 'Loading society records...' }) {
  return (
    <div className="loading-container">
      <div className="loading-spinner" />
      <p>{message}</p>
    </div>
  );
}

/* ==========================================================================
   8. ERROR STATE COMPONENT
   ========================================================================== */
export function ErrorState({ title = 'Failed to load data', message, onRetry }) {
  return (
    <div className="content-card error-state-card">
      <div className="empty-state-box">
        <div className="empty-state-icon">
          <SVGIcon name="alert-triangle" size={36} color="#DC2626" />
        </div>
        <h3 className="empty-state-title text-danger">{title}</h3>
        {message && <p className="empty-state-desc">{message}</p>}
        {onRetry && (
          <Button variant="outline" size="sm" onClick={onRetry} style={{ marginTop: 14 }}>
            Retry Loading
          </Button>
        )}
      </div>
    </div>
  );
}

/* ==========================================================================
   9. PAGE HEADER COMPONENT
   ========================================================================== */
export function PageHeader({ title, subtitle, date, badge, action }) {
  return (
    <div className="dashboard-header-card">
      <div className="header-title-group">
        {date && (
          <div className="dashboard-badge-date">
            <SVGIcon name="calendar" size={14} style={{ display: 'inline-block', marginRight: 6, verticalAlign: 'middle' }} />
            {date}
          </div>
        )}
        {badge && <div className="header-badge-inline">{badge}</div>}
        <h2 className="dashboard-main-title">{title}</h2>
        {subtitle && <p className="dashboard-sub-title">{subtitle}</p>}
      </div>
      {action && <div className="header-action-group">{action}</div>}
    </div>
  );
}

/* ==========================================================================
   10. STAT CARD COMPONENT
   ========================================================================== */
export function StatCard({ label, value, icon, variant = 'indigo', alert = false, onClick }) {
  const iconVariantClass = `kpi-icon-${variant}`;
  return (
    <div
      className={`kpi-card ${alert ? 'kpi-card-alert' : ''} ${onClick ? 'kpi-card-clickable' : ''}`}
      onClick={onClick}
    >
      {icon && <div className={`kpi-icon ${iconVariantClass}`}>{icon}</div>}
      <div className="kpi-data">
        <div className="kpi-label">{label}</div>
        <div className={`kpi-value ${alert ? 'text-danger' : ''}`}>{value}</div>
      </div>
    </div>
  );
}

/* ==========================================================================
   11. COMPLAINT CARD COMPONENT (RESIDENT / GRID VIEW)
   ========================================================================== */
export function ComplaintCard({ complaint, onClick, categoryIcon }) {
  const { id, category, description, status, priority, is_overdue, created_at, photo_url } = complaint;

  return (
    <div className={`complaint-card ${is_overdue ? 'complaint-card-overdue' : ''}`} onClick={onClick}>
      <div className="complaint-card-header">
        <span className="complaint-card-id">#{id}</span>
        <div className="complaint-card-badges">
          {is_overdue && <span className="badge badge-overdue">OVERDUE</span>}
          <span className={`badge badge-status-${status.toLowerCase().replace(/\s+/g, '')}`}>
            {status}
          </span>
        </div>
      </div>

      <div className="table-cat-pill" style={{ marginBottom: 10, display: 'inline-block' }}>
        {categoryIcon || <SVGIcon name="file-text" size={14} style={{ display: 'inline-block', marginRight: 4 }} />}
        {category}
      </div>

      <p className="complaint-card-desc">{description}</p>

      {photo_url && (
        <div className="complaint-card-photo-tag">
          <SVGIcon name="image" size={14} style={{ display: 'inline-block', marginRight: 6, verticalAlign: 'middle' }} />
          Photo Attachment Attached
        </div>
      )}

      <div className="complaint-card-footer">
        <span className="text-muted text-sm">
          {new Date(created_at).toLocaleDateString()}
        </span>
        <button className="btn btn-outline btn-xs">View History ➔</button>
      </div>
    </div>
  );
}

/* ==========================================================================
   12. NOTICE CARD COMPONENT
   ========================================================================== */
export function NoticeCard({ notice, onDelete, isAdmin }) {
  const { id, title, body, is_important, posted_by_name, created_at } = notice;

  return (
    <div className={`notice-card ${is_important ? 'notice-card-important' : ''}`}>
      <div className="notice-card-header">
        <div>
          {is_important && (
            <span className="badge badge-important" style={{ marginBottom: 6 }}>
              <SVGIcon name="megaphone" size={12} style={{ display: 'inline-block', marginRight: 4 }} />
              IMPORTANT ANNOUNCEMENT
            </span>
          )}
          <h3 className="notice-card-title">{title}</h3>
        </div>
        {isAdmin && onDelete && (
          <button className="btn btn-ghost btn-xs text-danger" onClick={() => onDelete(id)} title="Delete notice">
            <SVGIcon name="trash" size={14} style={{ display: 'inline-block', marginRight: 4 }} />
            Delete
          </button>
        )}
      </div>

      <p className="notice-card-body">{body}</p>

      <div className="notice-card-footer">
        <span className="notice-author">Posted by {posted_by_name || 'Society Office'}</span>
        <span className="notice-date">{new Date(created_at).toLocaleDateString()}</span>
      </div>
    </div>
  );
}

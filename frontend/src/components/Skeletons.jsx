export function SkeletonText({ lines = 3, className = '' }) {
  return (
    <div className={`skeleton-wrapper ${className}`}>
      {Array.from({ length: lines }).map((_, idx) => (
        <div
          key={idx}
          className="skeleton-line"
          style={{ width: idx === lines - 1 && lines > 1 ? '60%' : '100%' }}
        />
      ))}
    </div>
  );
}

export function SkeletonCard({ count = 3 }) {
  return (
    <div className="skeleton-cards-grid">
      {Array.from({ length: count }).map((_, idx) => (
        <div key={idx} className="skeleton-card">
          <div className="skeleton-line" style={{ width: '40%', height: '14px', marginBottom: '12px' }} />
          <div className="skeleton-line" style={{ width: '80%', height: '24px', marginBottom: '8px' }} />
          <div className="skeleton-line" style={{ width: '60%', height: '12px' }} />
        </div>
      ))}
    </div>
  );
}

export const SkeletonCards = SkeletonCard;

export function SkeletonTable({ rows = 5, cols = 6 }) {
  return (
    <div className="skeleton-table-wrapper">
      <div className="skeleton-table-header">
        {Array.from({ length: cols }).map((_, idx) => (
          <div key={idx} className="skeleton-line" style={{ width: '80%', height: '14px' }} />
        ))}
      </div>
      {Array.from({ length: rows }).map((_, rIdx) => (
        <div key={rIdx} className="skeleton-table-row">
          {Array.from({ length: cols }).map((_, cIdx) => (
            <div key={cIdx} className="skeleton-line" style={{ width: '70%', height: '14px' }} />
          ))}
        </div>
      ))}
    </div>
  );
}

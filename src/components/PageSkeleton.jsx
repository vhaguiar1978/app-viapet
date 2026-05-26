export function PageSkeleton({ rows = 6, withToolbar = true }) {
  return (
    <div className="page-skeleton" aria-busy="true" aria-live="polite">
      {withToolbar ? (
        <div className="page-skeleton-toolbar">
          <span className="page-skeleton-pill page-skeleton-pill--lg" />
          <span className="page-skeleton-pill" />
          <span className="page-skeleton-pill" />
          <span className="page-skeleton-pill page-skeleton-pill--right" />
        </div>
      ) : null}
      <div className="page-skeleton-card">
        <div className="page-skeleton-header">
          <span className="page-skeleton-line page-skeleton-line--title" />
          <span className="page-skeleton-line page-skeleton-line--subtitle" />
        </div>
        <div className="page-skeleton-body">
          {Array.from({ length: rows }).map((_, idx) => (
            <div key={idx} className="page-skeleton-row">
              <span className="page-skeleton-avatar" />
              <span className="page-skeleton-line page-skeleton-line--grow" />
              <span className="page-skeleton-line page-skeleton-line--short" />
              <span className="page-skeleton-line page-skeleton-line--tiny" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

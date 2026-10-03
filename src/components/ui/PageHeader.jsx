import React from 'react';
import { Breadcrumbs } from './Breadcrumbs';

export const PageHeader = ({
  title,
  metaChip,
  breadcrumbs = [],
  actions,
  children
}) => {
  return (
    <div className="space-y-3 mb-5">
      {/* Breadcrumb Trail */}
      {breadcrumbs.length > 0 && <Breadcrumbs items={breadcrumbs} />}

      {/* Main Title & Action Row */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <h1 className="text-title-page font-bold text-ink-primary tracking-tight">{title}</h1>
          {metaChip && (
            <span className="text-mono-val font-mono font-semibold text-accent bg-accent-soft px-2 py-0.5 rounded-chip border border-indigo-200/50">
              {metaChip}
            </span>
          )}
        </div>

        {actions && <div className="flex items-center gap-2 flex-wrap">{actions}</div>}
      </div>

      {/* Optional Metadata Strip or Sub-content */}
      {children}
    </div>
  );
};

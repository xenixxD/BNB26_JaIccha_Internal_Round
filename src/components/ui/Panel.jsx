import React from 'react';

export const Panel = ({
  children,
  title,
  subtitle,
  action,
  className = '',
  bodyClassName = '',
  inset = false
}) => {
  return (
    <div className={`rounded-panel border border-border-subtle ${
      inset ? 'bg-surface-inset' : 'bg-white'
    } shadow-none ${className}`}>
      {(title || action) && (
        <div className="px-4 py-3 border-b border-border-subtle flex items-center justify-between gap-3">
          <div>
            {title && <h3 className="text-title-panel text-ink-primary font-semibold">{title}</h3>}
            {subtitle && <p className="text-body-sm text-ink-muted mt-0.5">{subtitle}</p>}
          </div>
          {action && <div>{action}</div>}
        </div>
      )}
      <div className={`p-4 ${bodyClassName}`}>
        {children}
      </div>
    </div>
  );
};

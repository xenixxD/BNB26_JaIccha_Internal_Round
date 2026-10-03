import React from 'react';
import { NavLink } from 'react-router-dom';

export const Breadcrumbs = ({ items = [] }) => {
  return (
    <nav className="flex items-center gap-1.5 text-body-sm text-ink-muted font-medium">
      {items.map((item, idx) => {
        const isLast = idx === items.length - 1;
        return (
          <React.Fragment key={idx}>
            {idx > 0 && <span className="text-border-strong font-normal">/</span>}
            {item.path && !isLast ? (
              <NavLink to={item.path} className="hover:text-ink-primary transition-colors">
                {item.label}
              </NavLink>
            ) : (
              <span className={isLast ? 'text-accent font-semibold' : 'text-ink-muted'}>
                {item.label}
              </span>
            )}
          </React.Fragment>
        );
      })}
    </nav>
  );
};

import React from 'react';

export const Input = React.forwardRef(({
  label,
  error,
  icon: Icon,
  className = '',
  type = 'text',
  ...props
}, ref) => {
  return (
    <div className="w-full space-y-1">
      {label && (
        <label className="block text-micro text-ink-muted uppercase tracking-widest font-semibold">
          {label}
        </label>
      )}
      <div className="relative flex items-center">
        {Icon && (
          <Icon className="w-4 h-4 text-ink-muted absolute left-2.5 pointer-events-none stroke-[1.75]" />
        )}
        <input
          ref={ref}
          type={type}
          className={`w-full h-[32px] bg-white border border-border-subtle hover:border-border-strong focus:border-accent text-ink-primary text-xs rounded-btn transition-colors px-3 font-sans ${
            Icon ? 'pl-8' : ''
          } ${error ? 'border-status-danger' : ''} ${className}`}
          {...props}
        />
      </div>
      {error && <p className="text-[11px] text-status-danger font-medium">{error}</p>}
    </div>
  );
});

Input.displayName = 'Input';

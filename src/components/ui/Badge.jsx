import React from 'react';

export const Badge = ({
  children,
  variant = 'neutral', // 'neutral' | 'accent' | 'success' | 'warning' | 'danger' | 'score'
  className = '',
  size = 'md'
}) => {
  const baseStyles = "inline-flex items-center font-mono rounded-chip font-semibold uppercase tracking-wider select-none";

  const sizeStyles = {
    sm: "text-[9px] px-1.5 py-0.5 h-[18px]",
    md: "text-[10px] px-2 py-0.5 h-[22px]",
  };

  const variantStyles = {
    neutral: "bg-surface-inset text-ink-secondary border border-border-subtle",
    accent: "bg-accent-soft text-accent-text border border-indigo-200/60",
    success: "bg-status-success-soft text-status-success border border-emerald-200",
    warning: "bg-status-warning-soft text-status-warning border border-amber-200",
    danger: "bg-status-danger-soft text-status-danger border border-rose-200",
    score: "bg-accent text-white font-mono font-bold text-xs h-[24px] px-2 shadow-sm rounded-chip"
  };

  return (
    <span className={`${baseStyles} ${sizeStyles[size]} ${variantStyles[variant]} ${className}`}>
      {children}
    </span>
  );
};

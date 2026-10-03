import React from 'react';
import { Loader2 } from 'lucide-react';

export const Button = ({
  children,
  variant = 'primary', // 'primary' | 'secondary' | 'ghost' | 'danger' | 'icon'
  size = 'md', // 'sm' (30px) | 'md' (32px)
  isLoading = false,
  disabled = false,
  className = '',
  icon: Icon,
  type = 'button',
  onClick,
  ...props
}) => {
  const baseStyles = "inline-flex items-center justify-center font-medium text-xs transition-colors rounded-btn focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent disabled:opacity-50 disabled:pointer-events-none select-none cursor-pointer";

  const sizeStyles = {
    sm: "h-[30px] px-2.5 gap-1.5 text-[11px]",
    md: "h-[32px] px-3 gap-2 text-xs",
    icon: "h-[28px] w-[28px] p-0 flex items-center justify-center"
  };

  const variantStyles = {
    primary: "bg-accent hover:bg-accent-hover active:bg-accent-pressed text-white font-semibold shadow-sm border border-transparent",
    secondary: "bg-white hover:bg-surface-inset text-ink-primary border border-border-subtle hover:border-border-strong text-ink-secondary",
    ghost: "bg-transparent hover:bg-surface-inset text-ink-secondary hover:text-ink-primary border border-transparent",
    danger: "bg-status-danger hover:bg-red-700 text-white font-semibold border border-transparent",
    soft: "bg-accent-soft hover:bg-indigo-100 text-accent-text font-semibold border border-indigo-200"
  };

  const currentSize = variant === 'icon' ? 'icon' : size;

  return (
    <button
      type={type}
      disabled={disabled || isLoading}
      onClick={onClick}
      className={`${baseStyles} ${sizeStyles[currentSize]} ${variantStyles[variant]} ${className}`}
      {...props}
    >
      {isLoading ? (
        <Loader2 className="w-3.5 h-3.5 animate-spin" />
      ) : Icon ? (
        <Icon className="w-3.5 h-3.5 shrink-0 stroke-[1.75]" />
      ) : null}
      {children}
    </button>
  );
};

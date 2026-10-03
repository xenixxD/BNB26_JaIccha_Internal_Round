import React from 'react';
import { ChevronDown } from 'lucide-react';

export const Select = ({
  label,
  options = [],
  value,
  onChange,
  className = '',
  ...props
}) => {
  return (
    <div className="w-full space-y-1">
      {label && (
        <label className="block text-micro text-ink-muted uppercase tracking-widest font-semibold">
          {label}
        </label>
      )}
      <div className="relative flex items-center">
        <select
          value={value}
          onChange={onChange}
          className={`w-full h-[32px] bg-white border border-border-subtle hover:border-border-strong focus:border-accent text-ink-primary text-xs font-medium rounded-btn transition-colors pl-3 pr-8 appearance-none cursor-pointer ${className}`}
          {...props}
        >
          {options.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
        <ChevronDown className="w-3.5 h-3.5 text-ink-muted absolute right-2.5 pointer-events-none stroke-[1.75]" />
      </div>
    </div>
  );
};

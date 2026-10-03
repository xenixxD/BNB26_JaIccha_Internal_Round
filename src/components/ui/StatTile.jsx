import React from 'react';

export const StatTile = ({
  label,
  value,
  subtext,
  icon: Icon,
  className = '',
  accent = false
}) => {
  return (
    <div className={`p-3 rounded-panel border bg-white flex flex-col justify-between transition-colors ${
      accent ? 'border-indigo-200 bg-accent-soft/30' : 'border-border-subtle hover:border-border-strong'
    } ${className}`}>
      <div className="flex items-center justify-between gap-1 mb-1">
        <span className="text-micro text-ink-muted uppercase tracking-widest">{label}</span>
        {Icon && <Icon className="w-3.5 h-3.5 text-ink-muted" />}
      </div>
      <div className="flex items-baseline justify-between gap-2">
        <div className={`text-xl font-bold font-mono tracking-tight ${accent ? 'text-accent' : 'text-ink-primary'}`}>
          {value}
        </div>
        {subtext && (
          <span className="text-[11px] font-medium text-ink-muted truncate">{subtext}</span>
        )}
      </div>
    </div>
  );
};

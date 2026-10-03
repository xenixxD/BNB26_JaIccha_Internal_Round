import React from 'react';

export const Tabs = ({
  tabs = [], // [{ id, label, icon, badge }]
  activeTab,
  onChange,
  className = ''
}) => {
  return (
    <div className={`flex border-b border-border-subtle gap-4 ${className}`}>
      {tabs.map((tab) => {
        const Icon = tab.icon;
        const isActive = activeTab === tab.id;
        return (
          <button
            key={tab.id}
            onClick={() => onChange(tab.id)}
            className={`pb-2.5 pt-1 text-xs font-semibold flex items-center gap-1.5 border-b-2 transition-colors cursor-pointer select-none ${
              isActive
                ? 'border-accent text-accent'
                : 'border-transparent text-ink-muted hover:text-ink-primary'
            }`}
          >
            {Icon && <Icon className="w-3.5 h-3.5 stroke-[1.75]" />}
            <span>{tab.label}</span>
            {tab.badge !== undefined && (
              <span className={`text-[10px] font-mono font-bold px-1.5 py-0.5 rounded-chip ${
                isActive ? 'bg-accent-soft text-accent-text' : 'bg-surface-inset text-ink-muted'
              }`}>
                {tab.badge}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
};

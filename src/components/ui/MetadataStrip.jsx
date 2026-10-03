import React from 'react';
import { RefreshCw } from 'lucide-react';

export const MetadataStrip = ({
  items = [], // [{ label: 'SOURCE', value: 'video_full.mp4', mono: true }]
  syncStatus = 'SYNCED',
  className = ''
}) => {
  return (
    <div className={`bg-white border border-border-subtle rounded-panel px-4 py-2 flex items-center justify-between text-xs overflow-x-auto gap-4 ${className}`}>
      <div className="flex items-center gap-6 flex-wrap">
        {items.map((item, idx) => (
          <div key={idx} className="flex items-center gap-1.5 shrink-0">
            <span className="text-micro text-ink-muted uppercase tracking-widest">{item.label}:</span>
            <span className={`text-body-sm font-medium text-ink-primary ${item.mono ? 'font-mono text-mono-val' : ''}`}>
              {item.value}
            </span>
          </div>
        ))}
      </div>

      {syncStatus && (
        <div className="flex items-center gap-1.5 text-micro text-ink-muted uppercase tracking-widest shrink-0">
          <span className="w-1.5 h-1.5 rounded-full bg-status-success inline-block"></span>
          <span>{syncStatus}</span>
        </div>
      )}
    </div>
  );
};

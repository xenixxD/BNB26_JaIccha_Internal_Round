import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useStore } from '../../store/useStore';
import { Search, Bell, HelpCircle, Zap, CheckCircle2, AlertTriangle, User } from 'lucide-react';

export const Header = ({ onOpenUploadModal }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const { searchQuery, setSearchQuery, projects, activeProjectId, systemHealth, user } = useStore();

  const activeProj = projects.find((p) => p.id === activeProjectId) || projects[0];

  return (
    <header className="h-[56px] bg-white border-b border-border-subtle px-5 flex items-center justify-between sticky top-0 z-10 shadow-none">
      {/* Left Breadcrumb Indicator */}
      <div className="flex items-center gap-2 text-body-sm font-medium">
        <span className="text-ink-muted">CreatorAI</span>
        <span className="text-border-strong">/</span>
        <div className="flex items-center gap-1.5 font-semibold text-ink-primary">
          <span className="w-2 h-2 rounded-full bg-status-success inline-block" />
          <span>{activeProj?.name || 'Workspace'}</span>
        </div>
      </div>

      {/* Center Search Input */}
      <div className="relative w-[320px] hidden md:block">
        <Search className="w-3.5 h-3.5 text-ink-muted absolute left-3 top-2.5 pointer-events-none stroke-[1.75]" />
        <input
          type="text"
          placeholder="Search clips, assets, projects..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full h-[32px] bg-surface-inset border border-border-subtle focus:border-accent text-ink-primary text-xs rounded-btn pl-8 pr-12 transition-colors font-sans"
        />
        <div className="absolute right-2.5 top-1.5 px-1.5 py-0.5 bg-white border border-border-subtle text-ink-muted text-[10px] font-mono rounded-chip">
          ⌘K
        </div>
      </div>

      {/* Right Cluster */}
      <div className="flex items-center gap-2.5">
        {/* System Health Status Pill */}
        <div className={`h-[28px] px-2.5 rounded-chip text-[11px] font-mono font-medium flex items-center gap-1.5 border ${
          systemHealth.ffmpeg_available
            ? 'bg-status-success-soft text-status-success border-emerald-200'
            : 'bg-status-warning-soft text-status-warning border-amber-200'
        }`}>
          <span className={`w-1.5 h-1.5 rounded-full ${systemHealth.ffmpeg_available ? 'bg-status-success animate-pulse' : 'bg-status-warning'}`} />
          <span className="hidden sm:inline">{systemHealth.ffmpeg_available ? 'FFmpeg Active' : 'Preview Mode'}</span>
        </div>

        {/* Help Icon */}
        <button className="w-[28px] h-[28px] rounded-btn border border-border-subtle hover:border-border-strong bg-white flex items-center justify-center text-ink-muted hover:text-ink-primary transition-colors cursor-pointer" title="Help & Documentation">
          <HelpCircle className="w-3.5 h-3.5 stroke-[1.75]" />
        </button>

        {/* Notifications Icon with Red Dot */}
        <button className="w-[28px] h-[28px] rounded-btn border border-border-subtle hover:border-border-strong bg-white flex items-center justify-center text-ink-muted hover:text-ink-primary transition-colors relative cursor-pointer" title="Notifications">
          <Bell className="w-3.5 h-3.5 stroke-[1.75]" />
          <span className="w-2 h-2 rounded-full bg-status-dot absolute top-1 right-1 border border-white" />
        </button>

        {/* Primary Action Button: Run AI Task */}
        <button
          onClick={() => navigate('/clip-studio')}
          className="h-[32px] px-3 bg-accent hover:bg-accent-hover text-white font-semibold text-xs rounded-btn flex items-center gap-1.5 shadow-sm transition-colors cursor-pointer"
        >
          <Zap className="w-3.5 h-3.5 stroke-[2] fill-white" />
          <span className="hidden sm:inline">Run AI Task</span>
        </button>

        {/* User Avatar */}
        <div className="w-[28px] h-[28px] rounded-full bg-accent text-white font-bold text-[11px] flex items-center justify-center shadow-sm cursor-pointer ml-1">
          {user.avatar || 'SD'}
        </div>
      </div>
    </header>
  );
};

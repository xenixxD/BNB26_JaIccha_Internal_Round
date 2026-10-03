import React from 'react';
import { useLocation } from 'react-router-dom';
import { useStore } from '../../store/useStore';
import { Search, Bell, Upload, Sparkles, Folder } from 'lucide-react';

export const Header = ({ onOpenUploadModal }) => {
  const location = useLocation();
  const { searchQuery, setSearchQuery, projects, activeProjectId } = useStore();

  const activeProj = projects.find((p) => p.id === activeProjectId) || projects[0];

  const getPageTitle = (pathname) => {
    switch (pathname) {
      case '/': return { title: 'Dashboard', subtitle: 'Overview of creator operations & clip generation' };
      case '/projects': return { title: 'Projects', subtitle: 'Manage content projects and workspaces' };
      case '/assets': return { title: 'Smart Asset Manager', subtitle: 'Upload and organize videos, scripts, audio & media' };
      case '/clip-studio': return { title: 'AI Clip Studio', subtitle: 'Analyze video potential & match scripts to transcript' };
      case '/video-editor': return { title: 'Video Editor Workspace', subtitle: 'Trim 9:16 vertical clips, format hooks & subtitles' };
      case '/planner': return { title: 'Content Planner', subtitle: 'Kanban & calendar scheduling for social platforms' };
      case '/analytics': return { title: 'Analytics', subtitle: 'Track views, retention, and clip performance' };
      case '/settings': return { title: 'Settings', subtitle: 'Preferences, default platforms & API keys' };
      case '/auth': return { title: 'Authentication', subtitle: 'Sign in to your CreatorAI operating platform' };
      default: return { title: 'CreatorAI Platform', subtitle: 'AI-Powered Creator Operating Platform' };
    }
  };

  const pageInfo = getPageTitle(location.pathname);

  return (
    <header className="h-16 bg-slate-900 border-b border-slate-800 px-6 flex items-center justify-between sticky top-0 z-10 shadow-sm">
      {/* Left Title & Breadcrumbs */}
      <div>
        <div className="flex items-center gap-2 text-[11px] text-slate-400 font-medium">
          <span className="flex items-center gap-1 hover:text-slate-300">
            <Folder className="w-3 h-3 text-indigo-400" />
            {activeProj?.name || 'Workspace'}
          </span>
          <span>/</span>
          <span className="text-slate-200 capitalize font-semibold">{pageInfo.title}</span>
        </div>
        <h2 className="text-base font-bold text-slate-100 leading-tight">{pageInfo.title}</h2>
      </div>

      {/* Right Controls & Actions */}
      <div className="flex items-center gap-3">
        {/* Global Search */}
        <div className="relative w-64 hidden sm:block">
          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5 pointer-events-none" />
          <input
            type="text"
            placeholder="Search projects, clips, assets..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-slate-800 text-slate-200 text-xs font-medium rounded-lg border border-slate-700/80 pl-9 pr-3 py-2 focus:outline-none focus:border-indigo-500 transition-colors"
          />
        </div>

        {/* Quick Upload Action */}
        <button
          onClick={onOpenUploadModal}
          className="bg-slate-800 hover:bg-slate-700 text-slate-200 font-medium text-xs py-2 px-3 rounded-lg border border-slate-700 flex items-center gap-1.5 transition-colors shadow-sm"
        >
          <Upload className="w-3.5 h-3.5 text-indigo-400" />
          <span className="hidden md:inline">Upload Asset</span>
        </button>

        {/* Notifications */}
        <button className="relative bg-slate-800 hover:bg-slate-700 p-2 rounded-lg border border-slate-700 text-slate-300 transition-colors">
          <Bell className="w-4 h-4" />
          <span className="w-2 h-2 rounded-full bg-indigo-500 absolute top-1.5 right-1.5 animate-pulse" />
        </button>
      </div>
    </header>
  );
};

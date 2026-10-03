import React from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { useStore } from '../../store/useStore';
import {
  LayoutDashboard,
  FolderKanban,
  FolderSearch,
  Sparkles,
  FileCheck,
  Film,
  Video,
  CalendarDays,
  BarChart3,
  Settings,
  Plus,
  ChevronsUpDown,
  LogOut,
  Layers
} from 'lucide-react';

export const Sidebar = ({ onOpenNewProjectModal }) => {
  const location = useLocation();
  const { projects, activeProjectId, setActiveProject, user } = useStore();

  const activeProj = projects.find((p) => p.id === activeProjectId) || projects[0];

  const navItems = [
    { name: 'Dashboard', path: '/', icon: LayoutDashboard },
    { name: 'Projects', path: '/projects', icon: FolderKanban, badge: projects.length },
    { name: 'Asset Library', path: '/assets', icon: FolderSearch },
    { name: 'AI Potential Analyzer', path: '/clip-studio', icon: Sparkles },
    { name: 'AI Script Matcher', path: '/clip-studio', icon: FileCheck },
    { name: 'AI Clip Studio', path: '/clip-studio', icon: Film },
    { name: 'Video Editor', path: '/video-editor', icon: Video },
    { name: 'Content Planner', path: '/planner', icon: CalendarDays },
    { name: 'Analytics', path: '/analytics', icon: BarChart3 },
    { name: 'Settings', path: '/settings', icon: Settings },
  ];

  return (
    <aside className="w-[208px] bg-navy-sidebar text-navy-text flex flex-col justify-between shrink-0 select-none h-screen sticky top-0 border-r border-slate-800 z-20">
      {/* Top Section */}
      <div className="flex flex-col min-h-0">
        {/* Brand Area */}
        <div className="px-4 py-3 flex items-center gap-2.5 border-b border-slate-800/80">
          <div className="w-7 h-7 rounded-[6px] bg-accent flex items-center justify-center text-white font-bold text-sm shadow-sm shrink-0">
            C
          </div>
          <div className="truncate">
            <h1 className="font-bold text-white text-[13px] leading-tight truncate">CreatorAI</h1>
            <span className="text-micro text-navy-label uppercase tracking-widest block font-semibold">PRO WORKSPACE</span>
          </div>
        </div>

        {/* Primary CTA */}
        <div className="p-3">
          <button
            onClick={onOpenNewProjectModal}
            className="w-full h-[32px] bg-accent hover:bg-accent-hover text-white text-xs font-semibold rounded-btn flex items-center justify-center gap-1.5 shadow-sm transition-colors cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
            <span>New Project</span>
          </button>
        </div>

        {/* Section Label */}
        <div className="px-4 pt-1 pb-1.5 text-micro text-navy-label uppercase tracking-widest font-semibold">
          Platform Navigation
        </div>

        {/* Nav Items List */}
        <nav className="px-2 space-y-0.5 overflow-y-auto max-h-[calc(100vh-220px)]">
          {navItems.map((item, idx) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.path && (
              idx !== 3 && idx !== 4 || location.pathname === '/clip-studio'
            );

            return (
              <NavLink
                key={idx}
                to={item.path}
                className={({ isActive: linkActive }) => {
                  const active = linkActive && (item.name !== 'AI Potential Analyzer' && item.name !== 'AI Script Matcher' || location.pathname === '/clip-studio');
                  return `h-[32px] flex items-center justify-between px-2.5 rounded-btn text-xs font-medium transition-all relative ${
                    active
                      ? 'bg-navy-active text-white font-semibold'
                      : 'text-navy-text hover:text-white hover:bg-navy-hover'
                  }`;
                }}
              >
                {({ isActive: linkActive }) => {
                  const active = linkActive && (item.name !== 'AI Potential Analyzer' && item.name !== 'AI Script Matcher' || location.pathname === '/clip-studio');
                  return (
                    <>
                      {active && (
                        <span className="absolute left-0 top-1 bottom-1 w-[3px] bg-navy-accent rounded-r" />
                      )}
                      <div className="flex items-center gap-2 truncate">
                        <Icon className={`w-4 h-4 shrink-0 ${active ? 'text-white' : 'text-navy-label'}`} />
                        <span className="truncate">{item.name}</span>
                      </div>
                      {item.badge !== undefined && (
                        <span className="text-[10px] font-mono font-bold px-1.5 py-0.5 rounded-chip bg-slate-800 text-navy-text">
                          {item.badge}
                        </span>
                      )}
                    </>
                  );
                }}
              </NavLink>
            );
          })}
        </nav>
      </div>

      {/* Pinned Bottom Area */}
      <div className="border-t border-slate-800/80 bg-navy-sidebar p-2 space-y-1">
        {/* Workspace Switcher */}
        <div className="p-2 rounded-btn hover:bg-navy-hover transition-colors flex items-center justify-between cursor-pointer">
          <div className="flex items-center gap-2 truncate">
            <div className="w-5 h-5 rounded-[4px] bg-navy-active text-white font-mono text-[10px] font-bold flex items-center justify-center shrink-0">
              {activeProj?.name.charAt(0) || 'W'}
            </div>
            <div className="truncate">
              <span className="text-xs font-semibold text-white block truncate">{activeProj?.name || 'Workspace'}</span>
              <span className="text-[10px] text-navy-label block truncate">Team Plan</span>
            </div>
          </div>
          <ChevronsUpDown className="w-3.5 h-3.5 text-navy-label shrink-0" />
        </div>

        {/* User Info Row */}
        <div className="px-2 py-1.5 flex items-center justify-between border-t border-slate-800/60 pt-2">
          <div className="flex items-center gap-2 truncate">
            <div className="w-6 h-6 rounded-full bg-accent text-white text-[10px] font-bold flex items-center justify-center shrink-0">
              {user.avatar || 'SD'}
            </div>
            <span className="text-xs font-medium text-white truncate">{user.name}</span>
          </div>
          <NavLink to="/auth" className="text-navy-label hover:text-white p-1 rounded transition-colors" title="Sign Out">
            <LogOut className="w-3.5 h-3.5" />
          </NavLink>
        </div>
      </div>
    </aside>
  );
};

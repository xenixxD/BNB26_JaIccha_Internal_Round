import React from 'react';
import { NavLink } from 'react-router-dom';
import { useStore } from '../../store/useStore';
import {
  LayoutDashboard,
  FolderKanban,
  FolderSearch,
  Video,
  Scissors,
  CalendarDays,
  Settings,
  Plus,
  ChevronDown
} from 'lucide-react';

export const Sidebar = ({ onOpenNewProjectModal }) => {
  const { projects, activeProjectId, setActiveProject, editorUnsavedChanges, editorSavingDraft, discardEditorChanges, user } = useStore();

  const activeProj = projects.find((p) => p.id === activeProjectId) || projects[0];

  const handleProjectChange = (projectId) => {
    if (editorSavingDraft) return;
    if (editorUnsavedChanges && !window.confirm('You have unsaved editor changes. Leave this clip without saving them?')) return;
    if (editorUnsavedChanges) discardEditorChanges();
    setActiveProject(projectId);
  };

  const navItems = [
    { name: 'Home', path: '/', icon: LayoutDashboard },
    { name: 'Projects', path: '/projects', icon: FolderKanban, badge: projects.length },
    { name: 'Footage', path: '/assets', icon: FolderSearch },
    { name: 'Find clips', path: '/clip-studio', icon: Video },
    { name: 'Editor', path: '/video-editor', icon: Scissors },
    { name: 'Planner', path: '/planner', icon: CalendarDays },
    { name: 'Settings', path: '/settings', icon: Settings },
  ];

  return (
    <aside className="hidden md:flex w-[208px] bg-navy-sidebar text-navy-text flex-col justify-between shrink-0 select-none h-screen sticky top-0 border-r border-slate-800 z-20">
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
          Your workspace
        </div>

        {/* Nav Items List */}
        <nav className="px-2 space-y-0.5 overflow-y-auto max-h-[calc(100vh-220px)]">
          {navItems.map((item) => {
            const Icon = item.icon;

            return (
              <NavLink
                key={item.path}
                to={item.path}
                className={({ isActive: linkActive }) => {
                  const active = linkActive;
                  return `h-[32px] flex items-center justify-between px-2.5 rounded-btn text-xs font-medium transition-all relative ${
                    active
                      ? 'bg-navy-active text-white font-semibold'
                      : 'text-navy-text hover:text-white hover:bg-navy-hover'
                  }`;
                }}
              >
                {({ isActive: linkActive }) => {
                  const active = linkActive;
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
        <label className="p-2 rounded-btn hover:bg-navy-hover transition-colors flex items-center justify-between gap-2">
          <div className="flex items-center gap-2 truncate">
            <div className="w-5 h-5 rounded-[4px] bg-navy-active text-white font-mono text-[10px] font-bold flex items-center justify-center shrink-0">
              {activeProj?.name.charAt(0) || 'W'}
            </div>
            <div className="truncate">
              <span className="text-xs font-semibold text-white block truncate">{activeProj?.name || 'Workspace'}</span>
              <span className="text-[10px] text-navy-label block truncate">Current project</span>
            </div>
          </div>
          <select
            aria-label="Choose current project"
            value={activeProj?.id || ''}
            disabled={editorSavingDraft}
            onChange={(event) => handleProjectChange(event.target.value)}
            className="max-w-20 bg-transparent text-transparent outline-none cursor-pointer disabled:cursor-wait"
          >
            {!projects.length && <option value="">No projects</option>}
            {projects.map((project) => <option key={project.id} value={project.id} className="text-ink-primary">{project.name}</option>)}
          </select>
          <ChevronDown className="w-3.5 h-3.5 text-navy-label shrink-0 pointer-events-none -ml-7" />
        </label>

        {/* User Info Row */}
        <div className="px-2 py-1.5 flex items-center justify-between border-t border-slate-800/60 pt-2">
          <div className="flex items-center gap-2 truncate">
            <div className="w-6 h-6 rounded-full bg-accent text-white text-[10px] font-bold flex items-center justify-center shrink-0">
              {user.avatar || 'W'}
            </div>
            <span className="text-xs font-medium text-white truncate">Local workspace</span>
          </div>
        </div>
      </div>
    </aside>
  );
};

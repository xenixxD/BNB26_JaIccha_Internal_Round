import React from 'react';
import { NavLink } from 'react-router-dom';
import { useStore } from '../../store/useStore';
import {
  LayoutDashboard,
  FolderKanban,
  FolderSearch,
  Sparkles,
  Video,
  CalendarDays,
  BarChart3,
  Settings,
  Plus,
  Layers,
  ChevronRight,
  LogOut
} from 'lucide-react';

export const Sidebar = ({ onOpenNewProjectModal }) => {
  const { projects, activeProjectId, setActiveProject, user } = useStore();

  const activeProj = projects.find((p) => p.id === activeProjectId) || projects[0];

  const navItems = [
    { name: 'Dashboard', path: '/', icon: LayoutDashboard },
    { name: 'Projects', path: '/projects', icon: FolderKanban, badge: projects.length },
    { name: 'Asset Library', path: '/assets', icon: FolderSearch },
    { name: 'AI Clip Studio', path: '/clip-studio', icon: Sparkles, highlight: true },
    { name: 'Video Editor', path: '/video-editor', icon: Video },
    { name: 'Content Planner', path: '/planner', icon: CalendarDays },
    { name: 'Analytics', path: '/analytics', icon: BarChart3 },
    { name: 'Settings', path: '/settings', icon: Settings },
  ];

  return (
    <aside className="w-64 bg-slate-900 border-r border-slate-800 text-slate-300 flex flex-col justify-between shrink-0 select-none h-screen sticky top-0">
      {/* Top Section: Brand & Nav */}
      <div>
        {/* Brand Header */}
        <div className="p-5 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-indigo-600 via-indigo-500 to-violet-500 flex items-center justify-center text-white shadow-lg shadow-indigo-500/20 font-bold text-lg tracking-wider">
              C
            </div>
            <div>
              <h1 className="font-bold text-slate-100 text-base leading-tight tracking-tight">CreatorAI</h1>
              <span className="text-[10px] text-indigo-400 font-semibold uppercase tracking-widest block">Operating Studio</span>
            </div>
          </div>
        </div>

        {/* Active Project Selector */}
        <div className="p-3 border-b border-slate-800/80 bg-slate-950/40">
          <label className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider block mb-1.5 px-2">
            Active Workspace
          </label>
          <div className="relative">
            <select
              value={activeProjectId}
              onChange={(e) => setActiveProject(e.target.value)}
              className="w-full bg-slate-800 text-slate-200 text-xs font-medium rounded-lg border border-slate-700/80 px-3 py-2 pr-8 focus:outline-none focus:border-indigo-500 transition-colors cursor-pointer appearance-none"
            >
              {projects.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </select>
            <Layers className="w-3.5 h-3.5 text-slate-400 absolute right-3 top-2.5 pointer-events-none" />
          </div>
        </div>

        {/* CTA Button */}
        <div className="p-3">
          <button
            onClick={onOpenNewProjectModal}
            className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-medium text-xs py-2.5 px-3 rounded-lg flex items-center justify-center gap-2 shadow-md shadow-indigo-600/20 transition-all active:scale-[0.98]"
          >
            <Plus className="w-4 h-4 stroke-[2.5]" />
            <span>New Project</span>
          </button>
        </div>

        {/* Navigation Menu */}
        <nav className="px-2 space-y-1 mt-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.path}
                to={item.path}
                className={({ isActive }) =>
                  `flex items-center justify-between px-3 py-2.5 rounded-lg text-xs font-medium transition-all group ${
                    isActive
                      ? 'bg-indigo-600/15 text-indigo-400 font-semibold border-l-2 border-indigo-500 pl-2.5'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
                  }`
                }
              >
                <div className="flex items-center gap-2.5">
                  <Icon className={`w-4 h-4 transition-colors ${item.highlight ? 'text-indigo-400' : 'text-slate-400 group-hover:text-slate-200'}`} />
                  <span>{item.name}</span>
                </div>

                {item.badge !== undefined && (
                  <span className="bg-slate-800 text-slate-300 text-[10px] font-bold px-2 py-0.5 rounded-full border border-slate-700/60">
                    {item.badge}
                  </span>
                )}
                {item.highlight && (
                  <span className="bg-indigo-500/20 text-indigo-300 text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded">
                    AI
                  </span>
                )}
              </NavLink>
            );
          })}
        </nav>
      </div>

      {/* User Footer Profile */}
      <div className="p-3 border-t border-slate-800 bg-slate-950/60 flex items-center justify-between">
        <div className="flex items-center gap-2.5 overflow-hidden">
          <div className="w-8 h-8 rounded-lg bg-indigo-600/20 border border-indigo-500/30 flex items-center justify-center text-indigo-400 font-bold text-xs shrink-0">
            {user.avatar || 'SD'}
          </div>
          <div className="truncate">
            <h4 className="text-xs font-semibold text-slate-200 truncate">{user.name}</h4>
            <span className="text-[10px] text-slate-400 truncate block">{user.role}</span>
          </div>
        </div>
        <NavLink to="/auth" className="text-slate-400 hover:text-slate-200 p-1.5 rounded-md hover:bg-slate-800 transition-colors" title="Sign Out">
          <LogOut className="w-3.5 h-3.5" />
        </NavLink>
      </div>
    </aside>
  );
};

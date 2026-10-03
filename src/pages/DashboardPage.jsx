import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useStore } from '../store/useStore';
import {
  FolderKanban,
  Film,
  Calendar,
  Eye,
  Plus,
  Upload,
  Sparkles,
  Scissors,
  ArrowRight,
  TrendingUp,
  Clock,
  CheckCircle2
} from 'lucide-react';

export const DashboardPage = () => {
  const navigate = useNavigate();
  const { projects, clips, assets, user, setActiveProject } = useStore();

  const totalProjects = projects.length;
  const totalClips = clips.length;
  const draftsCount = clips.filter((c) => c.status === 'Draft').length;
  const scheduledCount = clips.filter((c) => c.status === 'Scheduled').length;
  const publishedCount = clips.filter((c) => c.status === 'Published').length;

  const kpis = [
    { title: 'Total Projects', value: totalProjects, icon: FolderKanban, color: 'text-indigo-400', bg: 'bg-indigo-500/10 border-indigo-500/20' },
    { title: 'Generated Clips', value: totalClips, icon: Film, color: 'text-violet-400', bg: 'bg-violet-500/10 border-violet-500/20' },
    { title: 'Content Drafts', value: draftsCount, icon: Scissors, color: 'text-amber-400', bg: 'bg-amber-500/10 border-amber-500/20' },
    { title: 'Scheduled Posts', value: scheduledCount, icon: Calendar, color: 'text-emerald-400', bg: 'bg-emerald-500/10 border-emerald-500/20' },
    { title: 'Total Views (Demo)', value: '148.2K', icon: Eye, color: 'text-blue-400', bg: 'bg-blue-500/10 border-blue-500/20' },
  ];

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Welcome Banner */}
      <div className="bg-gradient-to-r from-indigo-900/40 via-slate-900 to-slate-900 border border-indigo-500/30 rounded-2xl p-6 relative overflow-hidden shadow-xl">
        <div className="relative z-10 max-w-2xl">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-indigo-500/20 border border-indigo-500/40 text-indigo-300 text-xs font-semibold mb-3">
            <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
            <span>AI-Powered Creator Operating Platform</span>
          </div>
          <h1 className="text-2xl font-bold text-white mb-2">
            Welcome back, {user.name}! 👋
          </h1>
          <p className="text-xs text-slate-300 leading-relaxed">
            Turn long-form keynotes, podcasts, and talks into viral vertical 9:16 short-form content.
            Analyze potential moments, match scripts to video, and schedule across platforms.
          </p>
        </div>

        {/* Floating Quick Action CTA */}
        <div className="mt-5 flex flex-wrap gap-3 relative z-10">
          <button
            onClick={() => navigate('/clip-studio')}
            className="bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold py-2.5 px-4 rounded-xl shadow-lg shadow-indigo-600/30 flex items-center gap-2 transition-all active:scale-[0.98]"
          >
            <Sparkles className="w-4 h-4" />
            <span>Analyze Video Potential</span>
          </button>
          <button
            onClick={() => navigate('/assets')}
            className="bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-semibold py-2.5 px-4 rounded-xl flex items-center gap-2 transition-colors"
          >
            <Upload className="w-4 h-4 text-indigo-400" />
            <span>Upload Media Asset</span>
          </button>
        </div>
      </div>

      {/* KPI Metrics Grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
        {kpis.map((kpi, idx) => {
          const Icon = kpi.icon;
          return (
            <div key={idx} className={`p-4 rounded-xl border ${kpi.bg} bg-slate-900/60 shadow-sm flex flex-col justify-between`}>
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-medium text-slate-400">{kpi.title}</span>
                <Icon className={`w-4 h-4 ${kpi.color}`} />
              </div>
              <div className="text-2xl font-bold text-slate-100">{kpi.value}</div>
            </div>
          );
        })}
      </div>

      {/* Quick Action Matrix */}
      <div>
        <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">Quick Workflows</h3>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
          {[
            { name: 'Upload Video', desc: 'Add MP4 / MOV source', path: '/assets', icon: Upload, color: 'text-indigo-400' },
            { name: 'Create Project', desc: 'Organize workspace', path: '/projects', icon: Plus, color: 'text-emerald-400' },
            { name: 'Analyze Potential', desc: 'Find viral moments', path: '/clip-studio', icon: Sparkles, color: 'text-violet-400' },
            { name: 'Video Editor', desc: '9:16 vertical crop', path: '/video-editor', icon: Scissors, color: 'text-amber-400' },
            { name: 'Plan Content', desc: 'Schedule social posts', path: '/planner', icon: Calendar, color: 'text-blue-400' },
          ].map((action, idx) => {
            const Icon = action.icon;
            return (
              <button
                key={idx}
                onClick={() => navigate(action.path)}
                className="bg-slate-900 hover:bg-slate-800/80 border border-slate-800 hover:border-slate-700 p-3.5 rounded-xl text-left transition-all group flex flex-col justify-between"
              >
                <div className="flex items-center justify-between mb-2">
                  <Icon className={`w-5 h-5 ${action.color}`} />
                  <ArrowRight className="w-3.5 h-3.5 text-slate-500 group-hover:text-slate-300 group-hover:translate-x-0.5 transition-all" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-slate-200 group-hover:text-indigo-400 transition-colors">{action.name}</h4>
                  <p className="text-[11px] text-slate-400">{action.desc}</p>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Recent Projects & Clips */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Projects List (2 Cols) */}
        <div className="lg:col-span-2 bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-slate-200">Active Workspaces</h3>
            <button onClick={() => navigate('/projects')} className="text-xs text-indigo-400 hover:underline font-medium">View All</button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {projects.slice(0, 2).map((p) => (
              <div
                key={p.id}
                onClick={() => {
                  setActiveProject(p.id);
                  navigate('/projects');
                }}
                className="bg-slate-950/60 border border-slate-800/80 hover:border-indigo-500/50 rounded-xl p-4 cursor-pointer transition-all hover:shadow-lg group"
              >
                <div className="h-28 rounded-lg overflow-hidden mb-3 relative bg-slate-800">
                  <img src={p.thumbnail} alt={p.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                  <span className="absolute top-2 right-2 bg-slate-900/80 text-indigo-300 text-[10px] font-bold px-2 py-0.5 rounded-full border border-slate-700">
                    {p.category}
                  </span>
                </div>
                <h4 className="font-bold text-sm text-slate-100 group-hover:text-indigo-400 transition-colors">{p.name}</h4>
                <p className="text-xs text-slate-400 line-clamp-2 mt-1">{p.description}</p>

                <div className="mt-3 pt-2 border-t border-slate-800/60 flex items-center justify-between text-[11px] text-slate-400">
                  <span>{p.assetsCount} Assets</span>
                  <span>{p.clipsCount} Generated Clips</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Recent Generated Clips Sidebar */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-slate-200">Recent Generated Clips</h3>
            <button onClick={() => navigate('/planner')} className="text-xs text-indigo-400 hover:underline font-medium">Planner</button>
          </div>

          <div className="space-y-3">
            {clips.slice(0, 3).map((clip) => (
              <div
                key={clip.id}
                onClick={() => navigate('/video-editor')}
                className="bg-slate-950/60 border border-slate-800 hover:border-slate-700 p-3 rounded-lg flex items-center justify-between cursor-pointer transition-all"
              >
                <div className="flex items-center gap-3 overflow-hidden">
                  <div className="w-10 h-10 rounded-md bg-indigo-600/20 border border-indigo-500/30 flex items-center justify-center text-indigo-400 font-bold text-xs shrink-0">
                    9:16
                  </div>
                  <div className="truncate">
                    <h5 className="text-xs font-semibold text-slate-200 truncate">{clip.title}</h5>
                    <div className="flex items-center gap-2 text-[10px] text-slate-400 mt-0.5">
                      <span>{clip.duration}s</span>
                      <span>•</span>
                      <span className="text-emerald-400 font-semibold">{clip.potentialScore}% Score</span>
                    </div>
                  </div>
                </div>

                <span className={`text-[10px] font-semibold px-2 py-0.5 rounded ${
                  clip.status === 'Scheduled' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' :
                  clip.status === 'Ready for Review' ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20' :
                  'bg-slate-800 text-slate-300'
                }`}>
                  {clip.status}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

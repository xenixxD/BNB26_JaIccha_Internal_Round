import React, { useState } from 'react';
import { useStore } from '../store/useStore';
import {
  FolderKanban,
  Plus,
  Search,
  Video,
  FileText,
  Film,
  Calendar,
  Layers,
  Sparkles,
  ExternalLink,
  Trash2
} from 'lucide-react';
import { NewProjectModal } from '../components/common/NewProjectModal';
import { useNavigate } from 'react-router-dom';

export const ProjectsPage = () => {
  const navigate = useNavigate();
  const { projects, activeProjectId, setActiveProject, assets, clips } = useStore();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [filterCategory, setFilterCategory] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');

  const activeProj = projects.find((p) => p.id === activeProjectId) || projects[0];

  const filteredProjects = projects.filter((p) => {
    const matchesCategory = filterCategory === 'All' || p.category === filterCategory;
    const matchesSearch = p.name.toLowerCase().includes(searchQuery.toLowerCase()) || p.description.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const projAssets = assets.filter((a) => a.projectId === activeProjectId);
  const projClips = clips.filter((c) => c.projectId === activeProjectId);

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-900 border border-slate-800 p-5 rounded-2xl">
        <div>
          <h1 className="text-lg font-bold text-slate-100 flex items-center gap-2">
            <FolderKanban className="w-5 h-5 text-indigo-400" />
            Projects Workspace
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Organize long-form video recordings, scripts, transcripts, and generated short-form clips.
          </p>
        </div>

        <button
          onClick={() => setIsModalOpen(true)}
          className="bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold py-2.5 px-4 rounded-xl shadow-lg shadow-indigo-600/20 flex items-center gap-2 self-start sm:self-auto transition-all"
        >
          <Plus className="w-4 h-4" />
          <span>New Project</span>
        </button>
      </div>

      {/* Projects Grid Section */}
      <div className="space-y-4">
        {/* Search & Category Filter Bar */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="relative w-full sm:w-72">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5 pointer-events-none" />
            <input
              type="text"
              placeholder="Search projects..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-slate-900 border border-slate-800 text-xs text-slate-200 pl-9 pr-3 py-2 rounded-lg focus:outline-none focus:border-indigo-500"
            />
          </div>

          <div className="flex items-center gap-1.5 overflow-x-auto w-full sm:w-auto pb-1 sm:pb-0">
            {['All', 'Technology & AI', 'Product & Startup', 'Podcast & Talk'].map((cat) => (
              <button
                key={cat}
                onClick={() => setFilterCategory(cat)}
                className={`text-xs px-3 py-1.5 rounded-lg font-medium transition-all ${
                  filterCategory === cat
                    ? 'bg-indigo-600/20 text-indigo-300 border border-indigo-500/40'
                    : 'bg-slate-900 text-slate-400 hover:text-slate-200 border border-slate-800'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        {/* Project Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredProjects.map((p) => {
            const isSelected = p.id === activeProjectId;
            return (
              <div
                key={p.id}
                onClick={() => setActiveProject(p.id)}
                className={`bg-slate-900 border rounded-xl overflow-hidden cursor-pointer transition-all ${
                  isSelected
                    ? 'border-indigo-500 ring-2 ring-indigo-500/20 shadow-xl'
                    : 'border-slate-800 hover:border-slate-700'
                }`}
              >
                <div className="h-36 relative bg-slate-950 overflow-hidden">
                  <img src={p.thumbnail} alt={p.name} className="w-full h-full object-cover" />
                  <div className="absolute inset-0 bg-gradient-to-t from-slate-900 via-transparent to-transparent" />
                  <span className="absolute top-3 left-3 bg-slate-950/80 backdrop-blur-sm text-indigo-300 text-[10px] font-bold px-2.5 py-1 rounded-md border border-slate-700">
                    {p.category}
                  </span>
                  {isSelected && (
                    <span className="absolute top-3 right-3 bg-indigo-600 text-white text-[10px] font-bold px-2.5 py-1 rounded-md shadow">
                      ACTIVE WORKSPACE
                    </span>
                  )}
                </div>

                <div className="p-4 space-y-2">
                  <h3 className="font-bold text-slate-100 text-base">{p.name}</h3>
                  <p className="text-xs text-slate-400 line-clamp-2">{p.description}</p>

                  <div className="pt-3 border-t border-slate-800 flex items-center justify-between text-xs text-slate-400">
                    <span className="flex items-center gap-1"><Video className="w-3.5 h-3.5 text-indigo-400" /> {p.assetsCount} Assets</span>
                    <span className="flex items-center gap-1"><Film className="w-3.5 h-3.5 text-violet-400" /> {p.clipsCount} Clips</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Selected Active Project Workspace Details */}
      {activeProj && (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-6">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800 pb-5">
            <div>
              <span className="text-[10px] font-bold text-indigo-400 uppercase tracking-widest block mb-1">
                Active Project Workspace
              </span>
              <h2 className="text-xl font-bold text-white">{activeProj.name}</h2>
              <p className="text-xs text-slate-300 mt-1 max-w-xl">{activeProj.description}</p>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => navigate('/clip-studio')}
                className="bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold py-2 px-3.5 rounded-lg flex items-center gap-1.5 shadow"
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>Open in AI Clip Studio</span>
              </button>
            </div>
          </div>

          {/* Project Assets & Clips Overview */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Assets Column */}
            <div className="bg-slate-950/50 border border-slate-800 rounded-xl p-4 space-y-3">
              <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-2">
                <Video className="w-4 h-4 text-indigo-400" />
                Project Source Assets ({projAssets.length})
              </h3>

              <div className="space-y-2">
                {projAssets.length === 0 ? (
                  <p className="text-xs text-slate-500 py-4 text-center">No assets uploaded yet.</p>
                ) : (
                  projAssets.map((asset) => (
                    <div key={asset.id} className="bg-slate-900 border border-slate-800/80 p-3 rounded-lg flex items-center justify-between">
                      <div className="flex items-center gap-2.5 overflow-hidden">
                        <div className="w-8 h-8 rounded bg-slate-800 flex items-center justify-center text-indigo-400 text-xs font-bold shrink-0">
                          {asset.fileType === 'video' ? 'MP4' : asset.fileType === 'script' ? 'TXT' : 'AUDIO'}
                        </div>
                        <div className="truncate">
                          <h5 className="text-xs font-semibold text-slate-200 truncate">{asset.filename}</h5>
                          <span className="text-[10px] text-slate-400">{(asset.fileSize / 1024 / 1024).toFixed(1)} MB • {asset.uploadDate}</span>
                        </div>
                      </div>
                      <span className="text-[10px] bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-semibold px-2 py-0.5 rounded">Ready</span>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Generated Clips Column */}
            <div className="bg-slate-950/50 border border-slate-800 rounded-xl p-4 space-y-3">
              <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-2">
                <Film className="w-4 h-4 text-violet-400" />
                Project Generated Clips ({projClips.length})
              </h3>

              <div className="space-y-2">
                {projClips.length === 0 ? (
                  <p className="text-xs text-slate-500 py-4 text-center">No clips generated for this project yet.</p>
                ) : (
                  projClips.map((clip) => (
                    <div
                      key={clip.id}
                      onClick={() => navigate('/video-editor')}
                      className="bg-slate-900 border border-slate-800/80 hover:border-indigo-500/40 p-3 rounded-lg flex items-center justify-between cursor-pointer transition-all"
                    >
                      <div className="flex items-center gap-2.5 overflow-hidden">
                        <div className="w-8 h-8 rounded bg-violet-600/20 border border-violet-500/30 flex items-center justify-center text-violet-400 text-[10px] font-bold shrink-0">
                          9:16
                        </div>
                        <div className="truncate">
                          <h5 className="text-xs font-semibold text-slate-200 truncate">{clip.title}</h5>
                          <span className="text-[10px] text-slate-400">{clip.duration}s • {clip.potentialScore}% Score</span>
                        </div>
                      </div>
                      <span className="text-[10px] bg-indigo-500/10 text-indigo-300 font-semibold px-2 py-0.5 rounded border border-indigo-500/20">
                        {clip.status}
                      </span>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      <NewProjectModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} />
    </div>
  );
};

import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useStore } from '../store/useStore';
import { PageHeader } from '../components/ui/PageHeader';
import { Panel } from '../components/ui/Panel';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import { Input } from '../components/ui/Input';
import { NewProjectModal } from '../components/common/NewProjectModal';
import {
  Plus,
  Search,
  Sparkles,
  LayoutGrid,
  List as ListIcon,
  Download
} from 'lucide-react';

export const ProjectsPage = () => {
  const navigate = useNavigate();
  const { projects, activeProjectId, setActiveProject, assets, clips, outputs } = useStore();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [filterCategory, setFilterCategory] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [viewMode, setViewMode] = useState('grid'); // 'grid' | 'list'

  const activeProj = projects.find((p) => p.id === activeProjectId) || projects[0];

  const filteredProjects = projects.filter((p) => {
    const matchesCategory = filterCategory === 'All' || p.category === filterCategory;
    const matchesSearch = p.name.toLowerCase().includes(searchQuery.toLowerCase()) || p.description.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const projAssets = assets.filter((a) => a.projectId === activeProjectId);
  const projClips = clips.filter((c) => c.projectId === activeProjectId);

  return (
    <div className="space-y-5 max-w-[1600px] mx-auto">
      {/* Page Header */}
      <PageHeader
        title="Projects Workspace"
        metaChip={`Active: ${activeProj?.name || 'Workspace'}`}
        breadcrumbs={[
          { label: 'CreatorAI', path: '/' },
          { label: 'Projects' }
        ]}
        actions={
          <Button variant="primary" onClick={() => setIsModalOpen(true)} icon={Plus}>
            New Project
          </Button>
        }
      />

      {/* Toolbar with Search, Category Filter, and View Toggle */}
      <div className="bg-white border border-border-subtle p-3 rounded-panel flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="w-full sm:w-72">
          <Input
            placeholder="Search projects..."
            icon={Search}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        <div className="flex items-center gap-2 overflow-x-auto w-full sm:w-auto">
          {['All', 'Technology & AI', 'Product & Startup', 'Podcast & Talk'].map((cat) => (
            <button
              key={cat}
              onClick={() => setFilterCategory(cat)}
              className={`h-[28px] px-3 rounded-chip text-[11px] font-semibold transition-colors cursor-pointer ${
                filterCategory === cat
                  ? 'bg-accent text-white shadow-sm'
                  : 'bg-white text-ink-secondary border border-border-subtle hover:border-border-strong'
              }`}
            >
              {cat}
            </button>
          ))}

          <div className="h-4 w-[1px] bg-border-subtle mx-1" />

          <div className="flex bg-surface-inset p-0.5 rounded-chip border border-border-subtle">
            <button
              type="button"
              aria-label="Show project cards"
              onClick={() => setViewMode('grid')}
              className={`p-1 rounded-chip ${viewMode === 'grid' ? 'bg-white shadow-sm text-ink-primary' : 'text-ink-muted'}`}
            >
              <LayoutGrid className="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              aria-label="Show projects as a list"
              onClick={() => setViewMode('list')}
              className={`p-1 rounded-chip ${viewMode === 'list' ? 'bg-white shadow-sm text-ink-primary' : 'text-ink-muted'}`}
            >
              <ListIcon className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>

      {filteredProjects.length === 0 && (
        <Panel title={projects.length === 0 ? 'Start with a project' : 'No projects match this search'}>
          <p className="text-sm text-ink-muted">{projects.length === 0 ? 'Projects keep your footage, suggestions, and drafts together.' : 'Try another search or choose a different category.'}</p>
          {projects.length === 0 && <Button className="mt-3" variant="primary" onClick={() => setIsModalOpen(true)} icon={Plus}>Create a project</Button>}
        </Panel>
      )}

      {/* Project Cards Grid / List */}
      {viewMode === 'grid' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredProjects.map((p) => {
            const isSelected = p.id === activeProjectId;
            return (
              <div
                key={p.id}
                role="button"
                tabIndex={0}
                onClick={() => setActiveProject(p.id)}
                onKeyDown={(event) => { if (event.key === 'Enter' || event.key === ' ') { event.preventDefault(); setActiveProject(p.id); } }}
                className={`bg-white border rounded-panel overflow-hidden cursor-pointer transition-all p-4 space-y-3 ${
                  isSelected ? 'border-accent ring-1 ring-accent shadow-sm' : 'border-border-subtle hover:border-border-strong'
                }`}
              >
                <div className="h-32 rounded-btn overflow-hidden relative bg-backdrop border border-border-subtle">
                  {p.thumbnail ? <img src={p.thumbnail} alt="" className="w-full h-full object-cover" /> : <div aria-hidden="true" className="w-full h-full flex items-center justify-center bg-surface-inset text-3xl font-semibold text-ink-muted">{p.name?.charAt(0)?.toUpperCase() || 'P'}</div>}
                  <span className="absolute top-2 left-2 bg-black/70 text-white font-mono text-[10px] font-bold px-2 py-0.5 rounded-chip backdrop-blur-sm">
                    {p.category}
                  </span>
                  {isSelected && (
                    <span className="absolute top-2 right-2 bg-accent text-white text-[10px] font-bold px-2 py-0.5 rounded-chip shadow">
                      ACTIVE
                    </span>
                  )}
                </div>

                <div>
                  <h3 className="font-bold text-title-panel text-ink-primary">{p.name}</h3>
                  <p className="text-body-sm text-ink-muted line-clamp-2 mt-0.5">{p.description}</p>
                </div>

                <div className="pt-2 border-t border-border-subtle flex items-center justify-between text-mono-val font-mono text-ink-muted">
                  <span>{p.assetsCount} Assets</span>
                  <span>{p.clipsCount} Clips</span>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <Panel bodyClassName="p-0">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-border-subtle bg-surface-inset text-micro text-ink-muted uppercase tracking-wider font-semibold">
                <th className="py-2.5 px-4">Project Name</th>
                <th className="py-2.5 px-4">Category</th>
                <th className="py-2.5 px-4">Assets</th>
                <th className="py-2.5 px-4">Clips</th>
                <th className="py-2.5 px-4 text-right">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border-subtle text-xs">
              {filteredProjects.map((p) => (
                <tr
                  key={p.id}
                  onClick={() => setActiveProject(p.id)}
                  className="hover:bg-surface-inset cursor-pointer transition-colors"
                >
                  <td className="py-2.5 px-4 font-bold text-ink-primary">{p.name}</td>
                  <td className="py-2.5 px-4 text-ink-secondary">{p.category}</td>
                  <td className="py-2.5 px-4 font-mono text-mono-val">{p.assetsCount}</td>
                  <td className="py-2.5 px-4 font-mono text-mono-val">{p.clipsCount}</td>
                  <td className="py-2.5 px-4 text-right">
                    <Badge variant={p.id === activeProjectId ? 'accent' : 'neutral'}>
                      {p.id === activeProjectId ? 'Active' : 'Ready'}
                    </Badge>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </Panel>
      )}

      {/* Selected Workspace Detail View */}
      {activeProj && (
        <Panel
          title={`Active Workspace: ${activeProj.name}`}
          subtitle={activeProj.description}
          action={
            <Button variant="primary" size="sm" onClick={() => navigate('/clip-studio')} icon={Sparkles}>
              Open in Clip Studio
            </Button>
          }
        >
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-1">
            <div className="p-3 rounded-btn border border-border-subtle bg-surface-inset space-y-2">
              <span className="text-micro text-ink-muted uppercase tracking-widest font-semibold block">SOURCE ASSETS ({projAssets.length})</span>
              {projAssets.map((a) => (
                <div key={a.id} className="p-2 rounded-btn bg-white border border-border-subtle flex items-center justify-between text-xs font-medium text-ink-primary">
                  <span className="truncate">{a.filename}</span>
                  <Badge variant={a.status === 'error' ? 'warning' : 'success'} size="sm">{a.status || 'Ready'}</Badge>
                </div>
              ))}
            </div>

            <div className="p-3 rounded-btn border border-border-subtle bg-surface-inset space-y-2">
              <span className="text-micro text-ink-muted uppercase tracking-widest font-semibold block">GENERATED CLIPS ({projClips.length})</span>
              {projClips.map((c) => (
                <div key={c.id} onClick={() => navigate('/video-editor')} className="p-2 rounded-btn bg-white border border-border-subtle flex items-center justify-between text-xs font-medium text-ink-primary cursor-pointer hover:border-accent">
                  <span className="truncate">{c.title}</span>
                  <Badge variant="neutral" size="sm">{c.status}</Badge>
                </div>
              ))}
            </div>
          </div>
        </Panel>
      )}

      {activeProj && (
        <Panel title={`Exported videos (${outputs.length})`} subtitle="Videos exported from this project. Download a copy or open it to review.">
          {outputs.length === 0 ? (
            <p className="text-sm text-ink-muted">No exported videos yet. Export a draft from the editor to see it here.</p>
          ) : (
            <div className="divide-y divide-border-subtle">
              {outputs.map((output) => (
                <div key={output.id} className="flex flex-col gap-2 py-3 first:pt-0 last:pb-0 sm:flex-row sm:items-center sm:justify-between">
                  <div className="min-w-0"><p className="truncate text-sm font-medium text-ink-primary">{output.filename}</p><p className="text-xs text-ink-muted">{new Date(output.created_at).toLocaleString()}</p></div>
                  <a href={output.url} download={output.filename} className="inline-flex min-h-9 items-center justify-center gap-2 rounded-btn border border-border-subtle px-3 text-xs font-semibold text-ink-primary hover:border-accent"><Download className="h-4 w-4" />Download</a>
                </div>
              ))}
            </div>
          )}
        </Panel>
      )}

      <NewProjectModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} />
    </div>
  );
};

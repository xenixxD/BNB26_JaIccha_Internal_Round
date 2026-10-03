import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useStore } from '../store/useStore';
import { PageHeader } from '../components/ui/PageHeader';
import { StatTile } from '../components/ui/StatTile';
import { Panel } from '../components/ui/Panel';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import {
  FolderKanban,
  Film,
  Calendar,
  Scissors,
  Sparkles,
  Upload,
  ArrowRight,
  Clock,
  Video
} from 'lucide-react';

export const DashboardPage = () => {
  const navigate = useNavigate();
  const { projects, clips, assets, user, setActiveProject } = useStore();

  const totalProjects = projects.length;
  const totalClips = clips.length;
  const draftsCount = clips.filter((c) => c.status === 'Draft').length;
  const scheduledCount = clips.filter((c) => c.status === 'Scheduled').length;

  return (
    <div className="space-y-5 max-w-[1600px] mx-auto">
      {/* Compact Header */}
      <PageHeader
        title="Content Operations Dashboard"
        metaChip={`User: ${user.name}`}
        breadcrumbs={[
          { label: 'CreatorAI', path: '/' },
          { label: 'Dashboard' }
        ]}
        actions={
          <div className="flex items-center gap-2">
            <Button variant="secondary" onClick={() => navigate('/assets')} icon={Upload}>
              Upload Media
            </Button>
            <Button variant="primary" onClick={() => navigate('/clip-studio')} icon={Sparkles}>
              Run AI Analysis
            </Button>
          </div>
        }
      />

      {/* Row of 4 Stat Tiles */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatTile label="TOTAL PROJECTS" value={totalProjects} subtext="Active Workspaces" icon={FolderKanban} accent />
        <StatTile label="GENERATED CLIPS" value={totalClips} subtext="Short-form renders" icon={Film} />
        <StatTile label="DRAFTS IN EDITOR" value={draftsCount} subtext="In-progress edits" icon={Scissors} />
        <StatTile label="SCHEDULED POSTS" value={scheduledCount} subtext="Ready for publishing" icon={Calendar} />
      </div>

      {/* Main Grid: Projects & Activity Queue */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* Recent Workspaces (8 Cols) */}
        <div className="lg:col-span-8">
          <Panel
            title="Active Workspaces"
            subtitle="Recent creator projects and associated media"
            action={<Button variant="ghost" size="sm" onClick={() => navigate('/projects')}>View All Projects</Button>}
            bodyClassName="p-4 space-y-3"
          >
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {projects.slice(0, 2).map((p) => (
                <div
                  key={p.id}
                  onClick={() => {
                    setActiveProject(p.id);
                    navigate('/projects');
                  }}
                  className="p-3.5 rounded-panel border border-border-subtle hover:border-accent bg-white cursor-pointer transition-all space-y-3 group"
                >
                  <div className="h-28 rounded-btn overflow-hidden relative bg-backdrop border border-border-subtle">
                    <img src={p.thumbnail} alt={p.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                    <span className="absolute top-2 left-2 bg-black/70 text-white font-mono text-[10px] font-bold px-2 py-0.5 rounded-chip backdrop-blur-sm">
                      {p.category}
                    </span>
                  </div>

                  <div>
                    <h4 className="font-bold text-title-panel text-ink-primary group-hover:text-accent transition-colors">{p.name}</h4>
                    <p className="text-body-sm text-ink-muted line-clamp-2 mt-0.5">{p.description}</p>
                  </div>

                  <div className="pt-2 border-t border-border-subtle flex items-center justify-between text-mono-val font-mono text-ink-muted">
                    <span>{p.assetsCount} Assets</span>
                    <span>{p.clipsCount} Clips</span>
                  </div>
                </div>
              ))}
            </div>
          </Panel>
        </div>

        {/* Recent Activity & Quick Workflows (4 Cols) */}
        <div className="lg:col-span-4 space-y-4">
          <Panel title="Recent Generated Clips" action={<Button variant="ghost" size="sm" onClick={() => navigate('/planner')}>Planner</Button>}>
            <div className="space-y-2.5">
              {clips.slice(0, 3).map((clip) => (
                <div
                  key={clip.id}
                  onClick={() => navigate('/video-editor')}
                  className="p-2.5 rounded-btn border border-border-subtle hover:border-accent bg-white cursor-pointer transition-colors flex items-center justify-between"
                >
                  <div className="truncate pr-2">
                    <h5 className="font-bold text-xs text-ink-primary truncate">{clip.title}</h5>
                    <span className="text-mono-val font-mono text-ink-muted block mt-0.5">{clip.duration}s • {clip.potentialScore}% Score</span>
                  </div>
                  <Badge variant={clip.status === 'Scheduled' ? 'success' : 'neutral'} size="sm">
                    {clip.status}
                  </Badge>
                </div>
              ))}
            </div>
          </Panel>

          <Panel title="Quick Workflows">
            <div className="space-y-1.5">
              {[
                { name: 'Upload Source Video', path: '/assets', icon: Upload },
                { name: 'Run Potential Analysis', path: '/clip-studio', icon: Sparkles },
                { name: 'Open Video Editor', path: '/video-editor', icon: Scissors },
                { name: 'Content Planner', path: '/planner', icon: Calendar },
              ].map((item, idx) => {
                const Icon = item.icon;
                return (
                  <button
                    key={idx}
                    onClick={() => navigate(item.path)}
                    className="w-full h-[32px] px-3 rounded-btn border border-border-subtle hover:border-border-strong hover:bg-surface-inset text-xs font-medium text-ink-primary flex items-center justify-between transition-colors cursor-pointer"
                  >
                    <div className="flex items-center gap-2">
                      <Icon className="w-3.5 h-3.5 text-accent stroke-[1.75]" />
                      <span>{item.name}</span>
                    </div>
                    <ArrowRight className="w-3.5 h-3.5 text-ink-muted" />
                  </button>
                );
              })}
            </div>
          </Panel>
        </div>
      </div>
    </div>
  );
};

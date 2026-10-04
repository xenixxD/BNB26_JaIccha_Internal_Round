import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useStore } from '../store/useStore';
import { Button } from '../components/ui/Button';
import { Panel } from '../components/ui/Panel';
import { ArrowRight, FolderPlus, Scissors, Upload, WandSparkles } from 'lucide-react';

export const DashboardPage = () => {
  const navigate = useNavigate();
  const { projects, clips, assets, activeProjectId, setActiveProject, setActiveClip } = useStore();
  const currentProject = projects.find((project) => project.id === activeProjectId) || projects[0];
  const projectAssets = assets.filter((asset) => (asset.projectId || asset.project_id) === currentProject?.id);
  const projectClips = clips.filter((clip) => clip.projectId === currentProject?.id);

  let nextStep = { title: 'Create a project', detail: 'Keep footage, suggestions, and drafts together.', label: 'View projects', path: '/projects', icon: FolderPlus };
  if (currentProject && projectAssets.length === 0) nextStep = { title: 'Add your footage', detail: 'Upload a video to start finding moments worth sharing.', label: 'Add footage', path: '/assets', icon: Upload };
  else if (currentProject && projectClips.length === 0) nextStep = { title: 'Find useful moments', detail: 'Analyze your footage or match it to a script in Clip Studio.', label: 'Open Clip Studio', path: '/clip-studio', icon: WandSparkles };
  else if (projectClips.length > 0) nextStep = { title: 'Keep editing your clips', detail: 'Choose a draft to adjust its framing and captions, then save or export.', label: 'Open editor', path: '/video-editor', icon: Scissors };
  const NextIcon = nextStep.icon;

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <header className="rounded-panel border border-border-subtle bg-white p-6 sm:p-8">
        <p className="text-xs font-semibold uppercase tracking-wider text-accent">Your creative workspace</p>
        <h1 className="mt-2 text-2xl font-semibold tracking-tight text-ink-primary sm:text-3xl">Turn your footage into clips</h1>
        <p className="mt-2 max-w-2xl text-sm leading-6 text-ink-muted">Add a video, tell CreatorAI what you want, choose a suggestion, then edit and export your clip.</p>
        <div className="mt-5 flex flex-col gap-2 sm:flex-row">
          <Button variant="primary" icon={NextIcon} onClick={() => navigate(nextStep.path)}>{nextStep.label}</Button>
          <Button variant="secondary" icon={FolderPlus} onClick={() => navigate('/projects')}>All projects</Button>
        </div>
      </header>

      <Panel title="Continue where you left off" subtitle={currentProject ? `Project: ${currentProject.name}` : 'Create a project to organize your work.'}>
        {currentProject ? (
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="font-semibold text-ink-primary">{nextStep.title}</h2>
              <p className="mt-1 text-sm text-ink-muted">{nextStep.detail}</p>
              <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-xs text-ink-muted">
                <span>{projectAssets.length} source {projectAssets.length === 1 ? 'video' : 'videos'}</span>
                <span>{projectClips.length} {projectClips.length === 1 ? 'draft' : 'drafts'}</span>
              </div>
            </div>
            <Button variant="secondary" icon={ArrowRight} onClick={() => navigate(nextStep.path)}>{nextStep.label}</Button>
          </div>
        ) : (
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div><h2 className="font-semibold text-ink-primary">No projects yet</h2><p className="mt-1 text-sm text-ink-muted">Start with one project, then add footage.</p></div>
            <Button variant="primary" icon={FolderPlus} onClick={() => navigate('/projects')}>Create a project</Button>
          </div>
        )}
      </Panel>

      {projectClips.length > 0 && (
        <Panel title="Recent drafts">
          <div className="divide-y divide-border-subtle">
            {projectClips.slice(0, 4).map((clip) => (
              <button key={clip.id} type="button" className="flex w-full items-center justify-between gap-3 py-3 text-left first:pt-0 last:pb-0" onClick={() => { setActiveClip(clip.id); navigate('/video-editor'); }}>
                <span className="min-w-0"><span className="block truncate text-sm font-medium text-ink-primary">{clip.title}</span><span className="mt-1 block text-xs text-ink-muted">{clip.duration}s · {clip.status || 'Draft'}</span></span>
                <ArrowRight className="h-4 w-4 shrink-0 text-ink-muted" />
              </button>
            ))}
          </div>
        </Panel>
      )}

      {projects.length > 1 && (
        <Panel title="Your projects" subtitle="Switch projects any time. Each project keeps its own footage and work." bodyClassName="flex flex-wrap gap-2">
          {projects.slice(0, 6).map((project) => (
            <button key={project.id} onClick={() => setActiveProject(project.id)} className={`rounded-btn border px-3 py-2 text-sm ${project.id === currentProject?.id ? 'border-accent bg-accent-soft text-accent-text' : 'border-border-subtle bg-white text-ink-secondary hover:border-border-strong'}`}>
              {project.name}
            </button>
          ))}
        </Panel>
      )}
    </div>
  );
};

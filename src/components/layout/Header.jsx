import React from 'react';
import { useStore } from '../../store/useStore';
import { Upload } from 'lucide-react';

export const Header = ({ onOpenUploadModal }) => {
  const { projects, activeProjectId, systemHealth, aiProvider, setAiProvider } = useStore();
  const activeProject = projects.find((project) => project.id === activeProjectId);

  return (
    <header className="min-h-14 bg-white border-b border-border-subtle px-4 sm:px-6 flex items-center justify-between gap-3 sticky top-0 z-10">
      <div className="min-w-0 text-sm">
        <span className="text-ink-muted">CreatorAI</span>
        <span className="mx-2 text-border-strong">/</span>
        <span className="font-semibold text-ink-primary truncate">{activeProject?.name || 'Choose a project'}</span>
      </div>
      <div className="flex items-center gap-3 shrink-0">
        <label className="hidden sm:flex items-center gap-2 text-xs text-ink-muted">
          AI provider
          <select aria-label="AI provider" value={aiProvider} onChange={(event) => setAiProvider(event.target.value)} className="min-h-9 rounded-btn border border-border-subtle bg-white px-2 text-xs text-ink-primary">
            <option value="auto">Automatic</option>
            <option value="gemini">Gemini</option>
            <option value="groq">Groq</option>
          </select>
        </label>
        <span className="hidden sm:inline-flex items-center gap-2 text-xs text-ink-muted" role="status">
          <span className={`h-2 w-2 rounded-full ${systemHealth.ffmpeg_available ? 'bg-emerald-500' : 'bg-amber-500'}`} />
          {systemHealth.status === 'unavailable' ? 'Server unavailable' : systemHealth.ffmpeg_available ? 'Video export ready' : 'Video export unavailable'}
        </span>
        <button
          type="button"
          onClick={onOpenUploadModal}
          className="inline-flex min-h-10 items-center gap-2 rounded-btn bg-accent px-3 text-sm font-semibold text-white hover:bg-accent-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
        >
          <Upload className="h-4 w-4" />
          <span className="hidden sm:inline">Add footage</span>
        </button>
      </div>
    </header>
  );
};

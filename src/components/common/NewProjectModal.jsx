import React, { useState } from 'react';
import { useStore } from '../../store/useStore';
import { X, FolderPlus } from 'lucide-react';
import { Button } from '../ui/Button';

export const NewProjectModal = ({ isOpen, onClose }) => {
  const { createProject } = useStore();
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('Technology & AI');
  const [platforms, setPlatforms] = useState(['Instagram Reels', 'YouTube Shorts']);

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!name.trim() || saving) return;
    setSaving(true);
    setError('');
    try {
      await createProject({
        name: name.trim(),
        description,
        category,
        targetPlatforms: platforms
      });
      setName('');
      setDescription('');
      onClose();
    } catch (err) {
      setError(readableProjectError(err));
    } finally {
      setSaving(false);
    }
  };

  const togglePlatform = (p) => {
    if (platforms.includes(p)) {
      setPlatforms(platforms.filter((item) => item !== p));
    } else {
      setPlatforms([...platforms, p]);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs">
      <div role="dialog" aria-modal="true" aria-labelledby="new-project-title" className="w-full max-w-lg overflow-hidden rounded-panel border border-border-subtle bg-white shadow-2xl animate-in fade-in zoom-in-95 duration-150">
        <div className="flex items-center justify-between border-b border-border-subtle bg-surface-inset px-5 py-3.5">
          <div className="flex items-center gap-2">
            <FolderPlus className="h-5 w-5 text-accent" />
            <h3 id="new-project-title" className="font-bold text-title-panel text-ink-primary">Create a project</h3>
          </div>
          <Button type="button" variant="ghost" size="sm" onClick={onClose} disabled={saving} icon={X} aria-label="Close create project dialog" />
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          {error && <p role="alert" className="text-sm text-rose-700">{error}</p>}
          <div>
            <label htmlFor="project-name" className="mb-1 block text-xs font-semibold text-ink-secondary">Project name *</label>
            <input
              id="project-name"
              type="text"
              required
              placeholder="e.g. Weekly Product Update"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="min-h-10 w-full rounded-btn border border-border-subtle bg-white px-3 py-2 text-sm text-ink-primary focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20"
            />
          </div>

          <div>
            <label htmlFor="project-description" className="mb-1 block text-xs font-semibold text-ink-secondary">Description</label>
            <textarea
              id="project-description"
              rows={2}
              placeholder="Brief description of the long-form content or event..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full rounded-btn border border-border-subtle bg-white px-3 py-2 text-sm text-ink-primary focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20"
            />
          </div>

          <div>
            <label htmlFor="project-category" className="mb-1 block text-xs font-semibold text-ink-secondary">Category</label>
            <select
              id="project-category"
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="min-h-10 w-full rounded-btn border border-border-subtle bg-white px-3 py-2 text-sm text-ink-primary focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20"
            >
              <option value="Technology & AI">Technology & AI</option>
              <option value="Product & Startup">Product & Startup</option>
              <option value="Podcast & Talk">Podcast & Talk</option>
              <option value="Educational & Tutorial">Educational & Tutorial</option>
              <option value="Entertainment & Vlogs">Entertainment & Vlogs</option>
            </select>
          </div>

          <div>
            <p className="mb-1.5 block text-xs font-semibold text-ink-secondary">Target platforms</p>
            <div className="flex flex-wrap gap-2">
              {['Instagram Reels', 'YouTube Shorts', 'TikTok', 'LinkedIn'].map((p) => (
                <button
                  type="button"
                  key={p}
                  aria-pressed={platforms.includes(p)}
                  onClick={() => togglePlatform(p)}
                  className={`min-h-9 rounded-btn border px-2.5 py-1 text-xs transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-accent ${
                    platforms.includes(p)
                      ? 'border-accent bg-accent-soft text-accent-text font-semibold'
                      : 'border-border-subtle bg-white text-ink-secondary hover:border-border-strong'
                  }`}
                >
                  {p}
                </button>
              ))}
            </div>
          </div>

          <div className="flex justify-end gap-2 border-t border-border-subtle pt-3">
            <Button type="button" variant="secondary" onClick={onClose} disabled={saving}>Cancel</Button>
            <Button type="submit" variant="primary" isLoading={saving}>Create project</Button>
          </div>
        </form>
      </div>
    </div>
  );
};

function readableProjectError(error) {
  const status = error.response?.status;
  const detail = error.response?.data?.detail;
  const message = typeof detail === 'string' ? detail : detail?.message;
  if (!error.response) return 'CreatorAI could not reach the server. Check your connection and try again.';
  if (status === 400 || status === 422) return message || 'Check the project details and try again.';
  if (status >= 500) return 'CreatorAI could not create the project. Try again.';
  return message || 'Could not create this project. Try again.';
}

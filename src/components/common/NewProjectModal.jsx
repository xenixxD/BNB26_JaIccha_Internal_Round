import React, { useState } from 'react';
import { useStore } from '../../store/useStore';
import { X, FolderPlus, Layers, Target } from 'lucide-react';

export const NewProjectModal = ({ isOpen, onClose }) => {
  const { createProject } = useStore();
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('Technology & AI');
  const [platforms, setPlatforms] = useState(['Instagram Reels', 'YouTube Shorts']);

  if (!isOpen) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!name.strip ? !name.trim() : !name) return;

    createProject({
      name,
      description,
      category,
      targetPlatforms: platforms
    });

    setName('');
    setDescription('');
    onClose();
  };

  const togglePlatform = (p) => {
    if (platforms.includes(p)) {
      setPlatforms(platforms.filter((item) => item !== p));
    } else {
      setPlatforms([...platforms, p]);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-slate-800 rounded-xl w-full max-w-md overflow-hidden shadow-2xl animate-in fade-in zoom-in-95 duration-150">
        <div className="px-5 py-4 border-b border-slate-800 flex items-center justify-between bg-slate-950/50">
          <div className="flex items-center gap-2">
            <FolderPlus className="w-5 h-5 text-indigo-400" />
            <h3 className="font-bold text-slate-100 text-sm">Create New Project</h3>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-200">
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">Project Name *</label>
            <input
              type="text"
              required
              placeholder="e.g. Kolkata Tech Talk"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-xs text-slate-100 focus:outline-none focus:border-indigo-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">Description</label>
            <textarea
              rows={2}
              placeholder="Brief description of the long-form content or event..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-xs text-slate-100 focus:outline-none focus:border-indigo-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">Category</label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-xs text-slate-100 focus:outline-none focus:border-indigo-500"
            >
              <option value="Technology & AI">Technology & AI</option>
              <option value="Product & Startup">Product & Startup</option>
              <option value="Podcast & Talk">Podcast & Talk</option>
              <option value="Educational & Tutorial">Educational & Tutorial</option>
              <option value="Entertainment & Vlogs">Entertainment & Vlogs</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">Target Platforms</label>
            <div className="flex flex-wrap gap-2">
              {['Instagram Reels', 'YouTube Shorts', 'TikTok', 'LinkedIn'].map((p) => (
                <button
                  type="button"
                  key={p}
                  onClick={() => togglePlatform(p)}
                  className={`text-xs px-2.5 py-1 rounded-md border transition-all ${
                    platforms.includes(p)
                      ? 'bg-indigo-600/20 border-indigo-500 text-indigo-300 font-semibold'
                      : 'bg-slate-800 border-slate-700 text-slate-400 hover:text-slate-200'
                  }`}
                >
                  {p}
                </button>
              ))}
            </div>
          </div>

          <div className="pt-3 border-t border-slate-800 flex justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium rounded-lg"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-medium rounded-lg shadow-md shadow-indigo-600/20"
            >
              Create Project
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

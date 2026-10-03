import React, { useState } from 'react';
import { useStore } from '../store/useStore';
import { Settings, Key, User, Bell, Sliders, CheckCircle2, RefreshCw } from 'lucide-react';

export const SettingsPage = () => {
  const { user, systemHealth } = useStore();
  const [apiKey, setApiKey] = useState('');
  const [saved, setSaved] = useState(false);
  const [defaultAspect, setDefaultAspect] = useState('9:16');
  const [defaultPlatform, setDefaultPlatform] = useState('Instagram Reels');

  const handleSave = (e) => {
    e.preventDefault();
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl flex items-center justify-between">
        <div>
          <h1 className="text-lg font-bold text-slate-100 flex items-center gap-2">
            <Settings className="w-5 h-5 text-indigo-400" />
            Platform Settings & API Keys
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Configure profile, default aspect ratios, and Google Gemini API integration.
          </p>
        </div>
      </div>

      <form onSubmit={handleSave} className="space-y-6">
        {/* User Profile Settings */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-4">
          <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-2">
            <User className="w-4 h-4 text-indigo-400" /> User Profile
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            <div>
              <label className="block text-slate-400 mb-1 font-semibold">Full Name</label>
              <input
                type="text"
                defaultValue={user.name}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-slate-200 focus:outline-none focus:border-indigo-500"
              />
            </div>
            <div>
              <label className="block text-slate-400 mb-1 font-semibold">Email Address</label>
              <input
                type="email"
                defaultValue={user.email}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-slate-200 focus:outline-none focus:border-indigo-500"
              />
            </div>
          </div>
        </div>

        {/* AI Integration & API Keys */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-4">
          <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-2">
            <Key className="w-4 h-4 text-indigo-400" /> AI API Configuration
          </h3>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">
              Google Gemini API Key (Optional)
            </label>
            <input
              type="password"
              placeholder="AIzaSy..."
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-indigo-500 font-mono"
            />
            <p className="text-[11px] text-slate-500 mt-1">
              If omitted, CreatorAI will automatically run using built-in NLP heuristics for immediate offline operation.
            </p>
          </div>
        </div>

        {/* Default Editing Preferences */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-4">
          <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-2">
            <Sliders className="w-4 h-4 text-indigo-400" /> Default Editor Preferences
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            <div>
              <label className="block text-slate-400 mb-1 font-semibold">Default Aspect Ratio</label>
              <select
                value={defaultAspect}
                onChange={(e) => setDefaultAspect(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-slate-200 focus:outline-none"
              >
                <option value="9:16">9:16 Vertical (Reels / Shorts / TikTok)</option>
                <option value="16:9">16:9 Landscape</option>
                <option value="1:1">1:1 Square</option>
              </select>
            </div>

            <div>
              <label className="block text-slate-400 mb-1 font-semibold">Default Target Platform</label>
              <select
                value={defaultPlatform}
                onChange={(e) => setDefaultPlatform(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-slate-200 focus:outline-none"
              >
                <option value="Instagram Reels">Instagram Reels</option>
                <option value="YouTube Shorts">YouTube Shorts</option>
                <option value="TikTok">TikTok</option>
                <option value="LinkedIn">LinkedIn</option>
              </select>
            </div>
          </div>
        </div>

        <div className="flex items-center justify-between pt-2">
          {saved && (
            <span className="text-xs text-emerald-400 font-semibold flex items-center gap-1">
              <CheckCircle2 className="w-4 h-4" /> Preferences saved!
            </span>
          )}
          <button
            type="submit"
            className="ml-auto bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold py-2.5 px-5 rounded-xl shadow-md transition-all"
          >
            Save Preferences
          </button>
        </div>
      </form>
    </div>
  );
};

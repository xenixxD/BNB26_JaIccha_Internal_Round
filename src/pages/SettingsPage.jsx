import React, { useState } from 'react';
import { useStore } from '../store/useStore';
import { PageHeader } from '../components/ui/PageHeader';
import { Panel } from '../components/ui/Panel';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Select } from '../components/ui/Select';
import { Badge } from '../components/ui/Badge';
import { Settings, Key, User, Sliders, CheckCircle2 } from 'lucide-react';

export const SettingsPage = () => {
  const { user, systemHealth } = useStore();
  const [activeSection, setActiveSection] = useState('profile');
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
    <div className="space-y-5 max-w-[1200px] mx-auto">
      <PageHeader
        title="Settings & Workspace Preferences"
        breadcrumbs={[
          { label: 'CreatorAI', path: '/' },
          { label: 'Settings' }
        ]}
      />

      <div className="grid grid-cols-1 md:grid-cols-12 gap-5">
        {/* Left Vertical Nav (3 Cols) */}
        <div className="md:col-span-3 space-y-1">
          {[
            { id: 'profile', label: 'User Profile', icon: User },
            { id: 'api', label: 'AI & API Keys', icon: Key },
            { id: 'preferences', label: 'Default Preferences', icon: Sliders },
          ].map((item) => {
            const Icon = item.icon;
            const isActive = activeSection === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setActiveSection(item.id)}
                className={`w-full h-[32px] px-3 rounded-btn text-xs font-semibold flex items-center gap-2 transition-colors cursor-pointer ${
                  isActive
                    ? 'bg-accent text-white shadow-sm'
                    : 'bg-white text-ink-secondary hover:bg-surface-inset border border-border-subtle'
                }`}
              >
                <Icon className="w-3.5 h-3.5 stroke-[1.75]" />
                <span>{item.label}</span>
              </button>
            );
          })}
        </div>

        {/* Right Content Area (9 Cols) */}
        <div className="md:col-span-9">
          <form onSubmit={handleSave} className="space-y-4">
            {activeSection === 'profile' && (
              <Panel title="User Profile Settings">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <Input label="FULL NAME" defaultValue={user.name} />
                  <Input label="EMAIL ADDRESS" defaultValue={user.email} />
                </div>
              </Panel>
            )}

            {activeSection === 'api' && (
              <Panel title="AI API Configuration" subtitle="Optional API key for Gemini 1.5 Pro">
                <div className="space-y-3">
                  <Input
                    label="GOOGLE GEMINI API KEY"
                    type="password"
                    placeholder="AIzaSy..."
                    value={apiKey}
                    onChange={(e) => setApiKey(e.target.value)}
                  />
                  <p className="text-body-sm text-ink-muted">
                    If omitted, CreatorAI will run using built-in NLP heuristics for immediate offline operation.
                  </p>
                </div>
              </Panel>
            )}

            {activeSection === 'preferences' && (
              <Panel title="Default Editing Preferences">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <Select
                    label="DEFAULT ASPECT RATIO"
                    value={defaultAspect}
                    onChange={(e) => setDefaultAspect(e.target.value)}
                    options={[
                      { value: '9:16', label: '9:16 Vertical (Reels / Shorts / TikTok)' },
                      { value: '16:9', label: '16:9 Landscape' },
                      { value: '1:1', label: '1:1 Square' }
                    ]}
                  />
                  <Select
                    label="DEFAULT TARGET PLATFORM"
                    value={defaultPlatform}
                    onChange={(e) => setDefaultPlatform(e.target.value)}
                    options={[
                      { value: 'Instagram Reels', label: 'Instagram Reels' },
                      { value: 'YouTube Shorts', label: 'YouTube Shorts' },
                      { value: 'TikTok', label: 'TikTok' },
                      { value: 'LinkedIn', label: 'LinkedIn' }
                    ]}
                  />
                </div>
              </Panel>
            )}

            <div className="flex items-center justify-between pt-2">
              {saved && (
                <span className="text-xs text-status-success font-semibold flex items-center gap-1">
                  <CheckCircle2 className="w-4 h-4 text-status-success" /> Preferences saved!
                </span>
              )}
              <Button type="submit" variant="primary" className="ml-auto">
                Save Settings
              </Button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

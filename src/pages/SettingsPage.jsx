import React, { useState } from 'react';
import { PageHeader } from '../components/ui/PageHeader';
import { Panel } from '../components/ui/Panel';
import { Button } from '../components/ui/Button';
import { Select } from '../components/ui/Select';

const STORAGE_KEY = 'creatorai.preferences.v1';

function readPreferences() {
  try {
    return JSON.parse(window.localStorage.getItem(STORAGE_KEY) || '{}');
  } catch {
    return {};
  }
}

export const SettingsPage = () => {
  const [preferences, setPreferences] = useState(readPreferences);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const savePreferences = (event) => {
    event.preventDefault();
    setMessage('');
    setError('');
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(preferences));
      setMessage('Preferences saved on this device.');
    } catch {
      setError('Could not save preferences in this browser. Check that local storage is available.');
    }
  };

  return (
    <div className="space-y-6 max-w-3xl mx-auto">
      <PageHeader title="Settings" breadcrumbs={[{ label: 'CreatorAI', path: '/' }, { label: 'Settings' }]} />
      <form onSubmit={savePreferences} className="space-y-4">
        <Panel title="Editing defaults" subtitle="These preferences are stored in this browser on this device. They do not change existing clips.">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Select
              label="DEFAULT VIDEO SHAPE"
              value={preferences.aspectRatio || '9:16'}
              onChange={(event) => setPreferences({ ...preferences, aspectRatio: event.target.value })}
              options={[
                { value: '9:16', label: 'Vertical (Reels / Shorts)' },
                { value: '16:9', label: 'Landscape' },
                { value: '1:1', label: 'Square' }
              ]}
            />
            <Select
              label="DEFAULT PLATFORM"
              value={preferences.platform || 'Instagram Reels'}
              onChange={(event) => setPreferences({ ...preferences, platform: event.target.value })}
              options={[
                { value: 'Instagram Reels', label: 'Instagram Reels' },
                { value: 'YouTube Shorts', label: 'YouTube Shorts' },
                { value: 'TikTok', label: 'TikTok' },
                { value: 'LinkedIn', label: 'LinkedIn' }
              ]}
            />
          </div>
        </Panel>

        <Panel title="Connections">
          <p className="text-sm leading-6 text-ink-muted">
            Choose Automatic, Gemini, or Groq from the top bar when an AI task is available. Provider keys and video rendering are configured on the CreatorAI server. This app does not securely store API keys or connect social accounts.
          </p>
        </Panel>

        {message && <p role="status" className="text-sm text-emerald-700">{message}</p>}
        {error && <p role="alert" className="text-sm text-rose-700">{error}</p>}
        <div className="flex justify-end"><Button type="submit" variant="primary">Save preferences</Button></div>
      </form>
    </div>
  );
};

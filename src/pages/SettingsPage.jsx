import React from 'react';
import { PageHeader } from '../components/ui/PageHeader';
import { Panel } from '../components/ui/Panel';

export const SettingsPage = () => (
  <div className="mx-auto max-w-3xl space-y-6">
    <PageHeader title="Settings" breadcrumbs={[{ label: 'CreatorAI', path: '/' }, { label: 'Settings' }]} />

    <Panel title="AI provider" subtitle="Choose a provider from the top bar when you run an AI task.">
      <p className="text-sm leading-6 text-ink-muted">
        Automatic, Gemini, and Groq are available when configured by the CreatorAI server. Provider credentials are managed on the server; this workspace does not store API keys.
      </p>
    </Panel>

    <Panel title="Video export">
      <p className="text-sm leading-6 text-ink-muted">
        Export availability depends on the server's video processing setup. Video shape is selected on each clip in the editor, and export settings are applied when you export.
      </p>
    </Panel>

    <Panel title="Connections">
      <p className="text-sm leading-6 text-ink-muted">
        Social account connections and direct publishing are not available in this workspace.
      </p>
    </Panel>
  </div>
);

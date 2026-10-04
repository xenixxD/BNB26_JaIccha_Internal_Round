import React from 'react';
import { useNavigate } from 'react-router-dom';
import { PageHeader } from '../components/ui/PageHeader';
import { Button } from '../components/ui/Button';
import { BarChart3, ExternalLink, Upload } from 'lucide-react';

export const AnalyticsPage = () => {
  const navigate = useNavigate();

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <PageHeader
        title="Analytics"
        breadcrumbs={[{ label: 'CreatorAI', path: '/' }, { label: 'Analytics' }]}
      />
      <section className="rounded-panel border border-border-subtle bg-white p-6 sm:p-10 text-center">
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-surface-inset text-accent">
          <BarChart3 className="h-6 w-6" />
        </div>
        <h2 className="mt-4 text-lg font-semibold text-ink-primary">Analytics will appear after you publish content</h2>
        <p className="mx-auto mt-2 max-w-xl text-sm leading-6 text-ink-muted">
          CreatorAI does not connect to social platform analytics yet, so there are no view or engagement numbers to show. Once platform connections are available, this page can summarize real results from your published clips.
        </p>
        <div className="mx-auto mt-6 grid max-w-xl grid-cols-1 gap-3 text-left sm:grid-cols-2">
          <div className="rounded-btn border border-border-subtle p-3">
            <p className="text-sm font-semibold text-ink-primary">1. Make and export a clip</p>
            <p className="mt-1 text-xs text-ink-muted">Use footage in a project to create an edited video.</p>
          </div>
          <div className="rounded-btn border border-border-subtle p-3">
            <p className="text-sm font-semibold text-ink-primary">2. Publish it on your platform</p>
            <p className="mt-1 text-xs text-ink-muted">Publishing currently happens outside CreatorAI.</p>
          </div>
        </div>
        <div className="mt-6 flex flex-col justify-center gap-2 sm:flex-row">
          <Button variant="primary" icon={Upload} onClick={() => navigate('/assets')}>Add footage</Button>
          <Button variant="secondary" icon={ExternalLink} onClick={() => navigate('/projects')}>View projects</Button>
        </div>
      </section>
    </div>
  );
};

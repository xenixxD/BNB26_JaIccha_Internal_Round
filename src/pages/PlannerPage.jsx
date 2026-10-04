import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useStore } from '../store/useStore';
import { PageHeader } from '../components/ui/PageHeader';
import { Panel } from '../components/ui/Panel';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import { CalendarDays, Scissors, Sparkles, Lightbulb } from 'lucide-react';

export const PlannerPage = () => {
  const navigate = useNavigate();
  const { clips, moveClipStatus, setActiveClip, generatePlannerCards } = useStore();
  const [topic, setTopic] = useState('');
  const [ideas, setIdeas] = useState([]);
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState('');

  const drafts = clips.filter((clip) => ['Draft', 'Ready for Review'].includes(clip.status));

  const generateIdeas = async (event) => {
    event.preventDefault();
    if (!topic.trim()) return;
    setGenerating(true);
    setError('');
    setIdeas([]);
    try {
      const results = await generatePlannerCards(topic.trim());
      setIdeas(results);
    } catch (requestError) {
      setError(readableError(requestError, 'Ideas could not be generated. Try again.'));
    } finally {
      setGenerating(false);
    }
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      <PageHeader
        title="Plan your next clips"
        breadcrumbs={[{ label: 'CreatorAI', path: '/' }, { label: 'Planner' }]}
      />

      <Panel title="Clip ideas" subtitle="AI suggestions to help plan what to record or look for in your footage.">
        <form onSubmit={generateIdeas} className="flex flex-col sm:flex-row gap-3">
          <label className="sr-only" htmlFor="planner-topic">What do you want to make a video about?</label>
          <input
            id="planner-topic"
            value={topic}
            onChange={(event) => setTopic(event.target.value)}
            placeholder="For example: tips for first-time home cooks"
            className="min-h-11 flex-1 rounded-btn border border-border-subtle px-3 text-sm focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20"
          />
          <Button type="submit" variant="primary" icon={Sparkles} isLoading={generating} disabled={!topic.trim()}>
            Generate ideas
          </Button>
        </form>
        {error && <p role="alert" className="mt-3 text-sm text-rose-700">{error}</p>}
        {ideas.length > 0 && (
          <p className="mt-3 text-xs text-ink-muted">These are planning suggestions. They are not saved clips or scheduled posts.</p>
        )}
        {ideas.length > 0 && (
          <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-3">
            {ideas.map((idea, index) => (
              <article key={idea.id || `${idea.title}-${index}`} className="rounded-panel border border-border-subtle bg-surface-inset p-4 space-y-2">
                <div className="flex items-center gap-2 text-accent"><Lightbulb className="w-4 h-4" /><span className="text-xs font-semibold">Idea {index + 1}</span></div>
                <h3 className="font-semibold text-ink-primary">{idea.title}</h3>
                {idea.description && <p className="text-sm text-ink-secondary">{idea.description}</p>}
                <p className="text-xs text-ink-muted">{[idea.format, idea.platform].filter(Boolean).join(' · ')}</p>
              </article>
            ))}
          </div>
        )}
        {!ideas.length && !generating && !error && (
          <p className="mt-4 text-sm text-ink-muted">Enter a topic to get ideas. To make a clip from your footage, upload it and open Clip Studio.</p>
        )}
      </Panel>

      <Panel title="Your clips" subtitle="Drafts made from your source footage. Publishing and scheduling are not connected yet.">
        {drafts.length === 0 ? (
          <div className="py-8 text-center">
            <CalendarDays className="mx-auto h-8 w-8 text-ink-muted" />
            <h3 className="mt-3 font-semibold text-ink-primary">No clips to plan yet</h3>
            <p className="mt-1 text-sm text-ink-muted">Upload footage, review suggestions, and create a draft to see it here.</p>
            <Button className="mt-4" variant="secondary" onClick={() => navigate('/assets')}>Go to footage</Button>
          </div>
        ) : (
          <div className="divide-y divide-border-subtle">
            {drafts.map((clip) => (
              <div key={clip.id} className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 py-3 first:pt-0 last:pb-0">
                <div className="min-w-0">
                  <h3 className="font-semibold text-sm text-ink-primary truncate">{clip.title}</h3>
                  <p className="mt-1 text-xs text-ink-muted">{clip.duration}s · {clip.platform || 'No platform selected'}</p>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <Badge variant="neutral">{clip.status}</Badge>
                  <select
                    aria-label={`Status for ${clip.title}`}
                    value={clip.status}
                    onChange={(event) => moveClipStatus(clip.id, event.target.value)}
                    className="min-h-9 rounded-btn border border-border-subtle bg-white px-2 text-xs"
                  >
                    <option value="Draft">Draft</option>
                    <option value="Ready for Review">Ready for review</option>
                  </select>
                  <Button variant="secondary" size="sm" icon={Scissors} onClick={() => { setActiveClip(clip.id); navigate('/video-editor'); }}>Edit</Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </Panel>
    </div>
  );
};

function readableError(error, fallback) {
  const detail = error.response?.data?.detail;
  if (typeof detail === 'string') return detail;
  if (detail?.message) return detail.message;
  return error.message || fallback;
}

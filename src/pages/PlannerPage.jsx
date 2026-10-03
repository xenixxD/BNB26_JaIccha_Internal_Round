import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useStore } from '../store/useStore';
import { PageHeader } from '../components/ui/PageHeader';
import { Panel } from '../components/ui/Panel';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import {
  CalendarDays,
  Kanban,
  List as ListIcon,
  Scissors,
  Calendar,
  Sparkles
} from 'lucide-react';

export const PlannerPage = () => {
  const navigate = useNavigate();
  const { clips, moveClipStatus, setActiveClip, generatePlannerCards, aiProvider } = useStore();
  const [viewMode, setViewMode] = useState('kanban'); // 'kanban' | 'calendar' | 'list'
  const [filterPlatform, setFilterPlatform] = useState('All');
  
  // AI Generator state
  const [isAiPanelOpen, setIsAiPanelOpen] = useState(false);
  const [topicInput, setTopicInput] = useState('AI Creator Tools & Automation Hacks');
  const [nicheSelect, setNicheSelect] = useState('Tech & AI');
  const [daysSelect, setDaysSelect] = useState(7);
  const [generating, setGenerating] = useState(false);
  const [genSuccessMsg, setGenSuccessMsg] = useState(null);

  const columns = [
    { title: 'Draft', status: 'Draft', badge: 'neutral' },
    { title: 'Ready for Review', status: 'Ready for Review', badge: 'warning' },
    { title: 'Scheduled', status: 'Scheduled', badge: 'accent' },
    { title: 'Published', status: 'Published', badge: 'success' },
  ];

  const filteredClips = clips.filter((c) => filterPlatform === 'All' || c.platform === filterPlatform);

  const handleGenerateAiIdeas = async () => {
    setGenerating(true);
    setGenSuccessMsg(null);
    try {
      const newClips = await generatePlannerCards(topicInput, nicheSelect, Number(daysSelect));
      setGenSuccessMsg(`Generated ${newClips.length} AI content ideas for your calendar!`);
      setTimeout(() => setGenSuccessMsg(null), 4000);
    } catch (err) {
      console.error("AI Generation error:", err);
    } finally {
      setGenerating(false);
    }
  };

  return (
    <div className="space-y-5 max-w-[1600px] mx-auto">
      {/* Page Header */}
      <PageHeader
        title="Content Planner & Publisher"
        breadcrumbs={[
          { label: 'CreatorAI', path: '/' },
          { label: 'Content Planner' }
        ]}
        actions={
          <div className="flex items-center gap-2">
            <Button
              variant="primary"
              size="sm"
              icon={Sparkles}
              onClick={() => setIsAiPanelOpen(!isAiPanelOpen)}
            >
              {isAiPanelOpen ? 'Hide AI Generator' : 'AI Idea Generator'}
            </Button>

            <div className="flex bg-surface-inset p-0.5 rounded-chip border border-border-subtle">
              <button
                onClick={() => setViewMode('kanban')}
                className={`h-[28px] px-3 rounded-chip text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer ${
                  viewMode === 'kanban' ? 'bg-accent text-white shadow-sm' : 'text-ink-muted hover:text-ink-primary'
                }`}
              >
                <Kanban className="w-3.5 h-3.5" />
                <span>Kanban</span>
              </button>
              <button
                onClick={() => setViewMode('calendar')}
                className={`h-[28px] px-3 rounded-chip text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer ${
                  viewMode === 'calendar' ? 'bg-accent text-white shadow-sm' : 'text-ink-muted hover:text-ink-primary'
                }`}
              >
                <Calendar className="w-3.5 h-3.5" />
                <span>Calendar</span>
              </button>
            </div>
          </div>
        }
      />

      {/* AI IDEA GENERATOR PANEL */}
      {isAiPanelOpen && (
        <Panel title="AI Content Calendar Generator" action={<Badge variant="accent">{aiProvider.toUpperCase()} ACTIVE</Badge>}>
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <div>
                <label className="text-micro font-bold text-ink-muted uppercase tracking-wider block mb-1">Topic / Core Theme</label>
                <input
                  type="text"
                  value={topicInput}
                  onChange={(e) => setTopicInput(e.target.value)}
                  className="w-full bg-surface-inset border border-border-subtle rounded-btn px-3 py-1.5 text-xs text-ink-primary font-semibold focus:border-accent"
                />
              </div>

              <div>
                <label className="text-micro font-bold text-ink-muted uppercase tracking-wider block mb-1">Niche Category</label>
                <select
                  value={nicheSelect}
                  onChange={(e) => setNicheSelect(e.target.value)}
                  className="w-full bg-surface-inset border border-border-subtle rounded-btn px-3 py-1.5 text-xs text-ink-primary font-semibold focus:border-accent cursor-pointer"
                >
                  <option value="Tech & AI">Tech & AI</option>
                  <option value="Productivity & Work">Productivity & Work</option>
                  <option value="Creator Economy">Creator Economy</option>
                  <option value="Educational & How-To">Educational & How-To</option>
                </select>
              </div>

              <div>
                <label className="text-micro font-bold text-ink-muted uppercase tracking-wider block mb-1">Planning Horizon</label>
                <select
                  value={daysSelect}
                  onChange={(e) => setDaysSelect(e.target.value)}
                  className="w-full bg-surface-inset border border-border-subtle rounded-btn px-3 py-1.5 text-xs text-ink-primary font-semibold focus:border-accent cursor-pointer"
                >
                  <option value={3}>3 Days (3 Ideas)</option>
                  <option value={7}>7 Days (7 Ideas)</option>
                  <option value={14}>14 Days (14 Ideas)</option>
                </select>
              </div>
            </div>

            <div className="flex items-center justify-between pt-2 border-t border-border-subtle">
              <span className="text-body-sm text-ink-muted">
                Engine: <strong className="text-accent">{aiProvider === 'auto' ? 'Auto-Fallback (Gemini + Groq)' : aiProvider}</strong>
              </span>

              <Button
                variant="primary"
                size="sm"
                icon={Sparkles}
                isLoading={generating}
                onClick={handleGenerateAiIdeas}
              >
                Generate Calendar Cards
              </Button>
            </div>

            {genSuccessMsg && (
              <div className="p-2.5 bg-status-success-soft text-status-success rounded-panel text-xs font-semibold border border-emerald-200">
                {genSuccessMsg}
              </div>
            )}
          </div>
        </Panel>
      )}

      {/* Platform Filter */}
      <div className="flex items-center gap-2 overflow-x-auto">
        {['All', 'Instagram Reels', 'YouTube Shorts', 'TikTok', 'LinkedIn'].map((p) => (
          <button
            key={p}
            onClick={() => setFilterPlatform(p)}
            className={`h-[26px] px-3 rounded-chip text-[11px] font-semibold transition-colors cursor-pointer ${
              filterPlatform === p
                ? 'bg-accent text-white shadow-sm'
                : 'bg-white text-ink-secondary border border-border-subtle hover:border-border-strong'
            }`}
          >
            {p}
          </button>
        ))}
      </div>

      {/* KANBAN BOARD */}
      {viewMode === 'kanban' && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {columns.map((col) => {
            const colClips = filteredClips.filter((c) => c.status === col.status);
            return (
              <Panel
                key={col.status}
                title={col.title}
                action={<Badge variant={col.badge}>{colClips.length}</Badge>}
                bodyClassName="p-3 space-y-3 min-h-[500px] bg-surface-inset"
              >
                {colClips.map((clip) => (
                  <div
                    key={clip.id}
                    className="p-3 rounded-panel border border-border-subtle bg-white space-y-2.5 shadow-none hover:border-border-strong transition-all"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <h4 className="font-bold text-xs text-ink-primary leading-snug">{clip.title}</h4>
                      <Badge variant="score" size="sm">{clip.potentialScore}%</Badge>
                    </div>

                    <p className="text-body-sm text-ink-muted line-clamp-2 italic">
                      "{clip.suggestedHook || clip.caption}"
                    </p>

                    <div className="pt-2 border-t border-border-subtle flex items-center justify-between text-mono-val font-mono">
                      <span className="text-accent font-semibold">{clip.platform}</span>
                      <span className="text-ink-muted">{clip.duration}s</span>
                    </div>

                    <div className="flex items-center justify-between gap-1 pt-1">
                      <Button variant="secondary" size="sm" onClick={() => {
                        setActiveClip(clip.id);
                        navigate('/video-editor');
                      }} icon={Scissors}>
                        Edit
                      </Button>

                      <select
                        value={clip.status}
                        onChange={(e) => moveClipStatus(clip.id, e.target.value)}
                        className="h-[26px] bg-white border border-border-subtle text-[10px] font-semibold text-ink-primary rounded-btn px-1.5 cursor-pointer"
                      >
                        <option value="Draft">Draft</option>
                        <option value="Ready for Review">Ready</option>
                        <option value="Scheduled">Scheduled</option>
                        <option value="Published">Published</option>
                      </select>
                    </div>
                  </div>
                ))}
              </Panel>
            );
          })}
        </div>
      )}

      {/* CALENDAR VIEW */}
      {viewMode === 'calendar' && (
        <Panel title="Scheduled Content Calendar (October 2026)">
          <div className="grid grid-cols-7 gap-2 text-center text-micro text-ink-muted uppercase tracking-widest font-semibold border-b border-border-subtle pb-2 mb-2">
            <div>Mon</div><div>Tue</div><div>Wed</div><div>Thu</div><div>Fri</div><div>Sat</div><div>Sun</div>
          </div>
          <div className="grid grid-cols-7 gap-2 min-h-[360px]">
            {Array.from({ length: 28 }).map((_, idx) => (
              <div key={idx} className="p-2 rounded-panel border border-border-subtle bg-surface-inset min-h-[80px]">
                <span className="font-mono text-mono-val text-ink-muted font-bold">{idx + 1}</span>
                {(idx === 4 || idx === 12) && (
                  <div className="mt-1 p-1 bg-accent-soft text-accent-text border border-indigo-200 rounded-chip text-[10px] font-semibold truncate cursor-pointer" onClick={() => navigate('/video-editor')}>
                    The #1 AI Creator Mistake
                  </div>
                )}
              </div>
            ))}
          </div>
        </Panel>
      )}
    </div>
  );
};
